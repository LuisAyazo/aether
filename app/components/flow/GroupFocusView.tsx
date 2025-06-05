import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  Viewport,
  applyNodeChanges,
  OnNodesChange, 
  OnEdgesChange, 
  useReactFlow, 
  Panel, 
  applyNodeChanges as applyNodeChangesRf,
} from 'reactflow';
import 'reactflow/dist/style.css';
import nodeTypesFromFile from '../nodes/NodeTypes'; 
import { LogicalEdgeType, EdgeTypeConfig } from '@/app/config/edgeConfig'; 
import { ResourceItem, ResourceCategory } from './types/editorTypes'; 
import { 
  SquaresPlusIcon, 
  XMarkIcon, 
  ServerIcon as HeroServerIcon,
  DocumentTextIcon, 
  PencilIcon,       
  RectangleGroupIcon 
} from '@heroicons/react/24/outline'; 
import { debounce } from 'lodash';


interface GroupFocusViewProps {
  focusedGroupId: string;
  allNodes: Node[];
  allEdges: Edge[];
  onClose: () => void;
  onSaveChanges: (updatedNodesInGroup: Node[], newEdgesInGroup: Edge[], viewport?: Viewport) => void;
  mainNodeTypes: NodeTypes;
  mainEdgeTypes?: EdgeTypes;
  initialViewport?: Viewport;
  edgeTypeConfigs: Record<string, EdgeTypeConfig>; 
  edgeToolbarIcons: Record<string, React.ElementType>;
  resourceCategories?: ResourceCategory[]; 
}

const GroupFocusView: React.FC<GroupFocusViewProps> = ({
  focusedGroupId,
  allNodes,
  allEdges,
  onClose,
  onSaveChanges,
  mainNodeTypes,
  mainEdgeTypes,
  initialViewport,
  edgeTypeConfigs,
  edgeToolbarIcons,
  resourceCategories = [], 
}) => {
  const parentNode = useMemo(() => allNodes.find(n => n.id === focusedGroupId), [allNodes, focusedGroupId]);
  const [localSelectedEdgeType, setLocalSelectedEdgeType] = React.useState<LogicalEdgeType | null>(null);
  const [isGroupSidebarOpen, setIsGroupSidebarOpen] = React.useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = React.useState('');
  const [groupCollapsedCategories, setGroupCollapsedCategories] = React.useState<Record<string, boolean>>({});
  const [activeToolInGroup, setActiveToolInGroup] = React.useState<'select' | 'note' | 'text' | 'area'>('select');
  const [isDrawingAreaInGroup, setIsDrawingAreaInGroup] = React.useState(false);
  const [areaStartPosInGroup, setAreaStartPosInGroup] = React.useState<{ x: number; y: number } | null>(null);
  const [currentAreaInGroup, setCurrentAreaInGroup] = React.useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  
  const groupFlowInstance = useReactFlow(); 
  const groupFlowWrapper = React.useRef<HTMLDivElement>(null);
  const onSaveRef = useRef(onSaveChanges); 
  const [isDragging, setIsDragging] = useState(false); // Not currently used for auto-save, but kept for potential future use

  // Memoize nodeTypes and edgeTypes passed to the internal ReactFlow instance
  const memoizedInternalNodeTypes = useMemo(() => mainNodeTypes, [mainNodeTypes]);
  const memoizedInternalEdgeTypes = useMemo(() => mainEdgeTypes, [mainEdgeTypes]);
  
  // const previousNodesRef = useRef<string | null>(null); // For auto-save, currently commented out
  // const previousEdgesRef = useRef<string | null>(null); // For auto-save, currently commented out
  // const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For auto-save, currently commented out


  const initialGroupNodes = useMemo(() => {
    if (!parentNode) return [];
    const childrenOfFocusedGroup = allNodes
      .filter(n => n.parentId === focusedGroupId)
      .map(n => {
        const focusedViewNode: Node = {
          id: n.id,
          type: n.type,
          position: n.position, 
          data: n.data ? { ...n.data } : {}, 
          width: n.width,
          height: n.height,
          selected: n.selected || false, 
          style: n.style ? { ...n.style } : undefined, 
          draggable: typeof n.draggable === 'boolean' ? n.draggable : true,
          selectable: typeof n.selectable === 'boolean' ? n.selectable : true,
          connectable: typeof n.connectable === 'boolean' ? n.connectable : true,
        };
        return focusedViewNode;
      });
    console.log('[GroupFocusView] focusedGroupId:', focusedGroupId);
    console.log('[GroupFocusView] parentNode (the group itself):', JSON.stringify(parentNode ? {id: parentNode.id, data: parentNode.data, type: parentNode.type} : null));
    console.log('[GroupFocusView] Children found for group:', JSON.stringify(childrenOfFocusedGroup.map(n => ({id: n.id, type: n.type, data: n.data, parentId: n.parentId /* should be undefined here */}))));
    return childrenOfFocusedGroup;
  }, [allNodes, focusedGroupId, parentNode]);

  const initialGroupEdges = useMemo(() => {
    const childNodeIds = new Set(initialGroupNodes.map(n => n.id));
    return allEdges.filter(edge => childNodeIds.has(edge.source) && childNodeIds.has(edge.target));
  }, [allEdges, initialGroupNodes]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialGroupNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialGroupEdges);

  const previousInitialGroupNodesJSON = useRef<string | null>(null);
  const previousInitialGroupEdgesJSON = useRef<string | null>(null);

  useEffect(() => {
    const currentInitialGroupNodesJSON = JSON.stringify(initialGroupNodes);
    if (currentInitialGroupNodesJSON !== previousInitialGroupNodesJSON.current) {
      setNodes(initialGroupNodes);
      previousInitialGroupNodesJSON.current = currentInitialGroupNodesJSON;
    }
  }, [initialGroupNodes]);

  useEffect(() => {
    const currentInitialGroupEdgesJSON = JSON.stringify(initialGroupEdges);
    if (currentInitialGroupEdgesJSON !== previousInitialGroupEdgesJSON.current) {
      setEdges(initialGroupEdges);
      previousInitialGroupEdgesJSON.current = currentInitialGroupEdgesJSON;
    }
  }, [initialGroupEdges]);

  const handleToolClickInGroup = (tool: 'select' | 'note' | 'text' | 'area') => {
    setActiveToolInGroup(prevTool => {
      if (prevTool === tool && tool !== 'area') return 'select'; 
      return tool;
    });
    if (groupFlowWrapper.current) {
      if (tool === 'note' || tool === 'text' || tool === 'area') {
        groupFlowWrapper.current.style.cursor = 'crosshair';
      } else {
        groupFlowWrapper.current.style.cursor = 'default';
      }
    }
    if (tool !== 'area') {
      setIsDrawingAreaInGroup(false);
      setAreaStartPosInGroup(null);
      setCurrentAreaInGroup(null);
    }
  };
  
  const onPaneClickInGroup = useCallback((event: React.MouseEvent) => {
    if (activeToolInGroup === 'area') { 
      return;
    }
    if ((activeToolInGroup === 'note' || activeToolInGroup === 'text') && groupFlowInstance) {
      event.preventDefault();
      event.stopPropagation();
      const position = groupFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const type = activeToolInGroup === 'note' ? 'noteNode' : 'textNode';
      const data = activeToolInGroup === 'note' 
        ? { text: 'Click to edit', backgroundColor: '#FEF08A', textColor: '#1F2937', fontSize: 14 } 
        : { text: 'Click to edit', fontSize: 16, fontWeight: 'normal', textAlign: 'left', textColor: '#000000', backgroundColor: 'transparent', borderStyle: 'none' };
      
      const newNodeId = `${activeToolInGroup}-${Date.now()}`;
      const newNodeToAdd: Node = { 
        id: newNodeId, 
        type, 
        position, 
        data, 
      };
      setNodes((nds) => nds.concat(newNodeToAdd));
      setActiveToolInGroup('select'); 
      if (groupFlowWrapper.current) {
        groupFlowWrapper.current.style.cursor = 'default';
      }
    }
  }, [activeToolInGroup, groupFlowInstance, setNodes, setActiveToolInGroup]);


  const onDragStartSidebarInGroup = (event: React.DragEvent, item: ResourceItem) => {
    event.dataTransfer.setData('application/reactflow-group-internal', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDropInGroup = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const reactFlowBounds = groupFlowWrapper.current?.getBoundingClientRect();
    if (!groupFlowInstance || !reactFlowBounds) {
      return;
    }

    const dataString = event.dataTransfer.getData('application/reactflow-group-internal');
    if (!dataString) {
      return;
    }
    const itemData = JSON.parse(dataString) as ResourceItem;

    const position = groupFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    let nodeW = 200, nodeH = 100; 
    if (itemData.type === 'noteNode' || itemData.type === 'note') { nodeW = 200; nodeH = 120; }
    else if (itemData.type === 'textNode' || itemData.type === 'text') { nodeW = 150; nodeH = 80; }

    const newNode: Node = {
      id: `${itemData.type}-${Date.now()}`,
      type: itemData.type, 
      position,
      data: { label: itemData.name, description: itemData.description, provider: itemData.provider },
      style: { width: nodeW, height: nodeH },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [groupFlowInstance, setNodes]);


  const handleLocalEdgeTypeSelect = (type: LogicalEdgeType) => {
    setLocalSelectedEdgeType((prev: LogicalEdgeType | null) => (prev === type ? null : type));
  };

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) {
        console.warn('onConnect en GroupFocusView: source o target es null', params);
        return;
      }
      const typeToUse = localSelectedEdgeType || LogicalEdgeType.CONNECTS_TO; 
      const config = edgeTypeConfigs[typeToUse] || edgeTypeConfigs[LogicalEdgeType.CONNECTS_TO];
      
      const newEdge: Edge = {
        ...params,
        source: params.source, 
        target: params.target, 
        id: `group-edge-${Date.now()}-${params.source}-${params.target}`,
        type: config.visualType,
        style: config.style,
        markerEnd: config.markerEnd,
        data: { label: config.label, edgeKind: config.logicalType },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, localSelectedEdgeType, edgeTypeConfigs]
  );

  const handleSaveChanges = () => {
    const nodesToSave = nodes.map(n => ({
      ...n,
      parentId: focusedGroupId, 
      extent: 'parent' as const, 
    }));
    const currentGroupViewport = groupFlowInstance.getViewport();
    onSaveRef.current?.(nodesToSave, edges, currentGroupViewport);
    onClose();
  };

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter(n => !n.selected));
    setEdges((eds) => eds.filter(e => !e.selected));
  }, [setNodes, setEdges]);
  
  if (!parentNode) {
    return (
      <div className="absolute inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-500">Error: Grupo no encontrado.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Cerrar
        </button>
      </div>
    );
  }

  useEffect(() => {
    onSaveRef.current = onSaveChanges;
  }, [onSaveChanges]);

  useEffect(() => {
    if (groupFlowInstance && initialViewport) {
      const timeoutId = setTimeout(() => {
        if (groupFlowInstance) {
          groupFlowInstance.setViewport(initialViewport);
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [groupFlowInstance, initialViewport?.x, initialViewport?.y, initialViewport?.zoom]);

  // Auto-save useEffects are commented out to prevent loops
  /*
  useEffect(() => {
    if (onSaveChanges && groupFlowInstance && !isDragging) {
      const currentNodesJSON = JSON.stringify(nodes);
      const currentEdgesJSON = JSON.stringify(edges);
      
      if (currentNodesJSON !== previousNodesRef.current || currentEdgesJSON !== previousEdgesRef.current) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(() => {
          if (groupFlowInstance) {
            const flow = groupFlowInstance.toObject();
            const viewport = groupFlowInstance.getViewport();
            onSaveChanges(flow.nodes, flow.edges, viewport);
          }
        }, 1000);
      }
      
      previousNodesRef.current = currentNodesJSON;
      previousEdgesRef.current = currentEdgesJSON;
    }
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [nodes, edges, groupFlowInstance, isDragging, onSaveChanges]);

  useEffect(() => {
    if (groupFlowInstance && onSaveChanges) {
      const handleViewportChange = debounce(() => {
        const viewport = groupFlowInstance.getViewport();
        if (viewport.zoom !== 0) {
          onSaveChanges(nodes, edges, viewport);
        }
      }, 500);

      document.addEventListener('reactflow.viewportchange', handleViewportChange as EventListener);
      return () => {
        document.removeEventListener('reactflow.viewportchange', handleViewportChange as EventListener);
      };
    }
  }, [groupFlowInstance, nodes, edges, onSaveChanges]);

  useEffect(() => {
    if (groupFlowInstance && onSaveChanges) {
      const handleNodesChange = debounce(() => {
        const flow = groupFlowInstance.toObject();
        const viewport = groupFlowInstance.getViewport();
        onSaveChanges(flow.nodes, flow.edges, viewport);
      }, 500);

      document.addEventListener('reactflow.nodeschange', handleNodesChange as EventListener);
      document.addEventListener('reactflow.edgeschange', handleNodesChange as EventListener);
      
      return () => {
        document.removeEventListener('reactflow.nodeschange', handleNodesChange as EventListener);
        document.removeEventListener('reactflow.edgeschange', handleNodesChange as EventListener);
      };
    }
  }, [groupFlowInstance, onSaveChanges]);
  */

  return (
    <div className="absolute inset-0 bg-white z-[100] flex flex-col">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Editando Grupo: {parentNode.data.label || parentNode.id}</h2>
        <div>
          <button 
            onClick={handleSaveChanges}
            className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Guardar y Cerrar
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
      <div className="flex-grow relative">
        <div className="absolute top-2 left-2 z-10 bg-white p-1 rounded shadow flex gap-1">
          <button 
            onClick={handleDeleteSelected}
            title="Eliminar Seleccionado"
            className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.242.078 3.324.235m0 0a48.667 48.667 0 0 0 3.913 0c1.282 0 2.517.093 3.707.277M6.08 8.982l6.23-1.437m5.13 1.437-6.23 1.437m0 0V5.79m0 0a5.006 5.006 0 0 1-5.006-5.006c0-1.763 1.126-3.223 2.772-3.798A5.007 5.007 0 0 1 12 2.25a5.007 5.007 0 0 1 4.228 2.254c1.646.576 2.772 2.035 2.772 3.798a5.006 5.006 0 0 1-5.006 5.006Z" />
            </svg>
          </button>
          <button
            onClick={() => setIsGroupSidebarOpen(prev => !prev)}
            title="Mostrar Recursos"
            className={`p-1.5 hover:bg-gray-100 rounded ${isGroupSidebarOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          >
            <SquaresPlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolClickInGroup('note')}
            title="Añadir Nota"
            className={`p-1.5 hover:bg-gray-100 rounded ${activeToolInGroup === 'note' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          >
            <DocumentTextIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolClickInGroup('text')}
            title="Añadir Texto"
            className={`p-1.5 hover:bg-gray-100 rounded ${activeToolInGroup === 'text' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleToolClickInGroup('area')}
            title="Dibujar Área"
            className={`p-1.5 hover:bg-gray-100 rounded ${activeToolInGroup === 'area' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          >
            <RectangleGroupIcon className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-gray-300 mx-1"></div>
          {Object.values(edgeTypeConfigs).map(cfg => {
            const IconComponent = edgeToolbarIcons[cfg.logicalType];
            const isSelected = localSelectedEdgeType === cfg.logicalType;
            return (
              <button
                key={cfg.logicalType}
                onClick={() => handleLocalEdgeTypeSelect(cfg.logicalType)}
                title={`Edge: ${cfg.label}`}
                className={`p-1.5 rounded hover:bg-gray-200 ${isSelected ? 'bg-blue-100 ring-1 ring-blue-500' : 'bg-transparent'}`}
                style={{ color: isSelected ? cfg.style?.stroke || 'blue' : cfg.style?.stroke || 'black' }}
              >
                {IconComponent && <IconComponent className="w-5 h-5" />}
              </button>
            );
          })}
        </div>
        <ReactFlowProvider> 
          <div ref={groupFlowWrapper} className="w-full h-full" style={{ cursor: activeToolInGroup === 'note' || activeToolInGroup === 'text' || activeToolInGroup === 'area' ? 'crosshair' : 'default' }}>
           <style>{`.react-flow__pane { cursor: ${activeToolInGroup === 'note' || activeToolInGroup === 'text' || activeToolInGroup === 'area' ? 'crosshair' : 'default'} !important; }`}</style>
            <ReactFlow
              key={focusedGroupId} 
              nodes={nodes}
              edges={edges}
              onDrop={onDropInGroup} 
              onDragOver={(event) => event.preventDefault()} 
              onPaneClick={onPaneClickInGroup}
              onNodesChange={onNodesChangeInternal}
              onEdgesChange={onEdgesChangeInternal}
              onConnect={onConnect}
              onMouseDown={(e) => {
                if (activeToolInGroup === 'area' && groupFlowInstance) {
                  const target = e.target as HTMLElement;
                  if (!target.closest('.react-flow__node') && !target.closest('.react-flow__edge') && !target.closest('.react-flow__handle') && target.closest('.react-flow__pane')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const position = groupFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
                    setIsDrawingAreaInGroup(true);
                    setAreaStartPosInGroup(position);
                    setCurrentAreaInGroup({ x: position.x, y: position.y, width: 0, height: 0 });
                  }
                }
              }}
              onMouseMove={(e) => {
                if (isDrawingAreaInGroup && areaStartPosInGroup && groupFlowInstance) {
                  const currentPosition = groupFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
                  setCurrentAreaInGroup({
                    x: Math.min(areaStartPosInGroup.x, currentPosition.x),
                    y: Math.min(areaStartPosInGroup.y, currentPosition.y),
                    width: Math.abs(currentPosition.x - areaStartPosInGroup.x),
                    height: Math.abs(currentPosition.y - areaStartPosInGroup.y),
                  });
                }
              }}
              onMouseUp={() => {
                if (isDrawingAreaInGroup && currentAreaInGroup && groupFlowInstance) {
                  if (currentAreaInGroup.width > 20 && currentAreaInGroup.height > 20) {
                    const newAreaNode: Node = {
                      id: `area-group-${Date.now()}`,
                      type: 'areaNode', 
                      position: { x: currentAreaInGroup.x, y: currentAreaInGroup.y },
                      data: { backgroundColor:'rgba(59,130,246,0.5)',borderColor:'rgba(59,130,246,1)',borderWidth:2,shape:'rectangle',label:'Area in Group' },
                      style: { width: currentAreaInGroup.width, height: currentAreaInGroup.height },
                      width: currentAreaInGroup.width,
                      height: currentAreaInGroup.height,
                      selectable: true,
                      draggable: true,
                    };
                    setNodes((nds) => applyNodeChangesRf([{ type: 'add', item: newAreaNode }], nds));
                  }
                  setIsDrawingAreaInGroup(false);
                  setAreaStartPosInGroup(null);
                  setCurrentAreaInGroup(null);
                  setActiveToolInGroup('select'); 
                   if (groupFlowWrapper.current) {
                    groupFlowWrapper.current.style.cursor = 'default';
                  }
                }
              }}
            nodeTypes={memoizedInternalNodeTypes} 
            edgeTypes={memoizedInternalEdgeTypes}
            defaultViewport={initialViewport || { x: 50, y: 50, zoom: 0.85 }} 
            className="bg-gray-100"
          >
            <Background />
            <Controls />
            <MiniMap />
            {isDrawingAreaInGroup && currentAreaInGroup && groupFlowInstance && (
              <div
                className="area-drawing-overlay"
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  left: `${(currentAreaInGroup.x * groupFlowInstance.getViewport().zoom) + groupFlowInstance.getViewport().x}px`,
                  top: `${(currentAreaInGroup.y * groupFlowInstance.getViewport().zoom) + groupFlowInstance.getViewport().y}px`,
                  width: `${currentAreaInGroup.width * groupFlowInstance.getViewport().zoom}px`,
                  height: `${currentAreaInGroup.height * groupFlowInstance.getViewport().zoom}px`,
                  border: '2px dashed rgba(59,130,246,1)',
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  borderRadius: '4px',
                  boxShadow: '0 0 10px rgba(59,130,246,0.3)',
                  transition: 'none',
                }}
              />
            )}
            {!isGroupSidebarOpen && (
              <Panel position="top-right">
                <button
                  style={{padding:'8px 12px',background:'rgba(255,255,255,0.95)',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,0.1)',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',border:'1px solid rgba(0,0,0,0.05)'}}
                  onClick={() => setIsGroupSidebarOpen(true)}
                  title="Mostrar Recursos"
                >
                  <SquaresPlusIcon className="w-4 h-4 text-gray-600"/>
                  <span style={{fontSize:'13px',fontWeight:500,color:'#444'}}>Recursos</span>
                </button>
              </Panel>
            )}
            {isGroupSidebarOpen && (
              <Panel 
                position="top-right"
                className="!m-0 !p-0" 
                style={{
                  width:'300px', 
                  background:'rgba(250,250,250,0.95)',
                  borderRadius:'8px 0 0 8px',
                  height:'calc(100% - 16px)', 
                  margin: '8px', 
                  overflow:'hidden',
                  boxShadow:'0 2px 10px rgba(0,0,0,0.1)',
                  display:'flex',
                  flexDirection:'column',
                  zIndex: 20, 
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderBottom:'1px solid rgba(220,220,220,0.9)',flexShrink:0}}>
                  <h4 style={{margin:0,fontSize:'14px',fontWeight:'600',color:'#333'}}>Recursos</h4>
                  <button onClick={()=>setIsGroupSidebarOpen(false)} style={{border:'none',background:'transparent',cursor:'pointer',padding:'4px'}} title="Ocultar Recursos">
                    <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700"/>
                  </button>
                </div>
                <div style={{padding:'8px 12px',borderBottom:'1px solid rgba(220,220,220,0.9)'}}>
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={groupSearchTerm} 
                    onChange={e=>setGroupSearchTerm(e.target.value)} 
                    style={{width:'100%',padding:'6px 10px',borderRadius:'4px',border:'1px solid #ccc',fontSize:'13px'}}
                  />
                </div>
                <div style={{overflowY:'auto',flexGrow:1,paddingBottom:'8px'}}>
                  {resourceCategories.filter((c: ResourceCategory) => c.items.some((i: ResourceItem) => i.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) || i.description.toLowerCase().includes(groupSearchTerm.toLowerCase())))
                    .map(cat => (
                    <div key={`group-sb-${cat.name}`} style={{borderBottom:'1px solid #eee'}}>
                      <h5 
                        onClick={()=>setGroupCollapsedCategories(p=>({...p,[cat.name]:!p[cat.name]}))}
                        style={{cursor:'pointer',margin:0,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'13px',fontWeight:'500',backgroundColor:groupCollapsedCategories[cat.name]?'#f9f9f9':'#f0f0f0'}}
                      >
                        <span>{cat.name}</span>
                        <span style={{color:'#555'}}>{groupCollapsedCategories[cat.name]?'▸':'▾'}</span>
                      </h5>
                      {!groupCollapsedCategories[cat.name] && (
                        <ul style={{listStyleType:'none',padding:'0',margin:0,backgroundColor:'#fff'}}>
                          {cat.items.filter((i: ResourceItem) => i.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) || i.description.toLowerCase().includes(groupSearchTerm.toLowerCase()))
                            .map((item: ResourceItem) => (
                            <li 
                              key={`group-sb-item-${item.type}-${item.name}`}
                              draggable 
                              onDragStart={e=>onDragStartSidebarInGroup(e,item)}
                              style={{padding:'6px 12px',margin:'0',cursor:'grab',display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#333',borderBottom:'1px solid #f5f5f5'}}
                              className="hover:bg-gray-100"
                            >
                              <div style={{minWidth:'20px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <HeroServerIcon className="w-4 h-4 text-gray-400"/>
                              </div>
                              <div style={{flex:1}}>
                                <span style={{fontWeight:'500'}}>{item.name}</span>
                                <p style={{fontSize:'10px',color:'#666',margin:'1px 0 0 0',lineHeight:'1.2'}}>{item.description}</p>
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
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default memo(GroupFocusView);
