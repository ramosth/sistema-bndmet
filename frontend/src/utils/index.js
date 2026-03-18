// Funções utilitárias
// ============= src/utils/index.js =============

// ─────────────────────────────────────────────────────────────────────────────
//  FORMATAÇÃO DE DATA — timezone America/Sao_Paulo (UTC-3)
//  Ajuste #1: todos os timestamps do banco estão em UTC. toLocaleString sem
//  timezone converte para o horário da máquina, que pode ser qualquer coisa.
//  Usar sempre America/Sao_Paulo para exibição consistente.
// ─────────────────────────────────────────────────────────────────────────────

// Formato completo: DD/MM/AAAA HH:MM:SS — usado na maioria das telas
export const formatDateBR = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Alias para compatibilidade com código existente que chama formatDate
// Substitui a versão antiga sem timezone
export const formatDate = formatDateBR;

// Formato para CSV: DD/MM/AAAA HH:MM:SS — sem vírgula, evita quebra de colunas
// toLocaleString pt-BR retorna "14/03/2026, 17:39:56" — a vírgula parte a coluna no CSV
export const formatDateBRCSV = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const opts = { timeZone: 'America/Sao_Paulo' };
  const dia   = d.toLocaleDateString('pt-BR', { ...opts, day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora  = d.toLocaleTimeString('pt-BR', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${dia} ${hora}`;   // ex: "14/03/2026 17:39:56" — sem vírgula
};

// Apenas data: DD/MM/AAAA — usado em filtros e relatórios
export const formatDateOnly = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Apenas hora: HH:MM:SS — usado nos eixos de gráficos
export const formatTimeOnly = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  FORMATAÇÃO DE NÚMEROS
// ─────────────────────────────────────────────────────────────────────────────

export const formatNumber = (num) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// ─────────────────────────────────────────────────────────────────────────────
//  FORMATAÇÃO DE RISCO — Ajuste #3
//  riscoIntegrado vem do backend como decimal 0–1 (ex: 0.54 = 54%).
//  indiceRisco já vem como inteiro 0–100 e pode ser usado diretamente.
//  Usar formatRisco() sempre que exibir riscoIntegrado como percentual.
// ─────────────────────────────────────────────────────────────────────────────

// Converte riscoIntegrado (0–1) → percentual formatado (ex: "54,0")
export const formatRisco = (riscoIntegrado) => {
  const val = parseFloat(riscoIntegrado);
  if (isNaN(val)) return '0,0';
  return formatNumber(val * 100);
};

// Converte riscoIntegrado (0–1) → número percentual (ex: 54.0)
export const riscoToPercent = (riscoIntegrado) => {
  const val = parseFloat(riscoIntegrado);
  if (isNaN(val)) return 0;
  return val * 100;
};

// ─────────────────────────────────────────────────────────────────────────────
//  NÍVEIS DE ALERTA — Ajuste #2
//  Adicionado campo `label` (texto do badge curto) além de `color` e `text`.
//  AlertsContent usa alertLevel.label para o badge colorido de nível.
//  AlertsPanel usa alertLevel.text para o nome legível.
//  Removido LARANJA — o sistema só tem VERDE, AMARELO e VERMELHO (Ajuste #8).
// ─────────────────────────────────────────────────────────────────────────────

export const getAlertLevel = (nivel) => {
  const levels = {
    'VERDE': {
      color: 'var(--green-500)',
      text: 'Normal',
      label: 'VERDE',
      bgColor: 'var(--green-100)',
      textColor: 'var(--green-700)'
    },
    'AMARELO': {
      color: 'var(--yellow-500)',
      text: 'Atenção',
      label: 'AMARELO',
      bgColor: 'var(--yellow-100)',
      textColor: 'var(--yellow-700)'
    },
    'VERMELHO': {
      color: 'var(--red-500)',
      text: 'Crítico',
      label: 'VERMELHO',
      bgColor: 'var(--red-100)',
      textColor: 'var(--red-700)'
    },
    'CRITICO': {
      color: 'var(--red-600)',
      text: 'Crítico',
      label: 'CRÍTICO',
      bgColor: 'var(--red-100)',
      textColor: 'var(--red-800)'
    }
  };
  return levels[nivel] || {
    color: 'var(--gray-500)',
    text: 'Desconhecido',
    label: nivel || '—',
    bgColor: 'var(--gray-100)',
    textColor: 'var(--gray-700)'
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  VALIDAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

// ─────────────────────────────────────────────────────────────────────────────
//  FORMATAÇÃO DE TELEFONE
// ─────────────────────────────────────────────────────────────────────────────

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

export const phoneMask = (value) => {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{2})(\d)/, '($1) $2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  value = value.replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
  return value;
};

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITÁRIOS GERAIS
// ─────────────────────────────────────────────────────────────────────────────

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

export const getUserType = (user) => {
  return user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes') ? 'basic' : 'admin';
};

export const getProfileLabel = (perfil) => {
  const labels = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador',
    'basico': 'Usuário Básico'
  };
  return labels[perfil] || 'Usuário';
};