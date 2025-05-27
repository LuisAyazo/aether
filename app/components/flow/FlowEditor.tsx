import { 
  Background, 
  BackgroundVariant, 
  Connection, 
  ConnectionLineType, 
  ConnectionMode, 
  Controls, 
  Edge, 
  EdgeChange, 
  EdgeTypes, 
  MiniMap, 
  Node, 
  NodeChange, 
  NodeDragHandler,
  NodePositionChange,
  NodeTypes, 
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  Panel, 
  Position,
  ReactFlow, 
  ReactFlowInstance, 
  ReactFlowProvider, 
  SelectionMode, 
  Viewport,
  addEdge,
  applyEdgeChanges, 
  applyNodeChanges, 
  useEdgesState, 
  useNodesState, 
  useOnSelectionChange,
  useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback, useEffect, useRef, useState, useMemo, JSX } from 'react';
import { 
  CursorArrowRaysIcon, 
  Square2StackIcon, 
  Square3Stack3DIcon,
  FolderPlusIcon, 
  FolderMinusIcon,
  SwatchIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { Diagram } from '@/app/services/diagramService';
import GlobalIaCTemplatePanel from '../ui/GlobalIaCTemplatePanel';
import nodeTypes from '../nodes/NodeTypes';

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
  provider: 'aws' | 'gcp' | 'azure' | 'generic' // Added provider
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: string | null;
  isPane: boolean;
  parentInfo?: {
    parentId?: string;
    parentType?: string;
    selectedCount?: number;
  } | null;
}

type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea' | 'note' | 'text';

interface FlowEditorProps {
  nodes?: Node[];
  edges?: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  resourceCategories?: ResourceCategory[];
  
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialViewport?: Viewport;
  onSave?: (diagramData: { nodes: Node[]; edges: Edge[]; viewport?: Viewport }) => void; // More specific type for diagramData
  
  companyId?: string;
  environmentId?: string;
  diagramId?: string;
  initialDiagram?: Diagram;
}

// Define throttle function outside or import if it's a general utility
function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastArgs: Parameters<T> | null = null;

  const throttled = function(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    if (!inThrottle) {
      inThrottle = true;
      func.apply(this, lastArgs);
      setTimeout(() => {
        inThrottle = false;
        // If there were calls during the throttle period, execute the last one
        // This part is optional and makes it behave more like a debounced throttle at the end
        // if (lastArgs) {
        //   func.apply(this, lastArgs);
        //   lastArgs = null; 
        // }
      }, limit);
    }
  };

  // Optional: Add a cancel method to the throttled function
  // (throttled as T & { cancel: () => void }).cancel = () => {
  //   if (timeoutId) clearTimeout(timeoutId);
  //   inThrottle = false;
  //   lastArgs = null;
  // };

  return throttled;
}

// 🔒 Critical component below – do not edit or delete
const EdgeDeleteButton = ({ edge, onEdgeDelete }: { edge: Edge; onEdgeDelete: (edge: Edge) => void }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  
  const updatePosition = useCallback(() => {
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"] path`);
    if (!edgeElement || !(edgeElement instanceof SVGPathElement)) return;

    const pathLength = edgeElement.getTotalLength();
    const midPoint = edgeElement.getPointAtLength(pathLength / 2);

    const svgElement = edgeElement.closest('.react-flow__edges');
    if (!svgElement || !(svgElement instanceof SVGSVGElement)) return;

    const point = svgElement.createSVGPoint();
    point.x = midPoint.x;
    point.y = midPoint.y;

    const ctm = svgElement.getScreenCTM();
    if (!ctm) return;

    const screenPoint = point.matrixTransform(ctm);

    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const finalX = screenPoint.x + scrollX;
    const finalY = screenPoint.y + scrollY;

    const dx = Math.abs(finalX - positionRef.current.x);
    const dy = Math.abs(finalY - positionRef.current.y);
    
    if (dx > 0.5 || dy > 0.5) {
      positionRef.current = { x: finalX, y: finalY };
      setPosition({ x: finalX, y: finalY });
    }
  }, [edge.id]);

  useEffect(() => {
    let animationFrameId: number;
    let isUpdating = false;

    const handleTransform = () => {
      if (!isUpdating) {
        isUpdating = true;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(() => {
          updatePosition();
          isUpdating = false;
        });
      }
    };

    updatePosition();
    
    const observer = new MutationObserver(handleTransform);
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"]`);
    if (edgeElement) {
      observer.observe(edgeElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['d', 'transform']
      });
    }

    const throttledTransform = throttle(handleTransform, 16);
    window.addEventListener('resize', throttledTransform);
    document.addEventListener('reactflow.transform', throttledTransform as EventListener);
    document.addEventListener('reactflow.nodedrag', throttledTransform as EventListener);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      observer.disconnect();
      window.removeEventListener('resize', throttledTransform);
      document.removeEventListener('reactflow.transform', throttledTransform as EventListener);
      document.removeEventListener('reactflow.nodedrag', throttledTransform as EventListener);
    };
  }, [edge.id, updatePosition]);

  return (
    <div
      className="edge-delete-button"
      style={{
        position: 'fixed',
        transform: 'translate(-50%, -50%)',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '16px',
        height: '16px',
        backgroundColor: 'white',
        border: '1.5px solid #ff4d4d',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: 1,
        color: '#ff4d4d',
        zIndex: 1000,
        pointerEvents: 'all',
        userSelect: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEdgeDelete(edge);
      }}
    >
      ×
    </div>
  );
};


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
  resourceCategories = [],
  diagramId
}: FlowEditorProps): JSX.Element => {
  
  // Combinar los tipos de nodos externos con los tipos de nodos definidos en NodeTypes.tsx
  const memoizedNodeTypes = useMemo(() => {
    // Add explicit mapping for note and text nodes
    const combinedNodeTypes = {
      ...nodeTypes,         // Incluye noteNode y textNode
      ...externalNodeTypes,  // Tipos de nodos proporcionados externamente
      // Add explicit mappings for note and text
      note: nodeTypes.noteNode,
      text: nodeTypes.textNode
    };
    
    console.log('Available node types:', Object.keys(combinedNodeTypes));
    return combinedNodeTypes;
  }, [externalNodeTypes]);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useNodesState(propNodes || initialNodes);
  const [edges, setEdges] = useEdgesState(propEdges || initialEdges);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [, setActiveDrag] = useState<{ item: ResourceItem, offset: { x: number, y: number } } | null>(null);
  const [, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectionActive, setSelectionActive] = useState(false);
  
  // Add a ref to store the last viewport state
  const lastViewportRef = useRef<Viewport | null>(null);
  
  // Ref para rastrear si hemos inicializado el viewport
  const viewportInitializedRef = useRef(false);
  
  // Ref para el timeout del debounce del cambio de viewport
  const viewportChangeTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null,
    isPane: false,
    parentInfo: null
  });

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    console.log('Edge clicked:', edge);
    setSelectedEdge(edge);
  }, []);

  const onEdgeDelete = useCallback((edgeToDelete: Edge) => {
    console.log('Deleting edge:', edgeToDelete);
    onEdgesChange?.([{ id: edgeToDelete.id, type: 'remove' }]);
    setSelectedEdge(null);
  }, [onEdgesChange]);

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    setSelectedEdge(null);
    setContextMenu(prev => ({...prev, visible: false}));
    
    // Si estamos en modo lasso, no limpiar la selección al hacer clic
    if (activeTool !== 'lasso') {
      // No limpiar selección aquí, dejar que ReactFlow lo maneje
    }

    // Crear nodo de nota cuando la herramienta de nota está activa
    if (activeTool === 'note' && reactFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      
      // Usar el método oficial de React Flow para convertir coordenadas de pantalla a flow
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      const newNode: Node = {
        id: `note-${Date.now()}`,
        type: 'noteNode',
        position,
        data: {
          text: 'Click to edit',
          backgroundColor: '#FEF08A', // Amarillo por defecto
          textColor: '#1F2937',
          fontSize: 14
        },
        selected: true,
        draggable: true,
        selectable: true
      };
      
      // Usar onNodesChange para agregar el nodo correctamente
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      
      return;
    }
    
    // Crear nodo de texto cuando la herramienta de texto está activa
    if (activeTool === 'text' && reactFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      
      // Usar el método oficial de React Flow para convertir coordenadas de pantalla a flow
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      const newNode: Node = {
        id: `text-${Date.now()}`,
        type: 'textNode',
        position,
        data: {
          text: 'Click to edit',
          fontSize: 16,
          textColor: '#000000'
        },
        selected: true,
        draggable: true,
        selectable: true
      };
      
      // Usar onNodesChange para agregar el nodo correctamente
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      
      return;
    }
  }, [activeTool, reactFlowInstance, onNodesChange]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    
    // Obtener los nodos seleccionados actualmente
    const currentSelectedNodes = reactFlowInstance.getNodes().filter(n => n.selected);
    
    // Si el nodo clickeado no está seleccionado y hay otros nodos seleccionados,
    // debemos decidir si mantener la selección actual o solo seleccionar este nodo
    if (!node.selected && currentSelectedNodes.length > 0) {
      // Si no se está presionando Shift, seleccionar solo el nodo clickeado
      if (!event.shiftKey) {
        reactFlowInstance.setNodes(nodes => 
          nodes.map(n => ({ ...n, selected: n.id === node.id }))
        );
      } else {
        // Si se presiona Shift, añadir el nodo a la selección actual
        reactFlowInstance.setNodes(nodes => 
          nodes.map(n => ({ ...n, selected: n.selected || n.id === node.id }))
        );
      }
    } else if (!node.selected && currentSelectedNodes.length === 0) {
      // Si no hay nada seleccionado, seleccionar este nodo
      reactFlowInstance.setNodes(nodes => 
        nodes.map(n => ({ ...n, selected: n.id === node.id }))
      );
    }
    // Si el nodo ya está seleccionado, mantenemos la selección actual
    
    const nodeData = node.data || {};
    const resourceType = nodeData.resourceType || node.type;
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: resourceType,
      isPane: false,
      parentInfo: null
    });
  }, [reactFlowInstance]);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    // Obtener los nodos seleccionados actualmente
    const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
    
    // Mostrar el menú contextual y pasar información sobre los nodos seleccionados
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: null,
      nodeType: null,
      isPane: true,
      parentInfo: currentSelectedNodes.length > 0 ? { selectedCount: currentSelectedNodes.length } : null
    });
  }, [reactFlowInstance]);

  // 🔒 Critical code below – do not edit or delete
  useEffect(() => {
    if (initialViewport && reactFlowInstance) {
      // Guardar el viewport inicial en lastViewportRef para que se use en los guardados
      lastViewportRef.current = initialViewport;
      
      // Establecer el viewport con un pequeño retraso para asegurar que ReactFlow esté listo
      setTimeout(() => {
        reactFlowInstance.setViewport(initialViewport);
      }, 100);
    }
  }, [initialViewport, reactFlowInstance]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousNodesRef = useRef<string>(JSON.stringify(propNodes || initialNodes)); // Initialize with current nodes
  const previousEdgesRef = useRef<string>(JSON.stringify(propEdges || initialEdges)); // Initialize with current edges
  
  useEffect(() => {
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
    const currentNodesJSON = JSON.stringify(currentNodes);
    const currentEdgesJSON = JSON.stringify(currentEdges);
    
    if (onSave && reactFlowInstance && 
        (currentNodesJSON !== previousNodesRef.current || 
         currentEdgesJSON !== previousEdgesRef.current)) {
      
      previousNodesRef.current = currentNodesJSON;
      previousEdgesRef.current = currentEdgesJSON;
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const flow = reactFlowInstance.toObject();
        onSave?.(flow); // flow already contains nodes, edges, viewport
      }, 1000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [onSave, reactFlowInstance, propNodes, propEdges]);

  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const startEditingGroupName = useCallback((groupId: string, currentLabel: string) => {
    setEditingGroup({
      id: groupId,
      label: currentLabel
    });
  }, []);

  const saveGroupName = useCallback((newName: string) => {
    if (!editingGroup) return;
    
    reactFlowInstance.setNodes(nodes => 
      nodes.map(node => 
        node.id === editingGroup.id 
          ? { ...node, data: { ...node.data, label: newName } } 
          : node
      )
    );
    setContextMenu(prev => ({...prev, visible: false})); // Close context menu after saving
    setEditingGroup(null);
  }, [editingGroup, reactFlowInstance]);

  const selectionMenuRef = useRef<HTMLDivElement>(null);
  
  const [selectionMenu, setSelectionMenu] = useState({
    visible: false,
    x: 0,
    y: 0
  });

  useOnSelectionChange({
    onChange: ({ nodes: selected }) => {
      // Actualizar el estado de los nodos seleccionados
      setSelectedNodes(selected);
      
      // Si hay nodos seleccionados, actualizar el menú de selección
      if (selected.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        selected.forEach(node => {
          const nodeWidth = (node.width || 150);
          const nodeHeight = (node.height || 80);
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        });
        
        const { x: vpX, y: vpY, zoom } = reactFlowInstance.getViewport();
        const flowBounds = reactFlowWrapper.current?.getBoundingClientRect();
        
        if (flowBounds) {
          const centerX = flowBounds.left + ((minX + maxX) / 2 * zoom + vpX);
          const topY = flowBounds.top + (minY * zoom + vpY) - 50;
          setSelectionMenu({
            visible: true,
            x: centerX,
            y: Math.max(topY, flowBounds.top + 10)
          });
        }
      } else {
        setSelectionMenu(prev => ({...prev, visible: false}));
      }
    },
  });

  useEffect(() => {
    const handleNodeFocus = (event: Event) => { // Use generic Event type
      const customEvent = event as CustomEvent<{ nodeId: string; isFocused: boolean }>; // Type assertion
      const { nodeId, isFocused } = customEvent.detail;
      setFocusedNodeId(isFocused ? nodeId : null);
    };
    
    window.addEventListener('nodeGroupFocus', handleNodeFocus);
    return () => {
      window.removeEventListener('nodeGroupFocus', handleNodeFocus);
    };
  }, []);

  // Removed centerNodesInViewport and fitView functions to eliminate zoom reset functionality
  
  // Removed useEffect for automatic fitView on component mount

  // Center nodes in the viewport without zooming (added to fix node visibility issue)
  // Note: Zoom buttons are visible for UI consistency but functionality is disabled
  useEffect(() => {
    if (!reactFlowInstance || !nodes.length) return;
    
    // Wait for nodes to be rendered
    setTimeout(() => {
      // Calculate nodes bounding box
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      reactFlowInstance.getNodes().forEach(node => {
        if (!node.hidden) {
          const nodeWidth = node.width || 150;
          const nodeHeight = node.height || 80;
          
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        }
      });

      // Skip if no nodes are visible or bounding box calculation failed
      if (minX === Infinity || minY === Infinity) return;
      
      // Calculate center of nodes
      const nodesWidth = maxX - minX;
      const nodesHeight = maxY - minY;
      const nodesCenterX = minX + nodesWidth / 2;
      const nodesCenterY = minY + nodesHeight / 2;
      
      // Get viewport dimensions
      const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 600 };
      const viewportCenterX = width / 2;
      const viewportCenterY = height / 2;
      
      // Calculate the translation needed to center nodes
      const zoom = 1; // Keep zoom level fixed at 1
      const translateX = viewportCenterX - nodesCenterX * zoom;
      const translateY = viewportCenterY - nodesCenterY * zoom;
      
      // Set viewport to center nodes without animation
      reactFlowInstance.setViewport({ 
        x: translateX, 
        y: translateY, 
        zoom 
      });
    }, 200); // Small delay to ensure nodes are rendered
  }, [reactFlowInstance, nodes.length, reactFlowWrapper]);

  const createEmptyGroup = useCallback((provider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic') => {
    const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 800 };

    const position = reactFlowInstance.screenToFlowPosition({ x: width / 2, y: height / 2 });
    const timestamp = Date.now();
    const newGroupId = `group-${timestamp}`;

    const newGroup: Node = {
      id: newGroupId, type: 'group', position,
      data: { label: 'New Group', provider, isCollapsed: false, isMinimized: false },
      style: { width: 300, height: 200 }
    };

    onNodesChange?.([{ type: 'add', item: newGroup }]);
    
    setTimeout(() => {
      const event = new CustomEvent('nodesChanged', { detail: { action: 'nodeAdded', nodeIds: [newGroupId] } });
      document.dispatchEvent(event);
    }, 100);
    return newGroupId;
  }, [reactFlowInstance, onNodesChange, reactFlowWrapper]);

  // 🔒 Critical code below – do not edit or delete
  const optimizeNodesInGroup = useCallback((groupId: string) => {
    const group = reactFlowInstance.getNode(groupId);
    if (!group) return;
  
    // Don't attempt to optimize nodes if the group is minimized
    if (group.data?.isMinimized) return;
    
    const childNodes = reactFlowInstance.getNodes().filter((n: Node) => n.parentId === groupId);
    if (childNodes.length === 0) return;
  
    const groupWidth = (group.style?.width as number) || 300;
    
    const headerHeight = 40;
    const verticalMargin = 20;
    const horizontalMargin = 20;
    const nodeSpacing = 8;
    
    const availableWidth = groupWidth - 2 * horizontalMargin;
    const sortedChildNodes = [...childNodes].sort((a, b) => a.id.localeCompare(b.id));      const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (node.parentId !== groupId) return node;
      const idx = sortedChildNodes.findIndex((n: Node) => n.id === node.id);
      const y = headerHeight + verticalMargin + idx * (40 + nodeSpacing);
      
      // Asegurar que los nodos sean arrastrables dentro del grupo
      // y preservar cualquier estilo existente
      const nodeStyle = {
        ...node.style,
        width: availableWidth, 
        height: 40, 
        transition: 'none'
      };
      
      return { 
        ...node, 
        position: { x: horizontalMargin, y }, 
        style: nodeStyle,
        draggable: true, // Asegurarse de que sea arrastrable
        selectable: true  // Asegurarse de que sea seleccionable
      };
    });
    
    console.log(`Optimizando ${childNodes.length} nodos en el grupo ${groupId}`);
    reactFlowInstance.setNodes(updatedNodes);
  }, [reactFlowInstance]);

  const groupSelectedNodes = useCallback(() => {
    console.log("Agrupando nodos seleccionados:", selectedNodes.length);
    if (selectedNodes.length < 2) {
      console.warn("Se necesitan al menos 2 nodos para agrupar");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const providerCounts: Record<string, number> = {};
    
    selectedNodes.forEach(node => {
      const nodeWidth = (node.width || 150);
      const nodeHeight = (node.height || 80);
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
      const provider = node.data?.provider || 'generic';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    let mostCommonProvider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic';
    let maxCount = 0;
    Object.entries(providerCounts).forEach(([provider, count]) => {
      if (count > maxCount) {
        mostCommonProvider = provider as 'aws' | 'gcp' | 'azure' | 'generic'; // Cast to specific type
        maxCount = count;
      }
    });

    const paddingHorizontal = 50, paddingVerticalTop = 60, paddingVerticalBottom = 40;
    minX -= paddingHorizontal; minY -= paddingVerticalTop; 
    maxX += paddingHorizontal; maxY += paddingVerticalBottom;
    const width = Math.max(250, maxX - minX);
    const height = Math.max(180, maxY - minY);
    
    const timestamp = Date.now();
    const newGroupId = `group-${timestamp}`;
    const newGroup: Node = {
      id: newGroupId, type: 'group', position: { x: minX, y: minY },
      data: { label: 'Grupo', provider: mostCommonProvider, isCollapsed: false, isMinimized: false },
      style: { width, height }
    };
    
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
        return {
          ...node, parentId: newGroupId, extent: 'parent' as const,
          position: { x: node.position.x - minX, y: node.position.y - minY },
          selected: false
        };
      }
      return node;
    });
    
    reactFlowInstance.setNodes([...updatedNodes, newGroup]);
    setTimeout(() => optimizeNodesInGroup(newGroupId), 50);
    return newGroupId;
  }, [selectedNodes, reactFlowInstance, optimizeNodesInGroup]);

  // 🔒 Critical code below – do not edit or delete
  const ungroupNodes = useCallback(() => {
    const selectedGroupNodes = selectedNodes.filter(node => node.type === 'group');
    const allNodes = reactFlowInstance.getNodes(); // Get all nodes once
    
    let groupsToProcess: string[] = [];

    if (selectedGroupNodes.length > 0) {
      groupsToProcess = selectedGroupNodes.map(group => group.id);
    } else {
      const nodesInGroups = selectedNodes.filter(node => node.parentId);
      if (nodesInGroups.length > 0) {
        groupsToProcess = [...new Set(nodesInGroups.map(node => node.parentId))].filter(Boolean) as string[];
      } else {
        console.warn("No hay grupos o nodos en grupos seleccionados para desagrupar");
        return;
      }
    }
    
    if (groupsToProcess.length === 0) {
        console.warn("No se encontraron grupos para desagrupar basado en la selección.");
        return;
    }
    console.log("Grupos a desagrupar/procesar:", groupsToProcess);

    const finalNodes = allNodes.map(node => {
      if (node.parentId && groupsToProcess.includes(node.parentId)) {
        const parentGroup = allNodes.find(n => n.id === node.parentId);
        if (parentGroup) {
          return {
            ...node, parentId: undefined, extent: undefined,
            position: { x: parentGroup.position.x + node.position.x, y: parentGroup.position.y + node.position.y }
          };
        }
      }
      if (groupsToProcess.includes(node.id)) return null; // Remove the group itself
      return node;
    }).filter(Boolean) as Node[];
    
    reactFlowInstance.setNodes(finalNodes);
  }, [selectedNodes, reactFlowInstance]);

  // Function to add a node to the center of the stage
  const addNodeToCenter = useCallback((nodeType: string, label: string, provider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic') => {
    if (!reactFlowInstance) return;
    
    // DEBUG: Comment out viewport handling
    // const currentViewport = reactFlowInstance.getViewport();
    
    // Get the dimensions of the flow container
    const flowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!flowBounds) return;
    
    // Calculate the center position in screen coordinates
    const centerX = flowBounds.width / 2;
    const centerY = flowBounds.height / 2;
    
    // Convert to flow coordinates
    const position = reactFlowInstance.screenToFlowPosition({
      x: centerX,
      y: centerY
    });
    
    // Create a new node
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: { 
        label,
        provider
      },
      draggable: true,
      selectable: true,
      connectable: true,
      style: {
        width: 200,
        height: 100
      }
    };
    
    // Add the new node to the flow without triggering viewport changes
    setNodes((nds) => [...nds, newNode]);
    
    // DEBUG: Comment out viewport restoration
    // if (lastViewportRef) {
    //   lastViewportRef.current = currentViewport;
    // }
  }, [reactFlowInstance, reactFlowWrapper]);

  const handleToolClick = useCallback((tool: ToolType) => {
    if (tool === activeTool && tool !== 'lasso') return;
    
    setSelectionActive(false);
    document.body.classList.remove('lasso-selection-mode');

    // Handle tool-specific actions
    if (tool === 'lasso') {
      setSelectionActive(true);
      document.body.classList.add('lasso-selection-mode');
      
      // Limpiar selección actual cuando se activa la herramienta lasso pero mantener selectable
      reactFlowInstance.setNodes(nodes => nodes.map(node => ({ 
        ...node, 
        selected: false, 
        selectable: true 
      })));
    }
    
    // Simplemente establecer la herramienta activa sin agregar nodos inmediatamente
    // Los nodos se agregarán cuando se haga clic en el canvas (en el evento paneClick)
    
    setActiveTool(tool);
    
    // Asegurarnos de que los nodos se mantengan interactuables para el clic derecho
    const lassoSelectStyle = document.createElement('style');
    lassoSelectStyle.id = 'lasso-select-compatibility';
    lassoSelectStyle.innerHTML = `
      .react-flow__node {
        pointer-events: all !important;
      }
    `;
    
    // Eliminar estilo anterior si existe
    const existingStyle = document.getElementById('lasso-select-compatibility');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Agregar estilo solo si está en modo lasso
    if (tool === 'lasso') {
      document.head.appendChild(lassoSelectStyle);
    }
  }, [activeTool, reactFlowInstance]);

  useEffect(() => {
    // Removed all cursor and space bar pan mode functionalitycc
  }, []);

  const isInsideGroup = (position: { x: number, y: number }, group: Node) => {
    if (group.data?.isMinimized) return false; // No permitir drop en grupos minimizados
    
    const groupX = group.position.x;
    const groupY = group.position.y;
    const groupWidth = (group.style?.width as number) || 200;
    const groupHeight = (group.style?.height as number) || 150;
    
    // Área de detección ligeramente mayor que el grupo para facilitar el drop
    // Agregamos un margen positivo para facilitar la detección al acercarse a los bordes
    const margin = 5;
    
    const isInside = (
      position.x >= groupX - margin && position.x <= groupX + groupWidth + margin &&
      position.y >= groupY - margin && position.y <= groupY + groupHeight + margin
    );
    
    console.log(`Drop position check: (${position.x}, ${position.y}) inside group at (${groupX}, ${groupY}) with size ${groupWidth}x${groupHeight}: ${isInside}`);
    return isInside;
  };

  const onDragStartSidebar = (event: React.DragEvent, itemData: ResourceItem) => { // Renamed from onDragStart to be specific
    event.dataTransfer.setData('application/reactflow', JSON.stringify(itemData));
    event.dataTransfer.effectAllowed = 'move';
    const dragElement = event.currentTarget as HTMLDivElement;
    const rect = dragElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    setActiveDrag({ item: itemData, offset: { x: offsetX, y: offsetY } });
  };

  // Estado para rastrear el grupo sobre el cual se está arrastrando un nodo
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Comprobar si estamos arrastrando sobre un grupo para dar feedback visual
    if (reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({ 
        x: event.clientX, 
        y: event.clientY 
      });
      
      const groups = reactFlowInstance.getNodes().filter(n => n.type === 'group' && !n.data?.isMinimized);
      const sortedGroups = [...groups].sort((a, b) => {
        const areaA = (a.style?.width as number || 200) * (a.style?.height as number || 150);
        const areaB = (b.style?.width as number || 200) * (b.style?.height as number || 150);
        return areaA - areaB;
      });
      
      let foundGroup = false;
      for (const group of sortedGroups) {
        if (isInsideGroup(position, group)) {
          setHighlightedGroupId(group.id);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup && highlightedGroupId) {
        setHighlightedGroupId(null);
      }
    }
  }, [reactFlowInstance, isInsideGroup, highlightedGroupId]);
  
  // Resetear el grupo resaltado cuando termina el arrastre
  const onDragEnd = useCallback(() => {
    setHighlightedGroupId(null);
    setActiveDrag(null);
  }, [setActiveDrag]);

  // Efecto para sincronizar los nodos cuando cambian las props o el diagramId
  useEffect(() => {
    if (propNodes) {
      const currentNodesJSON = JSON.stringify(reactFlowInstance.getNodes());
      const propNodesJSON = JSON.stringify(propNodes);
      
      // Solo actualizar si hay diferencias reales
      if (currentNodesJSON !== propNodesJSON) {
        const updatedNodes = propNodes.map(node => ({
          ...node,
          draggable: true,
          selectable: true,
          connectable: true,
          style: {
            ...node.style,
            width: node.width || 200,
            height: node.height || 100
          }
        }));
        setNodes(updatedNodes);
      }
    }
  }, [propNodes, setNodes, diagramId, reactFlowInstance]);

  // Efecto para sincronizar los edges cuando cambian las props o el diagramId
  useEffect(() => {
    if (propEdges) {
      const currentEdgesJSON = JSON.stringify(reactFlowInstance.getEdges());
      const propEdgesJSON = JSON.stringify(propEdges);
      
      // Solo actualizar si hay diferencias reales
      if (currentEdgesJSON !== propEdgesJSON) {
        setEdges(propEdges);
      }
    }
  }, [propEdges, setEdges, diagramId, reactFlowInstance]);

  const findGroupAtPosition = useCallback((position: { x: number; y: number }) => {
    const currentNodes = reactFlowInstance.getNodes();
    return currentNodes.find(node => 
      node.type === 'group' && 
      !node.data?.isMinimized &&
      position.x >= node.position.x &&
      position.x <= node.position.x + (node.width || 300) &&
      position.y >= node.position.y &&
      position.y <= node.position.y + (node.height || 200)
    );
  }, [reactFlowInstance]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !reactFlowInstance) return;

    try {
      // Create a deep copy of the current viewport to prevent reference issues
      const currentViewport = { ...reactFlowInstance.getViewport() };
      
      // Store the exact zoom level - this is critical for high zoom levels
      // Use the raw value from the viewport to ensure maximum precision
      const exactZoom = currentViewport.zoom;
      
      // If the zoom is at or very close to the maximum (2.0), ensure we use the exact maximum value
      // This prevents any small floating-point precision issues
      const MAX_ZOOM = 2.0;
      const PRECISION_THRESHOLD = 0.01; // Reduced threshold for more accurate max zoom detection
      const isMaxZoom = Math.abs(exactZoom - MAX_ZOOM) < PRECISION_THRESHOLD;
      const correctedZoom = isMaxZoom ? MAX_ZOOM : exactZoom;
      
      // Store pan position for consistent restoration
      const panPosition = {
        x: currentViewport.x,
        y: currentViewport.y
      };
      
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;
      
      const transferredData = JSON.parse(dataStr) as ResourceItem;
      
      // Use screenToFlowPosition to get the precise position in flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      let newNode: Node;

      // Handle specific node types with their required data structures
      if (transferredData.type === 'note') {
        newNode = {
          id: `note-${Date.now()}`,
          type: 'noteNode',
          position: { ...position },
          data: {
            text: 'Click to edit',
            backgroundColor: '#FEF08A', // Amarillo por defecto
            textColor: '#1F2937',
            fontSize: 14
          },
          draggable: true,
          selectable: true
        };
      } else if (transferredData.type === 'text') {
        newNode = {
          id: `text-${Date.now()}`,
          type: 'textNode',
          position: { ...position },
          data: {
            text: 'Click to edit',
            fontSize: 16,
            fontWeight: 'normal',
            textAlign: 'left',
            textColor: '#000000',
            backgroundColor: 'transparent',
            borderStyle: 'none'
          },
          draggable: true,
          selectable: true
        };
      } else {
        // Default handling for other node types
        newNode = {
          id: `${transferredData.type}-${Date.now()}`,
          type: transferredData.type,
          position: { ...position }, // Create a copy to avoid reference issues
          data: { 
            label: transferredData.name,
            description: transferredData.description,
            provider: transferredData.provider
          },
          draggable: true,
          selectable: true,
          connectable: true,
          style: {
            width: 200,
            height: 100
          }
        };
      }          // Check if the node is dropped within a group
      const groupNode = findGroupAtPosition(position);
      if (groupNode) {
        const parentGroup = reactFlowInstance.getNode(groupNode.id);
        if (parentGroup) {
          // Calculate the position relative to the group with precise math
          const groupPosition = { ...parentGroup.position };
          const relativePosition = {
            x: position.x - groupPosition.x,
            y: position.y - groupPosition.y
          };

          // Ensure the node stays within the group's boundaries
          const groupWidth = parentGroup.width || 300;
          const groupHeight = parentGroup.height || 200;
          const nodeWidth = 200;
          const nodeHeight = 100;
          const margin = 20;

          // Calculate safe limits
          const maxX = groupWidth - nodeWidth - margin;
          const maxY = groupHeight - nodeHeight - margin;
          const minX = margin;
          const minY = margin + 40;

          // Clamp the position within the group's boundaries
          const clampedPosition = {
            x: Math.max(minX, Math.min(maxX, relativePosition.x)),
            y: Math.max(minY, Math.min(maxY, relativePosition.y))
          };

          // Update the node's position and parent - use a new object to avoid mutations
          newNode.position = { ...clampedPosition };
          newNode.parentId = groupNode.id;
          newNode.extent = 'parent' as const;
        }
      }

      // DEBUG: Comentado para evitar reinicio del zoom al agregar nodos
      // Improved viewport restoration function to maintain exact zoom level
      // const restoreViewport = () => {
      //   // Use the stored pan position and corrected zoom for precise restoration
      //   const viewportToRestore = {
      //     x: panPosition.x,
      //     y: panPosition.y,
      //     zoom: correctedZoom // Use the corrected zoom value for maximum precision
      //   };
      //   
      //   // Apply the viewport restoration directly
      //   reactFlowInstance.setViewport(viewportToRestore);
      //     
      //   // Update the lastViewportRef for consistency
      //   if (lastViewportRef) {
      //     lastViewportRef.current = { ...viewportToRestore };
      //   }
      // };
      
      // // Apply initial viewport to prevent any immediate zoom changes
      // restoreViewport();
      
      // Add the new node to the flow
      const updatedNodes = [...reactFlowInstance.getNodes(), newNode];
      setNodes(updatedNodes);
      
      // Notify parent component if needed
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      
      // Apply second restoration immediately after node is added
      // DEBUG: Comentado para evitar reinicio del zoom
      // restoreViewport();
      
      // If node is added to a group, optimize the group layout first
      if (newNode.parentId) {
        // Execute optimization after the next render cycle
        setTimeout(() => {
          optimizeNodesInGroup(newNode.parentId!);
          
          // DEBUG: Comentado para evitar reinicio del zoom
          // Force multiple viewport restorations with different timings
          // to catch all potential zoom reset points
          // restoreViewport();
          
          // Add high-priority restorations after optimization
          requestAnimationFrame(() => {
            // restoreViewport();
            
            // One more restoration after a short delay
            // setTimeout(restoreViewport, 10);
          });
        }, 0);
      } else {
        // DEBUG: Comentado para evitar reinicio del zoom
        // For nodes not in groups, add a sequence of timed restorations
        // to ensure the viewport is maintained at critical points
        setTimeout(() => {
          // restoreViewport();
          
          requestAnimationFrame(() => {
            // restoreViewport();
            
            // One final restoration after a slight delay
            // setTimeout(restoreViewport, 10);
          });
        }, 0);
      }

      // If there's a diagramId, save the changes with the preserved viewport
      if (diagramId && onSave) {
        // Create a fresh viewport object for saving
        const viewportForSave = {
          x: panPosition.x,
          y: panPosition.y,
          zoom: correctedZoom // Use the corrected zoom to ensure the saved state is accurate
        };
        
        onSave({
          nodes: updatedNodes,
          edges: reactFlowInstance.getEdges(),
          viewport: viewportForSave
        });
      }

    } catch (error) {
      console.error("Error handling node drop:", error);
    }
  }, [reactFlowInstance, findGroupAtPosition, onNodesChange, optimizeNodesInGroup, setNodes, diagramId, onSave]);

  // Manejador personalizado para los cambios de nodos
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (!onNodesChange) return;
    
    // DEBUG: Comment out viewport handling
    // const currentViewport = reactFlowInstance.getViewport();

    // Filter dragging changes to check for group attachment
    const dragChanges = changes.filter((change): change is NodePositionChange => 
      change.type === 'position' && Boolean(change.dragging) && typeof change.id === 'string'
    );

    // Check if nodes are being dragged and need to be attached to groups
    if (dragChanges.length > 0) {
      const updatedChanges = [...changes];
      const allNodes = reactFlowInstance.getNodes();
      
      dragChanges.forEach(dragChange => {
        const node = allNodes.find(n => n.id === dragChange.id);
        if (!node) return;
        
        // Skip group nodes - they shouldn't be attached to other groups
        if (node.type === 'group') return;
        
        // Skip nodes that are already attached to a group
        if (node.parentId) return;
        
        // Get the node's current position
        const nodePosition = {
          x: node.position.x + (dragChange.position?.x || 0),
          y: node.position.y + (dragChange.position?.y || 0)
        };
        
        // Check if the node is over a group
        const groupNode = findGroupAtPosition(nodePosition);
        if (groupNode && !groupNode.data?.isMinimized) {
          // Calculate position relative to the group
          const relativePosition = {
            x: nodePosition.x - groupNode.position.x,
            y: nodePosition.y - groupNode.position.y
          };
          
          // Set the node to be a child of the group
          const updatedNode = {
            ...node,
            position: relativePosition,
            parentId: groupNode.id,
            extent: 'parent' as const
          };
          
          // Replace the change with a node removal and addition to update parent
          const changeIndex = updatedChanges.findIndex(c => 
            c.type === 'position' && c.id === dragChange.id
          );
          
          if (changeIndex !== -1) {
            updatedChanges.splice(changeIndex, 1, {
              type: 'remove',
              id: dragChange.id
            });
            
            // After the next render cycle, add the node as a child
            setTimeout(() => {
              setNodes(nodes => [...nodes, updatedNode]);
            }, 0);
          }
        }
      });
      
      // Use the updated changes
      changes = updatedChanges;
    }

    // Also detect when nodes are dragged out of a group
    interface NodeParentUpdate {
      id: string;
      position: { x: number; y: number };
      removeParent: boolean;
    }
    
    const nodesToUpdateParent: NodeParentUpdate[] = [];
    
    // Find nodes that might need to be removed from their group
    if (dragChanges.length > 0) {
      dragChanges.forEach(dragChange => {
        const node = reactFlowInstance.getNode(dragChange.id);
        if (!node || node.type === 'group') return;
        
        // Only process nodes that are inside a group
        if (node.parentId) {
          const parentNode = reactFlowInstance.getNode(node.parentId);
          if (!parentNode) return;
          
          // Calculate the node's absolute position
          const newPosition = {
            x: parentNode.position.x + node.position.x + (dragChange.position?.x || 0),
            y: parentNode.position.y + node.position.y + (dragChange.position?.y || 0)
          };
          
          // Check if the node is still within the parent group bounds
          const parentWidth = parentNode.width || 300;
          const parentHeight = parentNode.height || 200;
          
          const isInsideParent = 
            newPosition.x >= parentNode.position.x &&
            newPosition.x + (node.width || 200) <= parentNode.position.x + parentWidth &&
            newPosition.y >= parentNode.position.y &&
            newPosition.y + (node.height || 100) <= parentNode.position.y + parentHeight;
            
          // If node is dragged outside parent bounds, remove it from the group
          if (!isInsideParent) {
            nodesToUpdateParent.push({
              id: node.id,
              position: newPosition,
              removeParent: true
            });
          }
        }
      });
    }
    
    // Process the nodes that need parent updates
    if (nodesToUpdateParent.length > 0) {
      setTimeout(() => {
        setNodes(nodes => 
          nodes.map(node => {
            const updateInfo = nodesToUpdateParent.find(n => n.id === node.id);
            if (updateInfo?.removeParent) {
              return {
                ...node,
                parentId: undefined,
                extent: undefined,
                position: updateInfo.position
              };
            }
            return node;
          })
        );
      }, 0);
    }
  
    // Procesar los cambios de nodos
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      // Asegurar que todos los nodos tengan las propiedades necesarias
      return {
        ...node,
        draggable: true,
        selectable: true,
        connectable: true,
        style: {
          ...node.style,
          width: node.width || 200,
          height: node.height || 100
        }
      };
    });

    // Actualizar el estado local
    setNodes(updatedNodes);

    // Notificar al componente padre
    onNodesChange(changes);
    
    // DEBUG: Comment out viewport restoration
    // if (lastViewportRef) {
    //   lastViewportRef.current = currentViewport;
    //   // Use a small timeout to ensure the viewport is restored after React has processed the changes
    //   setTimeout(() => {
    //     reactFlowInstance.setViewport(currentViewport, { duration: 0 });
    //   }, 0);
    // }

    // Si hay un diagramId, guardar los cambios con debounce
    if (diagramId && onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const currentNodes = reactFlowInstance.getNodes();
        const currentEdges = reactFlowInstance.getEdges();
        const currentNodesJSON = JSON.stringify(currentNodes);
        const currentEdgesJSON = JSON.stringify(currentEdges);
        
        // Solo guardar si hay cambios reales
        if (currentNodesJSON !== previousNodesRef.current || 
            currentEdgesJSON !== previousEdgesRef.current) {
          previousNodesRef.current = currentNodesJSON;
          previousEdgesRef.current = currentEdgesJSON;
          
          onSave({
            nodes: currentNodes,
            edges: currentEdges,
            viewport: reactFlowInstance.getViewport()
          });
        }
      }, 1000);
    }
  }, [onNodesChange, reactFlowInstance, setNodes, diagramId, onSave, findGroupAtPosition]);

  // Agregar función para contar recursos por proveedor
  const getResourceCounts = useCallback(() => {
    const counts = {
      total: nodes.length,
      aws: 0,
      gcp: 0,
      azure: 0,
      generic: 0
    };

    nodes.forEach(node => {
      const provider = (node.data?.provider || 'generic') as 'aws' | 'gcp' | 'azure' | 'generic';
      counts[provider]++;
    });

    return counts;
  }, [nodes]);

  // Add effect to initialize viewport when nodes are loaded
  // DEBUG: Comment out the ensureVisibility function that might be causing zoom resets
  // useEffect(() => {
  //   if (!reactFlowInstance || !nodes.length) return;
    
  //   // Solo inicializamos el viewport una vez al cargar
  //   if (viewportInitializedRef.current) return;
    
  //   // Si tenemos un viewport inicial desde props, usamos ese
  //   if (initialViewport) {
  //     console.log('Usando initialViewport guardado:', initialViewport);
  //     // Asegurarnos de que el viewport tenga valores válidos
  //     const validViewport = {
  //       x: initialViewport.x || 0,
  //       y: initialViewport.y || 0,
  //       zoom: initialViewport.zoom || 1
  //     };
  //     reactFlowInstance.setViewport(validViewport, { duration: 0 });
  //     lastViewportRef.current = validViewport;
  //     viewportInitializedRef.current = true;
  //     return;
  //   }
    
  //   // De lo contrario, calculamos un viewport que muestre todos los nodos
  //   setTimeout(() => {
  //     if (!reactFlowInstance) return;
      
  //     // Encontrar el cuadro delimitador de todos los nodos
  //     const nodePositions = nodes.map(node => ({
  //       x: node.position.x,
  //       y: node.position.y,
  //       width: node.width || 150,
  //       height: node.height || 40
  //     }));
      
  //     if (!nodePositions.length) return;
      
  //     // Calcular el cuadro delimitador con un margen adicional
  //     const margin = 100; // Margen adicional para asegurar que todos los nodos sean visibles
  //     const minX = Math.min(...nodePositions.map(pos => pos.x)) - margin;
  //     const maxX = Math.max(...nodePositions.map(pos => pos.x + (pos.width || 150))) + margin;
  //     const minY = Math.min(...nodePositions.map(pos => pos.y)) - margin;
  //     const maxY = Math.max(...nodePositions.map(pos => pos.y + (pos.height || 40))) + margin;
      
  //     // Calcular el centro de los nodos
  //     const nodesWidth = maxX - minX;
  //     const nodesHeight = maxY - minY;
  //     const nodesCenterX = minX + nodesWidth / 2;
  //     const nodesCenterY = minY + nodesHeight / 2;
      
  //     // Obtener dimensiones del viewport
  //     const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 600 };
      
  //     // Calcular el zoom óptimo para mostrar todos los nodos
  //     const zoomX = width / nodesWidth;
  //     const zoomY = height / nodesHeight;
  //     const zoom = Math.min(Math.min(zoomX, zoomY), 1); // No hacer zoom más allá de 1
      
  //     // Calcular la traslación necesaria para centrar los nodos
  //     const translateX = width / 2 - nodesCenterX * zoom;
  //     const translateY = height / 2 - nodesCenterY * zoom;
      
  //     // Establecer el viewport para centrar los nodos sin animación
  //     const newViewport = { 
  //       x: translateX, 
  //       y: translateY, 
  //       zoom 
  //     };
      
  //     console.log('Inicializando viewport para mostrar todos los nodos:', newViewport);
  //     reactFlowInstance.setViewport(newViewport, { duration: 0 });
  //   }, 300); // Pequeño retraso para asegurar que los nodos estén renderizados
  // }, [reactFlowInstance, nodes.length, initialViewport, nodes, reactFlowWrapper]);
  
  // DEBUG: Comment out the viewport change handler
  // useEffect(() => {
  //   // Code commented out to debug zoom reset issues
  // }, [reactFlowInstance, onSave]);

  // DEBUG: Comment out the ensureVisibility function that might be causing zoom resets
  // useEffect(() => {
  //   if (!reactFlowInstance || !nodes.length) return;
    
  //   // Ensure all nodes are visible
  //   const ensureVisibility = () => {
  //     const currentNodes = reactFlowInstance.getNodes();
  //     const updatedNodes = currentNodes.map(node => ({
  //       ...node,
  //       hidden: false,
  //       style: {
  //         ...node.style,
  //         visibility: 'visible' as const,
  //         opacity: 1
  //       }
  //     }));
      
  //     reactFlowInstance.setNodes(updatedNodes);
  //   };
    
  //   // Run once on mount and when nodes change
  //   // ensureVisibility();
  //   
  //   // Also run when the viewport changes to ensure visibility
  //   document.addEventListener('reactflow.viewportChange', ensureVisibility);
  //   
  //   return () => {
  //     document.removeEventListener('reactflow.viewportChange', ensureVisibility);
  //   };
  // }, [reactFlowInstance, nodes.length]);

  // Función para guardar explícitamente el estado actual del diagrama
  const saveCurrentDiagramState = useCallback(() => {
    if (!reactFlowInstance || !onSave) return;
    
    // Obtener el estado actual del diagrama
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
    
    // Obtener el viewport actual (zoom y posición)
    const currentViewport = reactFlowInstance.getViewport();
    console.log('Guardando viewport explícitamente:', currentViewport);
    
    // Actualizar la referencia al viewport
    lastViewportRef.current = currentViewport;
    
    // Crear el objeto de flujo completo
    const flow = reactFlowInstance.toObject();
    
    // Guardar el diagrama con el viewport actual
    onSave({
      ...flow,
      viewport: currentViewport
    });
    
    // Actualizar las referencias para comparaciones futuras
    previousNodesRef.current = JSON.stringify(currentNodes);
    previousEdgesRef.current = JSON.stringify(currentEdges);
    
    console.log('Diagrama guardado con viewport:', currentViewport);
  }, [reactFlowInstance, onSave]);
  
  // Efecto para guardar automáticamente cuando cambian los nodos o bordes
  useEffect(() => {
    if (!reactFlowInstance || !onSave) return;
    
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
    const currentNodesJSON = JSON.stringify(currentNodes);
    const currentEdgesJSON = JSON.stringify(currentEdges);
    
    if (currentNodesJSON !== previousNodesRef.current || 
        currentEdgesJSON !== previousEdgesRef.current) {
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveCurrentDiagramState();
      }, 1000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [onSave, reactFlowInstance, propNodes, propEdges]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keyboard shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Keyboard shortcuts for tools
      switch (event.key.toLowerCase()) {
        case 'v': // Select tool
          handleToolClick('select');
          break;
        case 'n': // Note tool
          handleToolClick('note');
          break;
        case 't': // Text tool
          handleToolClick('text');
          break;
        case 'g': // Create group
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            createEmptyGroup();
          }
          break;
        case 's': // Lasso select
          if (event.shiftKey) {
            handleToolClick('lasso');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleToolClick, createEmptyGroup]);

  // Add a modal for editing group name
  const renderEditGroupModal = () => {
    if (!editingGroup) return null;
    
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={() => setEditingGroup(null)}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{marginTop: 0, marginBottom: '16px', fontSize: '16px'}}>Edit Group Name</h3>
          <input
            type="text"
            defaultValue={editingGroup.label}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '16px'
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                saveGroupName(input.value);
              }
              if (e.key === 'Escape') {
                setEditingGroup(null);
              }
            }}
          />
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
            <button
              onClick={() => setEditingGroup(null)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                saveGroupName(input.value);
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#0088ff',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {renderEditGroupModal()}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-sm text-gray-600">{getResourceCounts().total}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">AWS:</span>
            <span className="text-sm text-gray-600">{getResourceCounts().aws}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">GCP:</span>
            <span className="text-sm text-gray-600">{getResourceCounts().gcp}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Azure:</span>
            <span className="text-sm text-gray-600">{getResourceCounts().azure}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Generic:</span>
            <span className="text-sm text-gray-600">{getResourceCounts().generic}</span>
          </div>
        </div>
      </div>
      <div style={{ height: '100%', width: '100%' }} ref={reactFlowWrapper}>
        <style>
          {`
            .react-flow__pane {
              cursor: ${activeTool === 'note' ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMzMzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4K") 12 12, pointer' : 'default'};
            }
            .react-flow__pane.pan-mode {
              cursor: grab !important;
              background-color: rgba(0, 0, 0, 0.1) !important;
            }
            .react-flow__pane.pan-mode:active {
              cursor: grabbing !important;
              background-color: rgba(0, 0, 0, 0.2) !important;
            }
            .react-flow__selection {
              background: rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(0, 0, 0, 0.5) !important;
            }
            .react-flow__selection-rect {
              background: rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(0, 0, 0, 0.5) !important;
            }
            .react-flow__nodesselection-rect {
              background: rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(0, 0, 0, 0.5) !important;
            }
            .react-flow__node {
              pointer-events: all !important;
            }
            .react-flow__edge {
              pointer-events: all !important;
            }
            .react-flow__selection {
              background: rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(0, 0, 0, 0.5) !important;
            }
          `}
        </style>
        <ReactFlow
          defaultViewport={initialViewport || { x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={[]}
          noDragClassName="nodrag"
          nodes={nodes}
          edges={edges}
          nodeTypes={memoizedNodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onEdgeClick={onEdgeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          elementsSelectable={true}
          nodesDraggable={true}
          nodesConnectable={true}
          panOnDrag={true}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          selectionOnDrag={true}
          selectionMode={SelectionMode.Full}
          multiSelectionKeyCode={['Shift']}
        >
          <Background 
            id="1"
            gap={10}
            color="#000000"
            variant={BackgroundVariant.Dots}
            size={1.2}
            style={{ opacity: 0.25, backgroundColor: '#E8F5E9' }}
          />
          <Background 
            id="2"
            gap={100}
            color="#000000"
            variant={BackgroundVariant.Dots}
            size={1.2}
            style={{ opacity: 0.25 }}
          />
          <MiniMap />
          <Controls 
            position="bottom-left"
            style={{ bottom: 10, left: 10 }}
          />
          
          {contextMenu.visible && (
            <div 
              style={{
                position: 'fixed', left: contextMenu.x, top: contextMenu.y,
                background: 'white', border: '1px solid #ddd', zIndex: 1000,
                padding: '0px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', gap: '0px',
                minWidth: '180px', overflow: 'hidden',
                transform: 'translate(8px, 8px)'
              }}
              onClick={(e) => e.stopPropagation()} 
              onContextMenu={(e) => e.preventDefault()} 
            >
              <div style={{ padding: '8px 12px', backgroundColor: '#f7f7f7', borderBottom: '1px solid #eee' }}>
                {!contextMenu.isPane && contextMenu.nodeId && (
                  <>
                    <p style={{margin: '0 0 2px 0', fontSize: '13px', fontWeight: 'bold'}}>{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.label || 'Node'}</p>
                    <p style={{margin: 0, fontSize: '11px', color: '#777'}}>ID: {contextMenu.nodeId}</p>
                    <p style={{margin: 0, fontSize: '11px', color: '#777'}}>
                      Type: {contextMenu.nodeType} 
                      {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-xs">
                          {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider.toUpperCase()}
                        </span>
                      )}
                    </p>
                  </>
                )}
                {contextMenu.isPane && (
                  <>
                    {(() => {
                      const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                      return currentSelectedNodes.length > 0 ? (
                        <p style={{margin: 0, fontSize: '13px', fontWeight: 'bold'}}>
                          {currentSelectedNodes.length} nodos seleccionados
                        </p>
                      ) : (
                        <p style={{margin: 0, fontSize: '13px', fontWeight: 'bold'}}>Canvas Options</p>
                      );
                    })()}
                  </>
                )}
              </div>

              <div>
                {!contextMenu.isPane && contextMenu.nodeId && (
                  <>
                    {/* Verificar si hay múltiples nodos seleccionados y el nodo actual está entre ellos */}
                    {(() => {
                      const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                      return currentSelectedNodes.length > 1 && currentSelectedNodes.some(n => n.id === contextMenu.nodeId);
                    })() ? (
                      <>
                        <button 
                          onClick={() => {
                            // Actualizar para asegurarnos de que usamos los nodos que están seleccionados en este momento
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            console.log("Agrupando nodos seleccionados:", currentSelectedNodes.length);
                            if (currentSelectedNodes.length > 0) {
                              groupSelectedNodes();
                            }
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee',
                            background: 'white', fontSize: '13px',
                            color: '#333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          📦 Group Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            console.log("Eliminando nodos seleccionados:", currentSelectedNodes.length, currentSelectedNodes.map(n => n.id));
                            if (currentSelectedNodes.length > 0) {
                              const nodeIds = currentSelectedNodes.map(node => node.id);
                              onNodesChange?.(nodeIds.map(id => ({ type: 'remove', id })));
                            }
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee',
                            background: 'white', fontSize: '13px',
                            color: '#ff3333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fff0f0')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          🗑 Delete Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                      </>
                    ) : reactFlowInstance.getNode(contextMenu.nodeId)?.type === 'group' ? (
                      <>
                        <button 
                          onClick={() => {
                            const node = reactFlowInstance.getNode(contextMenu.nodeId || '');
                            if (node) {
                              startEditingGroupName(node.id, node.data?.label || 'Group');
                            }
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee',
                            background: 'white', fontSize: '13px',
                            color: '#333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          ✏️ Edit Group Name
                        </button>
                        <button 
                          onClick={() => {
                            ungroupNodes();
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee',
                            background: 'white', fontSize: '13px',
                            color: '#333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          📂 Ungroup Nodes
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          const node = reactFlowInstance.getNode(contextMenu.nodeId || '');
                          if (node) {
                            const event = new CustomEvent('openIaCPanel', {
                              detail: {
                                nodeId: node.id,
                                resourceData: {
                                  label: node.data.label,
                                  provider: node.data.provider,
                                  resourceType: node.data.resourceType
                                }
                              }
                            });
                            window.dispatchEvent(event);
                            document.dispatchEvent(event);
                          }
                          setContextMenu(prev => ({...prev, visible: false}));
                        }}
                        style={{ 
                          display: 'block', width: '100%', textAlign: 'left', 
                          padding: '10px 12px', cursor: 'pointer', 
                          border: 'none', borderBottom: '1px solid #eee',
                          background: 'white', fontSize: '13px',
                          color: '#333', transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        ⚙️ Configuración
                      </button>
                    )}
                    
                    {/* Botón para eliminar un nodo individual si no hay múltiples seleccionados */}
                    {!(selectedNodes.length > 1 && selectedNodes.some(n => n.id === contextMenu.nodeId)) && (
                      <button 
                        onClick={() => {
                          if (contextMenu.nodeId) {
                            onNodesChange?.([{ type: 'remove', id: contextMenu.nodeId }]);
                          }
                          setContextMenu(prev => ({...prev, visible: false}));
                        }}
                        style={{ 
                          display: 'block', width: '100%', textAlign: 'left', 
                          padding: '10px 12px', cursor: 'pointer', 
                          border: 'none',
                          background: 'white', fontSize: '13px',
                          color: '#ff3333', transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fff0f0')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        🗑 Delete Node
                      </button>
                    )}
                  </>
                )}
                {contextMenu.isPane && (
                  <>
                    {(() => {
                      const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                      return currentSelectedNodes.length > 0;
                    })() ? (
                      <>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            if (currentSelectedNodes.length > 0) {
                              groupSelectedNodes();
                            }
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee', 
                            background: 'white', fontSize: '13px',
                            color: '#333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          📦 Group Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            if (currentSelectedNodes.length > 0) {
                              const nodeIds = currentSelectedNodes.map(node => node.id);
                              onNodesChange?.(nodeIds.map(id => ({ type: 'remove', id })));
                            }
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee', 
                            background: 'white', fontSize: '13px',
                            color: '#ff3333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fff0f0')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          🗑 Delete Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            createEmptyGroup();
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee', 
                            background: 'white', fontSize: '13px',
                            color: '#333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          📦 Create Empty Group
                        </button>
                        <button 
                          onClick={() => {
                            setSidebarOpen(true);
                            setContextMenu(prev => ({...prev, visible: false}));
                          }}
                          style={{ 
                            display: 'block', width: '100%', textAlign: 'left', 
                            padding: '10px 12px', cursor: 'pointer', 
                            border: 'none', borderBottom: '1px solid #eee', 
                            background: 'white', fontSize: '13px',
                            color: '#333', transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          📚 Show Resources Panel
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {selectedEdge && <EdgeDeleteButton edge={selectedEdge} onEdgeDelete={onEdgeDelete} />}
          
          <Panel position="top-center">
            <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* Botón para guardar explícitamente el estado del diagrama */}
              <button 
                onClick={() => {
                  // Obtener el viewport actual
                  const currentViewport = reactFlowInstance.getViewport();
                  console.log('Guardando viewport:', currentViewport);
                  
                  // Actualizar la referencia al viewport
                  lastViewportRef.current = currentViewport;
                  
                  // Guardar el diagrama completo con el viewport
                  if (onSave) {
                    const flow = reactFlowInstance.toObject();
                    onSave({
                      ...flow,
                      viewport: currentViewport
                    });
                    alert('Diagrama guardado con éxito, incluyendo zoom y posición');
                  }
                }} 
                title="Guardar estado actual (zoom y posición)" 
                style={{
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                💾
              </button>
              <button 
                onClick={saveCurrentDiagramState} 
                title="Guardar estado actual" 
                style={{
                  background: '#4CAF50',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                💾
              </button>
              <button 
                onClick={() => handleToolClick('select')} 
                title="Select (V)" 
                style={{
                  background: activeTool === 'select' ? '#f0f7ff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  transition: 'background 0.2s'
                }}>
                <CursorArrowRaysIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleToolClick('lasso')} 
                title="Lasso Select (Shift+S)" 
                style={{
                  background: activeTool === 'lasso' ? '#f0f7ff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  transition: 'background 0.2s'
                }}>
                <SwatchIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleToolClick('note')} 
                onMouseDown={(e) => {
                  // Permitir tanto click como drag
                  e.preventDefault();
                }}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStartSidebar(e, {type: 'note', name: 'New Note', description: 'Add a note', provider: 'generic'});
                }}
                title="Add Note (N) - Click to activate tool or drag to canvas" 
                style={{
                  background: activeTool === 'note' ? '#f0f7ff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  transition: 'background 0.2s'
                }}>
                <DocumentTextIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleToolClick('text')} 
                onMouseDown={(e) => {
                  // Permitir tanto click como drag
                  e.preventDefault();
                }}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStartSidebar(e, {type: 'text', name: 'New Text', description: 'Add text', provider: 'generic'});
                }}
                title="Add Text (T) - Click to activate tool or drag to canvas" 
                style={{
                  background: activeTool === 'text' ? '#f0f7ff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  transition: 'background 0.2s'
                }}>
                <PencilIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => createEmptyGroup()} 
                title="Create Group (G)" 
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0',
                  transition: 'background 0.2s'
                }}>
                <Square3Stack3DIcon className="h-5 w-5" />
              </button>
            </div>
          </Panel>

          {/* Botón para mostrar el sidebar cuando está oculto */}
          {!sidebarOpen && (
            <Panel position="top-right">
              <div 
                style={{ 
                  padding: '8px', 
                  background: 'rgba(255,255,255,0.9)', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setSidebarOpen(true)}
                title="Show Resources Panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                <span style={{fontSize: '14px'}}>Resources</span>
              </div>
            </Panel>
          )}

          {sidebarOpen && (
            <Panel position="top-right" style={{ 
              width: '280px', 
              background: 'rgba(255,255,255,0.85)', 
              padding: '0', 
              borderRadius: '8px', 
              maxHeight: '90vh',
              height: 'auto',
              overflow: 'visible',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'fixed',
              top: '50%',
              right: '20px',
              zIndex: 9999,
              // Use CSS transform with transition instead of animation to avoid TypeScript parsing issues
              transform: 'translateY(-50%)',
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(238, 238, 238, 0.8)', 
                flexShrink: 0,
                minHeight: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                position: 'relative',
                zIndex: 10000,
                backdropFilter: 'blur(8px)'
              }}>
                  <h4 style={{margin: 0, fontSize: '16px', fontWeight: 'bold'}}>Resources</h4>
                  <button 
                    onClick={() => setSidebarOpen(false)} 
                    style={{
                      border: 'none', 
                      background: 'transparent', 
                      cursor: 'pointer',
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    title="Hide Resources Panel"
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                    </svg>
                  </button>
              </div>
              <div style={{
                overflowY: 'auto', 
                overflowX: 'hidden',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                paddingBottom: '16px',
                maxHeight: 'calc(90vh - 48px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#ccc #f1f1f1',
                backdropFilter: 'blur(8px)'
              }}>
                {resourceCategories.map(category => (
                  <div key={category.name} style={{borderBottom: '1px solid #f5f5f5'}}>
                    <h5 
                      onClick={() => setCollapsedCategories(prev => ({...prev, [category.name]: !prev[category.name]}))} 
                      style={{ 
                        cursor: 'pointer', 
                        margin: 0, 
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: collapsedCategories[category.name] ? '#ffffff' : '#f8f8f8',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (!collapsedCategories[category.name]) return;
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseOut={(e) => {
                        if (!collapsedCategories[category.name]) return;
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <span>{category.name}</span>
                      <span style={{color: '#666'}}>{collapsedCategories[category.name] ? '▸' : '▾'}</span>
                    </h5>
                    {!collapsedCategories[category.name] && (
                      <ul style={{
                        listStyleType: 'none', 
                        padding: '2px 0',
                        margin: 0, 
                        backgroundColor: '#fdfdfd',
                        maxHeight: 'none',
                        overflowY: 'visible',
                        position: 'relative',
                        zIndex: 10001
                      }}>
                        {category.items.map(item => (
                          <li
                            key={category.name + '-' + item.type + '-' + item.name}
                            draggable
                            onDragStart={(e) => onDragStartSidebar(e, item)}
                            style={{ 
                              padding: '6px 16px',
                              margin: '0', 
                              cursor: 'grab',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#444',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <div style={{ minWidth: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.icon ? item.icon : <span style={{ fontSize: '18px', color: '#999' }}>•</span>}
                            </div>
                            <span style={{ flex: 1 }}>{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

const FlowEditor = (props: FlowEditorProps): JSX.Element => {
  // Pass nodes and edges from props to FlowEditorContent
  // onNodesChange and onEdgesChange should update these props in the parent component (e.g., DiagramPage)
  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full">
        <FlowEditorContent {...props} />
      </div>
    </ReactFlowProvider>
  );
};

export default FlowEditor;