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
const DEFAULT_SIZE = { width: 200, height: 150 };
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
              opacity: hide ? 0 : 1
            }
          };
        }
        return node;
      })
    );

    // Actualizar edges
    reactFlowInstance.setEdges(edges => 
      edges.map(edge => {
        const isConnectedToGroup = edge.source === id || edge.target === id; // Corrected syntax
        const isConnectedToChild = childNodeIds.includes(edge.source) || childNodeIds.includes(edge.target);
        
        if (isConnectedToChild && !isConnectedToGroup) {
          return { 
            ...edge, 
            hidden: hide,
            style: {
              ...edge.style,
              visibility: hide ? 'hidden' : 'visible',
              opacity: hide ? 0 : 1
            }
          };
        }
        return edge;
      })
    );
  }, [reactFlowInstance, id]);

  const handleContextMenu = useCallback((/* event: React.MouseEvent */) => {
    // Temporarily commented out for diagnostics to check selection interference
    // event.preventDefault(); 
    // event.stopPropagation();
    // Placeholder for group's own context menu.
    // For now, it just prevents the default browser context menu.
    // console.log('Context menu on group:'); // id removed as it's not in deps
  }, []); // id dependency removed as it was unused

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
              boxShadow: 'none'
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
        style={{
          width: MIN_SIZE,
          height: MIN_SIZE,
          position: 'relative',
          pointerEvents: 'none',
          background: 'transparent'
        }}
      >
        <div 
          className="minimized-group"
          onContextMenu={handleContextMenu}
          data-minimized="true"
          style={{
            width: MIN_SIZE,
            height: MIN_SIZE,
            borderRadius: '50%',
            border: `2px solid ${getBorderColor()}`,
            backgroundColor: selected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            cursor: 'pointer',
            pointerEvents: 'all'
          }}
        >
          <button
            onClick={handleMinimize}
            className="w-full h-full flex items-center justify-center cursor-pointer bg-transparent border-none rounded-full focus:outline-none"
            style={{
              outline: 'none'
            }}
          >
            <span className="text-xs font-bold">
              {labelText.substring(0, 2).toUpperCase()}
            </span>
          </button>
          
          <div className="tooltip">
            {labelText}
          </div>
        </div>

        <Handle 
          type="target" 
          position={Position.Left}
          style={{
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: getBorderColor(),
            border: 'none',
            zIndex: 3,
            pointerEvents: 'none',
            visibility: 'hidden',
          }}
        />
        <Handle 
          type="source" 
          position={Position.Right}
          style={{
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: getBorderColor(),
            border: 'none',
            zIndex: 3,
            pointerEvents: 'none',
            visibility: 'hidden',
          }}
        />
      </div>
    );
  }

  // Renderizado normal (no minimizado)
  return (
    <div 
      className="group-node"
      onContextMenu={handleContextMenu}
      style={{
        position: 'absolute',
        inset: 0,
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '8px',
        padding: `${PADDING}px`,
        cursor: 'pointer',
        zIndex: 1, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        boxShadow: 'none',
        transition: 'background-color 0.3s ease',
        backgroundColor: 'rgba(0,0,0,0.001)', // Make the group node area itself clickable for selection
      }}
    >
      {/* Visual background element - non-interactive */}
      <div style={{
        position: 'absolute',
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 'inherit', // Inherit border radius from parent
        pointerEvents: 'none', // Crucial: background doesn't steal clicks from children
        zIndex: -1, // Ensure it's visually behind other direct children of "group-node" (label, buttons)
      }} />

      <Handle 
        type="target" 
        position={Position.Left}
        style={{
          left: -4,
          background: getBorderColor(),
          border: '2px solid white',
          zIndex: 3
        }}
      />
      <Handle 
        type="source" 
        position={Position.Right}
        style={{
          right: -4,
          background: getBorderColor(),
          border: '2px solid white',
          zIndex: 3
        }}
      />

      {selected && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-md shadow-md px-1.5 py-1 z-50"
          style={{ border: `1px solid ${getBorderColor()}` }}
        >
          <button
            onClick={handleMinimize} 
            className="p-1 hover:bg-gray-100 rounded transition-colors" 
            title="Minimizar"
          >
            <ArrowsPointingInIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleCollapse} 
            className="p-1 hover:bg-gray-100 rounded transition-colors" 
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? <PlusIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
          </button>
        </div>
      )}

      <div 
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-md shadow-sm cursor-text select-none"
        style={{ 
          border: `1px solid ${getBorderColor()}`,
          zIndex: 10,
          minWidth: '140px',
          maxWidth: '200px'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isMinimized) {
            setIsEditing(true);
          }
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
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="bg-transparent border-none p-0 text-center w-full outline-none text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="block text-center text-sm truncate">
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
}