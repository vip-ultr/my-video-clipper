'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor } from '@/hooks/useEditor';
import { useUploadStore } from '@/store/uploadStore';
import { DownloadView } from '@/components/editor/DownloadView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { projectName, videoId, clippingMode, clipCount, clipDuration } = useUploadStore();

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

  const [showPreview, setShowPreview] = useState(false);
  const [createdClip, setCreatedClip] = useState<any>(null);
  const [clipIndex, setClipIndex] = useState(0);

  // Get clip timing from URL params (for manual clip selection)
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
      projectName
    );

    if (result && result.clip) {
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
          // Navigate to download endpoint
          const clipId = createdClip.clipName.split('.')[0];
          window.location.href = `/api/download/${clipId}`;
        }}
        onEditAgain={() => {
          setCreatedClip(null);
          setClipIndex(clipIndex + 1);
        }}
        onNextClip={() => {
          setCreatedClip(null);
          // In a real app, this would navigate to the next clip or show a clip list
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
        {/* Video Preview */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-lg">Video Preview</p>
              <p className="text-sm text-gray-400 mt-2">
                {aspectRatio} • {quality} quality • {fps} FPS
              </p>
            </div>
          </div>
        </div>

        {/* Editor Controls */}
        <div className="space-y-6">
          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="9:16">Vertical (9:16)</option>
              <option value="16:9">Horizontal (16:9)</option>
              <option value="1:1">Square (1:1)</option>
            </select>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="low">Low (1000k)</option>
              <option value="medium">Medium (2500k)</option>
              <option value="high">High (5000k)</option>
            </select>
          </div>

          {/* FPS */}
          <div>
            <label className="block text-sm font-medium mb-2">FPS: {fps}</label>
            <input
              type="range"
              min="24"
              max="60"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Subtitles */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={subtitlesEnabled}
                onChange={(e) => setSubtitlesEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Enable Subtitles</span>
            </label>

            {subtitlesEnabled && (
              <div className="space-y-3 ml-6">
                <div>
                  <label className="text-sm block mb-1">Style</label>
                  <select
                    value={subtitleStyle}
                    onChange={(e) => setSubtitleStyle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="emphasis">Emphasis</option>
                    <option value="rhythm">Rhythm</option>
                    <option value="uniform">Uniform</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm block mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={subtitlePrimaryColor}
                    onChange={(e) => setSubtitlePrimaryColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={subtitleSecondaryColor}
                    onChange={(e) => setSubtitleSecondaryColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm block mb-1">Position</label>
                  <select
                    value={subtitlePosition}
                    onChange={(e) => setSubtitlePosition(e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Blur */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={blurEnabled}
                onChange={(e) => setBlurEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Enable Blur</span>
            </label>

            {blurEnabled && (
              <div className="ml-6">
                <label className="text-sm block mb-2">Strength: {blurStrength}</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={blurStrength}
                  onChange={(e) => setBlurStrength(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Watermark */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium mb-2">Watermark</label>
            <select
              value={watermarkType}
              onChange={(e) => setWatermarkType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-3"
            >
              <option value="none">No Watermark</option>
              <option value="default">Default Watermark</option>
              <option value="custom">Custom Watermark</option>
            </select>

            {watermarkType !== 'none' && (
              <div className="space-y-2 text-sm">
                <div>
                  <label className="block mb-1">Position</label>
                  <select
                    value={watermarkPosition}
                    onChange={(e) => setWatermarkPosition(e.target.value)}
                    className="w-full p-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Size: {watermarkSize}%</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={watermarkSize}
                    onChange={(e) => setWatermarkSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1">Opacity: {watermarkOpacity}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <Button
          disabled={isProcessing}
          className="bg-black text-white hover:bg-gray-800 h-12 px-8 text-lg"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </Button>
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
