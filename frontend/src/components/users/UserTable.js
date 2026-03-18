// Tabela de usuários — Estrutura UX completa com linha expandível
// ============= src/components/users/UserTable.js =============
'use client';

import { useState } from 'react';
import { formatDateBR } from '@/utils';
import { userService } from '@/services/api';
import Button from '@/components/ui/Button';
import DeleteConfirmModal from './DeleteConfirmModal';
import {
  Edit2, Trash2, ChevronLeft, ChevronRight,
  Phone, Shield, Clock,
  ChevronDown, ChevronUp, Bell, BellOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────
const TH = ({ children, align = 'left' }) => (
  <th style={{
    padding: '0.625rem 0.75rem', textAlign: align,
    fontSize: '0.7rem', fontWeight: '600', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
    backgroundColor: '#f9fafb',
  }}>
    {children}
  </th>
);

const TD = ({ children, align = 'left', style: s = {} }) => (
  <td style={{ padding: '0.625rem 0.75rem', textAlign: align, verticalAlign: 'middle', ...s }}>
    {children}
  </td>
);

const Inicial = ({ nome, isBasic }) => {
  const bg    = isBasic ? '#dbeafe' : '#fce7f3';
  const color = isBasic ? '#1d4ed8' : '#9d174d';
  return (
    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>
      {nome?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

const StatusBadge = ({ ativo }) => (
  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: ativo ? '#dcfce7' : '#fee2e2', color: ativo ? '#166534' : '#dc2626' }}>
    {ativo ? 'Ativo' : 'Inativo'}
  </span>
);

const PerfilBadge = ({ perfil }) => {
  const map = {
    super_admin: { label: 'Super Admin', bg: '#fef2f2', color: '#dc2626' },
    admin:       { label: 'Admin',       bg: '#eff6ff', color: '#2563eb' },
    basico:      { label: 'Básico',      bg: '#f3f4f6', color: '#6b7280' },
  };
  const s = map[perfil] || map.basico;
  return (
    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.72rem', fontWeight: '600', backgroundColor: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
      <Shield size={11} /> {s.label}
    </span>
  );
};

const NotifBadge = ({ ativo, tipo }) => {
  if (!ativo) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#9ca3af' }}>
      <BellOff size={12} /> Inativo
    </span>
  );
  return (
    <div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: '600', color: '#166534' }}>
        <Bell size={12} /> Ativo
      </span>
      <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.1rem' }}>
        {tipo === 'email,sms' ? 'Email + SMS' : 'Apenas Email'}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function UserTable({ users, onEdit, onRefresh, pagination, userType, canEdit = true }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete,    setUserToDelete]    = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [expandedRow,     setExpandedRow]     = useState(null);

  const isBasicUser = (u) => u.hasOwnProperty('telefone') && u.hasOwnProperty('receberNotificacoes');


  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      const isBasic = isBasicUser(userToDelete);
      if (isBasic) await userService.deleteBasicUser(userToDelete.id);
      else         await userService.deleteAdminUser(userToDelete.id);
      toast.success(`${isBasic ? 'Usuário' : 'Administrador'} desativado!`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao desativar');
    } finally {
      setLoading(false);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!users.length) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
        <Shield size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          {userType === 'basic' ? 'Nenhum usuário básico encontrado.' : 'Nenhum administrador encontrado.'}
        </p>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;
  // colunas: Nome Email [Telefone Notif | Perfil UltLogin] Status CriadoEm [Ações] Det.
  const colSpanTotal = canEdit
    ? (userType === 'basic' ? 8 : 8)
    : (userType === 'basic' ? 7 : 7);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <TH>Nome</TH>
              <TH>Email</TH>
              {userType === 'basic' ? (
                <>
                  <TH>Telefone</TH>
                  <TH align="center">Notificações</TH>
                </>
              ) : (
                <>
                  <TH align="center">Perfil</TH>
                  <TH align="center">Último Login</TH>
                </>
              )}
              <TH align="center">Status</TH>
              <TH>Criado em</TH>
              {canEdit && <TH align="center">Ações</TH>}
              <TH align="center"></TH>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => {
              const isBasic    = isBasicUser(user);
              const isExpanded = expandedRow === index;
              const semLogin   = !isBasic && !user.ultimoLogin;

              return (
                <>
                  <tr
                    key={user.id || index}
                    style={{
                      borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6',
                      backgroundColor: isExpanded ? '#eff6ff' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* Nome com inicial */}
                    <TD>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <Inicial nome={user.nome} isBasic={isBasic} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#111827' }}>
                          {user.nome}
                        </span>
                      </div>
                    </TD>

                    {/* Email */}
                    <TD>
                      <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>{user.email}</span>
                    </TD>

                    {/* Colunas condicionais */}
                    {isBasic ? (
                      <>
                        <TD>
                          <span style={{ fontSize: '0.78rem', color: '#4b5563', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Phone size={13} color="#9ca3af" />
                            {user.telefone || <span style={{ color: '#d1d5db' }}>—</span>}
                          </span>
                        </TD>
                        <TD align="center">
                          <NotifBadge ativo={user.receberNotificacoes} tipo={user.tipoNotificacao} />
                        </TD>
                      </>
                    ) : (
                      <>
                        <TD align="center">
                          <PerfilBadge perfil={user.perfil} />
                        </TD>
                        <TD align="center">
                          {semLogin ? (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> Nunca fez login
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                              {formatDateBR(user.ultimoLogin)}
                            </span>
                          )}
                        </TD>
                      </>
                    )}

                    {/* Status */}
                    <TD align="center">
                      <StatusBadge ativo={user.ativo} />
                    </TD>

                    {/* Criado em */}
                    <TD>
                      <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {formatDateBR(user.createdAt)}
                      </span>
                    </TD>

                    {/* Ações */}
                    {canEdit && (
                      <TD align="center">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                          {/* Editar */}
                          <button onClick={() => onEdit(user)} title="Editar usuário" style={{ padding: '0.3rem', borderRadius: '0.25rem', border: '1px solid #93c5fd', backgroundColor: '#eff6ff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Edit2 size={13} />
                          </button>
                          {/* Desativar — sempre via modal de confirmação */}
                          <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} title="Desativar usuário" style={{ padding: '0.3rem', borderRadius: '0.25rem', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </TD>
                    )}

                    {/* Botão expandir */}
                    <TD align="center">
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : index)}
                        title="Ver detalhes"
                        style={{ padding: '0.3rem', borderRadius: '0.25rem', border: '1px solid #e5e7eb', backgroundColor: isExpanded ? '#dbeafe' : 'white', color: isExpanded ? '#2563eb' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </TD>
                  </tr>

                  {/* ── Linha expandida ──────────────────────────────── */}
                  {isExpanded && (
                    <tr key={`exp-${index}`}>
                      <td colSpan={colSpanTotal} style={{ padding: '0.875rem 1.25rem', backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.75rem' }}>

                          {/* Identificação */}
                          <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              🪪 Identificação
                            </p>
                            {[
                              ['ID',    user.id],
                              ['Nome',  user.nome],
                              ['Email', user.email],
                            ].map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                <span style={{ color: '#6b7280' }}>{k}</span>
                                <span style={{ fontWeight: '500', color: '#374151', wordBreak: 'break-all', textAlign: 'right', maxWidth: '65%' }}>{v || '—'}</span>
                              </div>
                            ))}
                          </div>

                          {/* Registro e datas */}
                          <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              📅 Registro
                            </p>
                            {[
                              ['Criado em',  formatDateBR(user.createdAt)],
                              ['Atualizado', formatDateBR(user.updatedAt)],
                              ['Status',     user.ativo ? 'Ativo' : 'Inativo'],
                              ...(!isBasic ? [
                                ['Último login', user.ultimoLogin ? formatDateBR(user.ultimoLogin) : '⚠️ Nunca fez login'],
                              ] : []),
                            ].map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                <span style={{ color: '#6b7280' }}>{k}</span>
                                <span style={{ fontWeight: '500', color: String(v).includes('⚠️') ? '#d97706' : '#374151' }}>{v || '—'}</span>
                              </div>
                            ))}
                          </div>

                          {/* Notificações (básico) ou Permissões (admin) */}
                          {isBasic ? (
                            <div>
                              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                🔔 Notificações
                              </p>
                              {[
                                ['Telefone',        user.telefone || '—'],
                                ['Receber alertas', user.receberNotificacoes ? '✅ Sim' : '❌ Não'],
                                ['Canal',           user.tipoNotificacao === 'email,sms' ? 'Email + SMS' : user.tipoNotificacao === 'email' ? 'Apenas Email' : '—'],
                              ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                  <span style={{ color: '#6b7280' }}>{k}</span>
                                  <span style={{ fontWeight: '500', color: '#374151' }}>{v}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                🛡 Permissões
                              </p>
                              {[
                                ['Perfil',               user.perfil === 'super_admin' ? 'Super Administrador' : 'Administrador'],
                                ['Gerencia usuários',    'Sim'],
                                ['Gerencia admins',      user.perfil === 'super_admin' ? 'Sim' : 'Não'],
                              ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                  <span style={{ color: '#6b7280' }}>{k}</span>
                                  <span style={{ fontWeight: '500', color: v === 'Sim' ? '#166534' : v === 'Não' ? '#dc2626' : '#374151' }}>{v}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagination && pagination.total > pagination.limit && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Mostrando {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <button onClick={() => pagination.goToPage(pagination.page - 1)} disabled={pagination.page <= 1}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '0.8rem', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', color: pagination.page <= 1 ? '#d1d5db' : '#374151' }}>
              ← Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              const p = Math.max(1, Math.min(pagination.page - 2, totalPages - 4)) + idx;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => pagination.goToPage(p)}
                  style={{ width: '2rem', height: '2rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', backgroundColor: p === pagination.page ? '#2563eb' : 'transparent', color: p === pagination.page ? 'white' : '#374151' }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => pagination.goToPage(pagination.page + 1)} disabled={pagination.page >= totalPages}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '0.8rem', cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer', color: pagination.page >= totalPages ? '#d1d5db' : '#374151' }}>
              Próximo →
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setUserToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        user={userToDelete}
        loading={loading}
      />
    </div>
  );
}