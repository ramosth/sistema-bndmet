// backend > src > server.ts
process.env.TZ = 'UTC';

import './lib/bigint';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import dotenv from 'dotenv';
import { EmailService } from './services/emailService';

// Carregar variáveis de ambiente ANTES de importar outras coisas
dotenv.config();

// Debug das variáveis de ambiente
console.log('🔧 Variáveis de ambiente:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não encontrada');
console.log('PORT:', process.env.PORT || 'Usando padrão 3001');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
// ✅ ADICIONAR DEBUG DAS VARIÁVEIS SMTP
console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✅ Configurado' : '⚠️ Não configurado (modo simulação)');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Configurado' : '⚠️ Não configurado');

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
    
    // ✅ INICIALIZAR EmailService
    console.log('📧 Inicializando EmailService...');
    EmailService.init();

    // ✅ VERIFICAR CONEXÃO SMTP (opcional)
    const emailOk = await EmailService.verificarConexao();
    console.log(`📧 Status do email: ${emailOk ? '✅ SMTP Conectado' : '⚠️ Modo Simulação'}`);

    // Iniciar servidor
    app.listen(env.PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
      console.log(`📊 Ambiente: ${env.NODE_ENV}`);
      console.log(`🌐 URL local: http://localhost:${env.PORT}`);
      console.log(`📋 Health check: http://localhost:${env.PORT}/api/sensor/status`);
      console.log(`🕐 Servidor iniciado em UTC: ${new Date().toISOString()}`);
      
      // ✅ LOG DE STATUS DOS SERVIÇOS
      console.log('\n📊 Status dos Serviços:');
      console.log(`   🗄️  Database: ✅ Conectado`);
      console.log(`   📧 EmailService: ${emailOk ? '✅ SMTP Ativo' : '⚠️ Simulação'}`);
      console.log(`   🌐 API: ✅ Online`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  
  // ✅ FECHAR EmailService
  await EmailService.fechar();
  console.log('📧 EmailService desconectado');
  
  await prisma.$disconnect();
  console.log('🗄️ Database desconectado');
  
  console.log('✅ Servidor encerrado com segurança');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Encerrando servidor (SIGTERM)...');
  
  // ✅ FECHAR EmailService
  await EmailService.fechar();
  console.log('📧 EmailService desconectado');
  
  await prisma.$disconnect();
  console.log('🗄️ Database desconectado');
  
  console.log('✅ Servidor encerrado com segurança');
  process.exit(0);
});

startServer();