import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    timestamp: new Date().toISOString(),
  },
});

// CORS configuration
export const corsOptions = {
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Error handler
export const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('Error:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Not found handler
export const notFoundHandler = (
  req: express.Request,
  res: express.Response
) => {
  res.status(404).json({
    success: false,
    error: `Rota ${req.method} ${req.path} não encontrada`,
    timestamp: new Date().toISOString(),
  });
};

// Request logger
export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms'
);
