import fs from 'fs';
import path from 'path';

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getVideoMetadata(filePath: string): { size: number; name: string } {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    name: path.basename(filePath)
  };
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function ensureFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
    return false;
  }
}

export function calculateDuration(startTime: number, endTime: number): number {
  return Math.ceil(endTime - startTime);
}
