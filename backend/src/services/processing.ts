import { ClipSettings } from '../types/index.js';
import * as ffmpegService from './ffmpeg.js';
import * as supabaseService from './supabase.js';
import * as subtitleService from './subtitles.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { config } from '../utils/config.js';
import { randomUUID } from 'crypto';
import https from 'https';

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
    let wasReencoded = false; // track if any intermediate step already re-encoded

    // Step 2: Apply blur if enabled
    if (settings.blurEnabled) {
      logger.info('Step 2: Applying blur...');
      const blurredPath = path.join(tempDir, `blurred-${clipFileName}`);
      await ffmpegService.applyBlur(currentInput, settings.blurStrength, blurredPath);
      fs.unlinkSync(currentInput); // Clean up previous temp file
      currentInput = blurredPath;
      wasReencoded = true;
    }

    // Step 3: Adjust aspect ratio (skip if 1:1 to reduce memory usage)
    if (settings.aspectRatio !== '1:1') {
      logger.info('Step 3: Adjusting aspect ratio...');
      const resizedPath = path.join(tempDir, `resized-${clipFileName}`);
      try {
        await ffmpegService.resizeAspectRatio(currentInput, settings.aspectRatio, resizedPath);
        fs.unlinkSync(currentInput);
        currentInput = resizedPath;
        wasReencoded = true;
      } catch (resizeError) {
        logger.warn('Aspect ratio adjustment failed, continuing without resize:', resizeError);
        // Continue with original aspect ratio to avoid memory issues
      }
    } else {
      logger.info('Step 3: Skipping aspect ratio adjustment (1:1 mode)');
    }

    // Step 4: Burn subtitles if enabled
    if (settings.subtitlesEnabled) {
      logger.info('Step 4: Burning subtitles...');
      const subtitledPath = path.join(tempDir, `subtitled-${clipFileName}`);
      let subtitleFilePath: string | null = null;

      try {
        subtitleFilePath = await subtitleService.generateSubtitles(
          currentInput,
          settings.startTime,
          settings.endTime,
          tempDir,
          config.deepgram.apiKey || undefined,
          settings.subtitleUppercase ?? false
        );

        if (subtitleFilePath && fs.existsSync(subtitleFilePath)) {
          // Escape the path for FFmpeg (especially on Windows with colons)
          const escapedPath = subtitleService.escapeSubtitlePath(subtitleFilePath);

          await ffmpegService.burnSubtitles(
            currentInput,
            escapedPath,
            subtitledPath,
            settings.subtitleStyle || 'default',
            settings.subtitlePrimaryColor || undefined,
            settings.subtitlePosition || undefined
          );

          fs.unlinkSync(currentInput);
          currentInput = subtitledPath;
          wasReencoded = true;
          logger.info('Subtitles burned successfully');
        } else {
          logger.warn('Could not generate subtitle file, skipping subtitles');
        }
      } catch (subtitleError) {
        logger.error('Error during subtitle processing:', subtitleError);
        // Continue without subtitles
      } finally {
        // Keep subtitle file for 1 hour for potential re-use, then delete
        if (subtitleFilePath && fs.existsSync(subtitleFilePath)) {
          const srtPathToDelete = subtitleFilePath;
          setTimeout(() => {
            try { if (fs.existsSync(srtPathToDelete)) fs.unlinkSync(srtPathToDelete); } catch {}
          }, 60 * 60 * 1000);
          logger.info('Subtitle file kept for 1 hour before cleanup');
        }
      }
    }

    // Step 5: Add watermark if specified
    if (settings.watermarkType && settings.watermarkType !== 'none') {
      logger.info('Step 5: Adding watermark...');
      const watermarkedPath = path.join(tempDir, `watermarked-${clipFileName}`);
      let watermarkImagePath = '';
      let tempWatermarkPath: string | null = null;

      try {
        if (settings.watermarkType === 'default') {
          // Download default watermark from Supabase Storage
          logger.info('Downloading default watermark from Supabase Storage...');
          const watermarkBuffer = await supabaseService.downloadWatermarkFromStorage('public-watermark', 'default-watermark.png');

          if (watermarkBuffer) {
            // Save to temporary file
            tempWatermarkPath = path.join(tempDir, `temp-watermark-${Date.now()}.png`);
            fs.writeFileSync(tempWatermarkPath, watermarkBuffer);
            watermarkImagePath = tempWatermarkPath;
            logger.info(`Watermark saved to temporary path: ${watermarkImagePath}`);
          } else {
            logger.warn('Default watermark not found in Supabase Storage');
          }
        } else if (settings.watermarkId) {
          // Download custom watermark from Supabase Storage
          // Try common extensions in order since the stored extension may vary
          logger.info(`Downloading custom watermark ${settings.watermarkId} from Supabase Storage...`);
          let watermarkBuffer: Buffer | null = null;
          let resolvedExt = 'png';
          for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
            watermarkBuffer = await supabaseService.downloadWatermarkFromStorage('watermarks', `${settings.watermarkId}.${ext}`);
            if (watermarkBuffer) { resolvedExt = ext; break; }
          }

          if (watermarkBuffer) {
            tempWatermarkPath = path.join(tempDir, `temp-watermark-${settings.watermarkId}.${resolvedExt}`);
            fs.writeFileSync(tempWatermarkPath, watermarkBuffer);
            watermarkImagePath = tempWatermarkPath;
            logger.info(`Custom watermark saved to temporary path: ${watermarkImagePath}`);
          } else {
            logger.warn(`Custom watermark ${settings.watermarkId} not found in Supabase Storage`);
          }
        }

        if (watermarkImagePath && fs.existsSync(watermarkImagePath)) {
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
          wasReencoded = true;
          logger.info('Watermark applied successfully');
        } else {
          logger.warn('Watermark file not available, skipping watermark step');
        }
      } catch (watermarkError) {
        logger.error('Error during watermark processing:', watermarkError);
        // Continue without watermark
      } finally {
        // Clean up temporary watermark file
        if (tempWatermarkPath && fs.existsSync(tempWatermarkPath)) {
          try {
            fs.unlinkSync(tempWatermarkPath);
            logger.info('Cleaned up temporary watermark file');
          } catch (cleanupError) {
            logger.warn('Failed to cleanup temporary watermark file:', cleanupError);
          }
        }
      }
    }

    // Step 6: Final encoding with quality and FPS settings
    logger.info('Step 6: Final encoding...');

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

    if (wasReencoded) {
      // Intermediate steps already produced clean H.264 — just rename to final path
      logger.info('Step 6: Skipping re-encode (video already encoded by intermediate step)');
      fs.renameSync(currentInput, outputPath);
    } else {
      // Raw stream-copied clip — needs a full encode to apply quality/fps settings
      try {
        await ffmpegService.encodeVideo(currentInput, settings.quality, settings.fps, outputPath);
        logger.info('Encoding completed successfully');
      } catch (encodeError) {
        logger.error('Final encoding failed:', encodeError);
        throw new Error(`Video encoding failed: ${encodeError instanceof Error ? encodeError.message : String(encodeError)}`);
      }
      fs.unlinkSync(currentInput);
    }

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
