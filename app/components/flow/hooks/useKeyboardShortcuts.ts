import { useEffect } from 'react';
import type { ToolType as EditorToolType } from '../types/editorTypes';

interface UseKeyboardShortcutsProps {
  handleToolClick: (tool: EditorToolType) => void;
  createEmptyGroup: (provider?: 'aws' | 'gcp' | 'azure' | 'generic') => string | undefined;
}

export function useKeyboardShortcuts({
  handleToolClick,
  createEmptyGroup,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar si el foco está en un input, textarea o select
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ignorar si hay teclas modificadoras activas (Ctrl, Meta, Alt) para atajos simples
      const simpleShortcut = !event.ctrlKey && !event.metaKey && !event.altKey;

      switch (event.key.toLowerCase()) {
        case 'v':
          if (simpleShortcut) handleToolClick('select');
          break;
        case 'n':
          if (simpleShortcut) handleToolClick('note');
          break;
        case 't':
          if (simpleShortcut) handleToolClick('text');
          break;
        case 'a':
          if (simpleShortcut) handleToolClick('area');
          break;
        case 'g':
          if (simpleShortcut) createEmptyGroup();
          break;
        case 's':
          // Permitir Shift+S para la herramienta Lasso
          if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
            handleToolClick('lasso');
          }
          break;
        // Aquí se podrían añadir más atajos si es necesario
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleToolClick, createEmptyGroup]);

  // Este hook no necesita retornar nada, solo configura el event listener.
}
