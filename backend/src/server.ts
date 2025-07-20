// ✅ FORÇA UTC ANTES DE QUALQUER COISA
process.env.TZ = 'UTC';

import './lib/bigint';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente ANTES de importar outras coisas
dotenv.config();

// Debug das variáveis de ambiente
console.log('🔧 Variáveis de ambiente:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
console.log('PORT:', process.env.PORT || 'Usando padrão 3001');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

async function startServer() {
  try {
    // ✅ LOG com timezone
    console.log(`🕐 Timezone configurado: ${process.env.TZ}`);
    console.log(`📅 Hora atual UTC: ${new Date().toISOString()}`);

    // Testar conexão com banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // Gerar cliente Prisma
    console.log('🔄 Gerando cliente Prisma...');
    
    // Iniciar servidor
    app.listen(env.PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
      console.log(`📊 Ambiente: ${env.NODE_ENV}`);
      console.log(`🌐 URL local: http://localhost:${env.PORT}`);
      console.log(`📋 Health check: http://localhost:${env.PORT}/api/sensor/status`);
      console.log(`🕐 Servidor iniciado em UTC: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();