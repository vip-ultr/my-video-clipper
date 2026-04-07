'use client';

interface WatermarkSelectorProps {
  watermarkType: string;
  onWatermarkTypeChange: (type: string) => void;
  watermarkPosition: string;
  onWatermarkPositionChange: (position: string) => void;
  watermarkSize: number;
  onWatermarkSizeChange: (size: number) => void;
  watermarkOpacity: number;
  onWatermarkOpacityChange: (opacity: number) => void;
}

const TYPES = [
  { value: 'none',    label: 'None'    },
  { value: 'default', label: 'Default' },
  { value: 'custom',  label: 'Custom'  },
];

const POSITIONS = [
  { value: 'top-left',     label: 'Top Left'     },
  { value: 'top-right',    label: 'Top Right'    },
  { value: 'bottom-left',  label: 'Bottom Left'  },
  { value: 'bottom-right', label: 'Bottom Right' },
];

export function WatermarkSelector({
  watermarkType, onWatermarkTypeChange,
  watermarkPosition, onWatermarkPositionChange,
  watermarkSize, onWatermarkSizeChange,
  watermarkOpacity, onWatermarkOpacityChange,
}: WatermarkSelectorProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Watermark</p>

      {/* Type */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onWatermarkTypeChange(t.value)}
            className={`py-2.5 rounded-lg border-2 text-xs font-semibold transition ${
              watermarkType === t.value
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {watermarkType !== 'none' && (
        <div className="space-y-4 pt-1">
          {/* Position grid */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Position</p>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onWatermarkPositionChange(p.value)}
                  className={`py-2 rounded-lg border-2 text-xs font-semibold transition ${
                    watermarkPosition === p.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</p>
              <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{watermarkSize}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={watermarkSize}
              onChange={(e) => onWatermarkSizeChange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Opacity</p>
              <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{watermarkOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={watermarkOpacity}
              onChange={(e) => onWatermarkOpacityChange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>Transparent</span>
              <span>Solid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
