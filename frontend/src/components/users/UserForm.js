// Formulário de usuário — Máscara automática no campo telefone
// ============= src/components/users/UserForm.js =============
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { userService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { isValidEmail } from '@/utils';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers de máscara
// ─────────────────────────────────────────────────────────────────────────────

// Aplica máscara (XX) XXXXX-XXXX em tempo real enquanto o usuário digita
const maskTelefone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2)  return `(${digits}`;
  if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
};

const validaTelefone = (value) => {
  if (!value) return true; // opcional
  return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(value) || 'Formato inválido. Use: (XX) XXXXX-XXXX';
};

// ─────────────────────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────────────────────
export default function UserForm({ user, userType, onSave, onCancel }) {
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin } = useAuth();

  const isBasicUser = user
    ? (user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes'))
    : userType === 'basic';
  const isEditing = !!user;

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      nome:                user?.nome || '',
      email:               user?.email || '',
      telefone:            user?.telefone ? maskTelefone(user.telefone) : '',
      senha:               '',
      confirmarSenha:      '',
      perfil:              user?.perfil || (userType === 'admin' ? 'admin' : 'basico'),
      receberNotificacoes: user?.receberNotificacoes ?? true,
      tipoNotificacao:     user?.tipoNotificacao || 'email',
    },
  });

  const senha               = watch('senha');
  const receberNotificacoes = watch('receberNotificacoes');

  // Aplica a máscara em tempo real sem quebrar o cursor
  const handleTelefoneChange = (e) => {
    const masked = maskTelefone(e.target.value);
    setValue('telefone', masked, { shouldValidate: false });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        let userData = { nome: data.nome, email: data.email };
        if (isBasicUser) {
          userData = { ...userData, telefone: data.telefone, receberNotificacoes: data.receberNotificacoes, tipoNotificacao: data.tipoNotificacao };
          await userService.updateBasicUser(user.id, userData);
        } else {
          userData = { ...userData, perfil: data.perfil };
          await userService.updateAdminUser(user.id, userData);
        }
      } else {
        let userData = { nome: data.nome, email: data.email };
        if (isBasicUser) {
          userData = { ...userData, telefone: data.telefone, receberNotificacoes: data.receberNotificacoes, tipoNotificacao: data.tipoNotificacao };
          await userService.createBasicUser(userData);
        } else {
          userData = { ...userData, senha: data.senha, perfil: data.perfil };
          await userService.createAdminUser(userData);
        }
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário');
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      {/* Nome + Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Input
          label="Nome Completo"
          required
          {...register('nome', {
            required: 'Nome é obrigatório',
            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          })}
          error={errors.nome?.message}
        />
        <Input
          label="Email"
          type="email"
          required
          {...register('email', {
            required: 'Email é obrigatório',
            validate: value => isValidEmail(value) || 'Email inválido',
          })}
          error={errors.email?.message}
        />
      </div>

      {/* Telefone com máscara — só para usuários básicos */}
      {isBasicUser && (
        <div style={{ marginBottom: '1rem' }}>
          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            {...register('telefone', { validate: validaTelefone })}
            onChange={handleTelefoneChange}
            error={errors.telefone?.message}
          />
        </div>
      )}

      {/* Senha — só na criação de administradores */}
      {!isEditing && !isBasicUser && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <Input
            label="Senha"
            type="password"
            required
            {...register('senha', {
              required: 'Senha é obrigatória',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Deve conter ao menos 1 minúscula, 1 maiúscula e 1 número',
              },
            })}
            error={errors.senha?.message}
          />
          <Input
            label="Confirmar Senha"
            type="password"
            required
            {...register('confirmarSenha', {
              required: 'Confirmação obrigatória',
              validate: value => value === senha || 'Senhas não coincidem',
            })}
            error={errors.confirmarSenha?.message}
          />
        </div>
      )}

      {/* Perfil — só super_admin editando admins */}
      {!isBasicUser && userType === 'admin' && isSuperAdmin() && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
            Perfil
          </label>
          <select
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gray-300)', borderRadius: '0.375rem', fontSize: '0.875rem', backgroundColor: 'white', color: 'var(--gray-900)' }}
            {...register('perfil')}
          >
            <option value="admin">Administrador</option>
            <option value="super_admin">Super Administrador</option>
          </select>
        </div>
      )}

      {/* Notificações — só para usuários básicos */}
      {isBasicUser && (
        <>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="receberNotificacoes"
                {...register('receberNotificacoes')}
                style={{ width: '1rem', height: '1rem', accentColor: 'var(--primary-blue)' }}
              />
              <label htmlFor="receberNotificacoes" style={{ fontSize: '0.875rem', color: 'var(--gray-700)', cursor: 'pointer' }}>
                Receber notificações
              </label>
            </div>
          </div>

          {receberNotificacoes && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                Tipo de Notificação
              </label>
              <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', border: '1px solid var(--gray-200)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)', cursor: 'pointer' }}>
                  <input type="radio" value="email" {...register('tipoNotificacao')} style={{ accentColor: 'var(--primary-blue)' }} />
                  Apenas Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-700)', cursor: 'pointer' }}>
                  <input type="radio" value="email,sms" {...register('tipoNotificacao')} style={{ accentColor: 'var(--primary-blue)' }} />
                  Email + SMS
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info para novos usuários básicos */}
      {!isEditing && isBasicUser && (
        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#1e40af', marginBottom: '1.5rem' }}>
          <strong>💡 Informação:</strong> Usuários básicos receberão notificações automaticamente do sistema baseado nos alertas de barragem.
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={loading} disabled={loading}>
          {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  );
}