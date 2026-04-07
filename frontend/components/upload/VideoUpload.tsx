'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';

interface VideoUploadProps {
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClickUpload: () => void;
  videoFile: File | null;
}

export function VideoUpload({
  dragActive,
  onDrag,
  onDrop,
  onFileChange,
  onClickUpload,
  videoFile
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-sm font-medium mb-4">Select Video (Max 1.5GB)</label>
      <div
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={onClickUpload}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={onFileChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {videoFile ? videoFile.name : 'Drag & drop your video'}
        </h3>
        <p className="text-gray-600">
          {videoFile ? `${(videoFile.size / 1024 / 1024 / 1024).toFixed(2)}GB` : 'or click to browse'}
        </p>
      </div>
    </div>
  );
}
