'use client';
import { useState, useCallback, useMemo } from 'react';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  Node, 
  Edge, 
  Connection, 
  NodeChange, 
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from 'reactflow';
import FlowEditor from '../../components/flow/FlowEditor';
import { 
  ComputeEngineNode, 
  CloudStorageNode, 
  CloudFunctionsNode,
  CloudSQLNode 
} from '../../components/nodes/GcpNodes';
import NodeGroup from '../../components/nodes/NodeGroup';

// Tipo personalizado para los nodos GCP
const nodeTypes = {
  compute: ComputeEngineNode,
  storage: CloudStorageNode,
  functions: CloudFunctionsNode,
  sql: CloudSQLNode,
  group: NodeGroup
};

// Categorías de recursos para el panel lateral
const resourceCategories = [
  {
    name: 'Cómputo',
    provider: 'gcp' as const,
    items: [
      { type: 'compute', name: 'Compute Engine', description: 'Máquina virtual' },
      { type: 'compute', name: 'Load Balancer', description: 'Balanceador de carga HTTP(S)' },
      { type: 'group', name: 'Instance Group', description: 'Grupo de instancias escalable' },
    ]
  },
  {
    name: 'Almacenamiento',
    provider: 'gcp' as const,
    items: [
      { type: 'storage', name: 'Cloud Storage', description: 'Almacenamiento de objetos' },
      { type: 'sql', name: 'Cloud SQL', description: 'Base de datos relacional' },
    ]
  },
  {
    name: 'Aplicación',
    provider: 'gcp' as const,
    items: [
      { type: 'functions', name: 'Cloud Functions', description: 'Funciones serverless' },
      { type: 'group', name: 'Microservices', description: 'Grupo de microservicios' },
    ]
  }
];

// Nodos iniciales del ejemplo de arquitectura GCP
const initialNodes: Node[] = [
  // Grupos
  {
    id: 'group-1',
    type: 'group',
    position: { x: 150, y: 0 },
    data: { 
      label: 'Frontend Layer',
      provider: 'gcp'
    },
    style: { width: 400, height: 150 }
  },
  {
    id: 'group-2',
    type: 'group',
    position: { x: 150, y: 200 },
    data: { 
      label: 'Backend Layer',
      provider: 'gcp'
    },
    style: { width: 400, height: 150 }
  },

  // Nodos dentro de grupos
  {
    id: 'lb-1',
    type: 'compute',
    position: { x: 50, y: 50 },
    data: { 
      label: 'Load Balancer',
      description: 'HTTP(S) Load Balancer',
      provider: 'gcp',
      isCollapsed: true
    },
    parentNode: 'group-1',
    extent: 'parent'
  },
  {
    id: 'compute-1',
    type: 'compute',
    position: { x: 200, y: 50 },
    data: { 
      label: 'App Server 1',
      description: 'Compute Engine n2-standard-2',
      provider: 'gcp',
      isCollapsed: true
    },
    parentNode: 'group-1',
    extent: 'parent'
  },
  {
    id: 'compute-2',
    type: 'compute',
    position: { x: 330, y: 50 },
    data: { 
      label: 'App Server 2',
      description: 'Compute Engine n2-standard-2',
      provider: 'gcp',
      isCollapsed: true
    },
    parentNode: 'group-1',
    extent: 'parent'
  },
  {
    id: 'api-1',
    type: 'compute',
    position: { x: 50, y: 50 },
    data: { 
      label: 'API Server',
      description: 'Compute Engine n2-standard-4',
      provider: 'gcp',
      isCollapsed: true
    },
    parentNode: 'group-2',
    extent: 'parent'
  },
  {
    id: 'db-1',
    type: 'sql',
    position: { x: 200, y: 50 },
    data: { 
      label: 'Database',
      description: 'Cloud SQL PostgreSQL',
      provider: 'gcp',
      isCollapsed: true
    },
    parentNode: 'group-2',
    extent: 'parent'
  },
  {
    id: 'storage-1',
    type: 'storage',
    position: { x: 330, y: 50 },
    data: { 
      label: 'Media Storage',
      description: 'Cloud Storage bucket',
      provider: 'gcp',
      isCollapsed: true
    },
    parentNode: 'group-2',
    extent: 'parent'
  },
  
  // Nodos sueltos
  {
    id: 'function-1',
    type: 'functions',
    position: { x: 400, y: 390 },
    data: { 
      label: 'Media Processor',
      description: 'Cloud Function',
      provider: 'gcp',
      isCollapsed: true
    },
  },
  {
    id: 'function-2',
    type: 'functions',
    position: { x: 200, y: 390 },
    data: { 
      label: 'Data Export',
      description: 'Cloud Function',
      provider: 'gcp',
      isCollapsed: true
    },
  },
];

// Conexiones iniciales para el ejemplo
const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'lb-1', target: 'compute-1' },
  { id: 'e1-3', source: 'lb-1', target: 'compute-2' },
  { id: 'e2-4', source: 'compute-1', target: 'api-1' },
  { id: 'e3-4', source: 'compute-2', target: 'api-1' },
  { id: 'e4-5', source: 'api-1', target: 'db-1' },
  { id: 'e4-6', source: 'api-1', target: 'storage-1' },
  { id: 'e6-7', source: 'storage-1', target: 'function-1' },
  { id: 'e5-8', source: 'db-1', target: 'function-2' },
  { id: 'e8-6', source: 'function-2', target: 'storage-1' },
];

export default function GcpExample() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  // Memoize nodeTypes to prevent recreating on each render
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  
  // Manejadores para cambios en nodos y conexiones
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Ejemplo de Arquitectura GCP</h1>
      <p className="mb-8">
        Este ejemplo muestra una aplicación web escalable basada en GCP con grupos de nodos,
        componentes contraíbles y un panel lateral con recursos clasificados.
      </p>
      
      <FlowEditor
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={memoizedNodeTypes}
        resourceCategories={resourceCategories}
      />
    </div>
  );
}