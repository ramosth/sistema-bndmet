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
  tendenciaTempo?: string;
  riscoIntegrado?: number;
  indiceRisco?: number;
  nivelAlerta?: string;
  recomendacao?: string;
  confiabilidade?: number;
  tendenciaPiora?: boolean;
  previsaoUmidade6h?: number;
  previsaoUmidade24h?: number;
  tempoAteCritico?: number;
  statusSistema?: number;
  buzzerAtivo?: boolean;
  modoManual?: boolean;
  wifiConectado?: boolean;
  blynkConectado?: boolean;
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