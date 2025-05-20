import { useCallback, useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface BaseResourceNodeProps extends NodeProps {
  data: {
    label: string;
    icon?: React.ReactNode;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    description?: string;
    isCollapsed?: boolean;
    parentNode?: string;
    userResized?: boolean; // New property to track if user manually resized this node
    resizable?: boolean; // New property to enable/disable resizing
  };
}

export default function BaseResourceNode({ id, data, selected }: BaseResourceNodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed !== false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [isResizable, setIsResizable] = useState(data.resizable !== false);
  const reactFlowInstance = useReactFlow();
  
  // Color mapping based on cloud provider
  const getProviderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return {
          border: 'border-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
          text: 'text-orange-600'
        };
      case 'gcp':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
          text: 'text-blue-600'
        };
      case 'azure':
        return {
          border: 'border-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
          text: 'text-blue-400'
        };
      default:
        return {
          border: 'border-gray-300',
          bg: 'bg-white dark:bg-gray-800',
          hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
          text: 'text-gray-600'
        };
    }
  }, [data.provider]);
  
  // Update resizable state when data changes
  useEffect(() => {
    setIsResizable(data.resizable !== false);
  }, [data.resizable]);
  
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
  
  // New function to toggle resizable mode
  const toggleResizable = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from reaching the node
    const newResizableState = !isResizable;
    setIsResizable(newResizableState);
    
    // Update the node data and trigger an event for the parent group
    reactFlowInstance.setNodes(nds => 
      nds.map(n => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              resizable: newResizableState,
              userResized: newResizableState
            }
          };
        }
        return n;
      })
    );
    
    // Dispatch event for the parent group to handle resizing
    if (data.parentNode) {
      const event = new CustomEvent('nodeResized', {
        detail: { 
          nodeId: id, 
          groupId: data.parentNode,
          resizable: newResizableState
        }
      });
      document.dispatchEvent(event);
    }
  };
  
  // Añadir handler para el clic
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Enhanced logging with more details
    console.log('%cBaseResourceNode clicked', 'color: blue; font-weight: bold', {
      id,
      selected,
      isResizable,
      isCollapsed,
      isFocused,
      isListView,
      data,
      eventType: e.type,
      target: e.currentTarget,
      timestamp: new Date().toISOString(),
      eventCoords: { x: e.clientX, y: e.clientY }
    });
  }, [id, selected, isResizable, isCollapsed, isFocused, isListView, data]);

  // Add mouseDown handler for better event tracking
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('%cBaseResourceNode mouseDown', 'color: green; font-weight: bold', {
      id,
      selected,
      timestamp: new Date().toISOString(),
      eventCoords: { x: e.clientX, y: e.clientY }
    });
  }, [id, selected]);
  
  // Modificar onResize para incluir logging y mejor manejo
  const onResize = useCallback((event: any, { width, height }: { width: number; height: number }) => {
    console.log('%cBaseResourceNode resized', 'color: orange; font-weight: bold', {
      id,
      width,
      height,
      timestamp: new Date().toISOString()
    });

    // Actualizar el estado de redimensionamiento
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            style: { ...node.style, width, height },
            data: {
              ...node.data,
              userResized: true,
              resizable: true
            }
          };
        }
        return node;
      })
    );

    // Si el nodo está en un grupo, notificar al grupo del cambio
    if (data.parentNode) {
      const event = new CustomEvent('nodeResized', {
        detail: { 
          nodeId: id, 
          groupId: data.parentNode,
          width, 
          height 
        }
      });
      document.dispatchEvent(event);
    }
  }, [id, data.parentNode, reactFlowInstance]);
  
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

  // Add event listener for context menu actions
  useEffect(() => {
    const handleNodeAction = (event: CustomEvent) => {
      const { action, nodeId } = event.detail;
      
      if (nodeId === id) {
        switch(action) {
          case 'toggleListView':
            toggleListView({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleFocus':
            toggleFocus({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleCollapse':
            toggleCollapse({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleResizable': // Handle new resizable toggle action
            toggleResizable({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'deleteNode':
            reactFlowInstance.setNodes(nodes => 
              nodes.filter(node => node.id !== id)
            );
            break;
        }
      }
    };
    
    document.addEventListener('nodeAction', handleNodeAction as EventListener);
    
    return () => {
      document.removeEventListener('nodeAction', handleNodeAction as EventListener);
    };
  }, [id, toggleListView, toggleFocus, toggleCollapse, toggleResizable, reactFlowInstance]);

  const colors = getProviderColor();
  const nodeClasses = [
    'relative',
    'border-2',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'shadow-sm',
    'hover:shadow-md',
    colors.border,
    colors.bg,
    colors.hover,
    selected ? 'shadow-md' : '',
    isResizable ? 'resizable-node' : ''
  ].filter(Boolean).join(' ');

  // Si estamos en vista de lista (modo compacto)
  if (isListView) {
    return (
      <div 
        className="list-node-item shadow-sm"
        data-provider={data.provider}
        data-id={id}
        data-resizable={isResizable}
        onClick={handleClick}
      >
        {data.icon && (
          <div className="flex-shrink-0 w-4 h-4">
            {data.icon}
          </div>
        )}
        <div className="flex-1 text-xs font-medium truncate">{data.label}</div>
        
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
    <>
      {isResizable && (
        <NodeResizer
          isVisible={selected}
          minWidth={100}
          minHeight={50}
          onResize={onResize}
          handleClassName="resize-handle"
          lineClassName="resize-line"
        />
      )}
      <div className={nodeClasses} style={{ minWidth: '100px', minHeight: '50px' }}>
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-start gap-2">
            {data.icon && (
              <div className={`p-2 rounded-md ${colors.bg}`}>
                {data.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{data.label}</h3>
              {data.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {data.description}
                </p>
              )}
              <div className={`text-xs mt-1 ${colors.bg} px-1.5 py-0.5 rounded-full w-fit ${colors.text}`}>
                {data.provider.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
}