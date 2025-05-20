import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow, XYPosition } from 'reactflow';
import { 
  MinusIcon, 
  PlusIcon,
  ArrowsPointingInIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

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
    const saved = localStorage.getItem(`group-${id}-minimized`);
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`group-${id}-collapsed`);
    return saved ? JSON.parse(saved) : false;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data.label);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);
  
  const contextMenuRef = useRef<HTMLDivElement>(null);
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

  // Cerrar el menú contextual cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const edges = reactFlowInstance.getEdges();
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
        const isConnectedToGroup = edge.source === id || edge.target === id;
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

  // Función para desagrupar un nodo
  const handleUngroupNode = useCallback((nodeId: string) => {
    const node = reactFlowInstance.getNode(nodeId);
    if (!node) return;

    // Calcular la posición absoluta del nodo
    const parentNode = reactFlowInstance.getNode(id);
    if (!parentNode) return;

    const absolutePosition: XYPosition = {
      x: parentNode.position.x + (node.position.x || 0),
      y: parentNode.position.y + (node.position.y || 0)
    };

    // Actualizar el nodo sin parentNode y con posición absoluta
    reactFlowInstance.setNodes(nodes =>
      nodes.map(n => {
        if (n.id === nodeId) {
          const { parentNode, ...rest } = n;
          return {
            ...rest,
            position: absolutePosition,
            extent: undefined,
            hidden: false,
            style: {
              ...rest.style,
              visibility: 'visible',
              display: 'block',
              opacity: 1
            }
          };
        }
        return n;
      })
    );

    // Asegurar que los edges conectados al nodo sean visibles
    reactFlowInstance.setEdges(edges =>
      edges.map(edge => {
        if (edge.source === nodeId || edge.target === nodeId) {
          return { 
            ...edge, 
            hidden: false,
            style: {
              ...edge.style,
              visibility: 'visible',
              opacity: 1
            }
          };
        }
        return edge;
      })
    );

    setShowContextMenu(false);
  }, [reactFlowInstance, id]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.react-flow__node');
    
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id');
      if (nodeId && nodeId !== id) {
        const node = reactFlowInstance.getNode(nodeId);
        if (node?.parentNode === id) {
          setContextMenuPosition({ x: event.clientX, y: event.clientY });
          setContextMenuNodeId(nodeId);
          setShowContextMenu(true);
        }
      }
    }
  }, [id, reactFlowInstance]);

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

  // Manejar enfoque
  const handleFocus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const node = reactFlowInstance.getNode(id);
    if (node) {
      reactFlowInstance.setViewport(
        { x: -node.position.x, y: -node.position.y, zoom: 1.5 },
        { duration: 800 }
      );
    }
  }, [reactFlowInstance, id]);

  // Añadir handler para el clic del grupo
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Enhanced logging with more details
    console.log('%cNodeGroup clicked', 'color: purple; font-weight: bold', {
      id,
      selected,
      isMinimized,
      isCollapsed,
      isEditing,
      timestamp: new Date().toISOString(),
      eventCoords: { x: e.clientX, y: e.clientY }
    });
  }, [id, selected, isMinimized, isCollapsed, isEditing]);

  // Enhanced resize handler
  const handleResize = useCallback((event: any, { width, height }: { width: number; height: number }) => {
    console.log('%cNodeGroup resized', 'color: orange; font-weight: bold', {
      id,
      width,
      height,
      timestamp: new Date().toISOString()
    });
    
    // Update node dimensions
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            style: { ...node.style, width, height }
          };
        }
        return node;
      })
    );

    // Update child nodes if needed
    if (!isMinimized && !isCollapsed) {
      updateChildNodesAndEdges(false);
    }
  }, [id, isMinimized, isCollapsed, reactFlowInstance, updateChildNodesAndEdges]);

  // Renderizar el menú contextual
  const renderContextMenu = () => {
    if (!showContextMenu || !contextMenuNodeId) return null;

    return (
      <div
        ref={contextMenuRef}
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1000]"
        style={{
          left: contextMenuPosition.x,
          top: contextMenuPosition.y,
          minWidth: '150px'
        }}
      >
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
          onClick={() => {
            handleUngroupNode(contextMenuNodeId);
            setShowContextMenu(false);
          }}
        >
          Desagrupar nodo
        </button>
      </div>
    );
  };

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
            pointerEvents: 'all'
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
            pointerEvents: 'all'
          }}
        />
      </div>
    );
  }

  // Renderizado normal (no minimizado)
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        onResize={handleResize}
        handleClassName="resize-handle"
        lineClassName="resize-line"
      />
      <div
        className="group-node"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute',
          inset: 0,
          border: `2px solid ${getBorderColor()}`,
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: `${PADDING}px`,
          cursor: 'pointer',
          zIndex: selected ? 2 : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          outline: selected ? '2px solid #3b82f6' : 'none',
          boxShadow: selected ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
          transition: 'all 0.2s ease'
        }}
        data-testid={`group-${id}`}
        data-selected={selected}
        data-minimized={isMinimized}
        data-collapsed={isCollapsed}
      >
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
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
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
    </>
  );
} 