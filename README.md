# Sistema Integrado de Monitoramento de Barragens de Rejeito
## ESP8266 NodeMCU + BNDMET API + Equação de Risco (Eq.5 TCC)

[![API Status](https://img.shields.io/badge/API-Online-green)](http://localhost:3001/api/health)
[![Version](https://img.shields.io/badge/Version-3.0.0-blue)](http://localhost:3001/api)
[![Swagger](https://img.shields.io/badge/Docs-Swagger-orange)](http://localhost:3001/api/docs)

---

## Resumo Executivo

Sistema integrado de monitoramento baseado no microcontrolador ESP8266 NodeMCU, com integração à Base Nacional de Dados Meteorológicos (BNDMET/DECEA, estação D6594) e ao OpenWeatherMap (OWM). Implementa arquitetura distribuída para coleta, processamento e armazenamento de dados em tempo real, com cálculo de risco por Equação de 7 variáveis ponderadas (Eq.5 TCC).

---

## Objetivos do Sistema

### Objetivo Geral
Desenvolver uma plataforma robusta de monitoramento de barragens de rejeito que integre dispositivos IoT com sistemas de análise de risco, banco de dados temporal e API REST para visualização e alertas.

### Objetivos Específicos
- Coletar dados de umidade do solo via ESP8266 NodeMCU (sensor capacitivo)
- Integrar dados meteorológicos históricos e de previsão via BNDMET e OWM
- Calcular índice de risco integrado por equação de 7 variáveis (Eq.5 TCC)
- Armazenar séries temporais em PostgreSQL + TimescaleDB
- Prover API RESTful com autenticação JWT e sistema de alertas

---

## Arquitetura do Sistema

```
[ESP8266 + Sensor] → [API REST Node.js] → [PostgreSQL + TimescaleDB]
        ↑                    ↑
  [BNDMET D6594]      [OWM /current + /forecast]
```

| Camada | Componente |
|--------|-----------|
| **Dispositivo** | ESP8266 NodeMCU + sensor capacitivo de umidade |
| **Meteorologia** | BNDMET/DECEA (estação D6594) + OpenWeatherMap |
| **Backend** | Node.js + TypeScript + Prisma ORM |
| **Banco** | PostgreSQL 15 + TimescaleDB (hypertable) |
| **Documentação** | Swagger UI + OpenAPI 3.0 |

---

## Tecnologias Utilizadas

### Backend
- **Node.js + TypeScript** — Runtime e tipagem estática
- **Prisma ORM** — Mapeamento objeto-relacional
- **PostgreSQL 15 + TimescaleDB** — Banco de dados temporal
- **JWT** — Autenticação e autorização
- **Docker** — Containerização dos serviços de banco

### Hardware
- **ESP8266 NodeMCU** — Microcontrolador principal
- **Sensor capacitivo de umidade** — Leitura via ADC (0–1023)

### APIs Externas
- **BNDMET/DECEA** — Estação D6594 (Alberto Flores, rede ANA), chave estática
- **OpenWeatherMap** — Dados atuais (`/current`) e previsão (`/forecast`)

---

## Guia de Implementação

### Pré-requisitos
- Docker Desktop instalado e em execução
- Node.js v18 ou superior
- NPM
- Portas **3001**, **8081** e **5432** disponíveis

---

### 1. Configuração do Banco de Dados (Docker)

#### 1.1 — Primeira instalação (ou reset completo)

> ⚠️ **Importante:** O PostgreSQL só executa os scripts de inicialização (`init/01-init.sql` e `init/02-auth-tables.sql`) quando o volume está vazio. Os arquivos são executados automaticamente em ordem alfabética. Se o container já existia, é necessário destruir o volume antes de recriar.

```bash
# Derruba containers e apaga o volume (use sempre que precisar reaplicar o schema)
docker-compose down -v

# Sobe novamente — executa 01-init.sql automaticamente na primeira inicialização
docker-compose up -d
```

#### 1.2 — Verificar status dos containers

```bash
docker-compose ps
```

**Saída esperada:**
```
NAME              STATUS
bndmet-postgres   Up (healthy)
bndmet-adminer    Up
```

#### 1.3 — Aguardar inicialização completa

Aguarde ~15 segundos após o `up -d` antes de conectar. O TimescaleDB precisa inicializar as extensões e executar o script SQL.

---

### 2. Validação do Banco de Dados

#### 2.1 — Acesso via terminal

```bash
docker exec -it bndmet-postgres psql -U admin -d bndmet
```

**Comandos de verificação:**
```sql
-- Listar tabelas (esperado: 7 tabelas)
\dt

-- Resultado esperado:
-- leituras_sensor, logs_sistema, configuracoes       ← criadas pelo 01-init.sql
-- usuarios_admin, usuarios_basicos,                  ← criadas pelo 02-auth-tables.sql
-- sessoes_usuario, logs_alertas

-- Contar registros de teste
SELECT COUNT(*) FROM leituras_sensor;
-- Esperado: 3

-- Verificar dados completos v3
SELECT timestamp, nivel_alerta, indice_risco, amplificado, estacao
FROM view_ultimas_leituras;

-- Verificar componentes da Eq.5 TCC
SELECT timestamp, nivel_alerta, v_lencol, v_chuva_futura, amplificado
FROM view_componentes_equacao;

-- Verificar configurações padrão
SELECT chave, valor FROM configuracoes;

-- Sair
\q
```

#### 2.2 — Acesso via Adminer (interface web)

> ⚠️ A porta mapeada é **8081** (não 8080)

- **URL**: `http://localhost:8081`
- **Credenciais**:
  - Sistema: `PostgreSQL`
  - Servidor: `postgres`
  - Usuário: `admin`
  - Senha: `senha123`
  - Base de dados: `bndmet`

---

### 3. Configuração do Backend

#### 3.1 — Acessar o diretório do backend

```bash
cd backend
```

#### 3.2 — Instalar dependências

```bash
npm install
```

#### 3.3 — Configurar variáveis de ambiente

Crie o arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL="postgresql://admin:senha123@localhost:5432/bndmet"
JWT_SECRET="seu-segredo-jwt-aqui"
PORT=3001
NODE_ENV=development
# Opcional — habilita envio de e-mail
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

#### 3.4 — Gerar o cliente Prisma

```bash
npx prisma generate
```

#### 3.5 — Sincronizar schema (somente se necessário)

> Não é necessário se o banco foi inicializado com `01-init.sql` via Docker.
> Use apenas para aplicar migrações incrementais.

```bash
npx prisma db push
```

#### 3.6 — Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

**Saída esperada:**
```
🔧 Variáveis de ambiente:
DATABASE_URL: ✅ Configurada
PORT: 3001
NODE_ENV: development
✅ Conectado ao banco de dados
🚀 Servidor rodando na porta 3001
📊 Ambiente: development
🌐 URL local: http://localhost:3001
📋 Health check: http://localhost:3001/api/sensor/status
```

---

### 4. Comandos de Gerenciamento Docker

```bash
# Ver logs do banco
docker-compose logs postgres

# Parar os serviços (mantém o volume/dados)
docker-compose down

# Reiniciar containers
docker-compose restart

# Reset completo — apaga TODOS os dados e reaplicar o init.sql
docker-compose down -v && docker-compose up -d
```

---

## Testes de Validação

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

**Resposta esperada:** `{"status":"healthy","version":"3.0.0",...}`

### 2. Status dos Sensores

```bash
curl http://localhost:3001/api/sensor/status
```

### 3. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bndmet.com","senha":"admin123"}'
```

### 4. Enviar dados de sensor (payload v3)

```bash
# NOTA: Este curl simula inserção manual de dado de teste (modo_manual = true automaticamente).
# O Arduino envia modoManual=false explicitamente. Curl/scripts que omitem o campo → backend grava true.
curl -X POST http://localhost:3001/api/sensor/dados \
  -H 'Content-Type: application/json' \
  -d '{
    "umidadeSolo": 22.0,
    "valorAdc": 560,
    "sensorOk": true,
    "fatorLocal": 0.880,
    "estacao": "D6594",

    "precipitacaoAtual": 2.5,
    "precipitacao24h": 22.5,
    "precipitacao7d": 65.0,
    "precipitacao30d": 185.0,
    "statusApiBndmet": "OK",
    "qualidadeDadosBndmet": 91,

    "temperatura": 20.3,
    "umidadeExterna": 78.0,
    "pressaoAtmosferica": 1009.0,
    "velocidadeVento": 6.2,
    "descricaoTempo": "Chuva fraca",
    "chuvaAtualOWM": 0.8,

    "chuvaFutura24h": 18.0,
    "intensidadePrevisao": "Moderada",
    "fatorIntensidade": 0.25,

    "riscoIntegrado": 0.54,
    "indiceRisco": 54,
    "nivelAlerta": "AMARELO",
    "recomendacao": "🟡 ATENÇÃO — Chuva prevista, aumentar frequência de monitoramento",
    "confiabilidade": 89,
    "amplificado": false,
    "taxaVariacaoUmidade": 0.180,

    "vLencol": 0.3520,
    "vChuvaAtual": 0.0360,
    "vChuvaHistorica": 0.0520,
    "vChuvaMensal": 0.0617,
    "vChuvaFutura": 0.0375,
    "vTaxaVariacao": 0.0180,
    "vPressao": 0.0000,

    "statusSistema": 1,
    "buzzerAtivo": false,
    "modoManual": true,
    "wifiConectado": true
  }'
```

### 5. Documentação Swagger

Acesse `http://localhost:3001/api/docs` no navegador para interface interativa completa.

---

## Estrutura do Projeto

```
sistema-bndmet/
├── docker-compose.yml
├── .env
├── init/
│   ├── 01-init.sql                        ← Schema v3: leituras_sensor, logs_sistema, configuracoes, views
│   └── 02-auth-tables.sql                 ← Auth: usuarios_admin, usuarios_basicos, sessoes, logs_alertas
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20250626233555_init/
│   │   │   └── 20260311205815_campos_v3/
│   │   ├── migration_lock.toml
│   │   └── schema.prisma                  ← Schema v3 sincronizado
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/                        ← env.ts, database.ts, swagger.ts
│   │   ├── controllers/                   ← sensorController.ts, authController.ts, docsController.ts
│   │   ├── lib/
│   │   │   └── bigint.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   └── index.ts
│   │   ├── routes/                        ← index.ts, sensorRoutes.ts, authRoutes.ts, docsRoutes.ts
│   │   ├── services/                      ← sensorService.ts, authService.ts, emailService.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   └── index.ts                   ← Interface DadosESP8266 v3
│   │   ├── utils/
│   │   │   └── response.ts
│   │   └── validators/
│   │       └── authValidators.ts
│   ├── .env
│   ├── package.json
│   └── package-lock.json
└── README.md
```

---

## Equação de Risco (Eq.5 TCC)

| Variável | Peso | Fonte |
|----------|------|-------|
| Nível do lençol freático | 0,40 | ESP8266 (ADC) |
| Chuva atual | 0,08 | BNDMET D6594 / OWM |
| Chuva histórica 7d | 0,12 | BNDMET D6594 |
| Chuva mensal 30d | 0,10 | BNDMET D6594 |
| Chuva futura 24h | 0,15 | OWM /forecast |
| Taxa de variação | 0,10 | Buffer circular |
| Pressão atmosférica | 0,05 | OWM |

**Amplificação ×1,20** quando `vLencol ≥ 0,70` E `chuvaFutura24h ≥ 5 mm`

| Nível | Índice | Ação |
|-------|--------|------|
| 🟢 VERDE | 0–50 | Normal |
| 🟡 AMARELO | 51–80 | Monitoramento intensivo |
| 🔴 VERMELHO | > 80 | Evacuação recomendada |

---

## Solução de Problemas

### Banco vazio / views não existem
O script de inicialização só executa quando o volume está vazio.
```bash
docker-compose down -v && docker-compose up -d
```

### Porta 8080 recusada no Adminer
A porta mapeada é **8081**. Acesse `http://localhost:8081`.

### Erro `uuid-ossp` no Prisma migrate
```bash
# Dentro do psql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Drift detection no Prisma
```bash
npx prisma db push --accept-data-loss
```

---

## Suporte

- **Email**: thamires.santos@grad.iprj.uerj.br
- **Documentação API**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health
- **GitHub**: https://github.com/ramosth/sistema-bndmet