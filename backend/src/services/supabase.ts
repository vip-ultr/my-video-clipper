import { createClient } from '@supabase/supabase-js';
import { config } from '../utils/config.js';
import { Video, Clip, CustomWatermark } from '../types/index.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// Video operations
export async function saveVideo(videoData: Partial<Video>): Promise<{ data: any; error: any }> {
  try {
    const result = await supabase.from('videos').insert([videoData]).select();
    return result;
  } catch (error) {
    logger.error('Failed to save video', error);
    throw error;
  }
}

export async function getVideo(videoId: string): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to get video', error);
    return null;
  }
}

export async function updateVideo(videoId: string, updates: Partial<Video>): Promise<Video | null> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to update video', error);
    return null;
  }
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Failed to delete video', error);
    return false;
  }
}

// Clip operations
export async function saveClip(clipData: Partial<Clip>): Promise<{ data: any; error: any }> {
  try {
    const result = await supabase.from('clips').insert([clipData]).select();
    return result;
  } catch (error) {
    logger.error('Failed to save clip', error);
    throw error;
  }
}

export async function getClip(clipId: string): Promise<Clip | null> {
  try {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to get clip', error);
    return null;
  }
}

export async function getClips(videoId: string): Promise<Clip[]> {
  try {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('video_id', videoId)
      .order('clip_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to get clips', error);
    return [];
  }
}

export async function updateClip(clipId: string, updates: Partial<Clip>): Promise<Clip | null> {
  try {
    const { data, error } = await supabase
      .from('clips')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', clipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to update clip', error);
    return null;
  }
}

export async function deleteClip(clipId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('clips').delete().eq('id', clipId);
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Failed to delete clip', error);
    return false;
  }
}

// Custom watermark operations
export async function saveCustomWatermark(watermarkData: Partial<CustomWatermark>): Promise<boolean> {
  try {
    const { error } = await supabase.from('custom_watermarks').insert([watermarkData]);
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Failed to save custom watermark', error);
    return false;
  }
}

export async function getCustomWatermarks(): Promise<CustomWatermark[]> {
  try {
    const { data, error } = await supabase
      .from('custom_watermarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to get custom watermarks', error);
    return [];
  }
}

export async function deleteCustomWatermark(watermarkId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('custom_watermarks').delete().eq('id', watermarkId);
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Failed to delete custom watermark', error);
    return false;
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const { error } = await supabase.from('videos').select('id').limit(1);
    return !error;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}
