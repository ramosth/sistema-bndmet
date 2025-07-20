// src/routes/docsRoutes.ts
import { Router } from 'express';
import { DocsController } from '../controllers/docsController';

const router = Router();

/**
 * @swagger
 * /endpoints:
 *   get:
 *     tags: [Documentação]
 *     summary: Lista completa de endpoints
 *     description: Retorna documentação estruturada de todos os endpoints da API
 *     responses:
 *       200:
 *         description: Lista de todos os endpoints com detalhes
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
 *                     info:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: API Monitoramento de Barragem integrado com API do BNDMET
 *                         version:
 *                           type: string
 *                           example: 2.0.0
 *                         baseUrl:
 *                           type: string
 *                           example: http://localhost:3001/api
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         publicos:
 *                           type: array
 *                           items:
 *                             type: object
 *                         autenticados:
 *                           type: array
 *                           items:
 *                             type: object
 *                         administrativos:
 *                           type: array
 *                           items:
 *                             type: object
 *                     examples:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: Lista completa de endpoints da API Monitoramento de Barragem integrado com API do BNDMET
 */
router.get('/endpoints', DocsController.listarEndpoints);

/**
 * @swagger
 * /docs-info:
 *   get:
 *     tags: [Documentação]
 *     summary: Informações sobre documentação
 *     description: Links e informações sobre todos os formatos de documentação disponíveis
 *     responses:
 *       200:
 *         description: Informações sobre documentação disponível
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
 *                     documentation:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: Documentação API Monitoramento de Barragem integrado com API do BNDMET
 *                         available_formats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               features:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                     tools:
 *                       type: object
 *                     statistics:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: Informações sobre a documentação da API
 */
router.get('/docs-info', DocsController.informacoesDocumentacao);

/**
 * @swagger
 * /test-scripts:
 *   get:
 *     tags: [Documentação]
 *     summary: Scripts de teste
 *     description: Scripts prontos para testar a API em diferentes linguagens
 *     responses:
 *       200:
 *         description: Scripts de teste em bash, JavaScript, Python, etc.
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
 *                     title:
 *                       type: string
 *                       example: Script de Teste da API Monitoramento de Barragem integrado com API do BNDMET
 *                     bash_script:
 *                       type: string
 *                       description: Script bash completo para teste
 *                     javascript_example:
 *                       type: string
 *                       description: Exemplo de uso em JavaScript
 *                     python_example:
 *                       type: string
 *                       description: Exemplo de uso em Python
 *                     postman_collection:
 *                       type: object
 *                       description: Coleção Postman
 *                     curl_examples:
 *                       type: object
 *                       description: Exemplos com cURL
 *                 message:
 *                   type: string
 *                   example: Scripts de teste para a API
 */
router.get('/test-scripts', DocsController.scriptTeste);

export default router;