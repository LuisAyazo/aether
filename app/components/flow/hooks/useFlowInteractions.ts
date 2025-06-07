import { useCallback } from 'react';
import {
  useReactFlow,
  addEdge,
  // Node, // Se usará any o un alias
  // Connection, // Se usará any o un alias
  // Edge, // Se usará any o un alias
  // XYPosition, // Se usará any o un alias
  applyNodeChanges,
} from 'reactflow';

// Tipos workaround como en FlowEditor.tsx
type Node = any;
type Connection = any;
type Edge = any;
type XYPosition = any;
import { useEditorStore } from './useEditorStore';
// import { shallow } from 'zustand/shallow'; // No se usará shallow aquí
import { useSelectedEdgeType } from '@/app/contexts/SelectedEdgeTypeContext';
import { LogicalEdgeType, getEdgeConfig, CustomEdgeData } from '@/app/config/edgeConfig';
import type { ContextMenu, ResourceItem } from '../types/editorTypes'; // ToolType no se usa directamente aquí
import { 
  GROUP_HEADER_HEIGHT, 
  CHILD_NODE_PADDING_X, 
  CHILD_NODE_PADDING_Y,
  MIN_EXPANDED_GROUP_WIDTH,
  MIN_EXPANDED_GROUP_HEIGHT
} from '../utils/constants';

interface UseFlowInteractionsProps {
  nodes: Node[]; 
  setNodes: (updater: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (updater: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onConnectProp?: (params: Connection) => void; 
  reactFlowWrapperRef: React.RefObject<HTMLDivElement | null>; // Permitir null
  activeDrag: { item: ResourceItem, offset: XYPosition, elementSize?: { width: number, height: number } } | null; 
  setActiveDrag: (drag: { item: ResourceItem, offset: XYPosition, elementSize?: { width: number, height: number } } | null) => void; 
  findGroupAtPosition: (position: XYPosition) => Node | undefined; 
  handleExpandGroupView: (groupId: string) => void; 
}

export function useFlowInteractions({
  nodes,
  setNodes,
  setEdges,
  onConnectProp,
  reactFlowWrapperRef,
  activeDrag,
  setActiveDrag,
  findGroupAtPosition,
  handleExpandGroupView,
}: UseFlowInteractionsProps) {
  const reactFlowInstance = useReactFlow();
  const { selectedLogicalType } = useSelectedEdgeType();

  // Seleccionar cada pieza del estado individualmente
  const activeTool = useEditorStore(state => state.activeTool);
  const setActiveTool = useEditorStore(state => state.setActiveTool);
  const setSelectedEdge = useEditorStore(state => state.setSelectedEdge);
  const hideContextMenu = useEditorStore(state => state.hideContextMenu);
  const setContextMenuState = useEditorStore(state => state.setContextMenu); // Renombrado para la función local
  const setIsCanvasDragging = useEditorStore(state => state.setIsCanvasDragging);


  const setContextMenu = useCallback((menuUpdate: Partial<ContextMenu>) => { // Usar ContextMenu
    setContextMenuState(menuUpdate);
  }, [setContextMenuState]); // setContextMenuState del store es estable

  const onConnectInternal = useCallback(
    (params: Connection) => {
      const { source, target, sourceHandle, targetHandle } = params;
      if (!source || !target) {
        console.warn("onConnectInternal: source o target es null", params);
        return;
      }
      const logicalTypeToUse = selectedLogicalType || LogicalEdgeType.CONNECTS_TO;
      const config = getEdgeConfig(logicalTypeToUse);
      const newEdge: Edge = { // Cambiado Edge<CustomEdgeData> a Edge (que es any)
        source: source!,
        target: target!,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        id: `edge-${Date.now()}-${source!}-${target!}`,
        type: config.visualType,
        style: config.style,
        markerEnd: config.markerEnd,
        data: { label: config.label, edgeKind: config.logicalType },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      if (onConnectProp) onConnectProp(params);
    },
    [selectedLogicalType, setEdges, onConnectProp]
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      setSelectedEdge(null);
      hideContextMenu();
      if (activeTool === 'lasso') return;

      if ((activeTool === 'note' || activeTool === 'text') && reactFlowInstance) {
        event.preventDefault();
        event.stopPropagation();
        document.body.style.cursor = 'crosshair';
        const pos = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const type = activeTool === 'note' ? 'noteNode' : 'textNode';
        const data = activeTool === 'note' 
          ? { text: 'Click to edit', backgroundColor: '#FEF08A', textColor: '#1F2937', fontSize: 14 } 
          : { text: 'Click to edit', fontSize: 16, fontWeight: 'normal', textAlign: 'left', textColor: '#000000', backgroundColor: 'transparent', borderStyle: 'none' };
        const newNode: Node = { 
          id: `${activeTool}-${Date.now()}`, 
          type, 
          position: pos, 
          data, 
          selected: true, 
          draggable: true, 
          selectable: true,
          // style: { zIndex: 1 } // zIndex se manejará a nivel de objeto nodo
          zIndex: 2 // Nodos de nota/texto encima de grupos
        };
        setNodes(nds => applyNodeChanges([{ type: 'add', item: newNode }], nds));
        // Cambiar a la herramienta de selección después de añadir el nodo
        setActiveTool('select'); 
        return;
      }
      document.body.style.cursor = 'default';
    },
    [activeTool, reactFlowInstance, setNodes, setSelectedEdge, hideContextMenu, setActiveTool]
  );

  const onEdgeClick = useCallback(
    (evt: React.MouseEvent, edge: Edge) => {
      evt.stopPropagation();
      setSelectedEdge(edge);
    },
    [setSelectedEdge]
  );
  
  const handleNodeContextMenu = useCallback(
    (evt: React.MouseEvent, node: Node) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (!node.selected) {
        // Considerar seleccionar el nodo aquí si es necesario
      }
      setContextMenu({ 
        visible: true, 
        x: evt.clientX, 
        y: evt.clientY, 
        nodeId: node.id, 
        nodeType: node.type || null, 
        isPane: false, 
        parentInfo: null 
      });
    },
    [setContextMenu, reactFlowInstance]
  );

  const handlePaneContextMenu = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault();
      hideContextMenu();
    },
    [hideContextMenu]
  );

  const onNodeDragStart = useCallback(() => {
    setIsCanvasDragging(true);
  }, [setIsCanvasDragging]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      setIsCanvasDragging(false);

      // Deseleccionar el AreaNode después de arrastrarlo
      if (draggedNode.type === 'areaNode') {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === draggedNode.id
              ? { ...n, selected: false }
              : n
          )
        );
      }
      
      const targetGroup = nodes.find(
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
        const nodesToUpdate = reactFlowInstance.getNodes().map((n: Node) => { // Añadido tipo explícito a n
          if (n.id === draggedNode.id) {
            const newPosition = { 
              x: (draggedNode.positionAbsolute?.x ?? 0) - (targetGroup.positionAbsolute?.x ?? 0),
              y: (draggedNode.positionAbsolute?.y ?? 0) - (targetGroup.positionAbsolute?.y ?? 0),
            };

            if (targetGroup.data.isExpandedView) {
               newPosition.x = Math.max(CHILD_NODE_PADDING_X, Math.min(newPosition.x, (targetGroup.width ?? MIN_EXPANDED_GROUP_WIDTH) - (draggedNode.width ?? 150) - CHILD_NODE_PADDING_X));
               newPosition.y = Math.max(GROUP_HEADER_HEIGHT + CHILD_NODE_PADDING_Y, Math.min(newPosition.y, (targetGroup.height ?? MIN_EXPANDED_GROUP_HEIGHT) - (draggedNode.height ?? 50) - CHILD_NODE_PADDING_Y));
            }
            return {
              ...n,
              parentId: targetGroup.id,
              extent: 'parent' as const, 
              position: newPosition,
              hidden: true, 
              style: { ...n.style, width: n.width || undefined, height: n.height || undefined },
            };
          }
          return n;
        });
    
        if (targetGroup.data.isExpandedView) {
          // Lógica de ajuste de tamaño y posición de hijos si el grupo está expandido
        }
        setTimeout(() => setNodes(nodesToUpdate), 0);
      }
    },
    [setIsCanvasDragging, nodes, reactFlowInstance, setNodes]
  );
  
  const onDrop = useCallback(
    (evt: React.DragEvent) => {
      evt.preventDefault();
      document.body.style.cursor = 'default';
      if (activeTool === 'area') {
        setActiveTool('select');
        return;
      }
      const bounds = reactFlowWrapperRef.current?.getBoundingClientRect();
      if (!bounds || !reactFlowInstance || !activeDrag) return;

      try {
        const itemData = activeDrag.item;
        const offset = activeDrag.offset;
        let nodeW = 200, nodeH = 100;
        if (itemData.type === 'note') { nodeW = 200; nodeH = 120; }
        else if (itemData.type === 'text') { nodeW = 150; nodeH = 80; }
        else if (itemData.type === 'group') { nodeW = 300; nodeH = 200; }
        
        const dropPosition = reactFlowInstance.screenToFlowPosition({ x: evt.clientX - offset.x, y: evt.clientY - offset.y });
        let newNodeToAdd: Node;
        // const defaultNodeStyle = { zIndex: 1 }; // Ya no se usa zIndex en style

        if (itemData.type === 'note') newNodeToAdd = { id: `note-${Date.now()}`, type: 'noteNode', position: dropPosition, data: { text: 'Click to edit', backgroundColor: '#FEF08A', textColor: '#1F2937', fontSize: 14 }, draggable: true, selectable: true, zIndex: 2 };
        else if (itemData.type === 'text') newNodeToAdd = { id: `text-${Date.now()}`, type: 'textNode', position: dropPosition, data: { text: 'Click to edit', fontSize: 16, fontWeight: 'normal', textAlign: 'left', textColor: '#000000', backgroundColor: 'transparent', borderStyle: 'none' }, draggable: true, selectable: true, zIndex: 2 };
        else newNodeToAdd = { id: `${itemData.type}-${Date.now()}`, type: itemData.type, position: dropPosition, data: { label: itemData.name, description: itemData.description, provider: itemData.provider }, draggable: true, selectable: true, connectable: true, style: { width: nodeW, height: nodeH }, zIndex: 2 };
        
        const targetGroupNode = findGroupAtPosition(dropPosition);
        if (targetGroupNode) {
          const parentNode = reactFlowInstance.getNode(targetGroupNode.id);
          if (parentNode) {
            newNodeToAdd.parentId = targetGroupNode.id;
            newNodeToAdd.extent = 'parent' as const;
            newNodeToAdd.hidden = true; 
            
            if (parentNode.data.isExpandedView) {
              const relativePos = { x: dropPosition.x - (parentNode.positionAbsolute?.x ?? parentNode.position.x), y: dropPosition.y - (parentNode.positionAbsolute?.y ?? parentNode.position.y) };
              const groupWidth = parentNode.width || MIN_EXPANDED_GROUP_WIDTH; 
              const groupHeight = parentNode.height || MIN_EXPANDED_GROUP_HEIGHT; 
              const marginX = CHILD_NODE_PADDING_X;
              const marginY = GROUP_HEADER_HEIGHT + CHILD_NODE_PADDING_Y;
              newNodeToAdd.position = { x: Math.max(marginX, Math.min(groupWidth - nodeW - marginX, relativePos.x)), y: Math.max(marginY, Math.min(groupHeight - nodeH - CHILD_NODE_PADDING_Y, relativePos.y)) };
            } else {
              newNodeToAdd.position = { x: CHILD_NODE_PADDING_X, y: GROUP_HEADER_HEIGHT + CHILD_NODE_PADDING_Y };
            }
          }
        }
        setNodes(nds => applyNodeChanges([{ type: 'add', item: newNodeToAdd }], nds));
        if (newNodeToAdd.parentId) {
          const parentNodeDetails = reactFlowInstance.getNode(newNodeToAdd.parentId);
          if (parentNodeDetails?.data.isExpandedView) {
            // handleExpandGroupView(newNodeToAdd.parentId); 
          }
        }
        setActiveTool('select');
        document.body.style.cursor = 'default';
      } catch (err) {
        console.error("Error drop:", err);
      } finally {
        setActiveDrag(null);
      }
    },
    [reactFlowInstance, findGroupAtPosition, setNodes, activeDrag, setActiveDrag, activeTool, setActiveTool, reactFlowWrapperRef, handleExpandGroupView]
  );

  const onDragOver = useCallback(
    (evt: React.DragEvent) => {
      if (activeTool === 'area' || activeTool === 'text') {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'none';
        return;
      }
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'move';
      document.body.style.cursor = 'crosshair';
    },
    [activeTool]
  );

  const onDragEndSidebar = useCallback(() => { 
    setActiveDrag(null);
    document.body.style.cursor = 'default';
  }, [setActiveDrag]);


  return {
    onConnectInternal,
    handlePaneClick,
    onEdgeClick,
    handleNodeContextMenu,
    handlePaneContextMenu,
    onNodeDragStart,
    onNodeDragStop,
    onDrop,
    onDragOver,
    onDragEndSidebar,
  };
}
