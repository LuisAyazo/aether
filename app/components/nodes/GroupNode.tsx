import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label || 'Group');
  const labelInputRef = useRef<HTMLInputElement>(null);
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

  const handleLabelSubmit = useCallback(() => {
    setIsEditingLabel(false);
    if (editedLabel !== data.label) {
      reactFlowInstance.setNodes(nodes =>
        nodes.map(node =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editedLabel } }
            : node
        )
      );
    }
  }, [id, editedLabel, data.label, reactFlowInstance]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setEditedLabel(data.label || 'Group');
      setIsEditingLabel(false);
    }
  }, [handleLabelSubmit, data.label]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  // Color mapping based on cloud provider
  const getProviderColor = useCallback(() => {
    switch (data.provider) {
      case 'aws':
        return selected ? 'border-purple-500/50 bg-orange-100' : 'border-orange-400 bg-orange-50';
      case 'gcp':
        return selected ? 'border-purple-500/50 bg-blue-100' : 'border-blue-400 bg-blue-50';
      case 'azure':
        return selected ? 'border-purple-500/50 bg-blue-100' : 'border-blue-300 bg-blue-50';
      default:
        return selected ? 'border-purple-500/50 bg-gray-100' : 'border-gray-400 bg-gray-50';
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
          nodeElement.setAttribute('data-minimized', 'true');
        } else {
          const originalWidth = nodeElement.style.width;
          const originalHeight = nodeElement.style.height;
          nodeElement.style.width = originalWidth === '140px' ? '300px' : originalWidth;
          nodeElement.style.height = originalHeight === '28px' ? '200px' : originalHeight;
          nodeElement.removeAttribute('data-minimized');
        }
      }
    }, 0);
    
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
              backgroundColor: 'transparent',
            }
          };
        }
        return n;
      })
    );

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
        return '☁️';
      case 'gcp':
        return '🔵';
      case 'azure':
        return '🔷';
      default:
        return '📦';
    }
  };

  if (isMinimized) {
    return (
      <div
        className={`relative px-2 py-1 border rounded-lg bg-white shadow-sm ${getProviderColor()}`}
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
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={handleLabelKeyDown}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '10px',
                color: '#1F2937',
                padding: 0,
                width: '100%',
              }}
            />
          ) : (
            <span 
              className="font-medium text-gray-700" 
              style={{ 
                fontSize: '10px', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                cursor: 'pointer'
              }}
              onClick={() => setIsEditingLabel(true)}
            >
              {data.label}
            </span>
          )}
        </div>
        <button
          onClick={toggleMinimize}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          title="Expand group"
          style={{ flexShrink: 0, width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Squares2X2Icon className="w-2.5 h-2.5 text-gray-600" />
        </button>
        
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
      className={`border rounded-lg bg-white/80 shadow-lg ${getProviderColor()} relative`}
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
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              onBlur={handleLabelSubmit}
              onKeyDown={handleLabelKeyDown}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '14px',
                color: '#1F2937',
                padding: 0,
                width: '100%',
                fontFamily: 'inherit',
                fontWeight: 600
              }}
            />
          ) : (
            <span 
              className="font-semibold text-gray-800 text-sm cursor-pointer"
              onClick={() => setIsEditingLabel(true)}
            >
              {data.label}
            </span>
          )}
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
          borderWidth: 1,
          opacity: 0.5
        }}
        handleStyle={{
          width: 6,
          height: 6,
          backgroundColor: '#3b82f6',
          border: '1px solid white',
          opacity: 0.8
        }}
      />
      
      {/* Handles for connections */}
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
          zIndex: 2
        }}
      />
    </div>
  );
};

GroupNode.displayName = 'GroupNode';

export default GroupNode;
