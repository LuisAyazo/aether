// Define tipos personalizados para extender las interfaces básicas de ReactFlow
import { Node, Edge } from 'reactflow';

// Extender Node para incluir nuestras propiedades personalizadas
export interface CustomNode extends Node {
  _originalId?: string;
  _groupId?: string;
  // Nuevos campos para soporte mejorado de grupos y redimensionamiento
  parentNode?: string;
  extent?: 'parent' | undefined;
  originalPosition?: { x: number, y: number };
  relativeDimensions?: { width: number, height: number };
  resizable?: boolean;
  style?: {
    width?: number | string;
    height?: number | string;
    [key: string]: any;
  };
}

// En lugar de extender Edge como interfaz, definimos CustomEdge como un tipo
export type CustomEdge<T = any> = Edge<T> & {
  _originalSource?: string;
  _originalTarget?: string;
};

export interface NodeData {
  label: string;
  type: string;
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  resourceType: string;
  icon?: React.ReactNode;
  isCollapsed?: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface EdgeData {
  label?: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface DiagramData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: NodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: EdgeData;
  }>;
}

export interface CompanyData {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
  members: Array<{
    id: string;
    role: 'owner' | 'admin' | 'member';
  }>;
  environments: Array<{
    id: string;
    name: string;
    description?: string;
    active: boolean;
    diagrams: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  companies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}