// Script para gerar hash usando o mesmo bcrypt do backend
const bcrypt = require('bcryptjs'); // Usando bcryptjs como o backend

async function gerarHashCorreto() {
  const senha = 'admin123';
  
  console.log('🔧 Gerando hash com bcryptjs (mesmo do backend)...');
  
  // Gerar hash com diferentes rounds para testar
  const rounds = [10, 12];
  
  for (const round of rounds) {
    console.log(`\n📊 Testando com ${round} rounds:`);
    
    const hash = await bcrypt.hash(senha, round);
    const isValid = await bcrypt.compare(senha, hash);
    
    console.log(`Hash (${round} rounds):`, hash);
    console.log(`Válido:`, isValid ? '✅' : '❌');
    
    if (isValid) {
      console.log(`\n🎯 SQL para atualizar (${round} rounds):`);
      console.log(`docker exec -it bndmet-postgres psql -U admin -d bndmet -c "`);
      console.log(`UPDATE usuarios_admin SET senha_hash = '${hash}' WHERE email = 'admin@bndmet.com';"`);
      
      // Testar com o hash atual do banco
      console.log('\n🔍 Testando hash atual do banco...');
      const hashAtual = '$2a$10$CAtEn9lHrT7QXIugTyabrOX0ANtCuzMq8gZymRnnbXQM';
      const validoAtual = await bcrypt.compare(senha, hashAtual);
      console.log('Hash atual válido:', validoAtual ? '✅' : '❌');
      
      break;
    }
  }
  
  // Teste adicional: diferentes variantes do bcrypt
  console.log('\n🧪 Teste adicional: diferentes prefixos...');
  const hashesParaTestar = [
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  ];
  
  for (let i = 0; i < hashesParaTestar.length; i++) {
    const hash = hashesParaTestar[i];
    const isValid = await bcrypt.compare(senha, hash);
    console.log(`Hash conhecido ${i + 1} (${hash.substring(0, 7)}...): ${isValid ? '✅' : '❌'}`);
    
    if (isValid) {
      console.log(`\n🎯 Use este hash:`);
      console.log(`docker exec -it bndmet-postgres psql -U admin -d bndmet -c "`);
      console.log(`UPDATE usuarios_admin SET senha_hash = '${hash}' WHERE email = 'admin@bndmet.com';"`);
    }
  }
}

gerarHashCorreto().catch(console.error);