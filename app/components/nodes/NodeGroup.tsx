import { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

interface NodeGroupProps extends NodeProps {
  data: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    isCollapsed?: boolean;
    isMinimized?: boolean;
  };
}

// Tipo extendido para almacenar dimensiones previas
interface ExtendedStyle extends React.CSSProperties {
  previousWidth?: number;
  previousHeight?: number;
}

export default function NodeGroup({ id, data, selected }: NodeGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed !== false);
  const [isMinimized, setIsMinimized] = useState(data.isMinimized === true);
  const [isFocused, setIsFocused] = useState(false);
  const [childNodes, setChildNodes] = useState<Node[]>([]);
  // Almacenar las dimensiones originales al minimizar
  const [originalDimensions, setOriginalDimensions] = useState<{width?: number, height?: number}>({});
  const reactFlowInstance = useReactFlow();
  const groupRef = useRef<HTMLDivElement>(null);
  // Add state for title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(data.label || 'Group');
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Color mapping based on provider - softer than regular nodes
  const getProviderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return 'bg-transparent dark:bg-transparent'; // Removemos cualquier fondo
      case 'gcp':
        return 'bg-transparent dark:bg-transparent';
      case 'azure':
        return 'bg-transparent dark:bg-transparent';
      default:
        return 'bg-transparent dark:bg-transparent';
    }
  }, [data.provider]);

  // Obtener color del borde según proveedor
  const getBorderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return '#f97316'; // Naranja para AWS
      case 'gcp':
        return '#3b82f6'; // Azul para GCP
      case 'azure':
        return '#0ea5e9'; // Azul claro para Azure
      default:
        return '#94a3b8'; // Gris para genérico
    }
  }, [data.provider]);

  // Obtener los nodos hijo de este grupo
  const getChildNodes = useCallback(() => {
    try {
      const allNodes = reactFlowInstance.getNodes();
      return allNodes.filter(node => node.parentNode === id);
    } catch (error) {
      console.error("Error al obtener nodos hijos:", error);
      return [];
    }
  }, [reactFlowInstance, id]);

  // Actualizar la lista de nodos hijo cuando cambia el grupo
  useEffect(() => {
    const updateChildNodes = () => {
      try {
        const currentChildNodes = getChildNodes();
        setChildNodes(currentChildNodes);
      } catch (error) {
        console.error("Error al actualizar nodos hijos:", error);
      }
    };
    
    updateChildNodes();
    
    // Este listener se ejecutará cuando cambien los nodos en el flujo
    const onNodesChange = () => {
      updateChildNodes();
    };
    
    // Registrar y limpiar el listener
    document.addEventListener('nodesChanged', onNodesChange as EventListener);
    return () => {
      document.removeEventListener('nodesChanged', onNodesChange as EventListener);
    };
  }, [getChildNodes]);

  // Actualiza la visibilidad de los nodos hijo - versión corregida
  const updateChildNodesVisibility = useCallback((forceHide = false) => {
    try {
      reactFlowInstance.setNodes(nds => 
        nds.map(n => {
          if (n.parentNode === id) {
            // Ocultar nodos si el grupo está minimizado o colapsado o si se fuerza la ocultación
            const shouldHide = forceHide || isMinimized || isCollapsed;
            
            if (shouldHide) {
              // Guardar el estado original antes de ocultar el nodo
              const originalState = n.data.originalState || { ...n.data };
              
              // Aplicar visibilidad oculta
              return { 
                ...n, 
                hidden: true,
                className: `${n.className || ''} hidden`,
                style: {
                  ...n.style,
                  display: 'none',
                  visibility: 'hidden',
                  opacity: 0
                },
                data: {
                  ...n.data,
                  hidden: true,
                  originalState
                }
              };
            } else {
              // Restaurar nodos - recuperar el estado original completo
              const parentNode = reactFlowInstance.getNode(id);
              if (!parentNode) return n;
              
              const parentWidth = (parentNode.style?.width as number) || 200;
              const parentHeight = (parentNode.style?.height as number) || 150;
              
              // Dimensiones aproximadas para considerar límites
              const nodeWidth = 100; 
              const nodeHeight = 60;
              
              // Ajustar posición para mantener dentro de los límites del grupo
              const newX = Math.max(30, Math.min(n.position.x, parentWidth - nodeWidth - 10));
              const newY = Math.max(40, Math.min(n.position.y, parentHeight - nodeHeight - 10));
              
              // Recuperar estado original si existe
              const originalData = n.data.originalState || n.data;
              delete originalData.hidden; // Eliminar marcador de oculto
              
              return {
                ...n,
                hidden: false,
                className: (n.className || '').replace('hidden', '').trim(),
                position: { x: newX, y: newY },
                style: {
                  ...n.style,
                  display: '',
                  visibility: 'visible',
                  opacity: 1
                },
                data: {
                  ...originalData,
                  // Mantener referencia al estado original por si se vuelve a minimizar
                  originalState: n.data.originalState 
                }
              };
            }
          }
          return n;
        })
      );
      
      // Actualizar las conexiones para asegurar que se muestran correctamente
      if (!isMinimized && !isCollapsed) {
        setTimeout(() => {
          const edges = reactFlowInstance.getEdges();
          reactFlowInstance.setEdges([...edges]);
        }, 10);
      }
      
      // Notificar cambio
      const event = new Event('nodesChanged');
      document.dispatchEvent(event);
    } catch (error) {
      console.error("Error al actualizar visibilidad de nodos:", error);
    }
  }, [reactFlowInstance, id, isMinimized, isCollapsed]);

  // Efecto para sincronizar el estado inicial con manejo de errores
  useEffect(() => {
    try {
      // Actualizar el estado de los nodos hijos cada vez que cambia isMinimized o isCollapsed
      updateChildNodesVisibility();
      
      // Al inicio, si está minimizado, asegurarse que los nodos hijos están ocultos
      if (isMinimized) {
        updateChildNodesVisibility(true);
      }
    } catch (error) {
      console.error("Error en efecto de sincronización:", error);
    }
  }, [isMinimized, isCollapsed, updateChildNodesVisibility]);

  // Handler para cuando el nodo del grupo cambia de tamaño
  const onResize = useCallback((event: any, params: any) => {
    // Cuando el grupo cambia de tamaño, ajustar los nodos hijos
    setTimeout(() => {
      try {
        updateChildNodesVisibility();
      } catch (error) {
        console.error("Error en onResize:", error);
      }
    }, 50);
  }, [updateChildNodesVisibility]);

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    setIsCollapsed(!isCollapsed);
    
    try {
      // Guardar estado en data
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                isCollapsed: !isCollapsed
              }
            };
          }
          return node;
        })
      );

      // Actualizar visibilidad de nodos hijos
      setTimeout(() => {
        updateChildNodesVisibility();
      }, 50);
    } catch (error) {
      console.error("Error en toggleCollapse:", error);
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    
    try {
      // Primero guardar el estado de todos los nodos hijos
      const childNodesWithPositions: Record<string, { x: number, y: number, data: any }> = {};
      
      // Guardar posiciones y estados de los nodos hijos
      if (newMinimizedState) {
        const currentChildNodes = getChildNodes();
        currentChildNodes.forEach(node => {
          childNodesWithPositions[node.id] = {
            x: node.position.x,
            y: node.position.y,
            data: { ...node.data }
          };
        });
        
        // Almacenar esta información en localStorage para recuperarla al maximizar
        try {
          localStorage.setItem(`nodeGroup_${id}_childPositions`, JSON.stringify(childNodesWithPositions));
        } catch (storageError) {
          console.error("Error al guardar las posiciones en localStorage:", storageError);
        }
        
        // Si estamos minimizando, forzar la ocultación de los nodos hijos inmediatamente
        updateChildNodesVisibility(true);
        
        // Guardar las dimensiones originales para restaurarlas después
        const groupNode = reactFlowInstance.getNode(id);
        if (groupNode && groupNode.style) {
          const originalSize = {
            width: (groupNode.style.width as number) || 200,
            height: (groupNode.style.height as number) || 150
          };
          setOriginalDimensions(originalSize);
          
          // Guardar también en localStorage
          try {
            localStorage.setItem(`nodeGroup_${id}_originalSize`, JSON.stringify(originalSize));
          } catch (storageError) {
            console.error("Error al guardar el tamaño original en localStorage:", storageError);
          }
        }
      }
      
      // Luego ajustar tamaño del grupo
      setTimeout(() => {
        // Obtener dimensiones desde localStorage si existen
        let restoredDimensions = originalDimensions;
        if (!newMinimizedState) {
          try {
            const savedSize = localStorage.getItem(`nodeGroup_${id}_originalSize`);
            if (savedSize) {
              restoredDimensions = JSON.parse(savedSize);
            }
          } catch (error) {
            console.error("Error al recuperar dimensiones:", error);
          }
        }
        
        reactFlowInstance.setNodes(nodes =>
          nodes.map(node => {
            if (node.id === id) {
              // Para el modo minimizado, asegurar que el ancho y alto sean iguales (forma circular)
              const minimizedSize = 40;
              
              return {
                ...node,
                style: {
                  ...node.style,
                  width: newMinimizedState ? minimizedSize : (restoredDimensions.width || 200),
                  height: newMinimizedState ? minimizedSize : (restoredDimensions.height || 150),
                  borderRadius: newMinimizedState ? '50%' : '8px', // Circular cuando está minimizado
                  // Asegurar que las propiedades CSS se aplican correctamente
                  overflow: newMinimizedState ? 'hidden' : 'visible',
                },
                data: {
                  ...node.data,
                  isMinimized: newMinimizedState
                }
              };
            }
            return node;
          })
        );
        
        // Si estamos expandiendo, restaurar los nodos hijo con sus posiciones originales
        if (!newMinimizedState) {
          setTimeout(() => {
            // Intentar recuperar las posiciones guardadas
            let savedPositions: Record<string, { x: number, y: number, data: any }> = {};
            try {
              const savedData = localStorage.getItem(`nodeGroup_${id}_childPositions`);
              if (savedData) {
                savedPositions = JSON.parse(savedData);
              }
            } catch (error) {
              console.error("Error al recuperar posiciones:", error);
            }
            
            // Restaurar los nodos hijo con sus posiciones originales
            reactFlowInstance.setNodes(nds => 
              nds.map(n => {
                if (n.parentNode === id) {
                  // Si tenemos la posición guardada para este nodo, usarla
                  const savedNode = savedPositions[n.id];
                  if (savedNode) {
                    return {
                      ...n,
                      hidden: false,
                      className: (n.className || '').replace('hidden', '').trim(),
                      position: { 
                        x: savedNode.x, 
                        y: savedNode.y 
                      },
                      style: {
                        ...n.style,
                        display: '',
                        visibility: 'visible',
                        opacity: 1
                      },
                      data: {
                        ...n.data,
                        hidden: false,
                        // Preservar datos originales si existen
                        ...(savedNode.data || {})
                      }
                    };
                  } else {
                    // Si no hay posición guardada, volver visible pero mantener posición
                    return {
                      ...n,
                      hidden: false,
                      className: (n.className || '').replace('hidden', '').trim(),
                      style: {
                        ...n.style,
                        display: '',
                        visibility: 'visible',
                        opacity: 1
                      },
                      data: {
                        ...n.data,
                        hidden: false
                      }
                    };
                  }
                }
                return n;
              })
            );
            
            // Forzar una actualización de las conexiones para asegurar que se restauran
            setTimeout(() => {
              const edges = reactFlowInstance.getEdges();
              reactFlowInstance.setEdges([...edges]);
            }, 50);
          }, 100); // Incrementar tiempo para asegurar que el grupo ya se redimensionó
        }
      }, 10);
    } catch (error) {
      console.error("Error en toggleMinimize:", error);
    }
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
      // Encontrar este nodo
      const node = reactFlowInstance.getNode(id);
      if (node) {
        // Obtener las dimensiones del viewport
        const { width: viewportWidth, height: viewportHeight } = document.querySelector('.react-flow__viewport')?.getBoundingClientRect() || 
                                                               { width: 1000, height: 600 };
        const nodeWidth = (node.style?.width as number) || 200;
        const nodeHeight = (node.style?.height as number) || 150;
        
        // Calcular zoom para que el grupo llene la mayor parte de la pantalla
        const zoomX = (viewportWidth * 0.8) / nodeWidth;
        const zoomY = (viewportHeight * 0.8) / nodeHeight;
        const zoom = Math.min(zoomX, zoomY, 1.5); // Limitar el zoom máximo
        
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
      // Restablecer la vista para ver todos los nodos
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      
      // Quitar clase de nodo enfocado
      const nodeElement = document.querySelector(`[data-id="${id}"]`);
      if (nodeElement) {
        nodeElement.classList.remove('focused');
      }
    }
  };

  const addNodeToGroup = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    if (isMinimized) return;
    
    // Determinar qué tipo de nodo agregar según el grupo
    let nodeType = 'ec2'; // Default para AWS
    if (data.provider === 'gcp') {
      nodeType = 'compute';
    } else if (data.provider === 'aws') {
      // Determinar tipo de nodo según ID del grupo
      if (id.toLowerCase().includes('micro') || id.toLowerCase().includes('servicio')) {
        nodeType = 'lambda';
      } else if (id.toLowerCase().includes('storage') || id.toLowerCase().includes('almacenamiento')) {
        nodeType = 's3';
      } else if (id.toLowerCase().includes('database') || id.toLowerCase().includes('datos')) {
        nodeType = 'rds';
      }
    }
    
    // Generar un ID único para el nuevo nodo
    const timestamp = Date.now();
    const newNodeId = `${nodeType}-${timestamp}`;
    
    // Obtener el nodo de grupo actual para conocer sus dimensiones
    const groupNode = reactFlowInstance.getNode(id);
    if (!groupNode) return;
    
    const groupWidth = (groupNode.style?.width as number) || 200;
    const groupHeight = (groupNode.style?.height as number) || 150;
    
    // Calcular posición dentro del grupo (asegurar márgenes)
    const currentChildren = getChildNodes();
    const xOffset = 30 + (currentChildren.length % 3) * 60;
    const yOffset = 50 + Math.floor(currentChildren.length / 3) * 50;
    
    // Asegurar que esté dentro de los límites del grupo
    const xPos = Math.min(xOffset, groupWidth - 70);
    const yPos = Math.min(yOffset, groupHeight - 50);
    
    // Crear el nuevo nodo
    const newNode: Node = {
      id: newNodeId,
      type: nodeType,
      position: { x: xPos, y: yPos },
      data: { 
        label: `Service ${currentChildren.length + 1}`,
        description: 'New service',
        provider: data.provider,
        isCollapsed: true
      },
      parentNode: id,
      extent: 'parent',
      draggable: true,
      selectable: true
    };
    
    // Añadir el nodo al flujo
    reactFlowInstance.addNodes(newNode);
    
    // Si el grupo está colapsado, ocultar el nuevo nodo
    if (isCollapsed) {
      setTimeout(() => {
        updateChildNodesVisibility();
      }, 50);
    }
  };

  // Crear un estilo global para los manejadores de redimensionamiento circular
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .circular-resizer {
        border-radius: 50% !important;
      }
      .hidden {
        display: none !important;
      }
      [data-id="${id}"][data-type="group"] {
        z-index: 0;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Limpiar el estilo al desmontar
      document.head.removeChild(styleElement);
    };
  }, [id]);

  // Handle title click and editing
  const startTitleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    // Focus the input after it renders
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 10);
  }, []);

  const saveTitleEdit = useCallback(() => {
    setIsEditingTitle(false);
    // Update the node data with the new label
    reactFlowInstance.setNodes(nodes =>
      nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: titleText.trim() || 'Group'
            }
          };
        }
        return node;
      })
    );
  }, [titleText, id, reactFlowInstance]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitleEdit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitleText(data.label); // Reset to original
    }
  }, [saveTitleEdit, data.label]);

  // Add event listener for context menu actions
  useEffect(() => {
    const handleNodeAction = (event: CustomEvent) => {
      const { action, nodeId, targetNodeIds } = event.detail;
      
      // Only process if this action is for this node
      if (nodeId === id) {
        switch(action) {
          case 'toggleCollapse':
            toggleCollapse({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleMinimize':
            toggleMinimize({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleFocus':
            toggleFocus({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'addNodeToGroup':
            addNodeToGroup({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'addSelectedNodesToGroup':
            // New action to add selected nodes to this group
            if (targetNodeIds && targetNodeIds.length > 0) {
              addNodesToGroup(targetNodeIds);
            }
            break;
          case 'deleteNode':
            // Delete this node
            reactFlowInstance.setNodes(nodes => 
              nodes.filter(node => node.id !== id)
            );
            break;
        }
      }
    };
    
    // Add event listener
    document.addEventListener('nodeAction', handleNodeAction as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('nodeAction', handleNodeAction as EventListener);
    };
  }, [id, toggleCollapse, toggleMinimize, toggleFocus, addNodeToGroup, reactFlowInstance]);

  // Function to add multiple existing nodes to this group - fixed version
  const addNodesToGroup = useCallback((nodeIds: string[]) => {
    if (isMinimized) return;
    
    try {
      // Get the group node for position calculation
      const groupNode = reactFlowInstance.getNode(id);
      if (!groupNode) return;
      
      const groupWidth = (groupNode.style?.width as number) || 200;
      const groupHeight = (groupNode.style?.height as number) || 150;
      
      console.log(`Adding nodes to group: ${id}`, nodeIds);
      console.log("Group dimensions:", groupWidth, groupHeight);
      
      // Spread nodes inside the group
      let positionMap = new Map<string, {x: number, y: number}>();
      
      // Calculate relative positions - use a grid layout
      const margin = 20;
      const cols = 3; // Max 3 nodes per row
      let row = 0;
      let col = 0;
      
      nodeIds.forEach(nodeId => {
        const node = reactFlowInstance.getNode(nodeId);
        if (!node) return;
        
        // Calculate position in grid
        const x = margin + (col * ((groupWidth - margin*2) / cols));
        const y = margin + 30 + (row * 60); // Add extra space for header
        
        positionMap.set(nodeId, {x, y});
        
        // Update grid position
        col++;
        if (col >= cols) {
          col = 0;
          row++;
        }
      });
      
      // Update all specified nodes to belong to this group
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (nodeIds.includes(node.id)) {
            // Use calculated grid position
            const position = positionMap.get(node.id) || { x: 50, y: 50 };
            
            console.log(`Setting node ${node.id} position:`, position);
            
            return {
              ...node,
              parentNode: id,
              extent: 'parent' as const,
              position: position,
              selected: false
            };
          }
          return node;
        })
      );
      
      // Force a redraw of edges
      setTimeout(() => {
        const edges = reactFlowInstance.getEdges();
        reactFlowInstance.setEdges([...edges]);
      }, 50);
    } catch (error) {
      console.error("Error adding nodes to group:", error);
    }
  }, [id, reactFlowInstance, isMinimized]);

  // Si está minimizado, mostrar solo un icono compacto
  if (isMinimized) {
    return (
      <div 
        ref={groupRef}
        className="rounded-full p-1 w-full h-full min-w-[40px] min-h-[40px] flex items-center justify-center relative group"
        style={{
          outline: selected ? `2px solid ${getBorderColor()}` : 'none',
          border: `2px dashed ${getBorderColor()}`,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%', // Forzar siempre borde circular
          overflow: 'hidden' // Evitar que los elementos internos sobresalgan
        }}
        data-provider={data.provider}
        data-type="group"
        data-minimized="true"
        data-id={id}
      >
        {/* Manejar la redimensión del nodo - configurado para mantener forma circular */}
        <NodeResizer 
          minWidth={40}
          minHeight={40}
          isVisible={selected}
          handleClassName="resize-handle circular-resizer"
          lineClassName="resize-line hidden" // Ocultar líneas de redimensionamiento
          onResize={onResize}
          keepAspectRatio={true} // Mantener proporción 1:1 para forma circular
        />
        
        {/* Botón de maximizar más visible y claro */}
        <button
          onClick={toggleMinimize}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center"
          title="Expandir grupo"
        >
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
            {/* Iniciales del grupo con hint visual */}
            <div 
              className="text-xs font-bold text-center bg-white/90 rounded-full w-7 h-7 flex items-center justify-center z-10 group-tooltip"
              title={data.label}
              data-tooltip={data.label}
            >
              {data.label ? data.label.substring(0, 2).toUpperCase() : 'G'}
            </div>
            
            {/* Botón de maximizar más visible y distintivo */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/20 rounded-full transition-all duration-200">
              <div className="bg-white/90 p-1.5 rounded-full flex items-center justify-center shadow-md border border-gray-300">
                <ArrowsPointingOutIcon className="w-5 h-5 text-gray-700" />
              </div>
            </div>
          </div>
        </button>
        
        {/* Handles de conexión */}
        <Handle type="source" position={Position.Right} className="w-2 h-2" />
        <Handle type="target" position={Position.Left} className="w-2 h-2" />
      </div>
    );
  }
  
  // Versión expandida del grupo
  return (
    <div 
      ref={groupRef}
      className="rounded-md p-2 w-full h-full min-w-[200px] min-h-[150px] flex flex-col items-start relative group node-group"
      style={{
        outline: selected ? `2px solid ${getBorderColor()}` : 'none',
        border: `2px dashed ${getBorderColor()}`,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }}
      data-provider={data.provider}
      data-type="group"
      data-id={id}
    >
      {/* Manejar la redimensión del nodo */}
      <NodeResizer 
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        handleClassName="resize-handle"
        lineClassName="resize-line"
        onResize={onResize}
      />

      {/* Controles del grupo - Posicionados fuera del grupo */}
      <div className="group-controls" style={{ top: '-28px', left: '0', position: 'absolute' }}>
        {/* Botón para minimizar */}
        <button
          onClick={toggleMinimize}
          className="bg-white/95 text-gray-700 p-1 rounded-md shadow hover:bg-gray-100 border border-gray-200 z-20 control-button"
          title="Minimizar grupo"
        >
          <ArrowsPointingInIcon className="w-4 h-4" />
        </button>
        
        {/* Opción de colapsar/expandir nodos */}
        <button
          onClick={toggleCollapse}
          className="bg-white/95 text-gray-700 p-1 rounded-md shadow hover:bg-gray-100 border border-gray-200 z-20 control-button"
          title={isCollapsed ? "Expandir nodos" : "Colapsar nodos"}
        >
          {isCollapsed ? <PlusIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
        </button>
        
        {/* Opción de enfocar */}
        <button
          onClick={toggleFocus}
          className="bg-white/95 text-gray-700 p-1 rounded-md shadow hover:bg-gray-100 border border-gray-200 z-20 control-button"
          title={isFocused ? "Ver todos" : "Enfocar en este grupo"}
        >
          <ViewfinderCircleIcon className="w-4 h-4" />
        </button>
        
        {/* Opción de añadir nodo (solo visible si no está colapsado) */}
        {!isCollapsed && (
          <button
            onClick={addNodeToGroup}
            className="bg-white/95 text-gray-700 p-1 rounded-md shadow hover:bg-gray-100 border border-gray-200 z-20 control-button"
            title="Añadir nuevo servicio"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Título del grupo - mejorado para edición */}
      <div 
        className="text-md font-bold mb-2 w-full bg-white/80 dark:bg-gray-800/80 p-1 rounded cursor-pointer z-50 relative group-header editable-title"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          startTitleEdit(e);
        }}
        title="Haz clic para editar el nombre del grupo"
      >
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={saveTitleEdit}
            onKeyDown={handleTitleKeyDown}
            className="w-full p-1 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ zIndex: 9999, pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="w-full text-center py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors clickable-element">
            {data.label || 'Group'}
          </div>
        )}
      </div>

      {/* Contador de servicios */}
      <div className={`text-xs ${isCollapsed ? 'block' : 'hidden'} bg-white/80 dark:bg-gray-700/80 px-2 py-1 rounded-md`}>
        {childNodes.length} {childNodes.length === 1 ? 'servicio' : 'servicios'}
      </div>

      {/* Handles de conexión */}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}