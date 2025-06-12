import { memo, useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  Node, 
  NodeChange, 
  EdgeChange, 
  ConnectionMode,
  useReactFlow,
  Viewport,
  XYPosition,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnMove,
  OnMoveStart,
  OnMoveEnd,
  OnSelectionChange,
  OnViewportChange,
  OnConnectStart,
  OnConnectEnd,
  OnConnectStartParams,
  OnConnectEndParams,
  OnSelectionChangeParams,
  OnViewportChangeParams,
  OnMoveParams,
  OnMoveStartParams,
  OnMoveEndParams,
  OnNodesDelete,
  OnEdgesDelete,
  OnNodesDeleteParams,
  OnEdgesDeleteParams,
  OnConnectParams,
} from 'reactflow';

// Tipos temporales mientras resolvemos el problema con los tipos de reactflow
type FlowNode = any;
type FlowEdge = any;
type FlowViewport = any;
type FlowXYPosition = any;
type FlowNodeTypes = any;
type FlowEdgeTypes = any;
type FlowOnNodesChange = any;
type FlowOnEdgesChange = any;
type FlowOnConnect = any;
type FlowOnMove = any;
type FlowOnMoveStart = any;
type FlowOnMoveEnd = any;
type FlowOnSelectionChange = any;
type FlowOnViewportChange = any;
type FlowOnConnectStart = any;
type FlowOnConnectEnd = any;
type FlowOnNodesDelete = any;
type FlowOnEdgesDelete = any;
type FlowConnectionMode = any;

type FlowCanvasProps = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: FlowOnNodesChange;
  onEdgesChange: FlowOnEdgesChange;
  onConnect: FlowOnConnect;
  nodeTypes: FlowNodeTypes;
  edgeTypes: FlowEdgeTypes;
  onMove?: FlowOnMove;
  onMoveStart?: FlowOnMoveStart;
  onMoveEnd?: FlowOnMoveEnd;
  onSelectionChange?: FlowOnSelectionChange;
  onViewportChange?: FlowOnViewportChange;
  onConnectStart?: FlowOnConnectStart;
  onConnectEnd?: FlowOnConnectEnd;
  onNodesDelete?: FlowOnNodesDelete;
  onEdgesDelete?: FlowOnEdgesDelete;
  defaultViewport?: FlowViewport;
  minZoom?: number;
  maxZoom?: number;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  panOnScroll?: boolean;
  panOnDrag?: boolean;
  selectionOnDrag?: boolean;
  selectionMode?: 'full' | 'partial';
  multiSelectionKeyCode?: string[];
  deleteKeyCode?: string[];
  zoomActivationKeyCode?: string[];
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  elementsSelectable?: boolean;
  selectNodesOnDrag?: boolean;
  fitView?: boolean;
  fitViewOptions?: {
    padding?: number;
    includeHiddenNodes?: boolean;
    minZoom?: number;
    maxZoom?: number;
  };
  attributionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  proOptions?: {
    hideAttribution?: boolean;
  };
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  defaultNodes?: FlowNode[];
  defaultEdges?: FlowEdge[];
  defaultEdgeOptions?: Partial<FlowEdge>;
  defaultNodeOptions?: {
    type?: string;
    position?: FlowXYPosition;
    data?: any;
    style?: React.CSSProperties;
    className?: string;
    targetPosition?: 'top' | 'right' | 'bottom' | 'left';
    sourcePosition?: 'top' | 'right' | 'bottom' | 'left';
    hidden?: boolean;
    selected?: boolean;
    dragging?: boolean;
    draggable?: boolean;
    selectable?: boolean;
    connectable?: boolean;
    deletable?: boolean;
    focusable?: boolean;
    parentNode?: string;
    extent?: 'parent' | FlowXYPosition[];
    expandParent?: boolean;
    zIndex?: number;
  };
  defaultConnectionMode?: FlowConnectionMode;
  defaultConnectionRadius?: number;
  defaultConnectionLineStyle?: React.CSSProperties;
  defaultConnectionLineType?: 'default' | 'straight' | 'step' | 'smoothstep';
  defaultConnectionLineWrapperStyle?: React.CSSProperties;
  defaultConnectionLineWrapperClassName?: string;
  defaultConnectionLineClassName?: string;
  defaultConnectionLineWrapperComponent?: React.ComponentType<any>;
  defaultConnectionLineComponent?: React.ComponentType<any>;
  defaultNodeComponent?: React.ComponentType<any>;
  defaultEdgeComponent?: React.ComponentType<any>;
  defaultBackgroundComponent?: React.ComponentType<any>;
  defaultControlsComponent?: React.ComponentType<any>;
  defaultPanelComponent?: React.ComponentType<any>;
  defaultMiniMapComponent?: React.ComponentType<any>;
  defaultNodeTypes?: FlowNodeTypes;
  defaultEdgeTypes?: FlowEdgeTypes;
  defaultBackgroundOptions?: {
    color?: string;
    gap?: number;
    size?: number;
    variant?: 'dots' | 'lines';
  };
  defaultControlsOptions?: {
    showInteractive?: boolean;
    showZoom?: boolean;
    showFitView?: boolean;
    showLock?: boolean;
    showMiniMap?: boolean;
    showBackground?: boolean;
    showAttribution?: boolean;
  };
  defaultPanelOptions?: {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  defaultMiniMapOptions?: {
    nodeColor?: string;
    nodeStrokeColor?: string;
    nodeStrokeWidth?: number;
    nodeClassName?: string;
    maskColor?: string;
    maskStrokeColor?: string;
    maskStrokeWidth?: number;
    maskClassName?: string;
  };
  defaultViewportOptions?: {
    x?: number;
    y?: number;
    zoom?: number;
  };
  defaultConnectionOptions?: {
    type?: string;
    animated?: boolean;
    style?: React.CSSProperties;
    className?: string;
    label?: string;
    labelStyle?: React.CSSProperties;
    labelClassName?: string;
    labelBgStyle?: React.CSSProperties;
    labelBgClassName?: string;
    labelBgPadding?: [number, number];
    labelBgBorderRadius?: number;
    markerStart?: string;
    markerEnd?: string;
  };
};

// ... rest of the code ... 