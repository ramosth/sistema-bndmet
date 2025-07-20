#!/bin/bash

echo "🧪 Testando endpoint de estatísticas corrigido"
echo "=============================================="

# 1. Fazer login
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com","senha":"admin123"}')

echo "Login: $LOGIN_RESPONSE"

# Extrair token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

echo ""

# 2. Testar estatísticas
echo "2️⃣ Testando estatísticas..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/estatisticas-usuarios \
  -H "Authorization: Bearer $TOKEN")

echo "Estatísticas: $STATS_RESPONSE"

echo ""

# 3. Testar outras rotas que funcionaram
echo "3️⃣ Testando outras rotas..."

echo "📊 Health check:"
curl -s http://localhost:3001/api/health

echo -e "\n"

echo "👥 Usuários básicos:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/usuarios-basicos | head -c 200

echo -e "\n"

echo "🧹 Limpeza de tokens:"
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/limpar-tokens-expirados

echo ""
echo "✅ Teste concluído!"