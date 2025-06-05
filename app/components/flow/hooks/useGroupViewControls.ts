import { useCallback } from 'react';
import type { Node, Edge, Viewport } from 'reactflow';
import { useEditorStore } from './useEditorStore';

interface UseGroupViewControlsProps {
  setNodes: (updater: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (updater: Edge[] | ((edges: Edge[]) => Edge[])) => void;
}

export function useGroupViewControls({ setNodes, setEdges }: UseGroupViewControlsProps) {
  // Seleccionar cada pieza del estado individualmente
  const expandedGroupId = useEditorStore(state => state.expandedGroupId);
  const setExpandedGroupId = useEditorStore(state => state.setExpandedGroupId);

  const handleGroupSave = useCallback(
    (updatedNodesInGroup: Node[], newEdgesInGroup: Edge[], groupViewport?: Viewport) => {
      if (!expandedGroupId) return;

      setNodes((currentNodes) => {
        const groupNodeFromState = currentNodes.find(n => n.id === expandedGroupId);
        const groupNodeData = groupNodeFromState?.data ? { ...groupNodeFromState.data } : {};
        
        groupNodeData.isExpandedView = false; 
        groupNodeData.isMinimized = groupNodeFromState?.data?.isMinimized || false; 
        
        if (groupViewport) {
          groupNodeData.viewport = groupViewport;
        }
        
        delete groupNodeData.nodes;
        delete groupNodeData.edges;

        const updatedGroupNode = groupNodeFromState ? {
          ...groupNodeFromState,
          data: groupNodeData,
        } : undefined;
        
        const finalUpdatedNodesFromGroupView = updatedNodesInGroup.map(un => ({
          ...un,
          hidden: true, 
          parentId: expandedGroupId, 
          extent: 'parent' as const, 
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
