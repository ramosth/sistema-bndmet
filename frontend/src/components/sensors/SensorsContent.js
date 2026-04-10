// Monitoramento de Sensores — Estrutura UX completa
// ============= src/components/sensors/SensorsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService } from '@/services/api';
import { useFilters } from '@/hooks';
import { formatDateBR, formatDateBRCSV, getAlertLevel } from '@/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SensorChart from '@/components/dashboard/SensorChart';
import { Activity, Download, RefreshCw, Cloud, Droplets, Shield, AlertTriangle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v, decimals = 1) => {
  const x = parseFloat(v);
  if (isNaN(x) || v == null) return '—';
  return x.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const fmtRisco = (item) => {
  if (item?.indiceRisco != null)    return fmt(item.indiceRisco, 1);
  if (item?.riscoIntegrado != null) return fmt(parseFloat(item.riscoIntegrado) * 100, 1);
  return '—';
};

const riscoColor = (item) => {
  const v = item?.indiceRisco ?? (parseFloat(item?.riscoIntegrado) * 100);
  if (v > 75) return '#dc2626';
  if (v > 45) return '#d97706';
  return '#16a34a';
};

const NivelBadge = ({ nivel }) => {
  const map = {
    VERDE:    { bg: '#dcfce7', color: '#166534', label: '🟢 Normal' },
    AMARELO:  { bg: '#fef9c3', color: '#854d0e', label: '🟡 Atenção' },
    VERMELHO: { bg: '#fee2e2', color: '#991b1b', label: '🔴 Crítico' },
  };
  const s = map[nivel] || { bg: '#f3f4f6', color: '#6b7280', label: nivel || '—' };
  return (
    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const ApiBadge = ({ status, label }) => {
  const ok = status === 'OK';
  return (
    <span style={{
      padding: '0.125rem 0.375rem', borderRadius: '0.2rem', fontSize: '0.7rem', fontWeight: '600',
      backgroundColor: !status ? '#f3f4f6' : ok ? '#dcfce7' : '#fee2e2',
      color: !status ? '#9ca3af' : ok ? '#166534' : '#991b1b',
    }}>
      {label}: {status || '—'}
    </span>
  );
};

const DataRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: highlight || '#374151' }}>{value}</span>
  </div>
);

const KpiCard = ({ icon: Icon, iconColor, value, label, sub, valueColor }) => (
  <div style={{ padding: '1rem 1.25rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={iconColor} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.375rem', fontWeight: '700', color: valueColor || '#111827', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginTop: '0.1rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.1rem' }}>{sub}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function SensorsContent() {
  const [sensorData,     setSensorData]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [stats,          setStats]          = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [expandedRow,    setExpandedRow]    = useState(null);
  const [showDateFilter,  setShowDateFilter]  = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(null); // null = usando selectedPeriod

  const ITEMS_PER_PAGE = 15;

  const { filters, updateFilter, clearFilters } = useFilters({
    dataInicio:  '',
    dataFim:     '',
    nivelAlerta: 'all',
  });

  // filters.nivelAlerta NÃO é dependência — filtro de nível é aplicado localmente
  // sobre sensorData via filteredData, sem nova chamada à API
  useEffect(() => { loadSensorData(); loadSensorStats(); }, [selectedPeriod]);

  const loadSensorData = async () => {
    setLoading(true);
    try {
      let dataInicio, dataFim;
      if (filters.dataInicio && filters.dataFim) {
        dataInicio = filters.dataInicio;
        dataFim    = filters.dataFim;
      } else {
        const now = new Date();
        dataFim    = now.toISOString();
        const ms   = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
        dataInicio = new Date(now.getTime() - (ms[selectedPeriod] || ms['24h'])).toISOString();
      }
      const response = await sensorService.getReadingsByPeriod(dataInicio, dataFim, 1, 1000);
      setSensorData(response.data || []);
    } catch (error) {
      console.error('Erro:', error);
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
    setShowDateFilter(false);
    setActiveDateRange(null);
    clearFilters();
    setCurrentPage(1);
  };

  const handleDateFilter = () => {
    if (!filters.dataInicio || !filters.dataFim) { toast.error('Selecione as datas de início e fim'); return; }
    if (new Date(filters.dataInicio) >= new Date(filters.dataFim)) { toast.error('Data de início deve ser anterior à data de fim'); return; }
    setActiveDateRange({ inicio: filters.dataInicio, fim: filters.dataFim });
    loadSensorData();
  };

  const exportData = () => {
    if (!filteredData.length) { toast.error('Nenhum dado para exportar'); return; }
    const rows = [
      ['Timestamp','ID','Umidade Solo (%)','ADC','Fator Local',
       'Temp (°C)','Umid. Externa (%)','Pressão (hPa)','Vento (m/s)','Condições',
       'Precip. 24h (mm)','Precip. 7d (mm)','Precip. 30d (mm)',
       'Chuva Futura 24h (mm)','Intensidade Previsão',
       'Risco (%)','Índice Risco','Nível Alerta','Confiabilidade (%)',
       'Amplificado','Taxa Variação Umidade',
       'V_lencol','V_ch.24h','V_ch.7d','V_ch.30d','V_ch.futura','V_taxa','V_pressao',
       'Status Sensor','Status BNDMET','Qualidade BNDMET (%)','Status OWM',
       'WiFi','Buzzer','Modo','Estação','freeHeap (bytes)','RSSI (dBm)','Tentativas Envio','Recomendação'],
      ...filteredData.map(d => [
        formatDateBRCSV(d.timestamp), d.id, d.umidadeSolo, d.valorAdc, d.fatorLocal,
        d.temperatura, d.umidadeExterna, d.pressaoAtmosferica, d.velocidadeVento,
        `"${(d.descricaoTempo||'').replace(/"/g,'""')}"`,
        d.precipitacao24h, d.precipitacao7d, d.precipitacao30d, d.chuvaFutura24h, d.intensidadePrevisao||'',
        d.indiceRisco ?? (parseFloat(d.riscoIntegrado||0)*100).toFixed(1),
        d.indiceRisco, d.nivelAlerta, d.confiabilidade,
        d.amplificado?'Sim':'Não', d.taxaVariacaoUmidade,
        d.vLencol, d.vChuvaAtual, d.vChuvaHistorica, d.vChuvaMensal,
        d.vChuvaFutura, d.vTaxaVariacao, d.vPressao,
        d.sensorOk?'OK':'Falha', d.statusApiBndmet||'', d.qualidadeDadosBndmet||'', d.statusApiOwm||'',
        d.wifiConectado?'Sim':'Não', d.buzzerAtivo?'Sim':'Não', d.modoManual?'Manual':'Automático',
        d.estacao||'', d.dadosBrutos?.freeHeap||'', d.dadosBrutos?.rssi||'',
        d.dadosBrutos?.tentativasEnvio||'', `"${(d.recomendacao||'').replace(/"/g,'""')}"`
      ])
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `sensores_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); window.URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  // ── Dados derivados ──────────────────────────────────────────────────────
  // Label do período ativo para os KPIs
  const periodoLabel = (() => {
    if (activeDateRange) {
      const d1 = new Date(activeDateRange.inicio);
      const d2 = new Date(activeDateRange.fim);
      const dias = Math.round((d2 - d1) / 86400000);
      return dias <= 1
        ? `${d1.toLocaleDateString('pt-BR')} até ${d2.toLocaleDateString('pt-BR')}`
        : `${dias} dias (${d1.toLocaleDateString('pt-BR')} – ${d2.toLocaleDateString('pt-BR')})`;
    }
    return `período de ${selectedPeriod}`;
  })();

    const filteredData   = filters.nivelAlerta === 'all' ? sensorData : sensorData.filter(d => d.nivelAlerta === filters.nivelAlerta);
  const totalPages     = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const pageData       = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const qualidadeStats = stats?.qualidadeDados || {};
  const ultimaLeitura  = stats?.geral?.ultimaLeitura || {};

  // Calcular estatísticas diretamente de sensorData para refletir o período selecionado
  // getStatistics() sempre retorna 24h — para 7d/30d/filtro por data usamos os dados carregados
  // Desabilitar stats da API quando nível filtrado — API retorna totais sem filtro de nível
  const use24hStats = selectedPeriod === '24h' && !activeDateRange && filters.nivelAlerta === 'all';
  const sensorStats24h = stats?.geral?.estatisticas24h || {};

  // KPIs refletem o mesmo conjunto da tabela (período + nível selecionado)
  const periodoStats = (() => {
    if (!filteredData.length) return { totalLeituras: 0, mediaUmidade: 0, mediaRisco: 0, mediaPrecipitacao: 0, alertasCriticos: 0 };
    const n = (v) => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
    const total    = filteredData.length;
    const criticos = filteredData.filter(d => d.nivelAlerta === 'VERMELHO').length;
    const medUmid  = filteredData.reduce((a, d) => a + n(d.umidadeSolo), 0) / total;
    const medPrec  = filteredData.reduce((a, d) => a + n(d.precipitacao24h), 0) / total;
    // risco: usar indiceRisco (0-100) se disponível, senão riscoIntegrado × 100
    const medRisco = filteredData.reduce((a, d) => a + (d.indiceRisco != null ? n(d.indiceRisco) : n(d.riscoIntegrado) * 100), 0) / total;
    return { totalLeituras: total, mediaUmidade: medUmid, mediaRisco: medRisco, mediaPrecipitacao: medPrec, alertasCriticos: criticos };
  })();

  // Usar 24h stats da API quando possível (mais preciso), senão usar cálculo do período
  const sensorStats = use24hStats ? sensorStats24h : {
    totalLeituras:    periodoStats.totalLeituras,
    mediaUmidade:     periodoStats.mediaUmidade,
    mediaRisco:       periodoStats.mediaRisco / 100, // mantém escala 0-1 para compatibilidade
    mediaPrecipitacao:periodoStats.mediaPrecipitacao,
    alertasCriticos:  periodoStats.alertasCriticos,
  };

  const mediaRiscoPct  = periodoStats.mediaRisco.toFixed(1);
  const mediaConfiab   = filteredData.length
    ? (filteredData.reduce((a, d) => a + (parseFloat(d.confiabilidade) || 0), 0) / filteredData.length).toFixed(0)
    : '0';
  const det = ultimaLeitura.dadosBrutos?.confiabilidade_detalhes || null;
  const descontoInfo = {
    sensor_falha: 'Sensor com falha', bndmet_indisponivel: 'BNDMET indisponível',
    qualidade_bndmet: 'Qualidade BNDMET <80%', owm_indisponivel: 'OWM indisponível',
    wifi_desconectado: 'WiFi desconectado', buffer_insuficiente: 'Buffer insuficiente',
  };

  // Label do nível ativo para exibir nos sub dos KPIs quando filtrado
  const nivelLabel = filters.nivelAlerta === 'all' ? null : {
    VERDE:    '🟢 Nível: Verde',
    AMARELO:  '🟡 Nível: Amarelo',
    VERMELHO: '🔴 Nível: Vermelho',
  }[filters.nivelAlerta] || null;

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── BLOCO 1: Barra de comando ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            Monitoramento de Sensores
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
            {filteredData.length > 0
              ? activeDateRange
                ? `${filteredData.length} registros · ${new Date(activeDateRange.inicio).toLocaleDateString('pt-BR')} até ${new Date(activeDateRange.fim).toLocaleDateString('pt-BR')}`
                : `${filteredData.length} registros · período: ${selectedPeriod}`
              : 'Dados em tempo real da barragem'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Período */}
          <div style={{ display: 'flex', borderRadius: '0.375rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {[{ id: '24h', label: 'Últ. 24h' }, { id: '7d', label: '7 dias' }, { id: '30d', label: '30 dias' }].map(({ id, label }) => (
              <button key={id} onClick={() => handlePeriodChange(id)} style={{
                padding: '0.4rem 0.75rem', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: '500',
                backgroundColor: selectedPeriod === id ? '#2563eb' : 'white',
                color: selectedPeriod === id ? 'white' : '#374151',
                borderRight: id !== '30d' ? '1px solid #e5e7eb' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtro data */}
          <button onClick={() => setShowDateFilter(v => !v)} style={{
            padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
            border: `1px solid ${showDateFilter ? '#2563eb' : '#e5e7eb'}`,
            backgroundColor: showDateFilter ? '#eff6ff' : 'white',
            color: showDateFilter ? '#2563eb' : '#374151',
            fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
          }}>
            📅 Por data {showDateFilter ? '▲' : '▼'}
          </button>

          {/* Filtro nível */}
          <select value={filters.nivelAlerta} onChange={e => { updateFilter('nivelAlerta', e.target.value); setCurrentPage(1); }} style={{
            padding: '0.4rem 0.625rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb',
            fontSize: '0.8rem', color: '#374151', backgroundColor: 'white', cursor: 'pointer',
          }}>
            <option value="all">Todos os níveis</option>
            <option value="VERDE">🟢 Verde</option>
            <option value="AMARELO">🟡 Amarelo</option>
            <option value="VERMELHO">🔴 Vermelho</option>
          </select>

          <Button variant="outline" onClick={exportData} disabled={!filteredData.length} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <Download size={14} /> CSV
          </Button>
          <Button variant="outline" onClick={() => { loadSensorData(); loadSensorStats(); }} loading={loading} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Filtro de data expandível */}
      {showDateFilter && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1rem', flexWrap: 'nowrap' }}>
          <div style={{ flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>Data de Início</label>
            <Input type="datetime-local" value={filters.dataInicio} onChange={e => updateFilter('dataInicio', e.target.value)} style={{ fontSize: '0.8rem', width: '190px', height: '38px', boxSizing: 'border-box' }} max={new Date().toISOString().slice(0, 16)} />
          </div>
          <div style={{ flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }}>Data de Fim</label>
            <Input type="datetime-local" value={filters.dataFim} onChange={e => updateFilter('dataFim', e.target.value)} style={{ fontSize: '0.8rem', width: '190px', height: '38px', boxSizing: 'border-box' }} max={new Date().toISOString().slice(0, 16)} />
          </div>
          {/* Label invisível para alinhar botões com a base dos inputs */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.35rem', visibility: 'hidden' }}>_</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button onClick={handleDateFilter} disabled={!filters.dataInicio || !filters.dataFim} style={{ fontSize: '0.8rem', height: '38px', whiteSpace: 'nowrap' }}>Aplicar</Button>
              <Button variant="outline" onClick={() => { clearFilters(); setShowDateFilter(false); setActiveDateRange(null); }} style={{ fontSize: '0.8rem', height: '38px', whiteSpace: 'nowrap' }}>Limpar</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCO 2: 6 KPIs ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Resumo do Período
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <KpiCard icon={Activity} iconColor="#2563eb" value={sensorStats.totalLeituras || 0} label="Total de Leituras" sub={nivelLabel ? `${periodoLabel} · ${nivelLabel}` : periodoLabel} />
        <KpiCard icon={Droplets} iconColor="#0891b2"
          value={`${fmt(sensorStats.mediaUmidade)}%`}
          valueColor={parseFloat(sensorStats.mediaUmidade) >= 25 ? '#dc2626' : parseFloat(sensorStats.mediaUmidade) >= 15 ? '#d97706' : '#0891b2'}
          label="Umidade Média" sub="limiar crítico: 25%" />
        <KpiCard icon={Shield} iconColor="#dc2626"
          value={`${mediaRiscoPct}%`}
          valueColor={parseFloat(mediaRiscoPct) > 75 ? '#dc2626' : parseFloat(mediaRiscoPct) > 45 ? '#d97706' : '#16a34a'}
          label="Risco Médio (FR)" sub="Verde ≤45% / Amar. ≤75%" />
        <KpiCard icon={Cloud} iconColor="#1d4ed8"
          value={`${fmt(sensorStats.mediaPrecipitacao)} mm`}
          label="Precip. Média 24h" sub="BNDMET D6594 I006" />
        <KpiCard icon={Activity} iconColor="#16a34a"
          value={`${mediaConfiab}%`}
          valueColor={parseFloat(mediaConfiab) >= 90 ? '#16a34a' : parseFloat(mediaConfiab) >= 70 ? '#d97706' : '#dc2626'}
          label="Confiabilidade Média" sub="base 100%, desc. por falha" />
        <KpiCard icon={AlertTriangle}
          iconColor={sensorStats.alertasCriticos > 0 ? '#dc2626' : '#16a34a'}
          value={sensorStats.alertasCriticos || 0}
          valueColor={sensorStats.alertasCriticos > 0 ? '#dc2626' : '#16a34a'}
          label="Alertas Críticos" sub={nivelLabel || periodoLabel} />
      </div>

      {/* ── BLOCO 3: Painel da Última Leitura ─────────────────────────── */}
      {ultimaLeitura.id && (
        <>
          <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Última Leitura
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: '500' }}>
              {formatDateBR(ultimaLeitura.timestamp)}
            </span>
            <NivelBadge nivel={ultimaLeitura.nivelAlerta} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>

          {/* Col 1 — Solo e Risco */}
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💧 Solo e Risco</h4>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{formatDateBR(ultimaLeitura.timestamp)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: '700', color: parseFloat(ultimaLeitura.umidadeSolo) >= 30 ? '#dc2626' : parseFloat(ultimaLeitura.umidadeSolo) >= 20 ? '#d97706' : '#0891b2' }}>
                {fmt(ultimaLeitura.umidadeSolo)}%
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>umidade do solo</span>
            </div>
            <DataRow label="ADC (bruto)"        value={ultimaLeitura.valorAdc ?? '—'} highlight={ultimaLeitura.valorAdc === 1024 ? '#dc2626' : '#374151'} />
            <DataRow label="Fator Local"         value={fmt(ultimaLeitura.fatorLocal, 3)} />
            <DataRow label="Risco (FR%)"         value={`${fmtRisco(ultimaLeitura)}%`} highlight={riscoColor(ultimaLeitura)} />
            <DataRow label="Nível de Alerta"     value={<NivelBadge nivel={ultimaLeitura.nivelAlerta} />} />
            <DataRow label="Taxa var. umidade"   value={fmt(ultimaLeitura.taxaVariacaoUmidade, 3)} />
            {ultimaLeitura.amplificado && (
              <DataRow label="Amplificação" value={<span style={{ color: '#c2410c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Zap size={12} /> ×1,20 aplicado</span>} />
            )}
            {ultimaLeitura.recomendacao && (
              <div style={{ marginTop: '0.625rem', padding: '0.5rem', backgroundColor: ultimaLeitura.nivelAlerta === 'VERMELHO' ? '#fef2f2' : '#f8fafc', borderRadius: '0.375rem', fontSize: '0.75rem', color: ultimaLeitura.nivelAlerta === 'VERMELHO' ? '#991b1b' : '#374151', lineHeight: 1.4 }}>
                💡 {ultimaLeitura.recomendacao}
              </div>
            )}
          </div>

          {/* Col 2 — Meteorologia */}
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🌤 Meteorologia</h4>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.125rem' }}>Condições atuais — OWM /weather</div>
            <DataRow label="Temperatura"           value={`${fmt(ultimaLeitura.temperatura)} °C`} />
            <DataRow label="Umidade externa"       value={`${fmt(ultimaLeitura.umidadeExterna)}%`} />
            <DataRow label="Pressão atm. (grnd)"   value={`${fmt(ultimaLeitura.pressaoAtmosferica)} hPa`} />
            <DataRow label="Vento"                 value={`${fmt(ultimaLeitura.velocidadeVento)} m/s`} />
            <DataRow label="Descrição"             value={ultimaLeitura.descricaoTempo || '—'} />
            <DataRow label="Chuva atual (rain.1h)" value={`${fmt(ultimaLeitura.chuvaAtualOwm)} mm/h`} />
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', margin: '0.625rem 0 0.125rem' }}>Precipitação — BNDMET D6594 I006</div>
            <DataRow label="Acumulado 24h"  value={`${fmt(ultimaLeitura.precipitacao24h)} mm`} />
            <DataRow label="Acumulado 7d"   value={`${fmt(ultimaLeitura.precipitacao7d)} mm`} />
            <DataRow label="Acumulado 30d"  value={`${fmt(ultimaLeitura.precipitacao30d)} mm`} />
            <DataRow label="Atual (I175)"   value={`${fmt(ultimaLeitura.precipitacaoAtual)} mm`} />
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', margin: '0.625rem 0 0.125rem' }}>Previsão 24h — OWM /forecast</div>
            <DataRow label="Chuva prevista" value={`${fmt(ultimaLeitura.chuvaFutura24h)} mm`} />
            <DataRow label="Intensidade"   value={ultimaLeitura.intensidadePrevisao || '—'} />
          </div>

          {/* Col 3 — Qualidade e Sistema */}
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📊 Qualidade e Sistema</h4>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.125rem' }}>APIs e Conectividade</div>
            <DataRow label="BNDMET"           value={<ApiBadge status={ultimaLeitura.statusApiBndmet} label="Status" />} />
            <DataRow label="Qualidade BNDMET" value={`${ultimaLeitura.qualidadeDadosBndmet ?? '—'}%`} highlight={ultimaLeitura.qualidadeDadosBndmet >= 80 ? '#16a34a' : ultimaLeitura.qualidadeDadosBndmet != null ? '#d97706' : '#6b7280'} />
            <DataRow label="OWM"              value={<ApiBadge status={ultimaLeitura.statusApiOwm} label="Status" />} />
            <DataRow label="Estação"          value={ultimaLeitura.estacao || '—'} />

            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', margin: '0.625rem 0 0.375rem' }}>Confiabilidade da Análise</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: ultimaLeitura.confiabilidade >= 90 ? '#16a34a' : ultimaLeitura.confiabilidade >= 70 ? '#d97706' : '#dc2626' }}>
                {ultimaLeitura.confiabilidade ?? '—'}%
              </span>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>(máx. operacional: 90%)</span>
            </div>
            {det && (
              det.estado_especial === 'RUPTURA' ? (
                <div style={{ fontSize: '0.72rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '0.375rem', borderRadius: '0.25rem' }}>
                  100% — Estado especial RUPTURA (hardware confirmou)
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem' }}>
                  {Object.entries(det.descontos || {}).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0.25rem', borderBottom: '1px solid #fef9c3', backgroundColor: '#fffbeb' }}>
                      <span style={{ color: '#92400e' }}>{descontoInfo[k] || k}</span>
                      <span style={{ fontWeight: '700', color: '#dc2626' }}>−{v}%</span>
                    </div>
                  ))}
                  {Object.values(det.descontos || {}).every(v => v === 0) && (
                    <span style={{ color: '#16a34a', fontSize: '0.72rem' }}>✅ Sem descontos</span>
                  )}
                </div>
              )
            )}

            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', margin: '0.625rem 0 0.125rem' }}>Hardware ESP8266</div>
            <DataRow label="freeHeap" value={`${(ultimaLeitura.dadosBrutos?.freeHeap || 0).toLocaleString('pt-BR')} bytes`} highlight={(ultimaLeitura.dadosBrutos?.freeHeap || 0) < 5000 ? '#dc2626' : '#374151'} />
            <DataRow label="RSSI" value={`${ultimaLeitura.dadosBrutos?.rssi || '—'} dBm`} highlight={(ultimaLeitura.dadosBrutos?.rssi || 0) < -80 ? '#d97706' : '#374151'} />
            <DataRow label="Uptime" value={`${Math.round((ultimaLeitura.dadosBrutos?.uptime || 0) / 1000)}s`} />
            <DataRow label="Tentativas envio" value={String(ultimaLeitura.dadosBrutos?.tentativasEnvio || 0)} highlight={(ultimaLeitura.dadosBrutos?.tentativasEnvio || 0) > 3 ? '#d97706' : '#374151'} />
            <DataRow label="Sensor OK"  value={ultimaLeitura.sensorOk ? '✅ Sim' : '❌ Não'} />
            <DataRow label="Modo"       value={ultimaLeitura.modoManual ? '⚠️ Manual' : '🤖 Automático'} />
            <DataRow label="Buzzer"     value={ultimaLeitura.buzzerAtivo ? '🔊 Ativo' : 'Inativo'} />
          </div>
          </div>
        </>
      )}

      {/* ── BLOCO 4: Gráfico ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151', margin: 0 }}>
            Gráfico de Dados — últimas leituras
          </h4>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: '#6b7280', flexWrap: 'wrap' }}>
            {[
              { color: '#0891b2', label: 'Umidade (%)' },
              { color: '#1d4ed8', label: 'Precip. 24h (mm)' },
              { color: '#93c5fd', label: 'Prev. 24h (mm)' },
              { color: '#dc2626', label: 'Risco (%)' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '1.25rem', height: '3px', backgroundColor: color, borderRadius: '2px', display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', height: '300px', alignItems: 'center' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <SensorChart data={filteredData} />
        )}
      </div>

      {/* ── BLOCO 5: Tabela de Registros ─────────────────────────────────── */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151', margin: 0 }}>
            Registros do Período
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#9ca3af', fontWeight: '400' }}>({filteredData.length} leituras)</span>
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Clique em uma linha para ver V_x e diagnóstico</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><LoadingSpinner size="large" /></div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <Activity size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Nenhum dado para o período selecionado</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    {[
                      ['Timestamp', 'left'], ['Umidade (%)', 'center'], ['ADC', 'center'],
                      ['Risco (%)', 'center'], ['Nível', 'center'], ['Confiab. (%)', 'center'],
                      ['BNDMET', 'center'], ['OWM', 'center'], ['Amplif.', 'center'], ['Sensor', 'center'],
                    ].map(([h, align]) => (
                      <th key={h} style={{ padding: '0.625rem 0.75rem', textAlign: align, fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((item, i) => {
                    const isRuptura  = item.indiceRisco === 100;
                    const isExpanded = expandedRow === i;
                    const vx = [
                      { label: 'V_lençol (×0,40)',  value: item.vLencol },
                      { label: 'V_ch.24h (×0,08)',  value: item.vChuvaAtual },
                      { label: 'V_ch.7d (×0,12)',   value: item.vChuvaHistorica },
                      { label: 'V_ch.30d (×0,10)',  value: item.vChuvaMensal },
                      { label: 'V_ch.fut (×0,15)',  value: item.vChuvaFutura },
                      { label: 'V_taxa (×0,10)',    value: item.vTaxaVariacao },
                      { label: 'V_pressão (×0,05)', value: item.vPressao },
                    ];
                    const frSoma = vx.reduce((s, v) => s + (parseFloat(v.value) || 0), 0);

                    return (
                      <>
                        <tr key={item.id || i}
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6',
                            backgroundColor: isRuptura ? '#fff5f5' : isExpanded ? '#eff6ff' : 'transparent',
                            cursor: 'pointer', transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { if (!isExpanded && !isRuptura) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                          onMouseLeave={e => { if (!isExpanded && !isRuptura) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.78rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                            {formatDateBR(item.timestamp)}
                            {isRuptura && <span style={{ marginLeft: '0.375rem', fontSize: '0.65rem', color: '#dc2626', fontWeight: '700' }}>🚨</span>}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700', color: parseFloat(item.umidadeSolo) >= 30 ? '#dc2626' : parseFloat(item.umidadeSolo) >= 20 ? '#d97706' : '#0891b2' }}>
                            {fmt(item.umidadeSolo)}%
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.78rem', fontFamily: 'monospace', color: item.valorAdc === 1024 ? '#dc2626' : '#6b7280', fontWeight: item.valorAdc === 1024 ? '700' : '400' }}>
                            {item.valorAdc ?? '—'}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700', color: riscoColor(item) }}>
                            {fmtRisco(item)}%
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                            <NivelBadge nivel={item.nivelAlerta} />
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', color: item.confiabilidade >= 90 ? '#16a34a' : item.confiabilidade >= 70 ? '#d97706' : '#dc2626' }}>
                            {item.confiabilidade != null ? `${item.confiabilidade}%` : '—'}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.125rem 0.375rem', borderRadius: '0.2rem', backgroundColor: item.statusApiBndmet === 'OK' ? '#dcfce7' : '#fee2e2', color: item.statusApiBndmet === 'OK' ? '#166534' : '#991b1b' }}>
                              {item.statusApiBndmet || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.125rem 0.375rem', borderRadius: '0.2rem', backgroundColor: item.statusApiOwm === 'OK' ? '#dcfce7' : item.statusApiOwm ? '#fee2e2' : '#f3f4f6', color: item.statusApiOwm === 'OK' ? '#166534' : item.statusApiOwm ? '#991b1b' : '#9ca3af' }}>
                              {item.statusApiOwm || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                            {item.amplificado
                              ? <span style={{ color: '#c2410c', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}><Zap size={11} />×1,20</span>
                              : <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>—</span>}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontSize: '0.78rem' }}>
                            {item.sensorOk ? '✅' : '❌'}
                          </td>
                        </tr>

                        {/* Linha expandida */}
                        {isExpanded && (
                          <tr key={`exp-${i}`}>
                            <td colSpan={10} style={{ padding: '1rem 1.25rem', backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

                                {/* V_x */}
                                <div>
                                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem 0' }}>
                                    ⚙️ Componentes Eq.5
                                    {isRuptura && <span style={{ marginLeft: '0.375rem', fontSize: '0.65rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.1rem 0.35rem', borderRadius: '0.2rem' }}>override ativo</span>}
                                  </p>
                                  <div style={{ fontSize: '0.72rem' }}>
                                    {vx.map(({ label, value }) => (
                                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                        <span style={{ color: '#6b7280' }}>{label}</span>
                                        <span style={{ fontWeight: '700', color: '#1d4ed8', fontFamily: 'monospace' }}>
                                          {value != null ? parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '—'}
                                        </span>
                                      </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderTop: '2px solid #bfdbfe', marginTop: '0.125rem' }}>
                                      <span style={{ fontWeight: '700', color: '#374151' }}>Σ FR {isRuptura ? '(sem override)' : ''}</span>
                                      <span style={{ fontWeight: '700', color: isRuptura ? '#d97706' : riscoColor(item), fontFamily: 'monospace' }}>
                                        {(frSoma * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                      </span>
                                    </div>
                                    {isRuptura && (
                                      <div style={{ marginTop: '0.25rem', fontSize: '0.68rem', color: '#991b1b', backgroundColor: '#fef2f2', padding: '0.3rem', borderRadius: '0.2rem' }}>
                                        Umidade {item.umidadeSolo}% ≥ 30% → <code>acionarRuptura()</code>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Contexto Meteo */}
                                <div>
                                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem 0' }}>🌧 Contexto Meteorológico</p>
                                  <div style={{ fontSize: '0.72rem' }}>
                                    {[
                                      ['Precip. 24h', `${fmt(item.precipitacao24h)} mm`],
                                      ['Precip. 7d',  `${fmt(item.precipitacao7d)} mm`],
                                      ['Precip. 30d', `${fmt(item.precipitacao30d)} mm`],
                                      ['Prev. 24h',   `${fmt(item.chuvaFutura24h)} mm (${item.intensidadePrevisao || '—'})`],
                                      ['Temperatura', `${fmt(item.temperatura)} °C`],
                                      ['Umid. ext.',  `${fmt(item.umidadeExterna)}%`],
                                      ['Pressão',     `${fmt(item.pressaoAtmosferica)} hPa`],
                                      ['Condições',   item.descricaoTempo || '—'],
                                    ].map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                        <span style={{ color: '#6b7280' }}>{k}</span>
                                        <span style={{ fontWeight: '500' }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Hardware */}
                                <div>
                                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.375rem 0' }}>🔧 Hardware</p>
                                  <div style={{ fontSize: '0.72rem' }}>
                                    {[
                                      ['freeHeap',    `${(item.dadosBrutos?.freeHeap || 0).toLocaleString('pt-BR')} bytes`],
                                      ['RSSI',        `${item.dadosBrutos?.rssi || '—'} dBm`],
                                      ['Uptime',      `${Math.round((item.dadosBrutos?.uptime || 0) / 1000)}s`],
                                      ['Tent. envio', String(item.dadosBrutos?.tentativasEnvio || 0)],
                                      ['Fator local', fmt(item.fatorLocal, 3)],
                                      ['Modo',        item.modoManual ? '⚠️ Manual' : '🤖 Automático'],
                                      ['Buzzer',      item.buzzerAtivo ? '🔊 Ativo' : 'Inativo'],
                                    ].map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid #dbeafe' }}>
                                        <span style={{ color: '#6b7280' }}>{k}</span>
                                        <span style={{ fontWeight: '500' }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Recomendação */}
                                {item.recomendacao && (
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1d4ed8', margin: '0 0 0.25rem 0' }}>💡 Recomendação</p>
                                    <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5, padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #bfdbfe', color: '#374151' }}>
                                      {item.recomendacao}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} de {filteredData.length}
                </span>
                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '0.8rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#d1d5db' : '#374151' }}>
                    ← Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    const p = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + idx;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setCurrentPage(p)} style={{ width: '2rem', height: '2rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', backgroundColor: p === currentPage ? '#2563eb' : 'transparent', color: p === currentPage ? 'white' : '#374151' }}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '0.8rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#d1d5db' : '#374151' }}>
                    Próximo →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}