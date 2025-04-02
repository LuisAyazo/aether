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
  NodeMouseHandler,
  SelectionMode,
  useOnSelectionChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  CursorArrowRaysIcon, 
  Square2StackIcon, 
  Square3Stack3DIcon,
  FolderPlusIcon, 
  FolderMinusIcon 
} from '@heroicons/react/24/outline';

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
  parentInfo?: {
    parentId: string;
    parentType: string | undefined;
  } | null;
}

// Add tool types
type ToolType = 'select' | 'createGroup' | 'group' | 'ungroup' | 'lasso';

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
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectionActive, setSelectionActive] = useState(false);
  
  // Add state for context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null
  });

  // Track node selection changes
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes);
    },
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
          // Use the correct literal type
          newNode.extent = 'parent' as const;
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

  // Handle right-click on nodes - improve context menu options
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    // Prevent default context menu
    event.preventDefault();
    
    // Get parent info if the node has a parent
    const parentInfo = node.parentNode ? 
      { parentId: node.parentNode, parentType: reactFlowInstance.getNode(node.parentNode)?.type } : 
      null;
    
    // Show our custom context menu with correct position
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeType: node.type ?? null,
      parentInfo: parentInfo
    });
  }, [reactFlowInstance]);
  
  // Close context menu when clicking elsewhere
  const onPaneClick = useCallback(() => {
    setContextMenu(prev => ({...prev, visible: false}));
  }, []);

  // Handle context menu actions with enhanced functionality
  const handleContextMenuAction = useCallback((action: string) => {
    if (!contextMenu.nodeId) return;
    
    const node = reactFlowInstance.getNode(contextMenu.nodeId);
    if (!node) return;
    
    // Handle node removal from group
    if (action === 'removeFromGroup' && node.parentNode) {
      // Get parent position for calculating absolute position
      const parentNode = reactFlowInstance.getNode(node.parentNode);
      if (parentNode) {
        reactFlowInstance.setNodes(nodes => 
          nodes.map(n => {
            if (n.id === contextMenu.nodeId) {
              return {
                ...n,
                parentNode: undefined,
                extent: undefined,
                position: {
                  x: parentNode.position.x + n.position.x,
                  y: parentNode.position.y + n.position.y
                }
              };
            }
            return n;
          })
        );
      }
      setContextMenu(prev => ({...prev, visible: false}));
      return;
    }
    
    // Handle specific actions for groups when we have selected nodes
    if (action === 'addSelectedNodesToGroup' && contextMenu.nodeType === 'group') {
      // Get IDs of all currently selected nodes that aren't the group itself
      const nodesToAdd = selectedNodes
        .filter(n => n.id !== contextMenu.nodeId)
        .map(n => n.id);
      
      // Create a custom event to trigger adding these nodes to the group
      const actionEvent = new CustomEvent('nodeAction', {
        detail: {
          action,
          nodeId: contextMenu.nodeId,
          nodeType: contextMenu.nodeType,
          targetNodeIds: nodesToAdd
        }
      });
      document.dispatchEvent(actionEvent);
      
      // Hide the context menu
      setContextMenu(prev => ({...prev, visible: false}));
      return;
    }
    
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
  }, [contextMenu, reactFlowInstance, selectedNodes]);

  // Function to create a new empty group
  const createEmptyGroup = useCallback((provider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic') => {
    // Get viewport center position
    const { x: vpX, y: vpY, zoom } = reactFlowInstance.getViewport();
    const { width, height } = reactFlowWrapper.current?.getBoundingClientRect() || { width: 1000, height: 800 };

    // Calculate center position in flow coordinates
    const position = reactFlowInstance.project({
      x: width / 2,
      y: height / 2
    });

    // Generate unique ID
    const timestamp = Date.now();
    const newGroupId = `group-${timestamp}`;

    // Create new group node
    const newGroup: Node = {
      id: newGroupId,
      type: 'group',
      position,
      data: {
        label: 'New Group',
        provider,
        isCollapsed: false,
        isMinimized: false
      },
      style: {
        width: 300,
        height: 200
      }
    };

    // Add the group to the flow
    onNodesChange?.([{ type: 'add', item: newGroup }]);
    
    return newGroupId;
  }, [reactFlowInstance, onNodesChange, reactFlowWrapper]);

  // Function to group selected nodes
  const groupSelectedNodes = useCallback(() => {
    if (selectedNodes.length < 1) return;

    // Get positions of selected nodes to determine group boundaries
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Determine provider from selected nodes (use most common)
    const providerCounts: Record<string, number> = {};
    
    selectedNodes.forEach(node => {
      // Calculate boundaries
      const nodeWidth = (node.style?.width as number) || 150;
      const nodeHeight = (node.style?.height as number) || 80;
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
      
      // Count providers
      const provider = node.data?.provider || 'generic';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    
    // Determine most common provider
    let mostCommonProvider: 'aws' | 'gcp' | 'azure' | 'generic' = 'generic';
    let maxCount = 0;
    
    Object.entries(providerCounts).forEach(([provider, count]) => {
      if (count > maxCount) {
        mostCommonProvider = provider as any;
        maxCount = count;
      }
    });

    // Add padding to group
    minX -= 30;
    minY -= 50; // Extra space for header
    maxX += 30;
    maxY += 30;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create group node
    const timestamp = Date.now();
    const newGroupId = `group-${timestamp}`;
    
    const newGroup: Node = {
      id: newGroupId,
      type: 'group',
      position: { x: minX, y: minY },
      data: {
        label: 'Group',
        provider: mostCommonProvider,
        isCollapsed: false,
        isMinimized: false
      },
      style: {
        width,
        height
      }
    };
    
    // Update all selected nodes to be children of this group
    const updatedNodes = reactFlowInstance.getNodes().map(node => {
      if (selectedNodes.some(selectedNode => selectedNode.id === node.id)) {
        return {
          ...node,
          parentNode: newGroupId,
          // Fix the type error by using the literal 'parent' instead of a string type
          extent: 'parent' as const,
          position: {
            x: node.position.x - minX,
            y: node.position.y - minY
          },
          selected: false
        };
      }
      return node;
    });
    
    // Add the group and update nodes
    reactFlowInstance.setNodes([...updatedNodes, newGroup]);
    
    // Clear selection
    setSelectedNodes([]);
    
  }, [selectedNodes, reactFlowInstance]);

  // Function to ungroup selected groups
  const ungroupNodes = useCallback(() => {
    const selectedGroups = selectedNodes.filter(node => node.type === 'group');
    if (selectedGroups.length === 0) return;
    
    // Process each selected group
    selectedGroups.forEach(group => {
      // Find all child nodes
      const childNodes = reactFlowInstance.getNodes().filter(node => node.parentNode === group.id);
      
      // Update child nodes (remove parent reference and fix position)
      const updatedNodes = reactFlowInstance.getNodes().map(node => {
        if (node.parentNode === group.id) {
          return {
            ...node,
            parentNode: undefined,
            // Set extent to undefined when ungrouping
            extent: undefined,
            position: {
              x: node.position.x + group.position.x,
              y: node.position.y + group.position.y
            },
            selected: false
          };
        }
        // Remove the group itself
        if (node.id === group.id) {
          return null;
        }
        return node;
      }).filter(Boolean) as Node[];
      
      // Update all nodes
      reactFlowInstance.setNodes(updatedNodes);
    });
    
    // Clear selection
    setSelectedNodes([]);
    
  }, [selectedNodes, reactFlowInstance]);

  // Handle toolbar button clicks with precise selection behavior
  const handleToolClick = useCallback((tool: ToolType) => {
    setActiveTool(tool);
    
    if (tool === 'lasso') {
      setSelectionActive(true);
      
      // Reset selections 
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node => ({
          ...node,
          selected: false,
          selectable: true
        }))
      );
      
      document.body.classList.add('lasso-selection-mode');
    } else {
      setSelectionActive(false);
      document.body.classList.remove('lasso-selection-mode');
    }
    
    switch(tool) {
      case 'createGroup':
        // For create group, create immediately and go back to select mode
        createEmptyGroup();
        setActiveTool('select');
        break;
      case 'group':
        // Group selected nodes
        groupSelectedNodes();
        setActiveTool('select');
        break;
      case 'ungroup':
        // Ungroup selected nodes
        ungroupNodes();
        setActiveTool('select');
        break;
      case 'select':
      case 'lasso':
      default:
        // Just use the selection mode
        break;
    }
  }, [createEmptyGroup, groupSelectedNodes, ungroupNodes, reactFlowInstance]);

  // Handle deletion of nodes and groups properly
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    // Find groups being deleted
    const groupsToDelete = nodesToDelete.filter(node => node.type === 'group').map(node => node.id);
    
    if (groupsToDelete.length > 0) {
      // Handle child nodes for each deleted group
      reactFlowInstance.setNodes(currentNodes => {
        // First, find all affected child nodes
        const affectedNodes = currentNodes.filter(node => 
          node.parentNode && groupsToDelete.includes(node.parentNode)
        );
        
        // Then either:
        // Option 1: Delete all child nodes along with their parent groups
        return currentNodes.filter(node => 
          !(groupsToDelete.includes(node.id) || 
            (node.parentNode && groupsToDelete.includes(node.parentNode)))
        );
        
        // Option 2 (Uncomment to use): Move child nodes out to the main canvas
        /*
        return currentNodes.map(node => {
          if (node.parentNode && groupsToDelete.includes(node.parentNode)) {
            // Get parent position
            const parent = currentNodes.find(n => n.id === node.parentNode);
            if (parent) {
              // Make absolute position
              return {
                ...node,
                parentNode: undefined,
                extent: undefined,
                position: {
                  x: parent.position.x + node.position.x,
                  y: parent.position.y + node.position.y
                }
              };
            }
          }
          // Remove the group itself
          return groupsToDelete.includes(node.id) ? null : node;
        }).filter(Boolean) as Node[];
        */
      });
    }
  }, [reactFlowInstance]);

  // Add this new custom handler for selection in lasso mode
  const onSelectionStart = useCallback((event: React.MouseEvent) => {
    // Only handle in lasso mode
    if (activeTool !== 'lasso') return;
    
    // Mark we're handling this event to prevent default behaviors
    event.preventDefault();
    
    // Starting position
    const startPos = {
      x: event.clientX,
      y: event.clientY
    };
    
    // Track movement
    let hasMoved = false;
    let selectionBox: { x1: number; y1: number; x2: number; y2: number } = { x1: 0, y1: 0, x2: 0, y2: 0 }; // Initialize with y2
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-selection-overlay';
    document.body.appendChild(overlay);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      hasMoved = true;
      
      // Calculate selection box
      selectionBox = {
        x1: Math.min(startPos.x, moveEvent.clientX),
        y1: Math.min(startPos.y, moveEvent.clientY),
        x2: Math.max(startPos.x, moveEvent.clientX),
        y2: Math.max(startPos.y, moveEvent.clientY)
      };
      
      // Update overlay
      overlay.style.left = `${selectionBox.x1}px`;
      overlay.style.top = `${selectionBox.y1}px`;
      overlay.style.width = `${selectionBox.x2 - selectionBox.x1}px`;
      overlay.style.height = `${selectionBox.y2 - selectionBox.y1}px`;
      overlay.style.display = 'block';
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.removeChild(overlay);
      
      // If no movement, treat as a click - select node under cursor
      if (!hasMoved) {
        // Get element at click position
        const element = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const nodeElement = element?.closest('.react-flow__node');
        
        if (nodeElement) {
          const nodeId = nodeElement.getAttribute('data-id');
          if (nodeId) {
            // Select just this node
            reactFlowInstance.setNodes(nodes => 
              nodes.map(node => ({
                ...node,
                selected: node.id === nodeId
              }))
            );
          }
        }
        return;
      }
      
      // Calculate flow coordinates for selection
      const flowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!flowBounds) return;
      
      const { zoom, x: vpX, y: vpY } = reactFlowInstance.getViewport();
      
      // Find nodes in selection
      const nodesToSelect = reactFlowInstance.getNodes().filter(node => {
        // Skip hidden nodes
        if (node.hidden) return false;
        
        // Get node bounds in screen coordinates
        const nodeLeft = flowBounds.left + (node.position.x * zoom + vpX);
        const nodeTop = flowBounds.top + (node.position.y * zoom + vpY);
        const nodeWidth = (node.width || 150) * zoom;
        const nodeHeight = (node.height || 80) * zoom;
        const nodeRight = nodeLeft + nodeWidth;
        const nodeBottom = nodeTop + nodeHeight;
        
        // Check if node overlaps with selection
        return (
          nodeRight >= selectionBox.x1 &&
          nodeLeft <= selectionBox.x2 &&
          nodeBottom >= selectionBox.y1 &&
          nodeTop <= selectionBox.y2
        );
      });
      
      // Update selection
      reactFlowInstance.setNodes(nodes => 
        nodes.map(node => ({
          ...node,
          selected: nodesToSelect.some(n => n.id === node.id)
        }))
      );
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
  }, [activeTool, reactFlowInstance, reactFlowWrapper]);

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
          onNodesDelete={onNodesDelete} // Add this handler
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
          // Configuración óptima para la selección de nodos
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={activeTool === 'lasso'}
          selectNodesOnDrag={activeTool === 'select'} // Permite seleccionar nodos al arrastrarlos en modo select
          multiSelectionKeyCode={null} // Desactiva la selección múltiple con teclas, solo usar lasso
          panOnDrag={activeTool !== 'lasso'} // Permitir paneo excepto en modo lasso
          onSelectionStart={activeTool === 'lasso' ? onSelectionStart : undefined}
          
          // Make sure nodes are selectable and draggable
          elementsSelectable={true}
          nodesConnectable={true}
          nodesDraggable={activeTool === 'select'}
          className={`
            bg-slate-50 dark:bg-slate-900 
            ${focusedNodeId ? 'focus-mode' : ''} 
            ${activeTool === 'lasso' ? 'lasso-active' : ''}
          `}
        >
          {/* Top panel with save and sidebar toggle */}
          <Panel position="top-right" className="flex gap-2">
            <button 
              onClick={toggleSidebar} 
              className="bg-slate-200 dark:bg-slate-700 p-2 rounded-md shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600"
              title={sidebarOpen ? "Ocultar panel" : "Mostrar panel"}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <button 
              onClick={onSave} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors font-medium"
            >
              Guardar
            </button>
          </Panel>
          
          {/* Tools panel with enhanced selection tool */}
          <Panel position="top-left" className="flex flex-col gap-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-md shadow">
            <button 
              onClick={() => handleToolClick('select')}
              className={`p-2 rounded-md ${activeTool === 'select' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Seleccionar (click)"
            >
              <CursorArrowRaysIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleToolClick('lasso')}
              className={`p-2 rounded-md ${activeTool === 'lasso' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Selección múltiple (área)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </button>
            <button 
              onClick={() => handleToolClick('createGroup')}
              className={`p-2 rounded-md ${activeTool === 'createGroup' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Crear grupo vacío"
            >
              <Square2StackIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleToolClick('group')}
              className={`p-2 rounded-md ${activeTool === 'group' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} ${selectedNodes.length < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Agrupar nodos seleccionados"
              disabled={selectedNodes.length < 1}
            >
              <FolderPlusIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleToolClick('ungroup')}
              className={`p-2 rounded-md ${activeTool === 'ungroup' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} ${!selectedNodes.some(n => n.type === 'group') ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Desagrupar nodos"
              disabled={!selectedNodes.some(n => n.type === 'group')}
            >
              <FolderMinusIcon className="w-5 h-5" />
            </button>
          </Panel>

          {/* Selected nodes count indicator */}
          {selectedNodes.length > 0 && (
            <Panel position="bottom-left" className="bg-white/80 dark:bg-gray-800/80 rounded-md shadow p-2">
              {selectedNodes.length} {selectedNodes.length === 1 ? 'nodo' : 'nodos'} seleccionado{selectedNodes.length > 1 ? 's' : ''}
            </Panel>
          )}

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
          
          {/* Context Menu - Fixed positioning with enhanced options */}
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
                          Añadir nuevo nodo
                        </button>
                        
                        {/* Add selected nodes to this group */}
                        {selectedNodes.length > 0 && selectedNodes.some(n => n.id !== contextMenu.nodeId) && (
                          <button 
                            className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            onClick={() => handleContextMenuAction('addSelectedNodesToGroup')}
                          >
                            Añadir {selectedNodes.length === 1 ? 'nodo seleccionado' : `${selectedNodes.length} nodos`}
                          </button>
                        )}
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
                        
                        {/* Add option to remove from group if node is inside a group */}
                        {currentNode?.parentNode && (
                          <button 
                            className="text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            onClick={() => handleContextMenuAction('removeFromGroup')}
                          >
                            Quitar del grupo
                          </button>
                        )}
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

        {/* Selection tool indicator */}
        {activeTool === 'lasso' && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 border border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
            Modo selección múltiple - Haz clic en un nodo o dibuja un área para seleccionar varios
          </div>
        )}
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