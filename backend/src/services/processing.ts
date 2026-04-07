import { ClipSettings } from '../types/index.js';
import * as ffmpegService from './ffmpeg.js';
import * as supabaseService from './supabase.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { config } from '../utils/config.js';
import { randomUUID } from 'crypto';

export async function processClip(settings: ClipSettings): Promise<{ success: boolean; outputPath?: string; clipId?: string; error?: string }> {
  const tempDir = config.paths.clipsDir;
  const clipId = randomUUID(); // Generate proper UUID for database
  const clipFileName = `${Date.now()}-${settings.clipIndex}.mp4`;
  let outputPath = path.join(tempDir, clipFileName);

  try {
    logger.info(`Starting clip processing: ${settings.clipIndex}`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      logger.info(`Created temp directory: ${tempDir}`);
    }

    // Get original video path
    const video = await supabaseService.getVideo(settings.videoId);
    if (!video) {
      throw new Error('Video not found in database');
    }

    logger.info(`Video file path: ${video.file_path}`);

    // Check if video file exists
    if (!fs.existsSync(video.file_path)) {
      logger.error(`Video file not found at: ${video.file_path}`);
      throw new Error(`Video file not found at: ${video.file_path}`);
    }

    // Step 1: Extract clip
    logger.info('Step 1: Extracting clip...');
    const extractedClipPath = path.join(tempDir, `extracted-${clipFileName}`);

    try {
      await ffmpegService.extractClip(
        video.file_path,
        settings.startTime,
        settings.endTime,
        extractedClipPath
      );
    } catch (ffmpegError) {
      logger.error('FFmpeg extraction failed:', ffmpegError);
      throw new Error(`FFmpeg extraction failed: ${ffmpegError instanceof Error ? ffmpegError.message : String(ffmpegError)}`);
    }

    let currentInput = extractedClipPath;

    // Step 2: Apply blur if enabled
    if (settings.blurEnabled) {
      logger.info('Step 2: Applying blur...');
      const blurredPath = path.join(tempDir, `blurred-${clipFileName}`);
      await ffmpegService.applyBlur(currentInput, settings.blurStrength, blurredPath);
      fs.unlinkSync(currentInput); // Clean up previous temp file
      currentInput = blurredPath;
    }

    // Step 3: Adjust aspect ratio (skip if 1:1 to reduce memory usage)
    if (settings.aspectRatio !== '1:1') {
      logger.info('Step 3: Adjusting aspect ratio...');
      const resizedPath = path.join(tempDir, `resized-${clipFileName}`);
      try {
        await ffmpegService.resizeAspectRatio(currentInput, settings.aspectRatio, resizedPath);
        fs.unlinkSync(currentInput);
        currentInput = resizedPath;
      } catch (resizeError) {
        logger.warn('Aspect ratio adjustment failed, continuing without resize:', resizeError);
        // Continue with original aspect ratio to avoid memory issues
      }
    } else {
      logger.info('Step 3: Skipping aspect ratio adjustment (1:1 mode)');
    }

    // Step 4: Add watermark if specified
    if (settings.watermarkType && settings.watermarkType !== 'none') {
      logger.info('Step 4: Adding watermark...');
      const watermarkedPath = path.join(tempDir, `watermarked-${clipFileName}`);

      let watermarkImagePath = '';
      if (settings.watermarkType === 'default') {
        watermarkImagePath = path.join(process.cwd(), 'public', 'default-watermark.png');
      } else if (settings.watermarkId) {
        // Get custom watermark path from Supabase
        // For now, use a default path
        watermarkImagePath = path.join(config.paths.watermarksDir, `${settings.watermarkId}.png`);
      }

      if (fs.existsSync(watermarkImagePath)) {
        await ffmpegService.addWatermark(
          currentInput,
          watermarkImagePath,
          settings.watermarkPosition,
          settings.watermarkSize,
          settings.watermarkOpacity,
          watermarkedPath
        );
        fs.unlinkSync(currentInput);
        currentInput = watermarkedPath;
      }
    }

    // Step 5: Final encoding with quality and FPS settings
    logger.info('Step 5: Final encoding...');

    // Ensure output directory exists and is writable
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.info(`Created output directory: ${outputDir}`);
    }

    // Verify write permissions
    try {
      fs.accessSync(outputDir, fs.constants.W_OK);
      logger.info(`Output directory is writable: ${outputDir}`);
    } catch (err) {
      logger.error(`Output directory is not writable: ${outputDir}`, err);
      throw new Error(`Cannot write to output directory: ${outputDir}`);
    }

    try {
      await ffmpegService.encodeVideo(currentInput, settings.quality, settings.fps, outputPath);
      logger.info('Encoding completed successfully');
    } catch (encodeError) {
      logger.error('Final encoding failed:', encodeError);
      throw new Error(`Video encoding failed: ${encodeError instanceof Error ? encodeError.message : String(encodeError)}`);
    }

    fs.unlinkSync(currentInput);

    // Save clip record to database
    logger.info('Saving clip to database...');
    const clipData = {
      id: clipId,
      video_id: settings.videoId,
      project_name: settings.projectName,
      clip_index: settings.clipIndex,
      start_time: settings.startTime,
      end_time: settings.endTime,
      duration_seconds: Math.ceil(settings.endTime - settings.startTime),
      subtitles_enabled: settings.subtitlesEnabled,
      subtitle_style: settings.subtitleStyle,
      subtitle_primary_color: settings.subtitlePrimaryColor,
      subtitle_secondary_color: settings.subtitleSecondaryColor,
      subtitle_position: settings.subtitlePosition,
      blur_enabled: settings.blurEnabled,
      blur_strength: settings.blurStrength,
      watermark_type: settings.watermarkType,
      watermark_id: settings.watermarkId || null,
      watermark_position: settings.watermarkPosition,
      watermark_size: settings.watermarkSize,
      watermark_opacity: settings.watermarkOpacity,
      aspect_ratio: settings.aspectRatio,
      quality: settings.quality,
      fps: settings.fps,
      output_file_path: outputPath,
      processed: true,
      is_edited: settings.isEdited || false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabaseService.saveClip(clipData);
    if (error) {
      logger.error('Failed to save clip to database', error);
      throw error;
    }

    logger.info(`Clip processing completed: ${outputPath}`);
    return {
      success: true,
      outputPath,
      clipId
    };
  } catch (error) {
    logger.error('Clip processing failed:', error);

    // Clean up partial files
    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch (cleanupError) {
      logger.error('Failed to cleanup output file:', cleanupError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Clip processing failed'
    };
  }
}

export function calculateEngagementScore(
  sentiment: number,
  duration: number,
  speakerEnergy: number = 0.5
): number {
  // Weighted combination of factors
  const sentimentWeight = 0.4;
  const durationScore = Math.min(1, duration / 60); // Normalize to 60 seconds
  const durationWeight = 0.3;
  const energyWeight = 0.3;

  return (sentiment * sentimentWeight + durationScore * durationWeight + speakerEnergy * energyWeight);
}
