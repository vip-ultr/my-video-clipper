'use client';

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
}

export function UploadProgress({ isUploading, progress }: UploadProgressProps) {
  if (!isUploading && progress === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Upload Progress</p>
        <p className="text-sm text-gray-600">{Math.round(progress)}%</p>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-black h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {isUploading && (
        <p className="text-xs text-gray-500">Uploading your video...</p>
      )}
    </div>
  );
}
