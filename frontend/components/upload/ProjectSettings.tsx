'use client';

interface ProjectSettingsProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  clippingMode: 'ai-detection' | 'manual-slicing';
  onClippingModeChange: (mode: 'ai-detection' | 'manual-slicing') => void;
  clipCount: number;
  onClipCountChange: (count: number) => void;
  clipDuration: number;
  onClipDurationChange: (duration: number) => void;
}

export function ProjectSettings({
  projectName,
  onProjectNameChange,
  clippingMode,
  onClippingModeChange,
  clipCount,
  onClipCountChange,
  clipDuration,
  onClipDurationChange
}: ProjectSettingsProps) {
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
            <p className="text-xs">Auto-detect high engagement</p>
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
            <p className="text-xs">Manually select clips</p>
          </button>
        </div>
      </div>

      {/* Clip Count */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Number of Clips: <span className="text-black font-bold">{clipCount}</span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={clipCount}
          onChange={(e) => onClipCountChange(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">Generate 1-20 clips</p>
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
    </div>
  );
}
