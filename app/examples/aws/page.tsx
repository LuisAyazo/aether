'use client';
import { useState, useCallback, useMemo } from 'react';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  Node, 
  Edge, 
  Connection, 
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from 'reactflow';
import FlowEditor from '../../components/flow/FlowEditor';
import { 
  EC2Node, 
  S3BucketNode as S3Node, 
  LambdaFunctionNode as LambdaNode,
  RDSInstanceNode as RDSNode
} from '../../components/nodes/NodeTypes';
import NodeGroup from '../../components/nodes/NodeGroup';

// Tipo personalizado para los nodos AWS
const nodeTypes = {
  ec2: EC2Node,
  s3: S3Node,
  lambda: LambdaNode,
  rds: RDSNode,
  group: NodeGroup
};

// Categorías de recursos para el panel lateral
const resourceCategories = [
  {
    name: 'Cómputo',
    provider: 'aws' as const,
    items: [
      { type: 'ec2', name: 'EC2 Instance', description: 'Servidor virtual en la nube' },
      { type: 'ec2', name: 'Load Balancer', description: 'Balanceador de carga' },
      { type: 'group', name: 'Auto Scaling Group', description: 'Grupo de escalado automático' },
    ]
  },
  {
    name: 'Almacenamiento',
    provider: 'aws' as const,
    items: [
      { type: 's3', name: 'S3 Bucket', description: 'Almacenamiento de objetos' },
      { type: 'rds', name: 'RDS Instance', description: 'Base de datos relacional' },
    ]
  },
  {
    name: 'Aplicación',
    provider: 'aws' as const,
    items: [
      { type: 'lambda', name: 'Lambda Function', description: 'Función serverless' },
      { type: 'group', name: 'Microservices', description: 'Grupo de microservicios' },
    ]
  }
];

// Nodos iniciales del ejemplo de arquitectura AWS
const initialNodes: Node[] = [
  // Grupos
  {
    id: 'group-1',
    type: 'group',
    position: { x: 150, y: 0 },
    data: { 
      label: 'Frontend Layer',
      provider: 'aws',
      isCollapsed: false,
      isMinimized: false // Aseguramos que isMinimized está definido explícitamente
    },
    style: { width: 400, height: 150 }
  },
  {
    id: 'group-2',
    type: 'group',
    position: { x: 150, y: 200 },
    data: { 
      label: 'Backend Layer',
      provider: 'aws',
      isCollapsed: false,
      isMinimized: false
    },
    style: { width: 400, height: 150 }
  },
  {
    id: 'group-3',
    type: 'group',
    position: { x: 600, y: 100 },
    data: { 
      label: 'Microservicios',
      provider: 'aws',
      isMinimized: true
    },
    style: { width: 40, height: 40 } // Ajustar tamaño a 40x40 para consistencia
  },
  {
    id: 'group-4',
    type: 'group',
    position: { x: 600, y: 200 },
    data: { 
      label: 'Auto Scaling',
      provider: 'aws',
      isMinimized: false
    },
    style: { width: 200, height: 150 }
  },

  // Nodos dentro de grupos
  {
    id: 'lb-1',
    type: 'ec2',
    position: { x: 50, y: 50 },
    data: { 
      label: 'Load Balancer',
      description: 'Elastic Load Balancer',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-1',
    extent: 'parent'
  },
  {
    id: 'web-1',
    type: 'ec2',
    position: { x: 200, y: 50 },
    data: { 
      label: 'Web Server 1',
      description: 'EC2 t3.medium',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-1',
    extent: 'parent'
  },
  {
    id: 'web-2',
    type: 'ec2',
    position: { x: 330, y: 50 },
    data: { 
      label: 'Web Server 2',
      description: 'EC2 t3.medium',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-1',
    extent: 'parent'
  },
  {
    id: 'api-1',
    type: 'ec2',
    position: { x: 50, y: 50 },
    data: { 
      label: 'API Server',
      description: 'EC2 t3.large',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-2',
    extent: 'parent'
  },
  {
    id: 'db-1',
    type: 'rds',
    position: { x: 200, y: 50 },
    data: { 
      label: 'Database',
      description: 'RDS MySQL',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-2',
    extent: 'parent'
  },
  {
    id: 's3-1',
    type: 's3',
    position: { x: 330, y: 50 },
    data: { 
      label: 'Media Storage',
      description: 'S3 bucket',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-2',
    extent: 'parent'
  },
  // Nodo en grupo minimizado (no visible inicialmente)
  {
    id: 'ms-1',
    type: 'lambda',
    position: { x: 50, y: 50 },
    data: { 
      label: 'Auth Service',
      description: 'Microservicio de autenticación',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-3',
    extent: 'parent',
    hidden: true
  },
  // Nodos en grupo de Auto Scaling
  {
    id: 'as-1',
    type: 'ec2',
    position: { x: 50, y: 50 },
    data: { 
      label: 'Instance 1',
      description: 'EC2 t3.micro',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-4',
    extent: 'parent'
  },
  {
    id: 'as-2',
    type: 'ec2',
    position: { x: 120, y: 50 },
    data: { 
      label: 'Instance 2',
      description: 'EC2 t3.micro',
      provider: 'aws',
      isCollapsed: true
    },
    parentNode: 'group-4',
    extent: 'parent'
  },
  
  // Nodos sueltos
  {
    id: 'lambda-1',
    type: 'lambda',
    position: { x: 400, y: 390 },
    data: { 
      label: 'Image Processor',
      description: 'Lambda function',
      provider: 'aws',
      isCollapsed: true
    },
  },
];

// Conexiones iniciales para el ejemplo
const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'lb-1', target: 'web-1', animated: true },
  { id: 'e1-3', source: 'lb-1', target: 'web-2', animated: true },
  { id: 'e2-4', source: 'web-1', target: 'api-1', animated: true },
  { id: 'e3-4', source: 'web-2', target: 'api-1', animated: true },
  { id: 'e4-5', source: 'api-1', target: 'db-1', animated: true },
  { id: 'e4-6', source: 'api-1', target: 's3-1', animated: true },
  { id: 'e6-7', source: 's3-1', target: 'lambda-1', animated: true },
  { id: 'e4-3', source: 'api-1', target: 'group-3', animated: true, style: { strokeWidth: 2 } },
  { id: 'e2-4g', source: 'group-1', target: 'group-4', animated: true, style: { strokeWidth: 2 } },
];

export default function AwsExample() {
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
      <h1 className="text-3xl font-bold mb-6">Ejemplo de Arquitectura AWS</h1>
      <p className="mb-8">
        Este ejemplo muestra una aplicación web típica basada en AWS con grupos de nodos expandibles y minimizables.
        Prueba a:
      </p>
      <ul className="list-disc list-inside mb-6 pl-4 space-y-1">
        <li>Minimizar grupos para convertirlos en íconos</li>
        <li>Enfocar en un grupo específico usando el botón de lupa</li>
        <li>Añadir nuevos servicios con el botón + en los grupos</li>
        <li>Arrastrar y soltar componentes desde el panel lateral</li>
      </ul>
      
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