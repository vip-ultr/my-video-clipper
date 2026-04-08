import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
import fs from 'fs';
import { logger } from '../utils/logger.js';

// Set FFmpeg path - use ffmpeg-static if available, otherwise rely on system PATH
if (ffmpegStatic) {
  try {
    ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
    logger.info('Using ffmpeg-static binary');
  } catch (e) {
    logger.warn('Failed to set ffmpeg-static path, falling back to system FFmpeg');
    // Continue without setting path - will use system FFmpeg from PATH
  }
} else {
  logger.info('ffmpeg-static not available, using system FFmpeg');
}

export function extractClip(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const duration = endTime - startTime;
      logger.info(`Extracting clip: ${inputPath} [${startTime}s-${endTime}s] -> ${outputPath}`);

      // Use raw FFmpeg with -c copy to preserve streams without re-encoding
      // Command: ffmpeg -ss startTime -i input -t duration -c copy -y output
      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-ss', String(startTime),
        '-i', inputPath,
        '-t', String(duration),
        '-c', 'copy', // Copy all streams
        '-y', // Overwrite output file
        outputPath
      ];

      logger.info(`FFmpeg command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';
      let stdout = '';

      if (proc.stdout) {
        proc.stdout.on('data', (data: any) => {
          stdout += data.toString();
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
      }

      proc.on('close', (code: any) => {
        if (code === 0) {
          logger.info(`Clip extracted successfully: ${outputPath}`);
          resolve();
        } else {
          logger.error('Clip extraction failed:', {
            exitCode: code,
            stderr: stderr?.slice(-500) || '',
            stdout: stdout?.slice(-500) || ''
          });
          reject(new Error(`FFmpeg extraction failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err: any) => {
        logger.error('Clip extraction error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Extraction setup error:', error);
      reject(error);
    }
  });
}

export function applyBlur(
  inputPath: string,
  strength: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const sigma = Math.max(0, Math.min(50, Math.round(strength)));
      if (sigma === 0) {
        logger.info('Blur strength 0 — copying input to output unchanged');
        fs.copyFileSync(inputPath, outputPath);
        resolve();
        return;
      }

      // TikTok-style blurred background effect.
      //
      // Key memory constraint: scale=W:H:force_original_aspect_ratio=increase
      // creates a giant intermediate frame (e.g. 3413×1920 for 16:9→9:16).
      // That alone OOMs the container before a single frame encodes.
      //
      // Solution: stretch background directly to 1080×1920 (no oversized
      // intermediate), then scale down to 360×640 for the blur pass so boxblur
      // runs on ~9× fewer pixels. Distortion on the background is invisible
      // because it's heavily blurred anyway.
      const blurRadius = Math.max(3, Math.round(sigma * 0.6));
      const filterComplex = [
        '[0:v]split=2[bg][fg]',
        `[bg]scale=1080:1920,scale=360:640,boxblur=${blurRadius}:2,scale=1080:1920[blurred]`,
        '[fg]scale=1080:-2[front]',
        '[blurred][front]overlay=(W-w)/2:(H-h)/2[out]'
      ].join(';');

      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-i', inputPath,
        '-filter_complex', filterComplex,
        '-map', '[out]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '26',
        '-threads', '2',
        '-c:a', 'copy',
        '-avoid_negative_ts', 'make_zero',
        '-y',
        outputPath
      ];

      logger.info(`FFmpeg blur command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => { stderr += data.toString(); });
      }

      proc.on('close', (code: any, signal: any) => {
        if (code === 0) {
          logger.info(`Blur applied (sigma=${sigma}): ${outputPath}`);
          resolve();
        } else {
          logger.error('Blur error:', { exitCode: code, signal, stderr: stderr?.slice(-500) || '' });
          reject(new Error(`FFmpeg blur failed with code ${code} signal ${signal}`));
        }
      });

      proc.on('error', (err: any) => {
        logger.error('Blur process error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Blur setup error:', error);
      reject(error);
    }
  });
}

export function resizeAspectRatio(
  inputPath: string,
  aspectRatio: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      let width = '1080';
      let height = '1920';

      // Map aspect ratios to dimensions
      switch (aspectRatio) {
        case '9:16': // Vertical
          width = '1080';
          height = '1920';
          break;
        case '16:9': // Horizontal
          width = '1920';
          height = '1080';
          break;
        case '1:1': // Square
          width = '1080';
          height = '1080';
          break;
        default:
          width = '1080';
          height = '1920';
      }

      // Use spawn for memory-efficient aspect ratio adjustment
      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

      const args = [
        '-i', inputPath,
        '-vf', filter,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '26',
        '-threads', '2',
        '-avoid_negative_ts', 'make_zero',
        '-y',
        outputPath
      ];

      logger.info(`FFmpeg aspect ratio command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';
      let stdout = '';

      if (proc.stdout) {
        proc.stdout.on('data', (data: any) => {
          stdout += data.toString();
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
      }

      proc.on('close', (code: any) => {
        if (code === 0) {
          logger.info(`Aspect ratio adjusted: ${outputPath}`);
          resolve();
        } else {
          logger.error('Aspect ratio error:', {
            exitCode: code,
            stderr: stderr?.slice(-500) || ''
          });
          reject(new Error(`FFmpeg aspect ratio failed with code ${code}`));
        }
      });

      proc.on('error', (err: any) => {
        logger.error('Aspect ratio process error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Aspect ratio setup error:', error);
      reject(error);
    }
  });
}

// Convert CSS hex colour (#RRGGBB) to ASS BGR format (&H00BBGGRR)
function hexToASS(hex: string): string {
  const h = hex.replace('#', '').padStart(6, '0');
  const r = h.slice(0, 2);
  const g = h.slice(2, 4);
  const b = h.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

interface SubtitleStyleOptions {
  primaryColor?: string;       // CSS hex e.g. "#FFFFFF"
  outlineColor?: string | null; // CSS hex, or null to remove outline entirely
  subtitleSize?: number;       // CSS px, used directly as ASS Fontsize
}

// CSS px → ASS Fontsize: use directly (1:1 mapping gives matching visual size).
function cssPxToAssSize(cssSize: number): number {
  return Math.round(Math.max(8, cssSize));
}

// Position is embedded in each SRT line as an \an tag ({\\an2}/{\\an5}/{\\an8})
// so force_style does NOT include Alignment — inline tags always take precedence
// and are reliably honoured by FFmpeg's SRT-to-ASS converter.
// MarginV is a fixed edge padding (pixels from the video edge toward center).
function buildForceStyle(style: string, opts: SubtitleStyleOptions = {}): string {
  // Fontname=DejaVu Sans: available on Alpine via font-dejavu (installed in Dockerfile).
  const FONT = 'DejaVu Sans';
  const sz = cssPxToAssSize(opts.subtitleSize ?? 14);
  const MARGIN = 30; // px from edge; applies to both top and bottom depending on \an tag

  // Outline thickness per style (0 = no outline)
  const outlineThickness: Record<string, number> = {
    default: 2, rhythm: 1,
  };
  const outlineDisabled = opts.outlineColor === null;
  const outline = outlineDisabled ? 0 : (outlineThickness[style] ?? 2);
  const outlineColourHex = (!outlineDisabled && opts.outlineColor)
    ? hexToASS(opts.outlineColor)
    : '&H00000000'; // default black

  const presets: Record<string, string> = {
    default: `Fontname=${FONT},Fontsize=${sz},Bold=0,PrimaryColour=&H00FFFFFF,OutlineColour=${outlineColourHex},Outline=${outline},MarginV=${MARGIN}`,
    rhythm:  `Fontname=${FONT},Fontsize=${sz},Bold=0,Italic=1,PrimaryColour=&H00FFFFFF,OutlineColour=${outlineColourHex},Outline=${outline},MarginV=${MARGIN}`,
  };

  let base = presets[style] ?? presets['default'];

  // Override PrimaryColour if caller supplied a custom hex colour
  if (opts.primaryColor) {
    base = base.replace(/PrimaryColour=[^,]+/, `PrimaryColour=${hexToASS(opts.primaryColor)}`);
  }

  return base;
}

export function burnSubtitles(
  inputPath: string,
  subtitlePath: string,
  outputPath: string,
  style: string = 'default',
  subtitleSize: number = 14,
  primaryColor?: string,
  /** Pass a hex color string for outline, or null to remove outline entirely */
  outlineColor?: string | null
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;

      const cleanPath = subtitlePath.replace(/^['"]|['"]$/g, '');
      const forceStyle = buildForceStyle(style, { primaryColor, outlineColor, subtitleSize });
      const filter = `subtitles='${cleanPath}':force_style='${forceStyle}'`;

      logger.info(`Burning subtitles — style: ${style}, filter: ${filter}`);

      const args = [
        '-i', inputPath,
        '-vf', filter,
        '-c:a', 'aac',       // Re-encode audio to fix timestamp sync
        '-b:a', '128k',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '26',
        '-threads', '2',
        '-avoid_negative_ts', 'make_zero',  // Fix negative timestamps
        '-y',
        outputPath
      ];

      logger.info(`FFmpeg subtitle command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';
      let stdout = '';

      if (proc.stdout) {
        proc.stdout.on('data', (data: any) => {
          stdout += data.toString();
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
      }

      proc.on('close', (code: any) => {
        if (code === 0) {
          logger.info(`Subtitles burned successfully: ${outputPath}`);
          resolve();
        } else {
          logger.error('Subtitle burn failed:', {
            exitCode: code,
            stderr: stderr?.slice(-1000) || '',
            stdout: stdout?.slice(-500) || ''
          });
          reject(new Error(`FFmpeg subtitle burning failed with code ${code}`));
        }
      });

      proc.on('error', (err: any) => {
        logger.error('Subtitle burn process error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Subtitle filter setup error:', error);
      reject(error);
    }
  });
}

export function encodeVideo(
  inputPath: string,
  quality: string,
  fps: number,
  outputPath: string
): Promise<void> {
  // CRF-based encoding: content-adaptive, no wasted bits on easy scenes.
  // Lower CRF = better quality + larger file. Range 0–51; 18–28 is practical.
  const crfMap: Record<string, string> = {
    low:    '30',
    medium: '26',
    high:   '22',
  };

  return new Promise((resolve, reject) => {
    try {
      const crf = crfMap[quality] ?? '26';
      logger.info(`Starting video encoding: ${inputPath} -> ${outputPath} (CRF ${crf} @ ${fps}fps)`);

      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-i', inputPath,
        '-vf', 'setpts=PTS-STARTPTS',
        '-af', 'asetpts=PTS-STARTPTS',
        '-c:v', 'libx264',
        '-crf', crf,
        '-r', String(fps),
        '-vsync', 'cfr',
        '-c:a', 'aac',
        '-b:a', '96k',
        '-preset', 'fast',
        '-threads', '2',
        '-avoid_negative_ts', 'make_zero',
        '-y',
        outputPath
      ];

      logger.info(`FFmpeg encoding command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';
      let stdout = '';
      let lastProgress = 0;

      if (proc.stdout) {
        proc.stdout.on('data', (data: any) => {
          stdout += data.toString();
          // Log progress periodically
          const lines = stdout.split('\n');
          lines.forEach((line: string) => {
            if (line.includes('frame=')) {
              // Extract frame number for progress tracking
              const match = line.match(/frame=\s*(\d+)/);
              if (match && Date.now() - lastProgress > 5000) {
                lastProgress = Date.now();
                logger.debug(`Encoding progress: frame ${match[1]}`);
              }
            }
          });
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
      }

      proc.on('close', (code: any) => {
        if (code === 0) {
          logger.info(`Video encoded successfully: ${outputPath}`);
          resolve();
        } else {
          logger.error('Encoding failed:', {
            inputPath,
            outputPath,
            exitCode: code,
            stderr: stderr?.slice(-1000) || '',
            stdout: stdout?.slice(-500) || ''
          });
          reject(new Error(`FFmpeg encoding failed with exit code ${code}: ${stderr.slice(-200)}`));
        }
      });

      proc.on('error', (err: any) => {
        logger.error('Encoding process error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Encoding setup error:', error);
      reject(error);
    }
  });
}

export function addWatermark(
  inputPath: string,
  watermarkPath: string,
  position: string,
  size: number,
  opacity: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Map positions to FFmpeg filter syntax
      let overlayPos = '10:10'; // Default: top-left

      switch (position) {
        case 'top-left':
          overlayPos = '10:10';
          break;
        case 'top-right':
          overlayPos = 'main_w-w-10:10';
          break;
        case 'bottom-left':
          overlayPos = '10:main_h-h-10';
          break;
        case 'bottom-right':
          overlayPos = 'main_w-w-10:main_h-h-10';
          break;
      }

      // Build filter with watermark scaling and opacity
      // colorchannelmixer=aa= is the correct way to set per-pixel alpha in FFmpeg
      const opacityVal = Math.max(0, Math.min(1, opacity / 100)).toFixed(3);
      const watermarkScale = Math.max(0.01, Math.min(0.5, size / 100)).toFixed(4);
      const filterComplex = `[1:v]scale=iw*${watermarkScale}:ih*${watermarkScale},format=rgba,colorchannelmixer=aa=${opacityVal}[wm];[0:v][wm]overlay=${overlayPos}`;

      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-i', inputPath,
        '-i', watermarkPath,
        '-filter_complex', filterComplex,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '26',
        '-threads', '2',
        '-avoid_negative_ts', 'make_zero',
        '-y',
        outputPath
      ];

      logger.info(`FFmpeg watermark command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
      }

      proc.on('close', (code: any) => {
        if (code === 0) {
          logger.info(`Watermark added: ${outputPath}`);
          resolve();
        } else {
          logger.error('Watermark error:', {
            exitCode: code,
            stderr: stderr?.slice(-500) || ''
          });
          reject(new Error(`FFmpeg watermark failed with code ${code}`));
        }
      });

      proc.on('error', (err: any) => {
        logger.error('Watermark process error:', err);
        reject(err);
      });
    } catch (error) {
      logger.error('Watermark setup error:', error);
      reject(error);
    }
  });
}

export function extractAudioSegment(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
    const args = [
      '-ss', String(startTime),
      '-i', inputPath,
      '-t', String(endTime - startTime),
      '-vn',
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      '-y',
      outputPath,
    ];
    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr?.on('data', (d: any) => { stderr += d.toString(); });
    proc.on('close', (code: any) => {
      if (code === 0) resolve();
      else reject(new Error(`Audio segment extraction failed (code ${code}): ${stderr.slice(-200)}`));
    });
    proc.on('error', reject);
  });
}

export function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
    const args = [
      '-i', inputPath,
      '-vn',          // no video stream
      '-ar', '16000', // 16 kHz — Whisper requirement
      '-ac', '1',     // mono
      '-f', 'wav',
      '-y',
      outputPath
    ];

    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr?.on('data', (d: any) => { stderr += d.toString(); });
    proc.on('close', (code: any) => {
      if (code === 0) resolve();
      else reject(new Error(`Audio extraction failed (code ${code}): ${stderr.slice(-200)}`));
    });
    proc.on('error', reject);
  });
}

export function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
      if (err) {
        logger.error('ffprobe error:', err);
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(Math.ceil(duration));
      }
    });
  });
}
