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

    // Gerar template HTML responsivo
    private static gerarTemplateHtml(
        destinatario: { email: string; nome: string },
        dadosAlerta: { titulo: string; mensagem: string; nivelCriticidade: string },
        cor: string
    ): string {
        const agora = new Date();
        const dataFormatada = agora.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // ✅ PRESERVAR FORMATAÇÃO DA MENSAGEM DO MODAL
        // Converter quebras de linha \n para <br> e preservar espaçamento
        const mensagemFormatada = dadosAlerta.mensagem
            .replace(/\n/g, '<br>')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/  /g, '&nbsp;&nbsp;'); // Preservar espaços duplos

        // ✅ USAR TÍTULO EXATO DO MODAL
        const tituloExato = dadosAlerta.titulo.trim();

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerta TCC IPRJ - ${this.obterLabelNivel(dadosAlerta.nivelCriticidade)}</title>
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .content { padding: 20px !important; }
            .header h1 { font-size: 20px !important; }
        }
        .message-content {
            line-height: 1.7;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
    </style>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div class="container" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div class="header" style="background: linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">🚨 Alerta do Sistema</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 16px; font-weight: 500;">
                Nível: ${this.obterLabelNivel(dadosAlerta.nivelCriticidade)}
            </p>
        </div>

        <!-- Content -->
        <div class="content" style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 25px; font-weight: 500;">
                Olá <strong style="color: ${cor};">${destinatario.nome}</strong>,
            </p>

            <!-- ✅ CONTEÚDO EXATO DO MODAL -->
            <div style="background: #f8fafc; border-left: 6px solid ${cor}; padding: 25px; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h2 style="color: #1f2937; margin: 0 0 18px 0; font-size: 20px; font-weight: 600;">
                    ${tituloExato}
                </h2>
                <div class="message-content" style="color: #4b5563; margin: 0; font-size: 16px; line-height: 1.7;">
                    ${mensagemFormatada}
                </div>
            </div>

            <!-- Info Box -->
            <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 10px; border: 1px solid #bfdbfe;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 20px; margin-right: 10px;">📍</span>
                    <strong style="color: #1e40af; font-size: 16px;">Sistema de Monitoramento TCC IPRJ</strong>
                </div>
                <div style="color: #1e40af; font-size: 14px; margin-left: 30px;">
                    🕐 <strong>Data/Hora:</strong> ${dataFormatada}<br>
                    📧 <strong>Enviado para:</strong> ${destinatario.email}<br>
                    🎯 <strong>Prioridade:</strong> ${this.obterLabelNivel(dadosAlerta.nivelCriticidade)}<br>
                    📊 <strong>Nível:</strong> ${dadosAlerta.nivelCriticidade.toUpperCase()}
                </div>
            </div>

            <!-- Action needed -->
            ${dadosAlerta.nivelCriticidade === 'critico' || dadosAlerta.nivelCriticidade === 'alto' ? `
            <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 10px; padding: 20px; margin: 25px 0; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                <p style="color: #dc2626; font-weight: 600; margin: 0; font-size: 16px;">
                    AÇÃO IMEDIATA NECESSÁRIA
                </p>
                <p style="color: #991b1b; margin: 8px 0 0 0; font-size: 14px;">
                    Este alerta de nível <strong>${dadosAlerta.nivelCriticidade.toUpperCase()}</strong> requer atenção urgente da equipe técnica
                </p>
            </div>
            ` : dadosAlerta.nivelCriticidade === 'medio' ? `
            <div style="background: #fffbeb; border: 2px solid #fed7aa; border-radius: 10px; padding: 20px; margin: 25px 0; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">⚠️</div>
                <p style="color: #d97706; font-weight: 600; margin: 0; font-size: 15px;">
                    ATENÇÃO NECESSÁRIA
                </p>
                <p style="color: #92400e; margin: 6px 0 0 0; font-size: 13px;">
                    Monitore a situação e tome as medidas preventivas adequadas
                </p>
            </div>
            ` : ''}

            <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; line-height: 1.6;">
                Este é um alerta automático do sistema TCC IPRJ. Para mais informações, acesse o painel de controle ou entre em contato com a equipe técnica.
            </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <div style="margin-bottom: 15px;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMzc4M2ZmIi8+Cjwvc3ZnPgo=" alt="TCC IPRJ" style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">
                <span style="color: #374151; font-weight: 600; font-size: 16px;">Sistema TCC IPRJ</span>
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                © 2026 Sistema TCC IPRJ - Monitoramento de Barragens<br>
                <span style="color: #9ca3af;">Este email foi enviado automaticamente, não responda a este endereço.</span>
            </p>
        </div>
    </div>
</body>
</html>
    `;
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