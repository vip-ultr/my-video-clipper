'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipsReadyView, ReadyClip } from '@/components/editor/ClipsReadyView';
import { ClipSelectionModal } from '@/components/modals/ClipSelectionModal';
import { DownloadPathModal } from '@/components/modals/DownloadPathModal';
import { useUploadStore } from '@/store/uploadStore';
import * as api from '@/lib/api';

interface ProcessingViewProps {
  videoId: string;
}

interface ClipSuggestion {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  engagementScore: number;
  reason: string;
}

export function ProcessingView({ videoId }: ProcessingViewProps) {
  const router = useRouter();
  const { clipCount, projectName, clipDuration, clippingMode: storeClippingMode = 'manual-slicing' } = useUploadStore();

  const clippingMode = storeClippingMode === 'ai-detection' ? 'AI' : 'MANUAL';
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'selecting' | 'downloading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clipSuggestions, setClipSuggestions] = useState<ClipSuggestion[]>([]);
  const [generatedClips, setGeneratedClips] = useState<ReadyClip[]>([]);
  const [steps, setSteps] = useState({ generation: false, selection: false, download: false });
  const [showClipSelectionModal, setShowClipSelectionModal] = useState(false);
  const [showDownloadPathModal, setShowDownloadPathModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipSuggestion | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const getErrorMessage = (err: unknown, fallback: string) => err instanceof Error ? err.message : fallback;

  const handleGenerateClips = async () => {
    setStatus('analyzing');
    setProgress(0);
    setError(null);

    try {
      const generationInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 80) return prev + Math.random() * 15;
          return prev;
        });
      }, 500);

      try {
        const response = await api.generateClips(videoId, {
          clippingMode: clippingMode || 'MANUAL',
          clipCount: clipCount || 3,
          clipDuration: clipDuration || undefined
        });

        clearInterval(generationInterval);

        if (response.data.success && response.data.clips) {
          setClipSuggestions(response.data.clips);
          setProgress(100);
          setSteps(prev => ({ ...prev, generation: true }));
          setStatus('selecting');
          setShowClipSelectionModal(true);
        } else {
          throw new Error('Failed to generate clips');
        }
      } catch (err) {
        clearInterval(generationInterval);
        setError(getErrorMessage(err, 'Failed to generate clips'));
        setStatus('error');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Generation failed'));
      setStatus('error');
    }
  };

  const handleClipSelection = (clip: ClipSuggestion) => {
    setSelectedClip(clip);
    setShowClipSelectionModal(false);
    setSteps(prev => ({ ...prev, selection: true }));
    setShowDownloadPathModal(true);
  };

  const handleDownloadNow = async () => {
    if (!selectedClip) return;

    setIsDownloading(true);
    setStatus('downloading');

    try {
      const response = await api.quickDownloadClip(selectedClip.id);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-clip-${selectedClip.index}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowDownloadPathModal(false);
      setSteps(prev => ({ ...prev, download: true }));
      setSelectedClip(null);
      setStatus('selecting');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to download clip. Please try again.'));
      setStatus('error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditFirst = () => {
    if (!selectedClip) return;
    setShowDownloadPathModal(false);
    const params = new URLSearchParams({
      start: String(selectedClip.startTime),
      end: String(selectedClip.endTime),
      clipId: selectedClip.id,
      clipIndex: String(selectedClip.index)
    });
    router.push(`/editor?${params.toString()}`);
  };

  const handleCloseSelectionModal = () => {
    setShowClipSelectionModal(false);
    if (generatedClips.length > 0) {
      setStatus('ready');
    } else {
      setStatus('idle');
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Idle — wait for user to start */}
      {status === 'idle' && (
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-6 text-black" />
          <h1 className="text-3xl font-bold mb-2">Ready to Generate Clips</h1>
          <p className="text-gray-600 mb-8">
            {clipCount} clip{clipCount !== 1 ? 's' : ''} will be created using{' '}
            {clippingMode === 'MANUAL' ? 'manual division' : 'AI sentiment analysis'}.
          </p>
          <Button
            onClick={handleGenerateClips}
            className="bg-black text-white hover:bg-gray-800 text-lg h-12 px-8"
          >
            Generate Clips
          </Button>
        </div>
      )}

      {/* Analyzing */}
      {(status === 'analyzing' || status === 'selecting') && !showClipSelectionModal && !showDownloadPathModal && (
        <>
          <div className="text-center mb-12">
            <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
            <h1 className="text-3xl font-bold mb-2">
              {status === 'analyzing' ? 'Generating Clips' : 'Select a Clip'}
            </h1>
            <p className="text-gray-600 mb-8">
              {status === 'analyzing'
                ? `Creating ${clipCount} clips using ${clippingMode === 'MANUAL' ? 'manual division' : 'AI sentiment analysis'}...`
                : 'Choose a clip to download or edit'
              }
            </p>
          </div>

          {status === 'analyzing' && (
            <>
              <div className="mb-8">
                <div className="bg-gray-100 rounded-full h-2 mb-4">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500">{Math.round(progress)}% complete</p>
              </div>

              <div className="space-y-3">
                <div className={`p-4 border rounded-lg flex items-center gap-3 transition ${
                  steps.generation ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}>
                  {steps.generation ? (
                    <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Clip Generation</p>
                    <p className="text-xs text-gray-600">
                      {clippingMode === 'MANUAL' ? 'Dividing video into equal segments' : 'Analyzing for high-engagement moments'}
                    </p>
                  </div>
                  {steps.generation && <span className="text-xs text-gray-500">Complete</span>}
                </div>

                <div className={`p-4 border rounded-lg flex items-center gap-3 transition ${
                  steps.selection ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}>
                  {steps.selection ? (
                    <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 flex-shrink-0 text-gray-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Clip Selection</p>
                    <p className="text-xs text-gray-600">Choose a clip to download</p>
                  </div>
                  {steps.selection && <span className="text-xs text-gray-500">Complete</span>}
                </div>

                {steps.download && (
                  <div className="p-4 border rounded-lg flex items-center gap-3 transition border-black bg-gray-50">
                    <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Download Complete</p>
                      <p className="text-xs text-gray-600">Clip downloaded successfully</p>
                    </div>
                    <span className="text-xs text-gray-500">Complete</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* After generation succeeds, show button to open clip selection */}
          {status === 'selecting' && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setShowClipSelectionModal(true)}
                className="bg-black text-white hover:bg-gray-800 text-lg h-12 px-8"
              >
                Select a Clip
              </Button>
            </div>
          )}
        </>
      )}

      {/* Downloading */}
      {status === 'downloading' && (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
          <h1 className="text-3xl font-bold mb-2">Downloading Clip</h1>
          <p className="text-gray-600">Your clip is being prepared...</p>
        </div>
      )}

      {/* Ready */}
      {status === 'ready' && generatedClips.length > 0 && (
        <ClipsReadyView
          clips={generatedClips}
          projectName={projectName}
          onDownloadAll={async () => {
            for (const clip of generatedClips) {
              try {
                const response = await api.downloadClip(clip.id);
                const url = window.URL.createObjectURL(response.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = clip.filename || `clip-${clip.id}.mp4`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                setError(`Failed to download clip ${clip.index}: ${getErrorMessage(error, 'Unknown error')}`);
              }
            }
          }}
          onDownload={async (clipId) => {
            try {
              const clip = generatedClips.find(c => c.id === clipId);
              const response = await api.downloadClip(clipId);
              const url = window.URL.createObjectURL(response.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = clip?.filename || `clip-${clipId}.mp4`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              setError(`Failed to download the clip: ${getErrorMessage(error, 'Unknown error')}`);
            }
          }}
          onEdit={(clipId) => {
            router.push(`/editor?clipId=${clipId}`);
          }}
        />
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-600" />
          <h1 className="text-3xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-8">{error || 'Something went wrong.'}</p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/upload')}
              className="bg-black text-white hover:bg-gray-800"
            >
              Upload Another Video
            </Button>
            <Button
              onClick={() => { setStatus('idle'); setError(null); setProgress(0); }}
              className="border border-black text-black hover:bg-gray-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showClipSelectionModal && (
        <ClipSelectionModal
          clips={clipSuggestions}
          mode={clippingMode as 'MANUAL' | 'AI'}
          projectName={projectName}
          onSelect={handleClipSelection}
          onCancel={handleCloseSelectionModal}
          isLoading={isDownloading}
        />
      )}

      {showDownloadPathModal && selectedClip && (
        <DownloadPathModal
          clip={{
            id: selectedClip.id,
            index: selectedClip.index,
            filename: `${projectName}-clip-${selectedClip.index}.mp4`,
            fileSize: 0,
            duration: selectedClip.duration
          }}
          onDownloadNow={handleDownloadNow}
          onEditFirst={handleEditFirst}
          onCancel={() => {
            setShowDownloadPathModal(false);
            setSelectedClip(null);
            setShowClipSelectionModal(true);
          }}
          isDownloading={isDownloading}
        />
      )}
    </div>
  );
}
