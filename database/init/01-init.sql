-- backend > init > 01-init.sql
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
    id SERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    
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
    
    -- Análise de risco
    risco_integrado DECIMAL(5,2),
    indice_risco INTEGER,
    nivel_alerta VARCHAR(20),
    recomendacao TEXT,
    confiabilidade INTEGER,
    
    -- Status do sistema
    status_sistema INTEGER,
    buzzer_ativo BOOLEAN,
    modo_manual BOOLEAN,
    wifi_conectado BOOLEAN,
    
    -- Dados brutos JSON para flexibilidade
    dados_brutos JSONB,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT utc_now(), -- ✅ UTC
    updated_at TIMESTAMPTZ DEFAULT utc_now(),  -- ✅ UTC
    PRIMARY KEY (id, timestamp)
);

-- Converter para hypertable (otimização TimescaleDB)
SELECT create_hypertable('leituras_sensor', 'timestamp', if_not_exists => TRUE);

-- Criar índices otimizados para a nova estrutura
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp ON leituras_sensor (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_nivel_alerta ON leituras_sensor (nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_leituras_risco_integrado ON leituras_sensor (risco_integrado);
CREATE INDEX IF NOT EXISTS idx_leituras_indice_risco ON leituras_sensor (indice_risco);
CREATE INDEX IF NOT EXISTS idx_leituras_sensor_ok ON leituras_sensor (sensor_ok);
CREATE INDEX IF NOT EXISTS idx_leituras_precipitacao_24h ON leituras_sensor (precipitacao_24h);
CREATE INDEX IF NOT EXISTS idx_leituras_status_api ON leituras_sensor (status_api_bndmet);
CREATE INDEX IF NOT EXISTS idx_leituras_qualidade_dados ON leituras_sensor (qualidade_dados_bndmet);

-- Índices compostos para consultas específicas
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp_nivel ON leituras_sensor (timestamp DESC, nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp_risco ON leituras_sensor (timestamp DESC, risco_integrado);

-- Tabela para logs do sistema
CREATE TABLE IF NOT EXISTS logs_sistema (
    id SERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    nivel VARCHAR(20) NOT NULL, -- INFO, WARNING, ERROR, CRITICAL
    componente VARCHAR(50), -- SENSOR, BNDMET, CONECTIVIDADE, etc
    mensagem TEXT NOT NULL,
    dados_extras JSONB,
    created_at TIMESTAMPTZ DEFAULT utc_now(),
    PRIMARY KEY (id, timestamp)
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

-- ===== VIEWS ATUALIZADAS =====

-- View para últimas leituras
CREATE OR REPLACE VIEW view_ultimas_leituras AS
SELECT 
    timestamp AT TIME ZONE 'UTC' as timestamp_utc,
    timestamp,
    umidade_solo,
    risco_integrado,
    indice_risco,
    nivel_alerta,
    precipitacao_24h,
    precipitacao_7d,
    temperatura,
    sensor_ok,
    wifi_conectado,
    status_api_bndmet,
    qualidade_dados_bndmet,
    confiabilidade
FROM leituras_sensor
ORDER BY timestamp DESC
LIMIT 100;

-- View para alertas críticos
CREATE OR REPLACE VIEW view_alertas_criticos AS
SELECT 
    timestamp AT TIME ZONE 'UTC' as timestamp_utc,
    timestamp,
    umidade_solo,
    risco_integrado,
    indice_risco,
    nivel_alerta,
    recomendacao,
    confiabilidade,
    precipitacao_24h,
    status_api_bndmet,
    qualidade_dados_bndmet
FROM leituras_sensor
WHERE nivel_alerta IN ('CRÍTICO', 'ALTO', 'VERMELHO')
ORDER BY timestamp DESC;

-- View para estatísticas de qualidade
CREATE OR REPLACE VIEW view_estatisticas_qualidade AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hora,
    COUNT(*) as total_leituras,
    COUNT(*) FILTER (WHERE sensor_ok = true) as sensor_ok_count,
    COUNT(*) FILTER (WHERE status_api_bndmet = 'OK') as api_ok_count,
    AVG(qualidade_dados_bndmet) as qualidade_media,
    AVG(confiabilidade) as confiabilidade_media,
    AVG(risco_integrado) as risco_medio
FROM leituras_sensor
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hora DESC;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = utc_now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leituras_sensor_updated_at
    BEFORE UPDATE ON leituras_sensor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar configurações
CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON configuracoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ VIEW para monitorar timezone
CREATE OR REPLACE VIEW view_timezone_info AS
SELECT 
    'Timezone Banco' as tipo,
    current_setting('timezone') as timezone,
    utc_now() as utc_now,
    NOW() as local_now,
    EXTRACT(TIMEZONE FROM NOW()) as offset_seconds;

-- ===== POLÍTICAS DE RETENÇÃO =====

-- Manter dados de sensor por 1 ano
SELECT add_retention_policy('leituras_sensor', INTERVAL '1 year', if_not_exists => TRUE);

-- Manter logs por 6 meses
SELECT add_retention_policy('logs_sistema', INTERVAL '6 months', if_not_exists => TRUE);

-- ===== DADOS DE TESTE =====

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES 
('sistema_nome', 'Monitor de Deslizamentos', 'Nome do sistema', 'string'),
('alerta_critico_threshold', '80', 'Threshold para alerta crítico (%)', 'number'),
('intervalo_leitura', '300', 'Intervalo entre leituras (segundos)', 'number'),
('api_bndmet_url', 'https://api.bndmet.gov.br', 'URL da API BNDMET', 'string'),
('fator_local_padrao', '1.000', 'Fator de calibração local padrão', 'decimal')
ON CONFLICT (chave) DO NOTHING;

-- ✅ INSERIR dados de teste COM timezone UTC explícito
INSERT INTO leituras_sensor (
    timestamp, umidade_solo, valor_adc, sensor_ok, fator_local,
    precipitacao_atual, precipitacao_24h, precipitacao_7d, precipitacao_30d,
    status_api_bndmet, qualidade_dados_bndmet,
    temperatura, umidade_externa, pressao_atmosferica, velocidade_vento, descricao_tempo,
    precipitacao_previsao_6h, precipitacao_previsao_24h,
    risco_integrado, indice_risco, nivel_alerta, recomendacao, confiabilidade,
    status_sistema, buzzer_ativo, modo_manual, wifi_conectado
) VALUES 
(
    utc_now(), 15.5, 750, true, 1.000,
    0.0, 0.0, 5.2, 15.8,
    'OK', 95,
    22.5, 68.0, 1013.2, 2.1, 'Parcialmente nublado',
    0.0, 2.5,
    25.0, 25, 'VERDE', 'Situação normal - sem riscos identificados', 95,
    1, false, false, true
),
(
    utc_now() - INTERVAL '1 hour', 28.3, 450, true, 1.000,
    2.5, 12.5, 25.8, 45.2,
    'OK', 88,
    19.8, 75.0, 1008.5, 5.8, 'Chuvisco',
    5.0, 15.0,
    65.0, 65, 'AMARELO', 'Atenção necessária - monitoramento intensivo', 82,
    1, false, false, true
),
(
    utc_now() - INTERVAL '2 hours', 32.1, 380, true, 1.000,
    8.2, 45.2, 78.5, 125.6,
    'OK', 75,
    18.2, 82.0, 1005.8, 12.5, 'Chuva moderada',
    12.0, 25.0,
    85.0, 85, 'VERMELHO', 'Evacuação recomendada - risco elevado de deslizamento', 78,
    2, true, false, true
);

-- Log de sistema inicial
INSERT INTO logs_sistema (nivel, componente, mensagem, dados_extras)
VALUES (
    'INFO',
    'INIT',
    'Banco de dados inicializado com nova estrutura',
    json_build_object(
        'timestamp', utc_now(),
        'estrutura', 'leituras_sensor_v2_atualizada',
        'colunas_principais', array['umidade_solo', 'precipitacao_bndmet', 'risco_integrado', 'indice_risco']
    )
);

-- ✅ VERIFICAR configuração final
SELECT 
    'Database initialized successfully with updated structure!' as status,
    current_setting('timezone') as timezone_config,
    utc_now() as current_utc_time,
    (SELECT COUNT(*) FROM leituras_sensor) as sample_readings_count;

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leituras_sensor' 
ORDER BY ordinal_position;