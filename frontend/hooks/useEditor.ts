'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import * as api from '@/lib/api';

export function useEditor() {
  const {
    subtitlesEnabled,
    subtitleStyle,
    subtitlePrimaryColor,
    subtitleSecondaryColor,
    subtitlePosition,
    blurEnabled,
    blurStrength,
    watermarkType,
    watermarkId,
    watermarkPosition,
    watermarkSize,
    watermarkOpacity,
    aspectRatio,
    quality,
    fps,
    isProcessing,
    error,
    setSubtitlesEnabled,
    setSubtitleStyle,
    setSubtitlePrimaryColor,
    setSubtitleSecondaryColor,
    setSubtitlePosition,
    setBlurEnabled,
    setBlurStrength,
    setWatermarkType,
    setWatermarkId,
    setWatermarkPosition,
    setWatermarkSize,
    setWatermarkOpacity,
    setAspectRatio,
    setQuality,
    setFps,
    setIsProcessing,
    setError
  } = useEditorStore();

  const createClip = useCallback(
    async (videoId: string, startTime: number, endTime: number, clipIndex: number, projectName: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        const response = await api.createClip({
          videoId,
          clipIndex,
          startTime,
          endTime,
          projectName,
          subtitlesEnabled,
          subtitleStyle,
          subtitlePrimaryColor,
          subtitleSecondaryColor,
          subtitlePosition,
          blurEnabled,
          blurStrength,
          watermarkType,
          watermarkId,
          watermarkPosition,
          watermarkSize,
          watermarkOpacity,
          aspectRatio,
          quality,
          fps
        });

        if (response.data.success) {
          return response.data;
        } else {
          setError(response.data.error || 'Clip creation failed');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Clip creation failed';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      subtitlesEnabled,
      subtitleStyle,
      subtitlePrimaryColor,
      subtitleSecondaryColor,
      subtitlePosition,
      blurEnabled,
      blurStrength,
      watermarkType,
      watermarkId,
      watermarkPosition,
      watermarkSize,
      watermarkOpacity,
      aspectRatio,
      quality,
      fps,
      setIsProcessing,
      setError
    ]
  );

  return {
    subtitlesEnabled,
    subtitleStyle,
    subtitlePrimaryColor,
    subtitleSecondaryColor,
    subtitlePosition,
    blurEnabled,
    blurStrength,
    watermarkType,
    watermarkId,
    watermarkPosition,
    watermarkSize,
    watermarkOpacity,
    aspectRatio,
    quality,
    fps,
    isProcessing,
    error,
    setSubtitlesEnabled,
    setSubtitleStyle,
    setSubtitlePrimaryColor,
    setSubtitleSecondaryColor,
    setSubtitlePosition,
    setBlurEnabled,
    setBlurStrength,
    setWatermarkType,
    setWatermarkId,
    setWatermarkPosition,
    setWatermarkSize,
    setWatermarkOpacity,
    setAspectRatio,
    setQuality,
    setFps,
    createClip
  };
}
