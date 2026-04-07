'use client';

interface BlurControlProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  strength: number;
  onStrengthChange: (strength: number) => void;
}

export function BlurControl({ enabled, onEnabledChange, strength, onStrengthChange }: BlurControlProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Blur Effect</p>
          <p className="text-xs text-gray-400 mt-0.5">Blur sensitive content</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {enabled && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Strength</p>
            <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{strength}</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={strength}
            onChange={(e) => onStrengthChange(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>Subtle</span>
            <span>Maximum</span>
          </div>
        </div>
      )}
    </div>
  );
}
