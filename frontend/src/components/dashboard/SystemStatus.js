// Status do sistema com countdown de atualização
// ============= src/components/dashboard/SystemStatus.js =============
'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, RefreshCw } from 'lucide-react';

export default function SystemStatus({ status, lastUpdate, nextUpdateIn = 30 }) {
  const [countdown, setCountdown] = useState(nextUpdateIn);

  useEffect(() => { setCountdown(nextUpdateIn); }, [lastUpdate, nextUpdateIn]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const formatLastUpdate = (ts) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  };

  const isHealthy = status?.status === 'online' || status?.status === 'healthy';
  const isLoading = !status;

  const color  = isLoading ? '#9ca3af' : isHealthy ? '#16a34a' : '#dc2626';
  const bg     = isLoading ? '#f3f4f6' : isHealthy ? '#f0fdf4'  : '#fef2f2';
  const border = isLoading ? '#e5e7eb' : isHealthy ? '#bbf7d0'  : '#fca5a5';
  const Icon   = isLoading ? Activity  : isHealthy ? Wifi       : WifiOff;
  const label  = isLoading ? 'Verificando...' : isHealthy ? 'Online' : 'Offline';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
      {/* Pill de status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '9999px',
      }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color }}>{label}</span>
      </div>

      {/* Timestamp */}
      {formatLastUpdate(lastUpdate) && (
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          Atualizado às {formatLastUpdate(lastUpdate)}
        </span>
      )}

      {/* Countdown */}
      {isHealthy && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <RefreshCw size={12} color="#9ca3af" />
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
            {countdown}s
          </span>
        </div>
      )}
    </div>
  );
}