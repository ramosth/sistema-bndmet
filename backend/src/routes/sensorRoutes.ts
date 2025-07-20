import { Router } from 'express';
import { SensorController } from '../controllers/sensorController';

const router = Router();

// ========== ROTAS PÚBLICAS ==========

/**
 * @swagger
 * /sensor/dados:
 *   post:
 *     tags: [Sensores]
 *     summary: Receber dados do ESP8266
 *     description: Endpoint para o ESP8266 enviar dados de monitoramento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               umidadeSolo:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 25.5
 *                 description: Umidade do solo em porcentagem
 *               valorAdc:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1023
 *                 example: 650
 *                 description: Valor ADC do sensor
 *               sensorOk:
 *                 type: boolean
 *                 example: true
 *                 description: Status de funcionamento do sensor
 *               fatorLocal:
 *                 type: number
 *                 format: float
 *                 example: 1.2
 *                 description: Fator de correção local
 *               precipitacaoAtual:
 *                 type: number
 *                 format: float
 *                 example: 0.0
 *                 description: Precipitação atual em mm
 *               precipitacao24h:
 *                 type: number
 *                 format: float
 *                 example: 12.5
 *                 description: Precipitação nas últimas 24h em mm
 *               precipitacao7d:
 *                 type: number
 *                 format: float
 *                 example: 45.2
 *                 description: Precipitação nos últimos 7 dias em mm
 *               temperatura:
 *                 type: number
 *                 format: float
 *                 minimum: -50
 *                 maximum: 60
 *                 example: 22.3
 *                 description: Temperatura em graus Celsius
 *               umidadeExterna:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 65.0
 *                 description: Umidade externa em porcentagem
 *               pressaoAtmosferica:
 *                 type: number
 *                 format: float
 *                 example: 1013.25
 *                 description: Pressão atmosférica em hPa
 *               velocidadeVento:
 *                 type: number
 *                 format: float
 *                 example: 12.5
 *                 description: Velocidade do vento em km/h
 *               descricaoTempo:
 *                 type: string
 *                 example: Céu parcialmente nublado
 *               riscoIntegrado:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 45.2
 *                 description: Índice de risco calculado
 *               indiceRisco:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 example: 2
 *               nivelAlerta:
 *                 type: string
 *                 enum: [VERDE, AMARELO, VERMELHO, CRÍTICO, BAIXO, MÉDIO, ALTO, MÍNIMO]
 *                 example: AMARELO
 *                 description: Nível atual de alerta
 *               recomendacao:
 *                 type: string
 *                 example: Monitoramento ativo
 *                 description: Recomendação baseada na análise
 *               confiabilidade:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *                 description: Confiabilidade da análise em porcentagem
 *               tendenciaPiora:
 *                 type: boolean
 *                 example: false
 *                 description: Se há tendência de piora
 *               statusSistema:
 *                 type: integer
 *                 example: 1
 *                 description: Status geral do sistema
 *               buzzerAtivo:
 *                 type: boolean
 *                 example: false
 *                 description: Se o buzzer está ativo
 *               modoManual:
 *                 type: boolean
 *                 example: false
 *                 description: Se está em modo manual
 *               wifiConectado:
 *                 type: boolean
 *                 example: true
 *                 description: Status da conexão WiFi
 *               blynkConectado:
 *                 type: boolean
 *                 example: true
 *                 description: Status da conexão Blynk
 *               dadosBrutos:
 *                 type: object
 *                 description: Dados brutos em formato JSON
 *     responses:
 *       201:
 *         description: Dados salvos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1234
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Dados salvos com sucesso
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/dados', SensorController.receberDados);

/**
 * @swagger
 * /sensor/status:
 *   get:
 *     tags: [Sensores]
 *     summary: Health check dos sensores
 *     description: Verifica status da API e última leitura
 *     responses:
 *       200:
 *         description: Status da API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: string
 *                       example: online
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     banco:
 *                       type: string
 *                       example: conectado
 *                     ultimaLeitura:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                 message:
 *                   type: string
 *                   example: API funcionando normalmente
 */
router.get('/status', SensorController.status);

// ========== ROTAS ADMINISTRATIVAS ==========

/**
 * @swagger
 * /sensor/ultimas:
 *   get:
 *     tags: [Sensores]
 *     summary: Buscar últimas leituras
 *     description: Retorna as últimas leituras dos sensores (requer admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Número de leituras a retornar
 *         example: 50
 *     responses:
 *       200:
 *         description: Últimas leituras dos sensores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DadosSensor'
 *                 message:
 *                   type: string
 *                   example: 50 leituras encontradas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/ultimas', SensorController.buscarUltimas);

/**
 * @swagger
 * /sensor/periodo:
 *   get:
 *     tags: [Sensores]
 *     summary: Buscar leituras por período
 *     description: Retorna leituras em um período específico com paginação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/DateStartParam'
 *       - $ref: '#/components/parameters/DateEndParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Leituras do período solicitado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/periodo', SensorController.buscarPorPeriodo);

/**
 * @swagger
 * /sensor/alertas:
 *   get:
 *     tags: [Sensores]
 *     summary: Buscar alertas críticos
 *     description: Retorna leituras com níveis de alerta críticos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Número de alertas a retornar
 *     responses:
 *       200:
 *         description: Alertas críticos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DadosSensor'
 *                 message:
 *                   type: string
 *                   example: 5 alertas encontrados
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/alertas', SensorController.buscarAlertas);

/**
 * @swagger
 * /sensor/estatisticas:
 *   get:
 *     tags: [Sensores]
 *     summary: Obter estatísticas dos sensores
 *     description: Retorna estatísticas gerais dos sensores e leituras
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos sensores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalLeituras:
 *                       type: integer
 *                       example: 15420
 *                     ultimaLeitura:
 *                       $ref: '#/components/schemas/DadosSensor'
 *                     estatisticas24h:
 *                       type: object
 *                       properties:
 *                         mediaUmidade:
 *                           type: number
 *                           format: float
 *                           example: 24.8
 *                         mediaRisco:
 *                           type: number
 *                           format: float
 *                           example: 42.3
 *                         totalLeituras:
 *                           type: integer
 *                           example: 288
 *                         alertasCriticos:
 *                           type: integer
 *                           example: 2
 *                 message:
 *                   type: string
 *                   example: Estatísticas obtidas com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/estatisticas', SensorController.obterEstatisticas);

/**
 * @swagger
 * /sensor/logs:
 *   get:
 *     tags: [Sensores]
 *     summary: Buscar logs do sistema
 *     description: Retorna logs do sistema com filtros opcionais
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *           enum: [INFO, WARNING, ERROR, CRITICAL]
 *         description: Filtrar por nível de log
 *         example: ERROR
 *       - in: query
 *         name: componente
 *         schema:
 *           type: string
 *           enum: [SENSOR, BNDMET, CONECTIVIDADE]
 *         description: Filtrar por componente
 *         example: SENSOR
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Número de logs a retornar
 *     responses:
 *       200:
 *         description: Logs do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       nivel:
 *                         type: string
 *                         enum: [INFO, WARNING, ERROR, CRITICAL]
 *                         example: INFO
 *                       componente:
 *                         type: string
 *                         example: SENSOR
 *                       mensagem:
 *                         type: string
 *                         example: Dados recebidos do ESP8266
 *                       dadosExtras:
 *                         type: object
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *                   example: 100 logs encontrados
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/logs', SensorController.buscarLogs);

export default router;