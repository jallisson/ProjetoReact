const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Log do ambiente
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🚂 Railway:', process.env.RAILWAY_ENVIRONMENT ? 'SIM' : 'NÃO');
console.log('🚀 Porta:', PORT);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ===============================================
// SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND (RAILWAY)
// ===============================================

// Em produção ou Railway, servir o frontend buildado
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  const frontendPath = path.join(__dirname, '..', 'dist');
  console.log('📁 Servindo frontend estático de:', frontendPath);

  // Verificar se a pasta dist existe
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    console.log('✅ Pasta dist encontrada');

    // Servir arquivos estáticos
    app.use(express.static(frontendPath, {
      index: ['index.html'],
      fallthrough: true
    }));

    console.log('✅ Middleware de arquivos estáticos configurado');
  } else {
    console.log('❌ Pasta dist não encontrada em:', frontendPath);
  }
}

// Teste de conexão na inicialização
testConnection()
  .then(connected => {
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados. Verifique suas configurações.');
      // Em produção, não sair do processo - continuar sem DB para debug
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
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

// ===============================================
// ROTAS DA API
// ===============================================

// Rota básica de produtos com paginação
app.get('/api/produtos', async (req, res) => {
  try {
    console.log('📡 GET /api/produtos');
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

    console.log(`✅ Retornando ${rows.length} produtos`);

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
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
});

// CORREÇÃO DA PAGINAÇÃO - server/server.js
// Substitua a rota GET /api/produtos/search por esta versão corrigida:

app.get('/api/produtos/search', async (req, res) => {
  try {
    console.log('🔍 GET /api/produtos/search');
    const termo = req.query.termo || '';
    const campo = req.query.campo || 'descricao';
    const modo = req.query.modo || 'contém';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sortDirection = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    let whereClause = '';
    let queryParams = [];

    if (campo === 'descricao') {
      if (modo === 'maior_igual') {
        whereClause = 'WHERE descricao >= ?';
        queryParams.push(termo.toUpperCase());
      } else if (modo === 'contém' || modo === 'contains') {
        whereClause = 'WHERE descricao LIKE ?';
        queryParams.push(`%${termo.toUpperCase()}%`);
        console.log(`🔎 Busca contém: "${termo}" -> Query: descricao LIKE '%${termo.toUpperCase()}%'`);
      } else if (modo === 'começa_com' || modo === 'startsWith') {
        whereClause = 'WHERE descricao LIKE ?';
        queryParams.push(`${termo.toUpperCase()}%`);
      } else if (modo === 'exato' || modo === 'equal') {
        whereClause = 'WHERE descricao = ?';
        queryParams.push(termo.toUpperCase());
      } else {
        whereClause = 'WHERE descricao LIKE ?';
        queryParams.push(`%${termo.toUpperCase()}%`);
      }
    } else if (campo === 'id' && (modo === 'exato' || modo === 'equal')) {
      whereClause = 'WHERE item_id = ?';
      queryParams.push(termo);
    } else if (campo === 'fornecedor_id' && (modo === 'exato' || modo === 'equal')) {
      whereClause = 'WHERE fornecedor_id = ?';
      queryParams.push(parseInt(termo) || 0);
    } else {
      whereClause = 'WHERE descricao LIKE ? OR item_id LIKE ?';
      queryParams.push(`%${termo.toUpperCase()}%`, `%${termo}%`);
    }

    // 🔧 CORREÇÃO 1: Buscar total ANTES da query principal
    const countQuery = `SELECT COUNT(*) as total FROM itens ${whereClause}`;
    console.log('🔢 Query de contagem:', countQuery);
    console.log('📋 Parâmetros de contagem:', queryParams);

    const [countResult] = await pool.query(countQuery, queryParams);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    console.log(`📊 Total encontrado: ${totalItems} itens`);
    console.log(`📄 Total de páginas calculado: ${totalPages} (limit: ${limit})`);
    console.log(`📍 Página atual: ${page} de ${totalPages}`);

    // 🔧 CORREÇÃO 2: Verificar se a página solicitada existe
    if (page > totalPages && totalPages > 0) {
      console.log(`⚠️ Página ${page} não existe (máximo: ${totalPages})`);
      return res.json({
        items: [],
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages
        }
      });
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

    console.log('🗄️ Query SQL final:');
    console.log(mainQuery);
    console.log('📋 Parâmetros:', [...queryParams, limit, offset]);

    const [rows] = await pool.query(mainQuery, [...queryParams, limit, offset]);

    // 🔧 CORREÇÃO 3: Log detalhado para debug
    console.log(`✅ Página ${page}/${totalPages}: ${rows.length} produtos retornados`);
    console.log(`📈 Progress: ${Math.min(page * limit, totalItems)}/${totalItems} itens`);

    // 🔧 CORREÇÃO 4: Verificar se há mais páginas
    const hasNextPage = page < totalPages;
    console.log(`➡️ Há próxima página? ${hasNextPage ? 'SIM' : 'NÃO'}`);

    res.json({
      items: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage,
        remainingItems: Math.max(0, totalItems - (page * limit))
      }
    });

  } catch (error) {
    console.error('❌ Erro ao pesquisar produtos:', error);
    res.status(500).json({ message: 'Erro ao pesquisar produtos' });
  }
});

// 🔧 CORREÇÃO ADICIONAL: Também corrigir a rota de produtos gerais
app.get('/api/produtos', async (req, res) => {
  try {
    console.log('📡 GET /api/produtos');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sortDirection = req.query.sort === 'desc' ? 'DESC' : 'ASC';

    // Contar total primeiro
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM itens');
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    console.log(`📊 Total de itens: ${totalItems}, Páginas: ${totalPages}, Página atual: ${page}`);

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

    console.log(`✅ Página ${page}/${totalPages}: ${rows.length} produtos retornados`);

    res.json({
      items: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        remainingItems: Math.max(0, totalItems - (page * limit))
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
});


// Rota para atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    console.log(`✏️  PUT /api/produtos/${req.params.id}`);
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

    console.log(`✅ Produto ${id} atualizado`);
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ message: `Erro ao atualizar produto: ${error.message}` });
  }
});

// ===============================================
// HEALTH CHECK E ROTA DE TESTE
// ===============================================

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    port: PORT
  });
});

// Rota de teste da API
app.get('/api/test', (req, res) => {
  res.json({
    message: '🎉 API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT
  });
});

// ===============================================
// ROTA RAIZ - DIFERENTE PARA PRODUÇÃO E DEV
// ===============================================

app.get('/', (req, res) => {
  // Se for produção/Railway e tem frontend buildado, servir o index.html
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    const fs = require('fs');

    if (fs.existsSync(indexPath)) {
      console.log('📄 Servindo index.html da raiz');
      return res.sendFile(indexPath);
    } else {
      console.log('❌ index.html não encontrado, servindo JSON de fallback');
      return res.json({
        message: '🎉 API de Gerenciamento de Produtos funcionando!',
        error: 'Frontend não encontrado - verifique se o build foi feito',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        railway: !!process.env.RAILWAY_ENVIRONMENT
      });
    }
  }

  // Desenvolvimento - retornar JSON
  res.json({
    message: '🎉 API de Gerenciamento de Produtos funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: !!process.env.RAILWAY_ENVIRONMENT
  });
});

// ===============================================
// SPA FALLBACK (DEVE SER A ÚLTIMA ROTA)
// ===============================================

// Para todas as outras rotas que não são da API, servir o index.html (SPA)
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  app.get('*', (req, res) => {
    // Não interceptar rotas da API
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return res.status(404).json({ message: 'Rota da API não encontrada' });
    }

    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    const fs = require('fs');

    if (fs.existsSync(indexPath)) {
      console.log(`🔄 SPA Fallback: ${req.path} -> index.html`);
      res.sendFile(indexPath);
    } else {
      console.log(`❌ SPA Fallback falhou: index.html não encontrado para ${req.path}`);
      res.status(404).json({
        message: 'Página não encontrada',
        error: 'Frontend não foi buildado corretamente'
      });
    }
  });
}

// ===============================================
// INICIAR SERVIDOR
// ===============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 URL: http://0.0.0.0:${PORT}`);

  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚂 Deploy no Railway concluído com sucesso!');
    console.log('📱 Frontend e Backend integrados em uma única aplicação');
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('🎉 Ambiente de produção ativo');
  }
});