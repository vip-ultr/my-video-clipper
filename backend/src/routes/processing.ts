import express, { Request, Response } from 'express';
import { getVideo, getClips } from '../services/supabase';
import { asyncHandler } from '../middleware/validation';
import { logger } from '../utils/logger';
import { transcribeAudio } from '../services/whisper';
import { analyzeSegmentSentiment } from '../services/sentiment';

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

export default router;
