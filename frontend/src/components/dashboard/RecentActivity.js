// Atividade recente
// ============= src/components/dashboard/RecentActivity.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService } from '@/services/api';
import { formatDate } from '@/utils';
import { Activity, User, AlertTriangle, Settings } from 'lucide-react';

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      const logs = await sensorService.getLogs(null, null, 10);
      setActivities(logs.data || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (componente) => {
    switch (componente) {
      case 'SENSOR': return Activity;
      case 'BNDMET': return AlertTriangle;
      case 'CONECTIVIDADE': return Settings;
      default: return Activity;
    }
  };

  const getActivityColor = (nivel) => {
    switch (nivel) {
      case 'ERROR': return 'var(--red-500)';
      case 'WARNING': return 'var(--yellow-500)';
      case 'INFO': return 'var(--primary-blue)';
      case 'CRITICAL': return 'var(--red-600)';
      default: return 'var(--gray-500)';
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '200px' }}>
        <div className="loading" />
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
      {activities.length === 0 ? (
        <div className="text-center" style={{ 
          padding: '2rem', 
          color: 'var(--gray-500)' 
        }}>
          <Activity size={32} style={{ marginBottom: '0.5rem' }} />
          <p>Nenhuma atividade recente</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.componente);
            const color = getActivityColor(activity.nivel);
            
            return (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--gray-50)'
                }}
              >
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: `${color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} color={color} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-800)',
                    marginBottom: '0.25rem'
                  }}>
                    {activity.mensagem || `Atividade ${activity.componente}`}
                  </div>
                  
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)'
                  }}>
                    {formatDate(activity.timestamp)} • {activity.componente}
                  </div>
                </div>
                
                <span style={{
                  padding: '0.125rem 0.5rem',
                  backgroundColor: `${color}20`,
                  color,
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {activity.nivel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}