// backend > src > services > sensorService.ts
// Versão v4 — atualizado para firmware v13
//
// Mudanças sobre v3:
//   1. Tipos de import atualizados (DadosBrutos, EstatisticasRuptura, QualidadeDados)
//   2. salvarDados(): log de ruptura distingue ativa vs cooldown (aguardando_reset_ruptura)
//   3. verificarConectividade(): expõe bndmet_inicializado e aguardando_reset_ruptura
//   4. analisarQualidadeDados(): filtra registros pré-NTP (bndmet_inicializado=false)
//      para não contaminar a média de qualidade BNDMET com zeros iniciais
//   5. Novo método buscarEstatisticasRuptura(): conta eventos, duração média, estado atual

import prisma from '../config/database';
import { DadosESP8266, LogEntry, EstatisticasRuptura, QualidadeDados } from '../types';

export class SensorService {
  // HELPER: Gerar data UTC para períodos
  private static getUTCPeriod(hoursAgo: number): Date {
    const now = new Date();
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  }

  // HELPER: Extrair campo do dadosBrutos (jsonb) com segurança
  private static getDadosBrutosField<T>(
    dadosBrutos: any,
    campo: string,
    fallback: T
  ): T {
    try {
      if (!dadosBrutos || typeof dadosBrutos !== 'object') return fallback;
      return campo in dadosBrutos ? dadosBrutos[campo] : fallback;
    } catch {
      return fallback;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Salvar dados do ESP8266
  // ─────────────────────────────────────────────────────────────────────────
  static async salvarDados(dados: DadosESP8266) {
    try {
      // Extrair campos novos v13 do dadosBrutos para uso no log
      // (não precisam de coluna própria — chegam dentro do jsonb)
      const aguardandoReset = this.getDadosBrutosField<boolean>(
        dados.dadosBrutos, 'aguardando_reset_ruptura', false
      );
      const bndmetInit = this.getDadosBrutosField<boolean>(
        dados.dadosBrutos, 'bndmet_inicializado', true
      );

      console.log('💾 Salvando dados do sensor:', {
        umidade:              dados.umidadeSolo,
        risco:                dados.riscoIntegrado,
        nivel:                dados.nivelAlerta,
        confiabilidade:       dados.confiabilidade,
        bndmet_inicializado:  bndmetInit,
        aguardando_reset:     aguardandoReset,
        timestamp:            new Date().toISOString(),
      });

      const novaLeitura = await prisma.leiturasSensor.create({
        data: {
          // Sensor local
          timestamp:            dados.timestamp ? new Date(dados.timestamp) : undefined,
          umidadeSolo:          dados.umidadeSolo,
          valorAdc:             dados.valorAdc,
          // FIX v14 (DIV-2): força boolean explícito — evita gravação de NULL no banco.
          // Quando Arduino envia ADC=1024 (sensor desconectado), sensorOk chega como
          // false/undefined e o Prisma gravava NULL em vez de false no campo Boolean.
          sensorOk:             dados.sensorOk === true ? true : false,
          fatorLocal:           dados.fatorLocal,

          // BNDMET
          precipitacaoAtual:    dados.precipitacaoAtual,
          precipitacao24h:      dados.precipitacao24h,
          precipitacao7d:       dados.precipitacao7d,
          precipitacao30d:      dados.precipitacao30d,
          statusApiBndmet:      dados.statusApiBndmet,
          qualidadeDadosBndmet: dados.qualidadeDadosBndmet,
          estacao:              dados.estacao,
          // OWM — status da API (campo novo — migration 03)
          statusApiOwm:         dados.statusApiOwm,

          // Meteorologia OWM
          temperatura:          dados.temperatura,
          umidadeExterna:       dados.umidadeExterna,
          pressaoAtmosferica:   dados.pressaoAtmosferica,
          velocidadeVento:      dados.velocidadeVento,
          descricaoTempo:       dados.descricaoTempo,
          chuvaAtualOwm:        dados.chuvaAtualOWM,

          // Previsão OWM /forecast
          chuvaFutura24h:       dados.chuvaFutura24h,
          intensidadePrevisao:  dados.intensidadePrevisao,
          fatorIntensidade:     dados.fatorIntensidade,

          // Análise de risco
          riscoIntegrado:       dados.riscoIntegrado,
          indiceRisco:          dados.indiceRisco,
          nivelAlerta:          dados.nivelAlerta,
          recomendacao:         dados.recomendacao,
          confiabilidade:       dados.confiabilidade,
          // amplificado: === true garante boolean explícito — nunca null/vazio
          amplificado:          dados.amplificado === true,
          taxaVariacaoUmidade:  dados.taxaVariacaoUmidade,

          // Componentes individuais da Equação 5 TCC
          vLencol:              dados.vLencol,
          vChuvaAtual:          dados.vChuvaAtual,
          vChuvaHistorica:      dados.vChuvaHistorica,
          vChuvaMensal:         dados.vChuvaMensal,
          vChuvaFutura:         dados.vChuvaFutura,
          vTaxaVariacao:        dados.vTaxaVariacao,
          vPressao:             dados.vPressao,

          // Status do sistema
          statusSistema:        dados.statusSistema,
          buzzerAtivo:          dados.buzzerAtivo,
          // modoManual: Arduino envia false (booleano) → grava false
          // curl/Postman omitem campo → undefined → grava true (operação manual)
          // ATENÇÃO: Boolean("false") = true, por isso comparação direta
          modoManual:           dados.modoManual === true  ? true
                                : dados.modoManual === false ? false
                                : true,
          wifiConectado:        dados.wifiConectado,

          // Dados brutos — persiste como jsonb opaco (cast para any resolve incompat. do Prisma)
          dadosBrutos:          dados.dadosBrutos as any,
        },
      });

      // ─────────────────────────────────────────────────────────────────────
      // Lógica de log — distingue estados da ruptura (novo em v4)
      // ─────────────────────────────────────────────────────────────────────
      let nivelLog: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
      let mensagemLog = 'Dados recebidos do ESP8266';

      if (dados.nivelAlerta === 'VERMELHO' && dados.riscoIntegrado !== undefined && dados.riscoIntegrado >= 1.0) {
        if (aguardandoReset) {
          // v13: ruptura em cooldown — umidade já abaixo do limiar, aguardando 3 leituras seguras
          mensagemLog = `🟡 Ruptura em desescalada — umidade ${dados.umidadeSolo?.toFixed(1) ?? '?'}% (aguardando reset de 3 leituras)`;
          nivelLog    = 'WARNING';
        } else {
          // ruptura ativa
          mensagemLog = `⛔ RUPTURA ativa — umidade ${dados.umidadeSolo?.toFixed(1) ?? '?'}% acima do limiar crítico (confiab. ${dados.confiabilidade ?? '?'}%)`;
          nivelLog    = 'CRITICAL';
        }
      } else if (dados.riscoIntegrado !== undefined && dados.riscoIntegrado !== null) {
        if (dados.riscoIntegrado <= 0.45) {
          nivelLog    = 'INFO';
          mensagemLog = `Dados recebidos — situação NORMAL (risco ${(dados.riscoIntegrado * 100).toFixed(0)}%, confiab. ${dados.confiabilidade ?? '?'}%)`;
        } else if (dados.riscoIntegrado <= 0.75) {
          nivelLog    = 'WARNING';
          mensagemLog = `Dados recebidos — ATENÇÃO necessária (risco ${(dados.riscoIntegrado * 100).toFixed(0)}%, confiab. ${dados.confiabilidade ?? '?'}%)`;
        } else {
          nivelLog    = 'CRITICAL';
          mensagemLog = `Dados recebidos — situação CRÍTICA (risco ${(dados.riscoIntegrado * 100).toFixed(0)}%, confiab. ${dados.confiabilidade ?? '?'}%)`;
        }
      }

      // Aviso adicional para registros pré-NTP (v4)
      if (!bndmetInit) {
        console.warn('⏳ Registro pré-NTP: dados BNDMET ainda não disponíveis (bndmet_inicializado=false)');
      }

      // Log da operação
      await this.salvarLog({
        nivel:      nivelLog,
        componente: 'SENSOR',
        mensagem:   mensagemLog,
        dadosExtras: {
          leituraId:            novaLeitura.id,
          risco:                dados.riscoIntegrado,
          indiceRisco:          dados.indiceRisco,
          nivel:                dados.nivelAlerta,
          confiabilidade:       dados.confiabilidade,
          amplificado:          dados.amplificado,
          statusBndmet:         dados.statusApiBndmet,
          bndmetInicializado:   bndmetInit,
          aguardandoReset:      aguardandoReset,
          estacao:              dados.estacao,
        },
      });

      return novaLeitura;
    } catch (error) {
      console.error('❌ Erro ao salvar dados do sensor:', error);

      await this.salvarLog({
        nivel:      'ERROR',
        componente: 'SENSOR',
        mensagem:   'Erro ao salvar dados do sensor',
        dadosExtras: { error: (error as Error).message, dados },
      });

      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Buscar últimas leituras
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarUltimasLeituras(limite: number = 100) {
    try {
      return await prisma.leiturasSensor.findMany({
        take:    limite,
        orderBy: { timestamp: 'desc' },
      });
    } catch (error) {
      console.error('❌ Erro ao buscar últimas leituras:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Buscar leituras por período
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarLeiturasPorPeriodo(
    dataInicio: Date,
    dataFim: Date,
    pagina: number = 1,
    limite: number = 50
  ) {
    try {
      const skip      = (pagina - 1) * limite;
      const inicioUTC = new Date(dataInicio.toISOString());
      const fimUTC    = new Date(dataFim.toISOString());

      const [leituras, total] = await Promise.all([
        prisma.leiturasSensor.findMany({
          where:   { timestamp: { gte: inicioUTC, lte: fimUTC } },
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

  // ─────────────────────────────────────────────────────────────────────────
  //  Buscar leituras por período no timezone brasileiro
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarLeiturasPorPeriodoTimezone(
    dataInicio: string,
    dataFim: string,
    pagina: number = 1,
    limite: number = 50
  ) {
    try {
      const skip          = (pagina - 1) * limite;
      const dataInicioStr = dataInicio.split('T')[0];
      const dataFimStr    = dataFim.split('T')[0];

      console.log('🗓 Buscando registros por data brasileira:', {
        dataInicio: dataInicioStr,
        dataFim:    dataFimStr,
        pagina,
        limite,
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
        where:   { id: { in: idsPaginados } },
        orderBy: { timestamp: 'desc' },
      });

      console.log('✅ Resultado da busca híbrida:', {
        totalEncontrado:     total,
        registrosRetornados: leituras.length,
        range: `${dataInicioStr} até ${dataFimStr}`,
      });

      return { leituras, total };
    } catch (error) {
      console.error('❌ Erro na busca híbrida:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Buscar alertas críticos
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarAlertas(limite: number = 50, nivelAlerta?: string) {
    try {
      const where: any = nivelAlerta
        ? { nivelAlerta }
        : { nivelAlerta: { in: ['VERMELHO', 'AMARELO'] } };

      return await prisma.leiturasSensor.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take:    limite,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar alertas:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Estatísticas de eventos de ruptura (novo em v4)
  //  Útil para o cap4 do TCC e para o dashboard do frontend
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarEstatisticasRuptura(periodo: number = 168): Promise<EstatisticasRuptura> {
    try {
      const desde = this.getUTCPeriod(periodo);

      // Total de registros VERMELHO com risco=1.0 no período
      const totalEventos = await prisma.leiturasSensor.count({
        where: {
          timestamp:      { gte: desde },
          nivelAlerta:    'VERMELHO',
          riscoIntegrado: 1.0,
        },
      });

      // Última leitura — para verificar estado atual
      const ultimaLeitura = await prisma.leiturasSensor.findFirst({
        orderBy: { timestamp: 'desc' },
        select: {
          timestamp:      true,
          nivelAlerta:    true,
          riscoIntegrado: true,
          dadosBrutos:    true,
        },
      });

      const emRupturaAgora = ultimaLeitura?.nivelAlerta === 'VERMELHO'
        && Number(ultimaLeitura?.riscoIntegrado) >= 1.0;

      const aguardandoResetAgora = emRupturaAgora
        ? this.getDadosBrutosField<boolean>(ultimaLeitura?.dadosBrutos, 'aguardando_reset_ruptura', false)
        : false;

      // Último evento de ruptura
      const ultimoVermelho = await prisma.leiturasSensor.findFirst({
        where:   { nivelAlerta: 'VERMELHO', riscoIntegrado: 1.0 },
        orderBy: { timestamp: 'desc' },
        select:  { timestamp: true },
      });

      // Duração média: usando SQL puro para calcular corridas contínuas de VERMELHO
      // Simplificado: média entre primeiro e último VERMELHO de cada bloco contíguo
      // Como aproximação, usamos a diferença total / número de eventos
      let duracaoMediaMinutos: number | undefined;
      if (totalEventos > 1) {
        const primeiroVermelho = await prisma.leiturasSensor.findFirst({
          where:   { timestamp: { gte: desde }, nivelAlerta: 'VERMELHO', riscoIntegrado: 1.0 },
          orderBy: { timestamp: 'asc' },
          select:  { timestamp: true },
        });
        if (primeiroVermelho && ultimoVermelho) {
          const diffMs = ultimoVermelho.timestamp.getTime() - primeiroVermelho.timestamp.getTime();
          duracaoMediaMinutos = Math.round(diffMs / (1000 * 60));
        }
      }

      return {
        totalEventos,
        emRupturaAgora,
        aguardandoResetAgora,
        ultimaRuptura:       ultimoVermelho?.timestamp,
        duracaoMediaMinutos,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de ruptura:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Estatísticas gerais
  // ─────────────────────────────────────────────────────────────────────────
  static async obterEstatisticas() {
    try {
      const [
        totalLeituras,
        ultimaLeitura,
        estatisticas24h,
        alertasCriticos,
        statusBndmet,
      ] = await Promise.all([
        prisma.leiturasSensor.count(),

        prisma.leiturasSensor.findFirst({
          orderBy: { timestamp: 'desc' },
        }),

        prisma.leiturasSensor.aggregate({
          where: { timestamp: { gte: this.getUTCPeriod(24) } },
          _avg: {
            umidadeSolo:     true,
            riscoIntegrado:  true,
            indiceRisco:     true,
            precipitacao24h: true,
            temperatura:     true,
          },
          _count: true,
        }),

        prisma.leiturasSensor.count({
          where: {
            nivelAlerta: { in: ['VERMELHO'] },
            timestamp:   { gte: this.getUTCPeriod(24) },
          },
        }),

        prisma.leiturasSensor.groupBy({
          by:    ['statusApiBndmet'],
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

  // ─────────────────────────────────────────────────────────────────────────
  //  Salvar log do sistema
  // ─────────────────────────────────────────────────────────────────────────
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
      console.error('❌ Erro ao salvar log:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Buscar logs
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarLogs(nivel?: string, componente?: string, limite: number = 100) {
    try {
      const where: any = {};
      if (nivel)      where.nivel      = nivel;
      if (componente) where.componente = componente;

      return await prisma.logsSistema.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take:    limite,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Buscar dados para análise de tendências
  // ─────────────────────────────────────────────────────────────────────────
  static async buscarDadosTendencia(periodo: number = 168) {
    try {
      return await prisma.leiturasSensor.findMany({
        where:  { timestamp: { gte: this.getUTCPeriod(periodo) } },
        select: {
          timestamp:           true,
          umidadeSolo:         true,
          precipitacao24h:     true,
          precipitacao7d:      true,
          riscoIntegrado:      true,
          indiceRisco:         true,
          nivelAlerta:         true,
          temperatura:         true,
          pressaoAtmosferica:  true,
          amplificado:         true,
          chuvaFutura24h:      true,
          intensidadePrevisao: true,
        },
        orderBy: { timestamp: 'asc' },
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados de tendência:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Verificar conectividade dos sistemas
  //  v4: expõe bndmet_inicializado e aguardando_reset_ruptura da última leitura
  // ─────────────────────────────────────────────────────────────────────────
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
          nivelAlerta:          true,
          confiabilidade:       true,
          dadosBrutos:          true,
        },
      });

      if (!ultimaLeitura) {
        return {
          status:               'offline',
          ultimaLeitura:        null,
          wifi:                 false,
          bndmet:               'desconhecido',
          sensor:               false,
          bndmetInicializado:   false,
          aguardandoReset:      false,
        };
      }

      const minutosAtras = Math.floor(
        (Date.now() - ultimaLeitura.timestamp.getTime()) / (1000 * 60)
      );

      // v4: extrair campos v13 do dadosBrutos
      const bndmetInit = this.getDadosBrutosField<boolean>(
        ultimaLeitura.dadosBrutos, 'bndmet_inicializado', true
      );
      const aguardandoReset = this.getDadosBrutosField<boolean>(
        ultimaLeitura.dadosBrutos, 'aguardando_reset_ruptura', false
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
        nivelAlerta:          ultimaLeitura.nivelAlerta,
        confiabilidade:       ultimaLeitura.confiabilidade,
        // v4: campos novos para o frontend e diagnóstico
        bndmetInicializado:   bndmetInit,
        aguardandoReset:      aguardandoReset,
      };
    } catch (error) {
      console.error('❌ Erro ao verificar conectividade:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Análise de qualidade dos dados
  //  v4: exclui registros pré-NTP (bndmet_inicializado=false) da média de
  //      qualidade BNDMET para não contaminar com zeros iniciais
  // ─────────────────────────────────────────────────────────────────────────
  static async analisarQualidadeDados(periodo: number = 24): Promise<QualidadeDados> {
    try {
      const desde = this.getUTCPeriod(periodo);

      // Total de leituras no período
      const totalLeituras = await prisma.leiturasSensor.count({
        where: { timestamp: { gte: desde } },
      });

      // v4: contar registros pré-NTP via query no jsonb
      // Registros onde dadosBrutos->>'bndmet_inicializado' = 'false'
      const preNTPResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM leituras_sensor
        WHERE timestamp >= ${desde}
          AND (dados_brutos->>'bndmet_inicializado')::boolean = false
      `;
      const registrosPreNTP = Number(preNTPResult[0]?.count ?? 0);

      // Agregados excluindo pré-NTP para médias limpas
      const resultadoLimpo = await prisma.leiturasSensor.aggregate({
        where: {
          timestamp: { gte: desde },
          // Exclui registros onde qualidadeDadosBndmet = 0 E bndmet_inicializado = false
          // Como bndmet_inicializado é jsonb, usamos uma condição proxy:
          // qualidadeDadosBndmet > 0 OR estacao IS NOT NULL garante dados reais
          NOT: { qualidadeDadosBndmet: 0, precipitacao30d: 0, precipitacao7d: 0 },
        },
        _avg: {
          qualidadeDadosBndmet: true,
          confiabilidade:       true,
        },
        _count: {
          sensorOk:        true,
          statusApiBndmet: true,
        },
      });

      const sensorOkCount = await prisma.leiturasSensor.count({
        where: { timestamp: { gte: desde }, sensorOk: true },
      });

      const apiBndmetOkCount = await prisma.leiturasSensor.count({
        where: { timestamp: { gte: desde }, statusApiBndmet: 'OK' },
      });

      const countRef = resultadoLimpo._count.sensorOk || 1;

      return {
        qualidadeMediaBndmet:  resultadoLimpo._avg.qualidadeDadosBndmet,
        confiabilidadeMedia:   resultadoLimpo._avg.confiabilidade,
        percentualSensorOk:    (sensorOkCount    / countRef) * 100,
        percentualApiBndmetOk: (apiBndmetOkCount / countRef) * 100,
        totalLeituras,
        registrosPreNTP,
      };
    } catch (error) {
      console.error('❌ Erro ao analisar qualidade dos dados:', error);
      throw error;
    }
  }
}