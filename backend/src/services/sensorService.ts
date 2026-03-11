// backend > src > services > sensorService.ts
import prisma from '../config/database';
import { DadosESP8266, LogEntry } from '../types';

export class SensorService {
  // HELPER: Gerar data UTC para períodos
  private static getUTCPeriod(hoursAgo: number): Date {
    const now = new Date();
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  }

  // Salvar dados do ESP8266
  static async salvarDados(dados: DadosESP8266) {
    try {
      console.log('💾 Salvando dados do sensor:', {
        umidade: dados.umidadeSolo,
        risco: dados.riscoIntegrado,
        nivel: dados.nivelAlerta,
        timestamp: new Date().toISOString()
      });

      const novaLeitura = await prisma.leiturasSensor.create({
        data: {
          // Sensor local
          timestamp:              dados.timestamp ? new Date(dados.timestamp) : undefined,
          umidadeSolo:            dados.umidadeSolo,
          valorAdc:               dados.valorAdc,
          sensorOk:               dados.sensorOk,
          fatorLocal:             dados.fatorLocal,

          // BNDMET
          precipitacaoAtual:      dados.precipitacaoAtual,
          precipitacao24h:        dados.precipitacao24h,
          precipitacao7d:         dados.precipitacao7d,
          precipitacao30d:        dados.precipitacao30d,
          statusApiBndmet:        dados.statusApiBndmet,
          qualidadeDadosBndmet:   dados.qualidadeDadosBndmet,
          estacao:                dados.estacao,

          // Meteorologia OWM
          temperatura:            dados.temperatura,
          umidadeExterna:         dados.umidadeExterna,
          pressaoAtmosferica:     dados.pressaoAtmosferica,
          velocidadeVento:        dados.velocidadeVento,
          descricaoTempo:         dados.descricaoTempo,
          chuvaAtualOWM:          dados.chuvaAtualOWM,

          // Previsão OWM /forecast
          chuvaFutura24h:         dados.chuvaFutura24h,
          intensidadePrevisao:    dados.intensidadePrevisao,
          fatorIntensidade:       dados.fatorIntensidade,

          // Análise de risco
          riscoIntegrado:         dados.riscoIntegrado,
          indiceRisco:            dados.indiceRisco,
          nivelAlerta:            dados.nivelAlerta,
          recomendacao:           dados.recomendacao,
          confiabilidade:         dados.confiabilidade,
          amplificado:            dados.amplificado,
          taxaVariacaoUmidade:    dados.taxaVariacaoUmidade,

          // Componentes individuais da Equação 5 TCC
          vLencol:                dados.vLencol,
          vChuvaAtual:            dados.vChuvaAtual,
          vChuvaHistorica:        dados.vChuvaHistorica,
          vChuvaMensal:           dados.vChuvaMensal,
          vChuvaFutura:           dados.vChuvaFutura,
          vTaxaVariacao:          dados.vTaxaVariacao,
          vPressao:               dados.vPressao,

          // Status do sistema
          statusSistema:          dados.statusSistema,
          buzzerAtivo:            dados.buzzerAtivo,
          modoManual:             dados.modoManual,
          wifiConectado:          dados.wifiConectado,

          // Dados brutos
          dadosBrutos:            dados.dadosBrutos,
        },
      });

      // Determinar nível do log baseado no risco integrado
      let nivelLog: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
      let mensagemLog = 'Dados recebidos do ESP8266';

      if (dados.riscoIntegrado !== undefined && dados.riscoIntegrado !== null) {
        if (dados.riscoIntegrado <= 50) {
          nivelLog = 'INFO';
          mensagemLog = 'Dados recebidos - situação normal (risco baixo)';
        } else if (dados.riscoIntegrado > 50 && dados.riscoIntegrado <= 80) {
          nivelLog = 'WARNING';
          mensagemLog = 'Dados recebidos - atenção necessária (risco moderado)';
        } else if (dados.riscoIntegrado > 80) {
          nivelLog = 'CRITICAL';
          mensagemLog = 'Dados recebidos - situação crítica (risco alto)';
        }
      }

      // Log da operação
      await this.salvarLog({
        nivel: nivelLog,
        componente: 'SENSOR',
        mensagem: mensagemLog,
        dadosExtras: {
          leituraId:    novaLeitura.id,
          risco:        dados.riscoIntegrado,
          nivel:        dados.nivelAlerta,
          amplificado:  dados.amplificado,
          statusBndmet: dados.statusApiBndmet,
          estacao:      dados.estacao,
        },
      });

      return novaLeitura;
    } catch (error) {
      console.error('Erro ao salvar dados do sensor:', error);

      await this.salvarLog({
        nivel: 'ERROR',
        componente: 'SENSOR',
        mensagem: 'Erro ao salvar dados do sensor',
        dadosExtras: { error: error.message, dados },
      });

      throw error;
    }
  }

  // Buscar últimas leituras
  static async buscarUltimasLeituras(limite: number = 100) {
    try {
      return await prisma.leiturasSensor.findMany({
        take: limite,
        orderBy: { timestamp: 'desc' },
      });
    } catch (error) {
      console.error('❌ Erro ao buscar últimas leituras:', error);
      throw error;
    }
  }

  // Buscar leituras por período
  static async buscarLeiturasPorPeriodo(
    dataInicio: Date,
    dataFim: Date,
    pagina: number = 1,
    limite: number = 50
  ) {
    try {
      const skip = (pagina - 1) * limite;

      const inicioUTC = new Date(dataInicio.toISOString());
      const fimUTC = new Date(dataFim.toISOString());

      const [leituras, total] = await Promise.all([
        prisma.leiturasSensor.findMany({
          where: { timestamp: { gte: inicioUTC, lte: fimUTC } },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limite,
        }),
        prisma.leiturasSensor.count({
          where: { timestamp: { gte: inicioUTC, lte: fimUTC } },
        }),
      ]);

      return { leituras, total };
    } catch (error) {
      console.error('❌ Erro ao buscar leituras por período:', error);
      throw error;
    }
  }

  // Buscar leituras por período no timezone brasileiro
  static async buscarLeiturasPorPeriodoTimezone(
    dataInicio: string,
    dataFim: string,
    pagina: number = 1,
    limite: number = 50
  ) {
    try {
      const skip = (pagina - 1) * limite;

      const dataInicioStr = dataInicio.split('T')[0];
      const dataFimStr    = dataFim.split('T')[0];

      console.log('Buscando registros por data brasileira:', {
        dataInicio: dataInicioStr,
        dataFim: dataFimStr,
        pagina,
        limite
      });

      const idsResult = await prisma.$queryRaw`
        SELECT id FROM leituras_sensor
        WHERE (timestamp AT TIME ZONE 'America/Sao_Paulo')::date
        BETWEEN ${dataInicioStr}::date AND ${dataFimStr}::date
        ORDER BY timestamp DESC
      `;

      const ids   = (idsResult as any[]).map(row => row.id);
      const total = ids.length;

      if (total === 0) return { leituras: [], total: 0 };

      const idsPaginados = ids.slice(skip, skip + limite);

      const leituras = await prisma.leiturasSensor.findMany({
        where: { id: { in: idsPaginados } },
        orderBy: { timestamp: 'desc' },
      });

      console.log('Resultado da busca híbrida:', {
        totalEncontrado: total,
        registrosRetornados: leituras.length,
        range: `${dataInicioStr} até ${dataFimStr}`
      });

      return { leituras, total };
    } catch (error) {
      console.error('❌ Erro na busca híbrida:', error);
      throw error;
    }
  }

  // Buscar alertas críticos
  static async buscarAlertas(limite: number = 50, nivelAlerta?: string) {
    try {
      const where: any = nivelAlerta
        ? { nivelAlerta }
        : { nivelAlerta: { in: ['VERMELHO', 'AMARELO'] } };

      return await prisma.leiturasSensor.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limite,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar alertas:', error);
      throw error;
    }
  }

  // Estatísticas gerais
  static async obterEstatisticas() {
    try {
      const [totalLeituras, ultimaLeitura, estatisticas24h, alertasCriticos, statusBndmet] =
        await Promise.all([
          prisma.leiturasSensor.count(),

          prisma.leiturasSensor.findFirst({
            orderBy: { timestamp: 'desc' },
          }),

          prisma.leiturasSensor.aggregate({
            where: { timestamp: { gte: this.getUTCPeriod(24) } },
            _avg: {
              umidadeSolo:    true,
              riscoIntegrado: true,
              indiceRisco:    true,
              precipitacao24h: true,
              temperatura:    true,
            },
            _count: true,
          }),

          prisma.leiturasSensor.count({
            where: {
              nivelAlerta: { in: ['CRÍTICO', 'ALTO', 'VERMELHO'] },
              timestamp:   { gte: this.getUTCPeriod(24) },
            },
          }),

          prisma.leiturasSensor.groupBy({
            by: ['statusApiBndmet'],
            where: { timestamp: { gte: this.getUTCPeriod(1) } },
            _count: true,
          }),
        ]);

      return {
        totalLeituras,
        ultimaLeitura,
        estatisticas24h: {
          mediaUmidade:      estatisticas24h._avg.umidadeSolo,
          mediaRisco:        estatisticas24h._avg.riscoIntegrado,
          mediaIndiceRisco:  estatisticas24h._avg.indiceRisco,
          mediaPrecipitacao: estatisticas24h._avg.precipitacao24h,
          mediaTemperatura:  estatisticas24h._avg.temperatura,
          totalLeituras:     estatisticas24h._count,
          alertasCriticos,
        },
        statusBndmet,
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // Salvar log do sistema
  static async salvarLog(log: LogEntry) {
    try {
      return await prisma.logsSistema.create({
        data: {
          nivel:       log.nivel,
          componente:  log.componente,
          mensagem:    log.mensagem,
          dadosExtras: log.dadosExtras,
        },
      });
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  }

  // Buscar logs
  static async buscarLogs(nivel?: string, componente?: string, limite: number = 100) {
    try {
      const where: any = {};
      if (nivel)      where.nivel      = nivel;
      if (componente) where.componente = componente;

      return await prisma.logsSistema.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limite,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      throw error;
    }
  }

  // Buscar dados para análise de tendências
  static async buscarDadosTendencia(periodo: number = 168) {
    try {
      return await prisma.leiturasSensor.findMany({
        where: { timestamp: { gte: this.getUTCPeriod(periodo) } },
        select: {
          timestamp:          true,
          umidadeSolo:        true,
          precipitacao24h:    true,
          precipitacao7d:     true,
          riscoIntegrado:     true,
          indiceRisco:        true,
          nivelAlerta:        true,
          temperatura:        true,
          pressaoAtmosferica: true,
          amplificado:        true,
          chuvaFutura24h:     true,
          intensidadePrevisao: true,
        },
        orderBy: { timestamp: 'asc' },
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados de tendência:', error);
      throw error;
    }
  }

  // Verificar conectividade dos sistemas
  static async verificarConectividade() {
    try {
      const ultimaLeitura = await prisma.leiturasSensor.findFirst({
        orderBy: { timestamp: 'desc' },
        select: {
          timestamp:            true,
          wifiConectado:        true,
          statusApiBndmet:      true,
          sensorOk:             true,
          qualidadeDadosBndmet: true,
          estacao:              true,
        },
      });

      if (!ultimaLeitura) {
        return {
          status: 'offline',
          ultimaLeitura: null,
          wifi: false,
          bndmet: 'desconhecido',
          sensor: false,
        };
      }

      const minutosAtras = Math.floor(
        (Date.now() - ultimaLeitura.timestamp.getTime()) / (1000 * 60)
      );

      return {
        status:               minutosAtras < 10 ? 'online' : 'offline',
        ultimaLeitura:        ultimaLeitura.timestamp,
        minutosUltimaLeitura: minutosAtras,
        wifi:                 ultimaLeitura.wifiConectado,
        bndmet:               ultimaLeitura.statusApiBndmet,
        sensor:               ultimaLeitura.sensorOk,
        qualidadeBndmet:      ultimaLeitura.qualidadeDadosBndmet,
        estacao:              ultimaLeitura.estacao,
      };
    } catch (error) {
      console.error('❌ Erro ao verificar conectividade:', error);
      throw error;
    }
  }

  // Análise de qualidade dos dados
  static async analisarQualidadeDados(periodo: number = 24) {
    try {
      const resultado = await prisma.leiturasSensor.aggregate({
        where: { timestamp: { gte: this.getUTCPeriod(periodo) } },
        _avg: {
          qualidadeDadosBndmet: true,
          confiabilidade:       true,
        },
        _count: {
          sensorOk:       true,
          statusApiBndmet: true,
        },
      });

      const sensorOkCount = await prisma.leiturasSensor.count({
        where: {
          timestamp: { gte: this.getUTCPeriod(periodo) },
          sensorOk:  true,
        },
      });

      const apiBndmetOkCount = await prisma.leiturasSensor.count({
        where: {
          timestamp:       { gte: this.getUTCPeriod(periodo) },
          statusApiBndmet: 'OK',
        },
      });

      return {
        qualidadeMediaBndmet:    resultado._avg.qualidadeDadosBndmet,
        confiabilidadeMedia:     resultado._avg.confiabilidade,
        percentualSensorOk:      (sensorOkCount / resultado._count.sensorOk) * 100,
        percentualApiBndmetOk:   (apiBndmetOkCount / resultado._count.statusApiBndmet) * 100,
        totalLeituras:           resultado._count.sensorOk,
      };
    } catch (error) {
      console.error('❌ Erro ao analisar qualidade dos dados:', error);
      throw error;
    }
  }
}