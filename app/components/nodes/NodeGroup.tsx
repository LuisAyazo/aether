import React, { useState, useCallback, useEffect } from 'react';
// XYPosition removed as it'sunused
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow'; 
import { 
  MinusIcon, 
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import IaCTemplatePanel from '../ui/IaCTemplatePanel';

interface NodeGroupProps extends NodeProps {
  data: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    isMinimized?: boolean;
    isCollapsed?: boolean;
    resourceType?: string;
  };
}

const MIN_SIZE = 40;
const DEFAULT_SIZE = { width: 300, height: 200 }; // Aumentado para mejor visualización
const PADDING = 20;

export default function NodeGroup({ id, data, selected }: NodeGroupProps) {
  const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data.label);
  const [showIaCPanel, setShowIaCPanel] = useState(false);
  
  const reactFlowInstance = useReactFlow();

  // Actualizar el labelText cuando cambie data.label
  useEffect(() => {
    setLabelText(data.label);
  }, [data.label]);

  // Persistir estados
  useEffect(() => {
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              isMinimized,
              isCollapsed
            }
          };
        }
        return node;
      })
    );
  }, [id, isMinimized, isCollapsed, reactFlowInstance]);

  // Obtener color según proveedor
  const getBorderColor = () => {
    switch (data.provider) {
      case 'aws': return '#f97316';
      case 'gcp': return '#3b82f6';
      case 'azure': return '#0ea5e9';
      default: return '#94a3b8';
    }
  };

  // Actualizar visibilidad de nodos hijos y edges
  const updateChildNodesAndEdges = useCallback((hide: boolean) => {
    const nodes = reactFlowInstance.getNodes();
    const childNodeIds = nodes
      .filter(node => node.parentNode === id)
      .map(node => node.id);

    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        if (node.parentNode === id) {
          return {
            ...node,
            hidden: hide,
            style: {
              ...node.style,
              visibility: hide ? 'hidden' : 'visible',
              opacity: hide ? 0 : 1,
              pointerEvents: hide ? 'none' : 'all'
            }
          };
        }
        return node;
      })
    );

    reactFlowInstance.setEdges(edges => 
      edges.map(edge => {
        const isConnectedToGroup = edge.source === id || edge.target === id;
        const isConnectedToChild = childNodeIds.includes(edge.source) || childNodeIds.includes(edge.target);
        
        if (isConnectedToChild && !isConnectedToGroup) {
          return {
            ...edge,
            hidden: hide,
            style: {
              ...edge.style,
              visibility: hide ? 'hidden' : 'visible',
              opacity: hide ? 0 : 1,
              pointerEvents: hide ? 'none' : 'all'
            }
          };
        }
        return edge;
      })
    );
  }, [reactFlowInstance, id]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const customEvent = new CustomEvent('nodeGroupContextMenu', {
      detail: {
        nodeId: id,
        isMinimized,
        isCollapsed,
        label: labelText
      }
    });
    window.dispatchEvent(customEvent);
  }, [id, isMinimized, isCollapsed, labelText]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !isMinimized;
    setIsMinimized(newState);
    
    // Actualizar el nodo en ReactFlow
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            isMinimized: newState
          },
          style: {
            ...node.style,
            width: newState ? MIN_SIZE : DEFAULT_SIZE.width,
            height: newState ? MIN_SIZE : DEFAULT_SIZE.height,
            borderRadius: newState ? '50%' : '8px',
            padding: newState ? '0' : PADDING,
            transform: node.style?.transform || 'translate(0px, 0px)'
          }
        };
      }
      return node;
    });
    
    reactFlowInstance.setNodes(updatedNodes);
    updateChildNodesAndEdges(newState);
  }, [isMinimized, reactFlowInstance, id, updateChildNodesAndEdges]);

  const handleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    updateChildNodesAndEdges(newState);
  }, [isCollapsed, updateChildNodesAndEdges]);

  const handleLabelChangeCommit = useCallback((newLabel: string) => {
    setIsEditing(false);
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel
            }
          };
        }
        return node;
      })
    );
  }, [id, reactFlowInstance]);
  
  // Renderizado minimizado
  if (isMinimized) {
    const initials = labelText
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    return (
      <div
        className="react-flow__node react-flow__node-group minimized"
        data-provider={data.provider}
        data-id={id}
        role="button"
        tabIndex={0}
        onClick={handleMinimize}
        onContextMenu={handleContextMenu}
        style={{
          width: MIN_SIZE,
          height: MIN_SIZE,
          position: 'relative',
          pointerEvents: 'all',
          backgroundColor: '#FFEB3B', // amarillo fuerte
          borderRadius: '50%',
          border: '4px solid #FF0000', // borde rojo fuerte
          boxShadow: '0 4px 16px 2px rgba(255,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          overflow: 'visible',
          cursor: 'pointer',
          aspectRatio: '1',
          minWidth: MIN_SIZE,
          minHeight: MIN_SIZE,
          maxWidth: MIN_SIZE,
          maxHeight: MIN_SIZE,
          zIndex: 2000 // muy alto para que quede por encima
        }}
        title={labelText}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: Math.min(16, MIN_SIZE / 2.5),
            fontWeight: 'bold',
            color: '#000000',
            userSelect: 'none',
            lineHeight: 1,
            textAlign: 'center'
          }}>
            {initials || labelText.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Handles para conectar nodos */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: '#FF0000',
            border: '2px solid #FF0000',
            height: 8,
            width: 8,
            top: -4,
            zIndex: 2100 // por encima del nodo
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: '#FF0000',
            border: '2px solid #FF0000',
            height: 8,
            width: 8,
            bottom: -4,
            zIndex: 2100
          }}
        />
      </div>
    );
  }

  // Renderizado normal
  return (
    <div 
      className={`react-flow__node-group group-node-container ${selected ? 'selected' : ''}`}
      data-provider={data.provider}
      style={{
        width: DEFAULT_SIZE.width,
        height: DEFAULT_SIZE.height,
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '8px',
        backgroundColor: 'white',
        padding: PADDING,
        position: 'relative',
        pointerEvents: 'all',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: -1
      }}
      onContextMenu={handleContextMenu}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: getBorderColor() }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: getBorderColor() }}
      />
      
      <div className="group-controls" style={{ 
        pointerEvents: 'all',
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        gap: '4px',
        zIndex: 1000
      }}>
        <button
          onClick={handleMinimize}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <MinusIcon className="w-4 h-4" style={{ color: getBorderColor() }} />
        </button>
        <button
          onClick={handleCollapse}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ArrowsPointingInIcon className="w-4 h-4" style={{ color: getBorderColor() }} />
        </button>
      </div>

      <div 
        className="group-label"
        style={{ 
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'all',
          zIndex: 1000,
          background: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: `1px solid ${getBorderColor()}`,
          minWidth: '100px',
          textAlign: 'center'
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            onBlur={() => handleLabelChangeCommit(labelText)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLabelChangeCommit(labelText);
              }
            }}
            autoFocus
            style={{ 
              width: '100%',
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              textAlign: 'center'
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: getBorderColor(),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {labelText}
          </div>
        )}
      </div>

      {showIaCPanel && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 2000,
          padding: '16px',
          marginTop: '8px',
          pointerEvents: 'all'
        }}>
          <IaCTemplatePanel 
            isOpen={true}
            resourceData={{
              label: labelText,
              provider: data.provider,
              resourceType: data.resourceType || 'generic'
            }}
            onClose={() => setShowIaCPanel(false)}
            nodeId={id}
          />
        </div>
      )}
    </div>
  );
}