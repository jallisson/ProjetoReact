import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, onLimitChange }) => {
  // Gerar array de números de página para exibição
  const getPageNumbers = () => {
    const pageNumbers = [];
    // Mostrar no máximo 5 páginas (atual, 2 antes e 2 depois quando possível)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar startPage se estamos no final
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  const handleLimitChange = (e) => {
    onLimitChange(parseInt(e.target.value));
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-controls">
        <button 
          onClick={handleFirst} 
          disabled={currentPage === 1}
          className="pagination-button"
          title="Primeira página"
        >
          &laquo;
        </button>
        
        <button 
          onClick={handlePrevious} 
          disabled={currentPage === 1}
          className="pagination-button"
          title="Página anterior"
        >
          &lsaquo;
        </button>
        
        {getPageNumbers().map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`pagination-button ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}
        
        <button 
          onClick={handleNext} 
          disabled={currentPage === totalPages}
          className="pagination-button"
          title="Próxima página"
        >
          &rsaquo;
        </button>
        
        <button 
          onClick={handleLast} 
          disabled={currentPage === totalPages}
          className="pagination-button"
          title="Última página"
        >
          &raquo;
        </button>
      </div>
      
      <div className="pagination-info">
        <span>Página {currentPage} de {totalPages}</span>
        <div className="limit-selector">
          <label htmlFor="page-limit">Itens por página:</label>
          <select 
            id="page-limit" 
            onChange={handleLimitChange}
            className="limit-select"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Pagination;