import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CodeBracketIcon
} from '@heroicons/react/24/outline';

// Componente Compute Engine
export const ComputeEngineNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg shadow-sm p-3 transition-all duration-300
      ${selected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    data-provider="gcp"
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <ServerIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Compute Engine'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">GCP</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente Cloud Storage
export const CloudStorageNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg shadow-sm p-3 transition-all duration-300
      ${selected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    data-provider="gcp"
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <CloudIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Cloud Storage'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">GCP</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente Cloud Functions
export const CloudFunctionsNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg shadow-sm p-3 transition-all duration-300
      ${selected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    data-provider="gcp"
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <CodeBracketIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Cloud Functions'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">GCP</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente Cloud SQL
export const CloudSQLNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg shadow-sm p-3 transition-all duration-300
      ${selected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
    data-provider="gcp"
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <CircleStackIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Cloud SQL'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">GCP</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));