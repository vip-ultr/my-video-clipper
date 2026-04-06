import { config } from '../utils/config';
import * as storageService from '../services/storage';
import { logger } from '../utils/logger';

const CLEANUP_INTERVAL = 30 * 60 * 1000; // Every 30 minutes
const FILE_AGE_HOURS = 1; // Delete files older than 1 hour

export function startCleanupJob() {
  logger.info('Starting cleanup job...');

  // Run cleanup immediately
  performCleanup();

  // Then run periodically
  setInterval(performCleanup, CLEANUP_INTERVAL);
}

function performCleanup() {
  const dirs = [
    config.paths.videosDir,
    config.paths.clipsDir,
    config.paths.watermarksDir
  ];

  logger.info('[CLEANUP] Starting file cleanup...');

  for (const dir of dirs) {
    try {
      const deletedCount = storageService.cleanupOldFiles(dir, FILE_AGE_HOURS);
      if (deletedCount > 0) {
        logger.info(`[CLEANUP] Deleted ${deletedCount} files from ${dir}`);
      }
    } catch (error) {
      logger.error(`[CLEANUP] Error cleaning up ${dir}:`, error);
    }
  }

  logger.info('[CLEANUP] File cleanup completed');
}
