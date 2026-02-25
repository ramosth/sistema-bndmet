// Gráfico de dados dos sensores
// ============= src/components/dashboard/SensorChart.js =============
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDate } from '@/utils';

export default function SensorChart({ data = [] }) {
  // Processar dados para o gráfico com horário local (UTC-3)
  // Primeiro ordenar por timestamp (mais antigo para mais recente) e pegar os últimos 20
  const sortedData = [...data]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-20);

  const chartData = sortedData.map(item => {
    const utcDate = new Date(item.timestamp);
    
    return {
      time: utcDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: utcDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      umidade: parseFloat(item.umidadeSolo) || 0,
      precipitacao24h: parseFloat(item.precipitacao24h) || 0,
      precipitacaoPrevisao24h: parseFloat(item.precipitacaoPrevisao24h) || 0,
      risco: parseFloat(item.riscoIntegrado) || 0
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex-center" style={{ height: '200px', color: 'var(--gray-500)' }}>
        Nenhum dado disponível
      </div>
    );
  }

  // Tooltip customizado para mostrar mais informações
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
            {data.timestamp}
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
                {entry.value}
                {entry.dataKey === 'umidade' ? '%' : 
                 entry.dataKey === 'risco' ? '%' : 'mm'}
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
          
          {/* Linha de Umidade do Solo */}
          <Line 
            type="monotone" 
            dataKey="umidade" 
            stroke="var(--terracotta)" 
            strokeWidth={2}
            name="Umidade (%)"
            dot={{ fill: 'var(--terracotta)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--terracotta)' }}
          />
          
          {/* Linha de Precipitação 24h */}
          <Line 
            type="monotone" 
            dataKey="precipitacao24h" 
            stroke="var(--primary-blue)" 
            strokeWidth={2}
            name="Precipitação 24h (mm)"
            dot={{ fill: 'var(--primary-blue)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--primary-blue)' }}
          />
          
          {/* Linha de Precipitação Previsão 24h */}
          <Line 
            type="monotone" 
            dataKey="precipitacaoPrevisao24h" 
            stroke="var(--primary-blue-light)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Previsão 24h (mm)"
            dot={{ fill: 'var(--primary-blue-light)', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: 'var(--primary-blue-light)' }}
          />
          
          {/* Linha de Risco Integrado */}
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