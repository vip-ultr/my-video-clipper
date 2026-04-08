'use client';

import { useCallback, useRef } from 'react';
import { useUploadStore } from '@/store/uploadStore';
import * as api from '@/lib/api';

export function useUpload() {
  const {
    videoFile,
    projectName,
    clippingMode,
    clipCount,
    clipDuration,
    clipStartTimes,
    videoId,
    isUploading,
    uploadProgress,
    error,
    setVideoFile,
    setProjectName,
    setClippingMode,
    setClipCount,
    setClipDuration,
    setClipStartTimes,
    setVideoId,
    setIsUploading,
    setUploadProgress,
    setError
  } = useUploadStore();

  const abortRef = useRef<AbortController | null>(null);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const uploadVideo = useCallback(async () => {
    if (!videoFile || !projectName.trim()) {
      setError('Please select a video and enter a project name');
      return false;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsUploading(true);
      setError(null);

      const backendClippingMode = clippingMode === 'ai-detection' ? 'AI' : 'MANUAL';

      const response = await api.uploadVideo(
        videoFile,
        projectName,
        backendClippingMode,
        clipCount,
        (percent) => setUploadProgress(percent),
        controller.signal
      );

      if (response.data.success) {
        setVideoId(response.data.videoId);
        setUploadProgress(100);
        return true;
      } else {
        setError(response.data.error || 'Upload failed');
        return false;
      }
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError') {
        setError(null); // silent — user cancelled
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
      return false;
    } finally {
      abortRef.current = null;
      setIsUploading(false);
    }
  }, [videoFile, projectName, clippingMode, clipCount, setIsUploading, setError, setVideoId, setUploadProgress]);

  return {
    videoFile,
    projectName,
    clippingMode,
    clipCount,
    clipDuration,
    clipStartTimes,
    videoId,
    isUploading,
    uploadProgress,
    error,
    setVideoFile,
    setProjectName,
    setClippingMode,
    setClipCount,
    setClipDuration,
    setClipStartTimes,
    uploadVideo,
    cancelUpload,
  };
}
