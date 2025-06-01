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
  ArrowsRightLeftIcon as LoadBalancerIcon, // Reutilizando para AWS ALB y Azure LB
  GlobeAltIcon as ApiGatewayIcon, // Usando GlobeAltIcon para API Gateway y Azure App Gateway
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
  CubeIcon as AzureContainerGroupIcon, // Usando para Azure Container Group
  BoltIcon as AzureLinuxFunctionAppIcon, // Usando para Azure Linux Function App
  ArchiveBoxIcon as AzureStorageContainerIcon, // Usando para Azure Storage Container
  CircleStackIcon as AzureCosmosDbAccountIcon, // Usando para Azure Cosmos DB Account
  CircleStackIcon as AzureMsSqlDatabaseIcon, // Reutilizando para Azure SQL Database
  BoltIcon as AzureRedisCacheIcon, // Reutilizando BoltIcon para Azure Cache for Redis
  ChartBarIcon as AzureSynapseWorkspaceIcon, // Usando ChartBarIcon para Synapse
  FolderIcon as AzureStorageShareIcon, // Reutilizando FolderIcon para Azure File Share
  GlobeAltIcon as AzureApiManagementServiceIcon, // Reutilizando GlobeAltIcon para API Management
  ChatBubbleOvalLeftEllipsisIcon as AzureServiceBusNamespaceIcon, // Reutilizando para Service Bus
  RssIcon as AzureEventGridTopicIcon, // Reutilizando RssIcon para Event Grid Topic
  RectangleGroupIcon as AzureLogicAppWorkflowIcon, // Reutilizando para Logic Apps
  BoltIcon as AzureEventHubNamespaceIcon, // Reutilizando BoltIcon para Event Hubs
  GlobeAltIcon as AzureVirtualNetworkIcon, // Reutilizando para VNet
  ShieldCheckIcon as AzureNetworkSecurityGroupIcon, // Reutilizando para NSG
  GlobeAltIcon as AzureApplicationGatewayIcon, // Reutilizando para App Gateway
  ShieldCheckIcon as AzureFirewallIcon // Reutilizando para Firewall
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
      data={{ ...props.data, provider: 'aws', icon: <CloudIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'S3 Bucket', resourceType: 'aws_s3_bucket' }}
    />
  );
}
S3BucketNode.displayName = 'S3BucketNode';

export function LambdaFunctionNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CodeBracketIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'Lambda Function', resourceType: 'aws_lambda_function' }}
    />
  );
}
LambdaFunctionNode.displayName = 'LambdaFunctionNode';

export function RDSInstanceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CircleStackIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'RDS Instance', resourceType: 'aws_rds_instance' }}
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

export function AzureLinuxFunctionAppNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLinuxFunctionAppIcon className="w-6 h-6 text-yellow-500" />, label: props.data.label || 'Linux Function App', resourceType: 'azurerm_linux_function_app' }}
    />
  );
}
AzureLinuxFunctionAppNode.displayName = 'AzureLinuxFunctionAppNode';

export function AzureStorageContainerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureStorageContainerIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Storage Container', resourceType: 'azurerm_storage_container' }}
    />
  );
}
AzureStorageContainerNode.displayName = 'AzureStorageContainerNode';

export function AzureCosmosDbAccountNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureCosmosDbAccountIcon className="w-6 h-6 text-emerald-500" />, label: props.data.label || 'Cosmos DB Account', resourceType: 'azurerm_cosmosdb_account' }}
    />
  );
}
AzureCosmosDbAccountNode.displayName = 'AzureCosmosDbAccountNode';

export function AzureMsSqlDatabaseNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureMsSqlDatabaseIcon className="w-6 h-6 text-sky-500" />, label: props.data.label || 'SQL Database', resourceType: 'azurerm_mssql_database' }}
    />
  );
}
AzureMsSqlDatabaseNode.displayName = 'AzureMsSqlDatabaseNode';

export function AzureRedisCacheNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureRedisCacheIcon className="w-6 h-6 text-red-500" />, label: props.data.label || 'Redis Cache', resourceType: 'azurerm_redis_cache' }}
    />
  );
}
AzureRedisCacheNode.displayName = 'AzureRedisCacheNode';

export function AzureSynapseWorkspaceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureSynapseWorkspaceIcon className="w-6 h-6 text-purple-600" />, label: props.data.label || 'Synapse Workspace', resourceType: 'azurerm_synapse_workspace' }}
    />
  );
}
AzureSynapseWorkspaceNode.displayName = 'AzureSynapseWorkspaceNode';

export function AzureStorageShareNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureStorageShareIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'File Share', resourceType: 'azurerm_storage_share' }}
    />
  );
}
AzureStorageShareNode.displayName = 'AzureStorageShareNode';

export function AzureApiManagementServiceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureApiManagementServiceIcon className="w-6 h-6 text-teal-600" />, label: props.data.label || 'API Management', resourceType: 'azurerm_api_management' }}
    />
  );
}
AzureApiManagementServiceNode.displayName = 'AzureApiManagementServiceNode';

export function AzureServiceBusNamespaceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureServiceBusNamespaceIcon className="w-6 h-6 text-purple-700" />, label: props.data.label || 'Service Bus Namespace', resourceType: 'azurerm_servicebus_namespace' }}
    />
  );
}
AzureServiceBusNamespaceNode.displayName = 'AzureServiceBusNamespaceNode';

export function AzureEventGridTopicNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureEventGridTopicIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Event Grid Topic', resourceType: 'azurerm_eventgrid_topic' }}
    />
  );
}
AzureEventGridTopicNode.displayName = 'AzureEventGridTopicNode';

export function AzureLogicAppWorkflowNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLogicAppWorkflowIcon className="w-6 h-6 text-cyan-600" />, label: props.data.label || 'Logic App Workflow', resourceType: 'azurerm_logic_app_workflow' }}
    />
  );
}
AzureLogicAppWorkflowNode.displayName = 'AzureLogicAppWorkflowNode';

export function AzureEventHubNamespaceNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureEventHubNamespaceIcon className="w-6 h-6 text-emerald-600" />, label: props.data.label || 'Event Hubs Namespace', resourceType: 'azurerm_eventhub_namespace' }}
    />
  );
}
AzureEventHubNamespaceNode.displayName = 'AzureEventHubNamespaceNode';

export function AzureVirtualNetworkNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureVirtualNetworkIcon className="w-6 h-6 text-indigo-600" />, label: props.data.label || 'Virtual Network', resourceType: 'azurerm_virtual_network' }}
    />
  );
}
AzureVirtualNetworkNode.displayName = 'AzureVirtualNetworkNode';

export function AzureSubnetNode(props: NodeProps) { 
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <RectangleStackIcon className="w-6 h-6 text-sky-600" />, label: props.data.label || 'Subnet', resourceType: 'azurerm_subnet' }}
    />
  );
}
AzureSubnetNode.displayName = 'AzureSubnetNode';

export function AzureNetworkSecurityGroupNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureNetworkSecurityGroupIcon className="w-6 h-6 text-teal-600" />, label: props.data.label || 'NSG', resourceType: 'azurerm_network_security_group' }}
    />
  );
}
AzureNetworkSecurityGroupNode.displayName = 'AzureNetworkSecurityGroupNode';

export function AzureLoadBalancerNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <LoadBalancerIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Load Balancer', resourceType: 'azurerm_lb' }}
    />
  );
}
AzureLoadBalancerNode.displayName = 'AzureLoadBalancerNode';

export function AzureApplicationGatewayNode(props: NodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <ApiGatewayIcon className="w-6 h-6 text-emerald-500" />, label: props.data.label || 'App Gateway', resourceType: 'azurerm_application_gateway' }}
    />
  );
}
AzureApplicationGatewayNode.displayName = 'AzureApplicationGatewayNode';

// --- Node Types Object ---
const nodeTypes = {
  // AWS nodes
  aws_ec2_instance: EC2Node,
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
  aws_sfn_state_machine: SfnStateMachineNode,
  
  // GCP nodes
  gcp_compute_instance: ComputeEngineNode,
  gcp_cloud_tasks_queue: GcpCloudTasksQueueNode,
  gcp_workflows_workflow: GcpWorkflowsWorkflowNode,
  gcp_eventarc_trigger: GcpEventarcTriggerNode,
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
  gcp_filestore_instance: FilestoreInstanceNode,
  
  gcp_compute_disk: ComputeDiskNode,
  gcp_compute_network: ComputeNetworkNode,
  gcp_compute_firewall: ComputeFirewallNode,
  gcp_compute_load_balancer: ComputeLoadBalancerNode,
  gcp_compute_instance_template: ComputeInstanceTemplateNode,

  gcp_api_gateway: BaseResourceNode, 
  gcp_pubsub_topic: BaseResourceNode,
  
  // Fallbacks genéricos
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
  azurerm_container_group: AzureContainerGroupNode,
  azurerm_linux_function_app: AzureLinuxFunctionAppNode,
  azurerm_storage_container: AzureStorageContainerNode,
  azurerm_cosmosdb_account: AzureCosmosDbAccountNode,
  azurerm_mssql_database: AzureMsSqlDatabaseNode,
  azurerm_redis_cache: AzureRedisCacheNode,
  azurerm_synapse_workspace: AzureSynapseWorkspaceNode,
  azurerm_storage_share: AzureStorageShareNode,
  azurerm_api_management: AzureApiManagementServiceNode,
  azurerm_servicebus_namespace: AzureServiceBusNamespaceNode,
  azurerm_eventgrid_topic: AzureEventGridTopicNode,
  azurerm_logic_app_workflow: AzureLogicAppWorkflowNode,
  azurerm_eventhub_namespace: AzureEventHubNamespaceNode,
  azurerm_virtual_network: AzureVirtualNetworkNode,
  azurerm_subnet: AzureSubnetNode,
  azurerm_network_security_group: AzureNetworkSecurityGroupNode,
  azurerm_lb: AzureLoadBalancerNode,
  azurerm_application_gateway: AzureApplicationGatewayNode, // Añadido Azure App Gateway
  vm: AzureVMNode,
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
<environment_details>
# VSCode Visible Files
../../../../../request_b011b0d3-bbbb-4ca7-9b1f-57f5dda7ca72/0
../../../../../request_b011b0d3-bbbb-4ca7-9b1f-57f5dda7ca72/0
../../../../../response_70fdaeda-46b9-4955-8f94-87ff3ee35cb0/10
../../../../../response_0c68ea48-2682-47d1-89c8-c6c5d94ed8b9/tools-13
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-3
aether/app/components/ui/CredentialsPage.tsx
aether/app/components/ui/CredentialsPage.tsx
aether/app/api/auth/github/callback/route.ts
aether/app/api/auth/github/callback/route.ts
../../../../../response_72062af1-e2b8-49ff-a882-c150dbb868a6/tools-1
../../../../../response_0c68ea48-2682-47d1-89c8-c6c5d94ed8b9/tools-13
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-2
../../../../../response_72062af1-e2b8-49ff-a882-c150dbb868a6/tools-1
../../../../../response_0c68ea48-2682-47d1-89c8-c6c5d94ed8b9/tools-14
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-2
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-3
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-4
../../../../../response_0c68ea48-2682-47d1-89c8-c6c5d94ed8b9/tools-15
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-11
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-10
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-9
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-6
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-5
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-5
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-6
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-9
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-10
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-12
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-13
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-14
../../../../../response_395817b7-be9c-4835-adc4-5d4e6c9eecae/tools-15
../../../../../response_5e8ed63e-9005-4c41-9cb7-413e40dd5cff/tools-24
../../../../../response_5e8ed63e-9005-4c41-9cb7-413e40dd5cff/tools-23
../../../../../response_5e8ed63e-9005-4c41-9cb7-413e40dd5cff/tools-22
../../../../../response_5e8ed63e-9005-4c41-9cb7-413e40dd5cff/tools-0
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-5
../../../../../response_e6341bf3-e3f2-4eb3-b247-d0b2ec8da17c/tools-4
infraux/app/components/nodes/NodeTypes.tsx

# VSCode Open Tabs
infraux/test_gcp_system.ts
infraux/app/config/resourceSchemas.ts
infraux/app/config/schemas/gcp/compute/instance/instance.ts
infraux/app/config/schemas/gcp/compute/disk/diskTemplates.ts
infraux/app/config/schemas/gcp/compute/disk/disk.ts
infraux/app/config/schemas/gcp/compute/firewall/firewallTemplates.ts
infraux/app/config/schemas/gcp/compute/firewall/firewall.ts
infraux/app/config/schemas/gcp/compute/instance-template/instanceTemplateTemplates.ts
infraux/app/config/schemas/gcp/compute/instance-template/instanceTemplate.ts
infraux/app/config/schemas/gcp/compute/load-balancer/loadBalancerTemplates.ts
infraux/app/config/schemas/gcp/compute/load-balancer/loadBalancer.ts
infraux/app/config/schemas/gcp/compute/network/networkTemplates.ts
infraux/app/config/schemas/gcp/compute/network/network.ts
infraux/app/config/schemas/gcp/compute/instance-group/instanceGroupTemplates.ts
infraux/app/config/schemas/gcp/compute/instance-group/instanceGroup.ts
infraux/app/config/schemas/gcp/storage/bucketFields.ts
infraux/app/config/schemas/gcp/storage/bucketTemplates.ts
infraux/app/config/schemas/gcp/compute/index.ts
infraux/app/components/ui/ResourceConfigForm.tsx
infraux/app/config/schemas/gcp/cloudrun/serviceFields.ts
infraux/app/config/schemas/gcp/cloudrun/serviceTemplates.ts
infraux/app/config/schemas/gcp/cloudrun/service.ts
infraux/app/config/schemas/gcp/cloudrun/index.ts
infraux/app/config/schemas/gcp/functions/functionFields.ts
infraux/app/config/schemas/gcp/functions/functionTemplates.ts
infraux/app/config/schemas/gcp/functions/function.ts
infraux/app/config/schemas/gcp/functions/index.ts
infraux/app/config/schemas/gcp/storage/bucket.ts
infraux/app/config/schemas/gcp/database/instanceFields.ts
infraux/app/config/schemas/gcp/database/instanceTemplates.ts
infraux/app/config/schemas/gcp/database/instance.ts
infraux/app/config/schemas/gcp/database/datasetFields.ts
infraux/app/config/schemas/gcp/database/datasetTemplates.ts
infraux/app/config/schemas/gcp/database/dataset.ts
infraux/app/config/schemas/gcp/database/firestoreDatabaseFields.ts
infraux/app/config/schemas/gcp/database/firestoreDatabaseTemplates.ts
infraux/app/config/schemas/gcp/database/firestoreDatabase.ts
infraux/app/config/schemas/gcp/database/index.ts
infraux/app/config/schemas/gcp/appengine/appFields.ts
infraux/app/config/schemas/gcp/compute/instance/instanceTemplates.ts
infraux/app/config/schemas/aws/elasticache/clusterFields.ts
infraux/app/config/schemas/aws/elasticache/clusterTemplates.ts
infraux/app/config/schemas/aws/elasticache/cluster.ts
infraux/app/config/schemas/aws/elasticache/index.ts
infraux/app/config/schemas/aws/redshift/clusterFields.ts
infraux/app/config/schemas/aws/redshift/clusterTemplates.ts
infraux/app/config/schemas/aws/redshift/cluster.ts
infraux/app/config/schemas/aws/redshift/index.ts
infraux/app/config/schemas/aws/efs/fileSystemFields.ts
infraux/app/config/schemas/aws/efs/fileSystemTemplates.ts
infraux/app/config/schemas/aws/efs/fileSystem.ts
infraux/app/config/schemas/aws/efs/index.ts
infraux/app/config/schemas/aws/apigateway/restApiFields.ts
infraux/app/config/schemas/aws/apigateway/restApiTemplates.ts
infraux/app/config/schemas/aws/apigateway/index.ts
infraux/app/config/schemas/aws/sqs/queueFields.ts
infraux/app/config/schemas/aws/sqs/queueTemplates.ts
infraux/app/config/schemas/aws/sqs/index.ts
infraux/app/config/schemas/aws/sns/topicFields.ts
infraux/app/config/schemas/aws/sns/topicTemplates.ts
infraux/app/config/schemas/aws/sns/index.ts
infraux/app/config/schemas/gcp/cache/instanceTemplates.ts
infraux/app/config/schemas/gcp/cache/index.ts
infraux/app/config/schemas/gcp/cache/instanceFields.ts
infraux/app/config/schemas/gcp/cache/instance.ts
infraux/app/config/schemas/gcp/storage/filestoreInstanceFields.ts
infraux/app/config/schemas/gcp/storage/filestoreInstanceTemplates.ts
infraux/app/config/schemas/gcp/storage/filestoreInstance.ts
infraux/app/config/schemas/gcp/storage/index.ts
infraux/app/config/schemas/aws/ec2/instanceFields.ts
infraux/app/config/schemas/aws/ec2/instance.ts
infraux/app/config/schemas/aws/ec2/index.ts
infraux/app/config/schemas/aws/s3/bucketFields.ts
infraux/app/config/schemas/aws/s3/bucketTemplates.ts
infraux/app/config/schemas/aws/s3/bucket.ts
infraux/app/config/schemas/aws/s3/index.ts
infraux/app/config/schemas/aws/ec2/instanceTemplates.ts
infraux/app/config/schemas/aws/dynamodb/table.ts
infraux/app/config/schemas/aws/lambda/functionFields.ts
infraux/app/config/schemas/aws/lambda/functionTemplates.ts
infraux/app/config/schemas/aws/lambda/function.ts
infraux/app/config/schemas/aws/lambda/index.ts
infraux/app/config/schemas/aws/rds/instanceFields.ts
infraux/app/config/schemas/aws/rds/instanceTemplates.ts
infraux/app/config/schemas/aws/rds/instance.ts
infraux/app/config/schemas/aws/rds/index.ts
infraux/app/config/schemas/aws/elbv2/loadBalancerFields.ts
infraux/app/config/schemas/aws/elbv2/loadBalancer.ts
infraux/app/config/schemas/aws/elbv2/index.ts
infraux/app/config/schemas/aws/elbv2/loadBalancerTemplates.ts
infraux/app/config/schemas/aws/autoscaling/groupFields.ts
infraux/app/config/schemas/aws/autoscaling/group.ts
infraux/app/config/schemas/aws/autoscaling/index.ts
infraux/app/config/schemas/aws/dynamodb/index.ts
infraux/app/config/schemas/aws/ecs/serviceTemplates.ts
infraux/app/config/schemas/aws/ecs/service.ts
infraux/app/config/schemas/aws/ecs/index.ts
infraux/app/config/schemas/aws/eks/clusterFields.ts
infraux/app/config/schemas/aws/eks/clusterTemplates.ts
infraux/app/config/schemas/aws/dynamodb/tableTemplates.ts
infraux/app/config/schemas/aws/eks/cluster.ts
infraux/app/config/schemas/aws/eks/index.ts
infraux/app/config/schemas/aws/dynamodb/tableFields.ts
infraux/app/config/schemas/aws/elasticbeanstalk/environmentFields.ts
infraux/app/config/schemas/aws/elasticbeanstalk/environmentTemplates.ts
infraux/app/config/schemas/aws/elasticbeanstalk/environment.ts
infraux/app/config/schemas/aws/elasticbeanstalk/index.ts
infraux/app/config/schemas/gcp/appengine/app.ts
infraux/app/config/schemas/gcp/appengine/appTemplates.ts
infraux/app/config/schemas/gcp/appengine/index.ts
infraux/app/config/schemas/gcp/gke/clusterFields.ts
infraux/app/config/schemas/gcp/gke/clusterTemplates.ts
infraux/app/config/schemas/gcp/gke/cluster.ts
infraux/app/config/schemas/aws/eventbridge/ruleFields.ts
infraux/app/config/schemas/aws/eventbridge/ruleTemplates.ts
infraux/app/config/schemas/aws/eventbridge/index.ts
infraux/app/config/schemas/aws/sfn/stateMachineFields.ts
infraux/app/config/schemas/aws/sfn/stateMachineTemplates.ts
infraux/app/config/schemas/aws/sfn/index.ts
infraux/app/config/schemas/aws/index.ts
infraux/app/config/schemas/gcp/cloudtasks/queueFields.ts
infraux/app/config/schemas/gcp/cloudtasks/queueTemplates.ts
infraux/app/config/schemas/gcp/cloudtasks/queue.ts
infraux/app/config/schemas/gcp/cloudtasks/index.ts
infraux/app/config/schemas/gcp/workflows/workflowFields.ts
infraux/app/config/schemas/gcp/workflows/workflowTemplates.ts
infraux/app/config/schemas/gcp/workflows/workflow.ts
infraux/app/config/schemas/gcp/workflows/index.ts
infraux/app/config/schemas/gcp/eventarc/triggerFields.ts
infraux/app/config/schemas/gcp/eventarc/triggerTemplates.ts
infraux/app/config/schemas/gcp/eventarc/trigger.ts
infraux/app/config/schemas/gcp/eventarc/index.ts
infraux/app/config/schemas/gcp/index.ts
infraux/app/config/schemas/aws/sns/topic.ts
infraux/app/config/schemas/aws/sqs/queue.ts
infraux/app/config/schemas/aws/eventbridge/rule.ts
infraux/app/config/schemas/aws/sfn/stateMachine.ts
infraux/app/config/schemas/aws/apigateway/restApi.ts
infraux/app/config/schemas/azure/compute/virtualmachine/virtualMachineFields.ts
infraux/app/config/schemas/azure/compute/virtualmachine/virtualMachineTemplates.ts
infraux/app/config/schemas/azure/compute/virtualmachine/virtualMachine.ts
infraux/app/config/schemas/azure/compute/linuxvirtualmachinescaleset/linuxVirtualMachineScaleSetFields.ts
infraux/app/config/schemas/azure/compute/linuxvirtualmachinescaleset/linuxVirtualMachineScaleSetTemplates.ts
infraux/app/config/schemas/azure/compute/linuxvirtualmachinescaleset/linuxVirtualMachineScaleSet.ts
infraux/app/config/schemas/index.ts
infraux/app/config/schemas/azure/compute/kubernetescluster/kubernetesClusterFields.ts
infraux/app/config/schemas/azure/compute/kubernetescluster/kubernetesClusterTemplates.ts
infraux/app/config/schemas/azure/compute/kubernetescluster/kubernetesCluster.ts
infraux/app/config/schemas/azure/compute/linuxwebapp/linuxWebAppFields.ts
infraux/app/config/schemas/azure/compute/linuxwebapp/linuxWebAppTemplates.ts
infraux/app/config/schemas/azure/database/cosmosdbaccount/cosmosDbAccountFields.ts
infraux/app/config/schemas/azure/compute/linuxwebapp/linuxWebApp.ts
infraux/app/config/schemas/azure/compute/containergroup/containerGroupFields.ts
infraux/app/types/resourceConfig.ts
infraux/app/config/schemas/azure/compute/containergroup/containerGroupTemplates.ts
infraux/app/config/schemas/azure/database/cosmosdbaccount/cosmosDbAccountTemplates.ts
infraux/app/config/schemas/azure/database/cosmosdbaccount/cosmosDbAccount.ts
infraux/app/config/schemas/azure/database/mssqldatabase/mssqlDatabaseFields.ts
infraux/app/config/schemas/azure/database/mssqldatabase/mssqlDatabaseTemplates.ts
infraux/app/config/schemas/azure/database/mssqldatabase/mssqlDatabase.ts
infraux/app/config/schemas/azure/database/index.ts
infraux/app/config/schemas/azure/cache/rediscache/redisCacheFields.ts
infraux/app/config/schemas/azure/cache/rediscache/redisCacheTemplates.ts
infraux/app/config/schemas/azure/cache/rediscache/redisCache.ts
infraux/app/config/schemas/azure/cache/index.ts
infraux/app/config/schemas/azure/analytics/synapseworkspace/synapseWorkspaceFields.ts
infraux/app/config/schemas/azure/analytics/synapseworkspace/synapseWorkspaceTemplates.ts
infraux/app/config/schemas/azure/analytics/synapseworkspace/synapseWorkspace.ts
infraux/app/config/schemas/azure/analytics/index.ts
infraux/app/config/schemas/azure/storage/storageshare/storageShareFields.ts
infraux/app/config/schemas/azure/storage/storageshare/storageShareTemplates.ts
infraux/app/config/schemas/azure/storage/storageshare/storageShare.ts
infraux/app/config/schemas/azure/storage/index.ts
infraux/app/config/schemas/azure/apimanagement/service/apiManagementServiceFields.ts
infraux/app/config/schemas/azure/apimanagement/service/apiManagementServiceTemplates.ts
infraux/app/config/schemas/azure/networking/subnet/subnet.ts
infraux/app/config/schemas/azure/networking/networksecuritygroup/networkSecurityGroupFields.ts
infraux/app/config/schemas/azure/networking/networksecuritygroup/networkSecurityGroupTemplates.ts
infraux/app/config/schemas/azure/networking/networksecuritygroup/networkSecurityGroup.ts
infraux/app/config/schemas/azure/networking/loadbalancer/loadBalancerFields.ts
infraux/app/config/schemas/azure/networking/loadbalancer/loadBalancerTemplates.ts
infraux/app/config/schemas/azure/networking/loadbalancer/loadBalancer.ts
infraux/app/config/schemas/azure/networking/applicationgateway/applicationGatewayFields.ts
infraux/app/config/schemas/azure/networking/applicationgateway/applicationGatewayTemplates.ts
infraux/app/config/schemas/azure/networking/applicationgateway/applicationGateway.ts
infraux/app/config/schemas/azure/networking/firewall/firewall.ts
infraux/app/config/schemas/azure/networking/index.ts
infraux/app/components/ui/IaCTemplatePanel.tsx
infraux/app/components/nodes/NodeTypes.tsx
infraux/app/company/[companyId]/diagrams/[diagramId]/page.tsx
infraux/app/config/schemas/azure/networking/firewall/firewallFields.ts
infraux/app/config/schemas/azure/networking/firewall/firewallTemplates.ts
infraux/app/config/schemas/azure/networking/subnet/subnetTemplates.ts
infraux/app/config/schemas/azure/networking/subnet/subnetFields.ts
infraux/app/config/schemas/azure/apimanagement/service/apiManagementService.ts
infraux/app/config/schemas/azure/apimanagement/index.ts
infraux/app/config/schemas/azure/servicebus/namespace/serviceBusNamespaceFields.ts
infraux/app/config/schemas/azure/servicebus/namespace/serviceBusNamespaceTemplates.ts
infraux/app/config/schemas/azure/servicebus/namespace/serviceBusNamespace.ts
infraux/app/config/schemas/azure/servicebus/index.ts
infraux/app/config/schemas/azure/eventgrid/topic/eventGridTopicFields.ts
infraux/app/config/schemas/azure/eventgrid/topic/eventGridTopicTemplates.ts
infraux/app/config/schemas/azure/eventgrid/topic/eventGridTopic.ts
infraux/app/config/schemas/azure/eventgrid/index.ts
infraux/app/config/schemas/azure/logicapp/workflow/logicAppWorkflowFields.ts
infraux/app/config/schemas/azure/logicapp/workflow/logicAppWorkflowTemplates.ts
infraux/app/config/schemas/azure/logicapp/workflow/logicAppWorkflow.ts
infraux/app/config/schemas/azure/logicapp/index.ts
infraux/app/config/schemas/azure/eventhub/namespace/eventHubNamespaceFields.ts
infraux/app/config/schemas/azure/eventhub/namespace/eventHubNamespaceTemplates.ts
infraux/app/config/schemas/azure/eventhub/namespace/eventHubNamespace.ts
infraux/app/config/schemas/azure/eventhub/index.ts
infraux/app/config/schemas/azure/index.ts
infraux/app/config/schemas/azure/networking/virtualnetwork/virtualNetworkFields.ts
infraux/app/config/schemas/azure/networking/virtualnetwork/virtualNetworkTemplates.ts
infraux/app/config/schemas/azure/networking/virtualnetwork/virtualNetwork.ts
infraux/app/config/schemas/azure/compute/containergroup/containerGroup.ts
infraux/app/config/schemas/azure/compute/index.ts
infraux/app/config/schemas/azure/functions/linuxfunctionapp/linuxFunctionAppFields.ts
infraux/app/config/schemas/azure/functions/linuxfunctionapp/linuxFunctionAppTemplates.ts
infraux/app/config/schemas/azure/functions/linuxfunctionapp/linuxFunctionApp.ts
infraux/app/config/schemas/azure/functions/index.ts
infraux/app/config/schemas/azure/storage/storagecontainer/storageContainerFields.ts
infraux/app/config/schemas/azure/storage/storagecontainer/storageContainerTemplates.ts
infraux/app/config/schemas/azure/storage/storagecontainer/storageContainer.ts

# Current Time
31/5/2025, 11:46:36 p.m. (America/Bogota, UTC-5:00)

# Context Window Usage
702,360 / 1,048.576K tokens used (67%)

# Current Mode
ACT MODE
</environment_details>
