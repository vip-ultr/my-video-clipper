'use client';

interface ScreenSizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { value: '9:16', label: 'Vertical', sub: '9:16' },
  { value: '16:9', label: 'Horizontal', sub: '16:9' },
  { value: '1:1',  label: 'Square',    sub: '1:1'  },
];

export function ScreenSizeSelector({ value, onChange }: ScreenSizeSelectorProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-900 mb-3">Aspect Ratio</p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`py-2.5 px-2 rounded-lg border-2 transition text-center ${
              value === opt.value
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            <p className="text-xs font-semibold">{opt.label}</p>
            <p className={`text-xs mt-0.5 ${value === opt.value ? 'text-gray-300' : 'text-gray-400'}`}>{opt.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
