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

  const handleStartEdit = () => {
    if (selectedProduct) {
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedProduct && editValue !== selectedProduct.descricao) {
      onUpdateDescription(selectedProduct.item_id, editValue);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(selectedProduct?.descricao || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleSaveEdit();
        break;
      case 'Escape':
        e.preventDefault();
        handleCancelEdit();
        break;
    }
  };

  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleBlur = () => {
    // Aguardar um pouco antes de salvar para permitir cliques em outros elementos
    setTimeout(() => {
      if (isEditing) {
        handleSaveEdit();
      }
    }, 150);
  };

  if (!selectedProduct) {
    return (
      <div className="status-bar">
        <span className="status-empty">Nenhum produto selecionado</span>
      </div>
    );
  }

  return (
    <div className="status-bar">
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
          />
          <div className="status-edit-actions">
            <button 
              onClick={handleSaveEdit}
              className="status-edit-btn status-save-btn"
              title="Salvar (Enter)"
            >
              ✓
            </button>
            <button 
              onClick={handleCancelEdit}
              className="status-edit-btn status-cancel-btn"
              title="Cancelar (Esc)"
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
          title="Clique para editar a descrição"
        >
          {selectedProduct.descricao}
        </span>
      )}

      {/* Debug info para desenvolvimento */}
      {window.location.hostname === 'localhost' && (
        <span className="status-debug">
          [{virtualizedData?.visibleItems?.length || 0}/{filteredProdutos?.length || 0}] 
          Row: {currentCell?.rowIndex || 0}
        </span>
      )}
    </div>
  );
};

export default EditableStatusBar;