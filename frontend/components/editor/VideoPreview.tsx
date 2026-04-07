'use client';

interface VideoPreviewProps {
  aspectRatio: string;
  quality: string;
  fps: number;
}

const ASPECT_CLASS: Record<string, string> = {
  '9:16':  'aspect-[9/16]  max-h-[520px]',
  '16:9':  'aspect-video   max-h-[400px]',
  '1:1':   'aspect-square  max-h-[440px]',
};

const ASPECT_LABEL: Record<string, string> = {
  '9:16':  'Vertical · 9:16',
  '16:9':  'Horizontal · 16:9',
  '1:1':   'Square · 1:1',
};

export function VideoPreview({ aspectRatio, quality, fps }: VideoPreviewProps) {
  const aspectClass = ASPECT_CLASS[aspectRatio] ?? ASPECT_CLASS['16:9'];
  const aspectLabel = ASPECT_LABEL[aspectRatio] ?? aspectRatio;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">Preview</p>

      <div className="bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center p-4">
        <div className={`w-full ${aspectClass} bg-gray-900 rounded-lg flex flex-col items-center justify-center relative`}>
          {/* Fake scan lines for aesthetics */}
          <div className="absolute inset-0 rounded-lg opacity-5"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 4px)' }}
          />
          <div className="relative text-center px-4">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-gray-600 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[10px] border-l-gray-400 border-y-[6px] border-y-transparent ml-0.5" />
            </div>
            <p className="text-white text-sm font-medium">Video Preview</p>
            <p className="text-gray-500 text-xs mt-1">{aspectLabel}</p>
          </div>
        </div>
      </div>

      {/* Settings summary pill row */}
      <div className="flex flex-wrap gap-2">
        {[
          aspectLabel,
          quality.charAt(0).toUpperCase() + quality.slice(1) + ' quality',
          `${fps} FPS`,
        ].map((tag) => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
