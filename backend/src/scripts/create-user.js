// Solução definitiva: Criar usuário diretamente via código
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://admin:senha123@localhost:5432/bndmet?schema=public'
    }
  }
});

async function criarUsuarioDefinitivo() {
  try {
    console.log('🚀 Criando usuário definitivo...');
    
    const senha = 'admin123';
    const hash = await bcrypt.hash(senha, 10);
    
    console.log('Senha:', senha);
    console.log('Hash gerado:', hash);
    console.log('Tamanho do hash:', hash.length);
    
    // Testar o hash antes de salvar
    const teste = await bcrypt.compare(senha, hash);
    console.log('Hash funcionando:', teste ? '✅' : '❌');
    
    if (!teste) {
      throw new Error('Hash não está funcionando!');
    }
    
    // Deletar usuário existente se houver
    await prisma.usuariosAdmin.deleteMany({
      where: {
        email: 'admin@bndmet.com'
      }
    });
    
    console.log('Usuario antigo removido...');
    
    // Criar novo usuário
    const novoUsuario = await prisma.usuariosAdmin.create({
      data: {
        nome: 'Administrador Sistema',
        email: 'admin@bndmet.com',
        senhaHash: hash,
        perfil: 'super_admin',
        ativo: true
      }
    });
    
    console.log('✅ Novo usuário criado:');
    console.log('ID:', novoUsuario.id);
    console.log('Nome:', novoUsuario.nome);
    console.log('Email:', novoUsuario.email);
    console.log('Hash salvo (primeiros 20 chars):', novoUsuario.senhaHash.substring(0, 20));
    console.log('Tamanho do hash salvo:', novoUsuario.senhaHash.length);
    
    // Verificar se o hash salvo ainda funciona
    const hashSalvoFunciona = await bcrypt.compare(senha, novoUsuario.senhaHash);
    console.log('Hash salvo funcionando:', hashSalvoFunciona ? '✅' : '❌');
    
    // Buscar o usuário do banco para confirmar
    const usuarioVerificacao = await prisma.usuariosAdmin.findFirst({
      where: { email: 'admin@bndmet.com' }
    });
    
    if (usuarioVerificacao) {
      console.log('\n🔍 Verificação final:');
      console.log('Hash do banco:', usuarioVerificacao.senhaHash);
      console.log('Tamanho:', usuarioVerificacao.senhaHash.length);
      
      const hashBancoFunciona = await bcrypt.compare(senha, usuarioVerificacao.senhaHash);
      console.log('Hash do banco funciona:', hashBancoFunciona ? '✅' : '❌');
      
      if (hashBancoFunciona) {
        console.log('\n🎉 SUCESSO! Agora tente fazer login com:');
        console.log('Email: admin@bndmet.com');
        console.log('Senha: admin123');
      } else {
        console.log('\n❌ Ainda há problema com o hash no banco');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarUsuarioDefinitivo();