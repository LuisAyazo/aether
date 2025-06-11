'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Spin, message, Typography, Modal, Button } from 'antd';
import { 
  FolderIcon as FolderIconOutline, 
  UserCircleIcon as UserCircleIconOutline, 
  DocumentDuplicateIcon as DocumentDuplicateIconOutline, 
  UsersIcon as UsersIconOutline,
  ServerStackIcon, 
  SparklesIcon,
  CloudIcon, 
  CircleStackIcon,
  TableCellsIcon,
  BoltIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  RectangleStackIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  ServerIcon,
  CubeIcon,
  CpuChipIcon,
  ArrowsRightLeftIcon,
  ComputerDesktopIcon,
  ArchiveBoxIcon,
  RssIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { SettingOutlined, CheckOutlined } from '@ant-design/icons'; 

import {
  UserCircleIcon as UserCircleIconSolid,
  UsersIcon as UsersIconSolid, 
  PlayCircleIcon as PlayCircleIconSolid,
  DocumentDuplicateIcon as DocumentDuplicateIconSolid,
  // ChartBarIcon as SolidChartBarIcon, // Eliminado si no se usa
} from '@heroicons/react/24/solid';

import FlowEditor from '../../components/flow/FlowEditor';
import CompanySidebar from '../../components/ui/CompanySidebar';
import CredentialsPage from '../../components/ui/CredentialsPage';
import DeploymentsPage from '../../components/ui/DeploymentsPage';
import SettingsPage from '../../components/ui/SettingsPage';
import EnvironmentsPage from '../../components/ui/EnvironmentsPage';
import DiagramActionSubheader from '../../components/ui/DiagramActionSubheader'; // Importar el nuevo subheader

import { Node as CustomNode, Edge as CustomEdge } from '../../services/diagramService';
import { useNavigationStore } from '../../hooks/useNavigationStore';
import { updateDiagram } from '../../services/diagramService';

import nodeTypes from '../../components/nodes/NodeTypes';
// RESOURCE_REGISTRY no se usará directamente para construir categories, se usará la estructura manual
// import { RESOURCE_REGISTRY, SupportedProvider } from '../../config/schemas'; 
import type { ResourceCategory } from '../../components/flow/types/editorTypes'; // ResourceItem eliminado

const { Text } = Typography;

type SidebarSectionKey = 'diagrams' | 'settings' | 'templates' | 'credentials' | 'deployments' | 'team' | 'environments';
const VALID_SECTIONS: SidebarSectionKey[] = ['diagrams', 'settings', 'templates', 'credentials', 'deployments', 'team', 'environments'];

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const user = useNavigationStore(state => state.user);
  const activeCompany = useNavigationStore(state => state.activeCompany);
  const isPersonalSpace = useNavigationStore(state => state.isPersonalSpace);
  const environments = useNavigationStore(state => state.environments);
  const diagramsFromStore = useNavigationStore(state => state.diagrams);
  const selectedEnvironment = useNavigationStore(state => state.selectedEnvironment);
  const selectedDiagram = useNavigationStore(state => state.selectedDiagram);
  const currentDiagram = useNavigationStore(state => state.currentDiagram);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  const dataError = useNavigationStore(state => state.dataError);
  const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);
  
  const [activeSectionInSidebar, setActiveSectionInSidebar] = useState<SidebarSectionKey>('diagrams');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState<boolean>(false);
  const [showOnboardingFlow, setShowOnboardingFlow] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertToReactFlowNodes = (customNodes: CustomNode[]): any[] => { 
    console.log('🔍 [LOAD DEBUG] Converting nodes from backend:', customNodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      parentNode: n.parentNode
    })));
    
    return customNodes.map(node => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reactFlowNode: any = {
        ...node,
        parentId: node.parentNode, 
        data: { ...node.data }
      };

      // Check if this node is a child of a minimized group and apply hidden state immediately
      if (node.parentNode) {
        const parentNode = customNodes.find(n => n.id === node.parentNode);
        if (parentNode?.data?.isMinimized) {
          reactFlowNode.hidden = true;
          reactFlowNode.style = {
            ...reactFlowNode.style,
            visibility: 'hidden',
            pointerEvents: 'none',
            opacity: 0
          };
        }
      }

      console.log('🔍 [LOAD DEBUG] Converted node:', {
        id: reactFlowNode.id,
        position: reactFlowNode.position,
        parentId: reactFlowNode.parentId,
        parentNode: node.parentNode
      });

      return reactFlowNode; 
    }); 
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertToReactFlowEdges = (customEdges: CustomEdge[]): any[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return customEdges.map(e => ({...e} as any)); 
  }

  const initialNodesForFlow = useMemo(() => {
    return currentDiagram?.nodes ? convertToReactFlowNodes(currentDiagram.nodes) : [];
  }, [currentDiagram?.nodes]);

  const initialEdgesForFlow = useMemo(() => {
    return currentDiagram?.edges ? convertToReactFlowEdges(currentDiagram.edges) : [];
  }, [currentDiagram?.edges]);
  
  // Log del viewport inicial y validación
  useEffect(() => {
    if (currentDiagram?.viewport) {
      // Validar que el viewport sea válido (debe tener x, y, zoom como números)
      const viewport = currentDiagram.viewport;
      if (
        typeof viewport === 'object' && 
        typeof viewport.x === 'number' && 
        typeof viewport.y === 'number' && 
        typeof viewport.zoom === 'number'
      ) {
        console.log('📍 [VIEWPORT LOAD] Loading valid viewport from currentDiagram:', viewport);
      } else {
        console.log('📍 [VIEWPORT LOAD] Invalid viewport detected, using default:', viewport);
        // Si el viewport es inválido, usar valores por defecto
        if (currentDiagram) {
          currentDiagram.viewport = { x: 0, y: 0, zoom: 1 };
        }
      }
    } else {
      console.log('📍 [VIEWPORT LOAD] No viewport in currentDiagram');
    }
  }, [currentDiagram]);
  
  useEffect(() => {
    console.log('[Dashboard] User state:', { user, dataLoading, activeCompany });
    if (!user && !dataLoading) {
      console.log('[Dashboard] No user and not loading, fetching initial user...');
      fetchInitialUser(); 
    }
  }, [user, dataLoading, fetchInitialUser]);

  // Estado para rastrear si ya verificamos las compañías
  const [hasCheckedCompanies, setHasCheckedCompanies] = useState(false);

  // Detectar cuando un usuario no tiene compañías (posiblemente eliminado) y redirigir
  useEffect(() => {
    console.log('[Dashboard] Company check:', { 
      dataLoading, 
      user: user?.email, 
      activeCompany: activeCompany?.name,
      hasCheckedCompanies,
      userCompanies: useNavigationStore.getState().userCompanies?.length 
    });
    
    // Solo verificar después de que la carga inicial se complete
    if (!dataLoading && user && !hasCheckedCompanies) {
      setHasCheckedCompanies(true);
      
      // Si después de cargar no hay compañía activa
      if (!activeCompany) {
        // Verificar si acabamos de crear una compañía
        const justCreatedCompany = localStorage.getItem('justCreatedCompany');
        if (justCreatedCompany) {
          // Si acabamos de crear una compañía, dar más tiempo para que se actualice el estado
          localStorage.removeItem('justCreatedCompany');
          console.log('Compañía recién creada, esperando actualización del estado...');
          
          // Intentar refrescar los datos del usuario
          fetchInitialUser();
          
          // Dar más tiempo antes de decidir redirigir
          const timeoutId = setTimeout(() => {
            // Verificar de nuevo después del delay
            const currentState = useNavigationStore.getState();
            if (!currentState.activeCompany) {
              console.log('Aún sin compañía activa después de esperar, redirigiendo...');
              router.push('/create-company');
            }
          }, 3000); // Esperar 3 segundos
          
          return () => clearTimeout(timeoutId);
        } else {
          // Si no acabamos de crear una compañía, verificar si realmente no tiene compañías
          const currentState = useNavigationStore.getState();
          console.log('[Dashboard] Current state check:', {
            userCompanies: currentState.userCompanies,
            activeCompany: currentState.activeCompany,
            dataLoading: currentState.dataLoading
          });
          
          if (currentState.userCompanies && currentState.userCompanies.length === 0) {
            // Solo redirigir si confirmamos que no hay compañías
            console.log('[Dashboard] Usuario confirmado sin compañías, redirigiendo...');
            const timeoutId = setTimeout(() => {
              router.push('/create-company');
            }, 500);
            
            return () => clearTimeout(timeoutId);
          } else if (currentState.userCompanies && currentState.userCompanies.length > 0) {
            // Si hay compañías pero no se seleccionó ninguna, intentar inicializar de nuevo
            console.log('[Dashboard] Hay compañías pero ninguna seleccionada, reinicializando...', currentState.userCompanies);
            fetchInitialUser();
          } else {
            // userCompanies podría ser null/undefined, esperar más
            console.log('[Dashboard] userCompanies no está listo aún, esperando...');
          }
        }
      }
    }
  }, [dataLoading, user, activeCompany, hasCheckedCompanies, router, fetchInitialUser]);

  useEffect(() => {
    if (user && user._id && !dataLoading && !dataError && activeCompany) {
      const welcomeModalSeenKey = `welcomeModalSeen_${user._id}_${activeCompany._id}`;
      const welcomeModalAlreadySeen = localStorage.getItem(welcomeModalSeenKey);
      
      // Verificar si es una compañía nueva (sin ambientes)
      const isNewCompany = environments.length === 0;
      
      if (!welcomeModalAlreadySeen && isNewCompany) {
        setIsWelcomeModalVisible(true);
        setShowOnboardingFlow(true);
      } else if (!welcomeModalAlreadySeen) {
        setIsWelcomeModalVisible(true);
      }
    }
  }, [user, activeCompany, dataLoading, dataError, environments]);

  useEffect(() => {
    const sectionFromQuery = searchParams.get('section') as SidebarSectionKey;
    if (sectionFromQuery && VALID_SECTIONS.includes(sectionFromQuery)) {
      setActiveSectionInSidebar(sectionFromQuery);
    } else if (!sectionFromQuery && activeSectionInSidebar !== 'diagrams') {
      setActiveSectionInSidebar('diagrams');
    }
  }, [searchParams, activeSectionInSidebar]);

  // Estado para el grupo expandido inicial
  const [initialExpandedGroup, setInitialExpandedGroup] = useState<string | null>(null);

  // Estado para rastrear si ya se cargaron los parámetros iniciales de URL
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);

  // Sincronizar parámetros de URL con el estado solo en la carga inicial
  useEffect(() => {
    if (!dataLoading && activeCompany && environments.length > 0 && !urlParamsLoaded) {
      const envParam = searchParams.get('env');
      const diagramParam = searchParams.get('diagram');
      const groupParam = searchParams.get('group');
      
      const applyUrlParams = async () => {
        // Buscar ambiente por nombre
        if (envParam) {
          const targetEnv = environments.find(e => e.name.toLowerCase().replace(/\s+/g, '-') === envParam.toLowerCase());
          if (targetEnv && targetEnv.id !== selectedEnvironment) {
            await useNavigationStore.getState().handleEnvironmentChange(targetEnv.id);
          }
        }
        
        // Buscar diagrama por nombre (después de cambiar ambiente si es necesario)
        if (diagramParam && diagramsFromStore.length > 0) {
          const targetDiagram = diagramsFromStore.find(d => d.name.toLowerCase().replace(/\s+/g, '-') === diagramParam.toLowerCase());
          if (targetDiagram && targetDiagram.id !== selectedDiagram) {
            await useNavigationStore.getState().handleDiagramChange(targetDiagram.id);
          }
        }
        
        // Establecer el grupo expandido inicial si está en la URL
        if (groupParam && currentDiagram) {
          // Buscar el grupo por su label
          const groupNode = currentDiagram.nodes?.find(n => 
            n.type === 'group' && 
            n.data?.label && 
            typeof n.data.label === 'string' &&
            n.data.label.toLowerCase().replace(/\s+/g, '-') === groupParam.toLowerCase()
          );
          if (groupNode) {
            setInitialExpandedGroup(groupNode.id);
          }
        }
        
        // Marcar que ya se cargaron los parámetros de URL
        setUrlParamsLoaded(true);
      };
      
      applyUrlParams();
    }
  }, [dataLoading, activeCompany, environments, searchParams, currentDiagram, selectedEnvironment, selectedDiagram, diagramsFromStore, urlParamsLoaded]);

  // Actualizar URL cuando cambian ambiente o diagrama (pero solo después de que se cargaron los parámetros iniciales)
  useEffect(() => {
    if (!urlParamsLoaded || !selectedEnvironment || !selectedDiagram) return;
    
    const selectedEnv = environments.find(e => e.id === selectedEnvironment);
    const selectedDiag = diagramsFromStore.find(d => d.id === selectedDiagram);
    
    if (selectedEnv && selectedDiag) {
      // Usar un timeout para evitar múltiples actualizaciones rápidas
      const timeoutId = setTimeout(() => {
        const currentParams = new URLSearchParams(window.location.search);
        const envParam = selectedEnv.name.toLowerCase().replace(/\s+/g, '-');
        const diagramParam = selectedDiag.name.toLowerCase().replace(/\s+/g, '-');
        
        // Solo actualizar si realmente cambió
        if (currentParams.get('env') !== envParam || currentParams.get('diagram') !== diagramParam) {
          currentParams.set('env', envParam);
          currentParams.set('diagram', diagramParam);
          
          // Eliminar el parámetro group cuando cambia el diagrama
          if (currentParams.has('group')) {
            currentParams.delete('group');
          }
          
          const newUrl = `${pathname}?${currentParams.toString()}`;
          router.replace(newUrl, { scroll: false });
        }
      }, 100); // Pequeño delay para evitar múltiples actualizaciones
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedEnvironment, selectedDiagram, environments, diagramsFromStore, pathname, router, urlParamsLoaded]);

  const handleInternalSectionChange = (sectionString: string) => {
    const section = sectionString as SidebarSectionKey;
    if (VALID_SECTIONS.includes(section)) {
      setActiveSectionInSidebar(section);
      const currentParams = new URLSearchParams(searchParams); 
      currentParams.set("section", section);
      const search = currentParams.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveDiagramLocal = useCallback(async (data: { nodes: any[], edges: any[], viewport?: any }) => { 
    if (!activeCompany || !selectedEnvironment || !selectedDiagram || !currentDiagram) {
      message.error("No se puede guardar: falta información de compañía, ambiente o diagrama.");
      return;
    }
    
    // Debug: Log nodes before conversion
    console.log('🔍 [SAVE DEBUG] Nodes before conversion:', data.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      parentId: n.parentId,
      parentNode: n.parentNode
    })));
    
    const customNodes = data.nodes.map(n => ({ 
      id: n.id, type: n.type!, position: n.position, data: n.data, 
      width: n.width, height: n.height, parentNode: n.parentId, style: n.style 
    } as CustomNode));
    
    // Debug: Log nodes after conversion
    console.log('🔍 [SAVE DEBUG] Nodes after conversion:', customNodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      parentNode: n.parentNode
    })));
    
    const customEdges = data.edges.map(e => ({ 
      id: e.id, source: e.source, target: e.target, type: e.type, 
      animated: e.animated, label: e.label as string, data: e.data, style: e.style 
    } as CustomEdge));
    
    // Debug logging to trace save data
    console.log('🔍 [SAVE DEBUG] Preparing to save diagram data:', {
      diagramId: selectedDiagram,
      nodeCount: customNodes.length,
      edgeCount: customEdges.length,
      groupNodes: customNodes.filter(n => n.type === 'groupNode'),
      childNodesInGroups: customNodes.filter(n => n.parentNode),
      allNodesTypes: customNodes.map(n => ({ id: n.id, type: n.type, parentNode: n.parentNode }))
    });
    
    const diagramUpdateData = { 
      name: currentDiagram.name, 
      description: currentDiagram.description, 
      path: currentDiagram.path,
      nodes: customNodes, 
      edges: customEdges, 
      viewport: data.viewport || currentDiagram.viewport
    };
    
    console.log('🔍 [SAVE DEBUG] Full diagram update data:', diagramUpdateData);
    console.log('📍 [VIEWPORT SAVE] Saving viewport:', data.viewport);
    
    try {
      await updateDiagram(activeCompany._id, selectedEnvironment, selectedDiagram, diagramUpdateData);
      message.success("Diagrama guardado.");
    } catch (e:unknown) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      message.error("Error al guardar el diagrama: " + errorMessage); 
    }
  }, [activeCompany, selectedEnvironment, selectedDiagram, currentDiagram]);

  const memoizedResourceCategories = useMemo((): ResourceCategory[] => {
    // Estructura basada en el ejemplo proporcionado por el usuario
    // Los 'type' deben coincidir con los nodeTypes registrados en FlowEditor/NodeTypes.ts
    // Los 'data' en cada item deben contener lo necesario para inicializar el nodo (provider, resourceType, label, etc.)
    const categories: ResourceCategory[] = [
      {
        name: 'AWS - Almacenamiento', provider: 'aws',
        items: [
          { type: 'aws_s3_bucket', name: 'S3 Bucket', description: 'Almacenamiento de objetos', provider: 'aws', icon: <CloudIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 's3_bucket', category: 'storage', label: 'S3 Bucket' } },
          { type: 'aws_rds_instance', name: 'RDS Instance', description: 'Base de datos relacional', provider: 'aws', icon: <CircleStackIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'rds_instance', category: 'database', label: 'RDS Instance' } },
          { type: 'aws_dynamodb_table', name: 'DynamoDB Table', description: 'Base de datos NoSQL', provider: 'aws', icon: <TableCellsIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'dynamodb_table', category: 'database', label: 'DynamoDB Table' } },
          { type: 'aws_elasticache_cluster', name: 'ElastiCache Cluster', description: 'Caché en memoria', provider: 'aws', icon: <BoltIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'elasticache_cluster', category: 'cache', label: 'ElastiCache' } },
          { type: 'aws_redshift_cluster', name: 'Redshift Cluster', description: 'Almacén de datos', provider: 'aws', icon: <CircleStackIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'redshift_cluster', category: 'database', label: 'Redshift' } },
          { type: 'aws_efs_file_system', name: 'EFS File System', description: 'Sistema de archivos elástico', provider: 'aws', icon: <FolderIconOutline className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'efs_file_system', category: 'storage', label: 'EFS' } },
        ]
      },
      {
        name: 'AWS - Aplicación', provider: 'aws',
        items: [
          { type: 'aws_lambda_function', name: 'Lambda Function', description: 'Código serverless', provider: 'aws', icon: <CodeBracketIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'lambda_function', category: 'compute', label: 'Lambda' } },
          { type: 'aws_api_gateway_rest_api', name: 'API Gateway (REST)', description: 'API REST/WebSocket', provider: 'aws', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'api_gateway_rest_api', category: 'networking', label: 'API Gateway' } },
          { type: 'aws_sqs_queue', name: 'SQS Queue', description: 'Cola de mensajes', provider: 'aws', icon: <RectangleStackIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'sqs_queue', category: 'application_integration', label: 'SQS Queue' } },
          { type: 'aws_sns_topic', name: 'SNS Topic', description: 'Notificaciones push', provider: 'aws', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'sns_topic', category: 'application_integration', label: 'SNS Topic' } },
          { type: 'aws_cloudwatch_event_rule', name: 'EventBridge Rule', description: 'Orquestación de eventos', provider: 'aws', icon: <CalendarDaysIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'cloudwatch_event_rule', category: 'application_integration', label: 'EventBridge Rule' } },
          { type: 'aws_sfn_state_machine', name: 'Step Functions', description: 'Flujos de trabajo serverless', provider: 'aws', icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'sfn_state_machine', category: 'application_integration', label: 'Step Functions' } },
        ]
      },
      {
        name: 'AWS - Cómputo', provider: 'aws',
        items: [
          { type: 'aws_ec2_instance', name: 'EC2 Instance', description: 'Máquina Virtual', provider: 'aws', icon: <ServerIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'ec2_instance', category: 'compute', label: 'EC2 Instance' } },
          { type: 'aws_autoscaling_group', name: 'Auto Scaling Group', description: 'Grupo de Autoescalado', provider: 'aws', icon: <ServerStackIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'autoscaling_group', category: 'compute', label: 'Auto Scaling Group' } },
          { type: 'aws_ecs_service', name: 'ECS Service', description: 'Servicio de Contenedores', provider: 'aws', icon: <CubeIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'ecs_service', category: 'compute', label: 'ECS Service' } },
          { type: 'aws_eks_cluster', name: 'EKS Cluster', description: 'Cluster de Kubernetes', provider: 'aws', icon: <CpuChipIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'eks_cluster', category: 'compute', label: 'EKS Cluster' } },
          { type: 'aws_elasticbeanstalk_environment', name: 'Elastic Beanstalk Env', description: 'Entorno PaaS', provider: 'aws', icon: <CloudIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'elasticbeanstalk_environment', category: 'compute', label: 'Elastic Beanstalk' } },
        ]
      },
      {
        name: 'AWS - Redes', provider: 'aws',
        items: [
          { type: 'aws_elbv2_load_balancer', name: 'Load Balancer', description: 'Balanceador (ALB/NLB)', provider: 'aws', icon: <ArrowsRightLeftIcon className="w-5 h-5" />, data: { provider: 'aws', resourceType: 'elbv2_load_balancer', category: 'networking', label: 'Load Balancer' } },
        ]
      },
      {
        name: 'Azure - Cómputo', provider: 'azure',
        items: [
          { type: 'azurerm_virtual_machine', name: 'Virtual Machine', description: 'Máquina virtual', provider: 'azure', icon: <ComputerDesktopIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'virtual_machine', category: 'compute', label: 'Virtual Machine' } },
          { type: 'azurerm_linux_virtual_machine_scale_set', name: 'Linux VM Scale Set', description: 'Conjunto de escalado Linux', provider: 'azure', icon: <ServerStackIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'linux_virtual_machine_scale_set', category: 'compute', label: 'VM Scale Set' } },
          { type: 'azurerm_kubernetes_cluster', name: 'AKS Cluster', description: 'Cluster de Kubernetes', provider: 'azure', icon: <CpuChipIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'kubernetes_cluster', category: 'compute', label: 'AKS Cluster' } },
          { type: 'azurerm_linux_web_app', name: 'App Service (Linux)', description: 'Aplicación web PaaS', provider: 'azure', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'linux_web_app', category: 'compute', label: 'App Service' } },
          { type: 'azurerm_container_group', name: 'Container Instances', description: 'Grupo de Contenedores', provider: 'azure', icon: <CubeIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'container_group', category: 'compute', label: 'Container Instances' } },
        ]
      },
      {
        name: 'Azure - Almacenamiento', provider: 'azure',
        items: [
          { type: 'azurerm_storage_container', name: 'Storage Container (Blob)', description: 'Contenedor de Blob', provider: 'azure', icon: <ArchiveBoxIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'storage_container', category: 'storage', label: 'Blob Container' } },
          { type: 'azurerm_cosmosdb_account', name: 'Cosmos DB Account', description: 'BD NoSQL multimodelo', provider: 'azure', icon: <CircleStackIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'cosmosdb_account', category: 'database', label: 'Cosmos DB' } },
          { type: 'azurerm_mssql_database', name: 'SQL Database', description: 'Base de datos SQL', provider: 'azure', icon: <CircleStackIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'mssql_database', category: 'database', label: 'SQL Database' } },
          { type: 'azurerm_storage_share', name: 'File Share', description: 'Recurso compartido de archivos', provider: 'azure', icon: <FolderIconOutline className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'storage_share', category: 'storage', label: 'File Share' } },
        ]
      },
       {
        name: 'Azure - Aplicación', provider: 'azure',
        items: [
          { type: 'azurerm_linux_function_app', name: 'Function App (Linux)', description: 'Funciones serverless', provider: 'azure', icon: <BoltIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'linux_function_app', category: 'compute', label: 'Function App' } }, 
          { type: 'azurerm_api_management', name: 'API Management', description: 'Gestión de APIs', provider: 'azure', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'api_management', category: 'networking', label: 'API Management' } },
          { type: 'azurerm_servicebus_namespace', name: 'Service Bus Namespace', description: 'Mensajería Service Bus', provider: 'azure', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'servicebus_namespace', category: 'application_integration', label: 'Service Bus' } },
          { type: 'azurerm_eventgrid_topic', name: 'Event Grid Topic', description: 'Tema de Event Grid', provider: 'azure', icon: <RssIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'eventgrid_topic', category: 'application_integration', label: 'Event Grid Topic' } },
          { type: 'azurerm_logic_app_workflow', name: 'Logic App Workflow', description: 'Flujo de trabajo Logic Apps', provider: 'azure', icon: <RectangleGroupIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'logic_app_workflow', category: 'application_integration', label: 'Logic App' } },
          { type: 'azurerm_eventhub_namespace', name: 'Event Hubs Namespace', description: 'Streaming de eventos', provider: 'azure', icon: <BoltIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'eventhub_namespace', category: 'application_integration', label: 'Event Hubs' } },
        ]
      },
      {
        name: 'Azure - Redes', provider: 'azure',
        items: [
          { type: 'azurerm_virtual_network', name: 'Virtual Network', description: 'Red virtual privada', provider: 'azure', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'virtual_network', category: 'networking', label: 'Virtual Network' } },
          { type: 'azurerm_subnet', name: 'Subnet', description: 'Subred dentro de una VNet', provider: 'azure', icon: <RectangleStackIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'subnet', category: 'networking', label: 'Subnet' } },
          { type: 'azurerm_network_security_group', name: 'Network Security Group', description: 'Reglas de seguridad', provider: 'azure', icon: <ShieldCheckIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'network_security_group', category: 'networking', label: 'NSG' } },
          { type: 'azurerm_lb', name: 'Load Balancer', description: 'Balanceador de carga L4', provider: 'azure', icon: <ArrowsRightLeftIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'lb', category: 'networking', label: 'Load Balancer' } },
          { type: 'azurerm_application_gateway', name: 'Application Gateway', description: 'Balanceador de carga L7', provider: 'azure', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'application_gateway', category: 'networking', label: 'App Gateway' } },
          { type: 'azurerm_firewall', name: 'Firewall', description: 'Firewall de red', provider: 'azure', icon: <ShieldCheckIcon className="w-5 h-5" />, data: { provider: 'azure', resourceType: 'firewall', category: 'networking', label: 'Firewall' } },
        ]
      },
      {
        name: 'GCP - Cómputo', provider: 'gcp',
        items: [
          { type: 'gcp_compute_instance', name: 'Compute Engine', description: 'Máquina virtual', provider: 'gcp', icon: <ServerIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_instance', category: 'compute', label: 'Compute Engine' } },
          { type: 'gcp_compute_disk', name: 'Compute Disk', description: 'Disco persistente', provider: 'gcp', icon: <ArchiveBoxIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_disk', category: 'compute', label: 'Compute Disk' } },
          { type: 'gcp_compute_instance_template', name: 'Instance Template', description: 'Plantilla de instancias', provider: 'gcp', icon: <RectangleStackIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_instance_template', category: 'compute', label: 'Instance Template' } },
          { type: 'gcp_compute_instance_group_manager', name: 'Instance Group', description: 'Grupo de instancias', provider: 'gcp', icon: <ServerStackIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_instance_group_manager', category: 'compute', label: 'Instance Group' } },
          { type: 'gcp_gke_cluster', name: 'GKE Cluster', description: 'Cluster de Kubernetes', provider: 'gcp', icon: <CpuChipIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'gke_cluster', category: 'compute', label: 'GKE Cluster' } },
          { type: 'gcp_cloudrun_service', name: 'Cloud Run', description: 'Contenedores serverless', provider: 'gcp', icon: <CodeBracketIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'cloudrun_service', category: 'compute', label: 'Cloud Run' } },
          { type: 'gcp_appengine_app', name: 'App Engine', description: 'Plataforma como servicio', provider: 'gcp', icon: <CloudIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'appengine_app', category: 'compute', label: 'App Engine' } },
        ]
      },
      {
        name: 'GCP - Redes', provider: 'gcp',
        items: [
          { type: 'gcp_compute_network', name: 'VPC Network', description: 'Red Virtual Privada', provider: 'gcp', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_network', category: 'networking', label: 'VPC Network' } },
          { type: 'gcp_compute_firewall', name: 'Firewall Rule', description: 'Regla de firewall VPC', provider: 'gcp', icon: <ShieldCheckIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_firewall', category: 'networking', label: 'Firewall Rule' } },
          { type: 'gcp_compute_load_balancer', name: 'Load Balancer', description: 'Balanceador de carga', provider: 'gcp', icon: <ArrowsRightLeftIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'compute_load_balancer', category: 'networking', label: 'Load Balancer' } },
        ]
      },
      {
        name: 'GCP - Almacenamiento', provider: 'gcp',
        items: [
          { type: 'gcp_cloud_storage_bucket', name: 'Cloud Storage Bucket', description: 'Almacenamiento de objetos', provider: 'gcp', icon: <CloudIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'cloud_storage_bucket', category: 'storage', label: 'Storage Bucket' } },
          { type: 'gcp_sql_instance', name: 'Cloud SQL Instance', description: 'Base de datos SQL', provider: 'gcp', icon: <CircleStackIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'sql_instance', category: 'database', label: 'Cloud SQL' } },
          { type: 'gcp_bigquery_dataset', name: 'BigQuery Dataset', description: 'Dataset de BigQuery', provider: 'gcp', icon: <TableCellsIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'bigquery_dataset', category: 'database', label: 'BigQuery Dataset' } },
          { type: 'gcp_firestore_database', name: 'Firestore Database', description: 'BD NoSQL (Nativo/Datastore)', provider: 'gcp', icon: <DocumentTextIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'firestore_database', category: 'database', label: 'Firestore' } }, 
          { type: 'gcp_memorystore_instance', name: 'Memorystore Instance', description: 'Caché Redis/Memcached', provider: 'gcp', icon: <BoltIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'memorystore_instance', category: 'cache', label: 'Memorystore' } },
          { type: 'gcp_filestore_instance', name: 'Filestore Instance', description: 'Almacenamiento de archivos NFS', provider: 'gcp', icon: <FolderIconOutline className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'filestore_instance', category: 'storage', label: 'Filestore' } },
        ]
      },
      {
        name: 'GCP - Aplicación', provider: 'gcp',
        items: [
          { type: 'gcp_cloudfunctions_function', name: 'Cloud Functions', description: 'Funciones serverless', provider: 'gcp', icon: <BoltIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'cloudfunctions_function', category: 'compute', label: 'Cloud Functions' } }, 
          { type: 'gcp_api_gateway', name: 'API Gateway', description: 'API Gateway', provider: 'gcp', icon: <GlobeAltIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'api_gateway', category: 'networking', label: 'API Gateway' } }, 
          { type: 'gcp_pubsub_topic', name: 'Pub/Sub Topic', description: 'Mensajería Pub/Sub', provider: 'gcp', icon: <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'pubsub_topic', category: 'application_integration', label: 'Pub/Sub Topic' } }, 
          { type: 'gcp_cloud_tasks_queue', name: 'Cloud Tasks Queue', description: 'Colas de tareas', provider: 'gcp', icon: <ListBulletIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'cloud_tasks_queue', category: 'application_integration', label: 'Cloud Tasks' } },
          { type: 'gcp_workflows_workflow', name: 'Workflows', description: 'Flujos de trabajo', provider: 'gcp', icon: <RectangleGroupIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'workflows_workflow', category: 'application_integration', label: 'Workflows' } },
          { type: 'gcp_eventarc_trigger', name: 'Eventarc Trigger', description: 'Orquestación de eventos', provider: 'gcp', icon: <RssIcon className="w-5 h-5" />, data: { provider: 'gcp', resourceType: 'eventarc_trigger', category: 'application_integration', label: 'Eventarc Trigger' } },
        ]
      },
      {
        name: 'Grupos y Áreas', provider: 'generic',
        items: [
          { type: 'group', name: 'Grupo', description: 'Agrupar varios elementos', provider: 'generic', icon: <RectangleGroupIcon className="w-5 h-5" />, data: { provider: 'generic', resourceType: 'group', category: 'layout', label: 'Grupo' } },
          { type: 'areaNode', name: 'Área', description: 'Definir un área visual', provider: 'generic', icon: <CubeIcon className="w-5 h-5" />, data: { provider: 'generic', resourceType: 'areaNode', category: 'layout', label: 'Área' } },
          { type: 'textNode', name: 'Texto', description: 'Añadir notas de texto', provider: 'generic', icon: <DocumentTextIcon className="w-5 h-5" />, data: { provider: 'generic', resourceType: 'textNode', category: 'annotation', label: 'Texto' } },
        ]
      }
    ];
    return categories;
  }, []); // La dependencia vacía está bien si los tipos de recursos son estáticos


  if (dataLoading && !activeCompany) { 
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-850" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <Spin size="large" />
        <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando datos...</p>
      </div>
    );
  }
  
  if (dataError) { 
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-850 p-8" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <p className="text-red-500 p-4 bg-red-100 border border-red-300 rounded-md">{dataError}</p>
      </div>
    );
  }

  if (!activeCompany && !dataLoading) { 
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-850 p-8" style={{ height: 'calc(100vh - 3.5rem)' }}>
            <Text>No se ha podido cargar la información de la compañía. Por favor, recarga o contacta a soporte.</Text>
        </div>
    );
  }
  
  const companyDisplayName = isPersonalSpace ? "Espacio Personal" : activeCompany?.name || 'Compañía';
  const sidebarSections = isPersonalSpace 
    ? [
        { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'sky', description: 'Visualiza y gestiona tus arquitecturas personales.' },
        { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud para despliegues.' },
        { key: 'environments', name: 'Ambientes', icon: ServerStackIcon, iconSolid: ServerStackIcon, color: 'teal', description: 'Gestiona tu ambiente Sandbox.' },
        { key: 'deployments', name: 'Despliegues', icon: PlayCircleIconSolid, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues personales.' },
        { key: 'settings', name: 'Configuración', icon: SettingOutlined, iconSolid: SettingOutlined, color: 'gray', description: 'Ajusta tu perfil y plan.' },
      ]
    : [ 
        { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'blue', description: 'Visualiza y gestiona tus arquitecturas.' },
        { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud.' },
        { key: 'environments', name: 'Ambientes', icon: ServerStackIcon, iconSolid: ServerStackIcon, color: 'teal', description: 'Gestiona tus ambientes de despliegue.' }, 
        { key: 'deployments', name: 'Despliegues', icon: PlayCircleIconSolid, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues.' },
        { key: 'settings', name: 'Ajustes Compañía', icon: SettingOutlined, iconSolid: SettingOutlined, color: 'gray', description: 'Configura los detalles de la compañía.' },
        { key: 'team', name: 'Equipo', icon: UsersIconOutline, iconSolid: UsersIconSolid, color: 'orange', description: 'Gestiona miembros y permisos.' },
      ];

    return (
      <>
        <Modal
          open={isWelcomeModalVisible}
          onCancel={() => {
            setIsWelcomeModalVisible(false);
            if (user && user._id && activeCompany) {
              localStorage.setItem(`welcomeModalSeen_${user._id}_${activeCompany._id}`, 'true');
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
                if (user && user._id && activeCompany) {
                  localStorage.setItem(`welcomeModalSeen_${user._id}_${activeCompany._id}`, 'true');
                }
                // Si es una compañía nueva, iniciar el flujo de onboarding
                if (showOnboardingFlow) {
                  setOnboardingStep(2); // Pasar al paso de crear ambiente
                }
              }}
              className="bg-electric-purple-600 hover:bg-electric-purple-700 dark:bg-electric-purple-500 dark:hover:bg-electric-purple-600"
            >
              {showOnboardingFlow ? 'Configurar mi Espacio' : 'Comenzar a Explorar'}
            </Button>
          </div>
        </Modal>

        <div className="flex bg-slate-50 dark:bg-slate-900" style={{ height: 'calc(100vh - 3.5rem)' }}>
          {activeCompany && (
            <CompanySidebar 
              companyName={companyDisplayName} activeSection={activeSectionInSidebar} 
              onSectionChange={handleInternalSectionChange} 
              isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
              sections={sidebarSections} isPersonalSpace={isPersonalSpace || false}
            />
          )}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Subheader de acciones del diagrama */}
            {currentDiagram && activeSectionInSidebar === 'diagrams' && <DiagramActionSubheader />}

            <div className="relative flex-1 bg-slate-100 dark:bg-slate-850 overflow-auto">
                {dataLoading && activeSectionInSidebar === 'diagrams' && !currentDiagram && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10"><Spin size="large" /></div>
                )}
                
                {activeSectionInSidebar === 'diagrams' && activeCompany && ( 
                  <>
                    {/* El FlowEditor ahora estará debajo del DiagramActionSubheader (si currentDiagram existe) */}
                    {selectedEnvironment && selectedDiagram && currentDiagram && (
                      <FlowEditor 
                        key={`${activeCompany._id}-${selectedEnvironment}-${selectedDiagram}`} 
                        companyId={activeCompany._id} 
                        environmentId={selectedEnvironment} 
                        diagramId={selectedDiagram} 
                        initialDiagram={currentDiagram} 
                        initialNodes={initialNodesForFlow} 
                        initialEdges={initialEdgesForFlow} 
                        initialViewport={currentDiagram.viewport}
                        onSave={handleSaveDiagramLocal}
                        nodeTypes={nodeTypes}
                        resourceCategories={memoizedResourceCategories}
                        initialExpandedGroupId={initialExpandedGroup}
                        onGroupExpandedChange={(groupId: string | null) => {
                          const currentParams = new URLSearchParams(searchParams);
                          
                          if (groupId) {
                            // Buscar el label del grupo
                            const groupNode = currentDiagram.nodes?.find(n => n.id === groupId);
                            if (groupNode?.data?.label && typeof groupNode.data.label === 'string') {
                              currentParams.set('group', groupNode.data.label.toLowerCase().replace(/\s+/g, '-'));
                            }
                          } else {
                            // Si no hay grupo expandido, quitar el parámetro
                            currentParams.delete('group');
                          }
                          
                          const newUrl = `${pathname}?${currentParams.toString()}`;
                          router.replace(newUrl);
                        }}
                      />
                    )}
                    {!selectedEnvironment && environments && environments.length === 0 && !dataLoading && ( 
                      <div className="flex flex-col items-center justify-center h-full p-6 sm:p-10 text-center">
                        {/* Card eliminada, contenido directamente sobre el fondo de la página */}
                        {showOnboardingFlow && onboardingStep === 2 && (
                          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-lg">
                            <div className="flex items-center">
                              <CheckOutlined className="text-green-500 mr-2" />
                              <span className="text-slate-700 dark:text-slate-300">
                                ✅ <strong>Workspace creado:</strong> Se creó automáticamente tu workspace principal
                              </span>
                            </div>
                          </div>
                        )}
                        <FolderIconOutline className="mx-auto h-24 w-24 sm:h-28 sm:w-28 text-electric-purple-500 dark:text-electric-purple-400 mb-8" />
                        <h3 className="text-3xl sm:text-4xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                          {showOnboardingFlow && onboardingStep === 2 ? 'Paso 2: Crea tu Primer Ambiente' : 'Define tu Primer Ambiente'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 text-base sm:text-lg max-w-lg">
                          {showOnboardingFlow && onboardingStep === 2 
                            ? "Los ambientes te permiten separar tus recursos (dev, staging, producción). Comienza creando tu primer ambiente."
                            : (isPersonalSpace ? "Tu espacio personal está listo. " : "Esta compañía aún no tiene ambientes. ") + "Crea un ambiente para empezar a diseñar diagramas y dar vida a tus ideas de infraestructura."
                          }
                        </p>
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={() => {
                            useNavigationStore.getState().setNewEnvironmentModalVisible(true);
                            if (showOnboardingFlow) {
                              setOnboardingStep(3);
                            }
                          }}
                          className="bg-electric-purple-600 hover:bg-electric-purple-700 dark:bg-electric-purple-500 dark:hover:bg-electric-purple-600 px-8 py-3 text-base"
                        >
                          Crear Ambiente
                        </Button>
                      </div> 
                    )}
                    {selectedEnvironment && (!diagramsFromStore || diagramsFromStore.length === 0) && !dataLoading && ( 
                      <div className="flex flex-col items-center justify-center h-full p-6 sm:p-10 text-center">
                        {/* Card eliminada */}
                        {showOnboardingFlow && onboardingStep === 3 && (
                          <div className="mb-6 space-y-3 max-w-lg">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center">
                                <CheckOutlined className="text-green-500 mr-2" />
                                <span className="text-slate-700 dark:text-slate-300">
                                  ✅ <strong>Workspace creado:</strong> Main Workspace
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center">
                                <CheckOutlined className="text-green-500 mr-2" />
                                <span className="text-slate-700 dark:text-slate-300">
                                  ✅ <strong>Ambiente creado:</strong> {environments.find(e => e.id === selectedEnvironment)?.name || 'Ambiente'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <DocumentDuplicateIconOutline className="mx-auto h-24 w-24 sm:h-28 sm:w-28 text-emerald-green-500 dark:text-emerald-green-400 mb-8" />
                        <h3 className="text-3xl sm:text-4xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                          {showOnboardingFlow && onboardingStep === 3 ? 'Paso 3: Crea tu Primer Diagrama' : 'Crea tu Primer Diagrama'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 text-base sm:text-lg max-w-lg">
                          {showOnboardingFlow && onboardingStep === 3
                            ? "¡Excelente! Ya tienes todo listo. Ahora crea tu primer diagrama para empezar a diseñar tu infraestructura visualmente."
                            : "Este ambiente está listo. Comienza a visualizar tu infraestructura arrastrando componentes al lienzo."
                          }
                        </p>
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={() => {
                            useNavigationStore.getState().setNewDiagramModalVisible(true);
                            if (showOnboardingFlow) {
                              setShowOnboardingFlow(false); // Terminar el flujo de onboarding
                            }
                          }}
                          className="bg-emerald-green-600 hover:bg-emerald-green-700 dark:bg-emerald-green-500 dark:hover:bg-emerald-green-600 px-8 py-3 text-base"
                        >
                          Crear Diagrama
                        </Button>
                      </div> 
                    )}
                  </>
                )}
                
                {activeSectionInSidebar === 'credentials' && activeCompany && ( <CredentialsPage companyId={activeCompany._id} /> )}
                {activeSectionInSidebar === 'environments' && activeCompany && activeCompany._id && ( <EnvironmentsPage companyId={activeCompany._id} isPersonalSpace={isPersonalSpace || false} /> )}
                {activeSectionInSidebar === 'deployments' && activeCompany && ( <DeploymentsPage companyId={activeCompany._id} /> )}
                {activeSectionInSidebar === 'templates' && ( <div className="p-8 text-center"><h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Plantillas</h2><p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de plantillas próximamente.</p></div> )}
                {activeSectionInSidebar === 'settings' && activeCompany && ( <SettingsPage companyId={activeCompany._id} /> )}
                {activeSectionInSidebar === 'team' && !isPersonalSpace && activeCompany && ( <div className="p-8 text-center"><h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Equipo</h2><p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de miembros del equipo (solo para planes de compañía).</p></div> )}
              </div>
            </div>
        </div>
      </>
    );
}
