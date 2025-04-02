import { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap, 
  ReactFlowProvider,
  Panel,
  Node, 
  Edge,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  addEdge,
  NodeMouseHandler
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ResourceCategory {
  name: string;
  items: ResourceItem[];
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
}

interface ResourceItem {
  type: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
}

// Add a new interface for the context menu
interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
  nodeType: string | null;
}

interface FlowEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  resourceCategories?: ResourceCategory[];
}

const FlowEditorContent = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  nodeTypes,
  edgeTypes,
  resourceCategories = []
}: FlowEditorProps) => {
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [activeDrag, setActiveDrag] = useState<{ item: any, offset: { x: number, y: number } } | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  // Add state for context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null
  });

  // Añadir listener global para el evento personalizado de focus
  useEffect(() => {
    const handleNodeFocus = (event: CustomEvent) => {
      const { nodeId, isFocused } = event.detail;
      setFocusedNodeId(isFocused ? nodeId : null);
    };
    
    // Usar un type assertion para CustomEvent
    window.addEventListener('nodeGroupFocus', handleNodeFocus as EventListener);
    return () => {
      window.removeEventListener('nodeGroupFocus', handleNodeFocus as EventListener);
    };
  }, []);

  // Ajustar la vista al cargar los nodos
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 300);
    }
  }, []);

  // Función para verificar si un nodo está dentro de un grupo
  const isInsideGroup = (position: { x: number, y: number }, group: Node) => {
    const groupX = group.position.x;
    const groupY = group.position.y;
    const groupWidth = (group.style?.width as number) || 200;
    const groupHeight = (group.style?.height as number) || 150;
    
    return (
      position.x >= groupX && 
      position.x <= groupX + groupWidth && 
      position.y >= groupY && 
      position.y <= groupY + groupHeight
    );
  };

  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
    
    // Calcular el desplazamiento entre el cursor y el elemento arrastrado
    const dragElement = event.currentTarget as HTMLDivElement;
    const rect = dragElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    setActiveDrag({ 
      item: nodeData, 
      offset: { x: offsetX, y: offsetY } 
    });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      try {
        const dataStr = event.dataTransfer.getData('application/reactflow');
        const nodeData = JSON.parse(dataStr);
        
        // Get exact cursor position in flow coordinates
        // Important: We need to calculate this correctly relative to the flow container
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top
        });
        
        // Check if we're dropping on a group
        let parentNode: string | undefined = undefined;
        let adjustedPosition = { ...position };
        
        // Check for groups that aren't minimized
        const groups = reactFlowInstance.getNodes()
          .filter(node => node.type === 'group' && !node.data?.isMinimized);
        
        for (const group of groups) {
          if (isInsideGroup(position, group)) {
            parentNode = group.id;
            
            // Calculate position relative to the parent
            adjustedPosition = {
              x: position.x - group.position.x,
              y: position.y - group.position.y
            };
            break;
          }
        }
        
        // Create unique node ID
        const timestamp = Date.now();
        const newNodeId = `${nodeData.type}-${timestamp}`;
        
        // Create the node at the cursor position
        const newNode: Node = {
          id: newNodeId,
          type: nodeData.type,
          position: adjustedPosition,
          data: { 
            label: nodeData.name,
            description: nodeData.description,
            provider: nodeData.provider,
            isCollapsed: true
          },
          draggable: true,
          selectable: true,
        };
        
        // Add parent relationship if needed
        if (parentNode) {
          newNode.parentNode = parentNode;
          newNode.extent = 'parent';
        }
        
        // Add the node to the flow
        onNodesChange?.([{ type: 'add', item: newNode }]);
        setActiveDrag(null);
      } catch (error) {
        console.error('Error adding new node:', error);
        setActiveDrag(null);
      }
    },
    [reactFlowInstance, onNodesChange]
  );
  
  // Limpiar arrastre activo cuando termina el arrastre
  const onDragEnd = () => {
    setActiveDrag(null);
  };

  // Función para verificar y actualizar la posición de los nodos cuando se mueven
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.parentNode) {
      const parentNode = reactFlowInstance.getNode(node.parentNode);
      if (parentNode) {
        const parentWidth = (parentNode.style?.width as number) || 200;
        const parentHeight = (parentNode.style?.height as number) || 150;
        
        const nodeWidth = 100; // Ancho aproximado del nodo
        const nodeHeight = 50; // Alto aproximado del nodo
        
        // Ajustar posición si está fuera de límites
        let needsAdjustment = false;
        let newPos = { ...node.position };
        
        if (node.position.x < 10) {
          newPos.x = 10;
          needsAdjustment = true;
        } else if (node.position.x > parentWidth - nodeWidth - 10) {
          newPos.x = parentWidth - nodeWidth - 10;
          needsAdjustment = true;
        }
        
        if (node.position.y < 30) {
          newPos.y = 30;
          needsAdjustment = true;
        } else if (node.position.y > parentHeight - nodeHeight - 10) {
          newPos.y = parentHeight - nodeHeight - 10;
          needsAdjustment = true;
        }
        
        if (needsAdjustment) {
          reactFlowInstance.setNodes(nds => 
            nds.map(n => 
              n.id === node.id ? { ...n, position: newPos } : n
            )
          );
        }
      }
    }
  }, [reactFlowInstance]);

  const onSave = useCallback(() => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      localStorage.setItem('savedFlow', JSON.stringify(flow));
      alert('Diagrama guardado correctamente');
    }
  }, [reactFlowInstance]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Handle right-click on nodes
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    // Prevent default context menu
    event.preventDefault();
    
    // Show our custom context menu with correct position
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type ?? null
    });
  }, []);
  
  // Close context menu when clicking elsewhere
  const onPaneClick = useCallback(() => {
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu.nodeId) return;
    
    const node = reactFlowInstance.getNode(contextMenu.nodeId);
    if (!node) return;
    
    // Create a custom event to trigger the appropriate action
    const actionEvent = new CustomEvent('nodeAction', {
      detail: {
        action,
        nodeId: contextMenu.nodeId,
        nodeType: contextMenu.nodeType
      }
    });
    document.dispatchEvent(actionEvent);
    
    // Hide the context menu
    setContextMenu(prev => ({...prev, visible: false}));
  }, [contextMenu, reactFlowInstance]);

  return (
    <div className="w-full h-full flex relative">
      {/* Sidebar */}
      <div className={`transition-all duration-300 bg-slate-50 dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Componentes</h3>
          
          {resourceCategories.map((category, index) => (
            <div key={index} className="mb-4">
              <div 
                className="flex justify-between items-center cursor-pointer p-2 bg-gray-100 dark:bg-gray-800 rounded-md mb-2"
                onClick={() => toggleCategory(category.name)}
              >
                <span className="font-medium">{category.name}</span>
                <span>{collapsedCategories[category.name] ? '▶' : '▼'}</span>
              </div>
              
              {!collapsedCategories[category.name] && (
                <div className="space-y-2 pl-2">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 cursor-grab flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      draggable
                      onDragStart={(e) => onDragStart(e, { ...item, provider: category.provider })}
                      onDragEnd={onDragEnd}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Flow editor */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => {
            // Conectar los nodos sin añadir propiedades no válidas
            if (onConnect) {
              onConnect(params);
            }
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          fitView
          snapToGrid={true}
          snapGrid={[10, 10]}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ 
            animated: true,
            style: { 
              strokeWidth: 2,
              stroke: '#555'
            }
          }}
          elementsSelectable={true}
          nodesDraggable={true}
          nodesConnectable={true}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Control', 'Meta']}
          className={`bg-slate-50 dark:bg-slate-900 ${focusedNodeId ? 'focus-mode' : ''}`}
        >
          <Panel position="top-right" className="flex gap-2">
            <button 
              onClick={toggleSidebar} 
              className="bg-slate-100 dark:bg-slate-700 p-2 rounded-md shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600"
              title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <button 
              onClick={onSave} 
              className="bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-primary/90"
            >
              Guardar
            </button>
          </Panel>
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.data?.provider) {
                case 'aws': return '#f97316';
                case 'gcp': return '#3b82f6';
                case 'azure': return '#0ea5e9';
                default: return '#94a3b8';
              }
            }}
            className="bg-white/80 dark:bg-gray-800/80"
          />
          <Background gap={12} size={1} />
          
          {/* Context Menu - Fixed positioning */}
          {contextMenu.visible && (
            <div 
              className="fixed z-[1000] bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-1"
              style={{ 
                top: `${contextMenu.y}px`, 
                left: `${contextMenu.x}px`,
                minWidth: '160px',
                transform: 'translate(0, 0)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {(() => {
                const currentNode = contextMenu.nodeId ? reactFlowInstance.getNode(contextMenu.nodeId) : null;
                
                return (
                  <>
                    {contextMenu.nodeType === 'group' && (
                      <div className="flex flex-col">
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleCollapse')}
                        >
                          {currentNode?.data?.isCollapsed ? 'Expandir' : 'Colapsar'}
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleMinimize')}
                        >
                          {currentNode?.data?.isMinimized ? 'Maximizar' : 'Minimizar'}
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleFocus')}
                        >
                          Enfocar
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('addNodeToGroup')}
                        >
                          Añadir nodo
                        </button>
                      </div>
                    )}
                    
                    {contextMenu.nodeType && contextMenu.nodeType !== 'group' && (
                      <div className="flex flex-col">
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleListView')}
                        >
                          Cambiar vista
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleFocus')}
                        >
                          Enfocar
                        </button>
                        <button 
                          className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleContextMenuAction('toggleCollapse')}
                        >
                          {currentNode?.data?.isCollapsed ? 'Expandir' : 'Colapsar'}
                        </button>
                      </div>
                    )}
                    
                    {/* Common actions for all nodes */}
                    <button 
                      className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-red-600 dark:text-red-400"
                      onClick={() => handleContextMenuAction('deleteNode')}
                    >
                      Eliminar
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default function FlowEditor(props: FlowEditorProps) {
  // Asegurarse de que la altura sea suficiente para visualizar correctamente
  return (
    <div className="w-full h-[700px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ReactFlowProvider>
        <FlowEditorContent {...props} />
      </ReactFlowProvider>
    </div>
  );
}