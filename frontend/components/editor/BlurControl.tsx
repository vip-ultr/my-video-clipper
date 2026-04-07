'use client';

interface BlurControlProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  strength: number;
  onStrengthChange: (strength: number) => void;
}

export function BlurControl({
  enabled,
  onEnabledChange,
  strength,
  onStrengthChange
}: BlurControlProps) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="font-medium">Enable Blur</span>
      </label>

      {enabled && (
        <div className="ml-6">
          <label className="text-sm block mb-2 font-medium">Strength: {strength}</label>
          <input
            type="range"
            min="0"
            max="30"
            value={strength}
            onChange={(e) => onStrengthChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">0 (subtle) - 30 (maximum)</p>
        </div>
      )}
    </div>
  );
}
