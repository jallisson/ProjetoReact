const Produto = require('../models/produto');

/**
 * Busca todos os produtos
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.getAllProdutos = async (req, res) => {
  try {
    const produtos = await Produto.findAll();
    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

/**
 * Busca um produto pelo ID
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.getProdutoById = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.status(200).json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
};

/**
 * Busca produtos por termo de pesquisa
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.searchProdutos = async (req, res) => {
  try {
    const termo = req.query.termo || '';
    const produtos = await Produto.search(termo);
    res.status(200).json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos' });
  }
};

/**
 * Atualiza um produto
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.updateProduto = async (req, res) => {
  try {
    const result = await Produto.update(req.params.id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    const updatedProduto = await Produto.findById(req.params.id);
    res.status(200).json(updatedProduto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
};

/**
 * Cria um novo produto
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.createProduto = async (req, res) => {
  try {
    const result = await Produto.create(req.body);
    const newProduto = await Produto.findById(result.insertId);
    res.status(201).json(newProduto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
};

/**
 * Exclui um produto
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
exports.deleteProduto = async (req, res) => {
  try {
    const result = await Produto.delete(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.status(200).json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro ao excluir produto' });
  }
};