import express, { Request, Response } from 'express';
import { getVideo, getClips, saveClip } from '../services/supabase.js';
import { asyncHandler } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import { transcribeAudio } from '../services/whisper.js';
import { analyzeSegmentSentiment, identifyHighEngagementSegments } from '../services/sentiment.js';
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
    const { clippingMode = 'MANUAL', clipCount = 3, clipDuration = null } = req.body;

    const video = await getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    logger.info(`Generating clips for video: ${videoId}, mode: ${clippingMode}, count: ${clipCount}`);

    try {
      let clipSuggestions = [];

      if (clippingMode === 'MANUAL') {
        // Manual clipping math:
        // section_duration = total_duration / clip_count
        // each clip starts at section_number * section_duration
        const normalizedClipCount = Math.max(1, Math.floor(Number(clipCount) || 1));
        const sectionDuration = video.duration_seconds / normalizedClipCount;
        const desiredClipDuration = clipDuration && clipDuration > 0
          ? clipDuration
          : sectionDuration;

        for (let clipIndex = 0; clipIndex < normalizedClipCount; clipIndex++) {
          const startTime = Math.floor(clipIndex * sectionDuration);
          const endTime = Math.min(
            Math.floor(startTime + desiredClipDuration),
            video.duration_seconds
          );
          if (startTime >= endTime) {
            continue;
          }

          // Save clip suggestion to database
          const clipId = randomUUID();
          const clipData = {
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
          };

          await saveClip(clipData);

          clipSuggestions.push({
            id: clipId,
            index: clipIndex,
            startTime,
            endTime,
            duration: Math.ceil(endTime - startTime),
            engagementScore: 0.5, // Default for manual clips
            reason: `Segment ${clipIndex + 1} - ${Math.ceil(endTime - startTime)}s`
          });
        }
      } else if (clippingMode === 'AI') {
        // AI clipping: use sentiment analysis to identify high-engagement segments
        // For now, using mock data - in production would use real transcription and sentiment analysis
        const mockSegments = [
          { start: 0, end: Math.min(10, video.duration_seconds), score: 0.6 },
          { start: Math.min(10, video.duration_seconds), end: Math.min(20, video.duration_seconds), score: 0.8 },
          { start: Math.min(20, video.duration_seconds), end: Math.min(30, video.duration_seconds), score: 0.65 }
        ];

        // Filter high engagement segments (score > 0.7)
        const highEngagementSegments = mockSegments.filter(seg => seg.score > 0.7).slice(0, clipCount);

        let clipIndex = 0;
        for (const segment of highEngagementSegments) {
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
            engagementScore: segment.score,
            reason: 'High engagement detected'
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
