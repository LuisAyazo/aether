import { useCallback, useEffect } from 'react';
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
import { useSelectedEdgeType } from '../../../contexts/SelectedEdgeTypeContext';
import { LogicalEdgeType, getEdgeConfig, CustomEdgeData } from '../../../config/edgeConfig';
import type { ContextMenu, ResourceItem } from '../types/editorTypes'; // ToolType no se usa directamente aquí
import { 
  GROUP_HEADER_HEIGHT, 
  CHILD_NODE_PADDING_X, 
  CHILD_NODE_PADDING_Y,
  MIN_EXPANDED_GROUP_WIDTH,
  MIN_EXPANDED_GROUP_HEIGHT
} from '../utils/constants';
// import { useDropDebugging } from './useDropDebugging';

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
  // const { debugDropPosition } = useDropDebugging();

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

  useEffect(() => {
    const handleShowContextMenu = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { x, y, items, nodeId } = customEvent.detail;
      setContextMenu({
        visible: true,
        x,
        y,
        nodeId,
        customItems: items,
        isPane: false,
      });
    };

    const handleShowMultipleSelectionMenu = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { x, y } = customEvent.detail;
      setContextMenu({
        visible: true,
        x,
        y,
        nodeId: null,
        nodeType: null,
        isPane: true, // Usar el menú del pane para selección múltiple
        customItems: undefined,
      });
    };

    window.addEventListener('showContextMenu', handleShowContextMenu);
    window.addEventListener('showMultipleSelectionMenu', handleShowMultipleSelectionMenu);
    return () => {
      window.removeEventListener('showContextMenu', handleShowContextMenu);
      window.removeEventListener('showMultipleSelectionMenu', handleShowMultipleSelectionMenu);
    };
  }, [setContextMenu]);

  const onConnectInternal = useCallback(
    (params: Connection) => {
      const { source, target, sourceHandle, targetHandle } = params;
      if (!source || !target) {
        console.warn("onConnectInternal: source o target es null", params);
        return;
      }
      
      // Debug logging for handles
      console.log('🔗 [EDGE CREATION DEBUG] Creating edge with handles:', {
        source,
        target,
        sourceHandle,
        targetHandle,
        params
      });
      
      const logicalTypeToUse = selectedLogicalType || LogicalEdgeType.CONNECTS_TO;
      const config = getEdgeConfig(logicalTypeToUse);
      const newEdge: Edge = { // Cambiado Edge<CustomEdgeData> a Edge (que es any)
        source: source!,
        target: target!,
        sourceHandle: sourceHandle || null,
        targetHandle: targetHandle || null,
        id: `edge-${Date.now()}-${source!}-${target!}`,
        type: config.visualType,
        style: config.style,
        markerEnd: config.markerEnd,
        data: { label: config.label, edgeKind: config.logicalType },
      };
      
      console.log('🔗 [EDGE CREATION DEBUG] New edge object:', newEdge);
      
      setEdges((eds) => addEdge(newEdge, eds));
      if (onConnectProp) onConnectProp(params);
    },
    [selectedLogicalType, setEdges, onConnectProp]
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      // No ocultar el menú contextual si es un click derecho
      if (event.button === 2) return;
      
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
      
      // Verificar si hay múltiples nodos seleccionados
      const selectedNodesCount = reactFlowInstance.getNodes().filter((n: Node) => n.selected).length;
      
      // Si hay más de un nodo seleccionado, mostrar el menú de selección múltiple
      if (selectedNodesCount > 1) {
        setContextMenu({
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          nodeId: null,
          nodeType: null,
          isPane: true, // Usar el menú del pane para selección múltiple
          customItems: undefined,
        });
        return;
      }
      
      // Para nodos de recursos, el menú es manejado por el evento 'showContextMenu'
      // Para otros tipos de nodos (area, note, text), mostrar el menú básico aquí
      const utilityNodeTypes = ['areaNode', 'noteNode', 'textNode'];
      
      if (utilityNodeTypes.includes(node.type) || node.type === 'group') {
        setContextMenu({
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          nodeId: node.id,
          nodeType: node.type,
          isPane: false,
          customItems: undefined, // No usar customItems para estos nodos
        });
      }
    },
    [setContextMenu, reactFlowInstance]
  );

  const handlePaneContextMenu = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      
      const target = evt.target as HTMLElement;
      console.log('[useFlowInteractions] handlePaneContextMenu - target:', target.className);
      
      // Obtener nodos seleccionados directamente del reactFlowInstance
      const selectedNodes = reactFlowInstance.getNodes().filter((n: Node) => n.selected);
      const selectedNodesCount = selectedNodes.length;
      
      console.log('[useFlowInteractions] handlePaneContextMenu - selectedNodesCount:', selectedNodesCount);
      
      // Si el click fue en el rectángulo de selección y hay nodos seleccionados
      if (target.classList?.contains('react-flow__nodesselection-rect') && selectedNodesCount > 0) {
        console.log('[useFlowInteractions] Click on selection rect - showing multiple selection menu');
        const menuState = {
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          nodeId: null,
          nodeType: null,
          isPane: true,
          customItems: undefined,
        };
        console.log('[useFlowInteractions] Setting context menu state:', menuState);
        setContextMenu(menuState);
        
        // Verificar que se está actualizando el estado
        setTimeout(() => {
          const currentState = useEditorStore.getState().contextMenu;
          console.log('[useFlowInteractions] Context menu state after update:', currentState);
        }, 100);
        
        return;
      }
      
      // Si hay nodos seleccionados, mostrar el menú de selección múltiple
      if (selectedNodesCount > 0) {
        console.log('[useFlowInteractions] Showing multiple selection menu');
        const menuState = {
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          nodeId: null,
          nodeType: null,
          isPane: true,
          customItems: undefined,
        };
        console.log('[useFlowInteractions] Setting context menu state:', menuState);
        setContextMenu(menuState);
      } else if (activeTool === 'lasso') {
        // Con lasso activo, permitir menú aunque no haya selección
        setContextMenu({
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          nodeId: null,
          nodeType: null,
          isPane: true,
          customItems: undefined,
        });
      } else {
        // No hay selección y no está el lasso activo - mostrar menú de canvas vacío
        setContextMenu({
          visible: true,
          x: evt.clientX,
          y: evt.clientY,
          nodeId: null,
          nodeType: null,
          isPane: true,
          customItems: undefined,
        });
      }
    },
    [reactFlowInstance, setContextMenu, activeTool]
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
      
      // Primero verificar si el nodo está saliendo de un grupo
      if (draggedNode.parentId) {
        const parentGroup = nodes.find(n => n.id === draggedNode.parentId && n.type === 'group');
        
        if (parentGroup && draggedNode.positionAbsolute && parentGroup.positionAbsolute) {
          // Verificar si el nodo está fuera de los límites del grupo padre
          const nodeOutsideGroup = 
            draggedNode.positionAbsolute.x < parentGroup.positionAbsolute.x ||
            draggedNode.positionAbsolute.x > parentGroup.positionAbsolute.x + (parentGroup.width || 0) ||
            draggedNode.positionAbsolute.y < parentGroup.positionAbsolute.y ||
            draggedNode.positionAbsolute.y > parentGroup.positionAbsolute.y + (parentGroup.height || 0);
          
          if (nodeOutsideGroup) {
            // Sacar el nodo del grupo
            const nodesToUpdate = reactFlowInstance.getNodes().map((n: Node) => {
              if (n.id === draggedNode.id) {
                return {
                  ...n,
                  parentId: undefined,
                  extent: undefined,
                  position: draggedNode.positionAbsolute || draggedNode.position,
                  hidden: false,
                  style: { 
                    ...n.style, 
                    visibility: 'visible',
                    pointerEvents: 'auto',
                    opacity: 1
                  }
                };
              }
              return n;
            });
            setTimeout(() => setNodes(nodesToUpdate), 0);
            return; // Salir de la función para evitar añadir el nodo a otro grupo
          }
        }
      }
      
      // Verificar si el nodo es un recurso (no es nota, texto, área o grupo)
      const isResourceNode = draggedNode.type !== 'noteNode' && 
                           draggedNode.type !== 'textNode' && 
                           draggedNode.type !== 'areaNode' && 
                           draggedNode.type !== 'group';
      
      // Solo permitir que nodos de recursos entren a grupos
      if (!isResourceNode) {
        return;
      }
      
      // Luego verificar si el nodo está entrando a un nuevo grupo
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
        const nodesToUpdate = reactFlowInstance.getNodes().map((n: Node) => {
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
      if (!bounds || !reactFlowInstance || !activeDrag) {
        console.log('🔍 [DROP DEBUG] Missing required elements:', { bounds: !!bounds, reactFlowInstance: !!reactFlowInstance, activeDrag: !!activeDrag });
        return;
      }

      try {
        // Debug the drop position calculation
        // const debugInfo = debugDropPosition(evt, reactFlowInstance, reactFlowWrapperRef, activeDrag);
        
        const itemData = activeDrag.item;
        const offset = activeDrag.offset;
        let nodeW = 200, nodeH = 100;
        if (itemData.type === 'note') { nodeW = 200; nodeH = 120; }
        else if (itemData.type === 'text') { nodeW = 150; nodeH = 80; }
        else if (itemData.type === 'group') { nodeW = 300; nodeH = 200; }
        
        // Try multiple position calculation methods
        const dropPosition1 = reactFlowInstance.screenToFlowPosition({ 
          x: evt.clientX - offset.x, 
          y: evt.clientY - offset.y 
        });
        
        const dropPosition2 = reactFlowInstance.screenToFlowPosition({ 
          x: evt.clientX, 
          y: evt.clientY 
        });
        
        // Use the position that seems more reasonable
        let dropPosition = dropPosition1;
        
        // Check if position1 results in negative coordinates or very large coordinates that might be outside viewport
        const viewport = reactFlowInstance.getViewport();
        const canvasWidth = bounds.width;
        const canvasHeight = bounds.height;
        
        // Calculate flow canvas bounds
        const flowBounds = {
          left: -viewport.x / viewport.zoom,
          top: -viewport.y / viewport.zoom,
          right: (-viewport.x + canvasWidth) / viewport.zoom,
          bottom: (-viewport.y + canvasHeight) / viewport.zoom
        };
        
        console.log('🔍 [DROP DEBUG] Position comparison:', {
          dropPosition1,
          dropPosition2,
          flowBounds,
          isPosition1InBounds: dropPosition1.x >= flowBounds.left && dropPosition1.x <= flowBounds.right && 
                              dropPosition1.y >= flowBounds.top && dropPosition1.y <= flowBounds.bottom,
          isPosition2InBounds: dropPosition2.x >= flowBounds.left && dropPosition2.x <= flowBounds.right && 
                              dropPosition2.y >= flowBounds.top && dropPosition2.y <= flowBounds.bottom
        });
        
        // If position1 is way outside bounds, use position2 instead
        if (dropPosition1.x < flowBounds.left - 1000 || dropPosition1.x > flowBounds.right + 1000 ||
            dropPosition1.y < flowBounds.top - 1000 || dropPosition1.y > flowBounds.bottom + 1000) {
          console.log('🔍 [DROP DEBUG] Using alternative position calculation');
          dropPosition = dropPosition2;
        }
        
        console.log('🔍 [DROP DEBUG] Final drop position:', dropPosition);
        let newNodeToAdd: Node;
        
        if (itemData.type === 'note') newNodeToAdd = { id: `note-${Date.now()}`, type: 'noteNode', position: dropPosition, data: { text: 'Click to edit', backgroundColor: '#FEF08A', textColor: '#1F2937', fontSize: 14 }, draggable: true, selectable: true, zIndex: 2 };
        else if (itemData.type === 'text') newNodeToAdd = { id: `text-${Date.now()}`, type: 'textNode', position: dropPosition, data: { text: 'Click to edit', fontSize: 16, fontWeight: 'normal', textAlign: 'left', textColor: '#000000', backgroundColor: 'transparent', borderStyle: 'none' }, draggable: true, selectable: true, zIndex: 2 };
        else newNodeToAdd = { id: `${itemData.type}-${Date.now()}`, type: itemData.type, position: dropPosition, data: { label: itemData.name, description: itemData.description, provider: itemData.provider }, draggable: true, selectable: true, connectable: true, style: { width: nodeW, height: nodeH }, zIndex: 2 };
        
        console.log('🔍 [DROP DEBUG] Created node:', newNodeToAdd);
        
        // Verificar si el nodo es un recurso antes de permitir que entre a un grupo
        const isResourceNode = itemData.type !== 'note' && 
                             itemData.type !== 'text' && 
                             itemData.type !== 'group' &&
                             newNodeToAdd.type !== 'noteNode' &&
                             newNodeToAdd.type !== 'textNode' &&
                             newNodeToAdd.type !== 'areaNode';
        
        const targetGroupNode = findGroupAtPosition(dropPosition);
        console.log('🔍 [DROP DEBUG] Target group node:', targetGroupNode);
        
        if (targetGroupNode && isResourceNode) {
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
        
        console.log('🔍 [DROP DEBUG] Final node to add:', newNodeToAdd);
        setNodes(nds => {
          const newNodes = applyNodeChanges([{ type: 'add', item: newNodeToAdd }], nds);
          console.log('🔍 [DROP DEBUG] Updated nodes count:', newNodes.length);
          return newNodes;
        });
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
