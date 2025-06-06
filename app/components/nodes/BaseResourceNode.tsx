import { useCallback, useState, useEffect } from 'react';
import type { Node, NodeProps } from 'reactflow'; // Volver a la importación de tipos directa
import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  Cog6ToothIcon, 
  Squares2X2Icon, 
  ListBulletIcon, 
  EyeSlashIcon, 
  EyeIcon, 
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentDuplicateIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import { NodeData } from '../../utils/customTypes';
import { message } from 'antd';

// Add some CSS styles for double-click animation
const doubleClickableStyles = `
@keyframes pulseHint {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.node-double-clickable:hover {
  animation: pulseHint 2s infinite;
}
`;

// Insert the styles into the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = doubleClickableStyles;
  document.head.appendChild(styleElement);
}

interface BaseResourceNodeProps extends NodeProps<NodeData> { // Usar NodeProps<NodeData> directamente
  data: NodeData & {
    icon?: React.ReactNode;
    isCollapsed?: boolean;
    parentNode?: string;
    userResized?: boolean;
    resizable?: boolean;
  };
}

const BaseResourceNode: React.FC<BaseResourceNodeProps> = ({ id, data, selected }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed !== false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [isResizable, setIsResizable] = useState(data.resizable !== false && data.userResized === true);
  const [isLocked, setIsLocked] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // Estado para el hover
  const reactFlowInstance = useReactFlow();
  
  // Color mapping based on cloud provider
  const getProviderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return selected ? 'border-purple-500 bg-orange-50' : 'border-orange-500 bg-orange-50';
      case 'gcp':
        return selected ? 'border-purple-500 bg-blue-50' : 'border-blue-500 bg-blue-50';
      case 'azure':
        return selected ? 'border-purple-500 bg-blue-50' : 'border-blue-400 bg-blue-50';
      default:
        return selected ? 'border-purple-500 bg-gray-50' : 'border-gray-300 bg-gray-50';
    }
  }, [data.provider, selected]);
  
  // Update resizable state when data changes
  useEffect(() => {
    setIsResizable(data.resizable !== false && data.userResized === true);
  }, [data.resizable, data.userResized]);
  
  // Efecto para verificar si el nodo está dentro de los límites del grupo padre
  useEffect(() => {
    if (data.parentNode) {
      const parentNode = reactFlowInstance.getNode(data.parentNode) as Node<NodeData> | undefined; 
      const currentNode = reactFlowInstance.getNode(id) as Node<NodeData> | undefined; 
      
      if (parentNode && currentNode && currentNode.position) { // Asegurar que position exista
        const parentWidth = (parentNode.style?.width as number) || (parentNode.width ?? 200);
        const parentHeight = (parentNode.style?.height as number) || (parentNode.height ?? 150);
        
        const nodeWidth = (currentNode.style?.width as number) || (currentNode.width ?? 100);
        const nodeHeight = (currentNode.style?.height as number) || (currentNode.height ?? 50);
        
        let needsAdjustment = false;
        const newPos = { ...currentNode.position };
        
        if (currentNode.position.x < 10) {
          newPos.x = 10;
          needsAdjustment = true;
        } else if (currentNode.position.x > parentWidth - nodeWidth - 10) {
          newPos.x = parentWidth - nodeWidth - 10;
          needsAdjustment = true;
          needsAdjustment = true;
        }
        
        if (currentNode.position.y < 40) { // Margen superior para la cabecera del grupo
          newPos.y = 40;
          needsAdjustment = true;
        } else if (currentNode.position.y > parentHeight - nodeHeight - 10) {
          newPos.y = parentHeight - nodeHeight - 10;
          needsAdjustment = true;
        }
        
        if (needsAdjustment) {
          reactFlowInstance.setNodes(nds => 
            nds.map((n: Node<NodeData>) => 
              n.id === id ? { ...n, position: newPos } : n
            )
          );
        }

        // También verificar si el padre está en modo colapsado
        const parentData = parentNode.data; 
        if (parentData?.isCollapsed === true) { 
          setIsListView(true);
        } else {
          setIsListView(false);
        }
      }
    }
  }, [id, data.parentNode, reactFlowInstance, data.isCollapsed]); // Añadido data.isCollapsed a las dependencias
  
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    setIsCollapsed(!isCollapsed);
    
    // También actualizar el estado en el nodo
    reactFlowInstance.setNodes(nds => 
      nds.map((n: Node<NodeData>) => { 
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              isCollapsed: !isCollapsed
            }
          };
        }
        return n;
      })
    );
  };
  
  // New function to toggle resizable mode
  const toggleResizable = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from reaching the node
    const newResizableState = !isResizable;
    setIsResizable(newResizableState);
    
    // Update the node data and trigger an event for the parent group
    reactFlowInstance.setNodes(nds => 
      nds.map((n: Node<NodeData>) => { 
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              resizable: newResizableState,
              userResized: newResizableState
            }
          };
        }
        return n;
      })
    );
    
    // Dispatch event for the parent group to handle resizing
    if (data.parentNode) {
      const event = new CustomEvent('nodeResized', {
        detail: { 
          nodeId: id, 
          groupId: data.parentNode,
          resizable: newResizableState
        }
      });
      document.dispatchEvent(event);
    }
  };
  
  // Handle node resize event
  const onResize = useCallback((_: unknown, { width, height }: { width: number; height: number }) => {
    // Dispatch event for size change
    if (data.parentNode) {
      const event = new CustomEvent('nodeResized', {
        detail: { 
          nodeId: id, 
          groupId: data.parentNode,
          width, 
          height 
        }
      });
      document.dispatchEvent(event);
    }
  }, [id, data.parentNode]);
  
  const toggleFocus = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    const newFocusedState = !isFocused;
    setIsFocused(newFocusedState);
    
    // Disparar evento personalizado para comunicar el estado de foco
    const focusEvent = new CustomEvent('nodeGroupFocus', {
      detail: { nodeId: id, isFocused: newFocusedState }
    });
    window.dispatchEvent(focusEvent);
    
    // Removed auto-zoom logic that was previously here (commented out)
  };
  
  const toggleListView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el click llegue al nodo y lo seleccione
    setIsListView(!isListView);
    
    // Actualizar el estilo del nodo
    reactFlowInstance.setNodes(nds => 
      nds.map((n: Node<NodeData>) => {
        if (n.id === id) {
          const currentStyle = n.style || {};
          return {
            ...n,
            className: !isListView ? 'list-node-item' : '',
            style: {
              ...currentStyle,
              height: !isListView ? 35 : (currentStyle.height || 50), 
              width: !isListView ? 150 : (currentStyle.width || 100)
            }
          };
        }
        return n;
      })
    );
  };

  // Handle double-click to open IaC Template Panel
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Double click detected on node:', id);
    console.log('Node data:', data);

    // Ensure we have all required data
    if (!data.label || !data.provider || !data.resourceType) {
      console.error('Missing required data for IaC panel:', {
        label: data.label,
        provider: data.provider,
        resourceType: data.resourceType
      });
      return;
    }

    // Dispatch custom event to open IaC panel
    const event = new CustomEvent('openIaCPanel', {
      detail: {
        nodeId: id,
        resourceData: {
          label: data.label,
          provider: data.provider,
          resourceType: data.resourceType
        }
      }
    });

    // Only dispatch to document to avoid duplicate events
    document.dispatchEvent(event);
    
    console.log('IaC panel event dispatched:', event.detail);
  }, [id, data]);

  // Handler for Preview functionality
  const handlePreview = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log('Preview action for node:', id);
    try {
      // Importar el mock directamente
      const mockPreview = {
        action: 'create',
        resource: {
          name: data.label || 'Unnamed Resource',
          type: data.resourceType || 'unknown',
          provider: data.provider || 'generic',
          changes: {
            properties: {
              description: {
                after: data.description || 'Máquina virtual en la nube',
                action: 'create'
              },
              machine_type: {
                after: 'e2-medium',
                action: 'create'
              },
              zone: {
                after: 'us-central1-a',
                action: 'create'
              },
              labels: {
                before: 'team:devops',
                after: 'team:payments',
                action: 'update'
              },
              new_field: {
                after: 'valor nuevo',
                action: 'create'
              },
              deprecated_field: {
                before: 'valor viejo',
                action: 'delete'
              }
            }
          }
        },
        dependencies: [
          {
            name: 'Compute Engine-boot-disk',
            type: 'disk',
            action: 'create',
            properties: {
              size_gb: {
                before: 50,
                after: 100,
                action: 'update'
              },
              type: {
                after: 'pd-standard',
                action: 'create'
              },
              zone: {
                after: 'us-central1-a',
                action: 'create'
              },
              image: {
                after: 'debian-cloud/debian-11',
                action: 'create'
              }
            }
          },
          {
            name: 'gcp-network-1',
            type: 'google_compute_network',
            action: 'update',
            properties: {
              cidr: {
                before: '10.0.0.0/16',
                after: '10.1.0.0/16',
                action: 'update'
              },
              new_cidr: {
                after: '10.2.0.0/16',
                action: 'create'
              }
            }
          },
          {
            name: 'gcp-firewall-1',
            type: 'google_compute_firewall',
            action: 'delete',
            properties: {}
          },
          {
            name: 'gcp-disk-2',
            type: 'google_compute_disk',
            action: 'create',
            properties: {
              size_gb: {
                after: 100,
                action: 'create'
              },
              type: {
                after: 'pd-ssd',
                action: 'create'
              }
            }
          }
        ]
      };

      // Log de los cambios en la consola sin información de costos
      console.log('Preview data:', {
        action: mockPreview.action,
        resource: mockPreview.resource,
        dependencies: mockPreview.dependencies
      });
      console.log('Resource changes:', mockPreview.resource.changes.properties);
      console.log('Dependencies:', mockPreview.dependencies);

      // Dispara un evento global para que el editor muestre el modal
      const event = new CustomEvent('showSingleNodePreview', { detail: mockPreview });
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error al mostrar la vista previa:', err);
      message.error('No se pudo obtener la vista previa del nodo');
    }
  }, [id, data]);

  // Handler for Run functionality
  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Run action for node:', id);
    
    // Dispatch custom event for run functionality
    const event = new CustomEvent('nodeRun', {
      detail: {
        nodeId: id,
        resourceData: {
          label: data.label,
          provider: data.provider,
          resourceType: data.resourceType
        }
      }
    });
    // Only dispatch to document to avoid duplicate events
    document.dispatchEvent(event);
  }, [id, data]);

  // Handler for Lock/Unlock functionality
  const handleLockToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);
    
    console.log(`${newLockedState ? 'Locking' : 'Unlocking'} node:`, id);
    
    // Update node data to reflect locked state
    reactFlowInstance.setNodes(nds => 
      nds.map((n: Node<NodeData>) => { 
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              isLocked: newLockedState
            }
          };
        }
        return n;
      })
    );
    
    // Dispatch event for lock state change
    const event = new CustomEvent('nodeLockToggle', {
      detail: {
        nodeId: id,
        isLocked: newLockedState
      }
    });
    document.dispatchEvent(event);
  }, [id, isLocked, reactFlowInstance]);

  // Handler for Duplicate functionality
  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Duplicating node:', id);
    
    // Get current node to duplicate
    const currentNode = reactFlowInstance.getNode(id);
    if (!currentNode) return;
    
    // Create new node with offset position
    const newNodeId = `${id}-copy-${Date.now()}`;
    const offset = 50;
    
    const duplicatedNode = {
      ...currentNode,
      id: newNodeId,
      position: {
        x: currentNode.position.x + offset,
        y: currentNode.position.y + offset
      },
      data: {
        ...currentNode.data,
        label: `${currentNode.data.label} (Copy)`
      },
      selected: false
    };
    
    // Add the duplicated node
    reactFlowInstance.setNodes(nds => [...nds, duplicatedNode]);
    
    // Dispatch event for duplicate action
    const event = new CustomEvent('nodeDuplicated', {
      detail: {
        originalNodeId: id,
        newNodeId: newNodeId,
        newNode: duplicatedNode
      }
    });
    document.dispatchEvent(event);
  }, [id, reactFlowInstance]);

  // Add event listener for node actions
  useEffect(() => {
    const handleNodeAction = (event: CustomEvent) => {
      const { action, nodeId: targetNodeId, ...actionData } = event.detail;
      
      if (targetNodeId === id) {
        console.log('Node action received:', action, actionData);
        switch(action) {
          case 'toggleListView':
            toggleListView({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleFocus':
            toggleFocus({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleCollapse':
            toggleCollapse({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleResizable':
            toggleResizable({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'preview':
            handlePreview({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'run':
            handleRun({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'toggleLock':
            handleLockToggle({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'duplicate':
            handleDuplicate({ stopPropagation: () => {} } as React.MouseEvent);
            break;
          case 'openIaCPanel':
            console.log('Opening IaC panel from action');
            handleDoubleClick({ stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent);
            break;
          case 'deleteNode':
            reactFlowInstance.setNodes(nodes => 
              nodes.filter((node: Node<NodeData>) => node.id !== id) 
            );
            break;
        }
      }
    };
    
    document.addEventListener('nodeAction', handleNodeAction as EventListener);
    
    return () => {
      document.removeEventListener('nodeAction', handleNodeAction as EventListener);
    };
  }, [id, toggleListView, toggleFocus, toggleCollapse, toggleResizable, reactFlowInstance, handleDoubleClick, handlePreview, handleRun, handleLockToggle, handleDuplicate]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuItems = [
      {
        label: 'Preview',
        icon: <EyeIcon className="w-4 h-4" />,
        onClick: (e: React.MouseEvent) => handlePreview(e)
      },
      {
        label: 'Run',
        icon: <PlayCircleIcon className="w-4 h-4" />,
        onClick: () => handleRun({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: isLocked ? 'Unlock' : 'Lock',
        icon: isLocked ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />,
        onClick: () => handleLockToggle({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: 'Duplicate',
        icon: <DocumentDuplicateIcon className="w-4 h-4" />,
        onClick: () => handleDuplicate({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: 'Configuración',
        icon: <Cog6ToothIcon className="w-4 h-4" />,
        onClick: () => {
          console.log('Opening IaC panel from context menu for node:', id);
          const event = new CustomEvent('openIaCPanel', {
            detail: {
              nodeId: id,
              resourceData: {
                label: data.label,
                provider: data.provider,
                resourceType: data.resourceType
              }
            }
          });
          // Only dispatch to document to avoid duplicate events
          document.dispatchEvent(event);
        }
      },
      {
        label: isListView ? 'Vista Normal' : 'Vista Lista',
        icon: isListView ? <Squares2X2Icon className="w-4 h-4" /> : <ListBulletIcon className="w-4 h-4" />,
        onClick: () => toggleListView({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: isFocused ? 'Quitar Foco' : 'Enfocar',
        icon: isFocused ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />,
        onClick: () => toggleFocus({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: isCollapsed ? 'Expandir' : 'Colapsar',
        icon: isCollapsed ? <ArrowsPointingOutIcon className="w-4 h-4" /> : <ArrowsPointingInIcon className="w-4 h-4" />,
        onClick: () => toggleCollapse({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: isResizable ? 'Desactivar Redimensionar' : 'Activar Redimensionar',
        icon: <ArrowsPointingOutIcon className="w-4 h-4" />,
        onClick: () => toggleResizable({ stopPropagation: () => {} } as React.MouseEvent)
      },
      {
        label: 'Eliminar',
        icon: <TrashIcon className="w-4 h-4" />,
        onClick: () => {
          const event = new CustomEvent('nodeAction', {
            detail: { action: 'deleteNode', nodeId: id }
          });
          document.dispatchEvent(event);
        }
      }
    ];

    const event = new CustomEvent('showContextMenu', {
      detail: {
        x: e.clientX,
        y: e.clientY,
        items: menuItems
      }
    });
    document.dispatchEvent(event);
  }, [id, data, isListView, isFocused, isCollapsed, isResizable, isLocked, toggleListView, toggleFocus, toggleCollapse, toggleResizable, handlePreview, handleRun, handleLockToggle, handleDuplicate]);

  // Si estamos en vista de lista (modo compacto)
  if (isListView) {
    return (
      <div 
        className="list-node-item shadow-sm"
        data-provider={data.provider}
        data-id={id}
        data-resource-type={data.resourceType}
        style={{ 
          position: 'relative',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {data.icon && (
          <div className="flex-shrink-0 w-4 h-4">
            {data.icon}
          </div>
        )}
        <div className="flex-1 text-xs font-medium truncate">{data.label}</div>
        
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="w-2 h-2 bg-primary/70 border-2 border-white z-10"
        />
      </div>
    );
  }
  
  return (
    <div
      data-id={id}
      data-provider={data.provider}
      data-resource-type={data.resourceType}
      className={`
        rounded-md border-2 ${getProviderColor()} shadow-sm
        min-w-[150px] min-h-[80px] p-3
        ${selected ? 'border-opacity-100' : 'border-opacity-50'}
        relative node-double-clickable
      `}
      style={{
        boxShadow: selected ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        {data.icon && (
          <div className="flex items-center justify-center w-8 h-8">
            {data.icon}
          </div>
        )}
        <div className="font-medium truncate text-sm">
          {data.label}
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-h-20 overflow-y-auto">
          {data.description}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: '12px', // Aumentado
          height: '12px', // Aumentado
          background: '#555', // Color más suave
          border: '2px solid white',
          borderRadius: '50%',
          top: -6, // Ajustado para el nuevo tamaño
          zIndex: 2,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: '12px', // Aumentado
          height: '12px', // Aumentado
          background: '#555',
          border: '2px solid white',
          borderRadius: '50%',
          bottom: -6, // Ajustado
          zIndex: 2,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: '12px', // Aumentado
          height: '12px', // Aumentado
          background: '#555',
          border: '2px solid white',
          borderRadius: '50%',
          left: -6, // Ajustado
          zIndex: 2,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: '12px', // Aumentado
          height: '12px', // Aumentado
          background: '#555',
          border: '2px solid white',
          borderRadius: '50%',
          right: -6, // Ajustado
          zIndex: 2,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      />
    </div>
  );
};


export default BaseResourceNode;
