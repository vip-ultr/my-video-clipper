import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { extractAudio } from './ffmpeg.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhisperChunk {
  timestamp: [number, number | null];
  text: string;
}

// ─── HuggingFace Whisper API ──────────────────────────────────────────────────

function callWhisperAPI(audioPath: string, apiKey: string): Promise<WhisperChunk[]> {
  const audioData = fs.readFileSync(audioPath);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-inference.huggingface.co',
      path: '/models/openai/whisper-large-v3?return_timestamps=true',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
          if (parsed.error) {
            reject(new Error(`Whisper API: ${parsed.error}`));
            return;
          }
          // Response shape: { text, chunks: [{timestamp:[start,end], text}] }
          const chunks: WhisperChunk[] = (parsed.chunks || []).filter(
            (c: any) => c.text?.trim() && Array.isArray(c.timestamp)
          );
          resolve(chunks);
        } catch {
          reject(new Error(`Unparseable Whisper response: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(90000, () => {
      req.destroy();
      reject(new Error('Whisper API timed out'));
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

function chunksToSRT(chunks: WhisperChunk[]): string {
  return chunks
    .filter(c => c.text.trim())
    .map((c, i) => {
      const start = c.timestamp[0];
      const end = c.timestamp[1] ?? start + 2;
      return `${i + 1}\n${toSRTTime(start)} --> ${toSRTTime(Math.max(start + 0.1, end))}\n${c.text.trim()}\n`;
    })
    .join('\n');
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function buildMockSRT(startTime: number, endTime: number): string {
  const texts = ['Amazing content', 'Keep watching', 'Check this out', 'Incredible moment', 'Stay tuned'];
  let srt = '';
  let t = 0;
  let i = 1;
  const clipDuration = endTime - startTime;
  while (t < clipDuration) {
    const segEnd = Math.min(t + 5, clipDuration);
    srt += `${i}\n${toSRTTime(t)} --> ${toSRTTime(segEnd)}\n${texts[i % texts.length]}\n\n`;
    t = segEnd;
    i++;
  }
  return srt;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate subtitle SRT for a clip.
 * 1. Extracts 16 kHz mono WAV audio from the clip via FFmpeg.
 * 2. Sends to HuggingFace Whisper API for transcription.
 * 3. Falls back to mock subtitles if no API key or transcription fails.
 * The original video audio stream is NOT removed — burnSubtitles keeps it.
 */
export async function generateSubtitles(
  clipPath: string,
  startTime: number,
  endTime: number,
  tempDir: string,
  apiKey?: string
): Promise<string | null> {
  const subtitlePath = path.join(tempDir, `subtitles-${Date.now()}.srt`);
  const audioPath = path.join(tempDir, `audio-${Date.now()}.wav`);

  try {
    if (apiKey) {
      try {
        // Step 1: extract audio from clip
        logger.info(`Extracting audio for transcription: ${clipPath}`);
        await extractAudio(clipPath, audioPath);

        // Step 2: transcribe with Whisper
        logger.info('Calling HuggingFace Whisper API...');
        const chunks = await callWhisperAPI(audioPath, apiKey);

        if (chunks.length > 0) {
          fs.writeFileSync(subtitlePath, chunksToSRT(chunks), 'utf-8');
          logger.info(`Whisper subtitles written (${chunks.length} segments): ${subtitlePath}`);
          return subtitlePath;
        }

        logger.warn('Whisper returned no segments — falling back to mock subtitles');
      } catch (err) {
        logger.warn(`Whisper failed, using mock subtitles: ${err instanceof Error ? err.message : err}`);
      } finally {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      }
    } else {
      logger.warn('No HUGGINGFACE_API_KEY — using mock subtitles');
    }

    // Fallback
    fs.writeFileSync(subtitlePath, buildMockSRT(startTime, endTime), 'utf-8');
    return subtitlePath;
  } catch (error) {
    logger.error('generateSubtitles failed:', error);
    return null;
  }
}

/**
 * Convert subtitle file path for FFmpeg filter syntax.
 */
export function escapeSubtitlePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}
