'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// Import the nodeTypes directly from the NodeTypes file
import nodeTypes from '../components/nodes/NodeTypes';

interface GroupViewData {
  id: string;
  label: string;
  provider: string;
  children: any[];
  position: { x: number, y: number };
  style: any;
}

export default function GroupView() {
  const [groupData, setGroupData] = useState<GroupViewData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const router = useRouter();
  
  // Memoize nodeTypes to prevent recreating on each render
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Cargar datos del grupo desde sessionStorage
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('openGroupData');
      if (!storedData) {
        console.error('No group data found');
        return;
      }

      const parsedData = JSON.parse(storedData);
      setGroupData(parsedData);

      // Preparar los nodos para visualización
      const extractedNodes = parsedData.children.map((node: any) => ({
        ...node,
        // Eliminar referencia al grupo padre
        parentNode: undefined,
        extent: undefined,
        // Ajustar posición relativa a coordenadas absolutas
        position: {
          x: node.position.x + 100, // Offset para centrar mejor
          y: node.position.y + 100
        },
        // Asegurar que los nodos son visibles
        hidden: false,
        style: {
          ...node.style,
          display: '',
          visibility: 'visible',
          opacity: 1
        },
        data: {
          ...(node.data || {}),
          hidden: false
        }
      }));

      // Extraer las conexiones entre estos nodos
      // Nota: Esto requeriría tener acceso a las edges originales
      // Por ahora dejamos un array vacío
      
      setNodes(extractedNodes);
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  }, []);

  const handleClose = useCallback(() => {
    window.close();
    // Fallback si window.close() no funciona (políticas de navegador)
    router.push('/');
  }, [router]);

  return (
    <div className="w-full h-screen bg-slate-50 dark:bg-slate-900">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={memoizedNodeTypes}
          onInit={(instance) => {
            // Set initial zoom immediately after initialization
            instance.setViewport({ x: 0, y: 0, zoom: 0.6 });
          }}
          fitView={false} // Disable fitView to ensure our zoom settings work
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          // Enable panning and zooming
          panOnScroll={true}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          // Ensure nodes are draggable
          nodesDraggable={true}
          elementsSelectable={true}
          nodesConnectable={true}
        >
          <Background gap={12} size={1} />
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
          
          <Panel position="top-left" className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md flex items-center gap-2">
            <button 
              onClick={handleClose}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Cerrar vista"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{groupData?.label || 'Grupo'}</h1>
              <p className="text-sm text-gray-500">
                {nodes.length} {nodes.length === 1 ? 'nodo' : 'nodos'}
              </p>
            </div>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
