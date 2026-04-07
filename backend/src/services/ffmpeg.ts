import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
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
    const radius = Math.floor(strength / 5);
    const filter = `boxblur=${strength}:${radius}`;

    ffmpeg(inputPath)
      .videoFilters(filter)
      .output(outputPath)
      .on('start', (commandLine: any) => logger.debug('FFmpeg command:', commandLine))
      .on('end', () => {
        logger.info(`Blur applied: ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Blur error:', err);
        reject(err);
      })
      .run();
  });
}

export function resizeAspectRatio(
  inputPath: string,
  aspectRatio: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let filter = '';

    // Map aspect ratios to scale and pad filters
    switch (aspectRatio) {
      case '9:16': // Vertical
        filter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
        break;
      case '16:9': // Horizontal
        filter = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2";
        break;
      case '1:1': // Square
        filter = "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2";
        break;
      default:
        filter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
    }

    ffmpeg(inputPath)
      .videoFilters(filter)
      .output(outputPath)
      .on('start', (commandLine: any) => logger.debug('FFmpeg command:', commandLine))
      .on('end', () => {
        logger.info(`Aspect ratio adjusted: ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Aspect ratio error:', err);
        reject(err);
      })
      .run();
  });
}

export function burnSubtitles(
  inputPath: string,
  subtitlePath: string,
  outputPath: string,
  style: string = 'default'
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Subtitle styling options
    let filter = '';
    switch (style) {
      case 'emphasis':
        filter = `subtitles=${subtitlePath}:fontsize=48:fontcolor=white:borderw=2:bordercolor=black:margin_v=40`;
        break;
      case 'rhythm':
        filter = `subtitles=${subtitlePath}:fontsize=42:fontcolor=white:shadowx=2:shadowy=2:shadowcolor=black:margin_v=40`;
        break;
      case 'uniform':
        filter = `subtitles=${subtitlePath}:fontsize=40:fontcolor=white:margin_v=40`;
        break;
      default:
        filter = `subtitles=${subtitlePath}:fontsize=48:fontcolor=white:borderw=2:bordercolor=black:margin_v=40`;
    }

    ffmpeg(inputPath)
      .videoFilters(filter)
      .output(outputPath)
      .on('start', (commandLine: any) => logger.debug('FFmpeg command:', commandLine))
      .on('end', () => {
        logger.info(`Subtitles burned: ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Subtitle burn error:', err);
        reject(err);
      })
      .run();
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

      ffmpeg(inputPath)
        .videoCodec('libx264')
        .videoBitrate(bitrate)
        .fps(fps)
        .output(outputPath)
        .on('start', (commandLine: any) => {
          logger.info('FFmpeg encoding started');
          logger.debug('Full command:', commandLine);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            logger.debug(`Encoding progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          logger.info(`Video encoded successfully: ${outputPath}`);
          resolve();
        })
        .on('error', (err: any, stdout: any, stderr: any) => {
          logger.error('Encoding failed:', {
            inputPath,
            outputPath,
            error: err?.message || String(err),
            code: (err as any)?.code,
            stdout: stdout ? stdout.toString().slice(-500) : '',
            stderr: stderr ? stderr.toString().slice(-500) : ''
          });
          reject(new Error(`FFmpeg encoding failed: ${err?.message || String(err)}`));
        })
        .run();
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
    // Map positions to FFmpeg filter syntax
    let overlay = 'overlay=10:10'; // Default: top-left

    switch (position) {
      case 'top-left':
        overlay = `overlay=10:10:alpha=${opacity / 100}`;
        break;
      case 'top-right':
        overlay = `overlay=main_w-w-10:10:alpha=${opacity / 100}`;
        break;
      case 'bottom-left':
        overlay = `overlay=10:main_h-h-10:alpha=${opacity / 100}`;
        break;
      case 'bottom-right':
        overlay = `overlay=main_w-w-10:main_h-h-10:alpha=${opacity / 100}`;
        break;
    }

    // Scale watermark to size (percentage of video width)
    const scaleFilter = `scale=iw*${size / 100}:ih*${size / 100}`;

    ffmpeg(inputPath)
      .input(watermarkPath)
      .complexFilter([`[1:v]${scaleFilter}[scaled]`, `[0:v][scaled]${overlay}[output]`], ['output'])
      .output(outputPath)
      .on('start', (commandLine: any) => logger.debug('FFmpeg command:', commandLine))
      .on('end', () => {
        logger.info(`Watermark added: ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Watermark error:', err);
        reject(err);
      })
      .run();
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
