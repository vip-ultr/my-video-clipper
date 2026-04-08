'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

interface VideoPreviewProps {
  aspectRatio: string;
  quality: string;
  fps: number;
  videoId?: string;
  startTime?: number;
  endTime?: number;
  blurEnabled?: boolean;
  blurStrength?: number;
  subtitlesEnabled?: boolean;
  subtitleStyle?: string;
  subtitlePrimaryColor?: string;
  subtitlePosition?: string;
  subtitleUppercase?: boolean;
  watermarkType?: string;
  watermarkId?: string | null;
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

const SUBTITLE_STYLES: Record<string, React.CSSProperties> = {
  emphasis: { fontFamily: 'sans-serif', fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 6px rgba(0,0,0,0.8)', lineHeight: 1.3 },
  rhythm:   { fontFamily: 'sans-serif', fontSize: '1rem',    fontWeight: 400, fontStyle: 'italic', color: '#ffffff', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 4px rgba(0,0,0,0.6)', lineHeight: 1.4 },
  uniform:  { fontFamily: 'sans-serif', fontSize: '1rem',    fontWeight: 400, color: '#ffffff', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000', lineHeight: 1.4 },
  default:  { fontFamily: 'sans-serif', fontSize: '0.95rem', fontWeight: 400, color: '#ffffff', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000', lineHeight: 1.4 },
  classic:  { fontFamily: 'serif',      fontSize: '1.05rem', fontWeight: 400, color: '#ffffff', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 8px rgba(0,0,0,0.7)', lineHeight: 1.4 },
  bold:     { fontFamily: 'sans-serif', fontSize: '1.2rem',  fontWeight: 700, color: '#ffff00', textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 8px rgba(0,0,0,0.9)', lineHeight: 1.3 },
  minimal:  { fontFamily: 'sans-serif', fontSize: '0.85rem', fontWeight: 400, color: '#ffffff', textShadow: '-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000', lineHeight: 1.5 },
  tiktok:   { fontFamily: 'sans-serif', fontSize: '1.2rem',  fontWeight: 700, color: '#ffffff', textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 0 4px 10px rgba(0,0,0,0.9)', lineHeight: 1.25 },
};

function subtitlePositionStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'top':    return { top: '8%',  bottom: 'auto', transform: 'none' };
    case 'center': return { top: '50%', bottom: 'auto', transform: 'translateY(-50%)' };
    default:       return { bottom: '14%', top: 'auto', transform: 'none' }; // above controls bar
  }
}

function watermarkPositionStyle(position: string, size: number): React.CSSProperties {
  const sz = `${size * 0.5}%`;
  const base: React.CSSProperties = { position: 'absolute', width: sz, maxWidth: '80px', minWidth: '24px', pointerEvents: 'none' };
  switch (position) {
    case 'top-left':    return { ...base, top: '6%',    left: '6%'   };
    case 'top-right':   return { ...base, top: '6%',    right: '6%'  };
    case 'bottom-left': return { ...base, bottom: '16%', left: '6%'  };
    default:            return { ...base, bottom: '16%', right: '6%' };
  }
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 19l2 2L21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
      <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

// ── Custom player controls ────────────────────────────────────────────────────

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}

function PlayerControls({ videoRef, containerRef }: PlayerControlsProps) {
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted]       = useState(false);
  const [volume, setVolume]     = useState(1);
  const [visible, setVisible]   = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  const showControls = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay      = () => setPlaying(true);
    const onPause     = () => setPlaying(false);
    const onTime      = () => setCurrent(v.currentTime);
    const onMeta      = () => setDuration(v.duration);
    const onEnded     = () => setPlaying(false);
    v.addEventListener('play',             onPlay);
    v.addEventListener('pause',            onPause);
    v.addEventListener('timeupdate',       onTime);
    v.addEventListener('loadedmetadata',   onMeta);
    v.addEventListener('durationchange',   onMeta);
    v.addEventListener('ended',            onEnded);
    return () => {
      v.removeEventListener('play',           onPlay);
      v.removeEventListener('pause',          onPause);
      v.removeEventListener('timeupdate',     onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('durationchange', onMeta);
      v.removeEventListener('ended',          onEnded);
    };
  }, [videoRef]);

  // Show controls on mouse move, hide after idle
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', showControls);
    el.addEventListener('mouseleave', () => setVisible(false));
    showControls();
    return () => {
      el.removeEventListener('mousemove', showControls);
      el.removeEventListener('mouseleave', () => setVisible(false));
    };
  }, [containerRef, showControls]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    v.muted  = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const fullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <>
      {/* Centre play/pause tap target */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full z-10 focus:outline-none"
        aria-label={playing ? 'Pause' : 'Play'}
      />

      {/* Centre big play button — only when paused */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <PlayIcon />
          </div>
        </div>
      )}

      {/* Bottom controls bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* Gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none rounded-b-lg" />

        <div className="relative px-3 pb-3 pt-6 space-y-1.5">
          {/* Scrubber */}
          <div className="relative h-1 group">
            <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: '100%' }} />
            <div className="absolute inset-y-0 left-0 bg-white rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.01}
              value={current}
              onChange={seek}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
              style={{ zIndex: 1 }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Play/pause */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="text-white hover:text-gray-300 transition-colors shrink-0"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Time */}
            <span className="text-white text-xs tabular-nums shrink-0">
              {formatTime(current)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors shrink-0"
                aria-label="Toggle mute"
              >
                <VolumeIcon muted={muted} />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={changeVolume}
                className="w-16 accent-white cursor-pointer"
              />
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fullscreen(); }}
              className="text-white hover:text-gray-300 transition-colors shrink-0"
              aria-label="Fullscreen"
            >
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VideoPreview({
  aspectRatio, quality, fps,
  videoId, startTime = 0, endTime,
  blurEnabled = false, blurStrength = 15,
  subtitlesEnabled = false, subtitleStyle = 'default', subtitlePrimaryColor, subtitlePosition = 'bottom', subtitleUppercase = false,
  watermarkType = 'none', watermarkId = null, watermarkPosition = 'bottom-right', watermarkSize = 20, watermarkOpacity = 80,
}: VideoPreviewProps) {
  const fgRef        = useRef<HTMLVideoElement>(null);
  const bgRef        = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading]           = useState(false);
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);

  // Derive the watermark preview endpoint URL whenever type/id changes
  const watermarkPreviewUrl = useMemo(() => {
    if (watermarkType === 'none') return null;
    if (watermarkType === 'default') return `${API_BASE}/watermark/preview?id=default`;
    if (watermarkType === 'custom' && watermarkId) return `${API_BASE}/watermark/preview?id=${watermarkId}`;
    return null;
  }, [watermarkType, watermarkId]);

  // Fetch watermark as object URL so it works across origins and avoids CORS issues
  useEffect(() => {
    if (!watermarkPreviewUrl) { setWatermarkUrl(null); return; }
    let revoked = false;
    fetch(watermarkPreviewUrl)
      .then((r) => r.ok ? r.blob() : null)
      .then((blob) => {
        if (!blob || revoked) return;
        setWatermarkUrl(URL.createObjectURL(blob));
      })
      .catch(() => setWatermarkUrl(null));
    return () => { revoked = true; };
  }, [watermarkPreviewUrl]);

  const clipUrl = (videoId && endTime && endTime > startTime)
    ? `${API_BASE}/upload/${videoId}/preview-clip?start=${startTime}&end=${endTime}`
    : null;

  const aspectClass = ASPECT_RATIO_STYLE[aspectRatio] ?? ASPECT_RATIO_STYLE['16:9'];
  const aspectLabel = ASPECT_LABEL[aspectRatio] ?? aspectRatio;
  const blurPx = Math.round((blurStrength / 50) * 24);

  const syncBg = useCallback(() => {
    if (bgRef.current && fgRef.current) bgRef.current.currentTime = fgRef.current.currentTime;
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const onPlay   = () => { bgRef.current?.play().catch(() => {}); };
    const onPause  = () => { bgRef.current?.pause(); };
    fg.addEventListener('play',   onPlay);
    fg.addEventListener('pause',  onPause);
    fg.addEventListener('seeked', syncBg);
    return () => {
      fg.removeEventListener('play',   onPlay);
      fg.removeEventListener('pause',  onPause);
      fg.removeEventListener('seeked', syncBg);
    };
  }, [syncBg]);

  // Show spinner while preview clip is loading
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const onWaiting  = () => setLoading(true);
    const onCanPlay  = () => setLoading(false);
    fg.addEventListener('waiting',  onWaiting);
    fg.addEventListener('canplay',  onCanPlay);
    fg.addEventListener('playing',  onCanPlay);
    return () => {
      fg.removeEventListener('waiting', onWaiting);
      fg.removeEventListener('canplay', onCanPlay);
      fg.removeEventListener('playing', onCanPlay);
    };
  }, []);

  const subStyle: React.CSSProperties = {
    ...(SUBTITLE_STYLES[subtitleStyle] ?? SUBTITLE_STYLES['default']),
    ...(subtitlePrimaryColor ? { color: subtitlePrimaryColor } : {}),
    ...(subtitleUppercase ? { textTransform: 'uppercase' as const } : {}),
  };

  const showWatermark = watermarkType !== 'none';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Preview</p>
        <span className="text-xs text-gray-400 font-medium">{aspectLabel}</span>
      </div>

      {/* Player shell */}
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
        <div
          ref={containerRef}
          className={`w-full ${aspectClass} relative bg-black select-none`}
          style={{ cursor: 'default' }}
        >
          {clipUrl ? (
            <>
              {/* Blur bg layer */}
              {blurEnabled && (
                <video
                  ref={bgRef}
                  src={clipUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ objectFit: 'cover', filter: `blur(${blurPx}px)`, transform: 'scale(1.05)' }}
                />
              )}

              {/* Foreground video — no native controls */}
              <video
                ref={fgRef}
                src={clipUrl}
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: blurEnabled ? 'contain' : 'cover' }}
                onLoadStart={() => setLoading(true)}
                onCanPlay={() => setLoading(false)}
              />

              {/* Loading spinner */}
              {loading && <LoadingSpinner />}

              {/* Subtitle overlay */}
              {subtitlesEnabled && (
                <div
                  className="absolute left-0 right-0 px-4 text-center pointer-events-none z-10"
                  style={subtitlePositionStyle(subtitlePosition)}
                >
                  <span style={subStyle}>This is how your subtitles will appear</span>
                </div>
              )}

              {/* Watermark overlay */}
              {showWatermark && (
                <div style={{ ...watermarkPositionStyle(watermarkPosition, watermarkSize), opacity: watermarkOpacity / 100, zIndex: 10 }}>
                  {watermarkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={watermarkUrl}
                      alt="watermark"
                      draggable={false}
                      className="w-full h-auto select-none pointer-events-none"
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div
                      className="rounded flex items-center justify-center text-white font-bold select-none"
                      style={{ width: '100%', aspectRatio: '1', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.3)', fontSize: '0.6rem' }}
                    >
                      WM
                    </div>
                  )}
                </div>
              )}

              {/* Custom player controls */}
              <PlayerControls videoRef={fgRef} containerRef={containerRef} />
            </>
          ) : (
            /* Placeholder */
            <>
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 4px)' }} />
              <div className="relative flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-gray-700 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">No clip selected</p>
                <p className="text-gray-600 text-xs mt-1">{aspectLabel}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active settings pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          quality.charAt(0).toUpperCase() + quality.slice(1) + ' quality',
          `${fps} FPS`,
          ...(blurEnabled     ? [`Blur ${blurStrength}`] : []),
          ...(subtitlesEnabled ? [subtitleStyle.charAt(0).toUpperCase() + subtitleStyle.slice(1) + ' subs'] : []),
          ...(showWatermark   ? ['Watermark'] : []),
        ].map((tag) => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
