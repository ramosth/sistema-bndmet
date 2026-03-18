// backend > src > config > env.ts
import dotenv from 'dotenv';

dotenv.config();

// ✅ FORÇA timezone UTC antes de qualquer operação
process.env.TZ = 'UTC';

export const env = {
  PORT:     process.env.PORT     || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET:     process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  // Desenvolvimento: 1000 req/15min (~66/min) — evita 429 durante testes
  // Produção:        valor do .env ou 200 req/15min como padrão seguro
  // As rotas de polling (/health, /sensor/status, /sensor/alertas) são
  // excluídas da contagem via skip no middleware — ver middleware/index.ts
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || '900000'
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS ||
    (process.env.NODE_ENV === 'production' ? '200' : '1000')
  ),

  // APIs externas
  BNDMET_API_KEY:       process.env.BNDMET_API_KEY,
  OPENWEATHER_API_KEY:  process.env.OPENWEATHER_API_KEY,

  // Timezone
  TIMEZONE: 'UTC',

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Validações de inicialização
// ─────────────────────────────────────────────────────────────────────────────
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${envVar}`);
  }
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve ter no mínimo 32 caracteres em produção');
}

// Log de configuração (apenas em desenvolvimento)
if (env.NODE_ENV === 'development') {
  console.log('🔧 Configuração de ambiente:');
  console.log(`   📦 NODE_ENV:    ${env.NODE_ENV}`);
  console.log(`   🌐 PORT:        ${env.PORT}`);
  console.log(`   🔑 JWT:         ${env.JWT_SECRET ? '✅' : '❌'}`);
  console.log(`   🗄️  Database:    ${env.DATABASE_URL ? '✅' : '❌'}`);
  console.log(`   🌍 CORS Origin: ${env.CORS_ORIGIN}`);
  console.log(`   🚦 Rate Limit:  ${env.RATE_LIMIT_MAX_REQUESTS} req / ${env.RATE_LIMIT_WINDOW_MS / 60000} min`);
}