'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipSuggestions } from '@/components/processing/ClipSuggestions';
import { ClipsReadyView, ReadyClip } from '@/components/editor/ClipsReadyView';
import { useUploadStore } from '@/store/uploadStore';
import * as api from '@/lib/api';
import { Clip } from '@/types';

interface ProcessingViewProps {
  videoId: string;
  onClipsReady?: (clips: Clip[]) => void;
}

export function ProcessingView({ videoId, onClipsReady }: ProcessingViewProps) {
  const router = useRouter();
  const { clipCount, projectName } = useUploadStore();
  const [status, setStatus] = useState<'analyzing' | 'generating' | 'creating-clips' | 'ready' | 'error'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [generatedClips, setGeneratedClips] = useState<ReadyClip[]>([]);
  const [steps, setSteps] = useState({
    transcription: false,
    sentiment: false,
    generation: false,
    creation: false
  });

  const createClipsAutomatically = async (suggestedClips: Clip[]) => {
    try {
      const clipsToCreate = suggestedClips.slice(0, clipCount);
      const created: ReadyClip[] = [];
      const failed: number[] = [];

      for (let i = 0; i < clipsToCreate.length; i++) {
        const clip = clipsToCreate[i];
        const clipIndex = i;
        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
          try {
            console.log(`Creating clip ${i + 1}/${clipsToCreate.length} (attempt ${4 - retries})...`);

            const response = await api.createClip({
              videoId,
              clipIndex,
              startTime: clip.startTime,
              endTime: clip.endTime,
              projectName,
              subtitlesEnabled: false,
              subtitleStyle: 'classic',
              subtitlePrimaryColor: '#FFFFFF',
              subtitleSecondaryColor: '#999999',
              subtitlePosition: 'bottom',
              blurEnabled: false,
              blurStrength: 15,
              watermarkType: 'none',
              watermarkPosition: 'bottom-right',
              watermarkSize: 20,
              watermarkOpacity: 80,
              aspectRatio: '1:1', // Use square (less processing) instead of 9:16
              quality: 'low', // Use low quality (1000k bitrate)
              fps: 20 // Lower FPS to reduce memory usage
            });

            if (response.data.success && response.data.clip) {
              created.push({
                id: response.data.clip.id,
                index: clipIndex + 1,
                filename: response.data.clip.filename,
                fileSize: response.data.clip.fileSize,
                duration: response.data.clip.duration
              });
              success = true;
              console.log(`✅ Clip ${i + 1} created successfully`);
            }

            // Update progress
            const clipProgress = ((i + 1) / clipsToCreate.length) * 30;
            setProgress(70 + clipProgress);
          } catch (err: any) {
            retries--;
            if (retries === 0) {
              console.error(`❌ Failed to create clip ${i + 1} after 3 attempts:`, err.message);
              failed.push(i + 1);
            } else {
              console.warn(`⚠️ Clip ${i + 1} attempt failed, retrying (${retries} left)...`);
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        // Add delay between clips to avoid overwhelming the server
        if (i < clipsToCreate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setGeneratedClips(created);
      setSteps(prev => ({ ...prev, creation: true }));

      if (created.length > 0) {
        setStatus('ready');
        setProgress(100);
        if (failed.length > 0) {
          setError(`Created ${created.length} clips, but failed to create clips: ${failed.join(', ')}`);
        }
      } else {
        setStatus('error');
        setError(`Failed to create any clips. Please try again.`);
      }
    } catch (err) {
      console.error('Error creating clips:', err);
      setError('Failed to create clips. Please check your connection and try again.');
      setStatus('error');
    }
  };

  useEffect(() => {
    const analyzeVideo = async () => {
      try {
        // Step 1: Transcription (0-30%)
        const transcriptInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 30) return prev + Math.random() * 8;
            return prev;
          });
        }, 600);

        setTimeout(() => {
          clearInterval(transcriptInterval);
          setProgress(30);
          setSteps(prev => ({ ...prev, transcription: true }));

          // Step 2: Sentiment Analysis (30-70%)
          const sentimentInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev < 70) return prev + Math.random() * 10;
              return prev;
            });
          }, 500);

          setTimeout(() => {
            clearInterval(sentimentInterval);
            setProgress(70);
            setSteps(prev => ({ ...prev, sentiment: true }));
            setStatus('generating');

            // Step 3: Clip Generation (70-100%)
            const generationInterval = setInterval(() => {
              setProgress((prev) => {
                if (prev < 99) return prev + Math.random() * 5;
                return prev;
              });
            }, 700);

            setTimeout(() => {
              clearInterval(generationInterval);
              setProgress(70);
              setSteps(prev => ({ ...prev, generation: true }));
              setStatus('creating-clips');

              // Mock clips
              const mockClips: Clip[] = [
                { id: 1, startTime: 10, endTime: 40, duration: 30, sentiment: 'high' },
                { id: 2, startTime: 60, endTime: 90, duration: 30, sentiment: 'high' },
                { id: 3, startTime: 120, endTime: 150, duration: 30, sentiment: 'medium' },
                { id: 4, startTime: 200, endTime: 230, duration: 30, sentiment: 'high' },
                { id: 5, startTime: 280, endTime: 310, duration: 30, sentiment: 'medium' },
                { id: 6, startTime: 350, endTime: 380, duration: 30, sentiment: 'high' },
                { id: 7, startTime: 420, endTime: 450, duration: 30, sentiment: 'medium' },
                { id: 8, startTime: 500, endTime: 530, duration: 30, sentiment: 'high' },
                { id: 9, startTime: 600, endTime: 630, duration: 30, sentiment: 'high' },
                { id: 10, startTime: 700, endTime: 730, duration: 30, sentiment: 'medium' }
              ];
              setClips(mockClips);
              if (onClipsReady) {
                onClipsReady(mockClips);
              }

              // Auto-create clips based on clipCount
              setStatus('creating-clips');
              createClipsAutomatically(mockClips);
            }, 2000);
          }, 3500);
        }, 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
        setStatus('error');
      }
    };

    analyzeVideo();
  }, [videoId, onClipsReady]);

  const handleSelectClip = (clip: Clip) => {
    const params = new URLSearchParams({
      start: String(clip.startTime),
      end: String(clip.endTime)
    });
    window.location.href = `/editor?${params.toString()}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {(status === 'analyzing' || status === 'generating' || status === 'creating-clips') && (
        <>
          <div className="text-center mb-12">
            <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
            <h1 className="text-3xl font-bold mb-2">
              {status === 'analyzing' ? 'Analyzing Your Video' : status === 'generating' ? 'Generating Clips' : 'Creating Clips'}
            </h1>
            <p className="text-gray-600 mb-8">
              {status === 'analyzing'
                ? 'Our AI is analyzing your video for high-engagement moments...'
                : status === 'generating' ? 'Creating suggested clips based on sentiment analysis...' : `Creating ${clipCount} video clips...`}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-black h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500">{Math.round(progress)}% complete</p>
          </div>

          {/* Step Checklist */}
          <div className="space-y-3">
            <div className={`p-4 border rounded-lg flex items-center gap-3 transition ${
              steps.transcription ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}>
              {steps.transcription ? (
                <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">Speech Transcription</p>
                <p className="text-xs text-gray-600">Converting audio to text</p>
              </div>
              {steps.transcription && <span className="text-xs text-gray-500">Complete</span>}
            </div>

            <div className={`p-4 border rounded-lg flex items-center gap-3 transition ${
              steps.sentiment ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}>
              {steps.sentiment ? (
                <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
              ) : status === 'analyzing' ? (
                <div className="w-5 h-5 flex-shrink-0 text-gray-300">
                  <Brain className="w-5 h-5" />
                </div>
              ) : (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">Sentiment Analysis</p>
                <p className="text-xs text-gray-600">Identifying engagement levels</p>
              </div>
              {steps.sentiment && <span className="text-xs text-gray-500">Complete</span>}
            </div>

            <div className={`p-4 border rounded-lg flex items-center gap-3 transition ${
              steps.generation ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}>
              {steps.generation ? (
                <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
              ) : status === 'generating' ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 flex-shrink-0 text-gray-300">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">Clip Generation</p>
                <p className="text-xs text-gray-600">Creating suggested clips</p>
              </div>
              {steps.generation && <span className="text-xs text-gray-500">Complete</span>}
            </div>

            <div className={`p-4 border rounded-lg flex items-center gap-3 transition ${
              steps.creation ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}>
              {steps.creation ? (
                <CheckCircle2 className="w-5 h-5 text-black flex-shrink-0" />
              ) : status === 'creating-clips' ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 flex-shrink-0 text-gray-300">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">Clips Creation</p>
                <p className="text-xs text-gray-600">Creating {clipCount} video clips</p>
              </div>
              {steps.creation && <span className="text-xs text-gray-500">Complete</span>}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold mb-2">💡 Tip</p>
            <p className="text-sm text-gray-600">
              Higher engagement clips are marked with ⭐ High. These are moments where the sentiment analysis detected increased activity or impact.
            </p>
          </div>
        </>
      )}

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

                // Add delay between downloads to prevent browser blocking
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error(`Failed to download clip ${clip.id}:`, error);
                setError(`Failed to download clip ${clip.index}`);
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
              console.error(`Failed to download clip ${clipId}:`, error);
              setError(`Failed to download the clip. Please try again.`);
            }
          }}
          onEdit={(clipId, index) => {
            // Find the clip to get its timing
            const clip = generatedClips.find(c => c.id === clipId);
            if (clip) {
              // For now, just go back to edit for re-customization
              router.push(`/editor?clipId=${clipId}`);
            }
          }}
        />
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-600" />
          <h1 className="text-3xl font-bold mb-2 text-center">Analysis Failed</h1>
          <p className="text-gray-600 mb-8 text-center">{error || 'Something went wrong during analysis.'}</p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/upload'}
              className="bg-black text-white hover:bg-gray-800"
            >
              Upload Another Video
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="border border-black text-black hover:bg-gray-50"
            >
              Try Again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
