// Define tipos personalizados para extender las interfaces básicas de ReactFlow
import { Node, Edge } from 'reactflow';

// Extender Node para incluir nuestras propiedades personalizadas
export interface CustomNode extends Node {
  _originalId?: string;
  _groupId?: string;
}

// En lugar de extender Edge como interfaz, definimos CustomEdge como un tipo
export type CustomEdge<T = any> = Edge<T> & {
  _originalSource?: string;
  _originalTarget?: string;
};