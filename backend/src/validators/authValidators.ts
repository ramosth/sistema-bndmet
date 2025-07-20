import { body, param } from 'express-validator';

export const validarLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
];

export const validarCadastroUsuarioBasico = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),

  body('email')
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),

  body('telefone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve ter um formato válido brasileiro'),

  body('receberNotificacoes')
    .optional()
    .isBoolean()
    .withMessage('receberNotificacoes deve ser verdadeiro ou falso'),

  body('tipoNotificacao')
    .optional()
    .isIn(['email', 'sms', 'email,sms'])
    .withMessage('tipoNotificacao deve ser email, sms ou email,sms'),
];

export const validarCadastroUsuarioAdmin = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),

  body('email')
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),

  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),

  body('perfil')
    .optional()
    .isIn(['admin', 'super_admin'])
    .withMessage('Perfil deve ser admin ou super_admin'),
];

export const validarAlterarSenha = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),

  body('novaSenha')
    .notEmpty()
    .withMessage('Nova senha é obrigatória')
    .isLength({ min: 8 })
    .withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),

  body('confirmarSenha')
    .notEmpty()
    .withMessage('Confirmação de senha é obrigatória')
    .custom((value, { req }) => {
      if (value !== req.body.novaSenha) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
];

// ========== VALIDADORES PARA RESET DE SENHA ==========

export const validarSolicitarResetSenha = [
  body('email')
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
];

export const validarResetSenha = [
  // Token pode vir da URL (param) ou do body
  body('token')
    .optional()
    .isLength({ min: 64, max: 64 })
    .withMessage('Token deve ter 64 caracteres'),

  body('novaSenha')
    .notEmpty()
    .withMessage('Nova senha é obrigatória')
    .isLength({ min: 8 })
    .withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),

  body('confirmarSenha')
    .optional() // Nem sempre é obrigatório
    .custom((value, { req }) => {
      if (value && value !== req.body.novaSenha) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    }),
];

export const validarEnviarAlerta = [
  body('titulo')
    .notEmpty()
    .withMessage('Título é obrigatório')
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres')
    .trim(),

  body('mensagem')
    .notEmpty()
    .withMessage('Mensagem é obrigatória')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Mensagem deve ter entre 10 e 1000 caracteres')
    .trim(),

  body('nivelCriticidade')
    .notEmpty()
    .withMessage('Nível de criticidade é obrigatório')
    .isIn(['baixo', 'medio', 'alto', 'critico'])
    .withMessage('Nível de criticidade deve ser: baixo, medio, alto ou critico'),

  body('tipoDestinatario')
    .notEmpty()
    .withMessage('Tipo de destinatário é obrigatório')
    .isIn(['basicos', 'admins', 'todos'])
    .withMessage('Tipo de destinatário deve ser: basicos, admins ou todos'),

  body('canaisEnvio')
    .isArray({ min: 1 })
    .withMessage('Pelo menos um canal de envio deve ser selecionado')
    .custom((value) => {
      const canaisValidos = ['email', 'sms', 'push'];
      const todosValidos = value.every((canal: string) => canaisValidos.includes(canal));
      if (!todosValidos) {
        throw new Error('Canais de envio devem ser: email, sms ou push');
      }
      return true;
    }),

  body('destinatariosIds')
    .optional()
    .isArray()
    .withMessage('destinatariosIds deve ser uma lista de IDs'),
];