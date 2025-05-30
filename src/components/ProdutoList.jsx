import React, { useState, useEffect, useCallback, useRef } from 'react';
import EditableCell from './EditableCell';
import axios from 'axios';
import './StatusBar.css';

// Configuração simples da API
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://projetoreact-1.onrender.com';

axios.defaults.baseURL = API_URL;

const ProdutoList = ({ searchParams }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCell, setCurrentCell] = useState({ rowIndex: 0, colIndex: 1 });
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  // Estado para acompanhar o produto selecionado atualmente
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  // Função para buscar dados iniciais - CORRIGIDA

  const fetchInitialProdutos = useCallback(async () => {
    try {
      setLoading(true);
      setPage(1);

      const params = {
        page: 1,
        limit: 50, // Reduzindo para 50 inicialmente
        sort: 'asc'
      };

      let data = [];

      try {
        if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
          const searchTerm = searchParams.term;

          let response;
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

          if (response) {
            if (response.data.items) {
              data = response.data.items;
              console.log('Busca com filtro - Paginação:', response.data.pagination);
              setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
            } else if (Array.isArray(response.data)) {
              data = response.data;
              setHasMore(data.length >= params.limit);
            }
          } else {
            setHasMore(false);
          }
        } else {
          // Busca geral
          const response = await axios.get('/api/produtos', { params });
          console.log('Resposta da API (busca geral):', response.data);

          if (response.data.items) {
            data = response.data.items;
            console.log('Paginação inicial:', response.data.pagination);
            console.log(`Página atual: ${response.data.pagination.currentPage}, Total de páginas: ${response.data.pagination.totalPages}`);

            // Verificação mais robusta
            const currentPage = response.data.pagination.currentPage || 1;
            const totalPages = response.data.pagination.totalPages || 1;
            const totalItems = response.data.pagination.totalItems || 0;

            console.log(`Total de itens no banco: ${totalItems}`);
            setHasMore(currentPage < totalPages && totalItems > data.length);
          } else if (Array.isArray(response.data)) {
            data = response.data;
            console.log(`Recebido array direto com ${data.length} itens`);
            // Se recebeu um array direto, assumir que há mais se recebeu o limite completo
            setHasMore(data.length >= params.limit);
          } else {
            console.log('Formato de resposta não reconhecido:', response.data);
            setHasMore(false);
          }
        }
      } catch (error) {
        console.warn('Erro na API:', error);
        setHasMore(false);
        setError('Erro ao buscar dados. Por favor, tente novamente.');
      }

      console.log(`Carregamento inicial: ${data.length} produtos`);

      // Normalização de dados
      const produtosNormalizados = data.map(item => {
        const produto = {};

        produto.item_id = item.item_id || item.id || item.codigo || item.cod || '';
        produto.descricao = item.descricao || item.nome || '';
        produto.fornecedor_id = item.fornecedor_id || item.fornecedor || 0;
        produto.situacao = item.ativo || 'A';

        for (let i = 1; i <= 15; i++) {
          const lojaField = `loja${i}`;
          const value = parseFloat(item[lojaField] || item[`estoque_pdv${i}`] || 0);
          produto[lojaField] = value;
        }

        produto.custo_final = parseFloat(item.custo_final || item.custo_venda || item.custo || 0);

        for (let i = 1; i <= 4; i++) {
          const vendaField = `venda${i}`;
          produto[vendaField] = parseFloat(item[vendaField] || item[`valor_venda${i}`] || 0);
        }

        return produto;
      });

      setProdutos(produtosNormalizados);

      // Aplicar filtros locais e ordenação
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
        setHasMore(false); // Não permitir scroll infinito para filtros locais
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

  // Versão melhorada da função fetchMoreProdutos
  // Versão com diagnóstico da função fetchMoreProdutos

  const fetchMoreProdutos = useCallback(async () => {
    if (!hasMore || loadingMore) {
      console.log(`Não carregando mais: hasMore=${hasMore}, loadingMore=${loadingMore}`);
      return;
    }

    console.log(`Iniciando carregamento da página ${page + 1}`);

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      const params = {
        page: nextPage,
        limit: 50,
        sort: 'asc'
      };

      let data = [];

      try {
        // Para pesquisas que são feitas localmente (moto), não fazer scroll infinito
        if (searchParams.filter === 'moto' || searchParams.filter === 'codigo') {
          console.log('Filtro local detectado, parando scroll infinito');
          setHasMore(false);
          setLoadingMore(false);
          return;
        }

        let response;

        if (searchParams.term && searchParams.filter && searchParams.filter !== 'moto') {
          const searchTerm = searchParams.term;
          console.log(`Carregando mais resultados para pesquisa: ${searchTerm} (${searchParams.filter})`);

          if (searchParams.filter === 'descricao') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'descricao', modo: 'maior_igual' }
            });
          } else if (searchParams.filter === 'fornecedor') {
            response = await axios.get(`/api/produtos/search`, {
              params: { ...params, termo: searchTerm, campo: 'fornecedor_id', modo: 'exato' }
            });
          }
        } else {
          console.log('Carregando mais produtos gerais');
          response = await axios.get('/api/produtos', { params });
        }

        if (response && response.data) {
          console.log('Resposta da página', nextPage, ':', response.data);

          if (response.data.items) {
            data = response.data.items;
            console.log(`Página ${nextPage}: ${data.length} itens recebidos`);
            console.log('Paginação:', response.data.pagination);

            const currentPage = response.data.pagination.currentPage || nextPage;
            const totalPages = response.data.pagination.totalPages || 1;

            console.log(`Página atual: ${currentPage}, Total de páginas: ${totalPages}`);
            setHasMore(currentPage < totalPages);
          } else if (Array.isArray(response.data)) {
            data = response.data;
            console.log(`Array direto recebido: ${data.length} itens`);
            setHasMore(data.length >= params.limit);
          } else {
            console.log('Resposta vazia ou formato incorreto');
            setHasMore(false);
          }
        } else {
          console.log('Nenhuma resposta da API');
          setHasMore(false);
        }
      } catch (error) {
        console.warn('Erro na API ao carregar mais itens:', error);
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      // Se não recebeu dados, parar
      if (!data || data.length === 0) {
        console.log('Nenhum dado recebido, parando carregamento');
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      // Normalização dos dados
      const produtosNormalizados = data.map(item => {
        const produto = {};

        produto.item_id = item.item_id || item.id || item.codigo || item.cod || '';
        produto.descricao = item.descricao || item.nome || '';
        produto.fornecedor_id = item.fornecedor_id || item.fornecedor || 0;
        produto.situacao = item.ativo || 'A';

        for (let i = 1; i <= 15; i++) {
          const lojaField = `loja${i}`;
          const value = parseFloat(item[lojaField] || item[`estoque_pdv${i}`] || 0);
          produto[lojaField] = value;
        }

        produto.custo_final = parseFloat(item.custo_final || item.custo_venda || item.custo || 0);

        for (let i = 1; i <= 4; i++) {
          const vendaField = `venda${i}`;
          produto[vendaField] = parseFloat(item[vendaField] || item[`valor_venda${i}`] || 0);
        }

        return produto;
      });

      // Filtrar itens duplicados
      const produtosExistentesIds = new Set(produtos.map(p => p.item_id?.toString()));
      const novosProdutos = produtosNormalizados.filter(produto => {
        const id = produto.item_id?.toString();
        return id && !produtosExistentesIds.has(id);
      });

      console.log(`${data.length} itens recebidos, ${novosProdutos.length} novos produtos (${data.length - novosProdutos.length} duplicados)`);

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
        console.log(`Total de produtos agora: ${newProdutos.length}`);
      } else {
        console.log('Nenhum produto novo encontrado, parando carregamento');
        setHasMore(false);
      }

    } catch (err) {
      console.error('Erro ao carregar mais produtos:', err);
      setError('Erro ao carregar mais produtos.');
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, searchParams, produtos]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchInitialProdutos();
  }, [fetchInitialProdutos]);

  // Configure o scroll infinito - CORRIGIDO
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !loadingRef.current || !hasMore || loadingMore) return;

      const container = containerRef.current;
      const loading = loadingRef.current;

      // Melhor detecção: quando estiver próximo ao final
      const containerHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;

      // Aciona quando faltam 200px para o final
      const nearBottom = scrollTop + containerHeight >= scrollHeight - 200;

      if (nearBottom) {
        fetchMoreProdutos();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });

      // Também verificar imediatamente após carregar
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

  // Função para atualizar o produto selecionado quando a célula atual muda
  useEffect(() => {
    if (filteredProdutos.length > 0 && currentCell.rowIndex >= 0 && currentCell.rowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[currentCell.rowIndex]);
    }
  }, [currentCell, filteredProdutos]);

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

    // Atualiza o produto selecionado mostrado na barra de status
    if (newRowIndex >= 0 && newRowIndex < filteredProdutos.length) {
      setSelectedProduct(filteredProdutos[newRowIndex]);
    }

    // Foco imediato para uma experiência mais responsiva
    setTimeout(() => {
      const cellId = `cell-${newRowIndex}-${newColIndex}`;
      const cell = document.getElementById(cellId);
      if (cell) cell.focus();
    }, 0);
  };

  // Função para lidar com o hover do mouse nas linhas e atualizar o produto selecionado
  const handleRowMouseEnter = (produto) => {
    setSelectedProduct(produto);
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

      // Se o produto atualizado é o que está selecionado, atualize-o também
      if (selectedProduct && selectedProduct.item_id.toString() === id.toString()) {
        setSelectedProduct(produtoAtualizado);
      }

      // Prepara dados para enviar ao backend com mapeamento correto dos campos
      const dadosParaEnviar = {};

      // Mapear situacao para ativo
      if (field === 'situacao') {
        dadosParaEnviar.ativo = value === '' ? 'A' : value;
      }
      // Mapear campos de loja para estoque_pdvX
      else if (field.startsWith('loja')) {
        const lojaNumero = field.replace('loja', '');
        dadosParaEnviar[`estoque_pdv${lojaNumero}`] = value === '' ? 0 : parseFloat(value);
      }
      // Mapear preços de venda
      else if (field.startsWith('venda')) {
        const vendaNumero = field.replace('venda', '');
        dadosParaEnviar[`valor_venda${vendaNumero}`] = value === '' ? 0 : parseFloat(value);
      }
      // Mapear custo final
      else if (field === 'custo_final') {
        dadosParaEnviar.custo_venda = value === '' ? 0 : parseFloat(value);
      }
      // Outros campos
      else {
        dadosParaEnviar[field] = value;
      }

      // Garantir que campos numéricos não sejam strings vazias
      if (typeof dadosParaEnviar[field] === 'string' && dadosParaEnviar[field] === '' &&
        columns.find(col => col.id === field)?.type === 'number') {
        dadosParaEnviar[field] = 0;
      }

      // Tenta enviar atualização para o backend
      try {
        await axios.put(`/api/produtos/${id}`, dadosParaEnviar);
        console.log(`Produto ${id} atualizado com sucesso:`, dadosParaEnviar);
      } catch (error) {
        console.error('Erro ao atualizar na API:', error);
        setError(`Erro ao atualizar o produto: ${error.message}`);

        // Reverter mudanças locais em caso de erro
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
                className={currentCell.rowIndex === rowIndex ? 'highlighted' : ''}
                onMouseEnter={() => handleRowMouseEnter(produto)}
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

      {/* Barra de status no rodapé */}
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