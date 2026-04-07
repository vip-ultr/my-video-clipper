'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor } from '@/hooks/useEditor';
import { useUploadStore } from '@/store/uploadStore';
import { DownloadView } from '@/components/editor/DownloadView';
import { VideoPreview } from '@/components/editor/VideoPreview';
import { ScreenSizeSelector } from '@/components/editor/ScreenSizeSelector';
import { SubtitleEditor } from '@/components/editor/SubtitleEditor';
import { BlurControl } from '@/components/editor/BlurControl';
import { WatermarkSelector } from '@/components/editor/WatermarkSelector';
import { QualityFpsSelector } from '@/components/editor/QualityFpsSelector';
import { Button } from '@/components/ui/button';

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { projectName, videoId, clipCount, clipDuration } = useUploadStore();

  const {
    aspectRatio,
    quality,
    fps,
    subtitlesEnabled,
    subtitleStyle,
    subtitlePrimaryColor,
    subtitleSecondaryColor,
    subtitlePosition,
    blurEnabled,
    blurStrength,
    watermarkType,
    watermarkPosition,
    watermarkSize,
    watermarkOpacity,
    isProcessing,
    error,
    setAspectRatio,
    setQuality,
    setFps,
    setSubtitlesEnabled,
    setSubtitleStyle,
    setSubtitlePrimaryColor,
    setSubtitleSecondaryColor,
    setSubtitlePosition,
    setBlurEnabled,
    setBlurStrength,
    setWatermarkType,
    setWatermarkPosition,
    setWatermarkSize,
    setWatermarkOpacity,
    createClip
  } = useEditor();

  const [createdClip, setCreatedClip] = useState<any>(null);
  const [clipId, setClipId] = useState<string | null>(null);
  const [clipIndex, setClipIndex] = useState(0);

  // Get clip timing from URL params
  const startTime = parseFloat(searchParams.get('start') || '0');
  const endTime = parseFloat(searchParams.get('end') || String(clipDuration));

  const handleCreateClip = async () => {
    if (!videoId) {
      alert('Video ID not found. Please upload a video first.');
      return;
    }

    const result = await createClip(
      videoId,
      startTime,
      endTime,
      clipIndex,
      projectName,
      clipIndex > 0 // Pass true if this is an edit (clipIndex > 0 means it's been edited before)
    );

    if (result && result.clip) {
      setClipId(result.clip.id);
      setCreatedClip({
        clipName: result.clip.filename,
        fileSize: `${(result.clip.fileSize / 1024 / 1024).toFixed(2)}MB`,
        duration: `${Math.round(result.clip.duration)}s`
      });
    }
  };

  // Redirect to upload if no video is available
  useEffect(() => {
    if (!videoId) {
      router.push('/upload');
    }
  }, [videoId, router]);

  if (createdClip) {
    return (
      <DownloadView
        clipName={createdClip.clipName}
        fileSize={createdClip.fileSize}
        duration={createdClip.duration}
        onDownload={() => {
          window.location.href = `/api/download/${clipId}`;
        }}
        onEditAgain={() => {
          setCreatedClip(null);
          setClipId(null);
          setClipIndex(clipIndex + 1);
        }}
        onNextClip={() => {
          setCreatedClip(null);
          setClipId(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Edit Clip</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Video Preview - Left Column */}
        <div className="lg:col-span-2">
          <VideoPreview aspectRatio={aspectRatio} quality={quality} fps={fps} />
        </div>

        {/* Editor Controls - Right Column */}
        <div className="space-y-6">
          {/* Aspect Ratio */}
          <ScreenSizeSelector value={aspectRatio} onChange={setAspectRatio} />

          {/* Quality & FPS */}
          <QualityFpsSelector
            quality={quality}
            onQualityChange={setQuality}
            fps={fps}
            onFpsChange={setFps}
          />

          {/* Subtitles */}
          <SubtitleEditor
            enabled={subtitlesEnabled}
            onEnabledChange={setSubtitlesEnabled}
            style={subtitleStyle}
            onStyleChange={setSubtitleStyle}
            primaryColor={subtitlePrimaryColor}
            onPrimaryColorChange={setSubtitlePrimaryColor}
            secondaryColor={subtitleSecondaryColor}
            onSecondaryColorChange={setSubtitleSecondaryColor}
            position={subtitlePosition}
            onPositionChange={setSubtitlePosition}
          />

          {/* Blur */}
          <BlurControl
            enabled={blurEnabled}
            onEnabledChange={setBlurEnabled}
            strength={blurStrength}
            onStrengthChange={setBlurStrength}
          />

          {/* Watermark */}
          <WatermarkSelector
            watermarkType={watermarkType}
            onWatermarkTypeChange={setWatermarkType}
            watermarkPosition={watermarkPosition}
            onWatermarkPositionChange={setWatermarkPosition}
            watermarkSize={watermarkSize}
            onWatermarkSizeChange={setWatermarkSize}
            watermarkOpacity={watermarkOpacity}
            onWatermarkOpacityChange={setWatermarkOpacity}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <Button
          disabled={isProcessing || !videoId}
          className="bg-black text-white hover:bg-gray-800 h-12 px-8 text-lg"
          onClick={handleCreateClip}
        >
          {isProcessing ? 'Processing...' : 'Download Clip'}
        </Button>
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
