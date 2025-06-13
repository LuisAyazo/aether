// import type { JSX } from 'react'; // No se usa
// import type { CustomEdgeData } from "../../../config/edgeConfig"; // Ya no se usa directamente
import type { Diagram } from "../../../services/diagramService";

// Usaremos 'any' para los tipos de React Flow como workaround debido a problemas de declaración de módulo
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReactFlowTypeWorkaround = any;

// Tipos que ya estaban en FlowEditor.tsx (re-exportados para uso externo si es necesario)
// Estos alias son para exportación.
export type { ReactFlowTypeWorkaround as FlowNode, ReactFlowTypeWorkaround as FlowEdge, ReactFlowTypeWorkaround as FlowViewport, ReactFlowTypeWorkaround as FlowOnConnect };

// Interfaces y tipos extraídos de FlowEditor.tsx
export interface SingleNodePreview {
  action: 'create' | 'update' | 'delete';
  resource: {
    name: string;
    type: string;
    provider: string;
    changes: {
      properties: Record<string, {
        before?: unknown;
        after?: unknown;
        action: 'create' | 'update' | 'delete';
      }>;
    };
  };
  dependencies: Array<{
    name: string;
    type: string;
    action: 'create' | 'update' | 'delete';
    properties: Record<string, {
      before?: unknown;
      after?: unknown;
      action: 'create' | 'update' | 'delete';
    }>;
  }>;
  estimated_cost?: {
    monthly: number;
    currency: string;
  };
}

export interface Dependency {
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface ResourceItem { 
  type: string;
  name: string;
  description: string;
  icon?: React.ReactNode; 
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>; 
}

export interface ResourceCategory {
  name: string;
  items: ResourceItem[];
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
}

export interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: string | null;
  isPane: boolean;
  parentInfo?: {
    parentId?: string;
    parentType?: string;
    selectedCount?: number;
  } | null;
  customItems?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
}

export type ToolType = 'select' | 'createResizableGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea' | 'note' | 'text' | 'area' | 'resizableNode';

export interface FlowEditorProps {
  onConnectProp?: ReactFlowTypeWorkaround; // OnConnect; 
  nodeTypes?: ReactFlowTypeWorkaround; // ReactFlowNodeTypes; 
  edgeTypes?: ReactFlowTypeWorkaround; // ReactFlowEdgeTypes;
  resourceCategories?: ResourceCategory[];
  
  initialNodes?: ReactFlowTypeWorkaround[]; // Node[]; 
  initialEdges?: ReactFlowTypeWorkaround[]; // Edge<CustomEdgeData>[]; 
  initialViewport?: ReactFlowTypeWorkaround; // Viewport; 
  onSave?: (diagramData: { nodes: ReactFlowTypeWorkaround[]; edges: ReactFlowTypeWorkaround[]; viewport?: ReactFlowTypeWorkaround }) => void; // Node[], Edge[], Viewport
  
  companyId?: string;
  environmentId?: string;
  diagramId?: string;
  initialDiagram?: Diagram;
  initialExpandedGroupId?: string | null;
  onGroupExpandedChange?: (groupId: string | null) => void;
}

export interface ResourceProperties {
  [key: string]: string | number | boolean | null;
}

export interface EditorState {
  sidebarOpen: boolean;
  collapsedCategories: Record<string, boolean>;
  searchTerm: string;
  activeTool: ToolType;
  contextMenu: ContextMenu;
  selectedEdge: ReactFlowTypeWorkaround | null; // Edge<CustomEdgeData> | null; 
  expandedGroupId: string | null;
  toolbarLayout: 'horizontal' | 'vertical';
  isDragging: boolean; 
  editingGroup: { id: string; label: string } | null;

  // Acciones
  setSidebarOpen: (isOpen: boolean) => void;
  toggleCollapsedCategory: (categoryName: string) => void;
  setSearchTerm: (term: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setContextMenu: (menu: Partial<ContextMenu>) => void;
  hideContextMenu: () => void;
  setSelectedEdge: (edge: ReactFlowTypeWorkaround | null) => void; // Edge<CustomEdgeData> | null
  setExpandedGroupId: (groupId: string | null) => void;
  setToolbarLayout: (layout: 'horizontal' | 'vertical') => void;
  setIsDragging: (dragging: boolean) => void;
  setEditingGroup: (group: { id: string; label: string } | null) => void;
}
