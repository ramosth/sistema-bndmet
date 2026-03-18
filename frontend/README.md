# Frontend — Sistema de Monitoramento de Barragens
## Next.js 14 + React + Dashboard em Tempo Real

[![Next.js](https://img.shields.io/badge/Next.js-14.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)]()

---

## Visão Geral

Interface web do sistema de monitoramento de barragens de rejeito. Consome a API REST do backend Node.js e exibe dados em tempo real dos sensores ESP8266, incluindo equação de risco, alertas críticos, relatórios e gestão de usuários.

---

## Pré-requisitos

- Node.js v18 ou superior
- NPM
- Backend rodando em `http://localhost:3001` (via Docker ou `npm run dev`)

---

## Instalação e Execução

### 1. Acessar o diretório do frontend

```bash
cd frontend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie o arquivo `.env.local` na pasta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> ⚠️ Se o backend estiver rodando em outro IP (ex: acesso por rede local), substitua `localhost` pelo IP da máquina — ex: `http://192.168.1.108:3001/api`.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

**Saída esperada:**
```
> frontend@0.1.0 dev
> next dev

  ▲ Next.js 14.2.4
  - Local:        http://localhost:3000
  - Environments: .env.local
```

### 5. Build para produção

```bash
npm run build
npm run start
```

---

## Tecnologias

| Pacote | Versão | Uso |
|--------|--------|-----|
| `next` | 14.2.4 | Framework React com App Router |
| `react` | 18 | Interface de usuário |
| `axios` | 1.7.2 | Requisições HTTP para a API |
| `recharts` | 2.12.7 | Gráficos de dados dos sensores |
| `lucide-react` | 0.396.0 | Ícones |
| `react-hook-form` | 7.52.0 | Formulários com validação |
| `react-hot-toast` | 2.4.1 | Notificações |
| `date-fns` | 3.6.0 | Manipulação de datas |

---

## Estrutura de Páginas

| Rota | Componente principal | Descrição |
|------|----------------------|-----------|
| `/` | `LandingPage.js` | Página inicial com login |
| `/dashboard` | `DashboardContent.js` | Visão geral em tempo real |
| `/sensores` | `SensorsContent.js` | Tabela e gráfico de leituras |
| `/alertas` | `AlertsContent.js` | Central de alertas críticos |
| `/relatorios` | `ReportsContent.js` | Geração e exportação de relatórios |
| `/usuarios` | `UsersContent.js` | Gestão de usuários |
| `/configuracoes` | `SettingsContent.js` | Perfil e segurança |

---

## Estrutura de Arquivos

```
frontend/
├── .env.local                          ← NEXT_PUBLIC_API_URL
├── next.config.js                      ← Rewrites /api/* → backend:3001
├── jsconfig.json                       ← Alias @/* → ./src/*
├── package.json
└── src/
    ├── app/                            ← App Router (Next.js 14)
    │   ├── layout.js                   ← RootLayout com AuthProvider + Toaster
    │   ├── page.js                     ← Rota raiz → LandingPage
    │   └── (dashboard)/                ← Rotas protegidas
    │       ├── dashboard/
    │       ├── sensores/
    │       ├── alertas/
    │       ├── relatorios/
    │       ├── usuarios/
    │       └── configuracoes/
    ├── components/
    │   ├── layout/
    │   │   ├── DashboardLayout.js      ← Layout com Sidebar + Header
    │   │   ├── Sidebar.js              ← Navegação lateral com controle por perfil
    │   │   └── Header.js               ← Cabeçalho com usuário logado
    │   ├── dashboard/
    │   │   ├── DashboardContent.js     ← Cards de estatísticas + última leitura
    │   │   ├── SensorChart.js          ← Gráfico Recharts (umidade + risco)
    │   │   ├── AlertsPanel.js          ← Painel de alertas recentes
    │   │   ├── SystemStatus.js         ← Indicador online/offline
    │   │   ├── StatCard.js             ← Card de métrica
    │   │   └── RecentActivity.js       ← Log de atividades recentes
    │   ├── sensors/
    │   │   └── SensorsContent.js       ← Tabela paginada + filtros + exportação CSV
    │   ├── alerts/
    │   │   ├── AlertsContent.js        ← Lista paginada de alertas + envio em massa
    │   │   └── AlertForm.js            ← Formulário de alerta por e-mail
    │   ├── reports/
    │   │   └── ReportsContent.js       ← Relatório por período + exportação HTML/CSV
    │   ├── users/
    │   │   ├── UsersContent.js         ← CRUD de usuários admin e básicos
    │   │   ├── UserTable.js            ← Tabela de usuários
    │   │   ├── UserForm.js             ← Formulário de criação/edição
    │   │   ├── DeleteConfirmModal.js   ← Modal de confirmação de exclusão
    │   │   └── InactiveUsersModal.js   ← Modal de usuários inativos
    │   ├── settings/
    │   │   └── SettingsContent.js      ← Perfil, senha, manutenção do sistema
    │   └── ui/
    │       ├── Button.js
    │       ├── Card.js
    │       ├── Input.js
    │       ├── Modal.js
    │       └── LoadingSpinner.js
    ├── contexts/
    │   └── AuthContext.js              ← JWT, login, logout, perfil do usuário
    ├── hooks/
    │   └── index.js                    ← useRealTimeData, useFilters, usePagination
    ├── services/
    │   └── api.js                      ← Axios + authService, sensorService, alertService
    ├── utils/
    │   └── index.js                    ← formatDateBR, formatNumber, getAlertLevel
    └── styles/
        └── globals.css
```

---

## Autenticação

O sistema usa JWT armazenado no `localStorage`. O `AuthContext` gerencia:

- Login via `POST /api/auth/login`
- Logout via `POST /api/auth/logout`
- Controle de rotas protegidas via `ProtectedRoute`
- Controle de acesso por perfil (`admin`, `super_admin`)

**Perfis disponíveis:**

| Perfil | Acesso |
|--------|--------|
| `super_admin` | Todas as páginas + aba Sistema nas configurações |
| `admin` | Dashboard, Sensores, Alertas, Relatórios, Usuários, Configurações |

---

## Serviços de API (`src/services/api.js`)

```js
// Sensor
sensorService.getLatestReadings(limite)
sensorService.getReadingsByPeriod(dataInicio, dataFim, pagina, limite)
sensorService.getAlerts(limite)
sensorService.getStatistics()
sensorService.getLogs(nivel, componente, limite)

// Auth / Usuários
authService.login(email, senha)
authService.logout()
userService.getBasicUsers()
userService.getAdminUsers()
userService.createBasicUser(data)
userService.createAdminUser(data)
userService.updateBasicUser(id, data)
userService.updateAdminUser(id, data)
userService.toggleBasicUserStatus(id, ativo)
userService.deleteBasicUser(id)

// Alertas
alertService.enviarAlertaMassa(alertData)

// Sistema
systemService.getHealth()
systemService.cleanExpiredTokens()
systemService.cleanExpiredSessions()
```

---

## Dados exibidos no Dashboard

### Cards de estatísticas (últimas 24h)
- Total de leituras
- Umidade média do solo
- Risco integrado médio
- Alertas críticos

### Última leitura
- Timestamp, nível de alerta, recomendação
- Dados meteorológicos (temperatura, umidade externa, pressão, vento)
- Qualidade dos dados (BNDMET, OWM, confiabilidade, status do sensor)

### Gráfico
- Umidade do solo vs risco integrado — últimas 24h via Recharts

---

## Solução de Problemas

### Página em branco após login
Verificar se o backend está rodando em `http://localhost:3001`. Checar o console do navegador para erros de CORS ou 401.

### Dados não carregam
Confirmar que `NEXT_PUBLIC_API_URL` no `.env.local` aponta para o endereço correto do backend.

### Erro de CORS
O `next.config.js` inclui rewrite de `/api/*` para o backend. Em desenvolvimento, as requisições passam por esse proxy automaticamente. Em produção, garantir que `CORS_ORIGIN` no backend inclui a URL do frontend.

### Timestamps em UTC no frontend
A conversão para horário de Brasília é feita na camada de exibição. Não alterar o armazenamento no banco.