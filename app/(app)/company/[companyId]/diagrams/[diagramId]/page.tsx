"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition, JSX, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import './page.css';
import { Button, Select, Modal, Input, Spin, message, Timeline, Drawer, Empty } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined, ArrowUpOutlined, DeleteOutlined, HistoryOutlined, RollbackOutlined, BranchesOutlined, FolderOutlined, FolderOpenOutlined, FileOutlined, ClearOutlined } from '@ant-design/icons';
import { 
  ExclamationTriangleIcon, 
  KeyIcon,
  GlobeAltIcon, 
  RectangleStackIcon, 
  ShieldCheckIcon, 
  ArrowsRightLeftIcon, 
  ServerIcon, 
  CloudIcon,
  CircleStackIcon,
  CpuChipIcon,
  CodeBracketIcon,
  ArchiveBoxIcon,
  TableCellsIcon,
  BoltIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  ListBulletIcon,
  RectangleGroupIcon,
  RssIcon,
  ComputerDesktopIcon,
  ServerStackIcon,
  CubeIcon,
  ChartBarIcon as SolidChartBarIconHero, 
  FolderIcon as FolderIconOutline, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon'; 
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  type Node as ReactFlowNode, 
  type Edge as ReactFlowEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Viewport as ReactFlowViewport
} from 'reactflow';

// Componentes
import FlowEditor from '../../../../../components/flow/FlowEditor'; 
import EnvironmentTreeSelect from '../../../../../components/ui/EnvironmentTreeSelect'; 
import EnvironmentCategorySelect from '../../../../../components/ui/EnvironmentCategorySelect'; 
import DiagramTreeSelect from '../../../../../components/ui/DiagramTreeSelect'; 
import CompanySidebar from '../../../../../components/ui/CompanySidebar'; 
import CredentialsPage from '../../../../../components/ui/CredentialsPage'; 
import DeploymentsPage from '../../../../../components/ui/DeploymentsPage'; 
import SettingsPage from '../../../../../components/ui/SettingsPage'; 
import TeamPage from '../../../../../components/ui/TeamPage'; 
// EdgeTypeToolbox no se importa aquí

// Servicios
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram, createEnvironment, updateDiagram, deleteDiagram, deleteEnvironment } from '../../../../../services/diagramService';
import { isAuthenticated } from '../../../../../services/authService';

// Tipos y utilidades
import nodeTypes from '../../../../../components/nodes/NodeTypes'; 
import { Node, Edge } from '../../../../../services/diagramService'; 
import { SelectedEdgeTypeProvider } from '../../../../../contexts/SelectedEdgeTypeContext'; // Importar el Provider

const { TextArea } = Input;

const environmentCache = new Map<string, Environment[]>();
const diagramCache = new Map<string, Diagram[]>();
const singleDiagramCache = new Map<string, Diagram>();

interface ResourceItem {
  type: string;
  name: string;
  description: string;
  icon?: JSX.Element; 
  provider: 'aws' | 'gcp' | 'generic' | 'azure';
}

interface ResourceCategory {
  name: string;
  provider: 'aws' | 'gcp' | 'generic' | 'azure';
  items: ResourceItem[];
}

const resourceCategories: ResourceCategory[] = [
  {
    name: 'AWS - Almacenamiento',
    provider: 'aws',
    items: [
      { type: 'aws_s3_bucket', name: 'S3 Bucket', description: 'Almacenamiento de objetos', provider: 'aws', icon: <CloudIcon /> },
      { type: 'aws_rds_instance', name: 'RDS Instance', description: 'Base de datos relacional gestionada', provider: 'aws', icon: <CircleStackIcon /> },
      { type: 'aws_dynamodb_table', name: 'DynamoDB Table', description: 'Base de datos NoSQL Key-Value y Documento', provider: 'aws', icon: <TableCellsIcon /> },
      { type: 'aws_elasticache_cluster', name: 'ElastiCache Cluster', description: 'Caché en memoria (Redis/Memcached)', provider: 'aws', icon: <BoltIcon /> },
      { type: 'aws_redshift_cluster', name: 'Redshift Cluster', description: 'Almacén de datos (Data Warehouse)', provider: 'aws', icon: <CircleStackIcon /> },
      { type: 'aws_efs_file_system', name: 'EFS File System', description: 'Sistema de archivos elástico', provider: 'aws', icon: <FolderIconOutline /> },
    ]
  },
  {
    name: 'AWS - Aplicación',
    provider: 'aws',
    items: [
      { type: 'aws_lambda_function', name: 'Lambda Function', description: 'Ejecuta código sin aprovisionar servidores', provider: 'aws', icon: <CodeBracketIcon /> },
      { type: 'aws_api_gateway_rest_api', name: 'API Gateway (REST)', description: 'API REST/WebSocket', provider: 'aws', icon: <GlobeAltIcon /> },
      { type: 'aws_sqs_queue', name: 'SQS Queue', description: 'Cola de mensajes', provider: 'aws', icon: <RectangleStackIcon /> },
      { type: 'aws_sns_topic', name: 'SNS Topic', description: 'Notificaciones push', provider: 'aws', icon: <ChatBubbleOvalLeftEllipsisIcon /> },
      { type: 'aws_cloudwatch_event_rule', name: 'EventBridge Rule', description: 'Orquestación de eventos', provider: 'aws', icon: <CalendarDaysIcon /> },
      { type: 'aws_sfn_state_machine', name: 'Step Functions State Machine', description: 'Flujos de trabajo serverless', provider: 'aws', icon: <AdjustmentsHorizontalIcon /> },
    ]
  },
  {
    name: 'AWS - Cómputo',
    provider: 'aws',
    items: [
      { type: 'aws_instance', name: 'EC2 Instance', description: 'Máquina Virtual', provider: 'aws', icon: <ServerIcon /> },
      { type: 'aws_autoscaling_group', name: 'Auto Scaling Group', description: 'Grupo de Autoescalado', provider: 'aws', icon: <ServerStackIcon /> },
      { type: 'aws_ecs_service', name: 'ECS Service', description: 'Servicio de Contenedores ECS', provider: 'aws', icon: <CubeIcon /> },
      { type: 'aws_eks_cluster', name: 'EKS Cluster', description: 'Cluster de Kubernetes Gestionado', provider: 'aws', icon: <CpuChipIcon /> },
      { type: 'aws_elasticbeanstalk_environment', name: 'Elastic Beanstalk Env', description: 'Entorno de Elastic Beanstalk', provider: 'aws', icon: <CloudIcon /> },
    ]
  },
  {
    name: 'AWS - Redes',
    provider: 'aws',
    items: [
      { type: 'aws_lb', name: 'Load Balancer (ALB/NLB)', description: 'Balanceador de Carga de Aplicación/Red', provider: 'aws', icon: <ArrowsRightLeftIcon /> },
    ]
  },
  {
    name: 'Azure - Cómputo',
    provider: 'azure',
    items: [
      { type: 'azurerm_virtual_machine', name: 'Virtual Machine', description: 'Máquina virtual', provider: 'azure', icon: <ComputerDesktopIcon /> },
      { type: 'azurerm_linux_virtual_machine_scale_set', name: 'Linux VM Scale Set', description: 'Conjunto de escalado Linux', provider: 'azure', icon: <ServerStackIcon /> },
      { type: 'azurerm_kubernetes_cluster', name: 'AKS Cluster', description: 'Cluster de Kubernetes Gestionado', provider: 'azure', icon: <CpuChipIcon /> },
      { type: 'azurerm_linux_web_app', name: 'App Service (Linux)', description: 'Aplicación web PaaS en Linux', provider: 'azure', icon: <GlobeAltIcon /> },
      { type: 'azurerm_container_group', name: 'Container Instances', description: 'Grupo de Contenedores', provider: 'azure', icon: <CubeIcon /> },
      { type: 'azurerm_linux_function_app', name: 'Function App (Linux)', description: 'Funciones serverless en Linux', provider: 'azure', icon: <BoltIcon /> },
    ]
  },
  {
    name: 'Azure - Almacenamiento',
    provider: 'azure',
    items: [
      { type: 'azurerm_storage_container', name: 'Storage Container (Blob)', description: 'Contenedor de Blob Storage', provider: 'azure', icon: <ArchiveBoxIcon /> },
      { type: 'azurerm_cosmosdb_account', name: 'Cosmos DB Account', description: 'Cuenta de Azure Cosmos DB (NoSQL)', provider: 'azure', icon: <CircleStackIcon /> },
      { type: 'azurerm_mssql_database', name: 'SQL Database', description: 'Base de datos SQL de Azure', provider: 'azure', icon: <CircleStackIcon /> },
      { type: 'azurerm_storage_share', name: 'File Share', description: 'Recurso compartido de Azure Files', provider: 'azure', icon: <FolderIconOutline /> },
    ]
  },
  {
    name: 'Azure - Analytics',
    provider: 'azure',
    items: [
      { type: 'azurerm_synapse_workspace', name: 'Synapse Workspace', description: 'Espacio de trabajo de Azure Synapse Analytics', provider: 'azure', icon: <SolidChartBarIconHero /> },
    ]
  },
  {
    name: 'Azure - Caché',
    provider: 'azure',
    items: [
      { type: 'azurerm_redis_cache', name: 'Cache for Redis', description: 'Caché en memoria Redis', provider: 'azure', icon: <BoltIcon /> },
    ]
  },
  {
    name: 'Azure - Aplicación',
    provider: 'azure',
    items: [
      { type: 'azurerm_linux_function_app', name: 'Function App (Linux)', description: 'Funciones serverless en Linux', provider: 'azure', icon: <BoltIcon /> }, 
      { type: 'azurerm_api_management', name: 'API Management Service', description: 'Servicio de gestión de APIs', provider: 'azure', icon: <GlobeAltIcon /> },
      { type: 'azurerm_servicebus_namespace', name: 'Service Bus Namespace', description: 'Namespace para mensajería de Service Bus', provider: 'azure', icon: <ChatBubbleOvalLeftEllipsisIcon /> },
      { type: 'azurerm_eventgrid_topic', name: 'Event Grid Topic', description: 'Tema de Azure Event Grid', provider: 'azure', icon: <RssIcon /> },
      { type: 'azurerm_logic_app_workflow', name: 'Logic App Workflow', description: 'Flujo de trabajo de Logic Apps (Consumo)', provider: 'azure', icon: <RectangleGroupIcon /> },
      { type: 'azurerm_eventhub_namespace', name: 'Event Hubs Namespace', description: 'Namespace para streaming de eventos', provider: 'azure', icon: <BoltIcon /> },
    ]
  },
  {
    name: 'Azure - Redes',
    provider: 'azure',
    items: [
      { type: 'azurerm_virtual_network', name: 'Virtual Network', description: 'Red virtual privada', provider: 'azure', icon: <GlobeAltIcon /> },
      { type: 'azurerm_subnet', name: 'Subnet', description: 'Subred dentro de una VNet', provider: 'azure', icon: <RectangleStackIcon /> },
      { type: 'azurerm_network_security_group', name: 'Network Security Group', description: 'Reglas de seguridad de red', provider: 'azure', icon: <ShieldCheckIcon /> },
      { type: 'azurerm_lb', name: 'Load Balancer', description: 'Balanceador de carga L4', provider: 'azure', icon: <ArrowsRightLeftIcon /> },
      { type: 'azurerm_application_gateway', name: 'Application Gateway', description: 'Balanceador de carga L7', provider: 'azure', icon: <GlobeAltIcon /> },
      { type: 'azurerm_firewall', name: 'Firewall', description: 'Firewall de red gestionado', provider: 'azure', icon: <ShieldCheckIcon /> },
    ]
  },
  {
    name: 'GCP - Cómputo',
    provider: 'gcp',
    items: [
      { type: 'gcp_compute_instance', name: 'Compute Engine', description: 'Máquina virtual en la nube', provider: 'gcp', icon: <ServerIcon /> },
      { type: 'gcp_compute_disk', name: 'Compute Disk', description: 'Disco persistente para VMs', provider: 'gcp', icon: <ArchiveBoxIcon /> },
      { type: 'gcp_compute_instance_template', name: 'Instance Template', description: 'Plantilla para instancias de VM', provider: 'gcp', icon: <RectangleStackIcon /> },
      { type: 'gcp_compute_instance_group_manager', name: 'Instance Group', description: 'Grupo de instancias', provider: 'gcp', icon: <ServerStackIcon /> },
      { type: 'gcp_gke_cluster', name: 'GKE Cluster', description: 'Cluster de Kubernetes', provider: 'gcp', icon: <CpuChipIcon /> },
      { type: 'gcp_cloudrun_service', name: 'Cloud Run', description: 'Contenedores serverless', provider: 'gcp', icon: <CodeBracketIcon /> },
      { type: 'gcp_appengine_app', name: 'App Engine', description: 'Plataforma como servicio', provider: 'gcp', icon: <CloudIcon /> },
      { type: 'gcp_cloudfunctions_function', name: 'Cloud Functions', description: 'Funciones serverless (Cómputo)', provider: 'gcp', icon: <BoltIcon /> },
    ]
  },
  {
    name: 'GCP - Redes',
    provider: 'gcp',
    items: [
      { type: 'gcp_compute_network', name: 'VPC Network', description: 'Red Virtual Privada', provider: 'gcp', icon: <GlobeAltIcon /> },
      { type: 'gcp_compute_firewall', name: 'Firewall Rule', description: 'Regla de firewall VPC', provider: 'gcp', icon: <ShieldCheckIcon /> },
      { type: 'gcp_compute_load_balancer', name: 'Load Balancer', description: 'Balanceador de carga', provider: 'gcp', icon: <ArrowsRightLeftIcon /> },
    ]
  },
  {
    name: 'GCP - Almacenamiento',
    provider: 'gcp',
    items: [
      { type: 'gcp_cloud_storage_bucket', name: 'Cloud Storage Bucket', description: 'Almacenamiento de objetos', provider: 'gcp', icon: <CloudIcon /> },
      { type: 'gcp_sql_instance', name: 'Cloud SQL Instance', description: 'Base de datos MySQL, PostgreSQL, SQL Server', provider: 'gcp', icon: <CircleStackIcon /> },
      { type: 'gcp_bigquery_dataset', name: 'BigQuery Dataset', description: 'Conjunto de datos de BigQuery', provider: 'gcp', icon: <TableCellsIcon /> },
      { type: 'gcp_firestore_database', name: 'Firestore Database', description: 'Base de datos NoSQL en modo Nativo o Datastore', provider: 'gcp', icon: <DocumentTextIcon /> }, 
      { type: 'gcp_memorystore_instance', name: 'Memorystore Instance', description: 'Servicio de caché Redis o Memcached', provider: 'gcp', icon: <BoltIcon /> },
      { type: 'gcp_filestore_instance', name: 'Filestore Instance', description: 'Almacenamiento de archivos NFS gestionado', provider: 'gcp', icon: <FolderIconOutline /> },
    ]
  },
  {
    name: 'GCP - Aplicación',
    provider: 'gcp',
    items: [
      { type: 'gcp_cloudfunctions_function', name: 'Cloud Functions', description: 'Función serverless (Aplicación)', provider: 'gcp', icon: <BoltIcon /> }, 
      { type: 'gcp_api_gateway', name: 'Cloud Endpoints', description: 'API Gateway', provider: 'gcp', icon: <GlobeAltIcon /> }, 
      { type: 'gcp_pubsub_topic', name: 'Pub/Sub', description: 'Mensajería', provider: 'gcp', icon: <ChatBubbleOvalLeftEllipsisIcon /> }, 
      { type: 'gcp_cloud_tasks_queue', name: 'Cloud Tasks Queue', description: 'Colas de tareas', provider: 'gcp', icon: <ListBulletIcon /> },
      { type: 'gcp_workflows_workflow', name: 'Workflows', description: 'Flujos de trabajo', provider: 'gcp', icon: <RectangleGroupIcon /> },
      { type: 'gcp_eventarc_trigger', name: 'Eventarc Trigger', description: 'Orquestación de eventos', provider: 'gcp', icon: <RssIcon /> },
    ]
  },
  {
    name: 'Grupos y Áreas',
    provider: 'generic',
    items: [
      { type: 'group', name: 'Grupo', description: 'Agrupar varios elementos', provider: 'generic', icon: <RectangleGroupIcon /> },
      { type: 'areaNode', name: 'Área', description: 'Definir un área visual', provider: 'generic', icon: <CubeIcon /> },
      { type: 'group', name: 'Subsistema', description: 'Agrupar componentes relacionados', provider: 'generic', icon: <ServerStackIcon /> },
    ]
  }
];

export default function DiagramPage() {
  const params = useParams();
  const router = useRouter();
  const { companyId, diagramId } = params;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(diagramId as string);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();
  
  const [previousDiagram, setPreviousDiagram] = useState<Diagram | null>(null);
  
  type SectionKeys = 'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team';
  const [activeSection, setActiveSection] = useState<SectionKeys>('diagrams');
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  const [newEnvironmentModalVisible, setNewEnvironmentModalVisible] = useState<boolean>(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState<string>('');
  const [newEnvironmentDescription, setNewEnvironmentDescription] = useState<string>('');
  const [newEnvironmentCategory, setNewEnvironmentCategory] = useState<string>('desarrollo');

  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  const [newDiagramDescription, setNewDiagramDescription] = useState<string>('');
  const [newDiagramPath, setNewDiagramPath] = useState<string>('');

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);
  const [diagramToDelete, setDiagramToDelete] = useState<Diagram | null>(null);

  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const stableDataRef = useRef<{
    diagram: Diagram | null;
    nodes: Node[];
    edges: Edge[];
  }>({
    diagram: null,
    nodes: [],
    edges: []
  });

  const convertToReactFlowNodes = (customNodes: Node[]): ReactFlowNode[] => {
    return customNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: { ...node.data, provider: node.data?.provider || 'generic' },
      width: node.width || null,
      height: node.height || null,
      selected: node.selected || false,
      positionAbsolute: node.positionAbsolute,
      dragging: node.dragging || false,
      parentNode: node.parentNode,
      style: { ...node.style, border: '2px solid transparent', borderRadius: '4px' },
      className: undefined, sourcePosition: undefined, targetPosition: undefined,
      hidden: false, draggable: true, selectable: true, connectable: true, deletable: true,
      zIndex: 0, extent: undefined, expandParent: false, ariaLabel: undefined, focusable: true, resizing: false
    }));
  };

  const convertToReactFlowEdges = (customEdges: Edge[]): ReactFlowEdge[] => {
    return customEdges.map(edge => ({
      id: edge.id, source: edge.source, target: edge.target, type: edge.type,
      animated: edge.animated || false, label: edge.label, data: edge.data, style: edge.style,
      selected: edge.selected || false, sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle,
      className: undefined, hidden: false, deletable: true, focusable: true, updatable: true, zIndex: 0
    }));
  };

  const convertToCustomNodes = (reactFlowNodes: ReactFlowNode[]): Node[] => {
    return reactFlowNodes.map(node => ({
      id: node.id, type: node.type || 'default', position: node.position, data: node.data,
      width: node.width || undefined, height: node.height || undefined, selected: node.selected || false,
      positionAbsolute: node.positionAbsolute, dragging: node.dragging || false,
      parentNode: node.parentNode, style: node.style
    }));
  };

  const convertToCustomEdges = (reactFlowEdges: ReactFlowEdge[]): Edge[] => {
    return reactFlowEdges.map(edge => ({
      id: edge.id, source: edge.source, target: edge.target, type: edge.type,
      animated: edge.animated || false, label: typeof edge.label === 'string' ? edge.label : undefined,
      data: edge.data, style: edge.style, selected: edge.selected || false,
      sourceHandle: edge.sourceHandle || undefined, targetHandle: edge.targetHandle || undefined
    }));
  };

  const initialNodesForFlowEditor = useMemo(() => {
    return currentDiagram?.nodes ? convertToReactFlowNodes(currentDiagram.nodes) : [];
  }, [currentDiagram?.nodes]);

  const initialEdgesForFlowEditor = useMemo(() => {
    return currentDiagram?.edges ? convertToReactFlowEdges(currentDiagram.edges) : [];
  }, [currentDiagram?.edges]);

  const onSaveDiagramCallback = useCallback((diagramData: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[]; viewport?: ReactFlowViewport }) => { 
    if (isUpdatingRef.current) return;
    if (!companyId || !selectedEnvironment || !selectedDiagram || !currentDiagram) return;
    const customNodes = convertToCustomNodes(diagramData.nodes);
    const customEdges = convertToCustomEdges(diagramData.edges);
    const flowData = { nodes: customNodes, edges: customEdges, viewport: diagramData.viewport || { x: 0, y: 0, zoom: 1 } };
    const groupNodes = diagramData.nodes.filter((node: ReactFlowNode) => node.type === 'group'); 
    const nodeGroups: Record<string, any> = {}; 
    const nodePositions: Record<string, any> = {};
    groupNodes.forEach((groupNode: ReactFlowNode) => {
      const childNodes = flowData.nodes.filter(node => node.parentNode === groupNode.id); 
      nodeGroups[groupNode.id] = { 
        nodeIds: childNodes.map(node => node.id), 
        dimensions: { width: typeof groupNode.style?.width === 'number' ? groupNode.style.width : 300, height: typeof groupNode.style?.height === 'number' ? groupNode.style.height : 200 }, 
        provider: groupNode.data?.provider || 'generic', label: groupNode.data?.label || 'Group' 
      };
      nodePositions[groupNode.id] = {};
      childNodes.forEach(childNode => { 
        nodePositions[groupNode.id][childNode.id] = { 
          relativePosition: { ...childNode.position }, 
          dimensions: { width: childNode.width || 100, height: childNode.height || 50 } 
        };
      });
    });
    updateDiagram(companyId as string, selectedEnvironment as string, selectedDiagram as string, { name: currentDiagram.name, description: currentDiagram.description, nodes: customNodes, edges: customEdges, viewport: flowData.viewport, nodeGroups, nodePositions })
      .then(() => message.success("Diagrama actualizado exitosamente."))
      .catch(() => message.error("No se pudo guardar el diagrama."));
  }, [companyId, selectedEnvironment, selectedDiagram, currentDiagram]);

  const prevUrlRef = useRef({ envId: '', diagramId: '' });
  const isUpdatingRef = useRef(false);
  
  const updateUrlWithNames = (environmentId: string, diagramId: string, envName: string, diagramName: string) => {
    const sanitizedEnvName = envName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const sanitizedDiagramName = diagramName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const urlParams = new URLSearchParams(window.location.search);
    const currentEnvId = urlParams.get('environmentId');
    const currentDiagramId = params.diagramId as string;
    if ((currentEnvId !== environmentId || currentDiagramId !== diagramId) && (prevUrlRef.current.envId !== environmentId || prevUrlRef.current.diagramId !== diagramId)) {
      prevUrlRef.current = { envId: environmentId, diagramId };
      router.replace(`/company/${companyId}/diagrams/${diagramId}?environmentId=${environmentId}&env=${sanitizedEnvName}&diagram=${sanitizedDiagramName}`, { scroll: false });
    }
  };

  const batchStateUpdates = useCallback((newDiagramToSet: Diagram | null) => {
    if (!isMounted.current || isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    try {
      stableDataRef.current.diagram = newDiagramToSet;
      setCurrentDiagram(prevCurrentDiagram => {
        if (newDiagramToSet !== undefined) { 
          setPreviousDiagram(prevCurrentDiagram);
          return newDiagramToSet;
        }
        return prevCurrentDiagram; 
      });
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);

  const MIN_LOADING_DURATION = 300;
  
  const handleEnvironmentChange = async (environmentId: string) => {
    if (currentDiagram) setPreviousDiagram(currentDiagram);
    const startTime = Date.now();
    setLoading(true);
    setSelectedEnvironment(environmentId);
    try {
      const selectedEnv = environments.find(env => env.id === environmentId);
      if (!selectedEnv) throw new Error('Ambiente no encontrado');
      const diagramsCacheKey = `diagrams-${companyId}-${environmentId}`;
      let diagramsData: Diagram[] = diagramCache.has(diagramsCacheKey) ? (diagramCache.get(diagramsCacheKey) || []) : await getDiagramsByEnvironment(companyId as string, environmentId);
      if (!diagramCache.has(diagramsCacheKey)) diagramCache.set(diagramsCacheKey, diagramsData);
      startTransition(() => setDiagrams(diagramsData));
      if (diagramsData.length > 0) {
        const firstDiagram = diagramsData[0];
        setSelectedDiagram(firstDiagram.id);
        updateUrlWithNames(environmentId, firstDiagram.id, selectedEnv.name, firstDiagram.name);
        batchStateUpdates(firstDiagram); 
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => { if (isMounted.current) setLoading(false); }, Math.max(0, MIN_LOADING_DURATION - elapsedTime));
      } else {
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => { if (!isMounted.current) return; setSelectedDiagram(null); setCurrentDiagram(null); setLoading(false); }, Math.max(0, MIN_LOADING_DURATION - elapsedTime));
      }
    } catch { message.error("No se pudieron cargar los diagramas."); setLoading(false); }
  };

  const handleDiagramChange = async (diagramId: string) => {
    if (currentDiagram) setPreviousDiagram(currentDiagram);
    const startTime = Date.now();
    setLoading(true);
    setSelectedDiagram(diagramId);
    try {
      if (selectedEnvironment) {
        const selectedEnv = environments.find(env => env.id === selectedEnvironment);
        if (!selectedEnv) throw new Error('Ambiente no encontrado');
        const singleDiagramCacheKey = `diagram-${companyId}-${selectedEnvironment}-${diagramId}`;
        let diagramData: Diagram | null = singleDiagramCache.has(singleDiagramCacheKey) ? (singleDiagramCache.get(singleDiagramCacheKey) || null) : await getDiagram(companyId as string, selectedEnvironment, diagramId);
        if (!singleDiagramCache.has(singleDiagramCacheKey) && diagramData !== null) singleDiagramCache.set(singleDiagramCacheKey, diagramData);
        console.log("[DiagramPage] handleDiagramChange - Datos del diagrama recuperados:", JSON.stringify(diagramData, null, 2));
        if (!diagramData || !isMounted.current) { setLoading(false); return; }
        updateUrlWithNames(selectedEnvironment, diagramId, selectedEnv.name, diagramData.name);
        batchStateUpdates(diagramData); 
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => { if (isMounted.current) setLoading(false); }, Math.max(0, MIN_LOADING_DURATION - elapsedTime));
      } else { setLoading(false); }
    } catch (error) { message.error("No se pudo cargar el diagrama."); setLoading(false); }
  };

  const handleCreateEnvironment = async () => {
    if (!newEnvironmentName.trim()) { message.error("El nombre del ambiente es obligatorio"); return; }
    setLoading(true);
    try {
      await createEnvironment(companyId as string, { name: newEnvironmentName, description: newEnvironmentDescription, category: newEnvironmentCategory });
      message.success("Ambiente creado correctamente");
      const environmentsData = await getEnvironments(companyId as string);
      setEnvironments(environmentsData);
      const newEnv = environmentsData.find(env => env.name === newEnvironmentName);
      if (newEnv) { setSelectedEnvironment(newEnv.id); setDiagrams([]); setSelectedDiagram(null); setCurrentDiagram(null); }
      setNewEnvironmentModalVisible(false); setNewEnvironmentName(''); setNewEnvironmentDescription(''); setNewEnvironmentCategory('desarrollo');
    } catch (error) { message.error(error instanceof Error ? error.message : "No se pudo crear el ambiente."); }
    setLoading(false);
  };

  const handleDeleteEnvironment = async (environmentId: string) => {
    const environmentToDelete = environments.find(env => env.id === environmentId);
    Modal.confirm({
      title: 'Confirmar eliminación',
      content: `¿Estás seguro de que deseas eliminar ${environmentToDelete?.name || 'el ambiente'}? Esta acción no se puede deshacer y eliminará todos los diagramas asociados.`,
      okText: 'Eliminar', okType: 'danger', cancelText: 'Cancelar',
      async onOk() {
        setLoading(true);
        try {
          await deleteEnvironment(companyId as string, environmentId);
          message.success("Ambiente eliminado correctamente");
          const environmentsData = await getEnvironments(companyId as string);
          setEnvironments(environmentsData);
          if (selectedEnvironment === environmentId) {
            if (environmentsData.length > 0) {
              setSelectedEnvironment(environmentsData[0].id);
              const diagramsData = await getDiagramsByEnvironment(companyId as string, environmentsData[0].id);
              setDiagrams(diagramsData);
              if (diagramsData.length > 0) { setSelectedDiagram(diagramsData[0].id); setCurrentDiagram(diagramsData[0] || null); }
              else { setSelectedDiagram(null); setCurrentDiagram(null); }
            } else { setSelectedEnvironment(null); setDiagrams([]); setSelectedDiagram(null); setCurrentDiagram(null); }
          }
        } catch (error) { message.error(error instanceof Error ? error.message : "No se pudo eliminar el ambiente."); }
        setLoading(false);
      }
    });
  };

  const handleCreateDiagram = async () => {
    if (!selectedEnvironment) { message.error("Debe seleccionar un ambiente primero"); return; }
    if (!newDiagramName.trim()) { message.error("El nombre del diagrama es obligatorio"); return; }
    setLoading(true);
    try {
      const newDiagram = await createDiagram(companyId as string, selectedEnvironment, { name: newDiagramName, description: newDiagramDescription, path: newDiagramPath.trim() || undefined, nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
      const diagramsData = await getDiagramsByEnvironment(companyId as string, selectedEnvironment);
      setDiagrams(diagramsData); setSelectedDiagram(newDiagram.id); setCurrentDiagram(newDiagram);
      const selectedEnv = environments.find(env => env.id === selectedEnvironment);
      if (!selectedEnv) throw new Error('Ambiente no encontrado');
      updateUrlWithNames(selectedEnvironment, newDiagram.id, selectedEnv.name, newDiagram.name);
      setNewDiagramModalVisible(false); setNewDiagramName(''); setNewDiagramDescription(''); setNewDiagramPath('');
      startTransition(() => setDiagrams([...diagramsData]));
      message.success("Diagrama creado correctamente");
    } catch (error) { message.error(error instanceof Error ? error.message : "No se pudo crear el diagrama."); }
    finally { setLoading(false); }
  };

  const organizeByDirectories = (diagrams: Diagram[]) => {
    const organized: Record<string, Diagram[]> = {};
    diagrams.forEach(diagram => {
      let directory = 'root';
      if (diagram.path && diagram.path.trim() !== '') {
        const pathParts = diagram.path.split('/').filter(part => part.trim() !== '');
        if (pathParts.length > 0) directory = pathParts[0];
      }
      if (!organized[directory]) organized[directory] = [];
      organized[directory].push(diagram);
    });
    Object.keys(organized).forEach(key => organized[key].sort((a, b) => a.name.localeCompare(b.name)));
    return organized;
  };

  const confirmDeleteDiagram = (diagram: Diagram) => {
    if (diagram.nodes && diagram.nodes.length > 0) { message.error("No se puede eliminar un diagrama que contiene nodos. Limpie el diagrama primero."); return; }
    setDiagramToDelete(diagram); setDeleteConfirmVisible(true);
  };

  const handleDeleteDiagram = async () => {
    if (!diagramToDelete || !selectedEnvironment) return;
    try {
      setLoading(true);
      await deleteDiagram(companyId as string, selectedEnvironment, diagramToDelete.id);
      const diagramsData = await getDiagramsByEnvironment(companyId as string, selectedEnvironment);
      setDiagrams(diagramsData);
      if (selectedDiagram === diagramToDelete.id) {
        if (diagramsData.length > 0) {
          const firstDiagram = diagramsData[0];
          setSelectedDiagram(firstDiagram.id); setCurrentDiagram(firstDiagram || null); 
          const selectedEnv = environments.find(env => env.id === selectedEnvironment);
          if (selectedEnv) updateUrlWithNames(selectedEnvironment, firstDiagram.id, selectedEnv.name, firstDiagram.name);
        } else { setSelectedDiagram(null); setCurrentDiagram(null); router.push(`/company/${companyId}/diagrams`); }
      }
      setDeleteConfirmVisible(false); setDiagramToDelete(null);
      startTransition(() => setDiagrams([...diagramsData]));
      message.success("Diagrama eliminado correctamente");
    } catch (error: any) { message.error(error.message || "No se pudo eliminar el diagrama."); }
    finally { setLoading(false); }
  };

  const [loadingType, setLoadingType] = useState<'initial' | 'transition' | null>( (environments.length === 0 || !selectedEnvironment) ? 'initial' : null );
  
  useEffect(() => {
    setLoadingType(loading ? ((environments.length === 0 || !selectedEnvironment) ? 'initial' : 'transition') : null);
  }, [loading, environments.length, selectedEnvironment]);

  const initialLoadCompleteRef = useRef(false);

  useEffect(() => {
    const loadEnvironments = async () => {
      if (initialLoadCompleteRef.current) return;
      try {
        setLoading(true);
        const fetchEnvironmentsPromise = (async () => {
          const cacheKey = `env-${companyId}`;
          return environmentCache.has(cacheKey) ? (environmentCache.get(cacheKey) || []) : (data => { environmentCache.set(cacheKey, data); return data; })(await getEnvironments(companyId as string));
        })();
        const environmentsData = await fetchEnvironmentsPromise;
        if (!isMounted.current) return;
        setEnvironments(environmentsData);
        if (environmentsData.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlEnvironmentId = urlParams.get('environmentId');
          const urlDiagramId = urlParams.get('id') || diagramId as string;
          const targetEnvironment = urlEnvironmentId ? environmentsData.find(env => env.id === urlEnvironmentId) : environmentsData[0];
          if (targetEnvironment) {
            setSelectedEnvironment(targetEnvironment.id);
            const fetchDiagramsPromise = (async () => {
              const diagramsCacheKey = `diagrams-${companyId}-${targetEnvironment.id}`;
              return diagramCache.has(diagramsCacheKey) ? (diagramCache.get(diagramsCacheKey) || []) : (data => { diagramCache.set(diagramsCacheKey, data); return data; })(await getDiagramsByEnvironment(companyId as string, targetEnvironment.id));
            })();
            const diagramsData = await fetchDiagramsPromise;
            if (!isMounted.current) return;
            setDiagrams(diagramsData);
            const hasDiagramId = urlDiagramId && diagramsData.some(d => d.id === urlDiagramId);
            const targetDiagramId = hasDiagramId ? urlDiagramId : (diagramsData.length > 0 ? diagramsData[0].id : null);
            if (targetDiagramId) {
              setSelectedDiagram(targetDiagramId);
              const fetchDiagramPromise = (async () => {
                const singleDiagramCacheKey = `diagram-${companyId}-${targetEnvironment.id}-${targetDiagramId}`;
                return singleDiagramCache.has(singleDiagramCacheKey) ? (singleDiagramCache.get(singleDiagramCacheKey) || null) : (data => { singleDiagramCache.set(singleDiagramCacheKey, data); return data; })(await getDiagram(companyId as string, targetEnvironment.id, targetDiagramId));
              })();
              const diagramData = await fetchDiagramPromise;
              console.log("[DiagramPage] loadEnvironments (initial load) - Datos del diagrama recuperados:", JSON.stringify(diagramData, null, 2));
              if (!isMounted.current || !diagramData) { setLoading(false); return; }
              updateUrlWithNames(targetEnvironment.id, targetDiagramId, targetEnvironment.name, diagramData.name);
              batchStateUpdates(diagramData); 
              initialLoadCompleteRef.current = true;
              setTimeout(() => { if (isMounted.current) setLoading(false); }, 300);
            } else {
              setSelectedDiagram(null); setCurrentDiagram(null); 
              console.log("[DiagramPage] loadEnvironments (initial load) - No target diagram ID, or diagram not found.");
              initialLoadCompleteRef.current = true; setLoading(false);
            }
          } else { initialLoadCompleteRef.current = true; setLoading(false); }
        } else { initialLoadCompleteRef.current = true; setLoading(false); }
      } catch (error) { message.error("No se pudieron cargar los datos."); initialLoadCompleteRef.current = true; setLoading(false); }
    };
    loadEnvironments();
  }, [companyId, diagramId, batchStateUpdates]);

  useEffect(() => {
    const debounceTimeMs = 1000; const updateTimeRef = { current: 0 };
    const handleGroupUpdate = (event: CustomEvent) => {
      const { groupId, nodes: updatedNodes, edges: updatedEdges } = event.detail;
      const currentTime = Date.now(); if (currentTime - updateTimeRef.current < debounceTimeMs) return;
      updateTimeRef.current = currentTime;
      if (groupId && updatedNodes) { console.warn('handleGroupUpdate necesita ser refactorizado ya que setNodes/setEdges locales fueron eliminados.'); }
    };
    document.addEventListener('updateGroupNodes', handleGroupUpdate as EventListener);
    return () => document.removeEventListener('updateGroupNodes', handleGroupUpdate as EventListener);
  }, []);

  useEffect(() => {
    const handleNodePreview = (event: CustomEvent) => {
      const { nodeId, resourceData } = event.detail;
      setPreviewData(prevData => ({ ...prevData, selectedNode: { nodeId, resourceData } }));
      setPreviewModalVisible(true);
    };
    const handleNodeRun = (event: CustomEvent) => {
      const { nodeId, resourceData } = event.detail;
      setPreviewData(prevData => ({ ...prevData, selectedNode: { nodeId, resourceData } }));
      setRunModalVisible(true);
    };
    document.addEventListener('nodePreview', handleNodePreview as EventListener);
    document.addEventListener('nodeRun', handleNodeRun as EventListener);
    return () => {
      document.removeEventListener('nodePreview', handleNodePreview as EventListener);
      document.removeEventListener('nodeRun', handleNodeRun as EventListener);
    };
  }, []);

  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [destroyModalVisible, setDestroyModalVisible] = useState(false);
  const [selectedTargetEnvironment, setSelectedTargetEnvironment] = useState<string>('');
  const [destroyConfirmationText, setDestroyConfirmationText] = useState<string>('');

  const [previewData, setPreviewData] = useState<{
    resourcesToCreate: Array<{ id: string; type: string; name: string; provider: string; changes: Record<string, unknown>; }>;
    resourcesToUpdate: Array<{ id: string; type: string; name: string; provider: string; changes: Record<string, unknown>; }>;
    resourcesToDelete: Array<{ id: string; type: string; name: string; provider: string; }>;
    selectedNode?: { nodeId: string; resourceData: { label: string; provider: string; resourceType: string; }; };
  }>({ resourcesToCreate: [], resourcesToUpdate: [], resourcesToDelete: [] });

  const handlePreview = useCallback(async () => {
    if (!currentDiagram) return;
    try {
      setLoading(true);
      const mockPreviewData = {
        resourcesToCreate: currentDiagram.nodes.filter(node => node.type !== 'group').map(node => ({ id: node.id, type: node.type, name: node.data?.label || 'Unnamed Resource', provider: node.data?.provider || 'generic', changes: { create: true, properties: node.data || {} } })),
        resourcesToUpdate: [], resourcesToDelete: []
      };
      const newVersion = { id: `v${Date.now()}`, timestamp: new Date().toISOString(), author: 'Usuario Actual', description: `Modificación de ${mockPreviewData.resourcesToCreate.length} recursos`, changes: { created: mockPreviewData.resourcesToCreate.length, updated: mockPreviewData.resourcesToUpdate.length, deleted: mockPreviewData.resourcesToDelete.length } };
      setVersionHistory(prevHistory => [newVersion, ...prevHistory]);
      setPreviewData(mockPreviewData); setPreviewModalVisible(true);
      message.success('Cambios registrados en el historial');
    } catch (error) { message.error('Error al generar la vista previa'); }
    finally { setLoading(false); }
  }, [currentDiagram]);

  const handleRun = useCallback(() => setRunModalVisible(true), []);
  const handlePromote = () => setPromoteModalVisible(true);

  const handlePromoteConfirm = async () => {
    if (!selectedTargetEnvironment || !currentDiagram) return;
    try { setLoading(true); message.success('Diagrama promovido exitosamente'); setPromoteModalVisible(false); }
    catch { message.error('Error al promover el diagrama'); }
    finally { setLoading(false); }
  };

  const handleRunConfirm = async () => {
    if (!currentDiagram) return;
    try {
      setLoading(true);
      const newVersion = { id: `v${Date.now()}`, timestamp: new Date().toISOString(), author: 'Usuario Actual', description: `Ejecución de ${previewData.resourcesToCreate.length} cambios`, changes: { created: previewData.resourcesToCreate.length, updated: previewData.resourcesToUpdate.length, deleted: previewData.resourcesToDelete.length } };
      setVersionHistory(prevHistory => [newVersion, ...prevHistory]);
      message.success('Diagrama desplegado exitosamente'); setRunModalVisible(false);
    } catch (error) { message.error('Error al desplegar el diagrama'); }
    finally { setLoading(false); }
  };

  const handleDestroy = () => { setDestroyConfirmationText(''); setDestroyModalVisible(true); };

  const handleDestroyConfirm = async () => {
    if (!currentDiagram || destroyConfirmationText.trim() !== currentDiagram.name) { message.error(currentDiagram ? `Debe escribir exactamente "${currentDiagram.name}" para confirmar` : "No hay diagrama seleccionado."); return; }
    try {
      setLoading(true);
      const updatedDiagram: Diagram = { ...currentDiagram, nodes: [], edges: [], updated_at: new Date().toISOString() };
      if (selectedEnvironment) await updateDiagram(companyId as string, selectedEnvironment, currentDiagram.id, { name: updatedDiagram.name, description: updatedDiagram.description, nodes: [], edges: [], viewport: updatedDiagram.viewport });
      setCurrentDiagram(updatedDiagram); 
      const singleDiagramCacheKey = `diagram-${companyId}-${selectedEnvironment}-${currentDiagram.id}`;
      singleDiagramCache.set(singleDiagramCacheKey, updatedDiagram);
      message.success(`Todos los recursos del diagrama "${currentDiagram.name}" han sido eliminados`);
      setDestroyModalVisible(false); setDestroyConfirmationText('');
    } catch { message.error('Error al destruir los recursos del diagrama'); }
    finally { setLoading(false); }
  };

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [versionsModalVisible, setVersionsModalVisible] = useState(false);
  const [versionHistory, setVersionHistory] = useState<Array<{ id: string; timestamp: string; author: string; description: string; changes: { created: number; updated: number; deleted: number; }; }>>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(`/api/v1/companies/${companyId}`);
        const data = await response.json(); 
        if (!response.ok) { throw new Error(data.error || `Error ${response.status} al cargar la compañía`); }
        setCompany(data);
      } catch (error) { console.error('Error en fetchCompanyInfo:', error); message.error('No se pudo cargar la información de la compañía'); setCompany(null); }
    };
    if (companyId) fetchCompanyInfo();
  }, [companyId]);

  const handleVersions = async () => {
    try {
      const token = localStorage.getItem('token'); if (!token) { message.error('No hay sesión activa'); return; }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${selectedEnvironment}/diagrams/${diagramId}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || 'Error al cargar las versiones');
      if (!Array.isArray(data)) throw new Error('Formato de respuesta inválido');
      setVersionHistory(data); setVersionsModalVisible(true);
    } catch (err) { message.error(err instanceof Error ? err.message : 'Error al cargar las versiones'); }
  };

  const handleHistory = async () => {
    try {
      const token = localStorage.getItem('token'); if (!token) { message.error('No hay sesión activa'); return; }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${selectedEnvironment}/diagrams/${diagramId}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || 'Error al cargar el historial');
      if (!Array.isArray(data)) throw new Error('Formato de respuesta inválido');
      setVersionHistory(data); setHistoryModalVisible(true);
    } catch (err) { message.error(err instanceof Error ? err.message : 'Error al cargar el historial'); }
  };

  const handleRollback = async () => {
    try {
      const token = localStorage.getItem('token'); if (!token) { message.error('No hay sesión activa'); return; }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${selectedEnvironment}/diagrams/${diagramId}/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || 'Error al cargar las versiones');
      if (!Array.isArray(data)) throw new Error('Formato de respuesta inválido');
      setVersionHistory(data); setRollbackModalVisible(true);
    } catch (err) { message.error(err instanceof Error ? err.message : 'Error al cargar las versiones'); }
  };

  const handleRollbackConfirm = async () => {
    if (!selectedVersion) return;
    try {
      const token = localStorage.getItem('token'); if (!token) throw new Error('No estás autenticado');
      const newVersion = { id: `v${Date.now()}`, timestamp: new Date().toISOString(), author: 'Usuario Actual', description: `Reversión a la versión ${selectedVersion}`, changes: { created: 0, updated: 0, deleted: 0 } };
      setVersionHistory(prevHistory => [newVersion, ...prevHistory]);
      message.success('Versión restaurada exitosamente'); setRollbackModalVisible(false);
      handleDiagramChange(diagramId as string);
    } catch (err) { message.error(err instanceof Error ? err.message : 'Error al restaurar la versión'); }
  };

  useEffect(() => { console.log('Historial de versiones actualizado:', versionHistory); }, [versionHistory]);

  const [credentials, setCredentials] = useState<any[]>([]);
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/companies/${companyId}/credentials`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setCredentials(Array.isArray(data) ? data : []); }
        else setCredentials([]);
      } catch (error) { setCredentials([]); }
    };
    loadCredentials();
  }, [companyId]);

  const getCurrentEnvironmentCredentials = () => {
    if (!selectedEnvironment) return [];
    return credentials.filter(cred => cred.environments && cred.environments.includes(selectedEnvironment));
  };
  const environmentCredentials = getCurrentEnvironmentCredentials();
  const hasCredentials = environmentCredentials.length > 0;
  const currentEnvironmentName = environments.find(env => env.id === selectedEnvironment)?.name;
  const [showCredentialsBanner, setShowCredentialsBanner] = useState<boolean>(true);

  useEffect(() => {
    if (selectedEnvironment && typeof window !== 'undefined') {
      const hiddenBanners = JSON.parse(localStorage.getItem('hiddenCredentialsBanners') || '{}');
      setShowCredentialsBanner(!hiddenBanners[selectedEnvironment]);
    }
  }, [selectedEnvironment]);

  const hideCredentialsBannerPermanently = () => {
    if (selectedEnvironment && typeof window !== 'undefined') {
      const hiddenBanners = JSON.parse(localStorage.getItem('hiddenCredentialsBanners') || '{}');
      hiddenBanners[selectedEnvironment] = true;
      localStorage.setItem('hiddenCredentialsBanners', JSON.stringify(hiddenBanners));
      setShowCredentialsBanner(false);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'credentials': return <div className="p-4 h-full"><CredentialsPage companyId={companyId as string} /></div>;
      case 'deployments': return <div className="p-4 h-full"><DeploymentsPage companyId={companyId as string} /></div>;
      case 'settings': return <div className="p-4 h-full"><SettingsPage companyId={companyId as string} /></div>;
      case 'team': return <div className="p-4 h-full"><TeamPage companyId={companyId as string} /></div>;
      case 'diagrams': default: return renderDiagramsSection();
    }
  };

  const renderDiagramEditor = () => {
    if (currentDiagram && selectedEnvironment && selectedDiagram) {
      return (
        // EdgeTypeToolbox ya no se renderiza aquí directamente
          <div className="h-full w-full" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <FlowEditor 
              key={`current-diagram-${currentDiagram.id}-${selectedEnvironment}-${selectedDiagram}`}
              companyId={companyId as string} 
              environmentId={selectedEnvironment} 
              diagramId={selectedDiagram} 
              initialDiagram={currentDiagram} 
              initialViewport={currentDiagram.viewport}
              nodeTypes={nodeTypes} 
              resourceCategories={resourceCategories}
              initialNodes={initialNodesForFlowEditor} 
              initialEdges={initialEdgesForFlowEditor} 
              onSave={onSaveDiagramCallback} 
            />
          </div>
      );
    }
    if (!loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-10 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"><ChartBarIcon className="w-8 h-8 text-gray-400" /></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{!selectedEnvironment ? "Selecciona un ambiente" : "No hay diagramas disponibles"}</h3>
            <p className="text-gray-500 mb-6">{!selectedEnvironment ? "Selecciona o crea un ambiente para empezar a trabajar con diagramas de infraestructura" : "Este ambiente no tiene diagramas. Crea uno nuevo para empezar a diseñar tu infraestructura"}</p>
            {selectedEnvironment && <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewDiagramModalVisible(true)} className="bg-blue-600 hover:bg-blue-700 border-blue-600">Crear Primer Diagrama</Button>}
          </div>
        </div>
      );
    }
    return <div className="flex items-center justify-center h-full"><Spin size="large" tip="Cargando diagrama..."><div className="p-12"></div></Spin></div>;
  };

  const renderDiagramsSection = () => (
    <div className="flex flex-col h-full">
      {!hasCredentials && selectedEnvironment && showCredentialsBanner && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mb-4 rounded-r-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <div className="flex-shrink-0"><ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" /></div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Sin credenciales configuradas</h3>
                <div className="mt-2 text-sm text-yellow-700"><p>El ambiente <strong>{currentEnvironmentName}</strong> no tiene credenciales de cloud asociadas. No podrás crear o desplegar infraestructura hasta que configures las credenciales.</p></div>
                <div className="mt-4 flex items-center space-x-4">
                  <button onClick={() => { if (typeof window !== 'undefined') sessionStorage.setItem(`activeSection_${companyId}`, 'credentials'); setActiveSection('credentials'); }} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"><KeyIcon className="w-4 h-4 mr-2" />Configurar credenciales</button>
                  <button onClick={hideCredentialsBannerPermanently} className="text-xs text-yellow-600 hover:text-yellow-800 underline">No mostrar de nuevo</button>
                </div>
              </div>
            </div>
            <button onClick={() => setShowCredentialsBanner(false)} className="text-yellow-500 hover:text-yellow-700" aria-label="Cerrar"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
      )}
      {hasCredentials && selectedEnvironment && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mx-4 mb-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0"><KeyIcon className="h-4 w-4 text-green-400" /></div>
            <div className="ml-3"><p className="text-sm text-green-700"><strong>{environmentCredentials.length}</strong> credencial(es) configuradas para <strong>{currentEnvironmentName}</strong></p></div>
          </div>
        </div>
      )}
      <div className="mb-2 bg-white rounded-lg shadow-sm border border-gray-200 mx-2">
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium mr-2">Ambiente:</span>
                <EnvironmentTreeSelect environments={environments} value={selectedEnvironment ?? undefined} onChange={handleEnvironmentChange} placeholder="Selecciona un ambiente" onDeleteEnvironment={handleDeleteEnvironment} showDeleteButton={true} />
                <Button type="primary" icon={<PlusOutlined />} className="ml-2 bg-blue-600 hover:bg-blue-700 border-blue-600" onClick={() => setNewEnvironmentModalVisible(true)} title="Crear nuevo ambiente" />
              </div>
              {selectedEnvironment && (
                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-medium mr-2">Diagrama:</span>
                  <DiagramTreeSelect key={`diagram-selector-${diagrams.length}-${selectedDiagram}`} diagrams={diagrams} value={selectedDiagram ?? undefined} onChange={handleDiagramChange} companyId={companyId as string} environmentId={selectedEnvironment as string} className="min-w-[320px]" showDeleteButton={true} onDeleteDiagram={(id: string) => { const diagram = diagrams.find(d => d.id === id); if (diagram) confirmDeleteDiagram(diagram); }} />
                  <Button type="primary" icon={<PlusOutlined />} className="ml-2 bg-green-600 hover:bg-green-700 border-green-600" onClick={() => setNewDiagramModalVisible(true)} title="Crear nuevo diagrama" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
                <Button icon={<HistoryOutlined />} className="hover:bg-gray-50" title="Historial de cambios" onClick={handleHistory} />
                <Button icon={<RollbackOutlined />} className="hover:bg-gray-50" title="Revertir cambios" onClick={handleRollback} />
                <Button icon={<BranchesOutlined />} className="hover:bg-gray-50" title="Gestionar versiones" onClick={handleVersions} />
              </div>
              <div className="flex items-center gap-1">
                <Button icon={<EyeOutlined />} onClick={handlePreview} className="hover:bg-gray-50" title="Vista previa" />
                <Button type="primary" danger={false} icon={<PlayCircleOutlined />} onClick={handleRun} className="bg-green-600 hover:bg-green-700 border-green-600" title="Ejecutar cambios" />
                <Button type="primary" icon={<ArrowUpOutlined />} onClick={handlePromote} className="bg-blue-600 hover:bg-blue-700 border-blue-600" title="Promover a otro ambiente" />
                <Button danger icon={<ClearOutlined />} onClick={handleDestroy} className="hover:bg-red-50" title="Limpiar todos los recursos del diagrama" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {currentDiagram && initialNodesForFlowEditor.length > 0 && (
        <div className="px-2 py-1 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm text-gray-700">Nodos:</span><span className="text-sm font-semibold text-gray-900">{initialNodesForFlowEditor.length}</span></div>
              <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-sm text-gray-700">Conexiones:</span><span className="text-sm font-semibold text-gray-900">{initialEdgesForFlowEditor.length}</span></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs text-gray-600">{currentEnvironmentName} • Sincronizado</span></div>
            </div>
          </div>
        </div>
      )}
      <div className="relative bg-white flex-1 rounded-lg overflow-hidden" style={{ height: "calc(100vh - 250px)" }}>
        <div className="absolute inset-0">{renderDiagramEditor()}</div>
      </div>
      <Modal title="Crear Nuevo Ambiente" open={newEnvironmentModalVisible} onCancel={() => { setNewEnvironmentModalVisible(false); setNewEnvironmentName(''); setNewEnvironmentDescription(''); setNewEnvironmentCategory('desarrollo'); }} onOk={handleCreateEnvironment} okText="Crear" cancelText="Cancelar" okButtonProps={{ disabled: !newEnvironmentName.trim() }}>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ambiente*</label><Input value={newEnvironmentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnvironmentName(e.target.value)} placeholder="Ej. Desarrollo, Pruebas, Producción" autoFocus /></div>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Categoría*</label><EnvironmentCategorySelect value={newEnvironmentCategory} onChange={setNewEnvironmentCategory} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label><TextArea value={newEnvironmentDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewEnvironmentDescription(e.target.value)} rows={4} placeholder="Descripción del ambiente" /></div>
      </Modal>
      <Modal title="Crear Nuevo Diagrama" open={newDiagramModalVisible} onCancel={() => { setNewDiagramModalVisible(false); setNewDiagramName(''); setNewDiagramDescription(''); setNewDiagramPath(''); }} onOk={handleCreateDiagram} okText="Crear" cancelText="Cancelar" okButtonProps={{ disabled: !newDiagramName.trim() || loading, loading: loading }}>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Diagrama*</label><Input value={newDiagramName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDiagramName(e.target.value)} placeholder="Ej. Infraestructura Web, Base de Datos" autoFocus /></div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Directorio/Ruta (opcional)</label>
          <Select mode="tags" style={{ width: '100%' }} value={newDiagramPath ? [newDiagramPath] : []} onChange={(values) => setNewDiagramPath(values[values.length - 1] || '')} placeholder="Ej. devops/hub-and-spoke, infrastructure/database" styles={{ popup: { root: { maxHeight: 300, overflow: 'auto' } } }} options={(() => { const existingDirs = new Set<string>(); diagrams.forEach(diagram => { if (diagram.path && diagram.path.trim() !== '') { const pathParts = diagram.path.split('/').filter(part => part.trim() !== ''); if (pathParts.length > 0) { existingDirs.add(pathParts[0]); existingDirs.add(diagram.path); } } }); return Array.from(existingDirs).map(dir => ({ value: dir, label: (<div className="flex items-center"><FolderOutlined className="mr-2 text-orange-500" />{dir}</div>) })); })()} filterOption={(input, option) => option?.value.toLowerCase().includes(input.toLowerCase()) || false} />
          <p className="mt-1 text-xs text-gray-500">Organiza tus diagramas en directorios. Usa "/" para crear subdirectorios. <br /><strong>Ejemplos:</strong> devops, infrastructure/aws, networks/security</p>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label><TextArea value={newDiagramDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDiagramDescription(e.target.value)} rows={4} placeholder="Descripción del diagrama" /></div>
      </Modal>
      <Modal title="Limpiar Diagrama" open={destroyModalVisible} onCancel={() => { setDestroyModalVisible(false); setDestroyConfirmationText(''); }} onOk={handleDestroyConfirm} okText="Limpiar" cancelText="Cancelar" okButtonProps={{ danger: true, disabled: !currentDiagram || destroyConfirmationText.trim() !== currentDiagram.name }}>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">Esta acción eliminará todos los nodos y conexiones del diagrama <strong>"{currentDiagram?.name}"</strong>.</p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4"><p className="text-sm text-red-800 font-medium">⚠️ Esta acción no se puede deshacer</p><p className="mt-1 text-sm text-red-700">Todos los recursos y conexiones del diagrama serán eliminados permanentemente.</p></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Para confirmar, escribe el nombre del diagrama: <strong>{currentDiagram?.name}</strong></label><Input value={destroyConfirmationText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDestroyConfirmationText(e.target.value)} placeholder={currentDiagram?.name} autoFocus /></div>
        </div>
      </Modal>
      <Modal title="Confirmar Eliminación" open={deleteConfirmVisible} onCancel={() => { setDeleteConfirmVisible(false); setDiagramToDelete(null); }} onOk={handleDeleteDiagram} okText="Eliminar" cancelText="Cancelar" okButtonProps={{ danger: true, disabled: diagramToDelete?.nodes && diagramToDelete.nodes.length > 0 }}>
        <div className="mb-4">
          <p className="text-sm text-gray-600">¿Estás seguro de que deseas eliminar el diagrama <strong>"{diagramToDelete?.name}"</strong>?</p>
          {diagramToDelete?.path && (<p className="mt-1 text-xs text-gray-500">Ubicación: {diagramToDelete.path}</p>)}
          {diagramToDelete?.nodes && diagramToDelete.nodes.length > 0 ? (<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md"><p className="text-sm text-yellow-800 font-medium">⚠️ No se puede eliminar el diagrama porque contiene {diagramToDelete.nodes.length} nodo(s)</p><p className="mt-2 text-sm text-yellow-700">Por favor, utiliza el botón "Limpiar" para eliminar todos los nodos antes de eliminar el diagrama.</p></div>) : (<p className="mt-2 text-sm text-red-600">Esta acción no se puede deshacer.</p>)}
        </div>
      </Modal>
    </div>
  );

  if (loadingType === 'initial') {
    return <div className="flex justify-center items-center h-screen"><Spin size="large"><div className="p-5">Cargando...</div></Spin></div>;
  }

  // Loguear las props que se pasan a FlowEditor
  if (activeSection === 'diagrams' && currentDiagram) {
    console.log("[DiagramPage] Rendering FlowEditor with initialNodes:", JSON.stringify(initialNodesForFlowEditor, null, 2));
    console.log("[DiagramPage] Rendering FlowEditor with initialEdges:", JSON.stringify(initialEdgesForFlowEditor, null, 2));
    console.log("[DiagramPage] currentDiagram object being used for FlowEditor:", JSON.stringify(currentDiagram, null, 2));
  }


  return (
    <SelectedEdgeTypeProvider> {/* Envolver con el Provider */}
      <div className="flex h-screen bg-gray-50">
        <CompanySidebar 
          companyName={company?.name || 'Cargando...'} 
          activeSection={activeSection} 
          onSectionChange={(section: string) => setActiveSection(section as SectionKeys)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <div className="flex-1 overflow-auto">{renderActiveSection()}</div>
        <div className="fixed bottom-0 left-0 right-0 bg-red-100 text-xs p-1 text-red-900 z-50">Debug: {companyId as string} | Env: {selectedEnvironment || 'none'} | Diagram: {selectedDiagram || 'none'} | Nodes: {initialNodesForFlowEditor.length} | Edges: {initialEdgesForFlowEditor.length} | Loading: {loading ? 'true' : 'false'} | DiagramExists: {currentDiagram ? 'true' : 'false'}</div>
      </div>
    </SelectedEdgeTypeProvider>
  );
}
