import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import uploadRouter from './routes/upload';
import watermarkRouter from './routes/watermark';
import clipsRouter from './routes/clips';
import downloadRouter from './routes/download';
import processingRouter from './routes/processing';
import { errorHandler } from './middleware/errorHandler';
import { startCleanupJob } from './jobs/cleanup';
import { config, ensureDirectories, validateConfig } from './utils/config';
import { logger } from './utils/logger';
import { healthCheck } from './services/supabase';

dotenv.config();

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize
try {
  validateConfig();
  ensureDirectories();
  logger.info('Configuration validated and directories ensured');
} catch (error) {
  logger.error('Initialization failed:', error);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`[SERVER] Running on port ${PORT}`);
  logger.info(`[SERVER] Environment: ${config.nodeEnv}`);
  logger.info(`[SERVER] Supabase URL: ${config.supabase.url}`);

  // Start cleanup job
  startCleanupJob();

  logger.info('[SERVER] Startup completed successfully');
});
