import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { 
  verificarAutenticacao, 
  verificarAdmin, 
  verificarSuperAdmin 
} from '../middleware/authMiddleware';
import {
  validarLogin,
  validarCadastroUsuarioBasico,
  validarCadastroUsuarioAdmin,
  validarAlterarSenha,
  validarEnviarAlerta,
  validarSolicitarResetSenha,
  validarResetSenha,
} from '../validators/authValidators';

const router = Router();

// ========== ROTAS PÚBLICAS ==========

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Fazer login administrativo
 *     description: Autentica um usuário administrador e retorna token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@bndmet.com
 *                 description: Email do administrador
 *               senha:
 *                 type: string
 *                 minLength: 6
 *                 example: admin123
 *                 description: Senha do administrador
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/login', validarLogin, AuthController.login);

/**
 * @swagger
 * /auth/cadastro-basico:
 *   post:
 *     tags: [Autenticação]
 *     summary: Cadastrar usuário básico
 *     description: Cadastra um usuário básico para receber notificações
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@email.com
 *               telefone:
 *                 type: string
 *                 example: (11) 99999-0001
 *                 description: Telefone no formato brasileiro
 *               receberNotificacoes:
 *                 type: boolean
 *                 default: true
 *               tipoNotificacao:
 *                 type: string
 *                 enum: [email, sms, email,sms]
 *                 default: email
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UsuarioBasico'
 *                 message:
 *                   type: string
 *                   example: Usuário cadastrado com sucesso!
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/cadastro-basico', validarCadastroUsuarioBasico, AuthController.cadastrarUsuarioBasico);

/**
 * @swagger
 * /auth/solicitar-reset-senha:
 *   post:
 *     tags: [Autenticação]
 *     summary: Solicitar reset de senha
 *     description: Gera token para reset de senha (válido por 2 horas)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@bndmet.com
 *     responses:
 *       200:
 *         description: Token de reset gerado com sucesso
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
 *                     token:
 *                       type: string
 *                       example: a1b2c3d4e5f6789012345678901234567890123456789012345678901234
 *                     expira:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Token de reset gerado com sucesso
 */
router.post('/solicitar-reset-senha', validarSolicitarResetSenha, AuthController.solicitarResetSenha);

/**
 * @swagger
 * /auth/validar-token-reset/{token}:
 *   get:
 *     tags: [Autenticação]
 *     summary: Validar token de reset
 *     description: Verifica se token de reset é válido
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 64
 *           maxLength: 64
 *         description: Token de reset de 64 caracteres
 *         example: a1b2c3d4e5f6789012345678901234567890123456789012345678901234
 *     responses:
 *       200:
 *         description: Token válido
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
 *                     valido:
 *                       type: boolean
 *                       example: true
 *                     usuarioId:
 *                       type: string
 *                       format: uuid
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.get('/validar-token-reset/:token', AuthController.validarTokenReset);

/**
 * @swagger
 * /auth/resetar-senha:
 *   post:
 *     tags: [Autenticação]
 *     summary: Resetar senha
 *     description: Altera senha usando token de reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - novaSenha
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 64
 *                 maxLength: 64
 *                 example: a1b2c3d4e5f6789012345678901234567890123456789012345678901234
 *               novaSenha:
 *                 type: string
 *                 minLength: 8
 *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
 *                 example: NovaSenh@123
 *                 description: Deve conter maiúscula, minúscula e número
 *               confirmarSenha:
 *                 type: string
 *                 example: NovaSenh@123
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.post('/resetar-senha', validarResetSenha, AuthController.resetarSenha);

// ========== ROTAS AUTENTICADAS ==========

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Autenticação]
 *     summary: Fazer logout
 *     description: Invalida o token JWT atual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.use(verificarAutenticacao);
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /auth/verificar-token:
 *   get:
 *     tags: [Autenticação]
 *     summary: Verificar token JWT
 *     description: Valida se token ainda é válido
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
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
 *                     usuario:
 *                       $ref: '#/components/schemas/UsuarioAdmin'
 *                     valido:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/verificar-token', AuthController.verificarToken);

/**
 * @swagger
 * /auth/perfil:
 *   get:
 *     tags: [Autenticação]
 *     summary: Obter perfil do usuário
 *     description: Retorna dados do usuário logado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UsuarioAdmin'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/perfil', AuthController.obterPerfil);

/**
 * @swagger
 * /auth/alterar-senha:
 *   put:
 *     tags: [Autenticação]
 *     summary: Alterar senha
 *     description: Altera senha do usuário logado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senhaAtual
 *               - novaSenha
 *               - confirmarSenha
 *             properties:
 *               senhaAtual:
 *                 type: string
 *                 example: senhaAtual123
 *               novaSenha:
 *                 type: string
 *                 minLength: 8
 *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
 *                 example: NovaSenh@123
 *               confirmarSenha:
 *                 type: string
 *                 example: NovaSenh@123
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/alterar-senha', validarAlterarSenha, AuthController.alterarSenha);

// ========== ROTAS ADMINISTRATIVAS ==========
router.use(verificarAdmin);

/**
 * @swagger
 * /auth/usuarios-basicos:
 *   get:
 *     tags: [Autenticação]
 *     summary: Listar usuários básicos
 *     description: Lista usuários básicos com paginação (requer admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Lista de usuários básicos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/usuarios-basicos', AuthController.listarUsuariosBasicos);

/**
 * @swagger
 * /auth/usuarios-admin:
 *   get:
 *     tags: [Autenticação]
 *     summary: Listar administradores
 *     description: Lista usuários administradores com paginação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Lista de administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/usuarios-admin', AuthController.listarUsuariosAdmin);

/**
 * @swagger
 * /auth/estatisticas-usuarios:
 *   get:
 *     tags: [Autenticação]
 *     summary: Obter estatísticas
 *     description: Estatísticas gerais de usuários e alertas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Estatisticas'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/estatisticas-usuarios', AuthController.obterEstatisticasUsuarios);

/**
 * @swagger
 * /auth/enviar-alerta:
 *   post:
 *     tags: [Autenticação]
 *     summary: Enviar alerta em massa
 *     description: Envia notificações para usuários selecionados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - mensagem
 *               - nivelCriticidade
 *               - tipoDestinatario
 *               - canaisEnvio
 *             properties:
 *               titulo:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: Alerta de Segurança
 *               mensagem:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: Detectado risco alto na barragem
 *               nivelCriticidade:
 *                 type: string
 *                 enum: [baixo, medio, alto, critico]
 *                 example: alto
 *               tipoDestinatario:
 *                 type: string
 *                 enum: [basicos, admins, todos]
 *                 example: todos
 *               destinatariosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: IDs específicos (opcional)
 *               canaisEnvio:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms, push]
 *                 example: [email, sms]
 *                 minItems: 1
 *     responses:
 *       200:
 *         description: Alerta enviado com sucesso
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
 *                     logId:
 *                       type: string
 *                       format: uuid
 *                     totalEnviados:
 *                       type: integer
 *                       example: 25
 *                     totalSucesso:
 *                       type: integer
 *                       example: 24
 *                     totalFalhas:
 *                       type: integer
 *                       example: 1
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/enviar-alerta', validarEnviarAlerta, AuthController.enviarAlertaMassa);

/**
 * @swagger
 * /auth/limpar-tokens-expirados:
 *   post:
 *     tags: [Autenticação]
 *     summary: Limpar tokens expirados
 *     description: Remove tokens de reset expirados (manutenção)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens removidos com sucesso
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
 *                     tokensLimpos:
 *                       type: integer
 *                       example: 5
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/limpar-tokens-expirados', AuthController.limparTokensExpirados);

/**
 * @swagger
 * /auth/limpar-sessoes-expiradas:
 *   post:
 *     tags: [Autenticação]
 *     summary: Limpar sessões expiradas
 *     description: Remove sessões de login expiradas (manutenção)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessões removidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/limpar-sessoes-expiradas', AuthController.limparSessoesExpiradas);

// ========== ROTAS SUPER ADMIN ==========

/**
 * @swagger
 * /auth/cadastro-admin:
 *   post:
 *     tags: [Autenticação]
 *     summary: Cadastrar administrador
 *     description: Cadastra novo usuário administrador (requer super admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Maria Admin
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@bndmet.com
 *               senha:
 *                 type: string
 *                 minLength: 8
 *                 pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)
 *                 example: SenhaFort@123
 *               perfil:
 *                 type: string
 *                 enum: [admin, super_admin]
 *                 default: admin
 *                 example: admin
 *     responses:
 *       201:
 *         description: Administrador cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UsuarioAdmin'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/cadastro-admin', verificarSuperAdmin, validarCadastroUsuarioAdmin, AuthController.cadastrarUsuarioAdmin);

/**
 * @swagger
 * /auth/usuarios-basicos/{id}:
 *   put:
 *     tags: [Autenticação]
 *     summary: Editar usuário básico
 *     description: Atualiza dados de um usuário básico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               telefone:
 *                 type: string
 *               receberNotificacoes:
 *                 type: boolean
 *               tipoNotificacao:
 *                 type: string
 *                 enum: [email, sms, email,sms]
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/usuarios-basicos/:id', AuthController.editarUsuarioBasico);

/**
 * @swagger
 * /auth/usuarios-admin/{id}:
 *   put:
 *     tags: [Autenticação]
 *     summary: Editar administrador
 *     description: Atualiza dados de um administrador (requer super admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - perfil
 *             properties:
 *               nome:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               perfil:
 *                 type: string
 *                 enum: [admin, super_admin]
 *     responses:
 *       200:
 *         description: Administrador atualizado com sucesso
 *       404:
 *         description: Administrador não encontrado
 */
router.put('/usuarios-admin/:id', verificarSuperAdmin, AuthController.editarUsuarioAdmin);

/**
 * @swagger
 * /auth/usuarios-basicos/{id}/status:
 *   patch:
 *     tags: [Autenticação]
 *     summary: Alterar status de usuário básico
 *     description: Ativa ou desativa um usuário básico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ativo
 *             properties:
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 */
router.patch('/usuarios-basicos/:id/status', AuthController.alterarStatusUsuarioBasico);

/**
 * @swagger
 * /auth/usuarios-admin/{id}/status:
 *   patch:
 *     tags: [Autenticação]
 *     summary: Alterar status de administrador
 *     description: Ativa ou desativa um administrador (requer super admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ativo
 *             properties:
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status alterado com sucesso
 */
router.patch('/usuarios-admin/:id/status', verificarSuperAdmin, AuthController.alterarStatusUsuarioAdmin);

/**
 * @swagger
 * /auth/usuarios-basicos/{id}:
 *   delete:
 *     tags: [Autenticação]
 *     summary: Desativar usuário básico
 *     description: Desativa um usuário básico (deleção lógica)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuário desativado com sucesso
 */
router.delete('/usuarios-basicos/:id', AuthController.deletarUsuarioBasico);

/**
 * @swagger
 * /auth/usuarios-admin/{id}:
 *   delete:
 *     tags: [Autenticação]
 *     summary: Desativar administrador
 *     description: Desativa um administrador (deleção lógica, requer super admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Administrador desativado com sucesso
 */
router.delete('/usuarios-admin/:id', verificarSuperAdmin, AuthController.deletarUsuarioAdmin);

/**
 * @swagger
 * /auth/usuarios-inativos:
 *   get:
 *     tags: [Autenticação]
 *     summary: Listar usuários inativos
 *     description: Lista todos os usuários desativados do sistema
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [all, basicos, admins]
 *           default: all
 *         description: Filtrar por tipo de usuário
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Lista de usuários inativos
 */
router.get('/usuarios-inativos', AuthController.listarUsuariosInativos);


export default router;