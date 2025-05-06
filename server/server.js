const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/db');
require('dotenv').config();

const app = express();
// Definindo explicitamente a porta 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Teste de conexão na inicialização
testConnection()
  .then(connected => {
    if (!connected) {
      console.error('Não foi possível conectar ao banco de dados. Verifique suas configurações.');
      process.exit(1);
    }
  });

// Middleware para validar tipos de dados
const validateData = (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'POST') {
    const numericFields = [
      'fornecedor_id', 'estoque_pdv1', 'estoque_pdv2', 'estoque_pdv3', 
      'estoque_pdv4', 'estoque_pdv5', 'estoque_pdv6', 'estoque_pdv7', 
      'estoque_pdv8', 'estoque_pdv9', 'estoque_pdv10', 'estoque_pdv11',
      'estoque_pdv12', 'estoque_pdv13', 'estoque_pdv14', 'estoque_pdv15',
      'custo_venda', 'valor_venda1', 'valor_venda2', 'valor_venda3', 'valor_venda4'
    ];
    
    const invalidFields = [];

    // Validar campos numéricos
    numericFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        if (isNaN(Number(req.body[field]))) {
          invalidFields.push(field);
        } else {
          // Converter para número
          req.body[field] = Number(req.body[field]);
        }
      }
    });

    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: `Campos numéricos inválidos: ${invalidFields.join(', ')}. Apenas números são permitidos.`
      });
    }
  }
  next();
};

// Aplicar middleware de validação
app.use('/api/produtos/:id', validateData);
app.use('/api/produtos', validateData);

// Rota básica de produtos com paginação
app.get('/api/produtos', async (req, res) => {
  try {
    // Parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sortDirection = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    // Consulta paginada
    const [rows] = await pool.query(`
      SELECT 
        item_id, descricao, fornecedor_id, ativo,
        estoque_pdv1, estoque_pdv2, estoque_pdv3, estoque_pdv4, estoque_pdv5,
        estoque_pdv6, estoque_pdv7, estoque_pdv8, estoque_pdv9, estoque_pdv10,
        estoque_pdv11, estoque_pdv12, estoque_pdv13, estoque_pdv14, estoque_pdv15,
        custo_venda, valor_venda1, valor_venda2, valor_venda3, valor_venda4
      FROM itens 
      ORDER BY item_id ${sortDirection}
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Contar total de registros para meta-informações de paginação
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM itens');
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      items: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
});

// Rota de pesquisa com paginação
app.get('/api/produtos/search', async (req, res) => {
  try {
    const termo = req.query.termo || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sortDirection = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    const [rows] = await pool.query(
      `SELECT 
        item_id, descricao, fornecedor_id, ativo,
        estoque_pdv1, estoque_pdv2, estoque_pdv3, estoque_pdv4, estoque_pdv5,
        estoque_pdv6, estoque_pdv7, estoque_pdv8, estoque_pdv9, estoque_pdv10,
        estoque_pdv11, estoque_pdv12, estoque_pdv13, estoque_pdv14, estoque_pdv15,
        custo_venda, valor_venda1, valor_venda2, valor_venda3, valor_venda4
      FROM itens 
      WHERE descricao LIKE ? OR item_id LIKE ?
      ORDER BY item_id ${sortDirection}
      LIMIT ? OFFSET ?`,
      [`%${termo}%`, `%${termo}%`, limit, offset]
    );

    // Contar total de registros para meta-informações de paginação
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM itens WHERE descricao LIKE ? OR item_id LIKE ?', 
      [`%${termo}%`, `%${termo}%`]
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      items: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao pesquisar produtos:', error);
    res.status(500).json({ message: 'Erro ao pesquisar produtos' });
  }
});

// Rota para atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      descricao, fornecedor_id, ativo,
      estoque_pdv1, estoque_pdv2, estoque_pdv3, estoque_pdv4, estoque_pdv5,
      estoque_pdv6, estoque_pdv7, estoque_pdv8, estoque_pdv9, estoque_pdv10,
      estoque_pdv11, estoque_pdv12, estoque_pdv13, estoque_pdv14, estoque_pdv15,
      custo_venda, valor_venda1, valor_venda2, valor_venda3, valor_venda4
    } = req.body;
    
    const [result] = await pool.query(
      `UPDATE itens 
       SET descricao = ?, 
           fornecedor_id = ?, 
           ativo = ?, 
           estoque_pdv1 = ?, 
           estoque_pdv2 = ?, 
           estoque_pdv3 = ?,
           estoque_pdv4 = ?,
           estoque_pdv5 = ?,
           estoque_pdv6 = ?,
           estoque_pdv7 = ?,
           estoque_pdv8 = ?,
           estoque_pdv9 = ?,
           estoque_pdv10 = ?,
           estoque_pdv11 = ?,
           estoque_pdv12 = ?,
           estoque_pdv13 = ?,
           estoque_pdv14 = ?,
           estoque_pdv15 = ?,
           custo_venda = ?,
           valor_venda1 = ?,
           valor_venda2 = ?,
           valor_venda3 = ?,
           valor_venda4 = ?
       WHERE item_id = ?`,
      [
        descricao, fornecedor_id, ativo,
        estoque_pdv1, estoque_pdv2, estoque_pdv3, estoque_pdv4, estoque_pdv5,
        estoque_pdv6, estoque_pdv7, estoque_pdv8, estoque_pdv9, estoque_pdv10,
        estoque_pdv11, estoque_pdv12, estoque_pdv13, estoque_pdv14, estoque_pdv15,
        custo_venda, valor_venda1, valor_venda2, valor_venda3, valor_venda4,
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    const [updatedProduct] = await pool.query(`
      SELECT 
        item_id, descricao, fornecedor_id, ativo,
        estoque_pdv1, estoque_pdv2, estoque_pdv3, estoque_pdv4, estoque_pdv5,
        estoque_pdv6, estoque_pdv7, estoque_pdv8, estoque_pdv9, estoque_pdv10,
        estoque_pdv11, estoque_pdv12, estoque_pdv13, estoque_pdv14, estoque_pdv15,
        custo_venda, valor_venda1, valor_venda2, valor_venda3, valor_venda4
      FROM itens 
      WHERE item_id = ?
    `, [id]);
    
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: `Erro ao atualizar produto: ${error.message}` });
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('API de Gerenciamento de Produtos está funcionando!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});