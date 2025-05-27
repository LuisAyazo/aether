import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

interface TextNodeData {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  textColor: string;
  backgroundColor?: string;
  borderStyle: 'none' | 'solid' | 'dashed';
}

const fontSizeOptions = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const colorOptions = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F59E0B', 
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'
];

const TextNode: React.FC<NodeProps<TextNodeData>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const [fontSize, setFontSize] = useState(data.fontSize || 16);
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
                fontSize,
                textColor,
              },
            }
          : node
      )
    );
  }, [id, text, fontSize, textColor, reactFlow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    }
  }, [handleTextSubmit, data.text]);

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
    padding: '0',
    margin: '0',
    minWidth: 'auto',
    minHeight: 'auto',
    width: 'fit-content',
    height: 'fit-content',
    position: 'relative' as const,
    cursor: isEditing ? 'text' : 'default',
    outline: selected ? '2px solid #3b82f6' : 'none',
    outlineOffset: '2px',
    pointerEvents: 'auto' as const,
  };

  return (
    <div
      className="text-node"
      style={{
        ...containerStyle,
        // Anular estilos de React Flow
        borderWidth: '0 !important',
        borderStyle: 'none !important',
        borderColor: 'transparent !important',
      }}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={20}
        lineStyle={{
          borderColor: '#3b82f6',
          borderWidth: 1,
          opacity: 0.3,
        }}
        handleStyle={{
          backgroundColor: '#3b82f6',
          width: '4px',
          height: '4px',
          opacity: 0.5,
        }}
      />

      {/* Toolbar */}
      {(selected || showToolbar) && (
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '0',
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '6px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #d1d5db',
            zIndex: 1000,
            flexWrap: 'wrap',
            minWidth: '140px',
          }}
        >
          {/* Font size */}
          <select
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            style={{
              fontSize: '12px',
              padding: '2px 4px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}
            title="Tamaño de fuente"
          >
            {fontSizeOptions.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>

          {/* Text color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '10px' }}>Color:</span>
            <select
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              style={{
                width: '40px',
                height: '24px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: textColor,
                cursor: 'pointer',
              }}
              title="Color de texto"
            >
              {colorOptions.map(color => (
                <option key={color} value={color} style={{ backgroundColor: color }}>
                  {color}
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
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'both',
            fontFamily: 'inherit',
            fontSize: `${fontSize}px`,
            fontWeight: 'normal',
            textAlign: 'left',
            color: textColor,
            minHeight: 'auto',
            padding: '0',
            margin: '0',
            lineHeight: '1.2',
            maxWidth: '500px',
          }}
          placeholder="Escribe tu texto aquí..."
        />
      ) : (
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 'normal',
            textAlign: 'left',
            color: textColor,
            lineHeight: '1.2',
            whiteSpace: 'pre-wrap',
            minHeight: 'auto',
            wordWrap: 'break-word',
            margin: '0',
            padding: '0',
            display: 'inline-block',
            maxWidth: '500px',
          }}
        >
          {text || 'Doble clic para editar...'}
        </div>
      )}

      {/* Instruction text for empty text */}
      {!isEditing && !text && (
        <div
          style={{
            position: 'absolute',
            bottom: '-16px',
            left: '0',
            fontSize: '10px',
            color: '#9ca3af',
            fontStyle: 'italic',
          }}
        >
          Ctrl+Enter para guardar
        </div>
      )}
    </div>
  );
};

export default TextNode;
