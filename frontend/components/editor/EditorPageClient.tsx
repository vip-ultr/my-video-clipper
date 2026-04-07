'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor } from '@/hooks/useEditor';
import { useUploadStore, ClipItem } from '@/store/uploadStore';
import * as api from '@/lib/api';
import { ScreenSizeSelector } from '@/components/editor/ScreenSizeSelector';
import { SubtitleEditor } from '@/components/editor/SubtitleEditor';
import { BlurControl } from '@/components/editor/BlurControl';
import { WatermarkSelector } from '@/components/editor/WatermarkSelector';
import { QualityFpsSelector } from '@/components/editor/QualityFpsSelector';
import { VideoPreview } from '@/components/editor/VideoPreview';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/utils';
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Edit-All progress view ─────────────────────────────────────────────────

interface EditedClip { id: string; index: number; filename: string }

function EditAllResults({ clips, projectName }: { clips: EditedClip[]; projectName: string }) {
  const [states, setStates] = useState<Record<string, { progress: number; done: boolean; error: boolean }>>(
    () => Object.fromEntries(clips.map(c => [c.id, { progress: 0, done: false, error: false }]))
  );
  const [downloadAllState, setDownloadAllState] = useState<{ active: boolean; done: number; total: number; progress: number }>(
    { active: false, done: 0, total: 0, progress: 0 }
  );

  const setState = (id: string, patch: Partial<typeof states[string]>) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleDownload = async (clip: EditedClip) => {
    setState(clip.id, { progress: 0, done: false, error: false });
    try {
      const response = await api.downloadClip(clip.id, (pct) => setState(clip.id, { progress: pct }));
      await downloadFile(response.data, clip.filename);
      setState(clip.id, { done: true, progress: 100 });
    } catch {
      setState(clip.id, { error: true });
    }
  };

  const handleDownloadAll = async () => {
    setDownloadAllState({ active: true, done: 0, total: clips.length, progress: 0 });
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      setState(clip.id, { progress: 0, done: false, error: false });
      try {
        const response = await api.downloadClip(clip.id, (pct) => {
          setState(clip.id, { progress: pct });
          setDownloadAllState(prev => ({ ...prev, progress: Math.round(((i + pct / 100) / clips.length) * 100) }));
        });
        await downloadFile(response.data, clip.filename);
        setState(clip.id, { done: true, progress: 100 });
        setDownloadAllState(prev => ({ ...prev, done: i + 1, progress: Math.round(((i + 1) / clips.length) * 100) }));
      } catch {
        setState(clip.id, { error: true });
      }
    }
    setDownloadAllState(prev => ({ ...prev, active: false }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-black" />
        <h1 className="text-3xl font-bold mb-2">Editing Complete</h1>
        <p className="text-gray-600">{clips.length} clip{clips.length !== 1 ? 's' : ''} processed for "{projectName}"</p>
      </div>

      <div className="space-y-3 mb-10">
        {clips.map((clip) => {
          const s = states[clip.id];
          return (
            <div key={clip.id} className="p-4 border border-gray-200 rounded-lg flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Clip {clip.index + 1}</p>
                <p className="text-sm text-gray-500 truncate">{clip.filename}</p>
                {s.progress > 0 && !s.done && (
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-black h-full rounded-full transition-all duration-200" style={{ width: `${s.progress}%` }} />
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleDownload(clip)}
                disabled={downloadAllState.active}
                className={`${s.done ? 'bg-gray-700' : 'bg-black'} text-white hover:bg-gray-800 min-w-[100px]`}
              >
                {s.error ? (
                  <><AlertCircle className="w-3.5 h-3.5 mr-1" />Retry</>
                ) : s.done ? (
                  <><CheckCircle className="w-3.5 h-3.5 mr-1" />Downloaded</>
                ) : s.progress > 0 ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{s.progress}%</>
                ) : (
                  <><Download className="w-3.5 h-3.5 mr-1" />Download</>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {downloadAllState.active && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Downloading edited clips...</span>
            <span className="text-gray-500">{downloadAllState.done}/{downloadAllState.total}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-black h-full rounded-full transition-all duration-200" style={{ width: `${downloadAllState.progress}%` }} />
          </div>
        </div>
      )}

      <Button
        onClick={handleDownloadAll}
        disabled={downloadAllState.active}
        className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base"
      >
        <Download className="w-4 h-4 mr-2" />
        Download All
      </Button>
    </div>
  );
}

// ─── Main editor content ─────────────────────────────────────────────────────

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { projectName, videoId: storeVideoId, clipDuration, generatedClips } = useUploadStore();

  const {
    aspectRatio, quality, fps,
    subtitlesEnabled, subtitleStyle, subtitlePrimaryColor, subtitleSecondaryColor, subtitlePosition,
    blurEnabled, blurStrength,
    watermarkType, watermarkId, watermarkPosition, watermarkSize, watermarkOpacity,
    isProcessing, error,
    setAspectRatio, setQuality, setFps,
    setSubtitlesEnabled, setSubtitleStyle, setSubtitlePrimaryColor, setSubtitleSecondaryColor, setSubtitlePosition,
    setBlurEnabled, setBlurStrength,
    setWatermarkType, setWatermarkId, setWatermarkPosition, setWatermarkSize, setWatermarkOpacity,
    createClip
  } = useEditor();

  const isEditAll = searchParams.get('editAll') === 'true';
  const queryVideoId = searchParams.get('videoId') || storeVideoId || '';
  const videoId = queryVideoId;

  // Single clip params
  const startTime = parseFloat(searchParams.get('start') || '0');
  const endTime = parseFloat(searchParams.get('end') || String(clipDuration));
  const clipIndex = parseInt(searchParams.get('clipIndex') || '0', 10);

  // Edit-all state
  const [editAllStatus, setEditAllStatus] = useState<'settings' | 'processing' | 'done'>('settings');
  const [editAllProgress, setEditAllProgress] = useState({ done: 0, total: 0 });
  const [editedClips, setEditedClips] = useState<EditedClip[]>([]);
  const [editAllError, setEditAllError] = useState<string | null>(null);

  // Single clip state
  const [singleClipResult, setSingleClipResult] = useState<{ clipId: string; filename: string } | null>(null);
  const [singleDownloadProgress, setSingleDownloadProgress] = useState(0);
  const [singleDownloading, setSingleDownloading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) router.push('/upload');
  }, [videoId, router]);

  // ── Single clip: create ──────────────────────────────────────────────────
  const handleCreateSingle = async () => {
    if (!videoId) return;
    setSingleError(null);
    const result = await createClip(videoId, startTime, endTime, clipIndex, projectName, clipIndex > 0);
    if (result?.clip) {
      setSingleClipResult({ clipId: result.clip.id, filename: result.clip.filename });
    }
  };

  const handleDownloadSingle = async () => {
    if (!singleClipResult) return;
    setSingleDownloading(true);
    setSingleDownloadProgress(0);
    setSingleError(null);
    try {
      const response = await api.downloadClip(singleClipResult.clipId, setSingleDownloadProgress);
      await downloadFile(response.data, singleClipResult.filename || `clip-${singleClipResult.clipId}.mp4`);
      setSingleDownloadProgress(100);
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setSingleDownloading(false);
    }
  };

  // ── Edit all: process ────────────────────────────────────────────────────
  const handleStartEditAll = async () => {
    const clips: ClipItem[] = generatedClips;
    if (!clips.length || !videoId) return;

    setEditAllStatus('processing');
    setEditAllProgress({ done: 0, total: clips.length });
    setEditAllError(null);

    const results: EditedClip[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const result = await createClip(videoId, clip.startTime, clip.endTime, clip.index, projectName, true);
      if (result?.clip) {
        results.push({ id: result.clip.id, index: clip.index, filename: result.clip.filename || `${projectName}-clip-${clip.index + 1}.mp4` });
      }
      setEditAllProgress({ done: i + 1, total: clips.length });
    }

    if (results.length === 0) {
      setEditAllError('No clips were successfully processed.');
      setEditAllStatus('settings');
      return;
    }

    setEditedClips(results);
    setEditAllStatus('done');
  };

  // ── After single clip created: download screen ───────────────────────────
  if (!isEditAll && singleClipResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-black" />
          <h1 className="text-3xl font-bold mb-2">Clip Ready</h1>
          <p className="text-gray-500">{singleClipResult.filename}</p>
        </div>

        {singleDownloadProgress > 0 && singleDownloadProgress < 100 && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Downloading...</span>
              <span>{singleDownloadProgress}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-black h-full rounded-full transition-all duration-200" style={{ width: `${singleDownloadProgress}%` }} />
            </div>
          </div>
        )}

        {singleError && <p className="mb-4 text-red-600 text-sm text-center">{singleError}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadSingle}
            disabled={singleDownloading}
            className="flex-1 bg-black text-white hover:bg-gray-800 h-12 text-base"
          >
            {singleDownloading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Downloading {singleDownloadProgress}%</>
              : <><Download className="w-4 h-4 mr-2" />Download Clip</>}
          </Button>
          <Button
            variant="outline"
            onClick={() => { setSingleClipResult(null); setSingleDownloadProgress(0); }}
            className="flex-1 border-black text-black h-12 text-base"
          >
            Edit Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Edit All: done ───────────────────────────────────────────────────────
  if (isEditAll && editAllStatus === 'done') {
    return <EditAllResults clips={editedClips} projectName={projectName} />;
  }

  // ── Edit All: processing ─────────────────────────────────────────────────
  if (isEditAll && editAllStatus === 'processing') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
        <h1 className="text-3xl font-bold mb-2">Editing Clips</h1>
        <p className="text-gray-600 mb-8">
          Processing clip {editAllProgress.done + 1} of {editAllProgress.total}...
        </p>
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-black h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round((editAllProgress.done / editAllProgress.total) * 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          {Math.round((editAllProgress.done / editAllProgress.total) * 100)}% complete
        </p>
      </div>
    );
  }

  // ── Settings panel (single or edit-all) ──────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">
        {isEditAll ? 'Edit All Clips' : 'Edit Clip'}
      </h1>
      {isEditAll && (
        <p className="text-gray-500 mb-8">
          Set your preferences below — these settings will apply to all {generatedClips.length} clips.
        </p>
      )}

      {(error || editAllError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error || editAllError}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {!isEditAll && (
          <div className="lg:col-span-2">
            <VideoPreview aspectRatio={aspectRatio} quality={quality} fps={fps} />
          </div>
        )}

        <div className={isEditAll ? 'lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          <ScreenSizeSelector value={aspectRatio} onChange={setAspectRatio} />
          <QualityFpsSelector quality={quality} onQualityChange={setQuality} fps={fps} onFpsChange={setFps} />
          <SubtitleEditor
            enabled={subtitlesEnabled} onEnabledChange={setSubtitlesEnabled}
            style={subtitleStyle} onStyleChange={setSubtitleStyle}
            primaryColor={subtitlePrimaryColor} onPrimaryColorChange={setSubtitlePrimaryColor}
            secondaryColor={subtitleSecondaryColor} onSecondaryColorChange={setSubtitleSecondaryColor}
            position={subtitlePosition} onPositionChange={setSubtitlePosition}
          />
          <BlurControl enabled={blurEnabled} onEnabledChange={setBlurEnabled} strength={blurStrength} onStrengthChange={setBlurStrength} />
          <WatermarkSelector
            watermarkType={watermarkType} onWatermarkTypeChange={setWatermarkType}
            watermarkId={watermarkId} onWatermarkIdChange={setWatermarkId}
            watermarkPosition={watermarkPosition} onWatermarkPositionChange={setWatermarkPosition}
            watermarkSize={watermarkSize} onWatermarkSizeChange={setWatermarkSize}
            watermarkOpacity={watermarkOpacity} onWatermarkOpacityChange={setWatermarkOpacity}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        {isEditAll ? (
          <Button
            onClick={handleStartEditAll}
            disabled={isProcessing || !videoId || !generatedClips.length}
            className="bg-black text-white hover:bg-gray-800 h-12 px-10 text-lg"
          >
            {isProcessing
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              : `Start Edit (${generatedClips.length} clips)`}
          </Button>
        ) : (
          <Button
            onClick={handleCreateSingle}
            disabled={isProcessing || !videoId}
            className="bg-black text-white hover:bg-gray-800 h-12 px-10 text-lg"
          >
            {isProcessing
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              : 'Process Clip'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>}>
      <EditorContent />
    </Suspense>
  );
}
