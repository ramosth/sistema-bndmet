# 📚 SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API - Documentação Completa

[![API Status](https://img.shields.io/badge/API-Online-green)](http://localhost:3001/api/health)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)](http://localhost:3001/api)
[![Swagger](https://img.shields.io/badge/Docs-Swagger-orange)](http://localhost:3001/api/docs)

## 🚀 Visão Geral

O Sistema TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET é uma API REST completa para monitoramento de segurança de barragens de rejeito, oferecendo:

- **🔐 Autenticação JWT** - Sistema seguro de login e autorização
- **📊 Monitoramento** - Coleta e análise de dados de sensores em tempo real  
- **👥 Gestão de Usuários** - Administradores e usuários básicos
- **🚨 Sistema de Alertas** - Notificações automáticas por email/SMS
- **📈 Dashboard** - Visualização e análise de dados
- **📚 Documentação** - Swagger, JSON, scripts de teste

---

## 🔗 URLs e Documentação

### 🌐 Base URLs
```
Development: http://localhost:3001/api
Production:  https://api.bndmet.com/api
```

### 📋 Documentação Disponível
| Formato | URL | Descrição |
|---------|-----|-----------|
| **Swagger UI** | `/api/docs` | Interface interativa para testar |
| **OpenAPI JSON** | `/api/docs.json` | Especificação para ferramentas |
| **OpenAPI YAML** | `/api/docs.yaml` | Especificação em YAML |
| **Endpoints List** | `/api/endpoints` | Lista JSON estruturada |
| **Scripts de Teste** | `/api/test-scripts` | Exemplos em múltiplas linguagens |
| **Health Check** | `/api/health` | Status dos serviços |

---

## 🔐 Autenticação

### Tipos de Acesso
| Nível | Descrição | Header Necessário |
|-------|-----------|-------------------|
| **Público** | Sem autenticação | Nenhum |
| **Autenticado** | Token JWT válido | `Authorization: Bearer <token>` |
| **Admin** | Token + perfil admin/super_admin | `Authorization: Bearer <token>` |
| **Super Admin** | Token + perfil super_admin | `Authorization: Bearer <token>` |

### Fluxo de Autenticação
```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bndmet.com","senha":"admin123"}'

# 2. Usar token retornado
curl -H 'Authorization: Bearer <seu-token>' \
  http://localhost:3001/api/auth/perfil
```

---

## 📋 Endpoints Completos

### 🔑 AUTENTICAÇÃO

#### `POST /auth/login` - Fazer Login
**Público** | Login administrativo para obter token JWT

**Request Body:**
```json
{
  "email": "admin@bndmet.com",     // obrigatório, formato email
  "senha": "admin123"              // obrigatório, mínimo 6 caracteres
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": "uuid",
      "nome": "Administrador Sistema",
      "email": "admin@bndmet.com",
      "perfil": "super_admin",
      "ativo": true
    },
    "expiresAt": "2025-07-12T19:12:26.167Z"
  },
  "message": "Login realizado com sucesso"
}
```

**Errors:** `401` Credenciais inválidas

---

#### `POST /auth/cadastro-basico` - Cadastro Usuário Básico
**Público** | Cadastrar usuário para receber notificações

**Request Body:**
```json
{
  "nome": "João Silva",                    // obrigatório, 2-100 caracteres
  "email": "joao@email.com",              // obrigatório, formato email único
  "telefone": "(11) 99999-0001",         // opcional, formato brasileiro
  "receberNotificacoes": true,            // opcional, default: true
  "tipoNotificacao": "email"              // opcional: email|sms|email,sms
}
```

**Response 201:** Usuário cadastrado com dados completos
**Errors:** `400` Email já existe ou dados inválidos

---

#### `POST /auth/solicitar-reset-senha` - Solicitar Reset
**Público** | Gerar token para reset de senha

**Request Body:**
```json
{
  "email": "admin@bndmet.com"    // obrigatório, formato email
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234",
    "expira": "2025-07-05T21:12:26.167Z"
  },
  "message": "Token de reset gerado com sucesso"
}
```

---

#### `GET /auth/validar-token-reset/{token}` - Validar Token Reset
**Público** | Verificar se token de reset é válido

**URL Params:** `token` (string, 64 caracteres)

**Response 200:** `{"success": true, "data": {"valido": true}}`
**Errors:** `400` Token inválido ou expirado

---

#### `POST /auth/resetar-senha` - Reset de Senha
**Público** | Alterar senha usando token

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234",
  "novaSenha": "NovaSenh@123",           // mínimo 8 chars, maiúscula+minúscula+número
  "confirmarSenha": "NovaSenh@123"       // opcional, deve ser igual
}
```

**Response 200:** `{"success": true, "message": "Senha alterada com sucesso"}`
**Errors:** `400` Token inválido ou senha fraca

---

### 🔒 ENDPOINTS AUTENTICADOS

#### `POST /auth/logout` - Logout
**Autenticado** | Invalidar token atual

**Response 200:** `{"success": true, "message": "Logout realizado com sucesso"}`

---

#### `GET /auth/verificar-token` - Verificar Token
**Autenticado** | Validar se token ainda é válido

**Response 200:**
```json
{
  "success": true,
  "data": {
    "usuario": { /* dados do usuário */ },
    "valido": true
  }
}
```

---

#### `GET /auth/perfil` - Obter Perfil
**Autenticado** | Dados do usuário logado

**Response 200:** Dados completos do usuário autenticado

---

#### `PUT /auth/alterar-senha` - Alterar Senha
**Autenticado** | Alterar senha do usuário logado

**Request Body:**
```json
{
  "senhaAtual": "senhaAtual123",         // obrigatório
  "novaSenha": "NovaSenh@123",           // obrigatório, regras de segurança
  "confirmarSenha": "NovaSenh@123"       // obrigatório, deve ser igual
}
```

**Response 200:** Senha alterada, todas as sessões invalidadas
**Errors:** `400` Senha atual incorreta

---

### 👥 ENDPOINTS ADMINISTRATIVOS

#### `GET /auth/usuarios-basicos` - Listar Usuários Básicos
**Admin** | Lista paginada de usuários básicos

**Query Params:**
- `pagina`: integer (default: 1, min: 1)
- `limite`: integer (default: 50, max: 100)

**Example:** `/auth/usuarios-basicos?pagina=1&limite=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-0001",
      "ativo": true,
      "receberNotificacoes": true,
      "tipoNotificacao": "email"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

#### `GET /auth/usuarios-admin` - Listar Administradores
**Admin** | Lista paginada de usuários administradores

**Query Params:** Mesmos de usuários básicos

**Response 200:** Lista com dados dos administradores (sem senhas)

---

#### `GET /auth/estatisticas-usuarios` - Estatísticas
**Admin** | Estatísticas gerais do sistema

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalAdminsAtivos": 2,
    "totalAdminsInativos": 0,
    "totalBasicosAtivos": 15,
    "totalBasicosInativos": 1,
    "totalComNotificacoes": 14,
    "alertasUltimos30Dias": 3,
    "timestamp": "2025-07-05T19:12:26.167Z"
  }
}
```

---

#### `POST /auth/enviar-alerta` - Enviar Alerta em Massa
**Admin** | Enviar notificações para usuários

**Request Body:**
```json
{
  "titulo": "Alerta de Segurança",                    // obrigatório, 5-200 chars
  "mensagem": "Detectado risco alto na barragem",    // obrigatório, 10-1000 chars
  "nivelCriticidade": "alto",                         // baixo|medio|alto|critico
  "tipoDestinatario": "todos",                        // basicos|admins|todos
  "destinatariosIds": ["uuid1", "uuid2"],            // opcional, IDs específicos
  "canaisEnvio": ["email", "sms"]                     // email|sms|push
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logId": "uuid",
    "totalEnviados": 25,
    "totalSucesso": 24,
    "totalFalhas": 1,
    "detalhes": [...]
  }
}
```

---

#### `POST /auth/limpar-tokens-expirados` - Limpeza de Tokens
**Admin** | Remover tokens de reset expirados (manutenção)

**Response 200:** `{"data": {"tokensLimpos": 5}}`

---

#### `POST /auth/limpar-sessoes-expiradas` - Limpeza de Sessões
**Admin** | Remover sessões de login expiradas (manutenção)

**Response 200:** Quantidade de sessões removidas

---

### 🔐 SUPER ADMIN

#### `POST /auth/cadastro-admin` - Cadastrar Administrador
**Super Admin** | Criar novo usuário administrador

**Request Body:**
```json
{
  "nome": "Maria Admin",                // obrigatório, 2-100 chars
  "email": "maria@bndmet.com",         // obrigatório, email único
  "senha": "SenhaFort@123",            // obrigatório, regras de segurança
  "perfil": "admin"                    // opcional: admin|super_admin
}
```

**Response 201:** Administrador criado
**Errors:** `403` Requer super_admin

---

### 📊 SENSORES

#### `POST /sensor/dados` - Receber Dados do ESP8266
**Público** | Endpoint para o ESP8266 enviar dados

**Request Body:**
```json
{
  "umidadeSolo": 25.5,              // opcional, 0-100 (float)
  "valorAdc": 650,                  // opcional, 0-1023 (integer)
  "sensorOk": true,                 // opcional, boolean
  "temperatura": 22.3,              // opcional, -50 a 60°C
  "precipitacao24h": 12.5,          // opcional, mm
  "riscoIntegrado": 45.2,           // opcional, 0-100
  "nivelAlerta": "AMARELO",         // VERDE|AMARELO|VERMELHO|CRÍTICO
  "recomendacao": "Monitoramento ativo",
  "wifiConectado": true,
  "dadosBrutos": {}                 // opcional, JSON adicional
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "timestamp": "2025-07-05T19:12:26.167Z"
  },
  "message": "Dados salvos com sucesso"
}
```

---

#### `GET /sensor/status` - Health Check Sensores
**Público** | Status da API e última leitura

**Response 200:**
```json
{
  "success": true,
  "data": {
    "api": "online",
    "timestamp": "2025-07-05T19:12:26.167Z",
    "banco": "conectado",
    "ultimaLeitura": "2025-07-05T19:10:15.123Z"
  }
}
```

---

#### `GET /sensor/ultimas` - Últimas Leituras
**Admin** | Buscar últimas leituras dos sensores

**Query Params:** `limite` (default: 100, max: 1000)

**Response 200:** Array com últimas leituras ordenadas por timestamp

---

#### `GET /sensor/periodo` - Leituras por Período
**Admin** | Buscar leituras em período específico

**Query Params (obrigatórios):**
- `dataInicio`: string ISO 8601 (ex: 2025-07-01T00:00:00Z)
- `dataFim`: string ISO 8601 (ex: 2025-07-05T23:59:59Z)
- `pagina`: integer (default: 1)
- `limite`: integer (default: 50)

**Example:** `/sensor/periodo?dataInicio=2025-07-01T00:00:00Z&dataFim=2025-07-05T23:59:59Z`

**Response 200:** Leituras do período com paginação
**Errors:** `400` Datas obrigatórias ou formato inválido

---

#### `GET /sensor/alertas` - Alertas Críticos
**Admin** | Buscar alertas de nível alto/crítico

**Query Params:** `limite` (default: 50)

**Response 200:** Alertas de nível CRÍTICO, ALTO, VERMELHO

---

#### `GET /sensor/estatisticas` - Estatísticas dos Sensores
**Admin** | Estatísticas gerais dos sensores

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalLeituras": 15420,
    "ultimaLeitura": { /* dados */ },
    "estatisticas24h": {
      "mediaUmidade": 24.8,
      "mediaRisco": 42.3,
      "totalLeituras": 288,
      "alertasCriticos": 2
    }
  }
}
```

---

#### `GET /sensor/logs` - Logs do Sistema
**Admin** | Buscar logs do sistema

**Query Params:**
- `nivel`: INFO|WARNING|ERROR|CRITICAL
- `componente`: SENSOR|BNDMET|CONECTIVIDADE
- `limite`: integer (default: 100)

**Response 200:** Logs filtrados e ordenados

---

### 🏥 SISTEMA

#### `GET /health` - Health Check Geral
**Público** | Status de todos os serviços

**Response 200:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-05T19:12:26.167Z",
  "uptime": 86400,
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "auth": "active",
    "sensors": "monitoring"
  }
}
```

---

#### `GET /` - Informações da API
**Público** | Informações gerais e links de documentação

**Response 200:** JSON com informações da API, endpoints disponíveis e exemplos

---

#### `GET /endpoints` - Lista de Endpoints
**Público** | Documentação estruturada de todos os endpoints

**Response 200:** JSON completo com todos os endpoints, validações e exemplos

---

#### `GET /docs-info` - Informações sobre Documentação
**Público** | Links e informações sobre formatos de documentação

**Response 200:** URLs e descrições de toda documentação disponível

---

#### `GET /test-scripts` - Scripts de Teste
**Público** | Scripts prontos para testar a API

**Response 200:** Scripts em bash, JavaScript, Python, coleção Postman

---

## 📊 Resumo dos Endpoints

### Por Método HTTP
| Método | Quantidade | Endpoints |
|--------|------------|-----------|
| **GET** | 15 | health, perfil, usuários, estatísticas, sensores, docs |
| **POST** | 12 | login, cadastros, alertas, dados, logout, reset |
| **PUT** | 1 | alterar-senha |
| **Total** | **28** | endpoints documentados |

### Por Nível de Acesso
| Nível | Quantidade | Descrição |
|-------|------------|-----------|
| **Público** | 11 | Sem autenticação necessária |
| **Autenticado** | 4 | Requer token JWT válido |
| **Admin** | 12 | Requer token + perfil admin |
| **Super Admin** | 1 | Requer token + perfil super_admin |

---

## 🧪 Scripts de Teste

### Bash - Teste Completo
```bash
#!/bin/bash
API_URL="http://localhost:3001/api"

# 1. Health Check
curl -s ${API_URL}/health | jq '.'

# 2. Login
TOKEN=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bndmet.com","senha":"admin123"}' | \
  jq -r '.data.token')

# 3. Perfil
curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/auth/perfil | jq '.'

# 4. Estatísticas
curl -s -H "Authorization: Bearer $TOKEN" ${API_URL}/auth/estatisticas-usuarios | jq '.'

# 5. Dados de sensor
curl -s -X POST ${API_URL}/sensor/dados \
  -H "Content-Type: application/json" \
  -d '{"umidadeSolo":25.5,"temperatura":22.3,"riscoIntegrado":45.2}' | jq '.'
```

### JavaScript - Exemplo de Uso
```javascript
const API_URL = 'http://localhost:3001/api';

// Login
async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@bndmet.com',
      senha: 'admin123'
    })
  });
  
  const data = await response.json();
  return data.data.token;
}

// Usar token
async function getProfile(token) {
  const response = await fetch(`${API_URL}/auth/perfil`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
}

// Exemplo de uso
const token = await login();
const profile = await getProfile(token);
console.log(profile);
```

### Python - Cliente da API
```python
import requests

class BNDMETClient:
    def __init__(self, base_url='http://localhost:3001/api'):
        self.base_url = base_url
        self.token = None
    
    def login(self, email, senha):
        response = requests.post(f'{self.base_url}/auth/login', json={
            'email': email,
            'senha': senha
        })
        data = response.json()
        self.token = data['data']['token']
        return self.token
    
    def get_profile(self):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f'{self.base_url}/auth/perfil', headers=headers)
        return response.json()
    
    def send_sensor_data(self, data):
        response = requests.post(f'{self.base_url}/sensor/dados', json=data)
        return response.json()

# Uso
client = BNDMETClient()
client.login('admin@bndmet.com', 'admin123')
profile = client.get_profile()
```

---

## 🚨 Códigos de Status HTTP

| Código | Nome | Quando Acontece |
|--------|------|-----------------|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado com sucesso |
| **400** | Bad Request | Dados inválidos ou malformados |
| **401** | Unauthorized | Token ausente, inválido ou expirado |
| **403** | Forbidden | Usuário sem permissão suficiente |
| **404** | Not Found | Endpoint não encontrado |
| **500** | Internal Server Error | Erro interno do servidor |

---

## 🔧 Ferramentas e Integrações

### 🧪 Testes
- **Swagger UI**: Interface interativa
- **cURL**: Linha de comando
- **Postman**: Coleção disponível em `/api/test-scripts`
- **HTTPie**: Cliente HTTP amigável

### 🛠️ Desenvolvimento
- **OpenAPI Generator**: Gerar SDKs
- **Postman Collections**: Importar spec JSON
- **Insomnia**: Importar OpenAPI spec
- **VS Code REST Client**: Usar endpoints diretamente

### 📊 Monitoramento
- **Health Check**: `/api/health`
- **Logs**: `/api/sensor/logs`
- **Estatísticas**: `/api/auth/estatisticas-usuarios`

---

## 📞 Suporte

- **Email**: admin@bndmet.com
- **Documentação**: http://localhost:3001/api/docs
- **Status**: http://localhost:3001/api/health
- **GitHub**: https://github.com/ramosth/sistema-bndmet

---

## 📈 Changelog

### v2.0.0 (2025-07-05)
- ✅ Sistema completo de autenticação JWT
- ✅ Reset de senha funcional
- ✅ Documentação Swagger interativa
- ✅ Scripts de teste em múltiplas linguagens
- ✅ 28 endpoints documentados
- ✅ Sistema de alertas em massa
- ✅ Monitoramento em tempo real

---

**🚀 API TCC_MONITORA_BARRAGEM_ARDUINO_BNDMET v2.0.0 - Sistema completo de monitoramento de barragens**