#!/bin/bash

# Script de manutenção do sistema TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET
# Execute diariamente via cron

# Configurações
API_URL="http://localhost:3001/api/auth"
LOG_FILE="/var/log/bndmet-maintenance.log"
ADMIN_EMAIL="admin@bndmet.com"
ADMIN_PASSWORD="admin123"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "=== INICIANDO MANUTENÇÃO TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET ==="

# 1. Fazer login para obter token
log "Fazendo login administrativo..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"senha\":\"$ADMIN_PASSWORD\"}")

# Verificar se login foi bem-sucedido
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    log "Login realizado com sucesso"
else
    log "ERRO: Falha no login administrativo"
    log "Resposta: $LOGIN_RESPONSE"
    exit 1
fi

# 2. Limpar tokens de reset expirados
log "Limpando tokens de reset expirados..."
TOKENS_RESPONSE=$(curl -s -X POST $API_URL/limpar-tokens-expirados \
  -H "Authorization: Bearer $TOKEN")

if echo "$TOKENS_RESPONSE" | grep -q '"success":true'; then
    TOKENS_LIMPOS=$(echo $TOKENS_RESPONSE | grep -o '"tokensLimpos":[0-9]*' | cut -d':' -f2)
    log "✅ $TOKENS_LIMPOS tokens de reset removidos"
else
    log "⚠️ Erro ao limpar tokens de reset"
    log "Resposta: $TOKENS_RESPONSE"
fi

# 3. Limpar sessões expiradas
log "Limpando sessões expiradas..."
SESSOES_RESPONSE=$(curl -s -X POST $API_URL/limpar-sessoes-expiradas \
  -H "Authorization: Bearer $TOKEN")

if echo "$SESSOES_RESPONSE" | grep -q '"success":true'; then
    log "✅ Sessões expiradas removidas"
else
    log "⚠️ Erro ao limpar sessões"
    log "Resposta: $SESSOES_RESPONSE"
fi

# 4. Verificar estatísticas do sistema
log "Verificando estatísticas do sistema..."
STATS_RESPONSE=$(curl -s -X GET $API_URL/estatisticas-usuarios \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | grep -q '"success":true'; then
    log "📊 Estatísticas obtidas com sucesso"
    
    # Extrair informações importantes (se você tiver jq instalado)
    if command -v jq &> /dev/null; then
        TOTAL_ADMINS=$(echo "$STATS_RESPONSE" | jq -r '.data.total_admins_ativos // 0')
        TOTAL_BASICOS=$(echo "$STATS_RESPONSE" | jq -r '.data.total_basicos_ativos // 0')
        ALERTAS_30D=$(echo "$STATS_RESPONSE" | jq -r '.data.alertas_ultimos_30_dias // 0')
        
        log "👥 Usuários ativos: $TOTAL_ADMINS admins, $TOTAL_BASICOS básicos"
        log "🚨 Alertas últimos 30 dias: $ALERTAS_30D"
    fi
else
    log "⚠️ Erro ao obter estatísticas"
fi

# 5. Fazer logout
log "Fazendo logout..."
curl -s -X POST $API_URL/logout \
  -H "Authorization: Bearer $TOKEN" > /dev/null

log "=== MANUTENÇÃO CONCLUÍDA ==="
log ""

# Opcional: Verificar tamanho do log e rotacionar se necessário
LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LOG_SIZE" -gt 10485760 ]; then  # 10MB
    log "Rotacionando log (tamanho: $LOG_SIZE bytes)"
    mv "$LOG_FILE" "${LOG_FILE}.old"
    touch "$LOG_FILE"
fi