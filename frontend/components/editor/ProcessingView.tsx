'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipsListView } from '@/components/editor/ClipsListView';
import { useUploadStore, ClipItem } from '@/store/uploadStore';
import * as api from '@/lib/api';

interface ProcessingViewProps {
  videoId: string;
}

export function ProcessingView({ videoId }: ProcessingViewProps) {
  const router = useRouter();
  const { clipCount, projectName, clipDuration, clipStartTimes, clippingMode: storeClippingMode = 'manual-slicing', setGeneratedClips } = useUploadStore();

  const clippingMode = storeClippingMode === 'ai-detection' ? 'AI' : 'MANUAL';
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const getErrorMessage = (err: unknown, fallback: string) => err instanceof Error ? err.message : fallback;

  const handleGenerateClips = async () => {
    setStatus('analyzing');
    setProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setProgress((prev) => prev < 80 ? prev + Math.random() * 15 : prev);
    }, 500);

    try {
      const response = await api.generateClips(videoId, {
        clippingMode,
        clipCount: clipCount || 3,
        clipDuration: clipDuration || undefined,
        customStartTimes: clippingMode === 'MANUAL' && clipStartTimes.length > 0 ? clipStartTimes : undefined
      });

      clearInterval(interval);

      if (response.data.success && response.data.clips) {
        const result: ClipItem[] = response.data.clips;
        setClips(result);
        setGeneratedClips(result);
        setProgress(100);
        setStatus('ready');
      } else {
        throw new Error('Failed to generate clips');
      }
    } catch (err) {
      clearInterval(interval);
      setError(getErrorMessage(err, 'Failed to generate clips'));
      setStatus('error');
    }
  };

  // --- Idle ---
  if (status === 'idle') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Sparkles className="w-16 h-16 mx-auto mb-6 text-black" />
        <h1 className="text-3xl font-bold mb-2">Ready to Generate Clips</h1>
        <p className="text-gray-600 mb-8">
          {clipCount} clip{clipCount !== 1 ? 's' : ''} will be created using{' '}
          {clippingMode === 'MANUAL' ? 'manual slicing' : 'AI sentiment analysis'}.
        </p>
        <Button onClick={handleGenerateClips} className="bg-black text-white hover:bg-gray-800 text-lg h-12 px-8">
          Generate Clips
        </Button>
      </div>
    );
  }

  // --- Analyzing ---
  if (status === 'analyzing') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
          <h1 className="text-3xl font-bold mb-2">Generating Clips</h1>
          <p className="text-gray-600">
            Creating {clipCount} clips using {clippingMode === 'MANUAL' ? 'manual slicing' : 'AI sentiment analysis'}...
          </p>
        </div>
        <div className="mb-4 bg-gray-100 rounded-full h-2">
          <div className="bg-black h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-center text-sm text-gray-500">{Math.round(progress)}% complete</p>
      </div>
    );
  }

  // --- Ready: show clips list ---
  if (status === 'ready') {
    return (
      <ClipsListView
        clips={clips}
        projectName={projectName}
        videoId={videoId}
      />
    );
  }

  // --- Error ---
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-600" />
      <h1 className="text-3xl font-bold mb-2">Error</h1>
      <p className="text-gray-600 mb-8">{error || 'Something went wrong.'}</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => router.push('/upload')} className="bg-black text-white hover:bg-gray-800">
          Upload Another Video
        </Button>
        <Button onClick={() => { setStatus('idle'); setError(null); setProgress(0); }} className="border border-black text-black hover:bg-gray-50">
          Try Again
        </Button>
      </div>
    </div>
  );
}
