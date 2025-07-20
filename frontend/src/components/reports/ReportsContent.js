// Geração de relatórios
// ============= src/components/reports/ReportsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService, userService } from '@/services/api';
import { formatDate, formatNumber, downloadFile } from '@/utils';
import { useFilters } from '@/hooks';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, Users, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsContent() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { filters, updateFilter } = useFilters({
    dataInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    tipoRelatorio: 'completo'
  });

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    if (!filters.dataInicio || !filters.dataFim) {
      toast.error('Selecione as datas de início e fim');
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date(filters.dataInicio).toISOString();
      const endDate = new Date(filters.dataFim + 'T23:59:59').toISOString();

      const [sensorData, sensorStats, userStats] = await Promise.all([
        sensorService.getReadingsByPeriod(startDate, endDate, 1, 1000),
        sensorService.getStatistics(),
        userService.getUserStats()
      ]);

      const data = sensorData.data || [];
      
      // Calcular estatísticas do período
      const periodStats = calculatePeriodStats(data);
      
      setReportData({
        periodo: {
          inicio: filters.dataInicio,
          fim: filters.dataFim
        },
        sensores: {
          dados: data,
          estatisticas: periodStats,
          estatisticasGerais: sensorStats.data
        },
        usuarios: userStats.data,
        resumo: {
          totalLeituras: data.length,
          alertasCriticos: data.filter(item => 
            item.nivelAlerta === 'VERMELHO' || item.nivelAlerta === 'CRITICO'
          ).length,
          mediaUmidade: data.length > 0 ? 
            data.reduce((sum, item) => sum + item.umidadeSolo, 0) / data.length : 0,
          mediaRisco: data.length > 0 ? 
            data.reduce((sum, item) => sum + item.riscoIntegrado, 0) / data.length : 0
        }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriodStats = (data) => {
    if (data.length === 0) return {};

    const umidade = data.map(item => item.umidadeSolo);
    const temperatura = data.map(item => item.temperatura);
    const risco = data.map(item => item.riscoIntegrado);

    return {
      umidade: {
        media: umidade.reduce((a, b) => a + b, 0) / umidade.length,
        minima: Math.min(...umidade),
        maxima: Math.max(...umidade)
      },
      temperatura: {
        media: temperatura.reduce((a, b) => a + b, 0) / temperatura.length,
        minima: Math.min(...temperatura),
        maxima: Math.max(...temperatura)
      },
      risco: {
        media: risco.reduce((a, b) => a + b, 0) / risco.length,
        minima: Math.min(...risco),
        maxima: Math.max(...risco)
      },
      alertas: {
        verde: data.filter(item => item.nivelAlerta === 'VERDE').length,
        amarelo: data.filter(item => item.nivelAlerta === 'AMARELO').length,
        laranja: data.filter(item => item.nivelAlerta === 'LARANJA').length,
        vermelho: data.filter(item => item.nivelAlerta === 'VERMELHO').length
      }
    };
  };

  const exportToPDF = async () => {
    setGenerating(true);
    try {
      // Gerar relatório em HTML para exportação
      const htmlContent = generateHTMLReport();
      
      // Simular download (em produção, usar biblioteca de PDF)
      downloadFile(htmlContent, `relatorio_${filters.dataInicio}_${filters.dataFim}.html`, 'text/html');
      toast.success('Relatório HTML exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData?.sensores?.dados) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const csvContent = [
      ['Timestamp', 'Umidade Solo (%)', 'Temperatura (°C)', 'Risco Integrado (%)', 'Nível Alerta'],
      ...reportData.sensores.dados.map(item => [
        formatDate(item.timestamp),
        item.umidadeSolo,
        item.temperatura,
        item.riscoIntegrado,
        item.nivelAlerta
      ])
    ].map(row => row.join(',')).join('\n');

    downloadFile(csvContent, `dados_sensores_${filters.dataInicio}_${filters.dataFim}.csv`, 'text/csv');
    toast.success('Dados CSV exportados com sucesso!');
  };

  const generateHTMLReport = () => {
    if (!reportData) return '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Relatório BNDMET - ${filters.dataInicio} a ${filters.dataFim}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .section { margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Relatório de Monitoramento - BNDMET</h1>
            <p>Período: ${formatDate(filters.dataInicio)} a ${formatDate(filters.dataFim)}</p>
            <p>Gerado em: ${formatDate(new Date())}</p>
        </div>

        <div class="section">
            <h2>Resumo Executivo</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total de Leituras</h3>
                    <p>${reportData.resumo.totalLeituras}</p>
                </div>
                <div class="stat-card">
                    <h3>Alertas Críticos</h3>
                    <p>${reportData.resumo.alertasCriticos}</p>
                </div>
                <div class="stat-card">
                    <h3>Umidade Média</h3>
                    <p>${formatNumber(reportData.resumo.mediaUmidade)}%</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Estatísticas Detalhadas</h2>
            <table>
                <tr>
                    <th>Parâmetro</th>
                    <th>Média</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                </tr>
                <tr>
                    <td>Umidade do Solo (%)</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.umidade?.media || 0)}</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.umidade?.minima || 0)}</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.umidade?.maxima || 0)}</td>
                </tr>
                <tr>
                    <td>Temperatura (°C)</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.temperatura?.media || 0)}</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.temperatura?.minima || 0)}</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.temperatura?.maxima || 0)}</td>
                </tr>
                <tr>
                    <td>Risco Integrado (%)</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.risco?.media || 0)}</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.risco?.minima || 0)}</td>
                    <td>${formatNumber(reportData.sensores.estatisticas.risco?.maxima || 0)}</td>
                </tr>
            </table>
        </div>
    </body>
    </html>`;
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
            Relatórios
          </h1>
          <p style={{ 
            color: 'var(--gray-600)', 
            margin: '0.5rem 0 0 0' 
          }}>
            Gere e exporte relatórios detalhados do sistema
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={!reportData || loading}
          >
            <Download size={16} />
            CSV
          </Button>
          
          <Button
            variant="primary"
            onClick={exportToPDF}
            loading={generating}
            disabled={!reportData || loading}
          >
            <FileText size={16} />
            Exportar HTML
          </Button>
        </div>
      </div>

      {/* Configurações do Relatório */}
      <Card title="Configurações do Relatório" className="mb-4">
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          <Input
            label="Data de Início"
            type="date"
            value={filters.dataInicio}
            onChange={(e) => updateFilter('dataInicio', e.target.value)}
          />
          
          <Input
            label="Data de Fim"
            type="date"
            value={filters.dataFim}
            onChange={(e) => updateFilter('dataFim', e.target.value)}
          />
          
          <div className="form-group">
            <label className="form-label">Tipo de Relatório</label>
            <select
              className="form-input"
              value={filters.tipoRelatorio}
              onChange={(e) => updateFilter('tipoRelatorio', e.target.value)}
            >
              <option value="completo">Completo</option>
              <option value="sensores">Apenas Sensores</option>
              <option value="alertas">Apenas Alertas</option>
              <option value="usuarios">Apenas Usuários</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <Button
            variant="primary"
            onClick={generateReport}
            loading={loading}
            disabled={loading}
          >
            <BarChart3 size={16} />
            Gerar Relatório
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <LoadingSpinner size="large" />
        </div>
      ) : reportData ? (
        <>
          {/* Resumo Executivo */}
          <Card title="Resumo Executivo" className="mb-4">
            <div className="grid grid-4" style={{ gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--primary-blue)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--primary-blue)'
                }}>
                  {reportData.resumo.totalLeituras}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  marginTop: '0.25rem'
                }}>
                  Total de Leituras
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--red-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--red-500)'
                }}>
                  {reportData.resumo.alertasCriticos}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  marginTop: '0.25rem'
                }}>
                  Alertas Críticos
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--terracotta)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--terracotta)'
                }}>
                  {formatNumber(reportData.resumo.mediaUmidade)}%
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  marginTop: '0.25rem'
                }}>
                  Umidade Média
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--yellow-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--yellow-500)'
                }}>
                  {formatNumber(reportData.resumo.mediaRisco)}%
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  marginTop: '0.25rem'
                }}>
                  Risco Médio
                </div>
              </div>
            </div>
          </Card>

          {/* Estatísticas Detalhadas */}
          {reportData.sensores.estatisticas && (
            <Card title="Estatísticas Detalhadas" className="mb-4">
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
                        Parâmetro
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Média
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Mínimo
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Máximo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                        Umidade do Solo (%)
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--terracotta)' }}>
                        {formatNumber(reportData.sensores.estatisticas.umidade?.media || 0)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {formatNumber(reportData.sensores.estatisticas.umidade?.minima || 0)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {formatNumber(reportData.sensores.estatisticas.umidade?.maxima || 0)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                        Temperatura (°C)
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--primary-blue)' }}>
                        {formatNumber(reportData.sensores.estatisticas.temperatura?.media || 0)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {formatNumber(reportData.sensores.estatisticas.temperatura?.minima || 0)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {formatNumber(reportData.sensores.estatisticas.temperatura?.maxima || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                        Risco Integrado (%)
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--red-500)' }}>
                        {formatNumber(reportData.sensores.estatisticas.risco?.media || 0)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {formatNumber(reportData.sensores.estatisticas.risco?.minima || 0)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {formatNumber(reportData.sensores.estatisticas.risco?.maxima || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Distribuição de Alertas */}
          {reportData.sensores.estatisticas?.alertas && (
            <Card title="Distribuição de Alertas" className="mb-4">
              <div className="grid grid-4" style={{ gap: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--green-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--green-500)'
                  }}>
                    {reportData.sensores.estatisticas.alertas.verde}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    Normal (Verde)
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--yellow-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--yellow-500)'
                  }}>
                    {reportData.sensores.estatisticas.alertas.amarelo}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    Atenção (Amarelo)
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--orange-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--orange-500)'
                  }}>
                    {reportData.sensores.estatisticas.alertas.laranja}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    Alerta (Laranja)
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--red-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--red-500)'
                  }}>
                    {reportData.sensores.estatisticas.alertas.vermelho}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    Crítico (Vermelho)
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center" style={{ padding: '3rem' }}>
          <FileText size={48} color="var(--gray-400)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-700)' }}>
            Nenhum relatório gerado
          </h3>
          <p style={{ margin: 0, color: 'var(--gray-500)' }}>
            Configure as datas e clique em "Gerar Relatório" para visualizar os dados.
          </p>
        </div>
      )}
    </div>
  );
}