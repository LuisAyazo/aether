import { useCallback, useMemo } from 'react';
import { useReactFlow, Node, /* Edge, */ applyNodeChanges } from 'reactflow'; // Edge comentado, no se usa directamente
import { useEditorStore } from './useEditorStore';
import { 
  MIN_EXPANDED_GROUP_WIDTH, 
  MIN_EXPANDED_GROUP_HEIGHT,
  GROUP_HEADER_HEIGHT,
  CHILD_NODE_PADDING_Y,
  CHILD_NODE_PADDING_X,
  CHILD_NODE_HEIGHT 
} from '../utils/constants';

// Tipos temporales mientras resolvemos el problema con los tipos de reactflow
type FlowNode = any;
type FlowEdge = any;
type FlowViewport = any;
type FlowNodeTypes = any;
type FlowEdgeTypes = any;
type FlowConnection = any;
type FlowXYPosition = any;

interface UseContextMenuManagerProps {
  selectedNodes: FlowNode[];
  setSelectedNodes: (nodes: FlowNode[]) => void; 
}

// type ContextMenu = { // No se usa, se puede eliminar
//   id?: string;
//   type?: string;
//   x?: number;
//   y?: number;
// };

export function useContextMenuManager({ 
  selectedNodes,
  setSelectedNodes,
}: UseContextMenuManagerProps) {
  const reactFlowInstance = useReactFlow();
  
  // Seleccionar cada propiedad individualmente
  const hideContextMenu = useEditorStore(state => state.hideContextMenu);
  const setSelectedEdge = useEditorStore(state => state.setSelectedEdge);
  const setEditingGroup = useEditorStore(state => state.setEditingGroup);
  // const editingGroup = useEditorStore(state => state.editingGroup); // No se usa
  const setContextMenu = useEditorStore(state => state.setContextMenu);

  const optimizeNodesInGroup = useCallback((gid:string)=>{
    const { getNode, getNodes, setNodes } = reactFlowInstance;
    const grp = getNode(gid); 
    if(!grp || grp.data?.isMinimized) return; 
    const children = getNodes().filter((n: FlowNode) => n.parentId === gid); 
    if(children.length === 0) return; 
    const grpW = (grp.style?.width as number) || MIN_EXPANDED_GROUP_WIDTH; 
    const hH = GROUP_HEADER_HEIGHT;
    const vM = CHILD_NODE_PADDING_Y;
    const hM = CHILD_NODE_PADDING_X;
    const nS = 8; // nodeSpacing
    const availW = grpW - 2 * hM; 
    const sorted = children.sort((a: FlowNode, b: FlowNode) => a.id.localeCompare(b.id)); 
    setNodes((ns: FlowNode[]) => ns.map((n: FlowNode) => {
      if(n.parentId !== gid) return n; 
      const idx = sorted.findIndex((c: FlowNode) => c.id === n.id); 
      const y = hH + vM + idx * (CHILD_NODE_HEIGHT + nS); 
      return {...n, position: {x: hM, y}, style: {...n.style, width: availW, height: CHILD_NODE_HEIGHT, transition: 'none'}, draggable: true, selectable: true};
    }));
  }, [reactFlowInstance]);

  const groupSelectedNodes = useCallback(()=>{
    const { setNodes: rfSetNodes } = reactFlowInstance;
    if(selectedNodes.length < 2){ console.warn("Need >=2 nodes to group"); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const provCounts:Record<string,number>={};
    selectedNodes.forEach((n: FlowNode) => {
      const w = n.width || 150, h = n.height || 80;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + w);
      maxY = Math.max(maxY, n.position.y + h);
      const p = n.data?.provider || 'generic';
      provCounts[p] = (provCounts[p] || 0) + 1;
    });
    let commonProv: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic';
    let maxCt = 0;
    Object.entries(provCounts).forEach(([p,c]) => {
      if(c > maxCt){ commonProv = p as 'aws' | 'gcp' | 'azure' | 'generic'; maxCt = c; }
    });
    const pX = 50, pVT = 60, pVB = 40; 
    minX -= pX; minY -= pVT; maxX += pX; maxY += pVB;
    const w = Math.max(MIN_EXPANDED_GROUP_WIDTH, maxX - minX), h = Math.max(MIN_EXPANDED_GROUP_HEIGHT, maxY - minY);
    const id = `group-${Date.now()}`;
    const grp: FlowNode = {id, type:'group', position:{x:minX, y:minY}, data:{label:'Grupo', provider: commonProv, isCollapsed:false, isMinimized: false}, style:{width:w, height:h}};
    
    rfSetNodes((currentNodes: FlowNode[]) => {
      const updatedNodes = currentNodes.map((n: FlowNode) => 
        selectedNodes.some((s: FlowNode) => s.id === n.id) ? 
        {...n, parentId: id, extent:'parent' as const, position:{x: n.position.x - minX, y: n.position.y - minY}, selected: false} : 
        n
      );
      return applyNodeChanges([{type:'add', item: grp}], updatedNodes);
    });
    setTimeout(() => optimizeNodesInGroup(id), 50);
    hideContextMenu();
    return id;
  }, [reactFlowInstance, selectedNodes, optimizeNodesInGroup, hideContextMenu]);

  const ungroupNodes = useCallback((groupIdToUngroup?: string) => {
    const { getNodes, setNodes: rfSetNodes } = reactFlowInstance;
    const currentNodes = getNodes();
    let nodesToUpdate: FlowNode[] = currentNodes;
    let targetGroupIdsToProcess: string[] = [];

    if (groupIdToUngroup) {
        targetGroupIdsToProcess.push(groupIdToUngroup);
    } else {
        const selectedGroupNodes = selectedNodes.filter((node: FlowNode) => node.type === 'group');
        const parentIdsOfSelectedChildren = [...new Set(selectedNodes.filter((node: FlowNode) => node.parentId && currentNodes.find((pn: FlowNode) => pn.id === node.parentId && pn.type === 'group')).map((node: FlowNode) => node.parentId!))];
        targetGroupIdsToProcess = [...new Set([...selectedGroupNodes.map((g: FlowNode) => g.id), ...parentIdsOfSelectedChildren])];

        if (targetGroupIdsToProcess.length === 0) {
            const nodesWithinAnyGroup = selectedNodes.filter((n: FlowNode) => n.parentId && currentNodes.find((p: FlowNode) => p.id === n.parentId && p.type === 'group'));
            if (nodesWithinAnyGroup.length > 0) {
                const parentIdsToUngroupFrom = [...new Set(nodesWithinAnyGroup.map((n: FlowNode) => n.parentId!))];
                targetGroupIdsToProcess.push(...parentIdsToUngroupFrom);
                targetGroupIdsToProcess = [...new Set(targetGroupIdsToProcess)]; 
            }
        }
    }
        
    if (targetGroupIdsToProcess.length === 0) {
        console.warn("No groups or nodes within groups selected/specified to ungroup.");
        hideContextMenu();
        return;
    }
    
    nodesToUpdate = currentNodes.map((n: FlowNode) => {
        if (n.parentId && targetGroupIdsToProcess.includes(n.parentId)) {
            const parentGroup = currentNodes.find((pg: FlowNode) => pg.id === n.parentId);
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
    }).filter((n: FlowNode) => !targetGroupIdsToProcess.includes(n.id)); 
    
    rfSetNodes(nodesToUpdate);
    setSelectedNodes([]); 
    hideContextMenu();
  }, [reactFlowInstance, selectedNodes, setSelectedNodes, hideContextMenu]);

  const handleDeleteNodeFromContextMenu = useCallback((nodeId: string) => {
    const { getNode, getNodes, setNodes: rfSetNodes, setEdges: rfSetEdges } = reactFlowInstance;
    const nodeToDelete = getNode(nodeId);
    if (!nodeToDelete) return;

    console.log('Deleting node from context menu:', nodeId, nodeToDelete);

    let idsToDelete = [nodeId];
    if (nodeToDelete.type === 'group') { 
      const childIds = getNodes().filter((n: FlowNode) => n.parentId === nodeId).map((n: FlowNode) => n.id);
      idsToDelete = [...idsToDelete, ...childIds];
      console.log('Deleting group and its children:', idsToDelete);
    }

    rfSetNodes((nds: FlowNode[]) => {
      const remainingNodes = nds.filter((n: FlowNode) => !idsToDelete.includes(n.id));
      console.log('Remaining nodes after deletion:', remainingNodes.length);
      return remainingNodes;
    });
    
    rfSetEdges((eds: FlowEdge[]) => {
      const remainingEdges = eds.filter((e: FlowEdge) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target) && !idsToDelete.includes(nodeId));
      console.log('Remaining edges after deletion:', remainingEdges.length);
      return remainingEdges;
    }); 
    
    hideContextMenu();
    setSelectedEdge(null);
  }, [reactFlowInstance, hideContextMenu, setSelectedEdge]);

  const deleteSelectedElements = useCallback(() => {
    const { getNodes, getEdges, setNodes: rfSetNodes, setEdges: rfSetEdges } = reactFlowInstance;
    const currentNodes = getNodes();
    const currentEdges = getEdges(); 

    const selectedNodeIds = selectedNodes.map((n: FlowNode) => n.id);
    const selectedEdgeObjects = currentEdges.filter((e: FlowEdge) => e.selected); 
    const selectedEdgeIds = selectedEdgeObjects.map((e: FlowEdge) => e.id);

    console.log('Deleting selected elements:', {
      selectedNodeIds,
      selectedEdgeIds,
      totalNodes: currentNodes.length,
      totalEdges: currentEdges.length
    });

    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    let allNodeIdsToDelete = [...selectedNodeIds];
    selectedNodeIds.forEach(nodeId => {
      const node = currentNodes.find((n: FlowNode) => n.id === nodeId);
      if (node?.type === 'group') {
        const childIds = currentNodes.filter((n: FlowNode) => n.parentId === nodeId).map((n: FlowNode) => n.id);
        allNodeIdsToDelete = [...allNodeIdsToDelete, ...childIds];
        console.log('Group children to delete:', childIds);
      }
    });
    allNodeIdsToDelete = [...new Set(allNodeIdsToDelete)]; 

    rfSetNodes((nds: FlowNode[]) => {
      const remainingNodes = nds.filter((n: FlowNode) => !allNodeIdsToDelete.includes(n.id));
      console.log('Remaining nodes after bulk deletion:', remainingNodes.length);
      return remainingNodes;
    });
    
    rfSetEdges((eds: FlowEdge[]) => {
      const remainingEdges = eds.filter((e: FlowEdge) => !selectedEdgeIds.includes(e.id) && !allNodeIdsToDelete.includes(e.source) && !allNodeIdsToDelete.includes(e.target));
      console.log('Remaining edges after bulk deletion:', remainingEdges.length);
      return remainingEdges;
    });
    
    setSelectedEdge(null); 
    hideContextMenu();
  }, [reactFlowInstance, selectedNodes, setSelectedEdge, hideContextMenu]);

  const startEditingGroupName = useCallback((id:string,lbl:string)=>{
    setEditingGroup({id,label:lbl});
    hideContextMenu();
  },[setEditingGroup, hideContextMenu]);

  // Esta versión de saveGroupName no se usa, se sobrescribe en contextMenuActions
  // const saveGroupName = useCallback((name:string)=>{ 
  //   const { setNodes: rfSetNodes } = reactFlowInstance;
  //   if(!editingGroup)return; 
  //   rfSetNodes(ns=>ns.map(n=>n.id===editingGroup.id?{...n,data:{...n.data,label:name}}:n)); 
  //   setEditingGroup(null); 
  //   hideContextMenu(); 
  // },[reactFlowInstance, editingGroup, setEditingGroup, hideContextMenu]);

  const moveNodesToBack = useCallback((ids:string[])=>{
    const { getNodes, setNodes: rfSetNodes } = reactFlowInstance;
    const currentNodes = getNodes();
    const selectedIds = new Set(ids);
    const minZIndex = Math.min(...currentNodes.map((n: FlowNode) => n.zIndex || 0));
    rfSetNodes(currentNodes.map((n: FlowNode) => selectedIds.has(n.id) ? {...n, zIndex: minZIndex -1 } : n));
    hideContextMenu();
  },[reactFlowInstance, hideContextMenu]);

  const contextMenuActions = useMemo(() => ({
    saveGroupName: (newName: string) => {
      const updatedNodes = selectedNodes.map((node: FlowNode) => ({
        ...node,
        data: { ...node.data, label: newName }
      }));
      setSelectedNodes(updatedNodes);
      setEditingGroup(null);
    },
    hideContextMenu: () => {
      setContextMenu({});
    }
  }), [selectedNodes, setSelectedNodes, setEditingGroup, setContextMenu]);

  return {
    handleDeleteNodeFromContextMenu,
    deleteSelectedElements,
    groupSelectedNodes,
    ungroupNodes,
    optimizeNodesInGroup, 
    startEditingGroupName,
    moveNodesToBack,
    ...contextMenuActions,
  };
}
