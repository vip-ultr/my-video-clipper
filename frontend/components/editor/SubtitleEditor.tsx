'use client';

import { useState, useRef, useEffect } from 'react';

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
  uppercase: boolean;
  onUppercaseChange: (uppercase: boolean) => void;
}

const STYLES = [
  { value: 'emphasis', label: 'Emphasis', description: 'Bold, thick outline — grabs attention' },
  { value: 'rhythm',   label: 'Rhythm',   description: 'Italic, natural speech feel' },
  { value: 'uniform',  label: 'Uniform',  description: 'Consistent, neutral — works on anything' },
  { value: 'default',  label: 'Default',  description: 'Clean white, thin outline' },
  { value: 'classic',  label: 'Classic',  description: 'Drop shadow, cinema look' },
  { value: 'bold',     label: 'Bold',     description: 'Yellow bold, high contrast' },
  { value: 'minimal',  label: 'Minimal',  description: 'Small, hairline stroke' },
  { value: 'tiktok',   label: 'TikTok',   description: 'Large bold, thick outline' },
];

const POSITIONS = [
  { value: 'top',    label: 'Top'    },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
];

function StyleDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = STYLES.find((s) => s.value === value) ?? STYLES[0];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white hover:border-gray-400 transition focus:outline-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-900 shrink-0">{selected.label}</span>
          <span className="text-xs text-gray-400 truncate">{selected.description}</span>
        </div>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Menu */}
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
                  <p className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {s.label}
                  </p>
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
  primaryColor, onPrimaryColorChange,
  secondaryColor, onSecondaryColorChange,
  position, onPositionChange,
  uppercase, onUppercaseChange,
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
            <StyleDropdown value={style} onChange={onStyleChange} />
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

          {/* Uppercase toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium text-gray-700">UPPERCASE</p>
              <p className="text-xs text-gray-400">Force all subtitle text to caps</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={uppercase}
              onClick={() => onUppercaseChange(!uppercase)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                uppercase ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                uppercase ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
