// Tipos para autenticação e usuários

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'super_admin';
  ativo: boolean;
  ultimoLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioBasico {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  ativo: boolean;
  receberNotificacoes: boolean;
  tipoNotificacao: string;
  ultimoAlertaEnviado?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  usuario?: UsuarioAdmin;
  message?: string;
  expiresAt?: string;
}

export interface CadastroUsuarioBasicoRequest {
  nome: string;
  email: string;
  telefone?: string;
  receberNotificacoes?: boolean;
  tipoNotificacao?: string;
}

export interface CadastroUsuarioAdminRequest {
  nome: string;
  email: string;
  senha: string;
  perfil?: 'admin' | 'super_admin';
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

export interface SolicitarResetRequest {
  email: string;
}

export interface ResetSenhaRequest {
  token: string;
  novaSenha: string;
  confirmarSenha: string;
}

export interface ResetSenhaResponse {
  message: string;
  token?: string;
  expira?: string;
}

export interface EnviarAlertaRequest {
  titulo: string;
  mensagem: string;
  nivelCriticidade: 'baixo' | 'medio' | 'alto' | 'critico';
  tipoDestinatario: 'basicos' | 'admins' | 'todos';
  destinatariosIds?: string[];
  canaisEnvio: string[]; // ['email', 'sms', 'push']
}

export interface LogAlerta {
  id: string;
  usuarioAdminId?: string;
  tipoDestinatario: string;
  destinatariosIds?: string[];
  tipoAlerta: string;
  nivelCriticidade: string;
  titulo: string;
  mensagem: string;
  canaisEnvio: string;
  totalEnviados: number;
  totalSucesso: number;
  totalFalhas: number;
  detalhesEnvio?: any;
  createdAt: string;
}

export interface SessaoUsuario {
  id: string;
  usuarioId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  ativo: boolean;
  createdAt: string;
}

export interface AuthContextType {
  usuario: UsuarioAdmin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface EstatisticasUsuarios {
  totalAdminsAtivos: number;
  totalAdminsInativos: number;
  totalBasicosAtivos: number;
  totalBasicosInativos: number;
  totalComNotificacoes: number;
  alertasUltimos30Dias: number;
}

// Tipos para API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthError {
  message: string;
  code?: string;
  statusCode?: number;
}