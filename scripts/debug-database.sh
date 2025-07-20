#!/bin/bash

# 🔍 Script de Debug do Banco de Dados
echo "🔍 DIAGNÓSTICO DO BANCO DE DADOS"
echo "================================="

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 1. Verificar arquivos
echo ""
log_info "1. Verificando arquivos necessários..."

if [ -f "database/init/01-init.sql" ]; then
    log_success "Arquivo 01-init.sql encontrado"
else
    log_error "Arquivo 01-init.sql NÃO encontrado"
fi

if [ -f "database/init/02-auth-tables.sql" ]; then
    log_success "Arquivo 02-auth-tables.sql encontrado"
    echo "   Tamanho: $(wc -l < database/init/02-auth-tables.sql) linhas"
else
    log_error "Arquivo 02-auth-tables.sql NÃO encontrado"
fi

# 2. Verificar conteúdo dos scripts de init
echo ""
log_info "2. Verificando conteúdo da pasta de inicialização..."
ls -la database/init/

# 3. Verificar logs do container
echo ""
log_info "3. Verificando logs do PostgreSQL..."
docker logs bndmet-postgres | tail -20

# 4. Verificar se a pasta está sendo montada corretamente
echo ""
log_info "4. Verificando montagem de volumes dentro do container..."
docker exec bndmet-postgres ls -la /docker-entrypoint-initdb.d/

# 5. Verificar tabelas existentes
echo ""
log_info "5. Tabelas existentes no banco:"
docker exec bndmet-postgres psql -U admin -d bndmet -c "\dt"

# 6. Verificar se é um problema de execução
echo ""
log_info "6. Executando script manualmente..."
log_warning "Tentando executar o script 02-auth-tables.sql manualmente..."

if [ -f "database/init/02-auth-tables.sql" ]; then
    docker exec -i bndmet-postgres psql -U admin -d bndmet < database/init/02-auth-tables.sql
    
    echo ""
    log_info "Verificando se as tabelas foram criadas agora..."
    docker exec bndmet-postgres psql -U admin -d bndmet -c "\dt" | grep -E "(usuarios_|sessoes_|logs_)"
    
    if [ $? -eq 0 ]; then
        log_success "✅ Tabelas criadas com sucesso após execução manual!"
    else
        log_error "❌ Ainda há problemas na criação das tabelas"
    fi
else
    log_error "Arquivo 02-auth-tables.sql não encontrado para execução manual"
fi

echo ""
log_info "7. Status atual dos containers:"
docker-compose ps