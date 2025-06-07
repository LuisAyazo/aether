import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Handle, Position, useReactFlow, useNodes } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
// import '@reactflow/node-resizer/dist/style.css'; // Mantener comentado para control total
import { 
  EyeSlashIcon,
  Squares2X2Icon,
  PlusCircleIcon,
  MinusCircleIcon,
  ServerIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  FolderIcon,
  FolderOpenIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { Node, NodeProps } from 'reactflow';

// Tipos
type Node = any;
type NodeProps<T = any> = any;

// Constantes
const HEADER_HEIGHT = 48;
const MINIMIZED_HEIGHT = HEADER_HEIGHT;
const MINIMIZED_WIDTH = 240;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;
const CONTENT_PADDING = 16;
const MIN_CONTENT_HEIGHT = 60;

export interface NodeGroupData {
  label: string;
  children: string[];
  provider?: string;
  isCollapsed?: boolean;
  isMinimized?: boolean;
  width?: number;
  height?: number;
  childCount?: number;
}

interface NodeGroupProps extends NodeProps<NodeGroupData> {
  width?: number;
  height?: number;
  isOver?: boolean;
}

const NodeGroup: React.FC<NodeGroupProps> = ({ id, data, selected, width, height, isOver, dragging }) => {
  const { setNodes, getNode } = useReactFlow();
  const allNodes = useNodes();
  const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || 'Group');
  const labelInputRef = useRef<HTMLInputElement>(null);
  // El estado local isResizing ya no es necesario, el componente se simplifica.

  useEffect(() => {
    if (typeof data.isMinimized === 'boolean' && data.isMinimized !== isMinimized) {
      setIsMinimized(data.isMinimized);
    }
  }, [data.isMinimized]);

  // Obtener nodos hijos
  const childNodes = useMemo(() => {
    return allNodes
      .filter((n: Node) => n.parentId === id)
      .sort((a: Node, b: Node) => 
        ((a.data as any)?.label || a.id).localeCompare(((b.data as any)?.label || b.id))
      );
  }, [allNodes, id]);

  // Actualizar contador de hijos
  useEffect(() => {
    const groupNode = getNode(id);
    if (!groupNode) return;
    
    const newChildCount = childNodes.length;
    const currentGroupData = groupNode.data as NodeGroupData;
    
    if (currentGroupData?.childCount !== newChildCount || currentGroupData?.isMinimized !== isMinimized) {
      setNodes((nds: Node[]) => nds.map((n: Node) => {
        if (n.id === id) {
          return { 
            ...n, 
            data: { 
              ...(n.data as NodeGroupData), 
              childCount: newChildCount, 
              isMinimized: isMinimized 
            } 
          };
        }
        return n;
      }));
    }
  }, [id, childNodes.length, isMinimized, getNode, setNodes]);

  // Manejo de edición de etiqueta
  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id 
            ? { ...node, data: { ...(node.data as NodeGroupData), label: editedLabel } } 
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

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  // Clases dinámicas para estilos
  const getDynamicClasses = useCallback(() => {
    let borderColorClass = 'border-gray-200';
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
    
    if (selected) {
      borderColorClass = 'border-blue-500 ring-2 ring-blue-200';
    }
    
    return { borderColorClass, bgColorClass, headerBgClass };
  }, [data.provider, selected]);

  // Toggle minimizar
  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    setNodes((nds: Node[]) =>
      nds.map((n: Node) => {
        if (n.id === id) {
          let newWidth, newHeight;
          if (newMinimizedState) {
            // Al minimizar, usamos el tamaño fijo.
            newWidth = MINIMIZED_WIDTH;
            newHeight = MINIMIZED_HEIGHT;
          } else {
            // Al expandir, usamos el tamaño guardado en data o el por defecto.
            newWidth = n.data.width || DEFAULT_WIDTH;
            newHeight = n.data.height || DEFAULT_HEIGHT;
          }
          // Crear una copia del estilo y eliminar el width/height existentes para evitar conflictos
          const style = { ...n.style };
          delete style.width;
          delete style.height;

          return {
            ...n,
            data: { ...n.data, isMinimized: newMinimizedState, isExpandedView: false },
            style: { 
              ...style, 
              width: newWidth, 
              height: newHeight, 
              // Forzar estilos en línea para el contenedor cuando está minimizado
              pointerEvents: newMinimizedState ? 'none' : 'all',
              background: newMinimizedState ? 'transparent' : style.background,
              border: newMinimizedState ? 'none' : style.border,
              boxShadow: newMinimizedState ? 'none' : style.boxShadow,
            },
            width: newWidth,
            height: newHeight,
            selected: false, // Deseleccionar el nodo al minimizar
          };
        }
        if (n.parentId === id) {
          return { ...n, hidden: newMinimizedState };
        }
        return n;
      })
    );
  }, [id, isMinimized, setNodes]);

  // Manejo de vista expandida
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

  // Iconos y estilos
  const getProviderIcon = () => {
    switch (data.provider) {
      case 'aws': return '☁️';
      case 'gcp': return '🔵';
      case 'azure': return '🔷';
      default: return '📦';
    }
  };

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

  // Renderizado del nodo minimizado
  if (isMinimized) {
    const { borderColorClass, bgColorClass, headerBgClass } = getDynamicClasses();
    return (
      <div
        className={`relative px-4 py-2.5 border ${borderColorClass} ${bgColorClass} flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200`}
        style={{ 
          width: `${MINIMIZED_WIDTH}px`,
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
              <button
                onClick={handleLabelSubmit}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <CheckIcon className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={() => {
                  setEditedLabel(data.label || 'Group');
                  setIsEditingLabel(false);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ) : (
            <span 
              className="font-medium text-gray-800 text-sm cursor-pointer truncate hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsEditingLabel(true)}
              title={data.label}
            >
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
          <button 
            onClick={handleExpandViewClick} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" 
            title="Ampliar vista del grupo"
          >
            <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={toggleMinimize} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" 
            title="Expandir grupo"
          >
            <Squares2X2Icon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Handles para el modo minimizado */}
        <Handle 
          type="target" 
          position={Position.Top} 
          id="top-target"
          style={{ 
            ...handleStyle,
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: isHovered ? 1 : 0
          }}
          isConnectable={true}
          onConnect={(params) => console.log('handle onConnect', params)}
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="bottom-source"
          style={{ 
            ...handleStyle,
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: isHovered ? 1 : 0
          }}
          isConnectable={true}
          onConnect={(params) => console.log('handle onConnect', params)}
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          id="left-target"
          style={{ 
            ...handleStyle,
            left: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isHovered ? 1 : 0
          }}
          isConnectable={true}
          onConnect={(params) => console.log('handle onConnect', params)}
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          id="right-source"
          style={{ 
            ...handleStyle,
            right: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isHovered ? 1 : 0
          }}
          isConnectable={true}
          onConnect={(params) => console.log('handle onConnect', params)}
        />
      </div>
    );
  }

  // Renderizado del nodo normal
  const { borderColorClass, bgColorClass, headerBgClass } = getDynamicClasses();
  return (
    <div
      className={`border ${borderColorClass} ${bgColorClass} flex flex-col transition-all duration-200`}
      style={{ 
        width: '100%',
        height: '100%',
        boxShadow: isHovered 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)' 
          : '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
        borderRadius: '12px',
        overflow: 'visible',
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between px-4 py-2.5 cursor-move group-header border-b ${headerBgClass}`}
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
              <button
                onClick={handleLabelSubmit}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <CheckIcon className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={() => {
                  setEditedLabel(data.label || 'Group');
                  setIsEditingLabel(false);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ) : (
            <span 
              className="font-medium text-gray-800 text-sm cursor-pointer truncate hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsEditingLabel(true)}
              title={data.label}
            >
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
            <button 
              onClick={handleCollapseViewClick} 
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" 
              title="Colapsar vista del grupo"
            >
              <ArrowsPointingInIcon className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            <button 
              onClick={handleExpandViewClick} 
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" 
              title="Ampliar vista del grupo"
            >
              <ArrowsPointingOutIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button 
            onClick={toggleMinimize} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200" 
            title="Minimizar grupo"
          >
            <EyeSlashIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Área de Contenido */}
      <div 
        className="flex-grow p-4 space-y-2 overflow-y-auto relative"
        style={{ 
          paddingTop: `${CONTENT_PADDING}px`, 
          paddingBottom: `${CONTENT_PADDING}px`,
          paddingLeft: `${CONTENT_PADDING}px`,
          paddingRight: `${CONTENT_PADDING}px`,
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          isolation: 'isolate',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 12px), transparent calc(100% - 12px))',
          WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 12px), transparent calc(100% - 12px))'
        }}
      >
        {!data.isExpandedView && childNodes.map((node: Node) => ( 
          <div 
            key={node.id} 
            className="flex items-center p-2.5 bg-white rounded-lg border border-gray-200 text-xs hover:bg-gray-50 transition-colors duration-200"
          >
            <ServerIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="ml-2 truncate" title={(node.data as any)?.label || node.id}>
              {(node.data as any)?.label || node.id}
            </span>
          </div>
        ))}
        <div
          className={`
            mt-2 text-center text-xs py-4 border-2 rounded-b-xl transition-all duration-200 ease-in-out
            ${isOver && !data.isExpandedView ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-dashed border-gray-300 text-gray-400 bg-gray-50/50'}
            ${data.isExpandedView && childNodes.length > 0 ? 'min-h-[60px]' : ''}
            ${!data.isExpandedView ? 'sticky bottom-2 left-2 right-2 bg-white/90 z-10' : ''}
          `}
          style={{ flexGrow: data.isExpandedView ? 1 : 0 }}
        >
          {data.isExpandedView 
            ? (childNodes.length === 0 ? 'Área de grupo expandida (vacía)' : 'Nodos hijos renderizados por el flujo') 
            : 'Arrastra nodos aquí'}
        </div>
      </div>

      {/* Handles para el modo normal */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-target"
        style={{ 
          ...handleStyle,
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: isHovered ? 1 : 0
        }}
        isConnectable={true}
        onConnect={(params) => console.log('handle onConnect', params)}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-source"
        style={{ 
          ...handleStyle,
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: isHovered ? 1 : 0
        }}
        isConnectable={true}
        onConnect={(params) => console.log('handle onConnect', params)}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-target"
        style={{ 
          ...handleStyle,
          left: -6,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: isHovered ? 1 : 0
        }}
        isConnectable={true}
        onConnect={(params) => console.log('handle onConnect', params)}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source"
        style={{ 
          ...handleStyle,
          right: -6,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: isHovered ? 1 : 0
        }}
        isConnectable={true}
        onConnect={(params) => console.log('handle onConnect', params)}
      />

      {/* NodeResizer */}
      {!isMinimized && (
        <NodeResizer 
          isVisible={selected}
          minWidth={DEFAULT_WIDTH}
          minHeight={DEFAULT_HEIGHT}
          maxWidth={DEFAULT_WIDTH * 2}
          maxHeight={DEFAULT_HEIGHT * 2}
          lineStyle={{
            borderColor: '#3b82f6',
          }}
          handleStyle={{
            backgroundColor: '#3b82f6',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderRadius: '2px',
          }}
        />
      )}
    </div>
  );
};

NodeGroup.displayName = 'NodeGroup';
export default memo(NodeGroup);
