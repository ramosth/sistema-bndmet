// backend/src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API',
      version: '2.0.0',
      description: `
# Sistema de Monitoramento de Barragem de Rejeito

API completa para monitoramento de segurança de barragens com:

- 🔐 **Autenticação JWT** - Sistema seguro de login
- 📊 **Monitoramento** - Dados de sensores em tempo real  
- 👥 **Gestão de Usuários** - Administradores e usuários básicos
- 🚨 **Sistema de Alertas** - Notificações automáticas
- 📈 **Dashboard** - Visualização de dados

## 🚀 Como usar

1. **Fazer login** em \`/auth/login\` para obter token JWT
2. **Usar token** no header \`Authorization: Bearer <token>\`
3. **Acessar endpoints** protegidos conforme seu nível de acesso

## 📋 Níveis de acesso

- **Público**: Endpoints sem autenticação
- **Autenticado**: Requer token JWT válido
- **Admin**: Requer token + perfil admin/super_admin  
- **Super Admin**: Requer token + perfil super_admin

## 🔗 Documentação adicional

- **Lista de endpoints**: \`/api/endpoints\`
- **Scripts de teste**: \`/api/test-scripts\`
- **Informações**: \`/api/docs-info\`
      `,
      contact: {
        name: 'Thamires Ramos dos Santos',
        email: 'thamires.santos@grad.iprj.uerj.br',
        url: 'https://github.com/ramosth/sistema-bndmet'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    externalDocs: {
      description: 'Documentação Completa no GitHub',
      url: 'https://github.com/ramosth/sistema-bndmet/wiki'
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.sistema-bndmet.com/api',
        description: 'Servidor de Produção',
      },
      {
        url: 'https://staging-api.bndmet.com/api',
        description: 'Servidor de Staging',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via /auth/login'
        },
      },
      parameters: {
        PageParam: {
          name: 'pagina',
          in: 'query',
          description: 'Número da página para paginação',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        LimitParam: {
          name: 'limite',
          in: 'query',
          description: 'Número de itens por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 50,
            example: 50
          }
        },
        DateStartParam: {
          name: 'dataInicio',
          in: 'query',
          description: 'Data de início (formato ISO 8601)',
          required: true,
          schema: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-01T00:00:00Z'
          }
        },
        DateEndParam: {
          name: 'dataFim',
          in: 'query',
          description: 'Data de fim (formato ISO 8601)',
          required: true,
          schema: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-05T23:59:59Z'
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso ausente ou inválido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Token inválido ou expirado' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acesso negado - permissões insuficientes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Acesso negado. Requer privilégios de administrador' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        BadRequestError: {
          description: 'Dados inválidos ou malformados',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Dados inválidos' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Recurso não encontrado' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Erro interno do servidor' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      schemas: {
        // Esquemas de resposta padrão
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          },
          required: ['success', 'timestamp']
        },
        PaginatedResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 50 },
                    total: { type: 'integer', example: 150 },
                    totalPages: { type: 'integer', example: 3 }
                  }
                }
              }
            }
          ]
        },
        
        // Esquemas de entidades
        UsuarioAdmin: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            nome: { type: 'string', example: 'Administrador Sistema' },
            email: { type: 'string', format: 'email', example: 'admin@bndmet.com' },
            perfil: { 
              type: 'string', 
              enum: ['admin', 'super_admin'], 
              example: 'super_admin',
              description: 'Nível de acesso do usuário'
            },
            ativo: { type: 'boolean', example: true },
            ultimoLogin: { 
              type: 'string', 
              format: 'date-time', 
              example: '2025-07-05T19:12:26.167Z',
              nullable: true 
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'nome', 'email', 'perfil', 'ativo']
        },
        
        UsuarioBasico: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string', example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@email.com' },
            telefone: { 
              type: 'string', 
              example: '(11) 99999-0001',
              nullable: true,
              description: 'Telefone no formato brasileiro'
            },
            ativo: { type: 'boolean', example: true },
            receberNotificacoes: { 
              type: 'boolean', 
              example: true,
              description: 'Se o usuário deseja receber notificações'
            },
            tipoNotificacao: { 
              type: 'string', 
              example: 'email',
              enum: ['email', 'sms', 'email,sms'],
              description: 'Canais de notificação preferidos'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'nome', 'email', 'ativo', 'receberNotificacoes']
        },
        
        DadosSensor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1234 },
            timestamp: { type: 'string', format: 'date-time' },
            umidadeSolo: { 
              type: 'number', 
              format: 'float', 
              minimum: 0, 
              maximum: 100, 
              example: 25.5,
              description: 'Umidade do solo em porcentagem'
            },
            valorAdc: { 
              type: 'integer', 
              minimum: 0, 
              maximum: 1023, 
              example: 650,
              description: 'Valor ADC do sensor (0-1023)'
            },
            sensorOk: { 
              type: 'boolean', 
              example: true,
              description: 'Status de funcionamento do sensor'
            },
            temperatura: { 
              type: 'number', 
              format: 'float', 
              minimum: -50, 
              maximum: 60, 
              example: 22.3,
              description: 'Temperatura em graus Celsius'
            },
            riscoIntegrado: { 
              type: 'number', 
              format: 'float', 
              minimum: 0, 
              maximum: 100, 
              example: 45.2,
              description: 'Índice de risco calculado (0-100)'
            },
            nivelAlerta: { 
              type: 'string', 
              enum: ['VERDE', 'AMARELO', 'VERMELHO', 'CRÍTICO', 'BAIXO', 'MÉDIO', 'ALTO', 'MÍNIMO'], 
              example: 'AMARELO',
              description: 'Nível atual de alerta do sistema'
            },
            recomendacao: { 
              type: 'string', 
              example: 'Monitoramento ativo',
              description: 'Recomendação baseada na análise'
            },
            precipitacao24h: {
              type: 'number',
              format: 'float',
              example: 12.5,
              description: 'Precipitação nas últimas 24 horas (mm)'
            },
            wifiConectado: {
              type: 'boolean',
              example: true,
              description: 'Status da conexão WiFi'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'timestamp']
        },
        
        LoginRequest: {
          type: 'object',
          properties: {
            email: { 
              type: 'string', 
              format: 'email', 
              example: 'admin@bndmet.com',
              description: 'Email do usuário administrador'
            },
            senha: { 
              type: 'string', 
              minLength: 6, 
              example: 'admin123',
              description: 'Senha do usuário (mínimo 6 caracteres)'
            }
          },
          required: ['email', 'senha']
        },
        
        LoginResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    token: { 
                      type: 'string', 
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      description: 'Token JWT para autenticação'
                    },
                    usuario: { $ref: '#/components/schemas/UsuarioAdmin' },
                    expiresAt: { 
                      type: 'string', 
                      format: 'date-time',
                      description: 'Data/hora de expiração do token'
                    }
                  }
                }
              }
            }
          ]
        },
        
        Estatisticas: {
          type: 'object',
          properties: {
            totalAdminsAtivos: { type: 'integer', example: 2 },
            totalAdminsInativos: { type: 'integer', example: 0 },
            totalBasicosAtivos: { type: 'integer', example: 15 },
            totalBasicosInativos: { type: 'integer', example: 1 },
            totalComNotificacoes: { type: 'integer', example: 14 },
            alertasUltimos30Dias: { type: 'integer', example: 3 },
            timestamp: { type: 'string', format: 'date-time' }
          },
          description: 'Estatísticas gerais do sistema'
        }
      }
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints de login, logout e gestão de usuários',
        externalDocs: {
          description: 'Guia de Autenticação',
          url: 'https://github.com/ramosth/sistema-bndmet/wiki/Authentication'
        }
      },
      {
        name: 'Sensores',
        description: 'Endpoints para dados de sensores e monitoramento',
        externalDocs: {
          description: 'Guia de Sensores',
          url: 'https://github.com/ramosth/sistema-bndmet/wiki/Sensors'
        }
      },
      {
        name: 'Documentação',
        description: 'Endpoints de documentação e informações da API'
      }
    ]
  },
  apis: [
    './src/routes/*.ts', 
    './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Application) {
  // Configuração customizada do Swagger UI
  const swaggerOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info h1 { color: #1f2937 }
      .swagger-ui .info h2 { color: #374151 }
      .swagger-ui .scheme-container { background: #f3f4f6; padding: 20px; border-radius: 8px; }
    `,
    customSiteTitle: 'SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        console.log('Swagger request:', req.url);
        return req;
      }
    }
  };

  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(specs, swaggerOptions));
  
  // Endpoint para obter spec JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Endpoint para spec YAML
  app.get('/api/docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(require('js-yaml').dump(specs));
  });
}

export default specs;