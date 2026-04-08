import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },

  ffmpeg: {
    ffmpegPath: process.env.FFMPEG_PATH,
    ffprobePath: process.env.FFPROBE_PATH
  },

  paths: {
    tempDir: process.env.TEMP_DIR || '/tmp',
    videosDir: process.env.VIDEOS_DIR || '/tmp/videos',
    clipsDir: process.env.CLIPS_DIR || '/tmp/clips',
    watermarksDir: process.env.WATERMARKS_DIR || '/tmp/watermarks'
  },

  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY || ''
  },

  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || ''
  }
};

// Ensure directories exist
export function ensureDirectories() {
  const dirs = [
    config.paths.videosDir,
    config.paths.clipsDir,
    config.paths.watermarksDir
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Validate config
export function validateConfig() {
  const errors: string[] = [];

  if (!config.supabase.url) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!config.supabase.serviceRoleKey) {
    errors.push('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  if (errors.length > 0) {
    const errorMsg = `Configuration errors:\n${errors.join('\n')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
