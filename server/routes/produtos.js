const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Rota para obter todos os produtos
router.get('/', produtoController.getAllProdutos);

// Rota para pesquisar produtos
router.get('/search', produtoController.searchProdutos);

// Rota para obter um produto específico
router.get('/:id', produtoController.getProdutoById);

// Rota para atualizar um produto
router.put('/:id', produtoController.updateProduto);

// Rota para criar um novo produto
router.post('/', produtoController.createProduto);

// Rota para excluir um produto
router.delete('/:id', produtoController.deleteProduto);

module.exports = router;