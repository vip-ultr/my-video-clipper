-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  transcript JSONB,
  sentiment_scores JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_name);

-- Clips table
CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  clip_index INT NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  duration_seconds INT NOT NULL,

  -- Subtitle settings
  subtitles_enabled BOOLEAN DEFAULT FALSE,
  subtitle_style VARCHAR(50),
  subtitle_primary_color VARCHAR(7) DEFAULT '#FFFFFF',
  subtitle_secondary_color VARCHAR(7) DEFAULT '#999999',
  subtitle_position VARCHAR(20) DEFAULT 'bottom',

  -- Blur settings
  blur_enabled BOOLEAN DEFAULT FALSE,
  blur_strength INT DEFAULT 15,

  -- Watermark settings
  watermark_type VARCHAR(50) DEFAULT 'default',
  watermark_id VARCHAR(100),
  watermark_position VARCHAR(20) DEFAULT 'bottom-right',
  watermark_size INT DEFAULT 20,
  watermark_opacity INT DEFAULT 80,

  -- Video settings
  aspect_ratio VARCHAR(10) DEFAULT '9:16',
  quality VARCHAR(20) DEFAULT 'medium',
  fps INT DEFAULT 30,

  -- Output
  output_file_path TEXT,
  processed BOOLEAN DEFAULT FALSE,
  download_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clips_video ON clips(video_id);
CREATE INDEX IF NOT EXISTS idx_clips_created ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_processed ON clips(processed);

-- Custom watermarks metadata
CREATE TABLE IF NOT EXISTS custom_watermarks (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INT,
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watermarks_created ON custom_watermarks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_watermarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now - no authentication)
CREATE POLICY "Allow all" ON videos FOR ALL USING (true);
CREATE POLICY "Allow all" ON clips FOR ALL USING (true);
CREATE POLICY "Allow all" ON custom_watermarks FOR ALL USING (true);

-- Storage buckets creation (run in Supabase UI or via SDK)
-- NOTE: Create these manually in Supabase dashboard:
-- 1. Create "watermarks" bucket (PRIVATE)
-- 2. Create "public-watermark" bucket (PUBLIC)
-- 3. Upload default watermark to public-watermark/default-watermark.png
