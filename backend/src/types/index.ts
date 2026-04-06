export interface Video {
  id: string;
  project_name: string;
  file_name: string;
  file_path: string;
  duration_seconds: number;
  transcript: Record<string, any> | null;
  sentiment_scores: Record<string, any> | null;
  created_at: Date;
}

export interface Clip {
  id: string;
  video_id: string;
  project_name: string;
  clip_index: number;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  subtitles_enabled: boolean;
  subtitle_style: string;
  subtitle_primary_color: string;
  subtitle_secondary_color: string;
  subtitle_position: string;
  blur_enabled: boolean;
  blur_strength: number;
  watermark_type: string;
  watermark_id: string | null;
  watermark_position: string;
  watermark_size: number;
  watermark_opacity: number;
  aspect_ratio: string;
  quality: string;
  fps: number;
  output_file_path: string | null;
  processed: boolean;
  download_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CustomWatermark {
  id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  created_at: Date;
}

export interface ClipSettings {
  videoId: string;
  clipIndex: number;
  startTime: number;
  endTime: number;
  projectName: string;
  subtitlesEnabled: boolean;
  subtitleStyle: string;
  subtitlePrimaryColor: string;
  subtitleSecondaryColor: string;
  subtitlePosition: string;
  blurEnabled: boolean;
  blurStrength: number;
  watermarkType: string;
  watermarkId?: string;
  watermarkPosition: string;
  watermarkSize: number;
  watermarkOpacity: number;
  aspectRatio: string;
  quality: string;
  fps: number;
}

export interface ProcessingResponse {
  success: boolean;
  clipId?: string;
  outputPath?: string;
  error?: string;
}
