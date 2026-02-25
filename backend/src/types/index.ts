// backend > src > types > index.ts
export interface DadosESP8266 {
  timestamp?: string;
  umidadeSolo?: number;
  valorAdc?: number;
  sensorOk?: boolean;
  fatorLocal?: number;
  precipitacaoAtual?: number;
  precipitacao24h?: number;
  precipitacao7d?: number;
  precipitacao30d?: number;
  statusApiBndmet?: string;
  qualidadeDadosBndmet?: number;
  temperatura?: number;
  umidadeExterna?: number;
  pressaoAtmosferica?: number;
  velocidadeVento?: number;
  descricaoTempo?: string;
  precipitacaoPrevisao6h?: number;
  precipitacaoPrevisao24h?: number;
  riscoIntegrado?: number;
  indiceRisco?: number;
  nivelAlerta?: string;
  recomendacao?: string;
  confiabilidade?: number;
  statusSistema?: number;
  buzzerAtivo?: boolean;
  modoManual?: boolean;
  wifiConectado?: boolean;
  dadosBrutos?: any;
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

export interface LogEntry {
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  componente?: string;
  mensagem: string;
  dadosExtras?: any;
}

export interface ConsultaPeriodo {
  dataInicio: string;
  dataFim: string;
  pagina?: number;
  limite?: number;
}