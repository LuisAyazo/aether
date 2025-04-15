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
  ReactFlowProvider,
  useReactFlow // Import useReactFlow
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
  // Use useReactFlow hook instead of state for the instance
  const reactFlowInstance = useReactFlow(); 
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Handler para conectar nodos
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  // Permitir eliminar nodos
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    console.log("Eliminando nodos:", nodesToDelete.map(n => n.id));
    // La eliminación será manejada automáticamente por ReactFlow
  }, []);

  // Permite añadir nuevos nodos al grupo de forma optimizada para mayor número de nodos
  const onAddNode = useCallback((nodeType: string, nodeData: any) => {
    if (!reactFlowInstance) return;

    // Obtener dimensiones del canvas y número de nodos actuales para calcular mejor posición
    const allNodes = reactFlowInstance.getNodes();
    const existingCount = allNodes.length;
    
    // Calcular una posición en cuadrícula basada en el número de nodos
    // con mayor espaciado para evitar superposición
    const cols = 3; // Número de columnas en la cuadrícula
    const col = existingCount % cols;
    const row = Math.floor(existingCount / cols);
    
    const position = {
      x: 50 + col * 120, // 120px de ancho por columna
      y: 50 + row * 100  // 100px de alto por fila
    };

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
      },
      // Hacer dimensiones más pequeñas para grupos con muchos nodos
      style: {
        width: allNodes.length > 10 ? 120 : 150,
        height: allNodes.length > 10 ? 60 : 80
      },
      // Importante: asegurar que los nodos sean arrastrables y seleccionables
      draggable: true,
      selectable: true
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Si hay más de 5 nodos, ajustar la vista para mostrarlos todos
    if (existingCount >= 5) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 50);
    }
  }, [reactFlowInstance, setNodes]);

  // Función para reorganizar nodos en una cuadrícula cuando hay muchos
  const reorganizeNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const allNodes = reactFlowInstance.getNodes();
    if (allNodes.length < 5) return; // Solo reorganizar si hay varios nodos
    
    const cols = Math.ceil(Math.sqrt(allNodes.length)); // Calcular número de columnas óptimo
    const padding = 30;
    const nodeWidth = allNodes.length > 10 ? 120 : 150;
    const nodeHeight = allNodes.length > 10 ? 60 : 80;
    
    // Crear nuevas posiciones en cuadrícula
    const updatedNodes = allNodes.map((node: Node, index: number) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      return {
        ...node,
        position: {
          x: padding + col * (nodeWidth + padding),
          y: padding + row * (nodeHeight + padding)
        },
        // Actualizar tamaño según número de nodos
        style: {
          ...node.style,
          width: nodeWidth,
          height: nodeHeight
        },
        // Importante: asegurar que los nodos sean arrastrables y seleccionables
        draggable: true,
        selectable: true
      };
    });
    
    setNodes(updatedNodes);
    
    // Ajustar vista para mostrar todos los nodos
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 50);
  }, [reactFlowInstance, setNodes]);

  // Reorganizar al iniciar si hay muchos nodos
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 5) {
      reorganizeNodes();
    }
  }, [reactFlowInstance, reorganizeNodes, nodes.length]);

  // Efecto para garantizar que todos los nodos son arrastrables y seleccionables
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes(nodes.map(node => ({
        ...node,
        draggable: true,
        selectable: true
      })));
    }
  }, []);

  // Función para guardar los cambios
  const saveChanges = useCallback(() => {
    onSave(nodes, edges);
  }, [nodes, edges, onSave]);

  // Function to center nodes in the viewport (similar to FlowEditor)
  const centerNodesInViewport = useCallback(() => {
    if (!reactFlowInstance || nodes.length === 0) return;
    
    // Get viewport dimensions from the wrapper ref
    const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 600 }; // Default size if ref not ready
    
    // Calculate nodes bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    reactFlowInstance.getNodes().forEach(node => {
      if (!node.hidden) {
        const nodeWidth = node.width || 150;
        const nodeHeight = node.height || 80;
        
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      }
    });

    // Handle case where bounding box calculation might fail (e.g., no visible nodes)
    if (minX === Infinity || minY === Infinity) {
        // Fallback to simple fitView without animation
        reactFlowInstance.fitView({ padding: 0.3 }); 
        return;
    }
    
    // Calculate center of nodes
    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    const nodesCenterX = minX + nodesWidth / 2;
    const nodesCenterY = minY + nodesHeight / 2;
    
    // Calculate viewport center
    const viewportCenterX = width / 2;
    const viewportCenterY = height / 2;
    
    // Calculate the translation needed to center nodes
    // Use a slightly larger initial zoom if there are few nodes
    const zoom = nodes.length < 5 ? 0.8 : reactFlowInstance.getViewport().zoom || 0.6; 
    const translateX = viewportCenterX - nodesCenterX * zoom;
    const translateY = viewportCenterY - nodesCenterY * zoom;
    
    // Set viewport to center nodes without animation
    reactFlowInstance.setViewport({ 
      x: translateX, 
      y: translateY, 
      zoom 
    }); // Removed duration
  }, [reactFlowInstance, nodes]); // Add nodes to dependency array

  // Add this effect to listen for centering requests from FlowEditor
  useEffect(() => {
    const handleCenterNodes = () => {
      if (!reactFlowInstance) return;
      
      // First fit view to ensure nodes are generally visible, without animation
      reactFlowInstance.fitView({ 
        padding: 0.3, // Increased padding
        includeHiddenNodes: false,
        minZoom: 0.4, // Allow slightly more zoom out
        maxZoom: 1.5, // Allow slightly more zoom in
        // duration: 200 // Removed animation
      });
      
      // Then center nodes more precisely immediately after fitView
      // Use a minimal timeout just to ensure fitView calculation completes
      setTimeout(centerNodesInViewport, 10); 
    };
    
    document.addEventListener('centerGroupNodes', handleCenterNodes);
    
    // Also center nodes when the component initially mounts
    // Use a slightly longer timeout to ensure layout is stable before centering
    setTimeout(handleCenterNodes, 150); // Reduced timeout for faster initial centering
    
    return () => {
      document.removeEventListener('centerGroupNodes', handleCenterNodes);
    };
  }, [reactFlowInstance, centerNodesInViewport]); // Add dependencies
  
  // Reorganizar al iniciar si hay muchos nodos
  useEffect(() => {
    // Check reactFlowInstance exists before using it
    if (reactFlowInstance && nodes.length > 5) {
      // Delay reorganization slightly to ensure nodes are rendered
      setTimeout(reorganizeNodes, 100); 
    }
    // Ensure nodes are centered after potential reorganization
    // This centering call is handled by the 'centerGroupNodes' listener effect now
    // if (reactFlowInstance && nodes.length > 0) {
    //     setTimeout(centerNodesInViewport, 350); // Center after mount and potential reorganization
    // }
  }, [reactFlowInstance, reorganizeNodes, nodes.length]); // Removed centerNodesInViewport dependency here
  
  return (
    // Ensure the wrapper div has the ref and takes full height/width
    <div className="w-full h-full flex relative" ref={reactFlowWrapper}> 
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          // Remove onInit setting instance state, useReactFlow provides it
          // onInit={(instance) => {
          //   setReactFlowInstance(instance);
          //   // Set initial zoom immediately after initialization
          //   instance.setViewport({ x: 0, y: 0, zoom: 0.5 }); 
          // }}
          nodeTypes={nodeTypes}
          fitView={false} // Keep fitView false to allow manual control
          fitViewOptions={{ 
              padding: 0.3, // Consistent padding
              minZoom: 0.4, 
              maxZoom: 1.5 
          }}
          minZoom={0.1}
          maxZoom={2}
          // Adjust default viewport for a potentially better initial zoom
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }} 
          style={{ background: 'rgba(144, 238, 144, 0.2)' }}
          nodesDraggable={true}
          elementsSelectable={true}
          nodesConnectable={true}
          onNodesDelete={onNodesDelete}
          defaultEdgeOptions={{ 
            animated: true,
            style: { 
              strokeWidth: 2,
              stroke: '#555'
            }
          }}
          // Make sure panning works properly
          panOnScroll={true}
          panOnDrag={true} // Allow panning with any mouse button
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          selectNodesOnDrag={false}
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
          
          <Panel position="top-right" className="flex gap-2 mr-16">
            {nodes.length > 5 && (
              <button 
                onClick={reorganizeNodes}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors font-medium"
                title="Reorganizar nodos en cuadrícula"
              >
                Reorganizar
              </button>
            )}
            <button 
              onClick={saveChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors font-medium"
            >
              Guardar cambios
            </button>
          </Panel>
        </ReactFlow>
      </div>
      
      {/* Panel de componentes en barra lateral */}
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
    
    // Crear un ID map para rastrear nodos nuevos vs existentes
    const existingNodeIds = new Set<string>();
    const newNodes: Node[] = [];
    
    // Mapeamos los IDs de regreso a los originales o creamos nuevas entradas para nodos nuevos
    const mappedNodes = nodes.map(node => {
      const customNode = node as CustomNode;
      
      // Crear un objeto plano para evitar referencias circulares
      const createPlainNode = (node: Node) => {
        return {
          id: node.id,
          type: node.type,
          position: { ...node.position },
          data: { ...node.data },
          style: node.style ? { ...node.style } : undefined,
          _originalId: (node as CustomNode)._originalId
        };
      };
      
      const plainNode = createPlainNode(node);
      
      // Si el nodo tiene un _originalId, significa que es un nodo existente, usamos el ID original
      if (customNode._originalId) {
        existingNodeIds.add(customNode._originalId);
        return {
          ...plainNode,
          id: customNode._originalId,
          // Limpiar los campos temporales
          _originalId: undefined
        };
      }
      
      // Si no tiene _originalId, es un nodo NUEVO que se añadió en el modal
      // Para este caso, generamos un nuevo ID único para usarlo en el flujo principal
      const newId = `${node.id.split('_')[0]}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const newPlainNode = {
        ...plainNode,
        id: newId
      };
      
      newNodes.push(newPlainNode);
      return newPlainNode;
    });

    // Mapeamos las conexiones para usar los IDs originales o nuevos según corresponda
    const mappedEdges = edges.map(edge => {
      // Crear objeto plano para evitar referencias circulares
      const plainEdge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        style: edge.style ? { ...edge.style } : undefined,
        _originalSource: (edge as CustomEdge)._originalSource,
        _originalTarget: (edge as CustomEdge)._originalTarget
      };
      
      // Buscar los nodos de origen y destino 
      const sourceNode = nodes.find(n => n.id === edge.source) as CustomNode | undefined;
      const targetNode = nodes.find(n => n.id === edge.target) as CustomNode | undefined;
      
      if (!sourceNode || !targetNode) return null;
      
      // Determinar los IDs correctos (original o nuevo)
      const sourceId = sourceNode._originalId || 
        mappedNodes.find(n => n.id !== sourceNode._originalId && n.id.includes(sourceNode.id))?.id ||
        edge.source;
        
      const targetId = targetNode._originalId || 
        mappedNodes.find(n => n.id !== targetNode._originalId && n.id.includes(targetNode.id))?.id ||
        edge.target;

      return {
        ...plainEdge,
        id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // ID único para evitar colisiones
        source: sourceId,
        target: targetId,
        // Eliminar campos de referencia
        _originalSource: undefined,
        _originalTarget: undefined
      };
    }).filter(Boolean);
    
    // Crear evento para actualizar el grupo en el editor principal
    const updateEvent = new CustomEvent('updateGroupNodes', {
      detail: {
        groupId,
        nodes: mappedNodes,
        edges: mappedEdges,
        hasNewNodes: newNodes.length > 0 // Flag para indicar si hay nodos nuevos
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
