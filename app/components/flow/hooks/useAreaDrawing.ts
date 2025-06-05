import { useState, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { useReactFlow, Node, applyNodeChanges } from 'reactflow'; // Viewport eliminado
import type { ToolType as EditorToolType } from '../types/editorTypes';

interface UseAreaDrawingProps {
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  activeTool: EditorToolType | null;
}

interface AreaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useAreaDrawing({ setNodes, activeTool }: UseAreaDrawingProps) {
  const reactFlowInstance = useReactFlow();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<AreaRect | null>(null);

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (activeTool !== 'area' || !reactFlowInstance) return;

      const target = event.target as HTMLElement;
      if (
        target.closest('.react-flow__node') ||
        target.closest('.react-flow__edge') ||
        target.closest('.react-flow__handle') ||
        target.closest('.react-flow__controls') ||
        target.closest('.react-flow__minimap') ||
        !target.closest('.react-flow__pane')
      ) {
        return;
      }
      
      event.preventDefault();
      event.stopPropagation();

      const panePosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      setIsDrawing(true);
      setStartPos(panePosition);
      setCurrentRect({ x: panePosition.x, y: panePosition.y, width: 0, height: 0 });
      document.body.classList.add('area-drawing-mode');
    },
    [activeTool, reactFlowInstance]
  );

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !startPos || !reactFlowInstance) return;
      
      event.preventDefault();
      event.stopPropagation();

      const currentPanePosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setCurrentRect({
        x: Math.min(startPos.x, currentPanePosition.x),
        y: Math.min(startPos.y, currentPanePosition.y),
        width: Math.abs(currentPanePosition.x - startPos.x),
        height: Math.abs(currentPanePosition.y - startPos.y),
      });
    },
    [isDrawing, startPos, reactFlowInstance]
  );

  const handleMouseUp = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !currentRect || !reactFlowInstance) {
        if (isDrawing) { 
            setIsDrawing(false);
            setStartPos(null);
            setCurrentRect(null);
            document.body.classList.remove('area-drawing-mode');
        }
        return;
      }
      
      event.preventDefault();
      event.stopPropagation();

      if (currentRect.width > 20 && currentRect.height > 20) {
        const newAreaNode: Node = {
          id: `area-${Date.now()}`,
          type: 'areaNode', 
          position: { x: currentRect.x, y: currentRect.y },
          data: {
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            borderColor: 'rgba(59, 130, 246, 0.5)', 
            borderWidth: 1,
            shape: 'rectangle', 
            label: 'New Area', 
          },
          style: {
            width: currentRect.width,
            height: currentRect.height,
          },
          width: currentRect.width,
          height: currentRect.height,
          selected: true, 
          draggable: true,
          selectable: true,
        };
        setNodes((nds) => applyNodeChanges([{ type: 'add', item: newAreaNode }], nds));
      }

      setIsDrawing(false);
      setStartPos(null);
      setCurrentRect(null);
      document.body.classList.remove('area-drawing-mode');
    },
    [isDrawing, currentRect, reactFlowInstance, setNodes]
  );

  return {
    isDrawingArea: isDrawing,
    currentAreaRect: currentRect, 
    handleMouseDownArea: handleMouseDown,
    handleMouseMoveArea: handleMouseMove,
    handleMouseUpArea: handleMouseUp,
  };
}
