-- backend > init > 02-auth-tables.sql
-- Executado automaticamente após 01-init.sql (ordem alfabética Docker)
SELECT 'Iniciando criação das tabelas de autenticação...' AS status;

-- ============================================================
-- EXTENSÃO uuid-ossp (garantia — já executada no 01, idempotente)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: usuarios_admin
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id                  UUID        NOT NULL DEFAULT uuid_generate_v4(),
    nome                VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    senha_hash          VARCHAR(255) NOT NULL,
    perfil              VARCHAR(20)  NOT NULL DEFAULT 'admin'
                            CHECK (perfil IN ('admin', 'super_admin')),
    ativo               BOOLEAN      NOT NULL DEFAULT true,
    ultimo_login        TIMESTAMPTZ,
    token_reset         VARCHAR(255),
    token_reset_expira  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    CONSTRAINT usuarios_admin_pkey      PRIMARY KEY (id),
    CONSTRAINT usuarios_admin_email_key UNIQUE (email)
);

-- ============================================================
-- TABELA: usuarios_basicos
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_basicos (
    id                    UUID         NOT NULL DEFAULT uuid_generate_v4(),
    nome                  VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    telefone              VARCHAR(20),
    ativo                 BOOLEAN      NOT NULL DEFAULT true,
    receber_notificacoes  BOOLEAN      NOT NULL DEFAULT true,
    tipo_notificacao      VARCHAR(50)  NOT NULL DEFAULT 'email,sms'
                              CHECK (tipo_notificacao ~ '^(email|sms|push)(,(email|sms|push))*$'),
    ultimo_alerta_enviado TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    CONSTRAINT usuarios_basicos_pkey      PRIMARY KEY (id),
    CONSTRAINT usuarios_basicos_email_key UNIQUE (email)
);

-- ============================================================
-- TABELA: sessoes_usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS sessoes_usuario (
    id          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    usuario_id  UUID         NOT NULL
                    REFERENCES usuarios_admin(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL,
    ip_address  INET,
    user_agent  TEXT,
    expires_at  TIMESTAMPTZ  NOT NULL,
    ativo       BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    CONSTRAINT sessoes_usuario_pkey PRIMARY KEY (id)
);

-- ============================================================
-- TABELA: logs_alertas
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_alertas (
    id                UUID         NOT NULL DEFAULT uuid_generate_v4(),
    usuario_admin_id  UUID
                          REFERENCES usuarios_admin(id) ON DELETE SET NULL,
    tipo_destinatario VARCHAR(20)  NOT NULL
                          CHECK (tipo_destinatario IN ('basico', 'admin', 'todos')),
    destinatarios_ids UUID[],
    tipo_alerta       VARCHAR(50)  NOT NULL,
    nivel_criticidade VARCHAR(20)  NOT NULL,
    titulo            VARCHAR(200) NOT NULL,
    mensagem          TEXT         NOT NULL,
    canais_envio      VARCHAR(100) NOT NULL,
    total_enviados    INTEGER      NOT NULL DEFAULT 0,
    total_sucesso     INTEGER      NOT NULL DEFAULT 0,
    total_falhas      INTEGER      NOT NULL DEFAULT 0,
    detalhes_envio    JSONB,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT utc_now(),
    CONSTRAINT logs_alertas_pkey PRIMARY KEY (id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email     ON usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_ativo     ON usuarios_admin(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_basicos_email   ON usuarios_basicos(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_basicos_ativo   ON usuarios_basicos(ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_token            ON sessoes_usuario(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id       ON sessoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expires          ON sessoes_usuario(expires_at);
CREATE INDEX IF NOT EXISTS idx_logs_alertas_created     ON logs_alertas(created_at DESC);

-- ============================================================
-- TRIGGERS (update_updated_at_column definida no 01-init.sql)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_usuarios_admin_updated_at'
    ) THEN
        CREATE TRIGGER update_usuarios_admin_updated_at
            BEFORE UPDATE ON usuarios_admin
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_usuarios_basicos_updated_at'
    ) THEN
        CREATE TRIGGER update_usuarios_basicos_updated_at
            BEFORE UPDATE ON usuarios_basicos
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Limpar sessões expiradas (uso em manutenção agendada)
CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas()
RETURNS INTEGER AS $$
DECLARE
    deletadas INTEGER;
BEGIN
    DELETE FROM sessoes_usuario
    WHERE expires_at < NOW() OR ativo = false;
    GET DIAGNOSTICS deletadas = ROW_COUNT;
    RETURN deletadas;
END;
$$ LANGUAGE plpgsql;

-- Validar formato de e-mail
CREATE OR REPLACE FUNCTION validar_email(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEW: estatísticas de usuários
-- ============================================================
CREATE OR REPLACE VIEW view_estatisticas_usuarios AS
SELECT
    (SELECT COUNT(*) FROM usuarios_admin  WHERE ativo = true)                          AS total_admins_ativos,
    (SELECT COUNT(*) FROM usuarios_admin  WHERE ativo = false)                         AS total_admins_inativos,
    (SELECT COUNT(*) FROM usuarios_basicos WHERE ativo = true)                         AS total_basicos_ativos,
    (SELECT COUNT(*) FROM usuarios_basicos WHERE ativo = false)                        AS total_basicos_inativos,
    (SELECT COUNT(*) FROM usuarios_basicos WHERE receber_notificacoes = true)          AS total_com_notificacoes,
    (SELECT COUNT(*) FROM logs_alertas    WHERE created_at >= NOW() - INTERVAL '30 days') AS alertas_ultimos_30_dias;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE usuarios_admin   IS 'Usuários administradores com acesso completo à API';
COMMENT ON TABLE usuarios_basicos IS 'Usuários básicos que recebem notificações de alertas';
COMMENT ON TABLE sessoes_usuario  IS 'Sessões JWT ativas dos administradores';
COMMENT ON TABLE logs_alertas     IS 'Histórico de alertas enviados pelo sistema';

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Administrador padrão — senha: admin123 (bcrypt $2a$10$...)
INSERT INTO usuarios_admin (nome, email, senha_hash, perfil) VALUES
('Administrador Sistema', 'admin@bndmet.com',
 '$2a$10$ClVatGSU.R9nFJzbHBv1N.MMHuPV04mEslmUJSmQFytyXuZxJTHgC',
 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Usuários básicos de exemplo
INSERT INTO usuarios_basicos (nome, email, telefone) VALUES
('João Silva',     'joao@email.com',   '(11) 99999-0001'),
('Maria Santos',   'maria@email.com',  '(11) 99999-0002'),
('Pedro Oliveira', 'pedro@email.com',  '(11) 99999-0003'),
('Ana Costa',      'ana@email.com',    '(11) 99999-0004'),
('Carlos Ferreira','carlos@email.com', '(11) 99999-0005')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'Tabelas de autenticação criadas com sucesso!' AS status;

SELECT 'Usuários admin: ' || COUNT(*) AS admin_count FROM usuarios_admin;
SELECT 'Usuários básicos: ' || COUNT(*) AS basic_count FROM usuarios_basicos;

SELECT 'Script 02-auth-tables.sql executado com sucesso!' AS status;