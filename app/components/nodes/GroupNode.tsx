import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Handle, Position, useReactFlow, useNodes } from 'reactflow';
// import type { Node, NodeProps } from 'reactflow'; // Se definirán localmente
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

// Tipos workaround
type Node = any;
type NodeProps<T = any> = any; // Hacer NodeProps genérico opcionalmente si se usa así
import { 
  EyeSlashIcon,
  Squares2X2Icon,
  PlusCircleIcon,
  MinusCircleIcon, // Añadir para el botón de colapsar vista expandida
  ServerIcon // Icono genérico para la lista de nodos hijos
} from '@heroicons/react/24/outline';

// Constantes
const HEADER_HEIGHT = 40;
const MINIMIZED_WIDTH = 150; // Ancho cuando está minimizado
const MINIMIZED_HEIGHT = HEADER_HEIGHT; // Alto cuando está minimizado (solo header)
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 200;
// const CHILD_ITEM_HEIGHT = 28; 
// const CHILD_ITEM_SPACING = 4;
const CONTENT_PADDING_TOP = 8;
const CONTENT_PADDING_BOTTOM = 8;
const CONTENT_PADDING_HORIZONTAL = 8;
const MIN_CONTENT_HEIGHT_FOR_MESSAGE = 50;

interface GroupNodeData {
  label: string;
  provider?: 'aws' | 'gcp' | 'azure' | 'generic';
  isCollapsed?: boolean; 
  isMinimized?: boolean;
  childCount?: number; 
  isExpandedView?: boolean; 
}

interface GroupNodeProps extends NodeProps<GroupNodeData> {
  width?: number;
  height?: number;
  isOver?: boolean; 
}

const getChildNodeIcon = (nodeType?: string) => {
  return <ServerIcon className="w-4 h-4 text-gray-500" />;
};

const GroupNode: React.FC<GroupNodeProps> = ({ id, data, selected, width, height, dragging, isOver }) => {
  const { setNodes, getNode } = useReactFlow();
  const allNodes = useNodes();

  const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
  const [currentWidthState, setCurrentWidthState] = useState(width || DEFAULT_WIDTH);
  const [currentHeightState, setCurrentHeightState] = useState(height || DEFAULT_HEIGHT);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (width && !isMinimized) {
      setCurrentWidthState(width);
    }
  }, [width, isMinimized]);

  useEffect(() => {
    if (height && !isMinimized) {
      setCurrentHeightState(height);
    }
  }, [height, isMinimized]);

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || 'Group');
  const labelInputRef = useRef<HTMLInputElement>(null);

  const childNodes = useMemo(() => {
    return allNodes.filter((n: Node) => n.parentId === id)
                   .sort((a: Node, b: Node) => (((a.data as any)?.label || a.id).localeCompare(((b.data as any)?.label || b.id))));
  }, [allNodes, id]);

  useEffect(() => {
    const groupNode = getNode(id);
    if (!groupNode) return;
    const newChildCount = childNodes.length;
    const currentGroupData = groupNode.data as GroupNodeData;
    if (currentGroupData?.childCount !== newChildCount || currentGroupData?.isMinimized !== isMinimized) {
      setNodes((nds: Node[]) => nds.map((n: Node) => {
        if (n.id === id) {
          return { ...n, data: { ...(n.data as GroupNodeData), childCount: newChildCount, isMinimized: isMinimized } };
        }
        return n;
      }));
    }
  }, [id, childNodes.length, isMinimized, getNode, setNodes]);

  useEffect(() => {
    if (typeof data.isMinimized === 'boolean' && data.isMinimized !== isMinimized) {
      setIsMinimized(data.isMinimized);
    }
  }, [data.isMinimized]);

  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      setNodes((nodes: Node[]) =>
        nodes.map((node: Node) =>
          node.id === id ? { ...node, data: { ...(node.data as GroupNodeData), label: editedLabel } } : node
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

  const getProviderSpecificClasses = useCallback(() => { 
    let borderColorClass = 'border-gray-400';
    let bgColorClass = 'bg-gray-50'; 

    switch (data.provider) {
        case 'aws':
            borderColorClass = 'border-orange-400';
            bgColorClass = 'bg-orange-50';
            break;
        case 'gcp':
            borderColorClass = 'border-blue-400';
            bgColorClass = 'bg-blue-50';
            break;
        case 'azure':
            borderColorClass = 'border-sky-400';
            bgColorClass = 'bg-sky-50';
            break;
    }
    if (selected) {
        borderColorClass = 'border-blue-600'; 
    }
    return `${borderColorClass} ${bgColorClass}`;
  }, [data.provider, selected]);

  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    setNodes((nds: Node[]) =>
      nds.map((n: Node) => {
        if (n.id === id) {
          let newWidth, newHeight;
          if (newMinimizedState) { 
            setCurrentWidthState(n.width || currentWidthState || DEFAULT_WIDTH); 
            setCurrentHeightState(n.height || currentHeightState || DEFAULT_HEIGHT); 
            newWidth = n.width || currentWidthState || DEFAULT_WIDTH; 
            newHeight = MINIMIZED_HEIGHT; 
          } else { 
            newWidth = currentWidthState;
            newHeight = currentHeightState;
          }
          return {
            ...n,
            data: { ...n.data, isMinimized: newMinimizedState, isExpandedView: false },
            style: { ...n.style, width: newWidth, height: newHeight },
            width: newWidth,
            height: newHeight,
          };
        }
        if (n.parentId === id) {
          return { ...n, hidden: newMinimizedState };
        }
        return n;
      })
    );
  }, [id, isMinimized, setNodes, currentWidthState, currentHeightState]);

  const handleExpandViewClick = useCallback(() => {
    console.log(`Solicitando expandir vista para el grupo ${id}`);
    const event = new CustomEvent('expandGroupView', { detail: { groupId: id } });
    window.dispatchEvent(event);
    if (isMinimized) {
      toggleMinimize(new MouseEvent('click') as unknown as React.MouseEvent); 
    }
  }, [id, isMinimized, toggleMinimize]);

  const handleCollapseViewClick = useCallback(() => {
    console.log(`Solicitando colapsar vista para el grupo ${id}`);
    const event = new CustomEvent('collapseGroupView', { detail: { groupId: id } });
    window.dispatchEvent(event);
  }, [id]);
  
  const getProviderIconForNode = (nodeData: any) => {
    switch (nodeData?.provider) {
      case 'aws': return '☁️';
      case 'gcp': return '🔵';
      case 'azure': return '🔷';
      default: return '📦';
    }
  };

  if (isMinimized) {
    return (
      <div
        className={`relative px-2 py-1 border rounded-lg bg-white ${getProviderSpecificClasses()} flex items-center justify-between`}
        style={{ 
          width: `${currentWidthState}px`,
          height: `${MINIMIZED_HEIGHT}px`,
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1000,
          transform: 'none !important',
          pointerEvents: 'auto',
          opacity: 1, // Asegurar que el modo minimizado sea visible
        }}
        data-minimized="true"
        data-handleid="group-header"
        data-draggable="false" // Intentar deshabilitar drag para el div interno
        data-selectable="false" // Intentar deshabilitar select para el div interno
      >
        <div className="flex items-center gap-1 overflow-hidden flex-grow">
          <span className="text-xs flex-shrink-0">{getProviderIconForNode(data)}</span>
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 p-0 w-full"
            />
          ) : (
            <span 
              className="font-semibold text-gray-800 text-sm cursor-pointer truncate"
              onClick={() => setIsEditingLabel(true)}
              title={data.label}
            >
              {data.label}
            </span>
          )}
          {childNodes.length > 0 && (
            <span className="ml-1 text-xs text-gray-500 bg-gray-200 px-1 rounded-full flex-shrink-0">
              {childNodes.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-0.5 flex-shrink-0">
          <button
            onClick={handleExpandViewClick}
            className="p-0.5 hover:bg-gray-200/70 rounded"
            title="Ampliar vista del grupo"
          >
            <PlusCircleIcon className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={toggleMinimize}
            className="p-0.5 hover:bg-gray-200/70 rounded"
            title={isMinimized ? "Expandir grupo" : "Minimizar grupo"}
          >
            <Squares2X2Icon className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
        
        <Handle 
          type="target" 
          position={Position.Top} 
          style={{ 
            width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', top: -5,
            opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out'
          }} 
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          style={{ 
            width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', bottom: -5,
            opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out'
          }} 
        />
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ 
            width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', left: -5,
            opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out'
          }} 
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ 
            width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', right: -5,
            opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s ease-in-out'
          }} 
        />
      </div>
    );
  }

  // Renderizado normal (no minimizado)
  return (
    <div
      className={`border rounded-lg bg-white/90 ${getProviderSpecificClasses()} flex flex-col`}
      style={{ 
        width: width || DEFAULT_WIDTH,
        height: height || DEFAULT_HEIGHT,
        zIndex: 1000,
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 cursor-move group-header"
        style={{ height: `${HEADER_HEIGHT}px`, flexShrink: 0 }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-grow">
          <span className="text-sm flex-shrink-0">{getProviderIconForNode(data)}</span>
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={handleLabelKeyDown}
              className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 p-0 w-full"
            />
          ) : (
            <span 
              className="font-semibold text-gray-800 text-sm cursor-pointer truncate"
              onClick={() => setIsEditingLabel(true)}
              title={data.label}
            >
              {data.label}
            </span>
          )}
           {childNodes.length > 0 && (
            <span className="ml-auto mr-1 text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
              {childNodes.length}
            </span>
          )}
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
           {data.isExpandedView ? (
            <button
              onClick={handleCollapseViewClick}
              className="p-1 hover:bg-gray-200/70 rounded"
              title="Colapsar vista del grupo"
            >
              <MinusCircleIcon className="w-4 h-4 text-gray-600" />
            </button>
           ) : (
            <button
              onClick={handleExpandViewClick}
              className="p-1 hover:bg-gray-200/70 rounded"
              title="Ampliar vista del grupo"
            >
              <PlusCircleIcon className="w-4 h-4 text-gray-600" />
            </button>
           )}
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-gray-200/70 rounded"
            title="Minimizar grupo"
          >
            <EyeSlashIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Área de Contenido */}
      <div 
        className="flex-grow p-2 space-y-1 overflow-y-auto relative"
        style={{ 
          paddingTop: `${CONTENT_PADDING_TOP}px`, 
          paddingBottom: `${CONTENT_PADDING_BOTTOM}px`,
          paddingLeft: `${CONTENT_PADDING_HORIZONTAL}px`,
          paddingRight: `${CONTENT_PADDING_HORIZONTAL}px`,
        }}
      >
        {!data.isExpandedView && childNodes.map((node: Node) => ( 
          <div key={node.id} className="flex items-center p-1 bg-gray-50 rounded border border-gray-200 text-xs">
            {getChildNodeIcon(node.type)}
            <span className="ml-2 truncate" title={(node.data as any)?.label || node.id}>
              {(node.data as any)?.label || node.id}
            </span>
          </div>
        ))}
        <div
          className={`
            mt-2 text-center text-xs py-2 border-2 rounded-md transition-colors duration-200 ease-in-out
            ${isOver && !data.isExpandedView ? 'border-blue-500 text-blue-600' : 'border-dashed border-gray-300 text-gray-400'}
            ${data.isExpandedView && childNodes.length > 0 ? 'min-h-[50px]' : ''}
            ${!data.isExpandedView ? 'sticky bottom-2 left-2 right-2 bg-white/90 z-10' : ''}
          `}
          style={{ flexGrow: data.isExpandedView ? 1 : 0 }}
        >
          {data.isExpandedView ? (childNodes.length === 0 ? 'Área de grupo expandida (vacía)' : 'Nodos hijos renderizados por el flujo') : 'Arrastra nodos aquí'}
        </div>
      </div>

      {/* NodeResizer eliminado según solicitud del usuario */}
      {/* {!isMinimized && (
        <NodeResizer 
          isVisible={selected && !dragging} 
          minWidth={200}
          minHeight={HEADER_HEIGHT + MIN_CONTENT_HEIGHT_FOR_MESSAGE + CONTENT_PADDING_TOP + CONTENT_PADDING_BOTTOM + 20} 
          lineClassName="border-blue-600 opacity-75"
          handleClassName="bg-blue-600 border-2 border-white rounded-full w-3.5 h-3.5 hover:bg-blue-700"
        />
      )} */}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', top: -5,
          opacity: 1, 
          transition: 'opacity 0.2s ease-in-out'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', bottom: -5,
          opacity: 1, 
          transition: 'opacity 0.2s ease-in-out'
        }} 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', left: -5,
          opacity: 1, 
          transition: 'opacity 0.2s ease-in-out'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          width: '10px', height: '10px', background: '#555', border: '2px solid white', borderRadius: '50%', right: -5,
          opacity: 1, 
          transition: 'opacity 0.2s ease-in-out'
        }} 
      />
    </div>
  );
};

GroupNode.displayName = 'GroupNode';
export default memo(GroupNode);
