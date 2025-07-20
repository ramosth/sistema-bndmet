import './lib/bigint'; // Importar PRIMEIRO para configurar BigInt
import express from 'express';
import { env } from './config/env';
import {
  corsOptions,
  rateLimiter,
  errorHandler,
  notFoundHandler,
  requestLogger,
} from './middleware';
import routes from './routes';
import docsRoutes from './routes/docsRoutes';
import { setupSwagger } from './config/swagger';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimiter);

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(requestLogger);

// ========== DOCUMENTAÇÃO ==========
// Configurar Swagger (deve vir antes das rotas)
setupSwagger(app);

// Rotas de documentação personalizada
app.use('/api', docsRoutes);

// ========== ROTAS PRINCIPAIS ==========
app.use('/api', routes);

// ========== PÁGINA INICIAL ==========
// Página inicial com links para documentação
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API - Sistema de Monitoramento</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 40px; background: #f8fafc; color: #334155;
                line-height: 1.6;
            }
            .container { 
                max-width: 800px; margin: 0 auto; background: white; 
                padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            h1 { color: #1e293b; margin-bottom: 8px; }
            .subtitle { color: #64748b; margin-bottom: 32px; font-size: 18px; }
            .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 32px 0; }
            .link-card { 
                border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; 
                text-decoration: none; color: inherit; transition: all 0.2s;
                background: #f8fafc;
            }
            .link-card:hover { 
                border-color: #3b82f6; background: white; 
                transform: translateY(-2px); box-shadow: 0 4px 12px -1px rgba(0,0,0,0.1);
            }
            .link-title { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            .link-desc { color: #64748b; font-size: 14px; }
            .status { 
                display: inline-block; background: #10b981; color: white; 
                padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
            }
            .features { 
                background: #f1f5f9; padding: 24px; border-radius: 8px; margin: 32px 0;
                border-left: 4px solid #3b82f6;
            }
            .features ul { margin: 0; padding-left: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API</h1>
            <p class="subtitle">Sistema de Monitoramento de Barragem de Rejeito</p>
            <span class="status">Online</span>
            
            <div class="features">
                <h3>✨ Funcionalidades</h3>
                <ul>
                    <li><strong>Autenticação JWT</strong> - Sistema seguro de login</li>
                    <li><strong>Monitoramento</strong> - Dados de sensores em tempo real</li>
                    <li><strong>Gestão de Usuários</strong> - Administradores e usuários básicos</li>
                    <li><strong>Sistema de Alertas</strong> - Notificações automáticas</li>
                    <li><strong>Dashboard</strong> - Visualização de dados</li>
                </ul>
            </div>

            <h3>📚 Documentação Disponível</h3>
            <div class="links">
                <a href="${baseUrl}/api/docs" class="link-card">
                    <div class="link-title">🔍 Swagger UI</div>
                    <div class="link-desc">Interface interativa para testar endpoints</div>
                </a>
                
                <a href="${baseUrl}/api/docs.json" class="link-card">
                    <div class="link-title">📄 OpenAPI JSON</div>
                    <div class="link-desc">Especificação para ferramentas</div>
                </a>
                
                <a href="${baseUrl}/api/health" class="link-card">
                    <div class="link-title">💚 Health Check</div>
                    <div class="link-desc">Status dos serviços</div>
                </a>
            </div>

            <h3>🚀 Quick Start</h3>
            <div style="background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="margin-bottom: 12px; color: #64748b;">1. Fazer login:</div>
                <code style="display: block; margin-bottom: 16px;">curl -X POST ${baseUrl}/api/auth/login -H 'Content-Type: application/json' -d '{"email":"email_admin@bndmet.com","senha":"senhaAdmin"}'</code>
                
                <div style="margin-bottom: 12px; color: #64748b;">2. Usar token para acessar dados:</div>
                <code style="display: block;">curl -H 'Authorization: Bearer &lt;token&gt;' ${baseUrl}/api/auth/perfil</code>
            </div>

            <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0;">
                    🔗 <strong>Base URL:</strong> <code>${baseUrl}/api</code> | 
                    📧 <strong>Contato:</strong> thamires.santos@grad.iprj.uerj.br
                </p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// ========== HANDLERS DE ERRO ==========
app.use(notFoundHandler);
app.use(errorHandler);

export default app;