// Serviços de API
// ============= src/services/api.js =============
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });
  }
  
  return config;
});

// Interceptor para lidar com respostas de erro
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    if (error.response?.status === 401) {
      // Apenas limpar tokens, mas não redirecionar
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      // Mesmo com erro, limpar dados locais
      return { success: true };
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/perfil');
    return response.data;
  },
  
  changePassword: async (senhaAtual, novaSenha) => {
    const response = await api.put('/auth/alterar-senha', { senhaAtual, novaSenha, confirmarSenha: novaSenha });
    return response.data;
  },

  solicitarResetSenha: async (email) => {
    const response = await api.post('/auth/solicitar-reset-senha', { email });
    return response.data;
  },
 
  validarTokenReset: async (token) => {
    const response = await api.get(`/auth/validar-token-reset/${token}`);
    return response.data;
  },
 
  resetarSenha: async (token, novaSenha) => {
    const response = await api.post('/auth/resetar-senha', {
      token,
      novaSenha,
      confirmarSenha: novaSenha,
    });
    return response.data;
  }
};

// Serviços de usuários
export const userService = {
  getBasicUsers: async (params = {}) => {
    const response = await api.get('/auth/usuarios-basicos', { params });
    return response.data;
  },
  
  getAdminUsers: async (params = {}) => {
    const response = await api.get('/auth/usuarios-admin', { params });
    return response.data;
  },
  
  getUserStats: async () => {
    const response = await api.get('/auth/estatisticas-usuarios');
    return response.data;
  },
  
  createBasicUser: async (userData) => {
    // Ajustar campos para a API
    const apiData = {
      nome: userData.nome,
      email: userData.email,
      senha: userData.senha,
      telefone: userData.telefone,
      receberNotificacoes: userData.receberNotificacoes || true,
      tipoNotificacao: userData.tipoNotificacao || 'email'
    };
    
    console.log('📤 Criando usuário básico:', apiData);
    const response = await api.post('/auth/cadastro-basico', apiData);
    return response.data;
  },
  
  createAdminUser: async (userData) => {
    // Ajustar campos para a API
    const apiData = {
      nome: userData.nome,
      email: userData.email,
      senha: userData.senha,
      perfil: userData.perfil || 'admin'
    };
    
    console.log('📤 Criando administrador:', apiData);
    const response = await api.post('/auth/cadastro-admin', apiData);
    return response.data;
  },

  // Editar usuário básico
  updateBasicUser: async (userId, userData) => {
    console.log('📝 Atualizando usuário básico:', userId, userData);
    const response = await api.put(`/auth/usuarios-basicos/${userId}`, userData);
    return response.data;
  },

  // Editar usuário administrador
  updateAdminUser: async (userId, userData) => {
    console.log('📝 Atualizando administrador:', userId, userData);
    const response = await api.put(`/auth/usuarios-admin/${userId}`, userData);
    return response.data;
  },

  // Toggle status usuário básico
  toggleBasicUserStatus: async (userId, ativo) => {
    console.log('🔄 Alterando status usuário básico:', userId, ativo);
    const response = await api.patch(`/auth/usuarios-basicos/${userId}/status`, { ativo });
    return response.data;
  },

  // Toggle status usuário administrador
  toggleAdminUserStatus: async (userId, ativo) => {
    console.log('🔄 Alterando status administrador:', userId, ativo);
    const response = await api.patch(`/auth/usuarios-admin/${userId}/status`, { ativo });
    return response.data;
  },

  // Deleção lógica usuário básico
  deleteBasicUser: async (userId) => {
    console.log('🗑️ Desativando usuário básico:', userId);
    const response = await api.delete(`/auth/usuarios-basicos/${userId}`);
    return response.data;
  },

  // Deleção lógica usuário administrador
  deleteAdminUser: async (userId) => {
    console.log('🗑️ Desativando administrador:', userId);
    const response = await api.delete(`/auth/usuarios-admin/${userId}`);
    return response.data;
  },

  // Listar usuários inativos
  getInactiveUsers: async (params = {}) => {
    const response = await api.get('/auth/usuarios-inativos', { params });
    return response.data;
  }
};

// Serviços de sensores
export const sensorService = {
  getLatestReadings: async (limite = 100) => {
    const response = await api.get('/sensor/ultimas', { params: { limite } });
    return response.data;
  },
  
  getReadingsByPeriod: async (dataInicio, dataFim, pagina = 1, limite = 50) => {
    const response = await api.get('/sensor/periodo', {
      params: { dataInicio, dataFim, pagina, limite }
    });
    return response.data;
  },
  
  getAlerts: async (limite = 50) => {
    const response = await api.get('/sensor/alertas', { params: { limite } });
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await api.get('/sensor/estatisticas');
    return response.data;
  },
  
  getLogs: async (nivel, componente, limite = 100) => {
    const params = { limite };
    if (nivel) params.nivel = nivel;
    if (componente) params.componente = componente;
    
    const response = await api.get('/sensor/logs', { params });
    return response.data;
  },
  
  sendData: async (sensorData) => {
    const response = await api.post('/sensor/dados', sensorData);
    return response.data;
  },

  // Status do sistema — retorna { sistema: { status: 'online'/'offline', ... } }
  // Usado pelo hook useRealTimeData para alimentar o SystemStatus do Dashboard
  getStatus: async () => {
    const response = await api.get('/sensor/status');
    return response.data;
  },

  getQualidade: async (periodo = 24) => {
    const response = await api.get('/sensor/qualidade', { params: { periodo } });
    return response.data;
  },

  getEstatisticasRuptura: async (periodo = 168) => {
    const response = await api.get('/sensor/ruptura', { params: { periodo } });
    return response.data;
  }
};

// Serviços de alertas
export const alertService = {
  enviarAlertaMassa: async (alertData) => {
    console.log('📢 Enviando alerta em massa:', alertData);
    const response = await api.post('/auth/enviar-alerta', alertData);
    return response.data;
  },

  // Buscar log de alertas enviados via Central de Alertas
  getLogsAlertas: async (pagina = 1, limite = 20) => {
    const response = await api.get('/auth/logs-alertas', { params: { pagina, limite } });
    return response.data;
  }
};

// Serviços do sistema
export const systemService = {
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
  
};

// Utilitários de API
export const apiUtils = {
  // Função para tratar erros de forma consistente
  handleError: (error, defaultMessage = 'Erro na operação') => {
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.message || 
                   defaultMessage;
    
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message
    });
    
    return message;
  },
  
  // Função para verificar se o usuário está autenticado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  // Função para obter o token atual
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Função para obter dados do usuário
  getUser: () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
};

export default api;