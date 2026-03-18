// Gráfico de dados dos sensores
// ============= src/components/dashboard/SensorChart.js =============
// Ajuste #17: campo corrigido de precipitacaoPrevisao24h → chuvaFutura24h
// Ajuste #18: riscoIntegrado (0–1) multiplicado por 100 para plotar na mesma escala (0–100)
// Ajuste #19: timestamps com timeZone: 'America/Sao_Paulo' em vez de sem timezone
'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatTimeOnly, formatDateBR } from '@/utils';

export default function SensorChart({ data = [] }) {
  // Ordenar por timestamp (mais antigo → mais recente) e pegar os últimos 20
  const sortedData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-20);

  const chartData = sortedData.map(item => {
    return {
      // Ajuste #19: formatTimeOnly usa timeZone America/Sao_Paulo
      time: formatTimeOnly(item.timestamp),
      // Ajuste #19: tooltip usa formatDateBR com timezone correto
      timestampFormatado: formatDateBR(item.timestamp),
      umidade: parseFloat(item.umidadeSolo) || 0,
      precipitacao24h: parseFloat(item.precipitacao24h) || 0,
      // Ajuste #17: campo correto é chuvaFutura24h, não precipitacaoPrevisao24h
      chuvaFutura24h: parseFloat(item.chuvaFutura24h) || 0,
      // Ajuste #18: riscoIntegrado (0–1) → percentual (0–100) para mesma escala que umidade
      risco: (parseFloat(item.riscoIntegrado) || 0) * 100
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex-center" style={{ height: '200px', color: 'var(--gray-500)' }}>
        Nenhum dado disponível
      </div>
    );
  }

  // Tooltip customizado com timezone correto
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--gray-200)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          fontSize: '0.875rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--gray-700)' }}>
            {d.timestampFormatado}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{
              margin: '0.25rem 0',
              color: entry.color,
              display: 'flex',
              justifyContent: 'space-between',
              minWidth: '200px'
            }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: '600' }}>
                {entry.dataKey === 'risco'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.dataKey === 'umidade'
                    ? `${entry.value.toFixed(1)}%`
                    : `${entry.value.toFixed(1)}mm`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
          <XAxis
            dataKey="time"
            stroke="var(--gray-400)"
            fontSize={12}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            stroke="var(--gray-400)"
            fontSize={12}
            tick={{ fontSize: 10 }}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {/* Umidade do Solo */}
          <Line
            type="monotone"
            dataKey="umidade"
            stroke="var(--terracotta)"
            strokeWidth={2}
            name="Umidade (%)"
            dot={{ fill: 'var(--terracotta)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--terracotta)' }}
          />

          {/* Precipitação 24h */}
          <Line
            type="monotone"
            dataKey="precipitacao24h"
            stroke="var(--primary-blue)"
            strokeWidth={2}
            name="Precipitação 24h (mm)"
            dot={{ fill: 'var(--primary-blue)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--primary-blue)' }}
          />

          {/* Chuva Futura 24h — Ajuste #17: dataKey corrigido */}
          <Line
            type="monotone"
            dataKey="chuvaFutura24h"
            stroke="var(--primary-blue-light)"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Previsão 24h (mm)"
            dot={{ fill: 'var(--primary-blue-light)', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: 'var(--primary-blue-light)' }}
          />

          {/* Risco Integrado — Ajuste #18: já em percentual (0–100) */}
          <Line
            type="monotone"
            dataKey="risco"
            stroke="var(--red-500)"
            strokeWidth={2}
            name="Risco (%)"
            dot={{ fill: 'var(--red-500)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--red-500)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}