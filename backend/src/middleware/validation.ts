import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export const validateClipSettings = (req: Request, res: Response, next: NextFunction) => {
  const {
    videoId,
    startTime,
    endTime,
    projectName,
    aspectRatio,
    quality
  } = req.body;

  if (!videoId || typeof startTime !== 'number' || typeof endTime !== 'number') {
    throw new AppError(400, 'Missing or invalid required fields');
  }

  if (startTime >= endTime) {
    throw new AppError(400, 'Start time must be less than end time');
  }

  const validAspectRatios = ['9:16', '16:9', '1:1'];
  if (!validAspectRatios.includes(aspectRatio)) {
    throw new AppError(400, 'Invalid aspect ratio');
  }

  const validQualities = ['low', 'medium', 'high'];
  if (!validQualities.includes(quality)) {
    throw new AppError(400, 'Invalid quality');
  }

  next();
};

export const validateProjectName = (req: Request, res: Response, next: NextFunction) => {
  const { projectName } = req.body;

  if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
    throw new AppError(400, 'Project name is required');
  }

  next();
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
