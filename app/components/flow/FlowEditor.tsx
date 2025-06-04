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
import { LogicalEdgeType, edgeTypeConfigs, EdgeTypeConfig, CustomEdgeData, getEdgeConfig } from '@/app/config/edgeConfig';
import { Diagram } from '@/app/services/diagramService';
import nodeTypesFromFile from '../nodes/NodeTypes'; 
import { NodeExecutionState, NodeWithExecutionStatus } from '../../utils/customTypes';
import ExecutionLog from './ExecutionLog';
import GroupFocusView from './GroupFocusView'; // Importar el nuevo componente

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
  applyEdgeChanges,
  addEdge, 
} = ReactFlowLibrary;

type Edge = ReactFlowLibrary.Edge<CustomEdgeData>;
type EdgeTypes = ReactFlowLibrary.EdgeTypes;
type Node = ReactFlowLibrary.Node;
type ReactFlowNodeTypes = ReactFlowLibrary.NodeTypes;
type OnConnect = ReactFlowLibrary.OnConnect;
type OnEdgesChange = ReactFlowLibrary.OnEdgesChange;
type OnNodesChange = ReactFlowLibrary.OnNodesChange;
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

export interface ResourceItem { // Exportar interfaz
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

// Exportar ResourceCategory también si GroupFocusView la necesita directamente para su prop
export type { ResourceCategory }; // Re-exportar el tipo si ya está definido arriba o definir y exportar

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
  diagramId,
  initialDiagram,
}: FlowEditorProps): JSX.Element => {
  
  const memoizedNodeTypes: ReactFlowNodeTypes = useMemo(() => ({ ...nodeTypesFromFile, ...externalNodeTypes, note: nodeTypesFromFile.noteNode, text: nodeTypesFromFile.textNode }), [externalNodeTypes]);
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
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
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null); // Nuevo estado para la vista de grupo expandida

  // Constantes para el layout de la vista expandida del grupo
  const GROUP_HEADER_HEIGHT = 40; 
  const CHILD_NODE_PADDING_X = 20;
  const CHILD_NODE_PADDING_Y = 15;
  const CHILD_NODE_HEIGHT = 50; 
  const MIN_EXPANDED_GROUP_WIDTH = 250;
  const MIN_EXPANDED_GROUP_HEIGHT = 150;

  const handleSaveChangesInGroup = useCallback((updatedNodesInGroup: Node[], newEdgesInGroup: Edge[]) => {
    setNodes(currentNodes => {
      const otherNodes = currentNodes.filter(n => n.parentId !== expandedGroupId && n.id !== expandedGroupId);
      const groupNodeFromState = currentNodes.find(n => n.id === expandedGroupId);
      
      const finalUpdatedNodes = updatedNodesInGroup.map(un => ({
        ...un,
        parentId: expandedGroupId!,
        extent: 'parent' as const,
        // hidden: true, // Dejar que handleCollapseGroupView maneje el estado 'hidden' final
      }));

      // Asegurar que el groupNode principal también se actualice para no estar en isExpandedView
      const updatedGroupNode = groupNodeFromState ? {
        ...groupNodeFromState,
        data: {
          ...groupNodeFromState.data,
          isExpandedView: false, // El grupo ya no está en "vista detallada"
          isMinimized: groupNodeFromState.data.isMinimized, // Mantener estado de minimizado
        },
      } : undefined;

      return [...otherNodes, ...(updatedGroupNode ? [updatedGroupNode] : []), ...finalUpdatedNodes];
    });

    setEdges(currentEdges => {
      // Eliminar aristas antiguas que estaban solo entre los nodos del grupo
      const childNodeIdsInGroup = new Set(updatedNodesInGroup.map(n => n.id));
      const edgesOutsideGroupOrNotRelated = currentEdges.filter(edge => 
        !childNodeIdsInGroup.has(edge.source) || !childNodeIdsInGroup.has(edge.target)
      );
      // Añadir las nuevas/actualizadas aristas del grupo
      return [...edgesOutsideGroupOrNotRelated, ...newEdgesInGroup];
    });

  }, [setNodes, setEdges, expandedGroupId]);


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
    const move = (e: MouseEvent) => { if(isToolbarDragging) setToolbarPosition({ x: e.clientX - dragStartOffset.x, y: e.clientY - dragStartOffset.y }); };
    const up = () => setIsToolbarDragging(false);
    if (isToolbarDragging) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isToolbarDragging, dragStartOffset]);

  useEffect(() => {
    if (initialViewport && reactFlowInstance) {
      const rfVp = reactFlowInstance.getViewport();
      if (rfVp.x !== initialViewport.x || rfVp.y !== initialViewport.y || rfVp.zoom !== initialViewport.zoom) {
        const tId = setTimeout(() => { if (reactFlowInstance?.getViewport?.().zoom !== 0) { reactFlowInstance.setViewport(initialViewport); lastViewportRef.current = initialViewport; } }, 50);
        return () => clearTimeout(tId);
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

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (onSaveRef.current && reactFlowInstance && !isDragging) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => { const flow = reactFlowInstance.toObject(); onSaveRef.current?.(flow); }, 1000);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [nodes, edges, reactFlowInstance, isDragging]);

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

  const handleExpandGroupView = useCallback((groupId: string) => {
    // Nueva lógica: Simplemente establece el ID del grupo que se va a expandir en un "nuevo stage"
    setExpandedGroupId(groupId);
    // Opcionalmente, actualiza el nodo de grupo en el canvas principal para indicar que está "enfocado"
    // Esto podría ser útil si el canvas principal sigue visible de alguna manera.
    // Por ahora, nos centraremos en cambiar la vista.
    // La lógica anterior de redimensionamiento y organización de hijos se manejará
    // dentro de la nueva vista de grupo o al entrar/salir de ella.
    setNodes(nds => nds.map(n => n.id === groupId ? { ...n, data: { ...n.data, isExpandedView: true, isMinimized: false } } : n));

  }, [setNodes, setExpandedGroupId]); // reactFlowInstance no es necesario aquí si solo actualizamos estado

  const handleCollapseGroupView = useCallback((groupIdToCollapse: string) => {
    // Si se está colapsando un grupo que no es el actualmente expandido en GroupFocusView,
    // simplemente se actualiza su estado en el canvas principal (lógica original).
    // Si es el mismo, se cierra GroupFocusView.
    if (expandedGroupId && expandedGroupId !== groupIdToCollapse) {
        // Lógica para colapsar un grupo en el canvas principal que no está en GroupFocusView
        // (Esta es la lógica que tenías antes para el colapso in-canvas)
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
                style: { ...n.style, width: defaultWidth, height: defaultHeight }, 
              };
            }
            if (n.parentId === groupIdToCollapse) {
               return { ...n, hidden: true }; 
            }
            return n;
          })
        );
        return; // Salir para no afectar expandedGroupId
    }
    
    // Si estamos cerrando la vista de GroupFocusView (expandedGroupId === groupIdToCollapse)
    setExpandedGroupId(null);

    // Restaurar el estado del nodo de grupo en el canvas principal y ocultar sus hijos
    setNodes(nds =>
      nds.map(n => {
        if (n.id === groupIdToCollapse) {
          return {
            ...n,
            data: { ...n.data, isExpandedView: false }, // Asegurar que isExpandedView sea false
          };
        }
        if (n.parentId === groupIdToCollapse) {
          return { ...n, hidden: true }; // Ocultar siempre los hijos al colapsar/cerrar GroupFocusView
        }
        return n;
      })
    );
  }, [reactFlowInstance, setNodes, expandedGroupId, setExpandedGroupId]);


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

  const handleToolClick = useCallback((tool:ToolType)=>{ if(tool===activeTool&&tool!=='lasso'&&tool!=='area')return; document.body.classList.remove('lasso-selection-mode','area-drawing-mode');document.body.style.cursor='default'; if(tool==='lasso'){document.body.classList.add('lasso-selection-mode');document.body.style.cursor='crosshair';reactFlowInstance.setNodes(ns=>ns.map(n=>({...n,selected:false,selectable:true})));}else if(tool==='area'){document.body.classList.add('area-drawing-mode');document.body.style.cursor='crosshair';reactFlowInstance.setNodes(ns=>ns.map(n=>({...n,selected:false})));}else if(tool==='note'||tool==='text'){document.body.style.cursor='crosshair';} setActiveTool(tool); const lStyle=document.getElementById('lasso-select-compatibility'); if(tool==='lasso'&&!lStyle){const s=document.createElement('style');s.id='lasso-select-compatibility';s.innerHTML=`.react-flow__node{pointer-events:all !important;}.lasso-selection-mode .react-flow__pane{cursor:crosshair !important;}`;document.head.appendChild(s);}else if(tool!=='lasso'&&lStyle){lStyle.remove();}},[activeTool,reactFlowInstance,setActiveTool]);
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
            // No position/extent needed if hidden and listed by GroupNode
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
          setTimeout(()=>handleExpandGroupView(newNodeToAdd.parentId!),0);
        }
      }
      setActiveTool('select');
      document.body.style.cursor='default';
    }catch(err){
      console.error("Error drop:",err);
    }
  },[reactFlowInstance,findGroupAtPosition,setNodes,activeDrag,activeTool,setActiveTool, handleExpandGroupView]);

  const saveCurrentDiagramState=useCallback(()=>{if(!reactFlowInstance||!onSaveRef.current)return;const flow=reactFlowInstance.toObject();console.log('Saving viewport:',flow.viewport);lastViewportRef.current=flow.viewport;onSaveRef.current(flow);previousNodesRef.current=JSON.stringify(flow.nodes);previousEdgesRef.current=JSON.stringify(flow.edges);},[reactFlowInstance]);
  useEffect(()=>{if(!reactFlowInstance||!onSaveRef.current)return;const nJSON=JSON.stringify(nodes);const eJSON=JSON.stringify(edges);if(nJSON!==previousNodesRef.current||eJSON!==previousEdgesRef.current){if(saveTimeoutRef.current)clearTimeout(saveTimeoutRef.current);saveTimeoutRef.current=setTimeout(saveCurrentDiagramState,1000);}},[nodes,edges,reactFlowInstance,isDragging,saveCurrentDiagramState]);
  useEffect(()=>{const kd=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;switch(e.key.toLowerCase()){case'v':handleToolClick('select');break;case'n':handleToolClick('note');break;case't':handleToolClick('text');break;case'a':if(!e.shiftKey&&!e.ctrlKey&&!e.metaKey)handleToolClick('area');break;case'g':if(!e.shiftKey&&!e.ctrlKey&&!e.metaKey)createEmptyGroup();break;case's':if(e.shiftKey)handleToolClick('lasso');break;}};document.addEventListener('keydown',kd);return()=>document.removeEventListener('keydown',kd);},[handleToolClick,createEmptyGroup]);
  const renderEditGroupModal=()=>{if(!editingGroup)return null;return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}onClick={()=>setEditingGroup(null)}><div style={{backgroundColor:'white',padding:'20px',borderRadius:'8px',width:'300px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}onClick={e=>e.stopPropagation()}><h3 style={{marginTop:0,marginBottom:'16px',fontSize:'16px'}}>Edit Group Name</h3><input type="text"defaultValue={editingGroup.label}style={{width:'100%',padding:'8px 12px',border:'1px solid #ddd',borderRadius:'4px',fontSize:'14px',marginBottom:'16px'}}autoFocus onKeyDown={e=>{if(e.key==='Enter')saveGroupName((e.target as HTMLInputElement).value);if(e.key==='Escape')setEditingGroup(null);}}/><div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}><button onClick={()=>setEditingGroup(null)}style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:'4px',backgroundColor:'#f5f5f5',cursor:'pointer',fontSize:'14px'}}>Cancel</button><button onClick={e=>saveGroupName((e.currentTarget.parentElement?.querySelector('input')as HTMLInputElement).value)}style={{padding:'6px 12px',border:'none',borderRadius:'4px',backgroundColor:'#0088ff',color:'white',cursor:'pointer',fontSize:'14px'}}>Save</button></div></div></div>);};
  const moveNodesToBack=useCallback((ids:string[])=>{const cN=reactFlowInstance.getNodes();const sIds=new Set(ids);const mZ=Math.min(...cN.map(n=>n.zIndex||0));reactFlowInstance.setNodes(cN.map(n=>sIds.has(n.id)?{...n,zIndex:mZ-1}:n)as Node[]);},[reactFlowInstance]);
  const simulateNodeExecution=async(n:NodeWithExecutionStatus,s:NodeExecutionState)=>{setExecutionLogs(p=>[...p,getExecutionMessage(n,s)]);await new Promise(r=>setTimeout(r,1000));};
  const getExecutionMessage=(node:NodeWithExecutionStatus,state:NodeExecutionState):string=>{const n=node as Node;const name=n.data?.label||'Unnamed';const dets=[];if(n.data?.provider)dets.push(`Provider: ${n.data.provider}`);if(n.data?.resourceType)dets.push(`Type: ${n.data.resourceType}`);const detStr=dets.length>0?` (${dets.join(', ')})`:'';switch(state){case'creating':return`Iniciando creación de ${name}${detStr}...`;case'updating':return`Iniciando actualización de ${name}${detStr}...`;case'deleting':return`Iniciando eliminación de ${name}${detStr}...`;case'success':return`${name} procesado exitosamente`;case'error':return`Error al procesar ${name}`;default:return`Procesando ${name}...`;}};
  const handlePreview=useCallback(()=>{if(!currentDiagram)return;try{setIsExecutionLogVisible(true);setExecutionLogs([]);const exN=currentDiagram.nodes.filter(n=>n.type!=='group');(async()=>{for(const n of exN){let s:NodeExecutionState='creating';const d=(n as Node).data;if(d?.status==='creating'||d?.status==='new'||(!d?.status&&d?.isNew))s='creating';else if(d?.status==='updating'||d?.status==='modified'||d?.hasChanges)s='updating';else if(d?.status==='deleting'||d?.status==='toDelete'||d?.markedForDeletion)s='deleting';const name=d?.label||'Unnamed';setExecutionLogs(p=>[...p,`Procesando ${s} para ${name}...`]);await new Promise(r=>setTimeout(r,1000));setExecutionLogs(p=>[...p,`${s} completado para ${name}`,`Costo estimado para ${name}: $${d?.estimated_cost?.monthly||0} USD/mes`]);}})();}catch(err){console.error('Preview Error:',err);message.error('Error en Preview');}},[currentDiagram]);
  const handleRun=useCallback(()=>{if(!currentDiagram)return;try{setIsExecutionLogVisible(true);setExecutionLogs([]);const exN=currentDiagram.nodes.filter(n=>n.type!=='group');(async()=>{for(const n of exN){let s:NodeExecutionState='creating';const d=(n as Node).data;if(d?.status==='creating'||d?.status==='new'||(!d?.status&&d?.isNew))s='creating';else if(d?.status==='updating'||d?.status==='modified'||d?.hasChanges)s='updating';else if(d?.status==='deleting'||d?.status==='toDelete'||d?.markedForDeletion)s='deleting';const name=d?.label||'Unnamed';setExecutionLogs(p=>[...p,`Procesando ${s} para ${name}...`]);await new Promise(r=>setTimeout(r,1000));setExecutionLogs(p=>[...p,`${s} completado para ${name}`,`Costo estimado para ${name}: $${d?.estimated_cost?.monthly||0} USD/mes`]);}})();}catch(err){console.error('Run Error:',err);message.error('Error en Run');}},[currentDiagram]);
  useEffect(()=>{const h=(e:Event)=>{setSingleNodePreview((e as CustomEvent<SingleNodePreview>).detail);setShowSingleNodePreview(true);};window.addEventListener('showSingleNodePreview',h);return()=>window.removeEventListener('showSingleNodePreview',h);},[]);
  const handleApplyChanges=async()=>{if(!singleNodePreview)return;try{setLoadingState(true);setShowLogs(true);setExecutionLogs([]);setExecutionLogs(p=>[...p,`Procesando ${singleNodePreview.action} del recurso ${singleNodePreview.resource.name}`]);await new Promise(r=>setTimeout(r,1500));setExecutionLogs(p=>[...p,`Recurso ${singleNodePreview.resource.name} ${singleNodePreview.action==='create'?'creado':singleNodePreview.action==='update'?'actualizado':'eliminado'} exitosamente`]);if(singleNodePreview.estimated_cost)setExecutionLogs(p=>[...p,`Costo estimado: ${singleNodePreview.estimated_cost?.currency} ${singleNodePreview.estimated_cost?.monthly?.toFixed(2)}`]);if(singleNodePreview.dependencies?.length>0){setExecutionLogs(p=>[...p,`Procesando ${singleNodePreview.dependencies.length} dependencias...`]);for(const d of singleNodePreview.dependencies){setExecutionLogs(p=>[...p,`Procesando dependencia: ${d.name} (${d.type}) - ${d.action==='create'?'Creando':d.action==='update'?'Actualizando':'Eliminando'}`]);await new Promise(r=>setTimeout(r,500));setExecutionLogs(p=>[...p,`Dependencia ${d.name} procesada exitosamente`]);}}}catch(err){console.error('ApplyChanges Error:',err);setExecutionLogs(p=>[...p,`Error: ${err instanceof Error?err.message:'Unknown'}`]);message.error('Error ApplyChanges');}finally{setLoadingState(false);setShowSingleNodePreview(false);setSingleNodePreview(null);}};

  // Si expandedGroupId tiene un valor, renderizamos la vista de enfoque del grupo
  if (expandedGroupId) {
    return (
      <GroupFocusView
        focusedGroupId={expandedGroupId}
        allNodes={nodes}
        allEdges={edges}
        onClose={() => {
          // La lógica de 'handleCollapseGroupView' se encarga de limpiar expandedGroupId
          // y actualizar el nodo grupo principal.
          if (expandedGroupId) { // Verificar por si acaso
             handleCollapseGroupView(expandedGroupId);
          }
        }}
        onSaveChanges={handleSaveChangesInGroup}
        mainNodeTypes={memoizedNodeTypes}
        mainEdgeTypes={edgeTypes}
        // Props para la barra de herramientas interna de GroupFocusView
        edgeTypeConfigs={edgeTypeConfigs} // Pasar la configuración de tipos de arista
        edgeToolbarIcons={edgeToolbarIcons} // Pasar los iconos de la barra de herramientas de aristas
        resourceCategories={resourceCategories} // Pasar las categorías de recursos para el sidebar
        // initialViewport={ { x:0, y:0, zoom:1 }} // Opcional: definir un viewport inicial para la vista de grupo
      />
    );
  }

  // Renderizado normal del FlowEditor
  return (
    <div className="relative w-full h-full">
      {renderEditGroupModal()}
      <div style={{ height: '100%', width: '100%' }} ref={reactFlowWrapper}>
        <style>{`.react-flow__pane{cursor:${activeTool==='note'||activeTool==='text'||activeTool==='area'||activeTool==='lasso'?'crosshair':'default'};}.react-flow__node,.react-flow__node:active,.react-flow__node:hover,.react-flow__node[data-dragging="true"],.react-flow__node[data-selected="true"],.react-flow__node[data-selected="true"]:active,.react-flow__node[data-selected="true"]:hover,.note-node,.note-node:hover,.note-node:active,.note-node[data-selected="true"],.note-node[data-selected="true"]:hover,.note-node[data-selected="true"]:active{cursor:move !important;}.area-node{background-color:rgba(59,130,246,0.1)!important;border:1px solid rgba(59,130,246,0.5)!important;border-radius:8px !important;}.area-node:hover{background-color:rgba(59,130,246,0.15)!important;border:1px solid rgba(59,130,246,0.6)!important;}.area-node[data-selected="true"]{background-color:rgba(59,130,246,0.2)!important;border:1px solid rgba(59,130,246,0.7)!important;}`}</style>
        <ReactFlow
          defaultViewport={initialViewport || { x: 0, y: 0, zoom: 1 }}
          minZoom={0.1} maxZoom={2} deleteKeyCode={[]} noDragClassName="nodrag"
          nodes={nodes} edges={edges} nodeTypes={memoizedNodeTypes} edgeTypes={edgeTypes}
          onNodesChange={onNodesChangeInternal} onEdgesChange={onEdgesChangeInternal}
          onConnect={onConnectInternal} 
          onPaneClick={handlePaneClick} onEdgeClick={onEdgeClick}
          onNodeContextMenu={handleNodeContextMenu} onPaneContextMenu={handlePaneContextMenu}
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
                  let newPosition = n.position; // Por defecto, mantener la posición si no se expande
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
          onDrop={onDrop} onDragOver={onDragOver} onDragEnd={onDragEnd}
          elementsSelectable={true} nodesDraggable={activeTool!=='area'} nodesConnectable={true}
          panOnDrag={activeTool!=='lasso'&&activeTool!=='area'} panOnScroll={true} zoomOnScroll={true} zoomOnPinch={true} zoomOnDoubleClick={false}
          selectionOnDrag={activeTool==='lasso'} selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Shift']} snapToGrid={false} nodeDragThreshold={5}
        >
          <Background id="1" gap={10} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.25,backgroundColor:'#E8F5E9'}}/>
          <Background id="2" gap={100} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.25}}/>
          <MiniMap />
          <Controls position="bottom-left" style={{bottom:20,left:20}}/>
          {isDrawingArea&&currentArea&&reactFlowInstance&&(<div className="area-drawing-overlay"style={{position:'absolute',pointerEvents:'none',zIndex:1000,left:`${(currentArea.x*reactFlowInstance.getViewport().zoom)+reactFlowInstance.getViewport().x}px`,top:`${(currentArea.y*reactFlowInstance.getViewport().zoom)+reactFlowInstance.getViewport().y}px`,width:`${currentArea.width*reactFlowInstance.getViewport().zoom}px`,height:`${currentArea.height*reactFlowInstance.getViewport().zoom}px`,border:'2px dashed rgba(59,130,246,1)',backgroundColor:'rgba(59,130,246,0.1)',borderRadius:'4px',boxShadow:'0 0 10px rgba(59,130,246,0.3)',transition:'none'}}/>)}
          {contextMenu.visible&&(<div style={{position:'fixed',left:contextMenu.x,top:contextMenu.y,background:'white',border:'1px solid #ddd',zIndex:1000,padding:'0px',borderRadius:'8px',boxShadow:'0 4px 10px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column',gap:'0px',minWidth:'180px',overflow:'hidden',transform:'translate(8px, 8px)'}}onClick={e=>e.stopPropagation()}onContextMenu={e=>e.preventDefault()}><div style={{padding:'8px 12px',backgroundColor:'#f7f7f7',borderBottom:'1px solid #eee'}}>{!contextMenu.isPane&&contextMenu.nodeId&&(<><p style={{margin:'0 0 2px 0',fontSize:'13px',fontWeight:'bold'}}>{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.label||'Node'}</p><p style={{margin:0,fontSize:'11px',color:'#777'}}>ID: {contextMenu.nodeId}</p><p style={{margin:0,fontSize:'11px',color:'#777'}}>Type: {contextMenu.nodeType} {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider&&(<span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-xs">{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider.toUpperCase()}</span>)}</p></>)}{contextMenu.isPane&&(<>{(()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);return selN.length>0?(<p style={{margin:0,fontSize:'13px',fontWeight:'bold'}}>{selN.length} nodos seleccionados</p>):(<p style={{margin:0,fontSize:'13px',fontWeight:'bold'}}>Canvas Options</p>);})()}</>)}</div><div>{!contextMenu.isPane&&contextMenu.nodeId&&(<>{(()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);return selN.length>1&&selN.some(n=>n.id===contextMenu.nodeId);})()?(<><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)groupSelectedNodes();setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{`📦 Group Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{deleteSelectedElements(); setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Delete Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)moveNodesToBack(selN.map(n=>n.id));setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⬇️ Move Selected to Back</button></>):reactFlowInstance.getNode(contextMenu.nodeId!)?.type==='group'?(<><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n)startEditingGroupName(n.id,n.data?.label||'Group');setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>✏️ Edit Group Name</button><button onClick={()=>{if(contextMenu.nodeId)ungroupNodes(contextMenu.nodeId);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Ungroup</button><button onClick={()=>{if(contextMenu.nodeId)handleDeleteNodeFromContextMenu(contextMenu.nodeId);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Delete Group</button></>):(<><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){setLoadingState(true);setIsExecutionLogVisible(true);simulateNodeExecution(n as NodeWithExecutionStatus,'creating').then(()=>simulateNodeExecution(n as NodeWithExecutionStatus,'success')).finally(()=>setLoadingState(false));}setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>▶️ Run Node</button><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){const np:SingleNodePreview={action:'create',resource:{name:n.data?.label||'Unnamed',type:n.type||'unknown',provider:n.data?.provider||'generic',changes:{properties:{label:{after:n.data?.label||'Unnamed',action:'create'},description:{after:n.data?.description||'',action:'create'},provider:{after:n.data?.provider||'generic',action:'create'},status:{after:n.data?.status||'success',action:'create'},lastUpdated:{after:n.data?.lastUpdated||new Date().toISOString(),action:'create'},version:{after:n.data?.version||1,action:'create'}}}},dependencies:n.data?.dependencies?.map((d:Dependency)=>({name:d.name,type:d.type,action:'create',properties:{...Object.entries(d).reduce((acc:Record<string,any>,[k,v])=>{if(k!=='name'&&k!=='type')acc[k]={after:v,action:'create'};return acc;},{})}}))||[],estimated_cost:n.data?.estimated_cost};setSingleNodePreview(np);setShowSingleNodePreview(true);}setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>👁️ Preview</button><button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){const ev=new CustomEvent('openIaCPanel',{detail:{nodeId:n.id,resourceData:{label:n.data.label,provider:n.data.provider,resourceType:n.data.resourceType}}});window.dispatchEvent(ev);document.dispatchEvent(ev);}setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⚙️ Configuración</button></>)}{!(selectedNodes.length>1&&selectedNodes.some(n=>n.id===contextMenu.nodeId))&&(<button onClick={()=>{if(contextMenu.nodeId)handleDeleteNodeFromContextMenu(contextMenu.nodeId);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Delete Node</button>)}</>)}{contextMenu.isPane&&(<>{(()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);return selN.length>0;})()?(<><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)groupSelectedNodes();setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{`📦 Group Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{ungroupNodes(); setContextMenu(p=>({...p,visible:false}));}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Ungroup Selected Nodes</button><button onClick={()=>{deleteSelectedElements(); setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Delete Selected Nodes (${reactFlowInstance.getNodes().filter(n=>n.selected).length})`}</button><button onClick={()=>{const selN=reactFlowInstance.getNodes().filter(n=>n.selected);if(selN.length>0)moveNodesToBack(selN.map(n=>n.id));setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⬇️ Move Selected to Back</button></>):(<><button onClick={()=>{createEmptyGroup();setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📦 Create Empty Group</button><button onClick={()=>{setSidebarOpen(true);setContextMenu(p=>({...p,visible:false}));}}style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📚 Show Resources Panel</button></>)}</>)}{contextMenu.customItems&&(<>{contextMenu.customItems.map((item,idx)=>(<button key={idx}onClick={()=>{item.onClick();setContextMenu(p=>({...p,visible:false}));}}style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:idx<(contextMenu.customItems?.length||0)-1?'1px solid #eee':'none',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{item.icon}{item.label}</button>))}</>)}</div></div>)}
          {selectedEdge&&<EdgeDeleteButton edge={selectedEdge}onEdgeDelete={onEdgeDelete}/>}
          <div style={{position:'absolute',top:`${toolbarPosition.y}px`,left:`${toolbarPosition.x}px`,zIndex:10,background:'rgba(255,255,255,0.9)',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}><Panel position="top-left"style={{all:'unset',display:'flex'}}><div style={{display:'flex',flexDirection:toolbarLayout==='horizontal'?'row':'column',alignItems:'center',gap:'8px',padding:'5px'}}onMouseDown={e=>e.stopPropagation()}><button onMouseDown={e=>{e.stopPropagation();setIsToolbarDragging(true);setDragStartOffset({x:e.clientX-toolbarPosition.x,y:e.clientY-toolbarPosition.y});}}title="Drag Toolbar"style={{cursor:isToolbarDragging?'grabbing':'grab',padding:'4px',background:'transparent',border:'none',display:'flex',alignItems:'center',justifyContent:'center',order:toolbarLayout==='horizontal'?-2:0}}><ArrowsPointingOutIcon className="h-5 w-5 text-gray-500"/></button><button onClick={()=>{const nL=toolbarLayout==='horizontal'?'vertical':'horizontal';setToolbarLayout(nL);if(nL==='vertical')setToolbarPosition({x:20,y:70});else setToolbarPosition({x:(typeof window!=='undefined'?window.innerWidth/2-200:400),y:20});}}title={toolbarLayout==='horizontal'?"Switch to Vertical Toolbar":"Switch to Horizontal Toolbar"}style={{background:'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s',order:toolbarLayout==='horizontal'?-1:0}}><ArrowsUpDownIcon className="h-5 w-5"/></button><button onClick={saveCurrentDiagramState}title="Guardar estado actual (zoom y posición)"style={{background:'#4CAF50',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',color:'white',fontWeight:'bold',fontSize:'16px'}}>💾</button><button onClick={()=>handleToolClick('select')}title="Select (V)"style={{background:activeTool==='select'?'#f0f7ff':'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s'}}><CursorArrowRaysIcon className="h-5 w-5"/></button><button onClick={()=>handleToolClick('lasso')}title="Lasso Select (Shift+S)"style={{background:activeTool==='lasso'?'#f0f7ff':'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s'}}><SwatchIcon className="h-5 w-5"/></button><button onClick={()=>handleToolClick('note')}onMouseDown={e=>e.preventDefault()}draggable onDragStart={e=>{e.stopPropagation();onDragStartSidebar(e,{type:'note',name:'New Note',description:'Add a note',provider:'generic'});}}title="Add Note (N) - Click to activate tool or drag to canvas"style={{background:activeTool==='note'?'#f0f7ff':'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s'}}><DocumentTextIcon className="h-5 w-5"/></button><button onClick={()=>handleToolClick('text')}onMouseDown={e=>e.preventDefault()}draggable onDragStart={e=>{e.stopPropagation();onDragStartSidebar(e,{type:'text',name:'New Text',description:'Add text',provider:'generic'});}}title="Add Text (T) - Click to activate tool or drag to canvas"style={{background:activeTool==='text'?'#f0f7ff':'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s'}}><PencilIcon className="h-5 w-5"/></button><button onClick={()=>handleToolClick('area')}title="Draw Area (A) - Click and drag to create areas"style={{background:activeTool==='area'?'#f0f7ff':'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s'}}><RectangleGroupIcon className="h-5 w-5"/></button><button onClick={()=>createEmptyGroup()}title="Create Group (G)"style={{background:'transparent',border:'none',borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s'}}><Square3Stack3DIcon className="h-5 w-5"/></button><div style={{width:toolbarLayout==='horizontal'?'1px':'80%',height:toolbarLayout==='horizontal'?'20px':'1px',backgroundColor:'#e0e0e0',margin:toolbarLayout==='horizontal'?'0 4px':'4px 0'}}/>{Object.values(edgeTypeConfigs).map(cfg=>{const Icon=edgeToolbarIcons[cfg.logicalType];const isSel=selectedLogicalType===cfg.logicalType;return(<Tooltip title={`Edge: ${cfg.label}`}placement="bottom"key={cfg.logicalType}><button onClick={()=>handleEdgeTypeSelect(cfg.logicalType)}style={{background:isSel?cfg.style.stroke:'transparent',color:isSel?'white':cfg.style.stroke,border:`1.5px solid ${cfg.style.stroke}`,borderRadius:'4px',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:'0',transition:'background 0.2s, color 0.2s'}}>{Icon&&<Icon className="h-5 w-5"/>}</button></Tooltip>);})}</div></Panel></div>
          {!sidebarOpen&&(<Panel position="top-right"><button style={{padding:'10px 14px',background:'rgba(255,255,255,0.95)',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',border:'1px solid rgba(0,0,0,0.05)',transition:'background-color 0.2s, box-shadow 0.2s'}}onClick={()=>setSidebarOpen(true)}onMouseOver={e=>{e.currentTarget.style.backgroundColor='rgba(245,245,245,0.95)';e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,0.15)';}}onMouseOut={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.95)';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';}}title="Show Resources Panel"><SquaresPlusIcon className="h-5 w-5 text-gray-700"/><span style={{fontSize:'14px',fontWeight:500,color:'#333'}}>Resources</span></button></Panel>)}
          {sidebarOpen&&(<Panel position="top-right"style={{width:'360px',background:'rgba(255,255,255,0.9)',padding:'0',borderRadius:'12px 0 0 12px',height:'calc(100vh - 7.5rem)',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column',position:'fixed',top:'7.5rem',right:'0px',zIndex:9999,transform:'none',transition:'transform 0.3s ease-out, opacity 0.3s ease-out, width 0.3s ease-out',backdropFilter:'blur(10px)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid rgba(230,230,230,0.9)',flexShrink:0,minHeight:'56px',backgroundColor:'rgba(250,250,250,0.95)',borderTopLeftRadius:'12px',borderTopRightRadius:'12px'}}><h4 style={{margin:0,fontSize:'16px',fontWeight:'600',color:'#333'}}>Resources</h4><button onClick={()=>setSidebarOpen(false)}style={{border:'none',background:'transparent',cursor:'pointer',width:'28px',height:'28px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',transition:'background-color 0.2s',color:'#555'}}title="Hide Resources Panel"onMouseOver={e=>(e.currentTarget.style.backgroundColor='#e9e9e9')}onMouseOut={e=>(e.currentTarget.style.backgroundColor='transparent')}><XMarkIcon className="w-5 h-5"/></button></div><div style={{padding:'12px 16px',borderBottom:'1px solid rgba(230,230,230,0.9)',backgroundColor:'rgba(250,250,250,0.95)'}}><input type="text"placeholder="Buscar recursos..."value={searchTerm}onChange={e=>setSearchTerm(e.target.value)}style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',outline:'none',boxShadow:'inset 0 1px 2px rgba(0,0,0,0.075)'}}/></div><div style={{overflowY:'auto',overflowX:'hidden',flexGrow:1,display:'flex',flexDirection:'column',backgroundColor:'rgba(255,255,255,0.9)',paddingBottom:'16px',scrollbarWidth:'thin',scrollbarColor:'#ccc #f1f1f1'}}>{resourceCategories.map(c=>({...c,items:c.items.filter(i=>i.name.toLowerCase().includes(searchTerm.toLowerCase())||i.description.toLowerCase().includes(searchTerm.toLowerCase()))})).filter(c=>c.items.length>0).map(cat=>(<div key={cat.name}style={{borderBottom:'1px solid #f0f0f0'}}><h5 onClick={()=>setCollapsedCategories(p=>({...p,[cat.name]:!p[cat.name]}))}style={{cursor:'pointer',margin:0,padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'14px',fontWeight:'600',backgroundColor:collapsedCategories[cat.name]?'#ffffff':'#f8f8f8',transition:'background-color 0.2s'}}onMouseOver={e=>{if(!collapsedCategories[cat.name])return;e.currentTarget.style.backgroundColor='#f5f5f5';}}onMouseOut={e=>{if(!collapsedCategories[cat.name])return;e.currentTarget.style.backgroundColor='#ffffff';}}><span>{cat.name}</span><span style={{color:'#666'}}>{collapsedCategories[cat.name]?'▸':'▾'}</span></h5>{!collapsedCategories[cat.name]&&(<ul style={{listStyleType:'none',padding:'2px 0',margin:0,backgroundColor:'#fdfdfd',maxHeight:'none',overflowY:'visible',position:'relative',zIndex:10001}}>{cat.items.map(item=>(<li key={cat.name+'-'+item.type+'-'+item.name}draggable onDragStart={e=>onDragStartSidebar(e,item)}style={{padding:'6px 16px',margin:'0',cursor:'grab',display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#444',transition:'background-color 0.15s'}}onMouseOver={e=>{e.currentTarget.style.backgroundColor='#f0f0f0'}}onMouseOut={e=>{e.currentTarget.style.backgroundColor='transparent'}}><div style={{minWidth:'24px',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'8px'}}>{item.icon?React.cloneElement(item.icon,{className:'w-5 h-5 text-gray-500'}):<ServerIcon className="w-5 h-5 text-gray-400"/>}</div><div style={{flex:1}}><span style={{fontWeight:'500'}}>{item.name}</span><p style={{fontSize:'11px',color:'#777',margin:'2px 0 0 0',lineHeight:'1.3'}}>{item.description}</p></div></li>))}</ul>)}</div>))}</div></Panel>)}
        </ReactFlow>
      </div>
      {runModalVisible&&(<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg shadow-xl"><h3 className="text-lg font-semibold mb-4">Run Deployment</h3><p className="mb-4">Are you sure you want to deploy this diagram?</p><div className="flex justify-end gap-2"><button onClick={()=>setRunModalVisible(false)}className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button><button onClick={handleRun}className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Run</button></div></div></div>)}
      {previewModalVisible&&previewData&&(<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"><div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in"><button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"onClick={()=>setPreviewModalVisible(false)}aria-label="Cerrar">×</button><h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-lg">👁️</span>Vista Previa de Cambios</h2><p className="text-gray-500 mb-6">Revisa los cambios que se aplicarán al ejecutar el diagrama.</p><div className="grid grid-cols-3 gap-4 mb-8 text-center"><div className="bg-green-50 p-4 rounded-lg border border-green-200"><div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2"><span>＋</span>{previewData.resourcesToCreate.length}</div><div className="text-sm text-green-700 mt-1">Recursos a Crear</div></div><div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-2"><span>✎</span>{previewData.resourcesToUpdate.length}</div><div className="text-sm text-yellow-700 mt-1">Recursos a Actualizar</div></div><div className="bg-red-50 p-4 rounded-lg border border-red-200"><div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2"><span>－</span>{previewData.resourcesToDelete.length}</div><div className="text-sm text-red-700 mt-1">Recursos a Eliminar</div></div></div>{previewData.resourcesToCreate.length>0&&(<details open className="mb-6"><summary className="cursor-pointer text-green-700 font-semibold text-lg mb-2 flex items-center gap-2"><span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-lg">＋</span>Recursos a Crear ({previewData.resourcesToCreate.length})</summary><div className="space-y-3 mt-2">{previewData.resourcesToCreate.map(res=>(<div key={res.id}className="bg-white border border-green-200 rounded p-4 shadow-sm"><div className="flex items-center justify-between mb-2"><div><span className="font-bold text-green-700">{res.name}</span><span className="ml-2 text-xs text-gray-500">({res.type})</span></div><div className="flex items-center gap-2"><span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Crear</span><span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{res.provider}</span></div></div><div className="text-xs text-gray-600"><span className="font-medium">Propiedades:</span><pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(res.changes.properties,null,2)}</pre></div></div>))}</div></details>)}{previewData.resourcesToUpdate.length>0&&(<details open className="mb-6"><summary className="cursor-pointer text-yellow-700 font-semibold text-lg mb-2 flex items-center gap-2"><span className="inline-block bg-yellow-100 text-yellow-700 rounded-full px-3 py-1 text-lg">✎</span>Recursos a Actualizar ({previewData.resourcesToUpdate.length})</summary><div className="space-y-3 mt-2">{previewData.resourcesToUpdate.map(res=>(<div key={res.id}className="bg-white border border-yellow-200 rounded p-4 shadow-sm"><div className="flex items-center justify-between mb-2"><div><span className="font-bold text-yellow-700">{res.name}</span><span className="ml-2 text-xs text-gray-500">({res.type})</span></div><div className="flex items-center gap-2"><span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Actualizar</span><span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{res.provider}</span></div></div><div className="text-xs text-gray-600"><span className="font-medium">Cambios:</span><pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(res.changes,null,2)}</pre></div></div>))}</div></details>)}{previewData.resourcesToDelete.length>0&&(<details open className="mb-6"><summary className="cursor-pointer text-red-700 font-semibold text-lg mb-2 flex items-center gap-2"><span className="inline-block bg-red-100 text-red-700 rounded-full px-3 py-1 text-lg">－</span>Recursos a Eliminar ({previewData.resourcesToDelete.length})</summary><div className="space-y-3 mt-2">{previewData.resourcesToDelete.map(res=>(<div key={res.id}className="bg-white border border-red-200 rounded p-4 shadow-sm"><div className="flex items-center justify-between mb-2"><div><span className="font-bold text-red-700">{res.name}</span><span className="ml-2 text-xs text-gray-500">({res.type})</span></div><div className="flex items-center gap-2"><span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Eliminar</span><span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{res.provider}</span></div></div></div>))}</div></details>)}<div className="flex justify-end gap-3 mt-8"><button className="px-5 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"onClick={()=>setPreviewModalVisible(false)}>Cancelar</button><button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"onClick={handleApplyChanges}disabled={loadingState}>{loadingState?'Aplicando...':'Aplicar cambios'}</button></div></div></div>)}
      {showSingleNodePreview&&singleNodePreview&&(<div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"><div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden border border-gray-100"style={{maxHeight:'80vh'}}><div className="bg-white p-6 border-b border-gray-100"><div className="flex justify-between items-center"><div className="flex items-center gap-3">{singleNodePreview.action==='create'&&(<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><span className="text-2xl text-green-600">＋</span></div>)}{singleNodePreview.action==='update'&&(<div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"><span className="text-2xl text-yellow-600">✎</span></div>)}{singleNodePreview.action==='delete'&&(<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><span className="text-2xl text-red-600">－</span></div>)}<div><h2 className="text-xl font-semibold text-gray-900">{singleNodePreview.resource.name}</h2><p className="text-sm text-gray-500 mt-1">{singleNodePreview.resource.type} • {singleNodePreview.resource.provider}</p></div></div><button onClick={()=>setShowSingleNodePreview(false)}className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-6 h-6"/></button></div></div><div className="p-6 overflow-y-auto"style={{maxHeight:'calc(80vh - 180px)'}}><div className="space-y-6"><div><h3 className="font-medium text-gray-900 mb-3">Cambios:</h3><div className="bg-gray-50 rounded-xl border border-gray-100 p-4"><div className="space-y-3">{Object.entries(singleNodePreview.resource.changes.properties).map(([key,value])=>{if(value&&typeof value==='object'&&'action'in value){return(<div key={key}className="flex justify-between items-start text-sm"><span className="text-gray-600">{key}</span><div className="flex flex-col items-end">{value.action==='update'&&(<><span className="text-red-500 line-through text-xs">- {value.before}</span><span className="text-green-500">+ {value.after}</span></>)}{value.action==='create'&&(<span className="text-green-500">+ {value.after}</span>)}{value.action==='delete'&&(<span className="text-red-500">- {value.before}</span>)}<span className="text-xs text-gray-400 mt-1">{value.action==='create'?'Nuevo':value.action==='update'?'Actualizado':'Eliminado'}</span></div></div>);}return(<div key={key}className="flex justify-between items-start text-sm"><span className="text-gray-600">{key}</span><span className="text-gray-500">{typeof value==='object'?JSON.stringify(value):String(value)}</span></div>);})}</div></div></div>{singleNodePreview.dependencies&&singleNodePreview.dependencies.length>0&&(<div><h3 className="font-medium text-gray-900 mb-3">Dependencias:</h3><div className="space-y-3">{singleNodePreview.dependencies.map((dep,index)=>(<div key={index}className="bg-gray-50 rounded-xl border border-gray-100 p-4"><div className="flex items-center gap-3 mb-3"><div className={`w-8 h-8 rounded-full ${dep.action==='create'?'bg-green-100':dep.action==='update'?'bg-yellow-100':'bg-red-100'} flex items-center justify-center`}><span className={dep.action==='create'?'text-green-600':dep.action==='update'?'text-yellow-600':'text-red-600'}>{dep.action==='create'?'＋':dep.action==='update'?'✎':'－'}</span></div><div><div className="font-medium text-gray-900">{dep.name}</div><div className="text-sm text-gray-500">{dep.type}</div></div></div>{Object.entries(dep.properties).length>0&&(<div className="ml-11 space-y-2">{Object.entries(dep.properties).map(([key,value])=>{if(value&&typeof value==='object'&&'action'in value){return(<div key={key}className="flex justify-between items-start text-sm"><span className="text-gray-600">{key}</span><div className="flex flex-col items-end">{value.action==='update'&&(<><span className="text-red-500 line-through text-xs">- {value.before}</span><span className="text-green-500">+ {value.after}</span></>)}{value.action==='create'&&(<span className="text-green-500">+ {value.after}</span>)}{value.action==='delete'&&(<span className="text-red-500">- {value.before}</span>)}<span className="text-xs text-gray-400 mt-1">{value.action==='create'?'Nuevo':value.action==='update'?'Actualizado':'Eliminado'}</span></div></div>);}return(<div key={key}className="flex justify-between items-start text-sm"><span className="text-gray-600">{key}</span><span className="text-gray-500">{typeof value==='object'?JSON.stringify(value):String(value)}</span></div>);})}</div>)}</div>))}</div></div>)}{singleNodePreview.estimated_cost&&(<div><h3 className="font-medium text-gray-900 mb-3">Costo estimado:</h3><div className="bg-gray-50 rounded-xl border border-gray-100 p-4"><div className="flex items-center justify-between"><span className="text-gray-600">Costo mensual</span><span className="font-medium text-gray-900">{singleNodePreview.estimated_cost?.currency} {singleNodePreview.estimated_cost?.monthly?.toFixed(2)}</span></div></div></div>)}</div></div><div className="p-6 border-t border-gray-100 bg-gray-50"><div className="flex justify-end gap-3"><button onClick={()=>setShowSingleNodePreview(false)}className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button><button onClick={handleApplyChanges}disabled={loadingState}className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loadingState?'Aplicando...':'Aplicar cambios'}</button></div></div></div></div>)}
      <div className={`fixed inset-y-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${showLogs ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '480px' }}>
        <ExecutionLog isVisible={showLogs} logs={executionLogs} onClose={() => setShowLogs(false)} previewData={previewData} />
      </div>
    </div>
  );
};

const FlowEditor = (props: FlowEditorProps): JSX.Element => {
  return (
    <ReactFlowProvider>
      <SelectedEdgeTypeProvider> {/* Envolver con SelectedEdgeTypeProvider */}
        <div className="relative w-full h-full">
          <FlowEditorContent {...props} />
        </div>
      </SelectedEdgeTypeProvider>
    </ReactFlowProvider>
  );
};

export default FlowEditor;
