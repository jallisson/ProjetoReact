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
  const [inputValue, setInputValue] = useState(value || '');
  const [originalValue, setOriginalValue] = useState(value || '');
  const cellRef = useRef(null);
  const inputRef = useRef(null);
  
  // Manter uma referência para as props para acessar valores atualizados em event handlers
  const propsRef = useRef({
    rowIndex,
    colIndex,
    onKeyNavigation
  });
  
  // Atualizar a referência sempre que as props mudarem
  useEffect(() => {
    propsRef.current = {
      rowIndex,
      colIndex,
      onKeyNavigation
    };
  }, [rowIndex, colIndex, onKeyNavigation]);

  // Atualiza os valores quando a prop mudar
  useEffect(() => {
    setInputValue(value || '');
    setOriginalValue(value || '');
  }, [value]);

  // Usar useCallback para prevenir re-renderizações desnecessárias
  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    
    setIsEditing(false);
    if (inputValue !== originalValue) {
      onSave(inputValue);
    }
  }, [inputValue, originalValue, onSave, isEditing]);

  // Otimização importante: usar um único event listener para keydown em vez de um callback para cada célula
  useEffect(() => {
    const currentRef = cellRef.current;
    
    const handleKeyDown = (e) => {
      const { rowIndex, colIndex, onKeyNavigation } = propsRef.current;
      
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
        } else if (e.key === 'Tab') {
          if (inputValue !== originalValue) {
            onSave(inputValue);
          }
        }
        // Tab é tratado automaticamente pelo navegador
        return;
      }

      // Se não estiver editando, lide com navegação por setas de forma otimizada
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
          if (!isEditing && /^[a-zA-Z0-9]$/.test(e.key)) {
            e.preventDefault();
            startEditing(null, (value || '') + e.key);
          }
          break;
      }
    };
    
    if (currentRef) {
      currentRef.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isEditing, inputValue, originalValue, onSave, value]);

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
    if (!isEditing) {
      startEditing();
    }
  }, [isEditing, startEditing]);

  const handleDoubleClick = useCallback(() => {
    // Garantir que o texto inteiro seja selecionado no double-click
    if (!isEditing) {
      startEditing();
      
      // Selecionar todo o texto
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.select();
        }
      });
    }
  }, [isEditing, startEditing]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  // Otimização: renderização condicional mais eficiente
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="cell-input"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        tabIndex={tabIndex}
        id={id}
        type={columnType === 'number' ? 'number' : 'text'}
        autoFocus
      />
    );
  }

  return (
    <div 
      ref={cellRef}
      className="editable-cell"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      tabIndex={tabIndex}
      id={id}
      data-type={columnType}
      title={value || "Clique para editar"}
    >
      {value || ""}
    </div>
  );
};

// Usar React.memo para prevenir re-renderizações desnecessárias
export default React.memo(EditableCell);