export interface DadosSensor {
  id: number;
  timestamp: string;
  
  // Dados do sensor local
  umidadeSolo?: number;
  valorAdc?: number;
  sensorOk?: boolean;
  fatorLocal?: number;
  
  // Dados BNDMET
  precipitacaoAtual?: number;
  precipitacao24h?: number;
  precipitacao7d?: number;
  precipitacao30d?: number;
  statusApiBndmet?: string;
  qualidadeDadosBndmet?: number;
  
  // Dados meteorológicos
  temperatura?: number;
  umidadeExterna?: number;
  pressaoAtmosferica?: number;
  velocidadeVento?: number;
  descricaoTempo?: string;
  
  // Previsão
  precipitacaoPrevisao6h?: number;
  precipitacaoPrevisao24h?: number;
  tendenciaTempo?: string;
  
  // Análise de risco
  riscoIntegrado?: number;
  indiceRisco?: number;
  nivelAlerta?: string;
  recomendacao?: string;
  confiabilidade?: number;
  tendenciaPiora?: boolean;
  
  // Status do sistema
  statusSistema?: number;
  buzzerAtivo?: boolean;
  modoManual?: boolean;
  wifiConectado?: boolean;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Estatisticas {
  totalLeituras: number;
  ultimaLeitura: DadosSensor | null;
  estatisticas24h: {
    mediaUmidade: number;
    mediaRisco: number;
    totalLeituras: number;
    alertasCriticos: number;
  };
}

export interface LogSistema {
  id: number;
  timestamp: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  componente?: string;
  mensagem: string;
  dadosExtras?: any;
  createdAt: string;
}