const { pool } = require('../config/db');

class Produto {
  /**
   * Busca todos os produtos
   * @returns {Promise<Array>} Lista de produtos
   */
  static async findAll() {
    // Substitua 'produtos' pelo nome real da sua tabela e os campos pelos reais
    const [rows] = await pool.query(`
      SELECT * FROM produtos
      ORDER BY id DESC
    `);
    return rows;
  }

  /**
   * Busca um produto pelo ID
   * @param {string|number} id - ID do produto
   * @returns {Promise<Object>} Dados do produto
   */
  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT * FROM produtos
      WHERE id = ?
    `, [id]);
    return rows[0];
  }

  /**
   * Busca produtos por termo de pesquisa
   * @param {string} termo - Termo para pesquisa
   * @returns {Promise<Array>} Lista de produtos encontrados
   */
  static async search(termo) {
    // Adapte os campos para corresponder à sua tabela
    const [rows] = await pool.query(`
      SELECT * FROM produtos
      WHERE descricao LIKE ? OR id LIKE ?
    `, [`%${termo}%`, `%${termo}%`]);
    return rows;
  }

  /**
   * Atualiza um produto
   * @param {string|number} id - ID do produto
   * @param {Object} produto - Dados do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  static async update(id, produto) {
    // Adapte os campos para corresponder à sua tabela
    // Este é apenas um exemplo - você precisa adaptar para seus campos reais
    const { 
      descricao, 
      forn, 
      gara, 
      jat, 
      ane, 
      mai, 
      coa, 
      asai, 
      bic, 
      ana, 
      tim, 
      cas 
    } = produto;
    
    const [result] = await pool.query(`
      UPDATE produtos 
      SET descricao = ?, 
          forn = ?, 
          gara = ?, 
          jat = ?, 
          ane = ?, 
          mai = ?, 
          coa = ?,
          asai = ?,
          bic = ?,
          ana = ?,
          tim = ?,
          cas = ?
      WHERE id = ?
    `, [descricao, forn, gara, jat, ane, mai, coa, asai, bic, ana, tim, cas, id]);
    
    return result;
  }

  /**
   * Cria um novo produto
   * @param {Object} produto - Dados do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  static async create(produto) {
    // Adapte os campos para corresponder à sua tabela
    const { 
      descricao, 
      forn, 
      gara, 
      jat, 
      ane, 
      mai, 
      coa, 
      asai, 
      bic, 
      ana, 
      tim, 
      cas 
    } = produto;
    
    const [result] = await pool.query(`
      INSERT INTO produtos 
      (descricao, forn, gara, jat, ane, mai, coa, asai, bic, ana, tim, cas) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [descricao, forn, gara, jat, ane, mai, coa, asai, bic, ana, tim, cas]);
    
    return result;
  }

  /**
   * Exclui um produto
   * @param {string|number} id - ID do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM produtos WHERE id = ?', [id]);
    return result;
  }
}

module.exports = Produto;