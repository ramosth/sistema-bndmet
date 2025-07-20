// Funções utilitárias
// ============= src/utils/index.js =============
// Formatação de data
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Formatação de números
export const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// Validação de email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Formatação de telefone
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Validação de telefone
export const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

// Máscara de telefone
export const phoneMask = (value) => {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{2})(\d)/, '($1) $2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  value = value.replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
  return value;
};

// Níveis de alerta com cores
export const getAlertLevel = (nivel) => {
  const levels = {
    'VERDE': { color: 'var(--green-500)', text: 'Normal' },
    'AMARELO': { color: 'var(--yellow-500)', text: 'Atenção' },
    'LARANJA': { color: 'var(--orange-500)', text: 'Alerta' },
    'VERMELHO': { color: 'var(--red-500)', text: 'Crítico' },
    'CRITICO': { color: 'var(--red-600)', text: 'Crítico' }
  };
  return levels[nivel] || { color: 'var(--gray-500)', text: 'Desconhecido' };
};

// Debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Geração de ID único
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Cópia para clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Erro ao copiar:', err);
    return false;
  }
};

// Download de arquivo
export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Função para detectar tipo de usuário
export const getUserType = (user) => {
  return user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes') ? 'basic' : 'admin';
};

// Função para obter label do perfil
export const getProfileLabel = (perfil) => {
  const labels = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador',
    'basico': 'Usuário Básico'
  };
  return labels[perfil] || 'Usuário';
};
