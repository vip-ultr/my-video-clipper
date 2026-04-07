'use client';

interface QualityFpsSelectorProps {
  quality: string;
  onQualityChange: (quality: string) => void;
  fps: number;
  onFpsChange: (fps: number) => void;
}

const QUALITY_OPTIONS = [
  { value: 'low',    label: 'Low',    sub: '1000k' },
  { value: 'medium', label: 'Medium', sub: '2500k' },
  { value: 'high',   label: 'High',   sub: '5000k' },
];

export function QualityFpsSelector({ quality, onQualityChange, fps, onFpsChange }: QualityFpsSelectorProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-5">
      {/* Quality */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Quality</p>
        <div className="grid grid-cols-3 gap-2">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onQualityChange(opt.value)}
              className={`py-2.5 px-2 rounded-lg border-2 transition text-center ${
                quality === opt.value
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className={`text-xs mt-0.5 ${quality === opt.value ? 'text-gray-300' : 'text-gray-400'}`}>{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FPS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Frame Rate</p>
          <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{fps} FPS</span>
        </div>
        <input
          type="range"
          min="24"
          max="60"
          step="1"
          value={fps}
          onChange={(e) => onFpsChange(Number(e.target.value))}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>24 fps</span>
          <span>60 fps</span>
        </div>
      </div>
    </div>
  );
}
