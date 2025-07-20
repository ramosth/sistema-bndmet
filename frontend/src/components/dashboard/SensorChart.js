// Gráfico de dados dos sensores
// ============= src/components/dashboard/SensorChart.js =============
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDate } from '@/utils';

export default function SensorChart({ data = [] }) {
  // Processar dados para o gráfico
  const chartData = data.slice(-20).map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    umidade: item.umidadeSolo,
    temperatura: item.temperatura,
    risco: item.riscoIntegrado
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex-center" style={{ height: '200px', color: 'var(--gray-500)' }}>
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--gray-400)"
            fontSize={12}
          />
          <YAxis 
            stroke="var(--gray-400)"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="umidade" 
            stroke="var(--terracotta)" 
            strokeWidth={2}
            name="Umidade (%)"
            dot={{ fill: 'var(--terracotta)', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="temperatura" 
            stroke="var(--primary-blue)" 
            strokeWidth={2}
            name="Temperatura (°C)"
            dot={{ fill: 'var(--primary-blue)', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="risco" 
            stroke="var(--red-500)" 
            strokeWidth={2}
            name="Risco (%)"
            dot={{ fill: 'var(--red-500)', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}