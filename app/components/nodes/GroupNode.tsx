import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { 
  EyeSlashIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface GroupNodeData {
  label: string;
  provider?: 'aws' | 'gcp' | 'azure' | 'generic';
  isCollapsed?: boolean;
  isMinimized?: boolean;
}

interface GroupNodeProps extends NodeProps<GroupNodeData> {
  data: GroupNodeData;
}

const GroupNode: React.FC<GroupNodeProps> = ({ id, data, selected }) => {
  const [isMinimized, setIsMinimized] = useState(data.isMinimized || false);
  const reactFlowInstance = useReactFlow();
  
  // Ensure DOM node size matches minimized state on mount and updates
  useEffect(() => {
    const nodeElement = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
    if (nodeElement && (isMinimized || data.isMinimized)) {
      nodeElement.style.width = '140px';
      nodeElement.style.height = '28px';
      nodeElement.setAttribute('data-minimized', 'true');
    }
  }, [id, isMinimized, data.isMinimized]);

  // Color mapping based on cloud provider
  const getProviderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return selected ? 'border-purple-500 bg-orange-100' : 'border-orange-400 bg-orange-50';
      case 'gcp':
        return selected ? 'border-purple-500 bg-blue-100' : 'border-blue-400 bg-blue-50';
      case 'azure':
        return selected ? 'border-purple-500 bg-blue-100' : 'border-blue-300 bg-blue-50';
      default:
        return selected ? 'border-purple-500 bg-gray-100' : 'border-gray-400 bg-gray-50';
    }
  }, [data.provider, selected]);

  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);
    
    // Get reference to the DOM node to adjust it directly
    setTimeout(() => {
      const nodeElement = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
      if (nodeElement) {
        if (newMinimizedState) {
          nodeElement.style.width = '140px';
          nodeElement.style.height = '28px';
          // Add data attribute for CSS targeting
          nodeElement.setAttribute('data-minimized', 'true');
        } else {
          const originalWidth = nodeElement.style.width;
          const originalHeight = nodeElement.style.height;
          nodeElement.style.width = originalWidth === '140px' ? '300px' : originalWidth;
          nodeElement.style.height = originalHeight === '28px' ? '200px' : originalHeight;
          // Remove data attribute
          nodeElement.removeAttribute('data-minimized');
        }
      }
    }, 0);
    
    // Update the node data and style
    reactFlowInstance.setNodes(nds => 
      nds.map(n => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              isMinimized: newMinimizedState
            },
            style: {
              ...n.style,
              width: newMinimizedState ? 140 : (n.style?.width || 300),
              height: newMinimizedState ? 28 : (n.style?.height || 200),
              backgroundColor: 'transparent', // Remove gray background
            }
          };
        }
        return n;
      })
    );

    // Hide/show child nodes
    reactFlowInstance.setNodes(nds => 
      nds.map(n => {
        if (n.parentId === id) {
          return {
            ...n,
            hidden: newMinimizedState
          };
        }
        return n;
      })
    );
  }, [id, isMinimized, reactFlowInstance]);

  // Provider icon helper
  const getProviderIcon = () => {
    switch (data.provider) {
      case 'aws':
        return '☁️'; // AWS icon placeholder
      case 'gcp':
        return '🔵'; // GCP icon placeholder
      case 'azure':
        return '🔷'; // Azure icon placeholder
      default:
        return '📦'; // Generic icon
    }
  };

  if (isMinimized) {
    return (
      <div
        className={`relative px-2 py-1 border-2 rounded-lg bg-white shadow-sm ${getProviderColor()}`}
        style={{ 
          fontSize: '11px',
          width: '140px',
          height: '28px',
          minWidth: '140px',
          minHeight: '28px',
          maxWidth: '140px',
          maxHeight: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div className="flex items-center gap-1" style={{ overflow: 'hidden', maxWidth: '100px' }}>
          <span style={{ fontSize: '10px', flexShrink: 0 }}>{getProviderIcon()}</span>
          <span 
            className="font-medium text-gray-700" 
            style={{ 
              fontSize: '10px', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}
          >
            {data.label}
          </span>
        </div>
        <button
          onClick={toggleMinimize}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          title="Expand group"
          style={{ flexShrink: 0, width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Squares2X2Icon className="w-2.5 h-2.5 text-gray-600" />
        </button>
        
        {/* Handles for minimized group - positioned on edges */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{
            width: '6px',
            height: '6px',
            background: '#666',
            border: '1px solid white',
            borderRadius: '50%',
            top: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2
          }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            width: '6px',
            height: '6px',
            background: '#666',
            border: '1px solid white',
            borderRadius: '50%',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          style={{
            width: '6px',
            height: '6px',
            background: '#666',
            border: '1px solid white',
            borderRadius: '50%',
            left: -3,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{
            width: '6px',
            height: '6px',
            background: '#666',
            border: '1px solid white',
            borderRadius: '50%',
            right: -3,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`border-2 rounded-lg bg-white/80 shadow-lg ${getProviderColor()} relative`}
      style={{ 
        minWidth: '250px', 
        minHeight: '150px',
        width: '100%',
        height: '100%'
      }}
    >
      {/* Group header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getProviderIcon()}</span>
          <span className="font-semibold text-gray-800 text-sm">{data.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Minimize group"
          >
            <EyeSlashIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Group content area */}
      <div className="p-2 h-full">
        {/* This is where child nodes will be rendered */}
      </div>

      {/* Node resizer for adjusting group size */}
      <NodeResizer 
        isVisible={selected}
        minWidth={250}
        minHeight={150}
        lineStyle={{
          borderColor: '#3b82f6',
          borderWidth: 2,
        }}
        handleStyle={{
          width: 8,
          height: 8,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
        }}
      />
      
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          width: '10px',
          height: '10px',
          background: '#000',
          border: '2px solid white',
          borderRadius: '50%',
          top: -5,
          zIndex: 2
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          width: '10px',
          height: '10px',
          background: '#000',
          border: '2px solid white',
          borderRadius: '50%',
          bottom: -5,
          zIndex: 2
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          width: '10px',
          height: '10px',
          background: '#000',
          border: '2px solid white',
          borderRadius: '50%',
          left: -5,
          zIndex: 2
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          width: '10px',
          height: '10px',
          background: '#000',
          border: '2px solid white',
          borderRadius: '50%',
          right: -5,
          zIndex: 2
        }}
      />
    </div>
  );
};

GroupNode.displayName = 'GroupNode';

export default GroupNode;
