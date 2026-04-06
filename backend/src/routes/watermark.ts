import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { saveCustomWatermark, getCustomWatermarks, deleteCustomWatermark } from '../services/supabase';
import { config } from '../utils/config';
import { asyncHandler } from '../middleware/validation';
import { logger } from '../utils/logger';
import { generateUUID } from '../utils/helpers';

const router = express.Router();

const watermarkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const watermarkDir = config.paths.watermarksDir;
    if (!fs.existsSync(watermarkDir)) {
      fs.mkdirSync(watermarkDir, { recursive: true });
    }
    cb(null, watermarkDir);
  },
  filename: (req, file, cb) => {
    const watermarkId = generateUUID();
    const ext = file.originalname.split('.').pop();
    cb(null, `${watermarkId}.${ext}`);
  }
});

const watermarkUpload = multer({
  storage: watermarkStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only PNG and JPEG are supported'));
    } else {
      cb(null, true);
    }
  }
});

// Upload watermark
router.post(
  '/upload',
  watermarkUpload.single('watermark'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const watermarkId = req.file.filename.split('.')[0];

    const watermarkData = {
      id: watermarkId,
      file_path: req.file.path,
      file_name: req.file.originalname,
      file_size_bytes: req.file.size,
      file_type: req.file.mimetype,
      created_at: new Date()
    };

    const success = await saveCustomWatermark(watermarkData);

    if (!success) {
      logger.error('Failed to save watermark metadata');
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to save watermark' });
    }

    logger.info(`Watermark uploaded: ${watermarkId}`);

    res.json({
      success: true,
      watermarkId,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  })
);

// Get all watermarks
router.get(
  '/list',
  asyncHandler(async (req: Request, res: Response) => {
    const watermarks = await getCustomWatermarks();
    res.json({ success: true, watermarks });
  })
);

// Delete watermark
router.delete(
  '/:watermarkId',
  asyncHandler(async (req: Request, res: Response) => {
    const { watermarkId } = req.params;

    const success = await deleteCustomWatermark(watermarkId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete watermark' });
    }

    logger.info(`Watermark deleted: ${watermarkId}`);

    res.json({ success: true });
  })
);

export default router;
