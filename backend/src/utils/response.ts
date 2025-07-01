import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

// ✅ FUNÇÃO para garantir timestamp UTC
const getUTCTimestamp = (): string => {
  return new Date().toISOString(); // Sempre retorna UTC
};

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  status: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: getUTCTimestamp(),
  };
  return res.status(status).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  status: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: getUTCTimestamp(),
  };
  return res.status(status).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response => {
  const totalPages = Math.ceil(total / limit);
  
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    message,
    timestamp: getUTCTimestamp(),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
  
  return res.json(response);
};

// ✅ FUNÇÃO UTILITÁRIA para converter datas para UTC
export const toUTC = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

// ✅ FUNÇÃO para formatar data em UTC brasileiro
export const formatToBrazilianUTC = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
};