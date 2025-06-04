// server/test-connection.js
// Teste simples e direto da conexão com o banco

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBasicConnection() {
  console.log('🔧 TESTE BÁSICO DE CONEXÃO');
  console.log('='.repeat(40));
  
  console.log('📋 Configuração:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || 3306}`);
  console.log(`   User: ${process.env.DB_USER || 'root'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'gerenciamento_produtos'}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? 'Definida' : 'Vazia'}`);
  
  try {
    console.log('\n🔌 Criando conexão...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      port: parseInt(process.env.DB_PORT) || 3306,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gerenciamento_produtos'
    });
    
    console.log('✅ Conexão estabelecida!');
    
    // Teste 1: Query mais simples possível
    console.log('\n🧪 Teste 1: Query básica...');
    const [result1] = await connection.query('SELECT 1');
    console.log('✅ SELECT 1 executado com sucesso');
    
    // Teste 2: Verificar banco atual
    console.log('\n🧪 Teste 2: Verificar banco atual...');
    const [result2] = await connection.query('SELECT DATABASE()');
    console.log(`✅ Banco atual: ${Object.values(result2[0])[0]}`);
    
    // Teste 3: Listar tabelas
    console.log('\n🧪 Teste 3: Listar tabelas...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Encontradas ${tables.length} tabelas:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   📄 ${tableName}`);
    });
    
    // Teste 4: Verificar especificamente a tabela itens
    console.log('\n🧪 Teste 4: Verificar tabela "itens"...');
    const [itensTable] = await connection.query('SHOW TABLES LIKE "itens"');
    
    if (itensTable.length > 0) {
      console.log('✅ Tabela "itens" encontrada!');
      
      // Contar registros
      const [count] = await connection.query('SELECT COUNT(*) as total FROM itens');
      console.log(`📊 Registros na tabela: ${count[0].total}`);
      
      if (count[0].total > 0) {
        // Mostrar estrutura básica
        const [columns] = await connection.query('SHOW COLUMNS FROM itens');
        console.log(`📋 Colunas (${columns.length} total):`);
        columns.slice(0, 5).forEach(col => {
          console.log(`   📊 ${col.Field} (${col.Type})`);
        });
        if (columns.length > 5) {
          console.log(`   ... e mais ${columns.length - 5} colunas`);
        }
      }
    } else {
      console.log('⚠️  Tabela "itens" não encontrada');
    }
    
    await connection.end();
    
    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    console.log('🎉 O banco de dados está funcionando corretamente');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    
    console.log('\n💡 SOLUÇÕES SUGERIDAS:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   🔧 MySQL/MariaDB não está rodando');
      console.log('   🔧 Execute: sudo systemctl start mysql');
      console.log('   🔧 Ou: sudo systemctl start mariadb');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   🔧 Credenciais incorretas');
      console.log('   🔧 Teste manual: mysql -u root -p');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   🔧 Banco não existe');
      console.log('   🔧 Crie o banco: CREATE DATABASE gerenciamento_produtos;');
    }
    
    return false;
  }
}

// Executar teste
testBasicConnection()
  .then(success => {
    if (success) {
      console.log('\n🚀 PRONTO PARA USAR O SISTEMA!');
    } else {
      console.log('\n🛑 CORRIJA OS PROBLEMAS ANTES DE USAR O SISTEMA');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });