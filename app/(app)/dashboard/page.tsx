'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button, Select, Modal, Input, Spin, message } from 'antd';
import { PlusOutlined as AntPlusOutlined, EyeOutlined, PlayCircleOutlined, FolderOpenOutlined as AntFolderIcon, SettingOutlined } from '@ant-design/icons';
import { 
  FolderIcon, 
  PlusIcon,
  UserCircleIcon as UserCircleIconOutline, // Alias para claridad
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline, // Alias para claridad
  DocumentDuplicateIcon as DocumentDuplicateIconOutline, // Alias para claridad
  UsersIcon as UsersIconOutline // Para el plan de compañía
} from '@heroicons/react/24/outline';
import {
  DocumentDuplicateIcon as DocumentDuplicateIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  UsersIcon as UsersIconSolid, // Para el plan de compañía
  PlayCircleIcon as PlayCircleIconSolid // Para el plan de compañía
  // CogIconSolid se importa de Ant Design como SettingOutlined, o se puede importar de Heroicons si se prefiere
} from '@heroicons/react/24/solid';


// Componentes
import FlowEditor from '../../components/flow/FlowEditor'; 
import EnvironmentTreeSelect from '../../components/ui/EnvironmentTreeSelect'; 
import DiagramTreeSelect from '../../components/ui/DiagramTreeSelect'; 
import CompanySidebar from '../../components/ui/CompanySidebar'; 
import CredentialsPage from '../../components/ui/CredentialsPage'; 
import DeploymentsPage from '../../components/ui/DeploymentsPage'; // Importar DeploymentsPage
import SettingsPage from '../../components/ui/SettingsPage'; // Importar SettingsPage

// Servicios
import { getCompanies, Company, createCompany } from '../../services/companyService';
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram as createDiagramService, createEnvironment as createEnvironmentService, updateDiagram } from '../../services/diagramService';
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


const PERSONAL_SPACE_COMPANY_NAME_PREFIX = "Personal Space for ";

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
  
  const [nodes, setNodes] = useState<ReactFlowNode[]>([]);
  const [edges, setEdges] = useState<ReactFlowEdge[]>([]);

  const [newEnvironmentModalVisible, setNewEnvironmentModalVisible] = useState<boolean>(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState<string>('');
  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  
  type SidebarSectionKey = 'diagrams' | 'settings' | 'templates' | 'credentials' | 'deployments' | 'team';
  const [activeSectionInSidebar, setActiveSectionInSidebar] = useState<SidebarSectionKey>('diagrams');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [needsPersonalSpaceSetup, setNeedsPersonalSpaceSetup] = useState(false);

  // Efecto para establecer el usuario y manejar la autenticación inicial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = getCurrentUser();
    console.log("DashboardPage Mount: currentUser from getCurrentUser():", JSON.stringify(currentUser)); // LOG ADICIONAL
    setUser(currentUser);
  }, [router]);

  // Efecto para cargar datos basado en el usuario y su tipo de uso
  useEffect(() => {
    const actualUserId = user?._id; 

    if (!user || !actualUserId || user.usage_type === null) {
      if (!user && isAuthenticated()) {
        setLoading(true);
      } else if (user && user.usage_type === null) {
        setLoading(false);
      } else if (user && !actualUserId) {
        console.error("DashboardPage useEffect: user._id no encontrado en el objeto user.", JSON.stringify(user));
        setError("Error crítico: No se pudo obtener el ID del usuario.");
        setLoading(false);
      } else {
        setLoading(false); 
      }
      return; 
    }
    
    console.log(`DashboardPage useEffect: ID de usuario ${actualUserId} y user.usage_type ${user.usage_type} son válidos, procediendo a cargar datos. User object:`, JSON.stringify(user));

    async function setupPersonalSpaceAndLoadData() {
      setLoading(true);
      setError(null);
      try {
        // user no será null aquí debido a la guarda anterior.
        let personalCompany = await findPersonalCompany(user!); 
        if (!personalCompany) {
          setNeedsPersonalSpaceSetup(true);
          setLoading(false);
          return;
        }
        setNeedsPersonalSpaceSetup(false);
        setActiveCompany(personalCompany);
        setIsPersonalSpace(true);
        await loadCompanyOrPersonalSpaceData(personalCompany);
      } catch (e: any) {
        setError(e.message || 'Error al configurar el espacio personal.');
        message.error(e.message || 'Error al configurar el espacio personal.');
      } finally {
        setLoading(false);
      }
    }

    async function loadCompanyData() {
      setLoading(true);
      setError(null);
      try {
        const companies = await getCompanies();
        if (companies.length > 0) {
          const firstCompany = companies[0]; 
          setActiveCompany(firstCompany);
          setIsPersonalSpace(false);
          await loadCompanyOrPersonalSpaceData(firstCompany);
        } else {
          // No hay compañías, el usuario debe crear una.
          // AppLayout podría redirigir a /company/create o este dashboard mostrar un CTA.
          // Por ahora, el dashboard mostrará un mensaje si isFirstLoginNoCompanies es true (manejado en el render).
          // Aquí simplemente limpiamos el estado.
          setActiveCompany(null);
          setEnvironments([]); setDiagrams([]); setSelectedEnvironment(null); setSelectedDiagram(null); setCurrentDiagram(null); setNodes([]); setEdges([]);
          // setIsFirstLoginNoCompanies(true) se manejaría en el render basado en activeCompany y loading
        }
      } catch (e: any) {
        setError(e.message || 'Error al cargar datos de compañía.');
        message.error(e.message || 'Error al cargar datos de compañía.');
      } finally {
        setLoading(false);
      }
    }
    
    if (user.usage_type === 'personal') {
      console.log("DashboardPage useEffect: usage_type es personal, llamando a setupPersonalSpaceAndLoadData.");
      setupPersonalSpaceAndLoadData();
    } else if (user.usage_type === 'company') {
      console.log("DashboardPage useEffect: usage_type es company, llamando a loadCompanyData.");
      loadCompanyData();
    } else {
      // Esto no debería ocurrir si la guarda anterior funciona.
      console.warn("DashboardPage useEffect: user.usage_type no es ni personal ni company, ni null. Valor:", user.usage_type);
      setLoading(false);
    }
  }, [user, router]); // Depender del objeto user completo y router

  async function findPersonalCompany(currentUser: User): Promise<Company | null> {
    const currentUserId = currentUser._id; // Usar _id directamente
    if (!currentUser || !currentUserId) {
        console.error("findPersonalCompany: currentUser._id no encontrado.", JSON.stringify(currentUser));
        return null;
    }
    const companies = await getCompanies(); 
    return companies.find(c => c.name === `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${currentUserId}`) || null;
  }

  async function handleCreatePersonalSpace() {
    console.log("handleCreatePersonalSpace: Intentando crear espacio. User object:", JSON.stringify(user)); 
    const userIdToUse = user?._id; // Usar _id directamente

    if (!user || !userIdToUse) { 
      message.error("Información del usuario no disponible (user._id es undefined). No se puede crear el espacio personal. Por favor, recarga la página o vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const personalCompanyName = `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${userIdToUse}`;
      console.log("handleCreatePersonalSpace: Nombre de compañía personal a crear:", personalCompanyName); 
      const newCompany = await createCompany({ name: personalCompanyName, description: "Espacio personal automático" });
      
      if (!newCompany || (!newCompany._id && !newCompany.id)) {
        throw new Error("La creación de la compañía personal no devolvió un ID válido.");
      }
      const companyIdToUse = newCompany._id || newCompany.id!;

      // Crear ambiente "Sandbox" por defecto
      await createEnvironmentService(companyIdToUse, { name: "Sandbox", description: "Ambiente personal de pruebas", category: "desarrollo" });
      
      message.success("Espacio personal creado. ¡Listo para empezar!");
      setNeedsPersonalSpaceSetup(false);
      // Volver a cargar los datos para reflejar el nuevo espacio
      const currentUser = getCurrentUser(); // Refrescar usuario por si acaso
      setUser(currentUser); 
      // El useEffect [user?.id, user?.usage_type] se re-ejecutará y llamará a setupPersonalSpaceAndLoadData
    } catch (e: any) {
      message.error("Error al crear espacio personal: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanyOrPersonalSpaceData(company: Company) {
    const companyId = company._id || company.id!;
    const envs = await getEnvironments(companyId);
    setEnvironments(envs);

    if (envs.length > 0) {
      const defaultEnvId = envs[0].id; // O buscar "Sandbox" para personal
      setSelectedEnvironment(defaultEnvId);
      const diags = await getDiagramsByEnvironment(companyId, defaultEnvId);
      setDiagrams(diags);
      if (diags.length > 0) {
        setSelectedDiagram(diags[0].id);
        const diagramData = await getDiagram(companyId, defaultEnvId, diags[0].id);
        setCurrentDiagram(diagramData);
        setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []);
        setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []);
      } else {
        setCurrentDiagram(null); setNodes([]); setEdges([]); setSelectedDiagram(null);
      }
    } else {
      // Si es espacio personal y no tiene ambiente "Sandbox", se podría crear aquí.
      // Por ahora, se asume que el ambiente "Sandbox" se crea con el espacio personal.
      setDiagrams([]); setSelectedDiagram(null); setCurrentDiagram(null); setNodes([]); setEdges([]); setSelectedEnvironment(null);
    }
  }


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

  const handleCreateNewEnvironment = async () => {
    if (!activeCompany || !newEnvironmentName.trim()) {
      message.error("El nombre del ambiente es obligatorio.");
      return;
    }
    // Limitar a 1 ambiente para plan Starter (uso personal)
    if (isPersonalSpace && environments.length >= 1) {
        message.warning("El plan Starter solo permite 1 ambiente."); // Cambiado a warning
        setNewEnvironmentModalVisible(false);
        return;
    }
    setLoading(true);
    try {
        await createEnvironmentService(activeCompany._id || activeCompany.id!, { name: newEnvironmentName, description: "Nuevo ambiente", category: "desarrollo" });
        message.success("Ambiente creado.");
        setNewEnvironmentName('');
        setNewEnvironmentModalVisible(false);
        // Recargar ambientes
        const envs = await getEnvironments(activeCompany._id || activeCompany.id!);
        setEnvironments(envs);
        if (!selectedEnvironment && envs.length > 0) {
            const newDefaultEnvId = envs[0].id;
            handleEnvironmentChange(newDefaultEnvId); // Seleccionar el nuevo ambiente si no hay ninguno seleccionado
        }
    } catch (e: any) { message.error("Error al crear ambiente: " + e.message); }
    finally { setLoading(false); }
  };

  const handleCreateNewDiagram = async () => {
    if (!activeCompany || !selectedEnvironment || !newDiagramName.trim()) {
        message.error("Selecciona un ambiente y escribe un nombre para el diagrama.");
        return;
    }
    // Limitar a 3 diagramas para plan Starter (uso personal)
    if (isPersonalSpace && diagrams.length >= 3) {
        message.warning("El plan Starter solo permite 3 diagramas."); // Cambiado a warning
        setNewDiagramModalVisible(false);
        return;
    }
    setLoading(true);
    try {
        const newDiag = await createDiagramService(activeCompany._id || activeCompany.id!, selectedEnvironment, { name: newDiagramName, description: "Nuevo diagrama", nodes: [], edges: [], viewport: {x:0, y:0, zoom:1} });
        message.success("Diagrama creado.");
        setNewDiagramName('');
        setNewDiagramModalVisible(false);
        // Recargar diagramas y seleccionar el nuevo
        const diags = await getDiagramsByEnvironment(activeCompany._id || activeCompany.id!, selectedEnvironment);
        setDiagrams(diags);
        const newDiagId = newDiag.id;
        handleDiagramChange(newDiagId);
    } catch (e: any) { message.error("Error al crear diagrama: " + e.message); }
    finally { setLoading(false); }
  };


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spin size="large" />
        <p className="mt-3 text-slate-600 dark:text-slate-400">Cargando dashboard...</p>
      </div>
    );
  }

  if (user?.usage_type === 'personal' && needsPersonalSpaceSetup) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 sm:p-10 max-w-md w-full">
           <div className="mx-auto mb-6 text-5xl font-bold">
            <span className="text-slate-900 dark:text-slate-100">Infra</span>
            <span className="bg-gradient-to-r from-emerald-green-500 via-emerald-green-600 to-emerald-green-700 bg-clip-text text-transparent">UX</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Configura tu Espacio Personal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Necesitamos configurar tu espacio personal para que puedas empezar a crear diagramas.
          </p>
          <Button type="primary" size="large" className="bg-electric-purple-600 hover:bg-electric-purple-700" onClick={handleCreatePersonalSpace} loading={loading}>
            Inicializar Mi Espacio
          </Button>
        </div>
      </div>
    );
  }
  
  // Si es uso de compañía pero no hay compañías (después de que AppLayout no redirigió a /company/create)
  if (user?.usage_type === 'company' && !activeCompany && !loading) {
     return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 sm:p-10 max-w-md w-full">
          <FolderIcon className="mx-auto h-16 w-16 text-slate-400 mb-6" />
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
            No tienes compañías
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Para empezar a usar InfraUX para tu equipo, crea tu primera compañía.
          </p>
          <Link
            href="/company/create" // Esta ruta debe estar dentro de (app)
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-electric-purple-600 hover:bg-electric-purple-700 focus:outline-none transition-transform transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Compañía
          </Link>
        </div>
      </div>
    );
  }

  // Layout principal del dashboard estilo editor de diagramas
  if ((user?.usage_type === 'company' && activeCompany) || (user?.usage_type === 'personal' && activeCompany && !needsPersonalSpaceSetup)) {
    const companyDisplayName = isPersonalSpace ? "Espacio Personal" : activeCompany?.name || 'Compañía';
    const sidebarSections = isPersonalSpace 
      ? [
          { key: 'diagrams', name: 'Diagramas', icon: DocumentDuplicateIconOutline, iconSolid: DocumentDuplicateIconSolid, color: 'sky', description: 'Visualiza y gestiona tus arquitecturas personales.' },
          { key: 'credentials', name: 'Credenciales', icon: UserCircleIconOutline, iconSolid: UserCircleIconSolid, color: 'emerald', description: 'Conecta tus cuentas cloud para despliegues.' },
          { key: 'deployments', name: 'Despliegues', icon: PlayCircleOutlined, iconSolid: PlayCircleIconSolid, color: 'violet', description: 'Administra tus despliegues personales.' },
          { key: 'templates', name: 'Plantillas', icon: WrenchScrewdriverIconOutline, iconSolid: WrenchScrewdriverIconSolid, color: 'amber', description: 'Usa y gestiona plantillas de diagramas.' },
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
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <CompanySidebar 
          companyName={companyDisplayName} 
          activeSection={activeSectionInSidebar} 
          onSectionChange={(section: string) => setActiveSectionInSidebar(section as SidebarSectionKey)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
          sections={sidebarSections}
          isPersonalSpace={isPersonalSpace}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mostrar el panel superior solo si la sección activa es 'diagrams' */}
          { activeSectionInSidebar === 'diagrams' && (selectedEnvironment || environments.length > 0 || isPersonalSpace) && ( 
            <div className="bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                {environments.length > 0 || isPersonalSpace ? (
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Ambiente:</span>
                  <EnvironmentTreeSelect 
                    environments={environments} 
                    value={selectedEnvironment ?? undefined} 
                    onChange={handleEnvironmentChange} 
                    placeholder="Seleccionar Ambiente"
                    // disabled={isPersonalSpace && environments.length >= 1 && !selectedEnvironment} // Prop 'disabled' eliminada
                  />
                  {!(isPersonalSpace && environments.length >= 1) && ( // No mostrar si es personal y ya tiene 1 ambiente
                     <Button type="link" size="small" onClick={() => setNewEnvironmentModalVisible(true)} className="ml-1 text-electric-purple-600">
                          + Nuevo Ambiente
                        </Button>
                    )}
                  </div>
                ) : (
                  <Button type="primary" onClick={() => setNewEnvironmentModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Primer Ambiente</Button>
                )}

                {selectedEnvironment && (diagrams.length > 0 || isPersonalSpace) ? (
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Diagrama:</span>
                    <DiagramTreeSelect 
                      diagrams={diagrams} 
                      value={selectedDiagram ?? undefined} 
                      onChange={handleDiagramChange} 
                      companyId={activeCompany?._id || activeCompany?.id || ''}
                      environmentId={selectedEnvironment}
                    />
                    {!(isPersonalSpace && diagrams.length >= 3) && ( // No mostrar si es personal y ya tiene 3 diagramas
                       <Button type="link" size="small" onClick={() => setNewDiagramModalVisible(true)} className="ml-1 text-electric-purple-600">
                        + Nuevo Diagrama
                      </Button>
                    )}
                  </div>
                ) : selectedEnvironment ? (
                   <Button type="primary" onClick={() => setNewDiagramModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Primer Diagrama</Button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button icon={<EyeOutlined />} onClick={() => message.info("Función de Preview próximamente.")}>Preview</Button>
                <Button type="primary" icon={<PlayCircleOutlined />} className="bg-green-600 hover:bg-green-700" onClick={() => message.info("Función de Run próximamente.")}>Run</Button>
              </div>
            </div>
          )}

          <div className="relative flex-1 bg-slate-100 dark:bg-slate-850 overflow-auto"> {/* Cambiado fondo y overflow */}
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10"><Spin size="large" /></div>}
            
            {/* Renderizado condicional del contenido principal */}
            {!loading && activeSectionInSidebar === 'diagrams' && selectedDiagram && currentDiagram && activeCompany && (
              <FlowEditor
                key={`${activeCompany?._id}-${selectedEnvironment}-${selectedDiagram}`}
                companyId={activeCompany._id!} // Ya nos aseguramos que activeCompany y su _id existen
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
            {!loading && activeSectionInSidebar === 'diagrams' && activeCompany && !selectedEnvironment && environments.length === 0 && (
              <div className="flex items-center justify-center h-full p-10">
                <div className="text-center">
                  <AntFolderIcon className="mx-auto text-5xl text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Sin Ambientes</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">
                    {isPersonalSpace ? "Tu espacio personal no tiene ambientes. " : "Esta compañía no tiene ambientes. "}
                    Crea uno para empezar a organizar tus diagramas.
                  </p>
                  {!(isPersonalSpace && environments.length >=1) && 
                    <Button type="primary" onClick={() => setNewEnvironmentModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Ambiente</Button>
                  }
                </div>
              </div>
            )}
            {!loading && activeSectionInSidebar === 'diagrams' && activeCompany && selectedEnvironment && diagrams.length === 0 && (
              <div className="flex items-center justify-center h-full p-10">
                <div className="text-center">
                  <DocumentDuplicateIconOutline className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Sin Diagramas</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Este ambiente no tiene diagramas. Crea uno para empezar a diseñar.</p>
                  {!(isPersonalSpace && diagrams.length >=3) &&
                    <Button type="primary" onClick={() => setNewDiagramModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Diagrama</Button>
                  }
                </div>
              </div>
            )}

            {/* Contenido para otras secciones del sidebar */}
            {!loading && activeSectionInSidebar === 'credentials' && activeCompany && (
              <CredentialsPage companyId={activeCompany._id!} />
            )}
            {!loading && activeSectionInSidebar === 'deployments' && activeCompany && (
              <DeploymentsPage companyId={activeCompany._id!} />
            )}
            {!loading && activeSectionInSidebar === 'templates' && (
              <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Plantillas</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Gestión de plantillas próximamente.</p>
              </div>
            )}
            {!loading && activeSectionInSidebar === 'settings' && activeCompany && (
              // Asumiendo que SettingsPage también necesita companyId o un identificador similar
              <SettingsPage companyId={activeCompany._id!} /> 
            )}
             {!loading && activeSectionInSidebar === 'team' && (
              <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Equipo</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Gestión de miembros del equipo (solo para planes de compañía).
                </p>
              </div>
            )}

          </div>
        </div>

        <Modal title="Crear Nuevo Ambiente" open={newEnvironmentModalVisible} onCancel={() => setNewEnvironmentModalVisible(false)} onOk={handleCreateNewEnvironment} confirmLoading={loading} okButtonProps={{disabled: newEnvironmentName.trim() === ''}}>
          <Input placeholder="Nombre del Ambiente (ej. Sandbox, Desarrollo)" value={newEnvironmentName} onChange={e => setNewEnvironmentName(e.target.value)} />
        </Modal>
        <Modal title="Crear Nuevo Diagrama" open={newDiagramModalVisible} onCancel={() => setNewDiagramModalVisible(false)} onOk={handleCreateNewDiagram} confirmLoading={loading} okButtonProps={{disabled: newDiagramName.trim() === ''}}>
          <Input placeholder="Nombre del Diagrama (ej. Mi Primera App Web)" value={newDiagramName} onChange={e => setNewDiagramName(e.target.value)} />
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
