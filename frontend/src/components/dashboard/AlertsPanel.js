// Painel de alertas recentes
// ============= src/components/dashboard/AlertsPanel.js =============
'use client';

import { useState } from 'react';
import { formatDate, getAlertLevel } from '@/utils';
import Button from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

export default function AlertsPanel({ alerts = [], onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          {alerts.length} alertas encontrados
        </span>
        
        <Button
          variant="outline"
          size="small"
          onClick={handleRefresh}
          loading={loading}
        >
          <RefreshCw size={14} />
          Atualizar
        </Button>
      </div>

      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {alerts.length === 0 ? (
          <div className="text-center" style={{ 
            padding: '2rem', 
            color: 'var(--gray-500)' 
          }}>
            <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
            <p>Nenhum alerta crítico</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.map((alert, index) => {
              const level = getAlertLevel(alert.nivelAlerta);
              
              return (
                <div 
                  key={index}
                  style={{
                    padding: '0.75rem',
                    border: `1px solid ${level.color}30`,
                    borderLeft: `4px solid ${level.color}`,
                    borderRadius: '0.375rem',
                    backgroundColor: `${level.color}10`
                  }}
                >
                  <div className="flex-between">
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          backgroundColor: level.color,
                          color: 'white',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {level.text}
                        </span>
                        
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--gray-500)'
                        }}>
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                        Umidade: {alert.umidadeSolo}% | 
                        Risco: {alert.riscoIntegrado}%
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="small"
                      style={{ padding: '0.25rem' }}
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}