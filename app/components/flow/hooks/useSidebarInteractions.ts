import { useCallback } from 'react';
// import type { XYPosition } from 'reactflow'; // Eliminada debido a problemas de declaración de módulo
import type { ResourceItem } from '../types/editorTypes';
import { useEditorStore } from './useEditorStore';

// Definición local simple para XYPosition como workaround
interface SimpleXYPosition { x: number; y: number; }

interface UseSidebarInteractionsProps {
  setActiveDrag: (
    drag: { 
      item: ResourceItem; 
      offset: SimpleXYPosition; // Usar tipo local
      elementSize?: { width: number; height: number }; 
    } | null
  ) => void;
}

export function useSidebarInteractions({ setActiveDrag }: UseSidebarInteractionsProps) {
  const activeTool = useEditorStore(state => state.activeTool);

  const onDragStartSidebar = useCallback(
    (event: React.DragEvent, item: ResourceItem) => { 
      if (activeTool === 'area' || activeTool === 'text') {
        event.preventDefault();
        return;
      }
      
      const transferableItem = {
        type: item.type,
        name: item.name, 
        provider: item.provider,
        data: item.data, 
      };

      console.log('Intentando transferir este item:', transferableItem);
      // console.log('Detalle de item.data:', item.data); // Log adicional si es necesario

      try {
        const jsonString = JSON.stringify(transferableItem);
        console.log('String JSON resultante para setData:', jsonString);
        event.dataTransfer.setData('application/reactflow', jsonString);
      } catch (e) {
        console.error('Error al serializar transferableItem con JSON.stringify:', e, transferableItem);
        // Intentar serializar una versión aún más simplificada si la anterior falla
        const simplifiedErrorCase = { type: item.type, name: item.name, provider: item.provider };
        console.error('Intentando serializar versión ultra-simplificada:', simplifiedErrorCase);
        try {
          event.dataTransfer.setData('application/reactflow', JSON.stringify(simplifiedErrorCase));
        } catch (e2) {
          console.error('Error incluso con versión ultra-simplificada:', e2, simplifiedErrorCase);
          // Como último recurso, transferir solo el tipo si todo lo demás falla
          event.dataTransfer.setData('application/reactflow', JSON.stringify({type: item.type}));
        }
      }
      
      event.dataTransfer.effectAllowed = 'move';
      
      const element = event.currentTarget as HTMLElement; 
      const rect = element.getBoundingClientRect();
      
      // El 'item' completo (con el icono JSX.Element) se usa para setActiveDrag,
      // lo cual es para el estado local de React y no se serializa con JSON.stringify aquí.
      // Si setActiveDrag causara un problema de serialización en otro lugar, sería un issue diferente.
      setActiveDrag({
        item, 
        offset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        elementSize: { width: rect.width, height: rect.height },
      });
      document.body.style.cursor = 'crosshair';
    },
    [activeTool, setActiveDrag]
  );

  return {
    onDragStartSidebar,
  };
}
