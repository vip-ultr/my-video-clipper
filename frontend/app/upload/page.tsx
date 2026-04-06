'use client';

import { useState, useRef } from 'react';
import { useUpload } from '@/hooks/useUpload';
import { useProcessing } from '@/hooks/useProcessing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, AlertCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    uploadVideo
  } = useUpload();

  const { startAnalysis } = useProcessing();

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
      // Redirect to editor after successful upload
      setTimeout(() => {
        router.push('/editor/new');
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
            dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">
            {videoFile ? videoFile.name : 'Drop your video here'}
          </h3>
          <p className="text-gray-600">
            {videoFile ? (
              <span>
                {formatBytes(videoFile.size)} • Click to change
              </span>
            ) : (
              <span>or click to browse (MP4, MOV, WebM up to 1.5GB)</span>
            )}
          </p>
        </div>

        {/* Project Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project Name *</label>
            <Input
              type="text"
              placeholder="e.g., Gaming Highlights 2024"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isUploading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Clips</label>
            <Input
              type="range"
              min="1"
              max="20"
              defaultValue="5"
              className="w-full"
              disabled={isUploading}
            />
            <p className="text-sm text-gray-600 mt-2">Create approximately 5 clips</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Clip Duration (seconds)</label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 40, 60].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  className="p-2 border border-gray-300 rounded hover:border-black transition"
                  disabled={isUploading}
                >
                  {duration}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!videoFile || !projectName.trim() || isUploading}
          className="w-full h-12 text-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Start Processing'}
        </Button>
      </form>
    </div>
  );
}
