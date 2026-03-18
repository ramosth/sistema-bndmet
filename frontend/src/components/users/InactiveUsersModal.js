// Modal de usuários inativos — Dica contextual por tipo
// ============= src/components/users/InactiveUsersModal.js =============
'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/api';
import { formatDateBR } from '@/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, UserCheck, Phone, Shield, RefreshCw, BellOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InactiveUsersModal({ isOpen, onClose, onUserReactivated }) {
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [reactivating,  setReactivating]  = useState(null);

  useEffect(() => {
    if (isOpen) loadInactiveUsers();
  }, [isOpen]);

  const loadInactiveUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getInactiveUsers({ limite: 50 });
      setInactiveUsers(response.success && Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar inativos:', error);
      toast.error('Erro ao carregar usuários inativos');
      setInactiveUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (user) => {
    setReactivating(user.id);
    try {
      const isBasic = isBasicUser(user);
      if (isBasic) await userService.toggleBasicUserStatus(user.id, true);
      else         await userService.toggleAdminUserStatus(user.id, true);
      toast.success(`${isBasic ? 'Usuário' : 'Administrador'} reativado com sucesso!`);
      setInactiveUsers(prev => prev.filter(u => u.id !== user.id));
      if (onUserReactivated) onUserReactivated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao reativar');
    } finally {
      setReactivating(null);
    }
  };

  const isBasicUser     = (u) => u.tipo === 'basico' || u.hasOwnProperty('telefone');
  const getTypeLabel    = (u) => u.perfil === 'super_admin' ? 'Super Admin' : u.perfil === 'admin' ? 'Admin' : 'Usuário Básico';
  const getTypeColor    = (u) => isBasicUser(u) ? '#ea580c' : '#2563eb';
  const getInicialBg    = (u) => isBasicUser(u) ? '#dbeafe' : '#fce7f3';
  const getInicialColor = (u) => isBasicUser(u) ? '#1d4ed8' : '#9d174d';

  const nBasicos = inactiveUsers.filter(isBasicUser).length;
  const nAdmins  = inactiveUsers.filter(u => !isBasicUser(u)).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Usuários Inativos" size="large">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Header: contador + botão atualizar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {loading ? 'Carregando...' : inactiveUsers.length === 0 ? 'Nenhum usuário inativo' : (
              <>
                <strong style={{ color: '#374151' }}>{inactiveUsers.length}</strong>
                {' '}usuário{inactiveUsers.length !== 1 ? 's' : ''} inativo{inactiveUsers.length !== 1 ? 's' : ''}
                {nAdmins > 0 && nBasicos > 0 && (
                  <span style={{ color: '#9ca3af', marginLeft: '0.375rem' }}>
                    ({nAdmins} admin{nAdmins > 1 ? 's' : ''}, {nBasicos} básico{nBasicos > 1 ? 's' : ''})
                  </span>
                )}
              </>
            )}
          </span>
          <Button variant="outline" size="small" onClick={loadInactiveUsers} loading={loading} disabled={loading}>
            <RefreshCw size={13} /> Atualizar
          </Button>
        </div>

        {/* Corpo */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : inactiveUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <UserCheck size={22} color="#16a34a" />
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', margin: '0 0 0.25rem' }}>
              Todos os usuários estão ativos!
            </p>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Nenhum usuário desativado no momento.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
            {inactiveUsers.map((user, index) => {
              const isBasic = isBasicUser(user);
              const TypeIcon = isBasic ? Users : Shield;
              const isLast   = index === inactiveUsers.length - 1;

              return (
                <div
                  key={user.id}
                  style={{ padding: '0.875rem 1rem', borderBottom: isLast ? 'none' : '1px solid #f3f4f6', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Inicial */}
                    <div style={{
                      width: '2.25rem', height: '2.25rem', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: getInicialBg(user), color: getInicialColor(user),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: '700',
                    }}>
                      {user.nome?.charAt(0)?.toUpperCase() || '?'}
                    </div>

                    {/* Dados */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Nome + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>
                          {user.nome}
                        </span>
                        <span style={{
                          padding: '0.1rem 0.4rem', borderRadius: '0.25rem',
                          fontSize: '0.68rem', fontWeight: '600',
                          backgroundColor: `${getTypeColor(user)}18`, color: getTypeColor(user),
                          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                        }}>
                          <TypeIcon size={10} /> {getTypeLabel(user)}
                        </span>
                      </div>

                      {/* Email */}
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>

                      {/* Telefone (só básico) */}
                      {isBasic && user.telefone && (
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                          <Phone size={11} /> {user.telefone}
                        </div>
                      )}

                      {/* Data de desativação */}
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                        Desativado em: {formatDateBR(user.updatedAt)}
                      </div>

                      {/* Impacto contextual por tipo — linha destacada */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        marginTop: '0.3rem', padding: '0.15rem 0.45rem',
                        borderRadius: '0.25rem', fontSize: '0.68rem', fontWeight: '500',
                        backgroundColor: isBasic ? '#fff7ed' : '#fef2f2',
                        color: isBasic ? '#c2410c' : '#dc2626',
                      }}>
                        {isBasic
                          ? <><BellOff size={10} /> Não recebe notificações de alerta</>
                          : <><Lock size={10} /> Sem acesso ao sistema</>}
                      </div>
                    </div>

                    {/* Botão reativar */}
                    <Button
                      variant="outline" size="small"
                      onClick={() => handleReactivate(user)}
                      loading={reactivating === user.id}
                      disabled={reactivating === user.id}
                      style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac', color: '#16a34a', flexShrink: 0 }}
                    >
                      <UserCheck size={13} />
                      {reactivating === user.id ? 'Reativando...' : 'Reativar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nota de rodapé universal */}
        {inactiveUsers.length > 0 && (
          <div style={{ padding: '0.625rem 0.875rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <UserCheck size={13} style={{ flexShrink: 0 }} />
            Dados permanecem salvos. Reative qualquer usuário a qualquer momento.
          </div>
        )}
      </div>
    </Modal>
  );
}