'use client';

import { Button } from '@/components/ui/button';
import { Clip } from '@/types';

interface ClipSuggestionsProps {
  clips: Clip[];
  onSelectClip: (clip: Clip) => void;
}

export function ClipSuggestions({ clips, onSelectClip }: ClipSuggestionsProps) {
  return (
    <div className="grid gap-4">
      {clips.map((clip, index) => (
        <div
          key={clip.id}
          className="p-4 border border-gray-200 rounded-lg hover:border-black hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-500">Clip {index + 1}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  clip.sentiment === 'high'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {clip.sentiment === 'high' ? '⭐ High' : '⭐ Medium'} Engagement
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {Math.floor(clip.startTime)}s - {Math.floor(clip.endTime)}s
                <span className="ml-3 font-semibold text-gray-900">({clip.duration}s)</span>
              </p>
            </div>
            <Button
              onClick={() => onSelectClip(clip)}
              className="ml-4 bg-black text-white hover:bg-gray-800"
            >
              Edit
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
