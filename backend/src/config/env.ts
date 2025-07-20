import dotenv from 'dotenv';

dotenv.config();

// ✅ FORÇA timezone UTC antes de qualquer operação
process.env.TZ = 'UTC';

export const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // External APIs
  BNDMET_API_KEY: process.env.BNDMET_API_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,

  // Timezone
  TIMEZONE: 'UTC',

  // Email Configuration (para futuras implementações)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // SMS Configuration (para futuras implementações)
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_API_URL: process.env.SMS_API_URL,
};

// Validar variáveis obrigatórias
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required`);
  }
}

// Validar JWT_SECRET em produção
if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production');
}

// Log de configuração (apenas em desenvolvimento)
if (env.NODE_ENV === 'development') {
  console.log('🔧 Configuração de ambiente carregada:');
  console.log(`   📦 NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   🌐 PORT: ${env.PORT}`);
  console.log(`   🔑 JWT configurado: ${env.JWT_SECRET ? '✅' : '❌'}`);
  console.log(`   🗄️  Database: ${env.DATABASE_URL ? '✅' : '❌'}`);
  console.log(`   🌍 CORS Origin: ${env.CORS_ORIGIN}`);
}