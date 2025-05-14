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