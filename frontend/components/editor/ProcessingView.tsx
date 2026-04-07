'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipSuggestions } from '@/components/processing/ClipSuggestions';
import { Clip } from '@/types';

interface ProcessingViewProps {
  videoId: string;
  onClipsReady?: (clips: Clip[]) => void;
}

export function ProcessingView({ videoId, onClipsReady }: ProcessingViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'analyzing' | 'generating' | 'ready' | 'error'>('analyzing');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [steps, setSteps] = useState({
    transcription: false,
    sentiment: false,
    generation: false
  });

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
              setProgress(100);
              setSteps(prev => ({ ...prev, generation: true }));
              setStatus('ready');

              // Mock clips
              const mockClips: Clip[] = [
                { id: 1, startTime: 10, endTime: 40, duration: 30, sentiment: 'high' },
                { id: 2, startTime: 60, endTime: 90, duration: 30, sentiment: 'high' },
                { id: 3, startTime: 120, endTime: 150, duration: 30, sentiment: 'medium' },
                { id: 4, startTime: 200, endTime: 230, duration: 30, sentiment: 'high' },
                { id: 5, startTime: 280, endTime: 310, duration: 30, sentiment: 'medium' }
              ];
              setClips(mockClips);
              if (onClipsReady) {
                onClipsReady(mockClips);
              }
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
    window.location.href = `/editor/new?${params.toString()}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {(status === 'analyzing' || status === 'generating') && (
        <>
          <div className="text-center mb-12">
            <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
            <h1 className="text-3xl font-bold mb-2">
              {status === 'analyzing' ? 'Analyzing Your Video' : 'Generating Clips'}
            </h1>
            <p className="text-gray-600 mb-8">
              {status === 'analyzing'
                ? 'Our AI is analyzing your video for high-engagement moments...'
                : 'Creating suggested clips based on sentiment analysis...'}
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

      {status === 'ready' && clips.length > 0 && (
        <>
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-black" />
            <h1 className="text-3xl font-bold mb-2">Clips Ready!</h1>
            <p className="text-gray-600 mb-8">
              We found {clips.length} moments in your video. Select one to edit and customize.
            </p>
          </div>

          <ClipSuggestions clips={clips} onSelectClip={handleSelectClip} />
        </>
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
