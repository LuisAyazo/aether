import { useCallback, useEffect, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { useEditorStore } from './useEditorStore';
import { debounce } from 'lodash';

// Type aliases to work around ReactFlow TypeScript issues
type FlowNode = any;
type FlowEdge = any;
type FlowViewport = any;

interface UseSaveHandlerProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onSave?: (diagramData: { nodes: FlowNode[]; edges: FlowEdge[]; viewport?: FlowViewport }) => void;
  expandedGroupId: string | null;
}

export function useSaveHandler({
  nodes,
  edges,
  onSave,
  expandedGroupId,
}: UseSaveHandlerProps) {
  const reactFlowInstance = useReactFlow();
  const onSaveRef = useRef(onSave);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousNodesRef = useRef<string | null>(null);
  const previousEdgesRef = useRef<string | null>(null);
  const isCanvasDragging = useEditorStore(state => state.isCanvasDragging);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const saveCurrentDiagramState = useCallback(() => {
    if (reactFlowInstance && onSaveRef.current) {
      const viewport = reactFlowInstance.getViewport();
      const diagramDataToSave = {
        nodes,
        edges,
        viewport,
      };
      onSaveRef.current(diagramDataToSave);
      console.log('[FlowEditor][useSaveHandler] Saving diagram. Nodes:', nodes.length, 'Edges:', edges.length);
    }
  }, [reactFlowInstance, nodes, edges, onSaveRef]);

  useEffect(() => {
    if (onSaveRef.current && reactFlowInstance && !isCanvasDragging) {
      const currentNodesJSON = JSON.stringify(nodes);
      const currentEdgesJSON = JSON.stringify(edges);

      if (
        currentNodesJSON !== previousNodesRef.current ||
        currentEdgesJSON !== previousEdgesRef.current
      ) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
          saveCurrentDiagramState();
        }, 1000);

        previousNodesRef.current = currentNodesJSON;
        previousEdgesRef.current = currentEdgesJSON;
      }
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [nodes, edges, reactFlowInstance, saveCurrentDiagramState, isCanvasDragging]);

  // Este efecto se maneja ahora directamente en FlowCanvas con onMove

  return {
    saveCurrentDiagramState, // Exportar para uso manual si es necesario (ej. Toolbar)
  };
}
