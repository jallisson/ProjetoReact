import React, { useState, useEffect, useRef, useCallback } from 'react';

const EditableCell = ({
  value, // Valor bruto para edição (usado para salvar e como original)
  displayValue, // Valor formatado para exibição (usado para mostrar na célula e no input ao editar)
  onSave,
  tabIndex,
  onKeyNavigation,
  rowIndex,
  colIndex,
  columnType = 'text',
  id,
  isFocused
}) => {
  const [isEditing, setIsEditing] = useState(false);
  // Inicializa inputValue com displayValue para que o valor formatado apareça ao editar
  const [inputValue, setInputValue] = useState(displayValue || '');
  const [originalValue, setOriginalValue] = useState(value || ''); // originalValue continua sendo o valor bruto
  const cellRef = useRef(null);
  const inputRef = useRef(null);

  // Atualizar valores quando as props mudarem
  useEffect(() => {
    // Quando 'value' muda (e portanto 'displayValue' também), atualiza ambos os estados
    setInputValue(displayValue || '');
    setOriginalValue(value || '');
  }, [value, displayValue]); // Dependências ajustadas

  // Gerencia o foco do elemento da célula quando ela se torna a célula atual
  useEffect(() => {
    if (isFocused && !isEditing) {
      if (cellRef.current) {
        cellRef.current.focus();
      }
    }
  }, [isFocused, isEditing]);

  // Salvar alterações - com tratamento de vírgulas brasileiras
  const saveChanges = useCallback(() => {
    // Comparar com o valor original bruto, não com o formatado
    if (inputValue !== (originalValue !== null && originalValue !== undefined ? String(originalValue) : '')) {
      let valueToSave = inputValue;

      // Para campos numéricos, converter vírgula para ponto antes de salvar
      if (columnType === 'number') {
        const cleanValue = inputValue.toString()
          .replace(/[^0-9,.\-]/g, '') // Remove tudo exceto dígitos, vírgula, ponto e sinal
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
    setInputValue(displayValue || ''); // Ao cancelar, volta para o valor formatado para exibição
    setIsEditing(false);
    if (cellRef.current) {
      cellRef.current.focus(); // Retorna o foco para a célula não editável
    }
  }, [displayValue]);

  // Iniciar edição
  const startEditing = useCallback((initialChar = null) => {
    setIsEditing(true);
    let newInputValue;

    // LÓGICA DE INICIALIZAÇÃO DE INPUT VALUE (CORRIGIDA)
    if (initialChar !== null && typeof initialChar === 'string') {
        // Se um caractere inicial foi digitado
        if (displayValue === null || displayValue === undefined || displayValue === '' || displayValue === '0') {
            // Se o displayValue for vazio ou zero, sobrescreve com o caractere digitado
            newInputValue = initialChar;
        } else {
            // Caso contrário, APENSA o caractere digitado ao displayValue
            newInputValue = displayValue + initialChar;
        }
    } else {
        // Se não houver caractere inicial (ex: Enter, duplo clique), usa o displayValue completo
        newInputValue = displayValue || '';
    }
    setInputValue(newInputValue);

    // Focar no input após o render e posicionar o cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Posicionar o cursor no final do texto
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  }, [displayValue]); // Dependência ajustada para displayValue

  // Handler para blur do input
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
  const handleClick = useCallback(() => {
    // Apenas foca na célula, não inicia edição com clique simples
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

  // Handler para keydown na célula (quando não está editando)
  const handleCellKeyDown = useCallback((e) => {
    if (isEditing) return; // Se já estiver editando, ignora

    console.log(`🎹 Tecla pressionada na célula: ${e.key}, row=${rowIndex}, col=${colIndex}`);

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault(); // Previne o comportamento padrão do navegador
        console.log(`🎯 Navegando ${e.key.replace('Arrow', '').toLowerCase()}`);
        onKeyNavigation(e.key.replace('Arrow', '').toLowerCase(), rowIndex, colIndex);
        break;
      case 'Enter':
        e.preventDefault();
        console.log(`⏎ Enter pressionado - iniciando edição`);
        startEditing(); // Inicia a edição com Enter
        break;
      case 'Tab':
        // Deixar o Tab funcionar naturalmente para navegar entre os elementos focusable
        console.log(`⭾ Tab pressionado`);
        break;
      default:
        // Se digitar qualquer caractere alfanumérico ou pontuação, iniciar edição
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            console.log(`🔤 Caractere digitado: ${e.key} - iniciando edição`);
            startEditing(e.key); // Inicia a edição e preenche com a letra digitada
        }
        break;
    }
  }, [isEditing, onKeyNavigation, rowIndex, colIndex, startEditing]);

  // Handler para keydown no input (quando está editando)
  const handleInputKeyDown = useCallback((e) => {
    console.log(`🎹 Tecla no input: ${e.key}`);
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        console.log(`⏎ Enter no input - salvando e navegando para baixo`);
        saveChanges();
        // Navegar para baixo após salvar
        setTimeout(() => {
          onKeyNavigation('down', rowIndex, colIndex);
        }, 0);
        break;
      case 'Escape':
        e.preventDefault();
        console.log(`⎋ Escape no input - cancelando edição`);
        cancelEditing();
        break;
      case 'Tab':
        // Tab salva e move para próxima célula
        console.log(`⭾ Tab no input - salvando`);
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
        value={inputValue} // Usa o valor que o usuário está digitando
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleInputKeyDown}
        tabIndex={tabIndex}
        id={id}
        type={columnType === 'number' ? 'text' : 'text'} // Manter como 'text' para permitir vírgulas e pontos
        autoFocus
        style={{
          textAlign: columnType === 'number' ? 'right' : 'left'
        }}
      />
    );
  }

  // Renderizar célula normal (não editando)
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
        zIndex: 1,
        // Adiciona estilo de destaque baseado no isFocused
        backgroundColor: isFocused ? 'var(--highlight-bg-color)' : 'transparent',
        border: isFocused ? '1px solid var(--highlight-border-color, #00bcd4)' : '1px solid transparent'
      }}
    >
      {displayValue || ""} {/* Exibe o valor formatado */}
    </div>
  );
};

export default React.memo(EditableCell);