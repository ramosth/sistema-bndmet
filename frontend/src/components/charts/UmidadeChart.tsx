'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DadosSensor } from '@/types';
import { formatDate } from '@/lib/utils';

interface UmidadeChartProps {
  dados: DadosSensor[];
  height?: number;
}

export function UmidadeChart({ dados, height = 300 }: UmidadeChartProps) {
  const chartData = dados
    .filter(d => d.umidadeSolo !== null && d.umidadeSolo !== undefined)
    .map(d => ({
      timestamp: d.timestamp,
      umidade: Number(d.umidadeSolo),
      risco: Number(d.riscoIntegrado || 0),
    }))
    .reverse(); // Mais recente à direita

  return (
    <Card>
      <CardHeader>
        <CardTitle>Umidade do Solo - Últimas 24h</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
              }}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              labelFormatter={(value) => formatDate(value)}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}${name === 'umidade' ? '%' : ''}`,
                name === 'umidade' ? 'Umidade' : 'Risco'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="umidade" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="risco" 
              stroke="#dc2626" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#dc2626', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}