"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import './page.css';
import FlowEditor from '../../../../components/flow/FlowEditor';
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram, createEnvironment, updateDiagram } from '../../../../services/diagramService';
import { Button, Select, Typography, Modal, Input, Spin, message } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from 'reactflow';
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';
// Importar nodeTypes desde el archivo centralizado
import nodeTypes from '../../../../components/nodes/NodeTypes';
import { Node, Edge } from '../../../../services/diagramService';

// Cache for environments and diagrams
const environmentCache = new Map<string, Environment[]>();
const diagramCache = new Map<string, Diagram[]>();
const singleDiagramCache = new Map<string, Diagram>();

const { Title } = Typography;
const { TextArea } = Input;

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

  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  const [newDiagramDescription, setNewDiagramDescription] = useState<string>('');

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
          
          // Si no hay diagramas, actualizar la URL solo con el ambiente
          const sanitizedEnvName = selectedEnv.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
            
          router.replace(
            `/company/${companyId}/diagrams?environmentId=${environmentId}&env=${sanitizedEnvName}`,
            { scroll: false }
          );
          
          // Turn off loading state
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
        description: newEnvironmentDescription
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
    } catch (error) {
      console.error("Error creando ambiente:", error);
      message.error("No se pudo crear el ambiente. Por favor, inténtelo de nuevo más tarde.");
    }
    setLoading(false);
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
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const newDiagram = await createDiagram(companyId as string, selectedEnvironment, diagramData);
      message.success("Diagrama creado correctamente");

      // Recargar diagramas
      const diagramsData = await getDiagramsByEnvironment(companyId as string, selectedEnvironment);
      setDiagrams(diagramsData);
      
      // Seleccionar el nuevo diagrama
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
    } catch (error) {
      console.error("Error creando diagrama:", error);
      message.error("No se pudo crear el diagrama. Por favor, inténtelo de nuevo más tarde.");
    }
    setLoading(false);
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

  // Modify handlePreview to analyze changes
  const handlePreview = useCallback(async () => {
    if (!currentDiagram) return;
    
    try {
      setLoading(true);
      // Simular análisis de cambios (esto debería ser reemplazado por tu lógica real)
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
      
      setPreviewData(mockPreviewData);
      setPreviewModalVisible(true);
    } catch {
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

  const handleRunConfirm = async () => {
    if (!currentDiagram) return;
    
    try {
      setLoading(true);
      // Implement run logic here
      message.success('Diagrama desplegado exitosamente');
      setRunModalVisible(false);
    } catch {
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
    <div className="p-4">
      <div className="mb-6">
        <Title level={3}>Diagrama</Title>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center">
            <span className="mr-2">Ambiente:</span>
            <Select 
              style={{ width: 200 }} 
              value={selectedEnvironment}
              onChange={handleEnvironmentChange}
              options={environments.map(env => ({
                value: env.id,
                label: env.name
              }))}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              className="ml-2"
              onClick={handleCreateEnvironment}
            >
              Nuevo Ambiente
            </Button>
          </div>
          
          {selectedEnvironment && (
            <div className="flex items-center">
              <span className="mr-2">Diagrama:</span>
              <Select 
                style={{ width: 200 }} 
                value={selectedDiagram}
                onChange={handleDiagramChange}
                options={diagrams.map(diag => ({
                  value: diag.id,
                  label: diag.name
                }))}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                className="ml-2"
                onClick={handleCreateDiagram}
              >
                Nuevo Diagrama
              </Button>
            </div>
          )}

          {/* Infrastructure Management Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
            >
              Preview
            </Button>

            <Button
              type="primary"
              danger={false}
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              className="bg-green-600 hover:bg-green-700 border-green-600"
            >
              Run
            </Button>

            <Button
              type="primary"
              icon={<ArrowUpOutlined />}
              onClick={handlePromote}
            >
              Promote
            </Button>

            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDestroy}
            >
              Clear Diagram
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced diagram display with advanced transition handling */}
      <div className="relative h-[calc(100vh-200px)]">
        {/* Create a phantom layer for the previous diagram */}
        {loadingType === 'transition' && previousDiagram && selectedEnvironment && (
          <div>
            <FlowEditor 
              key={`prev-diagram-${previousDiagram.id}`}
              companyId={companyId as string} 
              environmentId={selectedEnvironment}
              diagramId={previousDiagram.id} 
              initialDiagram={{
                ...previousDiagram,
                created_at: previousDiagram.created_at || new Date().toISOString(),
                updated_at: previousDiagram.updated_at || new Date().toISOString(),
              }}
              initialViewport={previousDiagram.viewport}
              nodeTypes={memoizedNodeTypes}
              resourceCategories={resourceCategories}
              nodes={previousDiagram.nodes || []}
              edges={previousDiagram.edges || []}
              onNodesChange={() => {}}
              onEdgesChange={() => {}}
              onConnect={() => {}}
            />
          </div>
        )}
        
        {/* Current diagram container */}
        <div className="diagram-container h-full">
          {currentDiagram ? (
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
          ) : !loading ? (
            <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-md">
              <p className="text-lg text-gray-500">
                {!selectedEnvironment 
                  ? "Seleccione o cree un ambiente para empezar"
                  : "No hay diagramas disponibles en este ambiente. Cree uno nuevo para empezar."
                }
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal para crear nuevo ambiente */}
      <Modal
        title="Crear Nuevo Ambiente"
        open={newEnvironmentModalVisible}
        onCancel={() => setNewEnvironmentModalVisible(false)}
        onOk={handleCreateEnvironment}
        okText="Crear"
        cancelText="Cancelar"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ambiente*</label>
          <Input 
            value={newEnvironmentName} 
            onChange={e => setNewEnvironmentName(e.target.value)} 
            placeholder="Ej. Desarrollo, Pruebas, Producción"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <TextArea 
            value={newEnvironmentDescription} 
            onChange={e => setNewEnvironmentDescription(e.target.value)}
            rows={4}
            placeholder="Descripción del ambiente"
          />
        </div>
      </Modal>

      {/* Modal para crear nuevo diagrama */}
      <Modal
        title="Crear Nuevo Diagrama"
        open={newDiagramModalVisible}
        onCancel={() => setNewDiagramModalVisible(false)}
        onOk={handleCreateDiagram}
        okText="Crear"
        cancelText="Cancelar"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Diagrama*</label>
          <Input 
            value={newDiagramName} 
            onChange={e => setNewDiagramName(e.target.value)} 
            placeholder="Ej. Arquitectura de microservicios"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <TextArea 
            value={newDiagramDescription} 
            onChange={e => setNewDiagramDescription(e.target.value)}
            rows={4}
            placeholder="Descripción del diagrama"
          />
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Vista Previa de Cambios"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Cerrar
          </Button>,
          <Button 
            key="run" 
            type="primary" 
            onClick={() => {
              setPreviewModalVisible(false);
              handleRun();
            }}
          >
            Ejecutar Cambios
          </Button>
        ]}
        width={800}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">Resumen de Cambios</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{previewData.resourcesToCreate.length}</div>
                <div className="text-sm text-green-700">Recursos a Crear</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="text-2xl font-bold text-yellow-600">{previewData.resourcesToUpdate.length}</div>
                <div className="text-sm text-yellow-700">Recursos a Actualizar</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{previewData.resourcesToDelete.length}</div>
                <div className="text-sm text-red-700">Recursos a Eliminar</div>
              </div>
            </div>
          </div>

          {/* Recursos a Crear */}
          {previewData.resourcesToCreate.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2 text-green-700">Recursos a Crear</h4>
              <div className="space-y-2">
                {previewData.resourcesToCreate.map(resource => (
                  <div key={resource.id} className="bg-white p-3 rounded border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{resource.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({resource.type})</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        {resource.provider}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="font-medium">Propiedades:</div>
                      <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(resource.changes.properties, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recursos a Actualizar */}
          {previewData.resourcesToUpdate.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2 text-yellow-700">Recursos a Actualizar</h4>
              <div className="space-y-2">
                {previewData.resourcesToUpdate.map(resource => (
                  <div key={resource.id} className="bg-white p-3 rounded border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{resource.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({resource.type})</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        {resource.provider}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="font-medium">Cambios:</div>
                      <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(resource.changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recursos a Eliminar */}
          {previewData.resourcesToDelete.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2 text-red-700">Recursos a Eliminar</h4>
              <div className="space-y-2">
                {previewData.resourcesToDelete.map(resource => (
                  <div key={resource.id} className="bg-white p-3 rounded border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{resource.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({resource.type})</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                        {resource.provider}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-md mt-4">
            <p className="text-sm text-blue-700">
              Esta es una vista previa de los cambios que se aplicarán al ejecutar el diagrama.
              Los recursos se crearán en el ambiente {environments.find(env => env.id === selectedEnvironment)?.name}.
            </p>
          </div>
        </div>
      </Modal>

      {/* Promote Modal */}
      <Modal
        title="Promover Diagrama"
        open={promoteModalVisible}
        onCancel={() => setPromoteModalVisible(false)}
        onOk={handlePromoteConfirm}
        okText="Promover"
        cancelText="Cancelar"
      >
        <div className="space-y-4">
          <p>Seleccione el ambiente destino para promover el diagrama:</p>
          <Select
            style={{ width: '100%' }}
            value={selectedTargetEnvironment}
            onChange={(value: string) => setSelectedTargetEnvironment(value)}
            options={environments
              .filter(env => env.id !== selectedEnvironment)
              .map(env => ({
                value: env.id,
                label: env.name
              }))}
          />
        </div>
      </Modal>

      {/* Run Modal */}
      <Modal
        title="Desplegar Diagrama"
        open={runModalVisible}
        onCancel={() => setRunModalVisible(false)}
        onOk={handleRunConfirm}
        okText="Desplegar"
        cancelText="Cancelar"
      >
        <div className="space-y-4">
          <p>¿Está seguro que desea desplegar este diagrama en el ambiente actual?</p>
          <p className="text-sm text-gray-500">
            Esta acción desplegará todos los recursos definidos en el diagrama en el ambiente {environments.find(env => env.id === selectedEnvironment)?.name}.
          </p>
        </div>
      </Modal>

      {/* Destroy All Modal */}
      <Modal
        title="Limpiar Diagrama"
        open={destroyModalVisible}
        onCancel={() => {
          setDestroyModalVisible(false);
          setDestroyConfirmationText('');
        }}
        onOk={handleDestroyConfirm}
        okText="Limpiar Diagrama"
        cancelText="Cancelar"
        okButtonProps={{ 
          danger: true,
          disabled: destroyConfirmationText.trim() !== (currentDiagram?.name || '')
        }}
      >
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-red-800 font-semibold">⚠️ ADVERTENCIA: Esta acción es irreversible</p>
            <p className="text-red-700 mt-2">
              Esta acción eliminará TODOS los nodos y conexiones de este diagrama específico.
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-gray-700">
              <strong>Diagrama a destruir:</strong> {currentDiagram?.name}
            </p>
            <p className="text-gray-700">
              <strong>Ambiente:</strong> {environments.find(env => env.id === selectedEnvironment)?.name}
            </p>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              Para confirmar esta acción, escriba exactamente el nombre del diagrama:
            </p>
            <p className="text-yellow-900 font-mono font-semibold mt-1">
              {currentDiagram?.name}
            </p>
          </div>
          
          <div>
            <Input
              placeholder={`Escriba: ${currentDiagram?.name}`}
              value={destroyConfirmationText}
              onChange={(e) => setDestroyConfirmationText(e.target.value)}
              className={`${
                destroyConfirmationText.trim() === (currentDiagram?.name || '') 
                  ? 'border-green-400' 
                  : destroyConfirmationText.trim() !== '' 
                    ? 'border-red-400' 
                    : ''
              }`}
            />
          </div>
          
          <p className="text-sm text-gray-500">
            Esta operación eliminará permanentemente todos los nodos y conexiones de este diagrama.
            El diagrama quedará completamente vacío y podrá comenzar de nuevo.
          </p>
        </div>
      </Modal>
    </div>
  );
}