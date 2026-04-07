import express, { Request, Response } from 'express';
import { asyncHandler, validateClipSettings } from '../middleware/validation.js';
import { processClip } from '../services/processing.js';
import { getClips } from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { ClipSettings } from '../types/index.js';

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
      subtitlePrimaryColor: req.body.subtitlePrimaryColor || '#FFFFFF',
      subtitleSecondaryColor: req.body.subtitleSecondaryColor || '#999999',
      subtitlePosition: req.body.subtitlePosition || 'bottom',
      blurEnabled: req.body.blurEnabled || false,
      blurStrength: req.body.blurStrength || 15,
      watermarkType: req.body.watermarkType || 'none',
      watermarkId: req.body.watermarkId,
      watermarkPosition: req.body.watermarkPosition || 'bottom-right',
      watermarkSize: req.body.watermarkSize || 20,
      watermarkOpacity: req.body.watermarkOpacity || 80,
      aspectRatio: req.body.aspectRatio || '9:16',
      quality: req.body.quality || 'medium',
      fps: req.body.fps || 30
    };

    logger.info(`Processing clip: ${settings.clipIndex}`);

    const result = await processClip(settings);

    if (result.success) {
      res.json({
        success: true,
        clipId: `clip-${Date.now()}`,
        outputPath: result.outputPath
      });
    } else {
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

export default router;
