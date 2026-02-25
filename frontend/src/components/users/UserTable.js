// Tabela de usuários - Layout Original com Correções
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

  // Função para determinar se é usuário básico - RENOMEADA para evitar conflito
  const checkIfBasicUser = (user) => {
    return user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes');
  };

  const handleToggleStatus = async (user) => {
    setTogglingStatus(user.id);
    try {
      const isBasic = checkIfBasicUser(user); // CORREÇÃO: usar função renomeada
      const newStatus = !user.ativo;
      
      console.log('🔄 Alterando status:', { user: user.nome, isBasic, newStatus });
      
      if (isBasic) {
        await userService.toggleBasicUserStatus(user.id, newStatus);
      } else {
        await userService.toggleAdminUserStatus(user.id, newStatus);
      }
      
      toast.success(`${isBasic ? 'Usuário' : 'Administrador'} ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      onRefresh();
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
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
    
    console.log('🗑️ Iniciando desativação:', userToDelete);
    
    setLoading(true);
    try {
      const isBasic = checkIfBasicUser(userToDelete); // CORREÇÃO: usar função renomeada
      
      console.log('🔍 Tipo de usuário:', { isBasic, user: userToDelete.nome });
      
      if (isBasic) {
        console.log('📤 Chamando deleteBasicUser...');
        await userService.deleteBasicUser(userToDelete.id);
      } else {
        console.log('📤 Chamando deleteAdminUser...');
        await userService.deleteAdminUser(userToDelete.id);
      }
      
      toast.success(`${isBasic ? 'Usuário' : 'Administrador'} desativado com sucesso!`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      onRefresh();
    } catch (error) {
      console.error('❌ Erro ao desativar usuário:', error);
      const message = error.response?.data?.message || 'Erro ao desativar usuário';
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
              const isBasic = checkIfBasicUser(user); // CORREÇÃO: usar função renomeada
              
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
                            {user.receberNotificacoes ? 'Ativo' : 'Inativo'}
                          </span>
                          {user.tipoNotificacao && user.receberNotificacoes && (
                            <span style={{ 
                              fontSize: '0.75rem',
                              color: 'var(--gray-500)'
                            }}>
                              ({user.tipoNotificacao})
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
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: 'var(--gray-600)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}>
                          <Clock size={14} color="var(--gray-400)" />
                          {user.ultimoLogin ? formatDate(user.ultimoLogin) : 'Nunca'}
                        </div>
                      </td>
                    </>
                  )}
                  
                  {/* Status */}
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: user.ativo ? '#dcfce7' : '#fef2f2',
                      color: user.ativo ? '#166534' : '#dc2626'
                    }}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  
                  {/* Criado em */}
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        {/* Botão Editar */}
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => onEdit(user)}
                          style={{
                            minWidth: 'auto',
                            padding: '0.375rem',
                            backgroundColor: '#eff6ff',
                            borderColor: '#93c5fd',
                            color: '#2563eb'
                          }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        
                        {/* Botão Toggle Status */}
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingStatus === user.id}
                          style={{
                            minWidth: 'auto',
                            padding: '0.375rem',
                            backgroundColor: user.ativo ? '#fef2f2' : '#dcfce7',
                            borderColor: user.ativo ? '#fca5a5' : '#86efac',
                            color: user.ativo ? '#dc2626' : '#16a34a',
                            opacity: togglingStatus === user.id ? 0.6 : 1,
                            cursor: togglingStatus === user.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {togglingStatus === user.id ? (
                            <Clock size={14} />
                          ) : user.ativo ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </Button>
                        
                        {/* Botão Deletar */}
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleDeleteClick(user)}
                          style={{
                            minWidth: 'auto',
                            padding: '0.375rem',
                            backgroundColor: '#fef2f2',
                            borderColor: '#fca5a5',
                            color: '#dc2626'
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
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
      {pagination && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.5rem',
          padding: '1rem 0',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--gray-600)'
          }}>
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuários
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Button
              variant="outline"
              size="small"
              onClick={() => pagination.goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
            
            {/* Números de página */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              margin: '0 0.5rem'
            }}>
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
                const pageNum = pagination.page - 2 + i;
                if (pageNum < 1 || pageNum > Math.ceil(pagination.total / pagination.limit)) return null;
                
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
              onClick={() => pagination.goToPage(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              Próxima
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