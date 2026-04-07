// Request/Response types for API endpoints

export interface UploadVideoRequest {
  projectName: string;
  clippingMode?: 'ai-detection' | 'manual-slicing';
}

export interface UploadVideoResponse {
  success: boolean;
  videoId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  error?: string;
}

export interface UploadWatermarkRequest {
  // Sent as multipart form data with 'watermark' file
}

export interface UploadWatermarkResponse {
  success: boolean;
  watermarkId: string;
  fileName: string;
  fileSize: number;
  error?: string;
}

export interface CreateClipRequest {
  videoId: string;
  clipIndex: number;
  startTime: number;
  endTime: number;
  projectName: string;

  // Subtitle settings
  subtitlesEnabled: boolean;
  subtitleStyle: string;
  subtitlePrimaryColor: string;
  subtitleSecondaryColor: string;
  subtitlePosition: string;

  // Blur settings
  blurEnabled: boolean;
  blurStrength: number;

  // Watermark settings
  watermarkType: string;
  watermarkId?: string;
  watermarkPosition: string;
  watermarkSize: number;
  watermarkOpacity: number;

  // Video settings
  aspectRatio: string;
  quality: string;
  fps: number;
}

export interface CreateClipResponse {
  success: boolean;
  clip?: {
    id: string;
    filename: string;
    fileSize: number;
    duration: number;
    downloadUrl: string;
  };
  error?: string;
}

export interface ProcessingStatusResponse {
  success: boolean;
  status?: {
    videoId: string;
    projectName: string;
    totalDuration: number;
    hasTranscript: boolean;
    hasSentimentAnalysis: boolean;
    clipsGenerated: number;
    clips: Array<{
      id: string;
      index: number;
      startTime: number;
      endTime: number;
      duration: number;
      processed: boolean;
    }>;
  };
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}
