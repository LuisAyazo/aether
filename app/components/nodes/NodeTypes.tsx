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
  ChatBubbleOvalLeftEllipsisIcon,
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
  CubeIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  ListBulletIcon,
  RectangleGroupIcon,
  RssIcon,
  ComputerDesktopIcon,
  ServerStackIcon,
  ChartBarIcon,
  // GlobeAltIcon as AzureApplicationGatewayIcon, // Reutilizando para App Gateway
  // ShieldCheckIcon as AzureFirewallIcon // Reutilizando para Firewall
} from '@heroicons/react/24/outline';
import BaseResourceNode from './BaseResourceNode';
import NodeGroup from './NodeGroup';
import NoteNode from './NoteNode';
import TextNode from './TextNode';
import AreaNode from './AreaNode';
import ResizableNode from './ResizableNode';

// --- AWS Node Implementations ---
export function EC2Node(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <ServerIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'EC2 Instance', resourceType: 'aws_ec2_instance' }}
    />
  );
}
EC2Node.displayName = 'EC2Node';

export function S3BucketNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CloudIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'S3 Bucket', resourceType: 'aws_s3_bucket' }}
    />
  );
}
S3BucketNode.displayName = 'S3BucketNode';

export function LambdaFunctionNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CodeBracketIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'Lambda Function', resourceType: 'aws_lambda_function' }}
    />
  );
}
LambdaFunctionNode.displayName = 'LambdaFunctionNode';

export function RDSInstanceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CircleStackIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'RDS Instance', resourceType: 'aws_rds_instance' }}
    />
  );
}
RDSInstanceNode.displayName = 'RDSInstanceNode';

export function ApplicationLoadBalancerNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <LoadBalancerIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ALB', resourceType: 'aws_elbv2_load_balancer' }}
    />
  );
}
ApplicationLoadBalancerNode.displayName = 'ApplicationLoadBalancerNode';

export function AutoScalingGroupNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <RectangleStackIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ASG', resourceType: 'aws_autoscaling_group' }}
    />
  );
}
AutoScalingGroupNode.displayName = 'AutoScalingGroupNode';

export function ElasticBeanstalkEnvironmentNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CloudIcon className="w-6 h-6 text-green-600" />, label: props.data.label || 'EB Env', resourceType: 'aws_elasticbeanstalk_environment' }}
    />
  );
}
ElasticBeanstalkEnvironmentNode.displayName = 'ElasticBeanstalkEnvironmentNode';

export function ECSServiceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CpuChipIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ECS Service', resourceType: 'aws_ecs_service' }}
    />
  );
}
ECSServiceNode.displayName = 'ECSServiceNode';

export function EKSClusterNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CpuChipIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'EKS Cluster', resourceType: 'aws_eks_cluster' }}
    />
  );
}
EKSClusterNode.displayName = 'EKSClusterNode';

export function DynamoDBTableNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <TableCellsIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'DynamoDB Table', resourceType: 'aws_dynamodb_table' }}
    />
  );
}
DynamoDBTableNode.displayName = 'DynamoDBTableNode';

export function ElastiCacheClusterNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <BoltIcon className="w-6 h-6 text-orange-600" />, label: props.data.label || 'ElastiCache Cluster', resourceType: 'aws_elasticache_cluster' }}
    />
  );
}
ElastiCacheClusterNode.displayName = 'ElastiCacheClusterNode';

export function RedshiftClusterNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <CircleStackIcon className="w-6 h-6 text-red-600" />, label: props.data.label || 'Redshift Cluster', resourceType: 'aws_redshift_cluster' }}
    />
  );
}
RedshiftClusterNode.displayName = 'RedshiftClusterNode';

export function EFSFileSystemNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <FolderIcon className="w-6 h-6 text-green-600" />, label: props.data.label || 'EFS File System', resourceType: 'aws_efs_file_system' }}
    />
  );
}
EFSFileSystemNode.displayName = 'EFSFileSystemNode';

export function ApiGatewayRestApiNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <ApiGatewayIcon className="w-6 h-6 text-yellow-500" />, label: props.data.label || 'API Gateway REST', resourceType: 'aws_api_gateway_rest_api' }}
    />
  );
}
ApiGatewayRestApiNode.displayName = 'ApiGatewayRestApiNode';

export function SqsQueueNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <SqsQueueIcon className="w-6 h-6 text-purple-500" />, label: props.data.label || 'SQS Queue', resourceType: 'aws_sqs_queue' }}
    />
  );
}
SqsQueueNode.displayName = 'SqsQueueNode';

export function SnsTopicNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <SnsTopicIcon className="w-6 h-6 text-cyan-500" />, label: props.data.label || 'SNS Topic', resourceType: 'aws_sns_topic' }}
    />
  );
}
SnsTopicNode.displayName = 'SnsTopicNode';

export function EventBridgeRuleNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <EventBridgeRuleIcon className="w-6 h-6 text-orange-700" />, label: props.data.label || 'EventBridge Rule', resourceType: 'aws_cloudwatch_event_rule' }}
    />
  );
}
EventBridgeRuleNode.displayName = 'EventBridgeRuleNode';

export function SfnStateMachineNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'aws', icon: <SfnStateMachineIcon className="w-6 h-6 text-teal-600" />, label: props.data.label || 'State Machine', resourceType: 'aws_sfn_state_machine' }}
    />
  );
}
SfnStateMachineNode.displayName = 'SfnStateMachineNode';

// --- GCP Node Implementations ---
export function GcpCloudTasksQueueNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GcpCloudTasksQueueIcon className="w-6 h-6 text-green-600" />, label: props.data.label || 'Cloud Tasks Queue', resourceType: 'gcp_cloud_tasks_queue' }}
    />
  );
}
GcpCloudTasksQueueNode.displayName = 'GcpCloudTasksQueueNode';

export function GcpWorkflowsWorkflowNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GcpWorkflowsWorkflowIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Workflow', resourceType: 'gcp_workflows_workflow' }}
    />
  );
}
GcpWorkflowsWorkflowNode.displayName = 'GcpWorkflowsWorkflowNode';

export function GcpEventarcTriggerNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GcpEventarcTriggerIcon className="w-6 h-6 text-red-500" />, label: props.data.label || 'Eventarc Trigger', resourceType: 'gcp_eventarc_trigger' }}
    />
  );
}
GcpEventarcTriggerNode.displayName = 'GcpEventarcTriggerNode';

export function ComputeEngineNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ServerIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Compute Engine', resourceType: 'gcp_compute_instance' }}
    />
  );
}
ComputeEngineNode.displayName = 'ComputeEngineNode';

export function AppEngineNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CloudIcon className="w-6 h-6 text-purple-500" />, label: props.data.label || 'App Engine', resourceType: 'gcp_appengine_app' }}
    />
  );
}
AppEngineNode.displayName = 'AppEngineNode';

export function GKENode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CpuChipIcon className="w-6 h-6 text-blue-700" />, label: props.data.label || 'GKE Cluster', resourceType: 'gcp_gke_cluster' }}
    />
  );
}
GKENode.displayName = 'GKENode';

export function CloudRunNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CodeBracketIcon className="w-6 h-6 text-green-500" />, label: props.data.label || 'Cloud Run', resourceType: 'gcp_cloudrun_service' }}
    />
  );
}
CloudRunNode.displayName = 'CloudRunNode';

export function CloudStorageNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CloudIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Cloud Storage', resourceType: 'gcp_cloud_storage_bucket' }}
    />
  );
}
CloudStorageNode.displayName = 'CloudStorageNode';

export function CloudFunctionsNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CodeBracketIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Cloud Functions', resourceType: 'gcp_cloudfunctions_function' }}
    />
  );
}
CloudFunctionsNode.displayName = 'CloudFunctionsNode';

export function CloudSQLNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <CircleStackIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Cloud SQL', resourceType: 'gcp_sql_instance' }}
    />
  );
}
CloudSQLNode.displayName = 'CloudSQLNode';

export function InstanceGroupManagerNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ServerIcon className="w-6 h-6 text-blue-400" />, label: props.data.label || 'Instance Group', resourceType: 'gcp_compute_instance_group_manager' }}
    />
  );
}
InstanceGroupManagerNode.displayName = 'InstanceGroupManagerNode';

export function ComputeDiskNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ArchiveBoxIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Compute Disk', resourceType: 'gcp_compute_disk' }}
    />
  );
}
ComputeDiskNode.displayName = 'ComputeDiskNode';

export function ComputeNetworkNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GlobeAltIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'VPC Network', resourceType: 'gcp_compute_network' }}
    />
  );
}
ComputeNetworkNode.displayName = 'ComputeNetworkNode';

export function ComputeFirewallNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ShieldCheckIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Firewall Rule', resourceType: 'gcp_compute_firewall' }}
    />
  );
}
ComputeFirewallNode.displayName = 'ComputeFirewallNode';

export function ComputeLoadBalancerNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ArrowsRightLeftIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Load Balancer', resourceType: 'gcp_compute_load_balancer' }}
    />
  );
}
ComputeLoadBalancerNode.displayName = 'ComputeLoadBalancerNode';

export function ComputeInstanceTemplateNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <RectangleStackIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Instance Template', resourceType: 'gcp_compute_instance_template' }}
    />
  );
}
ComputeInstanceTemplateNode.displayName = 'ComputeInstanceTemplateNode';

export function BigQueryDatasetNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <TableCellsIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'BigQuery Dataset', resourceType: 'gcp_bigquery_dataset' }}
    />
  );
}
BigQueryDatasetNode.displayName = 'BigQueryDatasetNode';

export function FirestoreDatabaseNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <FirestoreIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Firestore Database', resourceType: 'gcp_firestore_database' }}
    />
  );
}
FirestoreDatabaseNode.displayName = 'FirestoreDatabaseNode';

export function MemorystoreInstanceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <BoltIcon className="w-6 h-6 text-red-500" />, label: props.data.label || 'Memorystore Instance', resourceType: 'gcp_memorystore_instance' }}
    />
  );
}
MemorystoreInstanceNode.displayName = 'MemorystoreInstanceNode';

export function FilestoreInstanceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <FilestoreIcon className="w-6 h-6 text-teal-500" />, label: props.data.label || 'Filestore Instance', resourceType: 'gcp_filestore_instance' }}
    />
  );
}
FilestoreInstanceNode.displayName = 'FilestoreInstanceNode';

// --- Generic Node ---
export function GcpApiGatewayNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <GlobeAltIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'API Gateway', resourceType: 'gcp_api_gateway' }}
    />
  );
}
GcpApiGatewayNode.displayName = 'GcpApiGatewayNode';

export function GcpPubSubTopicNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'gcp', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-purple-600" />, label: props.data.label || 'Pub/Sub Topic', resourceType: 'gcp_pubsub_topic' }}
    />
  );
}
GcpPubSubTopicNode.displayName = 'GcpPubSubTopicNode';

export function GenericNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'generic', icon: <CpuChipIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />, label: props.data.label || 'Generic', resourceType: 'generic' }}
    />
  );
}
GenericNode.displayName = 'GenericNode';

// --- Azure Nodes ---
export function AzureVMNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <ServerIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure VM', resourceType: 'vm' }}
    />
  );
}
AzureVMNode.displayName = 'AzureVMNode';

export function AzureBlobNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <CloudIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure Blob Storage', resourceType: 'blob' }}
    />
  );
}
AzureBlobNode.displayName = 'AzureBlobNode';

export function AzureCosmosNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <CircleStackIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure Cosmos DB', resourceType: 'cosmos' }}
    />
  );
}
AzureCosmosNode.displayName = 'AzureCosmosNode';

export function AzureFunctionNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <CodeBracketIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure Function', resourceType: 'function' }}
    />
  );
}
AzureFunctionNode.displayName = 'AzureFunctionNode';

export function AzureVirtualMachineNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureVirtualMachineIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Azure VM', resourceType: 'azurerm_virtual_machine' }}
    />
  );
}
AzureVirtualMachineNode.displayName = 'AzureVirtualMachineNode';

export function AzureLinuxVmssNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLinuxVmssIcon className="w-6 h-6 text-blue-600" />, label: props.data.label || 'Linux VMSS', resourceType: 'azurerm_linux_virtual_machine_scale_set' }}
    />
  );
}
AzureLinuxVmssNode.displayName = 'AzureLinuxVmssNode';

export function AzureAKSClusterNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureAKSClusterIcon className="w-6 h-6 text-blue-700" />, label: props.data.label || 'AKS Cluster', resourceType: 'azurerm_kubernetes_cluster' }}
    />
  );
}
AzureAKSClusterNode.displayName = 'AzureAKSClusterNode';

export function AzureLinuxWebAppNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLinuxWebAppIcon className="w-6 h-6 text-sky-600" />, label: props.data.label || 'Linux Web App', resourceType: 'azurerm_linux_web_app' }}
    />
  );
}
AzureLinuxWebAppNode.displayName = 'AzureLinuxWebAppNode';

export function AzureContainerGroupNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureContainerGroupIcon className="w-6 h-6 text-teal-500" />, label: props.data.label || 'Container Group', resourceType: 'azurerm_container_group' }}
    />
  );
}
AzureContainerGroupNode.displayName = 'AzureContainerGroupNode';

export function AzureLinuxFunctionAppNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLinuxFunctionAppIcon className="w-6 h-6 text-yellow-500" />, label: props.data.label || 'Linux Function App', resourceType: 'azurerm_linux_function_app' }}
    />
  );
}
AzureLinuxFunctionAppNode.displayName = 'AzureLinuxFunctionAppNode';

export function AzureStorageContainerNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureStorageContainerIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'Storage Container', resourceType: 'azurerm_storage_container' }}
    />
  );
}
AzureStorageContainerNode.displayName = 'AzureStorageContainerNode';

export function AzureCosmosDbAccountNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureCosmosDbAccountIcon className="w-6 h-6 text-emerald-500" />, label: props.data.label || 'Cosmos DB Account', resourceType: 'azurerm_cosmosdb_account' }}
    />
  );
}
AzureCosmosDbAccountNode.displayName = 'AzureCosmosDbAccountNode';

export function AzureMsSqlDatabaseNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureMsSqlDatabaseIcon className="w-6 h-6 text-sky-500" />, label: props.data.label || 'SQL Database', resourceType: 'azurerm_mssql_database' }}
    />
  );
}
AzureMsSqlDatabaseNode.displayName = 'AzureMsSqlDatabaseNode';

export function AzureRedisCacheNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureRedisCacheIcon className="w-6 h-6 text-red-500" />, label: props.data.label || 'Redis Cache', resourceType: 'azurerm_redis_cache' }}
    />
  );
}
AzureRedisCacheNode.displayName = 'AzureRedisCacheNode';

export function AzureSynapseWorkspaceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureSynapseWorkspaceIcon className="w-6 h-6 text-purple-600" />, label: props.data.label || 'Synapse Workspace', resourceType: 'azurerm_synapse_workspace' }}
    />
  );
}
AzureSynapseWorkspaceNode.displayName = 'AzureSynapseWorkspaceNode';

export function AzureStorageShareNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureStorageShareIcon className="w-6 h-6 text-blue-500" />, label: props.data.label || 'File Share', resourceType: 'azurerm_storage_share' }}
    />
  );
}
AzureStorageShareNode.displayName = 'AzureStorageShareNode';

export function AzureApiManagementServiceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureApiManagementServiceIcon className="w-6 h-6 text-teal-600" />, label: props.data.label || 'API Management', resourceType: 'azurerm_api_management' }}
    />
  );
}
AzureApiManagementServiceNode.displayName = 'AzureApiManagementServiceNode';

export function AzureServiceBusNamespaceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureServiceBusNamespaceIcon className="w-6 h-6 text-purple-700" />, label: props.data.label || 'Service Bus Namespace', resourceType: 'azurerm_servicebus_namespace' }}
    />
  );
}
AzureServiceBusNamespaceNode.displayName = 'AzureServiceBusNamespaceNode';

export function AzureEventGridTopicNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureEventGridTopicIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Event Grid Topic', resourceType: 'azurerm_eventgrid_topic' }}
    />
  );
}
AzureEventGridTopicNode.displayName = 'AzureEventGridTopicNode';

export function AzureLogicAppWorkflowNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureLogicAppWorkflowIcon className="w-6 h-6 text-cyan-600" />, label: props.data.label || 'Logic App Workflow', resourceType: 'azurerm_logic_app_workflow' }}
    />
  );
}
AzureLogicAppWorkflowNode.displayName = 'AzureLogicAppWorkflowNode';

export function AzureEventHubNamespaceNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureEventHubNamespaceIcon className="w-6 h-6 text-emerald-600" />, label: props.data.label || 'Event Hubs Namespace', resourceType: 'azurerm_eventhub_namespace' }}
    />
  );
}
AzureEventHubNamespaceNode.displayName = 'AzureEventHubNamespaceNode';

export function AzureVirtualNetworkNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureVirtualNetworkIcon className="w-6 h-6 text-indigo-600" />, label: props.data.label || 'Virtual Network', resourceType: 'azurerm_virtual_network' }}
    />
  );
}
AzureVirtualNetworkNode.displayName = 'AzureVirtualNetworkNode';

export function AzureSubnetNode(props: any) { 
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <RectangleStackIcon className="w-6 h-6 text-sky-600" />, label: props.data.label || 'Subnet', resourceType: 'azurerm_subnet' }}
    />
  );
}
AzureSubnetNode.displayName = 'AzureSubnetNode';

export function AzureNetworkSecurityGroupNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <AzureNetworkSecurityGroupIcon className="w-6 h-6 text-teal-600" />, label: props.data.label || 'NSG', resourceType: 'azurerm_network_security_group' }}
    />
  );
}
AzureNetworkSecurityGroupNode.displayName = 'AzureNetworkSecurityGroupNode';

export function AzureLoadBalancerNode(props: any) {
  return (
    <BaseResourceNode
      {...props}
      data={{ ...props.data, provider: 'azure', icon: <LoadBalancerIcon className="w-6 h-6 text-orange-500" />, label: props.data.label || 'Load Balancer', resourceType: 'azurerm_lb' }}
    />
  );
}
AzureLoadBalancerNode.displayName = 'AzureLoadBalancerNode';

export function AzureApplicationGatewayNode(props: any) {
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

  gcp_api_gateway: GcpApiGatewayNode,
  gcp_pubsub_topic: GcpPubSubTopicNode,
  
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
  group: NodeGroup,
  
  // Note and Text nodes
  noteNode: NoteNode,
  textNode: TextNode,
  
  // Area node
  areaNode: AreaNode,

  // Resizable node
  resizableNode: ResizableNode,
};

export default nodeTypes;
