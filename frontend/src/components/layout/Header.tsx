'use client';

import { Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSensorStore } from '@/stores/sensorStore';
import { formatDate } from '@/lib/utils';

export function Header() {
  const { ultimaLeitura, alertas, isRealTimeEnabled, toggleRealTime } = useSensorStore();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Título da página */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Monitoramento em Tempo Real
        </h2>
        {ultimaLeitura && (
          <p className="text-sm text-gray-500">
            Última atualização: {formatDate(ultimaLeitura.timestamp)}
          </p>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center space-x-4">
        {/* Status da conexão */}
        <div className="flex items-center space-x-2">
          {ultimaLeitura?.wifiConectado ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm text-gray-600">
            {ultimaLeitura?.wifiConectado ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Tempo real */}
        <Button
          variant={isRealTimeEnabled ? "default" : "outline"}
          size="sm"
          onClick={toggleRealTime}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Tempo Real
        </Button>

        {/* Alertas */}
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {alertas.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {alertas.length}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}