import NodeGroup from './NodeGroup';
import AreaBackground from './AreaBackground';
import { 
  ComputeEngineNode, 
  CloudStorageNode, 
  CloudFunctionsNode,
  CloudSQLNode 
} from './GcpNodes';

// Para los otros tipos de nodos, vamos a crear componentes simples directamente aquí
// Podemos mover estos a archivos independientes más adelante
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CpuChipIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { CloudOutlined, DatabaseOutlined, ApiOutlined, AppstoreOutlined } from '@ant-design/icons';

// Componente EC2
const EC2Node = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-orange-500 !bg-orange-50/50 !ring-2 !ring-orange-500 !shadow-lg' : 'shadow-sm'}`}
    data-provider="aws"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(255, 153, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
        <ServerIcon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'EC2'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-orange-100 px-1.5 py-0.5 rounded-full w-fit text-orange-600">AWS</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente Lambda
const LambdaNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-orange-500 !bg-orange-50/50 !ring-2 !ring-orange-500 !shadow-lg' : 'shadow-sm'}`}
    data-provider="aws"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(255, 153, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
        <CodeBracketIcon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Lambda'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-orange-100 px-1.5 py-0.5 rounded-full w-fit text-orange-600">AWS</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente S3
const S3Node = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-orange-500 !bg-orange-50/50 !ring-2 !ring-orange-500 !shadow-lg' : 'shadow-sm'}`}
    data-provider="aws"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(255, 153, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
        <CloudIcon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'S3'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-orange-100 px-1.5 py-0.5 rounded-full w-fit text-orange-600">AWS</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente RDS
const RDSNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-orange-500 !bg-orange-50/50 !ring-2 !ring-orange-500 !shadow-lg' : 'shadow-sm'}`}
    data-provider="aws"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(255, 153, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
        <CircleStackIcon className="w-6 h-6 text-orange-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'RDS'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-orange-100 px-1.5 py-0.5 rounded-full w-fit text-orange-600">AWS</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Componente Compute
const ComputeNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-blue-500 !bg-blue-50/50 !ring-2 !ring-blue-500 !shadow-lg' : 'shadow-sm'}`}
    data-provider="gcp"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(66, 133, 244, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
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

// Generic Node
const GenericNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-gray-300 bg-gray-50/50 dark:bg-gray-800 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-gray-500 !bg-gray-50/50 !ring-2 !ring-gray-500 !shadow-lg' : 'shadow-sm'}`}
    data-provider="generic"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(102, 102, 102, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
        <CpuChipIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Generic'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-gray-100 px-1.5 py-0.5 rounded-full w-fit text-gray-600">Generic</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Azure Nodes
const AzureVMNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-blue-600 !bg-blue-50/50 !ring-2 !ring-blue-600 !shadow-lg' : 'shadow-sm'}`}
    data-provider="azure"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(0, 120, 215, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <ServerIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Azure VM'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">Azure</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

const AzureBlobNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-blue-600 !bg-blue-50/50 !ring-2 !ring-blue-600 !shadow-lg' : 'shadow-sm'}`}
    data-provider="azure"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(0, 120, 215, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <CloudIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Azure Blob Storage'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">Azure</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

const AzureCosmosNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-blue-600 !bg-blue-50/50 !ring-2 !ring-blue-600 !shadow-lg' : 'shadow-sm'}`}
    data-provider="azure"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(0, 120, 215, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <CircleStackIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Azure Cosmos DB'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">Azure</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

const AzureFunctionNode = memo(({ data, selected }: NodeProps) => (
  <div 
    className={`border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 transition-all duration-300
      ${selected ? '!border-blue-600 !bg-blue-50/50 !ring-2 !ring-blue-600 !shadow-lg' : 'shadow-sm'}`}
    data-provider="azure"
    style={{
      boxShadow: selected ? '0 4px 12px rgba(0, 120, 215, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
        <CodeBracketIcon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium">{data.label || 'Azure Function'}</h3>
        {data.description && <p className="text-xs text-gray-500">{data.description}</p>}
        <div className="text-xs mt-1 bg-blue-100 px-1.5 py-0.5 rounded-full w-fit text-blue-600">Azure</div>
      </div>
    </div>
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
));

// Define todos los tipos de nodos que usamos en la aplicación
const nodeTypes = {
  // AWS nodes
  ec2: EC2Node,
  lambda: LambdaNode,
  s3: S3Node,
  rds: RDSNode,
  
  // GCP nodes
  compute: ComputeEngineNode,
  storage: CloudStorageNode, 
  sql: CloudSQLNode,     
  functions: CloudFunctionsNode,
  
  // Generic nodes
  generic: GenericNode,
  group: NodeGroup,
  areaBackground: AreaBackground,
  
  // Azure nodes
  vm: AzureVMNode,
  blob: AzureBlobNode,
  cosmos: AzureCosmosNode,
  function: AzureFunctionNode,
};

export default nodeTypes;
