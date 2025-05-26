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

// Middleware para validar tipos de dados e garantir valores não nulos para campos obrigatórios
const validateData = (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'POST') {
    // Campos numéricos que devem ser validados
    const numericFields = [
      'fornecedor_id', 'estoque_pdv1', 'estoque_pdv2', 'estoque_pdv3', 
      'estoque_pdv4', 'estoque_pdv5', 'estoque_pdv6', 'estoque_pdv7', 
      'estoque_pdv8', 'estoque_pdv9', 'estoque_pdv10', 'estoque_pdv11',
      'estoque_pdv12', 'estoque_pdv13', 'estoque_pdv14', 'estoque_pdv15',
      'custo_venda', 'valor_venda1', 'valor_venda2', 'valor_venda3', 'valor_venda4'
    ];
    
    const invalidFields = [];

    // Garantir que o campo 'ativo' não seja nulo
    if (req.body.ativo === null || req.body.ativo === undefined) {
      req.body.ativo = 'A'; // Valor padrão se não for especificado
    }

    // Validar e converter campos numéricos
    numericFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (req.body[field] === null || req.body[field] === '') {
          // Converter valores vazios para 0
          req.body[field] = 0;
        } else if (isNaN(Number(req.body[field]))) {
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
    
    // Extrair valores do corpo da requisição com valores padrão para evitar NULL
    const { 
      descricao = '', 
      fornecedor_id = 0, 
      ativo = 'A',
      estoque_pdv1 = 0, 
      estoque_pdv2 = 0, 
      estoque_pdv3 = 0, 
      estoque_pdv4 = 0, 
      estoque_pdv5 = 0,
      estoque_pdv6 = 0, 
      estoque_pdv7 = 0, 
      estoque_pdv8 = 0, 
      estoque_pdv9 = 0, 
      estoque_pdv10 = 0,
      estoque_pdv11 = 0, 
      estoque_pdv12 = 0, 
      estoque_pdv13 = 0, 
      estoque_pdv14 = 0, 
      estoque_pdv15 = 0,
      custo_venda = 0, 
      valor_venda1 = 0, 
      valor_venda2 = 0, 
      valor_venda3 = 0, 
      valor_venda4 = 0
    } = req.body;

    // Verificar se estamos atualizando um campo específico ou múltiplos campos
    if (Object.keys(req.body).length === 1) {
      // Atualização de um único campo
      const fieldName = Object.keys(req.body)[0];
      const fieldValue = req.body[fieldName];

      // Construir query dinâmica para atualizar apenas o campo específico
      const [result] = await pool.query(
        `UPDATE itens SET ${fieldName} = ? WHERE item_id = ?`,
        [fieldValue, id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
    } else {
      // Atualização de múltiplos campos (usando um método mais seguro)
      // Primeiro obtemos o produto atual para manter campos não modificados
      const [currentProduct] = await pool.query(
        `SELECT * FROM itens WHERE item_id = ?`, 
        [id]
      );
      
      if (currentProduct.length === 0) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      // Mesclar dados atuais com novos dados (prioridade para novos dados)
      const mergedData = {
        ...currentProduct[0],
        ...req.body,
        // Garantir que campos obrigatórios nunca sejam NULL
        ativo: req.body.ativo || currentProduct[0].ativo || 'A'
      };

      // Agora atualizamos todos os campos com os valores mesclados
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
          mergedData.descricao,
          mergedData.fornecedor_id,
          mergedData.ativo,
          mergedData.estoque_pdv1, 
          mergedData.estoque_pdv2, 
          mergedData.estoque_pdv3,
          mergedData.estoque_pdv4,
          mergedData.estoque_pdv5,
          mergedData.estoque_pdv6,
          mergedData.estoque_pdv7,
          mergedData.estoque_pdv8,
          mergedData.estoque_pdv9,
          mergedData.estoque_pdv10,
          mergedData.estoque_pdv11,
          mergedData.estoque_pdv12,
          mergedData.estoque_pdv13,
          mergedData.estoque_pdv14,
          mergedData.estoque_pdv15,
          mergedData.custo_venda,
          mergedData.valor_venda1,
          mergedData.valor_venda2,
          mergedData.valor_venda3,
          mergedData.valor_venda4,
          id
        ]
      );
    }
    
    // Retornar o produto atualizado
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