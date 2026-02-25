// backend > src > routes > sensorRoutes.ts - ATUALIZADO
import { Router } from 'express';
import { SensorController } from '../controllers/sensorController';
import { verificarAutenticacao } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DadosSensor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da leitura
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp da leitura
 *         umidadeSolo:
 *           type: number
 *           format: decimal
 *           description: Umidade do solo (%)
 *           minimum: 0
 *           maximum: 100
 *         valorAdc:
 *           type: integer
 *           description: Valor bruto do ADC
 *           minimum: 0
 *           maximum: 4095
 *         sensorOk:
 *           type: boolean
 *           description: Status do sensor
 *         fatorLocal:
 *           type: number
 *           format: decimal
 *           description: Fator de calibração local
 *         precipitacaoAtual:
 *           type: number
 *           format: decimal
 *           description: Precipitação atual (mm)
 *         precipitacao24h:
 *           type: number
 *           format: decimal
 *           description: Precipitação acumulada em 24h (mm)
 *         precipitacao7d:
 *           type: number
 *           format: decimal
 *           description: Precipitação acumulada em 7 dias (mm)
 *         precipitacao30d:
 *           type: number
 *           format: decimal
 *           description: Precipitação acumulada em 30 dias (mm)
 *         statusApiBndmet:
 *           type: string
 *           description: Status da conexão com API BNDMET
 *           maxLength: 50
 *         qualidadeDadosBndmet:
 *           type: integer
 *           description: Qualidade dos dados BNDMET (0-100)
 *           minimum: 0
 *           maximum: 100
 *         temperatura:
 *           type: number
 *           format: decimal
 *           description: Temperatura ambiente (°C)
 *         umidadeExterna:
 *           type: number
 *           format: decimal
 *           description: Umidade relativa do ar (%)
 *         pressaoAtmosferica:
 *           type: number
 *           format: decimal
 *           description: Pressão atmosférica (hPa)
 *         velocidadeVento:
 *           type: number
 *           format: decimal
 *           description: Velocidade do vento (m/s)
 *         descricaoTempo:
 *           type: string
 *           description: Descrição das condições meteorológicas
 *           maxLength: 100
 *         precipitacaoPrevisao6h:
 *           type: number
 *           format: decimal
 *           description: Previsão de precipitação para 6h (mm)
 *         precipitacaoPrevisao24h:
 *           type: number
 *           format: decimal
 *           description: Previsão de precipitação para 24h (mm)
 *         riscoIntegrado:
 *           type: number
 *           format: decimal
 *           description: Risco integrado calculado (%)
 *           minimum: 0
 *           maximum: 100
 *         indiceRisco:
 *           type: integer
 *           description: Índice de risco (0-100)
 *           minimum: 0
 *           maximum: 100
 *         nivelAlerta:
 *           type: string
 *           enum: [VERDE, AMARELO, LARANJA, VERMELHO, CRÍTICO]
 *           description: Nível de alerta do sistema
 *         recomendacao:
 *           type: string
 *           description: Recomendação baseada no risco
 *         confiabilidade:
 *           type: integer
 *           description: Confiabilidade da análise (%)
 *           minimum: 0
 *           maximum: 100
 *         statusSistema:
 *           type: integer
 *           description: Status geral do sistema
 *         buzzerAtivo:
 *           type: boolean
 *           description: Status do buzzer de alerta
 *         modoManual:
 *           type: boolean
 *           description: Sistema em modo manual
 *         wifiConectado:
 *           type: boolean
 *           description: Status da conexão WiFi
 *         dadosBrutos:
 *           type: object
 *           description: Dados brutos em formato JSON
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   responses:
 *     UnauthorizedError:
 *       description: Token de acesso requerido
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Token de acesso requerido
 *     ForbiddenError:
 *       description: Acesso negado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Acesso negado
 */

// ========== ROTAS PÚBLICAS ==========

/**
 * @swagger
 * /sensor/dados:
 *   post:
 *     tags: [Sensores]
 *     summary: Receber dados do sensor/ESP8266
 *     description: Endpoint para recebimento de dados dos sensores (público)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DadosSensor'
 *           example:
 *             umidadeSolo: 25.5
 *             valorAdc: 512
 *             sensorOk: true
 *             fatorLocal: 1.000
 *             precipitacaoAtual: 2.5
 *             precipitacao24h: 12.5
 *             precipitacao7d: 45.8
 *             precipitacao30d: 125.6
 *             statusApiBndmet: "OK"
 *             qualidadeDadosBndmet: 95
 *             temperatura: 22.5
 *             umidadeExterna: 68.0
 *             pressaoAtmosferica: 1013.2
 *             velocidadeVento: 5.2
 *             descricaoTempo: "Parcialmente nublado"
 *             precipitacaoPrevisao6h: 5.0
 *             precipitacaoPrevisao24h: 15.0
 *             riscoIntegrado: 65.0
 *             indiceRisco: 65
 *             nivelAlerta: "AMARELO"
 *             recomendacao: "Atenção necessária"
 *             confiabilidade: 88
 *             statusSistema: 1
 *             buzzerAtivo: false
 *             modoManual: false
 *             wifiConectado: true
 *     responses:
 *       200:
 *         description: Dados recebidos e processados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dados recebidos e processados com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12345
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     processadoEm:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Dados inválidos
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/dados', SensorController.receberDados);

/**
 * @swagger
 * /sensor/status:
 *   get:
 *     tags: [Sensores]
 *     summary: Status da API e sistema
 *     description: Verifica o status da API e conectividade do sistema (público)
 *     responses:
 *       200:
 *         description: Status do sistema
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
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: online
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         uptime:
 *                           type: number
 *                           example: 3600
 *                     sistema:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: online
 *                         ultimaLeitura:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         wifi:
 *                           type: boolean
 *                         bndmet:
 *                           type: string
 *                         sensor:
 *                           type: boolean
 *                     estatisticas:
 *                       type: object
 *                       properties:
 *                         totalLeituras:
 *                           type: integer
 *                         ultimaLeitura:
 *                           type: string
 *                           format: date-time
 *                         alertasCriticos24h:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: API funcionando normalmente
 */
router.get('/status', SensorController.status);

// ========== ROTAS ADMINISTRATIVAS (REQUEREM AUTENTICAÇÃO) ==========

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
router.get('/ultimas', verificarAutenticacao, SensorController.buscarUltimas);

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
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de início do período
 *         example: "2025-01-01T00:00:00Z"
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de fim do período
 *         example: "2025-01-31T23:59:59Z"
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página para paginação
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número de registros por página
 *     responses:
 *       200:
 *         description: Leituras do período especificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DadosSensor'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     pagina:
 *                       type: integer
 *                     limite:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPaginas:
 *                       type: integer
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/periodo', verificarAutenticacao, SensorController.buscarPorPeriodo);

/**
 * @swagger
 * /sensor/alertas:
 *   get:
 *     tags: [Sensores]
 *     summary: Buscar alertas do sistema
 *     description: Retorna alertas filtrados por nível. Por padrão retorna VERMELHO e AMARELO
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 50
 *         description: Número de alertas a retornar
 *       - in: query
 *         name: nivelAlerta
 *         schema:
 *           type: string
 *           enum: [VERDE, AMARELO, VERMELHO]
 *         description: Filtrar por nível específico. Se não informado, retorna VERMELHO e AMARELO
 *         example: "VERMELHO"
 *     responses:
 *       200:
 *         description: Alertas encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DadosSensor'
 *                 message:
 *                   type: string
 *             examples:
 *               sem_parametro:
 *                 summary: Sem parâmetro nivelAlerta
 *                 description: Retorna alertas VERMELHO e AMARELO
 *                 value:
 *                   success: true
 *                   data: []
 *                   message: "X alertas encontrados (VERMELHO e AMARELO)"
 *               com_parametro:
 *                 summary: Com parâmetro nivelAlerta=VERMELHO
 *                 description: Retorna apenas alertas VERMELHO
 *                 value:
 *                   success: true
 *                   data: []
 *                   message: "X alertas encontrados (VERMELHO)"
 */
router.get('/alertas', verificarAutenticacao, SensorController.buscarAlertas);

/**
 * @swagger
 * /sensor/estatisticas:
 *   get:
 *     tags: [Sensores]
 *     summary: Estatísticas detalhadas do sistema
 *     description: Retorna estatísticas completas incluindo qualidade de dados e tendências
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 720
 *           default: 24
 *         description: Período em horas para análise
 *     responses:
 *       200:
 *         description: Estatísticas calculadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     geral:
 *                       type: object
 *                     qualidadeDados:
 *                       type: object
 *                     dadosTendencia:
 *                       type: array
 *                     periodoHoras:
 *                       type: integer
 */
router.get('/estatisticas', verificarAutenticacao, SensorController.obterEstatisticas);

/**
 * @swagger
 * /sensor/qualidade:
 *   get:
 *     tags: [Sensores]
 *     summary: Análise de qualidade dos dados
 *     description: Analisa a qualidade dos dados dos sensores e BNDMET
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 168
 *           default: 24
 *         description: Período em horas para análise
 *     responses:
 *       200:
 *         description: Análise de qualidade concluída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     qualidadeMediaBndmet:
 *                       type: number
 *                     confiabilidadeMedia:
 *                       type: number
 *                     percentualSensorOk:
 *                       type: number
 *                     percentualApiBndmetOk:
 *                       type: number
 *                     totalLeituras:
 *                       type: integer
 */
router.get('/qualidade', verificarAutenticacao, SensorController.qualidadeDados);

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
 *       - in: query
 *         name: componente
 *         schema:
 *           type: string
 *         description: Filtrar por componente
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Número de logs a retornar
 *     responses:
 *       200:
 *         description: Logs encontrados
 */
router.get('/logs', verificarAutenticacao, SensorController.buscarLogs);

export default router;