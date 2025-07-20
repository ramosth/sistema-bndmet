// Modal de confirmação de inativação de usuário
// ============= src/components/users/InactiveUsersModal.js - NOVO =============
'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import { formatDate } from '@/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, UserCheck, Phone, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InactiveUsersModal({ isOpen, onClose, onUserReactivated }) {
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reactivating, setReactivating] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadInactiveUsers();
    }
  }, [isOpen]);

  const loadInactiveUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getInactiveUsers({ limite: 50 });
      if (response.success) {
        setInactiveUsers(response.data.usuarios || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários inativos:', error);
      toast.error('Erro ao carregar usuários inativos');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (user) => {
    setReactivating(user.id);
    try {
      const isBasicUser = user.tipo === 'basico' || user.hasOwnProperty('telefone');
      
      if (isBasicUser) {
        await userService.toggleBasicUserStatus(user.id, true);
      } else {
        await userService.toggleAdminUserStatus(user.id, true);
      }
      
      toast.success(`${isBasicUser ? 'Usuário' : 'Administrador'} reativado com sucesso!`);
      
      // Remover da lista local
      setInactiveUsers(prev => prev.filter(u => u.id !== user.id));
      
      // Notificar componente pai para atualizar listas
      if (onUserReactivated) {
        onUserReactivated();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao reativar usuário';
      toast.error(message);
    } finally {
      setReactivating(null);
    }
  };

  const getTypeIcon = (user) => {
    const isBasicUser = user.tipo === 'basico' || user.hasOwnProperty('telefone');
    return isBasicUser ? Users : Shield;
  };

  const getTypeLabel = (user) => {
    if (user.perfil === 'super_admin') return 'Super Admin';
    if (user.perfil === 'admin') return 'Admin';
    return 'Usuário Básico';
  };

  const getTypeColor = (user) => {
    const isBasicUser = user.tipo === 'basico' || user.hasOwnProperty('telefone');
    return isBasicUser ? 'var(--terracotta)' : 'var(--primary-blue)';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Usuários Inativos"
      size="large"
    >
      <div>
        <div className="flex-between mb-4">
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--gray-600)'
          }}>
            {inactiveUsers.length} usuários inativos encontrados
          </div>
          
          <Button
            variant="outline"
            size="small"
            onClick={loadInactiveUsers}
            loading={loading}
          >
            <RefreshCw size={14} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : inactiveUsers.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <UserCheck size={48} color="var(--green-500)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-700)' }}>
              Todos os usuários estão ativos!
            </h3>
            <p style={{ margin: 0, color: 'var(--gray-500)' }}>
              Não há usuários desativados no momento.
            </p>
          </div>
        ) : (
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid var(--gray-200)',
            borderRadius: '0.5rem'
          }}>
            {inactiveUsers.map((user, index) => {
              const TypeIcon = getTypeIcon(user);
              const isBasicUser = user.tipo === 'basico' || user.hasOwnProperty('telefone');
              
              return (
                <div 
                  key={user.id}
                  style={{
                    padding: '1rem',
                    borderBottom: index < inactiveUsers.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: getTypeColor(user),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}>
                        {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                      </div>

                      {/* Informações */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--gray-800)'
                          }}>
                            {user.nome}
                          </span>
                          
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: `${getTypeColor(user)}20`,
                            color: getTypeColor(user),
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <TypeIcon size={12} />
                            {getTypeLabel(user)}
                          </span>
                        </div>
                        
                        <div style={{
                          fontSize: '0.875rem',
                          color: 'var(--gray-600)'
                        }}>
                          {user.email}
                        </div>
                        
                        {isBasicUser && user.telefone && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--gray-500)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginTop: '0.25rem'
                          }}>
                            <Phone size={12} />
                            {user.telefone}
                          </div>
                        )}
                        
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--gray-500)',
                          marginTop: '0.25rem'
                        }}>
                          Desativado em: {formatDate(user.updatedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Botão de reativar */}
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleReactivate(user)}
                      loading={reactivating === user.id}
                      disabled={reactivating === user.id}
                      style={{
                        color: 'var(--green-600)',
                        borderColor: 'var(--green-300)'
                      }}
                    >
                      <UserCheck size={14} />
                      Reativar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--blue-50)',
          border: '1px solid var(--blue-200)',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: 'var(--blue-700)'
        }}>
          <strong>💡 Dica:</strong> Usuários inativos não podem fazer login no sistema, mas seus dados
          permanecem salvos. Você pode reativá-los a qualquer momento clicando em "Reativar".
        </div>
      </div>
    </Modal>
  );
}