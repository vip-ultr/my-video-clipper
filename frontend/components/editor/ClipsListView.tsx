'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Edit2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipItem } from '@/store/uploadStore';
import * as api from '@/lib/api';
import { downloadFile } from '@/lib/utils';

interface ClipsListViewProps {
  clips: ClipItem[];
  projectName: string;
  videoId: string;
}

type ClipDownloadState = { status: 'idle' | 'downloading' | 'done' | 'error'; progress: number };

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}


export function ClipsListView({ clips, projectName, videoId }: ClipsListViewProps) {
  const router = useRouter();

  const [clipStates, setClipStates] = useState<Record<string, ClipDownloadState>>(
    () => Object.fromEntries(clips.map(c => [c.id, { status: 'idle', progress: 0 }]))
  );

  const [downloadAllState, setDownloadAllState] = useState<{
    active: boolean; done: number; total: number; progress: number;
  }>({ active: false, done: 0, total: 0, progress: 0 });

  const setClipState = (id: string, patch: Partial<ClipDownloadState>) =>
    setClipStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleDownload = async (clip: ClipItem) => {
    setClipState(clip.id, { status: 'downloading', progress: 0 });
    try {
      const response = await api.quickDownloadClip(clip.id, (pct) =>
        setClipState(clip.id, { progress: pct })
      );
      await downloadFile(response.data, `${projectName}-clip-${clip.index + 1}.mp4`);
      setClipState(clip.id, { status: 'done', progress: 100 });
    } catch {
      setClipState(clip.id, { status: 'error', progress: 0 });
    }
  };

  const handleDownloadAll = async () => {
    setDownloadAllState({ active: true, done: 0, total: clips.length, progress: 0 });
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      setClipState(clip.id, { status: 'downloading', progress: 0 });
      try {
        const response = await api.quickDownloadClip(clip.id, (pct) => {
          setClipState(clip.id, { progress: pct });
          const overall = Math.round(((i + pct / 100) / clips.length) * 100);
          setDownloadAllState(prev => ({ ...prev, progress: overall }));
        });
        await downloadFile(response.data, `${projectName}-clip-${clip.index + 1}.mp4`);
        setClipState(clip.id, { status: 'done', progress: 100 });
        setDownloadAllState(prev => ({ ...prev, done: i + 1, progress: Math.round(((i + 1) / clips.length) * 100) }));
      } catch {
        setClipState(clip.id, { status: 'error', progress: 0 });
      }
    }
    setDownloadAllState(prev => ({ ...prev, active: false }));
  };

  const handleEditAll = () => {
    router.push(`/editor?editAll=true&videoId=${videoId}`);
  };

  const handleEdit = (clip: ClipItem) => {
    const params = new URLSearchParams({
      clipId: clip.id,
      start: String(clip.startTime),
      end: String(clip.endTime),
      clipIndex: String(clip.index),
    });
    router.push(`/editor?${params.toString()}`);
  };

  const allDone = clips.every(c => clipStates[c.id]?.status === 'done');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-black" />
        <h1 className="text-3xl font-bold mb-2">{clips.length} Clip{clips.length !== 1 ? 's' : ''} Ready</h1>
        <p className="text-gray-600">"{projectName}"</p>
      </div>

      {/* Clips */}
      <div className="space-y-3 mb-10">
        {clips.map((clip) => {
          const state = clipStates[clip.id] ?? { status: 'idle', progress: 0 };
          const isDownloading = state.status === 'downloading';
          const isDone = state.status === 'done';

          return (
            <div key={clip.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                {/* Clip info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Clip {clip.index + 1}</p>
                  <p className="text-sm text-gray-500">
                    {formatTime(clip.startTime)} → {formatTime(clip.endTime)} · {clip.duration}s
                    {clip.engagementScore > 0.5 && (
                      <span className="ml-2 text-xs text-gray-400">({(clip.engagementScore * 100).toFixed(0)}% engagement)</span>
                    )}
                  </p>
                  {/* Per-clip download progress bar */}
                  {isDownloading && (
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-black h-full rounded-full transition-all duration-200" style={{ width: `${state.progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(clip)}
                    disabled={isDownloading || downloadAllState.active}
                    className={`${isDone ? 'bg-gray-700' : 'bg-black'} text-white hover:bg-gray-800 disabled:opacity-50 min-w-[100px]`}
                  >
                    {isDownloading ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{state.progress}%</>
                    ) : isDone ? (
                      <><CheckCircle className="w-3.5 h-3.5 mr-1" />Downloaded</>
                    ) : (
                      <><Download className="w-3.5 h-3.5 mr-1" />Download</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(clip)}
                    disabled={downloadAllState.active}
                    className="border-gray-300 hover:border-black"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Download All progress bar */}
      {downloadAllState.active && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Downloading all clips...</span>
            <span className="text-gray-500">{downloadAllState.done}/{downloadAllState.total}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-black h-full rounded-full transition-all duration-200" style={{ width: `${downloadAllState.progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Keep this page open — your browser will prompt for each file.</p>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleDownloadAll}
          disabled={downloadAllState.active || allDone}
          className="flex-1 bg-black text-white hover:bg-gray-800 h-12 text-base disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          {allDone ? 'All Downloaded' : 'Download All'}
        </Button>
        <Button
          onClick={handleEditAll}
          variant="outline"
          disabled={downloadAllState.active}
          className="flex-1 border-black text-black hover:bg-gray-50 h-12 text-base"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit All
        </Button>
      </div>
    </div>
  );
}
