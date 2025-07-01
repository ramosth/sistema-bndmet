import express from 'express';
import { SensorService } from '../services/sensorService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { DadosESP8266 } from '../types';

export class SensorController {
  // Receber dados do ESP8266
  static async receberDados(req: express.Request, res: express.Response) {
    try {
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

      return sendSuccess(
        res,
        { id: leitura.id, timestamp: leitura.timestamp },
        'Dados salvos com sucesso',
        201
      );
    } catch (error) {
      console.error('Erro ao receber dados:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Buscar últimas leituras
  static async buscarUltimas(req: express.Request, res: express.Response) {
    try {
      const limite = parseInt(req.query.limite as string) || 100;
      
      const leituras = await SensorService.buscarUltimasLeituras(limite);
      
      return sendSuccess(res, leituras, `${leituras.length} leituras encontradas`);
    } catch (error) {
      console.error('Erro ao buscar leituras:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Buscar leituras por período
  static async buscarPorPeriodo(req: express.Request, res: express.Response) {
    try {
      const { dataInicio, dataFim } = req.query;
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 50;

      // Validação simples
      if (!dataInicio || !dataFim) {
        return sendError(res, 'dataInicio e dataFim são obrigatórios', 400);
      }

      // ✅ PARSING explícito para UTC
      const inicio = new Date(dataInicio as string);
      const fim = new Date(dataFim as string);

      // Verificar se as datas são válidas
      if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        return sendError(res, 'Formato de data inválido. Use ISO 8601 (UTC)', 400);
      }

      const { leituras, total } = await SensorService.buscarLeiturasPorPeriodo(
        inicio,
        fim,
        pagina,
        limite
      );

      return sendPaginated(res, leituras, pagina, limite, total);
    } catch (error) {
      console.error('Erro ao buscar por período:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Buscar alertas críticos
  static async buscarAlertas(req: express.Request, res: express.Response) {
    try {
      const limite = parseInt(req.query.limite as string) || 50;
      
      const alertas = await SensorService.buscarAlertas(limite);
      
      return sendSuccess(res, alertas, `${alertas.length} alertas encontrados`);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Obter estatísticas
  static async obterEstatisticas(req: express.Request, res: express.Response) {
    try {
      const estatisticas = await SensorService.obterEstatisticas();
      
      return sendSuccess(res, estatisticas, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return sendError(res, 'Erro interno do servidor', 500);
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
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }

  // Status da API (health check)
  static async status(req: express.Request, res: express.Response) {
    try {
      const ultimaLeitura = await SensorService.buscarUltimasLeituras(1);
      
      const status = {
        api: 'online',
        timestamp: new Date().toISOString(), // ✅ SEMPRE UTC
        timezone: 'UTC', // ✅ INFORMAÇÃO EXPLÍCITA
        banco: ultimaLeitura.length > 0 ? 'conectado' : 'sem dados',
        ultimaLeitura: ultimaLeitura[0]?.timestamp || null,
      };
      
      return sendSuccess(res, status, 'API funcionando normalmente');
    } catch (error) {
      console.error('Erro no health check:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
}