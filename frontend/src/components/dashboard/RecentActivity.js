// Atividade recente do sistema — layout em lista compacta
// ============= src/components/dashboard/RecentActivity.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService } from '@/services/api';
import { formatDateBR } from '@/utils';
import { Activity, AlertTriangle, Settings, Wifi, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

const ICON_MAP = {
  SENSOR:        Activity,
  BNDMET:        AlertTriangle,
  CONECTIVIDADE: Wifi,
  OWM:           Settings,
};

const LEVEL_COLORS = {
  ERROR:    { color: '#dc2626', bg: '#fef2f2', label: 'ERRO' },
  CRITICAL: { color: '#991b1b', bg: '#fee2e2', label: 'CRÍTICO' },
  WARNING:  { color: '#d97706', bg: '#fffbeb', label: 'ATENÇÃO' },
  INFO:     { color: '#2563eb', bg: '#eff6ff', label: 'INFO' },
};

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const logs = await sensorService.getLogs(null, null, 10);
      setActivities(logs.data || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px', color: '#9ca3af' }}>
        <Activity size={20} style={{ opacity: 0.4 }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {activities.length === 0
            ? 'Sem atividade recente'
            : <><strong style={{ color: '#374151' }}>{activities.length}</strong> registros</>}
        </span>
        <Button variant="outline" size="small" onClick={load} loading={loading}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
          <RefreshCw size={12} /> Atualizar
        </Button>
      </div>

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <Activity size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '260px', overflowY: 'auto' }}>
          {activities.map((act, i) => {
            const Icon  = ICON_MAP[act.componente] || Activity;
            const style = LEVEL_COLORS[act.nivel] || LEVEL_COLORS.INFO;

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem 0.625rem',
                backgroundColor: '#f9fafb',
                borderRadius: '0.375rem',
                borderLeft: `3px solid ${style.color}`,
              }}>
                {/* Ícone */}
                <div style={{
                  width: '1.75rem', height: '1.75rem', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: style.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={12} color={style.color} />
                </div>

                {/* Mensagem */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.mensagem || `Atividade ${act.componente}`}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                    {formatDateBR(act.timestamp)}
                    {act.componente && <> · <span style={{ color: '#6b7280' }}>{act.componente}</span></>}
                  </div>
                </div>

                {/* Badge nível */}
                <span style={{
                  padding: '0.1rem 0.375rem', borderRadius: '0.2rem', flexShrink: 0,
                  fontSize: '0.65rem', fontWeight: '700',
                  backgroundColor: style.bg, color: style.color,
                }}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}