import React, { useState, useEffect } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('descricao');
  const [searchMode, setSearchMode] = useState('contains'); // Valor padrão 'contém'

  // Opções de filtro com seus modos de pesquisa associados
  const filterOptions = [
    { value: 'codigo', label: 'Código', defaultMode: 'equal' },
    { value: 'descricao', label: 'Descrição', defaultMode: 'greaterOrEqual' },
    { value: 'fornecedor', label: 'Fornecedor', defaultMode: 'equal' },
    { value: 'moto', label: 'Moto', defaultMode: 'contains' }
  ];

  // Opções de modos de pesquisa
  const searchModes = [
    { value: 'equal', label: 'Igual a' },
    { value: 'contains', label: 'Contém' },
    { value: 'greaterOrEqual', label: 'Maior ou igual' },
    { value: 'startsWith', label: 'Começa com' }
  ];

  // Atualiza o modo de pesquisa quando o filtro é alterado
  useEffect(() => {
    // Encontrar o filtro selecionado
    const selectedFilter = filterOptions.find(option => option.value === filterBy);
    if (selectedFilter) {
      // Definir o modo de pesquisa padrão para este filtro
      setSearchMode(selectedFilter.defaultMode);
    }
  }, [filterBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      // Se o termo de pesquisa estiver vazio, limpa a pesquisa
      onSearch({ term: '', filter: '', mode: '' });
      return;
    }
    
    // Enviar pesquisa com filtro e modo
    onSearch({
      term: searchTerm,
      filter: filterBy,
      mode: searchMode
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    // Reset para valores padrão
    setFilterBy('descricao');
    setSearchMode('greaterOrEqual');
    onSearch({ term: '', filter: '', mode: '' });
  };

  return (
    <div className="search-container">
      <div className="filter-row">
        <div className="filter-column">
          <label htmlFor="filter-type">Filtrar por</label>
          <select 
            id="filter-type"
            className="input-field"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-column">
          <label htmlFor="search-term">Pesquisar item</label>
          <input
            id="search-term"
            type="text"
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Digite para pesquisar... (${searchModes.find(m => m.value === searchMode)?.label || 'Contém'})`}
          />
        </div>
      </div>
      
      <div className="buttons-row">
        <button className="button green-button" onClick={handleSearch}>
          Pesquisar
        </button>
        <button className="button green-button" onClick={handleClear}>
          Limpar
        </button>
      </div>
    </div>
  );
};

export default SearchBar;