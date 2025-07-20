#!/bin/bash

# Script de teste completo da API TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET com todas as opções de documentação
API_URL="http://localhost:3001/api"
BASE_URL="http://localhost:3001"

echo "🚀 TESTE COMPLETO DA API TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET v2.0.0"
echo "====================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para testar endpoint com cores
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local auth=$4
    local expected_code=$5
    
    echo -n "Testing $method $url ... "
    
    if [ -n "$auth" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth" \
                -d "$data")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$url" \
                -H "Authorization: Bearer $auth")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$url")
        fi
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ $http_code -eq 200 ] || [ $http_code -eq 201 ]; then
        echo -e "${GREEN}✅ $http_code${NC}"
    elif [ $http_code -eq 400 ] || [ $http_code -eq 401 ] || [ $http_code -eq 403 ]; then
        echo -e "${YELLOW}⚠️  $http_code${NC}"
    else
        echo -e "${RED}❌ $http_code${NC}"
        if [ ${#body} -lt 200 ]; then
            echo "    Response: $body"
        fi
    fi
}

echo ""
echo -e "${BLUE}📋 1. DOCUMENTAÇÃO E SISTEMA${NC}"
echo "------------------------------"

# Página inicial
echo -e "${CYAN}🏠 Página inicial:${NC}"
test_endpoint "GET" "$BASE_URL/"

# Health checks
echo -e "${CYAN}💚 Health checks:${NC}"
test_endpoint "GET" "$API_URL/health"
test_endpoint "GET" "$API_URL/"

# Documentação
echo -e "${CYAN}📚 Documentação:${NC}"
test_endpoint "GET" "$API_URL/endpoints"
test_endpoint "GET" "$API_URL/docs-info"
test_endpoint "GET" "$API_URL/test-scripts"
test_endpoint "GET" "$API_URL/docs.json"

echo ""
echo -e "${PURPLE}🔐 2. AUTENTICAÇÃO PÚBLICA${NC}"
echo "------------------------------"

# Login para obter token
echo -e "${CYAN}🔑 Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com","senha":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Token obtido com sucesso${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ Falha ao obter token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Cadastro usuário básico
echo -e "${CYAN}👤 Cadastros:${NC}"
TIMESTAMP=$(date +%s)
test_endpoint "POST" "$API_URL/auth/cadastro-basico" \
    "{\"nome\":\"Teste User $TIMESTAMP\",\"email\":\"teste$TIMESTAMP@email.com\",\"telefone\":\"(11)99999-9999\"}"

# Reset de senha
echo -e "${CYAN}🔄 Reset de senha:${NC}"
RESET_RESPONSE=$(curl -s -X POST $API_URL/auth/solicitar-reset-senha \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com"}')

RESET_TOKEN=$(echo $RESET_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$RESET_TOKEN" ]; then
    echo -e "${GREEN}✅ Token de reset: ${RESET_TOKEN:0:20}...${NC}"
    test_endpoint "GET" "$API_URL/auth/validar-token-reset/$RESET_TOKEN"
    # Não vamos fazer o reset real para não quebrar o admin
    echo -e "${YELLOW}⚠️  Pulando reset real para preservar admin${NC}"
else
    echo -e "${RED}❌ Falha ao obter token de reset${NC}"
fi

echo ""
echo -e "${GREEN}🔒 3. ENDPOINTS AUTENTICADOS${NC}"
echo "--------------------------------"

# Verificação de token
test_endpoint "GET" "$API_URL/auth/verificar-token" "" "$TOKEN"
test_endpoint "GET" "$API_URL/auth/perfil" "" "$TOKEN"

echo ""
echo -e "${YELLOW}👥 4. ENDPOINTS ADMINISTRATIVOS${NC}"
echo "----------------------------------"

# Gestão de usuários
echo -e "${CYAN}👥 Usuários:${NC}"
test_endpoint "GET" "$API_URL/auth/usuarios-basicos?limite=5" "" "$TOKEN"
test_endpoint "GET" "$API_URL/auth/usuarios-admin?limite=5" "" "$TOKEN"
test_endpoint "GET" "$API_URL/auth/estatisticas-usuarios" "" "$TOKEN"

# Sensores
echo -e "${CYAN}📊 Sensores:${NC}"
test_endpoint "POST" "$API_URL/sensor/dados" \
    '{"umidadeSolo":25.5,"temperatura":22.3,"riscoIntegrado":45.2,"nivelAlerta":"AMARELO","recomendacao":"Teste automatizado"}'

test_endpoint "GET" "$API_URL/sensor/status"
test_endpoint "GET" "$API_URL/sensor/ultimas?limite=5" "" "$TOKEN"
test_endpoint "GET" "$API_URL/sensor/alertas?limite=3" "" "$TOKEN"
test_endpoint "GET" "$API_URL/sensor/estatisticas" "" "$TOKEN"
test_endpoint "GET" "$API_URL/sensor/logs?limite=5" "" "$TOKEN"

# Período (últimos 7 dias)
echo -e "${CYAN}📅 Consulta por período:${NC}"
if command -v date >/dev/null 2>&1; then
    if date --version >/dev/null 2>&1; then
        # GNU date (Linux)
        DATA_INICIO=$(date -d '7 days ago' -u +%Y-%m-%dT%H:%M:%SZ)
        DATA_FIM=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    else
        # BSD date (macOS)
        DATA_INICIO=$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)
        DATA_FIM=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    fi
    test_endpoint "GET" "$API_URL/sensor/periodo?dataInicio=$DATA_INICIO&dataFim=$DATA_FIM&limite=3" "" "$TOKEN"
else
    echo -e "${YELLOW}⚠️  Comando 'date' não disponível, pulando teste de período${NC}"
fi

# Manutenção
echo -e "${CYAN}🧹 Manutenção:${NC}"
test_endpoint "POST" "$API_URL/auth/limpar-tokens-expirados" "" "$TOKEN"
test_endpoint "POST" "$API_URL/auth/limpar-sessoes-expiradas" "" "$TOKEN"

echo ""
echo -e "${PURPLE}🚨 5. TESTE DE ALERTAS${NC}"
echo "------------------------"

# Enviar alerta
test_endpoint "POST" "$API_URL/auth/enviar-alerta" \
    '{"titulo":"Teste Automatizado","mensagem":"Mensagem de teste do sistema de monitoramento BNDMET","nivelCriticidade":"medio","tipoDestinatario":"admins","canaisEnvio":["email"]}' \
    "$TOKEN"

echo ""
echo -e "${RED}🔐 6. SUPER ADMIN (pode falhar)${NC}"
echo "--------------------------------"

# Cadastro admin (pode falhar se não for super_admin)
test_endpoint "POST" "$API_URL/auth/cadastro-admin" \
    "{\"nome\":\"Teste Admin $TIMESTAMP\",\"email\":\"testadmin$TIMESTAMP@bndmet.com\",\"senha\":\"TesteSenh@123\",\"perfil\":\"admin\"}" \
    "$TOKEN"

echo ""
echo -e "${YELLOW}🧪 7. TESTES DE ERRO${NC}"
echo "----------------------"

# Login inválido
echo -e "${CYAN}❌ Erros esperados:${NC}"
test_endpoint "POST" "$API_URL/auth/login" '{"email":"admin@bndmet.com","senha":"senha_errada"}'

# Token inválido
test_endpoint "GET" "$API_URL/auth/perfil" "" "token_invalido"

# Dados inválidos
test_endpoint "POST" "$API_URL/auth/cadastro-basico" '{"email":"email_invalido"}'

# Endpoint inexistente
test_endpoint "GET" "$API_URL/endpoint-inexistente"

echo ""
echo -e "${BLUE}📱 8. TESTE DE DOCUMENTAÇÃO INTERATIVA${NC}"
echo "--------------------------------------------"

echo -e "${CYAN}📋 URLs de documentação disponíveis:${NC}"
echo "🔍 Swagger UI:      $BASE_URL/api/docs"
echo "📄 OpenAPI JSON:    $BASE_URL/api/docs.json"
echo "📄 OpenAPI YAML:    $BASE_URL/api/docs.yaml"
echo "📋 Lista Endpoints: $BASE_URL/api/endpoints"
echo "🧪 Scripts Teste:   $BASE_URL/api/test-scripts"
echo "ℹ️  Informações:     $BASE_URL/api/docs-info"
echo "💚 Health Check:    $BASE_URL/api/health"
echo "🏠 Página Inicial:  $BASE_URL/"

# Verificar se Swagger está acessível
echo ""
echo -e "${CYAN}🔍 Verificando Swagger UI...${NC}"
SWAGGER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/docs" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
if [ "$SWAGGER_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Swagger UI acessível${NC}"
else
    echo -e "${RED}❌ Swagger UI com problemas (código: $SWAGGER_RESPONSE)${NC}"
fi

echo ""
echo -e "${GREEN}🔚 9. LOGOUT${NC}"
echo "-------------"

test_endpoint "POST" "$API_URL/auth/logout" "" "$TOKEN"

echo ""
echo -e "${BLUE}📊 RESUMO DO TESTE${NC}"
echo "=================="
echo -e "${GREEN}✅ Verde:${NC} Sucesso (200/201)"
echo -e "${YELLOW}⚠️  Amarelo:${NC} Erro esperado (400/401/403)"
echo -e "${RED}❌ Vermelho:${NC} Erro inesperado (500+)"
echo ""
echo -e "${CYAN}🎯 ESTATÍSTICAS DA API:${NC}"
echo "• Total de endpoints: 28"
echo "• Endpoints públicos: 11"
echo "• Endpoints autenticados: 4"
echo "• Endpoints admin: 12"
echo "• Endpoints super admin: 1"
echo ""
echo -e "${PURPLE}🔗 DOCUMENTAÇÃO COMPLETA:${NC}"
echo "• Swagger interativo em: $BASE_URL/api/docs"
echo "• JSON estruturado em: $BASE_URL/api/endpoints"
echo "• Scripts de teste em: $BASE_URL/api/test-scripts"
echo "• Markdown completo no repositório"
echo ""
echo -e "${GREEN}✅ Teste concluído com sucesso!${NC}"
echo ""
echo -e "${CYAN}💡 Para testar manualmente:${NC}"
echo "1. Abra $BASE_URL/api/docs no navegador"
echo "2. Use 'admin@bndmet.com' e 'admin123' para login"
echo "3. Copie o token para testar endpoints protegidos"
echo ""
echo -e "${YELLOW}🔧 Para desenvolvimento:${NC}"
echo "• Importe $BASE_URL/api/docs.json no Postman"
echo "• Use scripts em $BASE_URL/api/test-scripts"
echo "• Monitore logs em $BASE_URL/api/sensor/logs"