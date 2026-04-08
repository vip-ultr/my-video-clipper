import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { extractAudio, extractAudioSegment } from './ffmpeg.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  punctuated_word?: string;
}

// ─── Deepgram API ─────────────────────────────────────────────────────────────

function callDeepgramAPI(audioPath: string, apiKey: string): Promise<DeepgramWord[]> {
  const audioData = fs.readFileSync(audioPath);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.deepgram.com',
      path: '/v1/listen?punctuate=true&utterances=true',
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'audio/wav',
        'Content-Length': audioData.length
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk.toString(); });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.err_msg) {
            reject(new Error(`Deepgram API error: ${parsed.err_msg}`));
            return;
          }
          const words: DeepgramWord[] =
            parsed?.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
          resolve(words);
        } catch {
          reject(new Error(`Unparseable Deepgram response: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(90000, () => {
      req.destroy();
      reject(new Error('Deepgram API timed out'));
    });

    req.on('error', reject);
    req.write(audioData);
    req.end();
  });
}

// ─── SRT helpers ─────────────────────────────────────────────────────────────

function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Maps position name → ASS \an alignment tag embedded in SRT text.
// Inline \an tags are always honoured by FFmpeg's SRT→ASS converter,
// unlike force_style Alignment which is silently ignored for SRT inputs.
function positionTag(position: string): string {
  switch (position) {
    case 'top':    return '{\\an8}';
    case 'center': return '{\\an5}';
    default:       return '{\\an2}'; // bottom
  }
}

// Group words into short subtitle chunks (1–3 words):
// - hard cap of 3 words per entry
// - max 1.5 seconds per entry so words flash quickly
// - keeps natural phrasing via punctuated_word
function wordsToSRT(words: DeepgramWord[], uppercase = false, position = 'bottom'): string {
  const MAX_WORDS = 3;
  const MAX_DURATION = 1.5;
  const tag = positionTag(position);
  const entries: string[] = [];
  let i = 0;
  let index = 1;

  while (i < words.length) {
    const groupStart = words[i].start;
    const group: string[] = [];
    let j = i;

    while (j < words.length) {
      const w = words[j];
      const duration = w.end - groupStart;
      if (group.length >= MAX_WORDS || (group.length > 0 && duration > MAX_DURATION)) break;
      group.push(w.punctuated_word || w.word);
      j++;
    }

    const groupEnd = words[j - 1].end;
    const raw = group.join(' ').trim();
    const text = uppercase ? raw.toUpperCase() : raw;

    if (text) {
      entries.push(`${index}\n${toSRTTime(groupStart)} --> ${toSRTTime(groupEnd)}\n${tag}${text}\n`);
      index++;
    }

    i = j;
  }

  return entries.join('\n');
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function buildMockSRT(startTime: number, endTime: number, position = 'bottom'): string {
  const texts = ['Amazing', 'Keep watching', 'Check this', 'Incredible', 'Stay tuned', 'Right here', 'Look at this', 'So good'];
  const tag = positionTag(position);
  let srt = '';
  let t = 0;
  let idx = 1;
  const clipDuration = endTime - startTime;
  while (t < clipDuration) {
    const segEnd = Math.min(t + 1.5, clipDuration);
    srt += `${idx}\n${toSRTTime(t)} --> ${toSRTTime(segEnd)}\n${tag}${texts[idx % texts.length]}\n\n`;
    t = segEnd;
    idx++;
  }
  return srt;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate subtitle SRT for a clip.
 * 1. Extracts 16 kHz mono WAV from the clip via FFmpeg.
 * 2. Sends to Deepgram for word-level transcription.
 * 3. Groups words into subtitle chunks (max 5 words / 3 s).
 * 4. Falls back to mock subtitles if no API key or transcription fails.
 */
export async function generateSubtitles(
  clipPath: string,
  startTime: number,
  endTime: number,
  tempDir: string,
  apiKey?: string,
  uppercase = false,
  position = 'bottom'
): Promise<string | null> {
  const subtitlePath = path.join(tempDir, `subtitles-${Date.now()}.srt`);
  const audioPath = path.join(tempDir, `audio-${Date.now()}.wav`);

  try {
    if (apiKey) {
      try {
        logger.info(`Extracting audio for transcription: ${clipPath}`);
        await extractAudio(clipPath, audioPath);

        logger.info('Calling Deepgram API...');
        const words = await callDeepgramAPI(audioPath, apiKey);

        if (words.length > 0) {
          fs.writeFileSync(subtitlePath, wordsToSRT(words, uppercase, position), 'utf-8');
          logger.info(`Deepgram subtitles written (${words.length} words → SRT): ${subtitlePath}`);
          return subtitlePath;
        }

        logger.warn('Deepgram returned no words — falling back to mock subtitles');
      } catch (err) {
        logger.warn(`Deepgram failed, using mock subtitles: ${err instanceof Error ? err.message : err}`);
      } finally {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      }
    } else {
      logger.warn('No DEEPGRAM_API_KEY — using mock subtitles');
    }

    fs.writeFileSync(subtitlePath, buildMockSRT(startTime, endTime, position), 'utf-8');
    return subtitlePath;
  } catch (error) {
    logger.error('generateSubtitles failed:', error);
    return null;
  }
}

export function escapeSubtitlePath(filePath: string): string {
  // Convert backslashes to forward slashes
  let p = filePath.replace(/\\/g, '/');
  // FFmpeg's subtitle filter treats ':' as an option separator, so the Windows
  // drive letter colon must be escaped (e.g. C:/... → C\:/...)
  // On Linux paths (starting with '/') this regex won't match — safe either way.
  p = p.replace(/^([A-Za-z]):/, '$1\\:');
  return p;
}

// ─── Segment-level subtitle generation (returns SRT string) ──────────────────

/**
 * Generates SRT content for a specific time range of a source video.
 * Extracts audio from [startTime, endTime], transcribes via Deepgram (or mock),
 * and returns the raw SRT string — no files written by this function.
 */
export async function generateSubtitlesContent(
  sourceVideoPath: string,
  startTime: number,
  endTime: number,
  tempDir: string,
  apiKey?: string,
  uppercase = false
): Promise<string> {
  const audioPath = path.join(tempDir, `sub-audio-${Date.now()}.wav`);

  try {
    await extractAudioSegment(sourceVideoPath, startTime, endTime, audioPath);

    if (apiKey) {
      try {
        logger.info('Calling Deepgram API for subtitle preview...');
        const words = await callDeepgramAPI(audioPath, apiKey);
        if (words.length > 0) {
          logger.info(`Deepgram subtitle preview: ${words.length} words`);
          return wordsToSRT(words, uppercase);
        }
        logger.warn('Deepgram returned no words — falling back to mock');
      } catch (err) {
        logger.warn(`Deepgram failed for preview, using mock: ${err instanceof Error ? err.message : err}`);
      }
    } else {
      logger.warn('No DEEPGRAM_API_KEY — using mock subtitles for preview');
    }

    return buildMockSRT(0, endTime - startTime);
  } finally {
    try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {}
  }
}

// ─── SRT parser ──────────────────────────────────────────────────────────────

export interface SRTEntry {
  start: number;
  end: number;
  text: string;
}

function srtTimeToSeconds(t: string): number {
  const [hms, ms] = t.split(',');
  const [h, m, s] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + s + Number(ms) / 1000;
}

export function parseSRTToEntries(srt: string): SRTEntry[] {
  const blocks = srt.trim().split(/\n\s*\n/);
  return blocks.flatMap((block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 3) return [];
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) return [];
    return [{
      start: srtTimeToSeconds(timeMatch[1]),
      end:   srtTimeToSeconds(timeMatch[2]),
      text:  lines.slice(2).join(' ').trim(),
    }];
  });
}
