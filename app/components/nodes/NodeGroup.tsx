import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { 
  Handle, 
  Position, 
  useReactFlow, 
  useNodes, 
  useEdges, 
  Connection, 
  useUpdateNodeInternals
} from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
// import '@reactflow/node-resizer/dist/style.css'; // Mantener comentado para control total
import { 
  EyeSlashIcon,
  Squares2X2Icon,
  ServerIcon,
  CheckIcon,
  XMarkIcon,
  FolderIcon,
  FolderOpenIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Type aliases to work around ReactFlow TypeScript namespace issues (consistent with other files in codebase)
type Node = any;
type Edge = any;
type NodeProps = any;

// Constantes
const HEADER_HEIGHT = 48;
const MINIMIZED_HEIGHT = HEADER_HEIGHT;
const MINIMIZED_WIDTH = 280; // Aumentado de 240 a 280
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;
const CONTENT_PADDING = 16;

export interface NodeGroupData {
  label: string;
  children: string[];
  provider?: string;
  isCollapsed?: boolean;
  isMinimized?: boolean;
  width?: number;
  height?: number;
  childCount?: number;
  isExpandedView: boolean;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

const NodeGroup: React.FC<any> = ({ id, data, selected, width, height }) => {
  const { setNodes, getNode } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const allNodes = useNodes();
  const allEdges = useEdges();

  const isMinimized = data.isMinimized || false;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || 'Group');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // Usar la altura actual del nodo (puede haber sido redimensionado)
  const currentHeight = height || DEFAULT_HEIGHT;
  const currentWidth = width || DEFAULT_WIDTH;

  const isNodeConnected = useMemo(() => {
    return allEdges.some((edge: Edge) => edge.source === id || edge.target === id);
  }, [allEdges, id]);

  const childNodes = useMemo(() => {
    return allNodes
      .filter((n: Node) => n.parentId === id)
      // Filtrar solo nodos de recursos (excluir notas, textos, áreas y grupos)
      .filter((n: Node) => 
        n.type !== 'noteNode' && 
        n.type !== 'textNode' && 
        n.type !== 'areaNode' && 
        n.type !== 'group'
      )
      .sort((a: Node, b: Node) => 
        (a.data?.label || a.id).localeCompare(b.data?.label || b.id)
      );
  }, [allNodes, id]);

  useEffect(() => {
    const groupNode = getNode(id);
    if (!groupNode) return;
    
    const newChildCount = childNodes.length;
    
    if (groupNode.data?.childCount !== newChildCount) {
      setNodes((nds: Node[]) => nds.map((n: Node) => {
        if (n.id === id) {
          return { 
            ...n, 
            data: { 
              ...n.data, 
              childCount: newChildCount,
            } 
          };
        }
        return n;
      }));
    }
  }, [id, childNodes.length, getNode, setNodes]);

  // Efecto para sincronizar la visibilidad de nodos hijos
  // Los nodos hijos SIEMPRE deben estar ocultos cuando pertenecen a un grupo
  useEffect(() => {
    setNodes((nds: Node[]) =>
      nds.map((n: Node) => {
        if (n.parentId === id) {
          return { 
            ...n, 
            hidden: true, // Los nodos hijos siempre están ocultos
            style: { 
              ...n.style, 
              visibility: 'hidden',
              pointerEvents: 'none',
              opacity: 0
            }
          };
        }
        return n;
      })
    );
  }, [id, setNodes]); // Solo depende del id del grupo

  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editedLabel } }
            : node
        )
      );
    }
  }, [id, editedLabel, data.label, setNodes]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLabelSubmit();
    else if (e.key === 'Escape') {
      setEditedLabel(data.label || 'Group');
      setIsEditingLabel(false);
    }
  }, [handleLabelSubmit, data.label]);

  const handleResizeEnd = useCallback((_: any, params: { width: number; height: number }) => {
    setNodes((nodes: Node[]) =>
      nodes.map((node: Node) => {
        if (node.id === id) {
          return {
            ...node,
            width: params.width,
            height: params.height,
            data: { ...node.data, width: params.width, height: params.height },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [isMinimized, id, updateNodeInternals]);

  const getDynamicClasses = useCallback(() => {
    let borderColorClass = 'border-gray-300';
    let bgColorClass = 'bg-white';
    let headerBgClass = 'bg-gray-50';
    
    switch (data.provider) {
      case 'aws': 
        borderColorClass = 'border-orange-300';
        bgColorClass = 'bg-orange-50/50';
        headerBgClass = 'bg-orange-100/80';
        break;
      case 'gcp': 
        borderColorClass = 'border-blue-300';
        bgColorClass = 'bg-blue-50/50';
        headerBgClass = 'bg-blue-100/80';
        break;
      case 'azure': 
        borderColorClass = 'border-sky-300';
        bgColorClass = 'bg-sky-50/50';
        headerBgClass = 'bg-sky-100/80';
        break;
    }
    
    if (selected) borderColorClass = 'border-blue-500';
    
    return { borderColorClass, bgColorClass, headerBgClass };
  }, [data.provider, selected]);

  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMinimizedState = !isMinimized;

    setNodes((nds: Node[]) =>
      nds.map((n: Node) => {
        if (n.id === id) {
          const dataUpdate: Partial<NodeGroupData> = {
            isMinimized: newMinimizedState,
            isExpandedView: false,
          };
          
          let newWidth, newHeight;

          if (newMinimizedState) {
            // Guardar dimensiones actuales antes de minimizar
            dataUpdate.width = n.width || DEFAULT_WIDTH;
            dataUpdate.height = n.height || DEFAULT_HEIGHT;
            newWidth = MINIMIZED_WIDTH; // Usar ancho minimizado específico
            newHeight = MINIMIZED_HEIGHT;
          } else {
            // Restaurar dimensiones guardadas
            newWidth = n.data.width || DEFAULT_WIDTH;
            newHeight = n.data.height || DEFAULT_HEIGHT;
          }

          return {
            ...n,
            data: { ...n.data, ...dataUpdate },
            width: newWidth,
            height: newHeight,
          };
        }

        // Los nodos hijos siempre permanecen ocultos
        if (n.parentId === id) {
          return { 
            ...n, 
            hidden: true,
            style: { 
              ...n.style, 
              visibility: 'hidden',
              pointerEvents: 'none',
              opacity: 0
            }
          };
        }

        return n;
      })
    );
  }, [id, isMinimized, setNodes]);

  const handleExpandViewClick = useCallback(() => {
    const event = new CustomEvent('expandGroupView', { detail: { groupId: id } });
    window.dispatchEvent(event);
    if (isMinimized) {
      toggleMinimize(new MouseEvent('click') as unknown as React.MouseEvent);
    }
  }, [id, isMinimized, toggleMinimize]);

  const handleCollapseViewClick = useCallback(() => {
    const event = new CustomEvent('collapseGroupView', { detail: { groupId: id } });
    window.dispatchEvent(event);
  }, [id]);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  const handleRemoveFromGroup = useCallback((nodeId: string) => {
    const nodeToRemove = allNodes.find((n: Node) => n.id === nodeId);
    if (!nodeToRemove) return;

    setNodes((nds: Node[]) => nds.map((n: Node) => {
      if (n.id === nodeId) {
        // Calcular posición absoluta aproximada
        const groupNode = getNode(id);
        if (!groupNode) return n;
        
        const absolutePosition = {
          x: (groupNode.positionAbsolute?.x || groupNode.position.x) + (n.position?.x || 0),
          y: (groupNode.positionAbsolute?.y || groupNode.position.y) + (n.position?.y || 0)
        };

        return {
          ...n,
          parentId: undefined,
          extent: undefined,
          position: absolutePosition,
          hidden: false,
          style: { 
            ...n.style, 
            visibility: 'visible',
            pointerEvents: 'auto',
            opacity: 1
          }
        };
      }
      return n;
    }));
    setContextMenu(null);
  }, [allNodes, id, getNode, setNodes]);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const handleStyle = {
    width: '12px',
    height: '12px',
    background: '#555',
    border: '2px solid white',
    borderRadius: '50%',
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out',
    position: 'absolute' as const,
    zIndex: 1000,
    pointerEvents: 'all' as const
  };

  const { borderColorClass, bgColorClass, headerBgClass } = getDynamicClasses();

  if (isMinimized) {
    return (
      <div
        className={`relative px-4 py-2.5 ${borderColorClass} ${bgColorClass} flex items-center justify-between shadow-sm transition-all duration-200 border`}
        style={{ 
          width: `${MINIMIZED_WIDTH}px`, // Usar ancho minimizado fijo
          height: `${MINIMIZED_HEIGHT}px`,
          boxSizing: 'border-box',
          borderRadius: '12px',
          overflow: 'visible',
          pointerEvents: 'auto',
          position: 'relative'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-minimized="true"
        data-handleid="group-header"
      >
        <div className="flex items-center gap-3 overflow-hidden flex-grow">
          <div className={`p-1.5 rounded-lg ${headerBgClass}`}>
            <FolderIcon className="w-5 h-5 text-gray-600" />
          </div>
          {isEditingLabel ? (
            <div className="flex items-center gap-1 flex-grow">
              <input
                ref={labelInputRef}
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-800 p-0 w-full"
              />
              <button onClick={handleLabelSubmit} className="p-1 hover:bg-gray-100 rounded-full">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </button>
              <button onClick={() => { setEditedLabel(data.label || 'Group'); setIsEditingLabel(false); }} className="p-1 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ) : (
            <span className="font-medium text-gray-800 text-sm cursor-pointer truncate hover:text-blue-600 transition-colors duration-200" onClick={() => setIsEditingLabel(true)} title={data.label}>
              {data.label}
            </span>
          )}
          {childNodes.length > 0 && (
            <span className="ml-auto mr-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0">
              {childNodes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button onClick={handleExpandViewClick} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Ampliar vista del grupo">
            <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={toggleMinimize} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Expandir grupo">
            <Squares2X2Icon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {[Position.Top, Position.Bottom, Position.Left, Position.Right].map(pos => (
          <Handle 
            key={pos}
            type={pos === Position.Top || pos === Position.Left ? 'target' : 'source'} 
            position={pos} 
            id={`${pos}-${pos === Position.Top || pos === Position.Left ? 'target' : 'source'}`}
            style={{ 
              ...handleStyle,
              opacity: isHovered || isNodeConnected ? 1 : 0
            }}
            isConnectable={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${borderColorClass} ${bgColorClass} flex flex-col transition-all duration-200 border ${selected || isHovered ? 'shadow-lg' : 'shadow-sm'}`}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: '12px',
        overflow: 'visible', // Mantener visible para handles y resize
        position: 'relative',
        zIndex: 1
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={DEFAULT_WIDTH}
        minHeight={DEFAULT_HEIGHT}
        onResizeEnd={handleResizeEnd}
        lineStyle={{ borderColor: '#3b82f6' }}
        handleStyle={{ backgroundColor: 'white', border: '2px solid #3b82f6', width: '16px', height: '16px' }}
      />
      <div 
        className={`flex items-center justify-between px-4 py-2.5 cursor-move group-header ${headerBgClass}`}
        style={{ 
          height: `${HEADER_HEIGHT}px`, 
          flexShrink: 0,
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-grow">
          <div className={`p-1.5 rounded-lg ${headerBgClass}`}>
            <FolderOpenIcon className="w-5 h-5 text-gray-600" />
          </div>
          {isEditingLabel ? (
            <div className="flex items-center gap-1 flex-grow">
              <input
                ref={labelInputRef}
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-800 p-0 w-full"
              />
              <button onClick={handleLabelSubmit} className="p-1 hover:bg-gray-100 rounded-full">
                <CheckIcon className="w-4 h-4 text-green-600" />
              </button>
              <button onClick={() => { setEditedLabel(data.label || 'Group'); setIsEditingLabel(false); }} className="p-1 hover:bg-gray-100 rounded-full">
                <XMarkIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ) : (
            <span className="font-medium text-gray-800 text-sm cursor-pointer truncate hover:text-blue-600 transition-colors duration-200" onClick={() => setIsEditingLabel(true)} title={data.label}>
              {data.label}
            </span>
          )}
          {childNodes.length > 0 && (
            <span className="ml-auto mr-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0">
              {childNodes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {data.isExpandedView ? (
            <button onClick={handleCollapseViewClick} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Colapsar vista del grupo">
              <ArrowsPointingInIcon className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            <button onClick={handleExpandViewClick} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Ampliar vista del grupo">
              <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button onClick={toggleMinimize} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Minimizar grupo">
            <EyeSlashIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div 
        style={{ 
          padding: `${CONTENT_PADDING}px`,
          paddingBottom: data.isExpandedView ? `${CONTENT_PADDING}px` : `${CONTENT_PADDING}px`,
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          height: `calc(100% - ${HEADER_HEIGHT}px)`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {!data.isExpandedView && childNodes.length > 0 && (
          <div 
            className="custom-scrollbar"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 56, // Espacio para el área de drop
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '0 12px', // Padding lateral para separar de los bordes
            }}
          >
            <div className="space-y-2 py-2">
              {childNodes.map((node: Node) => ( 
                <div 
                  key={node.id} 
                  className="group flex items-center p-2.5 bg-gray-100 rounded-lg border border-gray-200 text-xs hover:bg-gray-200 transition-colors duration-200"
                >
                  <ServerIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="ml-2 truncate flex-1" title={node.data?.label || node.id}>
                    {node.data?.label || node.id}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromGroup(node.id);
                    }}
                    title="Sacar del grupo"
                  >
                    <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Área de drop */}
        <div
          className={`
            text-center text-xs border-2 border-dashed border-red-400 bg-red-100/70 text-red-700 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center
            hover:bg-red-100/90 hover:border-red-500 hover:shadow-md
            focus-within:ring-2 focus-within:ring-red-300 focus-within:ring-opacity-50
          `}
          style={{ 
            position: 'absolute',
            bottom: CONTENT_PADDING,
            left: CONTENT_PADDING,
            right: CONTENT_PADDING,
            height: '40px',
            backdropFilter: 'blur(2px)'
          }}
        >
          <span className="font-medium text-xs">
            {data.isExpandedView 
              ? (childNodes.length === 0 ? 'Área de grupo expandida (vacía)' : 'Nodos hijos renderizados por el flujo') 
              : 'Arrastra recursos aquí (AWS, GCP, etc.)'}
          </span>
        </div>
      </div>

      {[Position.Top, Position.Bottom, Position.Left, Position.Right].map(pos => (
        <Handle 
          key={pos}
          type={pos === Position.Top || pos === Position.Left ? 'target' : 'source'} 
          position={pos} 
          id={`${pos}-${pos === Position.Top || pos === Position.Left ? 'target' : 'source'}`}
          style={{ 
            ...handleStyle,
            opacity: isHovered || isNodeConnected ? 1 : 0
          }}
          isConnectable={true}
        />
      ))}

      {/* Menú contextual */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-50"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            onClick={() => handleRemoveFromGroup(contextMenu.nodeId)}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sacar del grupo
          </button>
        </div>
      )}
    </div>
  );
};

NodeGroup.displayName = 'NodeGroup';
export default memo(NodeGroup);
