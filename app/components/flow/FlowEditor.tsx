import { message } from 'antd';
import * as ReactFlowLibrary from 'reactflow';
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
  SquaresPlusIcon, 
  ArrowsUpDownIcon, 
  ArrowsPointingOutIcon, 
  
} from '@heroicons/react/24/outline';
import React from 'react';
import { Diagram } from '@/app/services/diagramService';
import nodeTypesFromFile from '../nodes/NodeTypes'; 
import { NodeExecutionState, NodeWithExecutionStatus } from '../../utils/customTypes';
import ExecutionLog from './ExecutionLog';

const { 
  Background, 
  Controls, 
  Panel, 
  ReactFlow, 
  ReactFlowProvider, 
  useOnSelectionChange,
  useReactFlow,
  MiniMap,
  useEdgesState,
  useNodesState,
  BackgroundVariant,
  SelectionMode
} = ReactFlowLibrary;

type Edge = ReactFlowLibrary.Edge;
type EdgeTypes = ReactFlowLibrary.EdgeTypes;
type Node = ReactFlowLibrary.Node;
type ReactFlowNodeTypes = ReactFlowLibrary.NodeTypes;
type OnConnect = ReactFlowLibrary.OnConnect;
type OnEdgesChange = ReactFlowLibrary.OnEdgesChange;
type OnNodesChange = ReactFlowLibrary.OnNodesChange;
type Viewport = ReactFlowLibrary.Viewport;


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
  icon?: JSX.Element; 
  provider: 'aws' | 'gcp' | 'azure' | 'generic' 
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
  nodeTypes?: ReactFlowNodeTypes; 
  edgeTypes?: EdgeTypes;
  resourceCategories?: ResourceCategory[];
  
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialViewport?: Viewport;
  onSave?: (diagramData: { nodes: Node[]; edges: Edge[]; viewport?: Viewport }) => void; 
  
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
      }, limit);
    }
  };

  return throttled;
}

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
      onClick={(e: React.MouseEvent) => { 
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
  
  const memoizedNodeTypes: ReactFlowNodeTypes = useMemo(() => { 
    const combinedNodeTypes = {
      ...nodeTypesFromFile,       
      ...externalNodeTypes,  
      note: nodeTypesFromFile.noteNode, 
      text: nodeTypesFromFile.textNode 
    };
    
    console.log('Available node types:', Object.keys(combinedNodeTypes));
    return combinedNodeTypes;
  }, [externalNodeTypes]);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodesHook] = useNodesState((propNodes || initialNodes) as Node[]); 
  const [edges, setEdgesHook] = useEdgesState((propEdges || initialEdges) as Edge[]); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>(''); 
  const [activeDrag, setActiveDrag] = useState<{ 
    item: ResourceItem, 
    offset: { x: number, y: number },
    elementSize?: { width: number, height: number }
  } | null>(null);
  const [, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [areaStartPos, setAreaStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
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
  const [isDragging, setIsDragging] = useState(false); 
  const [isToolbarDragging, setIsToolbarDragging] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 400, y: 20 }; 
    const savedPosition = localStorage.getItem('toolbarPosition');
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        if (typeof parsedPosition.x === 'number' && typeof parsedPosition.y === 'number') {
          return parsedPosition;
        }
      } catch (e) {
        console.error("Error parsing toolbarPosition from localStorage", e);
      }
    }
    return { x: window.innerWidth / 2 - 200, y: 20 };
  });
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [toolbarLayout, setToolbarLayout] = useState<'horizontal' | 'vertical'>(() => {
    if (typeof window === 'undefined') return 'horizontal'; 
    const savedLayout = localStorage.getItem('toolbarLayout') as 'horizontal' | 'vertical';
    return savedLayout || 'horizontal';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toolbarPosition', JSON.stringify(toolbarPosition));
    }
  }, [toolbarPosition]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('toolbarLayout', toolbarLayout);
    }
  }, [toolbarLayout]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarOpen');
      if (savedState === 'true' || savedState === 'false') {
        setSidebarOpen(JSON.parse(savedState));
      }
    }
  }, []); 
  
  useEffect(() => {
    const handleToolbarMouseMove = (event: MouseEvent) => {
      if (!isToolbarDragging) return;
      setToolbarPosition({
        x: event.clientX - dragStartOffset.x,
        y: event.clientY - dragStartOffset.y,
      });
    };

    const handleToolbarMouseUp = () => {
      setIsToolbarDragging(false);
    };

    if (isToolbarDragging) {
      window.addEventListener('mousemove', handleToolbarMouseMove);
      window.addEventListener('mouseup', handleToolbarMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleToolbarMouseMove);
      window.removeEventListener('mouseup', handleToolbarMouseUp);
    };
  }, [isToolbarDragging, dragStartOffset]);

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
    
    if (activeTool === 'lasso') {
      return;
    }

    if (activeTool === 'note' && reactFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      document.body.style.cursor = 'crosshair';
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

    if (activeTool === 'text' && reactFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      document.body.style.cursor = 'crosshair';
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
    document.body.style.cursor = 'default';
  }, [activeTool, reactFlowInstance, onNodesChange]);

  useEffect(() => {
    const handleAreaNodeUpdate = (event: Event): void => { 
      const customEvent = event as CustomEvent<{ nodeId: string; data: any }>;
      const { nodeId, data: newData } = customEvent.detail;
      reactFlowInstance.setNodes((nodes: Node[]) => 
        nodes.map((node: Node) => 
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

  useEffect(() => {
    const handleShowContextMenu = (event: Event): void => { 
      const customEvent = event as CustomEvent<{ x: number; y: number; items: Array<{ label: string; icon: React.ReactNode; onClick: () => void; }> }>;
      const { x, y, items } = customEvent.detail;
      setContextMenu({
        visible: true,
        x,
        y,
        nodeId: null, 
        nodeType: null,
        isPane: false,
        parentInfo: null,
        customItems: items 
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
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

  useEffect(() => {
    if (initialViewport && reactFlowInstance) {
      lastViewportRef.current = initialViewport;
      setTimeout(() => {
        reactFlowInstance.setViewport(initialViewport);
      }, 100);
    }
  }, [initialViewport, reactFlowInstance]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousNodesRef = useRef<string>(JSON.stringify(propNodes || initialNodes)); 
  const previousEdgesRef = useRef<string>(JSON.stringify(propEdges || initialEdges)); 
  
  useEffect(() => {
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
    const currentNodesJSON = JSON.stringify(currentNodes);
    const currentEdgesJSON = JSON.stringify(currentEdges);
    
    if (onSave && reactFlowInstance && !isDragging &&
        (currentNodesJSON !== previousNodesRef.current || 
         currentEdgesJSON !== previousEdgesRef.current)) {
      previousNodesRef.current = currentNodesJSON;
      previousEdgesRef.current = currentEdgesJSON;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const flow = reactFlowInstance.toObject();
        onSave?.(flow); 
      }, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [onSave, reactFlowInstance, propNodes, propEdges, isDragging]);

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
    reactFlowInstance.setNodes((nodes: Node[]) => 
      nodes.map((node: Node) => 
        node.id === editingGroup.id 
          ? { ...node, data: { ...node.data, label: newName } } 
          : node
      )
    );
    setContextMenu(prev => ({...prev, visible: false})); 
    setEditingGroup(null);
  }, [editingGroup, reactFlowInstance]);

  useOnSelectionChange({
    onChange: ({ nodes: selectedNodesFromCallback }: { nodes: Node[] }) => { 
      setSelectedNodes(selectedNodesFromCallback);
    },
  });

  useEffect(() => {
    const handleNodeFocus = (event: Event): void => { 
      const customEvent = event as CustomEvent<{ nodeId: string; isFocused: boolean }>; 
      const { nodeId, isFocused } = customEvent.detail;
      setFocusedNodeId(isFocused ? nodeId : null);
    };
    window.addEventListener('nodeGroupFocus', handleNodeFocus as EventListener); 
    return () => {
    };
  }, []);

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

  const optimizeNodesInGroup = useCallback((groupId: string) => {
    const group = reactFlowInstance.getNode(groupId);
    if (!group) return;
    if (group.data?.isMinimized) return;
    const childNodes = reactFlowInstance.getNodes().filter((n: Node) => n.parentId === groupId);
    if (childNodes.length === 0) return;
    const groupWidth = (group.style?.width as number) || 300;
    const headerHeight = 40;
    const verticalMargin = 20;
    const horizontalMargin = 20;
    const nodeSpacing = 8;
    const availableWidth = groupWidth - 2 * horizontalMargin;
    const sortedChildNodes = [...childNodes].sort((a, b) => a.id.localeCompare(b.id));      
    const updatedNodes = reactFlowInstance.getNodes().map((node: Node) => {
      if (node.parentId !== groupId) return node;
      const idx = sortedChildNodes.findIndex((n: Node) => n.id === node.id);
      const y = headerHeight + verticalMargin + idx * (40 + nodeSpacing);
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
        draggable: true, 
        selectable: true  
      };
    });
    console.log(`Optimizando ${childNodes.length} nodos en el grupo ${groupId}`);
    reactFlowInstance.setNodes(updatedNodes as Node[]); 
  }, [reactFlowInstance]);

  const groupSelectedNodes = useCallback(() => {
    console.log("Agrupando nodos seleccionados:", selectedNodes.length);
    if (selectedNodes.length < 2) {
      console.warn("Se necesitan al menos 2 nodos para agrupar");
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const providerCounts: Record<string, number> = {};
    selectedNodes.forEach((node: Node) => { 
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
        mostCommonProvider = provider as 'aws' | 'gcp' | 'azure' | 'generic'; 
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
    const updatedNodes = reactFlowInstance.getNodes().map((node: Node) => { 
      if (selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
        return {
          ...node, parentId: newGroupId, extent: 'parent' as const,
          position: { x: node.position.x - minX, y: node.position.y - minY },
          selected: false
        };
      }
      return node;
    });
    reactFlowInstance.setNodes([...updatedNodes, newGroup] as Node[]); 
    setTimeout(() => optimizeNodesInGroup(newGroupId), 50);
    return newGroupId;
  }, [selectedNodes, reactFlowInstance, optimizeNodesInGroup]);

  const ungroupNodes = useCallback(() => {
    const selectedGroupNodes = selectedNodes.filter((node: Node) => node.type === 'group'); 
    const allNodes = reactFlowInstance.getNodes(); 
    let groupsToProcess: string[] = [];
    if (selectedGroupNodes.length > 0) {
      groupsToProcess = selectedGroupNodes.map((group: Node) => group.id); 
    } else {
      const nodesInGroups = selectedNodes.filter((node: Node) => node.parentId); 
      if (nodesInGroups.length > 0) {
        groupsToProcess = [...new Set(nodesInGroups.map((node: Node) => node.parentId))].filter(Boolean) as string[]; 
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
    const finalNodes = allNodes.map((node: Node) => { 
      if (node.parentId && groupsToProcess.includes(node.parentId)) {
        const parentGroup = allNodes.find((n: Node) => n.id === node.parentId); 
        if (parentGroup) {
          return {
            ...node, parentId: undefined, extent: undefined,
            position: { x: parentGroup.position.x + node.position.x, y: parentGroup.position.y + node.position.y }
          };
        }
      }
      if (groupsToProcess.includes(node.id)) return null; 
      return node;
    }).filter(Boolean) as Node[];
    reactFlowInstance.setNodes(finalNodes);
  }, [selectedNodes, reactFlowInstance]);

  const handleToolClick = useCallback((tool: ToolType) => {
    if (tool === activeTool && tool !== 'lasso' && tool !== 'area') return;
    document.body.classList.remove('lasso-selection-mode');
    document.body.classList.remove('area-drawing-mode');
    if (tool === 'lasso') {
      document.body.classList.add('lasso-selection-mode');
      reactFlowInstance.setNodes((nodes: Node[]) => nodes.map((node: Node) => ({ 
        ...node, 
        selected: false, 
        selectable: true 
      })));
    } else if (tool === 'area') {
      document.body.classList.add('area-drawing-mode');
      reactFlowInstance.setNodes((nodes: Node[]) => nodes.map((node: Node) => ({ 
        ...node, 
        selected: false 
      })));
    }
    setActiveTool(tool);
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
    const existingStyle = document.getElementById('lasso-select-compatibility');
    if (existingStyle) {
      existingStyle.remove();
    }
    if (tool === 'lasso') {
      document.head.appendChild(lassoSelectStyle);
    }
  }, [activeTool, reactFlowInstance]);

  useEffect(() => {
  }, []);

  const isInsideGroup = (position: { x: number, y: number }, group: Node) => {
    if (group.data?.isMinimized) return false; 
    const groupX = group.position.x;
    const groupY = group.position.y;
    const groupWidth = (group.style?.width as number) || 200;
    const groupHeight = (group.style?.height as number) || 150;
    const margin = 5;
    const isInside = (
      position.x >= groupX - margin && position.x <= groupX + groupWidth + margin &&
      position.y >= groupY - margin && position.y <= groupY + groupHeight + margin
    );
    console.log(`Drop position check: (${position.x}, ${position.y}) inside group at (${groupX}, ${groupY}) with size ${groupWidth}x${groupHeight}: ${isInside}`);
    return isInside;
  };

  const onDragStartSidebar = (event: React.DragEvent, itemData: ResourceItem) => {
    if (activeTool === 'area' || activeTool === 'text') {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow', JSON.stringify(itemData));
    event.dataTransfer.effectAllowed = 'move';
    const dragElement = event.currentTarget as HTMLDivElement;
    const rect = dragElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    setActiveDrag({ 
      item: itemData, 
      offset: { x: offsetX, y: offsetY },
      elementSize: { width: rect.width, height: rect.height }
    });
    document.body.style.cursor = 'crosshair';
  };

  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (activeTool === 'area' || activeTool === 'text') {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    document.body.style.cursor = 'crosshair';
    if (reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({ 
        x: event.clientX, 
        y: event.clientY 
      });
      const groups = reactFlowInstance.getNodes().filter((n: Node) => n.type === 'group' && !n.data?.isMinimized); 
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
  
  const onDragEnd = useCallback(() => {
    setHighlightedGroupId(null);
    setActiveDrag(null);
    document.body.style.cursor = 'default';
  }, [setActiveDrag]);

  useEffect(() => {
    if (propNodes) {
      const currentNodesJSON = JSON.stringify(reactFlowInstance.getNodes());
      const propNodesJSON = JSON.stringify(propNodes);
      if (currentNodesJSON !== propNodesJSON) {
        const updatedNodes = propNodes.map((node: Node) => ({ 
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
        setNodesHook(updatedNodes as Node[]); 
      }
    }
  }, [propNodes, setNodesHook, diagramId, reactFlowInstance]); 

  useEffect(() => {
    if (propEdges) {
      const currentEdgesJSON = JSON.stringify(reactFlowInstance.getEdges());
      const propEdgesJSON = JSON.stringify(propEdges);
      if (currentEdgesJSON !== propEdgesJSON) {
        setEdgesHook(propEdges as Edge[]); 
      }
    }
  }, [propEdges, setEdgesHook, diagramId, reactFlowInstance]); 

  const findGroupAtPosition = useCallback((position: { x: number; y: number }) => {
    const currentNodes = reactFlowInstance.getNodes();
    return currentNodes.find((node: Node) => 
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
    if (activeTool === 'area') {
      return;
    }
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !reactFlowInstance) return;
    try {
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;
      const transferredData = JSON.parse(dataStr) as ResourceItem;
      const dragOffset = activeDrag?.offset || { x: 0, y: 0 };
      let nodeWidth = 200;
      let nodeHeight = 100;
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
      const adjustedX = event.clientX - dragOffset.x;
      const adjustedY = event.clientY - dragOffset.y;
      const position = reactFlowInstance.screenToFlowPosition({
        x: adjustedX,
        y: adjustedY
      });
      let newNode: Node;
      if (transferredData.type === 'note') {
        newNode = {
          id: `note-${Date.now()}`,
          type: 'noteNode',
          position: { ...position },
          data: {
            text: 'Click to edit',
            backgroundColor: '#FEF08A', 
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
      const groupNode = findGroupAtPosition(position);
      if (groupNode) {
        const parentGroup = reactFlowInstance.getNode(groupNode.id);
        if (parentGroup) {
          const groupPosition = { ...parentGroup.position };
          const relativePosition = {
            x: position.x - groupPosition.x,
            y: position.y - groupPosition.y
          };
          const groupWidth = parentGroup.width || 300;
          const groupHeight = parentGroup.height || 200;
          const margin = 20;
          const maxX = groupWidth - nodeWidth - margin;
          const maxY = groupHeight - nodeHeight - margin;
          const minX = margin;
          const minY = margin + 40;
          const clampedPosition = {
            x: Math.max(minX, Math.min(maxX, relativePosition.x)),
            y: Math.max(minY, Math.min(maxY, relativePosition.y))
          };
          newNode.position = { ...clampedPosition };
          newNode.parentId = groupNode.id;
          newNode.extent = 'parent' as const;
        }
      }
      const updatedNodes = [...reactFlowInstance.getNodes(), newNode];
      setNodesHook(updatedNodes as Node[]); 
      if (onNodesChange) {
        onNodesChange([{ type: 'add', item: newNode }]);
      }
      if (newNode.parentId) {
        setTimeout(() => {
          optimizeNodesInGroup(newNode.parentId!);
        }, 0);
      }
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
  }, [reactFlowInstance, findGroupAtPosition, onNodesChange, optimizeNodesInGroup, setNodesHook, diagramId, onSave, activeDrag, activeTool]); 

  const saveCurrentDiagramState = useCallback(() => {
    if (!reactFlowInstance || !onSave) return;
    const currentNodes = reactFlowInstance.getNodes();
    const currentEdges = reactFlowInstance.getEdges();
    const currentViewport = reactFlowInstance.getViewport();
    console.log('Guardando viewport explícitamente:', currentViewport);
    lastViewportRef.current = currentViewport;
    const flow = reactFlowInstance.toObject();
    onSave({
      ...flow,
      viewport: currentViewport
    });
    previousNodesRef.current = JSON.stringify(currentNodes);
    previousEdgesRef.current = JSON.stringify(currentEdges);
    console.log('Diagrama guardado con viewport:', currentViewport);
  }, [reactFlowInstance, onSave]);
  
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      switch (event.key.toLowerCase()) {
        case 'v': 
          handleToolClick('select');
          break;
        case 'n': 
          handleToolClick('note');
          break;
        case 't': 
          handleToolClick('text');
          break;
        case 'a': 
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            handleToolClick('area');
          }
          break;
        case 'g': 
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            createEmptyGroup();
          }
          break;
        case 's': 
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
          onClick={(e: React.MouseEvent) => e.stopPropagation()} 
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
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
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
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { 
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

  const moveNodesToBack = useCallback((nodeIds: string[]) => {
    const currentNodes = reactFlowInstance.getNodes(); 
    const selectedIds = new Set(nodeIds);
    const minZIndex = Math.min(...currentNodes.map((n: Node) => n.zIndex || 0)); 
    const updatedNodes = currentNodes.map((node: Node) => { 
      if (selectedIds.has(node.id)) {
        return { ...node, zIndex: minZIndex - 1 };
      }
      return node;
    });
    reactFlowInstance.setNodes(updatedNodes as Node[]); 
  }, [reactFlowInstance]);

  const simulateNodeExecution = async (node: NodeWithExecutionStatus, state: NodeExecutionState) => {
    const messageText = getExecutionMessage(node, state); 
    setExecutionLogs(prev => [...prev, messageText]);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const getExecutionMessage = (node: NodeWithExecutionStatus, state: NodeExecutionState): string => {
    const nodeAsNode = node as Node; 
    const nodeName = nodeAsNode.data?.label || 'Unnamed Resource';
    const getResourceDetails = () => {
      const details = [];
      if (nodeAsNode.data?.provider) details.push(`Provider: ${nodeAsNode.data.provider}`);
      if (nodeAsNode.data?.resourceType) details.push(`Type: ${nodeAsNode.data.resourceType}`);
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

  const handlePreview = useCallback(() => {
    if (!currentDiagram) return;
    try {
      setIsExecutionLogVisible(true);
      setExecutionLogs([]);
      const executionNodes = currentDiagram.nodes.filter((node) => node.type !== 'group');
      const simulateExecution = async () => {
        for (const node of executionNodes) {
          let state: NodeExecutionState;
          const nodeData = (node as Node).data; 
          if (nodeData?.status === 'creating' || nodeData?.status === 'new' || (!nodeData?.status && nodeData?.isNew)) {
            state = 'creating';
          } else if (nodeData?.status === 'updating' || nodeData?.status === 'modified' || nodeData?.hasChanges) {
            state = 'updating';
          } else if (nodeData?.status === 'deleting' || nodeData?.status === 'toDelete' || nodeData?.markedForDeletion) {
            state = 'deleting';
          } else {
            state = 'creating'; 
          }
          const nodeName = nodeData?.label || 'Unnamed Resource';
          const processingLog = `Procesando ${state} para ${nodeName}...`;
          const successLog = `${state} completado para ${nodeName}`;
          const costLog = `Costo estimado para ${nodeName}: $${nodeData?.estimated_cost?.monthly || 0} USD/mes`;
          setExecutionLogs(prev => [...prev, processingLog]);
          await new Promise(resolve => setTimeout(resolve, 1000));
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

  const handleRun = useCallback(() => {
    if (!currentDiagram) return;
    try {
      setIsExecutionLogVisible(true);
      setExecutionLogs([]);
      const executionNodes = currentDiagram.nodes.filter((node) => node.type !== 'group');
      const simulateExecution = async () => {
        for (const node of executionNodes) {
          let state: NodeExecutionState;
          const nodeData = (node as Node).data; 
          if (nodeData?.status === 'creating' || nodeData?.status === 'new' || (!nodeData?.status && nodeData?.isNew)) {
            state = 'creating';
          } else if (nodeData?.status === 'updating' || nodeData?.status === 'modified' || nodeData?.hasChanges) {
            state = 'updating';
          } else if (nodeData?.status === 'deleting' || nodeData?.status === 'toDelete' || nodeData?.markedForDeletion) {
            state = 'deleting';
          } else {
            state = 'creating'; 
          }
          const nodeName = nodeData?.label || 'Unnamed Resource';
          const processingLog = `Procesando ${state} para ${nodeName}...`;
          const successLog = `${state} completado para ${nodeName}`;
          const costLog = `Costo estimado para ${nodeName}: $${nodeData?.estimated_cost?.monthly || 0} USD/mes`;
          setExecutionLogs(prev => [...prev, processingLog]);
          await new Promise(resolve => setTimeout(resolve, 1000));
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
    const handler = (event: Event) => { 
      const customEvent = event as CustomEvent<SingleNodePreview>;
      setSingleNodePreview(customEvent.detail);
      setShowSingleNodePreview(true);
    };
    window.addEventListener('showSingleNodePreview', handler); 
    return () => window.removeEventListener('showSingleNodePreview', handler); 
  }, []);

  const handleApplyChanges = async () => {
    if (!singleNodePreview) return;
    try {
      setLoading(true);
      setShowLogs(true); 
      setExecutionLogs([]); 
      const processingLog = `Procesando ${singleNodePreview.action} del recurso ${singleNodePreview.resource.name}`;
      setExecutionLogs(prev => [...prev, processingLog]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const successLog = `Recurso ${singleNodePreview.resource.name} ${singleNodePreview.action === 'create' ? 'creado' : 
              singleNodePreview.action === 'update' ? 'actualizado' : 'eliminado'} exitosamente`;
      setExecutionLogs(prev => [...prev, successLog]);
      if (singleNodePreview.estimated_cost) {
        const costLog = `Costo estimado: ${singleNodePreview.estimated_cost.currency} ${singleNodePreview.estimated_cost.monthly.toFixed(2)}`;
        setExecutionLogs(prev => [...prev, costLog]);
      }
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
          onPaneContextMenu={handlePaneContextMenu}
          onNodeDragStart={(_event, _node) => setIsDragging(true)}
          onNodeDragStop={(_event, _node) => {
            setIsDragging(false);
            if (onSave && reactFlowInstance) {
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              saveTimeoutRef.current = setTimeout(() => {
                const flow = reactFlowInstance.toObject();
                 onSave?.(flow);
                 previousNodesRef.current = JSON.stringify(reactFlowInstance.getNodes());
                 previousEdgesRef.current = JSON.stringify(reactFlowInstance.getEdges());
              }, 100); 
            }
          }}
          onMouseDown={(event: React.MouseEvent) => { 
            if (activeTool === 'area' && reactFlowInstance) {
              const target = event.target as HTMLElement;
              const nodeElement = target.closest('.react-flow__node');
              const edgeElement = target.closest('.react-flow__edge');
              const handleElement = target.closest('.react-flow__handle');
              const controlElement = target.closest('.react-flow__controls');
              if (nodeElement || edgeElement || handleElement || controlElement) {
                return;
              }
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
              document.body.classList.add('area-drawing-mode');
            }
          }}
          onMouseMove={(event: React.MouseEvent) => { 
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
          snapToGrid={false}
          nodeDragThreshold={5}
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()} 
              onContextMenu={(e: React.MouseEvent) => e.preventDefault()} 
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
                      const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
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
                    {(() => {
                      const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                      return currentSelectedNodes.length > 1 && currentSelectedNodes.some((n: Node) => n.id === contextMenu.nodeId); 
                    })() ? (
                      <>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          📦 Group Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            console.log("Eliminando nodos seleccionados:", currentSelectedNodes.length, currentSelectedNodes.map((n: Node) => n.id)); 
                            if (currentSelectedNodes.length > 0) {
                              const nodeIds = currentSelectedNodes.map((node: Node) => node.id); 
                              onNodesChange?.(nodeIds.map((id: string) => ({ type: 'remove', id }))); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#fff0f0')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          🗑 Delete Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            if (currentSelectedNodes.length > 0) {
                              const allNodes = reactFlowInstance.getNodes(); 
                              const selectedIds = new Set(currentSelectedNodes.map((node: Node) => node.id)); 
                              const updatedNodes = allNodes.map((node: Node) => { 
                                if (selectedIds.has(node.id)) {
                                  return { ...node, zIndex: (node.zIndex || 0) - 1 };
                                }
                                return node;
                              });
                              reactFlowInstance.setNodes(updatedNodes as Node[]); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          ⬇️ Move Selected to Back
                        </button>
                      </>
                    ) : reactFlowInstance.getNode(contextMenu.nodeId!)?.type === 'group' ? ( 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          ✏️ Edit Group Name
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            if (currentSelectedNodes.length > 0) {
                              moveNodesToBack(currentSelectedNodes.map((node: Node) => node.id)); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          ▶️ Run Node
                        </button>
                        <button 
                          onClick={() => {
                            const node = reactFlowInstance.getNode(contextMenu.nodeId || '');
                            if (node) {
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          ⚙️ Configuración
                        </button>
                      </>
                    )}
                    
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
                        onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#fff0f0')} 
                        onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                      >
                        🗑 Delete Node
                      </button>
                    )}
                  </>
                )}
                {contextMenu.isPane && (
                  <>
                    {(() => {
                      const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                      return currentSelectedNodes.length > 0;
                    })() ? (
                      <>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          📦 Group Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            if (currentSelectedNodes.length > 0) {
                              const nodeIds = currentSelectedNodes.map((node: Node) => node.id); 
                              onNodesChange?.(nodeIds.map((id: string) => ({ type: 'remove', id }))); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#fff0f0')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          🗑 Delete Selected Nodes ({(() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            return currentSelectedNodes.length;
                          })()})
                        </button>
                        <button 
                          onClick={() => {
                            const currentSelectedNodes = reactFlowInstance.getNodes().filter((node: Node) => node.selected); 
                            if (currentSelectedNodes.length > 0) {
                              const allNodes = reactFlowInstance.getNodes(); 
                              const selectedIds = new Set(currentSelectedNodes.map((node: Node) => node.id)); 
                              const updatedNodes = allNodes.map((node: Node) => { 
                                if (selectedIds.has(node.id)) {
                                  return { ...node, zIndex: (node.zIndex || 0) - 1 };
                                }
                                return node;
                              });
                              reactFlowInstance.setNodes(updatedNodes as Node[]); 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
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
                          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
                        >
                          📚 Show Resources Panel
                        </button>
                      </>
                    )}
                  </>
                )}
                
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
                        onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} 
                        onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'white')} 
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
          
          <div
            style={{
              position: 'absolute',
              top: `${toolbarPosition.y}px`,
              left: `${toolbarPosition.x}px`,
              zIndex: 10,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Panel position="top-left" style={{ all: 'unset', display: 'flex' }}> 
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: toolbarLayout === 'horizontal' ? 'row' : 'column',
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '5px', 
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button 
                  onMouseDown={(e) => {
                    e.stopPropagation(); 
                    setIsToolbarDragging(true);
                    setDragStartOffset({
                      x: e.clientX - toolbarPosition.x,
                      y: e.clientY - toolbarPosition.y,
                    });
                  }}
                  title="Drag Toolbar"
                  style={{
                    cursor: isToolbarDragging ? 'grabbing' : 'grab',
                    padding: '4px', 
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    order: toolbarLayout === 'horizontal' ? -2 : 0, 
                  }}
                >
                  <ArrowsPointingOutIcon className="h-5 w-5 text-gray-500" />
                </button>
                <button
                  onClick={() => {
                    const newLayout = toolbarLayout === 'horizontal' ? 'vertical' : 'horizontal';
                    setToolbarLayout(newLayout);
                    if (newLayout === 'vertical') {
                      setToolbarPosition({ x: 20, y: 70 });
                    } else {
                      setToolbarPosition({ x: (typeof window !== 'undefined' ? window.innerWidth / 2 - 200 : 400), y: 20 });
                    }
                  }}
                  title={toolbarLayout === 'horizontal' ? "Switch to Vertical Toolbar" : "Switch to Horizontal Toolbar"}
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
                    transition: 'background 0.2s',
                    order: toolbarLayout === 'horizontal' ? -1 : 0, 
                  }}
                >
                  <ArrowsUpDownIcon className="h-5 w-5" />
                </button>
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
                onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { 
                  e.preventDefault();
                }}
                draggable
                onDragStart={(e: React.DragEvent<HTMLButtonElement>) => { 
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
                onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { 
                  e.preventDefault();
                }}
                draggable
                onDragStart={(e: React.DragEvent<HTMLButtonElement>) => { 
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
        </div> 

          {!sidebarOpen && (
            <Panel position="top-right">
              <button 
                style={{ 
                  padding: '10px 14px', 
                  background: 'rgba(255,255,255,0.95)', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px', 
                  border: '1px solid rgba(0,0,0,0.05)', 
                  transition: 'background-color 0.2s, box-shadow 0.2s', 
                }}
                onClick={() => setSidebarOpen(true)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(245,245,245,0.95)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                title="Show Resources Panel"
              >
                <SquaresPlusIcon className="h-5 w-5 text-gray-700" /> 
                <span style={{fontSize: '14px', fontWeight: 500, color: '#333'}}>Resources</span> 
              </button>
            </Panel>
          )}

          {sidebarOpen && (
            <Panel position="top-right" style={{ 
              width: '360px', 
              background: 'rgba(255,255,255,0.9)', 
              padding: '0', 
              borderRadius: '12px 0 0 12px', 
              height: 'calc(100vh - 7.5rem)', // Ajustado para header de layout (3.5rem) + header de dashboard (4rem)
              overflow: 'hidden', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'fixed',
              top: '7.5rem', // Ajustado para header de layout (3.5rem) + header de dashboard (4rem)
              right: '0px', 
              // bottom: '0px', // Eliminado para que height tenga efecto
              zIndex: 9999, // Asegurar que esté sobre otros elementos fijos si los hubiera
              transform: 'none', 
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out, width 0.3s ease-out',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(230, 230, 230, 0.9)', 
                flexShrink: 0,
                minHeight: '56px', 
                backgroundColor: 'rgba(250, 250, 250, 0.95)', 
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}>
                  <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', color: '#333'}}>Resources</h4>
                  <button 
                    onClick={() => setSidebarOpen(false)} 
                    style={{
                      border: 'none', 
                      background: 'transparent', 
                      cursor: 'pointer',
                      width: '28px', 
                      height: '28px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                      color: '#555'
                    }}
                    title="Hide Resources Panel"
                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#e9e9e9')} 
                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'transparent')} 
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(230, 230, 230, 0.9)', backgroundColor: 'rgba(250, 250, 250, 0.95)' }}>
                <input
                  type="text"
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} 
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)'
                  }}
                />
              </div>
              <div style={{
                overflowY: 'auto', 
                overflowX: 'hidden',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                paddingBottom: '16px',
                // height ya no es necesario aquí, flexGrow se encargará
                scrollbarWidth: 'thin',
                scrollbarColor: '#ccc #f1f1f1',
              }}>
                {resourceCategories
                  .map(category => ({
                    ...category,
                    items: category.items.filter(item =>
                      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      item.description.toLowerCase().includes(searchTerm.toLowerCase())
                    ),
                  }))
                  .filter(category => category.items.length > 0) 
                  .map(category => (
                  <div key={category.name} style={{borderBottom: '1px solid #f0f0f0'}}>
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
                      onMouseOver={(e: React.MouseEvent<HTMLHeadingElement>) => { 
                        if (!collapsedCategories[category.name]) return;
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseOut={(e: React.MouseEvent<HTMLHeadingElement>) => { 
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
                            onDragStart={(e: React.DragEvent<HTMLLIElement>) => onDragStartSidebar(e, item)} 
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
                            onMouseOver={(e: React.MouseEvent<HTMLLIElement>) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }} 
                            onMouseOut={(e: React.MouseEvent<HTMLLIElement>) => { e.currentTarget.style.backgroundColor = 'transparent' }} 
                          >
                            <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                              {item.icon ? React.cloneElement(item.icon, { className: 'w-5 h-5 text-gray-500' }) : <ServerIcon className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: '500' }}>{item.name}</span>
                              <p style={{ fontSize: '11px', color: '#777', margin: '2px 0 0 0', lineHeight: '1.3' }}>{item.description}</p>
                            </div>
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
      {showSingleNodePreview && singleNodePreview && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden border border-gray-100" style={{ maxHeight: '80vh' }}>
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

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              <div className="space-y-6">
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

      <div className={`fixed inset-y-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${showLogs ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '480px' }}>
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
  return (
    <ReactFlowProvider>
      <div className="relative w-full h-full">
        <FlowEditorContent {...props} />
      </div>
    </ReactFlowProvider>
  );
};

export default FlowEditor;
