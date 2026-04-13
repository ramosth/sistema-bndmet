// Geração de relatórios — Estrutura UX completa (6 seções + tabela expandível)
// ============= src/components/reports/ReportsContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService } from '@/services/api';
import { formatDateBR, formatDateBRCSV, formatNumber, downloadFile } from '@/utils';
import { useFilters } from '@/hooks';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FileText, Download, BarChart3, Info, Cpu,
  CloudRain, Activity, Shield, Wifi
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
//  Tooltip de legenda — hover no ícone de info
// ─────────────────────────────────────────────────────────────────────────────
const Tooltip = ({ text }) => {
  const [pos, setPos] = useState(null);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '0.375rem' }}>
      <Info
        size={13}
        color="var(--gray-400)"
        style={{ cursor: 'help', flexShrink: 0 }}
        onMouseEnter={(e) => {
          // getBoundingClientRect retorna coords relativas ao viewport — correto para position:fixed
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.top - 8, left: r.left + r.width / 2 });
        }}
        onMouseLeave={() => setPos(null)}
      />
      {pos && (
        <span style={{
          position: 'fixed',
          top: `${pos.top}px`,
          left: `${pos.left}px`,
          transform: 'translate(-50%, -100%)',
          backgroundColor: '#1f2937',
          color: 'white',
          fontSize: '0.7rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          whiteSpace: 'normal',
          width: '220px',
          zIndex: 9999,
          lineHeight: 1.4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          pointerEvents: 'none'
        }}>
          {text}
        </span>
      )}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Badge de status OK / Falha
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ value, trueLabel = 'OK', falseLabel = 'Falha' }) => {
  const isOk = value === true || value === 'OK';
  const isNull = value == null || value === '';
  return (
    <span style={{
      padding: '0.125rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: isNull ? 'var(--gray-100)' : isOk ? 'var(--green-100)' : 'var(--red-100)',
      color: isNull ? 'var(--gray-500)' : isOk ? 'var(--green-700)' : 'var(--red-700)'
    }}>
      {isNull ? '—' : isOk ? trueLabel : falseLabel}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Linha de estatística: label + tooltip + valor
// ─────────────────────────────────────────────────────────────────────────────
const StatRow = ({ label, value, tooltip, unit = '', highlight }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--gray-100)'
  }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', display: 'flex', alignItems: 'center' }}>
      {label}
      {tooltip && <Tooltip text={tooltip} />}
    </span>
    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: highlight || 'var(--gray-800)' }}>
      {value}{unit && value !== '—' ? ` ${unit}` : ''}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Tabela min / média / max com fonte e tooltip
// ─────────────────────────────────────────────────────────────────────────────
const StatsTable = ({ rows, decimals = 1 }) => {
  const fmtCell = (n) => {
    const x = parseFloat(n || 0);
    return x.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--gray-50)' }}>
            {['Parâmetro', 'Fonte', 'Mínimo', 'Média', 'Máximo', 'Unidade'].map(h => (
              <th key={h} style={{
                padding: '0.625rem 0.75rem',
                textAlign: h === 'Parâmetro' || h === 'Fonte' ? 'left' : 'center',
                borderBottom: '2px solid var(--gray-200)',
                fontWeight: '600',
                color: 'var(--gray-700)',
                whiteSpace: 'nowrap'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, fonte, min, media, max, unit, tooltip }, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: 'var(--gray-800)' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {label}{tooltip && <Tooltip text={tooltip} />}
                </span>
              </td>
              <td style={{ padding: '0.625rem 0.75rem' }}>
                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                  {fonte}
                </span>
              </td>
              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: 'var(--primary-blue)' }}>{fmtCell(min)}</td>
              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '700', color: 'var(--gray-800)' }}>{fmtCell(media)}</td>
              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: 'var(--red-500)' }}>{fmtCell(max)}</td>
              <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.75rem' }}>{unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsContent() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  // Dropdown por seção — todas abertas por padrão
  const [openSections, setOpenSections] = useState({
    s1: true, s2: true, s3: true, s4: true, s5: true, s6: true
  });
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const { filters, updateFilter } = useFilters({
    dataInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { generateReport(); }, []);

  // ── Geração ──────────────────────────────────────────────────────────────
  const generateReport = async () => {
    if (!filters.dataInicio || !filters.dataFim) {
      toast.error('Selecione as datas de início e fim'); return;
    }
    setLoading(true);
    try {
      const res = await sensorService.getReadingsByPeriod(
        filters.dataInicio + 'T00:00:00',
        filters.dataFim + 'T23:59:59',
        1, 1000
      );
      const data = res.data || [];
      setReportData({ periodo: { inicio: filters.dataInicio, fim: filters.dataFim }, dados: data, stats: calcStats(data) });

      // ── Diferencia período vazio de erro de comunicação ──────────────────
      if (data.length === 0) {
        toast('Nenhum dado encontrado para o período selecionado.', {
          style: {
            background: '#fefce8',
            color: '#854d0e',
            border: '1px solid #fde047',
          },
          duration: 5000,
        });
      }

    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar relatório. Verifique se o servidor está acessível.');
    } finally {
      setLoading(false);
    }
  };

  // ── Estatísticas ─────────────────────────────────────────────────────────
  const calcStats = (data) => {
    if (!data.length) return {
      totalLeituras: 0,
      alertasVerde: 0, alertasAmarelo: 0, alertasVermelho: 0, alertasRuptura: 0,
      eventosAmplificado: 0, eventosBuzzer: 0, eventosModoManual: 0,
      umidade: { min: 0, media: 0, max: 0 },
      risco: { min: 0, media: 0, max: 0 },
      confiabilidade: { min: 0, media: 0, max: 0 },
      temperatura: { min: 0, media: 0, max: 0 },
      umidadeExterna: { min: 0, media: 0, max: 0 },
      pressao: { min: 0, media: 0, max: 0 },
      vento: { min: 0, media: 0, max: 0 },
      precip24h: { min: 0, media: 0, max: 0 },
      precip7d: { min: 0, media: 0, max: 0 },
      precip30d: { min: 0, media: 0, max: 0 },
      precipAtual: { min: 0, media: 0, max: 0 },
      chuvaAtualOwm: { min: 0, media: 0, max: 0 },
      chuvaFutura24h: { min: 0, media: 0, max: 0 },
      vLencol: { min: 0, media: 0, max: 0 },
      vChuvaAtual: { min: 0, media: 0, max: 0 },
      vChuvaHist: { min: 0, media: 0, max: 0 },
      vChuvaMensal: { min: 0, media: 0, max: 0 },
      vChuvaFutura: { min: 0, media: 0, max: 0 },
      vTaxaVar: { min: 0, media: 0, max: 0 },
      vPressao: { min: 0, media: 0, max: 0 },
      sensorOkPct: 0, bndmetOkPct: 0, owmOkPct: 0,
      qualBndmet: { min: 0, media: 0, max: 0 },
      wifiOkPct: 0, estacao: '—',
      freeHeap: { min: 0, media: 0, max: 0 },
      rssi: { min: 0, media: 0, max: 0 },
      tentativasEnvio: { min: 0, media: 0, max: 0 },
      uptimeMax: 0,
    };
    const n = (v, fb = 0) => { const x = parseFloat(v); return isNaN(x) ? fb : x; };
    const mms = (arr) => {
      const c = arr.filter(v => !isNaN(v) && v != null);
      if (!c.length) return { min: 0, media: 0, max: 0 };
      return { min: Math.min(...c), media: c.reduce((a, b) => a + b, 0) / c.length, max: Math.max(...c) };
    };

    const risco = data.map(d => d.indiceRisco != null ? n(d.indiceRisco) : n(d.riscoIntegrado) * 100);
    const heap = data.map(d => d.dadosBrutos?.freeHeap).filter(Boolean);
    const rssi = data.map(d => d.dadosBrutos?.rssi).filter(v => v != null);
    const env = data.map(d => d.dadosBrutos?.tentativasEnvio || 0);
    const upt = data.map(d => d.dadosBrutos?.uptime || 0);

    // ── Classificação Vermelho vs Ruptura ────────────────────────────────────
    // Ambos chegam com nivelAlerta === 'VERMELHO' da API.
    // A distinção está na recomendacao:
    //   • Ruptura        → contém 'RUPTURA'  (🚨 RUPTURA ou 🟡 RETORNO DE RUPTURA)
    //   • Vermelho puro  → contém 'CRÍTICO'  (🔴 CRÍTICO — Evacuar... [Simulação])
    //   • Fallback       → qualquer outro VERMELHO vai para Ruptura por segurança
    const isRupturaRec = (d) =>
      d.nivelAlerta === 'VERMELHO' &&
      typeof d.recomendacao === 'string' &&
      d.recomendacao.includes('RUPTURA');

    const isVermelhoPuro = (d) =>
      d.nivelAlerta === 'VERMELHO' &&
      typeof d.recomendacao === 'string' &&
      d.recomendacao.includes('CRÍTICO');

    const alertasRuptura = data.filter(d => isRupturaRec(d)).length;
    const alertasVermelhoSemRuptura = data.filter(d => isVermelhoPuro(d)).length;

    return {
      totalLeituras: data.length,
      alertasVerde: data.filter(d => d.nivelAlerta === 'VERDE').length,
      alertasAmarelo: data.filter(d => d.nivelAlerta === 'AMARELO').length,
      alertasVermelho: alertasVermelhoSemRuptura,
      alertasRuptura,
      eventosAmplificado: data.filter(d => d.amplificado === true).length,
      eventosBuzzer: data.filter(d => d.buzzerAtivo === true).length,
      eventosModoManual: data.filter(d => d.modoManual === true).length,

      umidade: mms(data.map(d => n(d.umidadeSolo))),
      fatorLocal: mms(data.map(d => n(d.fatorLocal))),
      taxaVariacao: mms(data.map(d => n(d.taxaVariacaoUmidade))),
      risco: mms(risco),
      confiabilidade: mms(data.map(d => n(d.confiabilidade))),

      temperatura: mms(data.map(d => n(d.temperatura))),
      umidadeExterna: mms(data.map(d => n(d.umidadeExterna))),
      pressao: mms(data.map(d => n(d.pressaoAtmosferica))),
      vento: mms(data.map(d => n(d.velocidadeVento))),
      precip24h: mms(data.map(d => n(d.precipitacao24h))),
      precip7d: mms(data.map(d => n(d.precipitacao7d))),
      precip30d: mms(data.map(d => n(d.precipitacao30d))),
      precipAtual: mms(data.map(d => n(d.precipitacaoAtual))),
      chuvaAtualOwm: mms(data.map(d => n(d.chuvaAtualOwm))),
      chuvaFutura24h: mms(data.map(d => n(d.chuvaFutura24h))),

      vLencol: mms(data.map(d => n(d.vLencol))),
      vChuvaAtual: mms(data.map(d => n(d.vChuvaAtual))),
      vChuvaHist: mms(data.map(d => n(d.vChuvaHistorica))),
      vChuvaMensal: mms(data.map(d => n(d.vChuvaMensal))),
      vChuvaFutura: mms(data.map(d => n(d.vChuvaFutura))),
      vTaxaVar: mms(data.map(d => n(d.vTaxaVariacao))),
      vPressao: mms(data.map(d => n(d.vPressao))),

      sensorOkPct: data.length ? Math.round(data.filter(d => d.sensorOk === true).length / data.length * 100) : 0,
      bndmetOkPct: data.length ? Math.round(data.filter(d => d.statusApiBndmet === 'OK').length / data.length * 100) : 0,
      owmOkPct: data.length ? Math.round(data.filter(d => d.statusApiOwm === 'OK').length / data.length * 100) : 0,
      qualBndmet: mms(data.map(d => n(d.qualidadeDadosBndmet))),
      wifiOkPct: data.length ? Math.round(data.filter(d => d.wifiConectado === true).length / data.length * 100) : 0,
      estacao: data.find(d => d.estacao)?.estacao || '—',

      freeHeap: mms(heap),
      rssi: mms(rssi),
      tentativasEnvio: mms(env),
      uptimeMax: upt.length ? Math.max(...upt) : 0,
    };
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!reportData?.dados?.length) { toast.error('Nenhum dado para exportar'); return; }
    const rows = [
      ['Timestamp', 'ID', 'Umidade Solo (%)', 'ADC', 'Fator Local',
        'Temp (°C)', 'Umid. Externa (%)', 'Pressão (hPa)', 'Vento (m/s)', 'Condições',
        'Precip. 24h (mm)', 'Precip. 7d (mm)', 'Precip. 30d (mm)', 'Precip. Atual (mm)',
        'Chuva Atual OWM (mm)', 'Chuva Futura 24h (mm)', 'Intensidade Previsão',
        'Risco (%)', 'Índice Risco', 'Nível Alerta', 'Confiabilidade (%)',
        'Amplificado', 'Taxa Variação Umidade',
        'V_lencol', 'V_ch.24h', 'V_ch.hist', 'V_ch.30d', 'V_ch.futura', 'V_taxa', 'V_pressao',
        'Status Sensor', 'Status BNDMET', 'Qualidade BNDMET (%)', 'Status OWM',
        'WiFi', 'Buzzer', 'Modo', 'Estação',
        'freeHeap (bytes)', 'RSSI (dBm)', 'Tentativas Envio', 'Recomendação'],
      ...reportData.dados.map(d => [
        formatDateBRCSV(d.timestamp), d.id,
        d.umidadeSolo, d.valorAdc, d.fatorLocal,
        d.temperatura, d.umidadeExterna, d.pressaoAtmosferica, d.velocidadeVento,
        `"${(d.descricaoTempo || '').replace(/"/g, '""')}"`,
        d.precipitacao24h, d.precipitacao7d, d.precipitacao30d, d.precipitacaoAtual,
        d.chuvaAtualOwm, d.chuvaFutura24h, d.intensidadePrevisao || '',
        d.indiceRisco != null ? d.indiceRisco : (parseFloat(d.riscoIntegrado || 0) * 100).toFixed(1),
        d.indiceRisco, d.nivelAlerta, d.confiabilidade,
        d.amplificado ? 'Sim' : 'Não', d.taxaVariacaoUmidade,
        d.vLencol, d.vChuvaAtual, d.vChuvaHistorica, d.vChuvaMensal,
        d.vChuvaFutura, d.vTaxaVariacao, d.vPressao,
        d.sensorOk ? 'OK' : 'Falha', d.statusApiBndmet || '',
        d.qualidadeDadosBndmet || '', d.statusApiOwm || '',
        d.wifiConectado ? 'Sim' : 'Não',
        d.buzzerAtivo ? 'Sim' : 'Não',
        d.modoManual ? 'Manual' : 'Automático',
        d.estacao || '',
        d.dadosBrutos?.freeHeap || '', d.dadosBrutos?.rssi || '',
        d.dadosBrutos?.tentativasEnvio || '',
        `"${(d.recomendacao || '').replace(/"/g, '""')}"`
      ])
    ].map(r => r.join(',')).join('\n');

    downloadFile(rows, `relatorio_${filters.dataInicio}_${filters.dataFim}.csv`, 'text/csv');
    toast.success('CSV exportado com sucesso!');
  };

  // ── Export HTML ───────────────────────────────────────────────────────────
  const handleExportHTML = async () => {
    setGenerating(true);
    try {
      if (!reportData) return;
      const s = reportData.stats;
      const fmt = (n) => { const x = parseFloat(n || 0); return x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
      const pct = (n) => `${n}%`;

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8">
<title>Relatório TCC IPRJ — ${reportData.periodo.inicio} a ${reportData.periodo.fim}</title>
<style>
  body{font-family:Arial,sans-serif;margin:24px;color:#333;line-height:1.5;max-width:1100px;margin:0 auto;padding:24px}
  h1{color:#2563eb;margin-bottom:4px}
  h2{color:#374151;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-top:2.5rem}
  .meta{font-size:13px;color:#6b7280;margin-bottom:2rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin:16px 0}
  .card{padding:16px;border:1px solid #e5e7eb;border-radius:8px;text-align:center;background:#fafafa}
  .card .val{font-size:1.75rem;font-weight:700;color:#2563eb}
  .card .lbl{font-size:12px;color:#6b7280;margin-top:4px}
  .bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin:8px 0}
  .bar-verde{background:#4ade80}.bar-amarelo{background:#facc15}.bar-vermelho{background:#ef4444}.bar-ruptura{background:#7c3aed}
  table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
  th{background:#f8f9fa;padding:8px 10px;text-align:left;border-bottom:2px solid #dee2e6;font-weight:600}
  td{padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
  .ok{background:#dcfce7;color:#166534}.fail{background:#fee2e2;color:#991b1b}.na{background:#f3f4f6;color:#6b7280}
  .verde{color:#16a34a;font-weight:700}.amarelo{color:#d97706;font-weight:700}.vermelho{color:#dc2626;font-weight:700}
  .note{background:#f0f9ff;border:1px solid #bae6fd;padding:10px 14px;border-radius:6px;font-size:12px;color:#0369a1;margin:12px 0}
  .warn{background:#fffbeb;border:1px solid #fde68a;padding:10px 14px;border-radius:6px;font-size:12px;color:#92400e;margin:12px 0}
  code{background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:12px}
</style></head>
<body>
<h1>Relatório — Sistema de Monitoramento de Barragens</h1>
<p class="meta">
  <strong>TCC IPRJ</strong> · Equação de Risco Eq.5 · 7 variáveis ponderadas<br>
  Período: <strong>${reportData.periodo.inicio}</strong> a <strong>${reportData.periodo.fim}</strong> ·
  Gerado em: ${formatDateBR(new Date())} ·
  Total: ${s.totalLeituras} leituras
</p>

<h2>1. Resumo Executivo</h2>
<div class="grid">
  <div class="card"><div class="val">${s.totalLeituras}</div><div class="lbl">Total de Leituras</div></div>
  <div class="card"><div class="val verde">${s.alertasVerde}</div><div class="lbl">🟢 Nível Verde</div></div>
  <div class="card"><div class="val amarelo">${s.alertasAmarelo}</div><div class="lbl">🟡 Nível Amarelo</div></div>
  <div class="card"><div class="val vermelho">${s.alertasVermelho}</div><div class="lbl">🔴 Nível Vermelho</div></div>
  <div class="card"><div class="val">${s.alertasRuptura}</div><div class="lbl">🚨 Ruptura</div></div>
  <div class="card"><div class="val">${fmt(s.risco?.media)}%</div><div class="lbl">Risco Médio</div></div>
  <div class="card"><div class="val">${fmt(s.confiabilidade?.media)}%</div><div class="lbl">Confiabilidade Média</div></div>
  <div class="card"><div class="val">${s.eventosAmplificado}</div><div class="lbl">Eventos Amplif. ×1,20</div></div>
</div>
<div class="bar">
  <div class="bar-verde" style="flex:${s.alertasVerde}" title="Verde: ${s.alertasVerde}"></div>
  <div class="bar-amarelo" style="flex:${s.alertasAmarelo}" title="Amarelo: ${s.alertasAmarelo}"></div>
  <div class="bar-vermelho" style="flex:${s.alertasVermelho}" title="Vermelho: ${s.alertasVermelho}"></div>
  <div class="bar-ruptura" style="flex:${s.alertasRuptura}" title="Ruptura: ${s.alertasRuptura}"></div>
</div>

<h2>2. Dados Meteorológicos e Pluviométricos</h2>
<div class="note">Precipitações históricas via BNDMET/DECEA — estação <strong>${s.estacao}</strong> (Alberto Flores, Minas Gerais (MG), rede ANA). Previsão e condições atuais via <strong>OpenWeatherMap (OWM)</strong>.</div>
<table>
  <tr><th>Parâmetro</th><th>Fonte</th><th>Mín.</th><th>Média</th><th>Máx.</th><th>Unidade</th></tr>
  <tr><td>Temperatura</td><td>OWM /weather</td><td>${fmt(s.temperatura?.min)}</td><td><b>${fmt(s.temperatura?.media)}</b></td><td>${fmt(s.temperatura?.max)}</td><td>°C</td></tr>
  <tr><td>Umidade Externa</td><td>OWM /weather</td><td>${fmt(s.umidadeExterna?.min)}</td><td><b>${fmt(s.umidadeExterna?.media)}</b></td><td>${fmt(s.umidadeExterna?.max)}</td><td>%</td></tr>
  <tr><td>Pressão Atmosférica (grnd_level)</td><td>OWM /weather</td><td>${fmt(s.pressao?.min)}</td><td><b>${fmt(s.pressao?.media)}</b></td><td>${fmt(s.pressao?.max)}</td><td>hPa</td></tr>
  <tr><td>Velocidade do Vento</td><td>OWM /weather</td><td>${fmt(s.vento?.min)}</td><td><b>${fmt(s.vento?.media)}</b></td><td>${fmt(s.vento?.max)}</td><td>m/s</td></tr>
  <tr><td>Precipitação 24h</td><td>BNDMET I006</td><td>${fmt(s.precip24h?.min)}</td><td><b>${fmt(s.precip24h?.media)}</b></td><td>${fmt(s.precip24h?.max)}</td><td>mm</td></tr>
  <tr><td>Precipitação 7 dias</td><td>BNDMET I006</td><td>${fmt(s.precip7d?.min)}</td><td><b>${fmt(s.precip7d?.media)}</b></td><td>${fmt(s.precip7d?.max)}</td><td>mm</td></tr>
  <tr><td>Precipitação 30 dias</td><td>BNDMET I006</td><td>${fmt(s.precip30d?.min)}</td><td><b>${fmt(s.precip30d?.media)}</b></td><td>${fmt(s.precip30d?.max)}</td><td>mm</td></tr>
  <tr><td>Precipitação Atual (I175)</td><td>BNDMET I175</td><td>${fmt(s.precipAtual?.min)}</td><td><b>${fmt(s.precipAtual?.media)}</b></td><td>${fmt(s.precipAtual?.max)}</td><td>mm</td></tr>
  <tr><td>Chuva Atual OWM (rain.1h)</td><td>OWM /weather</td><td>${fmt(s.chuvaAtualOwm?.min)}</td><td><b>${fmt(s.chuvaAtualOwm?.media)}</b></td><td>${fmt(s.chuvaAtualOwm?.max)}</td><td>mm/h</td></tr>
  <tr><td>Previsão Chuva 24h</td><td>OWM /forecast</td><td>${fmt(s.chuvaFutura24h?.min)}</td><td><b>${fmt(s.chuvaFutura24h?.media)}</b></td><td>${fmt(s.chuvaFutura24h?.max)}</td><td>mm</td></tr>
</table>

<h2>3. Componentes da Equação 5 TCC</h2>
<div class="warn">FR = V_lençol + V_ch.24h + V_ch.7d + V_ch.30d + V_ch.fut + V_taxa + V_pressão | Amplificação ×1,20 quando F_lençol ≥ 0,70 E chuva futura ≥ 5mm | Ruptura imediata se umidade ≥ 30% → FR=1,0</div>
<table>
  <tr><th>Componente</th><th>Fator</th><th>Peso</th><th>Descrição</th><th>Mín.</th><th>Média</th><th>Máx.</th></tr>
  <tr><td>V_lençol</td><td>F_lençol</td><td>0,40</td><td>Nível lençol freático — sensor capacitivo ESP8266 [min(umidade/25,1)×0,40]</td><td>${fmt(s.vLencol?.min)}</td><td><b>${fmt(s.vLencol?.media)}</b></td><td>${fmt(s.vLencol?.max)}</td></tr>
  <tr><td>V_ch.24h</td><td>F_ch.24h</td><td>0,08</td><td>Chuva 24h — BNDMET D6594 I006 [min(p24h/50,1)×0,08]</td><td>${fmt(s.vChuvaAtual?.min)}</td><td><b>${fmt(s.vChuvaAtual?.media)}</b></td><td>${fmt(s.vChuvaAtual?.max)}</td></tr>
  <tr><td>V_ch.7d</td><td>F_ch.7d</td><td>0,12</td><td>Chuva 7d — BNDMET D6594 I006 [min(p7d/150,1)×0,12]</td><td>${fmt(s.vChuvaHist?.min)}</td><td><b>${fmt(s.vChuvaHist?.media)}</b></td><td>${fmt(s.vChuvaHist?.max)}</td></tr>
  <tr><td>V_ch.30d</td><td>F_ch.30d</td><td>0,10</td><td>Chuva 30d — BNDMET D6594 I006 [min(p30d/300,1)×0,10]</td><td>${fmt(s.vChuvaMensal?.min)}</td><td><b>${fmt(s.vChuvaMensal?.media)}</b></td><td>${fmt(s.vChuvaMensal?.max)}</td></tr>
  <tr><td>V_ch.futura</td><td>F_ch.futura</td><td>0,15</td><td>Previsão 24h — OWM /forecast, Tabela AlertaRio [0/0,25/0,50/0,75/1,00]×0,15</td><td>${fmt(s.vChuvaFutura?.min)}</td><td><b>${fmt(s.vChuvaFutura?.media)}</b></td><td>${fmt(s.vChuvaFutura?.max)}</td></tr>
  <tr><td>V_taxa</td><td>F_taxa</td><td>0,10</td><td>Taxa variação umidade — buffer circular ESP8266 [|taxa|×0,10]</td><td>${fmt(s.vTaxaVar?.min)}</td><td><b>${fmt(s.vTaxaVar?.media)}</b></td><td>${fmt(s.vTaxaVar?.max)}</td></tr>
  <tr><td>V_pressão</td><td>F_pressão</td><td>0,05</td><td>Queda pressão atm. — OWM grnd_level, histórico 6 leituras</td><td>${fmt(s.vPressao?.min)}</td><td><b>${fmt(s.vPressao?.media)}</b></td><td>${fmt(s.vPressao?.max)}</td></tr>
</table>

<h2>4. Qualidade Técnica do Sistema</h2>
<table>
  <tr><th>Indicador</th><th>Valor</th><th>Observação</th></tr>
  <tr><td>Sensor ESP8266 OK</td><td>${pct(s.sensorOkPct)}</td><td>ADC=1024 → sensor desconectado (desconto −40% confiabilidade)</td></tr>
  <tr><td>API BNDMET OK</td><td>${pct(s.bndmetOkPct)}</td><td>Falha = −25% confiabilidade; retry automático a cada 30s</td></tr>
  <tr><td>Qualidade BNDMET (média)</td><td>${fmt(s.qualBndmet?.media)}%</td><td>% de medições válidas da estação ${s.estacao}. &lt;80% = −10% confiabilidade</td></tr>
  <tr><td>API OWM OK</td><td>${pct(s.owmOkPct)}</td><td>Falha = −15% confiabilidade; retry automático a cada 30s</td></tr>
  <tr><td>WiFi Conectado</td><td>${pct(s.wifiOkPct)}</td><td>Falha WiFi = −10% confiabilidade + dados não enviados</td></tr>
  <tr><td>Amplificação ×1,20</td><td>${s.eventosAmplificado} eventos</td><td>F_lençol ≥ 0,70 E chuva futura ≥ 5mm simultaneamente</td></tr>
  <tr><td>Buzzer Ativo</td><td>${s.eventosBuzzer} eventos</td><td>Alarme sonoro — situação crítica ou ruptura detectada</td></tr>
  <tr><td>Modo Manual</td><td>${s.eventosModoManual} registros</td><td>Inseridos via curl/Postman (excluir de análises automáticas)</td></tr>
  <tr><td>Risco Mínimo / Máximo</td><td>${fmt(s.risco?.min)}% / ${fmt(s.risco?.max)}%</td><td>Verde ≤45% | Amarelo 45–75% | Vermelho >75%</td></tr>
  <tr><td>Confiabilidade Mín. / Máx.</td><td>${fmt(s.confiabilidade?.min)}% / ${fmt(s.confiabilidade?.max)}%</td><td>Máximo operacional normal: 90% (BNDMET qualidade 76% + OWM OK)</td></tr>
</table>

<h2>5. Diagnóstico de Hardware — ESP8266</h2>
<div class="note">Dados do campo <code>dadosBrutos</code> de cada leitura. freeHeap &lt; 5.000 bytes pode causar reinicialização por watchdog.</div>
<table>
  <tr><th>Métrica</th><th>Mínimo</th><th>Média</th><th>Máximo</th><th>Referência</th></tr>
  <tr><td>Memória Livre (freeHeap)</td><td>${Math.round(s.freeHeap?.min || 0).toLocaleString('pt-BR')}</td><td><b>${Math.round(s.freeHeap?.media || 0).toLocaleString('pt-BR')}</b></td><td>${Math.round(s.freeHeap?.max || 0).toLocaleString('pt-BR')}</td><td>bytes — mínimo seguro: 5.000</td></tr>
  <tr><td>Sinal WiFi (RSSI)</td><td>${fmt(s.rssi?.min)}</td><td><b>${fmt(s.rssi?.media)}</b></td><td>${fmt(s.rssi?.max)}</td><td>dBm — bom: acima de −70</td></tr>
  <tr><td>Tentativas de Envio</td><td>${fmt(s.tentativasEnvio?.min)}</td><td><b>${fmt(s.tentativasEnvio?.media)}</b></td><td>${fmt(s.tentativasEnvio?.max)}</td><td>0 = 1ª tentativa bem-sucedida</td></tr>
  <tr><td>Uptime Máximo</td><td colspan="3"><b>${Math.round((s.uptimeMax || 0) / 60000)} min</b></td><td>Tempo desde último boot do ESP8266</td></tr>
</table>
</body></html>`;

      downloadFile(html, `relatorio_${reportData.periodo.inicio}_${reportData.periodo.fim}.html`, 'text/html');
      toast.success('Relatório HTML exportado!');
    } catch (e) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setGenerating(false);
    }
  };

  // ── Helpers de render ────────────────────────────────────────────────────
  // fmt: 2 casas decimais como padrão global do relatório
  const fmt = (n) => { const x = parseFloat(n || 0); return x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  // fmtV: 3 casas decimais para componentes V_x (0,048 em vez de 0,0)
  const fmtV = (n) => {
    const x = parseFloat(n || 0);
    return x.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };
  const s = reportData?.stats;

  // ── Wrapper de seção colapsável ─────────────────────────────────────────
  const SectionCard = ({ sKey, title, className = 'mb-4', children }) => {
    const isOpen = openSections[sKey];
    return (
      <Card className={className}>
        <div
          onClick={() => toggleSection(sKey)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none',
            padding: '0.25rem 0', marginBottom: isOpen ? '1rem' : '0'
          }}
        >
          <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gray-800)' }}>{title}</span>
          <span style={{
            fontSize: '0.75rem', color: 'var(--gray-500)',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block'
          }}>▼</span>
        </div>
        {isOpen && children}
      </Card>
    );
  };

  // ── Helper: detecta ruptura numa leitura individual ────────────────────
  const isRupturaRecord = (d) =>
    d.nivelAlerta === 'VERMELHO' &&
    typeof d.recomendacao === 'string' &&
    d.recomendacao.includes('RUPTURA');

  const NivelBadge = ({ nivel, dado }) => {
    // Se a leitura é de ruptura, sobrepõe o badge com visual roxo próprio
    if (dado && isRupturaRecord(dado)) {
      return (
        <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#ede9fe', color: '#581c87' }}>
          🚨 Ruptura
        </span>
      );
    }
    const map = {
      VERDE: ['var(--green-100)', 'var(--green-700)', '🟢 Normal'],
      AMARELO: ['var(--yellow-100)', 'var(--yellow-700)', '🟡 Atenção'],
      VERMELHO: ['var(--red-100)', 'var(--red-700)', '🔴 Crítico']
    };
    const [bg, color, label] = map[nivel] || ['var(--gray-100)', 'var(--gray-600)', nivel || '—'];
    return (
      <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: bg, color }}>
        {label}
      </span>
    );
  };

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-800)', margin: 0 }}>Relatórios</h1>
          <p style={{ color: 'var(--gray-600)', margin: '0.5rem 0 0 0' }}>
            Análise detalhada · Equação 5 TCC · 7 variáveis ponderadas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={handleExportCSV} disabled={!reportData || loading}>
            <Download size={16} /> CSV Completo
          </Button>
          <Button variant="primary" onClick={handleExportHTML} loading={generating} disabled={!reportData || loading}>
            <FileText size={16} /> Exportar HTML
          </Button>
        </div>
      </div>

      {/* Configuração */}
      <Card title="Configuração do Relatório" className="mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>Data de Início</label>
            <Input type="date" value={filters.dataInicio} onChange={e => updateFilter('dataInicio', e.target.value)} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>Data de Fim</label>
            <Input type="date" value={filters.dataFim} onChange={e => updateFilter('dataFim', e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
        <Button onClick={generateReport} loading={loading} icon={<BarChart3 size={16} />}>Gerar Relatório</Button>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <LoadingSpinner size="large" />
        </div>
      ) : !reportData ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
          <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p>Configure as datas e clique em "Gerar Relatório"</p>
        </div>
      ) : (
        <>
          {/* ── Seção 1: Resumo Executivo ──────────────────────────────── */}
          <SectionCard sKey="s1" title="1. Resumo Executivo" className="mb-4">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {[
                { label: 'Total de Leituras', value: s.totalLeituras ?? 0, color: 'var(--primary-blue)' },
                { label: '🟢 Nível Verde', value: s.alertasVerde ?? 0, color: 'var(--green-600)' },
                { label: '🟡 Nível Amarelo', value: s.alertasAmarelo ?? 0, color: 'var(--yellow-600)' },
                { label: '🔴 Nível Vermelho', value: s.alertasVermelho ?? 0, color: 'var(--red-600)' },
                { label: '🚨 Ruptura', value: s.alertasRuptura ?? 0, color: '#581c87' },
                { label: 'Risco Médio', value: s.totalLeituras ? `${fmt(s.risco?.media)}%` : '0,00%', color: 'var(--red-500)' },
                { label: 'Confiabilidade Média', value: s.totalLeituras ? `${fmt(s.confiabilidade?.media)}%` : '0,00%', color: 'var(--green-600)' },
                { label: 'Amplif. ×1,20', value: s.eventosAmplificado ?? 0, color: 'var(--orange-600)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '1.25rem', backgroundColor: `${color}12`, borderRadius: '0.5rem', textAlign: 'center', border: `1px solid ${color}30` }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#374151' }}>{value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#374151', marginTop: '0.25rem', lineHeight: 1.3, fontWeight: '500' }}>{label}</div>
                </div>
              ))}
            </div>
            {/* Barra de distribuição de alertas */}
            {s.totalLeituras > 0 && (
              <>
                {(() => {
                  const total = s.totalLeituras || 0;
                  const nV = s.alertasVerde || 0;
                  const nA = s.alertasAmarelo || 0;
                  const nVm = s.alertasVermelho || 0;
                  const nR = s.alertasRuptura || 0;
                  const pV = total > 0 ? (nV / total * 100) : 0;
                  const pA = total > 0 ? (nA / total * 100) : 0;
                  const pVm = total > 0 ? (nVm / total * 100) : 0;
                  const pR = total > 0 ? (nR / total * 100) : 0;
                  const p1 = pV.toFixed(2);
                  const p2 = (pV + pA).toFixed(2);
                  const p3 = (pV + pA + pVm).toFixed(2);
                  // verde → amarelo → vermelho → roxo (ruptura)
                  const grad = `linear-gradient(to right, #4ade80 0% ${p1}%, #facc15 ${p1}% ${p2}%, #ef4444 ${p2}% ${p3}%, #7c3aed ${p3}% 100%)`;
                  return (
                    <div style={{
                      height: '10px',
                      borderRadius: '6px',
                      width: '100%',
                      background: total > 0 ? grad : '#e5e7eb',
                      marginTop: '0.5rem'
                    }} />
                  );
                })()}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                  {(() => {
                    const total = s.totalLeituras || 0;
                    const pVerde = total > 0 ? (s.alertasVerde || 0) / total * 100 : 0;
                    const pAmarelo = total > 0 ? (s.alertasAmarelo || 0) / total * 100 : 0;
                    const pVermelho = total > 0 ? (s.alertasVermelho || 0) / total * 100 : 0;
                    const pRuptura = total > 0 ? (s.alertasRuptura || 0) / total * 100 : 0;
                    return (
                      <>
                        <span><span style={{ color: '#4ade80', marginRight: '0.25rem' }}>●</span>{pVerde.toFixed(2)}% Normal</span>
                        <span><span style={{ color: '#facc15', marginRight: '0.25rem' }}>●</span>{pAmarelo.toFixed(2)}% Atenção</span>
                        <span><span style={{ color: '#ef4444', marginRight: '0.25rem' }}>●</span>{pVermelho.toFixed(2)}% Crítico</span>
                        <span><span style={{ color: '#7c3aed', marginRight: '0.25rem' }}>●</span>{pRuptura.toFixed(2)}% Ruptura</span>
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {/* Tabela 9 TCC — Limites de alerta com sinalização visual */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gray-700)', margin: '0 0 0.5rem 0' }}>
                Tabela 9 (TCC) — Classificação do Nível de Alerta com base no Fator de Risco Integrado
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                      {['Fator de Risco (FR)', 'Índice (%)', 'LED / Nível', 'Situação', 'Ação recomendada'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Situação' || h === 'Ação recomendada' ? 'left' : 'center', borderBottom: '2px solid var(--gray-200)', fontWeight: '600', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const mediaRisco = s?.risco?.media || 0;
                      const temRuptura = reportData?.dados?.some(d => d.indiceRisco === 100 && parseFloat(d.umidadeSolo) >= 30);
                      return [
                        // ativo é mutuamente exclusivo — apenas uma linha recebe ✓
                        // Ruptura tem precedência; depois é a faixa da média de risco
                        { fr: '0,00 – 0,45', pct: '0 – 45%', nivel: '🟢 Verde', situacao: 'Condições normais de operação', acao: 'Monitoramento de rotina. Sem intervenção necessária.', bg: '#f0fdf4', color: '#166534', ativo: !temRuptura && mediaRisco <= 45 },
                        { fr: '0,46 – 0,75', pct: '46 – 75%', nivel: '🟡 Amarelo', situacao: 'Atenção — monitoramento intensificado', acao: 'Aumentar frequência de leituras. Verificar APIs e sensor físico.', bg: '#fefce8', color: '#854d0e', ativo: !temRuptura && mediaRisco > 45 && mediaRisco <= 75 },
                        { fr: '> 0,75', pct: '> 75%', nivel: '🔴 Vermelho', situacao: 'Alerta crítico — ação imediata requerida', acao: 'Acionar protocolo de emergência. Notificar equipes. Avaliar evacuação.', bg: '#fef2f2', color: '#991b1b', ativo: !temRuptura && mediaRisco > 75 },
                        { fr: '1,00 (override)', pct: '100%', nivel: '🚨 Ruptura', situacao: 'Umidade ≥ 30% — FR forçado por hardware', acao: 'EVACUAÇÃO IMEDIATA. Buzzer ativo. acionarRuptura() sobrescreve a Equação 5.', bg: '#f5f3ff', color: '#581c87', ativo: temRuptura },
                      ].map(({ fr, pct, nivel, situacao, acao, bg, color, ativo }) => (
                        <tr key={fr} style={{ backgroundColor: ativo ? bg : 'white', borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: '600', color }}>{fr}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: '700', color }}>{pct}</td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: '600', color }}>
                            {nivel}{ativo && <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem' }} title="Faixa da média do período">✓</span>}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--gray-700)' }}>
                            {situacao}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--gray-600)', fontSize: '0.75rem' }}>{acao}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          {/* ── Seção 2: Meteorologia e Pluviometria ──────────────────── */}
          <SectionCard sKey="s2" title="2. Dados Meteorológicos e Pluviométricos" className="mb-4">
            <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--blue-50)', borderRadius: '0.5rem', border: '1px solid var(--blue-200)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--blue-700)' }}>
              <strong>Fontes:</strong> Precipitações históricas via BNDMET/DECEA — estação <strong>{s.estacao}</strong> (Alberto Flores, rede ANA). Condições e previsão via <strong>OpenWeatherMap (OWM)</strong>.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CloudRain size={15} /> Precipitação (BNDMET D6594)
                </h4>
                <StatRow label="Acumulado 24h" value={fmt(s.precip24h?.media)} unit="mm" tooltip="Precipitação acumulada nas últimas 24h via endpoint I006 da API BNDMET. Limiar máximo: 50 mm. Fator: F_ch.24h = precip24h / 50 (Equação 1). Componente: V_ch.24h = F_ch.24h x 0,08 (Equação 2)." />
                <StatRow label="Acumulado 7 dias" value={fmt(s.precip7d?.media)} unit="mm" tooltip="Precipitação acumulada nos últimos 7 dias via endpoint I006. Limiar máximo: 150 mm. Fator: F_ch.7d = precip7d / 150 (Equação 3). Componente V_ch.7d = F_ch.7d x 0,12 (Equação 4)." />
                <StatRow label="Acumulado 30 dias" value={fmt(s.precip30d?.media)} unit="mm" tooltip="Precipitação acumulada nos últimos 30 dias via endpoint I006. Limiar máximo: 300 mm. Fator: F_ch.30d = precip30d / 300 (Equação 5). Componente V_ch.30d = F_ch.30d x 0,10 (Equação 6)." />
                <StatRow label="Precipitação atual (I175)" value={fmt(s.precipAtual?.media)} unit="mm" tooltip="Precipitação horária mais recente via endpoint I175 da API BNDMET. Fornece a leitura instantânea da estação D6594. Informativo — não entra diretamente na equação de risco." />
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>🌤 Condições e Previsão (OWM)</h4>
                <StatRow label="Temperatura" value={fmt(s.temperatura?.media)} unit="°C" tooltip="Temperatura do ar no local monitorado (°C) retornada pelo endpoint /weather da API OpenWeatherMap. Informativa — não entra na equação de risco." />
                <StatRow label="Umidade externa" value={fmt(s.umidadeExterna?.media)} unit="%" tooltip="Umidade relativa do ar (%) retornada pelo endpoint /weather da API OpenWeatherMap. Informativa — não entra na equação de risco." />
                <StatRow label="Pressão atm. (grnd_level)" value={fmt(s.pressao?.media)} unit="hPa" tooltip="Pressão ao nível do solo (hPa) — campo grnd_level do endpoint /weather da API OpenWeatherMap. Mais preciso que a pressão ao nível do mar para localidades com altitude significativa. Usado no cálculo de V_pressão (peso 0,05): quedas ≥ 5 hPa em 3h entre leituras consecutivas indicam instabilidade atmosférica antecipatória de chuva." />
                <StatRow label="Velocidade do vento" value={fmt(s.vento?.media)} unit="m/s" tooltip="Velocidade do vento (m/s) retornada pelo endpoint /weather da API OpenWeatherMap. Informativa — não entra na equação de risco." />
                <StatRow label="Chuva atual (rain.1h)" value={fmt(s.chuvaAtualOwm?.media)} unit="mm/h" tooltip="Representa a precipitação na próxima hora em mm/h — campo rain.1h do endpoint /weather da API OpenWeatherMap. Campo ausente na resposta quando não há chuva no período. Informativo — não entra na equação de risco." />
                <StatRow label="Previsão 24h (/forecast)" value={fmt(s.chuvaFutura24h?.media)} unit="mm" tooltip="Total previsto para as próximas 24h - soma dos 8 blocos de 3h do endpoint /forecast (parâmetro cnt=8) da API OpenWeatherMap, campo rain.3h. Classificado conforme Tabela 7 (AlertaRio, adaptado para a estação D6594). Componente: V_ch.fut = F_ch.fut × 0,15 (Equação 7)." />
              </div>
            </div>

            {/* Tabela 7 TCC — Classificação intensidade pluviométrica AlertaRio */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gray-700)', margin: '0 0 0.5rem 0' }}>
                Tabela 7 (TCC) — Classificação da Intensidade Pluviométrica Prevista (24h)
                <span style={{ fontWeight: '400', color: 'var(--gray-500)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                  Fonte: Sistema AlertaRio, adaptado para D6594 (jan–mar/2026)
                </span>
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                      {['Intensidade', 'Acumulado previsto 24h (mm)', 'Fator ch.fut', 'V_ch.futura (×0,15)', 'Sinalização'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Intensidade' ? 'left' : 'center', borderBottom: '2px solid var(--gray-200)', fontWeight: '600', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Fraca', range: '< 5 mm', fator: '0,00', vx: '0,000', bg: '#f0fdf4', color: '#166534', dot: '🟢' },
                      { label: 'Moderada', range: '≥ 5 e < 25 mm', fator: '0,25', vx: '0,038', bg: '#fefce8', color: '#854d0e', dot: '🟡' },
                      { label: 'Forte', range: '≥ 25 e < 50 mm', fator: '0,50', vx: '0,075', bg: '#fff7ed', color: '#9a3412', dot: '🟠' },
                      { label: 'Muito Forte', range: '≥ 50 e < 80 mm', fator: '0,75', vx: '0,113', bg: '#fef2f2', color: '#991b1b', dot: '🔴' },
                      { label: 'Pancada de Chuva', range: '≥ 80 mm', fator: '1,00', vx: '0,150', bg: '#f5f3ff', color: '#581c87', dot: '⛈️' },
                    ].map(({ label, range, fator, vx, bg, color, dot }) => (
                      <tr key={label} style={{ backgroundColor: bg, borderBottom: '1px solid var(--gray-200)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color }}>{label}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--gray-700)' }}>{range}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: '700', color }}>{fator}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gray-600)' }}>{vx}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '1rem' }}>{dot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', margin: '0.375rem 0 0 0' }}>
              </p>
            </div>
          </SectionCard>

          {/* ── Seção 3: Componentes Eq.5 ─────────────────────────────── */}
          <SectionCard sKey="s3" title="3. Componentes da Equação 5 TCC" className="mb-4">
            <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--yellow-50)', borderRadius: '0.5rem', border: '1px solid var(--yellow-200)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--yellow-800)' }}>
              <strong>FR = V_lençol + V_ch.24h + V_ch.7d + V_ch.30d + V_ch.fut + V_taxa + V_pressão</strong>
              <span style={{ fontSize: '0.75rem', fontWeight: '400', display: 'block', marginTop: '0.25rem', color: '#92400e' }}>
                Onde cada <strong>V_x = F_x × peso</strong> — o fator normalizado multiplicado pelo peso da variável.
                Intervalos: V_lençol ∈ [0; 0,40] | V_ch.24h ∈ [0; 0,08] | V_ch.7d ∈ [0; 0,12] | V_ch.30d ∈ [0; 0,10] | V_ch.fut ∈ [0; 0,15] | V_taxa ∈ [0; 0,10] | V_pressão ∈ [0; 0,05]
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '400', display: 'block', marginTop: '0.375rem', color: '#92400e' }}>
                <strong>Amplificação ×1,20:</strong> aplicada quando o solo já está em saturação avançada (V_lençol ≥ 0,70, equivalente a umidade ≥ 17,5%) <em>e</em> há chuva moderada ou superior prevista (≥ 5 mm/24h). A combinação é qualitativamente mais grave que a soma linear dos fatores individuais.
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '400', display: 'block', marginTop: '0.375rem', color: '#7f1d1d' }}>
                <strong>Ruptura imediata:</strong> quando umidade ≥ 30%, o firmware ignora a equação e força FR = 1,0 diretamente, acionando buzzer e LED vermelho.
              </span>
            </div>
            <StatsTable decimals={3} rows={[
              { label: 'V_lençol', fonte: 'ESP8266 ADC', min: s.vLencol?.min, media: s.vLencol?.media, max: s.vLencol?.max, unit: '[0–0,40]', tooltip: 'Peso 0,40. Representa o nível do lençol freático estimado via higrômetro. Equação 8: F_lençol = umidade / 25. Limiar máximo: 25% de umidade (F=1,0). Linha de ruptura: 30% (override imediato pelo firmware). V_lençol = F_lençol × 0,40 (Equação 9). Fonte: sensor capacitivo ESP8266, saída analógica A0.' },
              { label: 'V_ch.24h', fonte: 'BNDMET I006', min: s.vChuvaAtual?.min, media: s.vChuvaAtual?.media, max: s.vChuvaAtual?.max, unit: '[0–0,08]', tooltip: 'Peso 0,08. Precipitação acumulada nas últimas 24h normalizada pelo limiar de 50 mm. Equação 1: F_ch.24h = min(precip24h / 50, 1). O min() garante que o fator não ultrapasse 1 mesmo com chuvas acima do limiar. Fonte: BNDMET D6594, endpoint I006.' },
              { label: 'V_ch.7d', fonte: 'BNDMET I006', min: s.vChuvaHist?.min, media: s.vChuvaHist?.media, max: s.vChuvaHist?.max, unit: '[0–0,12]', tooltip: 'Peso 0,12. Precipitação acumulada nos últimos 7 dias normalizada pelo limiar de 150 mm. Equação 3: F_ch.7d = min(precip7d / 150, 1). Captura o estado de saturação acumulada do solo por chuvas antecedentes. Fonte: BNDMET D6594, endpoint I006.' },
              { label: 'V_ch.30d', fonte: 'BNDMET I006', min: s.vChuvaMensal?.min, media: s.vChuvaMensal?.media, max: s.vChuvaMensal?.max, unit: '[0–0,10]', tooltip: 'Peso 0,10. Precipitação acumulada nos últimos 30 dias normalizada pelo limiar de 300 mm. Equação 5: F_ch.30d = min(precip30d / 300, 1). Captura a saturação profunda do maciço por acúmulo prolongado que eleva o nível freático. Fonte: BNDMET D6594, endpoint I006.' },
              { label: 'V_ch.futura', fonte: 'OWM /forecast', min: s.vChuvaFutura?.min, media: s.vChuvaFutura?.media, max: s.vChuvaFutura?.max, unit: '[0–0,15]', tooltip: 'Peso 0,15. Fator discreto baseado na Tabela 7 (AlertaRio, adaptado para D6594): Fraca=0,00 / Moderada=0,25 / Forte=0,50 / Muito Forte=0,75 / Pancada=1,00. Equação 7: V_ch.fut = F_ch.fut × 0,15. Fonte: OWM /forecast, soma dos 8 blocos de 3h (campo rain.3h).' },
              { label: 'V_taxa', fonte: 'ESP8266 buffer', min: s.vTaxaVar?.min, media: s.vTaxaVar?.media, max: s.vTaxaVar?.max, unit: '[0–0,10]', tooltip: 'Peso 0,10. Mede a velocidade de saturação do maciço. Equação 10: V_taxa = max(ΔU, 0) / 10 × 0,10, onde ΔU é a variação de umidade entre a leitura mais recente e a mais antiga no buffer circular de 10 leituras. Detecta saturação rápida mesmo com umidade absoluta baixa.' },
              { label: 'V_pressão', fonte: 'OWM grnd_level', min: s.vPressao?.min, media: s.vPressao?.media, max: s.vPressao?.max, unit: '[0–0,05]', tooltip: 'Peso 0,05. Indicador precursor de instabilidade atmosférica: quedas rápidas de pressão sinalizam aproximação de frentes frias ou sistemas de baixa pressão. Equação 11: V_pressão = max(ΔP, 0) / 5 × 0,05, onde ΔP é a queda em hPa no intervalo de 3h entre leituras. Limiar: 5 hPa/3h. Fonte: OWM /weather, campo grnd_level.' },
            ]} />
          </SectionCard>

          {/* ── Seção 4: Qualidade técnica ────────────────────────────── */}
          <SectionCard sKey="s4" title="4. Qualidade Técnica do Sistema" className="mb-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Activity size={15} /> Disponibilidade das Fontes
                </h4>
                <StatRow label="Sensor ESP8266 OK" value={`${s.sensorOkPct}%`} tooltip="ADC=1024 indica sensor desconectado ou saturado — dado primário ausente. Desconto: −40% na confiabilidade. O higrômetro conectado ao pino A0 do ESP8266 retorna valores entre 0 e 1023 em operação normal." highlight={s.sensorOkPct >= 95 ? 'var(--green-600)' : 'var(--red-600)'} />
                <StatRow label="API BNDMET OK" value={`${s.bndmetOkPct}%`} tooltip="statusApiBndmet=OK. Falha impacta V_ch.24h, V_ch.7d e V_ch.30d — 3 componentes sem dado real. Desconto: −25% na confiabilidade. Retry de 30s apenas em caso de falha; em operação normal o intervalo é adaptativo: 5min (Verde), 2min (Amarelo) ou 1min (Vermelho)." highlight={s.bndmetOkPct >= 90 ? 'var(--green-600)' : 'var(--yellow-600)'} />
                <StatRow label="Qualidade BNDMET (média)" value={`${fmt(s.qualBndmet?.media)}%`} tooltip="Percentual de medições válidas retornadas pela estação D6594. Opera com qualidade histórica de ~76% — abaixo de 80% aplica desconto fixo de −10% na confiabilidade. Mutuamente exclusivo com o desconto de BNDMET indisponível: se a API caiu, este desconto não é aplicado." />
                <StatRow label="API OWM OK" value={`${s.owmOkPct}%`} tooltip="statusApiOwm=OK. Falha impacta V_ch.fut e V_pressão — 2 componentes sem dado real. Desconto: −15% na confiabilidade. Retry de 30s apenas em caso de falha; em operação normal o intervalo é fixo em 30 minutos." highlight={s.owmOkPct >= 90 ? 'var(--green-600)' : 'var(--yellow-600)'} />
                <StatRow label="WiFi Conectado" value={`${s.wifiOkPct}%`} tooltip="Falha de WiFi impede a transmissão dos dados ao backend, mas o cálculo de risco continua ocorrendo localmente no ESP8266. Desconto: −10% na confiabilidade. Dados calculados sem WiFi são descartados — não há fila de reenvio no firmware atual." />
                <StatRow label="Estação consultada" value={s.estacao} tooltip="Estação pluviométrica D6594 (Alberto Flores, Minas Gerais — MG), rede ANA, operante desde dezembro/2021. Selecionada por ser a única estação operante a menos de 10 km do ponto de referência em Brumadinho (MG), com altitude compatível (725 m)." />
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Shield size={15} /> Eventos e Limites
                </h4>
                <StatRow label="Amplificação ×1,20" value={`${s.eventosAmplificado ?? 0} eventos`} tooltip="Mecanismo ativado quando duas condições ocorrem simultaneamente: F_lençol ≥ 0,70 (solo com saturação avançada, equivalente a umidade ≥ 17,5%) E acumulado previsto ≥ 5 mm/24h (intensidade Moderada ou superior). O fator de risco é multiplicado por 1,20 para refletir a condição qualitativamente mais grave que a soma linear dos componentes individuais." />
                <StatRow label="Buzzer Ativo" value={`${s.eventosBuzzer ?? 0} eventos`} tooltip="Buzzer ativo no ESP8266 — acionado pelo Módulo 3 (Sistema de Alerta) quando o nível de alerta é Vermelho ou quando a função acionarRuptura() é chamada por umidade ≥ 30%." highlight={s.eventosBuzzer > 0 ? 'var(--red-600)' : 'var(--green-600)'} />
                <StatRow label="Modo Manual" value={`${s.eventosModoManual ?? 0} registros`} tooltip="Registros com modoManual=true foram inseridos diretamente via curl ou Postman durante testes e desenvolvimento. Devem ser excluídos de análises automáticas de tendência pois não representam leituras reais do sensor em campo." />
                <StatRow label="Risco mín. / máx." value={`${fmt(s.risco?.min)}% / ${fmt(s.risco?.max)}%`} tooltip="Fator de risco integrado (FR) calculado pela Equação 12. Limites: Verde 0–0,45 (0–45%) / Amarelo 0,46–0,75 (46–75%) / Vermelho >0,75 (>75%). Em caso de ruptura (umidade ≥ 30%) o firmware força FR=1,0 (100%) independente da equação." highlight={s.risco?.max > 75 ? 'var(--red-600)' : s.risco?.max > 45 ? 'var(--yellow-600)' : 'var(--green-600)'} />
                <StatRow label="Confiabilidade mín. / máx." value={`${fmt(s.confiabilidade?.min)}% / ${fmt(s.confiabilidade?.max)}%`} tooltip="Confiabilidade mínima do período. O máximo operacional normal é 90%: base 100% menos −10% de qualidade BNDMET (D6594 opera com ~76%) menos ausência de outros descontos. Valores abaixo de 70% indicam múltiplas falhas simultâneas no mesmo ciclo de leitura." highlight={s.confiabilidade?.min < 60 ? 'var(--red-600)' : 'var(--gray-700)'} />
              </div>
            </div>
          </SectionCard>

          {/* ── Seção 5: Hardware ESP8266 ─────────────────────────────── */}
          <SectionCard sKey="s5" title="5. Diagnóstico de Hardware — ESP8266" className="mb-4">
            <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.5rem', border: '1px solid var(--gray-200)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
              Dados do campo <code style={{ backgroundColor: 'var(--gray-200)', padding: '0 4px', borderRadius: '3px' }}>dadosBrutos</code> de cada leitura.
              freeHeap &lt; 5.000 bytes → watchdog pode reiniciar o ESP8266.
              RSSI abaixo de −80 dBm → sinal WiFi instável.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Cpu size={15} /> Memória
                </h4>
                <StatRow label="freeHeap mínimo" value={Math.round(s.freeHeap?.min || 0).toLocaleString('pt-BR')} unit="bytes" tooltip="Menor memória heap livre registrada no período. Abaixo de 5.000 bytes o watchdog timer reinicia o ESP8266 automaticamente. Referência operacional do firmware v15: ~10.000–12.000 bytes em operação normal (mínimo observado nos testes: 10.312 bytes)." highlight={(s.freeHeap?.min || 0) < 5000 ? 'var(--red-600)' : 'var(--green-600)'} />
                <StatRow label="freeHeap médio" value={Math.round(s.freeHeap?.media || 0).toLocaleString('pt-BR')} unit="bytes" tooltip="Memória heap livre média ao longo do período. Quedas progressivas indicam vazamento de memória. O firmware v15 manteve heap estável entre 10.312 e 11.096 bytes nos testes de bancada, confirmando estabilidade de memória." />
                <StatRow label="Uptime máximo" value={`${Math.round((s.uptimeMax || 0) / 60000)}`} unit="min" tooltip="Tempo máximo sem reinicialização do ESP8266 registrado no período. O firmware realiza reboot automático por watchdog quando: freeHeap < 5.000 bytes, mais de 10 tentativas consecutivas de reconexão WiFi sem sucesso, ou mais de 10 falhas consecutivas de envio ao backend." />
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Wifi size={15} /> Conectividade
                </h4>
                <StatRow label="RSSI médio" value={`${fmt(s.rssi?.media)}`} unit="dBm" tooltip="Intensidade média do sinal WiFi em dBm. Acima de −70 dBm: sinal bom. Entre −70 e −80 dBm: aceitável. Abaixo de −80 dBm: instável, pode causar timeouts nas requisições HTTP às APIs BNDMET e OWM." highlight={(s.rssi?.media || 0) > -70 ? 'var(--green-600)' : 'var(--yellow-600)'} />
                <StatRow label="RSSI mínimo" value={`${fmt(s.rssi?.min)}`} unit="dBm" tooltip="Pior sinal WiFi registrado no período. Valores abaixo de −85 dBm estão correlacionados com aumento de tentativas de reenvio ao backend e falhas nas chamadas às APIs externas." highlight={(s.rssi?.min || 0) < -80 ? 'var(--red-600)' : 'var(--gray-700)'} />
                <StatRow label="Tentativas de envio (média)" value={fmt(s.tentativasEnvio?.media)} tooltip="Número médio de tentativas HTTP para enviar cada leitura ao backend. 0 = enviado na primeira tentativa. Valores altos indicam instabilidade de rede, backend indisponível ou timeout de resposta da API. Após 10 falhas consecutivas o firmware reinicia o módulo WiFi." />
                <StatRow label="Tentativas de envio (máx.)" value={fmt(s.tentativasEnvio?.max)} tooltip="Máximo de tentativas HTTP em uma única leitura. Mais de 3 tentativas indica problema de conectividade persistente naquele ciclo específico de envio." highlight={(s.tentativasEnvio?.max || 0) > 3 ? 'var(--red-600)' : 'var(--gray-700)'} />
              </div>
            </div>
          </SectionCard>

          {/* ── Seção 6: Tabela de Registros ─────────────────────────── */}
          <SectionCard sKey="s6" title={`6. Registros do Período — ${reportData.dados.length} leituras`} className="mb-4">
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={13} />
              Clique em uma linha para expandir os componentes V_x da Equação 5, diagnóstico e recomendação.
              Exibindo os primeiros 20 registros — exporte o CSV para todos ({reportData.dados.length}).
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--gray-50)' }}>
                    {[
                      ['Timestamp', null],
                      ['Umidade (%)', 'Leitura do sensor capacitivo no solo da barragem'],
                      ['ADC', 'Valor bruto do ADC (0–1023). ADC=1024 → sensor desconectado'],
                      ['Fator Local', 'Fator_lençol normalizado [0–1] = min(umidade/25, 1)'],
                      ['Risco (%)', 'Índice de risco integrado da Equação 5 (0–100%)'],
                      ['Nível', 'Verde ≤45% / Amarelo 46–75% / Vermelho >75%'],
                      ['Confiab. (%)', 'Confiabilidade da análise. Reduzida por falhas de sensor ou API'],
                      ['BNDMET', 'Status da API BNDMET nesta leitura'],
                      ['OWM', 'Status da API OpenWeatherMap nesta leitura'],
                      ['Sensor', 'Sensor físico OK (ADC válido, não saturado)'],
                    ].map(([h, tip]) => (
                      <th key={h} style={{ padding: '0.625rem 0.75rem', textAlign: h === 'Timestamp' ? 'left' : 'center', borderBottom: '2px solid var(--gray-200)', fontWeight: '600', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: h === 'Timestamp' ? 'flex-start' : 'center' }}>
                          {h}{tip && <Tooltip text={tip} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.dados.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Nenhum registro encontrado para o período selecionado.</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Tente ampliar o intervalo de datas.</span>
                        </div>
                      </td>
                    </tr>
                  ) : reportData.dados.slice(0, 20).map((d, i) => (
                    <>
                      <tr
                        key={d.id || i}
                        style={{ borderBottom: expandedRow === i ? 'none' : '1px solid var(--gray-100)', cursor: 'pointer', backgroundColor: expandedRow === i ? '#eff6ff' : 'transparent', transition: 'background 0.15s' }}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        onMouseEnter={e => { if (expandedRow !== i) e.currentTarget.style.backgroundColor = 'var(--gray-50)'; }}
                        onMouseLeave={e => { if (expandedRow !== i) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '0.625rem 0.75rem', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{formatDateBR(d.timestamp)}</td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '500', color: 'var(--terracotta)' }}>{fmt(parseFloat(d.umidadeSolo))}%</td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: d.valorAdc === 1024 ? 'var(--red-500)' : 'var(--gray-600)', fontWeight: d.valorAdc === 1024 ? '700' : '400' }}>{d.valorAdc}</td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', color: 'var(--gray-600)' }}>{fmt(parseFloat(d.fatorLocal))}</td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '700', color: (d.indiceRisco || 0) > 75 ? 'var(--red-600)' : (d.indiceRisco || 0) > 45 ? 'var(--yellow-600)' : 'var(--green-600)' }}>
                          {d.indiceRisco != null ? d.indiceRisco : fmt(parseFloat(d.riscoIntegrado || 0) * 100)}%
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}><NivelBadge nivel={d.nivelAlerta} dado={d} /></td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: '500', color: d.confiabilidade >= 90 ? 'var(--green-600)' : d.confiabilidade >= 70 ? 'var(--yellow-600)' : 'var(--red-600)' }}>
                          {d.confiabilidade != null ? `${d.confiabilidade}%` : '—'}
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}><StatusBadge value={d.statusApiBndmet === 'OK'} /></td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}><StatusBadge value={d.statusApiOwm === 'OK'} /></td>
                        <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center' }}><StatusBadge value={d.sensorOk} /></td>
                      </tr>

                      {/* Linha expandida */}
                      {expandedRow === i && (() => {
                        // ── helpers locais ──────────────────────────────────
                        const isRuptura = isRupturaRecord(d);
                        const det = d.dadosBrutos?.confiabilidade_detalhes || null;

                        // FR que a Eq.5 teria calculado (sem override)
                        const frEq5 = [d.vLencol, d.vChuvaAtual, d.vChuvaHistorica,
                        d.vChuvaMensal, d.vChuvaFutura, d.vTaxaVariacao, d.vPressao]
                          .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
                        const frEq5Pct = Math.round(frEq5 * 100);

                        // Mapa de descrições dos descontos
                        const descontoInfo = {
                          sensor_falha: { label: 'Sensor físico com falha', max: 40, desc: 'ADC=1024 — sensor desconectado ou saturado. Dado primário ausente.' },
                          bndmet_indisponivel: { label: 'BNDMET indisponível', max: 25, desc: 'API BNDMET fora do ar. V_ch.24h, V_ch.hist e V_ch.30d sem dado real.' },
                          qualidade_bndmet: { label: 'Qualidade BNDMET < 80%', max: 10, desc: 'Estação D6594 retornou dados com lacunas (valores nulos).' },
                          owm_indisponivel: { label: 'OWM indisponível', max: 15, desc: 'API OpenWeatherMap sem retorno. V_ch.futura e V_pressão sem dado.' },
                          wifi_desconectado: { label: 'WiFi desconectado', max: 10, desc: 'Cálculo ocorreu localmente no ESP8266 mas transmissão perdida.' },
                          buffer_insuficiente: { label: 'Buffer histórico insuficiente', max: 10, desc: 'Menos de 5 leituras acumuladas. Taxa de variação e histórico de pressão imprecisos.' },
                        };

                        return (
                          <tr key={`exp-${i}`} style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                            <td colSpan={10} style={{ padding: '1rem 1.25rem' }}>

                              {/* ── Banner de Ruptura ──────────────────────── */}
                              {isRuptura && (
                                <div style={{
                                  marginBottom: '1rem',
                                  padding: '0.875rem 1rem',
                                  backgroundColor: '#fef2f2',
                                  border: '2px solid #fca5a5',
                                  borderLeft: '6px solid #dc2626',
                                  borderRadius: '0.5rem',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem' }}>🚨</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      Override de Ruptura Ativado
                                    </span>
                                    <span style={{ marginLeft: 'auto', padding: '0.125rem 0.625rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700' }}>
                                      FR = 100%
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.8rem', color: '#7f1d1d', margin: '0 0 0.625rem 0', lineHeight: 1.5 }}>
                                    Umidade do solo <strong>{d.umidadeSolo}%</strong> atingiu ou superou o limiar crítico de <strong>30%</strong> (UMIDADE_RUPTURA).
                                    A função <code style={{ backgroundColor: '#fee2e2', padding: '0 4px', borderRadius: '3px', fontSize: '0.7rem' }}>acionarRuptura()</code> sobrescreveu
                                    o resultado da Equação 5 diretamente, forçando FR = 1,0 (100%).
                                  </p>
                                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #fca5a5', fontSize: '0.75rem' }}>
                                      <div style={{ color: '#6b7280', marginBottom: '0.125rem' }}>FR pela Equação 5 (sem override)</div>
                                      <div style={{ fontWeight: '700', color: '#d97706', fontSize: '0.875rem' }}>{frEq5Pct}% ({frEq5.toFixed(4)})</div>
                                      <div style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.125rem' }}>⚠️ Este valor foi descartado</div>
                                    </div>
                                    <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #fca5a5', fontSize: '0.75rem' }}>
                                      <div style={{ color: '#6b7280', marginBottom: '0.125rem' }}>FR final gravado</div>
                                      <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '0.875rem' }}>100% (1,0000)</div>
                                      <div style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.125rem' }}>✅ Override por hardware</div>
                                    </div>
                                    <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #fca5a5', fontSize: '0.75rem' }}>
                                      <div style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Confiabilidade</div>
                                      <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '0.875rem' }}>100%</div>
                                      <div style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.125rem' }}>✅ Estado confirmado por hardware</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>

                                {/* ── Componentes V_x ──────────────────────── */}
                                <div>
                                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-blue)', margin: '0 0 0.5rem 0' }}>⚙️ Componentes Equação 5</p>
                                  <div style={{ fontSize: '0.75rem' }}>
                                    {[
                                      ['V_lençol (×0,40)', d.vLencol],
                                      ['V_ch.24h (×0,08)', d.vChuvaAtual],
                                      ['V_ch.7d (×0,12)', d.vChuvaHistorica],
                                      ['V_ch.30d (×0,10)', d.vChuvaMensal],
                                      ['V_ch.futura (×0,15)', d.vChuvaFutura],
                                      ['V_taxa (×0,10)', d.vTaxaVariacao],
                                      ['V_pressão (×0,05)', d.vPressao],
                                    ].map(([lbl, val]) => (
                                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #dbeafe' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>{lbl}</span>
                                        <span style={{ fontWeight: '700', color: 'var(--primary-blue)' }}>{fmtV(val)}</span>
                                      </div>
                                    ))}
                                    {/* Soma da Eq.5 */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', marginTop: '0.125rem', borderTop: '1px dashed #93c5fd' }}>
                                      <span style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>Σ Eq.5 (sem override)</span>
                                      <span style={{ color: '#d97706', fontWeight: '600', fontSize: '0.7rem' }}>{frEq5Pct}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', marginTop: '0.125rem', borderTop: '2px solid #bfdbfe' }}>
                                      <span style={{ fontWeight: '700', color: 'var(--gray-700)' }}>Total FR {isRuptura ? '(override)' : ''}</span>
                                      <span style={{ fontWeight: '700', color: d.indiceRisco > 75 ? 'var(--red-600)' : d.indiceRisco > 45 ? 'var(--yellow-600)' : 'var(--green-600)' }}>
                                        {d.indiceRisco != null ? d.indiceRisco : fmt(parseFloat(d.riscoIntegrado || 0) * 100)}%
                                        {d.amplificado ? ' (×1,20 ✓)' : ''}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* ── Contexto meteorológico ────────────────── */}
                                <div>
                                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-blue)', margin: '0 0 0.5rem 0' }}>🌧 Contexto Meteorológico</p>
                                  <div style={{ fontSize: '0.75rem' }}>
                                    {[
                                      ['Precip. 24h', `${d.precipitacao24h} mm`],
                                      ['Precip. 7d', `${d.precipitacao7d} mm`],
                                      ['Precip. 30d', `${d.precipitacao30d} mm`],
                                      ['Precip. atual (I175)', `${d.precipitacaoAtual} mm`],
                                      ['Chuva futura 24h', `${d.chuvaFutura24h} mm (${d.intensidadePrevisao || '—'})`],
                                      ['Taxa var. umidade', String(d.taxaVariacaoUmidade)],
                                      ['Descrição tempo', d.descricaoTempo || '—'],
                                    ].map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #dbeafe' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>{k}</span>
                                        <span style={{ fontWeight: '500' }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* ── Hardware e Status ─────────────────────── */}
                                <div>
                                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-blue)', margin: '0 0 0.5rem 0' }}>🔧 Hardware e Status</p>
                                  <div style={{ fontSize: '0.75rem' }}>
                                    {[
                                      ['freeHeap', `${(d.dadosBrutos?.freeHeap || 0).toLocaleString('pt-BR')} bytes`],
                                      ['RSSI', `${d.dadosBrutos?.rssi || '—'} dBm`],
                                      ['Uptime', `${Math.round((d.dadosBrutos?.uptime || 0) / 1000)}s`],
                                      ['Tentativas envio', String(d.dadosBrutos?.tentativasEnvio || 0)],
                                      ['Amplificado', d.amplificado ? '✅ Sim (×1,20)' : 'Não'],
                                      ['Modo', d.modoManual ? '⚠️ Manual' : '🤖 Automático'],
                                      ['Buzzer', d.buzzerAtivo ? '🔊 Ativo' : 'Inativo'],
                                    ].map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #dbeafe' }}>
                                        <span style={{ color: 'var(--gray-600)' }}>{k}</span>
                                        <span style={{ fontWeight: '500' }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* ── Tabela de Confiabilidade ──────────────── */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-blue)', margin: '0 0 0.5rem 0' }}>
                                    📊 Cálculo de Confiabilidade
                                  </p>
                                  {isRuptura ? (
                                    <div style={{ padding: '0.625rem 0.875rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
                                      <strong>100% — Estado Especial: RUPTURA</strong><br />
                                      <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>
                                        Durante a ruptura, o sensor físico confirma o estado diretamente por hardware.
                                        Todos os descontos normais são ignorados — a confiabilidade é forçada para 100%
                                        pois não há ambiguidade: o dado é real e o estado é crítico.
                                      </span>
                                    </div>
                                  ) : det ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#dbeafe' }}>
                                          <th style={{ padding: '0.375rem 0.625rem', textAlign: 'left', fontWeight: '600', color: '#1e40af' }}>Critério</th>
                                          <th style={{ padding: '0.375rem 0.625rem', textAlign: 'center', fontWeight: '600', color: '#1e40af' }}>Desconto máx.</th>
                                          <th style={{ padding: '0.375rem 0.625rem', textAlign: 'center', fontWeight: '600', color: '#1e40af' }}>Aplicado</th>
                                          <th style={{ padding: '0.375rem 0.625rem', textAlign: 'left', fontWeight: '600', color: '#1e40af' }}>Descrição</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Object.entries(det.descontos || {}).map(([chave, valor]) => {
                                          const info = descontoInfo[chave] || { label: chave, max: '?', desc: '' };
                                          const aplicado = valor > 0;
                                          return (
                                            <tr key={chave} style={{ borderBottom: '1px solid #bfdbfe', backgroundColor: aplicado ? '#fef9c3' : 'white' }}>
                                              <td style={{ padding: '0.375rem 0.625rem', fontWeight: aplicado ? '600' : '400', color: aplicado ? '#92400e' : '#4b5563' }}>
                                                {info.label}
                                              </td>
                                              <td style={{ padding: '0.375rem 0.625rem', textAlign: 'center', color: '#6b7280' }}>
                                                −{info.max}%
                                              </td>
                                              <td style={{ padding: '0.375rem 0.625rem', textAlign: 'center', fontWeight: '700', color: aplicado ? '#dc2626' : '#16a34a' }}>
                                                {aplicado ? `−${valor}%` : '0%'}
                                              </td>
                                              <td style={{ padding: '0.375rem 0.625rem', color: '#6b7280', fontStyle: aplicado ? 'normal' : 'italic' }}>
                                                {info.desc}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                        {/* Linha de total */}
                                        <tr style={{ backgroundColor: '#eff6ff', borderTop: '2px solid #93c5fd' }}>
                                          <td style={{ padding: '0.375rem 0.625rem', fontWeight: '700', color: '#1e40af' }}>
                                            Base (100%) − Total descontos
                                          </td>
                                          <td style={{ padding: '0.375rem 0.625rem', textAlign: 'center', color: '#6b7280' }}>—</td>
                                          <td style={{ padding: '0.375rem 0.625rem', textAlign: 'center', fontWeight: '700', color: '#dc2626' }}>
                                            −{det.total_desconto || 0}%
                                          </td>
                                          <td style={{ padding: '0.375rem 0.625rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                              <span style={{ color: '#6b7280' }}>Resultado final:</span>
                                              <span style={{
                                                fontWeight: '700', fontSize: '0.875rem',
                                                color: det.resultado >= 90 ? '#16a34a' : det.resultado >= 70 ? '#d97706' : '#dc2626'
                                              }}>
                                                {det.resultado}%
                                              </span>
                                            </span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #bfdbfe', fontSize: '0.75rem', color: '#6b7280' }}>
                                      Detalhes de confiabilidade não disponíveis para este registro (firmware anterior à v12).
                                    </div>
                                  )}
                                </div>

                                {/* ── Recomendação ─────────────────────────── */}
                                {d.recomendacao && (
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-blue)', margin: '0 0 0.25rem 0' }}>💡 Recomendação do Sistema</p>
                                    <p style={{ fontSize: '0.8rem', margin: 0, padding: '0.625rem 0.875rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #bfdbfe', lineHeight: 1.5 }}>
                                      {d.recomendacao}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {reportData.dados.length > 20 && (
              <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                Exibindo <strong>20</strong> de <strong>{reportData.dados.length}</strong> registros.
                Exporte o CSV para todos os {reportData.dados.length} registros com os 41 campos completos.
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}