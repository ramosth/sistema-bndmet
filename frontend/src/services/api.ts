import axios from 'axios';
import { DadosSensor, ApiResponse, PaginatedResponse, Estatisticas, LogSistema } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para log de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const sensorService = {
  // Buscar últimas leituras
  async getUltimasLeituras(limite: number = 100): Promise<DadosSensor[]> {
    const response = await api.get<ApiResponse<DadosSensor[]>>(`/sensor/ultimas?limite=${limite}`);
    return response.data.data || [];
  },

  // Buscar leituras por período
  async getLeiturasPorPeriodo(
    dataInicio: string,
    dataFim: string,
    pagina: number = 1,
    limite: number = 50
  ): Promise<PaginatedResponse<DadosSensor>> {
    const response = await api.get<PaginatedResponse<DadosSensor>>(
      `/sensor/periodo?dataInicio=${dataInicio}&dataFim=${dataFim}&pagina=${pagina}&limite=${limite}`
    );
    return response.data;
  },

  // Buscar alertas críticos
  async getAlertas(limite: number = 50): Promise<DadosSensor[]> {
    const response = await api.get<ApiResponse<DadosSensor[]>>(`/sensor/alertas?limite=${limite}`);
    return response.data.data || [];
  },

  // Obter estatísticas
  async getEstatisticas(): Promise<Estatisticas> {
    const response = await api.get<ApiResponse<Estatisticas>>('/sensor/estatisticas');
    return response.data.data!;
  },

  // Buscar logs do sistema
  async getLogs(
    nivel?: string,
    componente?: string,
    limite: number = 100
  ): Promise<LogSistema[]> {
    let url = `/sensor/logs?limite=${limite}`;
    if (nivel) url += `&nivel=${nivel}`;
    if (componente) url += `&componente=${componente}`;
    
    const response = await api.get<ApiResponse<LogSistema[]>>(url);
    return response.data.data || [];
  },

  // Health check
  async getStatus(): Promise<any> {
    const response = await api.get<ApiResponse>('/sensor/status');
    return response.data;
  }
};

export default api;