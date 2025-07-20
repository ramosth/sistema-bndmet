import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

export class DocsController {
  // GET /api/endpoints - Lista completa de endpoints
  static async listarEndpoints(req: Request, res: Response) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    
    const endpoints = {
      "info": {
        "title": "SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API",
        "version": "2.0.0",
        "description": "Sistema de Monitoramento de Barragem de Rejeito",
        "baseUrl": baseUrl,
        "documentation": {
          "swagger": `${baseUrl}/docs`,
          "json": `${baseUrl}/docs.json`,
          "endpoints": `${baseUrl}/endpoints`,
          "markdown": "Disponível no repositório"
        }
      },
      "authentication": {
        "type": "JWT Bearer Token",
        "header": "Authorization: Bearer <token>",
        "expiration": "7 dias",
        "levels": {
          "public": "Sem autenticação necessária",
          "authenticated": "Requer token válido",
          "admin": "Requer token + perfil admin/super_admin",
          "super_admin": "Requer token + perfil super_admin"
        }
      },
      "endpoints": {
        "publicos": [
          {
            "method": "POST",
            "path": "/auth/login",
            "description": "Fazer login administrativo",
            "auth": "none",
            "body": {
              "required": ["email", "senha"],
              "optional": [],
              "example": {
                "email": "admin@bndmet.com",
                "senha": "admin123"
              },
              "validation": {
                "email": "formato email válido",
                "senha": "mínimo 6 caracteres"
              }
            },
            "responses": {
              "200": {
                "description": "Login realizado com sucesso",
                "example": {
                  "success": true,
                  "data": {
                    "token": "eyJhbGciOiJIUzI1NiIs...",
                    "usuario": {
                      "id": "uuid",
                      "nome": "Admin",
                      "email": "admin@bndmet.com",
                      "perfil": "super_admin"
                    },
                    "expiresAt": "2025-07-12T19:12:26.167Z"
                  }
                }
              },
              "401": "Credenciais inválidas"
            }
          },
          {
            "method": "POST",
            "path": "/auth/cadastro-basico",
            "description": "Cadastrar usuário básico para receber notificações",
            "auth": "none",
            "body": {
              "required": ["nome", "email"],
              "optional": ["telefone", "receberNotificacoes", "tipoNotificacao"],
              "example": {
                "nome": "João Silva",
                "email": "joao@email.com",
                "telefone": "(11) 99999-0001",
                "receberNotificacoes": true,
                "tipoNotificacao": "email"
              },
              "validation": {
                "nome": "2-100 caracteres",
                "email": "formato email único",
                "telefone": "formato brasileiro (opcional)",
                "tipoNotificacao": "email|sms|email,sms"
              }
            },
            "responses": {
              "201": "Usuário cadastrado com sucesso",
              "400": "Email já cadastrado ou dados inválidos"
            }
          },
          {
            "method": "POST",
            "path": "/auth/solicitar-reset-senha",
            "description": "Solicitar token para reset de senha",
            "auth": "none",
            "body": {
              "required": ["email"],
              "example": { "email": "admin@bndmet.com" }
            },
            "responses": {
              "200": "Token de reset gerado (válido por 2h)"
            }
          },
          {
            "method": "GET",
            "path": "/auth/validar-token-reset/{token}",
            "description": "Validar se token de reset é válido",
            "auth": "none",
            "params": {
              "token": "Token de 64 caracteres"
            },
            "responses": {
              "200": "Token válido",
              "400": "Token inválido ou expirado"
            }
          },
          {
            "method": "POST",
            "path": "/auth/resetar-senha",
            "description": "Resetar senha usando token",
            "auth": "none",
            "body": {
              "required": ["token", "novaSenha"],
              "optional": ["confirmarSenha"],
              "example": {
                "token": "a1b2c3d4e5f6...",
                "novaSenha": "NovaSenh@123"
              },
              "validation": {
                "token": "64 caracteres hexadecimais",
                "novaSenha": "mín 8 chars, maiúscula+minúscula+número"
              }
            },
            "responses": {
              "200": "Senha alterada com sucesso",
              "400": "Token inválido ou senha fraca"
            }
          },
          {
            "method": "POST",
            "path": "/sensor/dados",
            "description": "Receber dados do ESP8266",
            "auth": "none",
            "body": {
              "required": [],
              "optional": ["umidadeSolo", "valorAdc", "temperatura", "riscoIntegrado", "nivelAlerta"],
              "example": {
                "umidadeSolo": 25.5,
                "valorAdc": 650,
                "temperatura": 22.3,
                "riscoIntegrado": 45.2,
                "nivelAlerta": "AMARELO",
                "recomendacao": "Monitoramento ativo"
              },
              "validation": {
                "umidadeSolo": "0-100 (float)",
                "valorAdc": "0-1023 (integer)",
                "temperatura": "-50 a 60°C",
                "nivelAlerta": "VERDE|AMARELO|VERMELHO|CRÍTICO"
              }
            },
            "responses": {
              "201": "Dados salvos com sucesso",
              "400": "Dados inválidos"
            }
          },
          {
            "method": "GET",
            "path": "/sensor/status",
            "description": "Health check dos sensores",
            "auth": "none",
            "responses": {
              "200": "Status da API e última leitura"
            }
          },
          {
            "method": "GET",
            "path": "/health",
            "description": "Health check geral do sistema",
            "auth": "none",
            "responses": {
              "200": "Status de todos os serviços"
            }
          }
        ],
        "autenticados": [
          {
            "method": "POST",
            "path": "/auth/logout",
            "description": "Fazer logout (invalida token atual)",
            "auth": "bearer",
            "responses": {
              "200": "Logout realizado com sucesso"
            }
          },
          {
            "method": "GET",
            "path": "/auth/verificar-token",
            "description": "Verificar se token é válido",
            "auth": "bearer",
            "responses": {
              "200": "Token válido + dados do usuário",
              "401": "Token inválido ou expirado"
            }
          },
          {
            "method": "GET",
            "path": "/auth/perfil",
            "description": "Obter dados do usuário logado",
            "auth": "bearer",
            "responses": {
              "200": "Dados completos do usuário"
            }
          },
          {
            "method": "PUT",
            "path": "/auth/alterar-senha",
            "description": "Alterar senha do usuário logado",
            "auth": "bearer",
            "body": {
              "required": ["senhaAtual", "novaSenha", "confirmarSenha"],
              "example": {
                "senhaAtual": "senhaAtual123",
                "novaSenha": "NovaSenh@123",
                "confirmarSenha": "NovaSenh@123"
              }
            },
            "responses": {
              "200": "Senha alterada com sucesso",
              "400": "Senha atual incorreta"
            }
          }
        ],
        "administrativos": [
          {
            "method": "GET",
            "path": "/auth/usuarios-basicos",
            "description": "Listar usuários básicos com paginação",
            "auth": "admin",
            "query": {
              "pagina": "número da página (default: 1)",
              "limite": "itens por página (default: 50, max: 100)"
            },
            "responses": {
              "200": "Lista paginada de usuários básicos"
            }
          },
          {
            "method": "GET",
            "path": "/auth/usuarios-admin",
            "description": "Listar usuários administradores",
            "auth": "admin",
            "query": {
              "pagina": "número da página",
              "limite": "itens por página"
            },
            "responses": {
              "200": "Lista paginada de administradores"
            }
          },
          {
            "method": "GET",
            "path": "/auth/estatisticas-usuarios",
            "description": "Estatísticas gerais de usuários",
            "auth": "admin",
            "responses": {
              "200": "Contadores de usuários e alertas dos últimos 30 dias"
            }
          },
          {
            "method": "POST",
            "path": "/auth/enviar-alerta",
            "description": "Enviar alerta em massa para usuários",
            "auth": "admin",
            "body": {
              "required": ["titulo", "mensagem", "nivelCriticidade", "tipoDestinatario", "canaisEnvio"],
              "optional": ["destinatariosIds"],
              "example": {
                "titulo": "Alerta de Segurança",
                "mensagem": "Detectado risco alto na barragem X",
                "nivelCriticidade": "alto",
                "tipoDestinatario": "todos",
                "canaisEnvio": ["email", "sms"],
                "destinatariosIds": ["uuid1", "uuid2"]
              },
              "validation": {
                "titulo": "5-200 caracteres",
                "mensagem": "10-1000 caracteres",
                "nivelCriticidade": "baixo|medio|alto|critico",
                "tipoDestinatario": "basicos|admins|todos",
                "canaisEnvio": "array com email|sms|push"
              }
            },
            "responses": {
              "200": "Alerta enviado + estatísticas de envio"
            }
          },
          {
            "method": "GET",
            "path": "/sensor/ultimas",
            "description": "Buscar últimas leituras dos sensores",
            "auth": "admin",
            "query": {
              "limite": "número de leituras (default: 100, max: 1000)"
            },
            "responses": {
              "200": "Array com últimas leituras ordenadas por timestamp"
            }
          },
          {
            "method": "GET",
            "path": "/sensor/periodo",
            "description": "Buscar leituras por período específico",
            "auth": "admin",
            "query": {
              "dataInicio": "data início (ISO 8601) - obrigatório",
              "dataFim": "data fim (ISO 8601) - obrigatório",
              "pagina": "número da página (default: 1)",
              "limite": "itens por página (default: 50)"
            },
            "example": "?dataInicio=2025-07-01T00:00:00Z&dataFim=2025-07-05T23:59:59Z",
            "responses": {
              "200": "Leituras do período com paginação",
              "400": "Datas obrigatórias ou formato inválido"
            }
          },
          {
            "method": "GET",
            "path": "/sensor/alertas",
            "description": "Buscar alertas críticos (níveis alto/crítico)",
            "auth": "admin",
            "query": {
              "limite": "número de alertas (default: 50)"
            },
            "responses": {
              "200": "Alertas de nível CRÍTICO, ALTO, VERMELHO"
            }
          },
          {
            "method": "GET",
            "path": "/sensor/estatisticas",
            "description": "Estatísticas gerais dos sensores",
            "auth": "admin",
            "responses": {
              "200": "Total de leituras, médias últimas 24h, alertas críticos"
            }
          },
          {
            "method": "GET",
            "path": "/sensor/logs",
            "description": "Buscar logs do sistema",
            "auth": "admin",
            "query": {
              "nivel": "filtro por nível (INFO|WARNING|ERROR|CRITICAL)",
              "componente": "filtro por componente (SENSOR|BNDMET|CONECTIVIDADE)",
              "limite": "número de logs (default: 100)"
            },
            "responses": {
              "200": "Logs do sistema filtrados e ordenados"
            }
          },
          {
            "method": "POST",
            "path": "/auth/limpar-tokens-expirados",
            "description": "Remover tokens de reset expirados (manutenção)",
            "auth": "admin",
            "responses": {
              "200": "Quantidade de tokens removidos"
            }
          },
          {
            "method": "POST",
            "path": "/auth/limpar-sessoes-expiradas",
            "description": "Remover sessões de login expiradas (manutenção)",
            "auth": "admin",
            "responses": {
              "200": "Quantidade de sessões removidas"
            }
          }
        ],
        "superAdmin": [
          {
            "method": "POST",
            "path": "/auth/cadastro-admin",
            "description": "Cadastrar novo usuário administrador",
            "auth": "super_admin",
            "body": {
              "required": ["nome", "email", "senha"],
              "optional": ["perfil"],
              "example": {
                "nome": "Maria Admin",
                "email": "maria@bndmet.com",
                "senha": "SenhaFort@123",
                "perfil": "admin"
              },
              "validation": {
                "nome": "2-100 caracteres",
                "email": "formato email único",
                "senha": "mín 8 chars, maiúscula+minúscula+número",
                "perfil": "admin|super_admin (default: admin)"
              }
            },
            "responses": {
              "201": "Administrador cadastrado com sucesso",
              "403": "Acesso negado - requer super_admin"
            }
          }
        ]
      },
      "statusCodes": {
        "200": "OK - Requisição bem-sucedida",
        "201": "Created - Recurso criado com sucesso",
        "400": "Bad Request - Dados inválidos ou malformados",
        "401": "Unauthorized - Token ausente, inválido ou expirado",
        "403": "Forbidden - Usuário não tem permissão suficiente",
        "404": "Not Found - Endpoint não encontrado",
        "500": "Internal Server Error - Erro interno do servidor"
      },
      "examples": {
        "curl": {
          "login": `curl -X POST ${baseUrl}/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@bndmet.com","senha":"admin123"}'`,
          "authenticated": `curl -H 'Authorization: Bearer <token>' ${baseUrl}/auth/perfil`,
          "sensor_data": `curl -X POST ${baseUrl}/sensor/dados -H 'Content-Type: application/json' -d '{"umidadeSolo":25.5,"temperatura":22.3}'`,
          "get_stats": `curl -H 'Authorization: Bearer <token>' ${baseUrl}/auth/estatisticas-usuarios`
        },
        "javascript": {
          "login": `fetch('${baseUrl}/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@bndmet.com', senha: 'admin123' })
});`,
          "authenticated": `fetch('${baseUrl}/auth/perfil', {
  headers: { 'Authorization': 'Bearer ' + token }
});`
        }
      },
      "summary": {
        "totalEndpoints": 25,
        "categories": {
          "publicos": 8,
          "autenticados": 4,
          "administrativos": 12,
          "superAdmin": 1
        },
        "authLevels": {
          "none": 8,
          "bearer": 4,
          "admin": 12,
          "super_admin": 1
        }
      }
    };

    return sendSuccess(res, endpoints, 'Lista completa de endpoints da API Monitoramento de Barragem integrado com API do BNDMET');
  }

  // GET /api/docs-info - Informações sobre documentação
  static async informacoesDocumentacao(req: Request, res: Response) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    
    const info = {
      "documentation": {
        "title": "Documentação SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API",
        "version": "2.0.0",
        "description": "Sistema completo de documentação da API",
        "available_formats": [
          {
            "name": "Swagger UI (Interativo)",
            "url": `${baseUrl}/docs`,
            "description": "Interface interativa para testar endpoints",
            "features": ["Teste direto", "Exemplos", "Validação", "Autenticação"]
          },
          {
            "name": "OpenAPI JSON",
            "url": `${baseUrl}/docs.json`,
            "description": "Especificação OpenAPI 3.0 em JSON",
            "features": ["Importar em Postman", "Gerar SDK", "Integração CI/CD"]
          },
          {
            "name": "Endpoints JSON",
            "url": `${baseUrl}/endpoints`,
            "description": "Lista estruturada de todos os endpoints",
            "features": ["Programático", "Detalhado", "Exemplos", "Validações"]
          },
          {
            "name": "Markdown (Estático)",
            "url": "Disponível no repositório",
            "description": "Documentação completa em markdown",
            "features": ["Versionável", "Legível", "Completo", "Compartilhável"]
          }
        ]
      },
      "usage": {
        "getting_started": [
          "1. Acesse /api/docs para interface interativa",
          "2. Faça login para obter token JWT",
          "3. Use token em endpoints protegidos",
          "4. Consulte /api/endpoints para referência completa"
        ],
        "authentication_flow": [
          "POST /auth/login → Obter token",
          "Usar header: Authorization: Bearer <token>",
          "Token expira em 7 dias",
          "POST /auth/logout → Invalidar token"
        ],
        "common_patterns": {
          "pagination": "?pagina=1&limite=50",
          "date_filter": "?dataInicio=2025-07-01T00:00:00Z&dataFim=2025-07-05T23:59:59Z",
          "log_filter": "?nivel=ERROR&componente=SENSOR&limite=100"
        }
      },
      "tools": {
        "testing": [
          {
            "name": "Swagger UI",
            "url": `${baseUrl}/docs`,
            "description": "Teste direto no navegador"
          },
          {
            "name": "cURL",
            "description": "Linha de comando",
            "example": `curl -H 'Authorization: Bearer <token>' ${baseUrl}/auth/perfil`
          },
          {
            "name": "Postman",
            "description": "Importe spec JSON",
            "import_url": `${baseUrl}/docs.json`
          },
          {
            "name": "HTTPie",
            "description": "Cliente HTTP amigável",
            "example": `http ${baseUrl}/auth/perfil Authorization:'Bearer <token>'`
          }
        ],
        "development": [
          {
            "name": "SDK Generation",
            "description": "Gere SDKs a partir do OpenAPI spec",
            "tools": ["openapi-generator", "swagger-codegen"]
          },
          {
            "name": "Mock Server",
            "description": "Servidor mock para desenvolvimento",
            "tools": ["prism", "wiremock"]
          },
          {
            "name": "Validation",
            "description": "Validação de spec OpenAPI",
            "tools": ["swagger-validator", "spectral"]
          }
        ]
      },
      "statistics": {
        "total_endpoints": 25,
        "by_method": {
          "GET": 12,
          "POST": 11,
          "PUT": 1,
          "DELETE": 0,
          "PATCH": 0
        },
        "by_auth_level": {
          "public": 8,
          "authenticated": 4,
          "admin": 12,
          "super_admin": 1
        },
        "response_codes": {
          "2xx": ["200", "201"],
          "4xx": ["400", "401", "403", "404"],
          "5xx": ["500"]
        }
      },
      "support": {
        "contact": "admin@bndmet.com",
        "repository": "https://github.com/ramosth/sistema-bndmet",
        "issues": "https://github.com/ramosth/sistema-bndmet/issues",
        "wiki": "https://github.com/ramosth/sistema-bndmet/wiki"
      }
    };

    return sendSuccess(res, info, 'Informações sobre a documentação da API');
  }

  // GET /api/test-endpoints - Script de teste dos endpoints
  static async scriptTeste(req: Request, res: Response) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    
    const script = {
      "title": "Script de Teste da API BNDMET",
      "description": "Scripts para testar todos os endpoints da API",
      "bash_script": `#!/bin/bash
# Script de teste completo da API BNDMET
API_URL="${baseUrl}"

echo "🧪 TESTE COMPLETO DA API BNDMET"
echo "==============================="

# 1. Health Check
echo "1️⃣ Health Check..."
curl -s \${API_URL}/health | jq '.'

# 2. Login e obter token
echo "2️⃣ Fazendo login..."
LOGIN_RESPONSE=\$(curl -s -X POST \${API_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@bndmet.com","senha":"admin123"}')

TOKEN=\$(echo \$LOGIN_RESPONSE | jq -r '.data.token')
echo "Token: \$TOKEN"

# 3. Testar endpoints autenticados
echo "3️⃣ Testando perfil..."
curl -s -H "Authorization: Bearer \$TOKEN" \${API_URL}/auth/perfil | jq '.'

# 4. Estatísticas
echo "4️⃣ Estatísticas..."
curl -s -H "Authorization: Bearer \$TOKEN" \${API_URL}/auth/estatisticas-usuarios | jq '.'

# 5. Dados de sensor
echo "5️⃣ Enviando dados de sensor..."
curl -s -X POST \${API_URL}/sensor/dados \\
  -H "Content-Type: application/json" \\
  -d '{"umidadeSolo":25.5,"temperatura":22.3,"riscoIntegrado":45.2,"nivelAlerta":"AMARELO"}' | jq '.'

echo "✅ Teste concluído!"`,
      
      "javascript_example": `// Exemplo de uso em JavaScript
const API_URL = '${baseUrl}';

// 1. Login
async function login() {
  const response = await fetch(\`\${API_URL}/auth/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@bndmet.com',
      senha: 'admin123'
    })
  });
  
  const data = await response.json();
  return data.data.token;
}

// 2. Usar token
async function getProfile(token) {
  const response = await fetch(\`\${API_URL}/auth/perfil\`, {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
  
  return await response.json();
}

// 3. Enviar dados
async function sendSensorData(data) {
  const response = await fetch(\`\${API_URL}/sensor/dados\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  return await response.json();
}`,

      "python_example": `# Exemplo de uso em Python
import requests
import json

API_URL = '${baseUrl}'

# 1. Login
def login():
    response = requests.post(f'{API_URL}/auth/login', json={
        'email': 'admin@bndmet.com',
        'senha': 'admin123'
    })
    return response.json()['data']['token']

# 2. Usar token
def get_profile(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{API_URL}/auth/perfil', headers=headers)
    return response.json()

# 3. Enviar dados
def send_sensor_data(data):
    response = requests.post(f'{API_URL}/sensor/dados', json=data)
    return response.json()

# Exemplo de uso
token = login()
profile = get_profile(token)
result = send_sensor_data({
    'umidadeSolo': 25.5,
    'temperatura': 22.3,
    'riscoIntegrado': 45.2,
    'nivelAlerta': 'AMARELO'
})`,

      "postman_collection": {
        "info": {
          "name": "SISTEMA MONITORAMENTO BARRAGEM ARDUINO feat BNDMET API",
          "description": "Coleção completa da API de monitoramento de barragens de rejeito integrado com BNDMET",
          "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": [
          {
            "name": "Auth",
            "item": [
              {
                "name": "Login",
                "request": {
                  "method": "POST",
                  "header": [{"key": "Content-Type", "value": "application/json"}],
                  "body": {
                    "mode": "raw",
                    "raw": JSON.stringify({
                      "email": "admin@bndmet.com",
                      "senha": "admin123"
                    })
                  },
                  "url": {
                    "raw": `${baseUrl}/auth/login`,
                    "host": [baseUrl.replace('http://', '').replace('https://', '')],
                    "path": ["api", "auth", "login"]
                  }
                }
              }
            ]
          }
        ]
      },
      
      "curl_examples": {
        "login": `curl -X POST ${baseUrl}/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"admin@bndmet.com","senha":"admin123"}'`,
        
        "get_profile": `curl -H 'Authorization: Bearer <TOKEN>' \\
  ${baseUrl}/auth/perfil`,
        
        "send_sensor_data": `curl -X POST ${baseUrl}/sensor/dados \\
  -H 'Content-Type: application/json' \\
  -d '{"umidadeSolo":25.5,"temperatura":22.3,"riscoIntegrado":45.2}'`,
        
        "get_statistics": `curl -H 'Authorization: Bearer <TOKEN>' \\
  ${baseUrl}/auth/estatisticas-usuarios`
      }
    };

    return sendSuccess(res, script, 'Scripts de teste para a API');
  }
}