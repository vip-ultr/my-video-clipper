export interface Clip {
  id: number;
  startTime: number;
  endTime: number;
  duration: number;
  sentiment: 'high' | 'medium' | 'low';
}

export interface ProcessingStatus {
  videoId: string;
  projectName: string;
  totalDuration: number;
  hasTranscript: boolean;
  hasSentimentAnalysis: boolean;
  clipsGenerated: number;
  clips: Clip[];
}

export interface UploadState {
  videoFile: File | null;
  projectName: string;
  clippingMode: 'ai-detection' | 'manual-slicing';
  clipCount: number;
  clipDuration: number;
  videoId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface EditorState {
  subtitlesEnabled: boolean;
  subtitleStyle: string;
  subtitlePrimaryColor: string;
  subtitleSecondaryColor: string;
  subtitlePosition: string;
  blurEnabled: boolean;
  blurStrength: number;
  watermarkType: string;
  watermarkId: string | null;
  watermarkPosition: string;
  watermarkSize: number;
  watermarkOpacity: number;
  aspectRatio: string;
  quality: string;
  fps: number;
  isProcessing: boolean;
  error: string | null;
}
