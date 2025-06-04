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
  // ArrowsPointingOutIcon, 
  ShareIcon, 
  BoltIcon as HeroBoltIcon, 
  PencilSquareIcon as HeroPencilSquareIcon,
  LinkIcon as HeroLinkIcon,
  PhoneArrowUpRightIcon as HeroPhoneArrowUpRightIcon,
  MinusCircleIcon, 
  TrashIcon, 
} from '@heroicons/react/24/outline';
import React from 'react';
import { Tooltip } from 'antd';
import { useSelectedEdgeType, SelectedEdgeTypeProvider } from '@/app/contexts/SelectedEdgeTypeContext'; 
import { LogicalEdgeType, edgeTypeConfigs, CustomEdgeData, getEdgeConfig } from '@/app/config/edgeConfig';
import { Diagram } from '@/app/services/diagramService';
import nodeTypesFromFile from '../nodes/NodeTypes'; 
import { NodeExecutionState, NodeWithExecutionStatus } from '../../utils/customTypes';
import ExecutionLog from './ExecutionLog';
import GroupFocusView from './GroupFocusView'; 
import { debounce } from 'lodash';

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
  SelectionMode,
  applyNodeChanges, 
  // applyEdgeChanges,
  addEdge, 
} = ReactFlowLibrary;

type Edge = ReactFlowLibrary.Edge<CustomEdgeData>;
type EdgeTypes = ReactFlowLibrary.EdgeTypes;
type Node = ReactFlowLibrary.Node;
type ReactFlowNodeTypes = ReactFlowLibrary.NodeTypes;
type OnConnect = ReactFlowLibrary.OnConnect;
// type OnEdgesChange = ReactFlowLibrary.OnEdgesChange;
// type OnNodesChange = ReactFlowLibrary.OnNodesChange;
type Viewport = ReactFlowLibrary.Viewport;
type Connection = ReactFlowLibrary.Connection;


interface SingleNodePreview {
  action: 'create' | 'update' | 'delete';
  resource: {
    name: string;
    type: string;
    provider: string;
    changes: {
      properties: Record<string, {
        before?: unknown;
        after?: unknown;
        action: 'create' | 'update' | 'delete';
      }>;
    };
  };
  dependencies: Array<{
    name: string;
    type: string;
    action: 'create' | 'update' | 'delete';
    properties: Record<string, {
      before?: unknown;
      after?: unknown;
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
  [key: string]: unknown;
}

interface ResourceCategory {
  name: string;
  items: ResourceItem[];
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
}

export interface ResourceItem { 
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

export type { ResourceCategory }; 

type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea' | 'note' | 'text' | 'area';

interface FlowEditorProps {
  onConnectProp?: OnConnect; 
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
    point.x = midPoint.x; point.y = midPoint.y;
    const ctm = svgElement.getScreenCTM();
    if (!ctm) return;
    const screenPoint = point.matrixTransform(ctm);
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const finalX = screenPoint.x + scrollX; const finalY = screenPoint.y + scrollY;
    if (Math.abs(finalX - positionRef.current.x) > 0.5 || Math.abs(finalY - positionRef.current.y) > 0.5) {
      positionRef.current = { x: finalX, y: finalY };
      setPosition({ x: finalX, y: finalY });
    }
  }, [edge.id]);

  useEffect(() => {
    let animationFrameId: number; let isUpdating = false;
    const handleTransform = () => {
      if (!isUpdating) {
        isUpdating = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => { updatePosition(); isUpdating = false; });
      }
    };
    updatePosition();
    const observer = new MutationObserver(handleTransform);
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"]`);
    if (edgeElement) observer.observe(edgeElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['d', 'transform'] });
    const throttledTransform = throttle(handleTransform, 16);
    window.addEventListener('resize', throttledTransform);
    document.addEventListener('reactflow.transform', throttledTransform as EventListener);
    document.addEventListener('reactflow.nodedrag', throttledTransform as EventListener);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', throttledTransform);
      document.removeEventListener('reactflow.transform', throttledTransform as EventListener);
      document.removeEventListener('reactflow.nodedrag', throttledTransform as EventListener);
    };
  }, [edge.id, updatePosition]);

  return ( <div className="edge-delete-button" style={{ position: 'fixed', transform: 'translate(-50%, -50%)', left: `${position.x}px`, top: `${position.y}px`, width: '16px', height: '16px', backgroundColor: 'white', border: '1.5px solid #ff4d4d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', lineHeight: 1, color: '#ff4d4d', zIndex: 1000, pointerEvents: 'all', userSelect: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdgeDelete(edge); }}>×</div> );
};

const FlowEditorContent = ({ 
  initialNodes = [], 
  initialEdges = [],
  initialViewport,
  onConnectProp, 
  onSave,
  nodeTypes: externalNodeTypes = {}, 
  edgeTypes,
  resourceCategories = [],
  initialDiagram,
}: FlowEditorProps): JSX.Element => {
  
  const memoizedNodeTypes: ReactFlowNodeTypes = useMemo(() => ({ ...nodeTypesFromFile, ...externalNodeTypes, note: nodeTypesFromFile.noteNode, text: nodeTypesFromFile.textNode }), [externalNodeTypes]);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Inicializar los nodos con la lógica correcta para grupos
  const processedInitialNodes = useMemo(() => {
    return initialNodes.map(node => {
      if (node.parentId) {
        const parentNode = initialNodes.find(n => n.id === node.parentId);
        // const isHidden = !parentNode?.data?.isExpandedView; // Original logic
        // Corrected logic: if parent is minimized, child is hidden. Otherwise, child is not hidden by this rule.
        const isHidden = parentNode?.data?.isMinimized === true; 
        return {
          ...node,
          hidden: isHidden,
          extent: 'parent' as const
        };
      }
      // Ensure group nodes have isExpandedView set, defaulting to false
      if (node.type === 'group') {
        return {
          ...node,
          data: {
            ...node.data,
            isExpandedView: node.data?.isExpandedView || false,
            // viewport: node.data.viewport // Viewport for group focus view, handle with care
          }
        };
      }
      return node;
    });
  }, [initialNodes]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(processedInitialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges as ReactFlowLibrary.Edge[]);

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>(''); 
  const [activeDrag, setActiveDrag] = useState<{ item: ResourceItem, offset: { x: number, y: number }, elementSize?: { width: number, height: number } } | null>(null);
  const [, setFocusedNodeId] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  const [areaStartPos, setAreaStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentArea, setCurrentArea] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const lastViewportRef = useRef<Viewport | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ visible: false, x: 0, y: 0, nodeId: null, nodeType: null, isPane: false, parentInfo: null, customItems: undefined });
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isExecutionLogVisible, setIsExecutionLogVisible] = useState(false);
  const [loadingState, setLoadingState] = useState(false);
  const currentDiagram = initialDiagram;
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [singleNodePreview, setSingleNodePreview] = useState<SingleNodePreview | null>(null);
  const [showSingleNodePreview, setShowSingleNodePreview] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [isDragging, setIsDragging] = useState(false); 
  const [isToolbarDragging, setIsToolbarDragging] = useState(false); 
  const previousNodesRef = useRef<string | null>(null);
  const previousEdgesRef = useRef<string | null>(null);
  const previousInitialNodesJSONRef = useRef<string | null>(null); 
  const previousInitialEdgesJSONRef = useRef<string | null>(null); 
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const GROUP_HEADER_HEIGHT = 40; 
  const CHILD_NODE_PADDING_X = 20;
  const CHILD_NODE_PADDING_Y = 15;
  const CHILD_NODE_HEIGHT = 50; 
  const MIN_EXPANDED_GROUP_WIDTH = 250;
  const MIN_EXPANDED_GROUP_HEIGHT = 150;

  const handleGroupSave = (updatedNodesInGroup: Node[], newEdgesInGroup: Edge[], groupViewport?: Viewport) => {
    if (!expandedGroupId) return;

    setNodes((currentNodes) => {
      const groupNodeFromState = currentNodes.find(n => n.id === expandedGroupId);
      let updatedGroupNodeData = groupNodeFromState?.data ? { ...groupNodeFromState.data } : {};
      
      updatedGroupNodeData.isExpandedView = false; 
      updatedGroupNodeData.isMinimized = groupNodeFromState?.data?.isMinimized || false; // Preserve minimized state
      
      // Store the viewport from GroupFocusView into the group node's data
      if (groupViewport) {
        updatedGroupNodeData.viewport = groupViewport;
      }
      
      // Remove anidada nodes/edges from group data, as they are managed globally
      delete updatedGroupNodeData.nodes;
      delete updatedGroupNodeData.edges;

      const updatedGroupNode = groupNodeFromState ? {
        ...groupNodeFromState,
        data: updatedGroupNodeData,
      } : undefined;
      
      const finalUpdatedNodesFromGroupView = updatedNodesInGroup.map(un => ({
        ...un,
        // parentId and extent are set by GroupFocusView's handleSaveChanges
      }));
      
      const updatedNodesMap = new Map(finalUpdatedNodesFromGroupView.map(n => [n.id, n]));

      const newNodesList: Node[] = [];
      for (const node of currentNodes) {
        if (node.id === expandedGroupId) continue; 
        if (node.parentId === expandedGroupId && !updatedNodesMap.has(node.id)) {
          continue;
        }
        if (updatedNodesMap.has(node.id)) {
          continue;
        }
        newNodesList.push(node);
      }

      if (updatedGroupNode) {
        newNodesList.push(updatedGroupNode);
      }
      newNodesList.push(...finalUpdatedNodesFromGroupView);

      return newNodesList;
    });

    setEdges((currentEdges) => {
      // Remove old edges that were internal to the group
      const childNodeIdsInGroup = new Set(updatedNodesInGroup.map(n => n.id));
      const edgesOutsideOrUnrelated = currentEdges.filter(edge => 
        !(childNodeIdsInGroup.has(edge.source) && childNodeIdsInGroup.has(edge.target)) && // Not an edge fully within the group
        !(edge.source === expandedGroupId || edge.target === expandedGroupId) // Not an edge connected to the group itself (if any)
      );
      // Add new edges from GroupFocusView
      return [...edgesOutsideOrUnrelated, ...newEdgesInGroup];
    });

    setExpandedGroupId(null); // Collapse the group view
  };


  const [toolbarPosition, setToolbarPosition] = useState(() => {
    if (typeof window === 'undefined') return { x: 400, y: 20 }; 
    const saved = localStorage.getItem('toolbarPosition');
    try { if (saved) { const p = JSON.parse(saved); if (typeof p.x === 'number' && typeof p.y === 'number') return p; }
    } catch (e) { console.error("Error parsing toolbarPosition", e); }
    return { x: (typeof window !== 'undefined' ? window.innerWidth / 2 - 200 : 400), y: 20 };
  });
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [toolbarLayout, setToolbarLayout] = useState<'horizontal' | 'vertical'>(() => (typeof window !== 'undefined' ? (localStorage.getItem('toolbarLayout') as 'horizontal' | 'vertical' || 'horizontal') : 'horizontal'));

  const { selectedLogicalType, setSelectedLogicalType } = useSelectedEdgeType();
  const handleEdgeTypeSelect = (type: LogicalEdgeType) => setSelectedLogicalType(prev => (prev === type ? null : type));
  const edgeToolbarIcons: Record<LogicalEdgeType, React.ElementType> = {
    [LogicalEdgeType.DEPENDS_ON]: ShareIcon, [LogicalEdgeType.CALLS]: HeroPhoneArrowUpRightIcon,
    [LogicalEdgeType.TRIGGERS]: HeroBoltIcon, [LogicalEdgeType.WRITES_TO]: HeroPencilSquareIcon,
    [LogicalEdgeType.CONNECTS_TO]: HeroLinkIcon,
  };

  const onConnectInternal = useCallback((params: Connection) => {
    const { source, target, sourceHandle, targetHandle } = params; 
    if (!source || !target) { console.warn("onConnectInternal: source o target es null", params); return; }
    const logicalTypeToUse = selectedLogicalType || LogicalEdgeType.CONNECTS_TO;
    const config = getEdgeConfig(logicalTypeToUse);
    const newEdge: Edge = {
      source: source!, target: target!, sourceHandle: sourceHandle, targetHandle: targetHandle,
      id: `edge-${Date.now()}-${source!}-${target!}`, type: config.visualType,
      style: config.style, markerEnd: config.markerEnd,
      data: { label: config.label, edgeKind: config.logicalType },
    };
    setEdges((eds) => addEdge(newEdge, eds));
    if (onConnectProp) onConnectProp(params); 
  }, [selectedLogicalType, setEdges, onConnectProp]);

  useEffect(() => {
    // Lógica de arrastre de la barra de herramientas eliminada ya que ahora es fija.
  }, []);

  useEffect(() => {
    if (initialViewport && reactFlowInstance) {
      const currentViewport = reactFlowInstance.getViewport();
      const viewportChangedSignificantly = 
        Math.abs(currentViewport.x - initialViewport.x) > 0.001 ||
        Math.abs(currentViewport.y - initialViewport.y) > 0.001 ||
        Math.abs(currentViewport.zoom - initialViewport.zoom) > 0.0001;

      if (initialViewport.zoom !== 0 && (viewportChangedSignificantly || !lastViewportRef.current)) {
        const timeoutId = setTimeout(() => {
          if (reactFlowInstance) { 
            reactFlowInstance.setViewport(initialViewport);
            lastViewportRef.current = initialViewport; 
            console.log('Applied initialViewport:', initialViewport);
          }
        }, 50); 
        return () => clearTimeout(timeoutId);
      } else if (!lastViewportRef.current && initialViewport.zoom !== 0) {
        lastViewportRef.current = initialViewport;
        console.log('Initialized lastViewportRef with initialViewport:', initialViewport);
      }
    }
  }, [initialViewport, reactFlowInstance]);

  const onEdgeClick = useCallback((evt: React.MouseEvent, edge: Edge) => { evt.stopPropagation(); setSelectedEdge(edge); }, []);
  const onEdgeDelete = useCallback((edgeToDelete: Edge) => { onEdgesChangeInternal([{ id: edgeToDelete.id, type: 'remove' }]); setSelectedEdge(null); }, [onEdgesChangeInternal]);

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    setSelectedEdge(null); setContextMenu(p => ({...p, visible: false}));
    if (activeTool === 'lasso') return;
    if ((activeTool === 'note' || activeTool === 'text') && reactFlowInstance) {
      event.preventDefault(); event.stopPropagation(); document.body.style.cursor = 'crosshair';
      const pos = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const type = activeTool === 'note' ? 'noteNode' : 'textNode';
      const data = activeTool === 'note' ? { text: 'Click to edit', backgroundColor: '#FEF08A', textColor: '#1F2937', fontSize: 14 } : { text: 'Click to edit', fontSize: 16, fontWeight: 'normal', textAlign: 'left', textColor: '#000000', backgroundColor: 'transparent', borderStyle: 'none' };
      const newNode: Node = { id: `${activeTool}-${Date.now()}`, type, position: pos, data, selected: true, draggable: true, selectable: true };
      setNodes(nds => applyNodeChanges([{ type: 'add', item: newNode }], nds)); return;
    }
    document.body.style.cursor = 'default';
  }, [activeTool, reactFlowInstance, setNodes]);

  useEffect(() => {
    const areaUpdate = (e: Event) => { const {nodeId,data} = (e as CustomEvent).detail; reactFlowInstance.setNodes(ns => ns.map(n => n.id === nodeId ? {...n, data:{...n.data, ...data}} : n)); };
    const ctxMenu = (e: Event) => { const {x,y,items} = (e as CustomEvent).detail; setContextMenu({visible:true,x,y,nodeId:null,nodeType:null,isPane:false,parentInfo:null,customItems:items}); };
    window.addEventListener('updateAreaNode', areaUpdate as EventListener);
    document.addEventListener('showContextMenu', ctxMenu as EventListener);
    return () => { window.removeEventListener('updateAreaNode', areaUpdate as EventListener); document.removeEventListener('showContextMenu', ctxMenu as EventListener); };
  }, [reactFlowInstance]);

  const handleNodeContextMenu = useCallback((evt: React.MouseEvent, node: Node) => { evt.preventDefault(); evt.stopPropagation(); if(!node.selected) return; setContextMenu({visible:true,x:evt.clientX,y:evt.clientY,nodeId:node.id,nodeType:node.type||null,isPane:false,parentInfo:null}); }, []);
  const handlePaneContextMenu = useCallback((evt: React.MouseEvent) => { evt.preventDefault(); setContextMenu(p => ({...p, visible:false})); }, []);
  
  const [editingGroup, setEditingGroup] = useState<{id:string,label:string}|null>(null);
  const startEditingGroupName = useCallback((id:string,lbl:string)=>setEditingGroup({id,label:lbl}),[]);
  const saveGroupName = useCallback((name:string)=>{ if(!editingGroup)return; setNodes(ns=>ns.map(n=>n.id===editingGroup.id?{...n,data:{...n.data,label:name}}:n)); setContextMenu(p=>({...p,visible:false})); setEditingGroup(null); },[editingGroup,setNodes]);
  useOnSelectionChange({onChange:({nodes:sel})=>setSelectedNodes(sel)});
  useEffect(()=>{ const focus=(e:Event)=>{const{nodeId,isFocused}=(e as CustomEvent).detail;setFocusedNodeId(isFocused?nodeId:null);}; window.addEventListener('nodeGroupFocus',focus as EventListener); return()=>window.removeEventListener('nodeGroupFocus',focus as EventListener); },[]);
  const findGroupAtPosition = useCallback((pos:{x:number,y:number})=>reactFlowInstance.getNodes().find(n=>n.type==='group'&&!n.data?.isMinimized&&pos.x>=n.position.x&&pos.x<=n.position.x+(n.width||300)&&pos.y>=n.position.y&&pos.y<=n.position.y+(n.height||200)),[reactFlowInstance]);
  const createEmptyGroup = useCallback((prov:'aws'|'gcp'|'azure'|'generic'='generic')=>{ const{width:w,height:h}=reactFlowWrapper.current?.getBoundingClientRect()||{width:1000,height:800}; const pos=reactFlowInstance.screenToFlowPosition({x:w/2,y:h/2}); const id=`group-${Date.now()}`; const grp:Node={id,type:'group',position:pos,data:{label:'New Group',provider:prov,isCollapsed:false,isMinimized:false},style:{width:300,height:200}}; setNodes(ns=>applyNodeChanges([{type:'add',item:grp}],ns)); setTimeout(()=>document.dispatchEvent(new CustomEvent('nodesChanged',{detail:{action:'nodeAdded',nodeIds:[id]}})),100); return id; },[reactFlowInstance,setNodes,reactFlowWrapper]);
  const optimizeNodesInGroup = useCallback((gid:string)=>{ const grp=reactFlowInstance.getNode(gid); if(!grp||grp.data?.isMinimized)return; const children=reactFlowInstance.getNodes().filter(n=>n.parentId===gid); if(children.length===0)return; const grpW=(grp.style?.width as number)||300; const hH=40,vM=20,hM=20,nS=8; const availW=grpW-2*hM; const sorted=children.sort((a,b)=>a.id.localeCompare(b.id)); setNodes(ns=>ns.map(n=>{if(n.parentId!==gid)return n; const idx=sorted.findIndex(c=>c.id===n.id); const y=hH+vM+idx*(40+nS); return{...n,position:{x:hM,y},style:{...n.style,width:availW,height:40,transition:'none'},draggable:true,selectable:true};})); },[reactFlowInstance,setNodes]);
  const groupSelectedNodes = useCallback(()=>{ if(selectedNodes.length<2){console.warn("Need >=2 nodes to group");return;} let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity; const provCounts:Record<string,number>={}; selectedNodes.forEach(n=>{const w=n.width||150,h=n.height||80;minX=Math.min(minX,n.position.x);minY=Math.min(minY,n.position.y);maxX=Math.max(maxX,n.position.x+w);maxY=Math.max(maxY,n.position.y+h);const p=n.data?.provider||'generic';provCounts[p]=(provCounts[p]||0)+1;}); let commonProv:any='generic';let maxCt=0;Object.entries(provCounts).forEach(([p,c])=>{if(c>maxCt){commonProv=p;maxCt=c;}}); const pX=50,pVT=60,pVB=40;minX-=pX;minY-=pVT;maxX+=pX;maxY+=pVB; const w=Math.max(250,maxX-minX),h=Math.max(180,maxY-minY); const id=`group-${Date.now()}`; const grp:Node={id,type:'group',position:{x:minX,y:minY},data:{label:'Grupo',provider:commonProv,isCollapsed:false,isMinimized:false},style:{width:w,height:h}}; setNodes(ns=>{const upd=ns.map(n=>selectedNodes.some(s=>s.id===n.id)?{...n,parentId:id,extent:'parent'as const,position:{x:n.position.x-minX,y:n.position.y-minY},selected:false}:n); return[...upd,grp];}); setTimeout(()=>optimizeNodesInGroup(id),50); return id; },[selectedNodes,reactFlowInstance,optimizeNodesInGroup,setNodes]);
  
  const ungroupNodes = useCallback((groupIdToUngroup?: string) => {
    const { getNodes, setNodes: rfSetNodes } = reactFlowInstance;
    const currentNodes = getNodes();
    let nodesToUpdate: Node[] = currentNodes;

    if (groupIdToUngroup) {
        const groupNode = currentNodes.find(n => n.id === groupIdToUngroup && n.type === 'group');
        if (!groupNode) {
            console.warn(`Group node with id ${groupIdToUngroup} not found for ungrouping.`);
            return;
        }
        nodesToUpdate = currentNodes.map(n => {
            if (n.parentId === groupIdToUngroup) {
                return {
                    ...n,
                    parentId: undefined,
                    extent: undefined,
                    position: {
                        x: (groupNode.positionAbsolute?.x ?? groupNode.position.x) + n.position.x,
                        y: (groupNode.positionAbsolute?.y ?? groupNode.position.y) + n.position.y,
                    },
                    selected: false,
                    hidden: false, 
                };
            }
            return n;
        }).filter(n => n.id !== groupIdToUngroup); 
    } else { 
        const selectedGroupNodes = selectedNodes.filter(node => node.type === 'group');
        const parentIdsOfSelectedChildren = [...new Set(selectedNodes.filter(node => node.parentId && currentNodes.find(pn => pn.id === node.parentId && pn.type === 'group')).map(node => node.parentId!))];
        let targetGroupIds = [...new Set([...selectedGroupNodes.map(g => g.id), ...parentIdsOfSelectedChildren])];

        if (targetGroupIds.length === 0) {
            const nodesWithinAnyGroup = selectedNodes.filter(n => n.parentId && currentNodes.find(p => p.id === n.parentId && p.type === 'group'));
            if (nodesWithinAnyGroup.length > 0) {
                const parentIdsToUngroupFrom = [...new Set(nodesWithinAnyGroup.map(n => n.parentId!))];
                targetGroupIds.push(...parentIdsToUngroupFrom);
                targetGroupIds = [...new Set(targetGroupIds)]; 
            }
        }
        
        if (targetGroupIds.length === 0) {
            console.warn("No groups or nodes within groups selected to ungroup.");
            return;
        }
        
        nodesToUpdate = currentNodes.map(n => {
            if (n.parentId && targetGroupIds.includes(n.parentId)) {
                const parentGroup = currentNodes.find(pg => pg.id === n.parentId);
                if (parentGroup) {
                    return {
                        ...n,
                        parentId: undefined,
                        extent: undefined,
                        position: {
                            x: (parentGroup.positionAbsolute?.x ?? parentGroup.position.x) + n.position.x,
                            y: (parentGroup.positionAbsolute?.y ?? parentGroup.position.y) + n.position.y,
                        },
                        selected: false,
                        hidden: false, 
                    };
                }
            }
            return n;
        }).filter(n => !targetGroupIds.includes(n.id)); 
    }
    
    rfSetNodes(nodesToUpdate);
    setSelectedNodes([]);
  }, [reactFlowInstance, selectedNodes]);

  const deleteSelectedElements = useCallback(() => {
    const { getNodes, getEdges, setNodes: rfSetNodes, setEdges: rfSetEdges } = reactFlowInstance;
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    const selectedNodeIds = selectedNodes.map(n => n.id);
    const selectedEdgeIds = currentEdges.filter(e => e.selected).map(e => e.id);

    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    let allNodeIdsToDelete = [...selectedNodeIds];
    selectedNodeIds.forEach(nodeId => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node?.type === 'group') {
        const childIds = currentNodes.filter(n => n.parentId === nodeId).map(n => n.id);
        allNodeIdsToDelete = [...allNodeIdsToDelete, ...childIds];
      }
    });
    allNodeIdsToDelete = [...new Set(allNodeIdsToDelete)]; 

    rfSetNodes(nds => nds.filter(n => !allNodeIdsToDelete.includes(n.id)));
    rfSetEdges(eds => eds.filter(e => !selectedEdgeIds.includes(e.id) && !allNodeIdsToDelete.includes(e.source) && !allNodeIdsToDelete.includes(e.target)));
    
    setSelectedNodes([]); 
    setSelectedEdge(null); 
  }, [reactFlowInstance, selectedNodes, edges]);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCurrentDiagramState = useCallback(() => {
    if (reactFlowInstance && onSaveRef.current) {
      const flow = reactFlowInstance.toObject();
      const viewport = reactFlowInstance.getViewport();
      onSaveRef.current({
        nodes: flow.nodes,
        edges: flow.edges,
        viewport: viewport
      });
    }
  }, [reactFlowInstance]);

  // Añadir efecto para guardar el viewport cuando cambia
  useEffect(() => {
    if (reactFlowInstance && onSaveRef.current) {
      const handleViewportChange = () => {
        const viewport = reactFlowInstance.getViewport();
        if (viewport.zoom !== 0) {
          saveCurrentDiagramState();
        }
      };

      // Usar un debounce para evitar demasiadas llamadas
      const debouncedHandleViewportChange = debounce(handleViewportChange, 500);

      // Suscribirse a los eventos de cambio de viewport
      document.addEventListener('reactflow.viewportchange', debouncedHandleViewportChange);
      
      return () => {
        document.removeEventListener('reactflow.viewportchange', debouncedHandleViewportChange);
      };
    }
  }, [reactFlowInstance, saveCurrentDiagramState]);

  // Modificar el efecto que maneja el guardado del estado para incluir el viewport de los grupos
  useEffect(() => {
    if (onSaveRef.current && reactFlowInstance && !isDragging) {
      const currentNodesJSON = JSON.stringify(nodes);
      const currentEdgesJSON = JSON.stringify(edges);
      if (currentNodesJSON !== previousNodesRef.current || currentEdgesJSON !== previousEdgesRef.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (reactFlowInstance && onSaveRef.current) {
            const flow = reactFlowInstance.toObject();
            const viewport = reactFlowInstance.getViewport();
            
            // Actualizar el viewport de los grupos expandidos
            const updatedNodes = flow.nodes.map(node => {
              if (node.type === 'group' && node.data?.isExpandedView) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    viewport: viewport
                  }
                };
              }
              return node;
            });

            onSaveRef.current({
              nodes: updatedNodes,
              edges: flow.edges,
              viewport: viewport
            });
          }
        }, 1000);
      }
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [nodes, edges, reactFlowInstance, isDragging, onSaveRef]);

  // Modificar el efecto que maneja la expansión de grupos para restaurar el viewport
  useEffect(() => {
    if (expandedGroupId && reactFlowInstance) {
      const groupNode = nodes.find(n => n.id === expandedGroupId);
      if (groupNode?.data?.viewport) {
        // Aplicar el viewport guardado después de un pequeño delay para asegurar que el grupo esté expandido
        setTimeout(() => {
          if (reactFlowInstance) {
            reactFlowInstance.setViewport(groupNode.data.viewport);
          }
        }, 50);
      }

      setNodes(nds => nds.map(n => {
        if (n.id === expandedGroupId) {
          const currentViewport = reactFlowInstance.getViewport();
          return {
            ...n,
            data: { 
              ...n.data, 
              isExpandedView: true, 
              isMinimized: false,
              viewport: n.data.viewport || currentViewport
            }
          };
        }
        if (n.parentId === expandedGroupId) {
          return { ...n, hidden: false };
        }
        return n;
      }));
    }
  }, [expandedGroupId, setNodes, reactFlowInstance, nodes]);

  const handleExpandGroupView = useCallback((groupId: string) => {
    if (reactFlowInstance) {
      lastViewportRef.current = reactFlowInstance.getViewport(); 
    }
    setExpandedGroupId(groupId);
    setNodes(nds => nds.map(n => {
      if (n.id === groupId) {
        const groupData = { ...n.data, isExpandedView: true, isMinimized: false };
        // Limpiar datos anidados que son manejados por GroupFocusView o no deben persistir en el data del nodo grupo
        delete groupData.nodes; 
        delete groupData.edges;
        // El viewport de la vista de enfoque se puede pasar como prop separada a GroupFocusView si se necesita restaurar,
        // pero no debe vivir permanentemente en el data.nodes del grupo en el estado principal.
        // Si se quiere restaurar el viewport de la última sesión de GroupFocusView, se debe leer de groupData.viewport ANTES de este delete.
        // Por ahora, lo eliminamos para simplificar y evitar bucles. GroupFocusView usará su defaultViewport.
        delete groupData.viewport; 
        return { ...n, data: groupData };
      }
      return n;
    }));
  }, [reactFlowInstance, setNodes, setExpandedGroupId]);

  useEffect(() => {
    if (!expandedGroupId && lastViewportRef.current && reactFlowInstance) {
      const currentViewport = reactFlowInstance.getViewport();
      if (lastViewportRef.current.zoom !== 0 && 
          (Math.abs(currentViewport.x - lastViewportRef.current.x) > 0.01 ||
           Math.abs(currentViewport.y - lastViewportRef.current.y) > 0.01 ||
           Math.abs(currentViewport.zoom - lastViewportRef.current.zoom) > 0.001)
      ) {
        setTimeout(() => {
          if (reactFlowInstance && lastViewportRef.current) { 
            reactFlowInstance.setViewport(lastViewportRef.current);
          }
        }, 50); 
      }
    }
  }, [expandedGroupId, reactFlowInstance]);

  // Modificar el efecto que maneja el colapso de grupos
  const handleCollapseGroupView = useCallback((groupIdToCollapse: string) => {
    if (expandedGroupId && expandedGroupId !== groupIdToCollapse) {
      const { getNode, setNodes: rfSetNodes } = reactFlowInstance;
      const groupNode = getNode(groupIdToCollapse);
      if (!groupNode || !groupNode.data.isExpandedView) {
        return;
      }
      const defaultWidth = 300;
      const defaultHeight = 200;

      rfSetNodes((currentNodesMap) =>
        currentNodesMap.map((n) => {
          if (n.id === groupIdToCollapse) {
            return {
              ...n,
              data: { ...n.data, isExpandedView: false },
              style: { ...n.style, width: defaultWidth, height: defaultHeight }
            };
          }
          if (n.parentId === groupIdToCollapse) {
            return { ...n, hidden: true };
          }
          return n;
        })
      );
      return;
    }
    
    setExpandedGroupId(null);
    setNodes(nds =>
      nds.map(n => {
        if (n.id === groupIdToCollapse) {
          return {
            ...n,
            data: { ...n.data, isExpandedView: false }
          };
        }
        if (n.parentId === groupIdToCollapse) {
          return { ...n, hidden: true };
        }
        return n;
      })
    );
    saveCurrentDiagramState();
  }, [reactFlowInstance, setNodes, expandedGroupId, setExpandedGroupId, saveCurrentDiagramState]);


  useEffect(() => {
    const expandHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId: string }>;
      if (customEvent.detail?.groupId) {
        handleExpandGroupView(customEvent.detail.groupId);
      }
    };
    const collapseHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId: string }>;
      if (customEvent.detail?.groupId) {
        handleCollapseGroupView(customEvent.detail.groupId);
      }
    };

    window.addEventListener('expandGroupView', expandHandler);
    window.addEventListener('collapseGroupView', collapseHandler);
    return () => {
      window.removeEventListener('expandGroupView', expandHandler);
      window.removeEventListener('collapseGroupView', collapseHandler);
    };
  }, [handleExpandGroupView, handleCollapseGroupView]);


  const handleDeleteNodeFromContextMenu = useCallback((nodeId: string) => {
    const { getNode, getNodes, setNodes: rfSetNodes, setEdges: rfSetEdges } = reactFlowInstance;
    const nodeToDelete = getNode(nodeId);
    if (!nodeToDelete) return;

    let idsToDelete = [nodeId];
    if (nodeToDelete.type === 'group') { 
      const childIds = getNodes().filter(n => n.parentId === nodeId).map(n => n.id);
      idsToDelete = [...idsToDelete, ...childIds];
    }

    rfSetNodes(nds => nds.filter(n => !idsToDelete.includes(n.id)));
    rfSetEdges(eds => eds.filter(e => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target) && !idsToDelete.includes(nodeId))); 
    
    setContextMenu(prev => ({...prev, visible: false}));
    setSelectedNodes([]); 
    setSelectedEdge(null);
  }, [reactFlowInstance]);

  const handleToolClick = useCallback((tool: ToolType) => {
    if (tool === activeTool && tool !== 'lasso' && tool !== 'area') return;
    
    document.body.classList.remove('lasso-selection-mode', 'area-drawing-mode');
    document.body.style.cursor = 'default';
    
    if (tool === 'lasso') {
      document.body.classList.add('lasso-selection-mode');
      document.body.style.cursor = 'crosshair';
      reactFlowInstance.setNodes(ns => ns.map(n => ({ ...n, selected: false, selectable: true })));
    } else if (tool === 'area') {
      document.body.classList.add('area-drawing-mode');
      document.body.style.cursor = 'crosshair';
      reactFlowInstance.setNodes(ns => ns.map(n => ({ ...n, selected: false })));
    } else if (tool === 'note' || tool === 'text') {
      document.body.style.cursor = 'crosshair';
    }
    
    setActiveTool(tool);
    
    const lStyle = document.getElementById('lasso-select-compatibility');
    if (tool === 'lasso' && !lStyle) {
      const s = document.createElement('style');
      s.id = 'lasso-select-compatibility';
      s.innerHTML = `
        .react-flow__node { pointer-events: all !important; }
        .lasso-selection-mode .react-flow__pane { cursor: crosshair !important; }
      `;
      document.head.appendChild(s);
    } else if (tool !== 'lasso' && lStyle) {
      lStyle.remove();
    }
  }, [activeTool, reactFlowInstance, setActiveTool]);

  const onDragStartSidebar = (evt:React.DragEvent,item:ResourceItem)=>{if(activeTool==='area'||activeTool==='text'){evt.preventDefault();return;}evt.dataTransfer.setData('application/reactflow',JSON.stringify(item));evt.dataTransfer.effectAllowed='move';const el=evt.currentTarget as HTMLDivElement;const r=el.getBoundingClientRect();setActiveDrag({item,offset:{x:evt.clientX-r.left,y:evt.clientY-r.top},elementSize:{width:r.width,height:r.height}});document.body.style.cursor='crosshair';};
  const [highlightedGroupId,setHighlightedGroupId]=useState<string|null>(null);
  const isInsideGroup=useCallback((pos:{x:number,y:number},grp:Node)=>(pos.x>=grp.position.x&&pos.x<=grp.position.x+(grp.style?.width as number||300)&&pos.y>=grp.position.y&&pos.y<=grp.position.y+(grp.style?.height as number||200)),[]);
  const onDragOver=useCallback((evt:React.DragEvent)=>{if(activeTool==='area'||activeTool==='text'){evt.preventDefault();evt.dataTransfer.dropEffect='none';return;}evt.preventDefault();evt.dataTransfer.dropEffect='move';document.body.style.cursor='crosshair';if(reactFlowInstance){const pos=reactFlowInstance.screenToFlowPosition({x:evt.clientX,y:evt.clientY});const grps=reactFlowInstance.getNodes().filter(n=>n.type==='group'&&!n.data?.isMinimized);const sorted=grps.sort((a,b)=>((a.style?.width as number||200)*(a.style?.height as number||150))-((b.style?.width as number||200)*(b.style?.height as number||150)));let found=false;for(const g of sorted){if(isInsideGroup(pos,g)){setHighlightedGroupId(g.id);found=true;break;}}if(!found&&highlightedGroupId)setHighlightedGroupId(null);}},[reactFlowInstance,isInsideGroup,highlightedGroupId,activeTool]);
  const onDragEnd=useCallback(()=>{setHighlightedGroupId(null);setActiveDrag(null);document.body.style.cursor='default';},[setActiveDrag]);
  
  const onDrop=useCallback((evt:React.DragEvent)=>{
    evt.preventDefault();
    document.body.style.cursor='default';
    if(activeTool==='area'){setActiveTool('select');return;}
    const bounds=reactFlowWrapper.current?.getBoundingClientRect();
    if(!bounds||!reactFlowInstance)return;
    try{
      const dataStr=evt.dataTransfer.getData('application/reactflow');
      if(!dataStr)return;
      const itemData=JSON.parse(dataStr)as ResourceItem;
      const offset=activeDrag?.offset||{x:0,y:0};
      let nodeW=200,nodeH=100;
      if(itemData.type==='note'){nodeW=200;nodeH=120;}
      else if(itemData.type==='text'){nodeW=150;nodeH=80;}
      else if(itemData.type==='group'){nodeW=300;nodeH=200;}
      const dropPosition=reactFlowInstance.screenToFlowPosition({x:evt.clientX-offset.x,y:evt.clientY-offset.y});
      let newNodeToAdd:Node;
      if(itemData.type==='note')newNodeToAdd={id:`note-${Date.now()}`,type:'noteNode',position:dropPosition,data:{text:'Click to edit',backgroundColor:'#FEF08A',textColor:'#1F2937',fontSize:14},draggable:true,selectable:true};
      else if(itemData.type==='text')newNodeToAdd={id:`text-${Date.now()}`,type:'textNode',position:dropPosition,data:{text:'Click to edit',fontSize:16,fontWeight:'normal',textAlign:'left',textColor:'#000000',backgroundColor:'transparent',borderStyle:'none'},draggable:true,selectable:true};
      else newNodeToAdd={id:`${itemData.type}-${Date.now()}`,type:itemData.type,position:dropPosition,data:{label:itemData.name,description:itemData.description,provider:itemData.provider},draggable:true,selectable:true,connectable:true,style:{width:nodeW,height:nodeH}};
      
      const targetGroupNode=findGroupAtPosition(dropPosition);
      if(targetGroupNode){
        const parentNode=reactFlowInstance.getNode(targetGroupNode.id);
        if(parentNode){
          newNodeToAdd.parentId=targetGroupNode.id;
          if(!parentNode.data.isExpandedView){
            newNodeToAdd.hidden=true; 
          }else{
            const relativePos={x:dropPosition.x-(parentNode.positionAbsolute?.x ?? parentNode.position.x),y:dropPosition.y-(parentNode.positionAbsolute?.y ?? parentNode.position.y)};
            const groupWidth=parentNode.width||300;
            const groupHeight=parentNode.height||200;
            const marginX=CHILD_NODE_PADDING_X;
            const marginY=GROUP_HEADER_HEIGHT+CHILD_NODE_PADDING_Y;
            newNodeToAdd.position={x:Math.max(marginX,Math.min(groupWidth-nodeW-marginX,relativePos.x)),y:Math.max(marginY,Math.min(groupHeight-nodeH-CHILD_NODE_PADDING_Y,relativePos.y))};
            newNodeToAdd.extent='parent'as const;
            newNodeToAdd.hidden=false;
          }
        }
      }
      setNodes(ns=>applyNodeChanges([{type:'add',item:newNodeToAdd}],ns));
      if(newNodeToAdd.parentId){
        const parentNodeDetails=reactFlowInstance.getNode(newNodeToAdd.parentId);
        if(parentNodeDetails?.data.isExpandedView){
        }
      }
      setActiveTool('select');
      document.body.style.cursor='default';
    }catch(err){
      console.error("Error drop:",err);
    }
  },[reactFlowInstance,findGroupAtPosition,setNodes,activeDrag,activeTool,setActiveTool, handleExpandGroupView]);

  useEffect(()=>{const kd=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;switch(e.key.toLowerCase()){case'v':handleToolClick('select');break;case'n':handleToolClick('note');break;case't':handleToolClick('text');break;case'a':if(!e.shiftKey&&!e.ctrlKey&&!e.metaKey)handleToolClick('area');break;case'g':if(!e.shiftKey&&!e.ctrlKey&&!e.metaKey)createEmptyGroup();break;case's':if(e.shiftKey)handleToolClick('lasso');break;}};document.addEventListener('keydown',kd);return()=>document.removeEventListener('keydown',kd);},[handleToolClick,createEmptyGroup]);
  const renderEditGroupModal=()=>{if(!editingGroup)return null;return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}onClick={()=>setEditingGroup(null)}><div style={{backgroundColor:'white',padding:'20px',borderRadius:'8px',width:'300px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}onClick={e=>e.stopPropagation()}><h3 style={{marginTop:0,marginBottom:'16px',fontSize:'16px'}}>Edit Group Name</h3><input type="text"defaultValue={editingGroup.label}style={{width:'100%',padding:'8px 12px',border:'1px solid #ddd',borderRadius:'4px',fontSize:'14px',marginBottom:'16px'}}autoFocus onKeyDown={e=>{if(e.key==='Enter')saveGroupName((e.target as HTMLInputElement).value);if(e.key==='Escape')setEditingGroup(null);}}/><div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}><button onClick={()=>setEditingGroup(null)}style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:'4px',backgroundColor:'#f5f5f5',cursor:'pointer',fontSize:'14px'}}>Cancel</button><button onClick={e=>saveGroupName((e.currentTarget.parentElement?.querySelector('input')as HTMLInputElement).value)}style={{padding:'6px 12px',border:'none',borderRadius:'4px',backgroundColor:'#0088ff',color:'white',cursor:'pointer',fontSize:'14px'}}>Save</button></div></div></div>);};
  const moveNodesToBack=useCallback((ids:string[])=>{const cN=reactFlowInstance.getNodes();const sIds=new Set(ids);const mZ=Math.min(...cN.map(n=>n.zIndex||0));reactFlowInstance.setNodes(cN.map(n=>sIds.has(n.id)?{...n,zIndex:mZ-1}:n)as Node[]);},[reactFlowInstance]);
  const simulateNodeExecution=async(n:NodeWithExecutionStatus,s:NodeExecutionState)=>{setExecutionLogs(p=>[...p,getExecutionMessage(n,s)]);await new Promise(r=>setTimeout(r,1000));};
  const getExecutionMessage=(node:NodeWithExecutionStatus,state:NodeExecutionState):string=>{const n=node as Node;const name=n.data?.label||'Unnamed';const dets=[];if(n.data?.provider)dets.push(`Provider: ${n.data.provider}`);if(n.data?.resourceType)dets.push(`Type: ${n.data.resourceType}`);const detStr=dets.length>0?` (${dets.join(', ')})`:'';switch(state){case'creating':return`Iniciando creación de ${name}${detStr}...`;case'updating':return`Iniciando actualización de ${name}${detStr}...`;case'deleting':return`Iniciando eliminación de ${name}${detStr}...`;case'success':return`${name} procesado exitosamente`;case'error':return`Error al procesar ${name}`;default:return`Procesando ${name}...`;}};
  const handlePreview=useCallback(()=>{if(!currentDiagram)return;try{setIsExecutionLogVisible(true);setExecutionLogs([]);const exN=currentDiagram.nodes.filter(n=>n.type!=='group');(async()=>{for(const n of exN){let s:NodeExecutionState='creating';const d=(n as Node).data;if(d?.status==='creating'||d?.status==='new'||(!d?.status&&d?.isNew))s='creating';else if(d?.status==='updating'||d?.status==='modified'||d?.hasChanges)s='updating';else if(d?.status==='deleting'||d?.status==='toDelete'||d?.markedForDeletion)s='deleting';const name=d?.label||'Unnamed';setExecutionLogs(p=>[...p,`Procesando ${s} para ${name}...`]);await new Promise(r=>setTimeout(r,1000));setExecutionLogs(p=>[...p,`${s} completado para ${name}`,`Costo estimado para ${name}: $${d?.estimated_cost?.monthly||0} USD/mes`]);}})();}catch(err){console.error('Preview Error:',err);message.error('Error en Preview');}},[currentDiagram]);
  const handleRun=useCallback(()=>{if(!currentDiagram)return;try{setIsExecutionLogVisible(true);setExecutionLogs([]);const exN=currentDiagram.nodes.filter(n=>n.type!=='group');(async()=>{for(const n of exN){let s:NodeExecutionState='creating';const d=(n as Node).data;if(d?.status==='creating'||d?.status==='new'||(!d?.status&&d?.isNew))s='creating';else if(d?.status==='updating'||d?.status==='modified'||d?.hasChanges)s='updating';else if(d?.status==='deleting'||d?.status==='toDelete'||d?.markedForDeletion)s='deleting';const name=d?.label||'Unnamed';setExecutionLogs(p=>[...p,`Procesando ${s} para ${name}...`]);await new Promise(r=>setTimeout(r,1000));setExecutionLogs(p=>[...p,`${s} completado para ${name}`,`Costo estimado para ${name}: $${d?.estimated_cost?.monthly||0} USD/mes`]);}})();}catch(err){console.error('Run Error:',err);message.error('Error en Run');}},[currentDiagram]);
  useEffect(()=>{const h=(e:Event)=>{setSingleNodePreview((e as CustomEvent<SingleNodePreview>).detail);setShowSingleNodePreview(true);};window.addEventListener('showSingleNodePreview',h);return()=>window.removeEventListener('showSingleNodePreview',h);},[]);
  const handleApplyChanges=async()=>{if(!singleNodePreview)return;try{setLoadingState(true);setShowLogs(true);setExecutionLogs([]);setExecutionLogs(p=>[...p,`Procesando ${singleNodePreview.action} del recurso ${singleNodePreview.resource.name}`]);await new Promise(r=>setTimeout(r,1500));setExecutionLogs(p=>[...p,`Recurso ${singleNodePreview.resource.name} ${singleNodePreview.action==='create'?'creado':singleNodePreview.action==='update'?'actualizado':'eliminado'} exitosamente`]);if(singleNodePreview.estimated_cost)setExecutionLogs(p=>[...p,`Costo estimado: ${singleNodePreview.estimated_cost?.currency} ${singleNodePreview.estimated_cost?.monthly?.toFixed(2)}`]);if(singleNodePreview.dependencies?.length>0){setExecutionLogs(p=>[...p,`Procesando ${singleNodePreview.dependencies.length} dependencias...`]);for(const d of singleNodePreview.dependencies){setExecutionLogs(p=>[...p,`Procesando dependencia: ${d.name} (${d.type}) - ${d.action==='create'?'Creando':d.action==='update'?'Actualizando':'Eliminando'}`]);await new Promise(r=>setTimeout(r,500));setExecutionLogs(p=>[...p,`Dependencia ${d.name} procesada exitosamente`]);}}}catch(err){console.error('ApplyChanges Error:',err);setExecutionLogs(p=>[...p,`Error: ${err instanceof Error?err.message:'Unknown'}`]);message.error('Error ApplyChanges');}finally{setLoadingState(false);setShowSingleNodePreview(false);setSingleNodePreview(null);}};

  const handleGroupClick = (nodeId: string) => {
    const groupNode = nodes.find((n) => n.id === nodeId);
    if (groupNode) {
      setExpandedGroupId(nodeId);
      // Ya no se usa setInitialViewport, el viewport se maneja por prop y por el estado del nodo
    }
  };

  // Si expandedGroupId tiene un valor, renderizamos la vista de enfoque del grupo
  if (expandedGroupId) {
    return (
      <GroupFocusView
        focusedGroupId={expandedGroupId}
        allNodes={nodes}
        allEdges={edges}
        onClose={() => {
          if (expandedGroupId) { 
             handleCollapseGroupView(expandedGroupId);
          }
        }}
        onSaveChanges={handleGroupSave}
        mainNodeTypes={memoizedNodeTypes}
        mainEdgeTypes={edgeTypes}
        edgeTypeConfigs={edgeTypeConfigs} 
        edgeToolbarIcons={edgeToolbarIcons} 
        resourceCategories={resourceCategories} 
      />
    );
  }

  // Renderizado normal del FlowEditor
  return (
    <div className="relative w-full h-full">
      {renderEditGroupModal()}
      <div style={{ height: '100%', width: '100%' }} ref={reactFlowWrapper}>
        <style>{`
          .react-flow__pane {
            cursor: ${activeTool === 'note' || activeTool === 'text' || activeTool === 'area' || activeTool === 'lasso' ? 'crosshair' : 'default'};
          }
          .react-flow__node,
          .react-flow__node:active,
          .react-flow__node:hover,
          .react-flow__node[data-dragging="true"],
          .react-flow__node[data-selected="true"],
          .react-flow__node[data-selected="true"]:active,
          .react-flow__node[data-selected="true"]:hover,
          .note-node,
          .note-node:hover,
          .note-node:active,
          .note-node[data-selected="true"],
          .note-node[data-selected="true"]:hover,
          .note-node[data-selected="true"]:active {
            cursor: move !important;
          }
          .react-flow__node-areaNode {
            z-index: -1000 !important;
          }
          .react-flow__node-areaNode.selected {
            z-index: -1000 !important;
          }
          .react-flow__node-areaNode:hover {
            z-index: -1000 !important;
          }
          .area-node {
            background-color: rgba(59,130,246,0.1) !important;
            border: 1px solid rgba(59,130,246,0.5) !important;
            border-radius: 8px !important;
          }
          .area-node:hover {
            background-color: rgba(59,130,246,0.15) !important;
            border: 1px solid rgba(59,130,246,0.6) !important;
          }
          .area-node[data-selected="true"] {
            background-color: rgba(59,130,246,0.2) !important;
            border: 1px solid rgba(59,130,246,0.7) !important;
          }
        `}</style>
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
          onNodesChange={onNodesChangeInternal}
          onEdgesChange={onEdgesChangeInternal}
          onConnect={onConnectInternal}
          onPaneClick={handlePaneClick}
          onEdgeClick={onEdgeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          onNodeDragStart={() => setIsDragging(true)}
          onNodeDragStop={(_event, draggedNode) => {
            setIsDragging(false);
            
            const { getNodes, setNodes: rfSetNodes } = reactFlowInstance;
            const currentNodesOnDragStop = getNodes(); 

            const targetGroup = currentNodesOnDragStop.find(
              (g) =>
                g.type === 'group' &&
                !g.data.isMinimized &&
                draggedNode.positionAbsolute &&
                g.positionAbsolute && g.width && g.height &&
                draggedNode.positionAbsolute.x >= g.positionAbsolute.x && 
                draggedNode.positionAbsolute.x <= g.positionAbsolute.x + g.width &&
                draggedNode.positionAbsolute.y >= g.positionAbsolute.y &&
                draggedNode.positionAbsolute.y <= g.positionAbsolute.y + g.height &&
                draggedNode.id !== g.id &&
                draggedNode.parentId !== g.id 
            );

            if (targetGroup && targetGroup.id) {
              let nodesToUpdate = currentNodesOnDragStop.map(n => {
                if (n.id === draggedNode.id) {
                  const isTargetGroupExpanded = targetGroup.data.isExpandedView;
                  let newPosition = n.position; 
                  let newExtent = undefined;
                  let newHidden = !isTargetGroupExpanded;

                  if(isTargetGroupExpanded){
                    newPosition = {
                      x: (draggedNode.positionAbsolute?.x ?? 0) - (targetGroup.positionAbsolute?.x ?? 0),
                      y: (draggedNode.positionAbsolute?.y ?? 0) - (targetGroup.positionAbsolute?.y ?? 0),
                    };
                    newPosition.x = Math.max(CHILD_NODE_PADDING_X, Math.min(newPosition.x, (targetGroup.width ?? MIN_EXPANDED_GROUP_WIDTH) - (draggedNode.width ?? 150) - CHILD_NODE_PADDING_X));
                    newPosition.y = Math.max(GROUP_HEADER_HEIGHT + CHILD_NODE_PADDING_Y, Math.min(newPosition.y, (targetGroup.height ?? MIN_EXPANDED_GROUP_HEIGHT) - (draggedNode.height ?? 50) - CHILD_NODE_PADDING_Y));
                    newExtent = 'parent' as const;
                    newHidden = false;
                  }

                  return {
                    ...n,
                    parentId: targetGroup.id,
                    extent: newExtent,
                    position: newPosition,
                    hidden: newHidden, 
                    style: { ...n.style, width: n.width || undefined, height: n.height || undefined },
                  };
                }
                return n;
              });
          
              if (targetGroup.data.isExpandedView) {
                const groupNodeFromState = nodesToUpdate.find(n => n.id === targetGroup.id);
                const childrenOfTargetGroup = nodesToUpdate.filter(n => n.parentId === targetGroup.id);

                const newGroupWidth = Math.max(MIN_EXPANDED_GROUP_WIDTH, (groupNodeFromState?.style?.width as number || groupNodeFromState?.width || MIN_EXPANDED_GROUP_WIDTH));
                let accumulatedHeight = GROUP_HEADER_HEIGHT + CHILD_NODE_PADDING_Y;
                childrenOfTargetGroup.forEach(() => {
                  accumulatedHeight += CHILD_NODE_HEIGHT + CHILD_NODE_PADDING_Y;
                });
                accumulatedHeight += CHILD_NODE_PADDING_Y; 
                const newGroupHeight = Math.max(MIN_EXPANDED_GROUP_HEIGHT, accumulatedHeight);

                nodesToUpdate = nodesToUpdate.map(n => {
                  if (n.id === targetGroup.id) { 
                    return {
                      ...n,
                      data: { ...n.data, isExpandedView: true, isMinimized: false },
                      style: { ...n.style, width: newGroupWidth, height: newGroupHeight },
                    };
                  }
                  if (n.parentId === targetGroup.id) { 
                    const childIndex = childrenOfTargetGroup.findIndex(cn => cn.id === n.id);
                    return {
                      ...n,
                      hidden: false, 
                      position: {
                        x: CHILD_NODE_PADDING_X,
                        y: GROUP_HEADER_HEIGHT + CHILD_NODE_PADDING_Y + (childIndex * (CHILD_NODE_HEIGHT + CHILD_NODE_PADDING_Y)),
                      },
                      style: { ...n.style, width: newGroupWidth - 2 * CHILD_NODE_PADDING_X, height: CHILD_NODE_HEIGHT },
                      draggable: true,
                      selectable: true,
                      connectable: true,
                      extent: 'parent' as const,
                    };
                  }
                  return n;
                });
              }
              setTimeout(() => rfSetNodes(nodesToUpdate), 0);
            } else {
              if (onSaveRef.current) {
                 if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                 saveTimeoutRef.current = setTimeout(() => {
                   if (onSaveRef.current) {
                     onSaveRef.current(reactFlowInstance.toObject());
                   }
                 }, 100);
              }
            }
          }}
          onMouseDown={e=>{if(activeTool==='area'&&reactFlowInstance){const t=e.target as HTMLElement;if(t.closest('.react-flow__node,.react-flow__edge,.react-flow__handle,.react-flow__controls,.react-flow__minimap'))return;if(!t.closest('.react-flow__pane'))return;e.preventDefault();e.stopPropagation();const p=reactFlowInstance.screenToFlowPosition({x:e.clientX,y:e.clientY});setIsDrawingArea(true);setAreaStartPos(p);setCurrentArea({x:p.x,y:p.y,width:0,height:0});document.body.classList.add('area-drawing-mode');}}}
          onMouseMove={e=>{if(isDrawingArea&&areaStartPos&&reactFlowInstance){const cP=reactFlowInstance.screenToFlowPosition({x:e.clientX,y:e.clientY});setCurrentArea({x:Math.min(areaStartPos.x,cP.x),y:Math.min(areaStartPos.y,cP.y),width:Math.abs(cP.x-areaStartPos.x),height:Math.abs(cP.y-areaStartPos.y)});}}}
          onMouseUp={()=>{if(isDrawingArea&&currentArea&&reactFlowInstance){if(currentArea.width>20&&currentArea.height>20){const newArea:Node={id:`area-${Date.now()}`,type:'areaNode',position:{x:currentArea.x,y:currentArea.y},data:{backgroundColor:'rgba(59,130,246,0.5)',borderColor:'rgba(59,130,246,1)',borderWidth:2,shape:'rectangle',label:'Area'},style:{width:currentArea.width,height:currentArea.height},width:currentArea.width,height:currentArea.height,selected:true,draggable:true,selectable:true};setNodes(nds=>applyNodeChanges([{type:'add',item:newArea}],nds));}setIsDrawingArea(false);setAreaStartPos(null);setCurrentArea(null);document.body.classList.remove('area-drawing-mode');}}}
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
          <Background id="1" gap={10} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.25,backgroundColor:'#E8F5E9'}}/>
          <Background id="2" gap={100} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.25}}/>
          <MiniMap />
          <Controls position="bottom-left" style={{bottom:20,left:20}}/>
          {isDrawingArea&&currentArea&&reactFlowInstance&&(<div className="area-drawing-overlay"style={{position:'absolute',pointerEvents:'none',zIndex:1000,left:`${(currentArea.x*reactFlowInstance.getViewport().zoom)+reactFlowInstance.getViewport().x}px`,top:`${(currentArea.y*reactFlowInstance.getViewport().zoom)+reactFlowInstance.getViewport().y}px`,width:`${currentArea.width*reactFlowInstance.getViewport().zoom}px`,height:`${currentArea.height*reactFlowInstance.getViewport().zoom}px`,border:'2px dashed rgba(59,130,246,1)',backgroundColor:'rgba(59,130,246,0.1)',borderRadius:'4px',boxShadow:'0 0 10px rgba(59,130,246,0.3)',transition:'none'}}/>)}
          {contextMenu.visible&&(<div style={{position:'fixed',left:contextMenu.x,top:contextMenu.y,background:'white',border:'1px solid #ddd',zIndex:1000,padding:'0px',borderRadius:'8px',boxShadow:'0 4px 10px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column',gap:'0px',minWidth:'180px',overflow:'hidden',transform:'translate(8px, 8px)'}}onClick={e=>e.stopPropagation()}onContextMenu={e=>e.preventDefault()}><div style={{padding:'8px 12px',backgroundColor:'#f7f7f7',borderBottom:'1px solid #eee'}}>{!contextMenu.isPane&&contextMenu.nodeId&&(<><p style={{margin:'0 0 2px 0',fontSize:'13px',fontWeight:'bold'}}>{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.label||'Node'}</p><p style={{margin:0,fontSize:'11px',color:'#777'}}>ID: {contextMenu.nodeId}</p><p style={{margin:0,fontSize:'11px',color:'#777'}}>Type: {contextMenu.nodeType} {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider&&(<span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-xs">{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider.toUpperCase()}</span>)}</p></>)}{contextMenu.isPane&&(<>{(()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);return selN.length>0?(<p style={{margin:0,fontSize:'13px',fontWeight:'bold'}}>{selN.length} nodos seleccionados</p>):(<p style={{margin:0,fontSize:'13px',fontWeight:'bold'}}>Canvas Options</p>);})()}</>)}</div><div>{!contextMenu.isPane&&contextMenu.nodeId&&(<>{(()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);return selN.length>1&&selN.some(n=>n.id===contextMenu.nodeId);})()?(<><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)groupSelectedNodes();setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{`📦 Group Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{deleteSelectedElements(); setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Delete Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)moveNodesToBack(selN.map(n=>n.id));setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⬇️ Move Selected to Back</button></>):reactFlowInstance.getNode(contextMenu.nodeId!)?.type==='group'?(<><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n)startEditingGroupName(n.id,n.data?.label||'Group');setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>✏️ Edit Group Name</button><button onClick={()=>{if(contextMenu.nodeId)ungroupNodes(contextMenu.nodeId);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Ungroup</button><button onClick={()=>{if(contextMenu.nodeId)handleDeleteNodeFromContextMenu(contextMenu.nodeId);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Delete Group</button></>):(<><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){setLoadingState(true);setIsExecutionLogVisible(true);simulateNodeExecution(n as NodeWithExecutionStatus,'creating').then(()=>simulateNodeExecution(n as NodeWithExecutionStatus,'success')).finally(()=>setLoadingState(false));}setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>▶️ Run Node</button><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){const np:SingleNodePreview={action:'create',resource:{name:n.data?.label||'Unnamed',type:n.type||'unknown',provider:n.data?.provider||'generic',changes:{properties:{label:{after:n.data?.label||'Unnamed',action:'create'},description:{after:n.data?.description||'',action:'create'},provider:{after:n.data?.provider||'generic',action:'create'},status:{after:n.data?.status||'success',action:'create'},lastUpdated:{after:n.data?.lastUpdated||new Date().toISOString(),action:'create'},version:{after:n.data?.version||1,action:'create'}}}},dependencies:n.data?.dependencies?.map((d:Dependency)=>({name:d.name,type:d.type,action:'create',properties:{...Object.entries(d).reduce((acc:Record<string,any>,[k,v])=>{if(k!=='name'&&k!=='type')acc[k]={after:v,action:'create'};return acc;},{})}}))||[],estimated_cost:n.data?.estimated_cost};setSingleNodePreview(np);setShowSingleNodePreview(true);}setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>👁️ Preview</button><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){const ev=new CustomEvent('openIaCPanel',{detail:{nodeId:n.id,resourceData:{label:n.data.label,provider:n.data.provider,resourceType:n.data.resourceType}}});window.dispatchEvent(ev);document.dispatchEvent(ev);}setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⚙️ Configuración</button></>)}{!(selectedNodes.length>1&&selectedNodes.some(n=>n.id===contextMenu.nodeId))&&(<button onClick={()=>{if(contextMenu.nodeId)handleDeleteNodeFromContextMenu(contextMenu.nodeId);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Delete Node</button>)}</>)}{contextMenu.isPane&&(<>{(()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);return selN.length>0;})()?(<><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)groupSelectedNodes();setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{`📦 Group Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{ungroupNodes(); setContextMenu(p=>({...p,visible:false}));}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Ungroup Selected Nodes</button><button onClick={()=>{deleteSelectedElements(); setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Delete Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)moveNodesToBack(selN.map(n=>n.id));setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⬇️ Move Selected to Back</button></>):(<><button onClick={()=>{createEmptyGroup();setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📦 Create Empty Group</button><button onClick={()=>{setSidebarOpen(true);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📚 Show Resources Panel</button></>)}</>)}{contextMenu.customItems&&(<>{contextMenu.customItems.map((item,idx)=>(<button key={idx}onClick={()=>{item.onClick();setContextMenu(p=>({...p,visible:false}));}}style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:idx<(contextMenu.customItems?.length||0)-1?'1px solid #eee':'none',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{item.icon}{item.label}</button>))}</>)}</div></div>)}
          {selectedEdge&&<EdgeDeleteButton edge={selectedEdge}onEdgeDelete={onEdgeDelete}/>}
          {/* Barra de herramientas principal - Fija y con estilo similar a GroupFocusView */}
          <div 
            className="absolute top-4 left-4 z-10 bg-white p-1 rounded-md shadow-lg flex items-center gap-1 border border-gray-200" // Estilos base
            style={{ flexDirection: toolbarLayout === 'horizontal' ? 'row' : 'column' }}
            onMouseDown={e => e.stopPropagation()} 
          >
            {/* Botón para cambiar orientación */}
            <button 
              onClick={() => {
                const newLayout = toolbarLayout === 'horizontal' ? 'vertical' : 'horizontal';
                setToolbarLayout(newLayout);
                localStorage.setItem('toolbarLayout', newLayout); // Guardar preferencia
              }}
              title={toolbarLayout === 'horizontal' ? "Cambiar a barra vertical" : "Cambiar a barra horizontal"}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
            >
              <ArrowsUpDownIcon className="h-5 w-5" />
            </button>

            {/* Botón de Guardar (opcional, si se quiere mantener visible) */}
            <button 
              onClick={saveCurrentDiagramState} 
              title="Guardar estado actual (zoom y posición)"
              className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded flex items-center justify-center"
            >
              {/* Usar un ícono SVG o un HeroIcon si está disponible, por ahora texto */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>

            {/* Herramientas principales */}
            <button onClick={()=>handleToolClick('select')} title="Select (V)" className={`p-1.5 hover:bg-gray-200 rounded ${activeTool==='select'?'bg-blue-100 text-blue-700 ring-1 ring-blue-500':'text-gray-600'}`}><CursorArrowRaysIcon className="h-5 w-5"/></button>
            <button onClick={()=>handleToolClick('lasso')} title="Lasso Select (Shift+S)" className={`p-1.5 hover:bg-gray-200 rounded ${activeTool==='lasso'?'bg-blue-100 text-blue-700 ring-1 ring-blue-500':'text-gray-600'}`}><SwatchIcon className="h-5 w-5"/></button>
            <button onClick={()=>handleToolClick('note')} onMouseDown={e=>e.preventDefault()} draggable onDragStart={e=>{e.stopPropagation();onDragStartSidebar(e,{type:'note',name:'New Note',description:'Add a note',provider:'generic'});}} title="Add Note (N)" className={`p-1.5 hover:bg-gray-200 rounded ${activeTool==='note'?'bg-blue-100 text-blue-700 ring-1 ring-blue-500':'text-gray-600'}`}><DocumentTextIcon className="h-5 w-5"/></button>
            <button onClick={()=>handleToolClick('text')} onMouseDown={e=>e.preventDefault()} draggable onDragStart={e=>{e.stopPropagation();onDragStartSidebar(e,{type:'text',name:'New Text',description:'Add text',provider:'generic'});}} title="Add Text (T)" className={`p-1.5 hover:bg-gray-200 rounded ${activeTool==='text'?'bg-blue-100 text-blue-700 ring-1 ring-blue-500':'text-gray-600'}`}><PencilIcon className="h-5 w-5"/></button>
            <button onClick={()=>handleToolClick('area')} title="Draw Area (A)" className={`p-1.5 hover:bg-gray-200 rounded ${activeTool==='area'?'bg-blue-100 text-blue-700 ring-1 ring-blue-500':'text-gray-600'}`}><RectangleGroupIcon className="h-5 w-5"/></button>
            <button onClick={()=>createEmptyGroup()} title="Create Group (G)" className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><Square3Stack3DIcon className="h-5 w-5"/></button>
            
            {/* Separador */}
            <div className={`bg-gray-300 ${toolbarLayout === 'horizontal' ? 'w-px h-6 mx-1' : 'h-px w-full my-1'}`}></div>

            {/* Botones de tipo de arista */}
            {Object.values(edgeTypeConfigs).map(cfg => {
              const IconComponent = edgeToolbarIcons[cfg.logicalType];
              const isSelected = selectedLogicalType === cfg.logicalType;
              return (
                <Tooltip title={`Edge: ${cfg.label}`} placement="bottom" key={cfg.logicalType}>
                  <button
                    onClick={() => handleEdgeTypeSelect(cfg.logicalType)}
                    className={`p-1.5 rounded hover:bg-gray-200 ${isSelected ? 'bg-blue-100 ring-1 ring-blue-500' : 'bg-transparent'}`}
                    style={{ color: isSelected ? cfg.style?.stroke || 'blue' : cfg.style?.stroke || 'black' }}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                  </button>
                </Tooltip>
              );
            })}
          </div>
          
          {!sidebarOpen&&(<Panel position="top-right"><button style={{padding:'10px 14px',background:'rgba(255,255,255,0.95)',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',border:'1px solid rgba(0,0,0,0.05)',transition:'background-color 0.2s, box-shadow 0.2s'}}onClick={()=>setSidebarOpen(true)}onMouseOver={e=>{e.currentTarget.style.backgroundColor='rgba(245,245,245,0.95)';e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,0.15)';}}onMouseOut={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.95)';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';}}title="Mostrar Panel de Recursos"><SquaresPlusIcon className="h-5 w-5 text-gray-700"/><span style={{fontSize:'14px',fontWeight:500,color:'#333'}}>Recursos</span></button></Panel>)}
          {sidebarOpen&&(<Panel position="top-right"style={{width:'360px',background:'rgba(255,255,255,0.9)',padding:'0',borderRadius:'12px 0 0 12px',height:'calc(100vh - 7.5rem)',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column',position:'fixed',top:'7.5rem',right:'0px',zIndex:9999,transform:'none',transition:'transform 0.3s ease-out, opacity 0.3s ease-out, width 0.3s ease-out',backdropFilter:'blur(10px)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid rgba(230,230,230,0.9)',flexShrink:0,minHeight:'56px',backgroundColor:'rgba(250,250,250,0.95)',borderTopLeftRadius:'12px',borderTopRightRadius:'12px'}}><h4 style={{margin:0,fontSize:'16px',fontWeight:'600',color:'#333'}}>Recursos</h4><button onClick={()=>setSidebarOpen(false)}style={{border:'none',background:'transparent',cursor:'pointer',width:'28px',height:'28px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',transition:'background-color 0.2s',color:'#555'}}title="Ocultar Panel de Recursos"onMouseOver={e=>(e.currentTarget.style.backgroundColor='#e9e9e9')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='transparent')}><XMarkIcon className="w-5 h-5"/></button></div><div style={{padding:'12px 16px',borderBottom:'1px solid rgba(230,230,230,0.9)',backgroundColor:'rgba(250,250,250,0.95)'}}><input type="text"placeholder="Buscar recursos..."value={searchTerm}onChange={e=>setSearchTerm(e.target.value)}style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',outline:'none',boxShadow:'inset 0 1px 2px rgba(0,0,0,0.075)'}}/></div><div style={{overflowY:'auto',overflowX:'hidden',flexGrow:1,display:'flex',flexDirection:'column',backgroundColor:'rgba(255,255,255,0.9)',paddingBottom:'16px',scrollbarWidth:'thin',scrollbarColor:'#ccc #f1f1f1'}}>{resourceCategories.map(c=>({...c,items:c.items.filter(i=>i.name.toLowerCase().includes(searchTerm.toLowerCase())||i.description.toLowerCase().includes(searchTerm.toLowerCase()))})).filter(c=>c.items.length>0).map(cat=>(<div key={cat.name}style={{borderBottom:'1px solid #f0f0f0'}}><h5 onClick={()=>setCollapsedCategories(p=>({...p,[cat.name]:!p[cat.name]}))}style={{cursor:'pointer',margin:0,padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'14px',fontWeight:'600',backgroundColor:collapsedCategories[cat.name]?'#ffffff':'#f8f8f8',transition:'background-color 0.2s'}}onMouseOver={e=>{if(!collapsedCategories[cat.name])return;e.currentTarget.style.backgroundColor='#f5f5f5';}}onMouseOut={e=>{if(!collapsedCategories[cat.name])return;e.currentTarget.style.backgroundColor='#ffffff';}}><span>{cat.name}</span><span style={{color:'#666'}}>{collapsedCategories[cat.name]?'▸':'▾'}</span></h5>{!collapsedCategories[cat.name]&&(<ul style={{listStyleType:'none',padding:'2px 0',margin:0,backgroundColor:'#fdfdfd',maxHeight:'none',overflowY:'visible',position:'relative',zIndex:10001}}>{cat.items.map(item=>(<li key={cat.name+'-'+item.type+'-'+item.name}draggable onDragStart={e=>onDragStartSidebar(e,item)}style={{padding:'6px 16px',margin:'0',cursor:'grab',display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#444',transition:'background-color 0.15s'}}onMouseOver={e=>{e.currentTarget.style.backgroundColor='#f0f0f0'}}onMouseOut={e=>{e.currentTarget.style.backgroundColor='transparent'}}><div style={{minWidth:'24px',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'8px'}}>{item.icon?React.cloneElement(item.icon,{className:'w-5 h-5 text-gray-500'}):<ServerIcon className="w-5 h-5 text-gray-400"/>}</div><div style={{flex:1}}><span style={{fontWeight:'500'}}>{item.name}</span><p style={{fontSize:'11px',color:'#777',margin:'2px 0 0 0',lineHeight:'1.3'}}>{item.description}</p></div></li>))}</ul>)}</div>))}</div></Panel>)}
        </ReactFlow>
      </div>
      <div className={`fixed inset-y-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${showLogs ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '480px' }}>
        <ExecutionLog isVisible={showLogs} logs={executionLogs} onClose={() => setShowLogs(false)} previewData={previewData} />
      </div>
    </div>
  );
};

const FlowEditor: React.FC<FlowEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SelectedEdgeTypeProvider>
        <FlowEditorContent {...props} />
      </SelectedEdgeTypeProvider>
    </ReactFlowProvider>
  );
};

export default FlowEditor;
