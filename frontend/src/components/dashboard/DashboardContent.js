// Dashboard principal — Estrutura UX completa
// ============= src/components/dashboard/DashboardContent.js =============
'use client';

import { useState, useEffect } from 'react';
import { sensorService, userService } from '@/services/api';
import { formatDateBR } from '@/utils';
import StatCard from './StatCard';
import SensorChart from './SensorChart';
import AlertsPanel from './AlertsPanel';
import RecentActivity from './RecentActivity';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Activity, AlertTriangle, Shield, Droplets,
  Cloud, Zap, ThermometerSun, Wind, Gauge,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (v, d = 1) => {
  const x = parseFloat(v);
  if (isNaN(x) || v == null) return '—';
  return x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
};

const fmtRisco = (leitura) => {
  if (leitura?.indiceRisco != null)    return parseFloat(leitura.indiceRisco);
  if (leitura?.riscoIntegrado != null) return parseFloat(leitura.riscoIntegrado) * 100;
  return 0;
};

const NIVEL = {
  VERDE:    { label: '🟢 NORMAL',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  AMARELO:  { label: '🟡 ATENÇÃO', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  VERMELHO: { label: '🔴 CRÍTICO', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  RUPTURA:  { label: '🚨 RUPTURA', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
};

const DataRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: highlight || '#374151' }}>{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardContent() {
  const [stats,      setStats]      = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate,    setLastUpdate]    = useState(null);

  useEffect(() => { loadDashboardData(); }, []);


  const loadDashboardData = async () => {
    try {
      const [sensorStats, userStats, latestReadings, criticalAlerts] = await Promise.all([
        sensorService.getStatistics(),
        userService.getUserStats(),
        sensorService.getLatestReadings(50),
        sensorService.getAlerts(10),
      ]);
      setStats({ sensors: sensorStats.data, users: userStats.data });
      setSensorData(latestReadings.data || []);
      setAlerts(criticalAlerts.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // ── Dados derivados ──────────────────────────────────────────────────────
  const sensorStats   = stats?.sensors?.geral?.estatisticas24h || {};
  const ul            = stats?.sensors?.geral?.ultimaLeitura   || {};
  const mediaRiscoPct = (parseFloat(sensorStats.mediaRisco) || 0) * 100;
  const riscoAtual    = fmtRisco(ul);
  const nivelKey      = ul.indiceRisco === 100 ? 'RUPTURA' : (ul.nivelAlerta || 'VERDE');
  const nivel         = NIVEL[nivelKey] || NIVEL.VERDE;

  return (
    <div>

      {/* ── Linha 1: Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
            Monitoramento em tempo real da barragem
          </p>
        </div>
        {lastUpdate && (
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'flex-end' }}>
            Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' })}
          </span>
        )}
      </div>

      {/* ── Linha 2: Card situação atual ────────────────────────────── */}
      {ul.id && (
        <div style={{
          padding: '1.25rem 1.5rem', backgroundColor: nivel.bg,
          border: `2px solid ${nivel.border}`, borderRadius: '0.75rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', alignItems: 'start' }}>

            {/* Esquerda: nível + FR% */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: nivel.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                Situação Atual
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: nivel.color, lineHeight: 1 }}>
                {nivel.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.375rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '700', color: nivel.color }}>
                  {fmt(riscoAtual)}%
                </span>
                <span style={{ fontSize: '0.75rem', color: nivel.color, opacity: 0.7 }}>FR</span>
              </div>
              {ul.amplificado && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem', padding: '0.15rem 0.5rem', backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '0.25rem', fontSize: '0.72rem', fontWeight: '700', color: '#c2410c' }}>
                  <Zap size={11} /> Amplificado ×1,20
                </div>
              )}
            </div>

            {/* Centro: barra umidade + métricas */}
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#374151' }}>Umidade do Solo</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: parseFloat(ul.umidadeSolo) >= 30 ? '#dc2626' : parseFloat(ul.umidadeSolo) >= 20 ? '#d97706' : '#0891b2' }}>
                    {fmt(ul.umidadeSolo)}%
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '9999px',
                    width: `${Math.min((parseFloat(ul.umidadeSolo) || 0) / 30 * 100, 100)}%`,
                    backgroundColor: parseFloat(ul.umidadeSolo) >= 30 ? '#dc2626' : parseFloat(ul.umidadeSolo) >= 20 ? '#d97706' : '#0891b2',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                  <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>0%</span>
                  <span style={{ fontSize: '0.62rem', color: '#d97706' }}>Crítico: 25%</span>
                  <span style={{ fontSize: '0.62rem', color: '#dc2626' }}>Ruptura: 30%</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { label: 'Precip. 24h',    value: `${fmt(ul.precipitacao24h)} mm` },
                  { label: 'Prev. 24h',      value: `${fmt(ul.chuvaFutura24h)} mm` },
                  { label: 'Confiabilidade', value: ul.confiabilidade != null ? `${ul.confiabilidade}%` : '—',
                    highlight: ul.confiabilidade >= 90 ? '#16a34a' : ul.confiabilidade >= 70 ? '#d97706' : '#dc2626' },
                ].map(({ label, value, highlight }) => (
                  <div key={label} style={{ padding: '0.375rem 0.5rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: highlight || '#374151', marginTop: '0.1rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direita: qualidade + recomendação */}
            <div style={{ minWidth: '180px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.375rem' }}>
                Qualidade da Análise
              </div>
              <DataRow label="BNDMET"           value={ul.statusApiBndmet || '—'}   highlight={ul.statusApiBndmet === 'OK' ? '#16a34a' : '#dc2626'} />
              <DataRow label="OWM"              value={ul.statusApiOwm || '—'}      highlight={ul.statusApiOwm === 'OK' ? '#16a34a' : '#dc2626'} />
              <DataRow label="Sensor ESP"       value={ul.sensorOk ? '✅ OK' : '❌ Falha'} />
              <DataRow label="Qual. BNDMET"     value={ul.qualidadeDadosBndmet != null ? `${ul.qualidadeDadosBndmet}%` : '—'}
                highlight={ul.qualidadeDadosBndmet >= 80 ? '#16a34a' : ul.qualidadeDadosBndmet != null ? '#d97706' : '#9ca3af'} />
              <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#9ca3af' }}>
                Leitura: {formatDateBR(ul.timestamp)}
              </div>
              {ul.recomendacao && (
                <div style={{ marginTop: '0.5rem', padding: '0.375rem 0.5rem', backgroundColor: 'white', borderRadius: '0.25rem', border: '1px solid #e5e7eb', fontSize: '0.72rem', color: '#374151', lineHeight: 1.4 }}>
                  💡 {ul.recomendacao}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Linha 3: 5 KPIs ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <StatCard icon={Activity}      iconColor="#2563eb"
          value={sensorStats.totalLeituras || 0}
          label="Leituras Hoje" sub="últimas 24h" />
        <StatCard icon={Droplets}      iconColor="#0891b2"
          value={`${fmt(sensorStats.mediaUmidade)}%`}
          valueColor={parseFloat(sensorStats.mediaUmidade) >= 25 ? '#dc2626' : parseFloat(sensorStats.mediaUmidade) >= 15 ? '#d97706' : '#0891b2'}
          label="Umidade Média" sub="limiar crítico: 25%" />
        <StatCard icon={Shield}        iconColor="#dc2626"
          value={`${fmt(mediaRiscoPct)}%`}
          valueColor={mediaRiscoPct > 75 ? '#dc2626' : mediaRiscoPct > 45 ? '#d97706' : '#16a34a'}
          label="Risco Médio (FR)" sub="Verde ≤45% / Amar. ≤75%" />
        <StatCard icon={Cloud}         iconColor="#1d4ed8"
          value={`${fmt(sensorStats.mediaPrecipitacao)} mm`}
          label="Precip. Média 24h" sub="BNDMET D6594 I006" />
        <StatCard icon={AlertTriangle}
          iconColor={sensorStats.alertasCriticos > 0 ? '#dc2626' : '#16a34a'}
          value={sensorStats.alertasCriticos || 0}
          valueColor={sensorStats.alertasCriticos > 0 ? '#dc2626' : '#16a34a'}
          label="Alertas Críticos" sub="últimas 24h" />
      </div>

      {/* ── Linha 4: Gráfico (70%) + Alertas (30%) ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151', margin: 0 }}>
              Dados dos Sensores — Últimas 24h
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
          <SensorChart data={sensorData} />
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151', margin: '0 0 0.75rem' }}>
            Alertas Recentes
          </h4>
          <AlertsPanel alerts={alerts} onRefresh={loadDashboardData} />
        </div>
      </div>

      {/* ── Linha 5: Meteorologia + Atividade ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

        {ul.id && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151', margin: '0 0 0.75rem' }}>
              🌤 Meteorologia — Última Leitura
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[
                { icon: ThermometerSun, label: 'Temperatura',  value: `${fmt(ul.temperatura)} °C`,         color: '#d97706' },
                { icon: Droplets,       label: 'Umid. externa', value: `${fmt(ul.umidadeExterna)}%`,        color: '#0891b2' },
                { icon: Gauge,          label: 'Pressão atm.',  value: `${fmt(ul.pressaoAtmosferica)} hPa`, color: '#7c3aed' },
                { icon: Wind,           label: 'Vento',          value: `${fmt(ul.velocidadeVento)} m/s`,   color: '#059669' },
              ].map(({ icon: Ic, label, value, color }) => (
                <div key={label} style={{ padding: '0.5rem 0.625rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                    <Ic size={12} color={color} />
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151' }}>{value}</div>
                </div>
              ))}
            </div>
            {ul.descricaoTempo && (
              <div style={{ fontSize: '0.78rem', color: '#6b7280', padding: '0.375rem 0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>
                ☁️ {ul.descricaoTempo}
              </div>
            )}
            <div style={{ marginTop: '0.625rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Precipitação</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
                {[
                  { label: 'Acum. 24h', value: `${fmt(ul.precipitacao24h)} mm` },
                  { label: 'Acum. 7d',  value: `${fmt(ul.precipitacao7d)} mm` },
                  { label: 'Prev. 24h', value: `${fmt(ul.chuvaFutura24h)} mm` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '0.3rem 0.4rem', backgroundColor: '#eff6ff', borderRadius: '0.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', color: '#3b82f6', fontWeight: '600' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1d4ed8' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#374151', margin: '0 0 0.75rem' }}>
            📋 Atividade do Sistema
          </h4>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}