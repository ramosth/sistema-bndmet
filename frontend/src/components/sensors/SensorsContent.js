// Monitoramento de sensores
// ============= src/components/sensors/SensorsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService } from '@/services/api';
import { useFilters, usePagination } from '@/hooks';
import { formatDate, formatNumber, getAlertLevel } from '@/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SensorChart from '@/components/dashboard/SensorChart';
import { Activity, Download, Filter, Calendar, RefreshCw, Thermometer, Droplets, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SensorsContent() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  
  const pagination = usePagination(1, 100);
  const { filters, updateFilter, clearFilters } = useFilters({
    dataInicio: '',
    dataFim: '',
    nivelAlerta: 'all'
  });

  useEffect(() => {
    loadSensorData();
    loadSensorStats();
  }, [selectedPeriod, filters]);

  const loadSensorData = async () => {
    setLoading(true);
    try {
      let response;
      
      if (filters.dataInicio && filters.dataFim) {
        response = await sensorService.getReadingsByPeriod(
          filters.dataInicio,
          filters.dataFim,
          pagination.page,
          pagination.limit
        );
      } else {
        const limite = selectedPeriod === '24h' ? 100 : 
                     selectedPeriod === '7d' ? 500 : 1000;
        response = await sensorService.getLatestReadings(limite);
      }
      
      setSensorData(response.data || []);
      if (response.total) {
        pagination.setTotal(response.total);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos sensores:', error);
      toast.error('Erro ao carregar dados dos sensores');
    } finally {
      setLoading(false);
    }
  };

  const loadSensorStats = async () => {
    try {
      const response = await sensorService.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    clearFilters();
  };

  const handleDateFilter = () => {
    if (!filters.dataInicio || !filters.dataFim) {
      toast.error('Selecione as datas de início e fim');
      return;
    }
    loadSensorData();
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Umidade Solo (%)', 'Temperatura (°C)', 'Risco Integrado (%)', 'Nível Alerta'],
      ...sensorData.map(item => [
        formatDate(item.timestamp),
        item.umidadeSolo,
        item.temperatura,
        item.riscoIntegrado,
        item.nivelAlerta
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dados_sensores_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filterByAlertLevel = (level) => {
    if (level === 'all') return sensorData;
    return sensorData.filter(item => item.nivelAlerta === level);
  };

  const filteredData = filterByAlertLevel(filters.nivelAlerta);

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
            Monitoramento de Sensores
          </h1>
          <p style={{ 
            color: 'var(--gray-600)', 
            margin: '0.5rem 0 0 0' 
          }}>
            Dados em tempo real dos sensores da barragem
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            onClick={loadSensorData}
            loading={loading}
          >
            <RefreshCw size={16} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            onClick={exportData}
            disabled={sensorData.length === 0}
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-4 mb-4">
          <Card>
            <div className="flex-between">
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  margin: '0 0 0.5rem 0'
                }}>
                  Total de Leituras
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--red-500)',
                  margin: 0
                }}>
                  {formatNumber(stats.mediaRisco || 0)}%
                </p>
              </div>
              <Shield size={24} color="var(--red-500)" />
            </div>
          </Card>
          
          <Card>
            <div className="flex-between">
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  margin: '0 0 0.5rem 0'
                }}>
                  Alertas Críticos
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--yellow-500)',
                  margin: 0
                }}>
                  {stats.alertasCriticos || 0}
                </p>
              </div>
              <AlertTriangle size={24} color="var(--yellow-500)" />
            </div>
          </Card>
        </div>
      )}

      {/* Filtros e Período */}
      <Card className="mb-4">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Seletor de Período */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: '24h', label: 'Últimas 24h' },
              { id: '7d', label: 'Últimos 7 dias' },
              { id: '30d', label: 'Últimos 30 dias' }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => handlePeriodChange(period.id)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '0.375rem',
                  backgroundColor: selectedPeriod === period.id ? 'var(--primary-blue)' : 'white',
                  color: selectedPeriod === period.id ? 'white' : 'var(--gray-600)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>

          <div style={{
            height: '1.5rem',
            width: '1px',
            backgroundColor: 'var(--gray-300)'
          }} />

          {/* Filtro por Data */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Input
              type="datetime-local"
              value={filters.dataInicio}
              onChange={(e) => updateFilter('dataInicio', e.target.value)}
              style={{ margin: 0, width: '200px' }}
            />
            <span style={{ color: 'var(--gray-500)' }}>até</span>
            <Input
              type="datetime-local"
              value={filters.dataFim}
              onChange={(e) => updateFilter('dataFim', e.target.value)}
              style={{ margin: 0, width: '200px' }}
            />
            <Button
              variant="outline"
              onClick={handleDateFilter}
              disabled={!filters.dataInicio || !filters.dataFim}
            >
              <Calendar size={16} />
              Filtrar
            </Button>
          </div>

          <div style={{
            height: '1.5rem',
            width: '1px',
            backgroundColor: 'var(--gray-300)'
          }} />

          {/* Filtro por Nível de Alerta */}
          <select
            value={filters.nivelAlerta}
            onChange={(e) => updateFilter('nivelAlerta', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">Todos os níveis</option>
            <option value="VERDE">Verde (Normal)</option>
            <option value="AMARELO">Amarelo (Atenção)</option>
            <option value="LARANJA">Laranja (Alerta)</option>
            <option value="VERMELHO">Vermelho (Crítico)</option>
          </select>

          <Button
            variant="outline"
            onClick={clearFilters}
          >
            <Filter size={16} />
            Limpar
          </Button>
        </div>
      </Card>

      {/* Gráfico */}
      <Card title="Gráfico de Dados" className="mb-4">
        {loading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <SensorChart data={filteredData} />
        )}
      </Card>

      {/* Tabela de Dados */}
      <Card title={`Dados dos Sensores (${filteredData.length} registros)`}>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <Activity size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-700)' }}>
              Nenhum dado encontrado
            </h3>
            <p style={{ margin: 0, color: 'var(--gray-500)' }}>
              Não há dados de sensores para o período selecionado.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Timestamp
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Umidade Solo (%)
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Temperatura (°C)
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Risco Integrado (%)
                  </th>
                  <th style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Nível de Alerta
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => {
                  const alertLevel = getAlertLevel(item.nivelAlerta);
                  
                  return (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid var(--gray-100)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--gray-600)'
                      }}>
                        {formatDate(item.timestamp)}
                      </td>
                      
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--terracotta)'
                      }}>
                        {formatNumber(item.umidadeSolo)}%
                      </td>
                      
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--primary-blue)'
                      }}>
                        {formatNumber(item.temperatura)}°C
                      </td>
                      
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--red-500)'
                      }}>
                        {formatNumber(item.riscoIntegrado)}%
                      </td>
                      
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: `${alertLevel.color}20`,
                          color: alertLevel.color
                        }}>
                          {alertLevel.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}