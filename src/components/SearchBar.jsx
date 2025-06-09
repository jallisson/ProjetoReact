import React, { useState } from 'react';

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

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      onSearch({ term: '', filter: '', mode: '' });
      return;
    }
    
    const mode = getCurrentMode();
    
    console.log(`🔍 Pesquisando: "${searchTerm}" no campo "${filterBy}" com modo "${mode}"`);
    
    onSearch({
      term: searchTerm,
      filter: filterBy,
      mode: mode
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterBy('descricao');
    onSearch({ term: '', filter: '', mode: '' });
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