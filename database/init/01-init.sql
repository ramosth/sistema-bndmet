-- backend > init > 01-init.sql
-- ✅ CONFIGURAR timezone UTC antes de tudo
SET timezone = 'UTC';
ALTER DATABASE bndmet SET timezone = 'UTC';

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ✅ FUNÇÃO para garantir timestamps UTC
CREATE OR REPLACE FUNCTION utc_now() RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELA PRINCIPAL DE LEITURAS
-- ============================================================
CREATE TABLE IF NOT EXISTS leituras_sensor (
    id          SERIAL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT utc_now(),

    -- Sensor local
    umidade_solo            DECIMAL(5,2),
    valor_adc               INTEGER,
    sensor_ok               BOOLEAN DEFAULT true,
    fator_local             DECIMAL(5,3),

    -- BNDMET
    precipitacao_atual      DECIMAL(8,2),
    precipitacao_24h        DECIMAL(8,2),
    precipitacao_7d         DECIMAL(8,2),
    precipitacao_30d        DECIMAL(8,2),
    status_api_bndmet       VARCHAR(50),
    qualidade_dados_bndmet  INTEGER,
    estacao                 VARCHAR(20),          -- código da estação BNDMET (ex.: "D6594")

    -- Meteorologia OWM
    temperatura             DECIMAL(5,2),
    umidade_externa         DECIMAL(5,2),
    pressao_atmosferica     DECIMAL(7,2),
    velocidade_vento        DECIMAL(5,2),
    descricao_tempo         VARCHAR(100),
    chuva_atual_owm         DECIMAL(8,2),         -- rain.1h (mm/h)

    -- Previsão OWM /forecast
    chuva_futura_24h        DECIMAL(8,2),         -- soma rain.3h dos 8 blocos (24h)
    intensidade_previsao    VARCHAR(30),           -- "Fraca" | "Moderada" | "Forte" | "Muito Forte" | "Pancada de Chuva"
    fator_intensidade       DECIMAL(4,2),          -- 0,00 / 0,25 / 0,50 / 0,75 / 1,00

    -- Análise de risco
    risco_integrado         DECIMAL(5,2),
    indice_risco            INTEGER,
    nivel_alerta            VARCHAR(20),           -- VERDE | AMARELO | VERMELHO
    recomendacao            TEXT,
    confiabilidade          INTEGER,
    amplificado             BOOLEAN DEFAULT false, -- true quando coeficiente 1,20 foi aplicado
    taxa_variacao_umidade   DECIMAL(6,3),          -- ΔU do buffer circular (%/leitura)

    -- Componentes individuais da Equação 5 TCC
    v_lencol                DECIMAL(5,4),          -- peso 0,40
    v_chuva_atual           DECIMAL(5,4),          -- peso 0,08
    v_chuva_historica       DECIMAL(5,4),          -- peso 0,12
    v_chuva_mensal          DECIMAL(5,4),          -- peso 0,10
    v_chuva_futura          DECIMAL(5,4),          -- peso 0,15
    v_taxa_variacao         DECIMAL(5,4),          -- peso 0,10
    v_pressao               DECIMAL(5,4),          -- peso 0,05

    -- Status do sistema
    status_sistema          INTEGER,
    buzzer_ativo            BOOLEAN,
    modo_manual             BOOLEAN,
    wifi_conectado          BOOLEAN,

    -- Dados brutos (uptime, freeHeap, rssi, tentativasEnvio)
    dados_brutos            JSONB,

    -- Metadados
    created_at              TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT utc_now(),

    PRIMARY KEY (id, timestamp)
);

-- Converter para hypertable (otimização TimescaleDB)
SELECT create_hypertable('leituras_sensor', 'timestamp', if_not_exists => TRUE);

-- Índices simples
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp         ON leituras_sensor (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leituras_nivel_alerta      ON leituras_sensor (nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_leituras_risco_integrado   ON leituras_sensor (risco_integrado);
CREATE INDEX IF NOT EXISTS idx_leituras_indice_risco      ON leituras_sensor (indice_risco);
CREATE INDEX IF NOT EXISTS idx_leituras_sensor_ok         ON leituras_sensor (sensor_ok);
CREATE INDEX IF NOT EXISTS idx_leituras_precipitacao_24h  ON leituras_sensor (precipitacao_24h);
CREATE INDEX IF NOT EXISTS idx_leituras_status_api        ON leituras_sensor (status_api_bndmet);
CREATE INDEX IF NOT EXISTS idx_leituras_qualidade_dados   ON leituras_sensor (qualidade_dados_bndmet);
CREATE INDEX IF NOT EXISTS idx_leituras_estacao           ON leituras_sensor (estacao);
CREATE INDEX IF NOT EXISTS idx_leituras_amplificado       ON leituras_sensor (amplificado);

-- Índices compostos para consultas específicas
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp_nivel   ON leituras_sensor (timestamp DESC, nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_leituras_timestamp_risco   ON leituras_sensor (timestamp DESC, risco_integrado);

-- ============================================================
-- TABELA DE LOGS DO SISTEMA
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_sistema (
    id          SERIAL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    nivel       VARCHAR(20)  NOT NULL, -- INFO | WARNING | ERROR | CRITICAL
    componente  VARCHAR(50),           -- SENSOR | BNDMET | CONECTIVIDADE | etc.
    mensagem    TEXT NOT NULL,
    dados_extras JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    PRIMARY KEY (id, timestamp)
);

SELECT create_hypertable('logs_sistema', 'timestamp', if_not_exists => TRUE);

-- ============================================================
-- TABELA DE CONFIGURAÇÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id          SERIAL PRIMARY KEY,
    chave       VARCHAR(100) UNIQUE NOT NULL,
    valor       TEXT,
    descricao   TEXT,
    tipo        VARCHAR(20) DEFAULT 'string', -- string | number | boolean | json
    created_at  TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT utc_now()
);

-- ============================================================
-- TABELAS DE USUÁRIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id                  UUID NOT NULL DEFAULT uuid_generate_v4(),
    nome                VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    senha_hash          VARCHAR(255) NOT NULL,
    perfil              VARCHAR(20)  NOT NULL DEFAULT 'admin',
    ativo               BOOLEAN      NOT NULL DEFAULT true,
    ultimo_login        TIMESTAMPTZ,
    token_reset         VARCHAR(255),
    token_reset_expira  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    CONSTRAINT usuarios_admin_pkey PRIMARY KEY (id),
    CONSTRAINT usuarios_admin_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS usuarios_basicos (
    id                    UUID NOT NULL DEFAULT uuid_generate_v4(),
    nome                  VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    telefone              VARCHAR(20),
    ativo                 BOOLEAN NOT NULL DEFAULT true,
    receber_notificacoes  BOOLEAN NOT NULL DEFAULT true,
    tipo_notificacao      VARCHAR(50) NOT NULL DEFAULT 'email,sms',
    ultimo_alerta_enviado TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    CONSTRAINT usuarios_basicos_pkey  PRIMARY KEY (id),
    CONSTRAINT usuarios_basicos_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS sessoes_usuario (
    id          UUID NOT NULL DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL,
    token       VARCHAR(500) NOT NULL,
    ip_address  INET,
    user_agent  TEXT,
    expires_at  TIMESTAMPTZ NOT NULL,
    ativo       BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    CONSTRAINT sessoes_usuario_pkey PRIMARY KEY (id),
    CONSTRAINT sessoes_usuario_usuario_id_fkey
        FOREIGN KEY (usuario_id) REFERENCES usuarios_admin(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs_alertas (
    id                UUID NOT NULL DEFAULT uuid_generate_v4(),
    usuario_admin_id  UUID,
    tipo_destinatario VARCHAR(20)  NOT NULL,
    destinatarios_ids UUID[],
    tipo_alerta       VARCHAR(50)  NOT NULL,
    nivel_criticidade VARCHAR(20)  NOT NULL,
    titulo            VARCHAR(200) NOT NULL,
    mensagem          TEXT NOT NULL,
    canais_envio      VARCHAR(100) NOT NULL,
    total_enviados    INTEGER NOT NULL DEFAULT 0,
    total_sucesso     INTEGER NOT NULL DEFAULT 0,
    total_falhas      INTEGER NOT NULL DEFAULT 0,
    detalhes_envio    JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT utc_now(),
    CONSTRAINT logs_alertas_pkey PRIMARY KEY (id),
    CONSTRAINT logs_alertas_usuario_admin_id_fkey
        FOREIGN KEY (usuario_admin_id) REFERENCES usuarios_admin(id) ON DELETE SET NULL
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Últimas leituras (campos completos v3)
CREATE OR REPLACE VIEW view_ultimas_leituras AS
SELECT
    timestamp AT TIME ZONE 'UTC' AS timestamp_utc,
    timestamp,
    umidade_solo,
    fator_local,
    chuva_futura_24h,
    intensidade_previsao,
    fator_intensidade,
    risco_integrado,
    indice_risco,
    nivel_alerta,
    amplificado,
    taxa_variacao_umidade,
    precipitacao_24h,
    precipitacao_7d,
    temperatura,
    sensor_ok,
    wifi_conectado,
    status_api_bndmet,
    qualidade_dados_bndmet,
    estacao,
    confiabilidade
FROM leituras_sensor
ORDER BY timestamp DESC
LIMIT 100;

-- Alertas críticos
CREATE OR REPLACE VIEW view_alertas_criticos AS
SELECT
    timestamp AT TIME ZONE 'UTC' AS timestamp_utc,
    timestamp,
    umidade_solo,
    risco_integrado,
    indice_risco,
    nivel_alerta,
    amplificado,
    recomendacao,
    confiabilidade,
    precipitacao_24h,
    chuva_futura_24h,
    intensidade_previsao,
    status_api_bndmet,
    qualidade_dados_bndmet,
    estacao
FROM leituras_sensor
WHERE nivel_alerta IN ('AMARELO', 'VERMELHO')
ORDER BY timestamp DESC;

-- Estatísticas de qualidade por hora
CREATE OR REPLACE VIEW view_estatisticas_qualidade AS
SELECT
    DATE_TRUNC('hour', timestamp) AS hora,
    COUNT(*)                                              AS total_leituras,
    COUNT(*) FILTER (WHERE sensor_ok = true)              AS sensor_ok_count,
    COUNT(*) FILTER (WHERE status_api_bndmet = 'OK')      AS api_ok_count,
    COUNT(*) FILTER (WHERE amplificado = true)            AS amplificado_count,
    AVG(qualidade_dados_bndmet)                           AS qualidade_media,
    AVG(confiabilidade)                                   AS confiabilidade_media,
    AVG(risco_integrado)                                  AS risco_medio,
    AVG(taxa_variacao_umidade)                            AS taxa_variacao_media
FROM leituras_sensor
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hora DESC;

-- View componentes da Equação 5 TCC
CREATE OR REPLACE VIEW view_componentes_equacao AS
SELECT
    timestamp,
    nivel_alerta,
    risco_integrado,
    amplificado,
    v_lencol,
    v_chuva_atual,
    v_chuva_historica,
    v_chuva_mensal,
    v_chuva_futura,
    v_taxa_variacao,
    v_pressao,
    (v_lencol + v_chuva_atual + v_chuva_historica + v_chuva_mensal +
     v_chuva_futura + v_taxa_variacao + v_pressao) AS soma_componentes
FROM leituras_sensor
ORDER BY timestamp DESC;

-- View timezone info
CREATE OR REPLACE VIEW view_timezone_info AS
SELECT
    'Timezone Banco'            AS tipo,
    current_setting('timezone') AS timezone,
    utc_now()                   AS utc_now,
    NOW()                       AS local_now,
    EXTRACT(TIMEZONE FROM NOW()) AS offset_seconds;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = utc_now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leituras_sensor_updated_at
    BEFORE UPDATE ON leituras_sensor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at
    BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- POLÍTICAS DE RETENÇÃO (TimescaleDB)
-- ============================================================
SELECT add_retention_policy('leituras_sensor', INTERVAL '1 year',   if_not_exists => TRUE);
SELECT add_retention_policy('logs_sistema',     INTERVAL '6 months', if_not_exists => TRUE);

-- ============================================================
-- CONFIGURAÇÕES PADRÃO
-- ============================================================
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('sistema_nome',            'Monitor de Barragens de Rejeito',   'Nome do sistema',                   'string'),
('alerta_critico_threshold','80',                                 'Threshold para alerta crítico (%)', 'number'),
('intervalo_leitura',       '300',                                'Intervalo entre leituras (segundos)','number'),
('api_bndmet_url',          'https://api.bndmet.decea.mil.br',   'URL da API BNDMET',                 'string'),
('estacao_bndmet',          'D6594',                              'Código da estação BNDMET padrão',   'string'),
('fator_local_padrao',      '1.000',                              'Fator de calibração local padrão',  'decimal')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- DADOS DE TESTE
-- ============================================================
INSERT INTO leituras_sensor (
    timestamp,
    umidade_solo, valor_adc, sensor_ok, fator_local,
    precipitacao_atual, precipitacao_24h, precipitacao_7d, precipitacao_30d,
    status_api_bndmet, qualidade_dados_bndmet, estacao,
    temperatura, umidade_externa, pressao_atmosferica, velocidade_vento, descricao_tempo,
    chuva_atual_owm, chuva_futura_24h, intensidade_previsao, fator_intensidade,
    risco_integrado, indice_risco, nivel_alerta, recomendacao, confiabilidade,
    amplificado, taxa_variacao_umidade,
    v_lencol, v_chuva_atual, v_chuva_historica, v_chuva_mensal,
    v_chuva_futura, v_taxa_variacao, v_pressao,
    status_sistema, buzzer_ativo, modo_manual, wifi_conectado
) VALUES
(
    utc_now(),
    12.5, 820, true, 0.500,
    0.0, 0.0, 5.2, 15.8,
    'OK', 97, 'D6594',
    22.5, 68.0, 1013.2, 2.1, 'Parcialmente nublado',
    0.0, 2.0, 'Fraca', 0.00,
    0.21, 21, 'VERDE', 'Situação normal — sem riscos identificados', 97,
    false, 0.050,
    0.2000, 0.0000, 0.0042, 0.0053, 0.0000, 0.0050, 0.0000,
    1, false, false, true
),
(
    utc_now() - INTERVAL '1 hour',
    22.0, 560, true, 0.880,
    2.5, 22.5, 65.0, 185.0,
    'OK', 91, 'D6594',
    20.3, 78.0, 1009.0, 6.2, 'Chuva fraca',
    0.8, 18.0, 'Moderada', 0.25,
    0.54, 54, 'AMARELO', 'Atenção — monitorar com frequência elevada', 89,
    false, 0.180,
    0.3520, 0.0360, 0.0520, 0.0617, 0.0375, 0.0180, 0.0000,
    1, false, false, true
),
(
    utc_now() - INTERVAL '2 hours',
    27.5, 410, true, 1.100,
    8.2, 48.0, 138.0, 295.0,
    'OK', 84, 'D6594',
    18.2, 86.0, 1005.8, 14.5, 'Chuva forte',
    3.2, 62.0, 'Muito Forte', 0.75,
    0.91, 91, 'VERMELHO', 'Evacuação recomendada — risco elevado de ruptura', 81,
    true, 0.420,
    0.4400, 0.0768, 0.1104, 0.0983, 0.1125, 0.0420, 0.0300,
    2, true, false, true
);

-- Log de inicialização
INSERT INTO logs_sistema (nivel, componente, mensagem, dados_extras)
VALUES (
    'INFO',
    'INIT',
    'Banco de dados inicializado — estrutura v3 (Equação 5 TCC)',
    json_build_object(
        'timestamp',  utc_now(),
        'versao',     'v3',
        'campos_novos', array[
            'estacao', 'chuva_atual_owm', 'chuva_futura_24h',
            'intensidade_previsao', 'fator_intensidade', 'amplificado',
            'taxa_variacao_umidade',
            'v_lencol', 'v_chuva_atual', 'v_chuva_historica', 'v_chuva_mensal',
            'v_chuva_futura', 'v_taxa_variacao', 'v_pressao'
        ]
    )
);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT
    'Banco inicializado com sucesso — estrutura v3!' AS status,
    current_setting('timezone')                      AS timezone_config,
    utc_now()                                        AS current_utc_time,
    (SELECT COUNT(*) FROM leituras_sensor)           AS sample_readings_count;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leituras_sensor'
ORDER BY ordinal_position;