import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

// Type aliases to work around ReactFlow TypeScript namespace issues
type Node = any;
type NodeProps = any;

interface NoteNodeData {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

const colorOptions = [
  { name: 'Amarillo', value: '#FEF08A', textColor: '#1F2937' },
  { name: 'Rosa', value: '#FBCFE8', textColor: '#1F2937' },
  { name: 'Azul', value: '#BFDBFE', textColor: '#1F2937' },
  { name: 'Verde', value: '#BBF7D0', textColor: '#1F2937' },
  { name: 'Naranja', value: '#FED7AA', textColor: '#1F2937' },
  { name: 'Violeta', value: '#DDD6FE', textColor: '#1F2937' },
  { name: 'Gris', value: '#E5E7EB', textColor: '#1F2937' },
  { name: 'Blanco', value: '#FFFFFF', textColor: '#1F2937' },
];

const NoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(data.backgroundColor);
  const [textColor, setTextColor] = useState(data.textColor);
  const [fontSize, setFontSize] = useState(data.fontSize || 14);
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
    reactFlow.setNodes((nodes: Node[]) => // Tipar nodes como Node[]
      nodes.map((node: Node) => // Tipar node como Node
        node.id === id
          ? {
              ...node,
              data: {
                ...(node.data as NoteNodeData), // Castear node.data a NoteNodeData
                text,
                backgroundColor,
                textColor,
                fontSize,
              },
            }
          : node
      )
    );
  }, [id, text, backgroundColor, textColor, fontSize, reactFlow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    }
  }, [handleTextSubmit, data.text]);

  const handleColorChange = useCallback((color: { value: string; textColor: string }) => {
    setBackgroundColor(color.value);
    setTextColor(color.textColor);
    setShowColorPicker(false);
  }, []);

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontSize(parseInt(e.target.value));
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

  return (
    <div
      className="note-node"
      style={{
        backgroundColor,
        border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        minHeight: '100px',
        position: 'relative',
        zIndex: 1000, // Cambiado a 1000 para asegurar que esté encima de AreaNode
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: isEditing ? 'text' : 'default',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box'
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        // No detener la propagación del click derecho
        // Permitir que el evento llegue a ReactFlow
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={80}
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

      {/* Toolbar */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            left: '0',
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '4px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #d1d5db',
            zIndex: 1000,
          }}
        >
          {/* Color picker button */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor,
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title="Cambiar color"
          />
          
          {/* Font size selector */}
          <select
            value={fontSize}
            onChange={handleFontSizeChange}
            style={{
              fontSize: '12px',
              padding: '2px 4px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
            }}
            title="Tamaño de fuente"
          >
            <option value={10}>10px</option>
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
          </select>
        </div>
      )}

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '0',
            background: 'white',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #d1d5db',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            zIndex: 1001,
          }}
        >
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color)}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: color.value,
                border: backgroundColor === color.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title={color.name}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            color: textColor,
            minHeight: '60px',
              height: 'auto',
              overflow: 'auto',
              padding: '4px',
              boxSizing: 'border-box',
              flex: 1
          }}
          placeholder="Escribe aquí tu nota..."
        />
      ) : (
        <div
          style={{
            fontSize: `${fontSize}px`,
            color: textColor,
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            minHeight: '60px',
            wordWrap: 'break-word',
              padding: '4px',
              boxSizing: 'border-box',
              flex: 1
          }}
        >
          {text || 'Doble clic para editar...'}
        </div>
      )}
      </div>

      {/* Instruction text */}
      {!isEditing && !text && (
        <div
          style={{
            fontSize: '10px',
            color: '#9ca3af',
            fontStyle: 'italic',
            marginTop: '4px',
            textAlign: 'right'
          }}
        >
          Ctrl+Enter para guardar
        </div>
      )}
    </div>
  );
};

export default NoteNode;
