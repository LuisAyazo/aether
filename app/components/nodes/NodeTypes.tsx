import { NodeProps } from 'reactflow';
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CpuChipIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import BaseResourceNode from './BaseResourceNode';

// AWS Node Implementations using BaseResourceNode for consistent behavior
export function EC2Node(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <ServerIcon className="w-6 h-6 text-orange-600" />,
        label: props.data.label || 'EC2 Instance',
        resourceType: 'ec2'
      }}
    />
  );
}
EC2Node.displayName = 'EC2Node';

export function S3BucketNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <CloudIcon className="w-6 h-6 text-orange-600" />,
        label: props.data.label || 'S3 Bucket',
        resourceType: 's3'
      }}
    />
  );
}
S3BucketNode.displayName = 'S3BucketNode';

export function LambdaFunctionNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <CodeBracketIcon className="w-6 h-6 text-orange-600" />,
        label: props.data.label || 'Lambda Function',
        resourceType: 'lambda'
      }}
    />
  );
}
LambdaFunctionNode.displayName = 'LambdaFunctionNode';

export function RDSInstanceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <CircleStackIcon className="w-6 h-6 text-orange-600" />,
        label: props.data.label || 'RDS Instance',
        resourceType: 'rds'
      }}
    />
  );
}
RDSInstanceNode.displayName = 'RDSInstanceNode';

// Legacy AWS Node implementations are removed, we now use BaseResourceNode for all AWS components

// Compute Engine Node
export function ComputeEngineNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <ServerIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Compute Engine',
        resourceType: 'compute'
      }}
    />
  );
}
ComputeEngineNode.displayName = 'ComputeEngineNode';

// Cloud Storage Node
export function CloudStorageNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CloudIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Cloud Storage',
        resourceType: 'storage'
      }}
    />
  );
}
CloudStorageNode.displayName = 'CloudStorageNode';

// Cloud Functions Node
export function CloudFunctionsNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CodeBracketIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Cloud Functions',
        resourceType: 'function'
      }}
    />
  );
}
CloudFunctionsNode.displayName = 'CloudFunctionsNode';

// Cloud SQL Node
export function CloudSQLNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CircleStackIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Cloud SQL',
        resourceType: 'sql'
      }}
    />
  );
}
CloudSQLNode.displayName = 'CloudSQLNode';

// Generic Node
export function GenericNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'generic',
        icon: <CpuChipIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />,
        label: props.data.label || 'Generic',
        resourceType: 'generic'
      }}
    />
  );
}
GenericNode.displayName = 'GenericNode';

// Azure Nodes
export function AzureVMNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'azure',
        icon: <ServerIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Azure VM',
        resourceType: 'vm'
      }}
    />
  );
}
AzureVMNode.displayName = 'AzureVMNode';

export function AzureBlobNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'azure',
        icon: <CloudIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Azure Blob Storage',
        resourceType: 'blob'
      }}
    />
  );
}
AzureBlobNode.displayName = 'AzureBlobNode';

export function AzureCosmosNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'azure',
        icon: <CircleStackIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Azure Cosmos DB',
        resourceType: 'cosmos'
      }}
    />
  );
}
AzureCosmosNode.displayName = 'AzureCosmosNode';

export function AzureFunctionNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'azure',
        icon: <CodeBracketIcon className="w-6 h-6 text-blue-600" />,
        label: props.data.label || 'Azure Function',
        resourceType: 'function'
      }}
    />
  );
}
AzureFunctionNode.displayName = 'AzureFunctionNode';

// Define todos los tipos de nodos que usamos en la aplicación
const nodeTypes = {
  // AWS nodes
  ec2: EC2Node,
  lambda: LambdaFunctionNode,
  s3: S3BucketNode,
  rds: RDSInstanceNode,
  
  // GCP nodes
  compute: ComputeEngineNode,
  storage: CloudStorageNode, 
  sql: CloudSQLNode,     
  functions: CloudFunctionsNode,
  
  // Generic nodes
  generic: GenericNode,
  
  // Azure nodes
  vm: AzureVMNode,
  blob: AzureBlobNode,
  cosmos: AzureCosmosNode,
  function: AzureFunctionNode,
};

export default nodeTypes;
