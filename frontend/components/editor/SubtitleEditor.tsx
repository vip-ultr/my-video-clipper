'use client';

interface SubtitleEditorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  style: string;
  onStyleChange: (style: string) => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  secondaryColor: string;
  onSecondaryColorChange: (color: string) => void;
  position: string;
  onPositionChange: (position: string) => void;
}

const STYLES = [
  { value: 'emphasis', label: 'Emphasis' },
  { value: 'rhythm',   label: 'Rhythm'   },
  { value: 'uniform',  label: 'Uniform'  },
];

const POSITIONS = [
  { value: 'top',    label: 'Top'    },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
];

export function SubtitleEditor({
  enabled, onEnabledChange,
  style, onStyleChange,
  primaryColor, onPrimaryColorChange,
  secondaryColor, onSecondaryColorChange,
  position, onPositionChange,
}: SubtitleEditorProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-900">Subtitles</p>
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
        <div className="space-y-4">
          {/* Style */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Style</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onStyleChange(s.value)}
                  className={`py-2 rounded-lg border-2 text-xs font-semibold transition ${
                    style === s.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Primary Color</p>
              <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 transition">
                <span className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" style={{ background: primaryColor }} />
                <span className="text-xs font-mono text-gray-600">{primaryColor.toUpperCase()}</span>
                <input type="color" value={primaryColor} onChange={(e) => onPrimaryColorChange(e.target.value)} className="sr-only" />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Secondary Color</p>
              <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 transition">
                <span className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" style={{ background: secondaryColor }} />
                <span className="text-xs font-mono text-gray-600">{secondaryColor.toUpperCase()}</span>
                <input type="color" value={secondaryColor} onChange={(e) => onSecondaryColorChange(e.target.value)} className="sr-only" />
              </label>
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Position</p>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onPositionChange(p.value)}
                  className={`py-2 rounded-lg border-2 text-xs font-semibold transition ${
                    position === p.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
