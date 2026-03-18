// Painel de alertas recentes do dashboard
// ============= src/components/dashboard/AlertsPanel.js =============
'use client';

import { useState } from 'react';
import { formatDateBR, getAlertLevel } from '@/utils';
import Button from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, ExternalLink, Zap } from 'lucide-react';

export default function AlertsPanel({ alerts = [], onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try { await onRefresh(); } finally { setLoading(false); }
  };

  const fmtRisco = (alert) => {
    if (alert.indiceRisco != null) return `${parseFloat(alert.indiceRisco).toFixed(1)}%`;
    if (alert.riscoIntegrado != null) return `${(parseFloat(alert.riscoIntegrado) * 100).toFixed(1)}%`;
    return '—';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          {alerts.length === 0
            ? 'Sem alertas recentes'
            : <><strong style={{ color: '#374151' }}>{alerts.length}</strong> alerta{alerts.length > 1 ? 's' : ''} recente{alerts.length > 1 ? 's' : ''}</>}
        </span>
        <Button variant="outline" size="small" onClick={handleRefresh} loading={loading}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
          <RefreshCw size={12} /> Atualizar
        </Button>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#9ca3af', flex: 1 }}>
            <AlertTriangle size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Nenhum alerta crítico encontrado</p>
          </div>
        ) : (
          alerts.slice(0, 6).map((alert, index) => {
            const level     = getAlertLevel(alert.nivelAlerta);
            const isRuptura = alert.indiceRisco === 100;

            return (
              <div key={index} style={{
                padding: '0.625rem 0.75rem',
                border: `1px solid ${isRuptura ? '#fca5a5' : level.color + '30'}`,
                borderLeft: `4px solid ${isRuptura ? '#dc2626' : level.color}`,
                borderRadius: '0.375rem',
                backgroundColor: isRuptura ? '#fff5f5' : `${level.color}08`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{
                      padding: '0.1rem 0.4rem', borderRadius: '9999px',
                      backgroundColor: isRuptura ? '#dc2626' : level.color,
                      color: 'white', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase',
                    }}>
                      {isRuptura ? '🚨 RUPTURA' : level.text}
                    </span>
                    {alert.amplificado && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.65rem', color: '#c2410c', fontWeight: '700' }}>
                        <Zap size={9} /> ×1,20
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{formatDateBR(alert.timestamp)}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#4b5563' }}>
                  <span>💧 <strong>{parseFloat(alert.umidadeSolo || 0).toFixed(1)}%</strong></span>
                  <span>⚠️ FR <strong style={{ color: isRuptura ? '#dc2626' : level.color }}>{fmtRisco(alert)}</strong></span>
                  {alert.confiabilidade != null && (
                    <span style={{ marginLeft: 'auto', color: alert.confiabilidade >= 90 ? '#16a34a' : alert.confiabilidade >= 70 ? '#d97706' : '#dc2626', fontWeight: '600' }}>
                      🎯 {alert.confiabilidade}%
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {alerts.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.625rem', borderTop: '1px solid #f3f4f6', textAlign: 'right' }}>
          <a href="/alertas" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
            Ver Central de Alertas <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}