import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        usuarioId: string;
        email: string;
        perfil: string;
        usuario: any;
      };
    }
  }
}

// Middleware para verificar autenticação
export const verificarAutenticacao = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido',
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    const usuario = await AuthService.validarToken(token);
    req.user = usuario;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
      timestamp: new Date().toISOString(),
    });
  }
};

// Middleware para verificar se é super admin
export const verificarSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.user.perfil !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Requer privilégios de super administrador',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

// Middleware para verificar se é admin ou super admin
export const verificarAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
      timestamp: new Date().toISOString(),
    });
  }

  if (!['admin', 'super_admin'].includes(req.user.perfil)) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Requer privilégios de administrador',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

// Middleware opcional de autenticação (não retorna erro se não autenticado)
export const autenticacaoOpcional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const usuario = await AuthService.validarToken(token);
      req.user = usuario;
    }
  } catch (error) {
    // Ignora erros de token inválido em rotas opcionais
  }
  
  next();
};