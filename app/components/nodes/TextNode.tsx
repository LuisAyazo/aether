import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow, NodeProps, NodeResizer } from 'reactflow';
import '@reactflow/node-resizer/dist/style.css';

interface TextNodeData {
  text: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
}

const colorOptions = [
  { name: 'Negro', value: '#000000' },
  { name: 'Gris Oscuro', value: '#374151' },
  { name: 'Gris', value: '#6B7280' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Naranja', value: '#F59E0B' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Morado', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Blanco', value: '#FFFFFF' },
];

const TextNode: React.FC<NodeProps<TextNodeData>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const [fontWeight, setFontWeight] = useState(data.fontWeight || 'normal');
  const [textAlign, setTextAlign] = useState(data.textAlign || 'left');
  const [textColor, setTextColor] = useState(data.textColor || '#000000');
  const [showToolbar, setShowToolbar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reactFlow = useReactFlow();

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handleTextSubmit = useCallback(() => {
    setIsEditing(false);
    
    // Update node data
    reactFlow.setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                text,
                fontWeight,
                textAlign,
                textColor,
              },
            }
          : node
      )
    );
  }, [id, text, fontWeight, textAlign, textColor, reactFlow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    }
  }, [handleTextSubmit, data.text]);

  const toggleBold = useCallback(() => {
    setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold');
  }, [fontWeight]);

  const setAlignment = useCallback((align: 'left' | 'center' | 'right') => {
    setTextAlign(align);
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const containerStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px',
    margin: '0',
    minWidth: '100px',
    minHeight: '40px',
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    cursor: isEditing ? 'text' : selected ? 'move' : 'default',
    outline: selected ? '2px solid #3b82f6' : 'none',
    outlineOffset: '2px',
    pointerEvents: 'auto' as const,
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      className="text-node"
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={40}
        lineStyle={{
          borderColor: '#3b82f6',
          borderWidth: 2,
        }}
        handleStyle={{
          backgroundColor: '#3b82f6',
          width: '8px',
          height: '8px',
          border: '2px solid white',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 1,
          zIndex: 10,
        }}
      />

      {/* Horizontal Toolbar */}
      {(selected || showToolbar) && (
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 1000,
            fontSize: '14px',
          }}
        >
          {/* Bold Toggle */}
          <button
            onClick={toggleBold}
            style={{
              padding: '4px 8px',
              backgroundColor: fontWeight === 'bold' ? '#3b82f6' : 'transparent',
              color: fontWeight === 'bold' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Negrita"
          >
            B
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

          {/* Text Alignment */}
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => setAlignment('left')}
              style={{
                padding: '4px 6px',
                backgroundColor: textAlign === 'left' ? '#3b82f6' : 'transparent',
                color: textAlign === 'left' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Alinear izquierda"
            >
              ⟵
            </button>
            <button
              onClick={() => setAlignment('center')}
              style={{
                padding: '4px 6px',
                backgroundColor: textAlign === 'center' ? '#3b82f6' : 'transparent',
                color: textAlign === 'center' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Centrar"
            >
              ⟷
            </button>
            <button
              onClick={() => setAlignment('right')}
              style={{
                padding: '4px 6px',
                backgroundColor: textAlign === 'right' ? '#3b82f6' : 'transparent',
                color: textAlign === 'right' ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              title="Alinear derecha"
            >
              ⟶
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

          {/* Color Palette */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', marginRight: '4px' }}>Color:</span>
            {colorOptions.slice(0, 6).map((color) => (
              <button
                key={color.value}
                onClick={() => setTextColor(color.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: color.value,
                  border: textColor === color.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  padding: '0',
                }}
                title={color.name}
              />
            ))}
            {/* More colors dropdown */}
            <select
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: '20px',
                height: '20px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'center',
              }}
              title="Más colores"
            >
              <option value="">⋯</option>
              {colorOptions.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextSubmit}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '16px',
            fontWeight,
            textAlign,
            color: textColor,
            lineHeight: '1.4',
            padding: '0',
            margin: '0',
          }}
          placeholder="Escribe tu texto aquí..."
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            fontSize: '16px',
            fontWeight,
            textAlign,
            color: textColor,
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            margin: '0',
            padding: '0',
            display: 'flex',
            alignItems: textAlign === 'center' ? 'center' : 'flex-start',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            minHeight: '20px',
          }}
        >
          {text || 'Doble clic para editar...'}
        </div>
      )}

      {/* Help text for empty nodes */}
      {!isEditing && !text && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '0',
            fontSize: '10px',
            color: '#9ca3af',
            fontStyle: 'italic',
            pointerEvents: 'none',
          }}
        >
          Ctrl+Enter para guardar
        </div>
      )}
    </div>
  );
};

export default TextNode;
