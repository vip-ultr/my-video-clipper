import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

export async function analyzeSentiment(text: string): Promise<number> {
  try {
    if (!text || text.trim() === '') {
      return 0.5; // Neutral for empty text
    }

    // If no HuggingFace API key, return mock analysis
    if (!config.huggingface.apiKey) {
      logger.warn('HuggingFace API key not configured, using mock sentiment analysis');
      return getMockSentimentScore(text);
    }

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${config.huggingface.apiKey}`
        },
        timeout: 30000
      }
    );

    // Extract sentiment score from response
    if (Array.isArray(response.data) && response.data.length > 0) {
      const sentiments = response.data[0];
      const positiveScore = sentiments.find((s: any) => s.label === 'POSITIVE')?.score || 0;
      return Math.min(1, Math.max(0, positiveScore)); // Clamp between 0 and 1
    }

    return 0.5; // Default to neutral
  } catch (error) {
    logger.error('Sentiment analysis failed:', error);
    return 0.5; // Default to neutral on error
  }
}

export async function analyzeSegmentSentiment(
  segments: Array<{ start: number; end: number; text: string }>
): Promise<Array<{ start: number; end: number; score: number }>> {
  try {
    const results = [];

    for (const segment of segments) {
      const score = await analyzeSentiment(segment.text);
      results.push({
        start: segment.start,
        end: segment.end,
        score
      });
    }

    return results;
  } catch (error) {
    logger.error('Segment sentiment analysis failed:', error);
    return [];
  }
}

export function getMockSentimentScore(text: string): number {
  // Simple mock implementation based on keywords
  const positiveWords = ['great', 'amazing', 'awesome', 'love', 'excellent', 'perfect', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'poor', 'worst'];

  const lowerText = text.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveCount++;
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 0.5; // Neutral

  return Math.min(1, Math.max(0, positiveCount / total));
}

export function identifyHighEngagementSegments(
  sentimentScores: Array<{ start: number; end: number; score: number }>,
  threshold: number = 0.6
): Array<{ start: number; end: number; engagementScore: number }> {
  return sentimentScores
    .filter((segment) => segment.score >= threshold)
    .map((segment) => ({
      start: segment.start,
      end: segment.end,
      engagementScore: segment.score
    }));
}
