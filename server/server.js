const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Teste de conexão na inicialização
testConnection()
  .then(connected => {
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados. Verifique suas configurações.');
      process.exit(1);
    }
    console.log('🎉 Sistema iniciado com sucesso!');
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

    if (req.body.ativo === null || req.body.ativo === undefined) {
      req.body.ativo = 'A';
    }

    numericFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (req.body[field] === null || req.body[field] === '') {
          req.body[field] = 0;
        } else if (isNaN(Number(req.body[field]))) {
          invalidFields.push(field);
        } else {
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

app.use('/api/produtos/:id', validateData);
app.use('/api/produtos', validateData);

// Rota básica de produtos com paginação
app.get('/api/produtos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sortDirection = req.query.sort === 'desc' ? 'DESC' : 'ASC';

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
    const campo = req.query.campo || 'descricao';
    const modo = req.query.modo || 'contém';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sortDirection = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    let whereClause = '';
    let queryParams = [];

    if (campo === 'descricao' && modo === 'maior_igual') {
      whereClause = 'WHERE descricao >= ?';
      queryParams.push(termo.toUpperCase());
    } else if (campo === 'descricao' && modo === 'contém') {
      whereClause = 'WHERE descricao LIKE ?';
      queryParams.push(`%${termo}%`);
    } else if (campo === 'id' && modo === 'exato') {
      whereClause = 'WHERE item_id = ?';
      queryParams.push(termo);
    } else if (campo === 'fornecedor_id' && modo === 'exato') {
      whereClause = 'WHERE fornecedor_id = ?';
      queryParams.push(parseInt(termo) || 0);
    } else {
      whereClause = 'WHERE descricao LIKE ? OR item_id LIKE ?';
      queryParams.push(`%${termo}%`, `%${termo}%`);
    }

    const mainQuery = `
      SELECT 
        item_id, descricao, fornecedor_id, ativo,
        estoque_pdv1, estoque_pdv2, estoque_pdv3, estoque_pdv4, estoque_pdv5,
        estoque_pdv6, estoque_pdv7, estoque_pdv8, estoque_pdv9, estoque_pdv10,
        estoque_pdv11, estoque_pdv12, estoque_pdv13, estoque_pdv14, estoque_pdv15,
        custo_venda, valor_venda1, valor_venda2, valor_venda3, valor_venda4
      FROM itens 
      ${whereClause}
      ORDER BY ${campo === 'descricao' ? 'descricao' : 'item_id'} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(mainQuery, [...queryParams, limit, offset]);

    const countQuery = `SELECT COUNT(*) as total FROM itens ${whereClause}`;
    const [countResult] = await pool.query(countQuery, queryParams);
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

    if (Object.keys(req.body).length === 1) {
      const fieldName = Object.keys(req.body)[0];
      const fieldValue = req.body[fieldName];

      const [result] = await pool.query(
        `UPDATE itens SET ${fieldName} = ? WHERE item_id = ?`,
        [fieldValue, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
    } else {
      const [currentProduct] = await pool.query(
        `SELECT * FROM itens WHERE item_id = ?`,
        [id]
      );

      if (currentProduct.length === 0) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      const mergedData = {
        ...currentProduct[0],
        ...req.body,
        ativo: req.body.ativo || currentProduct[0].ativo || 'A'
      };

      const [result] = await pool.query(
        `UPDATE itens 
         SET descricao = ?, 
             fornecedor_id = ?, 
             ativo = ?, 
             estoque_pdv1 = ?, estoque_pdv2 = ?, estoque_pdv3 = ?,
             estoque_pdv4 = ?, estoque_pdv5 = ?, estoque_pdv6 = ?,
             estoque_pdv7 = ?, estoque_pdv8 = ?, estoque_pdv9 = ?,
             estoque_pdv10 = ?, estoque_pdv11 = ?, estoque_pdv12 = ?,
             estoque_pdv13 = ?, estoque_pdv14 = ?, estoque_pdv15 = ?,
             custo_venda = ?, valor_venda1 = ?, valor_venda2 = ?,
             valor_venda3 = ?, valor_venda4 = ?
         WHERE item_id = ?`,
        [
          mergedData.descricao, mergedData.fornecedor_id, mergedData.ativo,
          mergedData.estoque_pdv1, mergedData.estoque_pdv2, mergedData.estoque_pdv3,
          mergedData.estoque_pdv4, mergedData.estoque_pdv5, mergedData.estoque_pdv6,
          mergedData.estoque_pdv7, mergedData.estoque_pdv8, mergedData.estoque_pdv9,
          mergedData.estoque_pdv10, mergedData.estoque_pdv11, mergedData.estoque_pdv12,
          mergedData.estoque_pdv13, mergedData.estoque_pdv14, mergedData.estoque_pdv15,
          mergedData.custo_venda, mergedData.valor_venda1, mergedData.valor_venda2,
          mergedData.valor_venda3, mergedData.valor_venda4, id
        ]
      );
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
  res.json({
    message: '🎉 API de Gerenciamento de Produtos funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    render: !!process.env.RENDER
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Acesse: http://localhost:${PORT}`);
  
  if (process.env.RENDER) {
    console.log('🎉 Deploy no Render concluído com sucesso!');
  }
});