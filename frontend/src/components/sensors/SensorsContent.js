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
import { Activity, Download, Filter, Calendar, RefreshCw, Cloud, Droplets, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SensorsContent() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
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
      let dataInicio, dataFim;
      
      if (filters.dataInicio && filters.dataFim) {
        // Usar filtros de data personalizados
        dataInicio = filters.dataInicio;
        dataFim = filters.dataFim;
      } else {
        // Calcular período baseado no botão selecionado
        const now = new Date();
        dataFim = now.toISOString();
        
        switch (selectedPeriod) {
          case '24h':
            dataInicio = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            break;
          case '7d':
            dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '30d':
            dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          default:
            dataInicio = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        }
      }

      // Chamada para API de período
      response = await sensorService.getReadingsByPeriod(
        dataInicio,
        dataFim,
        1, // página sempre 1 para carregar todos os dados
        1000 // limite alto para pegar todos os dados do período
      );
      
      setSensorData(response.data || []);
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
    
    // Converter datas para formato ISO com timezone UTC
    const startDate = new Date(filters.dataInicio);
    const endDate = new Date(filters.dataFim);
    
    // Validar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error('Formato de data inválido');
      return;
    }
    
    // Validar se data de início é anterior à data de fim
    if (startDate >= endDate) {
      toast.error('Data de início deve ser anterior à data de fim');
      return;
    }
    
    loadSensorData();
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Umidade Solo (%)', 'Precipitação 24h (mm)', 'Previsão 24h (mm)', 'Risco Integrado (%)', 'Nível Alerta'],
      ...filteredData.map(item => [
        new Date(item.timestamp).toLocaleString('pt-BR'),
        parseFloat(item.umidadeSolo) || 0,
        parseFloat(item.precipitacao24h) || 0,
        parseFloat(item.precipitacaoPrevisao24h) || 0,
        parseFloat(item.riscoIntegrado) || 0,
        item.nivelAlerta
      ])
    ].map(row => row.join(',')).join('\n');

    // Gerar nome do arquivo com data e hora atual
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-'); // dd-mm-yyyy
    const timeStr = now.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }).replace(/:/g, 'h'); // HHhMM
    
    const fileName = `dados_sensores_${dateStr}_${timeStr}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
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

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  // Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.nivelAlerta, selectedPeriod]);

  // Extrair dados da nova estrutura da API
  const sensorStats = stats?.geral?.estatisticas24h || {};
  const qualidadeStats = stats?.qualidadeDados || {};
  const ultimaLeitura = stats?.geral?.ultimaLeitura || {};

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

      {/* Cards de Estatísticas - Atualizados com nova API */}
      {stats && (
        <div className="grid grid-2 mb-4">
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
                  color: 'var(--primary-blue)',
                  margin: 0
                }}>
                  {sensorStats.totalLeituras || 0}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--gray-500)',
                  margin: '0.25rem 0 0 0'
                }}>
                  Últimas 24 horas
                </p>
              </div>
              <Activity size={24} color="var(--primary-blue)" />
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
                  color: sensorStats.alertasCriticos > 0 ? 'var(--red-500)' : 'var(--green-500)',
                  margin: 0
                }}>
                  {sensorStats.alertasCriticos || 0}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--gray-500)',
                  margin: '0.25rem 0 0 0'
                }}>
                  Período de 24h
                </p>
              </div>
              <AlertTriangle 
                size={24} 
                color={sensorStats.alertasCriticos > 0 ? 'var(--red-500)' : 'var(--green-500)'} 
              />
            </div>
          </Card>
        </div>
      )}

      {/* Nova seção: Métricas detalhadas */}
      {stats && (
        <div className="grid grid-4 mb-4">
          <Card>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Droplets size={32} color="var(--terracotta)" style={{ marginBottom: '0.5rem' }} />
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--terracotta)',
                margin: 0
              }}>
                {formatNumber(parseFloat(sensorStats.mediaUmidade) || 0)}%
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                margin: '0.25rem 0 0 0'
              }}>
                Umidade Média
              </p>
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--gray-500)',
                margin: '0.25rem 0 0 0'
              }}>
                Período de 24h
              </p>
            </div>
          </Card>

          <Card>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Cloud size={32} color="var(--primary-blue-dark)" style={{ marginBottom: '0.5rem' }} />
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--primary-blue-dark)',
                margin: 0
              }}>
                {formatNumber(parseFloat(sensorStats.mediaPrecipitacao) || 0)}mm
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                margin: '0.25rem 0 0 0'
              }}>
                Precipitação Média
              </p>
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--gray-500)',
                margin: '0.25rem 0 0 0'
              }}>
                Período de 24h
              </p>
            </div>
          </Card>

          <Card>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Shield size={32} color="var(--red-500)" style={{ marginBottom: '0.5rem' }} />
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--red-500)',
                margin: 0
              }}>
                {formatNumber(parseFloat(sensorStats.mediaRisco) || 0)}%
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                margin: '0.25rem 0 0 0'
              }}>
                Risco Médio
              </p>
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--gray-500)',
                margin: '0.25rem 0 0 0'
              }}>
                Período de 24h
              </p>
            </div>
          </Card>

          <Card>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Activity size={32} color="var(--green-500)" style={{ marginBottom: '0.5rem' }} />
              <p style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--green-500)',
                margin: 0
              }}>
                {qualidadeStats.percentualSensorOk || 0}%
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                margin: '0.25rem 0 0 0'
              }}>
                Sensores OK
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Status da Última Leitura */}
      {ultimaLeitura.id && (
        <Card title="Status da Última Leitura" className="mb-4">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            padding: '1rem 0'
          }}>
            <div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--gray-500)', 
                margin: '0 0 0.25rem 0' 
              }}>
                Timestamp
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                margin: 0 
              }}>
                {new Date(ultimaLeitura.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>

            <div>
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
                Risco Atual
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                margin: 0,
                color: parseFloat(ultimaLeitura.riscoIntegrado) > 50 ? 'var(--red-600)' : 'var(--green-600)'
              }}>
                {ultimaLeitura.riscoIntegrado}%
              </p>
            </div>

            <div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--gray-500)', 
                margin: '0 0 0.25rem 0' 
              }}>
                Confiabilidade
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                margin: 0,
                color: ultimaLeitura.confiabilidade >= 90 ? 'var(--green-600)' : 
                       ultimaLeitura.confiabilidade >= 70 ? 'var(--yellow-600)' : 'var(--red-600)'
              }}>
                {ultimaLeitura.confiabilidade}%
              </p>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: 'var(--gray-50)', 
            borderRadius: '0.5rem' 
          }}>
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
        </Card>
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
                  color: selectedPeriod === period.id ? 'white' : 'var(--gray-700)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Filtro por Data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--gray-500)" />
            <Input
              type="datetime-local"
              value={filters.dataInicio}
              onChange={(e) => updateFilter('dataInicio', e.target.value)}
              style={{ fontSize: '0.875rem', width: '180px' }}
              max={new Date().toISOString().slice(0, 16)}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>até</span>
            <Input
              type="datetime-local"
              value={filters.dataFim}
              onChange={(e) => updateFilter('dataFim', e.target.value)}
              style={{ fontSize: '0.875rem', width: '180px' }}
              max={new Date().toISOString().slice(0, 16)}
            />
            <Button
              variant="outline"
              onClick={handleDateFilter}
              disabled={!filters.dataInicio || !filters.dataFim}
            >
              <Filter size={16} />
              Filtrar
            </Button>
          </div>

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
            <option value="VERDE">Verde</option>
            <option value="AMARELO">Amarelo</option>
            <option value="LARANJA">Laranja</option>
            <option value="VERMELHO">Vermelho</option>
          </select>

          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!filters.dataInicio && !filters.dataFim && filters.nivelAlerta === 'all'}
          >
            <RefreshCw size={16} />
            Limpar
          </Button>
        </div>
      </Card>

      {/* Gráfico de Dados */}
      <Card title="Gráfico de Dados" className="mb-4">
        {loading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <SensorChart data={filteredData} />
        )}
      </Card>

      {/* Tabela de Dados com Paginação */}
      <Card title={`Dados dos Sensores (${filteredData.length} registros)`}>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : sensorData.length === 0 ? (
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
          <>
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
                      Precipitação 24h (mm)
                    </th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--gray-700)'
                    }}>
                      Previsão 24h (mm)
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
                  {getCurrentPageData().map((item, index) => {
                    const alertLevel = getAlertLevel(item.nivelAlerta);
                    
                    return (
                      <tr 
                        key={item.id || index}
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
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </td>
                        
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--terracotta)'
                        }}>
                          {formatNumber(parseFloat(item.umidadeSolo) || 0)}%
                        </td>
                        
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--primary-blue)'
                        }}>
                          {formatNumber(parseFloat(item.precipitacao24h) || 0)}mm
                        </td>
                        
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--primary-blue-light)',
                          fontStyle: 'italic'
                        }}>
                          {formatNumber(parseFloat(item.precipitacaoPrevisao24h) || 0)}mm
                        </td>
                        
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--red-500)'
                        }}>
                          {formatNumber(parseFloat(item.riscoIntegrado) || 0)}%
                        </td>
                        
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
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

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderTop: '1px solid var(--gray-200)',
                marginTop: '1rem'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    Anterior
                  </Button>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0 1rem'
                  }}>
                    <span style={{ fontSize: '0.875rem' }}>
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}