import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import ProdutoList from './components/ProdutoList'

function App() {
  const [searchParams, setSearchParams] = useState({
    term: '',
    filter: '',
    mode: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSearch = (params) => {
    setLoading(true);
    setSearchParams(params);
    // Simular um pequeno atraso para mostrar o loading
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="content">
        <h1>Gerenciamento de Produtos</h1>
        <SearchBar onSearch={handleSearch} />
        {loading ? (
          <div className="loading">Buscando produtos...</div>
        ) : (
          <ProdutoList searchParams={searchParams} />
        )}
      </main>
      {/* Note que a barra de status agora é renderizada dentro do componente ProdutoList */}
    </div>
  );
}

export default App