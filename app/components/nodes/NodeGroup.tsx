import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Node } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { 
  PlusIcon, 
  MinusIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon, 
  ViewfinderCircleIcon,
  ArrowTopRightOnSquareIcon, // Nuevo ícono para "Abrir en nueva ventana"
  // Removed ArrowsExpandIcon - it doesn't exist in the Heroicons library
  ArrowsPointingOutIcon as ResizeIcon // Icono para redimensionamiento de nodos
} from '@heroicons/react/24/outline';
import { CustomNode, CustomEdge } from '../../utils/customTypes';
import { debounce } from 'lodash'; // Add this import if not already present

interface NodeGroupProps extends NodeProps {
  data: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    isCollapsed?: boolean;
    isMinimized?: boolean;
    // Nuevos campos para manejo de nodos
    preserveLayout?: boolean;
    nodePositions?: Record<string, any>;
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
  // Nuevo estado para mantener nodos redimensionables
  const [resizableNodes, setResizableNodes] = useState<Set<string>>(new Set());
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

  // Cálculo mejorado del diseño óptimo de nodos con manejo de tamaños personalizados
  const calculateOptimalNodeLayout = useCallback(() => {
    try {
      // Obtener las dimensiones actuales del grupo
      const groupNode = reactFlowInstance.getNode(id);
      if (!groupNode) return null;

      const children = getChildNodes();
      const nodeCount = children.length;
      if (nodeCount === 0) return null;

      const groupWidth = (groupNode.style?.width as number) || 300;
      const groupHeight = (groupNode.style?.height as number) || 200;

      // Márgenes y encabezado mejorados para un padding adecuado
      const headerHeight = 40; // Espacio para elementos del encabezado
      const horizontalMargin = 28; // Padding lateral aumentado
      const verticalMargin = 28; // Padding superior/inferior aumentado
      const spacing = 24; // Mayor espaciado entre nodos

      // Área disponible para los nodos
      const availableWidth = groupWidth - 2 * horizontalMargin;
      const availableHeight = groupHeight - headerHeight - 2 * verticalMargin;
      
      // Verificar si hay nodos con tamaños personalizados establecidos por el usuario
      const hasCustomSizes = children.some(node => 
        node.data?.userResized || 
        resizableNodes.has(node.id) ||
        (node.style && (node.style.width || node.style.height))
      );

      // Obtener posiciones persistentes si existen
      const persistedPositions = groupNode.data?.nodePositions || {};
      
      // Usar diferentes estrategias dependiendo de si hay nodos con tamaños personalizados
      let best = { rows: 1, cols: nodeCount, nodeW: 0, nodeH: 0, area: 0 };
      
      // Obtener información sobre tamaños de los nodos existentes
      const existingLayout = children.reduce((acc, node: Node) => {
        const nodeWidth = (node.style?.width as number) || 0;
        const nodeHeight = (node.style?.height as number) || 0;
        
        if (nodeWidth > 0 && nodeHeight > 0) {
          acc.totalWidth += nodeWidth;
          acc.totalHeight += nodeHeight;
          acc.count += 1;
          acc.hasCustomSizes = acc.hasCustomSizes || resizableNodes.has(node.id) || !!node.data?.userResized;
        }
        return acc;
      }, { totalWidth: 0, totalHeight: 0, count: 0, hasCustomSizes: false });
      
      // Calcular relación de aspecto objetivo basada en los nodos existentes
      const targetAspectRatio = existingLayout.count > 0
        ? (existingLayout.totalWidth / existingLayout.count) / (existingLayout.totalHeight / existingLayout.count)
        : 1.6; // Relación de aspecto predeterminada si no hay layout existente
        
      // Si hay nodos con posiciones personalizadas, intentamos preservarlas
      const shouldPreserveLayout = existingLayout.hasCustomSizes || 
                                  groupNode.data?.preserveLayout ||
                                  Object.keys(persistedPositions).length > 0;

      for (let cols = 1; cols <= nodeCount; cols++) {
        const rows = Math.ceil(nodeCount / cols);
        const totalSpacingX = (cols - 1) * spacing;
        const totalSpacingY = (rows - 1) * spacing;
        
        // Calculate node dimensions based on available space
        const nodeW = Math.floor((availableWidth - totalSpacingX) / cols);
        const nodeH = Math.floor((availableHeight - totalSpacingY) / rows);
        
        // Calculate current aspect ratio of this layout
        const currentAspectRatio = nodeW / nodeH;
        
        // Ensure nodes aren't too small and fit within available space
        if (nodeW < 50 || nodeH < 40) continue; // Increased minimum sizes
        if (cols * nodeW + totalSpacingX > availableWidth + 1) continue;
        if (rows * nodeH + totalSpacingY > availableHeight + 1) continue;
        
        // Calculate area and aspect ratio similarity score
        const area = nodeW * nodeH;
        const aspectRatioScore = 1 / Math.abs(currentAspectRatio - targetAspectRatio);
        
        // Consider both area and aspect ratio in scoring
        const score = area * aspectRatioScore;
        
        if (score > (best.area * (best.area > 0 ? 1 : 0))) {
          best = { 
            rows, 
            cols, 
            nodeW, 
            nodeH, 
            area: score
          };
        }
      }
      
      // Mejorado: fallback si no se encuentra una configuración válida
      if (best.nodeW === 0 || best.nodeH === 0) {
        best.nodeW = Math.max(60, Math.floor((availableWidth - (nodeCount - 1) * spacing) / nodeCount));
        best.nodeH = Math.max(50, Math.floor(availableHeight / 2));
        best.rows = nodeCount > 2 ? 2 : 1;
        best.cols = Math.ceil(nodeCount / best.rows);
      }
      
      // Recopilar información sobre tamaños personalizados
      const nodeSizes = new Map();
      children.forEach(node => {
        // Si el nodo es redimensionable, usar sus dimensiones actuales
        if (resizableNodes.has(node.id) || node.data?.userResized) {
          nodeSizes.set(node.id, {
            width: (node.style?.width as number) || best.nodeW,
            height: (node.style?.height as number) || best.nodeH
          });
        } else {
          // Para nodos no personalizados, usar el tamaño estándar calculado
          nodeSizes.set(node.id, {
            width: best.nodeW,
            height: best.nodeH
          });
        }
      });
      
      return {
        width: best.nodeW,
        height: best.nodeH,
        cols: best.cols,
        rows: best.rows,
        spacing,
        headerHeight,
        horizontalMargin,
        verticalMargin,
        preserveLayout: shouldPreserveLayout,
        nodeSizes
      };
    } catch (error) {
      console.error("Error calculating optimal node layout:", error);
      return null;
    }
  }, [reactFlowInstance, id, getChildNodes, resizableNodes]);

  // Optimización mejorada de nodos con manejo de tamaño y posición
  const optimizeChildNodes = useCallback(() => {
    try {
      const layout = calculateOptimalNodeLayout();
      if (!layout) return;
      
      const { 
        width: nodeWidth, 
        height: nodeHeight, 
        cols, 
        spacing, 
        headerHeight, 
        horizontalMargin, 
        verticalMargin,
        preserveLayout,
        nodeSizes
      } = layout;
      
      const children = getChildNodes();
      if (children.length === 0) return;

      // Obtener el nodo de grupo actual para verificar dimensiones
      const groupNode = reactFlowInstance.getNode(id);
      if (!groupNode) return;
      
      // Persistir las posiciones en los datos del grupo
      const nodePositions: Record<string, any> = {...(groupNode.data?.nodePositions || {})};
      
      // Store the current positions to try to maintain relative positioning when resizing
      const currentPositions = new Map();
      children.forEach((node: Node) => {
        currentPositions.set(node.id, { ...node.position });
      });
      
      // Sort nodes by ID for consistent layout
      const sortedNodes = [...children].sort((a, b) => a.id.localeCompare(b.id));
      
      // Calculate bounding box of current positions
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      if (currentPositions.size > 0) {
        children.forEach(node => {
          const pos = currentPositions.get(node.id);
          const width = (node.style?.width as number) || nodeWidth;
          const height = (node.style?.height as number) || nodeHeight;
          
          minX = Math.min(minX, pos.x);
          minY = Math.min(minY, pos.y);
          maxX = Math.max(maxX, pos.x + width);
          maxY = Math.max(maxY, pos.y + height);
        });
      }
      
      // Determine if we should preserve current positions or use a grid layout
      const hasValidPositions = minX !== Infinity && minY !== Infinity;
      const currentWidth = hasValidPositions ? (maxX - minX + spacing) : 0;
      const currentHeight = hasValidPositions ? (maxY - minY + spacing) : 0;
      
      const availableWidth = (groupNode.style?.width as number) - 2 * horizontalMargin;
      const availableHeight = (groupNode.style?.height as number) - headerHeight - 2 * verticalMargin;
      
      // Use existing positioning if there's sufficient space and nodes aren't repositioned by outside events
      const preservePositions = 
        hasValidPositions && 
        currentWidth <= availableWidth && 
        currentHeight <= availableHeight &&
        (groupNode.data.preserveLayout === true || sortedNodes.length <= 5);
        
      // Actualizar posiciones y dimensiones de los nodos
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.parentNode !== id) return node;
          
          // Obtener dimensiones para este nodo (personalizadas o predeterminadas)
          const nodeSize = nodeSizes?.get(node.id) || { width: nodeWidth, height: nodeHeight };
          const width = nodeSize.width;
          const height = nodeSize.height;
          
          // Si este nodo tiene una posición personalizada o es redimensionable
          const isCustomNode = resizableNodes.has(node.id) || node.data?.userResized;
          
          if ((preserveLayout || isCustomNode) && currentPositions.has(node.id)) {
            // Preservar posiciones existentes con coordenadas normalizadas
            const currentPos = currentPositions.get(node.id);
            
            // Almacenar la posición para persistencia
            nodePositions[node.id] = {
              position: { ...currentPos },
              size: { width, height },
              userResized: isCustomNode
            };
            
            // Asegurar que el nodo no se salga de los límites del grupo
            const x = Math.max(horizontalMargin, Math.min(
              currentPos.x, 
              availableWidth - width + horizontalMargin
            ));
            
            const y = Math.max(headerHeight + verticalMargin, Math.min(
              currentPos.y, 
              availableHeight + headerHeight
            ));
            
            return {
              ...node,
              position: { x, y },
              style: {
                ...node.style,
                width,
                height,
                overflow: 'visible',
                whiteSpace: 'normal'
              },
              data: {
                ...node.data,
                userResized: isCustomNode
              }
            };
          } else {
            // Usar diseño de cuadrícula para nodos nuevos o reposicionados
            const idx = sortedNodes.findIndex(n => n.id === node.id);
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            
            // Calcular posición con márgenes y espaciado
            const x = horizontalMargin + col * (nodeWidth + spacing);
            const y = headerHeight + verticalMargin + row * (nodeHeight + spacing);
            
            // Almacenar la posición para persistencia
            nodePositions[node.id] = {
              position: { x, y },
              size: { width, height },
              userResized: isCustomNode
            };
            
            return {
              ...node,
              position: { x, y },
              style: {
                ...node.style,
                width,
                height,
                overflow: 'visible',
                whiteSpace: 'normal'
              },
              data: {
                ...node.data,
                userResized: isCustomNode
              }
            };
          }
        })
      );
      
      // Guardar posiciones de nodos y marcar el grupo como optimizado
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.id !== id) return node;
          return {
            ...node,
            data: {
              ...node.data,
              preserveLayout: true,
              nodePositions: nodePositions
            }
          };
        })
      );
      
      // Disparar evento para notificar que los nodos han sido optimizados
      document.dispatchEvent(new CustomEvent('nodesOptimized', { 
        detail: { 
          groupId: id,
          nodePositions: nodePositions 
        } 
      }));
    } catch (error) {
      console.error("Error optimizing child nodes:", error);
    }
  }, [reactFlowInstance, id, getChildNodes, calculateOptimalNodeLayout]);

  // Debounced version of optimize function to avoid excessive calculations
  const debouncedOptimizeChildNodes = useCallback(
    debounce(() => optimizeChildNodes(), 100),
    [optimizeChildNodes]
  );

  // Actualizar la lista de nodos hijo cuando cambia el grupo
  useEffect(() => {
    const updateChildNodes = () => {
      try {
        const currentChildNodes = getChildNodes();
        setChildNodes(currentChildNodes);
        
        // Trigger adaptive sizing when child nodes change
        if (currentChildNodes.length > 0 && !isCollapsed && !isMinimized) {
          debouncedOptimizeChildNodes();
        }
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
  }, [getChildNodes, debouncedOptimizeChildNodes, isCollapsed, isMinimized]);

  // Updates child node visibility with improved positioning for modal view
  const updateChildNodesVisibility = useCallback((forceHide = false) => {
    try {
      reactFlowInstance.setNodes(nds => 
        nds.map(n => {
          if (n.parentNode === id) {
            // Hide nodes if group is minimized or collapsed or if forced
            const shouldHide = forceHide || isMinimized || isCollapsed;
            
            if (shouldHide) {
              // Save original state before hiding node to preserve all properties
              // This ensures we can restore the exact same position and styling later
              const originalState = n.data.originalState || { 
                ...n.data,
                originalPosition: { ...n.position },
                originalStyle: { ...n.style },
                originalClassName: n.className
              };
              
              // Apply hidden visibility with complete hiding
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
              // Restore nodes - recover complete original state
              const parentNode = reactFlowInstance.getNode(id);
              if (!parentNode) return n;
              
              // Get parent dimensions for constraints
              const parentWidth = (parentNode.style?.width as number) || 200;
              const parentHeight = (parentNode.style?.height as number) || 150;
              
              // Apply proper padding values
              const horizontalMargin = 28;
              const verticalMargin = 28;
              const headerHeight = 40;
              
              // Node dimensions - either from original state or defaults
              const originalStyle = n.data.originalState?.originalStyle || n.style;
              const nodeWidth = (originalStyle?.width as number) || 100; 
              const nodeHeight = (originalStyle?.height as number) || 60;
              
              // Preserve original position when restoring from hidden state
              // This ensures modal view matches regular view
              let position = { ...n.position };
              
              // If we have stored original position, use that instead
              if (n.data.originalState?.originalPosition) {
                position = { ...n.data.originalState.originalPosition };
              }
              
              // Ensure position is within valid bounds
              const newX = Math.max(
                horizontalMargin, 
                Math.min(position.x, parentWidth - nodeWidth - horizontalMargin)
              );
              
              const newY = Math.max(
                headerHeight + verticalMargin, 
                Math.min(position.y, parentHeight - nodeHeight - verticalMargin)
              );
              
              // Recover original data without hidden marker
              const originalData = n.data.originalState || n.data;
              const cleanData = { ...originalData };
              delete cleanData.hidden;
              delete cleanData.originalState;
              
              return {
                ...n,
                hidden: false,
                className: n.data.originalState?.originalClassName || (n.className || '').replace('hidden', '').trim(),
                position: { x: newX, y: newY },
                style: {
                  ...originalStyle,
                  width: nodeWidth,
                  height: nodeHeight,
                  display: '',
                  visibility: 'visible',
                  opacity: 1,
                  overflow: 'visible',
                  whiteSpace: 'normal'
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
          
          // Optimize node layout whenever nodes are shown (not being hidden)
          if (!forceHide) {
            // Get current child nodes to check if we need to optimize
            const currentChildren = getChildNodes();
            if (currentChildren.length > 0) {
              console.log(`Optimizing ${currentChildren.length} nodes in group ${id}`);
              debouncedOptimizeChildNodes();
            }
          }
        }, 100); // Increased timeout to ensure nodes are fully rendered
      }
      
      // Notificar cambio
      const event = new Event('nodesChanged');
      document.dispatchEvent(event);
    } catch (error) {
      console.error("Error al actualizar visibilidad de nodos:", error);
    }
  }, [reactFlowInstance, id, isMinimized, isCollapsed, debouncedOptimizeChildNodes]);

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

  // Handler for when the group node resizes with improved node positioning
  const onResize = useCallback((event: any, params: { width: number; height: number }) => {
    // When the group changes size, store the new dimensions and properly position child nodes
    try {
      const node = reactFlowInstance.getNode(id);
      if (!node) return;
      
      // Get current child nodes and their positions
      const childNodes = getChildNodes();
      const childNodePositions = new Map();
      
      // Record current positions of all child nodes before resize
      childNodes.forEach((childNode: Node) => {
        childNodePositions.set(childNode.id, { 
          ...childNode.position,
          width: childNode.style?.width as number || 100,
          height: childNode.style?.height as number || 60
        });
      });
      
      // Record previous dimensions and new dimensions
      const prevWidth = node.style?.width as number || 200;
      const prevHeight = node.style?.height as number || 150;
      const newWidth = params.width;
      const newHeight = params.height;
      
      // Calculate scale factors if significant change
      const widthChanged = Math.abs(prevWidth - newWidth) > 5;
      const heightChanged = Math.abs(prevHeight - newHeight) > 5;
      const widthRatio = prevWidth > 0 ? newWidth / prevWidth : 1;
      const heightRatio = prevHeight > 0 ? newHeight / prevHeight : 1;
      
      // Significant resize detected - reposition nodes proportionally
      if ((widthChanged || heightChanged) && childNodes.length > 0) {
        // Calculate padding and safe area
        const horizontalMargin = 28; 
        const verticalMargin = 28;
        const headerHeight = 40;
        
        // First update the group dimensions
        reactFlowInstance.setNodes(nodes => 
          nodes.map(n => {
            if (n.id === id) {
              return {
                ...n,
                style: {
                  ...n.style,
                  width: newWidth,
                  height: newHeight
                },
                // Store that we want to preserve layout for this resize
                data: {
                  ...n.data,
                  preserveLayout: true
                }
              };
            }
            return n;
          })
        );
        
        // Adjust child nodes to maintain relative positions
        if (childNodePositions.size > 0) {
          reactFlowInstance.setNodes(nodes => 
            nodes.map(n => {
              // Skip non-child nodes
              if (n.parentNode !== id) return n;
              
              // Get the saved position data
              const savedPos = childNodePositions.get(n.id);
              if (!savedPos) return n;
              
              // Calculate new position maintaining relative position
              // Apply padding constraints to keep nodes from touching borders
              const newX = Math.max(
                horizontalMargin, 
                Math.min(
                  savedPos.x * widthRatio,
                  newWidth - (savedPos.width || 100) - horizontalMargin
                )
              );
              
              const newY = Math.max(
                headerHeight + verticalMargin, 
                Math.min(
                  savedPos.y * heightRatio, 
                  newHeight - (savedPos.height || 60) - verticalMargin
                )
              );
              
              return {
                ...n,
                position: { x: newX, y: newY }
              };
            })
          );
        }
        
        // Trigger optimized layout after a brief delay to let React Flow settle
        // This ensures everything is properly positioned even after manual adjustments
        setTimeout(() => {
          debouncedOptimizeChildNodes();
        }, 50);
      }
      
      // Create and dispatch a custom event for the resize
      const resizeEvent = new CustomEvent('groupResized', {
        detail: { 
          groupId: id, 
          width: params.width, 
          height: params.height,
          previousWidth: prevWidth,
          previousHeight: prevHeight
        }
      });
      document.dispatchEvent(resizeEvent);
    } catch (error) {
      console.error("Error in onResize:", error);
    }
  }, [reactFlowInstance, id, getChildNodes, debouncedOptimizeChildNodes]);

  // Listen for group resize events and other node changes
  useEffect(() => {
    const handleGroupResize = (event: CustomEvent) => {
      // Only react if this is for our group
      if (event.detail.groupId === id) {
        // We don't need to do anything here because onResize already handles optimization
      }
    };
    
    // Handle node changes that may require optimization of layout
    const handleNodeChanges = (event: CustomEvent) => {
      // Check for events specific to this group
      if (event.detail && event.detail.groupId === id) {
        // If this is a move, add, or delete event, optimize after a delay
        const needsOptimization = 
          event.detail.action === 'nodeAdded' || 
          event.detail.action === 'nodeMoved' ||
          event.detail.action === 'addNodesToGroup';
          
        if (needsOptimization && !isCollapsed && !isMinimized) {
          debouncedOptimizeChildNodes();
        }
      } else {
        // For general events, check if any of our child nodes changed
        // This ensures we catch all node changes within the group
        const childNodeIds = getChildNodes().map(node => node.id);
        
        if (
          childNodeIds.length > 0 && 
          !isCollapsed && 
          !isMinimized && 
          event.detail && 
          event.detail.nodeIds && 
          event.detail.nodeIds.some((nodeId: string) => childNodeIds.includes(nodeId))
        ) {
          debouncedOptimizeChildNodes();
        }
      }
    };
    
    // Register event listeners
    document.addEventListener('groupResized', handleGroupResize as EventListener);
    document.addEventListener('nodesChanged', handleNodeChanges as EventListener);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('groupResized', handleGroupResize as EventListener);
      document.removeEventListener('nodesChanged', handleNodeChanges as EventListener);
    };
  }, [id, getChildNodes, isCollapsed, isMinimized, debouncedOptimizeChildNodes]);

  // Listen for any node changes (internal/external) to trigger optimizations
  useEffect(() => {
    // Handle node changes that may require optimization of layout
    const handleNodeChanges = (event: CustomEvent) => {
      try {
        // Skip optimization if group is collapsed or minimized
        if (isCollapsed || isMinimized) return;
        
        // Only optimize if we have child nodes
        const currentChildNodes = getChildNodes();
        if (currentChildNodes.length === 0) return;

        // Check for events specific to this group
        if (event.detail && event.detail.groupId === id) {
          // If this is a move, add, or delete event, optimize after a delay
          const needsOptimization = 
            event.detail.action === 'nodeAdded' || 
            event.detail.action === 'nodeMoved' ||
            event.detail.action === 'addNodesToGroup';
            
          if (needsOptimization) {
            debouncedOptimizeChildNodes();
          }
        } else if (event.detail && event.detail.nodeIds) {
          // For general events, check if any of our child nodes changed
          const childNodeIds = currentChildNodes.map(node => node.id);
          
          // TypeScript-safe check if any of our children are in the affected nodes
          const nodeIds = event.detail.nodeIds as string[];
          if (nodeIds.some(nodeId => childNodeIds.includes(nodeId))) {
            debouncedOptimizeChildNodes();
          }
        }
      } catch (error) {
        console.error("Error handling node changes:", error);
      }
    };
    
    // Register event listener
    document.addEventListener('nodesChanged', handleNodeChanges as EventListener);
    
    return () => {
      // Clean up event listener
      document.removeEventListener('nodesChanged', handleNodeChanges as EventListener);
    };
  }, [id, getChildNodes, isCollapsed, isMinimized, debouncedOptimizeChildNodes]);
  
  // Nuevo efecto para manejar eventos de redimensionamiento de nodos individuales
  useEffect(() => {
    const handleNodeResize = (event: CustomEvent) => {
      try {
        // Solo procesar si es para un nodo hijo de este grupo
        if (!event.detail || event.detail.groupId !== id) return;
        
        const currentChildNodes = getChildNodes();
        const targetNodeId = event.detail.nodeId;
        
        // Verificar si el nodo es parte de este grupo
        const isOurChild = currentChildNodes.some(node => node.id === targetNodeId);
        if (!isOurChild) return;
        
        // Añadir el nodo al conjunto de nodos redimensionables si no está ya
        if (!resizableNodes.has(targetNodeId)) {
          const newResizableNodes = new Set(resizableNodes);
          newResizableNodes.add(targetNodeId);
          setResizableNodes(newResizableNodes);
        }
        
        // Optimizar la posición de los nodos para acomodar el cambio
        setTimeout(() => {
          debouncedOptimizeChildNodes();
        }, 50);
      } catch (error) {
        console.error("Error al manejar evento de redimensionamiento:", error);
      }
    };
    
    // Registrar listener
    document.addEventListener('nodeResized', handleNodeResize as EventListener);
    
    return () => {
      document.removeEventListener('nodeResized', handleNodeResize as EventListener);
    };
  }, [id, getChildNodes, resizableNodes, debouncedOptimizeChildNodes]);
  
  // Cargar posiciones y estados guardados de los nodos al inicializar el grupo
  useEffect(() => {
    try {
      const groupNode = reactFlowInstance.getNode(id);
      if (!groupNode || !groupNode.data?.nodePositions) return;
      
      // Recuperar información de nodos almacenada en el grupo
      const savedNodePositions = groupNode.data.nodePositions;
      if (!savedNodePositions || Object.keys(savedNodePositions).length === 0) return;
      
      // Cargar información de nodos redimensionables desde los datos guardados
      const resizableNodeIds = new Set<string>();
      
      // Actualizar nodos con las posiciones y tamaños guardados
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          // Solo procesar nodos hijos de este grupo
          if (node.parentNode !== id) return node;
          
          const savedNodeData = savedNodePositions[node.id];
          if (!savedNodeData) return node;
          
          // Si este nodo era redimensionable, guardarlo en el conjunto
          if (savedNodeData.userResized) {
            resizableNodeIds.add(node.id);
          }
          
          return {
            ...node,
            position: savedNodeData.position || node.position,
            style: {
              ...node.style,
              width: savedNodeData.size?.width || node.style?.width || 100,
              height: savedNodeData.size?.height || node.style?.height || 50
            },
            data: {
              ...node.data,
              userResized: savedNodeData.userResized || false
            }
          };
        })
      );
      
      // Actualizar el estado de nodos redimensionables
      if (resizableNodeIds.size > 0) {
        setResizableNodes(resizableNodeIds);
      }
      
    } catch (error) {
      console.error("Error cargando posiciones guardadas:", error);
    }
  }, [id, reactFlowInstance]);

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    try {
      // Guardar estado en data
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                isCollapsed: newCollapsedState
              }
            };
          }
          return node;
        })
      );

      // Actualizar visibilidad de nodos hijos
      setTimeout(() => {
        updateChildNodesVisibility();
        
        // If we're expanding the group (not collapsing it), optimize node layout
        if (!newCollapsedState && !isMinimized) {
          // Use a slightly longer timeout to ensure visibility update completes first
          setTimeout(() => {
            debouncedOptimizeChildNodes();
          }, 100);
        }
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
              
              // After restoring nodes and edges, optimize the layout
              debouncedOptimizeChildNodes();
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
    
    // Calcular posición dentro del grupo (posición temporal, será optimizada después)
    // Posición inicial centrada
    const xPos = groupWidth / 2 - 50;
    const yPos = groupHeight / 2 - 25;
    
    // Crear el nuevo nodo
    const newNode: Node = {
      id: newNodeId,
      type: nodeType,
      position: { x: xPos, y: yPos },
      data: { 
        label: `Service ${getChildNodes().length + 1}`,
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
    } else {
      // Si el grupo está expandido, optimizar la posición de todos los nodos
      // Use a slightly longer timeout to ensure the node is fully added
      setTimeout(() => {
        debouncedOptimizeChildNodes();
      }, 100);
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

  // Function to add multiple existing nodes to this group - fixed version
  const addNodesToGroup = useCallback((nodeIds: string[]) => {
    if (isMinimized) return;
    
    try {
      // Get the group node for position calculation
      const groupNode = reactFlowInstance.getNode(id);
      if (!groupNode) return;
      
      const groupWidth = (groupNode.style?.width as number) || 200;
      const groupHeight = (groupNode.style?.height as number) || 150;
      
      // Set all nodes to have the same initial position (center)
      // We'll let the optimizer arrange them properly afterward
      const centerX = groupWidth / 2 - 50;
      const centerY = groupHeight / 2 - 25;
      
      // Update all specified nodes to belong to this group
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (nodeIds.includes(node.id)) {
            return {
              ...node,
              parentNode: id,
              extent: 'parent' as const,
              position: { x: centerX, y: centerY },
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
        
        // Run the adaptive sizing to optimally arrange the newly added nodes
        if (!isCollapsed) {
          debouncedOptimizeChildNodes();
        }
      }, 100);
      
      // Trigger a nodesChanged event to update any listeners
      const event = new CustomEvent('nodesChanged', {
        detail: { groupId: id, action: 'addNodesToGroup', nodeIds }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error("Error adding nodes to group:", error);
    }
  }, [reactFlowInstance, id, isMinimized, isCollapsed, debouncedOptimizeChildNodes]);

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
  }, [id, toggleCollapse, toggleMinimize, toggleFocus, addNodeToGroup, reactFlowInstance, addNodesToGroup]);
  
  // Get internal edges function
  const getInternalEdges = useCallback(() => {
    // Get all current edges
    const allEdges = reactFlowInstance.getEdges();
    
    // Return edges that have both source and target nodes in this group
    const childNodeIds = getChildNodes().map(node => node.id);
    return allEdges.filter(edge => 
      childNodeIds.includes(edge.source) && childNodeIds.includes(edge.target)
    );
  }, [reactFlowInstance, getChildNodes]);

  // Nueva función para abrir grupo en modal interno
  const openInNewWindow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    
    // Obtener solo los nodos hijos de este grupo (importante: verificar parentNode === id)
    const groupChildren = reactFlowInstance.getNodes().filter(node => node.parentNode === id);
    
    if (groupChildren.length === 0) {
      console.warn('No hay nodos para mostrar en este grupo');
      return;
    }
    
    // Crear copias profundas de los nodos para evitar referencias al estado original
    // y usar nuevos IDs para evitar conflictos
    const processedNodes = groupChildren.map(node => {
      // Generar un nuevo ID que sea realmente único para evitar colisiones
      const newNodeId = `modal_${node.id}_${Date.now()}`;
      
      return {
        ...JSON.parse(JSON.stringify(node)), // Crear una copia profunda para eliminar referencias
        id: newNodeId,
        _originalId: node.id, // Guardamos el ID original como referencia
        // Eliminar totalmente las referencias al grupo padre para mostrarlo aislado
        parentNode: undefined,
        extent: undefined,
        // Forzar visibilidad
        hidden: false,
        style: {
          ...(node.style || {}),
          // Eliminar cualquier estilo heredado del grupo
          border: 'none',
          outline: 'none',
          display: 'block',
          visibility: 'visible',
          opacity: 1
        },
        data: {
          ...(node.data || {}),
          hidden: false,
          _groupId: id // Guardar referencia al grupo original
        }
      } as CustomNode;
    });
    
    // Get existing connections between these nodes only
    const allEdges = reactFlowInstance.getEdges();
    const childNodeIds = groupChildren.map(node => node.id);
    
    // Filtrar conexiones internas del grupo y actualizar los IDs de origen y destino
    const internalEdges = allEdges
      .filter(edge => 
        childNodeIds.includes(edge.source) && childNodeIds.includes(edge.target)
      )
      .map(edge => {
        // Obtener los nodos de origen y destino para encontrar sus nuevos IDs
        const sourceNode = processedNodes.find(n => n._originalId === edge.source);
        const targetNode = processedNodes.find(n => n._originalId === edge.target);
        
        if (!sourceNode || !targetNode) return null;
        
        return {
          ...JSON.parse(JSON.stringify(edge)), // Crear una copia profunda
          id: `modal_${edge.id}_${Date.now()}`,
          source: sourceNode.id,
          target: targetNode.id,
          _originalSource: edge.source,
          _originalTarget: edge.target
        } as CustomEdge;
      })
      .filter(Boolean) as CustomEdge[]; // Eliminar posibles nulls
    
    // Disparar evento para abrir modal
    const openGroupEvent = new CustomEvent('openGroupInView', {
      detail: {
        groupId: id,
        groupLabel: data.label || 'Grupo',
        nodes: processedNodes,
        edges: internalEdges,
        provider: data.provider
      }
    });
    
    document.dispatchEvent(openGroupEvent);
  }, [id, reactFlowInstance, data.label, data.provider]);

  // Nueva función para habilitar/deshabilitar el redimensionamiento de nodos individuales
  const toggleNodeResize = useCallback((nodeId: string) => {
    try {
      // Si el nodo ya es redimensionable, quitar la propiedad
      if (resizableNodes.has(nodeId)) {
        const newResizableNodes = new Set(resizableNodes);
        newResizableNodes.delete(nodeId);
        setResizableNodes(newResizableNodes);
        
        // Desactivar redimensionamiento en el nodo
        reactFlowInstance.setNodes(nodes => 
          nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  userResized: false
                }
              };
            }
            return node;
          })
        );
      } else {
        // Si el nodo no es redimensionable, añadirlo al conjunto
        const newResizableNodes = new Set(resizableNodes);
        newResizableNodes.add(nodeId);
        setResizableNodes(newResizableNodes);
        
        // Activar redimensionamiento en el nodo
        reactFlowInstance.setNodes(nodes => 
          nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  userResized: true
                }
              };
            }
            return node;
          })
        );
      }
      
      // Optimizar el diseño después de cambiar el estado de redimensionamiento
      setTimeout(() => {
        debouncedOptimizeChildNodes();
      }, 50);
      
    } catch (error) {
      console.error("Error al cambiar modo de redimensionamiento:", error);
    }
  }, [reactFlowInstance, resizableNodes, debouncedOptimizeChildNodes]);

  // Manejador para el redimensionamiento de nodos individuales
  const handleChildNodeResize = useCallback((nodeId: string, newWidth: number, newHeight: number) => {
    try {
      // Aplicar nuevas dimensiones al nodo
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              style: {
                ...node.style,
                width: newWidth,
                height: newHeight
              },
              data: {
                ...node.data,
                userResized: true
              }
            };
          }
          return node;
        })
      );
      
      // Asegurarse de que este nodo esté marcado como redimensionable
      if (!resizableNodes.has(nodeId)) {
        const newResizableNodes = new Set(resizableNodes);
        newResizableNodes.add(nodeId);
        setResizableNodes(newResizableNodes);
      }
      
      // Disparar evento de cambio para actualizar el estado
      const event = new CustomEvent('nodeResized', {
        detail: { 
          nodeId, 
          groupId: id,
          width: newWidth,
          height: newHeight
        }
      });
      document.dispatchEvent(event);
      
      // Optimizar el diseño para acomodar el cambio
      debouncedOptimizeChildNodes();
      
    } catch (error) {
      console.error("Error al redimensionar nodo hijo:", error);
    }
  }, [reactFlowInstance, id, resizableNodes, debouncedOptimizeChildNodes]);

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
        
        {/* Título del grupo - versión minimizada */}
        <div 
          className="absolute -top-6 left-0 transform text-xs font-bold bg-white/90 px-2 py-0.5 rounded-t-md shadow-sm z-50"
          style={{ 
            borderBottom: `2px solid ${getBorderColor()}`,
            minWidth: '80px',
            textAlign: 'center'
          }}
          title={data.label}
        >
          {data.label || 'Group'}
        </div>
        
        {/* Controles del grupo - Movidos completamente fuera del grupo para versión minimizada */}
        <div className="absolute -top-6 right-0 z-20 bg-white/90 dark:bg-gray-200/90 p-0.5 rounded-t-md shadow-sm border border-gray-200 flex gap-1"
          style={{
            borderBottom: `2px solid ${getBorderColor()}`
          }}
        >
          {/* Botón de maximizar */}
          <button
            onClick={toggleMinimize}
            className="text-gray-700 p-0.5 rounded-md hover:bg-gray-100 control-button"
            title="Expandir grupo"
          >
            <ArrowsPointingOutIcon className="w-3 h-3" />
          </button>
          
          {/* Opción de enfocar */}
          <button
            onClick={toggleFocus}
            className="text-gray-700 p-0.5 rounded-md hover:bg-gray-100 control-button"
            title={isFocused ? "Ver todos" : "Enfocar en este grupo"}
          >
            <ViewfinderCircleIcon className="w-3 h-3" />
          </button>
        </div>
        
        {/* Iniciales del grupo o indicador visual en el centro del nodo */}
        <div 
          className="text-xs font-bold text-center bg-white/90 rounded-full w-7 h-7 flex items-center justify-center z-10"
          title={data.label}
        >
          {data.label ? data.label.substring(0, 2).toUpperCase() : 'G'}
        </div>
        
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

      {/* Título del grupo - movido afuera */}
      <div 
        className="text-md font-bold absolute z-50 left-0 -top-10 min-w-[150px] bg-white/90 dark:bg-gray-800/90 p-1 px-3 rounded-t-md cursor-pointer group-header editable-title shadow-sm"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          startTitleEdit(e);
        }}
        title="Haz clic para editar el nombre del grupo"
        style={{ 
          borderBottom: `3px solid ${getBorderColor()}`,
          transform: 'translateX(-1px)'
        }}
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

      {/* Controles del grupo - Movidos completamente fuera del grupo */}
      <div className="group-controls-container absolute -top-10 right-0 z-20 bg-white/90 dark:bg-gray-200/90 p-1 rounded-t-md shadow-sm border border-gray-200 flex flex-wrap gap-1 max-w-[180px]"
        style={{
          borderBottom: `3px solid ${getBorderColor()}`
        }}
      >
        {/* Botón para minimizar */}
        <button
          onClick={toggleMinimize}
          className="text-gray-700 p-1 rounded-md hover:bg-gray-100 control-button"
          title="Minimizar grupo"
        >
          <ArrowsPointingInIcon className="w-4 h-4" />
        </button>
        
        {/* Opción de colapsar/expandir nodos */}
        <button
          onClick={toggleCollapse}
          className="text-gray-700 p-1 rounded-md hover:bg-gray-100 control-button"
          title={isCollapsed ? "Expandir nodos" : "Colapsar nodos"}
        >
          {isCollapsed ? <PlusIcon className="w-4 h-4" /> : <MinusIcon className="w-4 h-4" />}
        </button>
        
        {/* Opción de enfocar */}
        <button
          onClick={toggleFocus}
          className="text-gray-700 p-1 rounded-md hover:bg-gray-100 control-button"
          title={isFocused ? "Ver todos" : "Enfocar en este grupo"}
        >
          <ViewfinderCircleIcon className="w-4 h-4" />
        </button>

        {/* NUEVO: Botón para abrir en nueva ventana */}
        <button
          onClick={openInNewWindow}
          className="text-gray-700 p-1 rounded-md hover:bg-gray-100 control-button"
          title="Abrir grupo en nueva ventana"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </button>
        
        {/* Opción de añadir nodo (solo visible si no está colapsado) */}
        {!isCollapsed && (
          <button
            onClick={addNodeToGroup}
            className="text-gray-700 p-1 rounded-md hover:bg-gray-100 control-button"
            title="Añadir nuevo servicio"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contador de servicios - Ahora como una insignia en la parte inferior derecha */}
      <div className={`text-xs absolute bottom-2 right-2 ${isCollapsed ? 'block' : 'hidden'} bg-white/90 dark:bg-gray-200/90 px-2 py-0.5 rounded-full shadow-sm border border-gray-200 text-gray-700 font-semibold`}>
        {childNodes.length} {childNodes.length === 1 ? 'servicio' : 'servicios'}
      </div>

      {/* Handles de conexión */}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}