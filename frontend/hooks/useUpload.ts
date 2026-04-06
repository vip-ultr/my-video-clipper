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

      const response = await api.uploadVideo(videoFile, projectName);

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
  }, [videoFile, projectName, setIsUploading, setError, setVideoId, setUploadProgress]);

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
    uploadVideo
  };
}
