'use client';

import React, { useState, useEffect, useCallback, useRef, JSX, useMemo } from 'react'; // Added useMemo, JSX
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button, Select, Modal, Input, Spin, message, Typography } from 'antd';
import { 
  PlusOutlined as AntPlusOutlined, 
  EyeOutlined, 
  PlayCircleOutlined, 
  FolderOpenOutlined as AntFolderIcon, 
  SettingOutlined, 
  DeleteOutlined 
} from '@ant-design/icons'; 
import { 
  FolderIcon, 
  PlusIcon,
  UserCircleIcon as UserCircleIconOutline, 
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline, 
  DocumentDuplicateIcon as DocumentDuplicateIconOutline, 
  UsersIcon as UsersIconOutline,
  ServerIcon, // Added for resourceCategories
  CloudIcon,  // Added
  CircleStackIcon, // Added
  CpuChipIcon, // Added
  CodeBracketIcon, // Added
  ArchiveBoxIcon, // Added
  TableCellsIcon, // Added
  BoltIcon, // Added
  ChatBubbleOvalLeftEllipsisIcon, // Added
  CalendarDaysIcon, // Added
  AdjustmentsHorizontalIcon, // Added
  ListBulletIcon, // Added
  RectangleGroupIcon, // Added
  RssIcon, // Added
  ComputerDesktopIcon, // Added
  ServerStackIcon, // Added
  CubeIcon, // Added
  GlobeAltIcon, // Added
  RectangleStackIcon, // Added
  ShieldCheckIcon, // Added
  ArrowsRightLeftIcon, // Added
  DocumentTextIcon, // Added
  // ChartBarIcon from solid is usually imported separately if needed
} from '@heroicons/react/24/outline';
// import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon'; // Example if solid version is needed

import {
  DocumentDuplicateIcon as DocumentDuplicateIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  UsersIcon as UsersIconSolid, 
  PlayCircleIcon as PlayCircleIconSolid 
} from '@heroicons/react/24/solid';

import FlowEditor from '../../components/flow/FlowEditor'; 
import EnvironmentTreeSelect from '../../components/ui/EnvironmentTreeSelect'; 
import DiagramTreeSelect from '../../components/ui/DiagramTreeSelect'; 
import CompanySidebar from '../../components/ui/CompanySidebar'; 
import CredentialsPage from '../../components/ui/CredentialsPage'; 
import DeploymentsPage from '../../components/ui/DeploymentsPage';
import SettingsPage from '../../components/ui/SettingsPage';

import { getCompanies, Company, createCompany } from '../../services/companyService';
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram as createDiagramService, createEnvironment as createEnvironmentService, updateDiagram, deleteDiagram as deleteDiagramService } from '../../services/diagramService';
import { getCurrentUser, isAuthenticated, User } from '../../services/authService';

import nodeTypes from '../../components/nodes/NodeTypes'; 
import { Node as CustomNode, Edge as CustomEdge } from '../../services/diagramService';
import { 
  Node as ReactFlowNode, 
  Edge as ReactFlowEdge, 
  Connection, 
  NodeChange, 
  EdgeChange, 
  Viewport as ReactFlowViewport, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect      
} from 'reactflow';

const { Text } = Typography;

const PERSONAL_SPACE_COMPANY_NAME_PREFIX = "Personal Space for ";

// Types for Resource Sidebar (copied from company diagram page)
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
      { type: 'aws_efs_file_system', name: 'EFS File System', description: 'Sistema de archivos elástico', provider: 'aws', icon: <FolderIcon /> },
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
      { type: 'azurerm_storage_share', name: 'File Share', description: 'Recurso compartido de Azure Files', provider: 'azure', icon: <FolderIcon /> },
    ]
  },
  // { // Azure Analytics - commented out as ChartBarIcon from solid might need specific import
  //   name: 'Azure - Analytics',
  //   provider: 'azure',
  //   items: [
  //     { type: 'azurerm_synapse_workspace', name: 'Synapse Workspace', description: 'Espacio de trabajo de Azure Synapse Analytics', provider: 'azure', icon: <ChartBarIcon /> },
  //   ]
  // },
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
      // { type: 'azurerm_linux_function_app', name: 'Function App (Linux)', description: 'Funciones serverless en Linux', provider: 'azure', icon: <BoltIcon /> }, // Duplicado, ya está en Cómputo
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
      { type: 'gcp_filestore_instance', name: 'Filestore Instance', description: 'Almacenamiento de archivos NFS gestionado', provider: 'gcp', icon: <FolderIcon /> },
    ]
  },
  {
    name: 'GCP - Aplicación',
    provider: 'gcp',
    items: [
      // { type: 'gcp_cloudfunctions_function', name: 'Cloud Functions', description: 'Función serverless (Aplicación)', provider: 'gcp', icon: <BoltIcon /> }, // Duplicado
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
      // { type: 'group', name: 'Subsistema', description: 'Agrupar componentes relacionados', provider: 'generic', icon: <ServerStackIcon /> }, // Duplicado de Grupo
    ]
  }
];


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isPersonalSpace, setIsPersonalSpace] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  
  // El estado local de nodes/edges en DashboardPage ya no es necesario si FlowEditor maneja su propio estado
  // y solo lo actualizamos a través de initialNodes/initialEdges cuando currentDiagram cambia.
  // const [nodes, setNodes] = useState<ReactFlowNode[]>([]); 
  // const [edges, setEdges] = useState<ReactFlowEdge[]>([]);

  // Definiciones de convertToReactFlowNodes y convertToReactFlowEdges movidas aquí arriba
  const convertToReactFlowNodes = (customNodes: CustomNode[]): ReactFlowNode[] => customNodes.map(n => ({...n, data: {...n.data}} as ReactFlowNode));
  const convertToReactFlowEdges = (customEdges: CustomEdge[]): ReactFlowEdge[] => customEdges.map(e => ({...e} as ReactFlowEdge));

  const initialNodesForFlow = useMemo(() => {
    return currentDiagram?.nodes ? convertToReactFlowNodes(currentDiagram.nodes) : [];
  }, [currentDiagram?.nodes]);

  const initialEdgesForFlow = useMemo(() => {
    return currentDiagram?.edges ? convertToReactFlowEdges(currentDiagram.edges) : [];
  }, [currentDiagram?.edges]);

  const [newEnvironmentModalVisible, setNewEnvironmentModalVisible] = useState<boolean>(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState<string>('');
  const [newEnvironmentDescription, setNewEnvironmentDescription] = useState<string>('');
  const [newEnvironmentCategory, setNewEnvironmentCategory] = useState<string>('desarrollo');

  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  const [newDiagramPath, setNewDiagramPath] = useState<string>('');
  const [newDiagramDescription, setNewDiagramDescription] = useState<string>('');

  const [deleteDiagramModalVisible, setDeleteDiagramModalVisible] = useState<boolean>(false); 
  const [diagramToDeleteId, setDiagramToDeleteId] = useState<string | null>(null); 
  
  type SidebarSectionKey = 'diagrams' | 'settings' | 'templates' | 'credentials' | 'deployments' | 'team';
  const [activeSectionInSidebar, setActiveSectionInSidebar] = useState<SidebarSectionKey>('diagrams');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [needsPersonalSpaceSetup, setNeedsPersonalSpaceSetup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    const actualUserId = user?._id; 
    if (!user || !actualUserId || user.usage_type === null) {
      if (!user && isAuthenticated()) setLoading(true);
      else setLoading(false);
      return; 
    }
    
    async function setupPersonalSpaceAndLoadData() {
      setLoading(true); setError(null);
      try {
        let personalCompany = await findPersonalCompany(user!); 
        if (!personalCompany) {
          setNeedsPersonalSpaceSetup(true); setLoading(false); return;
        }
        setNeedsPersonalSpaceSetup(false); setActiveCompany(personalCompany); setIsPersonalSpace(true);
        await loadCompanyOrPersonalSpaceData(personalCompany);
      } catch (e: any) {
        setError(e.message || 'Error al configurar el espacio personal.');
        message.error(e.message || 'Error al configurar el espacio personal.');
      } finally { setLoading(false); }
    }

    async function loadCompanyData() {
      setLoading(true); setError(null);
      try {
        const companies = await getCompanies();
        if (companies.length > 0) {
          const firstCompany = companies[0]; 
          setActiveCompany(firstCompany); setIsPersonalSpace(false);
          await loadCompanyOrPersonalSpaceData(firstCompany);
        } else {
          setActiveCompany(null); setEnvironments([]); setDiagrams([]); setSelectedEnvironment(null); setSelectedDiagram(null); setCurrentDiagram(null); 
          // setNodes([]); // Eliminado
          // setEdges([]); // Eliminado
        }
      } catch (e: any) {
        setError(e.message || 'Error al cargar datos de compañía.');
        message.error(e.message || 'Error al cargar datos de compañía.');
      } finally { setLoading(false); }
    }
    
    if (user.usage_type === 'personal') setupPersonalSpaceAndLoadData();
    else if (user.usage_type === 'company') loadCompanyData();
    else setLoading(false);
  }, [user, router]);

  async function findPersonalCompany(currentUser: User): Promise<Company | null> {
    const currentUserId = currentUser._id;
    if (!currentUser || !currentUserId) return null;
    const companies = await getCompanies(); 
    return companies.find(c => c.name === `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${currentUserId}`) || null;
  }

  async function handleCreatePersonalSpace() {
    const userIdToUse = user?._id;
    if (!user || !userIdToUse) { 
      message.error("Información del usuario no disponible. No se puede crear el espacio personal."); setLoading(false); return;
    }
    setLoading(true);
    try {
      const personalCompanyName = `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${userIdToUse}`;
      const newCompany = await createCompany({ name: personalCompanyName, description: "Espacio personal automático" });
      if (!newCompany || (!newCompany._id && !newCompany.id)) throw new Error("La creación de la compañía personal no devolvió un ID válido.");
      const companyIdToUse = newCompany._id || newCompany.id!;
      await createEnvironmentService(companyIdToUse, { name: "Sandbox", description: "Ambiente personal de pruebas", category: "desarrollo" });
      message.success("Espacio personal creado. ¡Listo para empezar!");
      setNeedsPersonalSpaceSetup(false);
      setUser(getCurrentUser()); 
    } catch (e: any) { message.error("Error al crear espacio personal: " + e.message);
    } finally { setLoading(false); }
  }

  async function loadCompanyOrPersonalSpaceData(company: Company) {
    const companyId = company._id || company.id!;
    const envs = await getEnvironments(companyId);
    setEnvironments(envs);
    if (envs.length > 0) {
      const defaultEnvId = envs[0].id; 
      setSelectedEnvironment(defaultEnvId);
      const diags = await getDiagramsByEnvironment(companyId, defaultEnvId);
      setDiagrams(diags);
      if (diags.length > 0) {
        setSelectedDiagram(diags[0].id);
        const diagramData = await getDiagram(companyId, defaultEnvId, diags[0].id);
        setCurrentDiagram(diagramData);
        // setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []); // Ya no se usa el estado local nodes
        // setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []); // Ya no se usa el estado local edges
      } else {
        setCurrentDiagram(null); 
        // setNodes([]); // Ya no se usa el estado local nodes
        // setEdges([]); // Ya no se usa el estado local edges
        setSelectedDiagram(null);
      }
    } else {
      setDiagrams([]); setSelectedDiagram(null); setCurrentDiagram(null); 
      // setNodes([]); // Ya no se usa el estado local nodes
      // setEdges([]); // Ya no se usa el estado local edges
      setSelectedEnvironment(null);
    }
  }

  // onNodesChange, onEdgesChange, onConnect ya no son necesarios aquí ya que FlowEditor los maneja internamente
  // const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  // const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  // const onConnect: OnConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), []);

  // Las definiciones de convertToReactFlowNodes y convertToReactFlowEdges se movieron arriba.
  
  const handleEnvironmentChange = async (environmentId: string) => {
    if (!activeCompany) return;
    setSelectedEnvironment(environmentId); setLoading(true);
    try {
      const diags = await getDiagramsByEnvironment(activeCompany._id || activeCompany.id!, environmentId);
      setDiagrams(diags);
      if (diags.length > 0) {
        setSelectedDiagram(diags[0].id);
        const diagramData = await getDiagram(activeCompany._id || activeCompany.id!, environmentId, diags[0].id);
        setCurrentDiagram(diagramData);
        // setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []); // Ya no se usa
        // setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []); // Ya no se usa
      } else {
        setSelectedDiagram(null); setCurrentDiagram(null); 
        // setNodes([]); // Ya no se usa
        // setEdges([]); // Ya no se usa
      }
    } catch (e:any) { message.error("Error al cambiar de ambiente: " + e.message); }
    finally { setLoading(false); }
  };

  const handleDiagramChange = async (diagramId: string) => {
    if (!activeCompany || !selectedEnvironment) return;
    setSelectedDiagram(diagramId); setLoading(true);
    try {
      const diagramData = await getDiagram(activeCompany._id || activeCompany.id!, selectedEnvironment, diagramId);
      setCurrentDiagram(diagramData);
      // setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []); // Ya no se usa
      // setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []); // Ya no se usa
    } catch (e:any) { message.error("Error al cambiar de diagrama: " + e.message); }
    finally { setLoading(false); }
  };
  
  const handleSaveDiagram = useCallback(async (data: { nodes: ReactFlowNode[], edges: ReactFlowEdge[], viewport?: ReactFlowViewport }) => {
    if (!activeCompany || !selectedEnvironment || !selectedDiagram || !currentDiagram) return;
    const customNodes = data.nodes.map(n => ({ id: n.id, type: n.type!, position: n.position, data: n.data, width: n.width, height: n.height, parentNode: n.parentNode, style: n.style } as CustomNode));
    const customEdges = data.edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, animated: e.animated, label: e.label as string, data: e.data, style: e.style } as CustomEdge));
    try {
      await updateDiagram(activeCompany._id || activeCompany.id!, selectedEnvironment, selectedDiagram, {
        name: currentDiagram.name, description: currentDiagram.description, nodes: customNodes, edges: customEdges, viewport: data.viewport || currentDiagram.viewport
      });
      message.success("Diagrama guardado.");
    } catch (e:any) { message.error("Error al guardar el diagrama: " + e.message); }
  }, [activeCompany, selectedEnvironment, selectedDiagram, currentDiagram]);

  const handleCreateNewEnvironment = async () => {
    if (!activeCompany || !newEnvironmentName.trim()) {
      message.error("El nombre del ambiente es obligatorio."); return;
    }
    if (isPersonalSpace && environments.length >= 1) {
      message.warning("El plan Starter solo permite 1 ambiente."); setNewEnvironmentModalVisible(false); return;
    }
    setLoading(true);
    try {
      const createdEnv = await createEnvironmentService(activeCompany._id || activeCompany.id!, { 
        name: newEnvironmentName, description: newEnvironmentDescription, category: newEnvironmentCategory 
      });
      message.success("Ambiente creado.");
      setNewEnvironmentName(''); setNewEnvironmentDescription(''); setNewEnvironmentCategory('desarrollo');
      setNewEnvironmentModalVisible(false);
      const envs = await getEnvironments(activeCompany._id || activeCompany.id!);
      setEnvironments(envs);
      const newEnv = envs.find(e => e.id === createdEnv.id);
      if (newEnv) handleEnvironmentChange(newEnv.id);
      else if (!selectedEnvironment && envs.length > 0) handleEnvironmentChange(envs[0].id);
    } catch (e: any) { message.error("Error al crear ambiente: " + e.message); }
    finally { setLoading(false); }
  };

  const handleCreateNewDiagram = async () => {
    if (!activeCompany || !selectedEnvironment || !newDiagramName.trim()) {
      message.error("Selecciona un ambiente y escribe un nombre para el diagrama."); return;
    }
    if (isPersonalSpace && diagrams.filter(d => !d.isFolder).length >= 3) {
      message.warning("El plan Starter solo permite 3 diagramas."); setNewDiagramModalVisible(false); return;
    }
    setLoading(true);
    try {
      const newDiag = await createDiagramService(activeCompany._id || activeCompany.id!, selectedEnvironment, { 
        name: newDiagramName, 
        description: newDiagramDescription, 
        path: newDiagramPath.trim() || undefined, 
        nodes: [], 
        edges: [], 
        viewport: {x:0, y:0, zoom:1}
      });
      message.success("Diagrama creado.");
      const diags = await getDiagramsByEnvironment(activeCompany._id || activeCompany.id!, selectedEnvironment);
      setDiagrams(diags);
      handleDiagramChange(newDiag.id);
      
      setNewDiagramName(''); setNewDiagramPath(''); setNewDiagramDescription('');
      setNewDiagramModalVisible(false);
    } catch (e: any) { 
      message.error(`Error al crear diagrama: ` + e.message); 
    } finally { setLoading(false); }
  };

  const showDeleteDiagramModal = (diagramId: string) => {
    setDiagramToDeleteId(diagramId);
    setDeleteDiagramModalVisible(true);
  };

  const handleDeleteDiagramConfirm = async () => {
    if (!activeCompany || !selectedEnvironment || !diagramToDeleteId) {
      message.error("No se pudo determinar qué diagrama eliminar.");
      return;
    }
    setLoading(true);
    try {
      await deleteDiagramService(activeCompany._id || activeCompany.id!, selectedEnvironment, diagramToDeleteId);
      message.success("Diagrama eliminado.");
      setDeleteDiagramModalVisible(false);
      
      const diags = await getDiagramsByEnvironment(activeCompany._id || activeCompany.id!, selectedEnvironment);
      setDiagrams(diags);

      if (selectedDiagram === diagramToDeleteId) { 
        if (diags.length > 0) {
          handleDiagramChange(diags[0].id); 
        } else {
          setSelectedDiagram(null);
          setCurrentDiagram(null);
          // setNodes([]); // Ya no se usa
          // setEdges([]); // Ya no se usa
        }
      }
      setDiagramToDeleteId(null);
    } catch (e: any) {
      message.error("Error al eliminar el diagrama: " + e.message);
    } finally {
      setLoading(false);
    }
  };


  if (loading) { /* ... */ }
  if (user?.usage_type === 'personal' && needsPersonalSpaceSetup) { /* ... */ }
  if (user?.usage_type === 'company' && !activeCompany && !loading) { /* ... */ }

  if ((user?.usage_type === 'company' && activeCompany) || (user?.usage_type === 'personal' && activeCompany && !needsPersonalSpaceSetup)) {
    const companyDisplayName = isPersonalSpace ? "Espacio Personal" : activeCompany?.name || 'Compañía';
    const sidebarSections = isPersonalSpace 
      ? [
          { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'sky', description: 'Visualiza y gestiona tus arquitecturas personales.' },
          { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud para despliegues.' },
          { key: 'deployments', name: 'Despliegues', icon: PlayCircleOutlined, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues personales.' },
          { key: 'templates', name: 'Plantillas', icon: WrenchScrewdriverIconSolid, iconSolid: WrenchScrewdriverIconSolid, color: 'amber', description: 'Usa y gestiona plantillas de diagramas.' },
          { key: 'settings', name: 'Configuración', icon: SettingOutlined, iconSolid: SettingOutlined, color: 'gray', description: 'Ajusta tu perfil y plan.' },
        ]
      : [ 
          { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'blue', description: 'Visualiza y gestiona tus arquitecturas.' },
          { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud.' },
          { key: 'deployments', name: 'Despliegues', icon: PlayCircleOutlined, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues.' },
          { key: 'settings', name: 'Ajustes Compañía', icon: SettingOutlined, iconSolid: SettingOutlined, color: 'gray', description: 'Configura los detalles de la compañía.' },
          { key: 'team', name: 'Equipo', icon: UsersIconOutline, iconSolid: UsersIconSolid, color: 'orange', description: 'Gestiona miembros y permisos.' },
        ];

    return (
      <div className="flex bg-slate-50 dark:bg-slate-900" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <CompanySidebar 
          companyName={companyDisplayName} activeSection={activeSectionInSidebar} 
          onSectionChange={(section: string) => setActiveSectionInSidebar(section as SidebarSectionKey)} 
          isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
          sections={sidebarSections} isPersonalSpace={isPersonalSpace}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          { activeSectionInSidebar === 'diagrams' && (selectedEnvironment || environments.length > 0 || isPersonalSpace) && ( 
            <div className="bg-white dark:bg-slate-800 py-10 px-4 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between flex-shrink-0 h-16"> {/* Panel superior con padding ajustado */}
              <div className="flex items-center gap-x-4">
                {environments.length > 0 || isPersonalSpace ? (
                  <div className="flex items-center h-[40px]"> 
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2 self-center whitespace-nowrap">Ambiente:</span>
                    <EnvironmentTreeSelect 
                      environments={environments} value={selectedEnvironment ?? undefined} 
                      onChange={handleEnvironmentChange} placeholder="Seleccionar Ambiente"
                    />
                    {!(isPersonalSpace && environments.length >= 1) && (
                       <Button type="text" icon={<AntPlusOutlined />} onClick={() => setNewEnvironmentModalVisible(true)} className="ml-2 text-electric-purple-600 hover:!bg-electric-purple-50 dark:hover:!bg-electric-purple-500/20 self-center" aria-label="Crear Nuevo Ambiente" />
                    )}
                  </div>
                ) : ( <Button type="primary" onClick={() => setNewEnvironmentModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Primer Ambiente</Button> )}
                {selectedEnvironment && (diagrams.length > 0 || isPersonalSpace) ? (
                  <div className="flex items-center h-[40px]"> 
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2 self-center whitespace-nowrap">Diagrama:</span>
                    <DiagramTreeSelect 
                      diagrams={diagrams} value={selectedDiagram ?? undefined} onChange={handleDiagramChange} 
                      companyId={activeCompany?._id || activeCompany?.id || ''} environmentId={selectedEnvironment}
                      showDeleteButton={true} 
                      onDeleteDiagram={(diagramId) => showDeleteDiagramModal(diagramId)} 
                    />
                     {!(isPersonalSpace && diagrams.filter(d => !d.isFolder).length >= 3) && (
                        <Button type="text" icon={<AntPlusOutlined />} onClick={() => setNewDiagramModalVisible(true)} className="ml-2 text-electric-purple-600 hover:!bg-electric-purple-50 dark:hover:!bg-electric-purple-500/20 self-center" aria-label="Crear Nuevo Diagrama" />
                      )}
                  </div>
                ) : selectedEnvironment ? ( <Button type="primary" onClick={() => setNewDiagramModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Primer Diagrama</Button> ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button icon={<EyeOutlined />} onClick={() => message.info("Función de Preview próximamente.")}>Preview</Button>
                <Button type="primary" icon={<PlayCircleOutlined />} className="bg-emerald-green-600 hover:bg-emerald-green-700" onClick={() => message.info("Función de Run próximamente.")}>Run</Button>
              </div>
            </div>
          )}
          <div className="relative flex-1 bg-slate-100 dark:bg-slate-850 overflow-auto" style={{ height: activeSectionInSidebar === 'diagrams' ? 'calc(100% - 4rem)' : '100%' }}> {/* Ajustado a 4rem */}
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10"><Spin size="large" /></div>}
            {!loading && activeSectionInSidebar === 'diagrams' && selectedDiagram && currentDiagram && activeCompany && ( 
              <FlowEditor 
                key={`${activeCompany?._id}-${selectedEnvironment}-${selectedDiagram}`} 
                companyId={activeCompany._id!} 
                environmentId={selectedEnvironment!} 
                diagramId={selectedDiagram!} 
                initialDiagram={currentDiagram} 
                initialNodes={initialNodesForFlow} 
                initialEdges={initialEdgesForFlow} 
                onSave={handleSaveDiagram} 
                nodeTypes={nodeTypes}
                resourceCategories={resourceCategories} // Pasar resourceCategories aquí
              /> 
            )}
            {!loading && activeSectionInSidebar === 'diagrams' && activeCompany && !selectedEnvironment && environments.length === 0 && ( <div className="flex items-center justify-center h-full p-10"><div className="text-center"><AntFolderIcon className="mx-auto text-5xl text-slate-400 mb-4" /><h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Sin Ambientes</h3><p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">{isPersonalSpace ? "Tu espacio personal no tiene ambientes. " : "Esta compañía no tiene ambientes. "}Crea uno para empezar a organizar tus diagramas.</p>{!(isPersonalSpace && environments.length >=1) && <Button type="primary" onClick={() => setNewEnvironmentModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Ambiente</Button>}</div></div> )}
            {!loading && activeSectionInSidebar === 'diagrams' && activeCompany && selectedEnvironment && diagrams.length === 0 && ( <div className="flex items-center justify-center h-full p-10"><div className="text-center"><DocumentDuplicateIconOutline className="mx-auto h-16 w-16 text-slate-400 mb-4" /><h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Sin Diagramas</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Este ambiente no tiene diagramas. Crea uno para empezar a diseñar.</p>{!(isPersonalSpace && diagrams.length >=3) && <Button type="primary" onClick={() => setNewDiagramModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Diagrama</Button>}</div></div> )}
            {!loading && activeSectionInSidebar === 'credentials' && activeCompany && ( <CredentialsPage companyId={activeCompany._id!} /> )}
            {!loading && activeSectionInSidebar === 'deployments' && activeCompany && ( <DeploymentsPage companyId={activeCompany._id!} /> )}
            {!loading && activeSectionInSidebar === 'templates' && ( <div className="p-8 text-center"><h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Plantillas</h2><p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de plantillas próximamente.</p></div> )}
            {!loading && activeSectionInSidebar === 'settings' && activeCompany && ( <SettingsPage companyId={activeCompany._id!} /> )}
            {!loading && activeSectionInSidebar === 'team' && ( <div className="p-8 text-center"><h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Equipo</h2><p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de miembros del equipo (solo para planes de compañía).</p></div> )}
          </div>
        </div>

        <Modal 
          title="Crear Nuevo Ambiente" 
          open={newEnvironmentModalVisible} 
          onCancel={() => { setNewEnvironmentModalVisible(false); setNewEnvironmentName(''); setNewEnvironmentDescription(''); setNewEnvironmentCategory('desarrollo'); }} 
          onOk={handleCreateNewEnvironment} 
          confirmLoading={loading} 
          okButtonProps={{disabled: newEnvironmentName.trim() === ''}}
        >
          <Input placeholder="Nombre del Ambiente (ej. Sandbox, Desarrollo)" value={newEnvironmentName} onChange={e => setNewEnvironmentName(e.target.value)} style={{ marginBottom: 16 }}/>
          <Input.TextArea placeholder="Descripción del ambiente (opcional)" value={newEnvironmentDescription} onChange={e => setNewEnvironmentDescription(e.target.value)} rows={3} style={{ marginBottom: 16 }}/>
          <Select value={newEnvironmentCategory} onChange={(value) => setNewEnvironmentCategory(value)} style={{ width: '100%' }} aria-label="Categoría del Ambiente">
            <Select.Option value="desarrollo">Desarrollo</Select.Option>
            <Select.Option value="pruebas">Pruebas/QA</Select.Option>
            <Select.Option value="staging">Staging</Select.Option>
            <Select.Option value="producción">Producción</Select.Option>
            <Select.Option value="otros">Otros</Select.Option>
          </Select>
        </Modal>
        <Modal 
          title="Crear Nuevo Diagrama"
          open={newDiagramModalVisible} 
          onCancel={() => { 
            setNewDiagramModalVisible(false); 
            setNewDiagramName(''); 
            setNewDiagramPath(''); 
            setNewDiagramDescription('');
          }} 
          onOk={handleCreateNewDiagram} 
          confirmLoading={loading} 
          okButtonProps={{disabled: newDiagramName.trim() === ''}}
          destroyOnHidden
        >
          <Input 
            placeholder="Nombre del Diagrama*" 
            value={newDiagramName} 
            onChange={e => setNewDiagramName(e.target.value)} 
            style={{ marginBottom: 16 }}
          />
          <Input 
            placeholder="Directorio/Ruta (opcional, ej. devops/hpa)" 
            value={newDiagramPath} 
            onChange={e => setNewDiagramPath(e.target.value)} 
            addonBefore={newDiagramPath ? <FolderIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" /> : null}
            style={{ marginBottom: 8 }}
          />
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: '0.75rem' }}>
            Organiza tus diagramas en directorios. Usa "/" para crear subdirectorios. <br/>
            Ejemplos: devops, infrastructure/aws, networks/security
          </Text>
          <Input.TextArea
            placeholder="Descripción (opcional)"
            value={newDiagramDescription}
            onChange={e => setNewDiagramDescription(e.target.value)}
            rows={3}
          />
        </Modal>
        
        <Modal
          title="Confirmar Eliminación"
          open={deleteDiagramModalVisible}
          onOk={handleDeleteDiagramConfirm}
          onCancel={() => { setDeleteDiagramModalVisible(false); setDiagramToDeleteId(null); }}
          confirmLoading={loading}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <p>¿Estás seguro de que quieres eliminar este diagrama? Esta acción no se puede deshacer.</p>
        </Modal>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
      {error ? <p className="text-red-500 p-4 bg-red-100 border border-red-300 rounded-md">{error}</p> 
             : <>
                 <Spin size="large" />
                 <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando...</p>
               </>}
    </div>
  );
}
