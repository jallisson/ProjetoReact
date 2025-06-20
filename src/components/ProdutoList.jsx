import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import EditableCell from './EditableCell';
import EditableStatusBar from './EditableStatusBar';
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

  // Railway (aplicação única)
  if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
    console.log('🚂 Ambiente: PRODUÇÃO (Railway - App única)');
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
const ITEM_HEIGHT = 36;
const BUFFER_SIZE = 5;
const OVERSCAN = 3;

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

  // Definir colunas da tabela
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

  // 🆕 NOVA FUNÇÃO: Atualizar descrição via StatusBar
  const handleUpdateDescription = useCallback(async (productId, newDescription) => {
    try {
      console.log(`📝 Atualizando descrição via StatusBar: ${productId} -> "${newDescription}"`);

      const produtoIndex = produtos.findIndex(p =>
        (p.item_id?.toString() || p.id?.toString()) === productId.toString()
      );

      if (produtoIndex === -1) {
        console.error('❌ Produto não encontrado para atualização');
        return;
      }

      const produtoAtualizado = { ...produtos[produtoIndex], descricao: newDescription };

      // Atualização otimista
      const produtosAtualizados = [...produtos];
      produtosAtualizados[produtoIndex] = produtoAtualizado;
      setProdutos(produtosAtualizados);

      const filteredIndex = filteredProdutos.findIndex(p =>
        (p.item_id?.toString() || p.id?.toString()) === productId.toString()
      );

      if (filteredIndex !== -1) {
        const filteredAtualizados = [...filteredProdutos];
        filteredAtualizados[filteredIndex] = produtoAtualizado;
        setFilteredProdutos(filteredAtualizados);
      }

      if (selectedProduct && selectedProduct.item_id.toString() === productId.toString()) {
        setSelectedProduct(produtoAtualizado);
      }

      try {
        await axios.put(`/api/produtos/${productId}`, {
          descricao: newDescription
        }, { timeout: 10000 });

        console.log(`✅ Descrição atualizada com sucesso via StatusBar`);
        setError(null);

      } catch (apiError) {
        console.error('❌ Erro ao atualizar descrição na API:', apiError);
        setError(`Erro ao atualizar descrição: ${apiError.message}`);

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

        if (selectedProduct && selectedProduct.item_id.toString() === productId.toString()) {
          setSelectedProduct(produtos[produtoIndex]);
        }
      }

    } catch (err) {
      console.error('❌ Erro crítico ao atualizar descrição:', err);
      setError('Erro ao atualizar a descrição. Tente novamente.');
    }
  }, [produtos, filteredProdutos, selectedProduct]);

  // 🆕 NOVA FUNÇÃO: Atalhos de teclado globais
  // Fragmento para substituir a função handleGlobalKeyDown no ProdutoList.jsx

  // 🆕 NOVA FUNÇÃO: Atalhos de teclado globais CORRIGIDA
  const handleGlobalKeyDown = useCallback((e) => {
    // Verificar se estamos editando no StatusBar
    const isEditingStatusBar = document.querySelector('.status-edit-input');
    const isEditingCell = document.querySelector('.cell-input');

    // Se estiver editando em qualquer lugar, não processar atalhos globais
    if (isEditingStatusBar || isEditingCell) {
      console.log('🚫 Ignorando atalho global - editando em:', isEditingStatusBar ? 'StatusBar' : 'Célula');
      return;
    }

    // Verificar se o foco está em um input ou textarea
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    )) {
      console.log('🚫 Ignorando atalho global - foco em input/textarea');
      return;
    }

    // F2 para editar descrição na StatusBar
    if (e.key === 'F2' && selectedProduct) {
      e.preventDefault();
      console.log('🎹 F2 pressionado - editando descrição');
      const statusBarDescriptionElement = document.querySelector('.status-description.editable');
      if (statusBarDescriptionElement) {
        statusBarDescriptionElement.click();
      }
      return;
    }

    // Ctrl+E para editar descrição (alternativa ao F2)
    if (e.ctrlKey && e.key === 'e' && selectedProduct) {
      e.preventDefault();
      console.log('🎹 Ctrl+E pressionado - editando descrição');
      const statusBarDescriptionElement = document.querySelector('.status-description.editable');
      if (statusBarDescriptionElement) {
        statusBarDescriptionElement.click();
      }
      return;
    }

    // Home - ir para o primeiro produto
    if (e.key === 'Home' && filteredProdutos.length > 0) {
      e.preventDefault();
      console.log('🎹 Home pressionado - indo para primeiro produto');
      setCurrentCell({ rowIndex: 0, colIndex: currentCell.colIndex });
      setSelectedProduct(filteredProdutos[0]);

      // Scroll para o topo
      const container = containerRef.current;
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // End - ir para o último produto
    if (e.key === 'End' && filteredProdutos.length > 0) {
      e.preventDefault();
      const lastIndex = filteredProdutos.length - 1;
      console.log(`🎹 End pressionado - indo para último produto (${lastIndex})`);
      setCurrentCell({ rowIndex: lastIndex, colIndex: currentCell.colIndex });
      setSelectedProduct(filteredProdutos[lastIndex]);

      // Scroll para o final
      const container = containerRef.current;
      if (container) {
        const targetY = lastIndex * ITEM_HEIGHT;
        container.scrollTo({ top: targetY, behavior: 'smooth' });
      }
      return;
    }

    // Page Up - subir uma "página"
    if (e.key === 'PageUp' && filteredProdutos.length > 0) {
      e.preventDefault();
      const pageSize = Math.floor(containerHeight / ITEM_HEIGHT) || 10;
      const newIndex = Math.max(0, currentCell.rowIndex - pageSize);
      console.log(`🎹 PageUp pressionado - subindo ${pageSize} linhas para ${newIndex}`);

      setCurrentCell({ rowIndex: newIndex, colIndex: currentCell.colIndex });
      setSelectedProduct(filteredProdutos[newIndex]);

      const container = containerRef.current;
      if (container) {
        const targetY = newIndex * ITEM_HEIGHT;
        container.scrollTo({ top: targetY, behavior: 'smooth' });
      }
      return;
    }

    // Page Down - descer uma "página"
    if (e.key === 'PageDown' && filteredProdutos.length > 0) {
      e.preventDefault();
      const pageSize = Math.floor(containerHeight / ITEM_HEIGHT) || 10;
      const newIndex = Math.min(filteredProdutos.length - 1, currentCell.rowIndex + pageSize);
      console.log(`🎹 PageDown pressionado - descendo ${pageSize} linhas para ${newIndex}`);

      setCurrentCell({ rowIndex: newIndex, colIndex: currentCell.colIndex });
      setSelectedProduct(filteredProdutos[newIndex]);

      const container = containerRef.current;
      if (container) {
        const targetY = newIndex * ITEM_HEIGHT;
        container.scrollTo({ top: targetY, behavior: 'smooth' });
      }
      return;
    }

    // Ctrl+F - focar na barra de pesquisa
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      console.log('🎹 Ctrl+F pressionado - focando barra de pesquisa');
      const searchInput = document.querySelector('#search-term');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // Escape - garantir que voltamos para a tabela
    if (e.key === 'Escape') {
      console.log('🎹 Escape pressionado - retornando foco para tabela');
      const currentCellElement = document.querySelector(`#cell-${currentCell.rowIndex}-${currentCell.colIndex}`);
      if (currentCellElement) {
        currentCellElement.focus();
      }
      return;
    }

  }, [selectedProduct, filteredProdutos, currentCell, containerHeight, containerRef]);

  // 🆕 FUNÇÃO AUXILIAR: Garantir foco na tabela
  const ensureTableFocus = useCallback(() => {
    setTimeout(() => {
      const currentCellElement = document.querySelector(`#cell-${currentCell.rowIndex}-${currentCell.colIndex}`);
      if (currentCellElement) {
        console.log(`🎯 Garantindo foco na célula: row=${currentCell.rowIndex}, col=${currentCell.colIndex}`);
        currentCellElement.focus();
      } else {
        // Fallback
        const editableCells = document.querySelectorAll('.editable-cell');
        if (editableCells.length > 0) {
          console.log('🎯 Fallback: focando primeira célula editável');
          editableCells[0].focus();
        }
      }
    }, 100);
  }, [currentCell]);

  // Exportar a função para uso em outras partes do componente se necessário
  window.ensureTableFocus = ensureTableFocus;

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
    console.log('📋 Total de itens recebidos:', backendItems.length);

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

    console.log('✅ Normalização concluída:', normalized.length, 'produtos');
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
        limit: 1000,
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
        setError(`Erro na API: ${apiError.message}`);
        setLoading(false);
        return;
      }

      if (!response || !response.data) {
        setError('API retornou resposta vazia');
        setLoading(false);
        return;
      }

      let data = [];
      let paginationInfo = null;
      let initialHasMore = false;

      if (response.data.items && Array.isArray(response.data.items)) {
        data = response.data.items;
        paginationInfo = response.data.pagination;
        console.log(`✅ ${data.length} produtos recebidos da página 1`);

        if (paginationInfo) {
          console.log(`📊 Total de itens: ${paginationInfo.totalItems}`);
          console.log(`📄 Página ${paginationInfo.currentPage} de ${paginationInfo.totalPages}`);
          console.log(`🔄 Há mais páginas? ${paginationInfo.hasNextPage ? 'SIM' : 'NÃO'}`);

          initialHasMore = paginationInfo.hasNextPage === true;
        } else {
          initialHasMore = data.length >= params.limit;
        }
      } else if (Array.isArray(response.data)) {
        data = response.data;
        console.log(`✅ ${data.length} produtos recebidos via array direto`);
        initialHasMore = data.length >= params.limit;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum produto retornado pela API');
        setProdutos([]);
        setFilteredProdutos([]);
        setError('Nenhum produto encontrado.');
        setLoading(false);
        return;
      }

      const produtosNormalizados = normalizeProductData(data);
      console.log(`🎯 ${produtosNormalizados.length} produtos normalizados na primeira página`);

      setProdutos(produtosNormalizados);

      if (searchParams.filter === 'moto' && searchParams.term) {
        console.log('🏍️ Aplicando apenas ordenação para filtro moto');
        const sortedProdutos = [...produtosNormalizados].sort((a, b) =>
          a.descricao.localeCompare(b.descricao, 'pt-BR')
        );
        setFilteredProdutos(sortedProdutos);
        setHasMore(false);
      } else if (searchParams.filter === 'descricao' && searchParams.term) {
        console.log('📝 Usando ordem do backend (já ordenado alfabeticamente)');
        setFilteredProdutos(produtosNormalizados);
        setHasMore(initialHasMore);
      } else {
        console.log('📋 Usando dados como recebidos da API (sem filtração adicional)');
        setFilteredProdutos(produtosNormalizados);
        setHasMore(initialHasMore);
      }

      if (produtosNormalizados.length > 0) {
        setSelectedProduct(produtosNormalizados[0]);
      }

      console.log(`✅ Primeira página carregada. hasMore: ${initialHasMore ? 'SIM' : 'NÃO'}`);
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
      console.log(`🛑 Não carregando mais: hasMore=${hasMore}, loadingMore=${loadingMore}`);
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

      if (searchParams.filter === 'moto' || searchParams.filter === 'codigo') {
        console.log('🏍️ Filtro moto/codigo - desabilitando scroll infinito');
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      let response;

      if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
        const searchTerm = searchParams.term;
        console.log(`🔎 Carregando mais resultados para: ${searchParams.filter} = "${searchTerm}"`);

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
        console.log(`📦 Carregando mais produtos gerais (página ${nextPage})...`);
        response = await axios.get('/api/produtos', {
          params,
          timeout: 15000
        });
      }

      let data = [];
      let paginationInfo = null;

      if (response && response.data) {
        if (response.data.items) {
          data = response.data.items;
          paginationInfo = response.data.pagination;

          console.log(`📦 Página ${nextPage}: ${data.length} produtos recebidos`);

          if (paginationInfo) {
            console.log(`📊 Total: ${paginationInfo.totalItems}, Página ${paginationInfo.currentPage}/${paginationInfo.totalPages}`);
            console.log(`🔄 Há próxima página? ${paginationInfo.hasNextPage ? 'SIM' : 'NÃO'}`);

            const temProximaPagina = paginationInfo.hasNextPage === true && paginationInfo.currentPage < paginationInfo.totalPages;
            console.log(`🎯 DECISÃO hasMore: ${temProximaPagina ? 'SIM' : 'NÃO'}`);
            setHasMore(temProximaPagina);
          } else {
            const temMais = data.length >= params.limit;
            console.log(`🎯 DECISÃO hasMore (fallback): ${temMais ? 'SIM' : 'NÃO'}`);
            setHasMore(temMais);
          }
        } else if (Array.isArray(response.data)) {
          data = response.data;
          const temMais = data.length >= params.limit;
          console.log(`🎯 DECISÃO hasMore (array): ${temMais ? 'SIM' : 'NÃO'}`);
          setHasMore(temMais);
        }
      }

      if (!data || data.length === 0) {
        console.log('📄 Última página alcançada - sem mais produtos');
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const produtosNormalizados = normalizeProductData(data);

      // Evitar duplicatas
      const produtosExistentesIds = new Set(produtos.map(p => p.item_id?.toString()));
      const novosProdutos = produtosNormalizados.filter(produto => {
        const id = produto.item_id?.toString();
        return id && !produtosExistentesIds.has(id);
      });

      if (novosProdutos.length > 0) {
        const newProdutos = [...produtos, ...novosProdutos];
        setProdutos(newProdutos);

        if (searchParams.filter === 'descricao' && searchParams.term) {
          console.log('📝 Mantendo ordem do backend para novos produtos');
          setFilteredProdutos(newProdutos);
        } else {
          setFilteredProdutos(newProdutos);
        }

        setPage(nextPage);
        console.log(`✅ ${novosProdutos.length} novos produtos adicionados. Total: ${newProdutos.length}`);
      } else {
        console.log('🚫 Nenhum produto novo encontrado (duplicatas) - parando scroll infinito');
        setHasMore(false);
      }

    } catch (err) {
      console.error('❌ Erro ao carregar mais produtos:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, searchParams, produtos]);

  // Effects
  useEffect(() => {
    fetchInitialProdutos();
  }, [fetchInitialProdutos]);

  // 🆕 Effect para atalhos de teclado globais
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

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

  useEffect(() => {
    if (filteredProdutos.length > 0 && currentCell.rowIndex >= 0 && currentCell.rowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[currentCell.rowIndex]);
    }
  }, [currentCell, filteredProdutos]);

  useEffect(() => {
    if (filteredProdutos.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProdutos[0]);
      setCurrentCell({ rowIndex: 0, colIndex: 1 });
    }
  }, [filteredProdutos, selectedProduct]);

  // 🆕 SISTEMA DE NAVEGAÇÃO POR TECLADO
  useEffect(() => {
    let isKeyboardActive = false;
    let mouseTimeout = null;

    const enableKeyboardMode = () => {
      if (!isKeyboardActive) {
        isKeyboardActive = true;
        document.body.classList.add('keyboard-navigation-active');
        document.body.classList.add('mouse-disabled');
        console.log('🎹 Navegação por teclado ativa - Mouse desabilitado');
      }
    };

    const disableKeyboardMode = () => {
      if (isKeyboardActive) {
        isKeyboardActive = false;
        document.body.classList.remove('keyboard-navigation-active');
        document.body.classList.remove('mouse-disabled');
        console.log('🖱️ Mouse reabilitado');
      }
    };

    const handleKeyDown = (e) => {
      // Teclas que ativam modo teclado
      const navigationKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Tab', 'Enter', 'Home', 'End', 'PageUp', 'PageDown',
        'F2', 'Escape'
      ];

      // Verificar se é tecla de navegação ou atalho
      if (navigationKeys.includes(e.key) || (e.ctrlKey && e.key === 'e')) {
        enableKeyboardMode();
      }
    };

    const handleMouseMove = () => {
      // Debounce para evitar ativações desnecessárias
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        disableKeyboardMode();
      }, 100);
    };

    const handleMouseClick = () => {
      // Desativar imediatamente no clique
      disableKeyboardMode();
    };

    // Adicionar listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseClick, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseClick, true);
      clearTimeout(mouseTimeout);

      // Remover classes ao desmontar componente
      document.body.classList.remove('keyboard-navigation-active');
      document.body.classList.remove('mouse-disabled');
    };
  }, []);

  // Navegação por teclado
  const handleKeyNavigation = useCallback((direction, virtualRowIndex, colIndex) => {
    console.log(`🎯 Navegação: ${direction}, virtualRow: ${virtualRowIndex}, col: ${colIndex}`);

    const realRowIndex = virtualRowIndex + virtualizedData.startIndex;
    const maxRow = filteredProdutos.length - 1;
    const maxCol = columns.length - 1;

    let newRowIndex = realRowIndex;
    let newColIndex = colIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, realRowIndex - 1);
        break;

      case 'down':
        newRowIndex = Math.min(maxRow, realRowIndex + 1);

        if (newRowIndex > maxRow - 10 && hasMore && !loadingMore) {
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
        break;
      }
    }

    // Garantir que os índices estão dentro dos limites
    newRowIndex = Math.max(0, Math.min(maxRow, newRowIndex));
    newColIndex = Math.max(0, Math.min(maxCol, newColIndex));

    // Scroll automático apenas se a linha mudou
    if (newRowIndex !== realRowIndex) {
      const container = containerRef.current;
      if (container) {
        const targetY = newRowIndex * ITEM_HEIGHT;
        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + containerHeight;
        const padding = ITEM_HEIGHT * 2;

        if (targetY < viewportTop + padding || targetY + ITEM_HEIGHT > viewportBottom - padding) {
          const newScrollTop = Math.max(0, targetY - (containerHeight / 3));

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
    }
  }, [virtualizedData, filteredProdutos, columns, hasMore, loadingMore, fetchMoreProdutos, scrollTop, containerHeight]);

  // Versão mais robusta que sempre garante uma coluna editável
  const handleRowMouseEnter = useCallback((produto, realRowIndex) => {
    setSelectedProduct(produto);
    // Não atualizar currentCell aqui - deixar para os handlers individuais das células
  }, []);

  // 2. ADICIONAR esta nova função para células individuais:

  const handleCellMouseEnter = useCallback((produto, realRowIndex, colIndex) => {
    setSelectedProduct(produto);
    setCurrentCell({
      rowIndex: realRowIndex,
      colIndex: colIndex
    });
  }, []);

  // 🆕 FUNÇÃO ATUALIZADA: Cell change handler com sincronização StatusBar
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

      // 🆕 SINCRONIZAR COM STATUSBAR
      if (selectedProduct && selectedProduct.item_id.toString() === id.toString()) {
        setSelectedProduct(produtoAtualizado);
        if (field === 'descricao') {
          console.log(`📝 Descrição sincronizada na StatusBar: "${value}"`);
        }
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
                    const valorBruto = produto[column.id];
                    const valorFormatado = formatarValor(valorBruto, column);
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
                        // 🆕 ADICIONAR este handler para cada célula
                        onMouseEnter={() => handleCellMouseEnter(produto, realRowIndex, colIndex)}
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
                            // 🆕 ADICIONAR também aqui para células não editáveis
                            onMouseEnter={() => handleCellMouseEnter(produto, realRowIndex, colIndex)}
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

            {/* Espaçador inferior */}
            {virtualizedData.endIndex < filteredProdutos.length && (
              <tr style={{ height: `${virtualizedData.totalHeight - virtualizedData.offsetY - (virtualizedData.visibleItems.length * ITEM_HEIGHT)}px` }}>
                <td colSpan={columns.length} style={{ padding: 0, border: 'none' }} />
              </tr>
            )}
          </tbody>
        </table>

        {/* Loading indicator */}
        {(hasMore && loadingMore) && (
          <div
            ref={loadingRef}
            className="loading-more"
            style={{
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
            Carregando mais produtos...
          </div>
        )}

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

      {/* 🆕 NOVA STATUS BAR EDITÁVEL */}
      <EditableStatusBar
        selectedProduct={selectedProduct}
        onUpdateDescription={handleUpdateDescription}
        currentCell={currentCell}
        filteredProdutos={filteredProdutos}
        virtualizedData={virtualizedData}
      />

      {/* Debug Helper - só aparece em desenvolvimento */}
      {window.location.hostname === 'localhost' && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          zIndex: 1001,
          maxWidth: '200px',
          lineHeight: '1.3'
        }}>
          💡 <strong>Atalhos StatusBar:</strong><br />
          🖱️ Clique na descrição<br />
          ⌨️ F2 = Editar descrição<br />
          ⌨️ Ctrl+E = Editar descrição<br />
          ⏎ Enter = Salvar<br />
          ⎋ Esc = Cancelar
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </>
  );
};

export default ProdutoList;