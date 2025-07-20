import { Router } from 'express';
import sensorRoutes from './sensorRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Definir todas as rotas
router.use('/auth', authRoutes);
router.use('/sensor', sensorRoutes);

// Rota raiz da API com informações completas
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api`;
  
  res.json({
    message: 'API Monitoramento de Barragem integrado com API do BNDMET',
    version: '2.0.0',
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
        admin: ['ultimas', 'periodo', 'alertas', 'estatisticas', 'logs']
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
      "3_send_sensor_data": `curl -X POST ${baseUrl}/sensor/dados -H 'Content-Type: application/json' -d '{"umidadeSolo":25.5,"temperatura":22.3}'`,
      "4_get_statistics": `curl -H 'Authorization: Bearer <token>' ${baseUrl}/auth/estatisticas-usuarios`
    }
  });
});

// Rota de health check expandida
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      auth: 'active',
      sensors: 'monitoring',
      documentation: 'available'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    documentation_urls: {
      swagger: `${req.protocol}://${req.get('host')}/api/docs`,
      endpoints: `${req.protocol}://${req.get('host')}/api/endpoints`,
      scripts: `${req.protocol}://${req.get('host')}/api/test-scripts`
    }
  });
});

export default router;