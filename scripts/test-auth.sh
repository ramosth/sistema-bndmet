#!/bin/bash

# Teste completo do sistema de autenticação
API_URL="http://localhost:3001/api/auth"

echo "🧪 TESTANDO SISTEMA DE AUTENTICAÇÃO"
echo "=================================="

# 1. TESTE LOGIN
echo "1️⃣ Testando login..."
RESPONSE=$(curl -s -X POST $API_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com","senha":"admin123"}')

echo "Resposta: $RESPONSE"

# Extrair token (você pode usar jq se tiver instalado)
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token extraído: $TOKEN"

echo ""

# 2. TESTE VERIFICAR TOKEN
echo "2️⃣ Testando verificação de token..."
curl -s -X GET $API_URL/verificar-token \
  -H "Authorization: Bearer $TOKEN" | echo "Resposta: $(cat)"

echo -e "\n"

# 3. TESTE SOLICITAR RESET
echo "3️⃣ Testando solicitar reset de senha..."
RESET_RESPONSE=$(curl -s -X POST $API_URL/solicitar-reset-senha \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com"}')

echo "Resposta: $RESET_RESPONSE"

# Extrair token de reset
RESET_TOKEN=$(echo $RESET_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token de reset extraído: $RESET_TOKEN"

echo ""

# 4. TESTE VALIDAR TOKEN RESET
echo "4️⃣ Testando validação de token de reset..."
curl -s -X GET $API_URL/validar-token-reset/$RESET_TOKEN | echo "Resposta: $(cat)"

echo -e "\n"

# 5. TESTE RESETAR SENHA
echo "5️⃣ Testando reset de senha..."
curl -s -X POST $API_URL/resetar-senha \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"novaSenha\":\"NovaSenh@123\",\"confirmarSenha\":\"NovaSenh@123\"}" | echo "Resposta: $(cat)"

echo -e "\n"

# 6. TESTE LOGIN COM NOVA SENHA
echo "6️⃣ Testando login com nova senha..."
NEW_LOGIN=$(curl -s -X POST $API_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com","senha":"NovaSenh@123"}')

echo "Resposta: $NEW_LOGIN"

# Extrair novo token
NEW_TOKEN=$(echo $NEW_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Novo token: $NEW_TOKEN"

echo ""

# 7. TESTE FUNÇÕES ADMINISTRATIVAS
echo "7️⃣ Testando funções administrativas..."

echo "📊 Estatísticas de usuários:"
curl -s -X GET $API_URL/estatisticas-usuarios \
  -H "Authorization: Bearer $NEW_TOKEN" | echo "$(cat)"

echo -e "\n"

echo "🧹 Limpando tokens expirados:"
curl -s -X POST $API_URL/limpar-tokens-expirados \
  -H "Authorization: Bearer $NEW_TOKEN" | echo "$(cat)"

echo -e "\n"

echo "🧹 Limpando sessões expiradas:"
curl -s -X POST $API_URL/limpar-sessoes-expiradas \
  -H "Authorization: Bearer $NEW_TOKEN" | echo "$(cat)"

echo -e "\n"

# 8. TESTE CADASTRO USUÁRIO BÁSICO
echo "8️⃣ Testando cadastro de usuário básico..."
curl -s -X POST $API_URL/cadastro-basico \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste Usuario","email":"teste@email.com","telefone":"(11)99999-9999"}' | echo "$(cat)"

echo -e "\n"

# 9. TESTE LISTAR USUÁRIOS
echo "9️⃣ Testando listagem de usuários..."
curl -s -X GET $API_URL/usuarios-basicos \
  -H "Authorization: Bearer $NEW_TOKEN" | echo "$(cat)"

echo -e "\n"

# 10. TESTE LOGOUT
echo "🔟 Testando logout..."
curl -s -X POST $API_URL/logout \
  -H "Authorization: Bearer $NEW_TOKEN" | echo "$(cat)"

echo -e "\n"

echo "✅ TESTES CONCLUÍDOS!"
echo "====================="
echo ""
echo "🔧 Para restaurar a senha original:"
echo "UPDATE usuarios_admin SET senha_hash = '\$2b\$10\$rOzJQQjJ9X5qZ8YvQQ9Z0OzJQjJ9X5qZ8YvQQ9Z0OzJQjJ9X5qZ8Yv' WHERE email = 'admin@bndmet.com';"