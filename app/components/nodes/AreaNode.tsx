import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { useReactFlow } from 'reactflow';

interface AreaNodeData {
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  labelColor?: string;
  labelSize?: number;
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

  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      reactFlow.setNodes(nodes =>
        nodes.map(node =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editedLabel } }
            : node
        )
      );
    }
  }, [id, editedLabel, data.label, reactFlow]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setEditedLabel(data.label || 'Area');
      setIsEditingLabel(false);
    }
  }, [handleLabelSubmit, data.label]);

  const handleColorChange = useCallback((color: string) => {
    reactFlow.setNodes(nodes =>
      nodes.map(node =>
        node.id === id
          ? { ...node, data: { ...node.data, backgroundColor: color } }
          : node
      )
    );
  }, [id, reactFlow]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  const getShapeStyles = () => ({
    backgroundColor: data.backgroundColor || 'rgba(59, 130, 246, 0.5)',
    border: `${data.borderWidth || 1}px solid ${data.borderColor || 'rgba(59, 130, 246, 0.8)'}`,
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
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={100}
        lineStyle={{
          borderColor: data.borderColor || '#3b82f6',
          borderWidth: data.borderWidth || 1,
          opacity: 0.5
        }}
        handleStyle={{
          backgroundColor: data.borderColor || '#3b82f6',
          width: '6px',
          height: '6px',
          border: '1px solid white',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.8,
          zIndex: 10,
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
