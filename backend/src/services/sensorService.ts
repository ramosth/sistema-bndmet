import prisma from '../config/database';
import { DadosESP8266, LogEntry } from '../types';

export class SensorService {
  // ✅ FUNÇÃO para calcular períodos em UTC
  private static getUTCPeriod(hoursAgo: number): Date {
    const now = new Date();
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  }

  // Salvar dados do ESP8266 - CORRIGIDO com nomes das colunas
  static async salvarDados(dados: DadosESP8266) {
    try {
      const novaLeitura = await prisma.leiturasSensor.create({
        data: {
          // ✅ TIMESTAMP EXPLÍCITO em UTC se fornecido
          timestamp: dados.timestamp ? new Date(dados.timestamp) : undefined,
          umidadeSolo: dados.umidadeSolo,
          valorAdc: dados.valorAdc,
          sensorOk: dados.sensorOk,
          fatorLocal: dados.fatorLocal,
          precipitacaoAtual: dados.precipitacaoAtual,
          precipitacao24h: dados.precipitacao24h,
          precipitacao7d: dados.precipitacao7d,
          precipitacao30d: dados.precipitacao30d,
          statusApiBndmet: dados.statusApiBndmet,
          qualidadeDadosBndmet: dados.qualidadeDadosBndmet,
          temperatura: dados.temperatura,
          umidadeExterna: dados.umidadeExterna,
          pressaoAtmosferica: dados.pressaoAtmosferica,
          velocidadeVento: dados.velocidadeVento,
          descricaoTempo: dados.descricaoTempo,
          precipitacaoPrevisao6h: dados.precipitacaoPrevisao6h,
          precipitacaoPrevisao24h: dados.precipitacaoPrevisao24h,
          tendenciaTempo: dados.tendenciaTempo,
          riscoIntegrado: dados.riscoIntegrado,
          indiceRisco: dados.indiceRisco,
          nivelAlerta: dados.nivelAlerta,
          recomendacao: dados.recomendacao,
          confiabilidade: dados.confiabilidade,
          tendenciaPiora: dados.tendenciaPiora,
          previsaoUmidade6h: dados.previsaoUmidade6h,
          previsaoUmidade24h: dados.previsaoUmidade24h,
          tempoAteCritico: dados.tempoAteCritico,
          statusSistema: dados.statusSistema,
          buzzerAtivo: dados.buzzerAtivo,
          modoManual: dados.modoManual,
          wifiConectado: dados.wifiConectado,
          blynkConectado: dados.blynkConectado,
          dadosBrutos: dados.dadosBrutos,
        },
      });

      // Log da operação
      await this.salvarLog({
        nivel: 'INFO',
        componente: 'SENSOR',
        mensagem: 'Dados recebidos do ESP8266',
        dadosExtras: { leituraId: novaLeitura.id, risco: dados.riscoIntegrado },
      });

      return novaLeitura;
    } catch (error) {
      console.error('Erro ao salvar dados do sensor:', error);
      throw error;
    }
  }

  // Buscar últimas leituras
  static async buscarUltimasLeituras(limite: number = 100) {
    return await prisma.leiturasSensor.findMany({
      take: limite,
      orderBy: { timestamp: 'desc' },
    });
  }

  // Buscar leituras por período - CORRIGIDO
  static async buscarLeiturasPorPeriodo(
    dataInicio: Date,
    dataFim: Date,
    pagina: number = 1,
    limite: number = 50
  ) {
    const skip = (pagina - 1) * limite;

    // ✅ GARANTIR que as datas sejam tratadas como UTC
    const inicioUTC = new Date(dataInicio.toISOString());
    const fimUTC = new Date(dataFim.toISOString());

    const [leituras, total] = await Promise.all([
      prisma.leiturasSensor.findMany({
        where: {
          timestamp: {
            gte: inicioUTC,
            lte: fimUTC,
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limite,
      }),
      prisma.leiturasSensor.count({
        where: {
          timestamp: {
            gte: inicioUTC,
            lte: fimUTC,
          },
        },
      }),
    ]);

    return { leituras, total };
  }

  // Buscar alertas críticos
  static async buscarAlertas(limite: number = 50) {
    return await prisma.leiturasSensor.findMany({
      where: {
        nivelAlerta: {
          in: ['CRÍTICO', 'ALTO', 'VERMELHO'],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limite,
    });
  }

  // Estatísticas gerais - CORRIGIDO com UTC
  static async obterEstatisticas() {
    const [
      totalLeituras,
      ultimaLeitura,
      mediaUmidade24h,
      alertasCriticos,
    ] = await Promise.all([
      prisma.leiturasSensor.count(),
      prisma.leiturasSensor.findFirst({
        orderBy: { timestamp: 'desc' },
      }),
      prisma.leiturasSensor.aggregate({
        where: {
          timestamp: {
            gte: this.getUTCPeriod(24), // ✅ CORRIGIDO: Últimas 24h em UTC
          },
        },
        _avg: {
          umidadeSolo: true,
          riscoIntegrado: true,
        },
        _count: true,
      }),
      prisma.leiturasSensor.count({
        where: {
          nivelAlerta: {
            in: ['CRÍTICO', 'ALTO', 'VERMELHO'],
          },
          timestamp: {
            gte: this.getUTCPeriod(24), // ✅ CORRIGIDO: Últimas 24h em UTC
          },
        },
      }),
    ]);

    return {
      totalLeituras,
      ultimaLeitura,
      estatisticas24h: {
        mediaUmidade: mediaUmidade24h._avg.umidadeSolo,
        mediaRisco: mediaUmidade24h._avg.riscoIntegrado,
        totalLeituras: mediaUmidade24h._count,
        alertasCriticos,
      },
    };
  }

  // Salvar log do sistema
  static async salvarLog(log: LogEntry) {
    try {
      return await prisma.logsSistema.create({
        data: {
          nivel: log.nivel,
          componente: log.componente,
          mensagem: log.mensagem,
          dadosExtras: log.dadosExtras,
        },
      });
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  }

  // Buscar logs
  static async buscarLogs(
    nivel?: string,
    componente?: string,
    limite: number = 100
  ) {
    const where: any = {};
    
    if (nivel) where.nivel = nivel;
    if (componente) where.componente = componente;

    return await prisma.logsSistema.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limite,
    });
  }
}