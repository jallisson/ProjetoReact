import axios from 'axios'

// Cria uma instância do axios com a URL base da API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'  // Quando configurado com proxy no vite.config.js
})

/**
 * Busca todos os produtos
 * @returns {Promise} Promise com os dados dos produtos
 */
export const getProdutos = async () => {
  try {
    const response = await api.get('/produtos')
    return response.data
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    throw error
  }
}

/**
 * Busca produtos por termo de pesquisa
 * @param {string} termo - Termo para pesquisa
 * @returns {Promise} Promise com os dados dos produtos encontrados
 */
export const searchProdutos = async (termo) => {
  try {
    const response = await api.get(`/produtos/search?termo=${termo}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    throw error
  }
}

/**
 * Atualiza um produto
 * @param {string|number} id - ID do produto
 * @param {Object} produtoData - Dados do produto
 * @returns {Promise} Promise com os dados do produto atualizado
 */
export const updateProduto = async (id, produtoData) => {
  try {
    const response = await api.put(`/produtos/${id}`, produtoData)
    return response.data
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    throw error
  }
}

/**
 * Cria um novo produto
 * @param {Object} produtoData - Dados do produto
 * @returns {Promise} Promise com os dados do produto criado
 */
export const createProduto = async (produtoData) => {
  try {
    const response = await api.post('/produtos', produtoData)
    return response.data
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    throw error
  }
}

/**
 * Exclui um produto
 * @param {string|number} id - ID do produto
 * @returns {Promise} Promise com os dados da resposta
 */
export const deleteProduto = async (id) => {
  try {
    const response = await api.delete(`/produtos/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    throw error
  }
}