import { create } from 'zustand';

export interface UploadState {
  videoFile: File | null;
  projectName: string;
  clippingMode: 'ai-detection' | 'manual-slicing';
  clipCount: number;
  clipDuration: number;
  clipStartTimes: string[];
  videoId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  setVideoFile: (file: File | null) => void;
  setProjectName: (name: string) => void;
  setClippingMode: (mode: 'ai-detection' | 'manual-slicing') => void;
  setClipCount: (count: number) => void;
  setClipDuration: (duration: number) => void;
  setClipStartTimes: (times: string[]) => void;
  setVideoId: (id: string | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  videoFile: null,
  projectName: '',
  clippingMode: 'ai-detection' as const,
  clipCount: 5,
  clipDuration: 40,
  clipStartTimes: [],
  videoId: null,
  isUploading: false,
  uploadProgress: 0,
  error: null
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,

  setVideoFile: (file) => set({ videoFile: file }),
  setProjectName: (name) => set({ projectName: name }),
  setClippingMode: (mode) => set({ clippingMode: mode }),
  setClipCount: (count) => set({ clipCount: count }),
  setClipDuration: (duration) => set({ clipDuration: duration }),
  setClipStartTimes: (times) => set({ clipStartTimes: times }),
  setVideoId: (id) => set({ videoId: id }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setError: (error) => set({ error }),
  reset: () => set(initialState)
}));
