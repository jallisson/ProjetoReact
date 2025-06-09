import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EditableCell from './EditableCell';
import axios from 'axios';
import './StatusBar.css';

// Configuração da API corrigida
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  console.log('🔍 Detectando ambiente:');
  console.log('  Hostname:', hostname);
  console.log('  Protocol:', protocol);
  console.log('  Port:', port);

  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🔧 Ambiente: DESENVOLVIMENTO');
    return 'http://localhost:5000';
  }

  // Render (backend separado)
  if (hostname.includes('onrender.com')) {
    console.log('🚀 Ambiente: PRODUÇÃO (Render - Backend separado)');
    return 'https://projetoreact-1.onrender.com';
  }

  // Railway (aplicação única - CORREÇÃO AQUI)
  if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
    console.log('🚂 Ambiente: PRODUÇÃO (Railway - App única)');
    // No Railway, o backend está na mesma URL que o frontend
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  // Outros ambientes de produção
  console.log('🌍 Ambiente: PRODUÇÃO (Outro)');
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
};

const API_URL = getApiUrl();
axios.defaults.baseURL = API_URL;

console.log('🌐 API configurada para:', API_URL);
console.log('📍 Frontend rodando em:', window.location.origin);

// CONSTANTES PARA VIRTUALIZAÇÃO
const ITEM_HEIGHT = 36; // Altura de cada linha em pixels
const BUFFER_SIZE = 5; // Número de itens extras para renderizar antes/depois da área visível
const OVERSCAN = 3; // Itens extras para suavizar o scroll

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

  // Estados para virtualização
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Definir colunas da tabela - TODAS AS COLUNAS
  const columns = [
    { id: 'item_id', header: 'Código', editable: false, type: 'text' },
    { id: 'descricao', header: 'Nome', editable: true, type: 'text' },
    { id: 'fornecedor_id', header: 'Fornecedor', editable: true, type: 'number' },
    { id: 'situacao', header: 'Situação', editable: true, type: 'text' },
    { id: 'loja1', header: 'Loja1', editable: true, type: 'number', isInteger: true },
    { id: 'loja2', header: 'Loja2', editable: true, type: 'number', isInteger: true },
    { id: 'loja3', header: 'Loja3', editable: true, type: 'number', isInteger: true },
    { id: 'loja4', header: 'Loja4', editable: true, type: 'number', isInteger: true },
    { id: 'loja5', header: 'Loja5', editable: true, type: 'number', isInteger: true },
    { id: 'loja6', header: 'Loja6', editable: true, type: 'number', isInteger: true },
    { id: 'loja7', header: 'Loja7', editable: true, type: 'number', isInteger: true },
    { id: 'loja8', header: 'Loja8', editable: true, type: 'number', isInteger: true },
    { id: 'loja9', header: 'Loja9', editable: true, type: 'number', isInteger: true },
    { id: 'loja10', header: 'Loja10', editable: true, type: 'number', isInteger: true },
    { id: 'loja11', header: 'Loja11', editable: true, type: 'number', isInteger: true },
    { id: 'loja12', header: 'Loja12', editable: true, type: 'number', isInteger: true },
    { id: 'loja13', header: 'Loja13', editable: true, type: 'number', isInteger: true },
    { id: 'loja14', header: 'Loja14', editable: true, type: 'number', isInteger: true },
    { id: 'loja15', header: 'Loja15', editable: true, type: 'number', isInteger: true },
    { id: 'custo_final', header: 'Custo Final', editable: true, type: 'number', isDecimal: true },
    { id: 'venda1', header: 'Venda1', editable: true, type: 'number', isDecimal: true },
    { id: 'venda2', header: 'Venda2', editable: true, type: 'number', isDecimal: true },
    { id: 'venda3', header: 'Venda3', editable: true, type: 'number', isDecimal: true },
    { id: 'venda4', header: 'Venda4', editable: true, type: 'number', isDecimal: true }
  ];

  // Lógica de virtualização
  const virtualizedData = useMemo(() => {
    if (!containerHeight || filteredProdutos.length === 0) {
      return {
        startIndex: 0,
        endIndex: Math.min(50, filteredProdutos.length),
        visibleItems: filteredProdutos.slice(0, Math.min(50, filteredProdutos.length)),
        totalHeight: filteredProdutos.length * ITEM_HEIGHT,
        offsetY: 0
      };
    }

    const visibleItemCount = Math.ceil(containerHeight / ITEM_HEIGHT);
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      filteredProdutos.length,
      startIndex + visibleItemCount + (BUFFER_SIZE * 2) + OVERSCAN
    );

    return {
      startIndex,
      endIndex,
      visibleItems: filteredProdutos.slice(startIndex, endIndex),
      totalHeight: filteredProdutos.length * ITEM_HEIGHT,
      offsetY: startIndex * ITEM_HEIGHT
    };
  }, [scrollTop, containerHeight, filteredProdutos]);

  // Função de formatação para exibição na tabela
  function formatarValor(valor, coluna) {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }

    if (coluna.type !== 'number') {
      return String(valor);
    }

    let numeroFormatavel;
    if (typeof valor === 'string') {
      numeroFormatavel = parseFloat(valor);
    } else {
      numeroFormatavel = Number(valor);
    }

    if (isNaN(numeroFormatavel)) {
      return '0';
    }

    if (coluna.isInteger || coluna.id === 'fornecedor_id') {
      return Math.floor(numeroFormatavel).toString();
    }

    if (coluna.isDecimal) {
      let formatted = numeroFormatavel.toFixed(2);
      formatted = formatted.replace('.', ',');
      formatted = formatted.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      return formatted;
    }

    return String(numeroFormatavel);
  }

  // Função para converter string para número de forma segura
  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[^\d.\-]/g, '');
      const parsed = parseFloat(cleanedValue);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  // Função para testar conectividade da API
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
    console.log('📋 Exemplo de item bruto recebido da API:', backendItems[0]);

    const normalized = backendItems.map(item => {
      const produto = {};

      // Campos básicos
      produto.item_id = item.item_id || item.id || '';
      produto.descricao = item.descricao || '';
      produto.fornecedor_id = safeParseFloat(item.fornecedor_id);
      produto.situacao = item.ativo || 'A';

      // Mapear estoque_pdv1-15 para loja1-15
      for (let i = 1; i <= 15; i++) {
        const estoqueField = `estoque_pdv${i}`;
        const lojaField = `loja${i}`;
        produto[lojaField] = safeParseFloat(item[estoqueField]);
      }

      // Mapear custo_venda para custo_final
      produto.custo_final = safeParseFloat(item.custo_venda);

      // Mapear valor_venda1-4 para venda1-4
      for (let i = 1; i <= 4; i++) {
        const valorField = `valor_venda${i}`;
        const vendaField = `venda${i}`;
        produto[vendaField] = safeParseFloat(item[valorField]);
      }

      return produto;
    });

    console.log('✅ Exemplo de item normalizado (primeiro):', normalized[0]);
    return normalized;
  };

  // Função para buscar dados iniciais
  const fetchInitialProdutos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);
      setScrollTop(0);

      console.log('🚀 Iniciando busca de produtos...');
      console.log('📋 Parâmetros de busca:', searchParams);

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
          console.log(`🔎 Busca com filtro: ${searchParams.filter} = "${searchTerm}" (modo automático: ${searchParams.mode})`);

          if (searchParams.filter === 'codigo') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'id', modo: 'exato' },
              timeout: 15000
            });
          } else if (searchParams.filter === 'descricao') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'contém' },
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

      console.log('🔄 Normalizando dados...');
      const produtosNormalizados = normalizeProductData(data);
      console.log('✅ Primeiro produto normalizado:', produtosNormalizados[0]);

      setProdutos(produtosNormalizados);

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
        limit: 100,
        sort: 'asc'
      };

      if (searchParams.filter === 'moto' || searchParams.filter === 'codigo') {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      let response;

      if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
        const searchTerm = searchParams.term;
        console.log(`🔎 Busca com filtro: ${searchParams.filter} = "${searchTerm}" (modo automático: ${searchParams.mode})`);

        if (searchParams.filter === 'codigo') {
          response = await axios.get(`/api/produtos/search`, {
            params: { ...params, termo: searchTerm, campo: 'id', modo: 'exato' },
            timeout: 15000
          });
        } else if (searchParams.filter === 'descricao') {
          response = await axios.get(`/api/produtos/search`, {
            params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'contém' },
            timeout: 15000
          });
        } else if (searchParams.filter === 'fornecedor') {
          response = await axios.get(`/api/produtos/search`, {
            params: { ...params, termo: searchTerm, campo: 'fornecedor_id', modo: 'exato' },
            timeout: 15000
          });
        }
      }
      else {
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

      const produtosNormalizados = normalizeProductData(data);

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

  // Effect para buscar produtos iniciais
  useEffect(() => {
    fetchInitialProdutos();
  }, [fetchInitialProdutos]);

  // Effect para scroll e redimensionamento
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    let isScrolling = false;
    const handleScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      requestAnimationFrame(() => {
        const newScrollTop = container.scrollTop;
        setScrollTop(newScrollTop);

        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const scrollPosition = newScrollTop + clientHeight;
        const threshold = scrollHeight - (clientHeight * 1.5);

        if (scrollPosition >= threshold && hasMore && !loadingMore) {
          fetchMoreProdutos();
        }

        isScrolling = false;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [fetchMoreProdutos, hasMore, loadingMore]);

  // Effect para atualizar produto selecionado
  useEffect(() => {
    if (filteredProdutos.length > 0 && currentCell.rowIndex >= 0 && currentCell.rowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[currentCell.rowIndex]);
    }
  }, [currentCell, filteredProdutos]);

  // Effect inicial para definir primeiro produto selecionado
  useEffect(() => {
    if (filteredProdutos.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProdutos[0]);
      setCurrentCell({ rowIndex: 0, colIndex: 1 });
    }
  }, [filteredProdutos, selectedProduct]);

  // ========================================
  // NAVEGAÇÃO POR TECLADO CORRIGIDA
  // ========================================
  const handleKeyNavigation = useCallback((direction, virtualRowIndex, colIndex) => {
    console.log(`🎯 Navegação: ${direction}, virtualRow: ${virtualRowIndex}, col: ${colIndex}`);
    console.log(`📍 Estado atual - currentCell:`, currentCell);
    console.log(`📊 Total produtos: ${filteredProdutos.length}, Virtual range: ${virtualizedData.startIndex}-${virtualizedData.endIndex}`);

    // Calcular o índice real no array completo de produtos
    const realRowIndex = virtualRowIndex + virtualizedData.startIndex;
    console.log(`🎯 Índice real calculado: ${realRowIndex}`);

    const maxRow = filteredProdutos.length - 1;
    const maxCol = columns.length - 1;

    let newRowIndex = realRowIndex;
    let newColIndex = colIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, realRowIndex - 1);
        console.log(`⬆️ Subindo: ${realRowIndex} -> ${newRowIndex}`);
        break;
        
      case 'down':
        newRowIndex = Math.min(maxRow, realRowIndex + 1);
        console.log(`⬇️ Descendo: ${realRowIndex} -> ${newRowIndex} (max: ${maxRow})`);
        
        // Trigger load more if near end
        if (newRowIndex > maxRow - 10 && hasMore && !loadingMore) {
          console.log(`📥 Próximo do fim, carregando mais produtos...`);
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
        if (!foundEditableCell && realRowIndex > 0) {
          newRowIndex = realRowIndex - 1;
          for (let col = maxCol; col >= 0; col--) {
            if (columns[col].editable) {
              newColIndex = col;
              break;
            }
          }
        }
        console.log(`⬅️ Esquerda: col ${colIndex} -> ${newColIndex}, row ${realRowIndex} -> ${newRowIndex}`);
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
        if (!foundEditableCell && realRowIndex < maxRow) {
          newRowIndex = realRowIndex + 1;
          for (let col = 0; col <= maxCol; col++) {
            if (columns[col].editable) {
              newColIndex = col;
              break;
            }
          }
        }
        console.log(`➡️ Direita: col ${colIndex} -> ${newColIndex}, row ${realRowIndex} -> ${newRowIndex}`);
        break;
      }
    }

    // Garantir que os índices estão dentro dos limites
    newRowIndex = Math.max(0, Math.min(maxRow, newRowIndex));
    newColIndex = Math.max(0, Math.min(maxCol, newColIndex));

    console.log(`✅ Novos índices finais: row=${newRowIndex}, col=${newColIndex}`);

    // Scroll automático apenas se a linha mudou
    if (newRowIndex !== realRowIndex) {
      const container = containerRef.current;
      if (container) {
        const targetY = newRowIndex * ITEM_HEIGHT;
        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + containerHeight;
        const padding = ITEM_HEIGHT * 2; // Padding extra para visibilidade

        console.log(`📺 Scroll check - targetY: ${targetY}, viewport: ${viewportTop}-${viewportBottom}`);

        if (targetY < viewportTop + padding || targetY + ITEM_HEIGHT > viewportBottom - padding) {
          const newScrollTop = Math.max(0, targetY - (containerHeight / 3));
          console.log(`🔄 Fazendo scroll para: ${newScrollTop}`);
          
          container.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }

    // Atualizar estado
    setCurrentCell({ rowIndex: newRowIndex, colIndex: newColIndex });

    // Atualizar produto selecionado
    if (newRowIndex >= 0 && newRowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[newRowIndex]);
      console.log(`🎯 Produto selecionado: ${filteredProdutos[newRowIndex]?.item_id} - ${filteredProdutos[newRowIndex]?.descricao}`);
    }
  }, [virtualizedData, filteredProdutos, columns, hasMore, loadingMore, fetchMoreProdutos, scrollTop, containerHeight, currentCell]);

  const handleRowMouseEnter = useCallback((produto, realRowIndex) => {
    setSelectedProduct(produto);
    setCurrentCell(prev => ({ ...prev, rowIndex: realRowIndex }));
  }, []);

  // Cell change handler
  const handleCellChange = useCallback(async (id, field, value) => {
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
        dadosParaEnviar[`estoque_pdv${lojaNumero}`] = value === '' ? 0 : parseInt(value, 10);
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
  }, [produtos, filteredProdutos, selectedProduct]);

  const getTabIndex = useCallback((virtualRowIndex, colIndex) => {
    const editableColIndex = colIndex > 0 ? colIndex : 0;
    return (virtualRowIndex * columns.length) + editableColIndex + 100;
  }, [columns.length]);

  const showNoMoreData = !hasMore && !loadingMore && filteredProdutos.length > 0;

  // Renderização
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
              <li>Total Items: {filteredProdutos.length}</li>
              <li>Visible Items: {virtualizedData.visibleItems.length}</li>
              <li>Scroll Top: {scrollTop}px</li>
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
            {/* Espaçador superior para simular linhas não renderizadas */}
            {virtualizedData.offsetY > 0 && (
              <tr style={{ height: `${virtualizedData.offsetY}px` }}>
                <td colSpan={columns.length} style={{ padding: 0, border: 'none' }} />
              </tr>
            )}

            {/* Renderizar apenas as linhas visíveis */}
            {virtualizedData.visibleItems.map((produto, virtualIndex) => {
              const realRowIndex = virtualizedData.startIndex + virtualIndex;
              const isHighlighted = currentCell.rowIndex === realRowIndex;

              return (
                <tr
                  key={`row-${produto.item_id}-${realRowIndex}`}
                  className={isHighlighted ? 'highlighted' : ''}
                  onMouseEnter={() => handleRowMouseEnter(produto, realRowIndex)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  {columns.map((column, colIndex) => {
                    // Valor bruto do objeto produto
                    const valorBruto = produto[column.id];
                    // Formatar o valor para exibição
                    const valorFormatado = formatarValor(valorBruto, column);
                    // O valor para edição deve ser sempre a representação string do valor bruto
                    const valorParaEdicao = (valorBruto !== undefined && valorBruto !== null)
                      ? String(valorBruto)
                      : '';

                    return (
                      <td
                        key={`${produto.item_id}-${column.id}-${realRowIndex}-${colIndex}`}
                        className={column.id === 'descricao' ? 'description-column' : ''}
                        style={{
                          position: 'relative',
                          padding: '0 !important',
                          height: '36px'
                        }}
                      >
                        {column.editable ? (
                          <EditableCell
                            id={`cell-${realRowIndex}-${colIndex}`}
                            value={valorParaEdicao}
                            displayValue={valorFormatado}
                            onSave={(value) => handleCellChange(produto.item_id, column.id, value)}
                            tabIndex={getTabIndex(virtualIndex, colIndex)}
                            onKeyNavigation={(direction, vIndex, cIndex) => {
                              handleKeyNavigation(direction, vIndex, cIndex);
                            }}
                            rowIndex={virtualIndex}
                            colIndex={colIndex}
                            columnType={column.type}
                            isFocused={currentCell.rowIndex === realRowIndex && currentCell.colIndex === colIndex}
                          />
                        ) : (
                          <div
                            tabIndex={getTabIndex(virtualIndex, colIndex)}
                            onFocus={() => {
                              setCurrentCell({ rowIndex: realRowIndex, colIndex });
                              setSelectedProduct(produto);
                            }}
                            onKeyDown={(e) => {
                              // Permitir navegação mesmo em células não editáveis
                              switch (e.key) {
                                case 'ArrowUp':
                                  e.preventDefault();
                                  handleKeyNavigation('up', virtualIndex, colIndex);
                                  break;
                                case 'ArrowDown':
                                  e.preventDefault();
                                  handleKeyNavigation('down', virtualIndex, colIndex);
                                  break;
                                case 'ArrowLeft':
                                  e.preventDefault();
                                  handleKeyNavigation('left', virtualIndex, colIndex);
                                  break;
                                case 'ArrowRight':
                                  e.preventDefault();
                                  handleKeyNavigation('right', virtualIndex, colIndex);
                                  break;
                                case 'Enter':
                                  e.preventDefault();
                                  setCurrentCell({ rowIndex: realRowIndex, colIndex });
                                  setSelectedProduct(produto);
                                  break;
                              }
                            }}
                            style={{
                              padding: '0.5rem 0.35rem',
                              outline: 'none',
                              cursor: 'pointer',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: (currentCell.rowIndex === realRowIndex && currentCell.colIndex === colIndex) ? 'var(--highlight-bg-color, #e0f7fa)' : 'transparent',
                              border: (currentCell.rowIndex === realRowIndex && currentCell.colIndex === colIndex) ? '1px solid var(--highlight-border-color, #00bcd4)' : '1px solid transparent'
                            }}
                          >
                            {valorFormatado}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Espaçador inferior para simular linhas não renderizadas */}
            {virtualizedData.endIndex < filteredProdutos.length && (
              <tr style={{ height: `${virtualizedData.totalHeight - virtualizedData.offsetY - (virtualizedData.visibleItems.length * ITEM_HEIGHT)}px` }}>
                <td colSpan={columns.length} style={{ padding: 0, border: 'none' }} />
              </tr>
            )}
          </tbody>
        </table>

        {/* Loading indicator */}
        <div
          ref={loadingRef}
          className="loading-more"
          style={{
            visibility: hasMore ? 'visible' : 'hidden',
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          {loadingMore ? 'Carregando mais produtos...' : ''}
        </div>

        {/* End of list indicator */}
        {showNoMoreData && (
          <div className="end-of-list">
            ✅ Todos os {filteredProdutos.length} produtos carregados.
            {window.location.hostname === 'localhost' && (
              <div style={{ fontSize: '0.8em', marginTop: '5px', color: '#666' }}>
                Performance: Renderizando apenas {virtualizedData.visibleItems.length} de {filteredProdutos.length} itens
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar com informações de virtualização em desenvolvimento */}
      <div className="status-bar">
        {selectedProduct ? (
          <>
            <span className="status-code">{selectedProduct.item_id}</span>
            <span className="status-description">{selectedProduct.descricao}</span>
            {window.location.hostname === 'localhost' && (
              <span style={{ fontSize: '0.8em', marginLeft: '10px', color: '#ccc' }}>
                [{virtualizedData.visibleItems.length}/{filteredProdutos.length}] Row: {currentCell.rowIndex}
              </span>
            )}
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