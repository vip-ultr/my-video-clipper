import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getClip, updateClip } from '../services/supabase.js';
import { asyncHandler } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Download a clip
router.get(
  '/:clipId',
  asyncHandler(async (req: Request, res: Response) => {
    const { clipId } = req.params;

    const clip = await getClip(clipId);

    if (!clip || !clip.output_file_path) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Check if file exists
    if (!fs.existsSync(clip.output_file_path)) {
      return res.status(404).json({ error: 'Clip file not found' });
    }

    try {
      // Update download count
      await updateClip(clipId, {
        download_count: (clip.download_count || 0) + 1
      });

      // Set response headers
      const fileName = `${clip.project_name}-clip-${clip.clip_index}.mp4`;
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fs.statSync(clip.output_file_path).size);

      // Stream the file
      const stream = fs.createReadStream(clip.output_file_path);
      stream.pipe(res);

      stream.on('error', (error) => {
        logger.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download clip' });
        }
      });

      logger.info(`Clip downloaded: ${clipId}`);
    } catch (error) {
      logger.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download clip' });
    }
  })
);

// Get clip info (without downloading)
router.get(
  '/:clipId/info',
  asyncHandler(async (req: Request, res: Response) => {
    const { clipId } = req.params;

    const clip = await getClip(clipId);

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    const fileSize = clip.output_file_path && fs.existsSync(clip.output_file_path)
      ? fs.statSync(clip.output_file_path).size
      : 0;

    res.json({
      success: true,
      clip: {
        id: clip.id,
        projectName: clip.project_name,
        clipIndex: clip.clip_index,
        duration: clip.duration_seconds,
        quality: clip.quality,
        aspectRatio: clip.aspect_ratio,
        fileSize,
        downloadCount: clip.download_count,
        createdAt: clip.created_at
      }
    });
  })
);

export default router;
