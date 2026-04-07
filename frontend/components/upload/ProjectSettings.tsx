'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ProjectSettingsProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  clippingMode: 'ai-detection' | 'manual-slicing';
  onClippingModeChange: (mode: 'ai-detection' | 'manual-slicing') => void;
  clipCount: number;
  onClipCountChange: (count: number) => void;
  clipDuration: number;
  onClipDurationChange: (duration: number) => void;
  clipStartTimes: string[];
  onClipStartTimesChange: (times: string[]) => void;
}

export function ProjectSettings({
  projectName,
  onProjectNameChange,
  clippingMode,
  onClippingModeChange,
  clipCount,
  onClipCountChange,
  clipDuration,
  onClipDurationChange,
  clipStartTimes,
  onClipStartTimesChange
}: ProjectSettingsProps) {
  const [clipCountInput, setClipCountInput] = useState(String(clipCount));

  // Keep start times array length in sync with clipCount
  useEffect(() => {
    const current = clipStartTimes.slice(0, clipCount);
    while (current.length < clipCount) current.push('');
    if (current.join(',') !== clipStartTimes.slice(0, clipCount).join(',') || current.length !== clipStartTimes.length) {
      onClipStartTimesChange(current);
    }
  }, [clipCount]);

  const handleStartTimeChange = (index: number, value: string) => {
    // Allow only digits and colons
    const sanitized = value.replace(/[^0-9:]/g, '').slice(0, 5);
    const updated = [...clipStartTimes];
    updated[index] = sanitized;
    onClipStartTimesChange(updated);
  };

  const allStartTimesEmpty = clipStartTimes.every(t => !t.trim());

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="e.g., Gaming Stream Archive"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        />
      </div>

      {/* Clipping Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">Clipping Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onClippingModeChange('ai-detection')}
            className={`p-3 rounded-lg border-2 transition ${
              clippingMode === 'ai-detection'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <p className="font-semibold text-sm">AI Detection</p>
            <p className="text-xs opacity-80">Auto-detect high engagement</p>
          </button>
          <button
            type="button"
            onClick={() => onClippingModeChange('manual-slicing')}
            className={`p-3 rounded-lg border-2 transition ${
              clippingMode === 'manual-slicing'
                ? 'border-black bg-black text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <p className="font-semibold text-sm">Manual Slicing</p>
            <p className="text-xs opacity-80">Cut from start or set timestamps</p>
          </button>
        </div>
      </div>

      {/* Clip Count */}
      <div>
        <label className="block text-sm font-medium mb-2">Number of Clips</label>
        <input
          type="number"
          min="1"
          max="20"
          value={clipCountInput}
          onChange={(e) => setClipCountInput(e.target.value)}
          onBlur={() => {
            const clamped = Math.min(20, Math.max(1, Number(clipCountInput) || 1));
            setClipCountInput(String(clamped));
            onClipCountChange(clamped);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        />
        <p className="text-xs text-gray-500 mt-1">Enter a number between 1 and 20</p>
      </div>

      {/* Clip Duration */}
      <div>
        <label className="block text-sm font-medium mb-2">Clip Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {[15, 30, 40, 60].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => onClipDurationChange(duration)}
              className={`py-2 px-3 rounded-lg border-2 transition text-sm font-medium ${
                clipDuration === duration
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {duration}s
            </button>
          ))}
        </div>
      </div>

      {/* Custom Start Times — manual mode only */}
      {clippingMode === 'manual-slicing' && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <label className="block text-sm font-medium">Clip Start Times</label>
            <span className="text-xs text-gray-400">(optional)</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Leave blank to cut sequentially from the start of the video. Format: <span className="font-mono">MM:SS</span>
          </p>
          <div className="space-y-2">
            {Array.from({ length: clipCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-16 flex-shrink-0">Clip {i + 1}</span>
                <input
                  type="text"
                  placeholder="MM:SS"
                  value={clipStartTimes[i] ?? ''}
                  onChange={(e) => handleStartTimeChange(i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black font-mono text-sm"
                  maxLength={5}
                />
              </div>
            ))}
          </div>
          {allStartTimesEmpty && (
            <p className="text-xs text-gray-400 mt-2">
              No start times set — clips will be cut from the beginning, one after another.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
