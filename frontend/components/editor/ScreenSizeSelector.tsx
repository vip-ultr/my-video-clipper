'use client';

interface ScreenSizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ScreenSizeSelector({ value, onChange }: ScreenSizeSelectorProps) {
  const options = [
    { value: '9:16', label: 'Vertical (9:16)' },
    { value: '16:9', label: 'Horizontal (16:9)' },
    { value: '1:1', label: 'Square (1:1)' }
  ];

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-black"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
