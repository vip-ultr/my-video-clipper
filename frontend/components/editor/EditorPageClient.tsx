'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
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
import { BackButton } from '@/components/ui/BackButton';
import { downloadFile } from '@/lib/utils';
import { Loader2, Download, CheckCircle, AlertCircle, X } from 'lucide-react';

// ─── Edit-All results ────────────────────────────────────────────────────────

interface EditedClip { id: string; index: number; filename: string }

function EditAllResults({ clips, projectName }: { clips: EditedClip[]; projectName: string }) {
  const [states, setStates] = useState<Record<string, { progress: number; done: boolean; error: boolean; downloading: boolean }>>(
    () => Object.fromEntries(clips.map(c => [c.id, { progress: 0, done: false, error: false, downloading: false }]))
  );
  const [downloadAllState, setDownloadAllState] = useState<{ active: boolean; done: number; total: number; progress: number }>(
    { active: false, done: 0, total: 0, progress: 0 }
  );
  const clipAborts = useRef<Record<string, AbortController>>({});
  const allCancelledRef = useRef(false);

  const patchState = (id: string, patch: Partial<typeof states[string]>) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleDownload = async (clip: EditedClip) => {
    clipAborts.current[clip.id]?.abort();
    const controller = new AbortController();
    clipAborts.current[clip.id] = controller;
    patchState(clip.id, { progress: 0, done: false, error: false, downloading: true });
    try {
      const response = await api.downloadClip(clip.id, (pct) => patchState(clip.id, { progress: pct }), controller.signal);
      await downloadFile(response.data, clip.filename);
      patchState(clip.id, { done: true, progress: 100, downloading: false });
    } catch (err: any) {
      const cancelled = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError';
      patchState(clip.id, { error: !cancelled, progress: 0, downloading: false });
    }
  };

  const handleCancelDownload = (clip: EditedClip) => {
    clipAborts.current[clip.id]?.abort();
    patchState(clip.id, { downloading: false, progress: 0 });
  };

  const handleDownloadAll = async () => {
    allCancelledRef.current = false;
    setDownloadAllState({ active: true, done: 0, total: clips.length, progress: 0 });
    for (let i = 0; i < clips.length; i++) {
      if (allCancelledRef.current) break;
      const clip = clips[i];
      const controller = new AbortController();
      clipAborts.current[clip.id] = controller;
      patchState(clip.id, { progress: 0, done: false, error: false, downloading: true });
      try {
        const response = await api.downloadClip(clip.id, (pct) => {
          patchState(clip.id, { progress: pct });
          setDownloadAllState(prev => ({ ...prev, progress: Math.round(((i + pct / 100) / clips.length) * 100) }));
        }, controller.signal);
        await downloadFile(response.data, clip.filename);
        patchState(clip.id, { done: true, progress: 100, downloading: false });
        setDownloadAllState(prev => ({ ...prev, done: i + 1, progress: Math.round(((i + 1) / clips.length) * 100) }));
      } catch (err: any) {
        const cancelled = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError';
        patchState(clip.id, { error: !cancelled, progress: 0, downloading: false });
        if (cancelled) break;
      }
    }
    setDownloadAllState(prev => ({ ...prev, active: false }));
  };

  const handleCancelAll = () => {
    allCancelledRef.current = true;
    Object.values(clipAborts.current).forEach(c => c.abort());
    clipAborts.current = {};
    setDownloadAllState({ active: false, done: 0, total: 0, progress: 0 });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <BackButton href="/processing" label="Back to Clips" />
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
                <p className="font-semibold">Clip {clip.index}</p>
                <p className="text-sm text-gray-500 truncate">{clip.filename}</p>
                {s.downloading && s.progress > 0 && (
                  <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-black h-full rounded-full transition-all duration-200" style={{ width: `${s.progress}%` }} />
                  </div>
                )}
              </div>
              {s.downloading ? (
                <Button size="sm" onClick={() => handleCancelDownload(clip)} className="bg-red-600 text-white hover:bg-red-700 min-w-[100px]">
                  <X className="w-3.5 h-3.5 mr-1" />{s.progress > 0 ? `${s.progress}%` : 'Cancel'}
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleDownload(clip)} disabled={downloadAllState.active}
                  className={`${s.done ? 'bg-gray-700' : 'bg-black'} text-white hover:bg-gray-800 min-w-[100px]`}>
                  {s.error ? <><AlertCircle className="w-3.5 h-3.5 mr-1" />Retry</>
                    : s.done ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Downloaded</>
                    : <><Download className="w-3.5 h-3.5 mr-1" />Download</>}
                </Button>
              )}
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
      {downloadAllState.active ? (
        <Button onClick={handleCancelAll} className="w-full bg-red-600 text-white hover:bg-red-700 h-12 text-base">
          <X className="w-4 h-4 mr-2" />Cancel Downloads
        </Button>
      ) : (
        <Button onClick={handleDownloadAll} className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base">
          <Download className="w-4 h-4 mr-2" />Download All
        </Button>
      )}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
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
    subtitlesEnabled, subtitleStyle, subtitleSize, subtitlePrimaryColor, subtitleOutlineColor, subtitleOutlineEnabled, subtitlePosition, subtitleUppercase,
    blurEnabled, blurStrength,
    watermarkType, watermarkId, watermarkPosition, watermarkSize, watermarkOpacity,
    isProcessing, error,
    setAspectRatio, setQuality, setFps,
    setSubtitlesEnabled, setSubtitleStyle, setSubtitleSize, setSubtitlePrimaryColor, setSubtitleOutlineColor, setSubtitleOutlineEnabled, setSubtitlePosition, setSubtitleUppercase,
    setBlurEnabled, setBlurStrength,
    setWatermarkType, setWatermarkId, setWatermarkPosition, setWatermarkSize, setWatermarkOpacity,
    createClip
  } = useEditor();

  const isEditAll = searchParams.get('editAll') === 'true';
  const queryVideoId = searchParams.get('videoId') || storeVideoId || '';
  const videoId = queryVideoId;

  const startTime = parseFloat(searchParams.get('start') || '0');
  const endTime   = parseFloat(searchParams.get('end') || String(clipDuration));
  const clipIndex = parseInt(searchParams.get('clipIndex') || '0', 10);

  const [editAllStatus, setEditAllStatus]     = useState<'settings' | 'processing' | 'done'>('settings');
  const [editAllProgress, setEditAllProgress] = useState({ done: 0, total: 0 });
  const [editedClips, setEditedClips]         = useState<EditedClip[]>([]);
  const [editAllError, setEditAllError]       = useState<string | null>(null);

  const [singleClipResult, setSingleClipResult]           = useState<{ clipId: string; filename: string } | null>(null);
  const [singleDownloadProgress, setSingleDownloadProgress] = useState(0);
  const [singleDownloading, setSingleDownloading]         = useState(false);
  const [singleError, setSingleError]                     = useState<string | null>(null);
  const singleAbortRef = useRef<AbortController | null>(null);

  useEffect(() => { if (!videoId) router.push('/upload'); }, [videoId, router]);

  // ── Single clip ───────────────────────────────────────────────────────────

  const handleCreateSingle = async () => {
    if (!videoId) return;
    setSingleError(null);
    const result = await createClip(videoId, startTime, endTime, clipIndex, projectName, true);
    if (result?.clip) setSingleClipResult({ clipId: result.clip.id, filename: result.clip.filename });
  };

  const handleDownloadSingle = async () => {
    if (!singleClipResult) return;
    singleAbortRef.current?.abort();
    const controller = new AbortController();
    singleAbortRef.current = controller;
    setSingleDownloading(true);
    setSingleDownloadProgress(0);
    setSingleError(null);
    try {
      const response = await api.downloadClip(
        singleClipResult.clipId,
        (pct) => { if (!controller.signal.aborted) setSingleDownloadProgress(pct); },
        controller.signal
      );
      await downloadFile(response.data, singleClipResult.filename || `clip-${singleClipResult.clipId}.mp4`);
      setSingleDownloadProgress(100);
    } catch (err: any) {
      const cancelled = err?.code === 'ERR_CANCELED' || err?.name === 'AbortError' || err?.name === 'CanceledError';
      if (!cancelled) setSingleError(err instanceof Error ? err.message : 'Download failed');
      setSingleDownloadProgress(0);
    } finally {
      singleAbortRef.current = null;
      setSingleDownloading(false);
    }
  };

  const handleCancelSingleDownload = () => {
    singleAbortRef.current?.abort();
    singleAbortRef.current = null;
    setSingleDownloading(false);
    setSingleDownloadProgress(0);
  };

  // ── Edit all ──────────────────────────────────────────────────────────────

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
      if (result?.clip) results.push({ id: result.clip.id, index: clip.index, filename: result.clip.filename || `${projectName}-clip-${clip.index}.mp4` });
      setEditAllProgress({ done: i + 1, total: clips.length });
    }
    if (results.length === 0) { setEditAllError('No clips were successfully processed.'); setEditAllStatus('settings'); return; }
    setEditedClips(results);
    setEditAllStatus('done');
  };

  // ── After single clip created ─────────────────────────────────────────────

  if (!isEditAll && singleClipResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <BackButton href="/processing" label="Back to Clips" />
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
          {singleDownloading ? (
            <Button onClick={handleCancelSingleDownload} className="flex-1 bg-red-600 text-white hover:bg-red-700 h-12 text-base">
              <X className="w-4 h-4 mr-2" />Cancel{singleDownloadProgress > 0 ? ` ${singleDownloadProgress}%` : ''}
            </Button>
          ) : (
            <Button onClick={handleDownloadSingle} className="flex-1 bg-black text-white hover:bg-gray-800 h-12 text-base">
              <Download className="w-4 h-4 mr-2" />Download Clip
            </Button>
          )}
          <Button variant="outline" onClick={() => { setSingleClipResult(null); setSingleDownloadProgress(0); }}
            disabled={singleDownloading} className="flex-1 border-black text-black h-12 text-base">
            Edit Again
          </Button>
        </div>
      </div>
    );
  }

  if (isEditAll && editAllStatus === 'done') return <EditAllResults clips={editedClips} projectName={projectName} />;

  if (isEditAll && editAllStatus === 'processing') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-black" />
        <h1 className="text-3xl font-bold mb-2">Editing Clips</h1>
        <p className="text-gray-600 mb-8">Processing clip {editAllProgress.done + 1} of {editAllProgress.total}...</p>
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div className="bg-black h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round((editAllProgress.done / editAllProgress.total) * 100)}%` }} />
        </div>
        <p className="text-sm text-gray-500">{Math.round((editAllProgress.done / editAllProgress.total) * 100)}% complete</p>
      </div>
    );
  }

  // ── Settings panel ────────────────────────────────────────────────────────

  const processButton = isEditAll ? (
    <Button onClick={handleStartEditAll} disabled={isProcessing || !videoId || !generatedClips.length}
      className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base font-semibold">
      {isProcessing
        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        : `Process All (${generatedClips.length} clips)`}
    </Button>
  ) : (
    <Button onClick={handleCreateSingle} disabled={isProcessing || !videoId}
      className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base font-semibold">
      {isProcessing
        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        : 'Process Clip'}
    </Button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton href="/processing" label="Back to Clips" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditAll ? 'Edit All Clips' : 'Edit Clip'}
          </h1>
          {isEditAll && (
            <p className="text-sm text-gray-500">Settings apply to all {generatedClips.length} clips</p>
          )}
        </div>
      </div>

      {(error || editAllError) && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error || editAllError}</p>
        </div>
      )}

      {/* Two-column layout: preview top/right, controls below/left */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Controls — below preview on mobile, left on desktop ── */}
        <div className="flex-1 min-w-0 space-y-4 order-last lg:order-first">

          <Section title="Output">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScreenSizeSelector value={aspectRatio} onChange={setAspectRatio} />
              <QualityFpsSelector quality={quality} onQualityChange={setQuality} fps={fps} onFpsChange={setFps} />
            </div>
          </Section>

          <Section title="Enhancements">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BlurControl enabled={blurEnabled} onEnabledChange={setBlurEnabled} strength={blurStrength} onStrengthChange={setBlurStrength} />
              <SubtitleEditor
                enabled={subtitlesEnabled} onEnabledChange={setSubtitlesEnabled}
                style={subtitleStyle} onStyleChange={setSubtitleStyle}
                size={subtitleSize} onSizeChange={setSubtitleSize}
                primaryColor={subtitlePrimaryColor} onPrimaryColorChange={setSubtitlePrimaryColor}
                outlineColor={subtitleOutlineColor} onOutlineColorChange={setSubtitleOutlineColor}
                outlineEnabled={subtitleOutlineEnabled} onOutlineEnabledChange={setSubtitleOutlineEnabled}
                position={subtitlePosition} onPositionChange={setSubtitlePosition}
                uppercase={subtitleUppercase} onUppercaseChange={setSubtitleUppercase}
              />
            </div>
          </Section>

          <Section title="Watermark">
            <WatermarkSelector
              watermarkType={watermarkType} onWatermarkTypeChange={setWatermarkType}
              watermarkId={watermarkId} onWatermarkIdChange={setWatermarkId}
              watermarkPosition={watermarkPosition} onWatermarkPositionChange={setWatermarkPosition}
              watermarkSize={watermarkSize} onWatermarkSizeChange={setWatermarkSize}
              watermarkOpacity={watermarkOpacity} onWatermarkOpacityChange={setWatermarkOpacity}
            />
          </Section>

        </div>

        {/* ── Preview + process button — top on mobile, right on desktop ── */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 order-first lg:order-last">
          <div className="lg:sticky lg:top-6 space-y-4">
            {!isEditAll && (
              <VideoPreview
                aspectRatio={aspectRatio}
                quality={quality}
                fps={fps}
                videoId={videoId}
                startTime={startTime}
                endTime={endTime}
                blurEnabled={blurEnabled}
                blurStrength={blurStrength}
                subtitlesEnabled={subtitlesEnabled}
                subtitleStyle={subtitleStyle}
                subtitleSize={subtitleSize}
                subtitlePrimaryColor={subtitlePrimaryColor}
                subtitleOutlineColor={subtitleOutlineColor}
                subtitleOutlineEnabled={subtitleOutlineEnabled}
                subtitlePosition={subtitlePosition}
                subtitleUppercase={subtitleUppercase}
                watermarkType={watermarkType}
                watermarkId={watermarkId}
                watermarkPosition={watermarkPosition}
                watermarkSize={watermarkSize}
                watermarkOpacity={watermarkOpacity}
              />
            )}

            {isEditAll && (
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">Batch Edit</p>
                <p className="text-xs text-gray-500">These settings will be applied to all {generatedClips.length} clips when processed.</p>
              </div>
            )}

            {processButton}
          </div>
        </div>

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
