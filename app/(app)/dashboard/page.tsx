'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button, Select, Modal, Input, Spin, message } from 'antd';
import { PlusOutlined as AntPlusOutlined, EyeOutlined, PlayCircleOutlined, FolderOpenOutlined as AntFolderIcon } from '@ant-design/icons';
import { 
  FolderIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';

// Componentes
import FlowEditor from '../../components/flow/FlowEditor'; 
import EnvironmentTreeSelect from '../../components/ui/EnvironmentTreeSelect'; 
import DiagramTreeSelect from '../../components/ui/DiagramTreeSelect'; 
import CompanySidebar from '../../components/ui/CompanySidebar'; 

// Servicios
import { getCompanies, Company } from '../../services/companyService';
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram, createEnvironment, updateDiagram } from '../../services/diagramService'; // Removido deleteDiagram, deleteEnvironment por ahora
import { getCurrentUser, isAuthenticated, User } from '../../services/authService';

// Tipos y utilidades
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


export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname(); // Aunque no se usa directamente en la lógica de este useEffect, es bueno tenerlo si se necesita
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);

  const [newEnvironmentModalVisible, setNewEnvironmentModalVisible] = useState<boolean>(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState<string>('');
  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  
  const [activeSectionInSidebar, setActiveSectionInSidebar] = useState<'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team'>('diagrams');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isFirstLoginNoCompanies, setIsFirstLoginNoCompanies] = useState(false);

  // Efecto para establecer el usuario y manejar la autenticación inicial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = getCurrentUser();
    setUser(currentUser);
    // La lógica de redirección al onboarding está en AppLayout.
    // Si llegamos aquí, o el onboarding se completó o no era necesario.
  }, [router]);

  // Efecto para cargar datos basado en el usuario y su tipo de uso
  useEffect(() => {
    if (!user) { // Si el usuario aún no se ha establecido desde el efecto anterior
      setLoading(true); // Mostrar carga mientras se espera al usuario
      return; 
    }

    if (user.usage_type === null) {
      // AppLayout ya debería haber redirigido a onboarding.
      // Si estamos aquí, es un estado transitorio, no cargar nada.
      setLoading(false); 
      return;
    }

    async function fetchCompanyData() {
      setLoading(true);
      try {
        const companies = await getCompanies();
        if (companies.length > 0) {
          const firstCompany = companies[0]; 
          setActiveCompany(firstCompany);
          setIsFirstLoginNoCompanies(false);

          const envs = await getEnvironments(firstCompany._id || firstCompany.id!);
          setEnvironments(envs);

          if (envs.length > 0) {
            setSelectedEnvironment(envs[0].id);
            const diags = await getDiagramsByEnvironment(firstCompany._id || firstCompany.id!, envs[0].id);
            setDiagrams(diags);
            if (diags.length > 0) {
              setSelectedDiagram(diags[0].id);
              const diagramData = await getDiagram(firstCompany._id || firstCompany.id!, envs[0].id, diags[0].id);
              setCurrentDiagram(diagramData);
              setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []);
              setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []);
            } else {
              setCurrentDiagram(null); setNodes([]); setEdges([]); setSelectedDiagram(null);
            }
          } else {
            setDiagrams([]); setSelectedDiagram(null); setCurrentDiagram(null); setNodes([]); setEdges([]); setSelectedEnvironment(null);
          }
        } else {
          setIsFirstLoginNoCompanies(true); 
          setActiveCompany(null);
          setEnvironments([]); setDiagrams([]); setSelectedEnvironment(null); setSelectedDiagram(null); setCurrentDiagram(null); setNodes([]); setEdges([]);
        }
      } catch (e: any) {
        setError(e.message || 'Error al cargar datos de compañía.');
        message.error(e.message || 'Error al cargar datos de compañía.');
      } finally {
        setLoading(false);
      }
    }
    
    if (user.usage_type === 'company') {
      fetchCompanyData();
    } else if (user.usage_type === 'personal') {
      // Lógica para dashboard personal
      setActiveCompany(null); // No hay compañía activa
      setEnvironments([]); // No hay ambientes de compañía
      setDiagrams([]); // No hay diagramas de compañía
      setSelectedEnvironment(null);
      setSelectedDiagram(null);
      setCurrentDiagram(null); // O un diagrama personal por defecto si se implementa
      setNodes([]);
      setEdges([]);
      setIsFirstLoginNoCompanies(false);
      setLoading(false);
    } else {
      // Tipo de uso desconocido o no establecido aún (después de que no sea null)
      setLoading(false);
    }
  }, [user?.id, user?.usage_type, router]); // Depender de user.id y user.usage_type

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect: OnConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), []);

  const convertToReactFlowNodes = (customNodes: CustomNode[]): ReactFlowNode[] => customNodes.map(n => ({...n, data: {...n.data}} as ReactFlowNode));
  const convertToReactFlowEdges = (customEdges: CustomEdge[]): ReactFlowEdge[] => customEdges.map(e => ({...e} as ReactFlowEdge));
  
  const handleEnvironmentChange = async (environmentId: string) => {
    if (!activeCompany) return;
    setSelectedEnvironment(environmentId);
    setLoading(true);
    try {
      const diags = await getDiagramsByEnvironment(activeCompany._id || activeCompany.id!, environmentId);
      setDiagrams(diags);
      if (diags.length > 0) {
        setSelectedDiagram(diags[0].id);
        const diagramData = await getDiagram(activeCompany._id || activeCompany.id!, environmentId, diags[0].id);
        setCurrentDiagram(diagramData);
        setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []);
        setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []);
      } else {
        setSelectedDiagram(null); setCurrentDiagram(null); setNodes([]); setEdges([]);
      }
    } catch (e:any) { message.error("Error al cambiar de ambiente: " + e.message); }
    finally { setLoading(false); }
  };

  const handleDiagramChange = async (diagramId: string) => {
    if (!activeCompany || !selectedEnvironment) return;
    setSelectedDiagram(diagramId);
    setLoading(true);
    try {
      const diagramData = await getDiagram(activeCompany._id || activeCompany.id!, selectedEnvironment, diagramId);
      setCurrentDiagram(diagramData);
      setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []);
      setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []);
    } catch (e:any) { message.error("Error al cambiar de diagrama: " + e.message); }
    finally { setLoading(false); }
  };
  
  const handleSaveDiagram = async (data: { nodes: ReactFlowNode[], edges: ReactFlowEdge[], viewport?: ReactFlowViewport }) => {
    if (!activeCompany || !selectedEnvironment || !selectedDiagram || !currentDiagram) return;
    const customNodes = data.nodes.map(n => ({ id: n.id, type: n.type!, position: n.position, data: n.data, width: n.width, height: n.height, parentNode: n.parentNode, style: n.style } as CustomNode));
    const customEdges = data.edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type, animated: e.animated, label: e.label as string, data: e.data, style: e.style } as CustomEdge));
    
    try {
      await updateDiagram(activeCompany._id || activeCompany.id!, selectedEnvironment, selectedDiagram, {
        name: currentDiagram.name,
        description: currentDiagram.description,
        nodes: customNodes,
        edges: customEdges,
        viewport: data.viewport || currentDiagram.viewport
      });
      message.success("Diagrama guardado.");
    } catch (e:any) {
      message.error("Error al guardar el diagrama: " + e.message);
    }
  };

  if (loading) { // Loader general mientras se determina el estado
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spin size="large" />
        <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando dashboard...</p>
      </div>
    );
  }

  if (user?.usage_type === 'personal') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 sm:p-10 max-w-md w-full">
           <div className="mx-auto mb-6 text-5xl font-bold">
            <span className="text-slate-900 dark:text-slate-100">Infra</span>
            <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">UX</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Dashboard Personal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Este es tu espacio personal. ¡Próximamente más funcionalidades aquí!
          </p>
          <Button type="primary" size="large" className="bg-electric-purple-600 hover:bg-electric-purple-700">
            Crear Diagrama Personal (Próximamente)
          </Button>
        </div>
      </div>
    );
  }
  
  if (user?.usage_type === 'company' && isFirstLoginNoCompanies) {
     return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 sm:p-10 max-w-md w-full">
          <FolderIcon className="mx-auto h-16 w-16 text-slate-400 mb-6" />
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            ¡Bienvenido, {user?.name || 'Usuario'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Es hora de organizar tu infraestructura. <br/>Crea tu primera compañía para empezar.
          </p>
          <Link
            href="/company/create"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-electric-purple-600 hover:bg-electric-purple-700 focus:outline-none transition-transform transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Compañía
          </Link>
        </div>
      </div>
    );
  }

  if (user?.usage_type === 'company' && activeCompany) {
    return (
      <div className="flex h-screen">
        <CompanySidebar 
          companyName={activeCompany.name || 'Compañía'} 
          activeSection={activeSectionInSidebar} 
          onSectionChange={(section: 'diagrams' | 'credentials' | 'deployments' | 'settings' | 'team') => setActiveSectionInSidebar(section)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedEnvironment && ( 
            <div className="bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Ambiente:</span>
                  <EnvironmentTreeSelect 
                    environments={environments} 
                    value={selectedEnvironment} 
                    onChange={handleEnvironmentChange} 
                    placeholder="Seleccionar Ambiente"
                  />
                   <Button type="link" size="small" onClick={() => setNewEnvironmentModalVisible(true)} className="ml-1 text-electric-purple-600">
                      + Nuevo Ambiente
                    </Button>
                </div>
                {selectedEnvironment && (
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Diagrama:</span>
                  <DiagramTreeSelect 
                    diagrams={diagrams} 
                    value={selectedDiagram ?? undefined} 
                    onChange={handleDiagramChange} 
                    companyId={activeCompany?._id || activeCompany?.id || ''}
                    environmentId={selectedEnvironment}
                  />
                     <Button type="link" size="small" onClick={() => setNewDiagramModalVisible(true)} className="ml-1 text-electric-purple-600">
                      + Nuevo Diagrama
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button icon={<EyeOutlined />} onClick={() => message.info("Función de Preview próximamente.")}>Preview</Button>
                <Button type="primary" icon={<PlayCircleOutlined />} className="bg-green-600 hover:bg-green-700" onClick={() => message.info("Función de Run próximamente.")}>Run</Button>
              </div>
            </div>
          )}

          <div className="relative flex-1 bg-slate-50 dark:bg-slate-900">
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10"><Spin size="large" /></div>}
            
            {!loading && selectedDiagram && currentDiagram && (
              <FlowEditor
                key={`${activeCompany._id}-${selectedEnvironment}-${selectedDiagram}`}
                companyId={activeCompany._id || activeCompany.id!}
                environmentId={selectedEnvironment!}
                diagramId={selectedDiagram!}
                initialDiagram={currentDiagram}
                initialNodes={nodes} 
                initialEdges={edges} 
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSave={handleSaveDiagram}
                nodeTypes={nodeTypes}
              />
            )}
            {!loading && selectedEnvironment && diagrams.length === 0 && (
               <div className="flex items-center justify-center h-full">
                  <div className="text-center p-10">
                      <AntFolderIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Sin Diagramas</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Este ambiente no tiene diagramas. Crea uno para empezar.</p>
                      <Button type="primary" onClick={() => setNewDiagramModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Diagrama</Button>
                  </div>
              </div>
            )}
             {!loading && !selectedEnvironment && environments.length > 0 && (
               <div className="flex items-center justify-center h-full">
                  <div className="text-center p-10">
                      <AntFolderIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Selecciona un Ambiente</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Elige un ambiente para ver o crear diagramas.</p>
                  </div>
              </div>
            )}
             {!loading && environments.length === 0 && user?.usage_type === 'company' && ( // Solo mostrar si es tipo compañía
               <div className="flex items-center justify-center h-full">
                  <div className="text-center p-10">
                      <AntFolderIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Sin Ambientes</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Esta compañía no tiene ambientes. Crea uno para empezar.</p>
                      <Button type="primary" onClick={() => setNewEnvironmentModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Ambiente</Button>
                  </div>
              </div>
            )}
          </div>
        </div>

        <Modal title="Crear Nuevo Ambiente" open={newEnvironmentModalVisible} onCancel={() => setNewEnvironmentModalVisible(false)} onOk={() => {/* Lógica crear ambiente */ message.info("Crear ambiente próximamente")}}>
          <Input placeholder="Nombre del Ambiente" value={newEnvironmentName} onChange={e => setNewEnvironmentName(e.target.value)} />
        </Modal>
        <Modal title="Crear Nuevo Diagrama" open={newDiagramModalVisible} onCancel={() => setNewDiagramModalVisible(false)} onOk={() => {/* Lógica crear diagrama */ message.info("Crear diagrama próximamente")}}>
          <Input placeholder="Nombre del Diagrama" value={newDiagramName} onChange={e => setNewDiagramName(e.target.value)} />
        </Modal>
      </div>
    );
  }

  // Fallback si ninguna condición principal se cumple (ej. error cargando usuario o tipo de uso inesperado)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
      {error ? <p className="text-red-500">{error}</p> 
             : <>
                 <Spin size="large" />
                 <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando...</p>
               </>}
    </div>
  );
}
