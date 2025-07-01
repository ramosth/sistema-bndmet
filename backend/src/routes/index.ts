import { Router } from 'express';
import sensorRoutes from './sensorRoutes';

const router = Router();

// Definir todas as rotas
router.use('/sensor', sensorRoutes);

// Rota raiz
router.get('/', (req, res) => {
  res.json({
    message: 'API BNDMET - Sistema de Monitoramento',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      sensor: '/api/sensor',
      docs: '/api/docs',
    },
  });
});

export default router;