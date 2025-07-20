// Modal de confirmação de exclusão de usuário
// ============= src/components/users/DeleteConfirmModal.js - NOVO =============
'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle, User, UserX } from 'lucide-react';

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  user, 
  loading = false 
}) {
  if (!user) return null;

  const isBasicUser = user.hasOwnProperty('telefone');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Desativação"
      size="medium"
    >
      <div>
        {/* Ícone de aviso */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '4rem',
          height: '4rem',
          backgroundColor: 'var(--red-100)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem auto'
        }}>
          <AlertTriangle size={28} color="var(--red-500)" />
        </div>

        {/* Informações do usuário */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--gray-50)',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: isBasicUser ? 'var(--terracotta)' : 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              {user.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--gray-800)'
              }}>
                {user.nome}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                {user.email}
              </div>
            </div>
          </div>
          
          {user.perfil && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--gray-500)',
              fontStyle: 'italic'
            }}>
              Perfil: {user.perfil === 'super_admin' ? 'Super Administrador' : 
                      user.perfil === 'admin' ? 'Administrador' : 'Usuário Básico'}
            </div>
          )}
        </div>

        {/* Mensagem de confirmação */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.125rem',
            color: 'var(--gray-800)'
          }}>
            Desativar {isBasicUser ? 'usuário' : 'administrador'}?
          </h3>
          
          <p style={{
            margin: '0 0 1rem 0',
            color: 'var(--gray-600)',
            lineHeight: 1.5
          }}>
            Esta ação irá <strong>desativar</strong> o {isBasicUser ? 'usuário' : 'administrador'}.
            O usuário <strong>não será deletado</strong> do sistema, apenas ficará inativo.
          </p>

                 <div style={{
            padding: '1rem',
            backgroundColor: 'var(--yellow-50)',
            border: '1px solid var(--yellow-200)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            color: 'var(--yellow-800)'
          }}>
            <strong>Consequências da desativação:</strong>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1rem' }}>
              <li>Não poderá fazer login no sistema</li>
              <li>Não receberá notificações</li>
              <li>Dados permanecerão no sistema</li>
              <li>Pode ser reativado posteriormente</li>
            </ul>
          </div>
        </div>

        {/* Botões de ação */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            <UserX size={16} />
            Desativar {isBasicUser ? 'Usuário' : 'Administrador'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}