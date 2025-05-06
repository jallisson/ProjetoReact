const { pool, testConnection } = require('./config/db');

/**
 * Função para testar a conexão e obter informações sobre as tabelas
 */
async function testDB() {
  // Testar conexão geral
  const connected = await testConnection();
  if (!connected) {
    console.error("Falha na conexão com o banco de dados.");
    process.exit(1);
  }
  
  console.log("Conexão com o banco estabelecida com sucesso!");
  
  try {
    // Listar tabelas no banco
    const [tables] = await pool.query('SHOW TABLES');
    console.log("\nTabelas disponíveis no banco de dados:");
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    // Se já souber o nome da tabela, pode descomentar este código
    const tableName = 'produtos';
    
    // Verificar estrutura da tabela
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`\nEstrutura da tabela ${tableName}:`);
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });
    
    // Amostra de dados
    const [rows] = await pool.query(`SELECT * FROM ${tableName} LIMIT 3`);
    console.log(`\nAmostra de dados (3 primeiros registros):`);
    console.log(JSON.stringify(rows, null, 2));
    
  } catch (error) {
    console.error("Erro ao consultar informações do banco:", error);
  } finally {
    // Encerrar a conexão
    await pool.end();
  }
}

// Executar o teste
testDB();