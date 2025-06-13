import { useEffect, useMemo } from 'react';
import { 
  useNodesState, 
  useEdgesState, 
  Node,
  Edge,
} from 'reactflow';
import type { CustomEdgeData } from "../../../config/edgeConfig";
// Asegúrate de que FlowNode y FlowEdge se importen correctamente si usas alias, o usa Node y Edge directamente.
// Por consistencia con editorTypes.ts, usaremos Node y Edge de reactflow.

// Tipos para las props del hook
interface UseFlowStateProps {
  initialNodes?: Node[];
  initialEdges?: Edge<CustomEdgeData>[];
}

export function useFlowState({ 
  initialNodes = [], 
  initialEdges = [] 
}: UseFlowStateProps) {
  
  const processedInitialNodes = useMemo(() => {
    return initialNodes.map(node => {
      if (node.parentId) {
        const parentNode = initialNodes.find(n => n.id === node.parentId);
        // Si el padre es un grupo y no está en modo 'expanded view' (implícito por ahora),
        // los hijos deberían estar ocultos y con extent='parent'.
        // Esta lógica podría necesitar ajustes si 'isExpandedView' se maneja de forma más explícita en el nodo padre.
        const isHiddenByCollapsedParent = parentNode?.type === 'group'; // Simplificación inicial
        return {
          ...node,
          hidden: node.hidden !== undefined ? node.hidden : isHiddenByCollapsedParent, // Respetar hidden si ya está definido
          extent: node.extent || (parentNode ? 'parent' : undefined),
        };
      }
      if (node.type === 'group') {
        return {
          ...node,
          data: {
            ...node.data,
            // Asegurar que isExpandedView y isMinimized tengan valores por defecto si no existen
            isExpandedView: node.data?.isExpandedView || false,
            isMinimized: node.data?.isMinimized || false,
          }
        };
      }
      return node;
    });
  }, [initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(processedInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sincronizar con initialNodes y initialEdges si cambian externamente
  // Esto es importante si el diagrama se recarga o cambia desde el componente padre.
  useEffect(() => {
    // Solo actualiza si los initialNodes realmente han cambiado para evitar bucles innecesarios.
    // Una comparación profunda podría ser costosa; una comparación de longitud o referencia puede ser un primer paso.
    // Aquí, una simple resincronización si la referencia de initialNodes cambia.
    // Considerar una estrategia de comparación más robusta si es necesario.
    setNodes(processedInitialNodes);
  }, [initialNodes, setNodes, processedInitialNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
  };
}
