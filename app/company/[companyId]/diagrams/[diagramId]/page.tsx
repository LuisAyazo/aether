"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useTransition } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import './page.css';
import FlowEditor from '../../../../components/flow/FlowEditor';
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram, createEnvironment, updateDiagram } from '../../../../services/diagramService';
import { Button, Select, Typography, notification, Modal, Input, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { 
  addEdge, 
  applyEdgeChanges, 
  applyNodeChanges,
  Node, 
  Edge, 
  Connection, 
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from 'reactflow';
// Importar nodeTypes desde el archivo centralizado
import nodeTypes from '../../../../components/nodes/NodeTypes';

// Cache for environments and diagrams
const environmentCache = new Map<string, Environment[]>();
const diagramCache = new Map<string, Diagram[]>();
const singleDiagramCache = new Map<string, Diagram>();

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Categorías de recursos para el panel lateral
const resourceCategories = [
  {
    name: 'AWS - Cómputo',
    provider: 'aws' as const,
    items: [
      { type: 'ec2', name: 'EC2 Instance', description: 'Servidor virtual en la nube' },
      { type: 'ec2', name: 'Load Balancer', description: 'Balanceador de carga' },
      { type: 'group', name: 'Auto Scaling Group', description: 'Grupo de escalado automático' },
    ]
  },
  {
    name: 'AWS - Almacenamiento',
    provider: 'aws' as const,
    items: [
      { type: 's3', name: 'S3 Bucket', description: 'Almacenamiento de objetos' },
      { type: 'rds', name: 'RDS Instance', description: 'Base de datos relacional' },
    ]
  },
  {
    name: 'AWS - Aplicación',
    provider: 'aws' as const,
    items: [
      { type: 'lambda', name: 'Lambda Function', description: 'Función serverless' },
    ]
  },
  {
    name: 'GCP - Cómputo',
    provider: 'gcp' as const,
    items: [
      { type: 'compute', name: 'Compute Engine', description: 'Máquina virtual en la nube' },
      { type: 'group', name: 'Instance Group', description: 'Grupo de instancias' },
    ]
  },
  {
    name: 'GCP - Almacenamiento',
    provider: 'gcp' as const,
    items: [
      { type: 'storage', name: 'Cloud Storage', description: 'Almacenamiento de objetos' },
      { type: 'sql', name: 'Cloud SQL', description: 'Base de datos gestionada' },
    ]
  },
  {
    name: 'GCP - Aplicación',
    provider: 'gcp' as const,
    items: [
      { type: 'function', name: 'Cloud Functions', description: 'Función serverless' },
    ]
  },
  {
    name: 'Grupos y Áreas',
    provider: 'generic' as const,
    items: [
      { type: 'group', name: 'Grupo', description: 'Agrupar varios elementos' },
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
  const [isPending, startTransition] = useTransition();
  
  // Estados para los nodos y conexiones del diagrama actual
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
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

  // Function to batch state updates and reduce cascading rerenders
  const batchStateUpdates = useCallback((updates: {
    diagram?: Diagram | null;
    nodes?: Node[];
    edges?: Edge[];
  }) => {
    // We'll use React's batching ability with our own order of operations
    if (!isMounted.current) return;
    
    // First update our stable reference to keep the data consistent
    if (updates.diagram !== undefined) {
      stableDataRef.current.diagram = updates.diagram;
    }
    if (updates.nodes) {
      stableDataRef.current.nodes = updates.nodes;
    }
    if (updates.edges) {
      stableDataRef.current.edges = updates.edges;
    }
    
    // Save the previous diagram before updating to the new one
    if (updates.diagram !== undefined && currentDiagram) {
      setPreviousDiagram(currentDiagram);
    }
    
    // Use React 18's useTransition for lower priority updates
    startTransition(() => {
      if (updates.nodes) {
        setNodes(updates.nodes);
      }
      if (updates.edges) {
        setEdges(updates.edges);
      }
    });
    
    // But use flush sync for the diagram change as it's higher priority
    ReactDOM.flushSync(() => {
      if (updates.diagram !== undefined) {
        setCurrentDiagram(updates.diagram);
      }
    });
  }, [currentDiagram]);
  
  useEffect(() => {
    const loadEnvironments = async () => {
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
          const urlDiagramId = urlParams.get('id') || diagramId as string; // Usar el ID de diagrama de la query param o de la ruta
          
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
                // Cargar los diagramas del ambiente seleccionado
                const data = await getDiagramsByEnvironment(companyId as string, targetEnvironment.id);
                // Store in cache
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
                  // Cargar el diagrama específico
                  console.log(`Cargando diagrama específico: ${targetDiagramId} en ambiente ${targetEnvironment.id}`);
                  const data = await getDiagram(companyId as string, targetEnvironment.id, targetDiagramId);
                  // Store in cache
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
              // This ensures the URL is ready when the diagram loads
              const envName = targetEnvironment.name;
              const diagramName = diagramData.name;
              updateUrlWithNames(targetEnvironment.id, targetDiagramId, envName, diagramName);
              
              // Use batch state updates to minimize rerenders
              // This ensures all updates happen atomically
              batchStateUpdates({
                diagram: diagramData,
                nodes: diagramData.nodes || [],
                edges: diagramData.edges || []
              });
              
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
              
              // Turn off loading since we have no diagrams
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        notification.error({
          message: "Error",
          description: "No se pudieron cargar los datos. Por favor, inténtelo de nuevo más tarde."
        });
        setLoading(false);
      }
    };

    loadEnvironments();
  }, [companyId, diagramId, router]);

  // Track the previous URL params to avoid unnecessary URL updates
  const prevUrlRef = useRef({ envId: '', diagramId: '' });
  
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

  // Efecto para sincronizar los estados locales cuando cambia el diagrama actual
  useEffect(() => {
    if (currentDiagram) {
      setNodes(currentDiagram.nodes || []);
      setEdges(currentDiagram.edges || []);
    }
  }, [currentDiagram]);

  // Define constants for consistent transition timings
  const TRANSITION_DURATION = 500; // ms
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
    } catch (error) {
      console.error("Error cargando diagramas:", error);
      notification.error({
        message: "Error",
        description: "No se pudieron cargar los diagramas. Por favor, inténtelo de nuevo más tarde."
      });
      // Make sure to turn off loading state on error
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
      notification.error({
        message: "Error",
        description: "No se pudo cargar el diagrama. Por favor, inténtelo de nuevo más tarde."
      });
      // Make sure to turn off loading state on error
      setLoading(false);
    }
  };

  const handleCreateEnvironment = async () => {
    if (!newEnvironmentName.trim()) {
      notification.error({
        message: "Error",
        description: "El nombre del ambiente es obligatorio"
      });
      return;
    }

    setLoading(true);
    try {
      const environmentData = {
        name: newEnvironmentName,
        description: newEnvironmentDescription
      };

      await createEnvironment(companyId as string, environmentData);
      notification.success({
        message: "Éxito",
        description: "Ambiente creado correctamente"
      });

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
      notification.error({
        message: "Error",
        description: "No se pudo crear el ambiente. Por favor, inténtelo de nuevo más tarde."
      });
    }
    setLoading(false);
  };

  const handleCreateDiagram = async () => {
    if (!selectedEnvironment) {
      notification.error({
        message: "Error",
        description: "Debe seleccionar un ambiente primero"
      });
      return;
    }

    if (!newDiagramName.trim()) {
      notification.error({
        message: "Error",
        description: "El nombre del diagrama es obligatorio"
      });
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
      notification.success({
        message: "Éxito",
        description: "Diagrama creado correctamente"
      });

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
      notification.error({
        message: "Error",
        description: "No se pudo crear el diagrama. Por favor, inténtelo de nuevo más tarde."
      });
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
              value={selectedEnvironment || undefined}
              onChange={handleEnvironmentChange}
              placeholder="Seleccionar ambiente"
            >
              {environments.map(env => (
                <Option key={env.id} value={env.id}>{env.name}</Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setNewEnvironmentModalVisible(true)} 
              className="ml-2"
            >
              Nuevo Ambiente
            </Button>
          </div>
          
          {selectedEnvironment && (
            <div className="flex items-center">
              <span className="mr-2">Diagrama:</span>
              <Select 
                style={{ width: 200 }} 
                value={selectedDiagram || undefined}
                onChange={handleDiagramChange}
                placeholder="Seleccionar diagrama"
                disabled={!selectedEnvironment || diagrams.length === 0}
              >
                {diagrams.map(diagram => (
                  <Option key={diagram.id} value={diagram.id}>{diagram.name}</Option>
                ))}
              </Select>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setNewDiagramModalVisible(true)} 
                className="ml-2"
                disabled={!selectedEnvironment}
              >
                Nuevo Diagrama
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced diagram display with advanced transition handling */}
      <div className="relative h-[calc(100vh-200px)]">
        {/* Create a phantom layer for the previous diagram */}
        {loadingType === 'transition' && previousDiagram && selectedEnvironment && (
          <div className="phantom-diagram">
            <FlowEditor 
              companyId={companyId as string} 
              environmentId={selectedEnvironment}
              diagramId={previousDiagram.id} 
              initialDiagram={previousDiagram}
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
        
        {/* Loading overlay that appears during transitions */}
        <div className={`loading-overlay ${loadingType === 'transition' ? '' : 'hidden'}`}>
          <Spin size="large" className="loading-spinner">
            <div className="p-5">Cargando diagrama...</div>
          </Spin>
        </div>
        
        {/* Current diagram container with improved transitions */}
        <div className={`diagram-container ${loadingType === 'transition' ? 'loading' : 'ready'} h-full`}>
          {currentDiagram ? (
            <FlowEditor 
              key={`diagram-${currentDiagram.id}`} // Improved key for better reconciliation
              companyId={companyId as string} 
              environmentId={selectedEnvironment as string}
              diagramId={selectedDiagram as string} 
              initialDiagram={currentDiagram}
              nodeTypes={memoizedNodeTypes}
              resourceCategories={resourceCategories}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSave={(flowData) => {
                // Conservar el nombre y descripción originales del diagrama
                updateDiagram(
                  companyId as string,
                  selectedEnvironment as string,
                  selectedDiagram as string,
                  {
                    name: currentDiagram.name,
                    description: currentDiagram.description,
                    nodes: flowData.nodes,
                    edges: flowData.edges,
                    viewport: flowData.viewport
                  }
                ).catch(error => {
                  console.error("Error guardando diagrama:", error);
                  notification.error({
                    message: "Error",
                    description: "No se pudo guardar el diagrama. Por favor, inténtelo de nuevo."
                  });
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
    </div>
  );
}