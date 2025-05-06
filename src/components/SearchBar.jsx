import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterBy('');
    onSearch('');
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
            <option value="">Todos</option>
            <option value="id">ID</option>
            <option value="descricao">Descrição</option>
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
            placeholder="Digite para pesquisar..."
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
        {/*
        <button className="button green-button">Gerar Excesso 1</button>
        <button className="button green-button">Gerar Excesso 2</button>
        <button className="button green-button">Gerar Excesso 3</button>
        <button className="button green-button">Gerar Excesso 4</button>
        <button className="button yellow-button">Apaga 1</button>
        <button className="button yellow-button">Apaga 2</button>
        <button className="button yellow-button">Apaga 3</button>
        <button className="button yellow-button">Apaga 4</button>
        */}
      </div>
    </div>
  );
};

export default SearchBar;