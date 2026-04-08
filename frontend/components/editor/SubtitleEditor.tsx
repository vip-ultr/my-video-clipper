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
  { value: 'emphasis', label: 'Emphasis',  description: 'Bold, thick outline — grabs attention' },
  { value: 'rhythm',   label: 'Rhythm',    description: 'Italic, natural speech feel' },
  { value: 'uniform',  label: 'Uniform',   description: 'Consistent, neutral — works on anything' },
  { value: 'default',  label: 'Default',   description: 'Clean white, thin outline' },
  { value: 'classic',  label: 'Classic',   description: 'Drop shadow, cinema look' },
  { value: 'bold',     label: 'Bold',      description: 'Yellow bold, high contrast' },
  { value: 'minimal',  label: 'Minimal',   description: 'Small, hairline stroke' },
  { value: 'tiktok',   label: 'TikTok',    description: 'Large bold, thick outline' },
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
            <select
              value={style}
              onChange={(e) => onStyleChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-400 transition cursor-pointer"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.description}
                </option>
              ))}
            </select>
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
