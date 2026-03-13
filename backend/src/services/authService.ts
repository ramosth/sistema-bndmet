// backend > src > services > authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { EmailService } from './emailService';
import {
  CadastroUsuarioBasicoRequest,
  CadastroUsuarioAdminRequest,
  EnviarAlertaRequest
} from '../types/auth';

export class AuthService {
  // Autenticação de usuário
  static async login(email: string, senha: string, ipAddress?: string, userAgent?: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findFirst({
        where: {
          email: email.toLowerCase(),
          ativo: true,
        },
      });

      if (!usuario) {
        throw new Error('Credenciais inválidas');
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
      if (!senhaValida) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar token JWT - Simplificado para evitar erro de tipagem
      const payload = {
        usuarioId: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil
      };

      const secretKey = env.JWT_SECRET;
      const options = { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions;

      const token = jwt.sign(payload, secretKey, options);

      // Salvar sessão
      // Calcular expiresAt com base no JWT_EXPIRES_IN do env
      const expiresAt = new Date();
      const expiresIn = env.JWT_EXPIRES_IN; // ex.: '24h', '7d', '30m'
      const unit = expiresIn.slice(-1);
      const value = parseInt(expiresIn.slice(0, -1));
      if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + value);
      else if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + value);
      else if (unit === 'm') expiresAt.setMinutes(expiresAt.getMinutes() + value);

      await prisma.sessoesUsuario.create({
        data: {
          usuarioId: usuario.id,
          token,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt,
        },
      });

      // Atualizar último login
      await prisma.usuariosAdmin.update({
        where: { id: usuario.id },
        data: { ultimoLogin: new Date() },
      });

      return {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          ativo: usuario.ativo,
          ultimoLogin: usuario.ultimoLogin?.toISOString(),
          createdAt: usuario.createdAt.toISOString(),
          updatedAt: usuario.updatedAt.toISOString(),
        },
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Validar token
  static async validarToken(token: string) {
    try {
      // Verificar token JWT
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      const sessao = await prisma.sessoesUsuario.findFirst({
        where: {
          token,
          ativo: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          usuario: true,
        },
      });

      if (!sessao || !sessao.usuario.ativo) {
        throw new Error('Token inválido');
      }

      return {
        usuarioId: sessao.usuario.id,
        email: sessao.usuario.email,
        perfil: sessao.usuario.perfil,
        usuario: sessao.usuario,
      };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Logout
  static async logout(token: string) {
    try {
      await prisma.sessoesUsuario.updateMany({
        where: { token },
        data: { ativo: false },
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }

  // Solicitar reset de senha
  static async solicitarResetSenha(email: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findFirst({
        where: { email: email.toLowerCase(), ativo: true }
      });

      if (!usuario) {
        // Por segurança, não revelar se o email existe
        return { message: 'Se o email existir, você receberá instruções para reset' };
      }

      // Gerar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date();
      expira.setHours(expira.getHours() + 2); // 2 horas para expirar

      // Salvar token no banco
      await prisma.usuariosAdmin.update({
        where: { id: usuario.id },
        data: {
          tokenReset: token,
          tokenResetExpira: expira
        }
      });

      // Enviar email (implementar serviço de email)
      // await emailService.enviarResetSenha(usuario.email, token);
      // return { message: 'Instruções enviadas por email' };

      return {
        token,
        expira,
        message: 'Token de reset gerado com sucesso'
      };
    } catch (error) {
      throw new Error('Erro ao solicitar reset de senha');
    }
  }

  // Validar token de reset
  static async validarTokenReset(token: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findFirst({
        where: {
          tokenReset: token,
          tokenResetExpira: {
            gt: new Date() // Token ainda válido
          },
          ativo: true
        }
      });

      if (!usuario) {
        throw new Error('Token inválido ou expirado');
      }

      return { valido: true, usuarioId: usuario.id };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Resetar senha com token
  static async resetarSenhaComToken(token: string, novaSenha: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findFirst({
        where: {
          tokenReset: token,
          tokenResetExpira: {
            gt: new Date()
          },
          ativo: true
        }
      });

      if (!usuario) {
        throw new Error('Token inválido ou expirado');
      }

      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, 10);

      // Atualizar senha e limpar token
      await prisma.usuariosAdmin.update({
        where: { id: usuario.id },
        data: {
          senhaHash,
          tokenReset: null,        // ← AQUI é limpo
          tokenResetExpira: null,  // ← AQUI é limpo
          // Invalidar todas as sessões por segurança
        }
      });

      // Invalidar todas as sessões existentes
      await prisma.sessoesUsuario.updateMany({
        where: { usuarioId: usuario.id },
        data: { ativo: false }
      });

      return { message: 'Senha alterada com sucesso' };
    } catch (error) {
      throw new Error('Erro ao resetar senha');
    }
  }

  // Limpar tokens expirados (executar periodicamente)
  static async limparTokensExpirados() {
    try {
      const resultado = await prisma.usuariosAdmin.updateMany({
        where: {
          tokenResetExpira: {
            lt: new Date() // Tokens expirados
          }
        },
        data: {
          tokenReset: null,
          tokenResetExpira: null
        }
      });

      return { tokensLimpos: resultado.count };
    } catch (error) {
      throw new Error('Erro ao limpar tokens expirados');
    }
  }

  // Criar usuário administrador
  static async criarUsuarioAdmin(dados: CadastroUsuarioAdminRequest) {
    try {
      const usuarioExiste = await prisma.usuariosAdmin.findFirst({
        where: { email: dados.email.toLowerCase() },
      });

      if (usuarioExiste) {
        throw new Error('Email já cadastrado');
      }

      const senhaHash = await bcrypt.hash(dados.senha, 10);

      const usuario = await prisma.usuariosAdmin.create({
        data: {
          nome: dados.nome,
          email: dados.email.toLowerCase(),
          senhaHash,
          perfil: dados.perfil || 'admin',
        },
      });

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
        createdAt: usuario.createdAt.toISOString(),
        updatedAt: usuario.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Criar usuário básico
  static async criarUsuarioBasico(dados: CadastroUsuarioBasicoRequest) {
    try {
      const usuarioExiste = await prisma.usuariosBasicos.findFirst({
        where: { email: dados.email.toLowerCase() },
      });

      if (usuarioExiste) {
        throw new Error('Email já cadastrado');
      }

      const usuario = await prisma.usuariosBasicos.create({
        data: {
          nome: dados.nome,
          email: dados.email.toLowerCase(),
          telefone: dados.telefone || null,
          receberNotificacoes: dados.receberNotificacoes ?? true,
          tipoNotificacao: dados.tipoNotificacao || 'email',
        },
      });

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        ativo: usuario.ativo,
        receberNotificacoes: usuario.receberNotificacoes,
        tipoNotificacao: usuario.tipoNotificacao,
        createdAt: usuario.createdAt.toISOString(),
        updatedAt: usuario.updatedAt.toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Listar usuários básicos
  static async listarUsuariosBasicos(
    pagina: number = 1,
    limite: number = 50,
    busca?: string,
    ativo?: boolean
  ) {
    try {
      const skip = (pagina - 1) * limite;

      // Construir filtros de busca
      const whereClause: any = {};

      // NOVO: Filtro por status ativo
      if (ativo !== undefined) {
        whereClause.ativo = ativo;
        console.log(`🔍 Filtrando usuários básicos por ativo: ${ativo}`);
      }

      // Filtro de busca por nome ou email
      if (busca && busca.trim()) {
        whereClause.OR = [
          {
            nome: {
              contains: busca.trim(),
              mode: 'insensitive' as const
            }
          },
          {
            email: {
              contains: busca.trim(),
              mode: 'insensitive' as const
            }
          }
        ];
        console.log(`🔍 Filtrando usuários básicos por busca: "${busca}"`);
      }

      const [usuarios, total] = await Promise.all([
        prisma.usuariosBasicos.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limite,
        }),
        prisma.usuariosBasicos.count({
          where: whereClause
        }),
      ]);

      console.log(`✅ Encontrados ${usuarios.length} usuários básicos (total: ${total})`);

      return { usuarios, total };
    } catch (error) {
      console.error('❌ Erro ao listar usuários básicos:', error);
      throw error;
    }
  }

  // Listar usuários administradores
  static async listarUsuariosAdmin(
    pagina: number = 1,
    limite: number = 50,
    busca?: string,
    ativo?: boolean
  ) {
    try {
      const skip = (pagina - 1) * limite;

      // Construir filtros de busca
      const whereClause: any = {};

      // NOVO: Filtro por status ativo
      if (ativo !== undefined) {
        whereClause.ativo = ativo;
        console.log(`🔍 Filtrando administradores por ativo: ${ativo}`);
      }

      // Filtro de busca por nome ou email
      if (busca && busca.trim()) {
        whereClause.OR = [
          {
            nome: {
              contains: busca.trim(),
              mode: 'insensitive' as const
            }
          },
          {
            email: {
              contains: busca.trim(),
              mode: 'insensitive' as const
            }
          }
        ];
        console.log(`🔍 Filtrando administradores por busca: "${busca}"`);
      }

      const [usuarios, total] = await Promise.all([
        prisma.usuariosAdmin.findMany({
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            ativo: true,
            ultimoLogin: true,
            createdAt: true,
            updatedAt: true,
          },
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limite,
        }),
        prisma.usuariosAdmin.count({
          where: whereClause
        }),
      ]);

      console.log(`✅ Encontrados ${usuarios.length} administradores (total: ${total})`);

      return { usuarios, total };
    } catch (error) {
      console.error('❌ Erro ao listar administradores:', error);
      throw error;
    }
  }

  // Enviar alerta em massa
  static async enviarAlertaMassa(dados: EnviarAlertaRequest, usuarioAdminId: string) {
    try {
      let destinatarios: any[] = [];
      let destinatariosIds: string[] = [];

      console.log('Processando envio para tipo:', dados.tipoDestinatario);

      // Buscar destinatários baseado no tipo (USAR SINGULAR)
      switch (dados.tipoDestinatario) {
        case 'basico':
          if (dados.destinatariosIds && dados.destinatariosIds.length > 0) {
            // Filtrar IDs vazios
            const idsLimpos = dados.destinatariosIds.filter(id => id && id.trim() !== '');

            if (idsLimpos.length > 0) {
              destinatarios = await prisma.usuariosBasicos.findMany({
                where: {
                  id: { in: idsLimpos },
                  ativo: true,
                  receberNotificacoes: true,
                },
              });
            } else {
              destinatarios = await prisma.usuariosBasicos.findMany({
                where: {
                  ativo: true,
                  receberNotificacoes: true
                },
              });
            }
          } else {
            destinatarios = await prisma.usuariosBasicos.findMany({
              where: {
                ativo: true,
                receberNotificacoes: true
              },
            });
          }
          break;

        case 'admin':
          if (dados.destinatariosIds && dados.destinatariosIds.length > 0) {
            const idsLimpos = dados.destinatariosIds.filter(id => id && id.trim() !== '');

            if (idsLimpos.length > 0) {
              destinatarios = await prisma.usuariosAdmin.findMany({
                where: {
                  id: { in: idsLimpos },
                  ativo: true,
                },
              });
            } else {
              destinatarios = await prisma.usuariosAdmin.findMany({
                where: { ativo: true },
              });
            }
          } else {
            destinatarios = await prisma.usuariosAdmin.findMany({
              where: { ativo: true },
            });
          }
          break;

        case 'todos':
          const [basicos, admins] = await Promise.all([
            prisma.usuariosBasicos.findMany({
              where: { ativo: true, receberNotificacoes: true },
            }),
            prisma.usuariosAdmin.findMany({
              where: { ativo: true },
            }),
          ]);
          destinatarios = [...basicos, ...admins];
          break;

        default:
          throw new Error(`Tipo de destinatário inválido: ${dados.tipoDestinatario}`);
      }

      console.log(`${destinatarios.length} destinatários encontrados`);

      if (destinatarios.length === 0) {
        throw new Error('Nenhum destinatário encontrado para os critérios especificados');
      }

      destinatariosIds = destinatarios.map(d => d.id);

      // ENVIO REAL DE EMAILS
      let resultadosEnvio;
      if (dados.canaisEnvio.includes('email')) {
        console.log('📧 Enviando emails reais via EmailService...');

        resultadosEnvio = await EmailService.enviarLote(
          destinatarios.map(d => ({
            email: d.email,
            nome: d.nome
          })),
          {
            titulo: dados.titulo,
            mensagem: dados.mensagem,
            nivelCriticidade: dados.nivelCriticidade
          }
        );
      } else {
        // Simular outros canais (SMS, Push)
        console.log('📱 Simulando outros canais (SMS/Push)...');
        resultadosEnvio = await this.simularEnvioAlertas(destinatarios, dados);
      }

      // Salvar log do alerta
      const logAlerta = await prisma.logsAlertas.create({
        data: {
          usuarioAdminId,
          tipoDestinatario: dados.tipoDestinatario,
          destinatariosIds,
          tipoAlerta: 'manual',
          nivelCriticidade: dados.nivelCriticidade,
          titulo: dados.titulo,
          mensagem: dados.mensagem,
          canaisEnvio: dados.canaisEnvio.join(','),
          totalEnviados: destinatarios.length,
          totalSucesso: resultadosEnvio.sucessos,
          totalFalhas: resultadosEnvio.falhas,
          detalhesEnvio: resultadosEnvio.detalhes,
        },
      });

      return {
        logId: logAlerta.id,
        totalEnviados: destinatarios.length,
        totalSucesso: resultadosEnvio.sucessos,
        totalFalhas: resultadosEnvio.falhas,
        detalhes: resultadosEnvio.detalhes,
      };
    } catch (error) {
      console.error('❌ Erro ao enviar alerta em massa:', error);
      throw error;
    }
  }

  // Simular envio de alertas
  private static async simularEnvioAlertas(destinatarios: any[], dados: EnviarAlertaRequest) {
    let sucessos = 0;
    let falhas = 0;
    const detalhes: any[] = [];

    for (const destinatario of destinatarios) {
      // Simular sucesso em 95% dos casos
      const sucesso = Math.random() > 0.05;

      if (sucesso) {
        sucessos++;
        detalhes.push({
          destinatarioId: destinatario.id,
          email: destinatario.email,
          status: 'enviado',
          canais: dados.canaisEnvio,
        });
      } else {
        falhas++;
        detalhes.push({
          destinatarioId: destinatario.id,
          email: destinatario.email,
          status: 'falha',
          erro: 'Simulação de falha no envio',
        });
      }
    }

    return { sucessos, falhas, detalhes };
  }

  // Helper para converter BigInt para Number
  private static convertBigIntToNumber(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'bigint') {
      return Number(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToNumber(item));
    }

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntToNumber(value);
      }
      return converted;
    }

    return obj;
  }

  // Obter estatísticas de usuários
  static async obterEstatisticasUsuarios() {
    try {
      const resultado = await prisma.$queryRaw`
                SELECT 
                    (SELECT COUNT(*) FROM usuarios_admin WHERE ativo = true)::int as total_admins_ativos,
                    (SELECT COUNT(*) FROM usuarios_admin WHERE ativo = false)::int as total_admins_inativos,
                    (SELECT COUNT(*) FROM usuarios_basicos WHERE ativo = true)::int as total_basicos_ativos,
                    (SELECT COUNT(*) FROM usuarios_basicos WHERE ativo = false)::int as total_basicos_inativos,
                    (SELECT COUNT(*) FROM usuarios_basicos WHERE receber_notificacoes = true)::int as total_com_notificacoes,
                    (SELECT COUNT(*) FROM logs_alertas WHERE created_at >= NOW() - INTERVAL '30 days')::int as alertas_ultimos_30_dias
            ` as any[];

      const stats = resultado[0];

      // Converter BigInt para Number
      const estatisticas = {
        totalAdminsAtivos: Number(stats.total_admins_ativos || 0),
        totalAdminsInativos: Number(stats.total_admins_inativos || 0),
        totalBasicosAtivos: Number(stats.total_basicos_ativos || 0),
        totalBasicosInativos: Number(stats.total_basicos_inativos || 0),
        totalComNotificacoes: Number(stats.total_com_notificacoes || 0),
        alertasUltimos30Dias: Number(stats.alertas_ultimos_30_dias || 0),
        timestamp: new Date().toISOString()
      };

      return estatisticas;
    } catch (error) {
      throw error;
    }
  }

  // Alterar senha
  static async alterarSenha(usuarioId: string, senhaAtual: string, novaSenha: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      const senhaAtualValida = await bcrypt.compare(senhaAtual, usuario.senhaHash);
      if (!senhaAtualValida) {
        throw new Error('Senha atual incorreta');
      }

      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

      await prisma.usuariosAdmin.update({
        where: { id: usuarioId },
        data: { senhaHash: novaSenhaHash },
      });

      // Invalidar todas as sessões do usuário
      await prisma.sessoesUsuario.updateMany({
        where: { usuarioId },
        data: { ativo: false },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Limpar sessões expiradas
  static async limparSessoesExpiradas() {
    try {
      const resultado = await prisma.$queryRaw`SELECT limpar_sessoes_expiradas()` as any[];
      return resultado;
    } catch (error) {
      throw error;
    }
  }

  // Editar usuário básico
  static async editarUsuarioBasico(id: string, dados: {
    nome: string;
    email: string;
    telefone?: string;
    receberNotificacoes?: boolean;
    tipoNotificacao?: string;
  }) {
    try {
      // Verificar se usuário existe
      const usuarioExistente = await prisma.usuariosBasicos.findUnique({
        where: { id }
      });

      if (!usuarioExistente) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se email já existe em outro usuário
      if (dados.email !== usuarioExistente.email) {
        const emailJaExiste = await prisma.usuariosBasicos.findFirst({
          where: {
            email: dados.email.toLowerCase(),
            id: { not: id }
          }
        });

        if (emailJaExiste) {
          throw new Error('Email já cadastrado para outro usuário');
        }
      }

      // Atualizar usuário
      const usuarioAtualizado = await prisma.usuariosBasicos.update({
        where: { id },
        data: {
          nome: dados.nome.trim(),
          email: dados.email.toLowerCase().trim(),
          telefone: dados.telefone?.trim() || null,
          receberNotificacoes: dados.receberNotificacoes ?? true,
          tipoNotificacao: dados.tipoNotificacao || 'email'
        }
      });

      return usuarioAtualizado;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao editar usuário básico');
    }
  }

  // Editar usuário administrador
  static async editarUsuarioAdmin(id: string, dados: {
    nome: string;
    email: string;
    perfil: string;
  }) {
    try {
      // Verificar se usuário existe
      const usuarioExistente = await prisma.usuariosAdmin.findUnique({
        where: { id }
      });

      if (!usuarioExistente) {
        throw new Error('Administrador não encontrado');
      }

      // Verificar se email já existe em outro usuário
      if (dados.email !== usuarioExistente.email) {
        const emailJaExiste = await prisma.usuariosAdmin.findFirst({
          where: {
            email: dados.email.toLowerCase(),
            id: { not: id }
          }
        });

        if (emailJaExiste) {
          throw new Error('Email já cadastrado para outro administrador');
        }
      }

      // Atualizar usuário
      const usuarioAtualizado = await prisma.usuariosAdmin.update({
        where: { id },
        data: {
          nome: dados.nome.trim(),
          email: dados.email.toLowerCase().trim(),
          perfil: dados.perfil
        }
      });

      // Remover senha do retorno
      const { senhaHash, ...usuarioSemSenha } = usuarioAtualizado;
      return usuarioSemSenha;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao editar administrador');
    }
  }

  // Alterar status usuário básico
  static async alterarStatusUsuarioBasico(id: string, ativo: boolean) {
    try {
      const usuario = await prisma.usuariosBasicos.findUnique({
        where: { id }
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      const usuarioAtualizado = await prisma.usuariosBasicos.update({
        where: { id },
        data: { ativo }
      });

      return {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        ativo: usuarioAtualizado.ativo
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao alterar status do usuário');
    }
  }

  // Alterar status usuário administrador
  static async alterarStatusUsuarioAdmin(id: string, ativo: boolean, usuarioLogadoId: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findUnique({
        where: { id }
      });

      if (!usuario) {
        throw new Error('Administrador não encontrado');
      }

      // Verificar se não é o último super_admin ativo
      if (!ativo && usuario.perfil === 'super_admin') {
        const superAdminsAtivos = await prisma.usuariosAdmin.count({
          where: {
            perfil: 'super_admin',
            ativo: true,
            id: { not: id }
          }
        });

        if (superAdminsAtivos === 0) {
          throw new Error('Não é possível desativar o último Super Admin');
        }
      }

      const usuarioAtualizado = await prisma.usuariosAdmin.update({
        where: { id },
        data: { ativo }
      });

      return {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        ativo: usuarioAtualizado.ativo
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao alterar status do administrador');
    }
  }

  // Deletar usuário básico (deleção lógica)
  static async deletarUsuarioBasico(id: string) {
    try {
      const usuario = await prisma.usuariosBasicos.findUnique({
        where: { id }
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      if (!usuario.ativo) {
        throw new Error('Usuário já está inativo');
      }

      const usuarioAtualizado = await prisma.usuariosBasicos.update({
        where: { id },
        data: { ativo: false }
      });

      return {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        ativo: false
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao desativar usuário');
    }
  }

  // Deletar usuário administrador (deleção lógica)
  static async deletarUsuarioAdmin(id: string, usuarioLogadoId: string) {
    try {
      const usuario = await prisma.usuariosAdmin.findUnique({
        where: { id }
      });

      if (!usuario) {
        throw new Error('Administrador não encontrado');
      }

      if (!usuario.ativo) {
        throw new Error('Administrador já está inativo');
      }

      // Verificar se não é o último super_admin ativo
      if (usuario.perfil === 'super_admin') {
        const superAdminsAtivos = await prisma.usuariosAdmin.count({
          where: {
            perfil: 'super_admin',
            ativo: true,
            id: { not: id }
          }
        });

        if (superAdminsAtivos === 0) {
          throw new Error('Não é possível desativar o último Super Admin');
        }
      }

      const usuarioAtualizado = await prisma.usuariosAdmin.update({
        where: { id },
        data: { ativo: false }
      });

      return {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        ativo: false
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao desativar administrador');
    }
  }

  // Listar usuários inativos
  static async listarUsuariosInativos(tipo: string = 'all', pagina: number = 1, limite: number = 50) {
    try {
      const offset = (pagina - 1) * limite;
      let usuarios: any[] = [];

      if (tipo === 'all' || tipo === 'basicos') {
        const usuariosBasicos = await prisma.usuariosBasicos.findMany({
          where: { ativo: false },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limite
        });

        usuarios = usuarios.concat(
          usuariosBasicos.map(u => ({ ...u, tipo: 'basico' }))
        );
      }

      if (tipo === 'all' || tipo === 'admins') {
        const usuariosAdmin = await prisma.usuariosAdmin.findMany({
          where: { ativo: false },
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            ativo: true,
            ultimoLogin: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limite
        });

        usuarios = usuarios.concat(
          usuariosAdmin.map(u => ({ ...u, tipo: 'admin' }))
        );
      }

      // Ordenar por data de atualização
      usuarios.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Contar total
      let total = 0;
      if (tipo === 'all') {
        const [totalBasicos, totalAdmins] = await Promise.all([
          prisma.usuariosBasicos.count({ where: { ativo: false } }),
          prisma.usuariosAdmin.count({ where: { ativo: false } })
        ]);
        total = totalBasicos + totalAdmins;
      } else if (tipo === 'basicos') {
        total = await prisma.usuariosBasicos.count({ where: { ativo: false } });
      } else if (tipo === 'admins') {
        total = await prisma.usuariosAdmin.count({ where: { ativo: false } });
      }

      return {
        usuarios: usuarios.slice(0, limite),
        total
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao listar usuários inativos');
    }
  }

}