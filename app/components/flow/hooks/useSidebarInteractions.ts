import { useCallback } from 'react';
import type { XYPosition } from 'reactflow';
import type { ResourceItem } from '../types/editorTypes'; // Corregido EditorResourceItem a ResourceItem, ToolType eliminado
import { useEditorStore } from './useEditorStore';

interface UseSidebarInteractionsProps {
  setActiveDrag: (
    drag: { 
      item: ResourceItem; // Usar tipo corregido
      offset: XYPosition; 
      elementSize?: { width: number; height: number }; 
    } | null
  ) => void;
}

export function useSidebarInteractions({ setActiveDrag }: UseSidebarInteractionsProps) {
  const activeTool = useEditorStore(state => state.activeTool);

  const onDragStartSidebar = useCallback(
    (event: React.DragEvent, item: ResourceItem) => { // Usar tipo corregido
      if (activeTool === 'area' || activeTool === 'text') {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData('application/reactflow', JSON.stringify(item));
      event.dataTransfer.effectAllowed = 'move';
      
      const element = event.currentTarget as HTMLElement; // O el tipo más específico del elemento que se arrastra
      const rect = element.getBoundingClientRect();
      
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
