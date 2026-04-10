// backend/src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API',
      version: '3.0.0',
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
            example: '2026-07-01T00:00:00Z'
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
            example: '2026-07-05T23:59:59Z'
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
              example: '2026-07-05T19:12:26.167Z',
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

            // Sensor local
            umidadeSolo: {
              type: 'number', format: 'float', minimum: 0, maximum: 100, example: 18.5,
              description: 'Umidade do solo (%)'
            },
            valorAdc: {
              type: 'integer', minimum: 0, maximum: 1023, example: 720,
              description: 'Valor bruto do ADC (0–1023)'
            },
            sensorOk: {
              type: 'boolean', example: true,
              description: 'Status do sensor (true = operacional)'
            },
            fatorLocal: {
              type: 'number', format: 'float', example: 0.740,
              description: 'Fator_lençol normalizado [0–1] (Equação 3 TCC)'
            },

            // BNDMET
            precipitacaoAtual: {
              type: 'number', format: 'float', example: 1.2,
              description: 'Precipitação horária mais recente via I175 (mm)'
            },
            precipitacao24h: {
              type: 'number', format: 'float', example: 22.5,
              description: 'Precipitação acumulada 24h via I006 (mm)'
            },
            precipitacao7d: {
              type: 'number', format: 'float', example: 87.3,
              description: 'Precipitação acumulada 7 dias via I006 (mm)'
            },
            precipitacao30d: {
              type: 'number', format: 'float', example: 210.0,
              description: 'Precipitação acumulada 30 dias via I006 (mm)'
            },
            statusApiBndmet: {
              type: 'string', example: 'OK',
              description: 'Status da conexão com a API BNDMET ("OK" | "FALHA")'
            },
            qualidadeDadosBndmet: {
              type: 'integer', minimum: 0, maximum: 100, example: 96,
              description: 'Percentual de medições válidas retornadas pela API BNDMET (%)'
            },
            estacao: {
              type: 'string', example: 'D6594',
              description: 'Código da estação meteorológica consultada'
            },

            // Meteorologia OWM
            temperatura: {
              type: 'number', format: 'float', minimum: -50, maximum: 60, example: 23.1,
              description: 'Temperatura do ar (°C)'
            },
            umidadeExterna: {
              type: 'number', format: 'float', minimum: 0, maximum: 100, example: 74.0,
              description: 'Umidade relativa do ar (%)'
            },
            pressaoAtmosferica: {
              type: 'number', format: 'float', example: 1011.4,
              description: 'Pressão atmosférica ao nível do solo (hPa) — campo grnd_level OWM'
            },
            velocidadeVento: {
              type: 'number', format: 'float', example: 3.8,
              description: 'Velocidade do vento (m/s)'
            },
            descricaoTempo: {
              type: 'string', example: 'chuva fraca',
              description: 'Descrição das condições meteorológicas atuais'
            },
            chuvaAtualOWM: {
              type: 'number', format: 'float', example: 0.8,
              description: 'Precipitação na última hora via OWM rain.1h (mm/h) — ausente quando não chove'
            },

            // Previsão OWM /forecast
            chuvaFutura24h: {
              type: 'number', format: 'float', example: 18.0,
              description: 'Precipitação total prevista nas próximas 24h — soma rain.3h dos 8 blocos OWM (mm)'
            },
            intensidadePrevisao: {
              type: 'string',
              enum: ['Fraca', 'Moderada', 'Forte', 'Muito Forte', 'Pancada de Chuva'],
              example: 'Moderada',
              description: 'Classe de intensidade pluviométrica (Tabela AlertaRio / TCC)'
            },
            fatorIntensidade: {
              type: 'number', format: 'float', example: 0.25,
              description: 'Fator discreto correspondente à classe de intensidade — 0,00 / 0,25 / 0,50 / 0,75 / 1,00'
            },

            // Análise de risco
            riscoIntegrado: {
              type: 'number', format: 'float', minimum: 0, maximum: 1, example: 0.62,
              description: 'Fator de risco integrado calculado pela Equação 5 TCC [0–1]'
            },
            indiceRisco: {
              type: 'integer', minimum: 0, maximum: 100, example: 62,
              description: 'Índice de risco em percentual inteiro [0–100]'
            },
            nivelAlerta: {
              type: 'string',
              enum: ['VERDE', 'AMARELO', 'VERMELHO'],
              example: 'AMARELO',
              description: 'Nível de alerta do sistema'
            },
            recomendacao: {
              type: 'string', example: 'Atenção — monitorar com frequência elevada',
              description: 'Mensagem de recomendação operacional gerada em função do risco'
            },
            confiabilidade: {
              type: 'integer', minimum: 0, maximum: 100, example: 91,
              description: 'Confiabilidade da análise (%) — reduzida por falhas de sensor ou API'
            },
            amplificado: {
              type: 'boolean', example: false,
              description: 'Indica se o coeficiente de amplificação (×1,20) foi aplicado neste ciclo'
            },
            taxaVariacaoUmidade: {
              type: 'number', format: 'float', example: 0.320,
              description: 'Taxa de variação da umidade do solo calculada no buffer circular (%/leitura)'
            },

            // Componentes da Equação 5 TCC
            vLencol: {
              type: 'number', format: 'float', example: 0.2960,
              description: 'Componente V_lençol da equação de risco (peso 0,40)'
            },
            vChuvaAtual: {
              type: 'number', format: 'float', example: 0.0360,
              description: 'Componente V_ch.24h da equação de risco (peso 0,08)'
            },
            vChuvaHistorica: {
              type: 'number', format: 'float', example: 0.0698,
              description: 'Componente V_ch.7d da equação de risco (peso 0,12)'
            },
            vChuvaMensal: {
              type: 'number', format: 'float', example: 0.0700,
              description: 'Componente V_ch.30d da equação de risco (peso 0,10)'
            },
            vChuvaFutura: {
              type: 'number', format: 'float', example: 0.0375,
              description: 'Componente V_ch.fut da equação de risco (peso 0,15)'
            },
            vTaxaVariacao: {
              type: 'number', format: 'float', example: 0.0320,
              description: 'Componente V_taxa da equação de risco (peso 0,10)'
            },
            vPressao: {
              type: 'number', format: 'float', example: 0.0000,
              description: 'Componente V_pressão da equação de risco (peso 0,05)'
            },

            // Status do sistema
            statusSistema: {
              type: 'integer', example: 1,
              description: 'Status geral do sistema (código interno)'
            },
            buzzerAtivo: {
              type: 'boolean', example: false,
              description: 'Indica se o buzzer de alerta está ativo'
            },
            modoManual: {
              type: 'boolean', example: false,
              description: 'Indica se o sistema está em modo manual'
            },
            wifiConectado: {
              type: 'boolean', example: true,
              description: 'Indica se o ESP8266 está conectado ao Wi-Fi'
            },
            dadosBrutos: {
              type: 'object', example: { uptime: 3600000, freeHeap: 28432, rssi: -67, tentativasEnvio: 1 },
              description: 'Dados de diagnóstico (uptime ms, freeHeap bytes, rssi dBm, tentativasEnvio)'
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