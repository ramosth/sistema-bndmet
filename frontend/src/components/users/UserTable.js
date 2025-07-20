// Tabela de usuários
// ============= src/components/users/UserTable.js =============
'use client';

import { useState } from 'react';
import { formatDate } from '@/utils';
import { userService } from '@/services/api';
import Button from '@/components/ui/Button';
import DeleteConfirmModal from './DeleteConfirmModal';
import { Edit2, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff, Phone, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserTable({ 
  users, 
  onEdit, 
  onRefresh, 
  pagination,
  userType,
  canEdit = true 
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(null);

  const handleToggleStatus = async (user) => {
    setTogglingStatus(user.id);
    try {
      const isBasicUser = isBasicUser(user);
      const newStatus = !user.ativo;
      
      if (isBasicUser) {
        await userService.toggleBasicUserStatus(user.id, newStatus);
      } else {
        await userService.toggleAdminUserStatus(user.id, newStatus);
      }
      
      toast.success(`${isBasicUser ? 'Usuário' : 'Administrador'} ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      onRefresh();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar status do usuário';
      toast.error(message);
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    try {
      const isBasicUser = isBasicUser(userToDelete);
      
      if (isBasicUser) {
        await userService.deleteBasicUser(userToDelete.id);
      } else {
        await userService.deleteAdminUser(userToDelete.id);
      }
      
      toast.success(`${isBasicUser ? 'Usuário' : 'Administrador'} desativado com sucesso!`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      onRefresh();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao desativar usuário';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Função para determinar se é usuário básico
  const isBasicUser = (user) => {
    return user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes');
  };

  const getProfileBadge = (perfil) => {
    const profiles = {
      'super_admin': { label: 'Super Admin', color: 'var(--red-500)', bg: 'var(--red-50)' },
      'admin': { label: 'Admin', color: 'var(--primary-blue)', bg: 'var(--blue-50)' },
      'basico': { label: 'Básico', color: 'var(--gray-600)', bg: 'var(--gray-50)' }
    };
    
    const profile = profiles[perfil] || profiles['basico'];
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        backgroundColor: profile.bg,
        color: profile.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <Shield size={12} />
        {profile.label}
      </span>
    );
  };

  if (users.length === 0) {
    return (
      <div className="text-center" style={{ padding: '3rem' }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          backgroundColor: 'var(--gray-100)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          {userType === 'basic' ? 
            <Eye size={24} color="var(--gray-400)" /> : 
            <Shield size={24} color="var(--gray-400)" />
          }
        </div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-700)' }}>
          Nenhum usuário encontrado
        </h3>
        <p style={{ margin: 0, color: 'var(--gray-500)' }}>
          {userType === 'basic' ? 
            'Não há usuários básicos cadastrados.' : 
            'Não há administradores cadastrados.'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Nome
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Email
              </th>
              
              {/* Colunas condicionais baseadas no tipo */}
              {userType === 'basic' ? (
                <>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Telefone
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Notificações
                  </th>
                </>
              ) : (
                <>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Perfil
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Último Login
                  </th>
                </>
              )}
              
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Status
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Criado em
              </th>
              {canEdit && (
                <th style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--gray-700)'
                }}>
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const isBasic = isBasicUser(user);
              
              return (
                <tr 
                  key={user.id || index}
                  style={{ 
                    borderBottom: '1px solid var(--gray-100)',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Nome */}
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: isBasic ? 'var(--terracotta)' : 'var(--primary-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {user.nome?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--gray-800)'
                      }}>
                        {user.nome}
                      </span>
                    </div>
                  </td>
                  
                  {/* Email */}
                  <td style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    {user.email}
                  </td>
                  
                  {/* Colunas condicionais */}
                  {isBasic ? (
                    <>
                      {/* Telefone (só usuários básicos) */}
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--gray-600)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Phone size={14} color="var(--gray-400)" />
                          {user.telefone || 'N/A'}
                        </div>
                      </td>
                      
                      {/* Notificações (só usuários básicos) */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span className={`status-badge ${user.receberNotificacoes ? 'status-online' : 'status-offline'}`}>
                            {user.receberNotificacoes ? 'Ativado' : 'Desativado'}
                          </span>
                          {user.receberNotificacoes && user.tipoNotificacao && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: 'var(--gray-500)',
                              fontStyle: 'italic'
                            }}>
                              {user.tipoNotificacao.replace(',', ', ')}
                            </span>
                          )}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Perfil (só administradores) */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {getProfileBadge(user.perfil)}
                      </td>
                      
                      {/* Último Login (só administradores) */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {user.ultimoLogin ? (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <span style={{
                              fontSize: '0.875rem',
                              color: 'var(--gray-700)'
                            }}>
                              {formatDate(user.ultimoLogin)}
                            </span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              color: 'var(--green-600)'
                            }}>
                              <Clock size={12} />
                              Recente
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: '0.875rem',
                            color: 'var(--gray-400)',
                            fontStyle: 'italic'
                          }}>
                            Nunca
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  
                  {/* Status */}
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span className={`status-badge ${user.ativo ? 'status-online' : 'status-offline'}`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  
                  {/* Data de Criação */}
                  <td style={{
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    {formatDate(user.createdAt)}
                  </td>
                  
                  {/* Ações */}
                  {canEdit && (
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => onEdit(user)}
                          style={{ padding: '0.25rem' }}
                          title="Editar usuário"
                        >
                          <Edit2 size={14} />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleToggleStatus(user)}
                          loading={togglingStatus === user.id}
                          disabled={togglingStatus === user.id}
                          style={{ 
                            padding: '0.25rem',
                            color: user.ativo ? 'var(--red-500)' : 'var(--green-500)',
                            borderColor: user.ativo ? 'var(--red-300)' : 'var(--green-300)'
                          }}
                          title={user.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {user.ativo ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>

                        {user.ativo && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleDeleteClick(user)}
                            style={{ 
                              padding: '0.25rem',
                              color: 'var(--red-500)',
                              borderColor: 'var(--red-300)'
                            }}
                            title="Desativar usuário permanentemente"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="flex-between" style={{ marginTop: '1.5rem', padding: '1rem 0' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} usuários
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="small"
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              margin: '0 0.5rem'
            }}>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                const isActive = pageNum === pagination.page;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.goToPage(pageNum)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      border: 'none',
                      borderRadius: '0.25rem',
                      backgroundColor: isActive ? 'var(--primary-blue)' : 'transparent',
                      color: isActive ? 'white' : 'var(--gray-600)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'var(--gray-100)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="small"
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
            >
              Próximo
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de deleção */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        user={userToDelete}
        loading={loading}
      />
    </div>
  );
}