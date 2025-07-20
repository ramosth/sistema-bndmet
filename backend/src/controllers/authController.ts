import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export class AuthController {
  // Login
  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      const { email, senha } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const resultado = await AuthService.login(email, senha, ipAddress, userAgent);

      return sendSuccess(
        res,
        {
          token: resultado.token,
          usuario: resultado.usuario,
          expiresAt: resultado.expiresAt,
        },
        'Login realizado com sucesso'
      );
    } catch (error: any) {
      console.error('Erro no login:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 401);
    }
  }

  // Logout
  static async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await AuthService.logout(token);
      }

      return sendSuccess(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro no logout:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Verificar token (middleware endpoint)
  static async verificarToken(req: Request, res: Response) {
    try {
      return sendSuccess(
        res,
        {
          usuario: req.user?.usuario,
          valido: true,
        },
        'Token válido'
      );
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      return sendError(res, 'Token inválido', 401);
    }
  }

  // Cadastrar usuário básico (público)
  static async cadastrarUsuarioBasico(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      const dados = req.body;
      const usuario = await AuthService.criarUsuarioBasico(dados);

      return sendSuccess(
        res,
        usuario,
        'Usuário cadastrado com sucesso! Você receberá notificações em caso de alertas.',
        201
      );
    } catch (error: any) {
      console.error('Erro ao cadastrar usuário básico:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Cadastrar usuário administrador (requer super admin)
  static async cadastrarUsuarioAdmin(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      const dados = req.body;
      const usuario = await AuthService.criarUsuarioAdmin(dados);

      return sendSuccess(
        res,
        usuario,
        'Administrador cadastrado com sucesso',
        201
      );
    } catch (error: any) {
      console.error('Erro ao cadastrar usuário admin:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // ========== RESET DE SENHA ==========

  // Solicitar reset de senha (nome padronizado)
  static async solicitarResetSenha(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      const { email } = req.body;
      const resultado = await AuthService.solicitarResetSenha(email);
      
      return sendSuccess(res, 
        { 
          token: resultado.token, // Para desenvolvimento - remover em produção
          expira: resultado.expira 
        }, 
        resultado.message
      );
    } catch (error: any) {
      console.error('Erro ao solicitar reset de senha:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 500);
    }
  }

  // Validar token de reset (GET)
  static async validarTokenReset(req: Request, res: Response) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return sendError(res, 'Token é obrigatório', 400);
      }

      const resultado = await AuthService.validarTokenReset(token);
      return sendSuccess(res, resultado, 'Token válido');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  // Resetar senha com token (POST)
  static async resetarSenha(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      // Token pode vir da URL ou do body
      const token = req.params.token || req.body.token;
      const { novaSenha } = req.body;

      if (!token) {
        return sendError(res, 'Token é obrigatório', 400);
      }

      const resultado = await AuthService.resetarSenhaComToken(token, novaSenha);
      return sendSuccess(res, null, resultado.message);
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // ========== MANUTENÇÃO ==========

  // Limpar tokens expirados (rota administrativa)
  static async limparTokensExpirados(req: Request, res: Response) {
    try {
      const resultado = await AuthService.limparTokensExpirados();
      return sendSuccess(res, resultado, `${resultado.tokensLimpos} tokens expirados removidos`);
    } catch (error: any) {
      console.error('Erro ao limpar tokens:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 500);
    }
  }

  // Limpar sessões expiradas (rota administrativa)
  static async limparSessoesExpiradas(req: Request, res: Response) {
    try {
      const resultado = await AuthService.limparSessoesExpiradas();
      return sendSuccess(res, resultado, 'Sessões expiradas removidas');
    } catch (error: any) {
      console.error('Erro ao limpar sessões:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 500);
    }
  }

  // ========== GESTÃO DE USUÁRIOS ==========

  // Listar usuários básicos
  static async listarUsuariosBasicos(req: Request, res: Response) {
    try {
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 50;

      const { usuarios, total } = await AuthService.listarUsuariosBasicos(pagina, limite);

      return sendPaginated(res, usuarios, pagina, limite, total);
    } catch (error) {
      console.error('Erro ao listar usuários básicos:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Listar usuários administradores
  static async listarUsuariosAdmin(req: Request, res: Response) {
    try {
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 50;

      const { usuarios, total } = await AuthService.listarUsuariosAdmin(pagina, limite);

      return sendPaginated(res, usuarios, pagina, limite, total);
    } catch (error) {
      console.error('Erro ao listar usuários admin:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Enviar alerta em massa
  static async enviarAlertaMassa(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      const dados = req.body;
      const usuarioAdminId = req.user!.usuarioId;

      const resultado = await AuthService.enviarAlertaMassa(dados, usuarioAdminId);

      return sendSuccess(
        res,
        resultado,
        `Alerta enviado para ${resultado.totalEnviados} destinatários`
      );
    } catch (error: any) {
      console.error('Erro ao enviar alerta:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 500);
    }
  }

  // Obter estatísticas de usuários
  static async obterEstatisticasUsuarios(req: Request, res: Response) {
    try {
      const estatisticas = await AuthService.obterEstatisticasUsuarios();
      return sendSuccess(res, estatisticas, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Alterar senha (usuário logado)
  static async alterarSenha(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400);
      }

      const { senhaAtual, novaSenha } = req.body;
      const usuarioId = req.user!.usuarioId;

      await AuthService.alterarSenha(usuarioId, senhaAtual, novaSenha);

      return sendSuccess(res, null, 'Senha alterada com sucesso');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Obter perfil do usuário logado
  static async obterPerfil(req: Request, res: Response) {
    try {
      return sendSuccess(
        res,
        req.user?.usuario,
        'Perfil obtido com sucesso'
      );
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Editar usuário básico
  static async editarUsuarioBasico(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, email, telefone, receberNotificacoes, tipoNotificacao } = req.body;

      // Validações básicas
      if (!nome || nome.length < 2) {
        return sendError(res, 'Nome deve ter no mínimo 2 caracteres', 400);
      }

      if (!email || !email.includes('@')) {
        return sendError(res, 'Email inválido', 400);
      }

      const usuario = await AuthService.editarUsuarioBasico(id, {
        nome,
        email,
        telefone,
        receberNotificacoes,
        tipoNotificacao
      });

      return sendSuccess(res, usuario, 'Usuário básico atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao editar usuário básico:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Editar usuário administrador
  static async editarUsuarioAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, email, perfil } = req.body;

      // Validações básicas
      if (!nome || nome.length < 2) {
        return sendError(res, 'Nome deve ter no mínimo 2 caracteres', 400);
      }

      if (!email || !email.includes('@')) {
        return sendError(res, 'Email inválido', 400);
      }

      if (!['admin', 'super_admin'].includes(perfil)) {
        return sendError(res, 'Perfil inválido', 400);
      }

      // Não permitir que o próprio usuário altere seu perfil para um nível menor
      const usuarioLogado = req.user!;
      if (usuarioLogado.usuarioId === id && usuarioLogado.perfil === 'super_admin' && perfil === 'admin') {
        return sendError(res, 'Você não pode rebaixar seu próprio perfil', 400);
      }

      const usuario = await AuthService.editarUsuarioAdmin(id, {
        nome,
        email,
        perfil
      });

      return sendSuccess(res, usuario, 'Administrador atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao editar administrador:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Alterar status usuário básico
  static async alterarStatusUsuarioBasico(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        return sendError(res, 'Status deve ser true ou false', 400);
      }

      const usuario = await AuthService.alterarStatusUsuarioBasico(id, ativo);
      const statusText = ativo ? 'ativado' : 'desativado';

      return sendSuccess(res, usuario, `Usuário ${statusText} com sucesso`);
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Alterar status usuário administrador
  static async alterarStatusUsuarioAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        return sendError(res, 'Status deve ser true ou false', 400);
      }

      // Não permitir desativar a si mesmo
      const usuarioLogado = req.user!;
      if (usuarioLogado.usuarioId === id && !ativo) {
        return sendError(res, 'Você não pode desativar sua própria conta', 400);
      }

      const usuario = await AuthService.alterarStatusUsuarioAdmin(id, ativo, usuarioLogado.usuarioId);
      const statusText = ativo ? 'ativado' : 'desativado';

      return sendSuccess(res, usuario, `Administrador ${statusText} com sucesso`);
    } catch (error: any) {
      console.error('Erro ao alterar status do administrador:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Deletar usuário básico (deleção lógica)
  static async deletarUsuarioBasico(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const usuario = await AuthService.deletarUsuarioBasico(id);

      return sendSuccess(res, usuario, 'Usuário desativado com sucesso');
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Deletar usuário administrador (deleção lógica)
  static async deletarUsuarioAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.user!;

      // Não permitir deletar a si mesmo
      if (usuarioLogado.usuarioId === id) {
        return sendError(res, 'Você não pode desativar sua própria conta', 400);
      }

      const usuario = await AuthService.deletarUsuarioAdmin(id, usuarioLogado.usuarioId);

      return sendSuccess(res, usuario, 'Administrador desativado com sucesso');
    } catch (error: any) {
      console.error('Erro ao desativar administrador:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 400);
    }
  }

  // Listar usuários inativos
  static async listarUsuariosInativos(req: Request, res: Response) {
    try {
      const tipo = req.query.tipo as string || 'all';
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 50;

      const { usuarios, total } = await AuthService.listarUsuariosInativos(tipo, pagina, limite);

      return sendPaginated(res, usuarios, pagina, limite, total);
    } catch (error: any) {
      console.error('Erro ao listar usuários inativos:', error);
      return sendError(res, error.message || 'Erro interno do servidor', 500);
    }
  }

}