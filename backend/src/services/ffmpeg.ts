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
      const clampedStrength = Math.max(0, Math.min(30, Math.round(strength)));
      if (clampedStrength === 0) {
        logger.info('Blur strength resolved to 0, skipping blur FFmpeg step and copying input to output');
        fs.copyFileSync(inputPath, outputPath);
        resolve();
        return;
      }

      const iterations = Math.max(1, Math.round(clampedStrength / 5));
      const filter = `boxblur=${clampedStrength}:${iterations}`;

      // Use spawn for memory-efficient blur application
      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-i', inputPath,
        '-vf', filter,
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '35',  // Very low quality for intermediate processing to save memory
        '-maxrate', '1000k',  // Limit bitrate to reduce memory usage
        '-bufsize', '1000k',
        '-y',
        outputPath
      ];

      logger.info(`FFmpeg blur command: ${ffmpegPath} ${args.join(' ')}`);

      const proc = spawn(ffmpegPath, args);
      let stderr = '';

      if (proc.stderr) {
        proc.stderr.on('data', (data: any) => {
          stderr += data.toString();
        });
      }

      proc.on('close', (code: any) => {
        if (code === 0) {
          logger.info(`Blur applied: ${outputPath}`);
          resolve();
        } else {
          logger.error('Blur error:', {
            exitCode: code,
            stderr: stderr?.slice(-500) || ''
          });
          reject(new Error(`FFmpeg blur failed with code ${code}`));
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
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '35',  // Very low quality for intermediate processing to save memory
        '-maxrate', '1000k',  // Limit bitrate to reduce memory usage
        '-bufsize', '1000k',
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

export function burnSubtitles(
  inputPath: string,
  subtitlePath: string,
  outputPath: string,
  style: string = 'default'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // FFmpeg subtitles filter doesn't support styling options like fontsize
      // Use the simple subtitles filter to overlay SRT/VTT subtitles
      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;

      // Escape the subtitle path for FFmpeg filter
      // Remove leading/trailing quotes if present and re-add them
      const cleanPath = subtitlePath.replace(/^['"]|['"]$/g, '');
      const filter = `subtitles='${cleanPath}'`;

      logger.info(`Burning subtitles with filter: ${filter}`);

      const args = [
        '-i', inputPath,
        '-vf', filter,
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '35',  // Low quality for intermediate processing to save memory
        '-maxrate', '1500k',  // Limit bitrate
        '-bufsize', '1500k',
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
  const bitrates = {
    low: '1000k',
    medium: '2500k',
    high: '5000k'
  };

  return new Promise((resolve, reject) => {
    try {
      const bitrate = bitrates[quality as keyof typeof bitrates] || '2500k';
      logger.info(`Starting video encoding: ${inputPath} -> ${outputPath} (${bitrate}@${fps}fps)`);

      // Use raw FFmpeg for more reliable encoding
      // Command: ffmpeg -i input -c:v libx264 -b:v bitrate -r fps -c:a aac -b:a 96k -y output
      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-i', inputPath,
        '-c:v', 'libx264',
        '-b:v', bitrate,
        '-r', String(fps),
        '-c:a', 'aac',
        '-b:a', '96k',
        '-preset', 'fast', // Speed up encoding for low-resource environments
        '-y', // Overwrite output file
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
      const opacityVal = Math.max(0, Math.min(1, opacity / 100));
      const watermarkScale = Math.max(0.01, Math.min(0.5, size / 100));
      const filterComplex = `[1:v]scale=iw*${watermarkScale}:ih*${watermarkScale}[scaled];[0:v][scaled]overlay=${overlayPos}:alpha=${opacityVal}`;

      const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
      const args = [
        '-i', inputPath,
        '-i', watermarkPath,
        '-filter_complex', filterComplex,
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '35',  // Low quality for intermediate processing to save memory
        '-maxrate', '1500k',  // Limit bitrate
        '-bufsize', '1500k',
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
