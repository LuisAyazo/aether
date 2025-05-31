import type { NodeProps } from 'reactflow'; // Corregido: usar import type
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CpuChipIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import BaseResourceNode from './BaseResourceNode';
import GroupNode from './GroupNode';
import NoteNode from './NoteNode';
import TextNode from './TextNode';
import AreaNode from './AreaNode';

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
        resourceType: 'gcp_compute_instance' // Actualizado a tipo específico
      }}
    />
  );
}
ComputeEngineNode.displayName = 'ComputeEngineNode';

// App Engine Node (Nuevo)
export function AppEngineNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CloudIcon className="w-6 h-6 text-purple-500" />, // Icono sugerido para App Engine
        label: props.data.label || 'App Engine',
        resourceType: 'gcp_appengine_app' // Tipo específico
      }}
    />
  );
}
AppEngineNode.displayName = 'AppEngineNode';

// GKE Cluster Node (Nuevo)
export function GKENode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CpuChipIcon className="w-6 h-6 text-blue-700" />, // Icono sugerido para GKE
        label: props.data.label || 'GKE Cluster',
        resourceType: 'gcp_gke_cluster' // Tipo específico
      }}
    />
  );
}
GKENode.displayName = 'GKENode';

// Cloud Run Node (Nuevo)
export function CloudRunNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CodeBracketIcon className="w-6 h-6 text-green-500" />, // Icono sugerido para Cloud Run
        label: props.data.label || 'Cloud Run',
        resourceType: 'gcp_cloudrun_service' // Tipo específico
      }}
    />
  );
}
CloudRunNode.displayName = 'CloudRunNode';

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
        resourceType: 'gcp_cloud_storage_bucket' // Actualizado a tipo específico (ejemplo)
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
        resourceType: 'gcp_cloudfunctions_function' // Actualizado a tipo específico
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
        resourceType: 'gcp_sql_instance' // Actualizado a tipo específico (ejemplo)
      }}
    />
  );
}
CloudSQLNode.displayName = 'CloudSQLNode';

// Instance Group Manager Node (Nuevo o actualizar existente si 'group' era para esto)
export function InstanceGroupManagerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <ServerIcon className="w-6 h-6 text-blue-400" />, // Icono similar a instance pero diferente color
        label: props.data.label || 'Instance Group',
        resourceType: 'gcp_compute_instance_group_manager' // Tipo específico
      }}
    />
  );
}
InstanceGroupManagerNode.displayName = 'InstanceGroupManagerNode';


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
  gcp_compute_instance: ComputeEngineNode,
  gcp_compute_instance_group_manager: InstanceGroupManagerNode,
  gcp_appengine_app: AppEngineNode,
  gcp_gke_cluster: GKENode,
  gcp_cloudrun_service: CloudRunNode,
  gcp_cloudfunctions_function: CloudFunctionsNode,
  gcp_cloud_storage_bucket: CloudStorageNode, 
  gcp_sql_instance: CloudSQLNode,
  // Para otros tipos de GCP Compute que no tienen un componente visual dedicado aún,
  // pero sí tienen esquemas (disk, network, firewall, loadBalancer, instanceTemplate)
  // los mapearemos a BaseResourceNode. React Flow usará el 'type' del nodo 
  // para la lógica interna, y BaseResourceNode renderizará un nodo genérico.
  // El IaCTemplatePanel usará el resourceType completo (ej. 'gcp_compute_disk') para cargar la config.
  gcp_compute_disk: BaseResourceNode,
  gcp_compute_network: BaseResourceNode,
  gcp_compute_firewall: BaseResourceNode,
  gcp_compute_load_balancer: BaseResourceNode,
  gcp_compute_instance_template: BaseResourceNode,
  // Tipos de GCP - Aplicación (ejemplos, necesitarán sus propios componentes o mapeo a BaseResourceNode)
  gcp_api_gateway: BaseResourceNode, 
  gcp_pubsub_topic: BaseResourceNode,
  // Mantener los mapeos genéricos como fallback o para nodos antiguos si es necesario,
  // pero es preferible que los nodos nuevos siempre usen los tipos específicos.
  compute: ComputeEngineNode, // Fallback para 'compute'
  storage: CloudStorageNode,  // Fallback para 'storage'
  sql: CloudSQLNode,          // Fallback para 'sql'
  functions: CloudFunctionsNode, // Fallback para 'functions' (plural)
  
  // Generic nodes
  generic: GenericNode,
  
  // Azure nodes
  vm: AzureVMNode,
  blob: AzureBlobNode,
  cosmos: AzureCosmosNode,
  function: AzureFunctionNode, // Ojo: 'function' (singular) vs GCP 'functions' (plural)
  
  // Group node
  group: GroupNode,
  
  // Note and Text nodes
  noteNode: NoteNode,
  textNode: TextNode,
  
  // Area node
  areaNode: AreaNode,
};

export default nodeTypes;
