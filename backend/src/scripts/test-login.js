const bcrypt = require('bcryptjs');
const axios = require('axios');

async function testLogin() {
  const senha = 'admin123';
  const email = 'admin@bndmet.com';
  
  console.log('🧪 Testando login completo...');
  
  // Teste 1: Gerar hash e comparar
  const hash = await bcrypt.hash(senha, 10);
  const isValid = await bcrypt.compare(senha, hash);
  console.log('Hash gerado:', hash);
  console.log('Hash válido:', isValid ? '✅' : '❌');
  
  // Teste 2: Chamar a API
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      senha
    });
    
    console.log('✅ Login API sucesso!');
    console.log('Token:', response.data.data.token.substring(0, 50) + '...');
    console.log('Usuário:', response.data.data.usuario.nome);
  } catch (error) {
    console.log('❌ Login API falhou:', error.response?.data?.error || error.message);
  }
}

testLogin();