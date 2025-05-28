import { message } from 'antd';
import { 
  Background, 
  BackgroundVariant, 
  Controls, 
  Edge, 
  EdgeTypes, 
  MiniMap, 
  Node, 
  NodeTypes, 
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  Panel, 
  ReactFlow, 
  ReactFlowProvider, 
  SelectionMode, 
  Viewport,
  useEdgesState, 
  useNodesState, 
  useOnSelectionChange,
  useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback, useEffect, useRef, useState, useMemo, JSX } from 'react';
import { 
  CursorArrowRaysIcon, 
  Square3Stack3DIcon,
  SwatchIcon,
  DocumentTextIcon,
  PencilIcon,
  RectangleGroupIcon,
  XMarkIcon,
  ServerIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { Diagram } from '@/app/services/diagramService';
import nodeTypes from '../nodes/NodeTypes';
import { NodeExecutionState, NodeWithExecutionStatus } from '../../utils/customTypes';
import ExecutionLog from './ExecutionLog';

// Add this interface at the top of the file with other interfaces
interface SingleNodePreview {
  action: 'create' | 'update' | 'delete';
  resource: {
    name: string;
    type: string;
    provider: string;
    changes: {
      properties: Record<string, {
        before?: any;
        after?: any;
        action: 'create' | 'update' | 'delete';
      }>;
    };
  };
  dependencies: Array<{
    name: string;
    type: string;
    action: 'create' | 'update' | 'delete';
    properties: Record<string, {
      before?: any;
      after?: any;
      action: 'create' | 'update' | 'delete';
    }>;
  }>;
  estimated_cost?: {
    monthly: number;
    currency: string;
  };
}

interface Dependency {
  name: string;
  type: string;
  [key: string]: any;
}

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
  customItems?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}

type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea' | 'note' | 'text' | 'area';

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

interface ResourceProperties {
  [key: string]: string | number | boolean | null;
}

interface PreviewData {
  resourcesToCreate: Array<{
    id: string;
    type: string | undefined;
    name: string;
    provider: string;
    changes: {
      create: boolean;
      update: boolean;
      properties: ResourceProperties;
    };
  }>;
  resourcesToUpdate: Array<{
    id: string;
    type: string | undefined;
    name: string;
    provider: string;
    changes: {
      create: boolean;
      update: boolean;
      properties: ResourceProperties;
    };
  }>;
  resourcesToDelete: Array<{
    id: string;
    type: string | undefined;
    name: string;
    provider: string;
  }>;
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
  diagramId,
  initialDiagram,
  companyId,
  environmentId
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
  const [activeDrag, setActiveDrag] = useState<{ 
    item: ResourceItem, 
    offset: { x: number, y: number },
    elementSize?: { width: number, height: number }
  } | null>(null);
  const [, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  
  // Estados para la herramienta de área
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [areaStartPos, setAreaStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Add a ref to store the last viewport state
  const lastViewportRef = useRef<Viewport | null>(null);
  
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null,
    isPane: false,
    parentInfo: null,
    customItems: undefined
  });

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isExecutionLogVisible, setIsExecutionLogVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runModalVisible, setRunModalVisible] = useState(false);
  const currentDiagram = initialDiagram;
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [singleNodePreview, setSingleNodePreview] = useState<SingleNodePreview | null>(null);
  const [showSingleNodePreview, setShowSingleNodePreview] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

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
    
    // Si estamos en modo lasso, no realizar ninguna acción al hacer clic
    if (activeTool === 'lasso') {
      return;
    }

    // Crear nodo de nota cuando la herramienta de nota está activa
    if (activeTool === 'note' && reactFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      
      // Mantener el cursor crosshair durante la creación
      document.body.style.cursor = 'crosshair';
      
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
          backgroundColor: '#FEF08A',
          textColor: '#1F2937',
          fontSize: 14
        },
        selected: true,
        draggable: true,
        selectable: true
      };
      
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      
      return;
    }

    // Crear nodo de texto cuando la herramienta de texto está activa
    if (activeTool === 'text' && reactFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      
      // Mantener el cursor crosshair durante la creación
      document.body.style.cursor = 'crosshair';
      
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
          fontWeight: 'normal',
          textAlign: 'left',
          textColor: '#000000',
          backgroundColor: 'transparent',
          borderStyle: 'none'
        },
        selected: true,
        draggable: true,
        selectable: true
      };
      
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      
      return;
    }
    
    // Restaurar el cursor por defecto después de la creación
    document.body.style.cursor = 'default';
  }, [activeTool, reactFlowInstance, onNodesChange]);

  // Listener para actualizaciones del AreaNode
  useEffect(() => {
    const handleAreaNodeUpdate = (event: CustomEvent) => {
      const { nodeId, data: newData } = event.detail;
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => 
          node.id === nodeId 
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    };

    window.addEventListener('updateAreaNode', handleAreaNodeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('updateAreaNode', handleAreaNodeUpdate as EventListener);
    };
  }, [reactFlowInstance]);

  // Listener for showContextMenu events from nodes
  useEffect(() => {
    const handleShowContextMenu = (event: CustomEvent) => {
      const { x, y, items } = event.detail;
      
      // Create a custom context menu with the items from the node
      setContextMenu({
        visible: true,
        x,
        y,
        nodeId: null, // This will be handled by the menu items themselves
        nodeType: null,
        isPane: false,
        parentInfo: null,
        customItems: items // Store the custom items
      });
    };

    document.addEventListener('showContextMenu', handleShowContextMenu as EventListener);
    
    return () => {
      document.removeEventListener('showContextMenu', handleShowContextMenu as EventListener);
    };
  }, []);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Solo mostrar el menú contextual si el nodo está seleccionado
    if (!node.selected) {
      return;
    }
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type || null,
      isPane: false,
      parentInfo: null
    });
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // Deshabilitar completamente el menú contextual del stage
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

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

  useOnSelectionChange({
    onChange: ({ nodes: selected }) => {
      // Update selected nodes state
      setSelectedNodes(selected);
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

  // DISABLED: Auto-centering nodes in viewport to fix drag-and-drop positioning issues
  // This was causing the viewport to automatically center when dropping nodes near edges
  // useEffect(() => {
  //   if (!reactFlowInstance || !nodes.length) return;
  //   
  //   // Wait for nodes to be rendered
  //   setTimeout(() => {
  //     // Calculate nodes bounding box
  //     let minX = Infinity, minY = Infinity;
  //     let maxX = -Infinity, maxY = -Infinity;
  //     
  //     reactFlowInstance.getNodes().forEach(node => {
  //       if (!node.hidden) {
  //         const nodeWidth = node.width || 150;
  //         const nodeHeight = node.height || 80;
  //         
  //         minX = Math.min(minX, node.position.x);
  //         minY = Math.min(minY, node.position.y);
  //         maxX = Math.max(maxX, node.position.x + nodeWidth);
  //         maxY = Math.max(maxY, node.position.y + nodeHeight);
  //       }
  //     });

  //     // Skip if no nodes are visible or bounding box calculation failed
  //     if (minX === Infinity || minY === Infinity) return;
  //     
  //     // Calculate center of nodes
  //     const nodesWidth = maxX - minX;
  //     const nodesHeight = maxY - minY;
  //     const nodesCenterX = minX + nodesWidth / 2;
  //     const nodesCenterY = minY + nodesHeight / 2;
  //     
  //     // Get viewport dimensions
  //     const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 600 };
  //     const viewportCenterX = width / 2;
  //     const viewportCenterY = height / 2;
  //     
  //     // Calculate the translation needed to center nodes
  //     const zoom = 1; // Keep zoom level fixed at 1
  //     const translateX = viewportCenterX - nodesCenterX * zoom;
  //     const translateY = viewportCenterY - nodesCenterY * zoom;
  //     
  //     // Set viewport to center nodes without animation
  //     reactFlowInstance.setViewport({ 
  //       x: translateX, 
  //       y: translateY, 
  //       zoom 
  //     });
  //   }, 200); // Small delay to ensure nodes are rendered
  // }, [reactFlowInstance, nodes.length, reactFlowWrapper]);

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

  const handleToolClick = useCallback((tool: ToolType) => {
    if (tool === activeTool && tool !== 'lasso' && tool !== 'area') return;
    document.body.classList.remove('lasso-selection-mode');
    document.body.classList.remove('area-drawing-mode');

    // Handle tool-specific actions
    if (tool === 'lasso') {
      document.body.classList.add('lasso-selection-mode');
      
      // Limpiar selección actual cuando se activa la herramienta lasso pero mantener selectable
      reactFlowInstance.setNodes(nodes => nodes.map(node => ({ 
        ...node, 
        selected: false, 
        selectable: true 
      })));
    } else if (tool === 'area') {
      document.body.classList.add('area-drawing-mode');
      
      // Clear any current selection when activating area tool
      reactFlowInstance.setNodes(nodes => nodes.map(node => ({ 
        ...node, 
        selected: false 
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
      
      .lasso-selection-mode .react-flow__pane {
        cursor: crosshair !important;
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

  const onDragStartSidebar = (event: React.DragEvent, itemData: ResourceItem) => {
    // Prevent dragging when area or text tool is active
    if (activeTool === 'area' || activeTool === 'text') {
      event.preventDefault();
      return;
    }
    
    event.dataTransfer.setData('application/reactflow', JSON.stringify(itemData));
    event.dataTransfer.effectAllowed = 'move';
    const dragElement = event.currentTarget as HTMLDivElement;
    const rect = dragElement.getBoundingClientRect();
    
    // More precise offset calculation - get exact click position within element
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    // Store both the element dimensions and click offset for more accurate positioning
    setActiveDrag({ 
      item: itemData, 
      offset: { x: offsetX, y: offsetY },
      elementSize: { width: rect.width, height: rect.height }
    });

    // Cambiar el cursor durante el arrastre
    document.body.style.cursor = 'crosshair';
  };

  // Estado para rastrear el grupo sobre el cual se está arrastrando un nodo
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    // Prevent drag over when area or text tool is active
    if (activeTool === 'area' || activeTool === 'text') {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Mantener el cursor crosshair durante el arrastre
    document.body.style.cursor = 'crosshair';
    
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
  }, [reactFlowInstance, isInsideGroup, highlightedGroupId, activeTool]);
  
  // Resetear el grupo resaltado cuando termina el arrastre
  const onDragEnd = useCallback(() => {
    setHighlightedGroupId(null);
    setActiveDrag(null);
    // Restaurar el cursor por defecto
    document.body.style.cursor = 'default';
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

    // Prevent dropping when area tool is active
    if (activeTool === 'area') {
      return;
    }

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !reactFlowInstance) return;

    try {
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;
      
      const transferredData = JSON.parse(dataStr) as ResourceItem;
      
      // Use screenToFlowPosition to get the precise position in flow coordinates
      // Account for the exact drag offset so the node appears exactly where the cursor is
      const dragOffset = activeDrag?.offset || { x: 0, y: 0 };
      
      // Get node dimensions for group boundary calculations
      let nodeWidth = 200;
      let nodeHeight = 100;
      
      // Adjust dimensions for specific node types
      if (transferredData.type === 'note') {
        nodeWidth = 200;
        nodeHeight = 120;
      } else if (transferredData.type === 'text') {
        nodeWidth = 150;
        nodeHeight = 80;
      } else if (transferredData.type === 'group') {
        nodeWidth = 300;
        nodeHeight = 200;
      }
      
      // Precise positioning: 
      // 1. Start with mouse position
      // 2. Subtract where user clicked within the dragged element (dragOffset)
      // This ensures the node appears exactly where the mouse cursor is
      const adjustedX = event.clientX - dragOffset.x;
      const adjustedY = event.clientY - dragOffset.y;
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: adjustedX,
        y: adjustedY
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
          position: { ...position },
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
      }

      // Check if the node is dropped within a group
      const groupNode = findGroupAtPosition(position);
      if (groupNode) {
        const parentGroup = reactFlowInstance.getNode(groupNode.id);
        if (parentGroup) {
          // Calculate the position relative to the group
          const groupPosition = { ...parentGroup.position };
          const relativePosition = {
            x: position.x - groupPosition.x,
            y: position.y - groupPosition.y
          };

          // Ensure the node stays within the group's boundaries
          const groupWidth = parentGroup.width || 300;
          const groupHeight = parentGroup.height || 200;
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

          // Update the node's position and parent
          newNode.position = { ...clampedPosition };
          newNode.parentId = groupNode.id;
          newNode.extent = 'parent' as const;
        }
      }

      // Add the new node to the flow without any viewport manipulation
      const updatedNodes = [...reactFlowInstance.getNodes(), newNode];
      setNodes(updatedNodes);
      
      // Notify parent component if needed
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      
      // If node is added to a group, optimize the group layout
      if (newNode.parentId) {
        setTimeout(() => {
          optimizeNodesInGroup(newNode.parentId!);
        }, 0);
      }

      // Save the diagram if needed
      if (diagramId && onSave) {
        const currentViewport = reactFlowInstance.getViewport();
        onSave({
          nodes: updatedNodes,
          edges: reactFlowInstance.getEdges(),
          viewport: currentViewport
        });
      }

    } catch (error) {
      console.error("Error handling node drop:", error);
    }
  }, [reactFlowInstance, findGroupAtPosition, onNodesChange, optimizeNodesInGroup, setNodes, diagramId, onSave, activeDrag, activeTool]);

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
  }, [onSave, reactFlowInstance, propNodes, propEdges, saveCurrentDiagramState]);

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
        case 'a': // Area tool
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            handleToolClick('area');
          }
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

  // Modificar la función para mover nodos hacia atrás
  const moveNodesToBack = useCallback((nodeIds: string[]) => {
    const nodes = reactFlowInstance.getNodes();
    const selectedIds = new Set(nodeIds);
    
    // Encontrar el zIndex más bajo actual
    const minZIndex = Math.min(...nodes.map(n => n.zIndex || 0));
    
    // Actualizar los nodos seleccionados con un zIndex más bajo
    const updatedNodes = nodes.map(node => {
      if (selectedIds.has(node.id)) {
        return { ...node, zIndex: minZIndex - 1 };
      }
      return node;
    });
    
    reactFlowInstance.setNodes(updatedNodes);
  }, [reactFlowInstance]);

  // Función para simular la ejecución de un nodo
  const simulateNodeExecution = async (node: NodeWithExecutionStatus, state: NodeExecutionState) => {
    const message = getExecutionMessage(node, state);
    setExecutionLogs(prev => [...prev, message]);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const getExecutionMessage = (node: NodeWithExecutionStatus, state: NodeExecutionState): string => {
    const nodeName = node.data?.label || 'Unnamed Resource';
    const getResourceDetails = () => {
      const details = [];
      if (node.data?.provider) details.push(`Provider: ${node.data.provider}`);
      if (node.data?.resourceType) details.push(`Type: ${node.data.resourceType}`);
      return details.length > 0 ? ` (${details.join(', ')})` : '';
    };

    switch (state) {
      case 'creating':
        return `Iniciando creación de ${nodeName}${getResourceDetails()}...`;
      case 'updating':
        return `Iniciando actualización de ${nodeName}${getResourceDetails()}...`;
      case 'deleting':
        return `Iniciando eliminación de ${nodeName}${getResourceDetails()}...`;
      case 'success':
        return `${nodeName} procesado exitosamente`;
      case 'error':
        return `Error al procesar ${nodeName}`;
      default:
        return `Procesando ${nodeName}...`;
    }
  };

  // Modificar el handlePreview para incluir la simulación
  const handlePreview = useCallback(() => {
    if (!currentDiagram) return;
    
    try {
      setIsExecutionLogVisible(true);
      setExecutionLogs([]);

      // Obtener nodos que no son grupos
      const executionNodes = currentDiagram.nodes.filter((node) => node.type !== 'group');

      // Simular ejecución secuencial
      const simulateExecution = async () => {
        for (const node of executionNodes) {
          let state: NodeExecutionState;
          
          // Determinar el estado basado en las propiedades reales del nodo
          if (node.data?.status === 'creating' || node.data?.status === 'new' || (!node.data?.status && node.data?.isNew)) {
            state = 'creating';
          } else if (node.data?.status === 'updating' || node.data?.status === 'modified' || node.data?.hasChanges) {
            state = 'updating';
          } else if (node.data?.status === 'deleting' || node.data?.status === 'toDelete' || node.data?.markedForDeletion) {
            state = 'deleting';
          } else {
            state = 'creating';
          }

          const nodeName = node.data?.label || 'Unnamed Resource';
          
          // Logs de procesamiento
          const processingLog = `Procesando ${state} para ${nodeName}...`;
          const successLog = `${state} completado para ${nodeName}`;
          const costLog = `Costo estimado para ${nodeName}: $${node.data?.estimated_cost?.monthly || 0} USD/mes`;

          // Agregar logs
          setExecutionLogs(prev => [...prev, processingLog]);
          
          // Simular tiempo de ejecución
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Agregar logs de éxito y costo
          setExecutionLogs(prev => [...prev, successLog]);
          setExecutionLogs(prev => [...prev, costLog]);
        }
      };

      simulateExecution();
    } catch (err) {
      console.error('Error al ejecutar el preview:', err);
      message.error('Error al ejecutar el preview');
    }
  }, [currentDiagram]);

  // Modificar el handleRun para incluir la simulación
  const handleRun = useCallback(() => {
    if (!currentDiagram) return;
    
    try {
      setIsExecutionLogVisible(true);
      setExecutionLogs([]);

      // Obtener nodos que no son grupos
      const executionNodes = currentDiagram.nodes.filter((node) => node.type !== 'group');

      // Simular ejecución secuencial
      const simulateExecution = async () => {
        for (const node of executionNodes) {
          let state: NodeExecutionState;
          
          // Determinar el estado basado en las propiedades reales del nodo
          if (node.data?.status === 'creating' || node.data?.status === 'new' || (!node.data?.status && node.data?.isNew)) {
            state = 'creating';
          } else if (node.data?.status === 'updating' || node.data?.status === 'modified' || node.data?.hasChanges) {
            state = 'updating';
          } else if (node.data?.status === 'deleting' || node.data?.status === 'toDelete' || node.data?.markedForDeletion) {
            state = 'deleting';
          } else {
            state = 'creating';
          }

          const nodeName = node.data?.label || 'Unnamed Resource';
          
          // Logs de procesamiento
          const processingLog = `Procesando ${state} para ${nodeName}...`;
          const successLog = `${state} completado para ${nodeName}`;
          const costLog = `Costo estimado para ${nodeName}: $${node.data?.estimated_cost?.monthly || 0} USD/mes`;

          // Agregar logs
          setExecutionLogs(prev => [...prev, processingLog]);
          
          // Simular tiempo de ejecución
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Agregar logs de éxito y costo
          setExecutionLogs(prev => [...prev, successLog, costLog]);
        }
      };

      simulateExecution();
    } catch (err) {
      console.error('Error al ejecutar el diagrama:', err);
      message.error('Error al ejecutar el diagrama');
    }
  }, [currentDiagram]);

  useEffect(() => {
    const handler = (event: CustomEvent<SingleNodePreview>) => {
      setSingleNodePreview(event.detail);
      setShowSingleNodePreview(true);
    };
    window.addEventListener('showSingleNodePreview', handler as EventListener);
    return () => window.removeEventListener('showSingleNodePreview', handler as EventListener);
  }, []);

  const handleApplyChanges = async () => {
    if (!singleNodePreview) return;
    
    try {
      setLoading(true);
      setShowLogs(true); // Asegurar que los logs se muestren
      setExecutionLogs([]); // Limpiar logs anteriores
      
      // Procesar el recurso principal
      const processingLog = `Procesando ${singleNodePreview.action} del recurso ${singleNodePreview.resource.name}`;
      setExecutionLogs(prev => [...prev, processingLog]);

      // Simular procesamiento del recurso principal
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log de éxito final
      const successLog = `Recurso ${singleNodePreview.resource.name} ${singleNodePreview.action === 'create' ? 'creado' : 
              singleNodePreview.action === 'update' ? 'actualizado' : 'eliminado'} exitosamente`;
      setExecutionLogs(prev => [...prev, successLog]);

      // Si hay costo estimado, mostrarlo
      if (singleNodePreview.estimated_cost) {
        const costLog = `Costo estimado: ${singleNodePreview.estimated_cost.currency} ${singleNodePreview.estimated_cost.monthly.toFixed(2)}`;
        setExecutionLogs(prev => [...prev, costLog]);
      }

      // Procesar dependencias si existen
      if (singleNodePreview.dependencies && singleNodePreview.dependencies.length > 0) {
        setExecutionLogs(prev => [...prev, `Procesando ${singleNodePreview.dependencies.length} dependencias...`]);
        
        for (const dep of singleNodePreview.dependencies) {
          const depLog = `Procesando dependencia: ${dep.name} (${dep.type}) - ${dep.action === 'create' ? 'Creando' : dep.action === 'update' ? 'Actualizando' : 'Eliminando'}`;
          setExecutionLogs(prev => [...prev, depLog]);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const depSuccessLog = `Dependencia ${dep.name} procesada exitosamente`;
          setExecutionLogs(prev => [...prev, depSuccessLog]);
        }
      }

      setLoading(false);
      setShowSingleNodePreview(false);
      setSingleNodePreview(null);
    } catch (err) {
      console.error('Error al aplicar cambios:', err);
      const errorLog = `Error al aplicar cambios: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      setExecutionLogs(prev => [...prev, errorLog]);
      message.error('Error al aplicar cambios');
      setLoading(false);
    }
  };

  

  return (
    <div className="relative w-full h-full">
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
              cursor: ${activeTool === 'note' ? 'move' : 
                       activeTool === 'text' ? 'move' :
                       activeTool === 'area' ? 'move' : 'default'};
            }
            .react-flow__node {
              cursor: move !important;
            }
            .react-flow__node:active {
              cursor: move !important;
            }
            .react-flow__node:hover {
              cursor: move !important;
            }
            .react-flow__node[data-dragging="true"] {
              cursor: move !important;
            }
            .react-flow__node[data-selected="true"] {
              cursor: move !important;
            }
            .react-flow__node[data-selected="true"]:active {
              cursor: move !important;
            }
            .react-flow__node[data-selected="true"]:hover {
              cursor: move !important;
            }
            .area-node {
              background-color: rgba(59, 130, 246, 0.1) !important;
              border: 1px solid rgba(59, 130, 246, 0.5) !important;
              border-radius: 8px !important;
            }
            .area-node:hover {
              background-color: rgba(59, 130, 246, 0.15) !important;
              border: 1px solid rgba(59, 130, 246, 0.6) !important;
            }
            .area-node[data-selected="true"] {
              background-color: rgba(59, 130, 246, 0.2) !important;
              border: 1px solid rgba(59, 130, 246, 0.7) !important;
            }
            .note-node {
              cursor: move !important;
            }
            .note-node:hover {
              cursor: move !important;
            }
            .note-node:active {
              cursor: move !important;
            }
            .note-node[data-selected="true"] {
              cursor: move !important;
            }
            .note-node[data-selected="true"]:hover {
              cursor: move !important;
            }
            .note-node[data-selected="true"]:active {
              cursor: move !important;
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
          onPaneContextMenu={handlePaneContextMenu}          onMouseDown={(event) => {
            if (activeTool === 'area' && reactFlowInstance) {
              // Check if we clicked on a node, edge, or other interactive element
              const target = event.target as HTMLElement;
              const nodeElement = target.closest('.react-flow__node');
              const edgeElement = target.closest('.react-flow__edge');
              const handleElement = target.closest('.react-flow__handle');
              const controlElement = target.closest('.react-flow__controls');
              
              // If we clicked on any interactive element, don't start area drawing
              if (nodeElement || edgeElement || handleElement || controlElement) {
                return;
              }
              
              // Only start area drawing if clicking on the pane itself
              const paneElement = target.closest('.react-flow__pane');
              if (!paneElement) {
                return;
              }
              
              event.preventDefault();
              event.stopPropagation();
              
              const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
              });
              
              setIsDrawingArea(true);
              setAreaStartPos(position);
              setCurrentArea({
                x: position.x,
                y: position.y,
                width: 0,
                height: 0
              });
              
              // Añadir clase al body para el cursor
              document.body.classList.add('area-drawing-mode');
            }
          }}
          onMouseMove={(event) => {
            if (isDrawingArea && areaStartPos && reactFlowInstance) {
              const currentPos = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
              });

              const width = Math.abs(currentPos.x - areaStartPos.x);
              const height = Math.abs(currentPos.y - areaStartPos.y);
              const x = Math.min(areaStartPos.x, currentPos.x);
              const y = Math.min(areaStartPos.y, currentPos.y);

              setCurrentArea({ x, y, width, height });
            }
          }}
          onMouseUp={() => {
            if (isDrawingArea && currentArea && reactFlowInstance) {
              // Solo crear el área si tiene un tamaño mínimo
              if (currentArea.width > 20 && currentArea.height > 20) {
                const newAreaNode: Node = {
                  id: `area-${Date.now()}`,
                  type: 'areaNode',
                  position: { x: currentArea.x, y: currentArea.y },
                  data: {
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    shape: 'rectangle',
                    label: 'Area'
                  },
                  style: {
                    width: currentArea.width,
                    height: currentArea.height
                  },
                  width: currentArea.width,
                  height: currentArea.height,
                  selected: true,
                  draggable: true,
                  selectable: true
                };

                if (onNodesChange) {
                  onNodesChange([{ type: 'add', item: newAreaNode }]);
                }
              }

              // Resetear estado de dibujo
              setIsDrawingArea(false);
              setAreaStartPos(null);
              setCurrentArea(null);
              document.body.classList.remove('area-drawing-mode');
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          elementsSelectable={true}
          nodesDraggable={activeTool !== 'area'}
          nodesConnectable={true}
          panOnDrag={activeTool !== 'lasso' && activeTool !== 'area'}
          panOnScroll={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          selectionOnDrag={activeTool === 'lasso'}
          selectionMode={SelectionMode.Partial}
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
            style={{ bottom: 20, left: 20 }}
          />
          
          {/* Overlay visual para el dibujo de área */}
          {isDrawingArea && currentArea && reactFlowInstance && (
            <div
              className="area-drawing-overlay"
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 1000,
                left: `${(currentArea.x * reactFlowInstance.getViewport().zoom) + reactFlowInstance.getViewport().x}px`,
                top: `${(currentArea.y * reactFlowInstance.getViewport().zoom) + reactFlowInstance.getViewport().y}px`,
                width: `${currentArea.width * reactFlowInstance.getViewport().zoom}px`,
                height: `${currentArea.height * reactFlowInstance.getViewport().zoom}px`,
                border: '2px dashed rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '4px',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                transition: 'none'
              }}
            />
          )}
          
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
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            if (currentSelectedNodes.length > 0) {
                              const nodes = reactFlowInstance.getNodes();
                              const selectedIds = new Set(currentSelectedNodes.map(node => node.id));
                              const updatedNodes = nodes.map(node => {
                                if (selectedIds.has(node.id)) {
                                  return { ...node, zIndex: (node.zIndex || 0) - 1 };
                                }
                                return node;
                              });
                              reactFlowInstance.setNodes(updatedNodes);
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
                          ⬇️ Move Selected to Back
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
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            if (currentSelectedNodes.length > 0) {
                              moveNodesToBack(currentSelectedNodes.map(node => node.id));
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
                          ⬇️ Move Selected to Back
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
                      <>
                        <button 
                          onClick={() => {
                            const node = reactFlowInstance.getNode(contextMenu.nodeId || '');
                            if (node) {
                              setLoading(true);
                              setIsExecutionLogVisible(true);
                              simulateNodeExecution(node as NodeWithExecutionStatus, 'creating')
                                .then(() => simulateNodeExecution(node as NodeWithExecutionStatus, 'success'))
                                .finally(() => setLoading(false));
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
                          ▶️ Run Node
                        </button>
                        <button 
                          onClick={() => {
                            const node = reactFlowInstance.getNode(contextMenu.nodeId || '');
                            if (node) {
                              // Crear el objeto de preview para el nodo
                              const nodePreview: SingleNodePreview = {
                                action: 'create',
                                resource: {
                                  name: node.data?.label || 'Unnamed Resource',
                                  type: node.type || 'unknown',
                                  provider: node.data?.provider || 'generic',
                                  changes: {
                                    properties: {
                                      label: {
                                        after: node.data?.label || 'Unnamed Resource',
                                        action: 'create'
                                      },
                                      description: {
                                        after: node.data?.description || '',
                                        action: 'create'
                                      },
                                      provider: {
                                        after: node.data?.provider || 'generic',
                                        action: 'create'
                                      },
                                      status: {
                                        after: node.data?.status || 'success',
                                        action: 'create'
                                      },
                                      lastUpdated: {
                                        after: node.data?.lastUpdated || new Date().toISOString(),
                                        action: 'create'
                                      },
                                      version: {
                                        after: node.data?.version || 1,
                                        action: 'create'
                                      }
                                    }
                                  }
                                },
                                dependencies: node.data?.dependencies?.map((dep: Dependency) => ({
                                  name: dep.name,
                                  type: dep.type,
                                  action: 'create',
                                  properties: {
                                    ...Object.entries(dep).reduce((acc: Record<string, any>, [key, value]) => {
                                      if (key !== 'name' && key !== 'type') {
                                        acc[key] = {
                                          after: value,
                                          action: 'create'
                                        };
                                      }
                                      return acc;
                                    }, {})
                                  }
                                })) || [],
                                estimated_cost: node.data?.estimated_cost
                              };
                              
                              setSingleNodePreview(nodePreview);
                              setShowSingleNodePreview(true);
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
                          👁️ Preview
                        </button>
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
                      </>
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
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter(node => node.selected);
                            if (currentSelectedNodes.length > 0) {
                              const nodes = reactFlowInstance.getNodes();
                              const selectedIds = new Set(currentSelectedNodes.map(node => node.id));
                              const updatedNodes = nodes.map(node => {
                                if (selectedIds.has(node.id)) {
                                  return { ...node, zIndex: (node.zIndex || 0) - 1 };
                                }
                                return node;
                              });
                              reactFlowInstance.setNodes(updatedNodes);
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
                          ⬇️ Move Selected to Back
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
                
                {/* Render custom items from nodes */}
                {contextMenu.customItems && (
                  <>
                    {contextMenu.customItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.onClick();
                          setContextMenu(prev => ({...prev, visible: false}));
                        }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%', 
                          textAlign: 'left', 
                          padding: '10px 12px', 
                          cursor: 'pointer', 
                          border: 'none', 
                          borderBottom: index < (contextMenu.customItems?.length || 0) - 1 ? '1px solid #eee' : 'none',
                          background: 'white', 
                          fontSize: '13px',
                          color: '#333', 
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
          {selectedEdge && <EdgeDeleteButton edge={selectedEdge} onEdgeDelete={onEdgeDelete} />}
          
          <Panel position="top-center">
            <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <button 
                onClick={saveCurrentDiagramState} 
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
                onClick={() => handleToolClick('area')} 
                title="Draw Area (A) - Click and drag to create areas" 
                style={{
                  background: activeTool === 'area' ? '#f0f7ff' : 'transparent',
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
                <RectangleGroupIcon className="h-5 w-5" />
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
      
      {/* Run Modal */}
      {runModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Run Deployment</h3>
            <p className="mb-4">Are you sure you want to deploy this diagram?</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setRunModalVisible(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100">
                Cancel
              </button>
              <button 
                onClick={handleRun}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModalVisible && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setPreviewModalVisible(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-lg">👁️</span>
              Vista Previa de Cambios
            </h2>
            <p className="text-gray-500 mb-6">Revisa los cambios que se aplicarán al ejecutar el diagrama.</p>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                  <span>＋</span>{previewData.resourcesToCreate.length}
                </div>
                <div className="text-sm text-green-700 mt-1">Recursos a Crear</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-2">
                  <span>✎</span>{previewData.resourcesToUpdate.length}
                </div>
                <div className="text-sm text-yellow-700 mt-1">Recursos a Actualizar</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
                  <span>－</span>{previewData.resourcesToDelete.length}
                </div>
                <div className="text-sm text-red-700 mt-1">Recursos a Eliminar</div>
              </div>
            </div>
            {/* Recursos a Crear */}
            {previewData.resourcesToCreate.length > 0 && (
              <details open className="mb-6">
                <summary className="cursor-pointer text-green-700 font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-lg">＋</span>
                  Recursos a Crear ({previewData.resourcesToCreate.length})
                </summary>
                <div className="space-y-3 mt-2">
                  {previewData.resourcesToCreate.map(resource => (
                    <div key={resource.id} className="bg-white border border-green-200 rounded p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-green-700">{resource.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({resource.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Crear</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{resource.provider}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Propiedades:</span>
                        <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(resource.changes.properties, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {/* Recursos a Actualizar */}
            {previewData.resourcesToUpdate.length > 0 && (
              <details open className="mb-6">
                <summary className="cursor-pointer text-yellow-700 font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="inline-block bg-yellow-100 text-yellow-700 rounded-full px-3 py-1 text-lg">✎</span>
                  Recursos a Actualizar ({previewData.resourcesToUpdate.length})
                </summary>
                <div className="space-y-3 mt-2">
                  {previewData.resourcesToUpdate.map(resource => (
                    <div key={resource.id} className="bg-white border border-yellow-200 rounded p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-yellow-700">{resource.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({resource.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Actualizar</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{resource.provider}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Cambios:</span>
                        <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(resource.changes, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {/* Recursos a Eliminar */}
            {previewData.resourcesToDelete.length > 0 && (
              <details open className="mb-6">
                <summary className="cursor-pointer text-red-700 font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="inline-block bg-red-100 text-red-700 rounded-full px-3 py-1 text-lg">－</span>
                  Recursos a Eliminar ({previewData.resourcesToDelete.length})
                </summary>
                <div className="space-y-3 mt-2">
                  {previewData.resourcesToDelete.map(resource => (
                    <div key={resource.id} className="bg-white border border-red-200 rounded p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-red-700">{resource.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({resource.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Eliminar</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{resource.provider}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
            <div className="flex justify-end gap-3 mt-8">
              <button
                className="px-5 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                onClick={() => setPreviewModalVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleApplyChanges}
                disabled={loading}
              >
                {loading ? 'Aplicando...' : 'Aplicar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de preview de un solo nodo */}
      {showSingleNodePreview && singleNodePreview && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 overflow-hidden border border-gray-100" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="bg-white p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {singleNodePreview.action === 'create' && (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl text-green-600">＋</span>
                    </div>
                  )}
                  {singleNodePreview.action === 'update' && (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <span className="text-2xl text-yellow-600">✎</span>
                    </div>
                  )}
                  {singleNodePreview.action === 'delete' && (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-2xl text-red-600">－</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {singleNodePreview.resource.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {singleNodePreview.resource.type} • {singleNodePreview.resource.provider}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSingleNodePreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              <div className="space-y-6">
                {/* Changes */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Cambios:</h3>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="space-y-3">
                      {Object.entries(singleNodePreview.resource.changes.properties).map(([key, value]) => {
                        if (value && typeof value === 'object' && 'action' in value) {
                          return (
                            <div key={key} className="flex justify-between items-start text-sm">
                              <span className="text-gray-600">{key}</span>
                              <div className="flex flex-col items-end">
                                {value.action === 'update' && (
                                  <>
                                    <span className="text-red-500 line-through text-xs">- {value.before}</span>
                                    <span className="text-green-500">+ {value.after}</span>
                                  </>
                                )}
                                {value.action === 'create' && (
                                  <span className="text-green-500">+ {value.after}</span>
                                )}
                                {value.action === 'delete' && (
                                  <span className="text-red-500">- {value.before}</span>
                                )}
                                <span className="text-xs text-gray-400 mt-1">
                                  {value.action === 'create' ? 'Nuevo' : 
                                   value.action === 'update' ? 'Actualizado' : 'Eliminado'}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex justify-between items-start text-sm">
                            <span className="text-gray-600">{key}</span>
                            <span className="text-gray-500">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Dependencies */}
                {singleNodePreview.dependencies && singleNodePreview.dependencies.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Dependencias:</h3>
                    <div className="space-y-3">
                      {singleNodePreview.dependencies.map((dep, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full ${
                              dep.action === 'create' ? 'bg-green-100' :
                              dep.action === 'update' ? 'bg-yellow-100' :
                              'bg-red-100'
                            } flex items-center justify-center`}>
                              <span className={
                                dep.action === 'create' ? 'text-green-600' :
                                dep.action === 'update' ? 'text-yellow-600' :
                                'text-red-600'
                              }>
                                {dep.action === 'create' ? '＋' :
                                 dep.action === 'update' ? '✎' : '－'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{dep.name}</div>
                              <div className="text-sm text-gray-500">{dep.type}</div>
                            </div>
                          </div>
                          {Object.entries(dep.properties).length > 0 && (
                            <div className="ml-11 space-y-2">
                              {Object.entries(dep.properties).map(([key, value]) => {
                                if (value && typeof value === 'object' && 'action' in value) {
                                  return (
                                    <div key={key} className="flex justify-between items-start text-sm">
                                      <span className="text-gray-600">{key}</span>
                                      <div className="flex flex-col items-end">
                                        {value.action === 'update' && (
                                          <>
                                            <span className="text-red-500 line-through text-xs">- {value.before}</span>
                                            <span className="text-green-500">+ {value.after}</span>
                                          </>
                                        )}
                                        {value.action === 'create' && (
                                          <span className="text-green-500">+ {value.after}</span>
                                        )}
                                        {value.action === 'delete' && (
                                          <span className="text-red-500">- {value.before}</span>
                                        )}
                                        <span className="text-xs text-gray-400 mt-1">
                                          {value.action === 'create' ? 'Nuevo' : 
                                           value.action === 'update' ? 'Actualizado' : 'Eliminado'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={key} className="flex justify-between items-start text-sm">
                                    <span className="text-gray-600">{key}</span>
                                    <span className="text-gray-500">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimated Cost */}
                {singleNodePreview.estimated_cost && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Costo estimado:</h3>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Costo mensual</span>
                        <span className="font-medium text-gray-900">
                          {singleNodePreview.estimated_cost.currency} {singleNodePreview.estimated_cost.monthly.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with action buttons */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSingleNodePreview(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyChanges}
                  disabled={loading}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Aplicando...' : 'Aplicar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de logs */}
      <div className={`fixed inset-y-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${showLogs ? 'translate-x-0' : 'translate-x-full'}`}>
        <ExecutionLog
          isVisible={showLogs}
          logs={executionLogs}
          onClose={() => setShowLogs(false)}
          previewData={previewData}
        />
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