import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';

const ResizableNode: React.FC<any> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={100} 
        minHeight={30}
        lineStyle={{ borderColor: '#3b82f6' }}
        handleStyle={{ backgroundColor: 'white', border: '2px solid #3b82f6', width: '16px', height: '16px' }}
      />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default memo(ResizableNode);
