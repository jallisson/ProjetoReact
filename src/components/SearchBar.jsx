import React, { useState, useEffect, useCallback } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('descricao');

  // Opções de filtro com comportamentos FIXOS
  const filterOptions = [
    { value: 'codigo', label: 'Código', mode: 'equal', description: '(busca exata)' },
    { value: 'descricao', label: 'Descrição', mode: 'contains', description: '(contém)' },
    { value: 'fornecedor', label: 'Fornecedor', mode: 'equal', description: '(busca exata)' },
    { value: 'moto', label: 'Moto', mode: 'contains', description: '(contém)' }
  ];

  // Função para gerar placeholder baseado no filtro selecionado
  const getPlaceholder = () => {
    switch (filterBy) {
      case 'codigo':
        return 'Digite o código exato...';
      case 'descricao':
        return 'Digite parte da descrição (ex: PN)...';
      case 'fornecedor':
        return 'Digite o ID do fornecedor...';
      case 'moto':
        return 'Digite parte do nome...';
      default:
        return 'Digite para pesquisar...';
    }
  };

  // Obter o modo automático baseado no filtro
  const getCurrentMode = () => {
    const selectedFilter = filterOptions.find(option => option.value === filterBy);
    return selectedFilter ? selectedFilter.mode : 'contains';
  };

  // Função de pesquisa para uso direto nos handlers
  const executeSearch = (term, filter) => {
    const selectedFilter = filterOptions.find(option => option.value === filter);
    const mode = selectedFilter ? selectedFilter.mode : 'contains';
    
    onSearch({
      term: term,
      filter: filter,
      mode: mode
    });
  };

  // Effect para pesquisa automática quando o termo muda
  useEffect(() => {
    // Debounce de 500ms para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      const selectedFilter = filterOptions.find(option => option.value === filterBy);
      const mode = selectedFilter ? selectedFilter.mode : 'contains';
      
      console.log(`🔍 Pesquisa automática: "${searchTerm}" no campo "${filterBy}" com modo "${mode}"`);
      
      onSearch({
        term: searchTerm,
        filter: filterBy,
        mode: mode
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterBy]); // Removido performSearch das dependências para evitar loop

  const handleSearch = (e) => {
    e.preventDefault();
    // Executa pesquisa imediata quando clica no botão
    executeSearch(searchTerm, filterBy);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Previne o submit do form
      // Executa pesquisa imediata no Enter
      executeSearch(searchTerm, filterBy);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterBy('descricao');
    // onSearch será chamado automaticamente pelo useEffect quando searchTerm mudar
  };

  const handleTermChange = (e) => {
    setSearchTerm(e.target.value);
    // A pesquisa será executada automaticamente pelo useEffect
  };

  const handleFilterChange = (e) => {
    setFilterBy(e.target.value);
    // A pesquisa será executada automaticamente pelo useEffect
  };

  // Obter descrição do comportamento atual
  const getCurrentDescription = () => {
    const selectedFilter = filterOptions.find(option => option.value === filterBy);
    return selectedFilter ? selectedFilter.description : '';
  };

  return (
    <div className="search-container">
      <div className="filter-row">
        <div className="filter-column">
          <label htmlFor="filter-type">
            Filtrar por {getCurrentDescription()}
          </label>
          <select 
            id="filter-type"
            className="input-field"
            value={filterBy}
            onChange={handleFilterChange}
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-column">
          <label htmlFor="search-term">Pesquisar item (automático)</label>
          <input
            id="search-term"
            type="text"
            className="input-field"
            value={searchTerm}
            onChange={handleTermChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
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