import type { NodeProps } from 'reactflow'; 
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CpuChipIcon,
  CodeBracketIcon,
  ShieldCheckIcon, 
  RectangleStackIcon, 
  ArrowsRightLeftIcon, 
  GlobeAltIcon, 
  ArchiveBoxIcon,
  TableCellsIcon,
  DocumentTextIcon as FirestoreIcon,
  BoltIcon,
  FolderIcon as FilestoreIcon, // Usando FolderIcon para Filestore
  FolderIcon, // Importando FolderIcon directamente para EFS
  ArrowsRightLeftIcon as LoadBalancerIcon, // Reutilizando para AWS ALB
  GlobeAltIcon as ApiGatewayIcon, // Usando GlobeAltIcon para API Gateway
  RectangleStackIcon as SqsQueueIcon, // Usando RectangleStackIcon para SQS
  ChatBubbleOvalLeftEllipsisIcon as SnsTopicIcon, // Usando para SNS
  CalendarDaysIcon as EventBridgeRuleIcon, // Usando para EventBridge
  AdjustmentsHorizontalIcon as SfnStateMachineIcon, // Usando para Step Functions
  ListBulletIcon as GcpCloudTasksQueueIcon, // Usando para GCP Cloud Tasks
  RectangleGroupIcon as GcpWorkflowsWorkflowIcon, // Usando para GCP Workflows
  RssIcon as GcpEventarcTriggerIcon, // Usando para GCP Eventarc
  ComputerDesktopIcon as AzureVirtualMachineIcon, // Usando para Azure VM
  ServerStackIcon as AzureLinuxVmssIcon, // Usando para Azure Linux VMSS
  CpuChipIcon as AzureAKSClusterIcon, // Usando para Azure AKS Cluster
  GlobeAltIcon as AzureLinuxWebAppIcon, // Usando para Azure App Service (Linux)
  CubeIcon as AzureContainerGroupIcon // Usando para Azure Container Group
} from '@heroicons/react/24/outline';
import BaseResourceNode from './BaseResourceNode';
import GroupNode from './GroupNode';
import NoteNode from './NoteNode';
import TextNode from './TextNode';
import AreaNode from './AreaNode';

// --- AWS Node Implementations ---
export function EC2Node(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <ServerIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'EC2 Instance', resourceType: 'aws_ec2_instance' }}
    />
  );
}
EC2Node.displayName = 'EC2Node';

export function S3BucketNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CloudIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'S3 Bucket', resourceType: 'aws_s3_bucket' }} // Ajustar si se crea aws_s3_bucket
    />
  );
}
S3BucketNode.displayName = 'S3BucketNode';

export function LambdaFunctionNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CodeBracketIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'Lambda Function', resourceType: 'aws_lambda_function' }} // Ajustar si se crea aws_lambda_function
    />
  );
}
LambdaFunctionNode.displayName = 'LambdaFunctionNode';

export function RDSInstanceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CircleStackIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'RDS Instance', resourceType: 'aws_rds_instance' }} // Ajustar si se crea aws_rds_instance
    />
  );
}
RDSInstanceNode.displayName = 'RDSInstanceNode';

export function ApplicationLoadBalancerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <LoadBalancerIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ALB', resourceType: 'aws_elbv2_load_balancer' }}
    />
  );
}
ApplicationLoadBalancerNode.displayName = 'ApplicationLoadBalancerNode';

export function AutoScalingGroupNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <RectangleStackIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ASG', resourceType: 'aws_autoscaling_group' }}
    />
  );
}
AutoScalingGroupNode.displayName = 'AutoScalingGroupNode';

export function ElasticBeanstalkEnvironmentNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CloudIcon className="w-6 h-6 text-green-600" />, label: props.data.label || 'EB Env', resourceType: 'aws_elasticbeanstalk_environment' }}
    />
  );
}
ElasticBeanstalkEnvironmentNode.displayName = 'ElasticBeanstalkEnvironmentNode';

export function ECSServiceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CpuChipIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ECS Service', resourceType: 'aws_ecs_service' }}
    />
  );
}
ECSServiceNode.displayName = 'ECSServiceNode';

export function EKSClusterNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CpuChipIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'EKS Cluster', resourceType: 'aws_eks_cluster' }}
    />
  );
}
EKSClusterNode.displayName = 'EKSClusterNode';

export function DynamoDBTableNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <TableCellsIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'DynamoDB Table', resourceType: 'aws_dynamodb_table' }}
    />
  );
}
DynamoDBTableNode.displayName = 'DynamoDBTableNode';

export function ElastiCacheClusterNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <BoltIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ElastiCache Cluster', resourceType: 'aws_elasticache_cluster' }}
    />
  );
}
ElastiCacheClusterNode.displayName = 'ElastiCacheClusterNode';

export function RedshiftClusterNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CircleStackIcon className="w-6 h-6 text-red-600" />, label: props.data.label || 'Redshift Cluster', resourceType: 'aws_redshift_cluster' }}
    />
  );
}
RedshiftClusterNode.displayName = 'RedshiftClusterNode';

export function EFSFileSystemNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <FolderIcon className="w-6 h-6 text-green-600" />, label: props.data.label || 'EFS File System', resourceType: 'aws_efs_file_system' }}
    />
  );
}
EFSFileSystemNode.displayName = 'EFSFileSystemNode';

export function ApiGatewayRestApiNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <ApiGatewayIcon className="w-6 h-6 text-yellow-500" />, label: props.data.label || 'API Gateway REST', resourceType: 'aws_api_gateway_rest_api' }}
    />
  );
}
ApiGatewayRestApiNode.displayName = 'ApiGatewayRestApiNode';

export function SqsQueueNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <SqsQueueIcon className="w-6 h-6 text-purple-500" />, label: props.data.label || 'SQS Queue', resourceType: 'aws_sqs_queue' }}
    />
  );
}
SqsQueueNode.displayName = 'SqsQueueNode';

export function SnsTopicNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <SnsTopicIcon className="w-6 h-6 text-cyan-500" />, label: props.data.label || 'SNS Topic', resourceType: 'aws_sns_topic' }}
    />
  );
}
SnsTopicNode.displayName = 'SnsTopicNode';

export function EventBridgeRuleNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <EventBridgeRuleIcon className="w-6 h-6 text-orange-700" />, label: props.data.label || 'EventBridge Rule', resourceType: 'aws_cloudwatch_event_rule' }}
    />
  );
}
EventBridgeRuleNode.displayName = 'EventBridgeRuleNode';

export function SfnStateMachineNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <SfnStateMachineIcon className="w-6 h-6 text-teal-600" />, label: props.data.label || 'State Machine', resourceType: 'aws_sfn_state_machine' }}
    />
  );
}
SfnStateMachineNode.displayName = 'SfnStateMachineNode';

// --- GCP Node Implementations ---
export function GcpCloudTasksQueueNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GcpCloudTasksQueueIcon className="w-6 h-6 text-green-600" />, label: props.data.label || 'Cloud Tasks Queue', resourceType: 'gcp_cloud_tasks_queue' }}
    />
  );
}
GcpCloudTasksQueueNode.displayName = 'GcpCloudTasksQueueNode';

export function GcpWorkflowsWorkflowNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GcpWorkflowsWorkflowIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Workflow', resourceType: 'gcp_workflows_workflow' }}
    />
  );
}
GcpWorkflowsWorkflowNode.displayName = 'GcpWorkflowsWorkflowNode';

export function GcpEventarcTriggerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GcpEventarcTriggerIcon className="w-6 h-6 text-red-500" />, label: props.data.label || 'Eventarc Trigger', resourceType: 'gcp_eventarc_trigger' }}
    />
  );
}
GcpEventarcTriggerNode.displayName = 'GcpEventarcTriggerNode';

export function ComputeEngineNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ServerIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Compute Engine', resourceType: 'gcp_compute_instance' }}
    />
  );
}
ComputeEngineNode.displayName = 'ComputeEngineNode';

export function AppEngineNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CloudIcon className="w-6 h-6 text-purple-500" />, label: props.data.label || 'App Engine', resourceType: 'gcp_appengine_app' }}
    />
  );
}
AppEngineNode.displayName = 'AppEngineNode';

export function GKENode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CpuChipIcon className="w-6 h-6 text-blue-700" />, label: props.data.label || 'GKE Cluster', resourceType: 'gcp_gke_cluster' }}
    />
  );
}
GKENode.displayName = 'GKENode';

export function CloudRunNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CodeBracketIcon className="w-6 h-6 text-green-500" />, label: props.data.label || 'Cloud Run', resourceType: 'gcp_cloudrun_service' }}
    />
  );
}
CloudRunNode.displayName = 'CloudRunNode';

export function CloudStorageNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CloudIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Cloud Storage', resourceType: 'gcp_cloud_storage_bucket' }}
    />
  );
}
CloudStorageNode.displayName = 'CloudStorageNode';

export function CloudFunctionsNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CodeBracketIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Cloud Functions', resourceType: 'gcp_cloudfunctions_function' }}
    />
  );
}
CloudFunctionsNode.displayName = 'CloudFunctionsNode';

export function CloudSQLNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CircleStackIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Cloud SQL', resourceType: 'gcp_sql_instance' }}
    />
  );
}
CloudSQLNode.displayName = 'CloudSQLNode';

export function InstanceGroupManagerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ServerIcon className="w-6 h-6 text-blue-400" />, label: props.data.label || 'Instance Group', resourceType: 'gcp_compute_instance_group_manager' }}
    />
  );
}
InstanceGroupManagerNode.displayName = 'InstanceGroupManagerNode';

export function ComputeDiskNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ArchiveBoxIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Compute Disk', resourceType: 'gcp_compute_disk' }}
    />
  );
}
ComputeDiskNode.displayName = 'ComputeDiskNode';

export function ComputeNetworkNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GlobeAltIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'VPC Network', resourceType: 'gcp_compute_network' }}
    />
  );
}
ComputeNetworkNode.displayName = 'ComputeNetworkNode';

export function ComputeFirewallNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ShieldCheckIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Firewall Rule', resourceType: 'gcp_compute_firewall' }}
    />
  );
}
ComputeFirewallNode.displayName = 'ComputeFirewallNode';

export function ComputeLoadBalancerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ArrowsRightLeftIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Load Balancer', resourceType: 'gcp_compute_load_balancer' }}
    />
  );
}
ComputeLoadBalancerNode.displayName = 'ComputeLoadBalancerNode';

export function ComputeInstanceTemplateNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <RectangleStackIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Instance Template', resourceType: 'gcp_compute_instance_template' }}
    />
  );
}
ComputeInstanceTemplateNode.displayName = 'ComputeInstanceTemplateNode';

export function BigQueryDatasetNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <TableCellsIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'BigQuery Dataset', resourceType: 'gcp_bigquery_dataset' }}
    />
  );
}
BigQueryDatasetNode.displayName = 'BigQueryDatasetNode';

export function FirestoreDatabaseNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <FirestoreIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Firestore Database', resourceType: 'gcp_firestore_database' }}
    />
  );
}
FirestoreDatabaseNode.displayName = 'FirestoreDatabaseNode';

export function MemorystoreInstanceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <BoltIcon className="w-6 h-6 text-red-500" />, label: props.data.label || 'Memorystore Instance', resourceType: 'gcp_memorystore_instance' }}
    />
  );
}
MemorystoreInstanceNode.displayName = 'MemorystoreInstanceNode';

export function FilestoreInstanceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <FilestoreIcon className="w-6 h-6 text-teal-500" />, label: props.data.label || 'Filestore Instance', resourceType: 'gcp_filestore_instance' }}
    />
  );
}
FilestoreInstanceNode.displayName = 'FilestoreInstanceNode';

// --- Generic Node ---
export function GenericNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'generic', icon: <CpuChipIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />, label: props.data.label || 'Generic', resourceType: 'generic' }}
    />
  );
}
GenericNode.displayName = 'GenericNode';

// --- Azure Nodes ---
export function AzureVMNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <ServerIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure VM', resourceType: 'vm' }}
    />
  );
}
AzureVMNode.displayName = 'AzureVMNode';

export function AzureBlobNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <CloudIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure Blob Storage', resourceType: 'blob' }}
    />
  );
}
AzureBlobNode.displayName = 'AzureBlobNode';

export function AzureCosmosNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <CircleStackIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure Cosmos DB', resourceType: 'cosmos' }}
    />
  );
}
AzureCosmosNode.displayName = 'AzureCosmosNode';

export function AzureFunctionNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <CodeBracketIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure Function', resourceType: 'function' }}
    />
  );
}
AzureFunctionNode.displayName = 'AzureFunctionNode';

export function AzureVirtualMachineNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureVirtualMachineIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure VM', resourceType: 'azurerm_virtual_machine' }}
    />
  );
}
AzureVirtualMachineNode.displayName = 'AzureVirtualMachineNode';

export function AzureLinuxVmssNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLinuxVmssIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Linux VMSS', resourceType: 'azurerm_linux_virtual_machine_scale_set' }}
    />
  );
}
AzureLinuxVmssNode.displayName = 'AzureLinuxVmssNode';

export function AzureAKSClusterNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureAKSClusterIcon className="w-6 h-6 text-blue-700" />, label: props.data.label || 'AKS Cluster', resourceType: 'azurerm_kubernetes_cluster' }}
    />
  );
}
AzureAKSClusterNode.displayName = 'AzureAKSClusterNode';

export function AzureLinuxWebAppNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLinuxWebAppIcon className="w-6 h-6 text-sky-600" />, label: props.data.label || 'Linux Web App', resourceType: 'azurerm_linux_web_app' }}
    />
  );
}
AzureLinuxWebAppNode.displayName = 'AzureLinuxWebAppNode';

export function AzureContainerGroupNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureContainerGroupIcon className="w-6 h-6 text-teal-500" />, label: props.data.label || 'Container Group', resourceType: 'azurerm_container_group' }}
    />
  );
}
AzureContainerGroupNode.displayName = 'AzureContainerGroupNode';

// --- Node Types Object ---
const nodeTypes = {
  // AWS nodes
  aws_ec2_instance: EC2Node,             // Corregido
  aws_lambda_function: LambdaFunctionNode, 
  aws_s3_bucket: S3BucketNode,           
  aws_rds_instance: RDSInstanceNode,
  aws_elbv2_load_balancer: ApplicationLoadBalancerNode,
  aws_autoscaling_group: AutoScalingGroupNode,
  aws_elasticbeanstalk_environment: ElasticBeanstalkEnvironmentNode,
  aws_ecs_service: ECSServiceNode,
  aws_eks_cluster: EKSClusterNode,
  aws_dynamodb_table: DynamoDBTableNode,
  aws_elasticache_cluster: ElastiCacheClusterNode,
  aws_redshift_cluster: RedshiftClusterNode,
  aws_efs_file_system: EFSFileSystemNode,
  aws_api_gateway_rest_api: ApiGatewayRestApiNode,
  aws_sqs_queue: SqsQueueNode,
  aws_sns_topic: SnsTopicNode,
  aws_cloudwatch_event_rule: EventBridgeRuleNode,
  aws_sfn_state_machine: SfnStateMachineNode, // Añadido Step Functions State Machine
  
  // GCP nodes
  gcp_compute_instance: ComputeEngineNode,
  gcp_cloud_tasks_queue: GcpCloudTasksQueueNode,
  gcp_workflows_workflow: GcpWorkflowsWorkflowNode,
  gcp_eventarc_trigger: GcpEventarcTriggerNode, // Añadido GCP Eventarc Trigger
  gcp_compute_instance_group_manager: InstanceGroupManagerNode,
  gcp_appengine_app: AppEngineNode,
  gcp_gke_cluster: GKENode,
  gcp_cloudrun_service: CloudRunNode,
  gcp_cloudfunctions_function: CloudFunctionsNode,
  gcp_cloud_storage_bucket: CloudStorageNode, 
  gcp_sql_instance: CloudSQLNode,
  gcp_bigquery_dataset: BigQueryDatasetNode,
  gcp_firestore_database: FirestoreDatabaseNode,
  gcp_memorystore_instance: MemorystoreInstanceNode,
  gcp_filestore_instance: FilestoreInstanceNode, // Añadido Filestore Instance
  
  gcp_compute_disk: ComputeDiskNode,
  gcp_compute_network: ComputeNetworkNode,
  gcp_compute_firewall: ComputeFirewallNode,
  gcp_compute_load_balancer: ComputeLoadBalancerNode,
  gcp_compute_instance_template: ComputeInstanceTemplateNode,

  gcp_api_gateway: BaseResourceNode, 
  gcp_pubsub_topic: BaseResourceNode,
  
  // Fallbacks genéricos (pueden eliminarse si todos los nodos usan tipos específicos)
  compute: ComputeEngineNode, 
  storage: CloudStorageNode,  
  sql: CloudSQLNode,          
  functions: CloudFunctionsNode, 
  
  // Generic nodes
  generic: GenericNode,
  
  // Azure nodes
  azurerm_virtual_machine: AzureVirtualMachineNode,
  azurerm_linux_virtual_machine_scale_set: AzureLinuxVmssNode,
  azurerm_kubernetes_cluster: AzureAKSClusterNode,
  azurerm_linux_web_app: AzureLinuxWebAppNode,
  azurerm_container_group: AzureContainerGroupNode, // Añadido Azure Container Group
  vm: AzureVMNode, // Mantener por si otros nodos Azure usan 'vm' genéricamente por ahora
  blob: AzureBlobNode,
  cosmos: AzureCosmosNode,
  function: AzureFunctionNode, 
  
  // Group node
  group: GroupNode,
  
  // Note and Text nodes
  noteNode: NoteNode,
  textNode: TextNode,
  
  // Area node
  areaNode: AreaNode,
};

export default nodeTypes;
