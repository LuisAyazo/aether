import type { JSX } from 'react';
import type { Node, Edge, Viewport, OnConnect, NodeTypes as ReactFlowNodeTypes, EdgeTypes as ReactFlowEdgeTypes } from 'reactflow';
import type { CustomEdgeData } from '@/app/config/edgeConfig';
import type { Diagram } from '@/app/services/diagramService';

// Tipos que ya estaban en FlowEditor.tsx
export type { Node as FlowNode, Edge as FlowEdge, Viewport as FlowViewport, OnConnect as FlowOnConnect };
// Estos alias son para exportación. Dentro de este archivo, usaremos los tipos base de reactflow directamente
// o definiremos alias locales si es necesario para claridad interna, pero para las props y estado,
// usaremos los tipos base para evitar confusión con la re-exportación.

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
  icon?: JSX.Element; 
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
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

export type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso' | 'connectNodes' | 'drawArea' | 'note' | 'text' | 'area';

export interface FlowEditorProps {
  onConnectProp?: OnConnect; 
  nodeTypes?: ReactFlowNodeTypes; 
  edgeTypes?: ReactFlowEdgeTypes;
  resourceCategories?: ResourceCategory[];
  
  initialNodes?: Node[]; 
  initialEdges?: Edge<CustomEdgeData>[]; 
  initialViewport?: Viewport; 
  onSave?: (diagramData: { nodes: Node[]; edges: Edge<CustomEdgeData>[]; viewport?: Viewport }) => void; 
  
  companyId?: string;
  environmentId?: string;
  diagramId?: string;
  initialDiagram?: Diagram;
}

export interface ResourceProperties {
  [key: string]: string | number | boolean | null;
}

// Tipos para el store de Zustand (se definirán mejor en useEditorStore.ts pero se pueden referenciar aquí)
export interface EditorState {
  sidebarOpen: boolean;
  collapsedCategories: Record<string, boolean>;
  searchTerm: string;
  activeTool: ToolType;
  contextMenu: ContextMenu;
  selectedEdge: Edge<CustomEdgeData> | null;
  expandedGroupId: string | null;
  toolbarLayout: 'horizontal' | 'vertical';
  isDragging: boolean; // Para el drag de nodos del canvas, no de la sidebar
  editingGroup: { id: string; label: string } | null;

  // Acciones
  setSidebarOpen: (isOpen: boolean) => void;
  toggleCollapsedCategory: (categoryName: string) => void;
  setSearchTerm: (term: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setContextMenu: (menu: Partial<ContextMenu>) => void;
  hideContextMenu: () => void;
  setSelectedEdge: (edge: FlowEdge<CustomEdgeData> | null) => void;
  setExpandedGroupId: (groupId: string | null) => void;
  setToolbarLayout: (layout: 'horizontal' | 'vertical') => void;
  setIsDragging: (dragging: boolean) => void;
  setEditingGroup: (group: { id: string; label: string } | null) => void;
}
