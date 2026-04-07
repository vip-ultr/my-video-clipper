'use client';

interface VideoPreviewProps {
  aspectRatio: string;
  quality: string;
  fps: number;
}

export function VideoPreview({ aspectRatio, quality, fps }: VideoPreviewProps) {
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16]';
      case '16:9':
        return 'aspect-video';
      case '1:1':
        return 'aspect-square';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
      <div className={`w-full ${getAspectRatioClass()} bg-black flex flex-col items-center justify-center text-white`}>
        <div className="text-center">
          <p className="text-lg font-semibold">Video Preview</p>
          <p className="text-sm text-gray-400 mt-2">
            {aspectRatio} • {quality} quality • {fps} FPS
          </p>
        </div>
      </div>
    </div>
  );
}
