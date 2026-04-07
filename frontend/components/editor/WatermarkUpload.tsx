'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WatermarkUploadProps {
  onUpload?: (file: File) => void;
  uploadedFile?: { name: string; preview: string } | null;
  onDelete?: () => void;
}

export function WatermarkUpload({ onUpload, uploadedFile, onDelete }: WatermarkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUpload?.(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload?.(e.target.files[0]);
    }
  };

  if (uploadedFile) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              <img src={uploadedFile.preview} alt="Watermark" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-sm">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500">Custom watermark uploaded</p>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm block mb-2 font-medium">Upload Custom Watermark (Optional)</label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium">PNG or JPEG (max 5MB)</p>
        <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
      </div>
    </div>
  );
}
