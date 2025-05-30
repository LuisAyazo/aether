"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import './page.css';
import { Button, Select, Modal, Input, Spin, message, Timeline, Drawer, Empty } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined, ArrowUpOutlined, DeleteOutlined, HistoryOutlined, RollbackOutlined, BranchesOutlined, FolderOutlined, FolderOpenOutlined, FileOutlined, ClearOutlined } from '@ant-design/icons';
import { ExclamationTriangleIcon, KeyIcon } from '@heroicons/react/24/outline';
import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from 'reactflow';
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

// Componentes
import FlowEditor from '../../../../components/flow/FlowEditor';
import EnvironmentTreeSelect from '../../../../components/ui/EnvironmentTreeSelect';
import EnvironmentCategorySelect from '../../../../components/ui/EnvironmentCategorySelect';
import DiagramTreeSelect from '../../../../components/ui/DiagramTreeSelect';
import CompanySidebar from '../../../../components/ui/CompanySidebar';
import CredentialsPage from '../../../../components/ui/CredentialsPage';
import DeploymentsPage from '../../../../components/ui/DeploymentsPage';
import SettingsPage from '../../../../components/ui/SettingsPage';
import TeamPage from '../../../../components/ui/TeamPage';

// Servicios
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram, createEnvironment, updateDiagram, deleteDiagram, deleteEnvironment } from '../../../../services/diagramService';
import { isAuthenticated } from '../../../../services/authService';

// Tipos y utilidades
import nodeTypes from '../../../../components/nodes/NodeTypes';
import { Node, Edge } from '../../../../services/diagramService';

const { TextArea } = Input;

// Cache for environments and diagrams
const environmentCache = new Map<string, Environment[]>();
const diagramCache = new Map<string, Diagram[]>();
const singleDiagramCache = new Map<string, Diagram>();

// Define interfaces for resource categories
interface ResourceItem {
  type: string;
  name: string;
  description: string;
  provider: 'aws' | 'gcp' | 'generic' | 'azure';
}

interface ResourceCategory {
  name: string;
  provider: 'aws' | 'gcp' | 'generic' | 'azure';
  items: ResourceItem[];
}

// Update resourceCategories to match the ResourceCategory interface
const resourceCategories: ResourceCategory[] = [
  {
    name: 'AWS - Cómputo',
    provider: 'aws',
    items: [
      { type: 'ec2', name: 'EC2 Instance', description: 'Servidor virtual en la nube', provider: 'aws' },
      { type: 'ec2', name: 'Load Balancer', description: 'Balanceador de carga', provider: 'aws' },
      { type: 'group', name: 'Auto Scaling Group', description: 'Grupo de escalado automático', provider: 'aws' },
      { type: 'ec2', name: 'Elastic Beanstalk', description: 'Plataforma como servicio', provider: 'aws' },
      { type: 'ec2', name: 'ECS Container', description: 'Contenedor en ECS', provider: 'aws' },
      { type: 'ec2', name: 'EKS Cluster', description: 'Cluster de Kubernetes', provider: 'aws' },
    ]
  },
  {
    name: 'AWS - Almacenamiento',
    provider: 'aws',
    items: [
      { type: 's3', name: 'S3 Bucket', description: 'Almacenamiento de objetos', provider: 'aws' },
      { type: 'rds', name: 'RDS Instance', description: 'Base de datos relacional', provider: 'aws' },
      { type: 'rds', name: 'DynamoDB', description: 'Base de datos NoSQL', provider: 'aws' },
      { type: 'rds', name: 'ElastiCache', description: 'Caché en memoria', provider: 'aws' },
      { type: 'rds', name: 'Redshift', description: 'Almacén de datos', provider: 'aws' },
      { type: 's3', name: 'EFS', description: 'Sistema de archivos elástico', provider: 'aws' },
    ]
  },
  {
    name: 'AWS - Aplicación',
    provider: 'aws',
    items: [
      { type: 'lambda', name: 'Lambda Function', description: 'Función serverless', provider: 'aws' },
      { type: 'lambda', name: 'API Gateway', description: 'API REST/WebSocket', provider: 'aws' },
      { type: 'lambda', name: 'SQS Queue', description: 'Cola de mensajes', provider: 'aws' },
      { type: 'lambda', name: 'SNS Topic', description: 'Notificaciones push', provider: 'aws' },
      { type: 'lambda', name: 'EventBridge', description: 'Orquestación de eventos', provider: 'aws' },
      { type: 'lambda', name: 'Step Functions', description: 'Flujos de trabajo', provider: 'aws' },
    ]
  },
  {
    name: 'GCP - Cómputo',
    provider: 'gcp',
    items: [
      { type: 'compute', name: 'Compute Engine', description: 'Máquina virtual en la nube', provider: 'gcp' },
      { type: 'group', name: 'Instance Group', description: 'Grupo de instancias', provider: 'gcp' },
      { type: 'compute', name: 'GKE Cluster', description: 'Cluster de Kubernetes', provider: 'gcp' },
      { type: 'compute', name: 'Cloud Run', description: 'Contenedores serverless', provider: 'gcp' },
      { type: 'compute', name: 'App Engine', description: 'Plataforma como servicio', provider: 'gcp' },
      { type: 'compute', name: 'Cloud Functions', description: 'Funciones serverless', provider: 'gcp' },
    ]
  },
  {
    name: 'GCP - Almacenamiento',
    provider: 'gcp',
    items: [
      { type: 'storage', name: 'Cloud Storage', description: 'Almacenamiento de objetos', provider: 'gcp' },
      { type: 'sql', name: 'Cloud SQL', description: 'Base de datos gestionada', provider: 'gcp' },
      { type: 'sql', name: 'BigQuery', description: 'Almacén de datos', provider: 'gcp' },
      { type: 'sql', name: 'Firestore', description: 'Base de datos NoSQL', provider: 'gcp' },
      { type: 'sql', name: 'Memorystore', description: 'Caché en memoria', provider: 'gcp' },
      { type: 'storage', name: 'Filestore', description: 'Sistema de archivos', provider: 'gcp' },
    ]
  },
  {
    name: 'GCP - Aplicación',
    provider: 'gcp',
    items: [
      { type: 'function', name: 'Cloud Functions', description: 'Función serverless', provider: 'gcp' },
      { type: 'function', name: 'Cloud Endpoints', description: 'API Gateway', provider: 'gcp' },
      { type: 'function', name: 'Pub/Sub', description: 'Mensajería', provider: 'gcp' },
      { type: 'function', name: 'Cloud Tasks', description: 'Colas de tareas', provider: 'gcp' },
      { type: 'function', name: 'Workflows', description: 'Flujos de trabajo', provider: 'gcp' },
      { type: 'function', name: 'Eventarc', description: 'Orquestación de eventos', provider: 'gcp' },
    ]
  },
  {
    name: 'Azure - Cómputo',
    provider: 'azure',
    items: [
      { type: 'vm', name: 'Virtual Machine', description: 'Máquina virtual', provider: 'azure' },
      { type: 'vm', name: 'VM Scale Set', description: 'Conjunto de escalado', provider: 'azure' },
      { type: 'vm', name: 'AKS Cluster', description: 'Cluster de Kubernetes', provider: 'azure' },
      { type: 'vm', name: 'App Service', description: 'Plataforma como servicio', provider: 'azure' },
      { type: 'vm', name: 'Container Instances', description: 'Contenedores', provider: 'azure' },
      { type: 'vm', name: 'Functions', description: 'Funciones serverless', provider: 'azure' },
    ]
  },
  {
    name: 'Azure - Almacenamiento',
    provider: 'azure',
    items: [
      { type: 'blob', name: 'Blob Storage', description: 'Almacenamiento de objetos', provider: 'azure' },
      { type: 'cosmos', name: 'Cosmos DB', description: 'Base de datos NoSQL', provider: 'azure' },
      { type: 'cosmos', name: 'SQL Database', description: 'Base de datos relacional', provider: 'azure' },
      { type: 'cosmos', name: 'Redis Cache', description: 'Caché en memoria', provider: 'azure' },
      { type: 'cosmos', name: 'Synapse Analytics', description: 'Almacén de datos', provider: 'azure' },
      { type: 'blob', name: 'File Storage', description: 'Sistema de archivos', provider: 'azure' },
    ]
  },
  {
    name: 'Azure - Aplicación',
    provider: 'azure',
    items: [
      { type: 'function', name: 'Azure Functions', description: 'Función serverless', provider: 'azure' },
      { type: 'function', name: 'API Management', description: 'API Gateway', provider: 'azure' },
      { type: 'function', name: 'Service Bus', description: 'Mensajería', provider: 'azure' },
      { type: 'function', name: 'Event Grid', description: 'Orquestación de eventos', provider: 'azure' },
      { type: 'function', name: 'Logic Apps', description: 'Flujos de trabajo', provider: 'azure' },
      { type: 'function', name: 'Event Hubs', description: 'Streaming de eventos', provider: 'azure' },
    ]
  },
  {
    name: 'Grupos y Áreas',
    provider: 'generic',
    items: [
      { type: 'group', name: 'Grupo', description: 'Agrupar varios elementos', provider: 'generic' },
      { type: 'group', name: 'Área', description: 'Definir un área del diagrama', provider: 'generic' },
      { type: 'group', name: 'Subsistema', description: 'Agrupar componentes relacionados', provider: 'generic' },
    ]
  }
];

export default function DiagramPage() {
  const params = useParams();
  const router = useRouter();
  const { companyId, diagramId } = params;

  useEffect(() => {
    // Verificar si el usuario está autenticado
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
  
  // Estados para los nodos y conexiones del diagrama actual
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
  
  // Keep the previous diagram for smooth transitions
  const [previousDiagram, setPreviousDiagram] = useState<Diagram | null>(null);
  
  // Sidebar state management
  const [activeSection, setActiveSection] = useState<'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team'>('diagrams');
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // Memoize nodeTypes to prevent recreating on each render
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  
  // Manejadores para cambios en nodos y conexiones
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        return updatedNodes;
      });
    },
    []
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        return updatedEdges;
      });
    },
    []
  );
  
  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    []
  );
  
  // Modales para crear
  const [newEnvironmentModalVisible, setNewEnvironmentModalVisible] = useState<boolean>(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState<string>('');
  const [newEnvironmentDescription, setNewEnvironmentDescription] = useState<string>('');
  const [newEnvironmentCategory, setNewEnvironmentCategory] = useState<string>('desarrollo');

  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  const [newDiagramDescription, setNewDiagramDescription] = useState<string>('');
  const [newDiagramPath, setNewDiagramPath] = useState<string>('');

  // Estados para eliminación de diagramas
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState<boolean>(false);
  const [diagramToDelete, setDiagramToDelete] = useState<Diagram | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  // Create a stable reference for the current diagram data to prevent flickering
  const stableDataRef = useRef<{
    diagram: Diagram | null;
    nodes: Node[];
    edges: Edge[];
  }>({
    diagram: null,
    nodes: [],
    edges: []
  });

  // Function to convert between ReactFlow and our custom types
  const convertToReactFlowNodes = (customNodes: Node[]): ReactFlowNode[] => {
    return customNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        provider: node.data?.provider || 'generic'
      },
      width: node.width || null,
      height: node.height || null,
      selected: node.selected || false,
      positionAbsolute: node.positionAbsolute,
      dragging: node.dragging || false,
      parentNode: node.parentNode,
      style: {
        ...node.style,
        border: '2px solid transparent',
        borderRadius: '4px'
      },
      className: undefined,
      sourcePosition: undefined,
      targetPosition: undefined,
      hidden: false,
      draggable: true,
      selectable: true,
      connectable: true,
      deletable: true,
      zIndex: 0,
      extent: undefined,
      expandParent: false,
      ariaLabel: undefined,
      focusable: true,
      resizing: false
    }));
  };

  const convertToReactFlowEdges = (customEdges: Edge[]): ReactFlowEdge[] => {
    return customEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated || false,
      label: edge.label,
      data: edge.data,
      style: edge.style,
      selected: edge.selected || false,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      className: undefined,
      hidden: false,
      deletable: true,
      focusable: true,
      updatable: true,
      zIndex: 0
    }));
  };

  const convertToCustomNodes = (reactFlowNodes: ReactFlowNode[]): Node[] => {
    return reactFlowNodes.map(node => ({
      id: node.id,
      type: node.type || 'default',
      position: node.position,
      data: node.data,
      width: node.width || undefined,
      height: node.height || undefined,
      selected: node.selected || false,
      positionAbsolute: node.positionAbsolute,
      dragging: node.dragging || false,
      parentNode: node.parentNode,
      style: node.style
    }));
  };

  const convertToCustomEdges = (reactFlowEdges: ReactFlowEdge[]): Edge[] => {
    return reactFlowEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated || false,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      data: edge.data,
      style: edge.style,
      selected: edge.selected || false,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined
    }));
  };

  // Track the previous URL params to avoid unnecessary URL updates
  const prevUrlRef = useRef({ envId: '', diagramId: '' });
  
  // Add a ref to track if we're currently updating the diagram
  const isUpdatingRef = useRef(false);
  
  // Función para actualizar la URL con nombres amigables
  const updateUrlWithNames = (environmentId: string, diagramId: string, envName: string, diagramName: string) => {
    const sanitizedEnvName = envName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
      
    const sanitizedDiagramName = diagramName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    // Verificar si los IDs actuales ya coinciden para evitar recargas innecesarias
    const urlParams = new URLSearchParams(window.location.search);
    const currentEnvId = urlParams.get('environmentId');
    const currentDiagramId = params.diagramId as string;
    
    // Solo actualizar la URL si realmente cambió algo Y no ha sido actualizado antes
    if ((currentEnvId !== environmentId || currentDiagramId !== diagramId) && 
        (prevUrlRef.current.envId !== environmentId || prevUrlRef.current.diagramId !== diagramId)) {
      
      console.log(`Updating URL: env ${currentEnvId} -> ${environmentId}, diagram ${currentDiagramId} -> ${diagramId}`);
      
      // Update our reference to what we're changing to
      prevUrlRef.current = { envId: environmentId, diagramId };
      
      // Actualizar la URL para incluir IDs y nombres amigables
      router.replace(
        `/company/${companyId}/diagrams/${diagramId}?environmentId=${environmentId}&env=${sanitizedEnvName}&diagram=${sanitizedDiagramName}`, 
        { scroll: false }
      );
    } else {
      console.log('Skipping URL update - no change or already updated');
    }
  };

  // Update the batchStateUpdates function to handle type conversions
  const batchStateUpdates = useCallback((updates: {
    diagram?: Diagram | null;
    nodes?: Node[];
    edges?: Edge[];
  }) => {
    if (!isMounted.current || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      if (updates.diagram !== undefined) {
        stableDataRef.current.diagram = updates.diagram;
      }
      if (updates.nodes) {
        stableDataRef.current.nodes = updates.nodes;
        setNodes(convertToReactFlowNodes(updates.nodes));
      }
      if (updates.edges) {
        stableDataRef.current.edges = updates.edges;
        setEdges(convertToReactFlowEdges(updates.edges));
      }
      
      if (updates.diagram !== undefined && currentDiagram) {
        setPreviousDiagram(currentDiagram);
      }
      
      startTransition(() => {
        if (updates.nodes) {
          setNodes(convertToReactFlowNodes(updates.nodes));
        }
        if (updates.edges) {
          setEdges(convertToReactFlowEdges(updates.edges));
        }
      });
      
      ReactDOM.flushSync(() => {
        if (updates.diagram !== undefined) {
          setCurrentDiagram(updates.diagram);
        }
      });
    } finally {
      isUpdatingRef.current = false;
    }
  }, [currentDiagram]);

  // Define constants for consistent transition timings
  const MIN_LOADING_DURATION = 300; // ms
  
  const handleEnvironmentChange = async (environmentId: string) => {
    // Keep track of the currently displayed diagram before switching environments
    if (currentDiagram) {
      setPreviousDiagram(currentDiagram);
    }
    
    // Record start time to ensure minimum loading duration for smooth transitions
    const startTime = Date.now();
    
    // First, set loading state
    setLoading(true);
    
    // Set environment ID immediately
    setSelectedEnvironment(environmentId);
    
    try {
      // Encontrar el ambiente seleccionado para obtener su nombre
      const selectedEnv = environments.find(env => env.id === environmentId);
      if (!selectedEnv) {
        throw new Error('Ambiente no encontrado');
      }
      
      // Check cache for diagrams
      let diagramsData: Diagram[] = [];
      const diagramsCacheKey = `diagrams-${companyId}-${environmentId}`;
      
      if (diagramCache.has(diagramsCacheKey)) {
        console.log('Using cached diagrams data for environment change');
        diagramsData = diagramCache.get(diagramsCacheKey) || [];
      } else {
        diagramsData = await getDiagramsByEnvironment(companyId as string, environmentId);
        // Store in cache
        diagramCache.set(diagramsCacheKey, diagramsData);
        console.log('Fetched and cached diagrams data for environment change');
      }
      
      // Update diagrams list inside a transition to prevent UI jank
      startTransition(() => {
        setDiagrams(diagramsData);
      });

      if (diagramsData.length > 0) {
        // Seleccionamos el primer diagrama del nuevo ambiente
        const firstDiagram = diagramsData[0];
        
        // Set the diagram ID immediately to update the UI
        setSelectedDiagram(firstDiagram.id);
        
        // Actualizar la URL con nombres amigables
        updateUrlWithNames(environmentId, firstDiagram.id, selectedEnv.name, firstDiagram.name);
        
        // Then batch update the state for diagram, nodes, and edges
        batchStateUpdates({
          diagram: firstDiagram,
          nodes: firstDiagram.nodes || [],
          edges: firstDiagram.edges || []
        });
        
        // Calculate remaining time to ensure minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);
        
        // Ensure minimum loading time for smooth transition
        setTimeout(() => {
          if (isMounted.current) {
            setLoading(false);
          }
        }, remainingTime);
      } else {
        // Calculate remaining time to ensure minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);
        
        // Update states with a delay to ensure smooth transition
        setTimeout(() => {
          if (!isMounted.current) return;
          
          setSelectedDiagram(null);
          setCurrentDiagram(null);
          setNodes([]);
          setEdges([]);
          
          // Turn off loading state - stay on the same page to show "no diagrams" message
          setLoading(false);
        }, remainingTime);
      }
    } catch {
      message.error("No se pudieron cargar los diagramas. Por favor, inténtelo de nuevo más tarde.");
      setLoading(false);
    }
  };

  const handleDiagramChange = async (diagramId: string) => {
    // Keep track of the currently displayed diagram before switching
    if (currentDiagram) {
      setPreviousDiagram(currentDiagram);
    }
    
    // Record start time to ensure minimum loading duration for smooth transitions
    const startTime = Date.now();
    
    // First, set loading state - we're transitioning between diagrams
    setLoading(true);
    
    // Set diagram ID immediately
    setSelectedDiagram(diagramId);
    
    try {
      if (selectedEnvironment) {
        // Encontrar el ambiente seleccionado para obtener su nombre
        const selectedEnv = environments.find(env => env.id === selectedEnvironment);
        if (!selectedEnv) {
          throw new Error('Ambiente no encontrado');
        }
        
        // Check cache for specific diagram
        let diagramData: Diagram | null = null;
        const singleDiagramCacheKey = `diagram-${companyId}-${selectedEnvironment}-${diagramId}`;
        
        if (singleDiagramCache.has(singleDiagramCacheKey)) {
          console.log('Using cached diagram data for diagram change');
          diagramData = singleDiagramCache.get(singleDiagramCacheKey) || null;
        } else {
          console.log(`Cargando diagrama específico: ${diagramId} en ambiente ${selectedEnvironment}`);
          diagramData = await getDiagram(companyId as string, selectedEnvironment, diagramId);
          // Store in cache
          singleDiagramCache.set(singleDiagramCacheKey, diagramData);
          console.log('Fetched and cached specific diagram data for diagram change');
        }
        
        if (!diagramData || !isMounted.current) {
          setLoading(false);
          return;
        }
        
        // Actualizar la URL con nombres amigables
        updateUrlWithNames(selectedEnvironment, diagramId, selectedEnv.name, diagramData.name);
        
        // Use our batch update function to minimize rerenders
        // This ensures all state updates happen together
        batchStateUpdates({
          diagram: diagramData,
          nodes: diagramData.nodes || [],
          edges: diagramData.edges || []
        });
        
        // Calculate remaining time to ensure minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);
        
        // Ensure minimum loading time for smooth transition
        setTimeout(() => {
          if (isMounted.current) {
            setLoading(false);
          }
        }, remainingTime);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error cargando diagrama:", error);
      message.error("No se pudo cargar el diagrama. Por favor, inténtelo de nuevo más tarde.");
      setLoading(false);
    }
  };

  const handleCreateEnvironment = async () => {
    if (!newEnvironmentName.trim()) {
      message.error("El nombre del ambiente es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const environmentData = {
        name: newEnvironmentName,
        description: newEnvironmentDescription,
        category: newEnvironmentCategory
      };

      await createEnvironment(companyId as string, environmentData);
      message.success("Ambiente creado correctamente");

      // Recargar ambientes
      const environmentsData = await getEnvironments(companyId as string);
      setEnvironments(environmentsData);
      
      // Seleccionar el nuevo ambiente (asumiendo que es el último agregado)
      const newEnv = environmentsData.find(env => env.name === newEnvironmentName);
      if (newEnv) {
        setSelectedEnvironment(newEnv.id);
        setDiagrams([]);
        setSelectedDiagram(null);
        setCurrentDiagram(null);
      }

      // Cerrar el modal y limpiar campos
      setNewEnvironmentModalVisible(false);
      setNewEnvironmentName('');
      setNewEnvironmentDescription('');
      setNewEnvironmentCategory('desarrollo');
    } catch (error) {
      console.error("Error creando ambiente:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear el ambiente. Por favor, inténtelo de nuevo más tarde.";
      message.error(errorMessage);
    }
    setLoading(false);
  };

  const handleDeleteEnvironment = async (environmentId: string) => {
    // Find the environment name for confirmation
    const environmentToDelete = environments.find(env => env.id === environmentId);
    const environmentName = environmentToDelete?.name || 'el ambiente';
    
    Modal.confirm({
      title: 'Confirmar eliminación',
      content: `¿Estás seguro de que deseas eliminar ${environmentName}? Esta acción no se puede deshacer y eliminará todos los diagramas asociados.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true);
        try {
          await deleteEnvironment(companyId as string, environmentId);
          message.success("Ambiente eliminado correctamente");
          
          // Reload environments
          const environmentsData = await getEnvironments(companyId as string);
          setEnvironments(environmentsData);
          
          // If the deleted environment was selected, switch to another environment or clear selection
          if (selectedEnvironment === environmentId) {
            if (environmentsData.length > 0) {
              // Select the first available environment
              setSelectedEnvironment(environmentsData[0].id);
              // Load diagrams for the new environment
              const diagramsData = await getDiagramsByEnvironment(companyId as string, environmentsData[0].id);
              setDiagrams(diagramsData);
              if (diagramsData.length > 0) {
                setSelectedDiagram(diagramsData[0].id);
                setCurrentDiagram(diagramsData[0]);
              } else {
                setSelectedDiagram(null);
                setCurrentDiagram(null);
              }
            } else {
              // No environments left
              setSelectedEnvironment(null);
              setDiagrams([]);
              setSelectedDiagram(null);
              setCurrentDiagram(null);
            }
          }
        } catch (error) {
          console.error("Error eliminando ambiente:", error);
          const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar el ambiente. Por favor, inténtelo de nuevo más tarde.";
          message.error(errorMessage);
        }
        setLoading(false);
      }
    });
  };

  const handleCreateDiagram = async () => {
    if (!selectedEnvironment) {
      message.error("Debe seleccionar un ambiente primero");
      return;
    }

    if (!newDiagramName.trim()) {
      message.error("El nombre del diagrama es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const diagramData = {
        name: newDiagramName,
        description: newDiagramDescription,
        path: newDiagramPath.trim() || undefined,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const newDiagram = await createDiagram(companyId as string, selectedEnvironment, diagramData);

      // Recargar diagramas y actualizar el selector
      const diagramsData = await getDiagramsByEnvironment(companyId as string, selectedEnvironment);
      
      // Actualizar el estado de diagramas y seleccionar el nuevo
      setDiagrams(diagramsData);
      setSelectedDiagram(newDiagram.id);
      setCurrentDiagram(newDiagram);
      
      // Buscar el nombre del ambiente seleccionado
      const selectedEnv = environments.find(env => env.id === selectedEnvironment);
      if (!selectedEnv) {
        throw new Error('Ambiente no encontrado');
      }
      
      // Actualizar la URL con nombres amigables
      updateUrlWithNames(selectedEnvironment, newDiagram.id, selectedEnv.name, newDiagram.name);

      // Cerrar el modal y limpiar campos
      setNewDiagramModalVisible(false);
      setNewDiagramName('');
      setNewDiagramDescription('');
      setNewDiagramPath('');

      // Forzar actualización del selector
      startTransition(() => {
        setDiagrams([...diagramsData]);
      });

      // Mostrar mensaje de éxito después de actualizar
      message.success("Diagrama creado correctamente");
    } catch (error) {
      console.error("Error creando diagrama:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear el diagrama. Por favor, inténtelo de nuevo más tarde.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para organizar diagramas por directorios con estructura jerárquica completa
  const organizeByDirectories = (diagrams: Diagram[]) => {
    const organized: Record<string, Diagram[]> = {};
    
    diagrams.forEach(diagram => {
      let directory = 'root'; // Usar 'root' en lugar de 'Sin categoría' para mejor manejo
      
      if (diagram.path && diagram.path.trim() !== '') {
        // Dividir la ruta y tomar solo el primer nivel de directorio
        const pathParts = diagram.path.split('/').filter(part => part.trim() !== '');
        if (pathParts.length > 0) {
          directory = pathParts[0];
        }
      }
      
      if (!organized[directory]) {
        organized[directory] = [];
      }
      organized[directory].push(diagram);
    });
    
    // Ordenar diagramas dentro de cada directorio
    Object.keys(organized).forEach(key => {
      organized[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return organized;
  };

  // These functions have been replaced by the DiagramTreeSelect component

  // Función para confirmar eliminación de diagrama
  const confirmDeleteDiagram = (diagram: Diagram) => {
    // Verificar si el diagrama tiene nodos o conexiones
    if (diagram.nodes && diagram.nodes.length > 0) {
      message.error("No se puede eliminar un diagrama que contiene nodos. Por favor, limpie el diagrama primero usando el botón 'Limpiar'.");
      return;
    }
    setDiagramToDelete(diagram);
    setDeleteConfirmVisible(true);
  };

  // Función para eliminar diagrama
  const handleDeleteDiagram = async () => {
    if (!diagramToDelete || !selectedEnvironment) return;
    
    try {
      setLoading(true);
      
      await deleteDiagram(companyId as string, selectedEnvironment, diagramToDelete.id);
      
      // Recargar diagramas y actualizar el selector
      const diagramsData = await getDiagramsByEnvironment(companyId as string, selectedEnvironment);
      
      // Actualizar el estado de diagramas
      setDiagrams(diagramsData);
      
      // Si el diagrama eliminado era el seleccionado, limpiar la selección
      if (selectedDiagram === diagramToDelete.id) {
        if (diagramsData.length > 0) {
          // Seleccionar el primer diagrama disponible
          const firstDiagram = diagramsData[0];
          setSelectedDiagram(firstDiagram.id);
          setCurrentDiagram(firstDiagram);
          
          // Actualizar la URL
          const selectedEnv = environments.find(env => env.id === selectedEnvironment);
          if (selectedEnv) {
            updateUrlWithNames(selectedEnvironment, firstDiagram.id, selectedEnv.name, firstDiagram.name);
          }
        } else {
          // No hay más diagramas
          setSelectedDiagram(null);
          setCurrentDiagram(null);
          setNodes([]);
          setEdges([]);
          // Redirigir a la página de diagramas
          router.push(`/company/${companyId}/diagrams`);
        }
      }
      
      // Cerrar modal
      setDeleteConfirmVisible(false);
      setDiagramToDelete(null);

      // Forzar actualización del selector
      startTransition(() => {
        setDiagrams([...diagramsData]);
      });

      // Mostrar mensaje de éxito después de actualizar
      message.success("Diagrama eliminado correctamente");
    } catch (error: any) {
      console.error("Error eliminando diagrama:", error);
      message.error(error.message || "No se pudo eliminar el diagrama. Por favor, inténtelo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Track which type of loading is happening - initial or transition
  const [loadingType, setLoadingType] = useState<'initial' | 'transition' | null>(
    (environments.length === 0 || !selectedEnvironment) ? 'initial' : null
  );
  
  // Update loadingType based on overall loading state
  useEffect(() => {
    if (loading) {
      if (environments.length === 0 || !selectedEnvironment) {
        setLoadingType('initial');
      } else {
        setLoadingType('transition');
      }
    } else {
      setLoadingType(null);
    }
  }, [loading, environments.length, selectedEnvironment]);

  // Add a ref to track if initial load is complete
  const initialLoadCompleteRef = useRef(false);

  // Add back the loadEnvironments effect
  useEffect(() => {
    const loadEnvironments = async () => {
      // Skip if initial load is already complete
      if (initialLoadCompleteRef.current) {
        return;
      }

      try {
        // Set loading state first
        setLoading(true);
        
        // Pre-fetch everything in parallel to speed up initial load
        const fetchEnvironmentsPromise = (async () => {
          // Check cache first for environments
          const cacheKey = `env-${companyId}`;
          
          if (environmentCache.has(cacheKey)) {
            console.log('Using cached environments data');
            return environmentCache.get(cacheKey) || [];
          } else {
            const data = await getEnvironments(companyId as string);
            // Store in cache
            environmentCache.set(cacheKey, data);
            console.log('Fetched and cached environments data');
            return data;
          }
        })();
        
        // Wait for environments to be available before proceeding
        const environmentsData = await fetchEnvironmentsPromise;
        
        if (!isMounted.current) return;
        
        // Update environments immediately to show something to the user
        setEnvironments(environmentsData);

        // Si hay ambientes disponibles
        if (environmentsData.length > 0) {
          // Verificar si hay un environmentId en la URL
          const urlParams = new URLSearchParams(window.location.search);
          const urlEnvironmentId = urlParams.get('environmentId');
          const urlDiagramId = urlParams.get('id') || diagramId as string;
          
          // Buscar el ambiente en la lista de ambientes
          const targetEnvironment = urlEnvironmentId 
            ? environmentsData.find(env => env.id === urlEnvironmentId) 
            : environmentsData[0];
          
          if (targetEnvironment) {
            // Update the environment selection immediately
            setSelectedEnvironment(targetEnvironment.id);
            
            // Pre-fetch diagrams list and specific diagram in parallel
            const fetchDiagramsPromise = (async () => {
              // Check cache for diagrams
              const diagramsCacheKey = `diagrams-${companyId}-${targetEnvironment.id}`;
              
              if (diagramCache.has(diagramsCacheKey)) {
                console.log('Using cached diagrams data');
                return diagramCache.get(diagramsCacheKey) || [];
              } else {
                const data = await getDiagramsByEnvironment(companyId as string, targetEnvironment.id);
                diagramCache.set(diagramsCacheKey, data);
                console.log('Fetched and cached diagrams data');
                return data;
              }
            })();
            
            // Wait for diagrams to load
            const diagramsData = await fetchDiagramsPromise;
            
            if (!isMounted.current) return;
            // Update diagrams list
            setDiagrams(diagramsData);

            // Determine which diagram to load
            const hasDiagramId = urlDiagramId && diagramsData.some(d => d.id === urlDiagramId);
            const targetDiagramId = hasDiagramId ? urlDiagramId : 
                                   (diagramsData.length > 0 ? diagramsData[0].id : null);
            
            if (targetDiagramId) {
              // Update the selection immediately
              setSelectedDiagram(targetDiagramId);
              
              // Fetch the specific diagram
              const fetchDiagramPromise = (async () => {
                // Check cache for specific diagram
                const singleDiagramCacheKey = `diagram-${companyId}-${targetEnvironment.id}-${targetDiagramId}`;
                
                if (singleDiagramCache.has(singleDiagramCacheKey)) {
                  console.log('Using cached diagram data');
                  return singleDiagramCache.get(singleDiagramCacheKey) || null;
                } else {
                  console.log(`Cargando diagrama específico: ${targetDiagramId} en ambiente ${targetEnvironment.id}`);
                  const data = await getDiagram(companyId as string, targetEnvironment.id, targetDiagramId);
                  singleDiagramCache.set(singleDiagramCacheKey, data);
                  console.log('Fetched and cached specific diagram data');
                  return data;
                }
              })();
              
              // Wait for diagram data to load
              const diagramData = await fetchDiagramPromise;
              
              if (!isMounted.current || !diagramData) {
                setLoading(false);
                return;
              }
              
              // Update the URL before we update the diagram data
              const envName = targetEnvironment.name;
              const diagramName = diagramData.name;
              updateUrlWithNames(targetEnvironment.id, targetDiagramId, envName, diagramName);
              
              // Use batch state updates to minimize rerenders
              // This ensures all state updates happen together
              batchStateUpdates({
                diagram: diagramData,
                nodes: diagramData.nodes || [],
                edges: diagramData.edges || []
              });
              
              // Mark initial load as complete
              initialLoadCompleteRef.current = true;
              
              // Turn off loading with a small delay to ensure render is complete
              setTimeout(() => {
                if (isMounted.current) {
                  setLoading(false);
                }
              }, 300);
            } else {
              console.log('No hay diagramas disponibles para este ambiente');
              setSelectedDiagram(null);
              setCurrentDiagram(null);
              setNodes([]);
              setEdges([]);
              
              // Mark initial load as complete even if no diagrams
              initialLoadCompleteRef.current = true;
              
              // Turn off loading since we have no diagrams
              setLoading(false);
            }
          } else {
            // Mark initial load as complete even if no environment
            initialLoadCompleteRef.current = true;
            setLoading(false);
          }
        } else {
          // Mark initial load as complete even if no environments
          initialLoadCompleteRef.current = true;
          setLoading(false);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        message.error("No se pudieron cargar los datos. Por favor, inténtelo de nuevo más tarde.");
        // Mark initial load as complete even on error
        initialLoadCompleteRef.current = true;
        setLoading(false);
      }
    };

    loadEnvironments();
  }, [companyId, diagramId]); // Remove router, batchStateUpdates, and updateUrlWithNames from dependencies

  // Add back the group update effect
  useEffect(() => {
    const debounceTimeMs = 1000; // Wait 1 second between updates to prevent loops
    const updateTimeRef = { current: 0 }; // Local reference for debouncing
    
    const handleGroupUpdate = (event: CustomEvent) => {
      console.log("Received updateGroupNodes event:", event.detail);
      const { groupId, nodes: updatedNodes, edges: updatedEdges } = event.detail;
      
      // Prevent multiple rapid updates (debounce)
      const currentTime = Date.now();
      if (currentTime - updateTimeRef.current < debounceTimeMs) {
        console.log("Debouncing group update - too soon after last update");
        return;
      }
      
      // Update the timestamp
      updateTimeRef.current = currentTime;
      
      if (groupId && updatedNodes) {
        // Create a "safe" copy of the nodes with new references to avoid mutation issues
        const safeUpdatedNodes = updatedNodes.map((n: ReactFlowNode) => ({...n}));
        
        // Directly update our state instead of using reactFlowInstance
        setNodes(currentNodes => {
          const nodesWithoutGroup = currentNodes.filter(n => n.id !== groupId);
          return [...nodesWithoutGroup, ...safeUpdatedNodes];
        });
        
        if (updatedEdges && updatedEdges.length > 0) {
          setEdges(currentEdges => {
            // Keep edges that don't connect to the updated nodes
            const edgesToKeep = currentEdges.filter(edge => {
              // Keep edges that don't involve nodes in this group
              return !updatedNodes.some((n: ReactFlowNode) => n.id === edge.source || n.id === edge.target);
            });
            
            // Add the updated edges
            return [...edgesToKeep, ...updatedEdges];
          });
        }
      }
    };
    
    document.addEventListener('updateGroupNodes', handleGroupUpdate as EventListener);
    
    return () => {
      document.removeEventListener('updateGroupNodes', handleGroupUpdate as EventListener);
    };
  }, []);

  // Event listeners for node-level preview and run events
  useEffect(() => {
    const handleNodePreview = (event: CustomEvent) => {
      console.log("Received nodePreview event:", event.detail);
      const { nodeId, resourceData } = event.detail;
      
      // Store the node data for the preview modal
      setPreviewData(prevData => ({
        ...prevData,
        selectedNode: { nodeId, resourceData }
      }));
      
      // Show the preview modal
      setPreviewModalVisible(true);
    };

    const handleNodeRun = (event: CustomEvent) => {
      console.log("Received nodeRun event:", event.detail);
      const { nodeId, resourceData } = event.detail;
      
      // Store the node data for the run modal
      setPreviewData(prevData => ({
        ...prevData,
        selectedNode: { nodeId, resourceData }
      }));
      
      // Show the run modal
      setRunModalVisible(true);
    };

    // Only add event listeners to document to avoid duplicate events
    document.addEventListener('nodePreview', handleNodePreview as EventListener);
    document.addEventListener('nodeRun', handleNodeRun as EventListener);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('nodePreview', handleNodePreview as EventListener);
      document.removeEventListener('nodeRun', handleNodeRun as EventListener);
    };
  }, [/* No dependencies to avoid re-registering listeners */]);

  // Add new state for modals
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [promoteModalVisible, setPromoteModalVisible] = useState(false);
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [destroyModalVisible, setDestroyModalVisible] = useState(false);
  const [selectedTargetEnvironment, setSelectedTargetEnvironment] = useState<string>('');
  const [destroyConfirmationText, setDestroyConfirmationText] = useState<string>('');

  // Add new state for preview data
  const [previewData, setPreviewData] = useState<{
    resourcesToCreate: Array<{
      id: string;
      type: string;
      name: string;
      provider: string;
      changes: Record<string, unknown>;
    }>;
    resourcesToUpdate: Array<{
      id: string;
      type: string;
      name: string;
      provider: string;
      changes: Record<string, unknown>;
    }>;
    resourcesToDelete: Array<{
      id: string;
      type: string;
      name: string;
      provider: string;
    }>;
    selectedNode?: {
      nodeId: string;
      resourceData: {
        label: string;
        provider: string;
        resourceType: string;
      };
    };
  }>({
    resourcesToCreate: [],
    resourcesToUpdate: [],
    resourcesToDelete: []
  });

  // Modify handlePreview to analyze changes and update version history
  const handlePreview = useCallback(async () => {
    if (!currentDiagram) return;
    
    try {
      setLoading(true);
      
      // Simular análisis de cambios
      const mockPreviewData = {
        resourcesToCreate: currentDiagram.nodes
          .filter(node => node.type !== 'group')
          .map(node => ({
            id: node.id,
            type: node.type,
            name: node.data?.label || 'Unnamed Resource',
            provider: node.data?.provider || 'generic',
            changes: {
              create: true,
              properties: node.data || {}
            }
          })),
        resourcesToUpdate: [],
        resourcesToDelete: []
      };

      // Crear datos de versión más detallados
      const newVersion = {
        id: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: 'Usuario Actual',
        description: `Modificación de ${mockPreviewData.resourcesToCreate.length} recursos`,
        changes: {
          created: mockPreviewData.resourcesToCreate.length,
          updated: mockPreviewData.resourcesToUpdate.length,
          deleted: mockPreviewData.resourcesToDelete.length
        }
      };

      // Actualizar el estado de versiones
      setVersionHistory(prevHistory => {
        console.log('Actualizando historial de versiones:', [...prevHistory, newVersion]);
        return [newVersion, ...prevHistory];
      });
      
      // Actualizar el estado de preview
      setPreviewData(mockPreviewData);
      
      // Mostrar el modal de preview
      setPreviewModalVisible(true);

      // Mostrar mensaje de éxito
      message.success('Cambios registrados en el historial');
    } catch (error) {
      console.error('Error al generar la vista previa:', error);
      message.error('Error al generar la vista previa');
    } finally {
      setLoading(false);
    }
  }, [currentDiagram]);

  // Add handler functions
  const handleRun = useCallback(() => {
    setRunModalVisible(true);
  }, []);

  const handlePromote = () => {
    setPromoteModalVisible(true);
  };

  const handlePromoteConfirm = async () => {
    if (!selectedTargetEnvironment || !currentDiagram) return;
    
    try {
      setLoading(true);
      // Implement promotion logic here
      message.success('Diagrama promovido exitosamente');
      setPromoteModalVisible(false);
    } catch {
      message.error('Error al promover el diagrama');
    } finally {
      setLoading(false);
    }
  };

  // Modificar handleRunConfirm para que también actualice el historial
  const handleRunConfirm = async () => {
    if (!currentDiagram) return;
    
    try {
      setLoading(true);
      
      // Crear una nueva versión con más detalles
      const newVersion = {
        id: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: 'Usuario Actual',
        description: `Ejecución de ${previewData.resourcesToCreate.length} cambios`,
        changes: {
          created: previewData.resourcesToCreate.length,
          updated: previewData.resourcesToUpdate.length,
          deleted: previewData.resourcesToDelete.length
        }
      };

      // Actualizar el estado de versiones
      setVersionHistory(prevHistory => {
        console.log('Actualizando historial después de ejecutar:', [...prevHistory, newVersion]);
        return [newVersion, ...prevHistory];
      });
      
      // Implementar lógica de ejecución aquí
      message.success('Diagrama desplegado exitosamente');
      setRunModalVisible(false);
    } catch (error) {
      console.error('Error al desplegar el diagrama:', error);
      message.error('Error al desplegar el diagrama');
    } finally {
      setLoading(false);
    }
  };

  // Add destroy handlers
  const handleDestroy = () => {
    setDestroyConfirmationText(''); // Reset confirmation text
    setDestroyModalVisible(true);
  };

  const handleDestroyConfirm = async () => {
    if (!currentDiagram) return;
    
    // Validate that user typed the diagram name correctly
    if (destroyConfirmationText.trim() !== currentDiagram.name) {
      message.error(`Debe escribir exactamente "${currentDiagram.name}" para confirmar`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Clear all nodes and edges from the current diagram
      const clearedNodes: Node[] = [];
      const clearedEdges: Edge[] = [];
      
      // Update the current diagram with empty nodes and edges
      const updatedDiagram: Diagram = {
        ...currentDiagram,
        nodes: clearedNodes,
        edges: clearedEdges,
        updated_at: new Date().toISOString()
      };
      
      // Update the diagram via API
      if (selectedEnvironment) {
        await updateDiagram(companyId as string, selectedEnvironment, currentDiagram.id, {
          name: updatedDiagram.name,
          description: updatedDiagram.description,
          nodes: clearedNodes,
          edges: clearedEdges,
          viewport: updatedDiagram.viewport
        });
      }
      
      // Update local state immediately
      setCurrentDiagram(updatedDiagram);
      setNodes([]); // Clear ReactFlow nodes
      setEdges([]); // Clear ReactFlow edges
      
      // Update cache
      const singleDiagramCacheKey = `diagram-${companyId}-${selectedEnvironment}-${currentDiagram.id}`;
      singleDiagramCache.set(singleDiagramCacheKey, updatedDiagram);
      
      message.success(`Todos los recursos del diagrama "${currentDiagram.name}" han sido eliminados`);
      setDestroyModalVisible(false);
      setDestroyConfirmationText('');
    } catch {
      message.error('Error al destruir los recursos del diagrama');
    } finally {
      setLoading(false);
    }
  };

  // Nuevos estados para control de versiones
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [versionsModalVisible, setVersionsModalVisible] = useState(false);
  const [versionHistory, setVersionHistory] = useState<Array<{
    id: string;
    timestamp: string;
    author: string;
    description: string;
    changes: {
      created: number;
      updated: number;
      deleted: number;
    };
  }>>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Cargar información de la compañía
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}`);
        const data = await response.json();
        setCompany(data);
      } catch (error) {
        console.error('Error fetching company info:', error);
        message.error('No se pudo cargar la información de la compañía');
      }
    };

    if (companyId) {
      fetchCompanyInfo();
    }
  }, [companyId]);

  // Funciones para el control de versiones
  const handleVersions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No hay sesión activa');
        return;
      }

      // Fix URL structure to match backend routes
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${selectedEnvironment}/diagrams/${diagramId}/history`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Error al cargar las versiones');
      }
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      setVersionHistory(data);
      setVersionsModalVisible(true);
    } catch (err) {
      console.error('Error loading versions:', err);
      message.error(err instanceof Error ? err.message : 'Error al cargar las versiones');
    }
  };

  const handleHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No hay sesión activa');
        return;
      }

      // Fix URL structure to match backend routes
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${selectedEnvironment}/diagrams/${diagramId}/history`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || data.detail || 'Error al cargar el historial');
      }
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Formato de respuesta inválido');
      }
      
      setVersionHistory(data);
      setHistoryModalVisible(true);
    } catch (err) {
      console.error('Error loading history:', err);
      message.error(err instanceof Error ? err.message : 'Error al cargar el historial');
    }
  };

  const handleRollback = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No hay sesión activa');
        return;
      }

      // Fix URL structure to match backend routes
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${selectedEnvironment}/diagrams/${diagramId}/history`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Error al cargar las versiones');
      }
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      setVersionHistory(data);
      setRollbackModalVisible(true);
    } catch (err) {
      console.error('Error loading versions:', err);
      message.error(err instanceof Error ? err.message : 'Error al cargar las versiones');
    }
  };

  // Modificar handleRollbackConfirm para que actualice el historial después de revertir
  const handleRollbackConfirm = async () => {
    if (!selectedVersion) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No estás autenticado');
      }

      // Crear una nueva versión de reversión con más detalles
      const newVersion = {
        id: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: 'Usuario Actual',
        description: `Reversión a la versión ${selectedVersion}`,
        changes: {
          created: 0,
          updated: 0,
          deleted: 0
        }
      };

      // Actualizar el estado de versiones
      setVersionHistory(prevHistory => {
        console.log('Actualizando historial después de revertir:', [...prevHistory, newVersion]);
        return [newVersion, ...prevHistory];
      });
      
      message.success('Versión restaurada exitosamente');
      setRollbackModalVisible(false);
      handleDiagramChange(diagramId as string);
    } catch (err) {
      console.error('Error rolling back version:', err);
      message.error(err instanceof Error ? err.message : 'Error al restaurar la versión');
    }
  };

  // Agregar un efecto para depurar cambios en el historial
  useEffect(() => {
    console.log('Historial de versiones actualizado:', versionHistory);
  }, [versionHistory]);

  // Load credentials
  const [credentials, setCredentials] = useState<any[]>([]);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/companies/${companyId}/credentials`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCredentials(Array.isArray(data) ? data : []);
        } else {
          setCredentials([]);
        }
      } catch (error) {
        console.error('Error loading credentials:', error);
        setCredentials([]);
      }
    };

    loadCredentials();
  }, [companyId]);

  // Check if current environment has credentials
  const getCurrentEnvironmentCredentials = () => {
    if (!selectedEnvironment) return [];
    return credentials.filter(cred => 
      cred.environments && cred.environments.includes(selectedEnvironment)
    );
  };

  const environmentCredentials = getCurrentEnvironmentCredentials();
  const hasCredentials = environmentCredentials.length > 0;
  const currentEnvironmentName = environments.find(env => env.id === selectedEnvironment)?.name;

  // Helper function to render different sections based on activeSection
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'credentials':
        return (
          <div className="p-4 h-full">
            <CredentialsPage companyId={companyId as string} />
          </div>
        );
      case 'deployments':
        return (
          <div className="p-4 h-full">
            <DeploymentsPage companyId={companyId as string} />
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 h-full">
            <SettingsPage companyId={companyId as string} />
          </div>
        );
      case 'team':
        return (
          <div className="p-4 h-full">
            <TeamPage companyId={companyId as string} />
          </div>
        );
      case 'diagrams':
      default:
        return renderDiagramsSection();
    }
  };

  // Separamos el renderizado de la parte del diagrama para simplificar el código
  const renderDiagramEditor = () => {
    // Si hay diagrama seleccionado, lo mostramos
    if (currentDiagram) {
      return (
        <div className="h-full w-full" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <FlowEditor 
            key={`current-diagram-${currentDiagram.id}`}
            companyId={companyId as string} 
            environmentId={selectedEnvironment as string}
            diagramId={selectedDiagram as string} 
            initialDiagram={currentDiagram}
            initialViewport={currentDiagram.viewport}
            nodeTypes={memoizedNodeTypes}
            resourceCategories={resourceCategories}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSave={(diagramData) => {
              if (isUpdatingRef.current) return;
              
              // Store the ReactFlow data as-is since it's already in ReactFlow format
              const flowData = {
                nodes: diagramData.nodes,
                edges: diagramData.edges,
                viewport: diagramData.viewport || { x: 0, y: 0, zoom: 1 }
              };
              
              // Procesar los metadatos de grupos y posiciones de nodos
              const groupNodes = flowData.nodes.filter((node: ReactFlowNode) => node.type === 'group');
              const nodeGroups: Record<string, {
                nodeIds: string[];
                dimensions: { width: number; height: number };
                provider: string;
                label: string;
              }> = {};
              const nodePositions: Record<string, Record<string, {
                relativePosition: { x: number; y: number };
                dimensions: { width: number; height: number };
              }>> = {};

              // Construir estructura de grupos
              groupNodes.forEach((groupNode: ReactFlowNode) => {
                const childNodes = flowData.nodes.filter((node: ReactFlowNode) => node.parentNode === groupNode.id);
                nodeGroups[groupNode.id] = {
                  nodeIds: childNodes.map((node: ReactFlowNode) => node.id),
                  dimensions: {
                    width: typeof groupNode.style?.width === 'number' ? groupNode.style.width : 300,
                    height: typeof groupNode.style?.height === 'number' ? groupNode.style.height : 200
                  },
                  provider: groupNode.data?.provider || 'generic',
                  label: groupNode.data?.label || 'Group'
                };

                // Guardar posiciones relativas de los nodos dentro de este grupo
                nodePositions[groupNode.id] = {};
                childNodes.forEach((childNode: ReactFlowNode) => {
                  nodePositions[groupNode.id][childNode.id] = {
                    relativePosition: { ...childNode.position },
                    dimensions: {
                      width: typeof childNode.style?.width === 'number' ? childNode.style.width : (typeof childNode.width === 'number' ? childNode.width : 100),
                      height: typeof childNode.style?.height === 'number' ? childNode.style.height : (typeof childNode.height === 'number' ? childNode.height : 50)
                    }
                  };
                });
              });
              
              // Convertir los nodos y aristas de React Flow a nuestro formato personalizado
              const customNodes = convertToCustomNodes(diagramData.nodes);
              const customEdges = convertToCustomEdges(diagramData.edges);
              
              // Conservar el nombre y descripción originales del diagrama y guardar los cambios
              updateDiagram(
                companyId as string,
                selectedEnvironment as string,
                selectedDiagram as string,
                {
                  name: currentDiagram.name,
                  description: currentDiagram.description,
                  nodes: customNodes,
                  edges: customEdges,
                  viewport: flowData.viewport,
                  nodeGroups,
                  nodePositions
                }
              ).then((updated) => {
                console.log("Diagrama guardado exitosamente:", updated);
                message.success("Diagrama actualizado exitosamente.");
              }).catch(error => {
                console.error("Error al guardar diagrama:", error);
                message.error("No se pudo guardar el diagrama. Por favor, inténtelo de nuevo.");
              });
            }}
          />
        </div>
      );
    }
    
    // Si no está cargando y no hay diagrama, mostramos mensaje vacío
    if (!loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-10 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!selectedEnvironment 
                ? "Selecciona un ambiente"
                : "No hay diagramas disponibles"
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {!selectedEnvironment 
                ? "Selecciona o crea un ambiente para empezar a trabajar con diagramas de infraestructura"
                : "Este ambiente no tiene diagramas. Crea uno nuevo para empezar a diseñar tu infraestructura"
              }
            </p>
            {selectedEnvironment && (
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNewDiagramModalVisible(true)}
                className="bg-blue-600 hover:bg-blue-700 border-blue-600"
              >
                Crear Primer Diagrama
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    // Estado de carga
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="Cargando diagrama...">
          <div className="p-12"></div>
        </Spin>
      </div>
    );
  };

  // Rendering the diagrams section in a simplified way
  const renderDiagramsSection = () => (
    <div className="flex flex-col h-full">
      {/* Warning Banner for missing credentials */}
      {!hasCredentials && selectedEnvironment && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mb-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Sin credenciales configuradas
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  El ambiente <strong>{currentEnvironmentName}</strong> no tiene credenciales de cloud asociadas. 
                  No podrás crear o desplegar infraestructura hasta que configures las credenciales.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem(`activeSection_${companyId}`, 'credentials');
                    }
                    setActiveSection('credentials');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  <KeyIcon className="w-4 h-4 mr-2" />
                  Configurar credenciales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner - when credentials are configured */}
      {hasCredentials && selectedEnvironment && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mx-4 mb-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <KeyIcon className="h-4 w-4 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>{environmentCredentials.length}</strong> credencial(es) configuradas para{' '}
                <strong>{currentEnvironmentName}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Environment and Diagram selector */}
      <div className="mb-2 bg-white rounded-lg shadow-sm border border-gray-200 mx-2">
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium mr-2">Ambiente:</span>
                <EnvironmentTreeSelect 
                  environments={environments} 
                  value={selectedEnvironment ?? undefined}
                  onChange={handleEnvironmentChange}
                  placeholder="Selecciona un ambiente"
                  onDeleteEnvironment={handleDeleteEnvironment}
                  showDeleteButton={true}
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  className="ml-2 bg-blue-600 hover:bg-blue-700 border-blue-600"
                  onClick={() => setNewEnvironmentModalVisible(true)}
                  title="Crear nuevo ambiente"
                />
              </div>
              
              {selectedEnvironment && (
                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-gray-700 font-medium mr-2">Diagrama:</span>
                  <DiagramTreeSelect 
                    key={`diagram-selector-${diagrams.length}-${selectedDiagram}`} 
                    diagrams={diagrams} 
                    value={selectedDiagram ?? undefined}
                    onChange={handleDiagramChange}
                    companyId={companyId as string}
                    environmentId={selectedEnvironment as string}
                    className="min-w-[320px]"
                    showDeleteButton={true}
                    onDeleteDiagram={(diagramId) => {
                      // Find the diagram by ID and confirm deletion
                      const diagram = diagrams.find(d => d.id === diagramId);
                      if (diagram) {
                        confirmDeleteDiagram(diagram);
                      }
                    }}
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    className="ml-2 bg-green-600 hover:bg-green-700 border-green-600"
                    onClick={() => setNewDiagramModalVisible(true)}
                    title="Crear nuevo diagrama"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
                <Button
                  icon={<HistoryOutlined />}
                  className="hover:bg-gray-50"
                  title="Historial de cambios"
                  onClick={handleHistory}
                />
                <Button
                  icon={<RollbackOutlined />}
                  className="hover:bg-gray-50"
                  title="Revertir cambios"
                  onClick={handleRollback}
                />
                <Button
                  icon={<BranchesOutlined />}
                  className="hover:bg-gray-50"
                  title="Gestionar versiones"
                  onClick={handleVersions}
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  className="hover:bg-gray-50"
                  title="Vista previa"
                />
                <Button
                  type="primary"
                  danger={false}
                  icon={<PlayCircleOutlined />}
                  onClick={handleRun}
                  className="bg-green-600 hover:bg-green-700 border-green-600"
                  title="Ejecutar cambios"
                />
                <Button
                  type="primary"
                  icon={<ArrowUpOutlined />}
                  onClick={handlePromote}
                  className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                  title="Promover a otro ambiente"
                />
                <Button
                  danger
                  icon={<ClearOutlined />}
                  onClick={handleDestroy}
                  className="hover:bg-red-50"
                  title="Limpiar todos los recursos del diagrama"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Simplified but visible */}
      {currentDiagram && nodes.length > 0 && (
        <div className="px-2 py-1 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">Nodos:</span>
                <span className="text-sm font-semibold text-gray-900">{nodes.length}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-700">Conexiones:</span>
                <span className="text-sm font-semibold text-gray-900">{edges.length}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-600">
                  {currentEnvironmentName} • Sincronizado
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagram Area - With fixed height and absolute positioning */}
      <div className="relative bg-white mx-4 flex-1 rounded-lg overflow-hidden" 
           style={{ height: "calc(100vh - 250px)" }}>
        <div className="absolute inset-0">
          {renderDiagramEditor()}
        </div>
      </div>

      {/* Modal para crear nuevo ambiente */}
      <Modal
        title="Crear Nuevo Ambiente"
        open={newEnvironmentModalVisible}
        onCancel={() => {
          setNewEnvironmentModalVisible(false);
          setNewEnvironmentName('');
          setNewEnvironmentDescription('');
          setNewEnvironmentCategory('desarrollo');
        }}
        onOk={handleCreateEnvironment}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !newEnvironmentName.trim() }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ambiente*</label>
          <Input 
            value={newEnvironmentName} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnvironmentName(e.target.value)} 
            placeholder="Ej. Desarrollo, Pruebas, Producción"
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría*</label>
          <EnvironmentCategorySelect 
            value={newEnvironmentCategory}
            onChange={setNewEnvironmentCategory}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <TextArea 
            value={newEnvironmentDescription} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewEnvironmentDescription(e.target.value)}
            rows={4}
            placeholder="Descripción del ambiente"
          />
        </div>
      </Modal>

      {/* Modal para crear nuevo diagrama */}
      <Modal
        title="Crear Nuevo Diagrama"
        open={newDiagramModalVisible}
        onCancel={() => {
          setNewDiagramModalVisible(false);
          setNewDiagramName('');
          setNewDiagramDescription('');
          setNewDiagramPath('');
        }}
        onOk={handleCreateDiagram}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ 
          disabled: !newDiagramName.trim() || loading,
          loading: loading
        }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Diagrama*</label>
          <Input 
            value={newDiagramName} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDiagramName(e.target.value)} 
            placeholder="Ej. Infraestructura Web, Base de Datos"
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Directorio/Ruta (opcional)</label>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            value={newDiagramPath ? [newDiagramPath] : []}
            onChange={(values) => setNewDiagramPath(values[values.length - 1] || '')}
            placeholder="Ej. devops/hub-and-spoke, infrastructure/database"
            styles={{
              popup: {
                root: {
                  maxHeight: 300,
                  overflow: 'auto'
                }
              }
            }}
            options={(() => {
              // Obtener directorios existentes para sugerencias
              const existingDirs = new Set<string>();
              diagrams.forEach(diagram => {
                if (diagram.path && diagram.path.trim() !== '') {
                  const pathParts = diagram.path.split('/').filter(part => part.trim() !== '');
                  if (pathParts.length > 0) {
                    existingDirs.add(pathParts[0]);
                    // También agregar rutas completas comunes
                    existingDirs.add(diagram.path);
                  }
                }
              });
              
              return Array.from(existingDirs).map(dir => ({
                value: dir,
                label: (
                  <div className="flex items-center">
                    <FolderOutlined className="mr-2 text-orange-500" />
                    {dir}
                  </div>
                )
              }));
            })()}
            filterOption={(input, option) => {
              return option?.value.toLowerCase().includes(input.toLowerCase()) || false;
            }}
          />
          <p className="mt-1 text-xs text-gray-500">
            Organiza tus diagramas en directorios. Usa "/" para crear subdirectorios. 
            <br />
            <strong>Ejemplos:</strong> devops, infrastructure/aws, networks/security
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <TextArea 
            value={newDiagramDescription} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDiagramDescription(e.target.value)}
            rows={4}
            placeholder="Descripción del diagrama"
          />
        </div>
      </Modal>

      {/* Modal de confirmación para limpiar diagrama */}
      <Modal
        title="Limpiar Diagrama"
        open={destroyModalVisible}
        onCancel={() => {
          setDestroyModalVisible(false);
          setDestroyConfirmationText('');
        }}
        onOk={handleDestroyConfirm}
        okText="Limpiar"
        cancelText="Cancelar"
        okButtonProps={{ 
          danger: true,
          disabled: !currentDiagram || destroyConfirmationText.trim() !== currentDiagram.name
        }}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Esta acción eliminará todos los nodos y conexiones del diagrama <strong>"{currentDiagram?.name}"</strong>.
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Esta acción no se puede deshacer
            </p>
            <p className="mt-1 text-sm text-red-700">
              Todos los recursos y conexiones del diagrama serán eliminados permanentemente.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, escribe el nombre del diagrama: <strong>{currentDiagram?.name}</strong>
            </label>
            <Input 
              value={destroyConfirmationText} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDestroyConfirmationText(e.target.value)}
              placeholder={currentDiagram?.name}
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Confirmación de eliminación de diagrama */}
      <Modal
        title="Confirmar Eliminación"
        open={deleteConfirmVisible}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setDiagramToDelete(null);
        }}
        onOk={handleDeleteDiagram}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ 
          danger: true,
          disabled: diagramToDelete?.nodes && diagramToDelete.nodes.length > 0
        }}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar el diagrama <strong>"{diagramToDelete?.name}"</strong>?
          </p>
          {diagramToDelete?.path && (
            <p className="mt-1 text-xs text-gray-500">
              Ubicación: {diagramToDelete.path}
            </p>
          )}
          {diagramToDelete?.nodes && diagramToDelete.nodes.length > 0 ? (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ No se puede eliminar el diagrama porque contiene {diagramToDelete.nodes.length} nodo(s)
              </p>
              <p className="mt-2 text-sm text-yellow-700">
                Por favor, utiliza el botón "Limpiar" para eliminar todos los nodos antes de eliminar el diagrama.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-red-600">
              Esta acción no se puede deshacer.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );

  // We'll show the initial loading only for the first render
  if (loadingType === 'initial') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large">
          <div className="p-5">Cargando...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <CompanySidebar
        companyName={company?.name || 'Cargando...'}
        activeSection={activeSection}
        onSectionChange={(section) => {
          console.log('Section changed to:', section);
          setActiveSection(section);
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 overflow-auto">
        {renderActiveSection()}
      </div>

      {/* Dev Debug Info - can be removed in production */}
      <div className="fixed bottom-0 left-0 right-0 bg-red-100 text-xs p-1 text-red-900 z-50">
        Debug: {companyId as string} | Env: {selectedEnvironment || 'none'} | Diagram: {selectedDiagram || 'none'} | 
        Nodes: {nodes.length} | Edges: {edges.length} | Loading: {loading ? 'true' : 'false'} | 
        DiagramExists: {currentDiagram ? 'true' : 'false'}
      </div>
    </div>
  );
}