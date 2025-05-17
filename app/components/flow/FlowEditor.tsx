import { useCallback, useState, useRef, useEffect, useMemo, JSX } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap, 
  ReactFlowProvider,
  Panel,
  Node, 
  Edge,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  addEdge,
  NodeMouseHandler,
  SelectionMode,
  useOnSelectionChange,
  Position, 
  ConnectionMode,
  ReactFlowInstance,
  NodeChange, // Add this import for the type
  Viewport,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  CursorArrowRaysIcon, 
  Square2StackIcon, 
  Square3Stack3DIcon,
  FolderPlusIcon, 
  FolderMinusIcon,
  ArrowsRightLeftIcon,
  SwatchIcon
  // Eliminamos la importación de StopIcon que se usaba para el botón de dibujar forma
} from '@heroicons/react/24/outline';
import GroupFlowEditor from './GroupFlowEditor';
import React from 'react';
import { Diagram } from '@/app/services/diagramService';
import { CustomNode, CustomEdge } from '@/app/utils/customTypes';

interface ResourceCategory {
  name: string;
  items: ResourceItem[];
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
}

interface ResourceItem {
  type: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
}

// Add a new interface for the context menu
interface ContextMenu {
  visible: boolean;
  x: number;
  y: number; // Fixed: changed from string | null to number
  nodeId: string | null; // Fixed: added missing nodeId property
  nodeType: string | null;
  parentInfo?: {
    parentId: string;
    parentType: string | undefined;
  } | null;
}

// Add tool types - Eliminamos drawRectangle
type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea';

interface FlowEditorProps {
  // Props existentes
  nodes?: Node[];
  edges?: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  resourceCategories?: ResourceCategory[];
  
  // Nuevas props para compatibilidad con la página de diagrama
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialViewport?: Viewport;
  onSave?: (diagramData: any) => void;
  
  // Props que se pasan desde la página de diagrama
  companyId?: string;
  environmentId?: string;
  diagramId?: string;
  initialDiagram?: Diagram;
}

const FlowEditorContent = ({ 
  nodes: propNodes, 
  edges: propEdges, 
  initialNodes = [], 
  initialEdges = [],
  initialViewport,
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onSave,
  nodeTypes: externalNodeTypes = {}, 
  edgeTypes,
  resourceCategories = []
}: FlowEditorProps): JSX.Element => {  // Changed from React.ReactNode to JSX.Element
  
  // Properly memoize the nodeTypes to avoid recreation on each render
  const memoizedNodeTypes = useMemo(() => externalNodeTypes, [externalNodeTypes]);

  // Usar los nodos iniciales o los proporcionados directamente
  const [nodes, setNodes] = useState<Node[]>(propNodes || initialNodes);
  const [edges, setEdges] = useState<Edge[]>(propEdges || initialEdges);

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [activeDrag, setActiveDrag] = useState<{ item: any, offset: { x: number, y: number } } | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectionActive, setSelectionActive] = useState(false);
  
  // Add state for context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null
  });

  // Añadir estado para el edge seleccionado
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Manejador para el clic en una línea
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    console.log('Edge clicked:', edge);
    setSelectedEdge(edge);
  }, []);

  // Manejador para eliminar una línea
  const onEdgeDelete = useCallback((edge: Edge) => {
    console.log('Deleting edge:', edge);
    onEdgesChange?.([{ id: edge.id, type: 'remove' }]);
    setSelectedEdge(null);
  }, [onEdgesChange]);

  // Manejador unificado para el clic en el panel
  const handlePaneClick = useCallback(() => {
    setSelectedEdge(null);
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

  // Componente para el botón de eliminar en la línea
  const EdgeDeleteButton = useCallback(({ edge }: { edge: Edge }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
      const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"] path`);
      if (!edgeElement || !(edgeElement instanceof SVGPathElement)) return;

      const pathLength = edgeElement.getTotalLength();
      const midPoint = edgeElement.getPointAtLength(pathLength / 2);
      
      // Convertir las coordenadas SVG a coordenadas de la ventana
      const svgElement = edgeElement.closest('svg');
      if (!svgElement) return;
      
      const point = svgElement.createSVGPoint();
      point.x = midPoint.x;
      point.y = midPoint.y;
      
      // Transformar el punto usando la matriz de transformación del SVG
      const ctm = svgElement.getScreenCTM();
      if (!ctm) return;
      
      const screenPoint = point.matrixTransform(ctm);
      
      setPosition({
        x: screenPoint.x,
        y: screenPoint.y
      });
    }, [edge.id]);

    return (
      <div
        className="edge-delete-button"
        style={{
          left: position.x,
          top: position.y
        }}
        onClick={(e) => {
          e.stopPropagation();
          onEdgeDelete(edge);
        }}
      >
        ×
      </div>
    );
  }, [onEdgeDelete]);

  // Actualizar nodos y bordes cuando cambian las props
  useEffect(() => {
    if (propNodes) setNodes(propNodes);
    else if (initialNodes.length > 0) setNodes(initialNodes);
  }, [propNodes, initialNodes]);

  useEffect(() => {
    if (propEdges) setEdges(propEdges);
    else if (initialEdges.length > 0) setEdges(initialEdges);
  }, [propEdges, initialEdges]);

  // Aplicar viewport inicial si está disponible
  useEffect(() => {
    if (initialViewport && reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.setViewport(initialViewport);
      }, 100);
    }
  }, [initialViewport, reactFlowInstance]);

  // Track if we need to save changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousNodesRef = useRef<string>('');
  const previousEdgesRef = useRef<string>('');
  
  // Guardar automáticamente los cambios cuando cambian los nodos o bordes
  useEffect(() => {
    // Only save when there's an actual change to avoid unnecessary backend calls
    const currentNodesJSON = JSON.stringify(nodes);
    const currentEdgesJSON = JSON.stringify(edges);
    
    if (onSave && reactFlowInstance && 
        (currentNodesJSON !== previousNodesRef.current || 
         currentEdgesJSON !== previousEdgesRef.current)) {
      
      // Update our previous state tracking
      previousNodesRef.current = currentNodesJSON;
      previousEdgesRef.current = currentEdgesJSON;
      
      // Clear previous timeout if it exists
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Set up a new timeout
      saveTimeoutRef.current = setTimeout(() => {
        const flow = reactFlowInstance.toObject();
        onSave(flow);
        saveTimeoutRef.current = null;
      }, 1000); // Debounce for 1 second
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [nodes, edges, onSave, reactFlowInstance]);

  // Añadir estado para edición de nombre de grupo
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Handler para iniciar la edición de nombre de grupo
  const startEditingGroupName = useCallback((groupId: string, currentLabel: string) => {
    setEditingGroup({
      id: groupId,
      label: currentLabel
    });
  }, []);

  // Handler para guardar el nombre editado
  const saveGroupName = useCallback((newName: string) => {
    if (!editingGroup) return;
    
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => 
        node.id === editingGroup.id 
          ? { ...node, data: { ...node.data, label: newName } } 
          : node
      )
    );
    
    setEditingGroup(null);
  }, [editingGroup, reactFlowInstance]);

  // Referencia para la posición del menú flotante
  const selectionMenuRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar la visibilidad del menú flotante cuando hay nodos seleccionados
  const [selectionMenu, setSelectionMenu] = useState({
    visible: false,
    x: 0,
    y: 0
  });

  // Track node selection changes and manage selection menu visibility/position
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes); // Update the selected nodes state
      
      // Manage selection menu visibility and position directly here
      if (nodes.length > 1) {
        // Calculate the position for the menu (centered above selected nodes)
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        nodes.forEach(node => {
          const nodeWidth = (node.width || 150);
          const nodeHeight = (node.height || 80);
          
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        });
        
        // Convert to screen coordinates
        const { x: vpX, y: vpY, zoom } = reactFlowInstance.getViewport();
        const flowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        
        if (flowBounds) {
          // Position the button immediately above the selected nodes
          const centerX = flowBounds.left + ((minX + maxX) / 2 * zoom + vpX);
          const topY = flowBounds.top + (minY * zoom + vpY) - 50; // 50px above the highest node
          
          // Update the menu state: visible and positioned
          setSelectionMenu({
            visible: true,
            x: centerX,
            y: Math.max(topY, flowBounds.top + 10) // Ensure it's not too high
          });
        }
      } else {
        // Hide the menu if 1 or 0 nodes are selected
        setSelectionMenu(prev => ({...prev, visible: false}));
      }
    },
  });

  // Añadir listener global para el evento personalizado de focus
  useEffect(() => {
    const handleNodeFocus = (event: CustomEvent) => {
      const { nodeId, isFocused } = event.detail;
      setFocusedNodeId(isFocused ? nodeId : null);
    };
    
    // Usar un type assertion para CustomEvent
    window.addEventListener('nodeGroupFocus', handleNodeFocus as EventListener);
    return () => {
      window.removeEventListener('nodeGroupFocus', handleNodeFocus as EventListener);
    };
  }, []);

  // Function to center nodes in the viewport
  const centerNodesInViewport = useCallback(() => {
    if (!reactFlowInstance || nodes.length === 0) return;
    
    // Get viewport dimensions
    const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 800 };
    
    // Calculate nodes bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      if (!node.hidden) {
        const nodeWidth = node.width || 150;
        const nodeHeight = node.height || 80;
        
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      }
    });
    
    // Calculate center of nodes
    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    const nodesCenterX = minX + nodesWidth / 2;
    const nodesCenterY = minY + nodesHeight / 2;
    
    // Calculate viewport center
    const viewportCenterX = width / 2;
    const viewportCenterY = height / 2;
    
    // Calculate the translation needed to center nodes
    const zoom = reactFlowInstance.getViewport().zoom || 1;
    const translateX = viewportCenterX - nodesCenterX * zoom;
    const translateY = viewportCenterY - nodesCenterY * zoom;
    
    // Set viewport to center nodes
    reactFlowInstance.setViewport({ 
      x: translateX, 
      y: translateY, 
      zoom 
    });
  }, [reactFlowInstance, nodes, reactFlowWrapper]);

  // Effect to fit view once nodes are loaded and instance is ready
  const fitView = useCallback(() => {
    if (!reactFlowInstance) return;

    setTimeout(() => {
      reactFlowInstance.fitView({
        padding: 0.2,
        includeHiddenNodes: false,
        duration: 800 // Animación más suave
      });
    }, 50);
  }, [reactFlowInstance]);
  
  // Usar esta función mejorada en lugar de fitView directo
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Esperar a que los componentes estén renderizados
      fitView();
    }
  }, [reactFlowInstance, nodes, fitView]);

  // This function declaration is removed because it's already defined earlier in the code

  // Function to create a new empty group
  const createEmptyGroup = useCallback((provider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic') => {
    // Get viewport center position
    const { x: vpX, y: vpY, zoom } = reactFlowInstance.getViewport();
    const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 800 };

    // Use screenToFlowPosition instead of project
    const position = reactFlowInstance.screenToFlowPosition({
      x: width / 2,
      y: height / 2
    });

    // Generate unique ID
    const timestamp = Date.now();
    const newGroupId = `group-${timestamp}`;

    // Create new group node
    const newGroup: Node = {
      id: newGroupId,
      type: 'group',
      position,
      data: {
        label: 'New Group',
        provider,
        isCollapsed: false,
        isMinimized: false
      },
      style: {
        width: 300,
        height: 200
      }
    };

    // Add the group to the flow
    onNodesChange?.([{ type: 'add', item: newGroup }]);
    
    // Notify about node addition - for node optimization systems
    setTimeout(() => {
      const event = new CustomEvent('nodesChanged', {
        detail: { 
          action: 'nodeAdded',
          nodeIds: [newGroupId]
        }
      });
      document.dispatchEvent(event);
    }, 100);
    
    return newGroupId;
  }, [reactFlowInstance, onNodesChange, reactFlowWrapper]);

  // Mejorar el cálculo para que los nodos nunca sobresalgan, no se solapen y siempre estén dentro del grupo, incluso tras refrescar
  const calculateNodeSize = useCallback((groupId: string) => {
    const group = reactFlowInstance.getNode(groupId);
    if (!group) return { width: 150, height: 80, cols: 1, rows: 1, spacing: 16, headerHeight: 40, horizontalMargin: 20, verticalMargin: 20, minNodeMargin: 16 };
  
    const childNodes = reactFlowInstance.getNodes().filter((n: Node) => n.parentNode === groupId);
    const nodeCount = childNodes.length;
    if (nodeCount === 0) return { width: 150, height: 80, cols: 1, rows: 1, spacing: 16, headerHeight: 40, horizontalMargin: 20, verticalMargin: 20, minNodeMargin: 16 };
  
    // Margins and header
    const headerHeight = 40;
    const minNodeMargin = 16;
    const horizontalMargin = 20;
    const verticalMargin = 20;
    const spacing = 16;
    const groupWidth = (group.style?.width as number) || 300;
    const groupHeight = (group.style?.height as number) || 200;
  
    // Available area for nodes (dejar margen para bordes y separación)
    const availableWidth = groupWidth - 2 * horizontalMargin;
    const availableHeight = groupHeight - headerHeight - 2 * verticalMargin;
  
    // Buscar la mejor cuadrícula (más cuadrada posible, sin solapamiento)
    let best = { rows: 1, cols: nodeCount, nodeW: 0, nodeH: 0, area: 0 };
    for (let cols = 1; cols <= nodeCount; cols++) {
      const rows = Math.ceil(nodeCount / cols);
      const totalSpacingX = (cols - 1) * spacing;
      const totalSpacingY = (rows - 1) * spacing;
      const nodeW = Math.floor((availableWidth - totalSpacingX) / cols);
      const nodeH = Math.floor((availableHeight - totalSpacingY) / rows);
      // Asegura que los nodos no se solapen ni sean demasiado pequeños
      if (nodeW < 40 || nodeH < 32) continue;
      // Además, asegura que todos los nodos caben en el área disponible
      if (cols * nodeW + totalSpacingX > availableWidth + 1) continue;
      if (rows * nodeH + totalSpacingY > availableHeight + 1) continue;
      const area = nodeW * nodeH;
      if (area > best.area) best = { rows, cols, nodeW, nodeH, area };
    }
    // Fallback si nada es válido
    if (best.nodeW === 0 || best.nodeH === 0) {
      best.nodeW = Math.max(40, Math.floor(availableWidth / nodeCount));
      best.nodeH = Math.max(32, Math.floor(availableHeight));
      best.rows = 1;
      best.cols = nodeCount;
    }
  
    return {
      width: best.nodeW,
      height: best.nodeH,
      cols: best.cols,
      rows: best.rows,
      spacing,
      headerHeight,
      horizontalMargin,
      verticalMargin,
      minNodeMargin
    };
  }, [reactFlowInstance]);
  
  const optimizeNodesInGroup = useCallback((groupId: string) => {
    const group = reactFlowInstance.getNode(groupId);
    if (!group) return;
  
    const childNodes = reactFlowInstance.getNodes().filter((n: Node) => n.parentNode === groupId);
    if (childNodes.length === 0) return;
  
    const {
      width: nodeWidth,
      height: nodeHeight,
      cols,
      spacing,
      headerHeight,
      horizontalMargin,
      verticalMargin
    } = calculateNodeSize(groupId);
  
    // Reordenar nodos por id para que el layout sea determinista y consistente tras refrescar
    const sortedChildNodes = [...childNodes].sort((a, b) => a.id.localeCompare(b.id));
  
    // Posicionar nodos en la cuadrícula, sin solapamiento y sin tocar bordes
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (node.parentNode !== groupId) return node;
      const idx = sortedChildNodes.findIndex((n: Node) => n.id === node.id);
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      // Calcular posición para que haya separación entre nodos y bordes
      const x = horizontalMargin + col * (nodeWidth + spacing);
      const y = headerHeight + verticalMargin + row * (nodeHeight + spacing);
  
      return {
        ...node,
        position: { x, y },
        style: {
          ...node.style,
          width: nodeWidth,
          height: nodeHeight,
          overflow: 'visible',
          whiteSpace: 'normal'
        },
        data: {
          ...node.data,
          isSmall: false
        }
      };
    });
  
    reactFlowInstance.setNodes(updatedNodes);
  }, [reactFlowInstance, calculateNodeSize]);

  // Modificamos groupSelectedNodes para optimizar los nodos dentro del grupo
  const groupSelectedNodes = useCallback(() => {
    console.log("Agrupando nodos seleccionados:", selectedNodes.length);
    if (selectedNodes.length < 2) {
      console.warn("Se necesitan al menos 2 nodos para agrupar");
      return;
    }

    // Verificar que tenemos al menos 2 nodos para agrupar
    if (selectedNodes.length < 2) {
      console.warn("Se necesitan al menos 2 nodos para agrupar");
      return;
    }

    // Get positions of selected nodes to determine group boundaries
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Determine provider from selected nodes (use most common)
    const providerCounts: Record<string, number> = {};
    
    selectedNodes.forEach(node => {
      // Calculate boundaries
      const nodeWidth = (node.width || 150);
      const nodeHeight = (node.height || 80);
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
      
      // Count providers
      const provider = node.data?.provider || 'generic';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    // Determine most common provider
    let mostCommonProvider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic';
    let maxCount = 0;
    
    Object.entries(providerCounts).forEach(([provider, count]) => {
      if (count > maxCount) {
        mostCommonProvider = provider as any;
        maxCount = count;
      }
    });

    // Add padding to group
    const paddingHorizontal = 50;
    const paddingVerticalTop = 60; // Más espacio para el header
    const paddingVerticalBottom = 40;
    
    minX -= paddingHorizontal;
    minY -= paddingVerticalTop; 
    maxX += paddingHorizontal;
    maxY += paddingVerticalBottom;
    
    const width = Math.max(250, maxX - minX); // Garantizar tamaño mínimo
    const height = Math.max(180, maxY - minY);
    
    // Create group node
    const timestamp = Date.now();
    const newGroupId = `group-${timestamp}`;
    
    const newGroup: Node = {
      id: newGroupId,
      type: 'group',
      position: { x: minX, y: minY },
      data: {
        label: 'Grupo',
        provider: mostCommonProvider,
        isCollapsed: false,
        isMinimized: false
      },
      style: {
        width,
        height
      }
    };
    
    console.log("Creando grupo con dimensiones:", {width, height, minX, minY, maxX, maxY});
    
    // Update all selected nodes to be children of this group
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
        console.log(`Añadiendo nodo ${node.id} al grupo ${newGroupId}`);
        return {
          ...node,
          parentNode: newGroupId,
          extent: 'parent' as const,
          position: {
            x: node.position.x - minX,
            y: node.position.y - minY
          },
          selected: false
        };
      }
      return node;
    });
    
    // Add the group and update nodes
    console.log(`Actualizando flujo con ${updatedNodes.length} nodos + grupo nuevo`);
    reactFlowInstance.setNodes([...updatedNodes, newGroup]);
    
    // Optimizar la posición de los nodos dentro del grupo
    setTimeout(() => optimizeNodesInGroup(newGroupId), 50);
    
    // Clear selection after creating the group
    return newGroupId;
  }, [selectedNodes, reactFlowInstance, optimizeNodesInGroup]);

  // Function to ungroup selected groups
  const ungroupNodes = useCallback(() => {
    console.log("Desagrupando nodos seleccionados");
    // Obtener nodos seleccionados que son de tipo 'group'
    const selectedGroupNodes = selectedNodes.filter(node => node.type === 'group');
    
    if (selectedGroupNodes.length === 0) {
      // Si no hay ningún grupo seleccionado, verificar si el usuario ha seleccionado nodos que están dentro de grupos
      const nodesInGroups = selectedNodes.filter(node => node.parentNode);
      
      if (nodesInGroups.length > 0) {
        // Si hay nodos dentro de grupos, extraer los IDs de los grupos para desagruparlos
        const parentGroupIds = [...new Set(nodesInGroups.map(node => node.parentNode))].filter(Boolean) as string[];
        console.log("Desagrupando los grupos padres:", parentGroupIds);
        
        if (parentGroupIds.length > 0) {
          // Eliminar los grupos y mover los nodos fuera
          const allNodes = reactFlowInstance.getNodes();
          
          const updatedNodes = allNodes.map(node => {
            if (parentGroupIds.includes(node.id)) {
              // Este es un grupo que debemos eliminar
              console.log(`Eliminando grupo ${node.id}`);
              return null;
            }
            
            if (node.parentNode && parentGroupIds.includes(node.parentNode)) {
              // Este nodo pertenece a un grupo que estamos eliminando
              // Buscar el grupo padre para obtener su posición
              const parentGroup = allNodes.find((n: Node) => n.id === node.parentNode);
              
              if (parentGroup) {
                console.log(`Moviendo nodo ${node.id} fuera del grupo ${node.parentNode}`);
                return {
                  ...node,
                  parentNode: undefined,
                  extent: undefined,
                  position: {
                    x: parentGroup.position.x + node.position.x,
                    y: parentGroup.position.y + node.position.y
                  }
                };
              }
            }
            
            return node;
          }).filter(Boolean) as Node[];
          
          // Actualizar el flujo con los nodos modificados
          reactFlowInstance.setNodes(updatedNodes);
          return;
        }
      }
      
      console.warn("No hay grupos seleccionados para desagrupar");
      return;
    }
    
    // Get all nodes
    const allNodes = reactFlowInstance.getNodes();
    
    // Get IDs of groups to ungroup
    const groupsToUngroup = selectedGroupNodes.map(group => group.id);
    console.log("Grupos a desagrupar:", groupsToUngroup);
    
    // Create updated nodes array
    const updatedNodes = allNodes.map(node => {
      // If this is a child node of a group being ungrouped
      if (node.parentNode && groupsToUngroup.includes(node.parentNode)) {
        // Find the parent group
        const parentGroup = allNodes.find((n: Node) => n.id === node.parentNode);
        
        if (parentGroup) {
          // Calculate absolute position
          console.log(`Moviendo nodo ${node.id} fuera del grupo ${node.parentNode}`);
          return {
            ...node,
            parentNode: undefined,
            extent: undefined,
            position: {
              x: parentGroup.position.x + node.position.x,
              y: parentGroup.position.y + node.position.y
            }
          };
        }
      }
      
      // Remove the groups being ungrouped
      if (groupsToUngroup.includes(node.id)) {
        console.log(`Eliminando grupo ${node.id}`);
        return null;
      }
      
      // Keep other nodes unchanged
      return node;
    }).filter(Boolean) as Node[];
    
    // Update the flow with the new nodes
    reactFlowInstance.setNodes(updatedNodes);
  }, [selectedNodes, reactFlowInstance]);

  // Handle toolbar button clicks with precise selection behavior
  const handleToolClick = useCallback((tool: ToolType) => {
    if (tool === activeTool) return; // Don't update if it's already the active tool
    
    // Reset states first
    setSelectionActive(false);
    // Eliminamos referencias a isDrawingRectangle y drawingRectangle
    document.body.classList.remove('lasso-selection-mode');
    // Eliminamos clase draw-rectangle-mode

    // Process the tool
    if (tool === 'lasso') {
      setSelectionActive(true);
      document.body.classList.add('lasso-selection-mode');
      // Reset selections
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node => ({
          ...node,
          selected: false,
          selectable: true
        }))
      );
    }
    // Eliminamos condición de drawRectangle
    
    // Special immediate-action tools
    let shouldSwitchBackToSelect = false;
    
    switch(tool) {
      case 'createGroup':
        createEmptyGroup();
        shouldSwitchBackToSelect = true;
        break;
      case 'group':
        groupSelectedNodes();
        shouldSwitchBackToSelect = true;
        break;
      case 'ungroup':
        ungroupNodes();
        shouldSwitchBackToSelect = true;
        break;
    }

    // Set the active tool (to select if we did an immediate action)
    setActiveTool(shouldSwitchBackToSelect ? 'select' : tool);
  }, [activeTool, createEmptyGroup, groupSelectedNodes, ungroupNodes, reactFlowInstance]);

  // Añadimos un nuevo efecto para manejar los atajos de teclado y la selección múltiple
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Shift+S para activar modo lasso
      if (event.shiftKey && event.key === 's') {
        handleToolClick('lasso');
      }
      // Escape para volver al modo de selección normal
      if (event.key === 'Escape' && activeTool === 'lasso') {
        handleToolClick('select');
      }
      
      // Agregar soporte para selección múltiple con Shift
      if (event.shiftKey) {
        document.body.classList.add('multi-selection-mode');
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      // Quitar modo de selección múltiple cuando se suelta la tecla Shift
      if (event.key === 'Shift') {
        document.body.classList.remove('multi-selection-mode');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.classList.remove('multi-selection-mode');
    };
  }, [activeTool, handleToolClick]);

  // Función para verificar si un nodo está dentro de un grupo
  const isInsideGroup = (position: { x: number, y: number }, group: Node) => {
    const groupX = group.position.x;
    const groupY = group.position.y;
    const groupWidth = (group.style?.width as number) || 200;
    const groupHeight = (group.style?.height as number) || 150;
    
    // Añadir un pequeño margen para evitar detección en el borde exacto
    const margin = 5;
    
    return (
      position.x >= groupX + margin && 
      position.x <= groupX + groupWidth - margin && 
      position.y >= groupY + margin && 
      position.y <= groupY + groupHeight - margin
    );
  };

  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
    
    // Calcular el desplazamiento entre el cursor y el elemento arrastrado
    const dragElement = event.currentTarget as HTMLDivElement;
    const rect = dragElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    setActiveDrag({ 
      item: nodeData, 
      offset: { x: offsetX, y: offsetY } 
    });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      try {
        const dataStr = event.dataTransfer.getData('application/reactflow');
        const nodeData = JSON.parse(dataStr);
        
        // Obtener posición con screenToFlowPosition
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        });
        
        // Check if we're dropping on a group
        let parentNode: string | undefined = undefined;
        let adjustedPosition = { ...position };
        
        // Check for groups that aren't minimized
        const groups = reactFlowInstance.getNodes()
          .filter(node => node.type === 'group' && !node.data?.isMinimized);
        
        // Ordenar grupos por tamaño (más pequeño primero) para manejar grupos anidados correctamente
        const sortedGroups = [...groups].sort((a, b) => {
          const aSize = (a.style?.width as number || 200) * (a.style?.height as number || 150);
          const bSize = (b.style?.width as number || 200) * (b.style?.height as number || 150);
          return aSize - bSize; // Del más pequeño al más grande
        });
        
        for (const group of sortedGroups) {
          if (isInsideGroup(position, group)) {
            parentNode = group.id;
            
            // Calculate position relative to the parent
            adjustedPosition = {
              x: position.x - group.position.x,
              y: position.y - group.position.y
            };
            break;
          }
        }
        
        // Create unique node ID
        const timestamp = Date.now();
        const newNodeId = `${nodeData.type}-${timestamp}`;
        
        // Create the node at the cursor position
        const newNode: Node = {
          id: newNodeId,
          type: nodeData.type,
          position: adjustedPosition,
          data: { 
            label: nodeData.name,
            description: nodeData.description,
            provider: nodeData.provider,
            isCollapsed: true
          },
          draggable: true,
          selectable: true,
        };
        
        // Add parent relationship if needed
        if (parentNode) {
          newNode.parentNode = parentNode;
          newNode.extent = 'parent' as const;
          
          // Asegurar que no esté demasiado cerca del borde
          adjustedPosition.x = Math.max(10, adjustedPosition.x);
          adjustedPosition.y = Math.max(30, adjustedPosition.y); // Más espacio arriba para el encabezado
        }
        
        // Add the node to the flow
        onNodesChange?.([{ type: 'add', item: newNode }]);
        setActiveDrag(null);
        
        // Si se añadió a un grupo, optimizar layout
        if (parentNode) {
          setTimeout(() => optimizeNodesInGroup(parentNode), 50);
        }
      } catch (error) {
        console.error('Error adding new node:', error);
        setActiveDrag(null);
      }
    },
    [reactFlowInstance, onNodesChange, optimizeNodesInGroup]
  );
  
  // Limpiar arrastre activo cuando termina el arrastre
  const onDragEnd = () => {
    setActiveDrag(null);
  };

  // Función para verificar y actualizar la posición de los nodos cuando se mueven
  const onNodeDragStop = useCallback<NodeMouseHandler>((event: React.MouseEvent, node: Node) => {
    const nodePos = node.position;
    const nodeAbsolutePos = node.parentNode 
      ? { 
          x: nodePos.x + reactFlowInstance.getNode(node.parentNode)!.position.x,
          y: nodePos.y + reactFlowInstance.getNode(node.parentNode)!.position.y 
        }
      : nodePos;
    
    // Check if node was dragged onto a group (only if it's not already in a group or dragged to a different group)
    const groups = reactFlowInstance.getNodes()
      .filter(n => n.type === 'group' && !n.data?.isMinimized && n.id !== node.parentNode);
    
    // Sort groups by size (smallest first) to handle nested groups correctly
    const sortedGroups = [...groups].sort((a, b) => {
      const aSize = (a.style?.width as number || 200) * (a.style?.height as number || 150);
      const bSize = (b.style?.width as number || 200) * (b.style?.height as number || 150);
      return aSize - bSize; 
    });
    
    // Check if node is dragged over a group
    for (const group of sortedGroups) {
      const isInside = isInsideGroup(nodeAbsolutePos, group);
      
      if (isInside) {
        // Calculate position relative to the new parent
        const relativePos = {
          x: nodeAbsolutePos.x - group.position.x,
          y: nodeAbsolutePos.y - group.position.y
        };
        
        // Add node to the group
        reactFlowInstance.setNodes(nodes => 
          nodes.map(n => {
            if (n.id === node.id) {
              return {
                ...n,
                parentNode: group.id,
                extent: 'parent',
                position: relativePos
              };
            }
            return n;
          })
        );
        
        // Optimize the group layout after a short delay
        setTimeout(() => optimizeNodesInGroup(group.id), 50);
        return;
      }
    }
    
    // If node already belongs to a group, handle boundaries
    if (node.parentNode) {
      const parentNode = reactFlowInstance.getNode(node.parentNode);
      if (!parentNode) return;
      
      // Obtener dimensiones del grupo padre
      const parentWidth = (parentNode.style?.width as number) || 200;
      const parentHeight = (parentNode.style?.height as number) || 150;
      
      // Obtener dimensiones aproximadas del nodo
      // Usar las dimensiones reales del nodo si están disponibles
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 80;
      
      // Calcular límites seguros dentro del grupo padre (con margen)
      const marginX = 10;
      const marginY = 10;
      const headerHeight = 30; // Espacio para el encabezado del grupo
      
      // Crear nuevas coordenadas limitadas
      let newPos = { ...node.position };
      let needsAdjustment = false;
    
    // Ajustar posición X si es necesario
    if (newPos.x < marginX) {
      newPos.x = marginX;
      needsAdjustment = true;
    } else if (newPos.x > parentWidth - nodeWidth - marginX) {
      newPos.x = Math.max(marginX, parentWidth - nodeWidth - marginX);
      needsAdjustment = true;
    }
    
    // Ajustar posición Y si es necesario
    if (newPos.y < headerHeight) {
      newPos.y = headerHeight;
      needsAdjustment = true;
    } else if (newPos.y > parentHeight - nodeHeight - marginY) {
      newPos.y = Math.max(headerHeight, parentHeight - nodeHeight - marginY);
      needsAdjustment = true;
    }
    
    // Aplicar ajustes si son necesarios
    if (needsAdjustment) {
      reactFlowInstance.setNodes(nds => 
        nds.map((n: Node) => 
          n.id === node.id ? { ...n, position: newPos } : n
        )
      );
    }
    }
  }, [reactFlowInstance, optimizeNodesInGroup]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Handle right-click on nodes - improve context menu options
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    // Prevent default context menu
    event.preventDefault();
    
    console.log(`Context menu opened for node: ${node.id}, type: ${node.type}`); // Log para depuración
    
    // Get parent info if the node has a parent
    const parentInfo = node.parentNode ? 
      { parentId: node.parentNode, parentType: reactFlowInstance.getNode(node.parentNode)?.type } : 
      null;
    
    // Show our custom context menu with correct position
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type ?? null, // Asegúrate que node.type no sea undefined
      parentInfo: parentInfo
    });
  }, [reactFlowInstance]);
  
  // Close context menu when clicking elsewhere
  const onPaneClick = useCallback(() => {
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

  // Handle context menu actions with enhanced functionality
  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu.nodeId) return;
    
    const node = reactFlowInstance.getNode(contextMenu.nodeId);
    if (!node) return;

    console.log(`Handling action "${action}" for node ${contextMenu.nodeId} (type: ${contextMenu.nodeType})`); // Log para depuración
    
    // Nueva acción para renombrar grupo
    if (action === 'renameGroup' && contextMenu.nodeType === 'group') {
      startEditingGroupName(contextMenu.nodeId, node.data?.label || 'Group');
      setContextMenu(prev => ({...prev, visible: false}));
      return;
    }
    
    // Handle node removal from group
    if (action === 'removeFromGroup' && node.parentNode) {
      // Get parent position for calculating absolute position
      const parentNode = reactFlowInstance.getNode(node.parentNode);
      if (parentNode) {
        reactFlowInstance.setNodes(nodes => 
          nodes.map((n: Node) => {
            if (n.id === contextMenu.nodeId) {
              return {
                ...n,
                parentNode: undefined,
                extent: undefined,
                position: {
                  x: parentNode.position.x + n.position.x,
                  y: parentNode.position.y + n.position.y
                }
              };
            }
            return n;
          })
        );
      }
      setContextMenu(prev => ({...prev, visible: false}));
      return;
    }
    
    // Handle specific actions for groups when we have selected nodes
    if (action === 'addSelectedNodesToGroup' && contextMenu.nodeType === 'group') {
      // Get IDs of all currently selected nodes that aren't the group itself
      const nodesToAdd = selectedNodes
        .filter((n: Node) => n.id !== contextMenu.nodeId)
        .map((n: Node) => n.id);
      
      // Create a custom event to trigger adding these nodes to the group
      const actionEvent = new CustomEvent('nodeAction', {
        detail: {
          action,
          nodeId: contextMenu.nodeId,
          nodeType: contextMenu.nodeType,
          targetNodeIds: nodesToAdd
        }
      });
      document.dispatchEvent(actionEvent);
      
      // Hide the context menu
      setContextMenu(prev => ({...prev, visible: false}));
      return;
    }

    // Handle rectangle customization
    if (contextMenu.nodeType === 'rectangle') {
      console.log("Action is for a rectangle node."); // Log específico
      if (action === 'changeBackgroundColor') {
        const newColor = prompt('Introduce el nuevo color de fondo (ej: rgba(0,0,255,0.1) o #aabbcc):', node.data.backgroundColor);
        if (newColor !== null) { // Check for null in case user cancels prompt
          console.log("Changing background color to:", newColor); // Log
          reactFlowInstance.setNodes(nds => 
            nds.map((n: Node) => 
              n.id === contextMenu.nodeId 
                ? { ...n, data: { ...n.data, backgroundColor: newColor } } 
                : n
            )
          );
        }
        setContextMenu(prev => ({...prev, visible: false}));
        return;
      }
      if (action === 'changeBorder') {
        const newBorder = prompt('Introduce el nuevo estilo de borde (ej: 2px dashed red):', node.data.border);
        if (newBorder !== null) { // Check for null in case user cancels prompt
          console.log("Changing border to:", newBorder); // Log
          reactFlowInstance.setNodes(nds => 
            nds.map((n: Node) => 
              n.id === contextMenu.nodeId 
                ? { ...n, data: { ...n.data, border: newBorder } } 
                : n
            )
          );
        }
        setContextMenu(prev => ({...prev, visible: false}));
        return;
      }
    }
    
    // Create a custom event to trigger the appropriate action (for other node types)
    // Ensure this doesn't run if we handled rectangle actions above
    if (contextMenu.nodeType !== 'rectangle' || (action !== 'changeBackgroundColor' && action !== 'changeBorder')) {
       const actionEvent = new CustomEvent('nodeAction', {
         detail: {
           action,
           nodeId: contextMenu.nodeId,
           nodeType: contextMenu.nodeType
         }
       });
       document.dispatchEvent(actionEvent);
    }
    
    // Nueva acción para optimizar el layout de un grupo
    if (action === 'optimizeGroupLayout' && contextMenu.nodeType === 'group') {
      optimizeNodesInGroup(contextMenu.nodeId!);
      setContextMenu(prev => ({...prev, visible: false}));
      return;
    }
    
    // Hide the context menu
    setContextMenu(prev => ({...prev, visible: false}));
  }, [contextMenu, reactFlowInstance, selectedNodes, startEditingGroupName, optimizeNodesInGroup]);

  // Handle deletion of nodes and groups properly
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    // Find groups being deleted
    const groupsToDelete = nodesToDelete.filter(node => node.type === 'group').map(node => node.id);
    
    if (groupsToDelete.length > 0) {
      // Handle child nodes for each deleted group
      reactFlowInstance.setNodes(currentNodes => {
        // First, find all affected child nodes
        const affectedNodes = currentNodes.filter(node => 
          node.parentNode && groupsToDelete.includes(node.parentNode)
        );
        
        // Then either:
        // Option 1: Delete all child nodes along with their parent groups
        return currentNodes.filter(node => 
          !(groupsToDelete.includes(node.id) || 
            (node.parentNode && groupsToDelete.includes(node.parentNode)))
        );
        
        // Option 2 (Uncomment to use): Move child nodes out to the main canvas
        /*
        return currentNodes.map(node => {
          if (node.parentNode && groupsToDelete.includes(node.parentNode)) {
            // Get parent position
            const parent = currentNodes.find((n: Node) => n.id === node.parentNode);
            if (parent) {
              // Make absolute position
              return {
                ...node,
                parentNode: undefined,
                extent: undefined,
                position: {
                  x: parent.position.x + node.position.x,
                  y: parent.position.y + node.position.y
                }
              };
            }
          }
          // Remove the group itself
          return groupsToDelete.includes(node.id) ? null : node;
        }).filter(Boolean) as Node[];
        */
      });
    }
  }, [reactFlowInstance]);

  // Add this new custom handler for selection in lasso mode
  const onSelectionStart = useCallback((event: React.MouseEvent) => {
    // Only handle in lasso mode
    if (activeTool !== 'lasso') return;
    
    // Check if we're clicking on a node (to allow dragging even in lasso mode)
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const nodeElement = element?.closest('.react-flow__node');
    
    if (nodeElement) {
      // If clicking on a node, let the normal drag behavior happen
      return;
    }
    
    // Mark we're handling this event to prevent default behaviors
    event.preventDefault();
    
    // Starting position
    const startPos = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Track movement
    let hasMoved = false;
    let selectionBox: { x1: number; y1: number; x2: number; y2: number } = { x1: 0, y1: 0, x2: 0, y2: 0 };
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-selection-overlay';
    overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; // Azul transparente
    overlay.style.border = '2px dashed #3b82f6'; // Borde discontinuo azul
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none'; // Evitar que interfiera con otros elementos
    overlay.style.zIndex = '9999'; // Ensure it's on top
    document.body.appendChild(overlay);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      hasMoved = true;
      
      // Calculate selection box
      selectionBox = {
        x1: Math.min(startPos.x, moveEvent.clientX),
        y1: Math.min(startPos.y, moveEvent.clientY),
        x2: Math.max(startPos.x, moveEvent.clientX),
        y2: Math.max(startPos.y, moveEvent.clientY)
      };
      
      // Update overlay
      overlay.style.left = `${selectionBox.x1}px`;
      overlay.style.top = `${selectionBox.y1}px`;
      overlay.style.width = `${selectionBox.x2 - selectionBox.x1}px`;
      overlay.style.height = `${selectionBox.y2 - selectionBox.y1}px`;
      overlay.style.display = 'block';
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.removeChild(overlay);
      
      // If no movement, treat as a click - select node under cursor
      if (!hasMoved) {
        // Get element at click position
        const element = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const nodeElement = element?.closest('.react-flow__node');
        
        if (nodeElement) {
          const nodeId = nodeElement.getAttribute('data-id');
          if (nodeId) {
            // Select just this node using React Flow's internal mechanism
            reactFlowInstance.setNodes(nodes => 
              nodes.map(node => ({
                ...node,
                selected: node.id === nodeId
              }))
            );
          }
        }
        return;
      }
      
      // Calculate flow coordinates for selection
      const flowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!flowBounds) return;
      
      const { zoom, x: vpX, y: vpY } = reactFlowInstance.getViewport();
      
      // Find nodes in selection
      const nodesToSelect = reactFlowInstance.getNodes().filter(node => {
        // Skip hidden nodes
        if (node.hidden) return false;
        
        // Get node bounds in screen coordinates
        const nodeLeft = flowBounds.left + (node.position.x * zoom + vpX);
        const nodeTop = flowBounds.top + (node.position.y * zoom + vpY);
        const nodeWidth = (node.width || 150) * zoom;
        const nodeHeight = (node.height || 80) * zoom;
        const nodeRight = nodeLeft + nodeWidth;
        const nodeBottom = nodeTop + nodeHeight;
        
        // Check if node overlaps with selection
        return (
          nodeRight >= selectionBox.x1 &&
          nodeLeft <= selectionBox.x2 &&
          nodeBottom >= selectionBox.y1 &&
          nodeTop <= selectionBox.y2
        );
      });
      
      // Update selection in ReactFlow
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => ({
          ...node,
          selected: nodesToSelect.some(n => n.id === node.id)
        }))
      );
      
      // Show the selection menu if multiple nodes are selected
      if (nodesToSelect.length > 1) {
        // Position the menu above the selection area
        const menuX = (selectionBox.x1 + selectionBox.x2) / 2;
        const menuY = selectionBox.y1 - 25; // Position above the selection box
        
        setTimeout(() => {
          setSelectionMenu({
            visible: true,
            x: menuX,
            y: Math.max(menuY, flowBounds.top + 10)
          });
        }, 10);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
  }, [activeTool, reactFlowInstance, reactFlowWrapper]); // Removed setSelectionMenu dependency

  // Función para crear un grupo con los nodos seleccionados
  const createGroupWithSelectedNodes = useCallback(() => {
    console.log("Creando grupo con nodos:", selectedNodes);
    
    if (selectedNodes.length > 1) {
      // Llamar explícitamente a la función de agrupación
      const groupId = groupSelectedNodes();
      console.log("Grupo creado con ID:", groupId);
      
      // Ocultar el menú
      setSelectionMenu({ ...selectionMenu, visible: false });
    } else {
      console.warn("Se necesitan al menos 2 nodos para crear un grupo");
    }
  }, [selectedNodes, groupSelectedNodes, selectionMenu]);

  // Nueva función para debug que nos muestra en consola cuando los nodos seleccionados cambian
  useEffect(() => {
    console.log("Nodos seleccionados actualizados:", selectedNodes.length);
    console.log("IDs:", selectedNodes.map(n => n.id).join(", "));
  }, [selectedNodes]);

  // Añadir estado para modal del grupo con valores iniciales más completos
  const [groupViewModal, setGroupViewModal] = useState<{
    isOpen: boolean;
    groupId: string | null;
    nodes: Node[];
    edges: Edge[];
    groupLabel: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    nodeChanges: boolean; // Flag para rastrear si se hicieron cambios
  }>({
    isOpen: false,
    groupId: null,
    nodes: [],
    edges: [],
    groupLabel: 'Grupo',
    provider: 'generic',
    nodeChanges: false
  });

  // Añadir listener para eventos de abrir grupo
  useEffect(() => {
    const handleOpenGroup = (event: CustomEvent) => {
      const { groupId, groupLabel, nodes: groupNodes, edges: groupEdges, provider } = event.detail;
      
      if (groupId) {
        // Asegurarse de que los nodos que se muestran no tengan parentNode
        // Esto es crucial para verlos como si estuvieran en su propio stage
        const isolatedNodes = groupNodes.map((node: Node) => ({
          ...node,
          // Eliminar cualquier referencia al grupo padre
          parentNode: undefined,
          extent: undefined,
          // Asegurar que no haya estilo de grupo
          style: {
            ...(node.style || {}),
            border: 'none',
            outline: 'none',
            // Asegurar que los nodos son visibles
            display: '',
            visibility: 'visible',
            opacity: 1
          },
          data: {
            ...(node.data || {}),
            hidden: false
          }
        }));
        
        setGroupViewModal({
          isOpen: true,
          groupId,
          groupLabel: groupLabel || 'Grupo',
          nodes: isolatedNodes || [],
          edges: groupEdges || [],
          provider: provider || 'generic',
          nodeChanges: false
        });
        
        // Center nodes in next tick after modal is opened
        setTimeout(() => {
          // Dispatch a custom event to tell GroupFlowEditor to center nodes
          document.dispatchEvent(new CustomEvent('centerGroupNodes'));
        }, 100);
      }
    };
    
    // Registrar el listener
    document.addEventListener('openGroupInView', handleOpenGroup as EventListener);
    
    return () => {
      document.removeEventListener('openGroupInView', handleOpenGroup as EventListener);
    };
  }, []);

  // The optimizeNodesInGroup function is already defined earlier in the component
  // Removed duplicate declaration to fix "Cannot redeclare block-scoped variable" error

  // Create a ref at component level to track recent updates and prevent infinite loops
  const updateTimeRef = useRef<number>(0);
  
  // Añadir listener para eventos de actualización del grupo
  useEffect(() => {
    const debounceTimeMs = 1000; // Wait 1 second between updates to prevent loops
    
    const handleGroupUpdate = (event: CustomEvent) => {
      console.log("Received updateGroupNodes event:", event.detail);
      const { groupId, nodes: updatedNodes, edges: updatedEdges, hasNewNodes } = event.detail;
      
      // Prevent multiple rapid updates (debounce)
      const currentTime = Date.now();
      if (currentTime - updateTimeRef.current < debounceTimeMs) {
        console.log("Debouncing group update - too soon after last update");
        return;
      }
      
      // Update the timestamp
      updateTimeRef.current = currentTime;
      
      if (groupId && updatedNodes && reactFlowInstance) {
        // Create a "safe" copy of the nodes with new references to avoid mutation issues
        const safeUpdatedNodes = updatedNodes.map((n: Node) => ({...n}));
        
        // Batch the state updates to minimize renders
        reactFlowInstance.setNodes(currentNodes => {
          const nodesWithoutGroup = currentNodes.filter((n: Node) => n.id !== groupId);
          return [...nodesWithoutGroup, ...safeUpdatedNodes];
        });
        
        if (updatedEdges && updatedEdges.length > 0) {
          reactFlowInstance.setEdges(currentEdges => {
            // Keep edges that don't connect to the updated nodes
            const edgesToKeep = currentEdges.filter(edge => {
              const isSourceInUpdated = safeUpdatedNodes.some((n: Node) => n.id === edge.source);
              const isTargetInUpdated = safeUpdatedNodes.some((n: Node) => n.id === edge.target);
              return !(isSourceInUpdated || isTargetInUpdated);
            });
            
            // Add the updated edges
            return [...edgesToKeep, ...updatedEdges];
          });
        }
      }
    };
    
    document.addEventListener('updateGroupNodes', handleGroupUpdate as EventListener);
    
    return () => {
      document.removeEventListener('updateGroupNodes', handleGroupUpdate as EventListener);
    };
  }, [reactFlowInstance]);

  // Crear un manejador específico para el reset de zoom
  const handleResetView = useCallback(() => {
    if (reactFlowInstance) {
      // Primero reiniciamos el viewport a un estado neutral
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
      
      // Luego ajustamos la vista para ver todos los nodos
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.2,
          includeHiddenNodes: false,
          duration: 500
        });
      }, 50);
    }
  }, [reactFlowInstance]);
  // Renombrar esta función para evitar conflictos con la prop onNodesChange
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // Primero llamamos al handler original
    if (onNodesChange) {
      onNodesChange(changes);
    }

    // Buscamos cambios que impliquen añadir un nodo a un grupo
    changes.forEach(change => {
      if (change.type === 'select' && change.selected === true) {
        const node = reactFlowInstance.getNode(change.id);
        if (node && node.parentNode) {
          // Si un nodo dentro de un grupo se selecciona, verificamos su posición
          setTimeout(() => {
            const parentNode = reactFlowInstance.getNode(node.parentNode!);
            if (parentNode) {
              // Add your code here that was missing in the original
              optimizeNodesInGroup(node.parentNode!);
            }
          }, 0);
        }
      }
    });
  }, [reactFlowInstance, optimizeNodesInGroup, onNodesChange]);

  // Estado para la herramienta de conexión entre nodos
  const [connectionTool, setConnectionTool] = useState<{
    isActive: boolean;
    sourceNodeId: string | null;
  }>({
    isActive: false,
    sourceNodeId: null
  });
  
  // Manejador para cuando se activa la herramienta de flecha de conexión
  useEffect(() => {
    if (activeTool === 'connectNodes') {
      // Activar el modo de conexión
      setConnectionTool({
        isActive: true,
        sourceNodeId: null
      });
      
      // Cambiar el cursor para indicar que estamos en modo conexión
      document.body.classList.add('connection-mode');
      
      // Hacemos los nodos seleccionables para poder elegir origen y destino
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node => ({
          ...node,
          selectable: true
        }))
      );
    } else {
      // Desactivar el modo de conexión cuando se cambia a otra herramienta
      setConnectionTool({
        isActive: false,
        sourceNodeId: null
      });
      document.body.classList.remove('connection-mode');
    }
  }, [activeTool, reactFlowInstance]);

  // Estado para la herramienta de dibujo de área
  const [areaTool, setAreaTool] = useState<{
    isDrawing: boolean;
    startPos: { x: number; y: number } | null;
    areaSize: { width: number; height: number } | null;
    backgroundColor: string;
    borderColor: string;
    borderStyle: string;
  }>({
    isDrawing: false,
    startPos: null,
    areaSize: null,
    backgroundColor: 'rgba(135, 206, 250, 0.2)', // Color por defecto
    borderColor: '#3b82f6',
    borderStyle: '2px solid'
  });
  
  // Manejador para cuando se activa la herramienta de dibujo de área
  useEffect(() => {
    if (activeTool !== 'drawArea') return;
    
    // Cambiar el cursor para indicar que estamos en modo dibujo
    document.body.classList.add('draw-area-mode');
    
    let isDrawing = false;
    let startPos: { x: number; y: number } | null = null;
    
    // Colores predefinidos para la paleta
    const predefinedColors = [
      { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', name: 'Azul' },
      { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', name: 'Verde' },
      { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', name: 'Naranja' },
      { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', name: 'Rosa' },
      { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', name: 'Púrpura' },
      { bg: 'rgba(249, 168, 212, 0.15)', border: '#f9a8d4', name: 'Rosa claro' },
      { bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24', name: 'Ámbar' },
      { bg: 'rgba(156, 163, 175, 0.15)', border: '#9ca3af', name: 'Gris' }
    ];
    
    // Desactivar cualquier evento de arrastre estándar de ReactFlow mientras estamos en modo dibujo
    const disableDragging = () => {
      document.body.classList.add('drawing-mode-active');
    };
    
    const enableDragging = () => {
      document.body.classList.remove('drawing-mode-active');
    };
    
    // Llamar a la función para deshabilitar el arrastre al activar el modo dibujo
    disableDragging();
    
    const handleMouseDown = (event: MouseEvent) => {
      // Verificar que es el botón izquierdo y que se está presionando Shift
      if (event.button !== 0 || !event.shiftKey) return;
      
      // Verificar que el clic sea en el canvas y no en un nodo u otro elemento interactivo
      const target = event.target as HTMLElement;
      if (!target.closest('.react-flow__pane')) return;
      
      // Prevenir comportamiento por defecto para evitar el arrastre
      event.preventDefault();
      event.stopPropagation();
      
      // Eliminar cualquier área temporal anterior
      reactFlowInstance.setNodes(nodes => 
        nodes.filter(node => node.id !== 'temp-area')
      );
      
      // Obtener la posición inicial en coordenadas del flujo
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      // Iniciar el dibujo
      isDrawing = true;
      startPos = position;
      
      // Color por defecto para el área (azul claro)
      const defaultBgColor = 'rgba(59, 130, 246, 0.15)';
      const defaultBorderColor = '#3b82f6';
      
      // Crear un nodo temporal para mostrar el área mientras se dibuja
      const tempNode: Node = {
        id: 'temp-area',
        type: 'areaBackground',  // Usar nuestro nuevo tipo dedicado para áreas
        position,
        data: {
          label: 'Nueva área',
          isTemp: true,
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: '#3b82f6'
        },
        style: {
          width: 1,
          height: 1,
          zIndex: -1,
          pointerEvents: 'none' as const
        },
        selectable: false,
        draggable: false,
        className: 'temp-drawing-node'
      };
      
      reactFlowInstance.setNodes(nodes => [...nodes, tempNode]);
      
      // Capturar el ratón para asegurar que detectamos el movimiento incluso fuera del canvas
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawing || !startPos) return;
      
      // Prevenir comportamiento por defecto
      event.preventDefault();
      event.stopPropagation();
      
      // Obtener la posición actual en coordenadas del flujo
      const currentPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      // Calcular tamaño del área
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      
      // Calcular posición ajustada si el arrastre es hacia la izquierda o arriba
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      
      // Actualizar el nodo temporal
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => {
          if (node.id === 'temp-area') {
            return {
              ...node,
              position: { x, y },
              style: {
                ...node.style,
                width: Math.max(50, width), // Asegurar un ancho mínimo
                height: Math.max(50, height) // Asegurar un alto mínimo
              }
            };
          }
          return node;
        })
      );
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      if (!isDrawing || !startPos) {
        // Limpiar los event listeners incluso si no estamos dibujando
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }
      
      // Prevenir comportamiento por defecto
      event.preventDefault();
      event.stopPropagation();
      
      // Obtener el nodo temporal
      const tempNode = reactFlowInstance.getNode('temp-area');
      
      // Limpiar los event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Eliminar el nodo temporal
      reactFlowInstance.setNodes(nodes => 
        nodes.filter(node => node.id !== 'temp-area')
      );
      
      if (!tempNode) {
        isDrawing = false;
        startPos = null;
        return;
      }
      
      // Verificar que el área tenga un tamaño mínimo
      const width = tempNode.style?.width as number || 0;
      const height = tempNode.style?.height as number || 0;
      
      if (width < 50 || height < 50) {
        console.log("Área demasiado pequeña, ignorando");
        isDrawing = false;
        startPos = null;
        return;
      }
      
      // Crear el área final
      const timestamp = Date.now();
      const areaId = `area-${timestamp}`;
      
      // Crear diálogo modal para seleccionar color
      const modalOverlay = document.createElement('div');
      modalOverlay.style.position = 'fixed';
      modalOverlay.style.top = '0';
      modalOverlay.style.left = '0';
      modalOverlay.style.width = '100%';
      modalOverlay.style.height = '100%';
      modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modalOverlay.style.zIndex = '9999';
      modalOverlay.style.display = 'flex';
      modalOverlay.style.alignItems = 'center';
      modalOverlay.style.justifyContent = 'center';
      
      const modalContent = document.createElement('div');
      modalContent.style.background = 'white';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '10px';
      modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      modalContent.style.width = '400px';
      modalContent.style.maxWidth = '90%';
      
      const modalHeader = document.createElement('div');
      modalHeader.style.marginBottom = '15px';
      
      const modalTitle = document.createElement('h3');
      modalTitle.textContent = 'Personalizar área';
      modalTitle.style.fontSize = '18px';
      modalTitle.style.fontWeight = 'bold';
      modalTitle.style.margin = '0 0 5px 0';
      
      const modalInstructions = document.createElement('p');
      modalInstructions.textContent = 'Selecciona un color y agrega un nombre para el área';
      modalInstructions.style.margin = '0';
      modalInstructions.style.fontSize = '14px';
      modalInstructions.style.color = '#666';
      
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(modalInstructions);
      modalContent.appendChild(modalHeader);
      
      // Campo para nombre
      const nameLabel = document.createElement('label');
      nameLabel.textContent = 'Nombre:';
      nameLabel.style.display = 'block';
      nameLabel.style.marginBottom = '5px';
      nameLabel.style.fontWeight = '500';
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = 'Nueva área';
      nameInput.style.width = '100%';
      nameInput.style.padding = '8px';
      nameInput.style.borderRadius = '4px';
      nameInput.style.border = '1px solid #ccc';
      nameInput.style.marginBottom = '15px';
      
      modalContent.appendChild(nameLabel);
      modalContent.appendChild(nameInput);
      
      // Paleta de colores
      const colorLabel = document.createElement('label');
      colorLabel.textContent = 'Color:';
      colorLabel.style.display = 'block';
      colorLabel.style.marginBottom = '10px';
      colorLabel.style.fontWeight = '500';
      modalContent.appendChild(colorLabel);
      
      const colorGrid = document.createElement('div');
      colorGrid.style.display = 'grid';
      colorGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      colorGrid.style.gap = '10px';
      colorGrid.style.marginBottom = '20px';
      
      let selectedColor = predefinedColors[0];
      
      predefinedColors.forEach(color => {
        const colorItem = document.createElement('div');
        colorItem.style.width = '100%';
        colorItem.style.height = '40px';
        colorItem.style.backgroundColor = color.bg;
        colorItem.style.border = `2px solid ${color.border}`;
        colorItem.style.borderRadius = '4px';
        colorItem.style.cursor = 'pointer';
        colorItem.style.transition = 'transform 0.1s';
        colorItem.title = color.name;
        
        // Añadir borde para el color seleccionado por defecto
        if (color === predefinedColors[0]) {
          colorItem.style.outline = '3px solid #3b82f6';
        }
        
        colorItem.addEventListener('click', () => {
          // Quitar selección anterior
          document.querySelectorAll('.color-item-selected').forEach(el => {
            (el as HTMLElement).style.outline = 'none';
            el.classList.remove('color-item-selected');
          });
          
          // Aplicar selección
          colorItem.style.outline = `3px solid ${color.border}`;
          colorItem.classList.add('color-item-selected');
          selectedColor = color;
        });
        
        colorGrid.appendChild(colorItem);
      });
      
      modalContent.appendChild(colorGrid);
      
      // Botones
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'flex-end';
      buttonContainer.style.gap = '10px';
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancelar';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.border = '1px solid #ddd';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.backgroundColor = '#f9f9f9';
      cancelButton.style.cursor = 'pointer';
      
      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'Guardar';
      confirmButton.style.padding = '8px 16px';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '4px';
      confirmButton.style.backgroundColor = '#3b82f6';
      confirmButton.style.color = 'white';
      confirmButton.style.cursor = 'pointer';
      
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
      modalContent.appendChild(buttonContainer);
      
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
      
      // Enfocar automáticamente el campo de texto
      setTimeout(() => nameInput.focus(), 100);
      
      // Manejar botones
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        isDrawing = false;
        startPos = null;
      });
      
      confirmButton.addEventListener('click', () => {
        const areaName = nameInput.value.trim() || 'Nueva área';
        const backgroundColor = selectedColor.bg;
        const borderColor = selectedColor.border;
        
        // Crear el nodo de área con los datos seleccionados - CORREGIDO
        const areaNode: Node = {
          id: areaId,
          type: 'areaBackground',  // CORRECCIÓN: Usar el tipo correcto registrado en nodeTypes
          position: tempNode.position,
          data: {
            label: areaName,
            isArea: true,
            backgroundColor,
            borderColor,
            border: `2px solid ${borderColor}`  // Añadido para que AreaBackground lo reciba correctamente
          },
          style: {
            width,
            height,
            zIndex: -1,  // Forzar que esté por debajo de otros elementos
            pointerEvents: 'all'  // Permitir interacción con el área
          },
          draggable: true,
          selectable: true
        };
        
        // Añadir el nodo de área al flujo
        onNodesChange?.([{ type: 'add', item: areaNode }]);
        
        // Eliminar el diálogo
        document.body.removeChild(modalOverlay);
        
        // Resetear estado
        isDrawing = false;
        startPos = null;
        
        // Volver al modo selección
        setTimeout(() => {
          handleToolClick('select');
        }, 100);
      });
    };
    
    // Agregar listeners para los eventos del ratón directamente a la ventana
    window.addEventListener('mousedown', handleMouseDown);
    
    // Limpieza al desmontar o cambiar de herramienta
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Eliminar cualquier nodo temporal
      reactFlowInstance.setNodes(nodes => 
        nodes.filter(node => node.id !== 'temp-area')
      );
      
      // Volver a habilitar el arrastre del canvas
      enableDragging();
      
      // Quitar la clase de modo dibujo
      document.body.classList.remove('draw-area-mode');
    };
  }, [activeTool, reactFlowInstance, onNodesChange, handleToolClick]);

  // Manejador para el clic en nodos cuando la herramienta de conexión está activa
  useEffect(() => {
    if (activeTool !== 'connectNodes' || !connectionTool.isActive) return;

    const handleNodeClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const nodeElement = target.closest('.react-flow__node');
      
      if (!nodeElement) return;
      
      const nodeId = nodeElement.getAttribute('data-id');
      if (!nodeId) return;
      
      // Si no tenemos un nodo origen seleccionado, éste será el origen
      if (!connectionTool.sourceNodeId) {
        // Cambiar el estilo del nodo seleccionado para indicar que es el origen
        reactFlowInstance.setNodes(nodes => 
          nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isConnectionSource: node.id === nodeId
            },
            style: {
              ...node.style,
              outline: node.id === nodeId ? '2px solid #f97316' : undefined,
              zIndex: node.id === nodeId ? 1000 : node.style?.zIndex
            }
          }))
        );
        
        // Actualizar el estado
        setConnectionTool({
          ...connectionTool,
          sourceNodeId: nodeId
        });
      } else {
        // Ya tenemos un nodo origen, éste será el destino
        // Evitar autoconexión
        if (nodeId === connectionTool.sourceNodeId) {
          return; // No hacemos nada si intenta conectar el mismo nodo
        }
        
        // Mostrar un diálogo para seleccionar el estilo de línea
        const edgeStyleOptions = [
          { name: 'Línea sólida', value: 'solid', stroke: 'solid', animation: false },
          { name: 'Línea punteada', value: 'dashed', stroke: 'dashed', animation: false },
          { name: 'Línea con puntos', value: 'dotted', stroke: 'dotted', animation: false },
          { name: 'Línea animada', value: 'animated', stroke: 'solid', animation: true }
        ];
        
        // Crear un elemento DOM para el diálogo de selección
        const styleDialog = document.createElement('div');
        styleDialog.style.position = 'fixed';
        styleDialog.style.left = '50%';
        styleDialog.style.top = '50%';
        styleDialog.style.transform = 'translate(-50%, -50%)';
        styleDialog.style.background = 'white';
        styleDialog.style.padding = '20px';
        styleDialog.style.borderRadius = '8px';
        styleDialog.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        styleDialog.style.zIndex = '10000';
        styleDialog.style.minWidth = '250px';
        
        // Título
        const title = document.createElement('h3');
        title.textContent = 'Seleccionar estilo de línea';
        title.style.margin = '0 0 15px 0';
        title.style.fontWeight = 'bold';
        styleDialog.appendChild(title);
        
        // Crear opciones
        edgeStyleOptions.forEach(option => {
          const optionElement = document.createElement('div');
          optionElement.style.padding = '8px 12px';
          optionElement.style.marginBottom = '4px';
          optionElement.style.cursor = 'pointer';
          optionElement.style.borderRadius = '4px';
          optionElement.style.display = 'flex';
          optionElement.style.alignItems = 'center';
          optionElement.onmouseover = () => {
            optionElement.style.backgroundColor = '#f3f4f6';
          };
          optionElement.onmouseout = () => {
            optionElement.style.backgroundColor = 'transparent';
          };
          
          // Previsualización de la línea
          const linePreview = document.createElement('div');
          linePreview.style.width = '40px';
          linePreview.style.height = '2px';
          linePreview.style.backgroundColor = '#f97316';
          linePreview.style.marginRight = '10px';
          
          if (option.stroke === 'dashed') {
            linePreview.style.borderTop = '2px dashed #f97316';
            linePreview.style.backgroundColor = 'transparent';
          } else if (option.stroke === 'dotted') {
            linePreview.style.borderTop = '2px dotted #f97316';
            linePreview.style.backgroundColor = 'transparent';
          }
          
          optionElement.appendChild(linePreview);
          
          const optionText = document.createElement('span');
          optionText.textContent = option.name;
          optionElement.appendChild(optionText);
          
          optionElement.onclick = () => {
            // Eliminar el diálogo
            document.body.removeChild(styleDialog);
            
            // Crear la conexión con el estilo seleccionado
            if (onConnect) {
              // Crear objeto de conexión
              const connection: Connection = {
                source: connectionTool.sourceNodeId!,
                target: nodeId,
                sourceHandle: null,
                targetHandle: null
              };
              
              // Aplicar estilos según la opción seleccionada
              const edgeParams = {
                animated: option.animation,
                style: { 
                  strokeWidth: 2,
                  stroke: '#f97316',
                  strokeDasharray: option.stroke === 'dashed' ? '5 5' : option.stroke === 'dotted' ? '2 2' : undefined
                },
                markerEnd: {
                  type: 'arrowclosed',
                  color: '#f97316',
                  width: 15,
                  height: 15
                }
              };
              
              // Usar la función de conexión reactflow con parámetros adicionales
              const edge = {
                ...connection,
                ...edgeParams
              };
              
              onConnect(connection);
              
              // Modificar el último edge añadido para aplicar los estilos
              setTimeout(() => {
                reactFlowInstance.setEdges((edges) => {
                  return edges.map((e, index) => {
                    // Verificar si es el edge recién añadido (último elemento)
                    if (index === edges.length - 1 && 
                        e.source === connectionTool.sourceNodeId &&
                        e.target === nodeId) {
                      return {
                        ...e,
                        animated: option.animation,
                        style: {
                          ...e.style,
                          strokeWidth: 2,
                          stroke: '#f97316',
                          strokeDasharray: option.stroke === 'dashed' ? '5 5' : option.stroke === 'dotted' ? '2 2' : undefined
                        },
                        markerEnd: {
                          type: 'arrowclosed',
                          color: '#f97316',
                          width: 15,
                          height: 15
                        }
                      } as Edge;
                    }
                    return e;
                  });
                });
              }, 50);
            }
            
            // Resetear el estado del nodo origen
            reactFlowInstance.setNodes(nodes => 
              nodes.map(node => ({
                ...node,
                data: {
                  ...node.data,
                  isConnectionSource: false
                },
                style: {
                  ...node.style,
                  outline: undefined,
                  zIndex: node.style?.zIndex === 1000 && node.id === connectionTool.sourceNodeId 
                    ? undefined 
                    : node.style?.zIndex
                }
              }))
            );
            
            // Volver automáticamente al modo selección
            handleToolClick('select');
          };
          
          styleDialog.appendChild(optionElement);
        });
        
        document.body.appendChild(styleDialog);
      }
    };
    
    // Agregar listener para los clics en nodos
    document.addEventListener('click', handleNodeClick);
    
    return () => {
      document.removeEventListener('click', handleNodeClick);
    };
  }, [activeTool, connectionTool, reactFlowInstance, onConnect, handleToolClick]);

  return (
    <div className="w-full h-full flex relative">
      {/* Sidebar */}
      <div className={`transition-all duration-300 bg-slate-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Componentes</h3>
          {resourceCategories.map((category, index) => (
            <div key={index} className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer p-2 bg-gray-100 dark:bg-gray-800 rounded-md mb-2"
                onClick={() => toggleCategory(category.name)}
              >
                <span className="font-medium">{category.name}</span>
                <span>{collapsedCategories[category.name] ? '▶' : '▼'}</span>
              </div>
              {!collapsedCategories[category.name] && (
                <div className="space-y-2 pl-2">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 cursor-grab flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      draggable
                      onDragStart={(e) => onDragStart(e, { ...item, provider: category.provider })}
                      onDragEnd={onDragEnd}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Flow editor */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange} // Usar nuestra función personalizada aquí
          onEdgesChange={onEdgesChange}
          onConnect={(params) => {
            if (onConnect) {
              onConnect(params);
            }
          }}
          nodeTypes={memoizedNodeTypes} // Use memoized nodeTypes
          edgeTypes={edgeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={handlePaneClick}
          onEdgeClick={onEdgeClick}
          // Eliminamos onMouseDown (antes onPaneMouseDown) 
          onNodesDelete={onNodesDelete}
          onInit={(instance) => {
            // No need for fitView here, handled by useEffect
          }}
          fitView={false}
          fitViewOptions={{ 
            padding: 0.3,
            includeHiddenNodes: false
          }}
          snapToGrid={true}
          snapGrid={[10, 10]}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }} // Ajustar valor inicial de zoom
          panOnScroll={true}
          panOnDrag={activeTool !== 'lasso'} // Eliminamos referencia a drawRectangle
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          defaultEdgeOptions={{ 
            animated: true,
            style: { 
              strokeWidth: 2,
              stroke: '#555'
            }
          }}
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={activeTool === 'lasso'}
          selectNodesOnDrag={activeTool === 'select'}
          onSelectionStart={activeTool === 'lasso' ? onSelectionStart : undefined}
          selectionKeyCode={['Shift']}
          multiSelectionKeyCode={['Shift']}
          elementsSelectable={true}
          nodesConnectable={true}
          nodesDraggable={activeTool === 'select'}
          className={`
            bg-slate-50 dark:bg-slate-900 
            ${focusedNodeId ? 'focus-mode' : ''} 
            ${activeTool === 'lasso' ? 'lasso-active' : ''}
            ${selectionActive ? 'selection-active' : ''}
          `}
          connectionMode={ConnectionMode.Loose} // Use ConnectionMode enum instead of string
        >
          {/* Top panel with save and sidebar toggle */}
          <Panel position="top-right" className="flex gap-2">
            <button 
              onClick={toggleSidebar} 
              className="bg-slate-200 dark:bg-slate-700 p-2 rounded-md shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600"
              title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <button 
              onClick={onSave} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors font-medium"
            >
              Guardar
            </button>
          </Panel>
          {/* Tools panel with enhanced selection tool */}
          <Panel position="top-left" className="flex flex-col gap-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-md shadow">
            <button 
              onClick={() => handleToolClick('select')}
              className={`p-2 rounded-md ${activeTool === 'select' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Seleccionar (click)"
            >
              <CursorArrowRaysIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleToolClick('lasso')}
              className={`p-2 rounded-md ${activeTool === 'lasso' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Selección múltiple (área)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </button>
            <button 
              onClick={() => handleToolClick('createGroup')}
              className={`p-2 rounded-md ${activeTool === 'createGroup' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Crear grupo vacío"
            >
              <Square2StackIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleToolClick('group')}
              className={`p-2 rounded-md ${activeTool === 'group' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} ${selectedNodes.length < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Agrupar nodos seleccionados"
              disabled={selectedNodes.length < 1}
            >
              <FolderPlusIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleToolClick('ungroup')}
              className={`p-2 rounded-md ${activeTool === 'ungroup' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} ${!selectedNodes.some(n => n.type === 'group') ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Desagrupar nodos"
              disabled={!selectedNodes.some(n => n.type === 'group')}
            >
              <FolderMinusIcon className="w-5 h-5" />
            </button>
            {/* Nueva herramienta para crear conexiones entre nodos */}
            <button 
              onClick={() => handleToolClick('connectNodes')}
              className={`p-2 rounded-md ${activeTool === 'connectNodes' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Conectar nodos (flechas)"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>
            {/* Eliminado el botón de área visual */}
          </Panel>
          
          {/* Selected nodes count indicator */}
          {selectedNodes.length > 0 && (
            <Panel position="bottom-left" className="bg-white/80 dark:bg-gray-800/80 rounded-md shadow p-2">
              {selectedNodes.length} {selectedNodes.length === 1 ? 'nodo' : 'nodos'} seleccionado{selectedNodes.length > 1 ? 's' : ''}
            </Panel>
          )}
          <Controls 
            showInteractive={false} 
            // Asignar manejador para el botón de fitView (reset)
            onFitView={handleResetView}
          />
          <MiniMap 
            nodeColor={(node: Node) => {
              switch (node.data?.provider) {
                case 'aws': return '#f97316';
                case 'gcp': return '#3b82f6';
                case 'azure': return '#0ea5e9';
                default: return '#94a3b8';
              }
            }}
            className="bg-white/80 dark:bg-gray-800/80"
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          {/* Context Menu - Fixed positioning with enhanced options */}
          {contextMenu.visible && (
            <div 
              className="fixed z-[1000] bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-1"
              style={{ 
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                minWidth: '160px',
                transform: 'translate(0, 0)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {(() => {
                const currentNode = contextMenu.nodeId ? reactFlowInstance.getNode(contextMenu.nodeId) : null;
                console.log("Rendering context menu for nodeType:", contextMenu.nodeType);
                return (
                  <>
                    {contextMenu.nodeType === 'group' && (
                      <div className="flex flex-col">
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleCollapse')}
                        >
                          {currentNode?.data?.isCollapsed ? 'Expandir' : 'Colapsar'}
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleMinimize')}
                        >
                          {currentNode?.data?.isMinimized ? 'Maximizar' : 'Minimizar'}
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleFocus')}
                        >
                          Enfocar
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('addNodeToGroup')}
                        >
                          Añadir nuevo nodo
                        </button>
                        {/* Add selected nodes to this group */}
                        {selectedNodes.length > 0 && selectedNodes.some(n => n.id !== contextMenu.nodeId) && (
                          <button 
                            className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            onClick={() => handleContextMenuAction('addSelectedNodesToGroup')}
                          >
                            Añadir {selectedNodes.length === 1 ? 'nodo seleccionado' : `${selectedNodes.length} nodos`}
                          </button>
                        )}
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('renameGroup')}
                        >
                          Renombrar grupo
                        </button>
                        {/* Añadir botón para optimizar el layout */}
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('optimizeGroupLayout')}
                        >
                          Organizar nodos
                        </button>
                      </div>
                    )}
                    {contextMenu.nodeType && contextMenu.nodeType !== 'group' && (
                      <div className="flex flex-col">
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleListView')}
                        >
                          Cambiar vista
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleFocus')}
                        >
                          Enfocar
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleCollapse')}
                        >
                          {currentNode?.data?.isCollapsed ? 'Expandir' : 'Colapsar'}
                        </button>
                        {/* Add option to remove from group if node is inside a group */}
                        {currentNode?.parentNode && (
                          <button 
                            className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            onClick={() => handleContextMenuAction('removeFromGroup')}
                          >
                            Quitar del grupo
                          </button>
                        )}
                      </div>
                    )}
                    {/* Eliminamos las opciones específicas para nodos tipo rectangle */}
                    
                    {/* Common actions for all nodes */}
                    <button 
                      className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-red-600 dark:text-red-400"
                      onClick={() => handleContextMenuAction('deleteNode')}
                    >
                      Eliminar
                    </button>
                  </>
                );
              })()}
            </div>
          )}
          
          {/* Fix the menu floating button for selected nodes */}
          {selectionMenu.visible && selectedNodes.length > 1 && (
            <div 
              ref={selectionMenuRef}
              className="quick-group-button"
              onClick={createGroupWithSelectedNodes}
              style={{ 
                position: 'fixed',
                left: `${selectionMenu.x}px`,
                top: `${selectionMenu.y}px`,
                zIndex: 9999, // Ensure it's always on top
              }}
              title="Agrupar nodos seleccionados"
            >
              <FolderPlusIcon className="w-5 h-5" />
            </div>
          )}
          
          {/* Botón de eliminar para la línea seleccionada */}
          {selectedEdge && <EdgeDeleteButton edge={selectedEdge} />}
        </ReactFlow>
        
        {/* Selection tool indicator */}
        {activeTool === 'lasso' && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 border border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
            Modo selección múltiple - Haz clic en un nodo o dibuja un área para seleccionar varios
          </div>
        )}
        {/* Editor para renombrar grupos */}
        {editingGroup && (
          <div className="fixed z-[1001] top-0 left-0 w-full h-full flex items-center justify-center bg-black/30">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90%]">
              <h3 className="text-lg font-medium mb-4">Renombrar grupo</h3>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                value={editingGroup.label}
                onChange={(e) => setEditingGroup({...editingGroup, label: e.target.value})}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveGroupName(editingGroup.label);
                  }
                  if (e.key === 'Escape') {
                    setEditingGroup(null);
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setEditingGroup(null)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => saveGroupName(editingGroup.label)}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
        {groupViewModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-[1001] flex items-center justify-center p-4 group-view-modal">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-[90vw] h-[80vh] flex flex-col shadow-xl group-view-modal-content">
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
                    {groupViewModal.groupLabel}
                  </h2>
                  {(() => {
                    const provider = groupViewModal.provider;
                    switch (provider) {
                      case 'aws':
                        return <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>;
                      case 'gcp':
                        return <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>;
                      case 'azure':
                        return <span className="inline-block w-3 h-3 rounded-full bg-blue-400"></span>;
                      default:
                        return <span className="inline-block w-3 h-3 rounded-full bg-gray-500"></span>;
                    }
                  })()}
                </div>
                <button 
                  onClick={() => setGroupViewModal({ isOpen: false, groupId: null, nodes: [], edges: [], groupLabel: 'Grupo', provider: 'generic', nodeChanges: false })}
                  className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Cerrar vista"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-2">
                <GroupFlowEditor
                  groupId={groupViewModal.groupId || ''}
                  initialNodes={groupViewModal.nodes as unknown as CustomNode[]}
                  initialEdges={groupViewModal.edges as unknown as CustomEdge[]}
                  nodeTypes={memoizedNodeTypes}
                  onClose={() => setGroupViewModal({ isOpen: false, groupId: null, nodes: [], edges: [], groupLabel: 'Grupo', provider: 'generic', nodeChanges: false })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de exportación
export default function FlowEditor(props: FlowEditorProps) {
  const { initialDiagram } = props;
  
  // Track the diagram ID to prevent unnecessary re-renders
  const prevDiagramIdRef = useRef<string | null>(null);
  const [key, setKey] = useState(1);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [transitioning, setTransitioning] = useState(false);
  
  // Only force re-render when the diagram ID changes
  useEffect(() => {
    if (initialDiagram?.id && prevDiagramIdRef.current !== initialDiagram.id) {
      // Instead of immediately re-rendering, we'll fade out, then swap the key, then fade in
      if (prevDiagramIdRef.current) {
        console.log(`Diagram ID changed: ${initialDiagram.id}, transitioning FlowEditor`);
        setTransitioning(true);
        setFadeState('out');
        
        // After fade out, update the key and prepare for fade in
        setTimeout(() => {
          prevDiagramIdRef.current = initialDiagram.id;
          setKey(prev => prev + 1);
          
          // Short pause with new diagram loaded but still invisible
          setTimeout(() => {
            setFadeState('in');
            
            // Mark transition as complete after fade in
            setTimeout(() => {
              setTransitioning(false);
            }, 300);
          }, 50);
        }, 150);
      } else {
        // First load, no need for fancy transition
        prevDiagramIdRef.current = initialDiagram.id;
        setKey(prev => prev + 1);
      }
    }
  }, [initialDiagram?.id]);
  
  // Memorizar nodeTypes para evitar recrearlo en cada renderizado
  const memoizedNodeTypes = useMemo(() => props.nodeTypes || {}, [props.nodeTypes]);
  
  // Envolver ReactFlowProvider alrededor del contenido con las props adecuadas
  return (
    <div 
      className={`w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-opacity duration-300 ${
        fadeState === 'in' ? 'opacity-100' : 'opacity-0'
      }`}
      key={key} // Use the key to force re-render only when diagram ID changes
    >
      <ReactFlowProvider>
        <FlowEditorContent {...props} nodeTypes={memoizedNodeTypes} />
      </ReactFlowProvider>
      {transitioning && (
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      )}
      <style jsx global>{`
        /* Ensure group editor nodes are properly centered */
        .group-view-modal .react-flow__viewport {
          transition: transform 0.3s ease;
        }
        
        /* Add styles for better node visibility */
        .group-view-modal-content .react-flow__node {
          transition: transform 0.3s ease, opacity 0.2s ease;
        }

        /* Estilo para el cursor en modo dibujo de área */
        .draw-area-mode .react-flow__pane {
          cursor: crosshair !important;
        }
        
        /* Estilo para el cursor en modo conexión */
        .connection-mode .react-flow__pane {
          cursor: pointer !important;
        }
        
        /* Mejorar estilos para nodos en grupos */
        .react-flow__node-group {
          transition: transform 0.2s ease, width 0.3s ease, height 0.3s ease;
        }
        
        /* Optimizar la transición durante el arrastre */
        .react-flow__node {
          transition: box-shadow 0.2s ease;
        }
        
        .react-flow__node.dragging {
          z-index: 10;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        /* Mejorar la visibilidad de las etiquetas de los nodos */
        .react-flow__node .node-label {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: unset !important;
          word-break: break-word !important;
          font-size: 13px !important;
          line-height: 1.3 !important;
          padding: 2px 4px !important;
          text-align: center !important;
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
        }
        
        /* Asegurar que el sidebar se muestre correctamente */
        .w-64 {
          width: 16rem !important;
        }
      `}</style>
    </div>
  );
}