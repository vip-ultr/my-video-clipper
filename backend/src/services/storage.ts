import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export function ensureDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    logger.error(`Failed to create directory: ${dirPath}`, error);
    return false;
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    logger.error(`Failed to get file size: ${filePath}`, error);
    return 0;
  }
}

export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
    return false;
  }
}

export function readFile(filePath: string): Buffer | null {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    logger.error(`Failed to read file: ${filePath}`, error);
    return null;
  }
}

export function writeFile(filePath: string, data: Buffer | string): boolean {
  try {
    const dir = path.dirname(filePath);
    ensureDirectory(dir);
    fs.writeFileSync(filePath, data);
    logger.info(`File written: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to write file: ${filePath}`, error);
    return false;
  }
}

export function listFiles(dirPath: string): string[] {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath);
  } catch (error) {
    logger.error(`Failed to list files in: ${dirPath}`, error);
    return [];
  }
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function moveFile(sourcePath: string, destPath: string): boolean {
  try {
    const destDir = path.dirname(destPath);
    ensureDirectory(destDir);
    fs.renameSync(sourcePath, destPath);
    logger.info(`File moved: ${sourcePath} -> ${destPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to move file: ${sourcePath}`, error);
    return false;
  }
}

export function copyFile(sourcePath: string, destPath: string): boolean {
  try {
    const destDir = path.dirname(destPath);
    ensureDirectory(destDir);
    fs.copyFileSync(sourcePath, destPath);
    logger.info(`File copied: ${sourcePath} -> ${destPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to copy file: ${sourcePath}`, error);
    return false;
  }
}

export function cleanupOldFiles(dirPath: string, ageHours: number = 1): number {
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);
    const cutoffTime = Date.now() - ageHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoffTime) {
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`Cleanup: Deleted ${filePath}`);
        } catch (err) {
          logger.error(`Cleanup: Failed to delete ${filePath}`, err);
        }
      }
    }

    return deletedCount;
  } catch (error) {
    logger.error(`Failed to cleanup old files in: ${dirPath}`, error);
    return 0;
  }
}
