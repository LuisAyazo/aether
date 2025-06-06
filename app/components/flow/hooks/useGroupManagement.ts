import { useCallback, RefObject } from 'react';
import { useReactFlow, /* Node, Viewport, */ applyNodeChanges } from 'reactflow'; // Node y Viewport se definirán localmente
import { useEditorStore } from './useEditorStore';
import { 
  MIN_EXPANDED_GROUP_WIDTH, 
  MIN_EXPANDED_GROUP_HEIGHT 
} from '../utils/constants';

// Tipos workaround como en otros hooks
type Node = any;
type Viewport = any;

interface UseGroupManagementProps {
  lastViewportRef: RefObject<Viewport | null>;
  // setNodes es obtenible de reactFlowInstance, no es necesario pasarla como prop
  // setExpandedGroupId se obtiene de useEditorStore
}

export function useGroupManagement({ lastViewportRef }: UseGroupManagementProps) {
  const reactFlowInstance = useReactFlow();
  const { setNodes } = reactFlowInstance;
  // Seleccionar cada pieza del estado individualmente
  const expandedGroupId = useEditorStore(state => state.expandedGroupId);
  const setExpandedGroupId = useEditorStore(state => state.setExpandedGroupId);

  const createEmptyGroup = useCallback((provider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic') => {
    const reactFlowWrapperEl = document.querySelector('.react-flow'); // Asumiendo que hay un wrapper con esta clase o se pasa ref
    if (!reactFlowWrapperEl) {
        console.error("React Flow wrapper element not found for createEmptyGroup.");
        return;
    }
    const { width: paneWidth = 1000, height: paneHeight = 800 } = reactFlowWrapperEl.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({
      x: paneWidth / 2,
      y: paneHeight / 2,
    });
    const newGroupId = `group-${Date.now()}`;
    const newGroupNode: Node = {
      id: newGroupId,
      type: 'group',
      position,
      data: { label: 'New Group', provider, isCollapsed: false, isMinimized: false },
      style: { width: 300, height: 200, zIndex: 1 }, // Añadir zIndex para asegurar que esté por encima
    };
    setNodes((nds: Node[]) => applyNodeChanges([{ type: 'add', item: newGroupNode }], nds)); // Añadir tipo a nds
    setTimeout(() => document.dispatchEvent(new CustomEvent('nodesChanged', { detail: { action: 'nodeAdded', nodeIds: [newGroupId] } })), 100);
    return newGroupId;
  }, [reactFlowInstance, setNodes]);

  const handleExpandGroupView = useCallback((groupId: string) => {
    if (reactFlowInstance) {
      lastViewportRef.current = reactFlowInstance.getViewport();
    }
    setNodes((nds: Node[]) => // Añadir tipo a nds
      nds.map((n: Node) => { // Añadir tipo a n
        if (n.id === groupId) {
          const groupData = { ...n.data, isExpandedView: true, isMinimized: false };
          if (!groupData.viewport && reactFlowInstance) {
            groupData.viewport = reactFlowInstance.getViewport();
          }
          delete groupData.nodes;
          delete groupData.edges;
          return { ...n, data: groupData };
        }
        return n;
      })
    );
    setExpandedGroupId(groupId);
  }, [reactFlowInstance, setNodes, setExpandedGroupId, lastViewportRef]);

  const handleCollapseGroupView = useCallback((groupIdToCollapse: string) => {
    // Esta función también necesita saveCurrentDiagramState si se va a llamar desde aquí.
    // Por ahora, la lógica de guardado se mantiene en FlowEditorContent.
    if (expandedGroupId && expandedGroupId !== groupIdToCollapse) {
      const { getNode } = reactFlowInstance;
      const groupNode = getNode(groupIdToCollapse);
      if (!groupNode || !groupNode.data.isExpandedView) {
        return;
      }
      const defaultWidth = MIN_EXPANDED_GROUP_WIDTH;
      const defaultHeight = MIN_EXPANDED_GROUP_HEIGHT;

      setNodes((currentNodesMap: Node[]) => // Añadir tipo a currentNodesMap
        currentNodesMap.map((n: Node) => { // Añadir tipo a n
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
      return;
    }

    setExpandedGroupId(null);
    setNodes((nds: Node[]) => // Añadir tipo a nds
      nds.map((n: Node) => { // Añadir tipo a n
        if (n.id === groupIdToCollapse) {
          return {
            ...n,
            data: { ...n.data, isExpandedView: false },
          };
        }
        if (n.parentId === groupIdToCollapse) {
          return { ...n, hidden: true };
        }
        return n;
      })
    );
    // saveCurrentDiagramState(); // Esta llamada se haría en FlowEditorContent después de colapsar
  }, [reactFlowInstance, setNodes, expandedGroupId, setExpandedGroupId]);

  return {
    createEmptyGroup,
    handleExpandGroupView,
    handleCollapseGroupView,
  };
}
