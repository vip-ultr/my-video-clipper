'use client';

import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
}

export function UploadProgress({ isUploading, progress }: UploadProgressProps) {
  if (!isUploading && progress === 0) return null;

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUploading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
          <p className="text-sm font-medium">
            {isUploading ? 'Uploading video...' : 'Upload complete'}
          </p>
        </div>
        <p className="text-sm font-semibold">{Math.round(progress)}%</p>
      </div>

      <div className="bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-black h-full rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {isUploading && (
        <p className="text-xs text-gray-500">
          Please keep this page open until the upload finishes.
        </p>
      )}
    </div>
  );
}
