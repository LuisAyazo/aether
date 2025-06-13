import { create } from 'zustand';
import type { Edge } from 'reactflow';
import type { CustomEdgeData } from "../../../config/edgeConfig";
import type { ContextMenu, ToolType } from '../types/editorTypes';

// Definición del estado y las acciones del store
export interface EditorStore {
  // Estado de la UI del editor
  sidebarOpen: boolean;
  collapsedCategories: Record<string, boolean>;
  searchTerm: string;
  activeTool: ToolType;
  contextMenu: ContextMenu;
  selectedEdge: Edge<CustomEdgeData> | null;
  expandedGroupId: string | null;
  toolbarLayout: 'horizontal' | 'vertical';
  isCanvasDragging: boolean; // Específico para el drag del canvas/pane, no de nodos
  editingGroup: { id: string; label: string } | null;

  // Acciones para modificar el estado
  setSidebarOpen: (isOpen: boolean) => void;
  toggleCollapsedCategory: (categoryName: string) => void;
  setSearchTerm: (term: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setContextMenu: (menu: Partial<ContextMenu>) => void;
  hideContextMenu: () => void;
  setSelectedEdge: (edge: Edge<CustomEdgeData> | null) => void;
  setExpandedGroupId: (groupId: string | null) => void;
  setToolbarLayout: (layout: 'horizontal' | 'vertical') => void;
  setIsCanvasDragging: (dragging: boolean) => void;
  setEditingGroup: (group: { id: string; label: string } | null) => void;
}

// Valores iniciales para el estado
const initialContextMenuState: ContextMenu = {
  visible: false,
  x: 0,
  y: 0,
  nodeId: null,
  nodeType: null,
  isPane: false,
  parentInfo: null,
  customItems: undefined,
};

// Creación del store de Zustand
export const useEditorStore = create<EditorStore>((set) => ({
  // Estado inicial
  sidebarOpen: false,
  collapsedCategories: {},
  searchTerm: '',
  activeTool: 'select',
  contextMenu: initialContextMenuState,
  selectedEdge: null,
  expandedGroupId: null,
  toolbarLayout: typeof window !== 'undefined' ? (localStorage.getItem('toolbarLayout') as 'horizontal' | 'vertical' || 'horizontal') : 'horizontal',
  isCanvasDragging: false,
  editingGroup: null,

  // Implementación de las acciones
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  toggleCollapsedCategory: (categoryName) =>
    set((state) => ({
      collapsedCategories: {
        ...state.collapsedCategories,
        [categoryName]: !state.collapsedCategories[categoryName],
      },
    })),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setContextMenu: (menuUpdate) =>
    set((state) => ({
      contextMenu: { ...state.contextMenu, ...menuUpdate, visible: true },
    })),
  hideContextMenu: () => set({ contextMenu: { ...initialContextMenuState, visible: false } }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge }),
  setExpandedGroupId: (groupId) => set({ expandedGroupId: groupId }),
  setToolbarLayout: (layout) => {
    set({ toolbarLayout: layout });
    if (typeof window !== 'undefined') {
      localStorage.setItem('toolbarLayout', layout);
    }
  },
  setIsCanvasDragging: (dragging) => set({ isCanvasDragging: dragging }),
  setEditingGroup: (group) => set({ editingGroup: group }),
}));

// Selector para obtener solo el estado activeTool (ejemplo de selector optimizado)
// export const selectActiveTool = (state: EditorStore) => state.activeTool;
