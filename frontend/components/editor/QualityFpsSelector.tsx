'use client';

interface QualityFpsSelectorProps {
  quality: string;
  onQualityChange: (quality: string) => void;
  fps: number;
  onFpsChange: (fps: number) => void;
}

export function QualityFpsSelector({
  quality,
  onQualityChange,
  fps,
  onFpsChange
}: QualityFpsSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Quality</label>
        <select
          value={quality}
          onChange={(e) => onQualityChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-black"
        >
          <option value="low">Low (1000k)</option>
          <option value="medium">Medium (2500k)</option>
          <option value="high">High (5000k)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">FPS: {fps}</label>
        <input
          type="range"
          min="24"
          max="60"
          value={fps}
          onChange={(e) => onFpsChange(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">24 (smooth) - 60 (ultra-smooth)</p>
      </div>
    </div>
  );
}
