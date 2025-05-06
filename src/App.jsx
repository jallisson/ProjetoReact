import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import ProdutoList from './components/ProdutoList'

function App() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="content">
        <h1>Gerenciamento de Produtos</h1>
        <SearchBar onSearch={handleSearch} />
        <ProdutoList searchTerm={searchTerm} />
      </main>
    </div>
  )
}

export default App