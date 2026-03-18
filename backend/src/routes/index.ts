// backend > src > routes > index.ts
import { Router } from 'express';
import sensorRoutes from './sensorRoutes';
import authRoutes from './authRoutes';
import prisma from '../config/database';

const router = Router();

// Definir todas as rotas
router.use('/auth', authRoutes);
router.use('/sensor', sensorRoutes);

// Rota raiz da API com informações completas
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api`;
  
  res.json({
    message: 'API Monitoramento de Barragem integrado com API do BNDMET',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    status: 'online',
    documentation: {
      swagger: `${baseUrl}/docs`,
      openapi_json: `${baseUrl}/docs.json`,
      openapi_yaml: `${baseUrl}/docs.yaml`,
      endpoints_list: `${baseUrl}/endpoints`,
      test_scripts: `${baseUrl}/test-scripts`,
      info: `${baseUrl}/docs-info`
    },
    endpoints: {
      auth: {
        base: '/api/auth',
        public: ['login', 'cadastro-basico', 'solicitar-reset-senha', 'resetar-senha'],
        authenticated: ['logout', 'verificar-token', 'perfil', 'alterar-senha'],
        admin: ['usuarios-basicos', 'usuarios-admin', 'estatisticas-usuarios', 'enviar-alerta'],
        super_admin: ['cadastro-admin']
      },
      sensor: {
        base: '/api/sensor',
        public: ['dados', 'status'],
        admin: ['ultimas', 'periodo', 'alertas', 'estatisticas', 'qualidade', 'logs']
      },
      system: {
        base: '/api',
        public: ['health', 'endpoints', 'docs-info', 'test-scripts']
      }
    },
    features: [
      '🔐 Sistema de Autenticação JWT',
      '📊 Monitoramento de Sensores',
      '👥 Gestão de Usuários',
      '🚨 Sistema de Alertas',
      '📈 Dashboard em Tempo Real',
      '📚 Documentação Completa',
      '🧪 Scripts de Teste'
    ],
    statistics: {
      total_endpoints: 28,
      public_endpoints: 11,
      authenticated_endpoints: 4,
      admin_endpoints: 12,
      super_admin_endpoints: 1
    },
    quick_start: {
      "1_login": `curl -X POST ${baseUrl}/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@bndmet.com","senha":"admin123"}'`,
      "2_get_profile": `curl -H 'Authorization: Bearer <token>' ${baseUrl}/auth/perfil`,
      "3_send_sensor_data": `curl -X POST ${baseUrl}/sensor/dados -H 'Content-Type: application/json' -d '{"umidadeSolo":18.5,"fatorLocal":0.740,"chuvaFutura24h":18.0,"intensidadePrevisao":"Moderada","fatorIntensidade":0.25,"riscoIntegrado":0.62,"indiceRisco":62,"nivelAlerta":"AMARELO","amplificado":false,"estacao":"D6594","wifiConectado":true}'`,
      "4_get_statistics": `curl -H 'Authorization: Bearer <token>' ${baseUrl}/auth/estatisticas-usuarios`
    }
  });
});

// Rota de health check com validações reais
// - Testa conectividade real com o banco via SELECT 1
// - Verifica se o ESP8266 está enviando dados baseado no timestamp da última leitura
//   Thresholds baseados nos intervalos do firmware v15:
//     active   → última leitura há < 3 min  (Verde envia a cada 60s)
//     degraded → última leitura entre 3–10 min (dados atrasados mas recentes)
//     offline  → última leitura há > 10 min (firmware parado ou WiFi caído)
router.get('/health', async (req, res) => {
  const startTime = Date.now();

  // ── 1. Banco de dados — query real ────────────────────────────────────────
  let databaseStatus: 'connected' | 'error' = 'error';
  let databaseLatencyMs: number | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatencyMs = Date.now() - dbStart;
    databaseStatus = 'connected';
  } catch {
    databaseStatus = 'error';
  }

  // ── 2. Sensor ESP8266 — baseado no timestamp da última leitura ────────────
  let sensorStatus: 'active' | 'degraded' | 'offline' | 'no_data' = 'no_data';
  let ultimaLeituraTimestamp: string | null = null;
  let minutosUltimaLeitura: number | null = null;
  let nivelAlertaAtual: string | null = null;
  let confiabilidadeAtual: number | null = null;

  try {
    const ultimaLeitura = await prisma.leiturasSensor.findFirst({
      orderBy: { timestamp: 'desc' },
      select: {
        timestamp:      true,
        nivelAlerta:    true,
        confiabilidade: true,
        wifiConectado:  true,
        sensorOk:       true,
      },
    });

    if (!ultimaLeitura) {
      sensorStatus = 'no_data';
    } else {
      const minutos = Math.floor(
        (Date.now() - ultimaLeitura.timestamp.getTime()) / (1000 * 60)
      );
      minutosUltimaLeitura   = minutos;
      ultimaLeituraTimestamp = ultimaLeitura.timestamp.toISOString();
      nivelAlertaAtual       = ultimaLeitura.nivelAlerta;
      confiabilidadeAtual    = ultimaLeitura.confiabilidade;

      if (minutos < 3)       sensorStatus = 'active';
      else if (minutos < 10) sensorStatus = 'degraded';
      else                   sensorStatus = 'offline';
    }
  } catch {
    sensorStatus = 'offline';
  }

  // ── 3. Status geral ───────────────────────────────────────────────────────
  // healthy   → banco OK + sensor active
  // degraded  → banco OK + sensor degradado ou sem dados recentes
  // unhealthy → banco com erro (HTTP 503)
  const overallStatus =
    databaseStatus === 'error'
      ? 'unhealthy'
      : sensorStatus === 'active'
        ? 'healthy'
        : 'degraded';

  return res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    status:         overallStatus,
    timestamp:      new Date().toISOString(),
    uptime:         process.uptime(),
    version:        '3.0.0',
    environment:    process.env.NODE_ENV || 'development',
    responseTimeMs: Date.now() - startTime,

    services: {
      database: {
        status:    databaseStatus,
        latencyMs: databaseLatencyMs,
      },
      sensor: {
        status:               sensorStatus,
        ultimaLeitura:        ultimaLeituraTimestamp,
        minutosUltimaLeitura: minutosUltimaLeitura,
        nivelAlerta:          nivelAlertaAtual,
        confiabilidade:       confiabilidadeAtual,
      },
      auth:          'active',
      documentation: 'available',
    },

    memory: {
      used:  Math.round(process.memoryUsage().heapUsed  / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },

    documentation_urls: {
      swagger:   `${req.protocol}://${req.get('host')}/api/docs`,
      endpoints: `${req.protocol}://${req.get('host')}/api/endpoints`,
      scripts:   `${req.protocol}://${req.get('host')}/api/test-scripts`,
    },
  });
});

export default router;