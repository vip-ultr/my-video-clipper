'use client';

import { useState } from 'react';
import { useUpload } from '@/hooks/useUpload';
import { useUploadStore } from '@/store/uploadStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { VideoUpload } from '@/components/upload/VideoUpload';
import { ProjectSettings } from '@/components/upload/ProjectSettings';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { BackButton } from '@/components/ui/BackButton';

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);

  const {
    videoFile,
    projectName,
    clippingMode,
    clipCount,
    clipDuration,
    clipStartTimes,
    isUploading,
    uploadProgress,
    error,
    setVideoFile,
    setProjectName,
    setClippingMode,
    setClipCount,
    setClipDuration,
    setClipStartTimes,
    uploadVideo,
    cancelUpload,
  } = useUpload();

  const { videoId, reset, setGeneratedClips } = useUploadStore();

  // Wrap each setting setter to clear old clips whenever the user changes anything.
  // This ensures ProcessingView starts fresh instead of showing stale results.
  const handleSettingChange = <T,>(setter: (val: T) => void) => (val: T) => {
    setGeneratedClips([]);
    setter(val);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await uploadVideo();
    if (success) {
      router.push('/processing');
    }
  };

  const handleChangeVideo = () => {
    reset();
  };

  // Video already uploaded — let user continue or swap
  if (videoId && videoFile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <BackButton href="/" label="Back to Home" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Upload Your Video</h1>
        <p className="text-gray-600 mb-8">
          Drag and drop your livestream video or click to browse. Max 1.5GB.
        </p>

        <div className="p-6 border-2 border-black rounded-lg bg-gray-50 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold mb-1">Video already uploaded</p>
              <p className="text-sm text-gray-600 truncate" title={videoFile.name}>
                {videoFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(videoFile.size / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="flex-shrink-0 border-gray-300 text-gray-700 hover:border-black"
              onClick={handleChangeVideo}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Change Video
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); router.push('/processing'); }} className="space-y-8">
          <ProjectSettings
            projectName={projectName}
            onProjectNameChange={handleSettingChange(setProjectName)}
            clippingMode={clippingMode}
            onClippingModeChange={handleSettingChange(setClippingMode)}
            clipCount={clipCount}
            onClipCountChange={handleSettingChange(setClipCount)}
            clipDuration={clipDuration}
            onClipDurationChange={handleSettingChange(setClipDuration)}
            clipStartTimes={clipStartTimes}
            onClipStartTimesChange={handleSettingChange(setClipStartTimes)}
          />

          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800 h-12 px-8 text-lg"
            >
              Continue to Clipping
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <BackButton href="/" label="Back to Home" />
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">Upload Your Video</h1>
      <p className="text-gray-600 mb-8">
        Drag and drop your livestream video or click to browse. Max 1.5GB.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <VideoUpload
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          videoFile={videoFile}
        />

        {videoFile && (
          <ProjectSettings
            projectName={projectName}
            onProjectNameChange={handleSettingChange(setProjectName)}
            clippingMode={clippingMode}
            onClippingModeChange={handleSettingChange(setClippingMode)}
            clipCount={clipCount}
            onClipCountChange={handleSettingChange(setClipCount)}
            clipDuration={clipDuration}
            onClipDurationChange={handleSettingChange(setClipDuration)}
            clipStartTimes={clipStartTimes}
            onClipStartTimesChange={handleSettingChange(setClipStartTimes)}
          />
        )}

        <UploadProgress isUploading={isUploading} progress={uploadProgress} />

        {videoFile && (
          <div className="flex justify-center">
            {isUploading ? (
              <Button
                type="button"
                onClick={cancelUpload}
                className="bg-red-600 text-white hover:bg-red-700 h-12 px-8 text-lg"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Upload
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!projectName.trim()}
                className="bg-black text-white hover:bg-gray-800 h-12 px-8 text-lg"
              >
                Start Processing
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
