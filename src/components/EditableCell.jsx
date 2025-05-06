import React, { useState, useEffect, useRef, useCallback } from 'react';

const EditableCell = ({ 
  value, 
  onSave, 
  tabIndex, 
  onKeyNavigation, 
  rowIndex, 
  colIndex, 
  columnType = 'text',
  id
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [originalValue, setOriginalValue] = useState(value);
  const cellRef = useRef(null);
  const inputRef = useRef(null);

  // Atualiza os valores quando a prop mudar
  useEffect(() => {
    setInputValue(value);
    setOriginalValue(value);
  }, [value]);

  // Usar useCallback para prevenir re-renderizações desnecessárias
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (inputValue !== originalValue) {
      onSave(inputValue);
    }
  }, [inputValue, originalValue, onSave]);

  const handleKeyDown = useCallback((e) => {
    // Se estiver editando, lide com teclas específicas
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        if (inputValue !== originalValue) {
          onSave(inputValue);
        }
        // Move para a próxima linha, mesma coluna
        onKeyNavigation('down', rowIndex, colIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setInputValue(originalValue);
      }
      // Tab é tratado automaticamente pelo navegador
      return;
    }

    // Se não estiver editando, lide com navegação por setas
    // Otimizar chamadas de navegação - usar switch para performance
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onKeyNavigation('up', rowIndex, colIndex);
        break;
      case 'ArrowDown':
        e.preventDefault();
        onKeyNavigation('down', rowIndex, colIndex);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onKeyNavigation('left', rowIndex, colIndex);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onKeyNavigation('right', rowIndex, colIndex);
        break;
      case 'Enter':
        e.preventDefault();
        startEditing();
        break;
      default:
        // Se digitar qualquer caractere alfanumérico, inicie a edição
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          e.preventDefault();
          // IMPORTANTE: Preservar o valor atual e adicionar o novo caractere
          startEditing(null, value + e.key);
        }
        break;
    }
  }, [isEditing, inputValue, originalValue, onSave, onKeyNavigation, rowIndex, colIndex, value]);

  const startEditing = useCallback((_, initialValue = null) => {
    setIsEditing(true);
    
    // Se temos um valor inicial, use-o
    if (initialValue !== null) {
      setInputValue(initialValue);
    }
    
    // Focar no input e posicionar o cursor
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        
        // Se começamos com um novo valor, posicione o cursor no final
        if (initialValue !== null) {
          const length = initialValue.length;
          inputRef.current.setSelectionRange(length, length);
        } else {
          // Posicionar cursor no final do texto existente
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }
    });
  }, []);

  const handleClick = useCallback(() => {
    startEditing();
  }, [startEditing]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="cell-input"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        id={id}
        autoFocus
      />
    );
  }

  return (
    <div 
      ref={cellRef}
      className="editable-cell"
      onClick={handleClick}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      id={id}
      data-type={columnType}
      title="Use TAB ou setas para navegar. Digite para editar."
    >
      {value}
    </div>
  );
};

// Usar React.memo para prevenir re-renderizações desnecessárias
export default React.memo(EditableCell);