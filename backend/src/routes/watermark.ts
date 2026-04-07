import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { saveCustomWatermark, getCustomWatermarks, deleteCustomWatermark, uploadWatermarkToStorage } from '../services/supabase.js';
import { config } from '../utils/config.js';
import { asyncHandler } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import { generateUUID } from '../utils/helpers.js';

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
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Failed to save watermark' });
    }

    // Upload to Supabase Storage so processing service can download it
    const ext = req.file.originalname.split('.').pop() || 'png';
    const fileBuffer = fs.readFileSync(req.file.path);
    const storageOk = await uploadWatermarkToStorage('watermarks', `${watermarkId}.${ext}`, fileBuffer, req.file.mimetype);

    if (!storageOk) {
      logger.error('Failed to upload watermark to Supabase Storage');
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Failed to store watermark file' });
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

// Get watermark preview
router.get(
  '/preview',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Watermark ID is required' });
    }

    // Special case for default watermark
    if (id === 'default') {
      return res.sendFile(`${config.paths.watermarksDir}/default-watermark.png`);
    }

    const watermarkPath = `${config.paths.watermarksDir}/${id}.png`;

    if (!fs.existsSync(watermarkPath)) {
      // Try with other extensions
      const dir = config.paths.watermarksDir;
      const files = fs.readdirSync(dir);
      const watermarkFile = files.find(f => f.startsWith(id));

      if (!watermarkFile) {
        return res.status(404).json({ error: 'Watermark not found' });
      }

      return res.sendFile(`${dir}/${watermarkFile}`);
    }

    res.sendFile(watermarkPath);
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
