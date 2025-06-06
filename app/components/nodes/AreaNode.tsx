import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeResizer, useReactFlow, NodeProps } from 'reactflow'; // Agrupar importaciones de reactflow
import type { Node } from 'reactflow'; // Importar Node como tipo

interface AreaNodeData {
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  labelColor?: string;
  labelSize?: number;
  parentId?: string;
}

const colorOptions = [
  { name: 'Light Blue', value: 'rgba(147, 197, 253, 0.5)' },
  { name: 'Light Green', value: 'rgba(134, 239, 172, 0.5)' },
  { name: 'Light Yellow', value: 'rgba(253, 230, 138, 0.5)' },
  { name: 'Light Pink', value: 'rgba(251, 207, 232, 0.5)' },
  { name: 'Light Purple', value: 'rgba(233, 213, 255, 0.5)' },
  { name: 'Light Orange', value: 'rgba(253, 186, 116, 0.5)' },
  { name: 'Light Gray', value: 'rgba(229, 231, 235, 0.5)' },
  { name: 'Transparent', value: 'rgba(255, 255, 255, 0.1)' },
];

export default function AreaNode({ id, data, selected }: NodeProps<AreaNodeData>) {
  const reactFlow = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || 'Area');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);
  const initialSizeRef = useRef<{ width: number; height: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Función para deseleccionar el área solo si hubo cambios
  const deselectArea = useCallback(() => {
    const node = reactFlow.getNode(id);
    if (!node) return;

    const hasPositionChanged = initialPositionRef.current && 
      (node.position.x !== initialPositionRef.current.x || 
       node.position.y !== initialPositionRef.current.y);

    const hasSizeChanged = initialSizeRef.current && 
      (node.width !== initialSizeRef.current.width || 
       node.height !== initialSizeRef.current.height);

    if (hasPositionChanged || hasSizeChanged) {
      reactFlow.setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id ? { ...node, selected: false } : node
        )
      );
    }
  }, [id, reactFlow]);

  // Guardar posición y tamaño iniciales cuando se selecciona
  useEffect(() => {
    if (selected) {
      const node = reactFlow.getNode(id);
      if (node) {
        initialPositionRef.current = { ...node.position };
        initialSizeRef.current = { width: node.width || 0, height: node.height || 0 };
      }
    } else {
      initialPositionRef.current = null;
      initialSizeRef.current = null;
    }
  }, [selected, id, reactFlow]);

  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      reactFlow.setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id
            ? { ...node, data: { ...(node.data as AreaNodeData), label: editedLabel } }
            : node
        )
      );
      deselectArea();
    }
  }, [id, editedLabel, data.label, reactFlow, deselectArea]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setEditedLabel(data.label || 'Area');
      setIsEditingLabel(false);
    }
  }, [handleLabelSubmit, data.label]);

  const handleColorChange = useCallback((color: string) => {
    if (color !== data.backgroundColor) {
      reactFlow.setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id
            ? { ...node, data: { ...(node.data as AreaNodeData), backgroundColor: color } }
            : node
        )
      );
      deselectArea();
    }
  }, [id, data.backgroundColor, reactFlow, deselectArea]);

  // Manejar el fin del redimensionamiento
  const handleResizeEnd = useCallback(() => {
    deselectArea();
  }, [deselectArea]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  const getShapeStyles = () => ({
    backgroundColor: data.backgroundColor || 'rgba(59, 130, 246, 0.1)', // Azul semitransparente por defecto
    border: `${data.borderWidth || 1}px dashed ${data.borderColor || 'rgba(59, 130, 246, 0.5)'}`, // Borde azul discontinuo por defecto
    borderRadius: '8px',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box' as const,
    boxShadow: selected 
      ? '0 0 0 1px rgba(59, 130, 246, 0.3)' 
      : '0 0 0 1px rgba(59, 130, 246, 0.2)'
  });

  return (
    <div
      style={{
        ...getShapeStyles(),
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex: data.parentId ? -1 : -999, // Ajustar zIndex basado en si está en un grupo
        pointerEvents: 'auto', // Permitir que el área reciba eventos para el arrastre de hijos
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        isDraggingRef.current = true;
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          deselectArea();
        }
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        onResizeEnd={handleResizeEnd}
        lineStyle={{
          borderColor: data.borderColor || '#3b82f6',
          borderWidth: data.borderWidth || 1,
          opacity: 0.5
        }}
        handleStyle={{
          backgroundColor: data.borderColor || '#3b82f6',
          width: '12px', // Aumentado
          height: '12px', // Aumentado
          border: '2px solid white', // Borde más grueso
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.9, // Ligeramente más opaco
          zIndex: 10,
          pointerEvents: 'auto', // Permitir interacción con los handles
        }}
      />

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          userSelect: 'none',
          pointerEvents: 'auto', // Permitir clics en la etiqueta
        }}
        onClick={() => setIsEditingLabel(true)}
      >
        {isEditingLabel ? (
          <input
            ref={labelInputRef}
            value={editedLabel}
            onChange={(e) => setEditedLabel(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={handleLabelKeyDown}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: `${data.labelSize || 14}px`,
              color: data.labelColor || '#1F2937',
              padding: 0,
              width: '100%',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: `${data.labelSize || 14}px`,
              color: data.labelColor || '#1F2937',
            }}
          >
            {data.label || 'Area'}
          </span>
        )}
      </div>

      {/* Color picker */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '-50px', // Mover arriba del área
            right: '8px',
            display: 'flex',
            gap: '4px',
            background: 'white',
            padding: '4px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #d1d5db',
            zIndex: 1000,
            pointerEvents: 'auto', // Permitir clics en el selector de color
          }}
        >
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: color.value,
                border: data.backgroundColor === color.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                // Add a checkerboard pattern background for transparent colors
                backgroundImage: color.value.includes('rgba') ? 
                  `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                   linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                   linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                   linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)` : 'none',
                backgroundSize: color.value.includes('rgba') ? '8px 8px' : 'auto',
                backgroundPosition: color.value.includes('rgba') ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
