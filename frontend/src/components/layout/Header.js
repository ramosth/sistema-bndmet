// Cabeçalho com sino de alertas funcional e status corrigido
// ============= src/components/layout/Header.js =============
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { systemService, sensorService } from '@/services/api';
import { Bell, Wifi, WifiOff, Activity, AlertTriangle, Zap, X } from 'lucide-react';
import { formatDateBR, getAlertLevel } from '@/utils';

const fmtRisco = (alert) => {
  if (alert.indiceRisco != null)    return `${parseFloat(alert.indiceRisco).toFixed(1)}%`;
  if (alert.riscoIntegrado != null) return `${(parseFloat(alert.riscoIntegrado) * 100).toFixed(1)}%`;
  return '—';
};

export default function Header() {
  const { user } = useAuth();
  const [systemStatus,         setSystemStatus]         = useState(null);
  const [notifications,        setNotifications]        = useState([]);
  const [showNotifications,    setShowNotifications]    = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [currentTime,          setCurrentTime]          = useState(new Date());
  const dropdownRef = useRef(null);

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Health check a cada 30s
  // Aceita status 'healthy' (novo endpoint real) e 'online' (endpoint /api/status)
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await systemService.getHealth();
        setSystemStatus(res.data || res);
      } catch {
        setSystemStatus({ status: 'unhealthy' });
      }
    };
    checkHealth();
    const t = setInterval(checkHealth, 30000);
    return () => clearInterval(t);
  }, []);

  // Alertas a cada 60s
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await sensorService.getAlerts(10);
      setNotifications(response.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 60000);
    return () => clearInterval(t);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Status — suporta ambas as versões do endpoint
  const sStatus    = systemStatus?.status;
  const isOnline   = sStatus === 'healthy' || sStatus === 'online';
  const isDegraded = sStatus === 'degraded';
  const isLoading  = !systemStatus;

  const statusColor  = isLoading ? '#9ca3af' : isOnline ? '#16a34a' : isDegraded ? '#d97706' : '#dc2626';
  const statusBg     = isLoading ? '#f3f4f6' : isOnline ? '#f0fdf4'  : isDegraded ? '#fffbeb' : '#fef2f2';
  const statusBorder = isLoading ? '#e5e7eb' : isOnline ? '#bbf7d0'  : isDegraded ? '#fde68a' : '#fca5a5';
  const StatusIcon   = isLoading ? Activity  : isOnline ? Wifi       : WifiOff;
  const statusLabel  = isLoading ? 'Verificando...' : isOnline ? 'Online' : isDegraded ? 'Degradado' : 'Offline';

  // Badge: apenas alertas críticos (VERMELHO ou RUPTURA) das últimas 24h
  const agora24h = Date.now() - 24 * 60 * 60 * 1000;
  const alertasCriticos = notifications.filter(a => {
    const isCritico = a.nivelAlerta === 'VERMELHO' || a.indiceRisco === 100;
    const isRecente = new Date(a.timestamp).getTime() >= agora24h;
    return isCritico && isRecente;
  }).length;

  const horaAtual = currentTime.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  return (
    <header className="header">
      {/* Esquerda: status + relógio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.3rem 0.75rem',
          backgroundColor: statusBg, border: `1px solid ${statusBorder}`, borderRadius: '9999px',
        }}>
          <StatusIcon size={14} color={statusColor} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ height: '1rem', width: '1px', backgroundColor: '#e5e7eb' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Activity size={13} color="#6b7280" />
          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
            {horaAtual}
          </span>
        </div>
      </div>

      {/* Direita: sino + usuário */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

        {/* Sino */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            style={{
              position: 'relative', padding: '0.5rem',
              backgroundColor: showNotifications ? '#eff6ff' : 'transparent',
              border: `1px solid ${showNotifications ? '#bfdbfe' : 'transparent'}`,
              borderRadius: '0.375rem', cursor: 'pointer',
              color: alertasCriticos > 0 ? '#dc2626' : '#6b7280',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = showNotifications ? '#eff6ff' : 'transparent'; }}
            title="Alertas do sistema"
          >
            <Bell size={18} />
            {alertasCriticos > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                minWidth: '16px', height: '16px', padding: '0 3px',
                backgroundColor: '#dc2626', color: 'white',
                borderRadius: '9999px', fontSize: '0.6rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white',
              }}>
                {alertasCriticos > 9 ? '9+' : alertasCriticos}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
              width: '340px', maxHeight: '480px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb', borderRadius: '0.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              zIndex: 1000, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Header */}
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>
                    Alertas do Sistema
                  </span>
                  <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    {notifications.length > 0 ? `${notifications.length} recentes` : 'nenhum alerta'}
                  </span>
                </div>
                <button onClick={() => setShowNotifications(false)} style={{ padding: '0.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9ca3af', borderRadius: '0.25rem' }}>
                  <X size={14} />
                </button>
              </div>

              {/* Lista */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {loadingNotifications ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
                    Carregando alertas...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    <AlertTriangle size={24} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>Nenhum alerta crítico encontrado</p>
                  </div>
                ) : (
                  notifications.map((alert, i) => {
                    const level     = getAlertLevel(alert.nivelAlerta);
                    const isRuptura = alert.indiceRisco === 100;
                    return (
                      <div key={i}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: i < notifications.length - 1 ? '1px solid #f9fafb' : 'none',
                          borderLeft: `3px solid ${isRuptura ? '#dc2626' : level.color}`,
                          backgroundColor: isRuptura ? '#fff5f5' : 'white',
                          transition: 'background 0.1s',
                          cursor: 'default',
                        }}
                        onMouseEnter={e => { if (!isRuptura) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isRuptura ? '#fff5f5' : 'white'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: isRuptura ? '#dc2626' : level.color, color: 'white', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>
                              {isRuptura ? '🚨 RUPTURA' : level.text}
                            </span>
                            {alert.amplificado && (
                              <span style={{ fontSize: '0.65rem', color: '#c2410c', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                                <Zap size={9} /> ×1,20
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                            {formatDateBR(alert.timestamp)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#4b5563' }}>
                          <span>💧 <strong>{parseFloat(alert.umidadeSolo || 0).toFixed(1)}%</strong></span>
                          <span>⚠️ FR <strong style={{ color: isRuptura ? '#dc2626' : level.color }}>{fmtRisco(alert)}</strong></span>
                          {alert.confiabilidade != null && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: '600', color: alert.confiabilidade >= 90 ? '#16a34a' : alert.confiabilidade >= 70 ? '#d97706' : '#dc2626' }}>
                              🎯 {alert.confiabilidade}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rodapé */}
              <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                  Atualizado a cada 60s
                </span>
                <a href="/alertas" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                  Ver todos →
                </a>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: '1.5rem', width: '1px', backgroundColor: '#e5e7eb' }} />

        {/* Usuário */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '50%',
            backgroundColor: 'var(--primary-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.875rem', fontWeight: '600',
          }}>
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: '#111827' }}>
              {user?.nome}
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>
              {user?.perfil === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}