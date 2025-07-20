// Conteúdo principal do dashboard
// ============= src/components/dashboard/DashboardContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { useRealTimeData } from '@/hooks';
import { sensorService, userService } from '@/services/api';
import { formatNumber } from '@/utils';
import StatCard from './StatCard';
import SensorChart from './SensorChart';
import AlertsPanel from './AlertsPanel';
import SystemStatus from './SystemStatus';
import RecentActivity from './RecentActivity';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Activity, Users, AlertTriangle, Shield, Droplets } from 'lucide-react';

export default function DashboardContent() {
  const [stats, setStats] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: realTimeData, loading: realTimeLoading } = useRealTimeData(30000);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sensorStats, userStats, latestReadings, criticalAlerts] = await Promise.all([
        sensorService.getStatistics(),
        userService.getUserStats(),
        sensorService.getLatestReadings(50),
        sensorService.getAlerts(10)
      ]);

      setStats({
        sensors: sensorStats.data,
        users: userStats.data
      });
      setSensorData(latestReadings.data || []);
      setAlerts(criticalAlerts.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const sensorStats = stats?.sensors || {};
  const userStats = stats?.users || {};

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--gray-800)',
            margin: 0 
          }}>
            Dashboard
          </h1>
          <p style={{ 
            color: 'var(--gray-600)', 
            margin: '0.5rem 0 0 0' 
          }}>
            Monitoramento em tempo real da barragem
          </p>
        </div>
        
        <SystemStatus status={realTimeData?.system} />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-4 mb-4">
        <StatCard
          title="Leituras Hoje"
          value={sensorStats.totalLeituras || 0}
          icon={Activity}
          color="var(--primary-blue)"
          trend="+12%"
        />
        
        <StatCard
          title="Umidade Média"
          value={`${formatNumber(sensorStats.mediaUmidade || 0)}%`}
          icon={Droplets}
          color="var(--terracotta)"
          status={sensorStats.mediaUmidade > 30 ? 'warning' : 'normal'}
        />
        
        <StatCard
          title="Risco Integrado"
          value={`${formatNumber(sensorStats.mediaRisco || 0)}%`}
          icon={Shield}
          color="var(--red-500)"
          status={sensorStats.mediaRisco > 50 ? 'critical' : 'normal'}
        />
        
        <StatCard
          title="Alertas Críticos"
          value={sensorStats.alertasCriticos || 0}
          icon={AlertTriangle}
          color="var(--yellow-500)"
          status={sensorStats.alertasCriticos > 0 ? 'warning' : 'normal'}
        />
      </div>

      <div className="grid grid-2 mb-4">
        {/* Gráfico de Sensores */}
        <Card title="Dados dos Sensores - Últimas 24h">
          <SensorChart data={sensorData} />
        </Card>

        {/* Painel de Alertas */}
        <Card title="Alertas Recentes">
          <AlertsPanel alerts={alerts} onRefresh={loadDashboardData} />
        </Card>
      </div>

      <div className="grid grid-2">
        {/* Atividade Recente */}
        <Card title="Atividade Recente">
          <RecentActivity />
        </Card>

        {/* Estatísticas de Usuários */}
        <Card title="Usuários do Sistema">
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--gray-50)',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--primary-blue)'
              }}>
                {userStats.totalAdminsAtivos || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginTop: '0.25rem'
              }}>
                Administradores
              </div>
            </div>
            
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--gray-50)',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--terracotta)'
              }}>
                {userStats.totalBasicosAtivos || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginTop: '0.25rem'
              }}>
                Usuários Básicos
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}