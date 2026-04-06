'use client';

import { useState, useCallback } from 'react';
import * as api from '@/lib/api';

export interface ProcessingStatus {
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
}

export function useProcessing() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatus = useCallback(async (videoId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.getProcessingStatus(videoId);

      if (response.data.success) {
        setStatus(response.data.status);
        return response.data.status;
      } else {
        setError(response.data.error || 'Failed to get status');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get status';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAnalysis = useCallback(async (videoId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.startAnalysis(videoId);

      if (response.data.success) {
        return response.data.analysis;
      } else {
        setError(response.data.error || 'Analysis failed');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    getStatus,
    startAnalysis
  };
}
