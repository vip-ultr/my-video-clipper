'use client';

import { Button } from '@/components/ui/button';
import { X, Zap, Edit3 } from 'lucide-react';

interface ReadyClip {
  id: string;
  index: number;
  filename: string;
  fileSize: number;
  duration: number;
}

interface DownloadPathModalProps {
  clip: ReadyClip;
  onDownloadNow: () => void;
  onEditFirst: () => void;
  onCancel: () => void;
  isDownloading?: boolean;
}

export function DownloadPathModal({
  clip,
  onDownloadNow,
  onEditFirst,
  onCancel,
  isDownloading = false
}: DownloadPathModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">How would you like to download this clip?</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={isDownloading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Clip Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-600 mb-2">Clip {clip.index}</p>
          <p className="font-semibold text-lg mb-3">{clip.filename}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-semibold">{clip.duration}s</p>
            </div>
            <div>
              <span className="text-gray-600">File Size:</span>
              <p className="font-semibold">{(clip.fileSize / 1024 / 1024).toFixed(2)}MB</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Download Now */}
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-black transition cursor-pointer"
            onClick={onDownloadNow}
          >
            <div className="flex items-start gap-3 mb-3">
              <Zap className="w-6 h-6 text-black flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">Download Now</h3>
                <p className="text-sm text-gray-600">Fast extraction, no editing</p>
              </div>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 ml-9">
              <li>✓ Instant download (~2 seconds)</li>
              <li>✓ Raw video segment</li>
              <li>✓ No processing</li>
            </ul>
          </div>

          {/* Edit First */}
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-black transition cursor-pointer"
            onClick={onEditFirst}
          >
            <div className="flex items-start gap-3 mb-3">
              <Edit3 className="w-6 h-6 text-black flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg">Edit First</h3>
                <p className="text-sm text-gray-600">Apply effects and filters</p>
              </div>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 ml-9">
              <li>✓ Full editor access</li>
              <li>✓ Apply blur, subtitles, watermark</li>
              <li>✓ Change aspect ratio & quality</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onDownloadNow}
            disabled={isDownloading}
            className="flex-1 h-12 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Download Now
          </Button>
          <Button
            onClick={onEditFirst}
            disabled={isDownloading}
            className="flex-1 h-12 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          >
            <Edit3 className="w-5 h-5 mr-2" />
            Edit First
          </Button>
        </div>

        {/* Cancel */}
        <button
          onClick={onCancel}
          disabled={isDownloading}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
