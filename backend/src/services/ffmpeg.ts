import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { logger } from '../utils/logger.js';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

export function extractClip(
  inputPath: string,
  startTime: number,
  endTime: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .duration(endTime - startTime)
      .output(outputPath)
      .on('start', (commandLine: any) => logger.debug('FFmpeg command:', commandLine))
      .on('end', () => {
        logger.info(`Clip extracted: ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Clip extraction error:', err);
        reject(err);
      })
      .run();
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
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(bitrates[quality as keyof typeof bitrates] || '2500k')
      .audioBitrate('96k')
      .fps(fps)
      .output(outputPath)
      .on('start', (commandLine: any) => logger.debug('FFmpeg command:', commandLine))
      .on('end', () => {
        logger.info(`Video encoded: ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        logger.error('Encoding error:', err);
        reject(err);
      })
      .run();
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
