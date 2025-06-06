'use client';

import React, { useState, useEffect, useCallback, JSX, useMemo } from 'react'; 
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; 
import { Button, Modal, Input, Spin, message, Typography } from 'antd';
import { 
  PlusOutlined as AntPlusOutlined, 
  EyeOutlined, 
  PlayCircleOutlined, 
  FolderOpenOutlined as AntFolderIcon, 
  SettingOutlined,
} from '@ant-design/icons'; 
import { 
  FolderIcon, 
  UserCircleIcon as UserCircleIconOutline, 
  DocumentDuplicateIcon as DocumentDuplicateIconOutline, 
  UsersIcon as UsersIconOutline,
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
  GlobeAltIcon, 
  RectangleStackIcon, 
  ShieldCheckIcon, 
  ArrowsRightLeftIcon, 
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

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
import EnvironmentsPage from '../../components/ui/EnvironmentsPage'; 

import { getCompanies, Company, createCompany, PERSONAL_SPACE_COMPANY_NAME_PREFIX } from '../../services/companyService'; // Importar PERSONAL_SPACE_COMPANY_NAME_PREFIX
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram as createDiagramService, updateDiagram, deleteDiagram as deleteDiagramService } from '../../services/diagramService';
import { getCurrentUser, isAuthenticated, User } from '../../services/authService';

import nodeTypes from '../../components/nodes/NodeTypes'; 
import { Node as CustomNode, Edge as CustomEdge } from '../../services/diagramService';
import { 
  Node as ReactFlowNode, 
  Edge as ReactFlowEdge, 
  Viewport as ReactFlowViewport, 
} from 'reactflow';

const { Text } = Typography;

type SidebarSectionKey = 'diagrams' | 'settings' | 'templates' | 'credentials' | 'deployments' | 'team' | 'environments';
const VALID_SECTIONS: SidebarSectionKey[] = ['diagrams', 'settings', 'templates', 'credentials', 'deployments', 'team', 'environments'];


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
    ]
  }
];


export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  
  const convertToReactFlowNodes = (customNodes: CustomNode[]): ReactFlowNode[] => {
    return customNodes.map(node => ({
      ...node,
      parentId: node.parentNode, 
      data: { ...node.data }
    } as ReactFlowNode));
  };
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

  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  const [newDiagramPath, setNewDiagramPath] = useState<string>('');
  const [newDiagramDescription, setNewDiagramDescription] = useState<string>('');

  const [deleteDiagramModalVisible, setDeleteDiagramModalVisible] = useState<boolean>(false); 
  const [diagramToDeleteId, setDiagramToDeleteId] = useState<string | null>(null); 
  
  const [activeSectionInSidebar, setActiveSectionInSidebar] = useState<SidebarSectionKey>('diagrams');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [needsPersonalSpaceSetup, setNeedsPersonalSpaceSetup] = useState(false);
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (user && user._id && !loading && !error && !needsPersonalSpaceSetup) {
      const welcomeModalSeenKey = `welcomeModalSeen_${user._id}`;
      const welcomeModalAlreadySeen = localStorage.getItem(welcomeModalSeenKey);

      if (!welcomeModalAlreadySeen) {
        setIsWelcomeModalVisible(true);
      }
    }
  }, [user, loading, error, needsPersonalSpaceSetup]);

  useEffect(() => {
    const sectionFromQuery = searchParams.get('section') as SidebarSectionKey;
    if (sectionFromQuery && VALID_SECTIONS.includes(sectionFromQuery)) {
      setActiveSectionInSidebar(sectionFromQuery);
    }
  }, [searchParams]);

  useEffect(() => { // Primer useEffect para obtener el usuario
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [router]);

  useEffect(() => { // useEffect principal para cargar datos y manejar redirecciones
    if (!user) { 
      if (isAuthenticated()) {
        // User no está seteado aún, pero está autenticado. setLoading(true) es el estado inicial.
      } else {
        router.push('/login'); // No autenticado, redirigir.
      }
      return; 
    }

    if (user.usage_type === null) {
      router.replace('/onboarding/select-usage');
      return; 
    }

    if(!loading) setLoading(true); 
    setError(null);

    async function fetchDataAndDetermineAction(): Promise<boolean> { 
      if (!user) { // Guarda para TypeScript
        // message.error("Error interno: Usuario no disponible en fetchData."); // Opcional: log/mensaje
        return false; 
      }
      try {
        if (user.usage_type === 'personal') {
          const personalCompany = await findPersonalCompany(user); // user ya no es null aquí
          if (!personalCompany) {
            const companies = await getCompanies(); 
            const existingPersonalCompany = companies.find(c => c.name === `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${user._id}`); // user ya no es null aquí
            if (!existingPersonalCompany) {
                message.info("Configura tu espacio personal para continuar.");
                router.replace('/create-company?setup_personal_space=true'); 
                return false; 
            }
            setActiveCompany(existingPersonalCompany);
            setIsPersonalSpace(true);
            await loadCompanyOrPersonalSpaceData(existingPersonalCompany);
            setNeedsPersonalSpaceSetup(false); 
          } else {
            setActiveCompany(personalCompany);
            setIsPersonalSpace(true);
            await loadCompanyOrPersonalSpaceData(personalCompany);
            setNeedsPersonalSpaceSetup(false);
          }
        } else if (user.usage_type === 'company') {
          const companies = await getCompanies();
          if (companies.length > 0) {
            const firstCompany = companies[0]; 
            setActiveCompany(firstCompany);
            setIsPersonalSpace(false);
            await loadCompanyOrPersonalSpaceData(firstCompany);
          } else {
            message.info("Debes crear o ser añadido a una compañía para continuar.");
            router.replace('/create-company');
            return false; 
          }
        }
        return true; 
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        message.error("Error cargando datos del dashboard: " + errorMessage);
        return false; 
      }
    }

    fetchDataAndDetermineAction().then(shouldShowDashboard => {
      if (shouldShowDashboard) {
        setLoading(false);
      }
      // Si shouldShowDashboard es false, la redirección ya ocurrió o se mostrará un error.
      // setLoading permanecerá true para evitar flickering hasta que el componente se desmonte,
      // o hasta que el error se muestre y el usuario navegue.
    });

  }, [user, router]); 

  async function findPersonalCompany(currentUser: User): Promise<Company | null> {
    const currentUserId = currentUser._id; 
    if (!currentUserId) return null;
    const companies = await getCompanies(); 
    return companies.find(c => c.name === `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${currentUserId}`) || null;
  }

  async function handleCreatePersonalSpace() {
    if (!user) { 
      message.error("Información del usuario no disponible (null). No se puede crear el espacio personal.");
      setLoading(false); 
      return;
    }
    const userIdToUse = user._id; 
    setLoading(true);
    try {
      const personalCompanyName = `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${userIdToUse}`;
      let companyToUse = await findPersonalCompany(user); // user no es null aquí
      let companyIdToUse: string;

      if (!companyToUse) {
        const newCompany = await createCompany({ name: personalCompanyName, description: "Espacio personal automático" });
        companyIdToUse = newCompany._id; 
        companyToUse = newCompany; 
      } else {
        companyIdToUse = companyToUse._id; 
      }
      setActiveCompany(companyToUse); 
      
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Usuario no autenticado. Por favor, inicie sesión.");
        localStorage.removeItem('token');
        router.push('/login');
        setLoading(false);
        return;
      }

      const existingEnvs = await getEnvironments(companyIdToUse); 
      const sandboxEnv = existingEnvs.find(env => env.name.toLowerCase() === "sandbox");

      if (!sandboxEnv) {
        const envPayload = { name: "Sandbox", description: "Ambiente personal de pruebas y desarrollo" };
        const response = await fetch(`/api/v1/companies/${companyIdToUse}/environments`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-InfraUX-Company-ID': companyIdToUse
          },
          body: JSON.stringify(envPayload),
        });
        if (!response.ok) {
          if (response.status === 401) {
            message.error("Sesión inválida o expirada. Por favor, inicie sesión nuevamente.");
            localStorage.removeItem('token');
            router.push('/login');
            setLoading(false);
            return;
          }
          const errorData = await response.json().catch(() => ({detail: 'Error creando ambiente Sandbox'}));
          throw new Error(errorData.detail || 'Failed to create default Sandbox environment for personal space.');
        }
        message.info("Ambiente Sandbox creado para el espacio personal.");
      }
      
      message.success("Espacio personal configurado. ¡Listo para empezar!");
      setNeedsPersonalSpaceSetup(false);
      const updatedUser = getCurrentUser(); 
      if (updatedUser) { 
        setUser(updatedUser); 
      } else {
        router.push('/login');
      }
    } catch (e: unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al configurar espacio personal: " + errorMessage); 
    } finally { setLoading(false); }
  }

  async function loadCompanyOrPersonalSpaceData(company: Company) {
    const companyId = company._id; 
    const envs = await getEnvironments(companyId); 
    setEnvironments(envs);

    if (isPersonalSpace && envs.length === 0) {
      const token = localStorage.getItem('token');
      if (token && user) { 
        try {
          const envPayload = { name: "Sandbox", description: "Ambiente personal de pruebas y desarrollo" };
          const response = await fetch(`/api/v1/companies/${companyId}/environments`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-InfraUX-Company-ID': companyId 
            },
            body: JSON.stringify(envPayload),
          });
          if (!response.ok) {
            if (response.status === 401) {
              message.error("Sesión inválida o expirada. Por favor, inicie sesión nuevamente.");
              localStorage.removeItem('token');
              router.push('/login');
              return; 
            }
            console.error("No se pudo crear el ambiente Sandbox automáticamente para el espacio personal (error general).");
            throw new Error('Error creando ambiente Sandbox para espacio personal.');
          }
          message.info("Ambiente Sandbox creado automáticamente.");
          const updatedEnvs = await getEnvironments(companyId); 
          setEnvironments(updatedEnvs);
            if (updatedEnvs.length > 0) {
              const defaultEnvId = updatedEnvs[0].id; 
              setSelectedEnvironment(defaultEnvId);
              const diags = await getDiagramsByEnvironment(companyId, defaultEnvId);
              setDiagrams(diags);
              if (diags.length > 0) {
                setSelectedDiagram(diags[0].id);
                const diagramData = await getDiagram(companyId, defaultEnvId, diags[0].id);
                setCurrentDiagram(diagramData);
              } else {
                setCurrentDiagram(null); setSelectedDiagram(null);
              }
            }
            return; 
        } catch (creationError) { 
          console.error("Error al intentar crear ambiente Sandbox para espacio personal:", creationError);
        }
      } 
    } 

    if (envs.length > 0) {
      const defaultEnvId = envs[0].id; 
      setSelectedEnvironment(defaultEnvId);
      const diags = await getDiagramsByEnvironment(companyId, defaultEnvId);
      setDiagrams(diags);
      if (diags.length > 0) {
        setSelectedDiagram(diags[0].id);
        const diagramData = await getDiagram(companyId, defaultEnvId, diags[0].id);
        setCurrentDiagram(diagramData);
      } else {
        setCurrentDiagram(null); 
        setSelectedDiagram(null);
      }
    } else {
      setDiagrams([]); setSelectedDiagram(null); setCurrentDiagram(null);
      setSelectedEnvironment(null);
    }
  }
  
  const handleEnvironmentChange = async (environmentId: string) => {
    if (!activeCompany) return;
    setSelectedEnvironment(environmentId); setLoading(true);
    try {
      const diags = await getDiagramsByEnvironment(activeCompany._id, environmentId); 
      setDiagrams(diags);
      if (diags.length > 0) {
        setSelectedDiagram(diags[0].id);
        const diagramData = await getDiagram(activeCompany._id, environmentId, diags[0].id); 
        setCurrentDiagram(diagramData);
      } else {
        setCurrentDiagram(null); setSelectedDiagram(null);
      }
    } catch (e:unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al cambiar de ambiente: " + errorMessage); 
    }
    finally { setLoading(false); }
  };

  const handleDiagramChange = async (diagramId: string) => {
    if (!activeCompany || !selectedEnvironment) return;
    setSelectedDiagram(diagramId); setLoading(true);
    try {
      const diagramData = await getDiagram(activeCompany._id, selectedEnvironment, diagramId); 
      setCurrentDiagram(diagramData);
    } catch (e:unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al cambiar de diagrama: " + errorMessage); 
    }
    finally { setLoading(false); }
  };
  
  const handleSaveDiagram = useCallback(async (data: { nodes: ReactFlowNode[], edges: ReactFlowEdge[], viewport?: ReactFlowViewport }) => {
    if (!activeCompany || !selectedEnvironment || !selectedDiagram || !currentDiagram) return;
    const customNodes = data.nodes.map(n => ({ 
      id: n.id, 
      type: n.type!, 
      position: n.position, 
      data: n.data, 
      width: n.width, 
      height: n.height, 
      parentNode: n.parentId, 
      style: n.style 
    } as CustomNode));
    const customEdges = data.edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, animated: e.animated, label: e.label as string, data: e.data, style: e.style } as CustomEdge));
    try {
      await updateDiagram(activeCompany._id, selectedEnvironment, selectedDiagram, { 
        name: currentDiagram.name, description: currentDiagram.description, nodes: customNodes, edges: customEdges, viewport: data.viewport || currentDiagram.viewport
      });
      message.success("Diagrama guardado.");
    } catch (e:unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al guardar el diagrama: " + errorMessage); 
    }
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
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Usuario no autenticado.");
        router.push('/login');
        setLoading(false);
        return;
      }
      const envPayload = {
        name: newEnvironmentName,
        description: newEnvironmentDescription,
      };
      const response = await fetch(`/api/v1/companies/${activeCompany._id}/environments`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-InfraUX-Company-ID': activeCompany._id 
        },
        body: JSON.stringify(envPayload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error("Sesión inválida o expirada. Por favor, inicie sesión nuevamente.");
          localStorage.removeItem('token');
          router.push('/login');
          setLoading(false);
          return; 
        }
        const errorData = await response.json().catch(() => ({detail: 'Error creando ambiente'}));
        throw new Error(errorData.detail || 'Failed to create environment via API');
      }
      const createdEnv = await response.json();

      message.success("Ambiente creado.");
      setNewEnvironmentName(''); setNewEnvironmentDescription(''); 
      setNewEnvironmentModalVisible(false);
      
      const envs = await getEnvironments(activeCompany._id); 
      setEnvironments(envs);
      const newEnv = envs.find(e => e.id === createdEnv.id);
      if (newEnv) handleEnvironmentChange(newEnv.id);
      else if (!selectedEnvironment && envs.length > 0) handleEnvironmentChange(envs[0].id);

    } catch (e: unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al crear ambiente: " + errorMessage); 
    }
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
      const newDiag = await createDiagramService(activeCompany._id, selectedEnvironment, { 
        name: newDiagramName, 
        description: newDiagramDescription, 
        path: newDiagramPath.trim() || undefined, 
        nodes: [], 
        edges: [], 
        viewport: {x:0, y:0, zoom:1}
      });
      message.success("Diagrama creado.");
      const diags = await getDiagramsByEnvironment(activeCompany._id, selectedEnvironment); 
      setDiagrams(diags);
      handleDiagramChange(newDiag.id);
      
      setNewDiagramName(''); setNewDiagramPath(''); setNewDiagramDescription('');
      setNewDiagramModalVisible(false);
    } catch (e: unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error(`Error al crear diagrama: ` + errorMessage); 
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
      await deleteDiagramService(activeCompany._id, selectedEnvironment, diagramToDeleteId); 
      message.success("Diagrama eliminado.");
      setDeleteDiagramModalVisible(false);
      
      const diags = await getDiagramsByEnvironment(activeCompany._id, selectedEnvironment); 
      setDiagrams(diags);

      if (selectedDiagram === diagramToDeleteId) { 
        if (diags.length > 0) {
          handleDiagramChange(diags[0].id); 
        } else {
          setSelectedDiagram(null);
          setCurrentDiagram(null);
        }
      }
      setDiagramToDeleteId(null);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al eliminar el diagrama: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionString: string) => {
    const section = sectionString as SidebarSectionKey;
    if (VALID_SECTIONS.includes(section)) {
      setActiveSectionInSidebar(section);
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("section", section);
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`);
    } else {
      console.warn(`Intento de navegar a sección inválida: ${sectionString}`);
    }
  };


  if (loading) { 
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 z-[60]"> {/* Cubrir toda la pantalla y estar encima del Nav (z-50) */}
        <Spin size="large" />
        <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando dashboard...</p>
      </div>
    );
  }
  
  if (error) { 
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-8">
        <p className="text-red-500 p-4 bg-red-100 border border-red-300 rounded-md">{error}</p>
      </div>
    );
  }

  if (user?.usage_type === 'personal' && needsPersonalSpaceSetup) { 
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-md">
          <ServerStackIcon className="h-16 w-16 text-electric-purple-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Configura tu Espacio Personal</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Para empezar a usar InfraUX, necesitamos configurar tu espacio de trabajo personal. 
            Esto creará una compañía y un ambiente "Sandbox" por defecto para ti.
          </p>
          <Button type="primary" size="large" onClick={handleCreatePersonalSpace} loading={loading} className="bg-electric-purple-600 hover:bg-electric-purple-700 w-full">
            {loading ? 'Configurando...' : 'Configurar Mi Espacio'}
          </Button>
        </div>
      </div>
    );
  }
  
  if (user?.usage_type === 'company' && !activeCompany) { 
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl text-center max-w-md">
          <UsersIconOutline className="h-16 w-16 text-electric-purple-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Sin Compañías Asignadas</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            No estás asignado a ninguna compañía. Por favor, contacta a un administrador para que te añada a una o crea una nueva si tienes permisos.
          </p>
        </div>
      </div>
    );
  }

  if ((user?.usage_type === 'company' && activeCompany) || (user?.usage_type === 'personal' && activeCompany && !needsPersonalSpaceSetup)) {
    const companyDisplayName = isPersonalSpace ? "Espacio Personal" : activeCompany?.name || 'Compañía';
    const sidebarSections = isPersonalSpace 
      ? [
          { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'sky', description: 'Visualiza y gestiona tus arquitecturas personales.' },
          { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud para despliegues.' },
          { key: 'environments', name: 'Ambientes', icon: ServerStackIcon, iconSolid: ServerStackIcon, color: 'teal', description: 'Gestiona tu ambiente Sandbox.' },
          { key: 'deployments', name: 'Despliegues', icon: PlayCircleOutlined, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues personales.' },
          { key: 'templates', name: 'Plantillas', icon: WrenchScrewdriverIconSolid, iconSolid: WrenchScrewdriverIconSolid, color: 'amber', description: 'Usa y gestiona plantillas de diagramas.' },
          { key: 'settings', name: 'Configuración', icon: SettingOutlined, iconSolid: SettingOutlined, color: 'gray', description: 'Ajusta tu perfil y plan.' },
        ]
      : [ 
          { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'blue', description: 'Visualiza y gestiona tus arquitecturas.' },
          { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud.' },
          { key: 'environments', name: 'Ambientes', icon: ServerStackIcon, iconSolid: ServerStackIcon, color: 'teal', description: 'Gestiona tus ambientes de despliegue.' }, 
          { key: 'deployments', name: 'Despliegues', icon: PlayCircleOutlined, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues.' },
          { key: 'settings', name: 'Ajustes Compañía', icon: SettingOutlined, iconSolid: SettingOutlined, color: 'gray', description: 'Configura los detalles de la compañía.' },
          { key: 'team', name: 'Equipo', icon: UsersIconOutline, iconSolid: UsersIconSolid, color: 'orange', description: 'Gestiona miembros y permisos.' },
        ];

    return (
      <>
        <Modal
        open={isWelcomeModalVisible}
        onCancel={() => {
          setIsWelcomeModalVisible(false);
          if (user && user._id) {
            localStorage.setItem(`welcomeModalSeen_${user._id}`, 'true');
          }
        }}
        footer={null}
          centered
          width={600}
          closable={true}
          className="welcome-modal"
        >
          <div className="p-2 text-center">
            <SparklesIcon className="h-16 w-16 text-electric-purple-500 dark:text-electric-purple-400 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              ¡Bienvenido a <span className="font-extrabold">Infra</span><span className="text-emerald-green-600 dark:text-emerald-green-500">UX</span>!
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg px-4">
              Estás a punto de transformar la forma en que diseñas, despliegas y gestionas tu infraestructura cloud.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-electric-purple-600 dark:text-electric-purple-400 mb-1">Diseña Visualmente</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Crea arquitecturas complejas arrastrando y soltando componentes.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-emerald-green-600 dark:text-emerald-green-500 mb-1">Despliega con Confianza</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Genera código IaC y despliega directamente a tus proveedores cloud.</p>
              </div>
            </div>
            <Button 
              type="primary" 
              size="large" 
            onClick={() => {
              setIsWelcomeModalVisible(false);
              if (user && user._id) {
                localStorage.setItem(`welcomeModalSeen_${user._id}`, 'true');
              }
            }}
            className="bg-electric-purple-600 hover:bg-electric-purple-700 dark:bg-electric-purple-500 dark:hover:bg-electric-purple-600"
            >
              Comenzar a Explorar
            </Button>
          </div>
        </Modal>

        <div className="flex bg-slate-50 dark:bg-slate-900" style={{ height: 'calc(100vh - 3.5rem)' }}>
          <CompanySidebar 
            companyName={companyDisplayName} activeSection={activeSectionInSidebar} 
            onSectionChange={handleSectionChange} 
            isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
            sections={sidebarSections} isPersonalSpace={isPersonalSpace}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            { activeSectionInSidebar === 'diagrams' && (selectedEnvironment || environments.length > 0 || isPersonalSpace) && ( 
              <div className="bg-white dark:bg-white py-3 px-4 border-b border-slate-200 dark:border-slate-300 shadow-sm flex items-center justify-between flex-shrink-0 h-16"> 
                <div className="flex items-center gap-x-4">
                  {environments.length > 0 || isPersonalSpace ? (
                    <div className="flex items-center h-[40px]"> 
                      <span className="text-base font-medium text-slate-600 dark:text-slate-500 mr-2 self-center whitespace-nowrap">Ambiente:</span>
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
                      <span className="text-base font-medium text-slate-600 dark:text-slate-500 mr-2 self-center whitespace-nowrap">Diagrama:</span>
                      <DiagramTreeSelect 
                        diagrams={diagrams} value={selectedDiagram ?? undefined} onChange={handleDiagramChange} 
                        companyId={activeCompany._id} environmentId={selectedEnvironment} 
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
            <div className="relative flex-1 bg-slate-100 dark:bg-slate-850 overflow-auto" style={{ height: activeSectionInSidebar === 'diagrams' ? 'calc(100% - 4rem)' : '100%' }}> 
              {loading && activeSectionInSidebar === 'diagrams' && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10"><Spin size="large" /></div>}
              {!loading && activeSectionInSidebar === 'diagrams' && selectedDiagram && currentDiagram && activeCompany && ( 
                <FlowEditor 
                  key={`${activeCompany._id}-${selectedEnvironment}-${selectedDiagram}`} 
                  companyId={activeCompany._id} 
                  environmentId={selectedEnvironment!} 
                  diagramId={selectedDiagram!} 
                  initialDiagram={currentDiagram} 
                  initialNodes={initialNodesForFlow} 
                  initialEdges={initialEdgesForFlow} 
                  onSave={handleSaveDiagram} 
                  nodeTypes={nodeTypes}
                  resourceCategories={resourceCategories} 
                /> 
              )}
              {!loading && activeSectionInSidebar === 'diagrams' && activeCompany && !selectedEnvironment && environments.length === 0 && ( 
                <div className="flex items-center justify-center h-full p-6 sm:p-10 bg-slate-100 dark:bg-slate-850">
                  <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-8 sm:p-12 max-w-md w-full text-center">
                    <AntFolderIcon className="mx-auto text-5xl sm:text-6xl text-electric-purple-500 dark:text-electric-purple-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Define tu Primer Ambiente</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-8 text-sm sm:text-base">
                      {isPersonalSpace ? "Tu espacio personal está listo para organizar tus ideas. " : "Esta compañía aún no tiene ambientes definidos. "}
                      Un ambiente te ayuda a separar contextos, como Desarrollo, Pruebas o Producción. Crea uno para empezar.
                    </p>
                    {!(isPersonalSpace && environments.length >= 1) && (
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<AntPlusOutlined />}
                        onClick={() => setNewEnvironmentModalVisible(true)} 
                        className="w-full bg-electric-purple-600 hover:bg-electric-purple-700 focus:ring-electric-purple-500"
                      >
                        Crear Ambiente
                      </Button>
                    )}
                  </div>
                </div> 
              )}
              {!loading && activeSectionInSidebar === 'diagrams' && activeCompany && selectedEnvironment && diagrams.length === 0 && ( 
                <div className="flex items-center justify-center h-full p-6 sm:p-10 bg-slate-100 dark:bg-slate-850">
                  <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-8 sm:p-12 max-w-md w-full text-center">
                    <DocumentDuplicateIconOutline className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-electric-purple-500 dark:text-electric-purple-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">Diseña tu Primera Arquitectura</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-8 text-sm sm:text-base">
                      Este ambiente está listo para tus diagramas. Comienza a visualizar tu infraestructura, aplicaciones o flujos de trabajo.
                    </p>
                    {!(isPersonalSpace && diagrams.filter(d => !d.isFolder).length >= 3) && (
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<AntPlusOutlined />}
                        onClick={() => setNewDiagramModalVisible(true)} 
                        className="w-full bg-electric-purple-600 hover:bg-electric-purple-700 focus:ring-electric-purple-500"
                      >
                        Crear Diagrama
                      </Button>
                    )}
                  </div>
                </div> 
              )}
              
              {!loading && activeSectionInSidebar === 'credentials' && activeCompany && ( <CredentialsPage companyId={activeCompany._id} /> )}
              {!loading && activeSectionInSidebar === 'environments' && activeCompany && activeCompany._id && ( <EnvironmentsPage companyId={activeCompany._id} isPersonalSpace={isPersonalSpace} /> )}
              {!loading && activeSectionInSidebar === 'deployments' && activeCompany && ( <DeploymentsPage companyId={activeCompany._id} /> )}
              {!loading && activeSectionInSidebar === 'templates' && ( <div className="p-8 text-center"><h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Plantillas</h2><p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de plantillas próximamente.</p></div> )}
              {!loading && activeSectionInSidebar === 'settings' && activeCompany && ( <SettingsPage companyId={activeCompany._id} /> )}
              {!loading && activeSectionInSidebar === 'team' && !isPersonalSpace && ( <div className="p-8 text-center"><h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Equipo</h2><p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de miembros del equipo (solo para planes de compañía).</p></div> )}
            </div>
          </div>

          <Modal 
            title="Crear Nuevo Ambiente" 
            open={newEnvironmentModalVisible} 
            onCancel={() => { setNewEnvironmentModalVisible(false); setNewEnvironmentName(''); setNewEnvironmentDescription(''); }} 
            onOk={handleCreateNewEnvironment} 
            confirmLoading={loading} 
            okButtonProps={{disabled: newEnvironmentName.trim() === '' || (isPersonalSpace && environments.length >= 1) }}
          >
            <Input placeholder="Nombre del Ambiente (ej. Sandbox, Desarrollo)" value={newEnvironmentName} onChange={e => setNewEnvironmentName(e.target.value)} style={{ marginBottom: 16 }} disabled={isPersonalSpace && environments.length >= 1}/>
            <Input.TextArea placeholder="Descripción del ambiente (opcional)" value={newEnvironmentDescription} onChange={e => setNewEnvironmentDescription(e.target.value)} rows={3} style={{ marginBottom: 16 }} disabled={isPersonalSpace && environments.length >= 1}/>
            {isPersonalSpace && environments.length >= 1 && (
              <p className="text-sm text-orange-600 mt-2">Los espacios personales solo pueden tener un ambiente (Sandbox).</p>
            )}
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
              Organiza tus diagramas en directorios. Usa / para crear subdirectorios. <br/>
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
      </>
    );
  }

  // Fallback: si ninguna de las condiciones anteriores se cumple (ej. user es null después de la carga inicial)
  // o si hay un error no manejado por el return de error específico.
  // Esto también cubre el estado inicial mientras user se está cargando.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
      <Spin size="large" />
      <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando...</p>
    </div>
  );
}
