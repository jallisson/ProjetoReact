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

  // Atualizar valores quando a prop mudar
  useEffect(() => {
    setInputValue(value || '');
    setOriginalValue(value || '');
  }, [value]);

  // Salvar alterações - com tratamento de vírgulas brasileiras
  const saveChanges = useCallback(() => {
    if (inputValue !== originalValue) {
      let valueToSave = inputValue;
      
      // Para campos numéricos, converter vírgula para ponto
      if (columnType === 'number') {
        // Limpar formatação e converter vírgula para ponto
        const cleanValue = inputValue.toString()
          .replace(/[^\d,.\-]/g, '') // Remove tudo exceto dígitos, vírgula, ponto e sinal
          .replace(',', '.'); // Substitui vírgula por ponto
        
        const numValue = parseFloat(cleanValue);
        valueToSave = isNaN(numValue) ? 0 : numValue;
      }
      
      onSave(valueToSave);
    }
    setIsEditing(false);
  }, [inputValue, originalValue, onSave, columnType]);

  // Cancelar edição
  const cancelEditing = useCallback(() => {
    setInputValue(originalValue);
    setIsEditing(false);
    if (cellRef.current) {
      cellRef.current.focus();
    }
  }, [originalValue]);

  // Iniciar edição
  const startEditing = useCallback((initialValue = null) => {
    setIsEditing(true);
    
    if (initialValue !== null) {
      setInputValue(initialValue);
    }
    
    // Focar no input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (initialValue !== null) {
          const length = initialValue.length;
          inputRef.current.setSelectionRange(length, length);
        } else {
          inputRef.current.select();
        }
      }
    }, 0);
  }, []);

  // Handler para blur do input - SIMPLIFICADO
  const handleBlur = useCallback(() => {
    if (isEditing) {
      saveChanges();
    }
  }, [isEditing, saveChanges]);

  // Handler para mudanças no input
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  // Handler para clique simples
  const handleClick = useCallback((e) => {
    if (cellRef.current && !isEditing) {
      cellRef.current.focus();
    }
  }, [isEditing]);

  // Handler para duplo clique
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) {
      startEditing();
    }
  }, [isEditing, startEditing]);

  // Handler para keydown na célula
  const handleCellKeyDown = useCallback((e) => {
    if (isEditing) return;

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
      case 'Tab':
        // Deixar Tab funcionar naturalmente
        break;
      default:
        // Se digitar qualquer caractere alfanumérico, iniciar edição
        if (/^[a-zA-Z0-9\s]$/.test(e.key)) {
          e.preventDefault();
          startEditing(e.key);
        }
        break;
    }
  }, [isEditing, onKeyNavigation, rowIndex, colIndex, startEditing]);

  // Handler para keydown no input
  const handleInputKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveChanges();
        // Navegar para baixo após salvar
        setTimeout(() => {
          onKeyNavigation('down', rowIndex, colIndex);
        }, 0);
        break;
      case 'Escape':
        e.preventDefault();
        cancelEditing();
        break;
      case 'Tab':
        // Tab salva e move para próxima célula
        saveChanges();
        break;
    }
  }, [saveChanges, cancelEditing, onKeyNavigation, rowIndex, colIndex]);

  // Renderizar input se estiver editando
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="cell-input"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleInputKeyDown}
        tabIndex={tabIndex}
        id={id}
        type="text" // Usar text para permitir vírgulas
        autoFocus
        style={{
          textAlign: columnType === 'number' ? 'right' : 'left'
        }}
      />
    );
  }

  // Renderizar célula normal
  return (
    <div 
      ref={cellRef}
      className="editable-cell"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleCellKeyDown}
      tabIndex={tabIndex}
      id={id}
      data-type={columnType}
      title="Duplo clique ou Enter para editar"
      style={{
        cursor: 'pointer',
        userSelect: 'text',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 1
      }}
    >
      {value || ""}
    </div>
  );
};

export default React.memo(EditableCell);