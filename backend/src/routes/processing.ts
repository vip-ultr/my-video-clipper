import express, { Request, Response } from 'express';
import { getVideo, getClips, saveClip } from '../services/supabase.js';
import { asyncHandler } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Get processing status for a video
router.get(
  '/:videoId',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const video = await getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const clips = await getClips(videoId);

    const status = {
      videoId,
      projectName: video.project_name,
      totalDuration: video.duration_seconds,
      hasTranscript: !!video.transcript,
      hasSentimentAnalysis: !!video.sentiment_scores,
      clipsGenerated: clips.length,
      clips: clips.map((clip) => ({
        id: clip.id,
        index: clip.clip_index,
        startTime: clip.start_time,
        endTime: clip.end_time,
        duration: clip.duration_seconds,
        processed: clip.processed
      }))
    };

    res.json({ success: true, status });
  })
);

// Start processing (transcription + sentiment analysis)
router.post(
  '/:videoId/analyze',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const video = await getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    logger.info(`Starting analysis for video: ${videoId}`);

    // Mock analysis response
    const analysisData = {
      transcript: {
        text: 'Mock transcription of the video content',
        segments: [
          { start: 0, end: 10, text: 'Opening segment' },
          { start: 10, end: 20, text: 'Middle segment' },
          { start: 20, end: 30, text: 'Closing segment' }
        ],
        language: 'en'
      },
      sentimentScores: {
        overall: 0.7,
        segments: [
          { start: 0, end: 10, score: 0.6 },
          { start: 10, end: 20, score: 0.8 },
          { start: 20, end: 30, score: 0.65 }
        ]
      },
      suggestedClips: [
        {
          startTime: 10,
          endTime: 20,
          engagementScore: 0.8,
          reason: 'High engagement segment'
        }
      ]
    };

    // In a production app, you would:
    // 1. Extract audio from video
    // 2. Transcribe with Whisper
    // 3. Analyze sentiment for segments
    // 4. Identify high-engagement sections
    // 5. Generate clip suggestions

    res.json({
      success: true,
      analysis: analysisData
    });
  })
);

// Generate clip suggestions based on clipping mode
router.post(
  '/:videoId/generate-clips',
  asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const { clippingMode = 'MANUAL', clipCount = 3, clipDuration = null, customStartTimes = null, customEndTimes = null } = req.body;

    const video = await getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    logger.info(`Generating clips for video: ${videoId}, mode: ${clippingMode}, count: ${clipCount}`);

    try {
      let clipSuggestions = [];

      if (clippingMode === 'MANUAL') {
        const totalDuration = video.duration_seconds;
        if (!totalDuration || totalDuration <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid or unknown video duration. Please re-upload and try again.'
          });
        }

        const normalizedClipCount = Math.max(1, Math.floor(Number(clipCount) || 1));
        const desiredClipDuration = clipDuration && clipDuration > 0
          ? Number(clipDuration)
          : Math.floor(totalDuration / normalizedClipCount);

        const parseTime = (t: string | number): number => {
          if (typeof t === 'number') return t;
          const parts = String(t).split(':').map(Number);
          if (parts.length === 2) return parts[0] * 60 + parts[1];
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          return Number(t) || 0;
        };

        // Parse custom start/end times if provided (array of "MM:SS" or seconds)
        const parsedStartTimes: number[] | null =
          Array.isArray(customStartTimes) && customStartTimes.length > 0
            ? customStartTimes.map(parseTime)
            : null;

        const parsedEndTimes: number[] | null =
          Array.isArray(customEndTimes) && customEndTimes.length > 0
            ? customEndTimes.map(parseTime)
            : null;

        // Build start times: custom if provided, else sequential from 0
        const startTimes: number[] = parsedStartTimes
          ? parsedStartTimes.slice(0, normalizedClipCount)
          : Array.from({ length: normalizedClipCount }, (_, i) => i * desiredClipDuration);

        let clipIndex = 0;
        for (let i = 0; i < startTimes.length; i++) {
          const startTime = startTimes[i];
          // Stop if we've gone past the video
          if (startTime >= totalDuration) break;

          // Use custom end time if provided and valid, otherwise fall back to duration
          const customEnd = parsedEndTimes && parsedEndTimes[i] > 0 ? parsedEndTimes[i] : null;
          const endTime = Math.min(customEnd ?? startTime + desiredClipDuration, totalDuration);
          if (endTime <= startTime) break;

          const clipId = randomUUID();
          await saveClip({
            id: clipId,
            video_id: videoId,
            project_name: video.project_name,
            clip_index: clipIndex,
            start_time: startTime,
            end_time: endTime,
            duration_seconds: Math.ceil(endTime - startTime),
            subtitles_enabled: false,
            subtitle_style: 'default',
            subtitle_primary_color: '#FFFFFF',
            subtitle_secondary_color: '#999999',
            subtitle_position: 'bottom',
            blur_enabled: false,
            blur_strength: 15,
            watermark_type: 'none',
            watermark_id: null,
            watermark_position: 'bottom-right',
            watermark_size: 20,
            watermark_opacity: 80,
            aspect_ratio: '9:16',
            quality: 'medium',
            fps: 30,
            output_file_path: null,
            processed: false,
            download_count: 0,
            is_edited: false,
            created_at: new Date(),
            updated_at: new Date()
          });

          clipSuggestions.push({
            id: clipId,
            index: clipIndex,
            startTime,
            endTime,
            duration: Math.ceil(endTime - startTime),
            engagementScore: 0.5,
            reason: `Clip ${clipIndex + 1} — starts at ${String(Math.floor(startTime / 60)).padStart(2, '0')}:${String(startTime % 60).padStart(2, '0')}, ${Math.ceil(endTime - startTime)}s`
          });

          clipIndex++;
        }
      } else if (clippingMode === 'AI') {
        const totalDuration = video.duration_seconds;
        if (!totalDuration || totalDuration <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid or unknown video duration. Please re-upload and try again.'
          });
        }

        const normalizedClipCount = Math.max(1, Math.floor(Number(clipCount) || 1));
        const desiredDuration = clipDuration && clipDuration > 0
          ? Math.min(clipDuration, totalDuration)
          : Math.min(30, Math.floor(totalDuration / normalizedClipCount));

        // Build a pool of candidate segments spread across the full video.
        // Use 3x the requested count so there are enough candidates to rank.
        const poolSize = Math.max(normalizedClipCount * 3, 10);
        const step = totalDuration / poolSize;

        const candidates: { start: number; end: number; score: number }[] = [];
        for (let i = 0; i < poolSize; i++) {
          const start = Math.floor(i * step);
          const end = Math.min(start + desiredDuration, totalDuration);
          if (end <= start) continue;

          // Deterministic mock score based on position (simulates engagement curve)
          const position = start / totalDuration;
          const score = 0.4
            + 0.3 * Math.sin(position * Math.PI * 2)
            + 0.15 * Math.sin(position * Math.PI * 5)
            + 0.05 * (i % 3 === 0 ? 1 : 0); // occasional spikes

          candidates.push({ start, end, score: Math.min(1, Math.max(0, score)) });
        }

        // Sort by score descending and pick top clipCount non-overlapping segments
        candidates.sort((a, b) => b.score - a.score);
        const selected: typeof candidates = [];
        for (const candidate of candidates) {
          if (selected.length >= normalizedClipCount) break;
          const overlaps = selected.some(
            (s) => candidate.start < s.end && candidate.end > s.start
          );
          if (!overlaps) selected.push(candidate);
        }

        // Sort selected clips by start time for natural ordering
        selected.sort((a, b) => a.start - b.start);

        let clipIndex = 0;
        for (const segment of selected) {
          const clipId = randomUUID();
          const clipData = {
            id: clipId,
            video_id: videoId,
            project_name: video.project_name,
            clip_index: clipIndex,
            start_time: segment.start,
            end_time: segment.end,
            duration_seconds: Math.ceil(segment.end - segment.start),
            subtitles_enabled: false,
            subtitle_style: 'default',
            subtitle_primary_color: '#FFFFFF',
            subtitle_secondary_color: '#999999',
            subtitle_position: 'bottom',
            blur_enabled: false,
            blur_strength: 15,
            watermark_type: 'none',
            watermark_id: null,
            watermark_position: 'bottom-right',
            watermark_size: 20,
            watermark_opacity: 80,
            aspect_ratio: '9:16',
            quality: 'medium',
            fps: 30,
            output_file_path: null,
            processed: false,
            download_count: 0,
            is_edited: false,
            created_at: new Date(),
            updated_at: new Date()
          };

          await saveClip(clipData);

          clipSuggestions.push({
            id: clipId,
            index: clipIndex,
            startTime: segment.start,
            endTime: segment.end,
            duration: Math.ceil(segment.end - segment.start),
            engagementScore: Math.round(segment.score * 100) / 100,
            reason: `High engagement detected (score: ${(segment.score * 100).toFixed(0)}%)`
          });

          clipIndex++;
        }
      }

      res.json({
        success: true,
        mode: clippingMode,
        clipsGenerated: clipSuggestions.length,
        clips: clipSuggestions
      });

    } catch (error) {
      logger.error('Failed to generate clips:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate clips'
      });
    }
  })
);

export default router;
