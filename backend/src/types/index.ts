// backend > src > types > index.ts
// Versão v2 — atualizado para firmware v13
// Principais mudanças:
//   - DadosBrutos tipado explicitamente (antes era `any`)
//   - ConfiabilidadeDetalhes com estrutura completa
//   - Campos v13: aguardandoResetRuptura, bndmetInicializado

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-tipos dos dados brutos (dadosBrutos)
// ─────────────────────────────────────────────────────────────────────────────

export interface DescontosConfiabilidade {
  sensor_falha:        number;  // 0 ou 40
  bndmet_indisponivel: number;  // 0 ou 25 (mútuo exclusivo com qualidade_bndmet)
  qualidade_bndmet:    number;  // 0 ou 10 (D6594 sempre 73% → sempre 10)
  owm_indisponivel:    number;  // 0 ou 15
  wifi_desconectado:   number;  // 0 ou 10
  buffer_insuficiente: number;  // 0 ou 10 (totalLeiturasSensor < 5)
}

export interface ConfiabilidadeDetalhes {
  base:            number;                          // sempre 100
  descontos?:      DescontosConfiabilidade;         // ausente em estado_especial=RUPTURA
  total_desconto:  number;                          // soma dos descontos aplicados
  resultado:       number;                          // confiabilidade final [0–100]
  estado_especial: 'RUPTURA' | null;                // 'RUPTURA' → confiabilidade forçada 100
}

export interface DadosBrutos {

  uptime:                     number;               // ms desde o boot (millis())
  freeHeap:                   number;               // bytes livres no heap do ESP8266
  rssi:                       number;               // intensidade do sinal WiFi (dBm)
  tentativasEnvio:            number;               // falhas consecutivas de envio ao backend
  // v13: distingue ruptura ativa de janela de cooldown (3 leituras seguras)
  aguardando_reset_ruptura:   boolean;              // true = em cooldown, false = ruptura ativa ou normal
  // v13: distingue "BNDMET não consultado" de "qualidade=0% por falha real da estação"
  bndmet_inicializado:        boolean;              // false nos primeiros registros antes da sinc. NTP
  confiabilidade_detalhes:    ConfiabilidadeDetalhes;
}


// ─────────────────────────────────────────────────────────────────────────────
//  Payload principal enviado pelo ESP8266 ao backend
// ─────────────────────────────────────────────────────────────────────────────

export interface DadosESP8266 {
  timestamp?: string;

  // Sensor local
  umidadeSolo?:          number;
  valorAdc?:             number;
  sensorOk?:             boolean;
  fatorLocal?:           number;

  // BNDMET
  precipitacaoAtual?:    number;
  precipitacao24h?:      number;
  precipitacao7d?:       number;
  precipitacao30d?:      number;
  statusApiBndmet?:      string;
  statusApiOwm?:         string;   // 'OK' | 'FALHA' | '' (pré-inicialização)
  qualidadeDadosBndmet?: number;
  estacao?:              string;   // código da estação BNDMET (ex.: "D6594")

  // Meteorologia OWM
  temperatura?:          number;
  umidadeExterna?:       number;
  pressaoAtmosferica?:   number;
  velocidadeVento?:      number;
  descricaoTempo?:       string;
  chuvaAtualOWM?:        number;   // rain.1h (mm/h) — ausente quando não chove

  // Previsão OWM /forecast
  chuvaFutura24h?:       number;   // soma rain.3h dos 8 blocos (24h)
  intensidadePrevisao?:  string;   // "Fraca" | "Moderada" | "Forte" | "Muito Forte" | "Pancada de Chuva"
  fatorIntensidade?:     number;   // fator discreto: 0,00 / 0,25 / 0,50 / 0,75 / 1,00

  // Análise de risco
  riscoIntegrado?:       number;
  indiceRisco?:          number;
  nivelAlerta?:          string;
  recomendacao?:         string;
  confiabilidade?:       number;
  amplificado?:          boolean;  // true quando coeficiente 1,20 foi aplicado
  taxaVariacaoUmidade?:  number;   // ΔU calculado no buffer circular [-1;+1] normalizado por 100

  // Componentes individuais da Equação 5 TCC
  vLencol?:              number;
  vChuvaAtual?:          number;
  vChuvaHistorica?:      number;
  vChuvaMensal?:         number;
  vChuvaFutura?:         number;
  vTaxaVariacao?:        number;
  vPressao?:             number;

  // Status do sistema
  statusSistema?:        number;
  buzzerAtivo?:          boolean;
  modoManual?:           boolean;
  wifiConectado?:        boolean;

  // Dados brutos de diagnóstico — agora tipado explicitamente (v2)
  dadosBrutos?:          DadosBrutos;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tipos de resposta da API
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success:    boolean;
  data?:      T;
  message?:   string;
  error?:     string;
  timestamp:  string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export interface LogEntry {
  nivel:        'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  componente?:  string;
  mensagem:     string;
  dadosExtras?: any;
}

export interface ConsultaPeriodo {
  dataInicio:  string;
  dataFim:     string;
  pagina?:     number;
  limite?:     number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Tipos de retorno dos métodos do SensorService
// ─────────────────────────────────────────────────────────────────────────────

export interface EstatisticasRuptura {
  totalEventos:          number;   // total de registros VERMELHO com statusTexto=RUPTURA
  emRupturaAgora:        boolean;  // última leitura é VERMELHO com risco=1.0
  aguardandoResetAgora:  boolean;  // última leitura tem aguardando_reset_ruptura=true
  ultimaRuptura?:        Date;     // timestamp do último registro VERMELHO
  duracaoMediaMinutos?:  number;   // duração média dos eventos de ruptura
}

export interface QualidadeDados {
  qualidadeMediaBndmet:  number | null;
  confiabilidadeMedia:   number | null;
  percentualSensorOk:    number;
  percentualApiBndmetOk: number;
  totalLeituras:         number;
  // v2: registros excluídos da média por bndmet_inicializado=false
  registrosPreNTP:       number;
}