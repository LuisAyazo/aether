'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button, Select, Modal, Input, Spin, message, Typography } from 'antd';
import { PlusOutlined as AntPlusOutlined, EyeOutlined, PlayCircleOutlined, FolderOpenOutlined as AntFolderIcon, SettingOutlined } from '@ant-design/icons';
import { 
  FolderIcon, 
  PlusIcon,
  UserCircleIcon as UserCircleIconOutline, 
  WrenchScrewdriverIcon as WrenchScrewdriverIconOutline, 
  DocumentDuplicateIcon as DocumentDuplicateIconOutline, 
  UsersIcon as UsersIconOutline 
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

import { getCompanies, Company, createCompany } from '../../services/companyService';
import { getEnvironments, getDiagramsByEnvironment, getDiagram, Environment, Diagram, createDiagram as createDiagramService, createEnvironment as createEnvironmentService, updateDiagram } from '../../services/diagramService';
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
  const [newEnvironmentDescription, setNewEnvironmentDescription] = useState<string>('');
  const [newEnvironmentCategory, setNewEnvironmentCategory] = useState<string>('desarrollo');

  const [newDiagramModalVisible, setNewDiagramModalVisible] = useState<boolean>(false);
  const [newDiagramName, setNewDiagramName] = useState<string>('');
  const [newDiagramPath, setNewDiagramPath] = useState<string>('');
  const [newDiagramDescription, setNewDiagramDescription] = useState<string>('');
  
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
          setActiveCompany(null); setEnvironments([]); setDiagrams([]); setSelectedEnvironment(null); setSelectedDiagram(null); setCurrentDiagram(null); setNodes([]); setEdges([]);
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
        setNodes(diagramData?.nodes ? convertToReactFlowNodes(diagramData.nodes) : []);
        setEdges(diagramData?.edges ? convertToReactFlowEdges(diagramData.edges) : []);
      } else {
        setCurrentDiagram(null); setNodes([]); setEdges([]); setSelectedDiagram(null);
      }
    } else {
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
    setSelectedEnvironment(environmentId); setLoading(true);
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
    setSelectedDiagram(diagramId); setLoading(true);
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
        name: currentDiagram.name, description: currentDiagram.description, nodes: customNodes, edges: customEdges, viewport: data.viewport || currentDiagram.viewport
      });
      message.success("Diagrama guardado.");
    } catch (e:any) { message.error("Error al guardar el diagrama: " + e.message); }
  };

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
            <div className="bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between flex-shrink-0 h-16"> {/* Panel superior con h-16 */}
              <div className="flex items-center gap-x-4">
                {environments.length > 0 || isPersonalSpace ? (
                  <div className="flex items-center min-h-[40px]">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2 whitespace-nowrap">Ambiente:</span>
                    <EnvironmentTreeSelect 
                      environments={environments} value={selectedEnvironment ?? undefined} 
                      onChange={handleEnvironmentChange} placeholder="Seleccionar Ambiente"
                    />
                    {!(isPersonalSpace && environments.length >= 1) && (
                       <Button type="text" icon={<AntPlusOutlined />} onClick={() => setNewEnvironmentModalVisible(true)} className="ml-2 text-electric-purple-600 hover:!bg-electric-purple-50 dark:hover:!bg-electric-purple-500/20" aria-label="Crear Nuevo Ambiente" />
                    )}
                  </div>
                ) : ( <Button type="primary" onClick={() => setNewEnvironmentModalVisible(true)} className="bg-electric-purple-600 hover:bg-electric-purple-700">Crear Primer Ambiente</Button> )}
                {selectedEnvironment && (diagrams.length > 0 || isPersonalSpace) ? (
                  <div className="flex items-center min-h-[40px]">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2 whitespace-nowrap">Diagrama:</span>
                    <DiagramTreeSelect 
                      diagrams={diagrams} value={selectedDiagram ?? undefined} onChange={handleDiagramChange} 
                      companyId={activeCompany?._id || activeCompany?.id || ''} environmentId={selectedEnvironment}
                    />
                     {!(isPersonalSpace && diagrams.filter(d => !d.isFolder).length >= 3) && (
                        <Button type="text" icon={<AntPlusOutlined />} onClick={() => setNewDiagramModalVisible(true)} className="ml-2 text-electric-purple-600 hover:!bg-electric-purple-50 dark:hover:!bg-electric-purple-500/20" aria-label="Crear Nuevo Diagrama" />
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
            {!loading && activeSectionInSidebar === 'diagrams' && selectedDiagram && currentDiagram && activeCompany && ( <FlowEditor key={`${activeCompany?._id}-${selectedEnvironment}-${selectedDiagram}`} companyId={activeCompany._id!} environmentId={selectedEnvironment!} diagramId={selectedDiagram!} initialDiagram={currentDiagram} initialNodes={nodes} initialEdges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onSave={handleSaveDiagram} nodeTypes={nodeTypes} /> )}
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
          destroyOnClose
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
