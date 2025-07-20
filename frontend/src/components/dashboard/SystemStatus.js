// Status do sistema
// ============= src/components/dashboard/SystemStatus.js =============
'use client';

import { Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react';

export default function SystemStatus({ status }) {
  if (!status) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--gray-100)',
        borderRadius: '0.5rem',
        border: '1px solid var(--gray-200)'
      }}>
        <Activity size={16} color="var(--gray-400)" />
        <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
          Verificando...
        </span>
      </div>
    );
  }

  const isHealthy = status.status === 'healthy';
  const icon = isHealthy ? <Wifi size={16} /> : <WifiOff size={16} />;
  const color = isHealthy ? 'var(--green-500)' : 'var(--red-500)';
  const bgColor = isHealthy ? 'var(--green-50)' : 'var(--red-50)';
  const borderColor = isHealthy ? 'var(--green-200)' : 'var(--red-200)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: bgColor,
      borderRadius: '0.5rem',
      border: `1px solid ${borderColor}`
    }}>
      <div style={{ color }}>
        {icon}
      </div>
      
      <span style={{ 
        fontSize: '0.875rem', 
        color, 
        fontWeight: '500' 
      }}>
        {isHealthy ? 'Sistema Online' : 'Sistema Offline'}
      </span>
      
      {status.uptime && (
        <>
          <div style={{
            height: '1rem',
            width: '1px',
            backgroundColor: 'var(--gray-300)'
          }} />
          
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--gray-500)' 
          }}>
            Uptime: {Math.floor(status.uptime / 3600)}h
          </span>
        </>
      )}
    </div>
  );
}