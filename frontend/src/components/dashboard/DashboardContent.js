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

  const sensorStats = stats?.sensors?.geral?.estatisticas24h || {};
  const ultimaLeitura = stats?.sensors?.geral?.ultimaLeitura || {};
  const userStats = stats?.users || {};

  // Calcular tendência das leituras (comparação simples)
  const calcularTendencia = (atual, anterior) => {
    if (!anterior || anterior === 0) return null;
    const percentual = ((atual - anterior) / anterior * 100).toFixed(1);
    return percentual > 0 ? `+${percentual}%` : `${percentual}%`;
  };

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
          trend={calcularTendencia(sensorStats.totalLeituras, sensorStats.totalLeituras * 0.9)} // Simulação de tendência
          status="normal"
        />
        
        <StatCard
          title="Umidade Média do Solo"
          value={`${formatNumber(parseFloat(sensorStats.mediaUmidade) || 0)}%`}
          icon={Droplets}
          color="var(--terracotta)"
          status={parseFloat(sensorStats.mediaUmidade) > 30 ? 'warning' : 'normal'}
        />
        
        <StatCard
          title="Risco Integrado"
          value={`${formatNumber(parseFloat(sensorStats.mediaRisco) || 0)}%`}
          icon={Shield}
          color="var(--red-500)"
          status={parseFloat(sensorStats.mediaRisco) > 50 ? 'critical' : 'normal'}
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

      {/* Resumo da Última Leitura */}
      {ultimaLeitura.id && (
        <div className="grid grid-3 mt-4">
          <Card title="Última Leitura">
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  Timestamp
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  margin: 0 
                }}>
                  {new Date(ultimaLeitura.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  Nível de Alerta
                </p>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: ultimaLeitura.nivelAlerta === 'VERDE' ? 'var(--green-100)' : 
                                 ultimaLeitura.nivelAlerta === 'AMARELO' ? 'var(--yellow-100)' : 'var(--red-100)',
                  color: ultimaLeitura.nivelAlerta === 'VERDE' ? 'var(--green-600)' : 
                         ultimaLeitura.nivelAlerta === 'AMARELO' ? 'var(--yellow-600)' : 'var(--red-600)'
                }}>
                  {ultimaLeitura.nivelAlerta}
                </span>
              </div>

              <div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  Recomendação
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {ultimaLeitura.recomendacao}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Dados Meteorológicos">
            <div style={{ padding: '1rem 0' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem' 
              }}>
                <div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    Temperatura
                  </p>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    margin: 0 
                  }}>
                    {ultimaLeitura.temperatura}°C
                  </p>
                </div>
                
                <div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    Umidade Externa
                  </p>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    margin: 0 
                  }}>
                    {ultimaLeitura.umidadeExterna}%
                  </p>
                </div>
                
                <div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    Pressão
                  </p>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    margin: 0 
                  }}>
                    {ultimaLeitura.pressaoAtmosferica} hPa
                  </p>
                </div>
                
                <div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    margin: '0 0 0.25rem 0' 
                  }}>
                    Vento
                  </p>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    margin: 0 
                  }}>
                    {ultimaLeitura.velocidadeVento} km/h
                  </p>
                </div>
              </div>
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  Condições
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  margin: 0 
                }}>
                  {ultimaLeitura.descricaoTempo}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Qualidade dos Dados">
            <div style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  BNDMET API
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: ultimaLeitura.statusApiBndmet === 'OK' ? 'var(--green-100)' : 'var(--red-100)',
                    color: ultimaLeitura.statusApiBndmet === 'OK' ? 'var(--green-600)' : 'var(--red-600)'
                  }}>
                    {ultimaLeitura.statusApiBndmet}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {ultimaLeitura.qualidadeDadosBndmet}%
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  Confiabilidade
                </p>
                <p style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  margin: 0,
                  color: ultimaLeitura.confiabilidade >= 90 ? 'var(--green-600)' : 
                         ultimaLeitura.confiabilidade >= 70 ? 'var(--yellow-600)' : 'var(--red-600)'
                }}>
                  {ultimaLeitura.confiabilidade}%
                </p>
              </div>
              
              <div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--gray-500)', 
                  margin: '0 0 0.25rem 0' 
                }}>
                  Status do Sensor
                </p>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: ultimaLeitura.sensorOk ? 'var(--green-100)' : 'var(--red-100)',
                  color: ultimaLeitura.sensorOk ? 'var(--green-600)' : 'var(--red-600)'
                }}>
                  {ultimaLeitura.sensorOk ? 'Funcionando' : 'Com Problemas'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}