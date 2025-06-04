import React, { useState, useEffect, useCallback, useRef } from 'react';
import EditableCell from './EditableCell';
import axios from 'axios';
import './StatusBar.css';

// Configuração inteligente da API (detecta ambiente automaticamente)
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔧 Ambiente: DESENVOLVIMENTO');
    return 'http://localhost:5000';
  }
  
  // Produção no Render
  if (hostname.includes('onrender.com')) {
    console.log('🚀 Ambiente: PRODUÇÃO (Render)');
    return 'https://projetoreact-1.onrender.com';
  }
  
  // Outros ambientes (Netlify, Vercel, etc.)
  console.log('🌍 Ambiente: PRODUÇÃO (Outro)');
  // Se for HTTPS, usa HTTPS; se for HTTP, usa HTTP
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();
axios.defaults.baseURL = API_URL;

console.log('🌐 API configurada para:', API_URL);
console.log('📍 Frontend rodando em:', window.location.origin);

const ProdutoList = ({ searchParams }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCell, setCurrentCell] = useState({ rowIndex: 0, colIndex: 1 });
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estados para paginação infinita
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(null);
  const containerRef = useRef(null);

  // Definir colunas da tabela
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

  // Função para converter string para número de forma segura
  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Função para testar conectividade da API (com fallbacks)
  const testApiConnection = async () => {
    const testUrls = [
      API_URL,
      API_URL + '/api/produtos?page=1&limit=1'
    ];

    console.log('🔌 Testando conectividade da API...');

    for (const url of testUrls) {
      try {
        console.log(`🌐 Testando: ${url}`);
        const response = await axios.get(url.replace(API_URL, '') || '/', { timeout: 10000 });
        
        if (response.status === 200) {
          console.log(`✅ API respondendo em: ${url}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Falha em: ${url} - ${error.message}`);
        continue;
      }
    }

    console.error('❌ Nenhuma URL da API respondeu');
    return false;
  };

  // Função para normalizar dados do backend
  const normalizeProductData = (backendItems) => {
    console.log('🔄 Normalizando dados do backend...');
    console.log('📋 Exemplo de item bruto:', backendItems[0]);

    return backendItems.map(item => {
      const produto = {};

      // Campos básicos
      produto.item_id = item.item_id || item.id || '';
      produto.descricao = item.descricao || '';
      produto.fornecedor_id = safeParseFloat(item.fornecedor_id);
      produto.situacao = item.ativo || 'A';

      // Mapear estoque_pdv1-15 para loja1-15 (convertendo strings para números)
      for (let i = 1; i <= 15; i++) {
        const estoqueField = `estoque_pdv${i}`;
        const lojaField = `loja${i}`;
        produto[lojaField] = safeParseFloat(item[estoqueField]);
      }

      // Mapear custo_venda para custo_final (convertendo string para número)
      produto.custo_final = safeParseFloat(item.custo_venda);

      // Mapear valor_venda1-4 para venda1-4 (convertendo strings para números)
      for (let i = 1; i <= 4; i++) {
        const valorField = `valor_venda${i}`;
        const vendaField = `venda${i}`;
        produto[vendaField] = safeParseFloat(item[valorField]);
      }

      return produto;
    });
  };

  // Função para buscar dados iniciais com retry automático
  const fetchInitialProdutos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);

      console.log('🚀 Iniciando busca de produtos...');
      console.log('📋 Parâmetros de busca:', searchParams);

      // Primeiro teste de conectividade
      const isApiOnline = await testApiConnection();
      if (!isApiOnline) {
        setError('❌ API não está respondendo. Verifique sua conexão ou se o servidor está online.');
        setLoading(false);
        return;
      }

      const params = {
        page: 1,
        limit: 50,
        sort: 'asc'
      };

      let response;

      try {
        if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
          const searchTerm = searchParams.term;
          console.log(`🔎 Busca com filtro: ${searchParams.filter} = "${searchTerm}"`);

          if (searchParams.filter === 'codigo') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'id', modo: 'exato' },
              timeout: 15000
            });
          } else if (searchParams.filter === 'descricao') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'maior_igual' },
              timeout: 15000
            });
          } else if (searchParams.filter === 'fornecedor') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'fornecedor_id', modo: 'exato' },
              timeout: 15000
            });
          }
        } else {
          console.log('📦 Busca geral de produtos...');
          response = await axios.get('/api/produtos', { 
            params,
            timeout: 15000
          });
        }

        console.log('📡 Resposta da API recebida:', response?.data);

      } catch (apiError) {
        console.error('❌ Erro na API:', apiError);
        
        let errorMessage = 'Erro ao conectar com a API';
        if (apiError.code === 'ECONNABORTED') {
          errorMessage = 'Timeout: A API demorou muito para responder';
        } else if (apiError.response?.status === 404) {
          errorMessage = 'Endpoint da API não encontrado';
        } else if (apiError.response?.status >= 500) {
          errorMessage = 'Erro interno do servidor';
        }
        
        setError(`${errorMessage}: ${apiError.message}`);
        setLoading(false);
        return;
      }

      if (!response || !response.data) {
        setError('API retornou resposta vazia');
        setLoading(false);
        return;
      }

      let data = [];
      if (response.data.items && Array.isArray(response.data.items)) {
        data = response.data.items;
        console.log(`✅ ${data.length} produtos recebidos via paginação`);
        if (response.data.pagination) {
          setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
          console.log(`📄 Página ${response.data.pagination.currentPage} de ${response.data.pagination.totalPages}`);
        }
      } else if (Array.isArray(response.data)) {
        data = response.data;
        console.log(`✅ ${data.length} produtos recebidos via array direto`);
        setHasMore(data.length >= params.limit);
      }

      console.log(`📊 Total de produtos brutos recebidos: ${data.length}`);

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum produto retornado pela API');
        setProdutos([]);
        setFilteredProdutos([]);
        setError('A API não retornou produtos. Verifique se há dados no banco.');
        setLoading(false);
        return;
      }

      // Normalizar dados
      console.log('🔄 Normalizando dados...');
      const produtosNormalizados = normalizeProductData(data);
      console.log('✅ Primeiro produto normalizado:', produtosNormalizados[0]);

      setProdutos(produtosNormalizados);

      // Aplicar filtros locais se necessário
      if ((searchParams.filter === 'codigo' && searchParams.term) ||
          (searchParams.filter === 'moto' && searchParams.term)) {
        
        let filtered = produtosNormalizados;

        if (searchParams.filter === 'codigo') {
          filtered = produtosNormalizados.filter(produto =>
            produto.item_id.toString() === searchParams.term.toString()
          );
        } else if (searchParams.filter === 'moto') {
          filtered = produtosNormalizados.filter(produto =>
            produto.descricao.toLowerCase().includes(searchParams.term.toLowerCase())
          );
          filtered.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));
        }

        setFilteredProdutos(filtered);
        setHasMore(false);
      } else if (searchParams.filter === 'descricao' && searchParams.term) {
        const sortedProdutos = [...produtosNormalizados].sort((a, b) =>
          a.descricao.localeCompare(b.descricao, 'pt-BR')
        );
        setFilteredProdutos(sortedProdutos);
      } else {
        setFilteredProdutos(produtosNormalizados);
      }

      if (produtosNormalizados.length > 0) {
        setSelectedProduct(produtosNormalizados[0]);
      }

      console.log(`✅ ${produtosNormalizados.length} produtos processados e prontos para exibição`);
      setError(null);

    } catch (err) {
      console.error('💥 Erro crítico ao carregar produtos:', err);
      setError(`Erro ao carregar produtos: ${err.message}`);
      setProdutos([]);
      setFilteredProdutos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Função para carregar mais produtos
  const fetchMoreProdutos = useCallback(async () => {
    if (!hasMore || loadingMore) {
      return;
    }

    console.log(`📄 Carregando página ${page + 1}...`);

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const params = {
        page: nextPage,
        limit: 50,
        sort: 'asc'
      };

      // Para pesquisas locais, não fazer scroll infinito
      if (searchParams.filter === 'moto' || searchParams.filter === 'codigo') {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      let response;

      if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
        const searchTerm = searchParams.term;

        if (searchParams.filter === 'descricao') {
          response = await axios.get(`/api/produtos/search`, {
            params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'maior_igual' },
            timeout: 15000
          });
        } else if (searchParams.filter === 'fornecedor') {
          response = await axios.get(`/api/produtos/search`, {
            params: { ...params, termo: searchTerm, campo: 'fornecedor_id', modo: 'exato' },
            timeout: 15000
          });
        }
      } else {
        response = await axios.get('/api/produtos', { 
          params,
          timeout: 15000
        });
      }

      let data = [];
      if (response && response.data) {
        if (response.data.items) {
          data = response.data.items;
          setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
        } else if (Array.isArray(response.data)) {
          data = response.data;
          setHasMore(data.length >= params.limit);
        }
      }

      if (!data || data.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      // Normalizar novos dados
      const produtosNormalizados = normalizeProductData(data);

      // Filtrar duplicados
      const produtosExistentesIds = new Set(produtos.map(p => p.item_id?.toString()));
      const novosProdutos = produtosNormalizados.filter(produto => {
        const id = produto.item_id?.toString();
        return id && !produtosExistentesIds.has(id);
      });

      if (novosProdutos.length > 0) {
        const newProdutos = [...produtos, ...novosProdutos];
        setProdutos(newProdutos);

        if (searchParams.filter === 'descricao' && searchParams.term) {
          const sortedProdutos = [...newProdutos].sort((a, b) =>
            a.descricao.localeCompare(b.descricao, 'pt-BR')
          );
          setFilteredProdutos(sortedProdutos);
        } else {
          setFilteredProdutos(newProdutos);
        }

        setPage(nextPage);
        console.log(`✅ ${novosProdutos.length} novos produtos adicionados`);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error('❌ Erro ao carregar mais produtos:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, searchParams, produtos]);

  // Resto das funções permanecem iguais...
  useEffect(() => {
    fetchInitialProdutos();
  }, [fetchInitialProdutos]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !loadingRef.current || !hasMore || loadingMore) return;

      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;

      const nearBottom = scrollTop + containerHeight >= scrollHeight - 200;

      if (nearBottom) {
        fetchMoreProdutos();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      setTimeout(() => {
        handleScroll();
      }, 100);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [fetchMoreProdutos, hasMore, loadingMore]);

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

  useEffect(() => {
    if (filteredProdutos.length > 0 && currentCell.rowIndex >= 0 && currentCell.rowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[currentCell.rowIndex]);
    }
  }, [currentCell, filteredProdutos]);

  const handleKeyNavigation = (direction, rowIndex, colIndex) => {
    const maxRow = filteredProdutos.length - 1;
    const maxCol = columns.length - 1;

    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;

      case 'down':
        newRowIndex = Math.min(maxRow, rowIndex + 1);
        if (newRowIndex > maxRow - 3 && hasMore && !loadingMore) {
          setTimeout(() => {
            if (hasMore && !loadingMore) {
              fetchMoreProdutos();
            }
          }, 100);
        }
        break;

      case 'left': {
        let foundEditableCell = false;
        for (let col = colIndex - 1; col >= 0; col--) {
          if (columns[col].editable) {
            newColIndex = col;
            foundEditableCell = true;
            break;
          }
        }
        if (!foundEditableCell && rowIndex > 0) {
          newRowIndex = rowIndex - 1;
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
        let foundEditableCell = false;
        for (let col = colIndex + 1; col <= maxCol; col++) {
          if (columns[col].editable) {
            newColIndex = col;
            foundEditableCell = true;
            break;
          }
        }
        if (!foundEditableCell && rowIndex < maxRow) {
          newRowIndex = rowIndex + 1;
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

    setCurrentCell({ rowIndex: newRowIndex, colIndex: newColIndex });

    if (newRowIndex >= 0 && newRowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[newRowIndex]);
    }

    setTimeout(() => {
      const cellId = `cell-${newRowIndex}-${newColIndex}`;
      const cell = document.getElementById(cellId);
      if (cell) cell.focus();
    }, 0);
  };

  const handleRowMouseEnter = (produto) => {
    setSelectedProduct(produto);
  };

  const handleCellChange = async (id, field, value) => {
    try {
      const produtoIndex = produtos.findIndex(p =>
        (p.item_id?.toString() || p.id?.toString()) === id.toString()
      );

      if (produtoIndex === -1) return;

      const produtoAtualizado = { ...produtos[produtoIndex], [field]: value };

      // Atualização otimista
      const produtosAtualizados = [...produtos];
      produtosAtualizados[produtoIndex] = produtoAtualizado;
      setProdutos(produtosAtualizados);

      const filteredIndex = filteredProdutos.findIndex(p =>
        (p.item_id?.toString() || p.id?.toString()) === id.toString()
      );

      if (filteredIndex !== -1) {
        const filteredAtualizados = [...filteredProdutos];
        filteredAtualizados[filteredIndex] = produtoAtualizado;
        setFilteredProdutos(filteredAtualizados);
      }

      if (selectedProduct && selectedProduct.item_id.toString() === id.toString()) {
        setSelectedProduct(produtoAtualizado);
      }

      // Mapear campos do frontend para backend
      const dadosParaEnviar = {};

      if (field === 'situacao') {
        dadosParaEnviar.ativo = value === '' ? 'A' : value;
      } else if (field.startsWith('loja')) {
        const lojaNumero = field.replace('loja', '');
        dadosParaEnviar[`estoque_pdv${lojaNumero}`] = value === '' ? 0 : parseFloat(value);
      } else if (field.startsWith('venda')) {
        const vendaNumero = field.replace('venda', '');
        dadosParaEnviar[`valor_venda${vendaNumero}`] = value === '' ? 0 : parseFloat(value);
      } else if (field === 'custo_final') {
        dadosParaEnviar.custo_venda = value === '' ? 0 : parseFloat(value);
      } else {
        dadosParaEnviar[field] = value;
      }

      try {
        await axios.put(`/api/produtos/${id}`, dadosParaEnviar, { timeout: 10000 });
        console.log(`✅ Produto ${id} atualizado:`, dadosParaEnviar);
      } catch (error) {
        console.error('❌ Erro ao atualizar na API:', error);
        setError(`Erro ao atualizar o produto: ${error.message}`);

        // Reverter mudanças
        if (produtoIndex !== -1) {
          const produtosRevertidos = [...produtos];
          produtosRevertidos[produtoIndex] = produtos[produtoIndex];
          setProdutos(produtosRevertidos);
        }

        if (filteredIndex !== -1) {
          const filteredRevertidos = [...filteredProdutos];
          filteredRevertidos[filteredIndex] = filteredProdutos[filteredIndex];
          setFilteredProdutos(filteredRevertidos);
        }

        if (selectedProduct && selectedProduct.item_id.toString() === id.toString()) {
          setSelectedProduct(produtos[produtoIndex]);
        }
      }

    } catch (err) {
      console.error('❌ Erro ao atualizar produto:', err);
      setError('Erro ao atualizar o produto. Tente novamente.');
    }
  };

  const getTabIndex = (rowIndex, colIndex) => {
    const editableColIndex = colIndex > 0 ? colIndex : 0;
    return (rowIndex * columns.length) + editableColIndex + 100;
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '';

    if (column.type === 'number') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;

      if (column.noDecimals) {
        return Math.floor(numValue).toString();
      }

      if (column.truncate) {
        return numValue.toFixed(2);
      }

      return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return value.toString();
  };

  const showNoMoreData = !hasMore && !loadingMore && filteredProdutos.length > 0;

  // Renderização com informações de debug em desenvolvimento
  if (loading && filteredProdutos.length === 0) {
    return (
      <div className="loading">
        <div>Carregando produtos...</div>
        {window.location.hostname === 'localhost' && (
          <div style={{ fontSize: '0.8em', marginTop: '10px', color: '#666' }}>
            API: {API_URL}
          </div>
        )}
      </div>
    );
  }

  if (error && filteredProdutos.length === 0) {
    return (
      <div className="error-message">
        <div>{error}</div>
        <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
          <button onClick={() => window.location.reload()}>🔄 Tentar Novamente</button>
        </div>
        {window.location.hostname === 'localhost' && (
          <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#666' }}>
            Debug Info:
            <ul style={{ textAlign: 'left', marginTop: '5px' }}>
              <li>API URL: {API_URL}</li>
              <li>Frontend: {window.location.origin}</li>
              <li>Hostname: {window.location.hostname}</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

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
                className={currentCell.rowIndex === rowIndex ? 'highlighted' : ''}
                onMouseEnter={() => handleRowMouseEnter(produto)}
              >
                {columns.map((column, colIndex) => {
                  const rawValue = produto[column.id];
                  const displayValue = formatValue(rawValue, column);
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

        <div
          ref={loadingRef}
          className="loading-more"
          style={{ visibility: hasMore ? 'visible' : 'hidden' }}
        >
          {loadingMore ? 'Carregando mais produtos...' : ''}
        </div>

        {showNoMoreData && (
          <div className="end-of-list">
            Não há mais produtos para carregar.
          </div>
        )}
      </div>

      <div className="status-bar">
        {selectedProduct ? (
          <>
            <span className="status-code">{selectedProduct.item_id}</span>
            <span className="status-description">{selectedProduct.descricao}</span>
          </>
        ) : (
          <span className="status-empty">Nenhum produto selecionado</span>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </>
  );
};

export default ProdutoList;