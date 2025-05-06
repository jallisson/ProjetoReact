import React, { useState, useEffect } from 'react';
import EditableCell from './EditableCell';
import axios from 'axios';

const ProdutoList = ({ searchTerm }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCell, setCurrentCell] = useState({ rowIndex: 0, colIndex: 1 }); // Começamos na primeira célula editável
  
  // Defina as colunas da tabela
  const columns = [
    { id: 'id', header: 'Cód', editable: false, type: 'text' },
    { id: 'descricao', header: 'Descrição', editable: true, type: 'text' },
    { id: 'forn', header: 'Forn', editable: true, type: 'number' },
    { id: 'gara', header: 'Gara', editable: true, type: 'number' },
    { id: 'jat', header: 'Jat', editable: true, type: 'number' },
    { id: 'ane', header: 'Ane', editable: true, type: 'number' },
    { id: 'mai', header: 'Mai', editable: true, type: 'number' },
    { id: 'coa', header: 'Coa', editable: true, type: 'number' },
    { id: 'ana', header: 'Ana', editable: true, type: 'number' },
    { id: 'tim', header: 'Tim', editable: true, type: 'number' },
    { id: 'cas', header: 'Cas', editable: true, type: 'number' }
  ];

  // Buscar dados do backend
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setLoading(true);
        let response;
        
        if (searchTerm) {
          response = await axios.get(`/api/produtos/search?termo=${searchTerm}`);
        } else {
          response = await axios.get('/api/produtos');
        }
        
        setProdutos(response.data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError('Erro ao carregar produtos. Verifique a conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, [searchTerm]);

  // Efeito para focar na célula atual quando ela mudar
  useEffect(() => {
    if (produtos.length > 0) {
      const { rowIndex, colIndex } = currentCell;
      // Encontre a célula pelo data-id
      const cellId = `cell-${rowIndex}-${colIndex}`;
      const cell = document.getElementById(cellId);
      if (cell) {
        cell.focus();
      }
    }
  }, [currentCell, produtos]);

  // Função para navegar entre células
  const handleKeyNavigation = (direction, rowIndex, colIndex) => {
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
  };

  // Função para atualizar um produto
  const handleCellChange = async (id, field, value) => {
    try {
      // Encontra o produto a ser atualizado
      const produtoIndex = produtos.findIndex(p => p.id.toString() === id.toString());
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
      const response = await axios.get('/api/produtos');
      setProdutos(response.data);
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

  if (loading) return <div className="loading">Carregando produtos...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (produtos.length === 0) return <div className="no-data">Nenhum produto encontrado.</div>;

  return (
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
            <tr key={produto.id}>
              {columns.map((column, colIndex) => (
                <td key={`${produto.id}-${column.id}`}>
                  {column.editable ? (
                    <EditableCell
                      id={`cell-${rowIndex}-${colIndex}`}
                      value={produto[column.id] !== null ? produto[column.id].toString() : ''}
                      onSave={(value) => handleCellChange(produto.id, column.id, value)}
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
  );
};

export default ProdutoList;