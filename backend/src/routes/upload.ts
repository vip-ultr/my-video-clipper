import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { saveVideo } from '../services/supabase';
import { getVideoDuration } from '../services/ffmpeg';
import { config } from '../utils/config';
import { asyncHandler } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = express.Router();

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const videoDir = config.paths.videosDir;
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const videoId = `${Date.now()}`;
    cb(null, `${videoId}.mp4`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 1.5 * 1024 * 1024 * 1024 }, // 1.5GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only MP4, MOV, and WebM are supported'));
    } else {
      cb(null, true);
    }
  }
});

router.post(
  '/',
  videoUpload.single('video'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const projectName = req.body.projectName || 'Untitled Project';
    let duration = 0;

    try {
      // Get video duration
      duration = await getVideoDuration(req.file.path);
      logger.info(`Video duration: ${duration} seconds`);
    } catch (error) {
      logger.warn('Could not determine video duration', error);
    }

    const videoData = {
      project_name: projectName,
      file_name: req.file.originalname,
      file_path: req.file.path,
      duration_seconds: duration,
      transcript: null,
      created_at: new Date()
    };

    const { data, error } = await saveVideo(videoData);

    if (error) {
      logger.error('Failed to save video to database', error);
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to save video' });
    }

    logger.info(`Video uploaded successfully: ${data[0].id}`);

    res.json({
      success: true,
      videoId: data[0].id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      duration: duration
    });
  })
);

export default router;
