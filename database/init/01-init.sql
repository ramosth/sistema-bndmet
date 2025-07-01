-- ✅ CONFIGURAR timezone UTC antes de tudo
SET timezone = 'UTC';
ALTER DATABASE bndmet SET timezone = 'UTC';

-- Habilitar extensão TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ✅ FUNÇÃO para garantir timestamps UTC
CREATE OR REPLACE FUNCTION utc_now() RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- Criar tabela principal de leituras
CREATE TABLE IF NOT EXISTS leituras_sensor (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT utc_now(), -- ✅ USANDO função UTC
    
    -- Dados do sensor local
    umidade_solo DECIMAL(5,2),
    valor_adc INTEGER,
    sensor_ok BOOLEAN DEFAULT true,
    fator_local DECIMAL(5,3),
    
    -- Dados BNDMET
    precipitacao_atual DECIMAL(8,2),
    precipitacao_24h DECIMAL(8,2), 
    precipitacao_7d DECIMAL(8,2),
    precipitacao_30d DECIMAL(8,2),
    status_api_bndmet VARCHAR(50),
    qualidade_dados_bndmet INTEGER,
    
    -- Dados meteorológicos
    temperatura DECIMAL(5,2),
    umidade_externa DECIMAL(5,2),
    pressao_atmosferica DECIMAL(7,2),
    velocidade_vento DECIMAL(5,2),
    descricao_tempo VARCHAR(100),
    
    -- Previsão
    precipitacao_previsao_6h DECIMAL(8,2),
    precipitacao_previsao_24h DECIMAL(8,2),
    tendencia_tempo VARCHAR(200),
    
    -- Análise de risco
    risco_integrado DECIMAL(5,2),
    indice_risco INTEGER,
    nivel_alerta VARCHAR(20),
    recomendacao TEXT,
    confiabilidade INTEGER,
    tendencia_piora BOOLEAN,
    
    -- Previsões avançadas
    previsao_umidade_6h DECIMAL(5,2),
    previsao_umidade_24h DECIMAL(5,2),
    tempo_ate_critico DECIMAL(8,2),
    
    -- Status do sistema
    status_sistema INTEGER,
    buzzer_ativo BOOLEAN,
    modo_manual BOOLEAN,
    wifi_conectado BOOLEAN,
    blynk_conectado BOOLEAN,
    
    -- Dados brutos JSON para flexibilidade
    dados_brutos JSONB,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT utc_now(), -- ✅ UTC
    updated_at TIMESTAMPTZ DEFAULT utc_now()  -- ✅ UTC
);

-- Converter para hypertable (otimização TimescaleDB)
SELECT create_hypertable('leituras_sensor', 'timestamp', if_not_exists => TRUE);

-- Criar índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp ON leituras_sensor (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_nivel_alerta ON leituras_sensor (nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_leituras_risco ON leituras_sensor (risco_integrado);
CREATE INDEX IF NOT EXISTS idx_leituras_sensor_ok ON leituras_sensor (sensor_ok);

-- Tabela para logs do sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT utc_now(), -- ✅ UTC
    nivel VARCHAR(20) NOT NULL, -- INFO, WARNING, ERROR, CRITICAL
    componente VARCHAR(50), -- SENSOR, BNDMET, CONECTIVIDADE, etc
    mensagem TEXT NOT NULL,
    dados_extras JSONB,
    created_at TIMESTAMPTZ DEFAULT utc_now() -- ✅ UTC
);

-- Converter logs para hypertable
SELECT create_hypertable('logs_sistema', 'timestamp', if_not_exists => TRUE);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    created_at TIMESTAMPTZ DEFAULT utc_now(), -- ✅ UTC
    updated_at TIMESTAMPTZ DEFAULT utc_now()  -- ✅ UTC
);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('timezone', 'UTC', 'Timezone do sistema', 'string'),
('umidade_critica', '25.0', 'Nível crítico de umidade (%)', 'number'),
('umidade_ruptura', '30.0', 'Nível de ruptura (%)', 'number'),
('intervalo_sensor', '5000', 'Intervalo de leitura do sensor (ms)', 'number'),
('intervalo_bndmet', '900000', 'Intervalo de consulta BNDMET (ms)', 'number'),
('sensor_seco', '850', 'Valor ADC para solo seco', 'number'),
('sensor_umido', '400', 'Valor ADC para solo úmido', 'number'),
('wifi_ssid', 'Thamires_2G', 'Nome da rede WiFi', 'string'),
('api_bndmet_key', 'F9prvVKpaQ1qNtQywCN2sily029xgNaq', 'Chave da API BNDMET', 'string'),
('api_openweather_key', '04b8a531e11670b8099c49e16ba8f676', 'Chave da API OpenWeather', 'string')
ON CONFLICT (chave) DO NOTHING;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = utc_now(); -- ✅ Usar função UTC
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar configurações
CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON configuracoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views úteis para consultas
CREATE OR REPLACE VIEW view_ultimas_leituras AS
SELECT 
    timestamp AT TIME ZONE 'UTC' as timestamp_utc,
    timestamp,
    umidade_solo,
    risco_integrado,
    nivel_alerta,
    precipitacao_24h,
    temperatura,
    sensor_ok,
    wifi_conectado
FROM leituras_sensor
ORDER BY timestamp DESC
LIMIT 100;

CREATE OR REPLACE VIEW view_alertas_criticos AS
SELECT 
    timestamp AT TIME ZONE 'UTC' as timestamp_utc,
    timestamp,
    umidade_solo,
    risco_integrado,
    nivel_alerta,
    recomendacao,
    confiabilidade
FROM leituras_sensor
WHERE nivel_alerta IN ('CRÍTICO', 'ALTO', 'VERMELHO')
ORDER BY timestamp DESC;

-- ✅ VIEW para monitorar timezone
CREATE OR REPLACE VIEW view_timezone_info AS
SELECT 
    'Timezone Banco' as tipo,
    current_setting('timezone') as timezone,
    utc_now() as utc_now,
    NOW() as local_now,
    EXTRACT(TIMEZONE FROM NOW()) as offset_seconds;

-- Política de retenção de dados (manter 1 ano)
SELECT add_retention_policy('leituras_sensor', INTERVAL '1 year');
SELECT add_retention_policy('logs_sistema', INTERVAL '6 months');

-- ✅ INSERIR dados de teste COM timezone UTC explícito
INSERT INTO leituras_sensor (
    timestamp,
    umidade_solo, valor_adc, sensor_ok, precipitacao_24h, 
    temperatura, risco_integrado, nivel_alerta, recomendacao
) VALUES 
(utc_now(), 15.5, 750, true, 0.0, 22.5, 25.0, 'VERDE', 'Situação normal'),
(utc_now() - INTERVAL '1 hour', 28.3, 450, true, 12.5, 19.8, 65.0, 'AMARELO', 'Atenção necessária'),
(utc_now() - INTERVAL '2 hours', 32.1, 380, true, 45.2, 18.2, 85.0, 'VERMELHO', 'Evacuação recomendada');

-- ✅ VERIFICAR configuração de timezone
SELECT 
    'Database initialized successfully!' as status,
    current_setting('timezone') as timezone_config,
    utc_now() as current_utc_time;
