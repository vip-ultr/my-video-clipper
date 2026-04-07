import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import uploadRouter from './routes/upload.js';
import watermarkRouter from './routes/watermark.js';
import clipsRouter from './routes/clips.js';
import downloadRouter from './routes/download.js';
import processingRouter from './routes/processing.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startCleanupJob } from './jobs/cleanup.js';
import { config, ensureDirectories, validateConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { healthCheck } from './services/supabase.js';

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Increase request timeout for video processing (5 minutes)
app.use((req, res, next) => {
  req.setTimeout(300000);
  next();
});

// Initialize
try {
  logger.info('[STARTUP] Starting server initialization...');
  logger.info(`[STARTUP] Node environment: ${config.nodeEnv}`);
  logger.info(`[STARTUP] Port: ${PORT}`);
  logger.info(`[STARTUP] Supabase URL set: ${!!config.supabase.url}`);
  logger.info(`[STARTUP] Service role key set: ${!!config.supabase.serviceRoleKey}`);

  validateConfig();
  ensureDirectories();

  // Ensure directories exist and are writable
  const fs = await import('fs');
  const path = await import('path');

  [config.paths.clipsDir, config.paths.watermarksDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`[STARTUP] Created directory: ${dir}`);
    }
  });

  logger.info('[STARTUP] Configuration validated and directories ensured');
} catch (error) {
  logger.error('[STARTUP] Initialization failed:', error);
  logger.error('[STARTUP] Make sure all required environment variables are set');
  process.exit(1);
}

// Routes
app.use('/api/upload', uploadRouter);
app.use('/api/watermark', watermarkRouter);
app.use('/api/clips', clipsRouter);
app.use('/api/download', downloadRouter);
app.use('/api/processing', processingRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealthy = await healthCheck();
  res.json({
    status: 'ok',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Diagnostic endpoint for debugging
app.get('/api/diagnostic', async (req, res) => {
  const { execSync } = await import('child_process');
  const fs = await import('fs');
  const diagnostics: any = {
    timestamp: new Date(),
    node: process.version,
    env: config.nodeEnv,
    paths: {
      clips: config.paths.clipsDir,
      watermarks: config.paths.watermarksDir
    },
    ffmpeg: { installed: false, version: null },
    fileSystem: {
      clipsDir: { exists: false, writable: false },
      watermarksDir: { exists: false, writable: false }
    }
  };

  try {
    const version = execSync('ffmpeg -version', { timeout: 5000 }).toString().split('\n')[0];
    diagnostics.ffmpeg.installed = true;
    diagnostics.ffmpeg.version = version;
  } catch (e) {
    diagnostics.ffmpeg.error = 'FFmpeg not found in PATH';
  }

  // Check directories
  try {
    if (fs.existsSync(config.paths.clipsDir)) {
      diagnostics.fileSystem.clipsDir.exists = true;
      fs.writeFileSync(`${config.paths.clipsDir}/.test`, 'test');
      fs.unlinkSync(`${config.paths.clipsDir}/.test`);
      diagnostics.fileSystem.clipsDir.writable = true;
    }
  } catch (e) {
    diagnostics.fileSystem.clipsDir.error = e instanceof Error ? e.message : 'Unknown error';
  }

  try {
    if (fs.existsSync(config.paths.watermarksDir)) {
      diagnostics.fileSystem.watermarksDir.exists = true;
      fs.writeFileSync(`${config.paths.watermarksDir}/.test`, 'test');
      fs.unlinkSync(`${config.paths.watermarksDir}/.test`);
      diagnostics.fileSystem.watermarksDir.writable = true;
    }
  } catch (e) {
    diagnostics.fileSystem.watermarksDir.error = e instanceof Error ? e.message : 'Unknown error';
  }

  res.json(diagnostics);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[FATAL] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`[SERVER] Running on port ${PORT}`);
  logger.info(`[SERVER] Environment: ${config.nodeEnv}`);
  logger.info(`[SERVER] Supabase URL: ${config.supabase.url}`);

  // Start cleanup job
  startCleanupJob();

  logger.info('[SERVER] Startup completed successfully');
});

// Set timeouts for long-running video processing
server.setTimeout(300000); // 5 minutes

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`[SERVER] Port ${PORT} is already in use`);
  } else {
    logger.error('[SERVER] Server error:', error);
  }
  process.exit(1);
});
