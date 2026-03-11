// backend > src > types > index.ts
export interface DadosESP8266 {
  timestamp?: string;

  // Sensor local
  umidadeSolo?: number;
  valorAdc?: number;
  sensorOk?: boolean;
  fatorLocal?: number;

  // BNDMET
  precipitacaoAtual?: number;
  precipitacao24h?: number;
  precipitacao7d?: number;
  precipitacao30d?: number;
  statusApiBndmet?: string;
  qualidadeDadosBndmet?: number;
  estacao?: string;                  // código da estação BNDMET (ex.: "D6594")

  // Meteorologia OWM
  temperatura?: number;
  umidadeExterna?: number;
  pressaoAtmosferica?: number;
  velocidadeVento?: number;
  descricaoTempo?: string;
  chuvaAtualOWM?: number;            // rain.1h (mm/h) — ausente quando não chove

  // Previsão OWM /forecast
  chuvaFutura24h?: number;           // soma rain.3h dos 8 blocos (24h)
  intensidadePrevisao?: string;      // "Fraca" | "Moderada" | "Forte" | "Muito Forte" | "Pancada de Chuva"
  fatorIntensidade?: number;         // fator discreto: 0,00 / 0,25 / 0,50 / 0,75 / 1,00

  // Análise de risco
  riscoIntegrado?: number;
  indiceRisco?: number;
  nivelAlerta?: string;
  recomendacao?: string;
  confiabilidade?: number;
  amplificado?: boolean;             // true quando coeficiente 1,20 foi aplicado
  taxaVariacaoUmidade?: number;      // ΔU calculado no buffer circular (% / leitura)

  // Componentes individuais da Equação 5 TCC
  vLencol?: number;
  vChuvaAtual?: number;
  vChuvaHistorica?: number;
  vChuvaMensal?: number;
  vChuvaFutura?: number;
  vTaxaVariacao?: number;
  vPressao?: number;

  // Status do sistema
  statusSistema?: number;
  buzzerAtivo?: boolean;
  modoManual?: boolean;
  wifiConectado?: boolean;

  // Dados brutos (uptime, freeHeap, rssi, tentativasEnvio)
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