"use client";

import React from 'react';
import { Button, Tooltip } from 'antd';
import { useSelectedEdgeType } from '@/app/contexts/SelectedEdgeTypeContext';
import { LogicalEdgeType, edgeTypeConfigs, EdgeTypeConfig } from '@/app/config/edgeConfig';
import { 
  ShareIcon, 
  BoltIcon,
  PencilSquareIcon,
  LinkIcon,
  PhoneArrowUpRightIcon
} from '@heroicons/react/24/outline'; 

// Mapeo de tipos lógicos a iconos
const edgeTypeIcons: Record<LogicalEdgeType, React.ElementType> = {
  [LogicalEdgeType.DEPENDS_ON]: ShareIcon,
  [LogicalEdgeType.CALLS]: PhoneArrowUpRightIcon,
  [LogicalEdgeType.TRIGGERS]: BoltIcon,
  [LogicalEdgeType.WRITES_TO]: PencilSquareIcon,
  [LogicalEdgeType.CONNECTS_TO]: LinkIcon,
};

interface EdgeTypeButtonProps {
  config: EdgeTypeConfig;
  isSelected: boolean;
  onClick: () => void;
}

const EdgeTypeButton: React.FC<EdgeTypeButtonProps> = ({ config, isSelected, onClick }) => {
  const IconComponent = edgeTypeIcons[config.logicalType];
  
  return (
    <Tooltip title={config.label} placement="right">
      <Button
        type={isSelected ? 'primary' : 'default'}
        onClick={onClick}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderColor: isSelected ? config.style.stroke : undefined,
          backgroundColor: isSelected ? config.style.stroke : undefined,
          color: isSelected ? 'white' : undefined,
        }}
        icon={IconComponent ? <IconComponent className="h-5 w-5" /> : undefined}
      >
        {/* Opcional: Mostrar etiqueta si hay espacio o en un layout diferente */}
        {/* {config.label} */}
      </Button>
    </Tooltip>
  );
};

const EdgeTypeToolbox: React.FC = () => {
  const { selectedLogicalType, setSelectedLogicalType } = useSelectedEdgeType();

  const handleTypeSelect = (type: LogicalEdgeType) => {
    setSelectedLogicalType(prev => (prev === type ? null : type)); // Permite deseleccionar
  };

  return (
    <div 
      style={{
        position: 'absolute',
        left: '10px', // O donde prefieras posicionarla
        top: '70px',  // O donde prefieras posicionarla
        zIndex: 10, // Asegurar que esté sobre el canvas de React Flow
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <h4 style={{textAlign: 'center', margin: '0 0 8px 0', fontSize: '12px', color: '#555'}}>Edge Types</h4>
      {Object.values(edgeTypeConfigs).map(config => (
        <EdgeTypeButton
          key={config.logicalType}
          config={config}
          isSelected={selectedLogicalType === config.logicalType}
          onClick={() => handleTypeSelect(config.logicalType)}
        />
      ))}
    </div>
  );
};

export default EdgeTypeToolbox;
