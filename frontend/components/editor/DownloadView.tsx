'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

interface DownloadViewProps {
  clipName: string;
  fileSize: string;
  duration: string;
  onDownload: () => void | Promise<void>;
  onEditAgain: () => void;
  onNextClip: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export function DownloadView({
  clipName,
  fileSize,
  duration,
  onDownload,
  onEditAgain,
  onNextClip,
  isDownloading = false,
  downloadProgress = 0
}: DownloadViewProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* Success Icon */}
      <CheckCircle className="w-20 h-20 mx-auto mb-6 text-black" />

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">Clip Ready!</h1>
      <p className="text-gray-600 mb-8 text-lg">
        Your clip has been processed successfully
      </p>

      {/* File Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left inline-block min-w-96">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">File Name</label>
            <p className="font-semibold">{clipName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">File Size</label>
              <p className="font-semibold">{fileSize}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Duration</label>
              <p className="font-semibold">{duration}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiration Warning */}
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⏱️ Your clip will be automatically deleted after 1 hour
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div>
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            className="w-full h-12 text-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Downloading... {downloadProgress}%
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download Now
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isDownloading && downloadProgress > 0 && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onEditAgain}
            variant="outline"
            className="h-12 border-gray-300 hover:border-black"
          >
            Edit Again
          </Button>
          <Button
            onClick={onNextClip}
            variant="outline"
            className="h-12 border-gray-300 hover:border-black"
          >
            Next Clip
          </Button>
        </div>
      </div>
    </div>
  );
}
