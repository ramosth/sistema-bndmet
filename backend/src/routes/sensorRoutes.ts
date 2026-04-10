// backend > src > routes > sensorRoutes.ts
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
 *
 *         # ── Sensor local ──────────────────────────────────────
 *         umidadeSolo:
 *           type: number
 *           format: decimal
 *           description: Umidade do solo (%)
 *           minimum: 0
 *           maximum: 100
 *         valorAdc:
 *           type: integer
 *           description: Valor bruto do ADC (0–1023)
 *           minimum: 0
 *           maximum: 1023
 *         sensorOk:
 *           type: boolean
 *           description: Status do sensor (true = operacional)
 *         fatorLocal:
 *           type: number
 *           format: decimal
 *           description: Fator_lençol normalizado [0–1] (Equação 3 TCC)
 *
 *         # ── BNDMET ────────────────────────────────────────────
 *         precipitacaoAtual:
 *           type: number
 *           format: decimal
 *           description: Precipitação horária mais recente via I175 (mm)
 *         precipitacao24h:
 *           type: number
 *           format: decimal
 *           description: Precipitação acumulada 24h via I006 (mm)
 *         precipitacao7d:
 *           type: number
 *           format: decimal
 *           description: Precipitação acumulada 7 dias via I006 (mm)
 *         precipitacao30d:
 *           type: number
 *           format: decimal
 *           description: Precipitação acumulada 30 dias via I006 (mm)
 *         statusApiBndmet:
 *           type: string
 *           description: Status da conexão com a API BNDMET ("OK" | "FALHA")
 *           maxLength: 50
 *         qualidadeDadosBndmet:
 *           type: integer
 *           description: Percentual de medições válidas retornadas pela API BNDMET (%)
 *           minimum: 0
 *           maximum: 100
 *         estacao:
 *           type: string
 *           description: Código da estação meteorológica consultada (ex. "D6594")
 *           maxLength: 20
 *
 *         # ── Meteorologia OWM ──────────────────────────────────
 *         temperatura:
 *           type: number
 *           format: decimal
 *           description: Temperatura do ar (°C)
 *         umidadeExterna:
 *           type: number
 *           format: decimal
 *           description: Umidade relativa do ar (%)
 *         pressaoAtmosferica:
 *           type: number
 *           format: decimal
 *           description: Pressão atmosférica ao nível do solo (hPa) — campo grnd_level OWM
 *         velocidadeVento:
 *           type: number
 *           format: decimal
 *           description: Velocidade do vento (m/s)
 *         descricaoTempo:
 *           type: string
 *           description: Descrição das condições meteorológicas atuais
 *           maxLength: 100
 *         chuvaAtualOWM:
 *           type: number
 *           format: decimal
 *           description: Precipitação na última hora via OWM rain.1h (mm/h) — ausente quando não chove
 *
 *         # ── Previsão OWM /forecast ────────────────────────────
 *         chuvaFutura24h:
 *           type: number
 *           format: decimal
 *           description: Precipitação total prevista nas próximas 24h — soma rain.3h dos 8 blocos OWM (mm)
 *         intensidadePrevisao:
 *           type: string
 *           description: Classe de intensidade pluviométrica (Tabela AlertaRio / TCC)
 *           enum: [Fraca, Moderada, Forte, Muito Forte, Pancada de Chuva]
 *           maxLength: 30
 *         fatorIntensidade:
 *           type: number
 *           format: decimal
 *           description: Fator discreto correspondente à classe de intensidade — 0,00 / 0,25 / 0,50 / 0,75 / 1,00
 *
 *         # ── Análise de risco ──────────────────────────────────
 *         riscoIntegrado:
 *           type: number
 *           format: decimal
 *           description: Fator de risco integrado calculado pela Equação 5 TCC [0–1]
 *           minimum: 0
 *           maximum: 1
 *         indiceRisco:
 *           type: integer
 *           description: Índice de risco em percentual inteiro [0–100]
 *           minimum: 0
 *           maximum: 100
 *         nivelAlerta:
 *           type: string
 *           enum: [VERDE, AMARELO, VERMELHO]
 *           description: Nível de alerta do sistema
 *         recomendacao:
 *           type: string
 *           description: Mensagem de recomendação operacional gerada em função do risco
 *         confiabilidade:
 *           type: integer
 *           description: Confiabilidade da análise (%) — reduzida por falhas de sensor ou API
 *           minimum: 0
 *           maximum: 100
 *         amplificado:
 *           type: boolean
 *           description: Indica se o coeficiente de amplificação (×1,20) foi aplicado neste ciclo
 *         taxaVariacaoUmidade:
 *           type: number
 *           format: decimal
 *           description: Taxa de variação da umidade do solo calculada no buffer circular (%/leitura)
 *
 *         # ── Componentes da Equação 5 TCC ─────────────────────
 *         vLencol:
 *           type: number
 *           format: decimal
 *           description: Componente V_lençol da equação de risco (peso 0,40)
 *         vChuvaAtual:
 *           type: number
 *           format: decimal
 *           description: Componente V_ch.24h da equação de risco (peso 0,08)
 *         vChuvaHistorica:
 *           type: number
 *           format: decimal
 *           description: Componente V_ch.7d da equação de risco (peso 0,12)
 *         vChuvaMensal:
 *           type: number
 *           format: decimal
 *           description: Componente V_ch.30d da equação de risco (peso 0,10)
 *         vChuvaFutura:
 *           type: number
 *           format: decimal
 *           description: Componente V_ch.fut da equação de risco (peso 0,15)
 *         vTaxaVariacao:
 *           type: number
 *           format: decimal
 *           description: Componente V_taxa da equação de risco (peso 0,10)
 *         vPressao:
 *           type: number
 *           format: decimal
 *           description: Componente V_pressão da equação de risco (peso 0,05)
 *
 *         # ── Status do sistema ─────────────────────────────────
 *         statusSistema:
 *           type: integer
 *           description: Status geral do sistema (código interno)
 *         buzzerAtivo:
 *           type: boolean
 *           description: Indica se o buzzer de alerta está ativo
 *         modoManual:
 *           type: boolean
 *           description: Indica se o sistema está em modo manual
 *         wifiConectado:
 *           type: boolean
 *           description: Indica se o ESP8266 está conectado ao Wi-Fi
 *         dadosBrutos:
 *           type: object
 *           description: Dados de diagnóstico (uptime ms, freeHeap bytes, rssi dBm, tentativasEnvio)
 *
 *         # ── Metadados ─────────────────────────────────────────
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
 *     summary: Receber dados do ESP8266
 *     description: Endpoint para recebimento de dados dos sensores (público — sem autenticação)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DadosSensor'
 *           example:
 *             umidadeSolo: 18.5
 *             valorAdc: 720
 *             sensorOk: true
 *             fatorLocal: 0.740
 *             precipitacaoAtual: 1.2
 *             precipitacao24h: 22.5
 *             precipitacao7d: 87.3
 *             precipitacao30d: 210.0
 *             statusApiBndmet: "OK"
 *             qualidadeDadosBndmet: 96
 *             estacao: "D6594"
 *             temperatura: 23.1
 *             umidadeExterna: 74.0
 *             pressaoAtmosferica: 1011.4
 *             velocidadeVento: 3.8
 *             descricaoTempo: "chuva fraca"
 *             chuvaAtualOWM: 0.8
 *             chuvaFutura24h: 18.0
 *             intensidadePrevisao: "Moderada"
 *             fatorIntensidade: 0.25
 *             riscoIntegrado: 0.62
 *             indiceRisco: 62
 *             nivelAlerta: "AMARELO"
 *             recomendacao: "Atenção — monitorar com frequência elevada"
 *             confiabilidade: 91
 *             amplificado: false
 *             taxaVariacaoUmidade: 0.320
 *             vLencol: 0.2960
 *             vChuvaAtual: 0.0360
 *             vChuvaHistorica: 0.0698
 *             vChuvaMensal: 0.0700
 *             vChuvaFutura: 0.0375
 *             vTaxaVariacao: 0.0320
 *             vPressao: 0.0000
 *             statusSistema: 1
 *             buzzerAtivo: false
 *             modoManual: false
 *             wifiConectado: true
 *             dadosBrutos:
 *               uptime: 3600000
 *               freeHeap: 28432
 *               rssi: -67
 *               tentativasEnvio: 1
 *     responses:
 *       201:
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
 *     description: Verifica o status da API e conectividade do sistema (público — sem autenticação)
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
 *                         minutosUltimaLeitura:
 *                           type: integer
 *                         wifi:
 *                           type: boolean
 *                         bndmet:
 *                           type: string
 *                         sensor:
 *                           type: boolean
 *                         qualidadeBndmet:
 *                           type: integer
 *                         estacao:
 *                           type: string
 *                           example: "D6594"
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
 *                         statusBndmet:
 *                           type: array
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
 *     description: Retorna as últimas leituras dos sensores (requer autenticação)
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
 *     description: Retorna leituras em um período específico com paginação (fuso America/Sao_Paulo)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de início do período (ISO 8601)
 *         example: "2026-01-01T00:00:00Z"
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de fim do período (ISO 8601)
 *         example: "2026-01-31T23:59:59Z"
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
 *                 value:
 *                   success: true
 *                   data: []
 *                   message: "X alertas encontrados (VERMELHO e AMARELO)"
 *               com_parametro:
 *                 summary: Com parâmetro nivelAlerta=VERMELHO
 *                 value:
 *                   success: true
 *                   data: []
 *                   message: "X alertas encontrados (VERMELHO)"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/logs', verificarAutenticacao, SensorController.buscarLogs);

export default router;