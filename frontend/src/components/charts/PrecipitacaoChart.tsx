'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DadosSensor } from '@/types';

interface PrecipitacaoChartProps {
  dados: DadosSensor[];
  height?: number;
}

export function PrecipitacaoChart({ dados, height = 300 }: PrecipitacaoChartProps) {
  const chartData = dados
    .filter(d => d.precipitacao24h !== null && d.precipitacao24h !== undefined)
    .slice(-7) // Últimos 7 dias
    .map((d, index) => ({
      dia: `Dia ${index + 1}`,
      precipitacao24h: Number(d.precipitacao24h),
      precipitacao7d: Number(d.precipitacao7d || 0),
    }))
    .reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precipitação - Últimos 7 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}mm`,
                name === 'precipitacao24h' ? '24h' : '7 dias'
              ]}
            />
            <Bar 
              dataKey="precipitacao24h" 
              fill="#3b82f6" 
              name="precipitacao24h"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}