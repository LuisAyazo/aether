import { useCallback, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { MinusIcon, PlusIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

interface BaseResourceNodeProps extends NodeProps {
  data: {
    label: string;
    icon?: React.ReactNode;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    description?: string;
    isCollapsed?: boolean;
    parentNode?: string;
  };
}

export default function BaseResourceNode({ id, data, selected }: BaseResourceNodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed !== false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const reactFlowInstance = useReactFlow();
  
  // Color mapping based on cloud provider
  const getProviderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'gcp':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'azure':
        return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-800';
    }
  }, [data.provider]);
  
  // Efecto para verificar si el nodo está dentro de los límites del grupo padre
  useEffect(() => {
    if (data.parentNode) {
      const parentNode = reactFlowInstance.getNode(data.parentNode);
      const currentNode = reactFlowInstance.getNode(id);
      
      if (parentNode && currentNode) {
        const parentWidth = (parentNode.style?.width as number) || 200;
        const parentHeight = (parentNode.style?.height as number) || 150;
        
        const nodeWidth = (currentNode.style?.width as number) || 100;
        const nodeHeight = (currentNode.style?.height as number) || 50;
        
        let needsAdjustment = false;
        let newPos = { ...currentNode.position };
        
        if (currentNode.position.x < 10) {
          newPos.x = 10;
          needsAdjustment = true;
        } else if (currentNode.position.x > parentWidth - nodeWidth - 10) {
          newPos.x = parentWidth - nodeWidth - 10;
          needsAdjustment = true;
        }
        
        if (currentNode.position.y < 40) { // Margen superior para la cabecera del grupo
          newPos.y = 40;
          needsAdjustment = true;
        } else if (currentNode.position.y > parentHeight - nodeHeight - 10) {
          newPos.y = parentHeight - nodeHeight - 10;
          needsAdjustment = true;
        }
        
        if (needsAdjustment) {
          reactFlowInstance.setNodes(nds => 
            nds.map(n => 
              n.id === id ? { ...n, position: newPos } : n
            )
          );
        }

        // También verificar si el padre está en modo colapsado
        const parentData = parentNode.data;
        if (parentData?.isCollapsed === true || parentData?.isMinimized === true) {
          setIsListView(true);
        } else {
          setIsListView(false);
        }
      }
    }
  }, [id, data.parentNode, reactFlowInstance]);
  
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    setIsCollapsed(!isCollapsed);
    
    // También actualizar el estado en el nodo
    reactFlowInstance.setNodes(nds => 
      nds.map(n => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              isCollapsed: !isCollapsed
            }
          };
        }
        return n;
      })
    );
  };
  
  const toggleFocus = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    const newFocusedState = !isFocused;
    setIsFocused(newFocusedState);
    
    // Disparar evento personalizado para comunicar el estado de foco
    const focusEvent = new CustomEvent('nodeGroupFocus', {
      detail: { nodeId: id, isFocused: newFocusedState }
    });
    window.dispatchEvent(focusEvent);
    
    if (newFocusedState) {
      // Enfocar en este nodo
      const node = reactFlowInstance.getNode(id);
      if (node) {
        const { width: viewportWidth, height: viewportHeight } = 
          document.querySelector('.react-flow__viewport')?.getBoundingClientRect() || 
          { width: 1000, height: 600 };
        
        const nodeWidth = (node.style?.width as number) || 100;
        const nodeHeight = (node.style?.height as number) || 50;
        
        // Calcular zoom para que el nodo llene parte de la pantalla
        const zoomX = (viewportWidth * 0.5) / nodeWidth;
        const zoomY = (viewportHeight * 0.5) / nodeHeight;
        const zoom = Math.min(zoomX, zoomY, 1.5);
        
        // Centrar el nodo en pantalla
        const x = -node.position.x * zoom + (viewportWidth - nodeWidth * zoom) / 2;
        const y = -node.position.y * zoom + (viewportHeight - nodeHeight * zoom) / 2;
        
        // Aplicar la nueva vista
        reactFlowInstance.setViewport({ x, y, zoom }, { duration: 800 });
        
        // Añadir una clase al nodo para que se destaque durante el enfoque
        const nodeElement = document.querySelector(`[data-id="${id}"]`);
        if (nodeElement) {
          nodeElement.classList.add('focused');
        }
      }
    } else {
      // Restablecer la vista
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      
      // Quitar clase de nodo enfocado
      const nodeElement = document.querySelector(`[data-id="${id}"]`);
      if (nodeElement) {
        nodeElement.classList.remove('focused');
      }
    }
  };
  
  const toggleListView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    setIsListView(!isListView);
    
    // Actualizar el estilo del nodo
    reactFlowInstance.setNodes(nds => 
      nds.map(n => {
        if (n.id === id) {
          return {
            ...n,
            className: !isListView ? 'list-node-item' : '',
            style: {
              ...n.style,
              height: !isListView ? 35 : n.style?.height || 50, 
              width: !isListView ? 150 : n.style?.width || 100
            }
          };
        }
        return n;
      })
    );
  };

  // Si estamos en vista de lista (modo compacto)
  if (isListView) {
    return (
      <div 
        className="list-node-item shadow-sm"
        data-provider={data.provider}
        data-id={id}
      >
        {data.icon && (
          <div className="flex-shrink-0 w-4 h-4">
            {data.icon}
          </div>
        )}
        <div className="flex-1 text-xs font-medium truncate">{data.label}</div>
        
        <div className="flex gap-1">
          <button 
            onClick={toggleListView}
            className="bg-white/90 dark:bg-gray-700/90 rounded p-0.5 hover:bg-white shadow-sm z-10"
            title="Cambiar a vista completa"
          >
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        
        {/* Input and output handles más pequeños para lista */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
        />
      </div>
    );
  }
  
  return (
    <div
      data-id={id}
      className={`
        rounded-md border-2 ${getProviderColor()} shadow-sm transition-all duration-300
        ${isCollapsed ? 'min-w-[100px] min-h-[50px] p-2' : 'min-w-[150px] min-h-[80px] p-3'}
        ${isFocused ? 'focused' : ''}
        ${selected ? 'ring-2 ring-primary' : ''}
        relative group
      `}
      data-provider={data.provider}
      style={{
        boxShadow: selected ? '0 0 0 2px var(--primary)' : 'none'
      }}
    >
      {/* NodeResizer para permitir redimensionar el nodo */}
      <NodeResizer 
        minWidth={isCollapsed ? 100 : 150} 
        minHeight={isCollapsed ? 50 : 80} 
        isVisible={selected} 
        lineClassName="border-primary"
        handleClassName="h-3 w-3 bg-white border-2 border-primary rounded z-20"
      />
      
      {/* Toolbar siempre visible */}
      <div className="absolute -top-6 right-1 flex items-center gap-1 node-controls">
        <button 
          onClick={toggleListView}
          className="bg-white/90 dark:bg-gray-700/90 rounded p-1 hover:bg-white shadow-sm z-10"
          title="Cambiar a vista de lista"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        
        <button 
          onClick={toggleFocus}
          className="bg-white/90 dark:bg-gray-700/90 rounded p-1 hover:bg-white shadow-sm z-10"
          title={isFocused ? "Salir de enfoque" : "Enfocar en este nodo"}
        >
          <ViewfinderCircleIcon className="h-3 w-3" />
        </button>
        
        <button 
          onClick={toggleCollapse}
          className="bg-white/90 dark:bg-gray-700/90 rounded p-1 hover:bg-white shadow-sm z-10"
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          {isCollapsed ? 
            <PlusIcon className="h-3 w-3" /> : 
            <MinusIcon className="h-3 w-3" />
          }
        </button>
      </div>
      
      <div className="flex items-center gap-1 overflow-hidden">
        {data.icon && (
          <div className={`flex items-center justify-center ${isCollapsed ? 'w-6 h-6 text-xs' : 'w-8 h-8'}`}>
            {data.icon}
          </div>
        )}
        <div className={`font-medium truncate ${isCollapsed ? 'text-xs' : 'text-sm'}`}>
          {data.label}
        </div>
      </div>
      
      {!isCollapsed && data.description && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-h-20 overflow-y-auto">
          {data.description}
        </div>
      )}
      
      {/* Input and output handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
      />
    </div>
  );
}