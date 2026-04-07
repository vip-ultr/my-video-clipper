'use client';

import { useCallback } from 'react';
import { useUploadStore } from '@/store/uploadStore';
import * as api from '@/lib/api';

export function useUpload() {
  const {
    videoFile,
    projectName,
    clippingMode,
    clipCount,
    clipDuration,
    videoId,
    isUploading,
    uploadProgress,
    error,
    setVideoFile,
    setProjectName,
    setClippingMode,
    setClipCount,
    setClipDuration,
    setVideoId,
    setIsUploading,
    setUploadProgress,
    setError
  } = useUploadStore();

  const uploadVideo = useCallback(async () => {
    if (!videoFile || !projectName.trim()) {
      setError('Please select a video and enter a project name');
      return false;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Convert clipping mode from store format to backend format
      const backendClippingMode = clippingMode === 'ai-detection' ? 'AI' : 'MANUAL';

      const response = await api.uploadVideo(videoFile, projectName, backendClippingMode, clipCount);

      if (response.data.success) {
        setVideoId(response.data.videoId);
        setUploadProgress(100);
        return true;
      } else {
        setError(response.data.error || 'Upload failed');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [videoFile, projectName, clippingMode, clipCount, setIsUploading, setError, setVideoId, setUploadProgress]);

  return {
    videoFile,
    projectName,
    clippingMode,
    clipCount,
    clipDuration,
    videoId,
    isUploading,
    uploadProgress,
    error,
    setVideoFile,
    setProjectName,
    setClippingMode,
    setClipCount,
    setClipDuration,
    uploadVideo
  };
}
