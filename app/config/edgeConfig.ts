import { MarkerType, type EdgeProps } from 'reactflow';

export enum LogicalEdgeType {
  DEPENDS_ON = 'depends_on',
  CALLS = 'calls',
  TRIGGERS = 'triggers',
  WRITES_TO = 'writes_to',
  CONNECTS_TO = 'connects_to', // Default
}

export interface EdgeStyle {
  stroke: string;
  strokeDasharray?: string;
  strokeWidth?: number;
}

export interface EdgeTypeConfig {
  logicalType: LogicalEdgeType;
  label: string;
  visualType: 'default' | 'step' | 'smoothstep' | 'straight'; // React Flow's built-in edge types
  style: EdgeStyle;
  markerEnd: {
    type: MarkerType;
    color: string;
    width?: number;
    height?: number;
    strokeWidth?: number;
  };
}

export const edgeTypeConfigs: Record<LogicalEdgeType, EdgeTypeConfig> = {
  [LogicalEdgeType.DEPENDS_ON]: {
    logicalType: LogicalEdgeType.DEPENDS_ON,
    label: 'Depends On',
    visualType: 'step',
    style: { stroke: '#808080', strokeDasharray: '5 5', strokeWidth: 2 }, // Gris, punteada
    markerEnd: { type: MarkerType.ArrowClosed, color: '#808080', strokeWidth: 1 },
  },
  [LogicalEdgeType.CALLS]: {
    logicalType: LogicalEdgeType.CALLS,
    label: 'Calls',
    visualType: 'default', // Bezier
    style: { stroke: '#2196F3', strokeWidth: 2 }, // Azul, sólida
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2196F3', strokeWidth: 1 },
  },
  [LogicalEdgeType.TRIGGERS]: {
    logicalType: LogicalEdgeType.TRIGGERS,
    label: 'Triggers',
    visualType: 'straight',
    style: { stroke: '#F44336', strokeWidth: 2 }, // Rojo, sólida
    markerEnd: { type: MarkerType.ArrowClosed, color: '#F44336', strokeWidth: 1 },
  },
  [LogicalEdgeType.WRITES_TO]: {
    logicalType: LogicalEdgeType.WRITES_TO,
    label: 'Writes To',
    visualType: 'smoothstep',
    style: { stroke: '#4CAF50', strokeWidth: 2 }, // Verde, sólida
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4CAF50', strokeWidth: 1 },
  },
  [LogicalEdgeType.CONNECTS_TO]: {
    logicalType: LogicalEdgeType.CONNECTS_TO,
    label: 'Connects To',
    visualType: 'default', // Bezier
    style: { stroke: '#FF9800', strokeDasharray: '5 5', strokeWidth: 2 }, // Naranja, punteada
    markerEnd: { type: MarkerType.ArrowClosed, color: '#FF9800', strokeWidth: 1 },
  },
};

// Helper para obtener la configuración por tipo lógico
export const getEdgeConfig = (logicalType: LogicalEdgeType): EdgeTypeConfig => {
  return edgeTypeConfigs[logicalType] || edgeTypeConfigs[LogicalEdgeType.CONNECTS_TO];
};

// Datos para el edge que se guardarán en React Flow
export interface CustomEdgeData {
  label: string; // El nombre del tipo lógico, ej: "Depends On"
  edgeKind: LogicalEdgeType; // El enum, ej: LogicalEdgeType.DEPENDS_ON
  // Puedes añadir más datos específicos aquí si es necesario
}
