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
  SelectionMode,
  useOnSelectionChange,
  ConnectionMode,
  Viewport,
  BackgroundVariant,
  NodeChange // <-- Import NodeChange from reactflow
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
} from '@heroicons/react/24/outline';
import React from 'react';
import { Diagram } from '@/app/services/diagramService';

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
  isPane: boolean; // Added to distinguish pane context menu
  parentInfo?: {
    parentId: string;
    parentType: string | undefined;
  } | null;
}

type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea';

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
  resourceCategories = []
}: FlowEditorProps): JSX.Element => {
  
  const memoizedNodeTypes = useMemo(() => externalNodeTypes, [externalNodeTypes]);

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [, setActiveDrag] = useState<{ item: ResourceItem, offset: { x: number, y: number } } | null>(null);
  const [, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectionActive, setSelectionActive] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null,
    isPane: false, // Added to distinguish pane context menu
  });

  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    console.log('Edge clicked:', edge);
    setSelectedEdge(edge);
  }, []);

  const onEdgeDelete = useCallback((edgeToDelete: Edge) => { // Renamed edge to edgeToDelete
    console.log('Deleting edge:', edgeToDelete);
    onEdgesChange?.([{ id: edgeToDelete.id, type: 'remove' }]);
    setSelectedEdge(null);
  }, [onEdgesChange]);

  const handlePaneClick = useCallback(() => {
    setSelectedEdge(null);
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    
    // Incluir información del grupo padre si existe
    const parentInfo = node.parentNode ? {
      parentId: node.parentNode,
      parentType: reactFlowInstance.getNode(node.parentNode)?.type
    } : null;
    
    console.log(`Menú contextual para nodo ${node.id}, tipo: ${node.type}, padre: ${parentInfo?.parentId || 'ninguno'}`);
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type || 'default',
      isPane: false,
      parentInfo: parentInfo
    });
  }, [reactFlowInstance, setContextMenu]);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // Example: Set a generic pane context menu or allow specific actions
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: null, // No specific node
      nodeType: null, // No specific node type
      isPane: true,
    });
  }, [setContextMenu]);

  // 🔒 Critical code below – do not edit or delete
  useEffect(() => {
    if (initialViewport && reactFlowInstance) {
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
    onChange: ({ nodes: selected }) => { // Renamed nodes to selected
      setSelectedNodes(selected);
      
      if (selected.length > 1) {
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

  const centerNodesInViewport = useCallback(() => { // This function is used by a button
    const currentNodes = reactFlowInstance.getNodes();
    if (!reactFlowInstance || currentNodes.length === 0) return;
    
    const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 800 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    currentNodes.forEach(node => {
      if (!node.hidden) {
        const nodeWidth = node.width || 150;
        const nodeHeight = node.height || 80;
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      }
    });
    
    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    const nodesCenterX = minX + nodesWidth / 2;
    const nodesCenterY = minY + nodesHeight / 2;
    
    const viewportCenterX = width / 2;
    const viewportCenterY = height / 2;
    
    const zoom = reactFlowInstance.getViewport().zoom || 1;
    const translateX = viewportCenterX - nodesCenterX * zoom;
    const translateY = viewportCenterY - nodesCenterY * zoom;
    
    reactFlowInstance.setViewport({ x: translateX, y: translateY, zoom });
  }, [reactFlowInstance, reactFlowWrapper]);

  const fitView = useCallback(() => {
    if (!reactFlowInstance) return;
    setTimeout(() => {
      reactFlowInstance.fitView({
        padding: 0.2,
        includeHiddenNodes: false,
        duration: 800
      });
    }, 50);
  }, [reactFlowInstance]);
  
  useEffect(() => {
    if (reactFlowInstance && (propNodes || initialNodes).length > 0) { // Check against propNodes or initialNodes
      fitView();
    }
  }, [reactFlowInstance, propNodes, initialNodes, fitView]);

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
  
    const childNodes = reactFlowInstance.getNodes().filter((n: Node) => n.parentNode === groupId);
    if (childNodes.length === 0) return;
  
    const groupWidth = (group.style?.width as number) || 300;
    
    const headerHeight = 40;
    const verticalMargin = 20;
    const horizontalMargin = 20;
    const nodeSpacing = 8;
    
    const availableWidth = groupWidth - 2 * horizontalMargin;
    const sortedChildNodes = [...childNodes].sort((a, b) => a.id.localeCompare(b.id));
    
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (node.parentNode !== groupId) return node;
      const idx = sortedChildNodes.findIndex((n: Node) => n.id === node.id);
      const y = headerHeight + verticalMargin + idx * (40 + nodeSpacing);
      
      // Asegurar que los nodos sean arrastrables dentro del grupo
      return { 
        ...node, 
        position: { x: horizontalMargin, y }, 
        style: { ...node.style, width: availableWidth, height: 40, transition: 'none' },
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
          ...node, parentNode: newGroupId, extent: 'parent' as const,
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
      const nodesInGroups = selectedNodes.filter(node => node.parentNode);
      if (nodesInGroups.length > 0) {
        groupsToProcess = [...new Set(nodesInGroups.map(node => node.parentNode))].filter(Boolean) as string[];
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
      if (node.parentNode && groupsToProcess.includes(node.parentNode)) {
        const parentGroup = allNodes.find(n => n.id === node.parentNode);
        if (parentGroup) {
          return {
            ...node, parentNode: undefined, extent: undefined,
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
    if (tool === activeTool && tool !== 'lasso') return; // Allow re-clicking lasso to toggle
    
    setSelectionActive(false);
    document.body.classList.remove('lasso-selection-mode');

    if (tool === 'lasso') {
      setSelectionActive(true);
      document.body.classList.add('lasso-selection-mode');
      reactFlowInstance.setNodes(nodes => nodes.map(node => ({ ...node, selected: false, selectable: true })));
    }
    
    let shouldSwitchBackToSelect = false;
    switch(tool) {
      case 'createGroup': createEmptyGroup(); shouldSwitchBackToSelect = true; break;
      case 'group': groupSelectedNodes(); shouldSwitchBackToSelect = true; break;
      case 'ungroup': ungroupNodes(); shouldSwitchBackToSelect = true; break;
    }
    setActiveTool(shouldSwitchBackToSelect ? 'select' : tool);
  }, [activeTool, createEmptyGroup, groupSelectedNodes, ungroupNodes, reactFlowInstance]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'S') { // Changed to uppercase 'S' for consistency
        event.preventDefault(); // Prevent default browser search on Shift+S
        handleToolClick('lasso');
      }
      if (event.key === 'Escape' && activeTool === 'lasso') {
        handleToolClick('select');
      }
      if (event.shiftKey) document.body.classList.add('multi-selection-mode');
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') document.body.classList.remove('multi-selection-mode');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.classList.remove('multi-selection-mode');
      document.body.classList.remove('lasso-selection-mode'); // Ensure cleanup
    };
  }, [activeTool, handleToolClick]);

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

  // 🔒 Critical code below – do not edit or delete
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      try {
        const dataStr = event.dataTransfer.getData('application/reactflow');
        if (!dataStr) return;
        const transferredData = JSON.parse(dataStr) as ResourceItem; // Ensure this is the correct type being transferred
        
        // Obtener la posición exacta donde se soltó el elemento en coordenadas del flujo
        const position = reactFlowInstance.screenToFlowPosition({ 
          x: event.clientX, 
          y: event.clientY 
        });
        
        console.log(`Drop detected at screen position: (${event.clientX}, ${event.clientY})`);
        console.log(`Converted to flow position: (${position.x}, ${position.y})`);
        
        // Forzar detección de grupo bajo el puntero en lugar de usar solo la posición calculada
        const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
        let groupNodeFromDOM: Node | undefined;
        let parentNodeId: string | undefined = undefined;
        let adjustedPosition = { ...position };

        // Buscar si hay un grupo bajo el cursor recorriendo el árbol DOM
        let currentElement = elementBelow;
        while (currentElement && !groupNodeFromDOM) {
          const nodeId = currentElement.getAttribute('data-id') || 
                         currentElement.getAttribute('data-nodeid') ||
                         currentElement.closest('[data-id]')?.getAttribute('data-id');
                         
          if (nodeId) {
            const node = reactFlowInstance.getNode(nodeId);
            if (node && node.type === 'group' && !node.data?.isMinimized) {
              groupNodeFromDOM = node;
              console.log(`Grupo encontrado vía DOM: ${nodeId}`);
              break;
            }
          }
          currentElement = currentElement.parentElement;
        }
        
        // Obtener todos los grupos (y no minimizados)
        const groups = reactFlowInstance.getNodes().filter(n => n.type === 'group' && !n.data?.isMinimized);
        
        // Ordenar grupos de menor a mayor tamaño para priorizar grupos anidados
        const sortedGroups = [...groups].sort((a, b) => {
          const areaA = (a.style?.width as number || 200) * (a.style?.height as number || 150);
          const areaB = (b.style?.width as number || 200) * (b.style?.height as number || 150);
          return areaA - areaB;
        });
        
        console.log(`Buscando grupo contenedor entre ${sortedGroups.length} grupos disponibles`);
        
        // Primero verificamos si encontramos un grupo vía DOM
        if (groupNodeFromDOM) {
          parentNodeId = groupNodeFromDOM.id;
          adjustedPosition = { 
            x: position.x - groupNodeFromDOM.position.x, 
            y: position.y - groupNodeFromDOM.position.y 
          };
          console.log(`Usando grupo encontrado vía DOM: ${parentNodeId}`);
        } else {
          // Si no, usamos el método tradicional de detección por posición
          for (const group of sortedGroups) {
            if (isInsideGroup(position, group)) {
              parentNodeId = group.id;
              // Ajustar la posición relativa al grupo padre
              adjustedPosition = { 
                x: position.x - group.position.x, 
                y: position.y - group.position.y 
              };
              console.log(`Nodo soltado dentro del grupo ${group.id} en posición relativa: (${adjustedPosition.x}, ${adjustedPosition.y})`);
              break;
            }
          }
        }
        
        // Crear el nuevo nodo
        const timestamp = Date.now();
        const newNodeId = `${transferredData.type}-${timestamp}`;
        const newNode: Node = {
          id: newNodeId, 
          type: transferredData.type, 
          position: adjustedPosition,
          data: { 
            label: transferredData.name, 
            description: transferredData.description, 
            provider: transferredData.provider,
            isCollapsed: true 
          },
          draggable: true, 
          selectable: true,
        };
        
        // Si se soltó dentro de un grupo, configurar el nodo como hijo
        if (parentNodeId) {
          newNode.parentNode = parentNodeId;
          newNode.extent = 'parent' as const;
          // Asegurarse que la posición esté dentro de los límites del grupo padre
          // evitando que quede muy cerca de los bordes
          adjustedPosition.x = Math.max(10, adjustedPosition.x);
          adjustedPosition.y = Math.max(30, adjustedPosition.y); // Más margen en Y por el encabezado
          newNode.position = adjustedPosition;

          console.log(`Nodo configurado como hijo del grupo ${parentNodeId}`);
          console.log(`Posición final del nodo en el grupo: (${newNode.position.x}, ${newNode.position.y})`);
        }
        
        // Añadir el nuevo nodo al diagrama
        onNodesChange?.([{ type: 'add', item: newNode }]);
        
        // Notificar que se ha añadido un nuevo nodo
        setTimeout(() => {
          const customEvent = new CustomEvent('nodesChanged', { 
            detail: { action: 'nodeAdded', nodeIds: [newNodeId] } 
          });
          document.dispatchEvent(customEvent);
        }, 100);

        setActiveDrag(null);
        setHighlightedGroupId(null);
        
        // Si se añadió a un grupo, optimizar la distribución de nodos en el grupo
        if (parentNodeId) {
          setTimeout(() => {
            optimizeNodesInGroup(parentNodeId!);
          }, 50);
        }
      } catch (error) {
        console.error("Error al procesar el drop:", error);
        setActiveDrag(null);
        setHighlightedGroupId(null);
      }
    },
    [reactFlowInstance, onNodesChange, optimizeNodesInGroup, isInsideGroup, setActiveDrag]
  );

  // Manejador personalizado para los cambios de nodos
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (!onNodesChange) return;
    // Solo cambios de posición con id definido
    const dragChanges = changes.filter(
      (change): change is NodeChange & { id: string; position?: { x: number; y: number }; dragging: true } =>
        change.type === 'position' && typeof change.id === 'string' && change.dragging === true
    );
    if (dragChanges.length > 0) {
      dragChanges.forEach((change) => {
        const node = reactFlowInstance.getNode(change.id);
        if (node && node.parentNode) {
          // Asegurarse que se mantenga dentro de los límites del grupo
          const parentNode = reactFlowInstance.getNode(node.parentNode);
          if (parentNode) {
            node.draggable = true;
            const parentWidth = (parentNode.style?.width as number) || 300;
            const parentHeight = (parentNode.style?.height as number) || 200;
            const minX = 5;
            const minY = 25;
            const maxX = parentWidth - 10 - ((node.style?.width as number) || 150);
            const maxY = parentHeight - 10 - ((node.style?.height as number) || 40);
            if (change.position) {
              change.position.x = Math.max(minX, Math.min(maxX, change.position.x));
              change.position.y = Math.max(minY, Math.min(maxY, change.position.y));
              setTimeout(() => {
                reactFlowInstance.setNodes(nodes =>
                  nodes.map(n =>
                    n.id === node.id ? { ...n, position: change.position || n.position } : n
                  )
                );
              }, 0);
            }
          }
        }
      });
    }
    onNodesChange(changes);
  }, [onNodesChange, reactFlowInstance]);
  
  return (
    <div style={{ height: '100%', width: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={propNodes?.map(node => 
          node.id === highlightedGroupId ? 
          { 
            ...node, 
            style: { 
              ...node.style, 
              boxShadow: '0 0 0 2px #4f8df6', 
              borderColor: '#4f8df6',
              backgroundColor: 'rgba(79, 141, 246, 0.05)'
            } 
          } : node
        )}
        edges={propEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={handlePaneClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        fitView
        attributionPosition="bottom-left"
        selectionMode={selectionActive ? SelectionMode.Full : SelectionMode.Partial}
        selectNodesOnDrag={!selectionActive}
        connectionMode={ConnectionMode.Loose}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']} 
        panOnDrag={true}
        elementsSelectable={true}
        nodesDraggable={true}
        nodesConnectable={true}
      >
        <Background color="#ccc" variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />
        {contextMenu.visible && (
          <div 
            style={{
              position: 'fixed', left: contextMenu.x, top: contextMenu.y,
              background: 'white', border: '1px solid #ddd', zIndex: 1000,
              padding: '0px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', gap: '0px',
              minWidth: '180px', overflow: 'hidden',
              transform: 'translate(8px, 8px)' // Offset slightly from cursor position for better visibility
            }}
            onClick={(e) => e.stopPropagation()} 
            onContextMenu={(e) => e.preventDefault()} 
          >
            <div style={{ padding: '8px 12px', backgroundColor: '#f7f7f7', borderBottom: '1px solid #eee' }}>
              {!contextMenu.isPane && contextMenu.nodeId && (
                <>
                  <p style={{margin: '0 0 2px 0', fontSize: '13px', fontWeight: 'bold'}}>{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.label || 'Node'}</p>
                  <p style={{margin: 0, fontSize: '11px', color: '#777'}}>ID: {contextMenu.nodeId}</p>
                  <p style={{margin: 0, fontSize: '11px', color: '#777'}}>Type: {contextMenu.nodeType}</p>
                </>
              )}
              {contextMenu.isPane && (
                <p style={{margin: 0, fontSize: '13px', fontWeight: 'bold'}}>Canvas Options</p>
              )}
            </div>

            <div>
              {!contextMenu.isPane && contextMenu.nodeId && (
                <>
                  {contextMenu.nodeType === 'group' && (
                    <>
                      <button 
                        onClick={() => {
                          // Implement expand/collapse children logic
                          const groupNode = reactFlowInstance.getNode(contextMenu.nodeId!);
                          if (groupNode) {
                            const isCurrentlyCollapsed = groupNode.data.isCollapsed;
                            reactFlowInstance.setNodes(nodes => nodes.map(n => 
                              n.id === contextMenu.nodeId 
                                ? { ...n, data: { ...n.data, isCollapsed: !isCurrentlyCollapsed } } 
                                : n
                            ));
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
                        {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.isCollapsed ? '↓ Expand Children' : '↑ Collapse Children'}
                      </button>
                      <button 
                        onClick={() => {
                          // Implement minimize/restore group logic
                          const groupNode = reactFlowInstance.getNode(contextMenu.nodeId!);
                          if (groupNode) {
                            const isCurrentlyMinimized = groupNode.data.isMinimized;
                            reactFlowInstance.setNodes(nodes => nodes.map(n => 
                              n.id === contextMenu.nodeId 
                                ? { ...n, data: { ...n.data, isMinimized: !isCurrentlyMinimized, isCollapsed: !isCurrentlyMinimized ? true : n.data.isCollapsed } } 
                                : n
                            ));
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
                        {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.isMinimized ? '□ Restore Group' : '― Minimize Group'}
                      </button>
                      <button 
                        onClick={() => {
                          const groupNode = reactFlowInstance.getNode(contextMenu.nodeId || '');
                          if (groupNode) {
                            startEditingGroupName(contextMenu.nodeId || '', groupNode.data.label || 'Group');
                            // Context menu will be closed by saveGroupName or if editing is cancelled
                          }
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
                        ✎ Edit Group Name
                      </button>
                      <button 
                        onClick={() => {
                          // Crear un menú de nodos según el proveedor del grupo
                          const groupNode = reactFlowInstance.getNode(contextMenu.nodeId || '');
                          if (groupNode) {
                            // Determinar el proveedor del grupo actual
                            const provider = groupNode.data?.provider || 'generic';
                            
                            // Posicionar el nuevo nodo dentro del grupo
                            const position = { x: 30, y: 60 };
                            
                            // Crear un diálogo con los recursos disponibles
                            setContextMenu(prev => ({...prev, visible: false}));
                            
                            // Mostrar un nuevo elemento de selección avanzada
                            const nodesSelectionDiv = document.createElement('div');
                            nodesSelectionDiv.id = 'node-selection-dialog';
                            nodesSelectionDiv.style.position = 'fixed';
                            nodesSelectionDiv.style.left = '50%';
                            nodesSelectionDiv.style.top = '50%';
                            nodesSelectionDiv.style.transform = 'translate(-50%, -50%)';
                            nodesSelectionDiv.style.background = 'white';
                            nodesSelectionDiv.style.padding = '20px';
                            nodesSelectionDiv.style.borderRadius = '8px';
                            nodesSelectionDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                            nodesSelectionDiv.style.zIndex = '2000';
                            nodesSelectionDiv.style.minWidth = '350px';
                            nodesSelectionDiv.style.maxWidth = '500px';
                            nodesSelectionDiv.style.maxHeight = '80vh';
                            nodesSelectionDiv.style.overflow = 'auto';
                            
                            // Título y contenido
                            nodesSelectionDiv.innerHTML = `
                              <h4 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">Seleccionar Tipo de Nodo</h4>
                              <div id="node-types-container" style="max-height: 400px; overflow-y: auto;"></div>
                              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
                                <button id="cancel-selection" style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; font-size: 14px; cursor: pointer;">
                                  Cancelar
                                </button>
                              </div>
                            `;
                            document.body.appendChild(nodesSelectionDiv);
                            
                            // Cerrar al hacer clic en Cancelar
                            document.getElementById('cancel-selection')?.addEventListener('click', () => {
                              document.body.removeChild(nodesSelectionDiv);
                            });
                            
                            // Agregamos las opciones de nodos según el proveedor
                            const nodeTypesContainer = document.getElementById('node-types-container');
                            if (nodeTypesContainer) {
                              // Filtrar categorías por proveedor
                              const matchingCategories = resourceCategories.filter(
                                category => category.provider === provider
                              );
                              
                              if (matchingCategories.length > 0) {
                                let html = '';
                                matchingCategories.forEach(category => {
                                  html += `<div style="margin-bottom: 10px;">
                                    <div style="font-weight: bold; padding: 5px 0; border-bottom: 1px solid #eee;">
                                      ${category.name}
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">`;
                                  
                                  category.items.forEach(item => {
                                    html += `<div class="node-type-option" data-type="${item.type}" data-name="${item.name}" 
                                    data-description="${item.description || ''}" data-provider="${item.provider}"
                                    style="padding: 8px 10px; border: 1px solid #eee; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                      <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #999;">•</div>
                                      <span>${item.name}</span>
                                    </div>`;
                                  });
                                  
                                  html += `</div></div>`;
                                });
                                
                                nodeTypesContainer.innerHTML = html;
                                
                                // Agregar eventos a las opciones
                                document.querySelectorAll('.node-type-option').forEach(element => {
                                  element.addEventListener('mouseover', (e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = '#f0f7ff';
                                  });
                                  
                                  element.addEventListener('mouseout', (e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                  });
                                  
                                  element.addEventListener('click', (e) => {
                                    const target = e.currentTarget as HTMLElement;
                                    const nodeType = target.dataset.type || '';
                                    const nodeName = target.dataset.name || '';
                                    const nodeDescription = target.dataset.description || '';
                                    const nodeProvider = target.dataset.provider as 'aws' | 'gcp' | 'azure' | 'generic';
                                    
                                    // Crear el nodo del tipo seleccionado
                                    const timestamp = Date.now();
                                    const newNodeId = `${nodeType}-${timestamp}`;
                                    
                                    const newNode: Node = {
                                      id: newNodeId,
                                      type: nodeType,
                                      position,
                                      data: { 
                                        label: nodeName,
                                        description: nodeDescription,
                                        provider: nodeProvider,
                                        isCollapsed: true
                                      },
                                      parentNode: contextMenu.nodeId || undefined,
                                      extent: 'parent' as const,
                                      draggable: true,
                                      selectable: true,
                                    };
                                    
                                    onNodesChange?.([{ type: 'add', item: newNode }]);
                                    setTimeout(() => optimizeNodesInGroup(contextMenu.nodeId || ''), 50);
                                    
                                    // Quitar el diálogo
                                    document.body.removeChild(nodesSelectionDiv);
                                  });
                                });
                              } else {
                                nodeTypesContainer.innerHTML = '<p>No hay tipos de nodos disponibles para este proveedor.</p>';
                              }
                            }
                          }
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
                        ➕ Agregar Nodo
                      </button>
                      <button 
                        onClick={() => {
                          if (contextMenu.nodeId) {
                            // 🔒 Critical code below – do not edit or delete
                          // Check for child nodes before deleting
                            const childNodes = reactFlowInstance.getNodes().filter(n => n.parentNode === contextMenu.nodeId);
                            
                            if (childNodes.length > 0) {
                              // Move child nodes out of the group before deleting it
                              const groupNode = reactFlowInstance.getNode(contextMenu.nodeId);
                              if (groupNode) {
                                // First update all child nodes to remove them from the group
                                reactFlowInstance.setNodes(nodes => 
                                  nodes.map(node => {
                                    if (node.parentNode === contextMenu.nodeId) {
                                      return {
                                        ...node,
                                        parentNode: undefined, 
                                        extent: undefined,
                                        // Adjust position to be in the global space
                                        position: {
                                          x: groupNode.position.x + node.position.x,
                                          y: groupNode.position.y + node.position.y
                                        }
                                      };
                                    }
                                    return node;
                                  })
                                );
                                
                                // Then after a small delay to ensure state updates, remove the group
                                setTimeout(() => {
                                  onNodesChange?.([{ type: 'remove', id: contextMenu.nodeId! }]);
                                }, 50);
                              }
                            } else {
                              // No children, just delete the group
                              onNodesChange?.([{ type: 'remove', id: contextMenu.nodeId }]);
                            }
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
                        🗑 Delete Group
                      </button>
                    </>
                  )}
                  {contextMenu.nodeType !== 'group' && (
                    <>
                      {/* Opción para quitar del grupo cuando está dentro de un grupo */}
                      {reactFlowInstance.getNode(contextMenu.nodeId || '')?.parentNode && (
                        <button 
                          onClick={() => {
                            const node = reactFlowInstance.getNode(contextMenu.nodeId || '');
                            const parentGroup = node?.parentNode ? reactFlowInstance.getNode(node.parentNode) : undefined;
                            
                            if (node && parentGroup) {
                              // Calcular la nueva posición fuera del grupo
                              const newPosition = {
                                x: parentGroup.position.x + node.position.x,
                                y: parentGroup.position.y + node.position.y
                              };
                              
                              // Actualizar el nodo para quitarlo del grupo
                              reactFlowInstance.setNodes(nodes => 
                                nodes.map(n => 
                                  n.id === contextMenu.nodeId 
                                    ? { ...n, parentNode: undefined, extent: undefined, position: newPosition } 
                                    : n
                                )
                              );
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
                          🔓 Quitar del grupo
                        </button>
                      )}
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
                    </>
                  )}
                </>
              )}
              {contextMenu.isPane && (
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
                // Puedes añadir más opciones para el panel aquí
              )}
            </div>
          </div>
        )}
        {editingGroup && (
          <div style={{
            position: 'fixed', 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%)', 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)', 
            zIndex: 2000,
            minWidth: '300px'
          }}>
            <h4 style={{margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold'}}>Edit Group Name</h4>
            <input 
              type="text" 
              defaultValue={editingGroup.label}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveGroupName((e.target as HTMLInputElement).value);
                }
                if (e.key === 'Escape') {
                  setEditingGroup(null);
                  setContextMenu(prev => ({...prev, visible: false})); 
                }
              }}
              autoFocus
              style={{
                padding: '10px', 
                margin: '8px 0 15px', 
                width: '100%', 
                boxSizing: 'border-box',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
              <button 
                onClick={() => {
                  setEditingGroup(null);
                  setContextMenu(prev => ({...prev, visible: false})); 
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#f5f5f5',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => saveGroupName((document.querySelector('input[type="text"]') as HTMLInputElement).value)} 
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#4f8df6',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
        {selectedEdge && <EdgeDeleteButton edge={selectedEdge} onEdgeDelete={onEdgeDelete} />}

        {selectionMenu.visible && (
          <div
            ref={selectionMenuRef}
            style={{
              position: 'fixed', left: `${selectionMenu.x}px`, top: `${selectionMenu.y}px`,
              transform: 'translateX(-50%)', background: 'rgba(255, 255, 255, 0.95)',
              padding: '8px 12px', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1001, display: 'flex', gap: '8px', alignItems: 'center'
            }}
          >
            <button onClick={groupSelectedNodes} title="Group selected nodes (Ctrl+G)">
              <Square3Stack3DIcon className="h-5 w-5" />
            </button>
            <button onClick={ungroupNodes} title="Ungroup selected nodes (Ctrl+Shift+G)">
              <Square2StackIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <Panel position="top-left">
          <div style={{ display: 'flex', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
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
              onClick={() => handleToolClick('createGroup')} 
              title="Create Empty Group" 
              style={{
                background: activeTool === 'createGroup' ? '#f0f7ff' : 'transparent',
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
              <FolderPlusIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => handleToolClick('group')} 
              title="Group Selected (Ctrl+G)" 
              style={{
                background: activeTool === 'group' ? '#f0f7ff' : 'transparent',
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
            <button 
              onClick={() => handleToolClick('ungroup')} 
              title="Ungroup Selected (Ctrl+Shift+G)" 
              style={{
                background: activeTool === 'ungroup' ? '#f0f7ff' : 'transparent',
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
              <FolderMinusIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={fitView} 
              title="Fit View" 
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
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={centerNodesInViewport} 
              title="Center Nodes" 
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
              <ArrowsRightLeftIcon className="h-5 w-5" />
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
            background: 'rgba(255,255,255,0.95)', 
            padding: '0', 
            borderRadius: '8px', 
            maxHeight: '90vh', // Aumentado al 90% de la ventana
            height: 'auto',
            overflow: 'hidden', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'absolute',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            zIndex: 10
          }}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 16px', 
              borderBottom: '1px solid #eee', 
              flexShrink: 0,
              minHeight: '48px',
              backgroundColor: 'white'
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
              backgroundColor: 'white',
              paddingBottom: '16px',
              maxHeight: 'calc(90vh - 48px)' // Ajustado al 90% menos el encabezado
            }}>
              {resourceCategories.map(category => (
                <div key={category.name} style={{borderBottom: '1px solid #f5f5f5'}}>
                  <h5 
                    onClick={() => setCollapsedCategories(prev => ({...prev, [category.name]: !prev[category.name]}))} 
                    style={{ 
                      cursor: 'pointer', 
                      margin: 0, 
                      padding: '10px 16px', // Reducido el padding vertical
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
                      padding: '2px 0', // Reducido el padding vertical
                      margin: 0, 
                      backgroundColor: '#fdfdfd',
                      maxHeight: 'none', // Eliminado el límite de altura para cada categoría
                      overflowY: 'visible' // Cambiado a visible para mostrar todos los items
                    }}>
                      {category.items.map(item => (
                        <li
                          key={category.name + '-' + item.type + '-' + item.name}
                          draggable
                          onDragStart={(e) => onDragStartSidebar(e, item)}
                          style={{ 
                            padding: '6px 16px', // Reducido el padding vertical
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
  );
};

const FlowEditor = (props: FlowEditorProps): JSX.Element => {
  // Pass nodes and edges from props to FlowEditorContent
  // onNodesChange and onEdgesChange should update these props in the parent component (e.g., DiagramPage)
  return (
    <ReactFlowProvider>
      <FlowEditorContent {...props} />
    </ReactFlowProvider>
  );
};

export default FlowEditor;  // 🔒 Critical styles below – do not edit or delete
// .lasso-selection-mode .react-flow__pane { cursor: crosshair !important; }
// .multi-selection-mode .react-flow__node { user-select: none; /* To prevent text selection while shift-clicking */ }
// Add styles for active toolbar button if needed:
// .toolbar button.active { background-color: #ddd; }

