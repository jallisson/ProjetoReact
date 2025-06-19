// src/components/EditableStatusBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import './StatusBar.css';

const EditableStatusBar = ({ 
  selectedProduct, 
  onUpdateDescription, 
  currentCell, 
  filteredProdutos,
  virtualizedData 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Atualizar valor quando produto selecionado muda
  useEffect(() => {
    if (selectedProduct) {
      setEditValue(selectedProduct.descricao || '');
    }
  }, [selectedProduct]);

  // Focar no input quando entra em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Seleciona todo o texto
    }
  }, [isEditing]);

  // 🆕 FUNÇÃO CORRIGIDA: Retorna foco para a tabela
  const returnFocusToTable = () => {
    // Buscar a célula atual da tabela e retornar o foco
    setTimeout(() => {
      const currentCellElement = document.querySelector(`#cell-${currentCell.rowIndex}-${currentCell.colIndex}`);
      if (currentCellElement) {
        console.log(`🎯 Retornando foco para célula: row=${currentCell.rowIndex}, col=${currentCell.colIndex}`);
        currentCellElement.focus();
      } else {
        // Fallback: procurar qualquer célula editável visível
        const editableCells = document.querySelectorAll('.editable-cell');
        if (editableCells.length > 0) {
          console.log('🎯 Fallback: focando primeira célula editável');
          editableCells[0].focus();
        } else {
          // Último fallback: focar no container da tabela
          const tableContainer = document.querySelector('.fixed-table-container');
          if (tableContainer) {
            console.log('🎯 Último fallback: focando container da tabela');
            tableContainer.focus();
          }
        }
      }
    }, 100); // Pequeno delay para garantir que o DOM foi atualizado
  };

  const handleStartEdit = () => {
    if (selectedProduct) {
      console.log('📝 Iniciando edição da descrição no StatusBar');
      setIsEditing(true);
    }
  };

  // 🆕 FUNÇÃO CORRIGIDA: Salvar e retornar foco
  const handleSaveEdit = async () => {
    if (selectedProduct && editValue !== selectedProduct.descricao) {
      console.log(`💾 Salvando descrição: "${editValue}"`);
      
      try {
        await onUpdateDescription(selectedProduct.item_id, editValue);
        console.log('✅ Descrição salva com sucesso');
      } catch (error) {
        console.error('❌ Erro ao salvar descrição:', error);
      }
    }
    
    setIsEditing(false);
    
    // 🔧 CORREÇÃO: Retornar foco para a tabela
    returnFocusToTable();
  };

  // 🆕 FUNÇÃO CORRIGIDA: Cancelar e retornar foco
  const handleCancelEdit = () => {
    console.log('❌ Cancelando edição da descrição');
    setEditValue(selectedProduct?.descricao || '');
    setIsEditing(false);
    
    // 🔧 CORREÇÃO: Retornar foco para a tabela
    returnFocusToTable();
  };

  // 🆕 FUNÇÃO CORRIGIDA: KeyDown com melhor tratamento
  const handleKeyDown = (e) => {
    console.log(`🎹 Tecla pressionada no StatusBar: ${e.key}`);
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        console.log('⏎ Enter no StatusBar - salvando e retornando foco');
        handleSaveEdit();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        console.log('⎋ Escape no StatusBar - cancelando e retornando foco');
        handleCancelEdit();
        break;
      case 'Tab':
        // Permitir Tab normal, mas ainda salvar
        console.log('⭾ Tab no StatusBar - salvando');
        handleSaveEdit();
        break;
      default:
        // Para outras teclas, não fazer nada especial
        break;
    }
  };

  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  // 🆕 FUNÇÃO CORRIGIDA: Blur com delay para evitar conflitos
  const handleBlur = (e) => {
    // Verificar se o foco está indo para um dos botões de ação
    const relatedTarget = e.relatedTarget;
    const isActionButton = relatedTarget && (
      relatedTarget.classList.contains('status-save-btn') ||
      relatedTarget.classList.contains('status-cancel-btn')
    );
    
    if (isActionButton) {
      console.log('🎯 Foco indo para botão de ação - não salvando no blur');
      return;
    }
    
    // Aguardar um pouco antes de salvar para permitir cliques em outros elementos
    setTimeout(() => {
      if (isEditing) {
        console.log('💾 Salvando por blur');
        handleSaveEdit();
      }
    }, 150);
  };

  // 🆕 FUNÇÃO PARA PREVENIR PROPAGAÇÃO DE EVENTOS
  const handleContainerClick = (e) => {
    // Prevenir que cliques no StatusBar sejam capturados por outros handlers
    e.stopPropagation();
  };

  if (!selectedProduct) {
    return (
      <div className="status-bar" onClick={handleContainerClick}>
        <span className="status-empty">Nenhum produto selecionado</span>
      </div>
    );
  }

  return (
    <div className="status-bar" onClick={handleContainerClick}>
      <span className="status-code">{selectedProduct.item_id}</span>
      
      {isEditing ? (
        <div className="status-edit-container">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="status-edit-input"
            placeholder="Digite a descrição..."
            autoComplete="off"
          />
          <div className="status-edit-actions">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              className="status-edit-btn status-save-btn"
              title="Salvar (Enter)"
              tabIndex={-1} // Evitar foco via Tab
            >
              ✓
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              className="status-edit-btn status-cancel-btn"
              title="Cancelar (Esc)"
              tabIndex={-1} // Evitar foco via Tab
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <span 
          className="status-description editable"
          onClick={handleStartEdit}
          onDoubleClick={handleStartEdit}
          title="Clique para editar a descrição (F2 ou Ctrl+E)"
          tabIndex={0} // Permitir foco via Tab
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStartEdit();
            }
          }}
        >
          {selectedProduct.descricao}
        </span>
      )}

      {/* Debug info para desenvolvimento */}
      {window.location.hostname === 'localhost' && (
        <span className="status-debug">
          [{virtualizedData?.visibleItems?.length || 0}/{filteredProdutos?.length || 0}] 
          Row: {currentCell?.rowIndex || 0}, Col: {currentCell?.colIndex || 0}
          {isEditing ? ' [EDITANDO]' : ''}
        </span>
      )}
    </div>
  );
};

export default EditableStatusBar;