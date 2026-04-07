'use client';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
              onChange(e.target.value);
            }
          }}
          placeholder="#FFFFFF"
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
        />
      </div>
    </div>
  );
}
