import React, { useState, useEffect, useCallback } from 'react';
import EditableCell from './EditableCell';
import Pagination from './Pagination';
import axios from 'axios';

const ProdutoList = ({ searchTerm }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCell, setCurrentCell] = useState({ rowIndex: 0, colIndex: 1 });
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' ou 'desc'
  
  // Defina as colunas da tabela com base na nova estrutura
  const columns = [
    { id: 'item_id', header: 'Código', editable: false, type: 'text' },
    { id: 'descricao', header: 'Nome', editable: true, type: 'text' },
    { id: 'fornecedor_id', header: 'Fornecedor', editable: true, type: 'number' },
    { id: 'ativo', header: 'Situação', editable: true, type: 'text' },
    { id: 'estoque_pdv1', header: 'Loja1', editable: true, type: 'number' },
    { id: 'estoque_pdv2', header: 'Loja2', editable: true, type: 'number' },
    { id: 'estoque_pdv3', header: 'Loja3', editable: true, type: 'number' },
    { id: 'estoque_pdv4', header: 'Loja4', editable: true, type: 'number' },
    { id: 'estoque_pdv5', header: 'Loja5', editable: true, type: 'number' },
    { id: 'estoque_pdv6', header: 'Loja6', editable: true, type: 'number' },
    { id: 'estoque_pdv7', header: 'Loja7', editable: true, type: 'number' },
    { id: 'estoque_pdv8', header: 'Loja8', editable: true, type: 'number' },
    { id: 'estoque_pdv9', header: 'Loja9', editable: true, type: 'number' },
    { id: 'estoque_pdv10', header: 'Loja10', editable: true, type: 'number' },
    { id: 'estoque_pdv11', header: 'Loja11', editable: true, type: 'number' },
    { id: 'estoque_pdv12', header: 'Loja12', editable: true, type: 'number' },
    { id: 'estoque_pdv13', header: 'Loja13', editable: true, type: 'number' },
    { id: 'estoque_pdv14', header: 'Loja14', editable: true, type: 'number' },
    { id: 'estoque_pdv15', header: 'Loja15', editable: true, type: 'number' },
    { id: 'custo_venda', header: 'Custo Final', editable: true, type: 'number' },
    { id: 'valor_venda1', header: 'Venda1', editable: true, type: 'number' },
    { id: 'valor_venda2', header: 'Venda2', editable: true, type: 'number' },
    { id: 'valor_venda3', header: 'Venda3', editable: true, type: 'number' },
    { id: 'valor_venda4', header: 'Venda4', editable: true, type: 'number' }
  ];

  // Buscar dados do backend
  const fetchProdutos = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortDirection
      };
      
      if (searchTerm) {
        response = await axios.get(`/api/produtos/search`, {
          params: { ...params, termo: searchTerm }
        });
      } else {
        response = await axios.get('/api/produtos', { params });
      }
      
      // Formato da resposta mudou, agora temos items e pagination
      setProdutos(response.data.items);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos. Verifique a conexão com o servidor.');
      setProdutos([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, itemsPerPage, sortDirection]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Manipuladores de paginação
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Resetar a célula atual para a primeira célula editável da nova página
    setCurrentCell({ rowIndex: 0, colIndex: 1 });
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Voltar para a primeira página ao mudar o limite
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Função para focar na célula atual
  const focusCurrentCell = useCallback(() => {
    if (produtos.length === 0) return;
    
    const { rowIndex, colIndex } = currentCell;
    
    setTimeout(() => {
      const cellId = `cell-${rowIndex}-${colIndex}`;
      const cell = document.getElementById(cellId);
      
      if (cell) {
        cell.focus();
      }
    }, 50);
  }, [currentCell, produtos]);

  // Efeito para focar na célula atual quando ela mudar
  useEffect(() => {
    focusCurrentCell();
  }, [currentCell, produtos, focusCurrentCell]);

  // Função para navegar entre células
  const handleKeyNavigation = useCallback((direction, rowIndex, colIndex) => {
    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'down':
        newRowIndex = Math.min(produtos.length - 1, rowIndex + 1);
        break;
      case 'left':
        // Encontra o próximo índice à esquerda que seja editável
        newColIndex = colIndex - 1;
        // Continue procurando à esquerda se o campo não for editável
        while (newColIndex >= 0 && !columns[newColIndex].editable) {
          newColIndex--;
        }
        // Se não encontrar nenhum à esquerda, volte para a linha anterior, última coluna
        if (newColIndex < 0) {
          if (rowIndex > 0) {
            newRowIndex = rowIndex - 1;
            // Encontra a última coluna editável
            newColIndex = columns.length - 1;
            while (newColIndex >= 0 && !columns[newColIndex].editable) {
              newColIndex--;
            }
          } else {
            // Se já estiver na primeira linha, mantém na primeira célula editável
            newColIndex = 1; // Assumindo que a coluna 1 é a primeira editável
          }
        }
        break;
      case 'right':
        // Encontra o próximo índice à direita que seja editável
        newColIndex = colIndex + 1;
        // Continue procurando à direita se o campo não for editável
        while (newColIndex < columns.length && !columns[newColIndex].editable) {
          newColIndex++;
        }
        // Se não encontrar nenhum à direita, vá para a próxima linha, primeira coluna
        if (newColIndex >= columns.length) {
          if (rowIndex < produtos.length - 1) {
            newRowIndex = rowIndex + 1;
            // Encontra a primeira coluna editável
            newColIndex = 0;
            while (newColIndex < columns.length && !columns[newColIndex].editable) {
              newColIndex++;
            }
          } else {
            // Se já estiver na última linha, mantém na última célula editável
            newColIndex = columns.length - 1;
            while (newColIndex >= 0 && !columns[newColIndex].editable) {
              newColIndex--;
            }
          }
        }
        break;
      default:
        break;
    }

    // Atualiza a célula atual
    setCurrentCell({ rowIndex: newRowIndex, colIndex: newColIndex });
  }, [produtos, columns]);

  // Função para atualizar um produto
  const handleCellChange = async (id, field, value) => {
    try {
      // Encontra o produto a ser atualizado
      const produtoIndex = produtos.findIndex(p => p.item_id.toString() === id.toString());
      if (produtoIndex === -1) return;
      
      // Cria uma cópia do produto com o campo atualizado
      const produtoAtualizado = { ...produtos[produtoIndex], [field]: value };
      
      // Atualiza o estado localmente primeiro (optimistic update)
      const produtosAtualizados = [...produtos];
      produtosAtualizados[produtoIndex] = produtoAtualizado;
      setProdutos(produtosAtualizados);
      
      // Envia atualização para o backend
      await axios.put(`/api/produtos/${id}`, produtoAtualizado);
      
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError('Erro ao atualizar o produto. Tente novamente.');
      
      // Em caso de erro, recarregar os dados para reverter mudanças
      fetchProdutos();
    }
  };

  // Calculamos o tabIndex para permitir navegação por TAB
  const getTabIndex = (rowIndex, colIndex) => {
    // Pulamos o ID (não editável) com +1
    const editableColIndex = colIndex > 0 ? colIndex : 0;
    // Cálculo base: (linha * número de colunas) + coluna + 100
    // Adicionamos 100 para não interferir com outros elementos da página
    return (rowIndex * columns.length) + editableColIndex + 100;
  };

  if (loading && produtos.length === 0) return <div className="loading">Carregando produtos...</div>;
  if (error && produtos.length === 0) return <div className="error-message">{error}</div>;
  if (produtos.length === 0) return <div className="no-data">Nenhum produto encontrado.</div>;

  return (
    <>
      <div className="table-actions">
        <button 
          className="button green-button"
          onClick={toggleSortDirection}
          title="Alterar ordenação"
        >
          Ordenar: {sortDirection === 'asc' ? 'Crescente ↑' : 'Decrescente ↓'}
        </button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.id}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto, rowIndex) => (
              <tr key={produto.item_id}>
                {columns.map((column, colIndex) => (
                  <td key={`${produto.item_id}-${column.id}`}>
                    {column.editable ? (
                      <EditableCell
                        id={`cell-${rowIndex}-${colIndex}`}
                        value={produto[column.id] !== null ? produto[column.id].toString() : ''}
                        onSave={(value) => handleCellChange(produto.item_id, column.id, value)}
                        tabIndex={getTabIndex(rowIndex, colIndex)}
                        onKeyNavigation={handleKeyNavigation}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        columnType={column.type}
                      />
                    ) : (
                      produto[column.id] !== null ? produto[column.id].toString() : ''
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading && <div className="loading table-overlay">Carregando...</div>}
      {error && <div className="error-message">{error}</div>}
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </>
  );
};

export default ProdutoList;