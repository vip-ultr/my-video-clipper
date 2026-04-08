import { create } from 'zustand';

export interface EditorState {
  subtitlesEnabled: boolean;
  subtitleStyle: string;
  subtitlePrimaryColor: string;
  subtitleSecondaryColor: string;
  subtitlePosition: string;
  subtitleUppercase: boolean;
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

  setSubtitlesEnabled: (enabled: boolean) => void;
  setSubtitleStyle: (style: string) => void;
  setSubtitlePrimaryColor: (color: string) => void;
  setSubtitleSecondaryColor: (color: string) => void;
  setSubtitlePosition: (position: string) => void;
  setSubtitleUppercase: (uppercase: boolean) => void;
  setBlurEnabled: (enabled: boolean) => void;
  setBlurStrength: (strength: number) => void;
  setWatermarkType: (type: string) => void;
  setWatermarkId: (id: string | null) => void;
  setWatermarkPosition: (position: string) => void;
  setWatermarkSize: (size: number) => void;
  setWatermarkOpacity: (opacity: number) => void;
  setAspectRatio: (ratio: string) => void;
  setQuality: (quality: string) => void;
  setFps: (fps: number) => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  subtitlesEnabled: false,
  subtitleStyle: 'default',
  subtitlePrimaryColor: '#FFFFFF',
  subtitleSecondaryColor: '#999999',
  subtitlePosition: 'bottom',
  subtitleUppercase: false,
  blurEnabled: false,
  blurStrength: 15,
  watermarkType: 'none',
  watermarkId: null,
  watermarkPosition: 'bottom-right',
  watermarkSize: 20,
  watermarkOpacity: 80,
  aspectRatio: '9:16',
  quality: 'medium',
  fps: 30,
  isProcessing: false,
  error: null
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
  setSubtitleStyle: (style) => set({ subtitleStyle: style }),
  setSubtitlePrimaryColor: (color) => set({ subtitlePrimaryColor: color }),
  setSubtitleSecondaryColor: (color) => set({ subtitleSecondaryColor: color }),
  setSubtitlePosition: (position) => set({ subtitlePosition: position }),
  setSubtitleUppercase: (uppercase) => set({ subtitleUppercase: uppercase }),
  setBlurEnabled: (enabled) => set({ blurEnabled: enabled }),
  setBlurStrength: (strength) => set({ blurStrength: strength }),
  setWatermarkType: (type) => set({ watermarkType: type }),
  setWatermarkId: (id) => set({ watermarkId: id }),
  setWatermarkPosition: (position) => set({ watermarkPosition: position }),
  setWatermarkSize: (size) => set({ watermarkSize: size }),
  setWatermarkOpacity: (opacity) => set({ watermarkOpacity: opacity }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  setQuality: (quality) => set({ quality }),
  setFps: (fps) => set({ fps }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setError: (error) => set({ error }),
  reset: () => set(initialState)
}));
