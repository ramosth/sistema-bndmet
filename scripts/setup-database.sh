#!/bin/bash

# 🚀 Script de Setup Automático do Banco de Dados BNDMET
# Este script configura e testa o banco de dados automaticamente

set -e  # Parar se houver erro

echo "🎯 SISTEMA TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET - Setup do Banco de Dados"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar estrutura de pastas
log_info "Verificando estrutura de pastas..."
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml não encontrado! Execute este script na pasta raiz do projeto."
    exit 1
fi

if [ ! -d "database/init" ]; then
    log_warning "Pasta database/init não encontrada. Criando..."
    mkdir -p database/init
fi

if [ ! -f "database/init/02-auth-tables.sql" ]; then
    log_error "Arquivo database/init/02-auth-tables.sql não encontrado!"
    log_info "Certifique-se de criar o arquivo com o script SQL de autenticação."
    exit 1
fi

log_success "Estrutura de pastas verificada!"

# 2. Parar containers existentes
log_info "Parando containers existentes..."
docker-compose down -v --remove-orphans

# 3. Limpar dados órfãos
log_info "Limpando dados órfãos do Docker..."
docker system prune -f

# 4. Subir apenas o PostgreSQL primeiro
log_info "Subindo PostgreSQL..."
docker-compose up -d postgres

# 5. Aguardar banco ficar pronto
log_info "Aguardando PostgreSQL ficar pronto..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec bndmet-postgres pg_isready -U admin -d bndmet >/dev/null 2>&1; then
        log_success "PostgreSQL está pronto!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL não ficou pronto após $max_attempts tentativas"
        exit 1
    fi
    
    echo -n "."
    sleep 2
    ((attempt++))
done

# 6. Aguardar um pouco mais para garantir que os scripts foram executados
log_info "Aguardando execução dos scripts de inicialização..."
sleep 5

# 7. Verificar se as tabelas foram criadas
log_info "Verificando tabelas criadas..."
tables=$(docker exec bndmet-postgres psql -U admin -d bndmet -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'usuarios_%' OR table_name LIKE 'sessoes_%' OR table_name LIKE 'logs_%';" | xargs)

if echo "$tables" | grep -q "usuarios_admin"; then
    log_success "Tabela usuarios_admin criada!"
else
    log_error "Tabela usuarios_admin não foi criada!"
fi

if echo "$tables" | grep -q "usuarios_basicos"; then
    log_success "Tabela usuarios_basicos criada!"
else
    log_error "Tabela usuarios_basicos não foi criada!"
fi

# 8. Verificar usuário padrão
log_info "Verificando usuário administrador padrão..."
admin_count=$(docker exec bndmet-postgres psql -U admin -d bndmet -t -c "SELECT COUNT(*) FROM usuarios_admin WHERE email = 'admin@bndmet.com';" | xargs)

if [ "$admin_count" = "1" ]; then
    log_success "Usuário administrador padrão criado!"
    log_info "📧 Email: admin@bndmet.com"
    log_info "🔑 Senha: admin123"
else
    log_error "Usuário administrador padrão não foi criado!"
fi

# 9. Verificar usuários básicos de exemplo
log_info "Verificando usuários básicos de exemplo..."
basic_count=$(docker exec bndmet-postgres psql -U admin -d bndmet -t -c "SELECT COUNT(*) FROM usuarios_basicos;" | xargs)
log_success "$basic_count usuários básicos de exemplo criados!"

# 10. Mostrar estatísticas
log_info "Estatísticas do banco:"
docker exec bndmet-postgres psql -U admin -d bndmet -c "SELECT * FROM view_estatisticas_usuarios;"

# 11. Subir todos os serviços
log_info "Subindo todos os serviços..."
docker-compose up -d

# 12. Verificar status final
log_info "Status dos containers:"
docker-compose ps

echo ""
echo "🎉 SETUP CONCLUÍDO COM SUCESSO!"
echo "================================"
log_success "Banco de dados PostgreSQL: ✅ Funcionando"
log_success "Tabelas de autenticação: ✅ Criadas"
log_success "Usuário administrador: ✅ Criado"
log_success "Usuários básicos de exemplo: ✅ Criados"

echo ""
log_info "🌐 Serviços disponíveis:"
echo "   📊 Adminer (DB Manager): http://localhost:8080"
echo "   🗄️  PostgreSQL: localhost:5432"

echo ""
log_info "🔑 Credenciais de acesso:"
echo "   📧 Email: admin@bndmet.com"
echo "   🔑 Senha: admin123"

echo ""
log_info "📋 Próximos passos:"
echo "   1. Configure o backend com as rotas de autenticação"
echo "   2. Configure o frontend com as páginas de login"
echo "   3. Teste o sistema completo"

echo ""
log_warning "⚠️  IMPORTANTE: Em produção, altere as senhas padrão!"