import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useNodes, Node } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
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
const CHILD_ITEM_HEIGHT = 28; // Altura de cada item en la lista visual
const CHILD_ITEM_SPACING = 4;
// Constantes que daban error, movidas dentro del componente
// const CONTENT_PADDING_TOP = 8;
// const CONTENT_PADDING_BOTTOM = 8;
// const CONTENT_PADDING_HORIZONTAL = 8;
// const MIN_CONTENT_HEIGHT_FOR_MESSAGE = 50;

interface GroupNodeData {
  label: string;
  provider?: 'aws' | 'gcp' | 'azure' | 'generic';
  isCollapsed?: boolean; // Considerar unificar con isMinimized
  isMinimized?: boolean;
  childCount?: number; 
  isExpandedView?: boolean; // Nueva propiedad para controlar la vista expandida
}

interface GroupNodeProps extends NodeProps<GroupNodeData> {
  width?: number;
  height?: number;
  isOver?: boolean; // Añadir explícitamente para asegurar que TypeScript lo reconozca
}

// Helper para obtener un ícono basado en el tipo de nodo hijo (simplificado)
// En una implementación real, esto podría ser más sofisticado o usar props del nodo hijo.
const getChildNodeIcon = (nodeType?: string) => {
  // Ejemplo: mapear tipos de nodo a iconos o usar un genérico
  // if (nodeType === 'aws_ec2_instance') return <ServerIcon className="w-4 h-4 text-orange-500" />;
  return <ServerIcon className="w-4 h-4 text-gray-500" />;
};


const GroupNode: React.FC<GroupNodeProps> = ({ id, data, selected, width, height, dragging, isOver }) => { // Usar isOver directamente
  // Mover constantes aquí para intentar resolver error de "Cannot find name"
  const CONTENT_PADDING_TOP = 8;
  const CONTENT_PADDING_BOTTOM = 8;
  const CONTENT_PADDING_HORIZONTAL = 8;
  const MIN_CONTENT_HEIGHT_FOR_MESSAGE = 50;

  const { setNodes, getNode } = useReactFlow();
  const allNodes = useNodes();

  const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
  const [currentWidthState, setCurrentWidthState] = useState(width || DEFAULT_WIDTH);
  useEffect(() => {
    if (width && !isMinimized) { // Solo actualizar si no está minimizado y width es válido
      setCurrentWidthState(width);
    }
  }, [width, isMinimized]);

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || 'Group');
  const labelInputRef = useRef<HTMLInputElement>(null);

  const childNodes = useMemo(() => {
    return allNodes.filter(n => n.parentId === id)
                   .sort((a, b) => (((a.data as any)?.label || a.id).localeCompare(((b.data as any)?.label || b.id))));
  }, [allNodes, id]);

  // Efecto para actualizar el contador de hijos en data y ocultar/mostrar hijos (para React Flow)
  useEffect(() => {
    const groupNode = getNode(id);
    if (!groupNode) return;

    const newChildCount = childNodes.length;
    let groupDataChanged = false;
    if ((groupNode.data as GroupNodeData)?.childCount !== newChildCount || 
        (groupNode.data as GroupNodeData)?.isMinimized !== isMinimized) {
      groupDataChanged = true;
    }

    // Los nodos hijos se ocultan si el grupo está minimizado,
    // o si el grupo NO está en "vista expandida" (lógica para Fase 2).
    // Por ahora (Fase 1), si no está minimizado, los hijos deben estar "visibles" para RF,
    // pero el GroupNode los renderizará como una lista.
    // Si se quisiera que los nodos hijos reales no ocupen espacio ni sean seleccionables cuando
    // el grupo los muestra como lista, se podrían marcar como hidden: !isMinimized.
    // Pero para que el drag&drop funcione correctamente hacia ellos, deben existir en el flujo.
    // La representación visual es lo que cambia.

    if (groupDataChanged) {
      setNodes(nds => nds.map(n => {
        if (n.id === id) {
          return { ...n, data: { ...(n.data as object), childCount: newChildCount, isMinimized: isMinimized } };
        }
        // Los nodos hijos se manejan visualmente como una lista, no se ocultan aquí necesariamente
        // a menos que la lógica de "vista expandida" (Fase 2) lo requiera.
        return n;
      }));
    }
  }, [id, childNodes.length, isMinimized, getNode, setNodes]); // Eliminado data.isExpandedView de las dependencias


  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      setNodes(nodes =>
        nodes.map(node =>
          node.id === id ? { ...node, data: { ...node.data, label: editedLabel } } : node
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

  const getProviderColor = useCallback(() => {
    const baseColor = (() => {
        switch (data.provider) {
            case 'aws': return 'border-orange-400 bg-orange-50';
            case 'gcp': return 'border-blue-400 bg-blue-50';
            case 'azure': return 'border-sky-400 bg-sky-50';
            default: return 'border-gray-400 bg-gray-50';
        }
    })();
    return selected ? `border-blue-600 ring-2 ring-blue-500/50 ${baseColor.split(' ')[1]}` : baseColor;
  }, [data.provider, selected]);

  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    setNodes(nds => 
      nds.map(n => {
        if (n.id === id) {
          const preservedWidth = n.width ?? (typeof n.style?.width === 'number' ? n.style.width : currentWidthState);
          const currentHeight = n.height ?? (typeof n.style?.height === 'number' ? n.style.height : DEFAULT_HEIGHT);
          
          if (newMinimizedState) {
            setCurrentWidthState(preservedWidth); // Guardar el ancho actual antes de minimizar
          }

          return {
            ...n,
            data: { ...n.data, isMinimized: newMinimizedState },
            style: { 
              ...n.style, 
              width: preservedWidth, // Mantener el ancho preservado
              height: newMinimizedState ? MINIMIZED_HEIGHT : currentHeight
            },
          };
        }
        return n;
      })
    );
  }, [id, isMinimized, setNodes, currentWidthState]); // Quitar width, height de props, usar currentWidthState

  const handleExpandViewClick = useCallback(() => {
    console.log(`Solicitando expandir vista para el grupo ${id}`);
    const event = new CustomEvent('expandGroupView', { detail: { groupId: id } });
    window.dispatchEvent(event);
    // Si está minimizado, desminimizarlo para que FlowEditor pueda trabajar con él.
    // FlowEditor será responsable de ajustar el tamaño si es necesario.
    if (isMinimized) {
      // Se simula un evento de mouse porque toggleMinimize espera uno, aunque no lo use directamente.
      toggleMinimize(new MouseEvent('click') as unknown as React.MouseEvent); 
    }
  }, [id, isMinimized, toggleMinimize]);

  const handleCollapseViewClick = useCallback(() => {
    console.log(`Solicitando colapsar vista para el grupo ${id}`);
    const event = new CustomEvent('collapseGroupView', { detail: { groupId: id } });
    window.dispatchEvent(event);
    // FlowEditor se encargará de actualizar data.isExpandedView y el tamaño del grupo.
  }, [id]);
  
  const getProviderIconForNode = (nodeData: any) => {
    switch (nodeData?.provider) {
      case 'aws': return '☁️';
      case 'gcp': return '🔵';
      case 'azure': return '🔷';
      default: return '📦'; // Icono genérico para nodos dentro de la lista
    }
  };


  if (isMinimized) {
    return (
      <div
        className={`relative px-2 py-1 border rounded-lg bg-white shadow-sm ${getProviderColor()} flex items-center justify-between`}
        style={{ 
          width: `${currentWidthState}px`, // Usar el ancho guardado en el estado local
          height: `${MINIMIZED_HEIGHT}px`,
        }}
      >
        <div className="flex items-center gap-1 overflow-hidden flex-grow">
          <span className="text-xs flex-shrink-0">{getProviderIconForNode(data)}</span>
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={handleLabelKeyDown}
              className="bg-transparent border-none outline-none text-xs text-gray-800 p-0 w-full"
            />
          ) : (
            <span 
              className="font-medium text-gray-700 text-xs cursor-pointer truncate"
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
        
        {/* Handles para el modo minimizado */}
        <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, background: '#9ca3af' }} />
        <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, background: '#9ca3af' }} />
        <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: '#9ca3af' }} />
        <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: '#9ca3af' }} />
      </div>
    );
  }

  // Renderizado normal (no minimizado)
  return (
    <div
      className={`border rounded-lg bg-white/90 shadow-lg ${getProviderColor()} flex flex-col overflow-hidden`}
      style={{ 
        width: width || DEFAULT_WIDTH, // Controlado por NodeResizer o default
        height: height || DEFAULT_HEIGHT, // Controlado por NodeResizer o default
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-2 border-b border-gray-300 nodrag cursor-move"
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
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
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
      
      {/* Área de Contenido: Lista de nodos hijos y mensaje "Arrastra aquí" */}
      <div 
        className="flex-grow p-2 space-y-1 overflow-y-auto relative" // Permitir scroll si la lista es larga
        style={{ 
          paddingTop: `${CONTENT_PADDING_TOP}px`,
          paddingBottom: `${CONTENT_PADDING_BOTTOM}px`,
          paddingLeft: `${CONTENT_PADDING_HORIZONTAL}px`,
          paddingRight: `${CONTENT_PADDING_HORIZONTAL}px`,
        }}
      >
        {/* Si la vista está expandida, FlowEditor renderizará los nodos. GroupNode solo muestra el área. */}
        {/* Si no está expandida (y no minimizada), muestra la lista de hijos. */}
        {!data.isExpandedView && childNodes.map(node => (
          <div key={node.id} className="flex items-center p-1 bg-gray-50 rounded border border-gray-200 text-xs">
            {getChildNodeIcon(node.type)}
            <span className="ml-2 truncate" title={(node.data as any)?.label || node.id}>
              {(node.data as any)?.label || node.id}
            </span>
          </div>
        ))}
        {/* Siempre mostrar el área de drop, pero podría tener un texto diferente si está expandido */}
        <div
          className={`
            mt-2 text-center text-xs py-2 border-2 rounded-md transition-colors duration-200 ease-in-out
            ${isOver && !data.isExpandedView ? 'border-blue-500 text-blue-600' : 'border-dashed border-gray-300 text-gray-400'}
            ${data.isExpandedView && childNodes.length > 0 ? 'min-h-[50px]' : ''}
            ${!data.isExpandedView ? 'sticky bottom-2 left-2 right-2 bg-white/90 z-10' : ''}
          `}
          style={{ flexGrow: data.isExpandedView ? 1 : 0 }} // Ocupar espacio si está expandido
        >
          {data.isExpandedView ? (childNodes.length === 0 ? 'Área de grupo expandida (vacía)' : 'Nodos hijos renderizados por el flujo') : 'Arrastra nodos aquí'}
        </div>
      </div>

      {!isMinimized && (
        <NodeResizer 
          isVisible={selected && !dragging} // Solo visible si seleccionado y no arrastrando
          minWidth={200}
          minHeight={HEADER_HEIGHT + MIN_CONTENT_HEIGHT_FOR_MESSAGE + CONTENT_PADDING_TOP + CONTENT_PADDING_BOTTOM + 20} // +20 para algo de espacio extra
          lineClassName="border-blue-500/50"
          handleClassName="bg-blue-500 border-2 border-white rounded-full w-2 h-2"
        />
      )}
      
      <Handle type="target" position={Position.Top} style={{ width: 10, height: 10, background: '#cbd5e1' }} />
      <Handle type="source" position={Position.Bottom} style={{ width: 10, height: 10, background: '#cbd5e1' }} />
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: '#cbd5e1' }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: '#cbd5e1' }} />
    </div>
  );
};

GroupNode.displayName = 'GroupNode';
export default memo(GroupNode);
