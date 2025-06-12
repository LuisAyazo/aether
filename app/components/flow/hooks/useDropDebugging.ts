// Debug hook for drag and drop issues
import { useCallback } from 'react';

export const useDropDebugging = () => {
  const debugDropPosition = useCallback((
    evt: React.DragEvent,
    reactFlowInstance: any,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement | null>,
    activeDrag: any
  ) => {
    console.log('🔍 [DROP DEBUG] Starting drop analysis...');
    
    // Log event coordinates
    console.log('🔍 [DROP DEBUG] Event coordinates:', {
      clientX: evt.clientX,
      clientY: evt.clientY,
      pageX: evt.pageX,
      pageY: evt.pageY,
      screenX: evt.screenX,
      screenY: evt.screenY
    });
    
    // Log wrapper bounds
    const bounds = reactFlowWrapperRef.current?.getBoundingClientRect();
    console.log('🔍 [DROP DEBUG] Wrapper bounds:', bounds);
    
    // Log active drag info
    console.log('🔍 [DROP DEBUG] Active drag:', {
      item: activeDrag?.item,
      offset: activeDrag?.offset,
      elementSize: activeDrag?.elementSize
    });
    
    // Log calculated positions
    if (bounds && reactFlowInstance && activeDrag) {
      const offset = activeDrag.offset;
      const rawDropPosition = { x: evt.clientX - offset.x, y: evt.clientY - offset.y };
      const flowDropPosition = reactFlowInstance.screenToFlowPosition(rawDropPosition);
      
      console.log('🔍 [DROP DEBUG] Calculated positions:', {
        rawDropPosition,
        flowDropPosition,
        relativeToWrapper: {
          x: evt.clientX - bounds.left,
          y: evt.clientY - bounds.top
        }
      });
      
      // Log viewport info
      const viewport = reactFlowInstance.getViewport();
      console.log('🔍 [DROP DEBUG] Viewport:', viewport);
      
      // Test alternative position calculations
      const altPosition1 = reactFlowInstance.screenToFlowPosition({ 
        x: evt.clientX, 
        y: evt.clientY 
      });
      
      const altPosition2 = reactFlowInstance.screenToFlowPosition({ 
        x: evt.clientX - bounds.left, 
        y: evt.clientY - bounds.top 
      });
      
      console.log('🔍 [DROP DEBUG] Alternative positions:', {
        altPosition1,
        altPosition2
      });
      
      return {
        originalPosition: flowDropPosition,
        alternativePositions: [altPosition1, altPosition2],
        shouldUseAlternative: false // We'll determine this based on testing
      };
    }
    
    return null;
  }, []);

  return { debugDropPosition };
};
