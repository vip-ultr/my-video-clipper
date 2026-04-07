import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WATERMARKS_DIR = process.env.WATERMARKS_DIR || './temp/watermarks';

/**
 * Save uploaded watermark to local storage and database
 */
export async function saveWatermark(
  filePath: string,
  fileName: string,
  fileSize: number
): Promise<string> {
  try {
    const watermarkId = `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure directory exists
    if (!fs.existsSync(WATERMARKS_DIR)) {
      fs.mkdirSync(WATERMARKS_DIR, { recursive: true });
    }

    // Move file to watermarks directory
    const newPath = path.join(WATERMARKS_DIR, `${watermarkId}.png`);
    fs.copyFileSync(filePath, newPath);
    fs.unlinkSync(filePath); // Delete temp file

    // Save metadata to database
    const { error } = await supabase
      .from('custom_watermarks')
      .insert([
        {
          id: watermarkId,
          file_path: newPath,
          file_name: fileName,
          file_size_bytes: fileSize,
          file_type: 'image/png',
          created_at: new Date()
        }
      ]);

    if (error) throw error;

    logger.info(`Watermark saved: ${watermarkId}`);
    return watermarkId;
  } catch (error) {
    logger.error('Save watermark failed:', error);
    throw error;
  }
}

/**
 * Get watermark by ID
 */
export async function getWatermark(watermarkId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('custom_watermarks')
      .select('*')
      .eq('id', watermarkId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get watermark failed:', error);
    return null;
  }
}

/**
 * List all user watermarks
 */
export async function listWatermarks(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('custom_watermarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('List watermarks failed:', error);
    return [];
  }
}

/**
 * Delete watermark by ID
 */
export async function deleteWatermark(watermarkId: string): Promise<boolean> {
  try {
    // Get watermark info
    const watermark = await getWatermark(watermarkId);
    if (!watermark) {
      logger.warn(`Watermark not found: ${watermarkId}`);
      return false;
    }

    // Delete file
    if (fs.existsSync(watermark.file_path)) {
      fs.unlinkSync(watermark.file_path);
    }

    // Delete from database
    const { error } = await supabase
      .from('custom_watermarks')
      .delete()
      .eq('id', watermarkId);

    if (error) throw error;

    logger.info(`Watermark deleted: ${watermarkId}`);
    return true;
  } catch (error) {
    logger.error('Delete watermark failed:', error);
    return false;
  }
}

/**
 * Get watermark file path for FFmpeg
 */
export function getWatermarkPath(watermarkId: string): string {
  return path.join(WATERMARKS_DIR, `${watermarkId}.png`);
}
