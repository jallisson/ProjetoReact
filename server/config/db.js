const mysql = require('mysql2/promise');
require('dotenv').config();

// Criação do pool de conexões
const pool = mysql.createPool({
  //host: process.env.DB_HOST || 'localhost',
  host: process.env.DB_HOST || 'acqualimpma.com.br',
  //user: process.env.DB_USER || 'root',
  user: process.env.DB_USER || 'acqua917_walney',
  //password: process.env.DB_PASSWORD || '',
  password: process.env.DB_PASSWORD || 'Jjob@-2526',
  //database: process.env.DB_NAME || 'seu_banco_de_dados',
  database: process.env.DB_NAME || 'acqua917_walney',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para testar a conexão
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Vamos verificar se a tabela itens existe
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'itens'
    `);
    
    if (tables.length === 0) {
      console.warn('Atenção: A tabela "itens" não foi encontrada no banco de dados!');
    } else {
      console.log('Tabela "itens" encontrada no banco de dados.');
      
      // Verificar alguns campos para garantir que estamos usando a estrutura correta
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM itens 
        WHERE Field IN ('item_id', 'descricao', 'fornecedor_id', 'estoque_pdv1', 'valor_venda1')
      `);
      
      if (columns.length < 5) {
        console.warn('Atenção: A estrutura da tabela "itens" parece não conter todos os campos necessários!');
      } else {
        console.log('Estrutura da tabela "itens" verificada com sucesso.');
      }
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

module.exports = { pool, testConnection };