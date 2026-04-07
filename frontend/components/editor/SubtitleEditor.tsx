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

export function SubtitleEditor({
  enabled,
  onEnabledChange,
  style,
  onStyleChange,
  primaryColor,
  onPrimaryColorChange,
  secondaryColor,
  onSecondaryColorChange,
  position,
  onPositionChange
}: SubtitleEditorProps) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="font-medium">Enable Subtitles</span>
      </label>

      {enabled && (
        <div className="space-y-3 ml-6">
          <div>
            <label className="text-sm block mb-1 font-medium">Style</label>
            <select
              value={style}
              onChange={(e) => onStyleChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-black"
            >
              <option value="emphasis">Emphasis</option>
              <option value="rhythm">Rhythm</option>
              <option value="uniform">Uniform</option>
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1 font-medium">Primary Color</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="w-full h-8 rounded cursor-pointer border border-gray-300"
            />
          </div>

          <div>
            <label className="text-sm block mb-1 font-medium">Secondary Color</label>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="w-full h-8 rounded cursor-pointer border border-gray-300"
            />
          </div>

          <div>
            <label className="text-sm block mb-1 font-medium">Position</label>
            <select
              value={position}
              onChange={(e) => onPositionChange(e.target.value)}
              className="w-full p-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-black"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="center">Center</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
