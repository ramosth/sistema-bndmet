// Geração de relatórios - VERSÃO FINAL (baseada apenas na API de período)
// ============= src/components/reports/ReportsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService } from '@/services/api';
import { formatDate, formatNumber, downloadFile } from '@/utils';
import { useFilters } from '@/hooks';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FileText, Download, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsContent() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { filters, updateFilter } = useFilters({
    dataInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0]
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
      // 🔄 CORRIGIDO: Usar datas locais sem conversão de timezone
      const startDate = filters.dataInicio + 'T00:00:00';
      const endDate = filters.dataFim + 'T23:59:59';

      console.log('📅 Datas enviadas para API (sem conversão timezone):', {
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
        startDateLocal: startDate,
        endDateLocal: endDate
      });

      // Usar apenas API de período
      const sensorData = await sensorService.getReadingsByPeriod(startDate, endDate, 1, 1000);
      const data = sensorData.data || [];
      
      console.log('📊 Dados recebidos da API:', {
        totalRegistros: data.length,
        primeiroRegistro: data[0]?.timestamp,
        ultimoRegistro: data[data.length - 1]?.timestamp
      });

      // Calcular todas as estatísticas baseadas nos dados do período
      const estatisticas = calculatePeriodStats(data);
      
      setReportData({
        periodo: {
          inicio: filters.dataInicio,
          fim: filters.dataFim
        },
        sensores: {
          dados: data,
          estatisticas: estatisticas
        },
        resumo: {
          totalLeituras: data.length,
          alertasCriticos: estatisticas.alertas.vermelho,
          mediaUmidade: estatisticas.umidade?.media || 0,
          mediaRisco: estatisticas.risco?.media || 0,
          precipitacaoMedia: estatisticas.precipitacao?.media || 0
        }
      });

      console.log('📈 Estatísticas calculadas:', estatisticas);

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 MODIFICADO: Calcular estatísticas completas baseadas nos dados do período
  const calculatePeriodStats = (data) => {
    if (data.length === 0) return {};

    // Extrair valores numéricos
    const umidade = data.map(item => parseFloat(item.umidadeSolo || 0)).filter(val => !isNaN(val));
    const temperatura = data.map(item => parseFloat(item.temperatura || 0)).filter(val => !isNaN(val));
    const risco = data.map(item => parseFloat(item.riscoIntegrado || 0)).filter(val => !isNaN(val));
    const precipitacao = data.map(item => parseFloat(item.precipitacao24h || 0)).filter(val => !isNaN(val));
    const precipitacaoPrevisao = data.map(item => parseFloat(item.precipitacaoPrevisao24h || 0)).filter(val => !isNaN(val));
    const confiabilidade = data.map(item => parseFloat(item.confiabilidade || 0)).filter(val => !isNaN(val));

    // Função auxiliar para calcular min/max/média
    const calcStats = (arr) => {
      if (arr.length === 0) return { media: 0, minima: 0, maxima: 0 };
      return {
        media: arr.reduce((a, b) => a + b, 0) / arr.length,
        minima: Math.min(...arr),
        maxima: Math.max(...arr)
      };
    };

    return {
      umidade: calcStats(umidade),
      temperatura: calcStats(temperatura),
      risco: calcStats(risco),
      precipitacao: calcStats(precipitacao),
      precipitacaoPrevisao: calcStats(precipitacaoPrevisao),
      confiabilidade: calcStats(confiabilidade),
      alertas: {
        verde: data.filter(item => item.nivelAlerta === 'VERDE').length,
        amarelo: data.filter(item => item.nivelAlerta === 'AMARELO').length,
        vermelho: data.filter(item => item.nivelAlerta === 'VERMELHO' || item.nivelAlerta === 'CRITICO').length
      },
      sensores: {
        sensorOk: data.filter(item => item.sensorOk === true).length,
        apiBndmetOk: data.filter(item => item.statusApiBndmet === 'OK').length,
        totalLeituras: data.length
      }
    };
  };

  const exportToPDF = async () => {
    setGenerating(true);
    try {
      const htmlContent = generateHTMLReport();
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
      [
        'Timestamp', 'Umidade Solo (%)', 'Temperatura (°C)', 'Risco Integrado (%)', 
        'Precipitação 24h (mm)', 'Precipitação Previsão 24h (mm)', 'Nível Alerta', 
        'Confiabilidade (%)', 'Status Sensor', 'Status API BNDMET'
      ],
      ...reportData.sensores.dados.map(item => [
        formatDate(item.timestamp),
        item.umidadeSolo,
        item.temperatura,
        item.riscoIntegrado,
        item.precipitacao24h,
        item.precipitacaoPrevisao24h,
        item.nivelAlerta,
        item.confiabilidade,
        item.sensorOk ? 'OK' : 'Erro',
        item.statusApiBndmet
      ])
    ].map(row => row.join(',')).join('\n');

    downloadFile(csvContent, `dados_sensores_${filters.dataInicio}_${filters.dataFim}.csv`, 'text/csv');
    toast.success('Dados CSV exportados com sucesso!');
  };

  const generateHTMLReport = () => {
    if (!reportData) return '';

    const stats = reportData.sensores.estatisticas;

    return `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório do Sistema - ${formatDate(reportData.periodo.inicio)} a ${formatDate(reportData.periodo.fim)}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin: 30px 0; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
            .stat-card h3 { margin: 0 0 10px 0; color: #333; }
            .stat-card p { font-size: 24px; font-weight: bold; margin: 0; color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .alert-critical { color: #dc2626; }
            .alert-warning { color: #d97706; }
            .alert-success { color: #16a34a; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Relatório do Sistema TCC IPRJ</h1>
            <p>Período: ${formatDate(reportData.periodo.inicio)} a ${formatDate(reportData.periodo.fim)}</p>
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
                    <p class="alert-critical">${reportData.resumo.alertasCriticos}</p>
                </div>
                <div class="stat-card">
                    <h3>Umidade Média</h3>
                    <p>${formatNumber(reportData.resumo.mediaUmidade)}%</p>
                </div>
                <div class="stat-card">
                    <h3>Risco Médio</h3>
                    <p>${formatNumber(reportData.resumo.mediaRisco)}%</p>
                </div>
                <div class="stat-card">
                    <h3>Precipitação Média</h3>
                    <p>${formatNumber(reportData.resumo.precipitacaoMedia)}mm</p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Estatísticas Detalhadas - Período Analisado</h2>
            <table>
                <tr>
                    <th>Parâmetro</th>
                    <th>Média</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                </tr>
                <tr>
                    <td>Umidade do Solo (%)</td>
                    <td>${formatNumber(stats.umidade?.media || 0)}</td>
                    <td>${formatNumber(stats.umidade?.minima || 0)}</td>
                    <td>${formatNumber(stats.umidade?.maxima || 0)}</td>
                </tr>
                <tr>
                    <td>Temperatura (°C)</td>
                    <td>${formatNumber(stats.temperatura?.media || 0)}</td>
                    <td>${formatNumber(stats.temperatura?.minima || 0)}</td>
                    <td>${formatNumber(stats.temperatura?.maxima || 0)}</td>
                </tr>
                <tr>
                    <td>Risco Integrado (%)</td>
                    <td>${formatNumber(stats.risco?.media || 0)}</td>
                    <td>${formatNumber(stats.risco?.minima || 0)}</td>
                    <td>${formatNumber(stats.risco?.maxima || 0)}</td>
                </tr>
                <tr>
                    <td>Precipitação 24h (mm)</td>
                    <td>${formatNumber(stats.precipitacao?.media || 0)}</td>
                    <td>${formatNumber(stats.precipitacao?.minima || 0)}</td>
                    <td>${formatNumber(stats.precipitacao?.maxima || 0)}</td>
                </tr>
                <tr>
                    <td>Confiabilidade (%)</td>
                    <td>${formatNumber(stats.confiabilidade?.media || 0)}</td>
                    <td>${formatNumber(stats.confiabilidade?.minima || 0)}</td>
                    <td>${formatNumber(stats.confiabilidade?.maxima || 0)}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>Distribuição de Alertas</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3 class="alert-success">Normal (Verde)</h3>
                    <p>${stats.alertas?.verde || 0}</p>
                </div>
                <div class="stat-card">
                    <h3 class="alert-warning">Atenção (Amarelo)</h3>
                    <p>${stats.alertas?.amarelo || 0}</p>
                </div>
                <div class="stat-card">
                    <h3 class="alert-critical">Crítico (Vermelho)</h3>
                    <p>${stats.alertas?.vermelho || 0}</p>
                </div>
            </div>
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: 'var(--gray-700)'
            }}>
              Data de Início
            </label>
            <Input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => updateFilter('dataInicio', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: 'var(--gray-700)'
            }}>
              Data de Fim
            </label>
            <Input
              type="date"
              value={filters.dataFim}
              onChange={(e) => updateFilter('dataFim', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <Button
          onClick={generateReport}
          loading={loading}
          icon={<BarChart3 size={16} />}
        >
          Gerar Relatório
        </Button>
      </Card>

      {/* Resultados do Relatório */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '3rem' 
        }}>
          <LoadingSpinner size="large" />
        </div>
      ) : reportData ? (
        <>
          {/* Resumo Executivo */}
          <Card title="Resumo Executivo" className="mb-4">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--blue-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--blue-500)',
                  marginBottom: '0.5rem'
                }}>
                  {reportData.resumo.totalLeituras}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Total de Leituras
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--red-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--red-500)',
                  marginBottom: '0.5rem'
                }}>
                  {reportData.resumo.alertasCriticos}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Alertas Críticos
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--green-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--green-500)',
                  marginBottom: '0.5rem'
                }}>
                  {formatNumber(reportData.resumo.mediaUmidade)}%
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Umidade Média
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--yellow-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--yellow-600)',
                  marginBottom: '0.5rem'
                }}>
                  {formatNumber(reportData.resumo.mediaRisco)}%
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Risco Médio
                </div>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--indigo-500)10',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--indigo-600)',
                  marginBottom: '0.5rem'
                }}>
                  {formatNumber(reportData.resumo.precipitacaoMedia)}mm
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Precipitação Média
                </div>
              </div>
            </div>
          </Card>

          {/* Estatísticas Detalhadas */}
          <Card title="Estatísticas Detalhadas - Período Analisado" className="mb-4">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'left',
                      borderBottom: '1px solid var(--gray-200)',
                      fontWeight: '600'
                    }}>
                      Parâmetro
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '1px solid var(--gray-200)',
                      fontWeight: '600'
                    }}>
                      Média
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '1px solid var(--gray-200)',
                      fontWeight: '600'
                    }}>
                      Mínimo
                    </th>
                    <th style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      borderBottom: '1px solid var(--gray-200)',
                      fontWeight: '600'
                    }}>
                      Máximo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                      Umidade do Solo (%)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.umidade?.media || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.umidade?.minima || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.umidade?.maxima || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                      Temperatura (°C)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.temperatura?.media || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.temperatura?.minima || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.temperatura?.maxima || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                      Risco Integrado (%)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.risco?.media || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.risco?.minima || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.risco?.maxima || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                      Precipitação 24h (mm)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.precipitacao?.media || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.precipitacao?.minima || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.precipitacao?.maxima || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                      Confiabilidade (%)
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.confiabilidade?.media || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.confiabilidade?.minima || 0)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
                      {formatNumber(reportData.sensores.estatisticas.confiabilidade?.maxima || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Distribuição de Alertas */}
          {reportData.sensores.estatisticas.alertas && (
            <Card title="Distribuição de Alertas" className="mb-4">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
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

          {/* Dados do Período - Tabela com registros */}
          {reportData.sensores.dados && reportData.sensores.dados.length > 0 && (
            <Card title="Dados do Período" className="mb-4">
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginBottom: '1rem'
              }}>
                Exibindo os primeiros 10 registros do período selecionado:
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'left',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Data/Hora
                      </th>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Umidade (%)
                      </th>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Temp (°C)
                      </th>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Risco (%)
                      </th>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Precip (mm)
                      </th>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Confiab (%)
                      </th>
                      <th style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600'
                      }}>
                        Alerta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sensores.dados.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td style={{ 
                          padding: '0.5rem', 
                          borderBottom: '1px solid var(--gray-200)',
                          fontSize: '0.75rem'
                        }}>
                          {formatDate(item.timestamp)}
                        </td>
                        <td style={{ 
                          padding: '0.5rem', 
                          textAlign: 'center',
                          borderBottom: '1px solid var(--gray-200)'
                        }}>
                          {formatNumber(parseFloat(item.umidadeSolo) || 0)}
                        </td>
                        <td style={{ 
                          padding: '0.5rem', 
                          textAlign: 'center',
                          borderBottom: '1px solid var(--gray-200)'
                        }}>
                          {formatNumber(parseFloat(item.temperatura) || 0)}
                        </td>
                        <td style={{ 
                          padding: '0.5rem', 
                          textAlign: 'center',
                          borderBottom: '1px solid var(--gray-200)'
                        }}>
                          {formatNumber(parseFloat(item.riscoIntegrado) || 0)}
                        </td>
                        <td style={{ 
                          padding: '0.5rem', 
                          textAlign: 'center',
                          borderBottom: '1px solid var(--gray-200)'
                        }}>
                          {formatNumber(parseFloat(item.precipitacao24h) || 0)}
                        </td>
                        <td style={{ 
                          padding: '0.5rem', 
                          textAlign: 'center',
                          borderBottom: '1px solid var(--gray-200)'
                        }}>
                          {formatNumber(parseFloat(item.confiabilidade) || 0)}
                        </td>
                        <td style={{ 
                          padding: '0.5rem', 
                          textAlign: 'center',
                          borderBottom: '1px solid var(--gray-200)'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: 
                              item.nivelAlerta === 'VERDE' ? 'var(--green-100)' :
                              item.nivelAlerta === 'AMARELO' ? 'var(--yellow-100)' :
                              item.nivelAlerta === 'VERMELHO' ? 'var(--red-100)' : 'var(--gray-100)',
                            color:
                              item.nivelAlerta === 'VERDE' ? 'var(--green-700)' :
                              item.nivelAlerta === 'AMARELO' ? 'var(--yellow-700)' :
                              item.nivelAlerta === 'VERMELHO' ? 'var(--red-700)' : 'var(--gray-700)'
                          }}>
                            {item.nivelAlerta || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {reportData.sensores.dados.length > 10 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '1rem',
                  padding: '0.5rem',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  Mostrando 10 de {reportData.sensores.dados.length} registros. 
                  Exporte o CSV para ver todos os dados.
                </div>
              )}
            </Card>
          )}

          {/* Informações Técnicas */}
          {reportData.sensores.estatisticas.sensores && (
            <Card title="Informações Técnicas" className="mb-4">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--blue-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--blue-500)'
                  }}>
                    {reportData.sensores.estatisticas.sensores.sensorOk}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    Sensores OK
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--purple-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--purple-500)'
                  }}>
                    {reportData.sensores.estatisticas.sensores.apiBndmetOk}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    API BNDMET OK
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--teal-500)10',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--teal-500)'
                  }}>
                    {Math.round((reportData.sensores.estatisticas.sensores.sensorOk / reportData.sensores.estatisticas.sensores.totalLeituras) * 100)}%
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)',
                    marginTop: '0.25rem'
                  }}>
                    Taxa de Sucesso
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