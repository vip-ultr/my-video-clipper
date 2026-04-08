'use client';

import { useRef, useEffect, useCallback } from 'react';

interface VideoPreviewProps {
  aspectRatio: string;
  quality: string;
  fps: number;
  videoId?: string;
  startTime?: number;
  endTime?: number;
  // Blur
  blurEnabled?: boolean;
  blurStrength?: number;
  // Subtitles
  subtitlesEnabled?: boolean;
  subtitleStyle?: string;
  subtitlePrimaryColor?: string;
  subtitlePosition?: string;
  subtitleUppercase?: boolean;
  // Watermark
  watermarkType?: string;
  watermarkPosition?: string;
  watermarkSize?: number;
  watermarkOpacity?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ASPECT_RATIO_STYLE: Record<string, string> = {
  '9:16': 'aspect-[9/16] max-h-[520px]',
  '16:9': 'aspect-video  max-h-[400px]',
  '1:1':  'aspect-square max-h-[440px]',
};

const ASPECT_LABEL: Record<string, string> = {
  '9:16': 'Vertical · 9:16',
  '16:9': 'Horizontal · 16:9',
  '1:1':  'Square · 1:1',
};

// CSS subtitle styles that mirror the FFmpeg ASS presets
const SUBTITLE_STYLES: Record<string, React.CSSProperties> = {
  emphasis: {
    fontFamily: 'sans-serif',
    fontSize: '1.15rem',
    fontWeight: 700,
    fontStyle: 'normal',
    color: '#ffffff',
    textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.8)',
    lineHeight: 1.3,
  },
  rhythm: {
    fontFamily: 'sans-serif',
    fontSize: '1rem',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#ffffff',
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.6)',
    lineHeight: 1.4,
  },
  uniform: {
    fontFamily: 'sans-serif',
    fontSize: '1rem',
    fontWeight: 400,
    fontStyle: 'normal',
    color: '#ffffff',
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    lineHeight: 1.4,
  },
  default: {
    fontFamily: 'sans-serif',
    fontSize: '0.95rem',
    fontWeight: 400,
    color: '#ffffff',
    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
    lineHeight: 1.4,
  },
  classic: {
    fontFamily: 'serif',
    fontSize: '1.05rem',
    fontWeight: 400,
    color: '#ffffff',
    textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.7)',
    lineHeight: 1.4,
  },
  bold: {
    fontFamily: 'sans-serif',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffff00',
    textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.9)',
    lineHeight: 1.3,
  },
  minimal: {
    fontFamily: 'sans-serif',
    fontSize: '0.85rem',
    fontWeight: 400,
    color: '#ffffff',
    textShadow: '-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000',
    lineHeight: 1.5,
  },
  tiktok: {
    fontFamily: 'sans-serif',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff',
    textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 0 4px 10px rgba(0,0,0,0.9)',
    lineHeight: 1.25,
  },
};

function subtitlePositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top':    return { top: '8%',  bottom: 'auto', transform: 'none' };
    case 'center': return { top: '50%', bottom: 'auto', transform: 'translateY(-50%)' };
    default:       return { bottom: '8%', top: 'auto', transform: 'none' };
  }
}

function watermarkPositionStyle(position: string, size: number): React.CSSProperties {
  const sz = `${size * 0.5}%`;
  const base: React.CSSProperties = { position: 'absolute', width: sz, maxWidth: '80px', minWidth: '24px', pointerEvents: 'none' };
  switch (position) {
    case 'top-left':     return { ...base, top: '6%',  left:  '6%'  };
    case 'top-right':    return { ...base, top: '6%',  right: '6%'  };
    case 'bottom-left':  return { ...base, bottom: '6%', left:  '6%'  };
    default:             return { ...base, bottom: '6%', right: '6%'  };
  }
}

export function VideoPreview({
  aspectRatio, quality, fps,
  videoId, startTime = 0,
  blurEnabled = false, blurStrength = 15,
  subtitlesEnabled = false, subtitleStyle = 'default', subtitlePrimaryColor, subtitlePosition = 'bottom', subtitleUppercase = false,
  watermarkType = 'none', watermarkPosition = 'bottom-right', watermarkSize = 20, watermarkOpacity = 80,
}: VideoPreviewProps) {
  const fgRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);

  const streamUrl = videoId ? `${API_BASE}/upload/${videoId}/stream` : null;
  const aspectClass = ASPECT_RATIO_STYLE[aspectRatio] ?? ASPECT_RATIO_STYLE['16:9'];
  const aspectLabel = ASPECT_LABEL[aspectRatio] ?? aspectRatio;
  const blurPx = Math.round((blurStrength / 50) * 24); // map 0-50 → 0-24px CSS blur

  // Keep bg video in sync with fg video
  const syncBg = useCallback(() => {
    if (bgRef.current && fgRef.current) {
      bgRef.current.currentTime = fgRef.current.currentTime;
    }
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.addEventListener('play',   () => { bgRef.current?.play().catch(() => {}); });
    fg.addEventListener('pause',  () => { bgRef.current?.pause(); });
    fg.addEventListener('seeked', syncBg);
  }, [syncBg]);

  // Seek to clip start once metadata loads
  const handleMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    (e.target as HTMLVideoElement).currentTime = startTime;
  };

  // Build subtitle text style — override primaryColor if custom
  const subStyle: React.CSSProperties = {
    ...(SUBTITLE_STYLES[subtitleStyle] ?? SUBTITLE_STYLES['default']),
    ...(subtitlePrimaryColor ? { color: subtitlePrimaryColor } : {}),
    ...(subtitleUppercase ? { textTransform: 'uppercase' as const } : {}),
  };

  const showWatermark = watermarkType !== 'none';

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">Preview</p>

      <div className="bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center p-4">
        <div className={`w-full ${aspectClass} rounded-lg overflow-hidden relative bg-black`}>

          {streamUrl ? (
            <>
              {/* ── Blur background layer (only when blur enabled) ── */}
              {blurEnabled && (
                <video
                  ref={bgRef}
                  src={streamUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ objectFit: 'cover', filter: `blur(${blurPx}px)`, transform: 'scale(1.05)' }}
                  onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = startTime; }}
                />
              )}

              {/* ── Foreground video ── */}
              <video
                ref={fgRef}
                src={streamUrl}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: blurEnabled ? 'contain' : 'cover' }}
                onLoadedMetadata={handleMetadata}
              />

              {/* ── Subtitle overlay ── */}
              {subtitlesEnabled && (
                <div
                  className="absolute left-0 right-0 px-4 text-center pointer-events-none z-10"
                  style={subtitlePositionStyle(subtitlePosition)}
                >
                  <span style={subStyle}>
                    This is how your subtitles will appear
                  </span>
                </div>
              )}

              {/* ── Watermark overlay ── */}
              {showWatermark && (
                <div
                  style={{
                    ...watermarkPositionStyle(watermarkPosition, watermarkSize),
                    opacity: watermarkOpacity / 100,
                    zIndex: 10,
                  }}
                >
                  {/* Placeholder badge — matches the "W" logo look */}
                  <div
                    className="rounded flex items-center justify-center text-white font-bold text-xs select-none"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      background: 'rgba(0,0,0,0.55)',
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      fontSize: '0.65rem',
                    }}
                  >
                    WM
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── No video yet: placeholder ── */
            <>
              <div
                className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 4px)' }}
              />
              <div className="relative flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-gray-600 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[10px] border-l-gray-400 border-y-[6px] border-y-transparent ml-0.5" />
                </div>
                <p className="text-white text-sm font-medium">Video Preview</p>
                <p className="text-gray-500 text-xs mt-1">{aspectLabel}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings pills */}
      <div className="flex flex-wrap gap-2">
        {[
          aspectLabel,
          quality.charAt(0).toUpperCase() + quality.slice(1) + ' quality',
          `${fps} FPS`,
          ...(blurEnabled ? [`Blur ${blurStrength}`] : []),
          ...(subtitlesEnabled ? [subtitleStyle.charAt(0).toUpperCase() + subtitleStyle.slice(1) + ' subs'] : []),
          ...(showWatermark ? ['Watermark'] : []),
        ].map((tag) => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
