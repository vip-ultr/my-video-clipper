import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`[${req.method}] ${req.path}`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload failed';
    if (err.message.includes('LIMIT_FILE_SIZE')) {
      message = 'File size exceeds maximum limit (1.5GB)';
    } else if (err.message.includes('LIMIT_FILE_COUNT')) {
      message = 'Only one file can be uploaded at a time';
    }
    return res.status(400).json({ success: false, error: message });
  }

  res.status(500).json({
    success: false,
    error: err instanceof Error ? err.message : 'Internal server error'
  });
};
