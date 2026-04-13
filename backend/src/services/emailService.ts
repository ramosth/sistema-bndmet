// ============ 1. SERVIÇO DE EMAIL REAL ============
// backend/src/services/emailService.ts

import * as nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailService {
    private static transporter: nodemailer.Transporter;
    private static isInitialized = false;

    // Inicializar transporter
    static init() {
        if (this.isInitialized) {
            console.log('📧 EmailService já está inicializado');
            return;
        }

        if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
            console.warn('⚠️ Configurações SMTP não encontradas. Modo simulação ativo.');
            console.warn('   Configure SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env');
            this.isInitialized = true;
            return;
        }

        try {
            // ✅ USAR createTransport (sem "r" no final)
            this.transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
                secure: env.SMTP_PORT === 465, // true para 465, false para outros
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASS,
                },
                tls: {
                    rejectUnauthorized: false // Para desenvolvimento
                },
                pool: true, // Usar pool de conexões
                maxConnections: 5,
                maxMessages: 100,
                rateLimit: 10, // máximo 10 emails por segundo
            });

            console.log('📧 EmailService inicializado com sucesso');
            console.log(`   📤 SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
            console.log(`   👤 Usuario: ${env.SMTP_USER}`);
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Erro ao inicializar EmailService:', error);
            this.isInitialized = true;
        }
    }

    // Verificar conexão SMTP
    static async verificarConexao(): Promise<boolean> {
        if (!this.transporter) {
            console.log('⚠️ Transporter não configurado - modo simulação');
            return false;
        }

        try {
            await this.transporter.verify();
            console.log('✅ Conexão SMTP verificada com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro na verificação SMTP:', error);
            return false;
        }
    }

    // Enviar email de alerta individual
    static async enviarAlerta(
        destinatario: { email: string; nome: string },
        dadosAlerta: {
            titulo: string;
            mensagem: string;
            nivelCriticidade: string;
            remetente?: string;
        }
    ): Promise<{ sucesso: boolean; erro?: string }> {

        console.log(`📧 Enviando email para ${destinatario.email}:`);
        console.log(`   📄 Assunto: [${this.obterLabelNivel(dadosAlerta.nivelCriticidade)}] ${dadosAlerta.titulo}`);

        // Se não há transporter, simular envio
        if (!this.transporter) {
            console.log('⚠️ Modo simulação - SMTP não configurado');
            return this.simularEnvio(destinatario);
        }

        try {
            const corNivel = this.obterCorNivel(dadosAlerta.nivelCriticidade);
            const templateHtml = this.gerarTemplateHtml(destinatario, dadosAlerta, corNivel);

            const mailOptions: nodemailer.SendMailOptions = {
                from: `"Sistema TCC IPRJ" <${env.SMTP_USER}>`,
                to: destinatario.email,
                subject: `[${this.obterLabelNivel(dadosAlerta.nivelCriticidade)}] ${dadosAlerta.titulo}`,
                html: templateHtml,
                text: this.gerarTextoSimples(destinatario, dadosAlerta),
                priority: this.obterPrioridade(dadosAlerta.nivelCriticidade) as any
            };

            // ✅ LOG DO CONTEÚDO FINAL DO EMAIL
            console.log(`   📬 Assunto final: ${mailOptions.subject}`);
            console.log(`   🎯 Prioridade: ${mailOptions.priority}`);

            const info = await this.transporter.sendMail(mailOptions);

            console.log(`✅ Email enviado com sucesso para: ${destinatario.email}`);
            console.log(`   📨 Message ID: ${info.messageId}`);
            return { sucesso: true };

        } catch (error: any) {
            console.error(`❌ Erro ao enviar email para ${destinatario.email}:`, error.message);
            return {
                sucesso: false,
                erro: error.message || 'Erro desconhecido no envio'
            };
        }
    }

    // Simular envio (quando SMTP não está configurado)
    private static simularEnvio(destinatario: { email: string; nome: string }) {
        const sucesso = Math.random() > 0.05; // 95% de sucesso

        if (sucesso) {
            console.log(`📧 [SIMULADO] Email enviado para: ${destinatario.email}`);
            return { sucesso: true };
        } else {
            console.log(`❌ [SIMULADO] Falha no envio para: ${destinatario.email}`);
            return {
                sucesso: false,
                erro: 'Simulação de falha no envio'
            };
        }
    }

    // Enviar emails em lote (com controle de rate)
    static async enviarLote(
        destinatarios: Array<{ email: string; nome: string }>,
        dadosAlerta: {
            titulo: string;
            mensagem: string;
            nivelCriticidade: string;
        }
    ) {
        console.log('📤 EmailService.enviarLote iniciado:');
        console.log('   👥 Destinatários:', destinatarios.length);
        console.log('   📄 Título do email:', dadosAlerta.titulo);
        console.log('   📝 Mensagem (preview):', dadosAlerta.mensagem.substring(0, 100) + '...');
        console.log('   🚨 Nível de criticidade:', dadosAlerta.nivelCriticidade);

        const resultados = {
            sucessos: 0,
            falhas: 0,
            detalhes: [] as any[]
        };

        console.log(`📤 Iniciando envio em lote para ${destinatarios.length} destinatários`);

        // Processar em batches para não sobrecarregar o SMTP
        const batchSize = this.transporter ? 5 : 10; // Menor batch para SMTP real

        for (let i = 0; i < destinatarios.length; i += batchSize) {
            const batch = destinatarios.slice(i, i + batchSize);

            console.log(`📦 Processando batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);

            const promises = batch.map(async (destinatario) => {
                const resultado = await this.enviarAlerta(destinatario, dadosAlerta);

                const detalhe = {
                    destinatarioId: destinatario.email, // Temporário
                    email: destinatario.email,
                    nome: destinatario.nome,
                    status: resultado.sucesso ? 'enviado' : 'falha',
                    erro: resultado.erro,
                    timestamp: new Date().toISOString(),
                    canais: ['email']
                };

                if (resultado.sucesso) {
                    resultados.sucessos++;
                } else {
                    resultados.falhas++;
                }

                resultados.detalhes.push(detalhe);
                return detalhe;
            });

            // Aguardar todos os emails do batch
            await Promise.allSettled(promises);

            // Pausa entre batches (mais longa para SMTP real)
            if (i + batchSize < destinatarios.length) {
                const pausa = this.transporter ? 2000 : 500; // 2s para SMTP real, 0.5s para simulação
                console.log(`⏱️ Pausa de ${pausa}ms entre batches...`);
                await new Promise(resolve => setTimeout(resolve, pausa));
            }
        }

        console.log(`📊 Envio concluído: ${resultados.sucessos} sucessos, ${resultados.falhas} falhas`);
        return resultados;
    }

    // Obter cor do nível de criticidade
    private static obterCorNivel(nivel: string): string {
        const cores = {
            'baixo': '#22c55e',    // verde
            'medio': '#eab308',    // amarelo  
            'alto': '#f97316',     // laranja
            'critico': '#ef4444'   // vermelho
        };
        return cores[nivel] || '#6b7280';
    }

    // Obter label do nível
    private static obterLabelNivel(nivel: string): string {
        const labels = {
            'baixo': 'INFORMATIVO',
            'medio': 'ATENÇÃO',
            'alto': 'URGENTE',
            'critico': 'CRÍTICO'
        };
        return labels[nivel] || 'ALERTA';
    }

    // Obter prioridade do email
    private static obterPrioridade(nivel: string): 'high' | 'normal' | 'low' {
        if (nivel === 'critico') return 'high';
        if (nivel === 'alto') return 'high';
        if (nivel === 'medio') return 'normal';
        return 'normal';
    }


    // ── Parser estruturado: extrai campos da mensagem gerada pelo AlertForm ──
    private static parsearMensagemSensor(texto: string): Record<string, string> | null {
        if (!texto.includes('DADOS DO MONITORAMENTO DO SENSOR')) return null;
        const get = (label: string) => {
            const m = texto.match(new RegExp(label + '[^:]*:\\s*(.+)'));
            return m ? m[1].trim() : '';
        };
        const recomBloco = texto.match(/RECOMENDAÇÃO:\s*\n([\s\S]*?)(?:\n━|$)/);
        return {
            dataHora:       get('Data/Hora'),
            umidade:        get('Umidade do Solo'),
            risco:          get('Risco Integrado'),
            nivel:          get('Nível de Alerta'),
            prev24h:        get('Próximas 24h'),
            ult24h:         get('Últimas 24h'),
            confiabilidade: get('Confiabilidade'),
            apis:           (() => { const m = texto.match(/BNDMET:\s*(\w+)\s*\|\s*OWM:\s*(\w+)/); return m ? `BNDMET: ${m[1]} · OWM: ${m[2]}` : ''; })(),
            recomendacao:   recomBloco ? recomBloco[1].trim() : '',
        };
    }

    // Gerar template HTML
    private static gerarTemplateHtml(
        destinatario: { email: string; nome: string },
        dadosAlerta: { titulo: string; mensagem: string; nivelCriticidade: string },
        cor: string
    ): string {
        const agora = new Date();
        const dataEnvio = agora.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const label  = this.obterLabelNivel(dadosAlerta.nivelCriticidade);
        const icone  = dadosAlerta.nivelCriticidade === 'critico' ? '🚨'
                     : dadosAlerta.nivelCriticidade === 'alto'    ? '⚠️'
                     : dadosAlerta.nivelCriticidade === 'medio'   ? '⚠️' : 'ℹ️';

        // Paleta por nível
        const paleta: Record<string, { fundo: string; borda: string; texto: string; tagBg: string; tagFg: string }> = {
            critico: { fundo: '#fff5f5', borda: '#fca5a5', texto: '#991b1b', tagBg: '#ef4444', tagFg: '#fff'     },
            alto:    { fundo: '#fff7ed', borda: '#fdba74', texto: '#9a3412', tagBg: '#f97316', tagFg: '#fff'     },
            medio:   { fundo: '#fefce8', borda: '#fde047', texto: '#854d0e', tagBg: '#eab308', tagFg: '#422006' },
            baixo:   { fundo: '#f0fdf4', borda: '#86efac', texto: '#166534', tagBg: '#22c55e', tagFg: '#14532d' },
        };
        const p = paleta[dadosAlerta.nivelCriticidade] ?? paleta['baixo'];

        // Tenta parsear como dados de sensor; caso contrário usa texto simples
        const sensor = this.parsearMensagemSensor(dadosAlerta.mensagem);

        // ── Bloco de conteúdo da mensagem ────────────────────────────────────
        const corpoMensagem = sensor ? `
          <!-- Grid 2 colunas: Sensor + Precipitação -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
            <tr valign="top">
              <!-- Coluna esquerda: dados do sensor -->
              <td width="48%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px 18px;">
                <p style="margin:0 0 10px 0; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em;">Sensor</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="font-size:12px;color:#64748b;padding:3px 0;">🌡️ Umidade do solo</td></tr>
                  <tr><td style="font-size:18px;font-weight:800;color:#0f172a;padding:2px 0 8px 0;">${sensor.umidade}</td></tr>
                  <tr><td style="font-size:12px;color:#64748b;padding:3px 0;">⚠️ Risco integrado</td></tr>
                  <tr><td style="font-size:18px;font-weight:800;color:${cor};padding:2px 0 8px 0;">${sensor.risco}</td></tr>
                  <tr><td style="font-size:12px;color:#64748b;padding:3px 0;">🕐 Leitura</td></tr>
                  <tr><td style="font-size:12px;font-weight:600;color:#334155;padding:2px 0;">${sensor.dataHora}</td></tr>
                </table>
              </td>

              <td width="4%"></td>

              <!-- Coluna direita: precipitação e qualidade -->
              <td width="48%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px 18px;">
                <p style="margin:0 0 10px 0; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em;">Precipitação</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:12px;color:#64748b;padding:3px 0 1px 0;">💧 Próximas 24h</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;font-weight:700;color:#0f172a;padding:0 0 8px 0;">${sensor.prev24h}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#64748b;padding:3px 0 1px 0;">🌧️ Últimas 24h</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;font-weight:700;color:#0f172a;padding:0 0 8px 0;">${sensor.ult24h}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;color:#64748b;padding:3px 0 1px 0;">📊 Confiabilidade</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;font-weight:700;color:#0f172a;padding:0 0 4px 0;">${sensor.confiabilidade}</td>
                  </tr>
                  ${sensor.apis ? `<tr><td style="font-size:11px;color:#94a3b8;padding:2px 0;">${sensor.apis}</td></tr>` : ''}
                </table>
              </td>
            </tr>
          </table>

          ${sensor.recomendacao ? `
          <!-- Recomendação -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
            <tr>
              <td style="background:${p.fundo}; border-left:4px solid ${cor}; border-radius:0 6px 6px 0; padding:14px 18px;">
                <p style="margin:0 0 4px 0; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em;">Recomendação</p>
                <p style="margin:0; font-size:13px; color:${p.texto}; font-weight:600; line-height:1.5;">${sensor.recomendacao}</p>
              </td>
            </tr>
          </table>` : ''}
        ` : `
          <!-- Mensagem de texto livre -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
            <tr>
              <td style="background:#f8fafc; border-left:4px solid ${cor}; border-radius:0 6px 6px 0; padding:18px 20px;">
                <p style="margin:0; font-size:14px; color:#334155; line-height:1.7; white-space:pre-wrap;">${dadosAlerta.mensagem.trim()}</p>
              </td>
            </tr>
          </table>
        `;

        // ── Banner de urgência (só crítico/alto) ─────────────────────────────
        const bannerUrgencia = (dadosAlerta.nivelCriticidade === 'critico' || dadosAlerta.nivelCriticidade === 'alto') ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
            <tr>
              <td style="background:${p.fundo}; border:1px solid ${p.borda}; border-radius:6px; padding:14px 18px;">
                <p style="margin:0; font-size:13px; font-weight:700; color:${p.texto};">
                  ${icone} Este alerta de nível <strong>${label}</strong> requer atenção imediata da equipe técnica responsável.
                </p>
              </td>
            </tr>
          </table>` : '';

        return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${label} — Sistema TCC IPRJ</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    body{margin:0!important;padding:0!important;background-color:#ffffff}
    @media only screen and (max-width:600px){
      .two-col td{display:block!important;width:100%!important;padding-bottom:12px!important}
      .wrap{padding:20px 16px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;width:100%;">
  <tr>
    <td align="left" style="padding:0;margin:0;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:${cor};padding:32px 40px;text-align:center;">
            <span style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);
                         border-radius:16px;padding:3px 12px;font-size:11px;font-weight:700;color:#fff;
                         text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">
              ${icone} Nível ${label}
            </span>
            <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:800;color:#fff;
                       font-family:'Segoe UI',Arial,sans-serif;line-height:1.25;">
              Alerta do Sistema de Monitoramento
            </h1>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.82);font-family:'Segoe UI',Arial,sans-serif;">
              Sistema TCC IPRJ — Barragens de Rejeitos
            </p>
          </td>
        </tr>

        <!-- CORPO -->
        <tr>
          <td class="wrap" style="background:#ffffff;padding:28px 40px;font-family:'Segoe UI',Arial,sans-serif;">

            <!-- Saudação + título -->
            <p style="margin:0 0 4px 0;font-size:15px;color:#1e293b;font-weight:500;">
              Olá, <strong style="color:${cor};">${destinatario.nome}</strong>
            </p>
            <p style="margin:0 0 16px 0;font-size:13px;color:#64748b;font-weight:600;
                      text-transform:uppercase;letter-spacing:0.04em;">
              ${dadosAlerta.titulo}
            </p>

            <!-- Conteúdo principal (sensor estruturado ou texto livre) -->
            ${corpoMensagem}

            <!-- Banner de urgência -->
            ${bannerUrgencia}

            <!-- Linha de metadados -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-top:1px solid #f1f5f9;margin-top:16px;padding-top:14px;">
              <tr>
                <td style="font-size:11px;color:#94a3b8;">
                  🕐 Enviado em ${dataEnvio} &nbsp;·&nbsp;
                  📧 ${destinatario.email} &nbsp;·&nbsp;
                  <span style="display:inline-block;background:${p.tagBg};color:${p.tagFg};
                               font-size:10px;font-weight:700;padding:1px 7px;border-radius:8px;
                               text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0f172a;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 3px 0;font-size:13px;font-weight:700;color:#f1f5f9;">Sistema TCC IPRJ</p>
            <p style="margin:0;font-size:11px;color:#475569;line-height:1.5;">
              Engenharia da Computação / UERJ-IPRJ &nbsp;·&nbsp;
              © 2026 &nbsp;·&nbsp; E-mail automático, não responda
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
    }


    // Gerar texto simples (fallback) - ✅ PRESERVAR CONTEÚDO EXATO
    private static gerarTextoSimples(
        destinatario: { email: string; nome: string },
        dadosAlerta: { titulo: string; mensagem: string; nivelCriticidade: string }
    ): string {
        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });

        return `
🚨 ALERTA DO SISTEMA TCC IPRJ
========================================

Olá ${destinatario.nome},

NÍVEL: ${this.obterLabelNivel(dadosAlerta.nivelCriticidade)} (${dadosAlerta.nivelCriticidade.toUpperCase()})
TÍTULO: ${dadosAlerta.titulo}

MENSAGEM:
${dadosAlerta.mensagem}

📍 DETALHES:
• Data/Hora: ${dataFormatada}
• Destinatário: ${destinatario.email}
• Sistema: TCC IPRJ - Monitoramento de Barragens
• Prioridade: ${this.obterLabelNivel(dadosAlerta.nivelCriticidade)}

${dadosAlerta.nivelCriticidade === 'critico' || dadosAlerta.nivelCriticidade === 'alto' ?
                `
⚠️ AÇÃO IMEDIATA NECESSÁRIA
Este alerta de nível ${dadosAlerta.nivelCriticidade.toUpperCase()} requer atenção urgente da equipe técnica.
` : dadosAlerta.nivelCriticidade === 'medio' ?
                    `
⚠️ ATENÇÃO NECESSÁRIA  
Monitore a situação e tome as medidas preventivas adequadas.
` : ''}

========================================
© 2026 Sistema TCC IPRJ
Este é um alerta automático do sistema.
    `;
    }


    // Enviar email de reset de senha
    static async enviarResetSenha(
        destinatario: { email: string; nome: string },
        token: string,
        expira: Date
    ): Promise<{ sucesso: boolean; erro?: string }> {

        console.log(`🔑 Enviando email de reset de senha para ${destinatario.email}`);

        if (!this.transporter) {
            console.log('⚠️ Modo simulação - email de reset não enviado pelo SMTP');
            console.log(`   🔑 Token gerado: ${token}`);
            return { sucesso: true };
        }

        const dataExpira = expira.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const htmlReset = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha — TCC IPRJ</title>
</head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;margin:0;padding:20px;background-color:#f5f5f5;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:white;padding:30px 20px;text-align:center;">
            <h1 style="margin:0;font-size:24px;font-weight:700;">🔑 Redefinição de Senha</h1>
            <p style="margin:8px 0 0 0;opacity:0.9;font-size:15px;">Sistema TCC IPRJ — Monitoramento de Barragens</p>
        </div>
        <div style="padding:40px 30px;">
            <p style="font-size:17px;color:#333;margin-bottom:20px;font-weight:500;">
                Olá <strong style="color:#2563eb;">${destinatario.nome}</strong>,
            </p>
            <p style="color:#4b5563;font-size:15px;margin-bottom:25px;">
                Recebemos uma solicitação para redefinir a senha da sua conta de administrador.
                Copie o token abaixo e cole na tela de redefinição de senha.
            </p>
            <div style="background:#f0f9ff;border:2px dashed #2563eb;border-radius:10px;padding:25px;text-align:center;margin:25px 0;">
                <p style="color:#1e40af;font-size:13px;font-weight:600;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.05em;">
                    Seu Token de Redefinição
                </p>
                <div style="background:white;border:1px solid #bfdbfe;border-radius:8px;padding:15px;font-family:'Courier New',Courier,monospace;font-size:13px;color:#1e3a8a;word-break:break-all;letter-spacing:0.03em;font-weight:600;">
                    ${token}
                </div>
                <p style="color:#6b7280;font-size:12px;margin:12px 0 0 0;">
                    ⏱️ Válido até: <strong>${dataExpira}</strong> (2 horas)
                </p>
            </div>
            <div style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:6px;padding:20px;margin:25px 0;">
                <p style="color:#1f2937;font-weight:600;margin:0 0 10px 0;font-size:14px;">Como usar:</p>
                <ol style="color:#4b5563;font-size:14px;margin:0;padding-left:20px;line-height:1.8;">
                    <li>Acesse a tela de login do sistema</li>
                    <li>Clique em <strong>"Esqueci minha senha"</strong></li>
                    <li>Clique em <strong>"Já tenho um token"</strong></li>
                    <li>Cole o token acima no campo indicado</li>
                    <li>Clique em <strong>"Validar Token"</strong></li>
                    <li>Defina e confirme sua nova senha</li>
                </ol>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:15px;margin:20px 0;">
                <p style="color:#92400e;font-size:13px;margin:0;">
                    ⚠️ <strong>Importante:</strong> Se você não solicitou a redefinição de senha,
                    ignore este e-mail. Sua senha permanece a mesma.
                </p>
            </div>
            <p style="color:#9ca3af;font-size:13px;margin-top:25px;">
                Este é um e-mail automático do Sistema TCC IPRJ. Não responda a este endereço.
            </p>
        </div>
        <div style="background:#f9fafb;padding:20px 30px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
                © 2026 Sistema TCC IPRJ — Monitoramento de Barragens<br>
                <span style="color:#9ca3af;">Este e-mail foi gerado automaticamente.</span>
            </p>
        </div>
    </div>
</body>
</html>`;

        const textoSimples = `
🔑 REDEFINIÇÃO DE SENHA — SISTEMA TCC IPRJ
==========================================

Olá ${destinatario.nome},

Seu token de redefinição de senha:

${token}

Válido até: ${dataExpira} (2 horas)

COMO USAR:
1. Acesse a tela de login
2. Clique em "Esqueci minha senha"
3. Clique em "Já tenho um token"
4. Cole o token no campo indicado
5. Clique em "Validar Token"
6. Defina sua nova senha

Se você não solicitou a redefinição, ignore este e-mail.

==========================================
© 2026 Sistema TCC IPRJ
`;

        try {
            const info = await this.transporter.sendMail({
                from: `"Sistema TCC IPRJ" <${env.SMTP_USER}>`,
                to: destinatario.email,
                subject: '🔑 Redefinição de senha — Sistema TCC IPRJ',
                html: htmlReset,
                text: textoSimples,
                priority: 'high' as any,
            });

            console.log(`✅ Email de reset enviado para: ${destinatario.email}`);
            console.log(`   📨 Message ID: ${info.messageId}`);
            return { sucesso: true };

        } catch (error: any) {
            console.error(`❌ Erro ao enviar email de reset para ${destinatario.email}:`, error.message);
            return { sucesso: false, erro: error.message };
        }
    }

    // Fechar conexões (cleanup)
    static async fechar() {
        if (this.transporter) {
            this.transporter.close();
            console.log('📧 EmailService desconectado');
        }
    }
}