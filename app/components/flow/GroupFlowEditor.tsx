import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background, 
  Controls,
  MiniMap, 
  NodeTypes,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  OnConnect,
  addEdge,
  Connection,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode, CustomEdge } from '../../utils/customTypes';

import GroupViewPanel from './GroupViewPanel';

interface GroupFlowEditorProps {
  groupId: string;
  initialNodes: CustomNode[];
  initialEdges?: CustomEdge[];
  nodeTypes?: NodeTypes;
  onClose: () => void;
}

// Componente interno que realiza la edición, dentro de su propio contexto de ReactFlow
function GroupEditor({
  groupId,
  initialNodes,
  initialEdges = [],
  nodeTypes,
  onSave
}: {
  groupId: string;
  initialNodes: CustomNode[];
  initialEdges: CustomEdge[];
  nodeTypes?: NodeTypes;
  onSave: (nodes: Node[], edges: Edge[]) => void;
}) {
  // Crear estados independientes para este editor
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Handler para conectar nodos
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  // Permite añadir nuevos nodos al grupo
  const onAddNode = useCallback((nodeType: string, nodeData: any) => {
    if (!reactFlowInstance) return;

    const position = reactFlowInstance.project({
      x: Math.random() * 300 + 50,
      y: Math.random() * 300 + 50
    });

    const timestamp = Date.now();
    const newNodeId = `${nodeType}-${timestamp}`;
    
    const newNode: CustomNode = {
      id: newNodeId,
      type: nodeType,
      position,
      data: { 
        ...nodeData,
        label: nodeData.name || `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
        description: nodeData.description || 'New component',
        provider: nodeData.provider || 'generic'
      }
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);

  // Función para guardar los cambios
  const saveChanges = useCallback(() => {
    onSave(nodes, edges);
  }, [nodes, edges, onSave]);

  return (
    <div className="w-full h-full flex flex-col" ref={reactFlowWrapper}>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
          style={{ background: 'rgba(144, 238, 144, 0.2)' }} // Fondo verde claro para distinguir
        >
          <Background gap={12} size={1} color='rgba(0, 128, 0, 0.2)' />
          <Controls />
          <MiniMap 
            nodeColor={(node: Node) => {
              switch (node.data?.provider) {
                case 'aws': return '#f97316';
                case 'gcp': return '#3b82f6';
                case 'azure': return '#0ea5e9';
                default: return '#94a3b8';
              }
            }}
          />
          
          <Panel position="top-right" className="flex gap-2">
            <button 
              onClick={saveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors font-medium"
            >
              Guardar cambios
            </button>
          </Panel>
        </ReactFlow>
      </div>
      
      {/* Panel para añadir componentes */}
      <GroupViewPanel onAddNode={onAddNode} />
    </div>
  );
}

export default function GroupFlowEditor({
  groupId,
  initialNodes,
  initialEdges = [],
  nodeTypes,
  onClose
}: GroupFlowEditorProps) {
  // Guardar los cambios del grupo
  const handleSave = useCallback((nodes: Node[], edges: Edge[]) => {
    if (!nodes || !groupId) return;
    
    // Mapeamos los IDs de regreso a los originales para mantener la consistencia entre vistas
    // Buscamos los nodos que tienen un _originalId
    const mappedNodes = nodes.map(node => {
      const customNode = node as CustomNode;
      // Si el nodo tiene un _originalId, usamos eso para mapear de vuelta
      if (customNode._originalId) {
        return {
          ...JSON.parse(JSON.stringify(customNode)), // Copia profunda para evitar referencias compartidas
          id: customNode._originalId,
          // Limpiar los campos temporales
          _originalId: undefined
        };
      }
      return JSON.parse(JSON.stringify(node)); // Copia profunda para el resto de nodos
    });

    // Mapeamos las conexiones para usar los IDs originales
    const mappedEdges = edges.map(edge => {
      const customEdge = edge as CustomEdge;
      
      // Buscar los nodos originales por sus IDs temporales para mapear source y target
      const sourceNode = nodes.find(n => n.id === edge.source) as CustomNode | undefined;
      const targetNode = nodes.find(n => n.id === edge.target) as CustomNode | undefined;

      return {
        ...JSON.parse(JSON.stringify(customEdge)), // Copia profunda
        // Si los nodos tienen _originalId, usar esos como referencias
        source: sourceNode && sourceNode._originalId ? sourceNode._originalId : edge.source,
        target: targetNode && targetNode._originalId ? targetNode._originalId : edge.target,
        // Eliminar los campos de referencia
        _originalSource: undefined,
        _originalTarget: undefined
      };
    });
    
    // Crear evento para actualizar el grupo en el editor principal
    const updateEvent = new CustomEvent('updateGroupNodes', {
      detail: {
        groupId,
        nodes: mappedNodes,
        edges: mappedEdges
      }
    });
    
    document.dispatchEvent(updateEvent);
    onClose();
  }, [groupId, onClose]);

  // Envolver el editor en un nuevo ReactFlowProvider para asegurar completa independencia
  return (
    <ReactFlowProvider>
      <GroupEditor
        groupId={groupId}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        nodeTypes={nodeTypes}
        onSave={handleSave}
      />
    </ReactFlowProvider>
  );
}
