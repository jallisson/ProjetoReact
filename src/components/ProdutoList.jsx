import React, { useState, useEffect, useCallback, useRef } from 'react';
import EditableCell from './EditableCell';
import axios from 'axios';

// Atualizado para aceitar searchParams em vez de apenas searchTerm
const ProdutoList = ({ searchParams }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCell, setCurrentCell] = useState({ rowIndex: 0, colIndex: 1 });
  const [filteredProdutos, setFilteredProdutos] = useState([]);

  // Estados para paginação infinita
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(null);
  const containerRef = useRef(null);

  // Defina as colunas da tabela
  const columns = [
    { id: 'item_id', header: 'Código', editable: false, type: 'text' },
    { id: 'descricao', header: 'Nome', editable: true, type: 'text' },
    { id: 'fornecedor_id', header: 'Fornecedor', editable: true, type: 'number' },
    { id: 'situacao', header: 'Situação', editable: true, type: 'text' },
    { id: 'loja1', header: 'Loja1', editable: true, type: 'number', noDecimals: true },
    { id: 'loja2', header: 'Loja2', editable: true, type: 'number', noDecimals: true },
    { id: 'loja3', header: 'Loja3', editable: true, type: 'number', noDecimals: true },
    { id: 'loja4', header: 'Loja4', editable: true, type: 'number', noDecimals: true },
    { id: 'loja5', header: 'Loja5', editable: true, type: 'number', noDecimals: true },
    { id: 'loja6', header: 'Loja6', editable: true, type: 'number', noDecimals: true },
    { id: 'loja7', header: 'Loja7', editable: true, type: 'number', noDecimals: true },
    { id: 'loja8', header: 'Loja8', editable: true, type: 'number', noDecimals: true },
    { id: 'loja9', header: 'Loja9', editable: true, type: 'number', noDecimals: true },
    { id: 'loja10', header: 'Loja10', editable: true, type: 'number', noDecimals: true },
    { id: 'loja11', header: 'Loja11', editable: true, type: 'number', noDecimals: true },
    { id: 'loja12', header: 'Loja12', editable: true, type: 'number', noDecimals: true },
    { id: 'loja13', header: 'Loja13', editable: true, type: 'number', noDecimals: true },
    { id: 'loja14', header: 'Loja14', editable: true, type: 'number', noDecimals: true },
    { id: 'loja15', header: 'Loja15', editable: true, type: 'number', noDecimals: true },
    { id: 'custo_final', header: 'Custo Final', editable: true, type: 'number', truncate: true },
    { id: 'venda1', header: 'Venda1', editable: true, type: 'number', truncate: true },
    { id: 'venda2', header: 'Venda2', editable: true, type: 'number', truncate: true },
    { id: 'venda3', header: 'Venda3', editable: true, type: 'number', truncate: true },
    { id: 'venda4', header: 'Venda4', editable: true, type: 'number', truncate: true }
  ];

  // Função para buscar dados iniciais
  const fetchInitialProdutos = useCallback(async () => {
    try {
      setLoading(true);
      setPage(1);

      const params = {
        page: 1,
        limit: 100, // Carregar mais itens inicialmente para filtros locais
        sort: 'asc'
      };

      let data = [];

      try {
        if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
          // Se tivermos parâmetros de pesquisa que podem ser enviados para o backend
          // Usando pesquisa no backend para filtros específicos
          const searchTerm = searchParams.term;

          let response;
          if (searchParams.filter === 'codigo') {
            // Pesquisa por código (exato)
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'id', modo: 'exato' }
            });
          } else if (searchParams.filter === 'descricao') {
            // Pesquisa por descrição (maior ou igual)
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'maior_igual' }
            });
          } else if (searchParams.filter === 'fornecedor') {
            // Pesquisa por fornecedor (exato)
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'fornecedor_id', modo: 'exato' }
            });
          }

          if (response) {
            if (response.data.items) {
              data = response.data.items;
              setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
            } else if (Array.isArray(response.data)) {
              data = response.data;
              setHasMore(data.length >= params.limit);
            }
          } else {
            setHasMore(false);
          }
        } else {
          // Sem filtro específico ou filtro por moto (que faremos localmente)
          // Buscar todos os produtos
          const response = await axios.get('/api/produtos', { params });

          if (response.data.items) {
            data = response.data.items;
            setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
          } else if (Array.isArray(response.data)) {
            data = response.data;
            setHasMore(data.length >= params.limit);
          } else {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.warn('Erro na API:', error);
        setHasMore(false);
        setError('Erro ao buscar dados. Por favor, tente novamente.');
      }

      // Normalização de dados para garantir formato correto
      const produtosNormalizados = data.map(item => {
        const produto = {};

        // Mapear os campos padrão
        produto.item_id = item.item_id || item.id || item.codigo || item.cod || '';
        produto.descricao = item.descricao || item.nome || '';
        produto.fornecedor_id = item.fornecedor_id || item.fornecedor || 0;
        produto.situacao = item.situacao || item.ativo || 'A';

        // Mapear campos específicos numericamente (lojas sem decimais)
        for (let i = 1; i <= 15; i++) {
          const lojaField = `loja${i}`;
          const value = parseFloat(item[lojaField] || item[`estoque_pdv${i}`] || 0);
          produto[lojaField] = value;
        }

        // Campos financeiros
        produto.custo_final = parseFloat(item.custo_final || item.custo_venda || item.custo || 0);

        for (let i = 1; i <= 4; i++) {
          const vendaField = `venda${i}`;
          produto[vendaField] = parseFloat(item[vendaField] || item[`valor_venda${i}`] || 0);
        }

        return produto;
      });

      setProdutos(produtosNormalizados);

      // Aplicar filtros locais se necessário
      if ((searchParams.filter === 'codigo' && searchParams.term) ||
        (searchParams.filter === 'moto' && searchParams.term)) {

        let filtered = produtosNormalizados;

        if (searchParams.filter === 'codigo') {
          // Filtragem local por código (exato)
          filtered = produtosNormalizados.filter(produto =>
            produto.item_id.toString() === searchParams.term.toString()
          );
        } else if (searchParams.filter === 'moto') {
          // Filtragem local por moto (contém)
          filtered = produtosNormalizados.filter(produto =>
            produto.descricao.toLowerCase().includes(searchParams.term.toLowerCase())
          );
        }

        setFilteredProdutos(filtered);
      } else {
        setFilteredProdutos(produtosNormalizados);
      }

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos.');
      setProdutos([]);
      setFilteredProdutos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Função para buscar mais produtos (scroll infinito)
  // Função para buscar mais produtos (scroll infinito)
  const fetchMoreProdutos = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const params = {
        page: nextPage,
        limit: 30,
        sort: 'asc'
      };

      let data = [];

      try {
        // Lógica similar à busca inicial, mas para próximas páginas
        let response;

        if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
          const searchTerm = searchParams.term;

          if (searchParams.filter === 'codigo') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'id', modo: 'exato' }
            });
          } else if (searchParams.filter === 'descricao') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'maior_igual' }
            });
          } else if (searchParams.filter === 'fornecedor') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'fornecedor_id', modo: 'exato' }
            });
          }
        } else {
          response = await axios.get('/api/produtos', { params });
        }

        if (response && response.data) {
          if (response.data.items) {
            data = response.data.items;
            setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
          } else if (Array.isArray(response.data)) {
            data = response.data;
            setHasMore(data.length >= params.limit);
          } else {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.warn('Erro na API ao carregar mais itens:', error);
        setHasMore(false);
      }

      // Normalização dos dados
      const produtosNormalizados = data.map(item => {
        const produto = {};

        // Mapear os campos padrão
        produto.item_id = item.item_id || item.id || item.codigo || item.cod || '';
        produto.descricao = item.descricao || item.nome || '';
        produto.fornecedor_id = item.fornecedor_id || item.fornecedor || 0;
        produto.situacao = item.situacao || item.ativo || 'A';

        // Mapear campos específicos numericamente (lojas sem decimais)
        for (let i = 1; i <= 15; i++) {
          const lojaField = `loja${i}`;
          const value = parseFloat(item[lojaField] || item[`estoque_pdv${i}`] || 0);
          produto[lojaField] = value;
        }

        // Campos financeiros
        produto.custo_final = parseFloat(item.custo_final || item.custo_venda || item.custo || 0);

        for (let i = 1; i <= 4; i++) {
          const vendaField = `venda${i}`;
          produto[vendaField] = parseFloat(item[vendaField] || item[`valor_venda${i}`] || 0);
        }

        return produto;
      });

      const newProdutos = [...produtos, ...produtosNormalizados];
      setProdutos(newProdutos);

      // Aplicar filtros locais se necessário
      if ((searchParams.filter === 'codigo' && searchParams.term) ||
        (searchParams.filter === 'moto' && searchParams.term)) {

        let filtered = newProdutos;

        if (searchParams.filter === 'codigo') {
          // Filtragem local por código (exato)
          filtered = newProdutos.filter(produto =>
            produto.item_id.toString() === searchParams.term.toString()
          );
        } else if (searchParams.filter === 'moto') {
          // Filtragem local por moto (contém)
          filtered = newProdutos.filter(produto =>
            produto.descricao.toLowerCase().includes(searchParams.term.toLowerCase())
          );
        }

        setFilteredProdutos(filtered);
      } else {
        setFilteredProdutos(newProdutos);
      }

      setPage(nextPage);
    } catch (err) {
      console.error('Erro ao carregar mais produtos:', err);
      setError('Erro ao carregar mais produtos.');
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, searchParams, produtos]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchInitialProdutos();
  }, [fetchInitialProdutos]);

  // Configure o scroll infinito
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !loadingRef.current || !hasMore || loadingMore) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const loadingRect = loadingRef.current.getBoundingClientRect();

      // Se o elemento de carregamento estiver dentro da área visível
      if (loadingRect.top < containerRect.bottom + 300) {
        fetchMoreProdutos();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [fetchMoreProdutos, hasMore, loadingMore]);

  // Funções de navegação e atualização de produtos permanecem iguais
  const focusCurrentCell = useCallback(() => {
    if (filteredProdutos.length === 0) return;

    const { rowIndex, colIndex } = currentCell;

    setTimeout(() => {
      const cellId = `cell-${rowIndex}-${colIndex}`;
      const cell = document.getElementById(cellId);

      if (cell) {
        cell.focus();
      }
    }, 50);
  }, [currentCell, filteredProdutos]);

  useEffect(() => {
    focusCurrentCell();
  }, [currentCell, focusCurrentCell]);

  // Função otimizada para navegação por teclado
  const handleKeyNavigation = (direction, rowIndex, colIndex) => {
    // Cache para otimização - evita recálculos desnecessários
    const maxRow = filteredProdutos.length - 1;
    const maxCol = columns.length - 1;

    // Cálculo direto de novas coordenadas
    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    switch (direction) {
      case 'up':
        // Movimento simples para cima, sem lógica complexa
        newRowIndex = Math.max(0, rowIndex - 1);
        break;

      case 'down':
        // Movimento simples para baixo, com verificação de carregamento
        newRowIndex = Math.min(maxRow, rowIndex + 1);

        // Se estiver próximo ao final, aciona carregamento assíncrono
        if (newRowIndex > maxRow - 3 && hasMore && !loadingMore) {
          // Usar setTimeout para não bloquear a navegação
          setTimeout(() => {
            if (hasMore && !loadingMore) {
              fetchMoreProdutos();
            }
          }, 100);
        }
        break;

      case 'left': {
        // Movimento para célula editável à esquerda
        let foundEditableCell = false;

        // Começando da coluna atual, procura à esquerda
        for (let col = colIndex - 1; col >= 0; col--) {
          if (columns[col].editable) {
            newColIndex = col;
            foundEditableCell = true;
            break;
          }
        }

        // Se não encontrou na linha atual, vai para a linha anterior
        if (!foundEditableCell && rowIndex > 0) {
          newRowIndex = rowIndex - 1;

          // Procura da direita para a esquerda na linha anterior
          for (let col = maxCol; col >= 0; col--) {
            if (columns[col].editable) {
              newColIndex = col;
              break;
            }
          }
        }
        break;
      }

      case 'right': {
        // Movimento para célula editável à direita
        let foundEditableCell = false;

        // Começando da coluna atual, procura à direita
        for (let col = colIndex + 1; col <= maxCol; col++) {
          if (columns[col].editable) {
            newColIndex = col;
            foundEditableCell = true;
            break;
          }
        }

        // Se não encontrou na linha atual, vai para a próxima linha
        if (!foundEditableCell && rowIndex < maxRow) {
          newRowIndex = rowIndex + 1;

          // Procura da esquerda para a direita na próxima linha
          for (let col = 0; col <= maxCol; col++) {
            if (columns[col].editable) {
              newColIndex = col;
              break;
            }
          }
        }
        break;
      }
    }

    // Atualiza a célula atual com coordenadas calculadas
    setCurrentCell({ rowIndex: newRowIndex, colIndex: newColIndex });

    // Foco imediato para uma experiência mais responsiva
    setTimeout(() => {
      const cellId = `cell-${newRowIndex}-${newColIndex}`;
      const cell = document.getElementById(cellId);
      if (cell) cell.focus();
    }, 0);
  };

  // Função para atualizar um produto
  const handleCellChange = async (id, field, value) => {
    try {
      // Encontra o produto a ser atualizado
      const produtoIndex = produtos.findIndex(p =>
        (p.item_id?.toString() || p.id?.toString()) === id.toString()
      );

      if (produtoIndex === -1) return;

      // Cria uma cópia do produto com o campo atualizado
      const produtoAtualizado = { ...produtos[produtoIndex], [field]: value };

      // Atualiza o estado localmente primeiro (optimistic update)
      const produtosAtualizados = [...produtos];
      produtosAtualizados[produtoIndex] = produtoAtualizado;
      setProdutos(produtosAtualizados);

      // Atualiza também os produtos filtrados
      const filteredIndex = filteredProdutos.findIndex(p =>
        (p.item_id?.toString() || p.id?.toString()) === id.toString()
      );

      if (filteredIndex !== -1) {
        const filteredAtualizados = [...filteredProdutos];
        filteredAtualizados[filteredIndex] = produtoAtualizado;
        setFilteredProdutos(filteredAtualizados);
      }

      // Tenta enviar atualização para o backend
      try {
        await axios.put(`/api/produtos/${id}`, produtoAtualizado);
      } catch (error) {
        console.warn('Erro ao atualizar na API, mas a UI foi atualizada:', error);
      }

    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError('Erro ao atualizar o produto. Tente novamente.');
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

  // Formatar valor numérico para exibição
  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '';

    if (column.type === 'number') {
      // Converter para número
      const numValue = typeof value === 'string' ? parseFloat(value) : value;

      // Para colunas de lojas - sem decimais
      if (column.noDecimals) {
        return Math.floor(numValue).toString();
      }

      // Se for uma coluna que deve ser truncada (custo_final, venda1-4)
      if (column.truncate) {
        // Trunca para 2 casas decimais
        return numValue.toFixed(2);
      }

      // Para outras colunas numéricas, usar o formato padrão
      return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return value.toString();
  };

  // Determinar se mostrar o indicador de "sem mais produtos"
  const showNoMoreData = !hasMore && !loadingMore && filteredProdutos.length > 0;

  if (loading && filteredProdutos.length === 0) return <div className="loading">Carregando produtos...</div>;
  if (error && filteredProdutos.length === 0) return <div className="error-message">{error}</div>;
  if (filteredProdutos.length === 0) return <div className="no-data">Nenhum produto encontrado.</div>;

  return (
    <>
      <div className="fixed-table-container" ref={containerRef}>
        <table className="produtos-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.id} className={column.id === 'descricao' ? 'description-column' : ''}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProdutos.map((produto, rowIndex) => (
              <tr
                key={`row-${produto.item_id}-${rowIndex}`}
                className={produto.item_id === '1953' ? 'highlighted' : ''}
              >
                {columns.map((column, colIndex) => {
                  // Obter valor do produto para esta coluna
                  const rawValue = produto[column.id];

                  // Formatar valor para exibição
                  const displayValue = formatValue(rawValue, column);

                  // Valor original para edição
                  const editValue = rawValue !== undefined ? rawValue.toString() : '';

                  return (
                    <td
                      key={`${produto.item_id}-${column.id}-${rowIndex}-${colIndex}`}
                      className={column.id === 'descricao' ? 'description-column' : ''}
                    >
                      {column.editable ? (
                        <EditableCell
                          id={`cell-${rowIndex}-${colIndex}`}
                          value={column.noDecimals ? displayValue : (column.truncate ? displayValue : editValue)}
                          onSave={(value) => handleCellChange(produto.item_id, column.id, value)}
                          tabIndex={getTabIndex(rowIndex, colIndex)}
                          onKeyNavigation={handleKeyNavigation}
                          rowIndex={rowIndex}
                          colIndex={colIndex}
                          columnType={column.type}
                        />
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Elemento observado para carregar mais itens */}
        <div
          ref={loadingRef}
          className="loading-more"
          style={{ visibility: hasMore ? 'visible' : 'hidden' }}
        >
          {loadingMore ? 'Carregando mais produtos...' : ''}
        </div>

        {/* Indicador de fim da lista */}
        {showNoMoreData && (
          <div className="end-of-list">
            Não há mais produtos para carregar.
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </>
  );
};

export default ProdutoList;