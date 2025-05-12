import React from 'react';
import { NodeProps } from 'reactflow';

// Componente especializado para áreas de fondo
// Este es un componente sin handles ni comportamiento típico de nodo
// Solo sirve como un contenedor visual con un fondo de color sólido
const AreaBackground = ({ data, selected }: NodeProps) => {
  // Aseguramos que siempre tengamos un color de fondo, incluso si data.backgroundColor no está definido
  const backgroundColor = data.backgroundColor || 'rgba(59, 130, 246, 0.15)';
  const borderColor = data.borderColor || '#3b82f6';
  const label = data.label || 'Área';
  const border = data.border || `2px solid ${borderColor}`;

  return (
    <div
      style={{
        backgroundColor: backgroundColor, 
        border: border,
        borderRadius: '8px',
        width: '100%',
        height: '100%',
        position: 'absolute', // Cambiado a absolute para cubrir toda el área
        top: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '5px',
        overflow: 'visible',
        zIndex: -1, // Aseguramos que esté DEBAJO de otros nodos
        pointerEvents: 'all', // Permitir interacción con el área
        opacity: 1, // Asegurar que sea totalmente visible
      }}
      className="area-background" 
      data-area="true"
    >
      <div 
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
          marginBottom: '5px',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'all',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default React.memo(AreaBackground);