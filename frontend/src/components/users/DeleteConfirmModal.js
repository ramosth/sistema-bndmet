// Modal de confirmação de desativação — Layout compacto sem scroll
// ============= src/components/users/DeleteConfirmModal.js =============
'use client';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Shield, UserX } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, user, loading = false }) {
  if (!user) return null;

  const isBasic      = user.hasOwnProperty('telefone') && user.hasOwnProperty('receberNotificacoes');
  const perfilLabel  = user.perfil === 'super_admin' ? 'Super Admin' : user.perfil === 'admin' ? 'Admin' : 'Usuário Básico';
  const inicialBg    = isBasic ? '#dbeafe' : '#fce7f3';
  const inicialColor = isBasic ? '#1d4ed8' : '#9d174d';

  // Consequências específicas por tipo
  const consequencias = isBasic
    ? ['🔕 Não receberá notificações de alerta', '✅ Dados permanecem salvos']
    : ['🔒 Sem acesso ao sistema', '🔕 Não receberá notificações', '✅ Dados permanecem salvos'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desativar usuário?" size="small">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Card compacto do usuário */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem', backgroundColor: '#f9fafb',
          borderRadius: '0.5rem', border: '1px solid #e5e7eb',
        }}>
          <div style={{
            width: '2.25rem', height: '2.25rem', borderRadius: '50%', flexShrink: 0,
            backgroundColor: inicialBg, color: inicialColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: '700',
          }}>
            {user.nome?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>
                {user.nome}
              </span>
              <span style={{
                padding: '0.1rem 0.4rem', borderRadius: '0.25rem',
                fontSize: '0.68rem', fontWeight: '600',
                backgroundColor: isBasic ? '#eff6ff' : '#fef2f2',
                color: isBasic ? '#2563eb' : '#dc2626',
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
              }}>
                <Shield size={10} /> {perfilLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Descrição em 1 linha */}
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
          O {isBasic ? 'usuário' : 'administrador'} ficará <strong>inativo</strong> mas{' '}
          <strong>não será deletado</strong> — pode ser reativado a qualquer momento.
        </p>

        {/* Consequências compactas */}
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#92400e' }}>
            ⚠️ Consequências:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {consequencias.map((item, i) => (
              <span key={i} style={{ fontSize: '0.78rem', color: '#92400e' }}>{item}</span>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} disabled={loading}>
            <UserX size={15} /> Desativar
          </Button>
        </div>
      </div>
    </Modal>
  );
}