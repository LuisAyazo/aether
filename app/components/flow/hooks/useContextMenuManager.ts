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
    const { setNodes: rfSetNodes, getNodes } = reactFlowInstance;
    
    // Obtener nodos seleccionados directamente del reactFlowInstance
    const currentSelectedNodes = getNodes().filter((n: FlowNode) => n.selected);
    console.log('🔍 Current selected nodes from reactFlow:', currentSelectedNodes.length);
    
    if(currentSelectedNodes.length < 2){ 
      console.warn("Need >=2 nodes to group"); 
      return; 
    }
    
    // Filtrar solo nodos de recursos (excluir notas, textos, áreas y grupos)
    const utilityNodeTypes = ['areaNode', 'noteNode', 'textNode', 'group'];
    const resourceNodes = currentSelectedNodes.filter((n: FlowNode) => !utilityNodeTypes.includes(n.type));
    
    if(resourceNodes.length < 2){ 
      console.warn("Need at least 2 resource nodes to group"); 
      return; 
    }
    
    console.log('🔄 Grouping nodes:', resourceNodes.length);
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const provCounts:Record<string,number>={};
    resourceNodes.forEach((n: FlowNode) => {
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
    const grp: FlowNode = {
      id, 
      type:'group', 
      position:{x:minX, y:minY}, 
      data:{
        label:'Nuevo Grupo', 
        provider: commonProv, 
        isCollapsed:false, 
        isMinimized: false,
        isExpandedView: false
      }, 
      style:{width:w, height:h},
      width: w,
      height: h
    };
    
    rfSetNodes((currentNodes: FlowNode[]) => {
      const updatedNodes = currentNodes.map((n: FlowNode) => 
        resourceNodes.some((s: FlowNode) => s.id === n.id) ? 
        {
          ...n, 
          parentId: id, 
          extent:'parent' as const, 
          position:{x: n.position.x - minX, y: n.position.y - minY}, 
          selected: false,
          hidden: true,
          style: { 
            ...n.style, 
            visibility: 'hidden',
            pointerEvents: 'none',
            opacity: 0
          }
        } : 
        n
      );
      return applyNodeChanges([{type:'add', item: grp}], updatedNodes);
    });
    
    console.log('✅ Created group:', id);
    setTimeout(() => optimizeNodesInGroup(id), 50);
    hideContextMenu();
    return id;
  }, [reactFlowInstance, optimizeNodesInGroup, hideContextMenu]);

  const ungroupNodes = useCallback((groupIdToUngroup?: string) => {
    const { getNodes, setNodes: rfSetNodes } = reactFlowInstance;
    const currentNodes = getNodes();
    
    // Obtener nodos seleccionados directamente del reactFlowInstance
    const currentSelectedNodes = currentNodes.filter((n: FlowNode) => n.selected);
    
    let targetGroupIdsToProcess: string[] = [];

    if (groupIdToUngroup) {
        targetGroupIdsToProcess.push(groupIdToUngroup);
    } else {
        const selectedGroupNodes = currentSelectedNodes.filter((node: FlowNode) => node.type === 'group');
        const parentIdsOfSelectedChildren = [...new Set(currentSelectedNodes.filter((node: FlowNode) => node.parentId && currentNodes.find((pn: FlowNode) => pn.id === node.parentId && pn.type === 'group')).map((node: FlowNode) => node.parentId as string))];
        targetGroupIdsToProcess = [...new Set([...selectedGroupNodes.map((g: FlowNode) => g.id), ...parentIdsOfSelectedChildren])];

        if (targetGroupIdsToProcess.length === 0) {
            const nodesWithinAnyGroup = currentSelectedNodes.filter((n: FlowNode) => n.parentId && currentNodes.find((p: FlowNode) => p.id === n.parentId && p.type === 'group'));
            if (nodesWithinAnyGroup.length > 0) {
                const parentIdsToUngroupFrom = [...new Set(nodesWithinAnyGroup.map((n: FlowNode) => n.parentId as string))];
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

    console.log('🔄 Ungrouping groups:', targetGroupIdsToProcess);
    
    // Crear un mapa para almacenar los grupos que vamos a eliminar
    const groupsToDelete = new Map<string, FlowNode>();
    targetGroupIdsToProcess.forEach(groupId => {
        const group = currentNodes.find((n: FlowNode) => n.id === groupId);
        if (group) {
            groupsToDelete.set(groupId, group);
        }
    });
    
    // Actualizar todos los nodos de una vez
    const updatedNodes = currentNodes.map((n: FlowNode) => {
        // Si es un nodo hijo de un grupo que vamos a desagrupar
        if (n.parentId && groupsToDelete.has(n.parentId)) {
            const parentGroup = groupsToDelete.get(n.parentId)!;
            
            // Calcular la posición absoluta del nodo
            const parentX = parentGroup.positionAbsolute?.x ?? parentGroup.position.x;
            const parentY = parentGroup.positionAbsolute?.y ?? parentGroup.position.y;
            
            // Usar las dimensiones por defecto estándar de los nodos
            const defaultWidth = 150;
            const defaultHeight = 80;
            
            return {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: {
                    x: parentX + n.position.x,
                    y: parentY + n.position.y,
                },
                selected: false,
                hidden: false,
                // Eliminar width y height del nodo para que use las dimensiones del componente
                width: undefined,
                height: undefined,
                style: {
                    // Mantener el estilo original pero actualizar visibilidad
                    ...n.style,
                    visibility: 'visible',
                    pointerEvents: 'auto',
                    opacity: 1,
                    // No forzar width/height en el style
                    width: undefined,
                    height: undefined,
                },
                draggable: true,
                selectable: true,
                connectable: true,
                zIndex: (n.zIndex || 0) + 1, // Asegurar que estén por encima
            };
        }
        
        // Si es un grupo que vamos a eliminar, retornar null
        if (groupsToDelete.has(n.id)) {
            return null;
        }
        
        // Otros nodos permanecen sin cambios
        return n;
    });
    
    // Filtrar los nodos nulos (los grupos eliminados)
    const finalNodes = updatedNodes.filter((n: FlowNode | null) => n !== null) as FlowNode[];
    
    console.log('✅ Ungrouped nodes:', finalNodes.length);
    
    // Actualizar los nodos
    rfSetNodes(finalNodes);
    setSelectedNodes([]); 
    hideContextMenu();
  }, [reactFlowInstance, setSelectedNodes, hideContextMenu]);

  const handleDeleteNodeFromContextMenu = useCallback((nodeId: string) => {
    const { getNode, getNodes, setNodes: rfSetNodes, setEdges: rfSetEdges } = reactFlowInstance;
    const nodeToDelete = getNode(nodeId);
    if (!nodeToDelete) return;

    let idsToDelete = [nodeId];
    if (nodeToDelete.type === 'group') { 
      const childIds = getNodes().filter((n: FlowNode) => n.parentId === nodeId).map((n: FlowNode) => n.id);
      idsToDelete = [...idsToDelete, ...childIds];
    }

    rfSetNodes((nds: FlowNode[]) => nds.filter((n: FlowNode) => !idsToDelete.includes(n.id)));
    rfSetEdges((eds: FlowEdge[]) => eds.filter((e: FlowEdge) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target) && !idsToDelete.includes(nodeId))); 
    
    hideContextMenu();
    setSelectedEdge(null);
  }, [reactFlowInstance, hideContextMenu, setSelectedEdge]);

  const deleteSelectedElements = useCallback(() => {
    const { getNodes, getEdges, setNodes: rfSetNodes, setEdges: rfSetEdges } = reactFlowInstance;
    const currentNodes = getNodes();
    const currentEdges = getEdges(); 
    
    // Obtener nodos seleccionados directamente del reactFlowInstance
    const currentSelectedNodes = currentNodes.filter((n: FlowNode) => n.selected);
    console.log('🗑️ Deleting nodes from reactFlow:', currentSelectedNodes.length);

    const selectedNodeIds = currentSelectedNodes.map((n: FlowNode) => n.id);
    const selectedEdgeObjects = currentEdges.filter((e: FlowEdge) => e.selected); 
    const selectedEdgeIds = selectedEdgeObjects.map((e: FlowEdge) => e.id);

    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return;

    let allNodeIdsToDelete = [...selectedNodeIds];
    selectedNodeIds.forEach(nodeId => {
      const node = currentNodes.find((n: FlowNode) => n.id === nodeId);
      if (node?.type === 'group') {
        const childIds = currentNodes.filter((n: FlowNode) => n.parentId === nodeId).map((n: FlowNode) => n.id);
        allNodeIdsToDelete = [...allNodeIdsToDelete, ...childIds];
      }
    });
    allNodeIdsToDelete = [...new Set(allNodeIdsToDelete)]; 

    rfSetNodes((nds: FlowNode[]) => nds.filter((n: FlowNode) => !allNodeIdsToDelete.includes(n.id)));
    rfSetEdges((eds: FlowEdge[]) => eds.filter((e: FlowEdge) => !selectedEdgeIds.includes(e.id) && !allNodeIdsToDelete.includes(e.source) && !allNodeIdsToDelete.includes(e.target)));
    
    setSelectedEdge(null); 
    hideContextMenu();
  }, [reactFlowInstance, setSelectedEdge, hideContextMenu]);

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

  const duplicateNode = useCallback((nodeId: string) => {
    const { getNode, setNodes: rfSetNodes } = reactFlowInstance;
    const nodeToDuplicate = getNode(nodeId);
    if (!nodeToDuplicate) return;

    const newNode: FlowNode = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.type}-duplicate-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50
      },
      selected: false,
      // Si el nodo está dentro de un grupo, mantener el mismo parentId
      parentId: nodeToDuplicate.parentId,
      extent: nodeToDuplicate.extent,
    };

    console.log('📋 Duplicating node:', nodeId, 'as', newNode.id);
    rfSetNodes((nds: FlowNode[]) => [...nds, newNode]);
    hideContextMenu();
  }, [reactFlowInstance, hideContextMenu]);

  const duplicateSelectedNodes = useCallback(() => {
    const { getNodes, setNodes: rfSetNodes } = reactFlowInstance;
    
    // Obtener nodos seleccionados directamente del reactFlowInstance
    const currentNodes = getNodes();
    const nodesToDuplicate = currentNodes.filter((n: FlowNode) => n.selected);
    
    if (nodesToDuplicate.length === 0) {
      console.warn('No nodes selected to duplicate');
      return;
    }
    
    console.log('📋 Starting duplication of nodes:', nodesToDuplicate.length);
    
    const newNodes: FlowNode[] = [];
    const idMapping = new Map<string, string>(); // Mapear IDs antiguos a nuevos
    
    // Duplicar todos los nodos seleccionados
    nodesToDuplicate.forEach((node: FlowNode) => {
      const timestamp = Date.now() + Math.random(); // Asegurar IDs únicos
      const newId = `${node.type}-duplicate-${Math.floor(timestamp)}`;
      idMapping.set(node.id, newId);
      
      const newNode: FlowNode = {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        },
        selected: true, // Mantener seleccionados los nodos duplicados
        data: { ...node.data }, // Clonar data
        style: { ...node.style }, // Clonar style
      };
      
      // Si el nodo es un hijo de un grupo, mantener el parentId si el grupo no está siendo duplicado
      if (node.parentId && !nodesToDuplicate.some((n: FlowNode) => n.id === node.parentId)) {
        // Mantener el mismo parentId
        newNode.parentId = node.parentId;
        newNode.extent = node.extent;
        newNode.hidden = node.hidden;
      } else if (node.parentId && nodesToDuplicate.some((n: FlowNode) => n.id === node.parentId)) {
        // El padre también está siendo duplicado, actualizar después
        newNode.parentId = undefined;
      }
      
      newNodes.push(newNode);
    });
    
    // Actualizar parentIds para los nodos que tienen padres duplicados
    newNodes.forEach(newNode => {
      const originalNode = nodesToDuplicate.find((n: FlowNode) => 
        idMapping.get(n.id) === newNode.id
      );
      if (originalNode?.parentId && idMapping.has(originalNode.parentId)) {
        newNode.parentId = idMapping.get(originalNode.parentId);
        newNode.extent = 'parent' as const;
        newNode.hidden = true;
      }
    });
    
    console.log('✅ Created duplicate nodes:', newNodes);
    
    // Actualizar los nodos
    rfSetNodes((nds: FlowNode[]) => {
      // Deseleccionar nodos originales
      const updatedOriginals = nds.map((n: FlowNode) => 
        nodesToDuplicate.some((orig: FlowNode) => orig.id === n.id) 
          ? { ...n, selected: false }
          : n
      );
      return [...updatedOriginals, ...newNodes];
    });
    
    hideContextMenu();
  }, [reactFlowInstance, hideContextMenu]);

  const saveGroupName = useCallback((newName: string) => {
    const { setNodes: rfSetNodes } = reactFlowInstance;
    const editingGroupFromStore = useEditorStore.getState().editingGroup;
    if (!editingGroupFromStore) return;
    
    rfSetNodes((ns: FlowNode[]) => 
      ns.map((n: FlowNode) => 
        n.id === editingGroupFromStore.id 
          ? { ...n, data: { ...n.data, label: newName } } 
          : n
      )
    );
    setEditingGroup(null);
    hideContextMenu();
  }, [reactFlowInstance, setEditingGroup, hideContextMenu]);

  return {
    handleDeleteNodeFromContextMenu,
    deleteSelectedElements,
    groupSelectedNodes,
    ungroupNodes,
    optimizeNodesInGroup, 
    startEditingGroupName,
    moveNodesToBack,
    duplicateNode,
    duplicateSelectedNodes,
    saveGroupName,
    hideContextMenu: () => {
      setContextMenu({ visible: false, x: 0, y: 0, nodeId: null, nodeType: null, isPane: false });
    },
  };
}
