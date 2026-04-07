'use client';

import { useState, useRef } from 'react';
import { useUpload } from '@/hooks/useUpload';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { VideoUpload } from '@/components/upload/VideoUpload';
import { ProjectSettings } from '@/components/upload/ProjectSettings';
import { UploadProgress } from '@/components/upload/UploadProgress';

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);

  const {
    videoFile,
    projectName,
    clippingMode,
    clipCount,
    clipDuration,
    isUploading,
    uploadProgress,
    error,
    setVideoFile,
    setProjectName,
    setClippingMode,
    setClipCount,
    setClipDuration,
    uploadVideo
  } = useUpload();

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
      // Redirect to processing after successful upload
      setTimeout(() => {
        router.push('/processing');
      }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Upload Your Video</h1>
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
        {/* Video Upload Component */}
        <VideoUpload
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          videoFile={videoFile}
        />

        {/* Project Settings Component */}
        {videoFile && (
          <ProjectSettings
            projectName={projectName}
            onProjectNameChange={setProjectName}
            clippingMode={clippingMode}
            onClippingModeChange={setClippingMode}
            clipCount={clipCount}
            onClipCountChange={setClipCount}
            clipDuration={clipDuration}
            onClipDurationChange={setClipDuration}
          />
        )}

        {/* Upload Progress Component */}
        <UploadProgress isUploading={isUploading} progress={uploadProgress} />

        {/* Submit Button */}
        {videoFile && (
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isUploading || !projectName.trim()}
              className="bg-black text-white hover:bg-gray-800 h-12 px-8 text-lg"
            >
              {isUploading ? 'Uploading...' : 'Start Processing'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
