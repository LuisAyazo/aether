import React, { useState, useCallback, useEffect } from 'react';
// XYPosition removed as it's unused
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow'; 
import { 
  MinusIcon, 
  PlusIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';

interface NodeGroupProps extends NodeProps {
  data: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
  };
}

const MIN_SIZE = 40;
const DEFAULT_SIZE = { width: 300, height: 200 }; // Aumentado para mejor visualización
const PADDING = 20;

export default function NodeGroup({ id, data, selected }: NodeGroupProps) {
  // Estados
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const saved = localStorage.getItem(`group-${id}-minimized`);
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn(`Error parsing localStorage item group-${id}-minimized:`, error);
      return false;
    }
  });
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(`group-${id}-collapsed`);
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn(`Error parsing localStorage item group-${id}-collapsed:`, error);
      return false;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data.label);
  
  const reactFlowInstance = useReactFlow();

  // Actualizar el labelText cuando cambie data.label
  useEffect(() => {
    setLabelText(data.label);
  }, [data.label]);

  // Persistir estados
  useEffect(() => {
    localStorage.setItem(`group-${id}-minimized`, JSON.stringify(isMinimized));
    localStorage.setItem(`group-${id}-collapsed`, JSON.stringify(isCollapsed));
  }, [id, isMinimized, isCollapsed]);

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
    
    // Identificar los nodos hijos
    const childNodeIds = nodes
      .filter(node => node.parentNode === id)
      .map(node => node.id);

    // Actualizar nodos
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

    // Actualizar edges
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
    
    // Emitir evento personalizado para el menú contextual
    const customEvent = new CustomEvent('nodeGroupFocus', {
      detail: {
        nodeId: id,
        isFocused: true
      }
    });
    window.dispatchEvent(customEvent);
  }, [id]);

  // Manejar minimizado
  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isMinimized;
    setIsMinimized(newState);
    
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, label: labelText },
            style: {
              width: newState ? MIN_SIZE : DEFAULT_SIZE.width,
              height: newState ? MIN_SIZE : DEFAULT_SIZE.height,
              background: 'transparent',
              border: 'none',
              padding: '0',
              overflow: 'visible',
              outline: 'none',
              boxShadow: 'none',
              pointerEvents: 'all'
            },
            className: newState ? 'minimized-group-container' : 'group-node-container'
          };
        }
        return node;
      })
    );

    updateChildNodesAndEdges(newState);
  }, [isMinimized, reactFlowInstance, id, labelText, updateChildNodesAndEdges]);

  // Manejar colapsado
  const handleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    updateChildNodesAndEdges(newState);
  }, [isCollapsed, updateChildNodesAndEdges]);

  // Commit label changes to React Flow state
  const handleLabelChangeCommit = useCallback((newLabel: string) => {
    setIsEditing(false);
    reactFlowInstance.setNodes(nodes =>
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, [id, reactFlowInstance]);

  // Renderizado minimizado
  if (isMinimized) {
    return (
      <div 
        className="react-flow__node-group"
        style={{
          width: MIN_SIZE,
          height: MIN_SIZE,
          position: 'relative',
          pointerEvents: 'all',
          background: 'white',
          borderRadius: '50%',
          border: `2px solid ${getBorderColor()}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: -1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          className="minimized-group"
          onContextMenu={handleContextMenu}
          style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'all',
            borderRadius: '50%',
            backgroundColor: 'white',
            position: 'relative'
          }}
          onClick={handleMinimize}
          title={labelText}
        >
          <span style={{ 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: getBorderColor(),
            userSelect: 'none'
          }}>
            {labelText.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3)}
          </span>
        </div>
      </div>
    );
  }

  // Renderizado normal
  return (
    <div 
      className={`react-flow__node-group group-node-container ${selected ? 'selected' : ''}`}
      style={{
        width: DEFAULT_SIZE.width,
        height: DEFAULT_SIZE.height,
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '8px',
        background: 'white',
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
    </div>
  );
}