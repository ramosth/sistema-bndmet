// Configurações
// ============= src/components/settings/SettingsContent.js =============
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService, systemService } from '@/services/api';
import { useForm } from 'react-hook-form';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Settings, User, Lock, Database, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, updateUser, isSuperAdmin } = useAuth();
  
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      nome: user?.nome || '',
      email: user?.email || ''
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm();

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
    ...(isSuperAdmin() ? [{ id: 'system', label: 'Sistema', icon: Database }] : [])
  ];

  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      // Implementar atualização de perfil quando necessário
      toast.info('Atualização de perfil em desenvolvimento');
      updateUser({ ...user, ...data });
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.changePassword(data.senhaAtual, data.novaSenha);
      toast.success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      resetPassword();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemMaintenance = async (action) => {
    setLoading(true);
    try {
      let response;
      
      switch (action) {
        case 'cleanup-tokens':
          response = await systemService.cleanExpiredTokens();
          toast.success(`${response.data.tokensLimpos} tokens expirados removidos`);
          break;
          
        case 'cleanup-sessions':
          response = await systemService.cleanExpiredSessions();
          toast.success('Sessões expiradas removidas');
          break;
          
        default:
          toast.info('Ação não implementada');
      }
    } catch (error) {
      toast.error('Erro na manutenção do sistema');
    } finally {
      setLoading(false);
      setShowMaintenanceModal(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: 'var(--gray-800)',
          margin: 0 
        }}>
          Configurações
        </h1>
        <p style={{ 
          color: 'var(--gray-600)', 
          margin: '0.5rem 0 0 0' 
        }}>
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid var(--gray-200)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary-blue)' : '2px solid transparent',
                  color: isActive ? 'var(--primary-blue)' : 'var(--gray-600)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '400'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'profile' && (
        <Card title="Informações do Perfil">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <Input
                label="Nome Completo"
                {...registerProfile('nome', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 2,
                    message: 'Nome deve ter no mínimo 2 caracteres'
                  }
                })}
                error={profileErrors.nome?.message}
              />

              <Input
                label="Email"
                type="email"
                disabled
                {...registerProfile('email')}
                error={profileErrors.email?.message}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Perfil</label>
              <input
                className="form-input"
                value={user?.perfil === 'super_admin' ? 'Super Administrador' : 'Administrador'}
                disabled
              />
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Segurança da Conta">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'var(--gray-50)',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                  Alterar Senha
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  Mantenha sua conta segura alterando a senha regularmente
                </p>
              </div>
              
              <Button
                variant="primary"
                onClick={() => setShowPasswordModal(true)}
              >
                <Lock size={16} />
                Alterar Senha
              </Button>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--yellow-50)',
              border: '1px solid var(--yellow-200)',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertTriangle size={20} color="var(--yellow-600)" style={{ marginTop: '0.125rem' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--yellow-800)' }}>
                    Dicas de Segurança
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--yellow-700)' }}>
                    <li>Use uma senha forte com pelo menos 8 caracteres</li>
                    <li>Inclua letras maiúsculas, minúsculas, números e símbolos</li>
                    <li>Não compartilhe suas credenciais com outras pessoas</li>
                    <li>Faça logout ao terminar de usar o sistema</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'system' && isSuperAdmin() && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Manutenção do Sistema">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                    Limpeza de Tokens
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Remove tokens de reset de senha expirados
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handleSystemMaintenance('cleanup-tokens')}
                  loading={loading}
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  Limpar Tokens
                </Button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                    Limpeza de Sessões
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Remove sessões de login expiradas
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handleSystemMaintenance('cleanup-sessions')}
                  loading={loading}
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  Limpar Sessões
                </Button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'var(--red-50)',
                border: '1px solid var(--red-200)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--red-800)' }}>
                    Manutenção Geral
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--red-600)' }}>
                    Execute manutenção completa do sistema
                  </p>
                </div>
                
                <Button
                  variant="danger"
                  onClick={() => setShowMaintenanceModal(true)}
                >
                  <Settings size={16} />
                  Manutenção
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Informações do Sistema">
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  Versão da API
                </h4>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                  v2.0.0
                </p>
              </div>
              
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--gray-50)',
                borderRadius: '0.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  Ambiente
                </h4>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                  Desenvolvimento
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Alterar Senha"
        size="medium"
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <Input
            label="Senha Atual"
            type="password"
            required
            {...registerPassword('senhaAtual', {
              required: 'Senha atual é obrigatória'
            })}
            error={passwordErrors.senhaAtual?.message}
          />

          <Input
            label="Nova Senha"
            type="password"
            required
            {...registerPassword('novaSenha', {
              required: 'Nova senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Nova senha deve ter no mínimo 6 caracteres'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Nova senha deve conter ao menos 1 letra minúscula, 1 maiúscula e 1 número'
              }
            })}
            error={passwordErrors.novaSenha?.message}
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            required
            {...registerPassword('confirmarSenha', {
              required: 'Confirmação é obrigatória',
              validate: (value, { novaSenha }) => 
                value === novaSenha || 'Senhas não coincidem'
            })}
            error={passwordErrors.confirmarSenha?.message}
          />

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
            marginTop: '1.5rem'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
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
              Alterar Senha
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Manutenção */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title="Manutenção do Sistema"
        size="medium"
      >
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--yellow-50)',
          border: '1px solid var(--yellow-200)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="var(--yellow-600)" />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--yellow-800)' }}>
                Atenção
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--yellow-700)' }}>
                Esta operação irá executar uma limpeza completa do sistema, incluindo tokens expirados,
                sessões antigas e logs antigos. O processo pode levar alguns minutos.
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="outline"
            onClick={() => setShowMaintenanceModal(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            variant="danger"
            onClick={() => {
              handleSystemMaintenance('cleanup-tokens');
              handleSystemMaintenance('cleanup-sessions');
            }}
            loading={loading}
            disabled={loading}
          >
            Executar Manutenção
          </Button>
        </div>
      </Modal>
    </div>
  );
}