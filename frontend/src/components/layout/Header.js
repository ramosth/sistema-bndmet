// Cabeçalho com informações do usuário
// ============= src/components/layout/Header.js =============
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { systemService } from '@/services/api';
import { Bell, Wifi, WifiOff, Activity } from 'lucide-react';
import { formatDate } from '@/utils';

export default function Header() {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Atualizar hora a cada segundo
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Verificar status do sistema a cada 30 segundos
    const checkSystemHealth = async () => {
      try {
        const health = await systemService.getHealth();
        setSystemStatus(health);
      } catch (error) {
        setSystemStatus({ status: 'error' });
      }
    };

    checkSystemHealth();
    const healthInterval = setInterval(checkSystemHealth, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(healthInterval);
    };
  }, []);

  const getStatusColor = () => {
    if (!systemStatus) return 'var(--gray-400)';
    return systemStatus.status === 'healthy' ? 'var(--green-500)' : 'var(--red-500)';
  };

  const getStatusIcon = () => {
    if (!systemStatus) return <WifiOff size={16} />;
    return systemStatus.status === 'healthy' ? <Wifi size={16} /> : <WifiOff size={16} />;
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getStatusIcon()}
          <span style={{ 
            fontSize: '0.875rem', 
            color: getStatusColor(),
            fontWeight: '500'
          }}>
            {systemStatus?.status === 'healthy' ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div style={{ 
          height: '1rem', 
          width: '1px', 
          backgroundColor: 'var(--gray-300)' 
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Activity size={14} color="var(--primary-blue)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            {formatDate(currentTime)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              color: 'var(--gray-600)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--gray-100)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                width: '0.5rem',
                height: '0.5rem',
                backgroundColor: 'var(--red-500)',
                borderRadius: '50%'
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: '20rem',
              maxHeight: '20rem',
              overflowY: 'auto',
              backgroundColor: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              marginTop: '0.5rem'
            }}>
              <div style={{ 
                padding: '1rem', 
                borderBottom: '1px solid var(--gray-200)',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}>
                Notificações
              </div>
              
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                Nenhuma notificação no momento
              </div>
            </div>
          )}
        </div>

        <div style={{ 
          height: '1.5rem', 
          width: '1px', 
          backgroundColor: 'var(--gray-300)' 
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--white)',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          
          <div>
            <p style={{ 
              margin: 0, 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: 'var(--gray-800)'
            }}>
              {user?.nome}
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              color: 'var(--gray-500)'
            }}>
              {user?.perfil === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}