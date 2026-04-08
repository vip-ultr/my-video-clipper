import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { asyncHandler, validateClipSettings } from '../middleware/validation.js';
import { processClip } from '../services/processing.js';
import { getClips, getClip, getVideo } from '../services/supabase.js';
import * as ffmpegService from '../services/ffmpeg.js';
import { logger } from '../utils/logger.js';
import { ClipSettings } from '../types/index.js';
import { config } from '../utils/config.js';

const router = express.Router();

// Create a new clip
router.post(
  '/create',
  validateClipSettings,
  asyncHandler(async (req: Request, res: Response) => {
    const settings: ClipSettings = {
      videoId: req.body.videoId,
      clipIndex: req.body.clipIndex || 0,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      projectName: req.body.projectName,
      subtitlesEnabled: req.body.subtitlesEnabled || false,
      subtitleStyle: req.body.subtitleStyle || 'classic',
      subtitleSize: req.body.subtitleSize || 18,
      subtitlePrimaryColor: req.body.subtitlePrimaryColor || '#FFFFFF',
      subtitleOutlineColor: req.body.subtitleOutlineColor || '#000000',
      subtitleOutlineEnabled: req.body.subtitleOutlineEnabled !== false,
      subtitlePosition: req.body.subtitlePosition || 'bottom',
      subtitleUppercase: req.body.subtitleUppercase || false,
      blurEnabled: req.body.blurEnabled || false,
      blurStrength: req.body.blurStrength || 15,
      watermarkType: req.body.watermarkType || 'none',
      watermarkId: req.body.watermarkId,
      watermarkPosition: req.body.watermarkPosition || 'bottom-right',
      watermarkSize: req.body.watermarkSize || 20,
      watermarkOpacity: req.body.watermarkOpacity || 80,
      aspectRatio: req.body.aspectRatio || '9:16',
      quality: req.body.quality || 'medium',
      fps: req.body.fps || 30,
      isEdited: req.body.isEdited || false
    };

    logger.info(`Processing clip: ${settings.clipIndex}`);

    const result = await processClip(settings);

    if (result.success && result.outputPath && result.clipId) {
      try {
        const fileSize = fs.statSync(result.outputPath).size;
        const editedSuffix = settings.isEdited ? '-edited' : '';
        const fileName = `${settings.projectName}-clip-${settings.clipIndex}${editedSuffix}.mp4`;
        const duration = settings.endTime - settings.startTime;

        res.json({
          success: true,
          clip: {
            id: result.clipId,
            filename: fileName,
            fileSize: fileSize,
            duration: duration
          }
        });
      } catch (statError) {
        logger.error('Failed to get file stats:', statError);
        res.status(500).json({
          success: false,
          error: `Failed to get clip file info: ${statError instanceof Error ? statError.message : 'Unknown error'}`
        });
      }
    } else {
      logger.error('Clip processing failed:', result.error);
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to process clip'
      });
    }
  })
);

// Get clips for a video
router.get(
  '/video/:videoId',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const clips = await getClips(videoId);

    res.json({
      success: true,
      clips,
      count: clips.length
    });
  })
);

// Quick download: Stream raw extracted clip (no FFmpeg processing)
router.get(
  '/quick-download/:clipId',
  asyncHandler(async (req: Request, res: Response) => {
    const { clipId } = req.params;

    try {
      logger.info(`Quick download requested for clip: ${clipId}`);

      // Get clip metadata
      const clip = await getClip(clipId);
      if (!clip) {
        logger.error(`Clip not found: ${clipId}`);
        return res.status(404).json({
          success: false,
          error: 'Clip not found'
        });
      }

      // Get original video file path
      const video = await getVideo(clip.video_id);
      if (!video) {
        logger.error(`Video not found for clip: ${clipId}`);
        return res.status(404).json({
          success: false,
          error: 'Source video not found'
        });
      }

      // Create temporary file for quick download
      const tempDir = config.paths.clipsDir;
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFileName = `quick-${clipId}.mp4`;
      const tempFilePath = path.join(tempDir, tempFileName);

      // Extract raw clip with -c copy (fast, no re-encoding)
      logger.info(`Extracting raw clip: ${video.file_path} [${clip.start_time}s-${clip.end_time}s]`);
      await ffmpegService.extractClip(
        video.file_path,
        clip.start_time,
        clip.end_time,
        tempFilePath
      );

      // Set response headers for download
      const fileName = `${clip.project_name}-clip-${clip.clip_index}.mp4`;
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Stream the file to client
      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.pipe(res);

      // Clean up temp file after streaming completes
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(tempFilePath);
          logger.info(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          logger.error('Failed to cleanup temporary file:', cleanupError);
        }
      });

      fileStream.on('error', (error) => {
        logger.error('Stream error during quick download:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to stream clip'
          });
        }
      });

    } catch (error) {
      logger.error('Quick download error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Quick download failed'
      });
    }
  })
);

export default router;
