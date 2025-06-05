import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useEditorStore } from './useEditorStore';
import type { ToolType as EditorToolType } from '../types/editorTypes';

export function useToolbarHandler() {
  const reactFlowInstance = useReactFlow();
  // Seleccionar cada pieza del estado individualmente
  const activeTool = useEditorStore(state => state.activeTool);
  const setActiveTool = useEditorStore(state => state.setActiveTool);

  const handleToolClick = useCallback((tool: EditorToolType) => { 
    if (tool === activeTool && tool !== 'lasso' && tool !== 'area') return;
    
    document.body.classList.remove('lasso-selection-mode', 'area-drawing-mode');
    document.body.style.cursor = 'default';
    
    if (tool === 'lasso') {
      document.body.classList.add('lasso-selection-mode');
      document.body.style.cursor = 'crosshair';
      reactFlowInstance.setNodes(ns => ns.map(n => ({ ...n, selected: false, selectable: true })));
    } else if (tool === 'area') {
      document.body.classList.add('area-drawing-mode');
      document.body.style.cursor = 'crosshair';
      reactFlowInstance.setNodes(ns => ns.map(n => ({ ...n, selected: false })));
    } else if (tool === 'note' || tool === 'text') {
      document.body.style.cursor = 'crosshair';
    }
    
    setActiveTool(tool);
    
    const lStyle = document.getElementById('lasso-select-compatibility');
    if (tool === 'lasso' && !lStyle) {
      const s = document.createElement('style');
      s.id = 'lasso-select-compatibility';
      s.innerHTML = `
        .react-flow__node { pointer-events: all !important; }
        .lasso-selection-mode .react-flow__pane { cursor: crosshair !important; }
      `;
      document.head.appendChild(s);
    } else if (tool !== 'lasso' && lStyle) {
      lStyle.remove();
    }
  }, [activeTool, reactFlowInstance, setActiveTool]);

  return {
    handleToolClick,
  };
}
