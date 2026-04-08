import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { saveVideo, getVideo } from '../services/supabase.js';
import { getVideoDuration } from '../services/ffmpeg.js';
import { generateSubtitlesContent, parseSRTToEntries } from '../services/subtitles.js';
import { config } from '../utils/config.js';
import { asyncHandler } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

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
    const clippingMode = req.body.clippingMode || 'MANUAL'; // Default to MANUAL clipping
    const clipCount = parseInt(req.body.clipCount, 10) || 3; // Default to 3 clips
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
      clipping_mode: clippingMode,
      clip_count: clipCount,
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
      duration: duration,
      clippingMode: clippingMode,
      clipCount: clipCount
    });
  })
);

// Preview clip — stream-copy only the requested segment (no re-encode, ~200ms)
// GET /api/upload/:videoId/preview-clip?start=10&end=40
router.get(
  '/:videoId/preview-clip',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const start = parseFloat(req.query.start as string || '0');
    const end   = parseFloat(req.query.end   as string || '0');

    if (!end || end <= start) {
      return res.status(400).json({ error: 'Invalid start/end times' });
    }

    const video = await getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const srcPath = video.file_path;
    if (!fs.existsSync(srcPath)) return res.status(404).json({ error: 'Video file not found' });

    // Cache key: same clip is re-used while user adjusts non-trim settings
    const cacheFile = path.join(config.paths.clipsDir, `preview-${videoId}-${start}-${end}.mp4`);

    const serve = () => {
      const stat = fs.statSync(cacheFile);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const [s, e] = range.replace(/bytes=/, '').split('-');
        const byteStart = parseInt(s, 10);
        const byteEnd   = e ? parseInt(e, 10) : Math.min(byteStart + 1024 * 1024 - 1, fileSize - 1);
        res.writeHead(206, {
          'Content-Range':  `bytes ${byteStart}-${byteEnd}/${fileSize}`,
          'Accept-Ranges':  'bytes',
          'Content-Length': byteEnd - byteStart + 1,
          'Content-Type':   'video/mp4',
        });
        fs.createReadStream(cacheFile, { start: byteStart, end: byteEnd }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type':   'video/mp4',
          'Accept-Ranges':  'bytes',
        });
        fs.createReadStream(cacheFile).pipe(res);
      }
    };

    // Serve from cache if already extracted
    if (fs.existsSync(cacheFile)) {
      return serve();
    }

    // Ensure clips dir exists
    if (!fs.existsSync(config.paths.clipsDir)) {
      fs.mkdirSync(config.paths.clipsDir, { recursive: true });
    }

    // Fast stream-copy — no re-encode, just cut
    const ffmpegPath = (typeof ffmpegStatic === 'string' ? ffmpegStatic : 'ffmpeg') as string;
    const duration   = end - start;
    const args = [
      '-ss', String(start),
      '-i',  srcPath,
      '-t',  String(duration),
      '-c',  'copy',
      '-movflags', 'faststart',
      '-y',
      cacheFile,
    ];

    const proc = spawn(ffmpegPath, args);
    let stderr = '';
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('close', (code: number | null) => {
      if (code === 0 && fs.existsSync(cacheFile)) {
        logger.info(`Preview clip ready: ${cacheFile}`);
        serve();
      } else {
        logger.error('Preview clip extraction failed:', { code, stderr: stderr.slice(-300) });
        if (!res.headersSent) res.status(500).json({ error: 'Preview extraction failed' });
      }
    });

    proc.on('error', (err: Error) => {
      logger.error('Preview clip spawn error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'FFmpeg not available' });
    });
  })
);

// Subtitle preview for a clip segment — caches SRT for 1 hour
// GET /api/upload/:videoId/subtitles?start=X&end=Y&uppercase=false
router.get(
  '/:videoId/subtitles',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const start     = parseFloat(req.query.start as string || '0');
    const end       = parseFloat(req.query.end   as string || '0');
    const uppercase = req.query.uppercase === 'true';

    if (!end || end <= start) {
      return res.status(400).json({ error: 'Invalid start/end times' });
    }

    const video = await getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (!fs.existsSync(video.file_path)) return res.status(404).json({ error: 'Video file not found' });

    if (!fs.existsSync(config.paths.clipsDir)) {
      fs.mkdirSync(config.paths.clipsDir, { recursive: true });
    }

    const ucSuffix  = uppercase ? '-uc' : '';
    const cacheFile = path.join(config.paths.clipsDir, `subtitle-${videoId}-${start}-${end}${ucSuffix}.srt`);

    // Serve from cache if fresh (< 1 hour)
    if (fs.existsSync(cacheFile)) {
      const stat = fs.statSync(cacheFile);
      if (Date.now() - stat.mtimeMs < 60 * 60 * 1000) {
        const srt = fs.readFileSync(cacheFile, 'utf-8');
        return res.json({ success: true, entries: parseSRTToEntries(srt) });
      }
    }

    logger.info(`Generating subtitle preview: video=${videoId} [${start}-${end}s] uppercase=${uppercase}`);

    const srtContent = await generateSubtitlesContent(
      video.file_path,
      start,
      end,
      config.paths.clipsDir,
      config.deepgram.apiKey || undefined,
      uppercase
    );

    fs.writeFileSync(cacheFile, srtContent, 'utf-8');
    // Auto-delete cache after 1 hour
    setTimeout(() => {
      try { if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile); } catch {}
    }, 60 * 60 * 1000);

    return res.json({ success: true, entries: parseSRTToEntries(srtContent) });
  })
);

// Stream original video with HTTP Range support (for <video> preview)
router.get(
  '/:videoId/stream',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const video = await getVideo(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const filePath = video.file_path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Video file not found' });

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024 - 1, fileSize - 1);
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  })
);

export default router;
