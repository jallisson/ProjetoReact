// server/startup.js
// Script para garantir inicialização correta

const path = require('path');
const fs = require('fs');

console.log('🚀 SCRIPT DE INICIALIZAÇÃO');
console.log('==========================');

// 1. Verificar estrutura de arquivos
console.log('📁 Verificando estrutura de arquivos...');

const requiredFiles = [
  { path: path.join(__dirname, '.env'), desc: 'Arquivo de configuração' },
  { path: path.join(__dirname, 'config', 'env-loader.js'), desc: 'Carregador de ambiente' },
  { path: path.join(__dirname, 'config', 'db.js'), desc: 'Configuração de banco' },
  { path: path.join(__dirname, 'server.js'), desc: 'Servidor principal' }
];

let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`✅ ${file.desc}: ${file.path}`);
  } else {
    console.log(`❌ ${file.desc}: ${file.path} (AUSENTE)`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('\n❌ ARQUIVOS AUSENTES:');
  missingFiles.forEach(file => {
    console.error(`   - ${file.desc}: ${file.path}`);
  });
  process.exit(1);
}

// 2. Verificar e carregar configuração
console.log('\n🔧 Carregando configuração...');

try {
  const envLoader = require('./config/env-loader');
  const config = envLoader.getConfig();
  
  console.log('✅ Configuração carregada com sucesso');
  
  // Validar configuração crítica
  const critical = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = critical.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Configuração crítica ausente: ${missing.join(', ')}`);
  }
  
} catch (error) {
  console.error(`❌ Erro na configuração: ${error.message}`);
  process.exit(1);
}

// 3. Testar conexão com banco
console.log('\n🔌 Testando conexão com banco de dados...');

async function initializeDatabase() {
  try {
    const { testConnection } = require('./config/db');
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      throw new Error('Falha no teste de conexão');
    }
    
    console.log('✅ Banco de dados pronto');
    return true;
    
  } catch (error) {
    console.error(`❌ Erro no banco de dados: ${error.message}`);
    return false;
  }
}

// 4. Inicializar servidor
async function startServer() {
  try {
    console.log('\n🌐 Iniciando servidor...');
    
    // Importar e iniciar o servidor
    require('./server');
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao iniciar servidor: ${error.message}`);
    return false;
  }
}

// 5. Executar inicialização
async function main() {
  try {
    // Testar banco primeiro
    const dbOk = await initializeDatabase();
    
    if (!dbOk) {
      console.error('\n💥 FALHA CRÍTICA: Não foi possível conectar ao banco de dados');
      console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
      console.log('   1. Verifique se o MySQL está rodando');
      console.log('   2. Confirme as configurações no arquivo .env');
      console.log('   3. Teste a conectividade manualmente');
      console.log('   4. Execute: node diagnose-db.js');
      process.exit(1);
    }
    
    // Servidor será iniciado automaticamente pela importação
    console.log('\n✅ SISTEMA INICIALIZADO COM SUCESSO!');
    console.log('🌍 Acesse: http://localhost:' + (process.env.PORT || 5000));
    
  } catch (error) {
    console.error('\n💥 ERRO FATAL NA INICIALIZAÇÃO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { initializeDatabase, startServer };