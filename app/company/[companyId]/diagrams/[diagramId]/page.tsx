"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
// Importaciones adicionales para los tipos de nodos
import { 
  EC2Node, 
  S3BucketNode, 
  LambdaFunctionNode,
  RDSInstanceNode 
} from '../../../../components/nodes/AwsNodes';
import {
  ComputeEngineNode,
  CloudStorageNode,
  CloudFunctionsNode,
  CloudSQLNode
} from '../../../../components/nodes/GcpNodes';
import NodeGroup from '../../../../components/nodes/NodeGroup';
import AreaBackground from '../../../../components/nodes/AreaBackground';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Definir los tipos de nodos
const nodeTypes = {
  // AWS Nodes
  ec2: EC2Node,
  s3: S3BucketNode,
  lambda: LambdaFunctionNode,
  rds: RDSInstanceNode,
  // GCP Nodes
  compute: ComputeEngineNode,
  storage: CloudStorageNode,
  function: CloudFunctionsNode, // Corregido de CloudFunctionNode a CloudFunctionsNode
  sql: CloudSQLNode,
  // Group and Background
  group: NodeGroup,
  areaBackground: AreaBackground
};

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
  
  // Estados para los nodos y conexiones del diagrama actual
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
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

  useEffect(() => {
    const loadEnvironments = async () => {
      try {
        const environmentsData = await getEnvironments(companyId as string);
        setEnvironments(environmentsData);

        // Si hay ambientes disponibles
        if (environmentsData.length > 0) {
          // Verificar si hay un environmentId en la URL
          const urlParams = new URLSearchParams(window.location.search);
          const urlEnvironmentId = urlParams.get('environmentId');
          const urlDiagramId = urlParams.get('id') || diagramId; // Usar el ID de diagrama de la query param o de la ruta
          
          // Buscar el ambiente en la lista de ambientes
          const targetEnvironment = urlEnvironmentId 
            ? environmentsData.find(env => env.id === urlEnvironmentId) 
            : environmentsData[0];
          
          if (targetEnvironment) {
            setSelectedEnvironment(targetEnvironment.id);
            
            // Cargar los diagramas del ambiente seleccionado
            const diagramsData = await getDiagramsByEnvironment(companyId as string, targetEnvironment.id);
            setDiagrams(diagramsData);

            // Verificar si tenemos un diagrama válido
            const hasDiagramId = urlDiagramId && diagramsData.some(d => d.id === urlDiagramId);
            
            if (hasDiagramId) {
              setSelectedDiagram(urlDiagramId as string);
              // Cargar el diagrama específico
              console.log(`Cargando diagrama específico: ${urlDiagramId} en ambiente ${targetEnvironment.id}`);
              const diagramData = await getDiagram(companyId as string, targetEnvironment.id, urlDiagramId as string);
              setCurrentDiagram(diagramData);
              setNodes(diagramData.nodes || []);
              setEdges(diagramData.edges || []);
              
              // Actualizar la URL con nombres amigables
              const envName = targetEnvironment.name;
              const diagramName = diagramData.name;
              updateUrlWithNames(targetEnvironment.id, urlDiagramId as string, envName, diagramName);
            } else if (diagramsData.length > 0) {
              // Si no hay un diagrama específico o no es válido, usar el primero disponible
              console.log('No se encontró un diagrama específico, usando el primero disponible');
              const firstDiagram = diagramsData[0];
              setSelectedDiagram(firstDiagram.id);
              setCurrentDiagram(firstDiagram);
              setNodes(firstDiagram.nodes || []);
              setEdges(firstDiagram.edges || []);
              
              // Actualizar la URL con nombres amigables
              const envName = targetEnvironment.name;
              updateUrlWithNames(targetEnvironment.id, firstDiagram.id, envName, firstDiagram.name);
            } else {
              console.log('No hay diagramas disponibles para este ambiente');
              setSelectedDiagram(null);
              setCurrentDiagram(null);
              setNodes([]);
              setEdges([]);
            }
          }
        }

        setLoading(false);
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
    
    // Actualizar la URL para incluir IDs y nombres amigables
    router.replace(
      `/company/${companyId}/diagrams/${diagramId}?environmentId=${environmentId}&env=${sanitizedEnvName}&diagram=${sanitizedDiagramName}`, 
      { scroll: false }
    );
  };

  // Efecto para sincronizar los estados locales cuando cambia el diagrama actual
  useEffect(() => {
    if (currentDiagram) {
      setNodes(currentDiagram.nodes || []);
      setEdges(currentDiagram.edges || []);
    }
  }, [currentDiagram]);

  const handleEnvironmentChange = async (environmentId: string) => {
    setLoading(true);
    setSelectedEnvironment(environmentId);
    try {
      // Encontrar el ambiente seleccionado para obtener su nombre
      const selectedEnv = environments.find(env => env.id === environmentId);
      if (!selectedEnv) {
        throw new Error('Ambiente no encontrado');
      }
      
      const diagramsData = await getDiagramsByEnvironment(companyId as string, environmentId);
      setDiagrams(diagramsData);

      if (diagramsData.length > 0) {
        // Seleccionamos el primer diagrama del nuevo ambiente
        const firstDiagram = diagramsData[0];
        setSelectedDiagram(firstDiagram.id);
        setCurrentDiagram(firstDiagram);
        
        // También actualizamos los nodos y bordes
        setNodes(firstDiagram.nodes || []);
        setEdges(firstDiagram.edges || []);
        
        // Actualizar la URL con nombres amigables
        updateUrlWithNames(environmentId, firstDiagram.id, selectedEnv.name, firstDiagram.name);
      } else {
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
      }
    } catch (error) {
      console.error("Error cargando diagramas:", error);
      notification.error({
        message: "Error",
        description: "No se pudieron cargar los diagramas. Por favor, inténtelo de nuevo más tarde."
      });
    }
    setLoading(false);
  };

  const handleDiagramChange = async (diagramId: string) => {
    setLoading(true);
    setSelectedDiagram(diagramId);
    try {
      if (selectedEnvironment) {
        // Encontrar el ambiente seleccionado para obtener su nombre
        const selectedEnv = environments.find(env => env.id === selectedEnvironment);
        if (!selectedEnv) {
          throw new Error('Ambiente no encontrado');
        }
        
        const diagramData = await getDiagram(companyId as string, selectedEnvironment, diagramId);
        setCurrentDiagram(diagramData);
        setNodes(diagramData.nodes || []);
        setEdges(diagramData.edges || []);
        
        // Actualizar la URL con nombres amigables
        updateUrlWithNames(selectedEnvironment, diagramId, selectedEnv.name, diagramData.name);
      }
    } catch (error) {
      console.error("Error cargando diagrama:", error);
      notification.error({
        message: "Error",
        description: "No se pudo cargar el diagrama. Por favor, inténtelo de nuevo más tarde."
      });
    }
    setLoading(false);
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

  if (loading) {
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

      {currentDiagram ? (
        <div className="h-[calc(100vh-200px)]"> {/* Altura ajustada para dejar espacio para el header */}
          <FlowEditor 
            companyId={companyId as string} 
            environmentId={selectedEnvironment as string}
            diagramId={selectedDiagram as string} 
            initialDiagram={currentDiagram}
            nodeTypes={nodeTypes}
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
        </div>
      ) : (
        <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-lg text-gray-500">
            {!selectedEnvironment 
              ? "Seleccione o cree un ambiente para empezar"
              : "No hay diagramas disponibles en este ambiente. Cree uno nuevo para empezar."
            }
          </p>
        </div>
      )}

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