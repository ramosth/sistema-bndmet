// Formulário de usuário - Sem senha para usuários básicos
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

export default function UserForm({ user, userType, onSave, onCancel }) {
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin } = useAuth();
  
  // Detectar se é usuário básico baseado nos campos
  const isBasicUser = user ? (user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes')) : userType === 'basic';
  const isEditing = !!user;
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      senha: '',
      confirmarSenha: '',
      perfil: user?.perfil || (userType === 'admin' ? 'admin' : 'basico'),
      receberNotificacoes: user?.receberNotificacoes ?? true,
      tipoNotificacao: user?.tipoNotificacao || 'email'
    }
  });

  const senha = watch('senha');
  const receberNotificacoes = watch('receberNotificacoes');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        // EDIÇÃO
        let userData = {
          nome: data.nome,
          email: data.email
        };

        // Campos específicos por tipo de usuário
        if (isBasicUser) {
          userData = {
            ...userData,
            telefone: data.telefone,
            receberNotificacoes: data.receberNotificacoes,
            tipoNotificacao: data.tipoNotificacao
          };
          await userService.updateBasicUser(user.id, userData);
        } else {
          userData = {
            ...userData,
            perfil: data.perfil
          };
          await userService.updateAdminUser(user.id, userData);
        }
      } else {
        // CRIAÇÃO
        let userData = {
          nome: data.nome,
          email: data.email
        };

        // Campos específicos por tipo de usuário
        if (isBasicUser) {
          // USUÁRIO BÁSICO: Sem senha (será gerada automaticamente no backend)
          userData = {
            ...userData,
            telefone: data.telefone,
            receberNotificacoes: data.receberNotificacoes,
            tipoNotificacao: data.tipoNotificacao
          };
          await userService.createBasicUser(userData);
        } else {
          // ADMINISTRADOR: Com senha obrigatória
          userData = {
            ...userData,
            senha: data.senha,
            perfil: data.perfil
          };
          await userService.createAdminUser(userData);
        }
      }

      onSave();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao salvar usuário';
      toast.error(message);
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <Input
          label="Nome Completo"
          required
          {...register('nome', {
            required: 'Nome é obrigatório',
            minLength: {
              value: 2,
              message: 'Nome deve ter no mínimo 2 caracteres'
            },
            maxLength: {
              value: 100,
              message: 'Nome deve ter no máximo 100 caracteres'
            }
          })}
          error={errors.nome?.message}
        />

        <Input
          label="Email"
          type="email"
          required
          {...register('email', {
            required: 'Email é obrigatório',
            validate: value => isValidEmail(value) || 'Email inválido'
          })}
          error={errors.email?.message}
        />
      </div>

      {/* Campo Telefone - só para usuários básicos */}
      {isBasicUser && (
        <Input
          label="Telefone"
          placeholder="(11) 99999-9999"
          {...register('telefone', {
            pattern: {
              value: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
              message: 'Formato: (11) 99999-9999'
            }
          })}
          error={errors.telefone?.message}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Campos de senha - APENAS para administradores OU na edição */}
      {!isEditing && !isBasicUser && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <Input
            label="Senha"
            type="password"
            required
            {...register('senha', {
              required: 'Senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter no mínimo 6 caracteres'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Senha deve conter ao menos 1 letra minúscula, 1 maiúscula e 1 número'
              }
            })}
            error={errors.senha?.message}
          />

          <Input
            label="Confirmar Senha"
            type="password"
            required
            {...register('confirmarSenha', {
              required: 'Confirmação de senha é obrigatória',
              validate: value => value === senha || 'Senhas não coincidem'
            })}
            error={errors.confirmarSenha?.message}
          />
        </div>
      )}

      {/* Campo perfil - só para administradores */}
      {!isBasicUser && userType === 'admin' && isSuperAdmin() && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--gray-700)',
            marginBottom: '0.5rem'
          }}>
            Perfil
          </label>
          <select
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
              color: 'var(--gray-900)'
            }}
            {...register('perfil')}
          >
            <option value="admin">Administrador</option>
            <option value="super_admin">Super Administrador</option>
          </select>
        </div>
      )}

      {/* Configurações de notificação - só para usuários básicos */}
      {isBasicUser && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="receberNotificacoes"
                {...register('receberNotificacoes')}
                style={{
                  width: '1rem',
                  height: '1rem',
                  accentColor: 'var(--primary-blue)'
                }}
              />
              <label 
                htmlFor="receberNotificacoes"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}
              >
                Receber notificações
              </label>
            </div>
          </div>

          {receberNotificacoes && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Tipo de Notificação
              </label>
              <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.75rem',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.375rem',
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    id="email"
                    value="email"
                    {...register('tipoNotificacao')}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: 'var(--primary-blue)'
                    }}
                  />
                  <label 
                    htmlFor="email"
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--gray-700)',
                      cursor: 'pointer'
                    }}
                  >
                    Apenas Email
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    id="email-sms"
                    value="email,sms"
                    {...register('tipoNotificacao')}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: 'var(--primary-blue)'
                    }}
                  />
                  <label 
                    htmlFor="email-sms"
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--gray-700)',
                      cursor: 'pointer'
                    }}
                  >
                    Email + SMS
                  </label>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mensagem informativa para usuários básicos */}
      {!isEditing && isBasicUser && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#1e40af',
          marginBottom: '1.5rem'
        }}>
          <strong>💡 Informação:</strong> Usuários básicos receberão notificações automaticamente do sistema baseado nos alertas de barragem.
        </div>
      )}

      {/* Botões de ação */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'flex-end',
        marginTop: '1.5rem'
      }}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Usuário')}
        </Button>
      </div>
    </form>
  );
}