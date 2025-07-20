// Formulário de alerta
// ============= src/components/alerts/AlertForm.js =============
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Users, Mail, MessageSquare, AlertTriangle, Info } from 'lucide-react';

export default function AlertForm({ onSend, onCancel, loading = false }) {
  const [selectedChannels, setSelectedChannels] = useState(['email']);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      titulo: '',
      mensagem: '',
      nivelCriticidade: 'medio',
      tipoDestinatario: 'todos',
      canaisEnvio: ['email'],
      destinatariosIds: []
    }
  });

  const tipoDestinatario = watch('tipoDestinatario');
  const nivelCriticidade = watch('nivelCriticidade');

  const handleChannelChange = (channel, isChecked) => {
    let newChannels;
    if (isChecked) {
      newChannels = [...selectedChannels, channel];
    } else {
      newChannels = selectedChannels.filter(c => c !== channel);
    }
    
    setSelectedChannels(newChannels);
    setValue('canaisEnvio', newChannels);
  };

  const onSubmit = async (data) => {
    const alertData = {
      ...data,
      canaisEnvio: selectedChannels
    };
    await onSend(alertData);
  };

  const getCriticalityColor = (level) => {
    const colors = {
      baixo: 'var(--green-500)',
      medio: 'var(--yellow-500)',
      alto: 'var(--orange-500)',
      critico: 'var(--red-500)'
    };
    return colors[level] || 'var(--gray-500)';
  };

  const getCriticalityLabel = (level) => {
    const labels = {
      baixo: 'Informativo',
      medio: 'Atenção',
      alto: 'Urgente',
      critico: 'Crítico'
    };
    return labels[level] || 'Médio';
  };

  const getRecipientCount = (tipo) => {
    const counts = {
      todos: 'Todos os usuários ativos',
      admins: 'Apenas administradores',
      basicos: 'Apenas usuários básicos'
    };
    return counts[tipo] || '';
  };

  return (
    <div>
      {/* Preview do Alerta */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--gray-50)',
        border: '1px solid var(--gray-200)',
        borderRadius: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <AlertTriangle size={16} color={getCriticalityColor(nivelCriticidade)} />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--gray-600)',
            textTransform: 'uppercase'
          }}>
            Preview do Alerta - {getCriticalityLabel(nivelCriticidade)}
          </span>
        </div>
        
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--gray-500)',
          fontStyle: 'italic'
        }}>
          {getRecipientCount(tipoDestinatario)} receberão este alerta via{' '}
          {selectedChannels.length > 0 ? selectedChannels.join(' e ') : 'nenhum canal selecionado'}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-2" style={{ gap: '1rem' }}>
          <Input
            label="Título do Alerta"
            placeholder="Ex: Alerta de Segurança - Barragem X"
            required
            {...register('titulo', {
              required: 'Título é obrigatório',
              minLength: {
                value: 5,
                message: 'Título deve ter no mínimo 5 caracteres'
              },
              maxLength: {
                value: 200,
                message: 'Título deve ter no máximo 200 caracteres'
              }
            })}
            error={errors.titulo?.message}
          />

          <div className="form-group">
            <label className="form-label">
              Nível de Criticidade *
            </label>
            <select
              className={`form-input ${errors.nivelCriticidade ? 'border-red-500' : ''}`}
              style={{
                borderLeft: `4px solid ${getCriticalityColor(nivelCriticidade)}`
              }}
              {...register('nivelCriticidade', { required: 'Nível é obrigatório' })}
            >
              <option value="baixo">🟢 Baixo - Informativo</option>
              <option value="medio">🟡 Médio - Atenção</option>
              <option value="alto">🟠 Alto - Urgente</option>
              <option value="critico">🔴 Crítico - Emergência</option>
            </select>
            {errors.nivelCriticidade && (
              <div className="form-error">{errors.nivelCriticidade.message}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Mensagem do Alerta *
          </label>
          <textarea
            className={`form-input ${errors.mensagem ? 'border-red-500' : ''}`}
            rows={4}
            placeholder="Digite a mensagem detalhada do alerta. Seja claro e objetivo sobre a situação e as ações necessárias."
            style={{ resize: 'vertical', minHeight: '100px' }}
            {...register('mensagem', {
              required: 'Mensagem é obrigatória',
              minLength: {
                value: 10,
                message: 'Mensagem deve ter no mínimo 10 caracteres'
              },
              maxLength: {
                value: 1000,
                message: 'Mensagem deve ter no máximo 1000 caracteres'
              }
            })}
          />
          {errors.mensagem && (
            <div className="form-error">{errors.mensagem.message}</div>
          )}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--gray-500)',
            marginTop: '0.25rem',
            textAlign: 'right'
          }}>
            {watch('mensagem')?.length || 0}/1000 caracteres
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">
              <Users size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Destinatários *
            </label>
            <select
              className={`form-input ${errors.tipoDestinatario ? 'border-red-500' : ''}`}
              {...register('tipoDestinatario', { required: 'Tipo de destinatário é obrigatório' })}
            >
              <option value="todos">👥 Todos os usuários</option>
              <option value="admins">👨‍💼 Apenas administradores</option>
              <option value="basicos">👤 Apenas usuários básicos</option>
            </select>
            {errors.tipoDestinatario && (
              <div className="form-error">{errors.tipoDestinatario.message}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <MessageSquare size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Canais de Envio *
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '0.5rem',
              padding: '0.75rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--gray-50)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="email"
                  checked={selectedChannels.includes('email')}
                  onChange={(e) => handleChannelChange('email', e.target.checked)}
                  style={{
                    width: '1rem',
                    height: '1rem',
                    accentColor: 'var(--primary-blue)'
                  }}
                />
                <Mail size={16} color="var(--primary-blue)" />
                <label htmlFor="email" style={{ 
                  fontSize: '0.875rem', 
                  cursor: 'pointer',
                  flex: 1
                }}>
                  Email (Recomendado)
                </label>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="sms"
                  checked={selectedChannels.includes('sms')}
                  onChange={(e) => handleChannelChange('sms', e.target.checked)}
                  style={{
                    width: '1rem',
                    height: '1rem',
                    accentColor: 'var(--terracotta)'
                  }}
                />
                <MessageSquare size={16} color="var(--terracotta)" />
                <label htmlFor="sms" style={{ 
                  fontSize: '0.875rem', 
                  cursor: 'pointer',
                  flex: 1
                }}>
                  SMS (Para alertas críticos)
                </label>
              </div>
            </div>
            
            {selectedChannels.length === 0 && (
              <div className="form-error">Selecione ao menos um canal de envio</div>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--blue-50)',
          border: '1px solid var(--blue-200)',
          borderRadius: '0.5rem',
          marginTop: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Info size={20} color="var(--primary-blue)" style={{ marginTop: '0.125rem' }} />
            <div>
              <h4 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.875rem', 
                color: 'var(--primary-blue)',
                fontWeight: '600'
              }}>
                Informações Importantes
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1rem', 
                fontSize: '0.75rem', 
                color: 'var(--blue-700)',
                lineHeight: 1.4
              }}>
                <li>Alertas críticos são enviados imediatamente</li>
                <li>Usuários inativos não receberão notificações</li>
                <li>O sistema registra todas as tentativas de envio</li>
                <li>Verifique sempre os dados antes de enviar</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--gray-200)'
        }}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            style={{ minWidth: '100px' }}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || selectedChannels.length === 0}
            style={{ 
              minWidth: '120px',
              backgroundColor: getCriticalityColor(nivelCriticidade),
              borderColor: getCriticalityColor(nivelCriticidade)
            }}
          >
            {loading ? 'Enviando...' : 'Enviar Alerta'}
          </Button>
        </div>
      </form>
    </div>
  );
}