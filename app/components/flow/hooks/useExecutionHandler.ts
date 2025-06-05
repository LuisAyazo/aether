import { useCallback, Dispatch, SetStateAction } from 'react';
import { Node } from 'reactflow';
import { NodeExecutionState, NodeWithExecutionStatus } from '../../../utils/customTypes';

interface UseExecutionHandlerProps {
  setExecutionLogs: Dispatch<SetStateAction<string[]>>;
}

export function useExecutionHandler({ setExecutionLogs }: UseExecutionHandlerProps) {
  const getExecutionMessage = useCallback((node: NodeWithExecutionStatus, state: NodeExecutionState): string => {
    const n = node as Node; // Castear a Node para acceder a data
    const name = n.data?.label || 'Unnamed Node';
    const details = [];
    if (n.data?.provider) details.push(`Provider: ${n.data.provider}`);
    if (n.data?.resourceType) details.push(`Type: ${n.data.resourceType}`);
    const detailsString = details.length > 0 ? ` (${details.join(', ')})` : '';

    switch (state) {
      case 'creating':
        return `Iniciando creación de ${name}${detailsString}...`;
      case 'updating':
        return `Iniciando actualización de ${name}${detailsString}...`;
      case 'deleting':
        return `Iniciando eliminación de ${name}${detailsString}...`;
      case 'success':
        return `${name} procesado exitosamente.`;
      case 'error':
        return `Error al procesar ${name}.`;
      default:
        return `Procesando ${name}...`;
    }
  }, []);

  const simulateNodeExecution = useCallback(async (node: NodeWithExecutionStatus, state: NodeExecutionState) => {
    setExecutionLogs(prevLogs => [...prevLogs, getExecutionMessage(node, state)]);
    // Simular un delay para la ejecución
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, [setExecutionLogs, getExecutionMessage]);

  return {
    simulateNodeExecution,
    // getExecutionMessage no necesita ser exportado si solo lo usa simulateNodeExecution internamente
  };
}
