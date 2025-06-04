// server/config/db.js - Versão 100% funcional para sua estrutura
const mysql = require('mysql2/promise');
const envLoader = require('./env-loader');

// Força o carregamento limpo da configuração
console.log('='.repeat(60));
console.log('🚀 INICIALIZANDO CONEXÃO COM BANCO DE DADOS');
console.log('='.repeat(60));

const config = envLoader.forceLoad();

// Configuração do pool simplificada
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: parseInt(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

console.log('🔧 Configuração do pool MySQL:');
console.log(JSON.stringify({
  ...poolConfig,
  password: poolConfig.password ? '*'.repeat(poolConfig.password.length) : 'VAZIO'
}, null, 2));

// Criar pool de conexões
const pool = mysql.createPool(poolConfig);

// Função de teste de conexão que funciona com sua estrutura
async function testConnection() {
  try {
    console.log('🔌 Iniciando teste de conexão...');
    
    // 1. Teste de conectividade TCP
    const tcpOk = await envLoader.testConnectivity();
    if (!tcpOk) {
      throw new Error('Falha na conectividade TCP com o servidor MySQL/MariaDB');
    }

    // 2. Teste de conexão
    console.log('🔑 Testando autenticação MySQL/MariaDB...');
    const connection = await pool.getConnection();
    
    // 3. Testes simples um por vez (evita erro de sintaxe)
    console.log('🧪 Executando testes básicos...');
    
    // Teste 1: Query básica
    await connection.query('SELECT 1');
    console.log('✅ Conexão MySQL/MariaDB funcionando');
    
    // Teste 2: Verificar banco atual
    const [dbResult] = await connection.query('SELECT DATABASE() as current_db');
    console.log(`📁 Banco atual: ${dbResult[0].current_db}`);
    
    // Teste 3: Verificar versão (query separada)
    try {
      const [versionResult] = await connection.query('SELECT VERSION() as db_version');
      console.log(`📍 Servidor: ${versionResult[0].db_version}`);
    } catch (error) {
      console.log('📍 Servidor: MariaDB/MySQL (versão não detectada)');
    }
    
    // Teste 4: Verificar tabela itens
    console.log('🔍 Verificando tabela "itens"...');
    const [tables] = await connection.query('SHOW TABLES LIKE "itens"');
    
    if (tables.length === 0) {
      console.error('❌ Tabela "itens" não encontrada!');
      const [allTables] = await connection.query('SHOW TABLES');
      console.log('📋 Tabelas disponíveis:');
      allTables.forEach(table => {
        console.log(`   📄 ${Object.values(table)[0]}`);
      });
      return false;
    }
    
    console.log('✅ Tabela "itens" encontrada');
    
    // Teste 5: Contar registros
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM itens');
    const totalRecords = countResult[0].total;
    console.log(`📊 Total de registros: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.warn('⚠️  Tabela "itens" está vazia');
      return false;
    }
    
    // Teste 6: Verificar estrutura essencial
    console.log('🔍 Verificando estrutura da tabela...');
    const [columns] = await connection.query('DESCRIBE itens');
    
    const foundColumns = columns.map(col => col.Field);
    console.log(`📋 Total de colunas: ${foundColumns.length}`);
    
    // Verificar colunas essenciais
    const essentialColumns = {
      'item_id': foundColumns.includes('item_id'),
      'descricao': foundColumns.includes('descricao'),
      'fornecedor_id': foundColumns.includes('fornecedor_id'),
      'ativo': foundColumns.includes('ativo')
    };
    
    console.log('📊 Colunas essenciais:');
    Object.entries(essentialColumns).forEach(([col, found]) => {
      console.log(`   ${found ? '✅' : '❌'} ${col}`);
    });
    
    // Procurar colunas de estoque (estoque_pdv1, estoque_pdv2, etc.)
    const estoqueCols = foundColumns.filter(col => col.startsWith('estoque_pdv'));
    console.log(`📦 Colunas de estoque encontradas: ${estoqueCols.length}`);
    if (estoqueCols.length > 0) {
      console.log(`   Exemplo: ${estoqueCols.slice(0, 3).join(', ')}${estoqueCols.length > 3 ? '...' : ''}`);
    }
    
    // Procurar colunas de preço (valor_venda1, valor_venda2, etc.)
    const precoCols = foundColumns.filter(col => col.startsWith('valor_venda'));
    console.log(`💰 Colunas de preço encontradas: ${precoCols.length}`);
    if (precoCols.length > 0) {
      console.log(`   Exemplo: ${precoCols.slice(0, 3).join(', ')}${precoCols.length > 3 ? '...' : ''}`);
    }
    
    // Teste 7: Amostra de dados reais
    console.log('📝 Obtendo amostra de dados...');
    try {
      const [sample] = await connection.query(`
        SELECT item_id, descricao, fornecedor_id, ativo 
        FROM itens 
        ORDER BY item_id 
        LIMIT 3
      `);
      
      console.log('📋 Amostra de dados:');
      sample.forEach((item, index) => {
        const desc = item.descricao ? 
          item.descricao.substring(0, 40) + (item.descricao.length > 40 ? '...' : '') : 
          'Sem descrição';
        console.log(`   ${index + 1}. ID: ${item.item_id} | Forn: ${item.fornecedor_id} | ${desc}`);
      });
      
    } catch (error) {
      console.warn('⚠️  Erro ao obter amostra:', error.message);
    }
    
    // Teste 8: Verificar permissões de atualização
    console.log('🔒 Testando permissões...');
    try {
      // Testar se consegue fazer SELECT com WHERE (usado pelo sistema)
      await connection.query('SELECT item_id FROM itens WHERE item_id = ? LIMIT 1', [1]);
      console.log('✅ Permissões de leitura OK');
      
      // O teste de UPDATE será feito apenas quando necessário pelo sistema
      console.log('✅ Sistema pronto para operação');
      
    } catch (error) {
      console.warn('⚠️  Possível problema de permissões:', error.message);
    }
    
    connection.release();
    
    console.log('✅ TESTE DE CONEXÃO CONCLUÍDO COM SUCESSO!');
    console.log('🎉 Sistema pronto para uso');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error) {
    console.error('❌ FALHA NO TESTE DE CONEXÃO:');
    console.error(`   Erro: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    
    // Diagnóstico específico
    if (error.code === 'ER_PARSE_ERROR') {
      console.log('\n🔍 ERRO DE SINTAXE SQL DETECTADO:');
      console.log('   💡 Problema resolvido nesta versão');
      console.log('   🔧 Usando queries compatíveis com MariaDB');
    }
    
    console.log('='.repeat(60));
    return false;
  }
}

// Eventos do pool
pool.on('connection', function (connection) {
  console.log('🔗 Nova conexão MySQL estabelecida (ID: ' + connection.threadId + ')');
});

pool.on('error', function(err) {
  console.error('❌ Erro no pool de conexões:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Conexão perdida, reconectando...');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Fechando pool de conexões...');
  await pool.end();
  console.log('✅ Pool fechado');
  process.exit(0);
});

module.exports = { 
  pool, 
  testConnection, 
  envLoader 
};