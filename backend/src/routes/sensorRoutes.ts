import { Router } from 'express';
import { SensorController } from '../controllers/sensorController';

const router = Router();

// Rotas para ESP8266
router.post('/dados', SensorController.receberDados);

// Rotas para consulta (Dashboard/Frontend)
router.get('/ultimas', SensorController.buscarUltimas);
router.get('/periodo', SensorController.buscarPorPeriodo);
router.get('/alertas', SensorController.buscarAlertas);
router.get('/estatisticas', SensorController.obterEstatisticas);
router.get('/logs', SensorController.buscarLogs);

// Health check
router.get('/status', SensorController.status);

export default router;