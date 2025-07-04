'use client';

import { useEffect } from 'react';
import { 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  Activity,
  Cloud,
  Gauge
} from 'lucide-react';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { UmidadeChart } from '@/components/charts/UmidadeChart';
import { PrecipitacaoChart } from '@/components/charts/PrecipitacaoChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSensorStore } from '@/stores/sensorStore';
import { sensorService } from '@/services/api';

export default function DashboardPage() {
  const { 
    ultimaLeitura, 
    ultimasLeituras, 
    estatisticas,
    alertas,
    isLoading,
    error,
    setUltimasLeituras,
    setEstatisticas,
    setAlertas,
    setLoading,
    setError,
    isRealTimeEnabled
  } = useSensorStore();

  // Carregar dados iniciais
  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      try {
        const [leituras, stats, alertasCriticos] = await Promise.all([
          sensorService.getUltimasLeituras(50),
          sensorService.getEstatisticas(),
          sensorService.getAlertas(10)
        ]);

        setUltimasLeituras(leituras);
        setEstatisticas(stats);
        setAlertas(alertasCriticos);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  // Atualização em tempo real
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(async () => {
      try {
        const leituras = await sensorService.getUltimasLeituras(50);
        setUltimasLeituras(leituras);
      } catch (err) {
        console.error('Erro na atualização:', err);
      }
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, setUltimasLeituras]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas críticos */}
      {alertas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ {alertas.length} alerta(s) crítico(s) ativo(s)</strong>
            <br />
            Último: {alertas[0]?.recomendacao}
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Umidade do Solo"
          value={ultimaLeitura?.umidadeSolo || 0}
          unit="%"
          icon={Droplets}
          description={`Crítico: >25%`}
          riskLevel={ultimaLeitura?.umidadeSolo}
          alert={ultimaLeitura?.nivelAlerta}
        />

        <StatusCard
          title="Risco Integrado"
          value={ultimaLeitura?.riscoIntegrado || 0}
          unit="%"
          icon={Gauge}
          description={`Confiabilidade: ${ultimaLeitura?.confiabilidade || 0}%`}
          riskLevel={ultimaLeitura?.riscoIntegrado}
          alert={ultimaLeitura?.nivelAlerta}
        />

        <StatusCard
          title="Temperatura"
          value={ultimaLeitura?.temperatura || 0}
          unit="°C"
          icon={Thermometer}
          description={`Umidade ext: ${ultimaLeitura?.umidadeExterna || 0}%`}
        />

        <StatusCard
          title="Precipitação 24h"
          value={ultimaLeitura?.precipitacao24h || 0}
          unit="mm"
          icon={Cloud}
          description={ultimaLeitura?.tendenciaTempo || 'Sem dados'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UmidadeChart dados={ultimasLeituras} />
        <PrecipitacaoChart dados={ultimasLeituras} />
      </div>

      {/* Informações do sistema */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          title="Status do Sensor"
          value={ultimaLeitura?.sensorOk ? "Online" : "Offline"}
          icon={Activity}
          description={`ADC: ${ultimaLeitura?.valorAdc || 0}`}
          alert={ultimaLeitura?.sensorOk ? "VERDE" : "VERMELHO"}
        />

        <StatusCard
          title="Conexão WiFi"
          value={ultimaLeitura?.wifiConectado ? "Conectado" : "Desconectado"}
          icon={Activity}
          alert={ultimaLeitura?.wifiConectado ? "VERDE" : "VERMELHO"}
        />

        <StatusCard
          title="Total de Leituras"
          value={estatisticas?.totalLeituras || 0}
          icon={Activity}
          description={`Últimas 24h: ${estatisticas?.estatisticas24h?.totalLeituras || 0}`}
        />
      </div>

      {/* Recomendações */}
      {ultimaLeitura?.recomendacao && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recomendação do Sistema:</strong><br />
            {ultimaLeitura.recomendacao}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}