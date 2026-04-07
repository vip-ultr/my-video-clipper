'use client';

import { useRef, useState } from 'react';
import { Upload, CheckCircle, Loader2, X } from 'lucide-react';
import * as api from '@/lib/api';

interface WatermarkSelectorProps {
  watermarkType: string;
  onWatermarkTypeChange: (type: string) => void;
  watermarkId: string | null;
  onWatermarkIdChange: (id: string | null) => void;
  watermarkPosition: string;
  onWatermarkPositionChange: (position: string) => void;
  watermarkSize: number;
  onWatermarkSizeChange: (size: number) => void;
  watermarkOpacity: number;
  onWatermarkOpacityChange: (opacity: number) => void;
}

const TYPES = [
  { value: 'none',    label: 'None'    },
  { value: 'default', label: 'Default' },
  { value: 'custom',  label: 'Custom'  },
];

const POSITIONS = [
  { value: 'top-left',     label: 'Top Left'     },
  { value: 'top-right',    label: 'Top Right'    },
  { value: 'bottom-left',  label: 'Bottom Left'  },
  { value: 'bottom-right', label: 'Bottom Right' },
];

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function WatermarkSelector({
  watermarkType, onWatermarkTypeChange,
  watermarkId, onWatermarkIdChange,
  watermarkPosition, onWatermarkPositionChange,
  watermarkSize, onWatermarkSizeChange,
  watermarkOpacity, onWatermarkOpacityChange,
}: WatermarkSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleTypeChange = (type: string) => {
    onWatermarkTypeChange(type);
    if (type !== 'custom') {
      // Clear uploaded watermark when switching away
      onWatermarkIdChange(null);
      setUploadState('idle');
      setUploadedFileName(null);
      setUploadError(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState('uploading');
    setUploadError(null);

    try {
      const response = await api.uploadWatermark(file);
      if (response.data.success && response.data.watermarkId) {
        onWatermarkIdChange(response.data.watermarkId);
        setUploadedFileName(file.name);
        setUploadState('done');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploadState('error');
      onWatermarkIdChange(null);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearUpload = () => {
    onWatermarkIdChange(null);
    setUploadState('idle');
    setUploadedFileName(null);
    setUploadError(null);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Watermark</p>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTypeChange(t.value)}
            className={`py-2.5 rounded-lg border-2 text-xs font-semibold transition ${
              watermarkType === t.value
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Custom upload area */}
      {watermarkType === 'custom' && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Upload Image</p>

          {uploadState === 'done' && uploadedFileName ? (
            <div className="flex items-center gap-3 p-3 border border-black rounded-lg bg-gray-50">
              <CheckCircle className="w-4 h-4 text-black flex-shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{uploadedFileName}</span>
              <button type="button" onClick={handleClearUpload} className="text-gray-400 hover:text-black transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState === 'uploading'}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-black transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadState === 'uploading' ? (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Click to upload PNG or JPG</span>
                </div>
              )}
            </button>
          )}

          {uploadState === 'error' && uploadError && (
            <p className="text-xs text-red-600 mt-1">{uploadError}</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {watermarkType !== 'none' && (
        <div className="space-y-4 pt-1">
          {/* Position grid */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Position</p>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onWatermarkPositionChange(p.value)}
                  className={`py-2 rounded-lg border-2 text-xs font-semibold transition ${
                    watermarkPosition === p.value
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</p>
              <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{watermarkSize}%</span>
            </div>
            <input
              type="range" min="5" max="50" step="1"
              value={watermarkSize}
              onChange={(e) => onWatermarkSizeChange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>5%</span><span>50%</span>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Opacity</p>
              <span className="text-sm font-bold bg-gray-100 px-2.5 py-0.5 rounded-full">{watermarkOpacity}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="1"
              value={watermarkOpacity}
              onChange={(e) => onWatermarkOpacityChange(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>Transparent</span><span>Solid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
