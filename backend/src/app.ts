import express from 'express';
import { env } from './config/env';
import {
  corsOptions,
  rateLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger,
} from './middleware';
import routes from './routes';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(requestLogger);

// Rotas
app.use('/api', routes);

// Handlers de erro
app.use(notFoundHandler);
app.use(errorHandler);

export default app;