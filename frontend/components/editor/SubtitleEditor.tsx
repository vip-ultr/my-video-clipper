'use client';

import { useState, useRef, useEffect } from 'react';

interface SubtitleEditorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  style: string;
  onStyleChange: (style: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  secondaryColor: string;
  onSecondaryColorChange: (color: string) => void;
  position: string;
  onPositionChange: (position: string) => void;
  uppercase: boolean;
  onUppercaseChange: (uppercase: boolean) => void;
}

const STYLES = [
  { value: 'default',  label: 'Default',  description: 'Clean white, thin outline' },
  { value: 'emphasis', label: 'Emphasis', description: 'Bold, thick outline' },
  { value: 'tiktok',   label: 'TikTok',   description: 'Large bold, thick outline' },
  { value: 'bold',     label: 'Bold',     description: 'Yellow bold, high contrast' },
  { value: 'classic',  label: 'Classic',  description: 'Drop shadow, cinema look' },
  { value: 'rhythm',   label: 'Rhythm',   description: 'Italic, natural speech feel' },
  { value: 'uniform',  label: 'Uniform',  description: 'Consistent, neutral' },
  { value: 'minimal',  label: 'Minimal',  description: 'Small, hairline stroke' },
];

const POSITIONS = [
  { value: 'top',    label: 'Top'    },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-black' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function StyleDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = STYLES.find((s) => s.value === value) ?? STYLES[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white hover:border-gray-400 transition focus:outline-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-900 shrink-0">{selected.label}</span>
          <span className="text-xs text-gray-400 truncate">{selected.description}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {STYLES.map((s) => {
            const isSelected = s.value === value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => { onChange(s.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 ${
                  isSelected ? 'bg-gray-50' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{s.label}</p>
                  <p className="text-xs text-gray-400 truncate">{s.description}</p>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-gray-900 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SubtitleEditor({
  enabled, onEnabledChange,
  style, onStyleChange,
  size, onSizeChange,
  primaryColor, onPrimaryColorChange,
  secondaryColor, onSecondaryColorChange,
  position, onPositionChange,
  uppercase, onUppercaseChange,
}: SubtitleEditorProps) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Subtitles</p>
          <p className="text-xs text-gray-400 mt-0.5">Auto-generated captions</p>
        </div>
        <Toggle checked={enabled} onChange={() => onEnabledChange(!enabled)} />
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Style */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Style</p>
            <StyleDropdown value={style} onChange={onStyleChange} />
          </div>

          {/* Size slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</p>
              <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{size}px</span>
            </div>
            <input
              type="range" min="10" max="48" step="1"
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="w-full accent-black"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Small</span>
              <span>Large</span>
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

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Text Color</p>
              <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 transition">
                <span className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" style={{ background: primaryColor }} />
                <span className="text-xs font-mono text-gray-600">{primaryColor.toUpperCase()}</span>
                <input type="color" value={primaryColor} onChange={(e) => onPrimaryColorChange(e.target.value)} className="sr-only" />
              </label>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Secondary</p>
              <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 transition">
                <span className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" style={{ background: secondaryColor }} />
                <span className="text-xs font-mono text-gray-600">{secondaryColor.toUpperCase()}</span>
                <input type="color" value={secondaryColor} onChange={(e) => onSecondaryColorChange(e.target.value)} className="sr-only" />
              </label>
            </div>
          </div>

          {/* Uppercase */}
          <div className="flex items-center justify-between py-0.5">
            <div>
              <p className="text-xs font-medium text-gray-700">UPPERCASE</p>
              <p className="text-xs text-gray-400">Force all text to caps</p>
            </div>
            <Toggle checked={uppercase} onChange={() => onUppercaseChange(!uppercase)} />
          </div>
        </div>
      )}
    </div>
  );
}
