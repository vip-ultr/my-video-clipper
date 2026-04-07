import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * Generate mock subtitle file for testing
 * In production, this would use Whisper transcription
 */
export function generateMockSubtitles(
  startTime: number,
  endTime: number,
  tempDir: string
): string | null {
  try {
    const duration = endTime - startTime;
    const subtitlePath = path.join(tempDir, `subtitles-${Date.now()}.srt`);

    // Create mock subtitle segments
    const segments: SubtitleSegment[] = [];
    const segmentDuration = 5; // 5 seconds per subtitle segment
    let currentTime = startTime;
    let segmentIndex = 1;

    const mockTexts = [
      'Amazing content here',
      'Keep watching',
      'This is great',
      'Don\'t miss this',
      'Check this out',
      'Incredible moment',
      'You\'ll love this',
      'Stay tuned'
    ];

    while (currentTime < endTime) {
      const segStart = currentTime;
      const segEnd = Math.min(currentTime + segmentDuration, endTime);
      const mockText = mockTexts[segmentIndex % mockTexts.length];

      segments.push({
        startTime: segStart,
        endTime: segEnd,
        text: mockText
      });

      currentTime = segEnd;
      segmentIndex++;
    }

    // Write SRT file
    let srtContent = '';
    segments.forEach((seg, index) => {
      const startStr = formatTime(seg.startTime - startTime); // Relative to clip start
      const endStr = formatTime(seg.endTime - startTime);
      srtContent += `${index + 1}\n${startStr} --> ${endStr}\n${seg.text}\n\n`;
    });

    fs.writeFileSync(subtitlePath, srtContent, 'utf-8');
    logger.info(`Generated mock subtitle file: ${subtitlePath}`);

    return subtitlePath;
  } catch (error) {
    logger.error('Failed to generate mock subtitles:', error);
    return null;
  }
}

/**
 * Format time for SRT format: HH:MM:SS,mmm
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * Convert subtitle file path for FFmpeg
 * FFmpeg filter syntax requires forward slashes on Windows
 */
export function escapeSubtitlePath(filePath: string): string {
  // Convert Windows backslashes to forward slashes for FFmpeg compatibility
  // FFmpeg prefers forward slashes even on Windows
  return filePath.replace(/\\/g, '/');
}
