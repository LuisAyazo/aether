import { useCallback } from 'react';
import { useEditorStore } from './useEditorStore';

// Tipos temporales mientras resolvemos el problema con los tipos de reactflow
type FlowNode = any;
type FlowEdge = any;
type Viewport = any;

interface UseGroupViewControlsProps {
  setNodes: (updater: FlowNode[] | ((nodes: FlowNode[]) => FlowNode[])) => void;
  setEdges: (updater: FlowEdge[] | ((edges: FlowEdge[]) => FlowEdge[])) => void;
}

export function useGroupViewControls({ setNodes, setEdges }: UseGroupViewControlsProps) {
  // Seleccionar cada pieza del estado individualmente
  const expandedGroupId = useEditorStore(state => state.expandedGroupId);
  const setExpandedGroupId = useEditorStore(state => state.setExpandedGroupId);

  const handleGroupSave = useCallback(
    (updatedNodesInGroup: FlowNode[], newEdgesInGroup: FlowEdge[], groupViewport?: Viewport) => {
      if (!expandedGroupId) return;

      setNodes((currentNodes) => {
        const groupNodeFromState = currentNodes.find(n => n.id === expandedGroupId);
        const groupNodeData = groupNodeFromState?.data ? { ...groupNodeFromState.data } : {};
        
        groupNodeData.isExpandedView = false; 
        groupNodeData.isMinimized = groupNodeFromState?.data?.isMinimized || false; 
        
        if (groupViewport) {
          console.log('💾 [GROUP SAVE] Storing viewport in group node:', groupViewport);
          groupNodeData.viewport = groupViewport;
        }
        
        delete groupNodeData.nodes;
        delete groupNodeData.edges;

        const updatedGroupNode = groupNodeFromState ? {
          ...groupNodeFromState,
          data: groupNodeData,
        } : undefined;
        
        // TODOS los nodos que vienen del grupo deben estar ocultos
        const finalUpdatedNodesFromGroupView = updatedNodesInGroup.map(un => ({
          ...un,
          hidden: true, // TODOS los nodos del grupo deben estar ocultos
          style: {
            ...un.style,
            visibility: 'hidden',
            pointerEvents: 'none',
            opacity: 0
          }
        }));
        
        const updatedNodesMap = new Map(finalUpdatedNodesFromGroupView.map(n => [n.id, n]));

        const newNodesList: FlowNode[] = [];
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
        const childNodeIdsInGroup = new Set(updatedNodesInGroup.map(n => n.id));
        const edgesOutsideOrUnrelated = currentEdges.filter(edge => 
          !(childNodeIdsInGroup.has(edge.source) && childNodeIdsInGroup.has(edge.target)) && 
          !(edge.source === expandedGroupId || edge.target === expandedGroupId) 
        );
        return [...edgesOutsideOrUnrelated, ...newEdgesInGroup];
      });

      setExpandedGroupId(null); 
    },
    [expandedGroupId, setNodes, setEdges, setExpandedGroupId]
  );

  return {
    handleGroupSave,
  };
}
