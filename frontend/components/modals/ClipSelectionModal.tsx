'use client';

import { Button } from '@/components/ui/button';
import { X, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ClipSuggestion {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  engagementScore: number;
  reason: string;
}

interface ClipSelectionModalProps {
  clips: ClipSuggestion[];
  mode: 'MANUAL' | 'AI';
  projectName: string;
  onSelect: (clip: ClipSuggestion) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClipSelectionModal({
  clips,
  mode,
  projectName,
  onSelect,
  onCancel,
  isLoading = false
}: ClipSelectionModalProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const handleSelect = (clip: ClipSuggestion) => {
    setSelectedClipId(clip.id);
    onSelect(clip);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 0.75) return 'bg-green-100 text-green-800';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 0.75) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold mb-1">Select a Clip</h2>
            <p className="text-sm text-gray-600">
              {mode === 'MANUAL'
                ? `${clips.length} segments generated for "${projectName}"`
                : `${clips.length} high-engagement segments found in "${projectName}"`
              }
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Clips List */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {clips.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No clips available</p>
          ) : (
            clips.map((clip) => (
              <div
                key={clip.id}
                onClick={() => handleSelect(clip)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedClipId === clip.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Circle */}
                  <div className="flex-shrink-0 mt-1">
                    {selectedClipId === clip.id ? (
                      <CheckCircle className="w-6 h-6 text-black" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>

                  {/* Clip Info */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="font-semibold">Clip {clip.index}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getEngagementColor(clip.engagementScore)}`}>
                        {getEngagementLabel(clip.engagementScore)} Engagement
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{clip.reason}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-700">
                        <span className="font-semibold">{clip.startTime.toFixed(1)}s</span> - <span className="font-semibold">{clip.endTime.toFixed(1)}s</span>
                      </span>
                      <span className="text-gray-600">
                        Duration: <span className="font-semibold">{clip.duration}s</span>
                      </span>
                    </div>
                  </div>

                  {/* Engagement Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl font-bold text-black">
                      {Math.round(clip.engagementScore * 100)}
                    </p>
                    <p className="text-xs text-gray-600">score</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            className="flex-1 h-12 border-gray-300 hover:border-black"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const selected = clips.find(c => c.id === selectedClipId);
              if (selected) {
                handleSelect(selected);
              }
            }}
            disabled={!selectedClipId || isLoading}
            className="flex-1 h-12 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
