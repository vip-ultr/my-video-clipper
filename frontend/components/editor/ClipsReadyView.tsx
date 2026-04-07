'use client';

import { Button } from '@/components/ui/button';
import { Download, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export interface ReadyClip {
  id: string;
  index: number;
  filename: string;
  fileSize: number;
  duration: number;
}

interface ClipsReadyViewProps {
  clips: ReadyClip[];
  projectName: string;
  onDownloadAll: () => void;
  onDownload: (clipId: string) => void;
  onEdit: (clipId: string, index: number) => void;
  onDelete?: (clipId: string) => void;
}

export function ClipsReadyView({
  clips,
  projectName,
  onDownloadAll,
  onDownload,
  onEdit,
  onDelete
}: ClipsReadyViewProps) {
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  const toggleClip = (clipId: string) => {
    const newSelected = new Set(selectedClips);
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId);
    } else {
      newSelected.add(clipId);
    }
    setSelectedClips(newSelected);
  };

  const handleDownloadSelected = () => {
    if (selectedClips.size > 0) {
      selectedClips.forEach(clipId => onDownload(clipId));
    }
  };

  const totalSize = clips.reduce((sum, clip) => sum + clip.fileSize, 0);
  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-12">
        <CheckCircle className="w-20 h-20 mx-auto mb-6 text-black" />
        <h1 className="text-4xl font-bold mb-4">All Clips Ready!</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Generated {clips.length} clips for "{projectName}"
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Clips</p>
            <p className="text-2xl font-bold">{clips.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Duration</p>
            <p className="text-2xl font-bold">{totalDuration}s</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Size</p>
            <p className="text-2xl font-bold">{(totalSize / 1024 / 1024).toFixed(1)}MB</p>
          </div>
        </div>

        {/* Expiration Warning */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
          <p className="text-sm text-yellow-800">
            ⏱️ Your clips will be automatically deleted after 1 hour
          </p>
        </div>
      </div>

      {/* Download All Button */}
      <div className="mb-8 flex justify-center">
        <Button
          onClick={onDownloadAll}
          className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 h-12 px-8 text-lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Download All Clips
        </Button>
      </div>

      {/* Clips List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold mb-4">Your Clips</h2>
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-black hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedClips.has(clip.id)}
                onChange={() => toggleClip(clip.id)}
                className="w-5 h-5 cursor-pointer"
              />

              {/* Clip Info */}
              <div className="flex-1">
                <p className="font-semibold mb-1">Clip {clip.index}</p>
                <p className="text-sm text-gray-600">
                  {clip.filename} • {clip.duration}s • {(clip.fileSize / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onDownload(clip.id)}
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={() => onEdit(clip.id, clip.index)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:border-black"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                {onDelete && (
                  <Button
                    onClick={() => onDelete(clip.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:border-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedClips.size > 0 && (
        <div className="fixed bottom-8 left-4 right-4 sm:left-auto sm:right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg sm:max-w-md">
          <p className="text-sm text-gray-600 mb-3">
            {selectedClips.size} clip{selectedClips.size !== 1 ? 's' : ''} selected
          </p>
          <Button
            onClick={handleDownloadSelected}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Selected
          </Button>
        </div>
      )}
    </div>
  );
}
