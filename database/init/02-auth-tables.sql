-- Log de início
SELECT 'Iniciando criação das tabelas de autenticação...' as status;

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de usuários administradores
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) DEFAULT 'admin' CHECK (perfil IN ('admin', 'super_admin')),
    ativo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMPTZ,
    token_reset VARCHAR(255),
    token_reset_expira TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários básicos (para notificações)
CREATE TABLE IF NOT EXISTS usuarios_basicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    receber_notificacoes BOOLEAN DEFAULT true,
    tipo_notificacao VARCHAR(50) DEFAULT 'email,sms' CHECK (tipo_notificacao ~ '^(email|sms|push)(,(email|sms|push))*$'),
    ultimo_alerta_enviado TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões/tokens
CREATE TABLE IF NOT EXISTS sessoes_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios_admin(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de alertas enviados
CREATE TABLE IF NOT EXISTS logs_alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_admin_id UUID REFERENCES usuarios_admin(id),
    tipo_destinatario VARCHAR(20) NOT NULL CHECK (tipo_destinatario IN ('basico', 'admin', 'todos')),
    destinatarios_ids UUID[],
    tipo_alerta VARCHAR(50) NOT NULL,
    nivel_criticidade VARCHAR(20) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    canais_envio VARCHAR(100) NOT NULL, -- email,sms,push
    total_enviados INTEGER DEFAULT 0,
    total_sucesso INTEGER DEFAULT 0,
    total_falhas INTEGER DEFAULT 0,
    detalhes_envio JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_ativo ON usuarios_admin(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_basicos_email ON usuarios_basicos(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_basicos_ativo ON usuarios_basicos(ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes_usuario(token);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expires ON sessoes_usuario(expires_at);
CREATE INDEX IF NOT EXISTS idx_logs_alertas_created ON logs_alertas(created_at DESC);

-- Triggers para atualizar updated_at
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

-- Inserir usuário administrador padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO usuarios_admin (nome, email, senha_hash, perfil) VALUES 
('Administrador Sistema', 'admin@bndmet.com', '$2b$10$rOzJQQjJ9X5qZ8YvQQ9Z0OzJQjJ9X5qZ8YvQQ9Z0OzJQjJ9X5qZ8Yv', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns usuários básicos de exemplo
INSERT INTO usuarios_basicos (nome, email, telefone) VALUES 
('João Silva', 'joao@email.com', '(11) 99999-0001'),
('Maria Santos', 'maria@email.com', '(11) 99999-0002'),
('Pedro Oliveira', 'pedro@email.com', '(11) 99999-0003'),
('Ana Costa', 'ana@email.com', '(11) 99999-0004'),
('Carlos Ferreira', 'carlos@email.com', '(11) 99999-0005')
ON CONFLICT (email) DO NOTHING;

-- View para estatísticas de usuários
CREATE OR REPLACE VIEW view_estatisticas_usuarios AS
SELECT
    (SELECT COUNT(*) FROM usuarios_admin WHERE ativo = true) as total_admins_ativos,
    (SELECT COUNT(*) FROM usuarios_admin WHERE ativo = false) as total_admins_inativos,
    (SELECT COUNT(*) FROM usuarios_basicos WHERE ativo = true) as total_basicos_ativos,
    (SELECT COUNT(*) FROM usuarios_basicos WHERE ativo = false) as total_basicos_inativos,
    (SELECT COUNT(*) FROM usuarios_basicos WHERE receber_notificacoes = true) as total_com_notificacoes,
    (SELECT COUNT(*) FROM logs_alertas WHERE created_at >= NOW() - INTERVAL '30 days') as alertas_ultimos_30_dias;

-- Função para limpar sessões expiradas
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

-- Função para validar email
CREATE OR REPLACE FUNCTION validar_email(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE usuarios_admin IS 'Usuários administradores do sistema com acesso completo';
COMMENT ON TABLE usuarios_basicos IS 'Usuários básicos que recebem notificações de alertas';
COMMENT ON TABLE sessoes_usuario IS 'Controle de sessões ativas dos usuários';
COMMENT ON TABLE logs_alertas IS 'Histórico de alertas enviados pelo sistema';

-- Verificações finais
SELECT 'Tabelas de autenticação criadas com sucesso!' as status;

-- Mostrar estatísticas
SELECT 
    'Usuários admin criados: ' || COUNT(*) as admin_count 
FROM usuarios_admin;

SELECT 
    'Usuários básicos criados: ' || COUNT(*) as basic_count 
FROM usuarios_basicos;

-- Log de conclusão
SELECT 'Script 02-auth-tables.sql executado com sucesso!' as status;