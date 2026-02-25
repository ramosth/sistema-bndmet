// backend > src > controllers > sensorController.ts
import express from 'express';
import { SensorService } from '../services/sensorService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { DadosESP8266 } from '../types';

export class SensorController {
  // Receber dados do ESP8266
  static async receberDados(req: express.Request, res: express.Response) {
    try {
      console.log('📡 Dados recebidos do sensor:', req.body);

      // Validar dados de entrada
      const dados: DadosESP8266 = req.body;

      // Validação simples dos dados
      if (!dados || typeof dados !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          timestamp: new Date().toISOString()
        });
      }

      // Salvar no banco
      const leitura = await SensorService.salvarDados(dados);

      console.log('✅ Dados processados com sucesso:', {
        id: leitura.id,
        timestamp: leitura.timestamp,
        risco: leitura.riscoIntegrado,
        nivel: leitura.nivelAlerta
      });

      return sendSuccess(
        res,
        { id: leitura.id, timestamp: leitura.timestamp },
        'Dados recebidos e processados com sucesso',
        201
      );
    } catch (error) {
      console.error('Erro ao processar dados do sensor:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Buscar últimas leituras
  static async buscarUltimas(req: express.Request, res: express.Response) {
    try {
      const limite = parseInt(req.query.limite as string) || 100;

      if (limite > 1000) {
        return sendError(res, 'Limite máximo de 1000 registros', 400);
      }

      const leituras = await SensorService.buscarUltimasLeituras(limite);

      return sendSuccess(res, leituras, `${leituras.length} leituras encontradas`);
    } catch (error) {
      console.error('Erro ao buscar leituras:', error);
      return sendError(res, 'Erro ao buscar leituras', 500);
    }
  }

  // Buscar leituras por período
  static async buscarPorPeriodo(req: express.Request, res: express.Response) {
    try {
      const { dataInicio, dataFim } = req.query;
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 50;

      // Validações
      if (!dataInicio || !dataFim) {
        return sendError(res, 'dataInicio e dataFim são obrigatórios', 400);
      }

      // Validar formato das datas
      const inicio = new Date(dataInicio as string);
      const fim = new Date(dataFim as string);

      if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        return sendError(res, 'Formato de data inválido. Use ISO 8601 (UTC)', 400);
      }

      const { leituras, total } = await SensorService.buscarLeiturasPorPeriodoTimezone(
        dataInicio as string,
        dataFim as string,
        pagina,
        limite
      );

      return sendPaginated(res, leituras, pagina, limite, total, `${leituras.length} leituras encontradas`);
    } catch (error) {
      console.error('Erro ao buscar por período:', error);
      return sendError(res, 'Erro ao buscar leituras por período', 500);
    }
  }

  // Buscar alertas críticos
  static async buscarAlertas(req: express.Request, res: express.Response) {
    try {
      const limite = parseInt(req.query.limite as string) || 50;
      const nivelAlerta = req.query.nivelAlerta as string;

      const alertas = await SensorService.buscarAlertas(limite, nivelAlerta);

      return sendSuccess(res, alertas, `${alertas.length} alertas encontrados`);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return sendError(res, 'Erro ao buscar alertas', 500);
    }
  }

  // Obter estatísticas
  static async obterEstatisticas(req: express.Request, res: express.Response) {
    try {
      // const estatisticas = await SensorService.obterEstatisticas();

      const periodo = parseInt(req.query.periodo as string) || 24;

      const [estatisticas, qualidade, tendencia] = await Promise.all([
        SensorService.obterEstatisticas(),
        SensorService.analisarQualidadeDados(periodo),
        SensorService.buscarDadosTendencia(periodo),
      ]);

      const estatist = {
        geral: estatisticas,
        qualidadeDados: qualidade,
        dadosTendencia: tendencia,
        periodoHoras: periodo,
      };

      return sendSuccess(res, estatist, 'Estatísticas calculadas com sucesso');
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return sendError(res, 'Erro ao calcular estatísticas', 500);
    }
  }

  // Buscar logs
  static async buscarLogs(req: express.Request, res: express.Response) {
    try {
      const { nivel, componente } = req.query;
      const limite = parseInt(req.query.limite as string) || 100;

      const logs = await SensorService.buscarLogs(
        nivel as string,
        componente as string,
        limite
      );

      return sendSuccess(res, logs, `${logs.length} logs encontrados`);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return sendError(res, 'Erro ao buscar logs', 500);
    }
  }

  // Status da API (health check)
  static async status(req: express.Request, res: express.Response) {
    try {
      // const ultimaLeitura = await SensorService.buscarUltimasLeituras(1);

      // const status = {
      //   api: 'online',
      //   timestamp: new Date().toISOString(), // ✅ SEMPRE UTC
      //   timezone: 'UTC', // ✅ INFORMAÇÃO EXPLÍCITA
      //   banco: ultimaLeitura.length > 0 ? 'conectado' : 'sem dados',
      //   ultimaLeitura: ultimaLeitura[0]?.timestamp || null,
      // };

      const conectividade = await SensorService.verificarConectividade();
      const estatisticas = await SensorService.obterEstatisticas();

      const status = {
        api: {
          status: 'online',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
        sistema: conectividade,
        estatisticas: {
          totalLeituras: estatisticas.totalLeituras,
          ultimaLeitura: estatisticas.ultimaLeitura?.timestamp,
          alertasCriticos24h: estatisticas.estatisticas24h.alertasCriticos,
          statusBndmet: estatisticas.statusBndmet,
        },
      };

      return sendSuccess(res, status, 'API funcionando normalmente');
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return sendError(res, 'Erro ao verificar status do sistema', 500);
    }
  }

  // Análise de qualidade de dados
  static async qualidadeDados(req: express.Request, res: express.Response) {
    try {
      const periodo = parseInt(req.query.periodo as string) || 24;
      const qualidade = await SensorService.analisarQualidadeDados(periodo);

      return sendSuccess(res, qualidade, 'Análise de qualidade concluída');
    } catch (error) {
      console.error('Erro ao analisar qualidade:', error);
      return sendError(res, 'Erro ao analisar qualidade dos dados', 500);
    }
  }
}