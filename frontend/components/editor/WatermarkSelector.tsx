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

export function WatermarkSelector({
  watermarkType,
  onWatermarkTypeChange,
  watermarkPosition,
  onWatermarkPositionChange,
  watermarkSize,
  onWatermarkSizeChange,
  watermarkOpacity,
  onWatermarkOpacityChange
}: WatermarkSelectorProps) {
  const positions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  return (
    <div className="border-t border-gray-200 pt-4">
      <label className="block text-sm font-medium mb-2">Watermark</label>
      <select
        value={watermarkType}
        onChange={(e) => onWatermarkTypeChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-3 bg-white focus:outline-none focus:border-black"
      >
        <option value="none">No Watermark</option>
        <option value="default">Default Watermark</option>
        <option value="custom">Custom Watermark</option>
      </select>

      {watermarkType !== 'none' && (
        <div className="space-y-2 text-sm">
          <div>
            <label className="block mb-1 font-medium">Position</label>
            <select
              value={watermarkPosition}
              onChange={(e) => onWatermarkPositionChange(e.target.value)}
              className="w-full p-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-black"
            >
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Size: {watermarkSize}%</label>
            <input
              type="range"
              min="5"
              max="50"
              value={watermarkSize}
              onChange={(e) => onWatermarkSizeChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Opacity: {watermarkOpacity}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={watermarkOpacity}
              onChange={(e) => onWatermarkOpacityChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
