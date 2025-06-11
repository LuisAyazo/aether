'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dropdown, Avatar, Button, Modal, Select, Timeline, Input, Spin, Empty, Tag, Form, Tooltip } from 'antd'; // Tooltip añadido
import { 
  CodeOutlined,
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  HistoryOutlined, 
  ExclamationCircleFilled,
  FolderAddOutlined, 
  ProjectOutlined,
  PlusOutlined, // Añadido para botones de crear
  MailOutlined // Añadido para el correo del usuario
} from '@ant-design/icons';
import { logoutUser as authLogout } from '../services/authService';
import { useNavigationStore } from '@/app/hooks/useNavigationStore'; 
import type { Environment } from '../services/diagramService';
import EnvironmentTreeSelect from "./ui/EnvironmentTreeSelect";
import DiagramTreeSelect from "./ui/DiagramTreeSelect"; 
import GeneratedCodeModal from "./ui/GeneratedCodeModal";
import WorkspaceSelector from "./WorkspaceSelector";

const { Option } = Select;
const { TextArea } = Input;

interface VersionHistoryItem {
  id: string;
  timestamp: string;
  author: string;
  description: string;
  changes: { created: number; updated: number; deleted: number; };
}

interface PreviewResourceItem {
  id: string;
  type: string;
  name: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [formCreateEnv] = Form.useForm(); 
  const [formCreateDiag] = Form.useForm(); 

  const [generatedCodeModalVisible, setGeneratedCodeModalVisible] = useState(false);

const user = useNavigationStore(state => state.user);
const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);
const activeCompany = useNavigationStore(state => state.activeCompany);
const workspaces = useNavigationStore(state => state.workspaces); // Añadir workspaces del store
const activeWorkspace = useNavigationStore(state => state.activeWorkspace); // Añadir workspace activo
const environments = useNavigationStore(state => state.environments);
const diagrams = useNavigationStore(state => state.diagrams);
const selectedEnvironment = useNavigationStore(state => state.selectedEnvironment);
const selectedDiagram = useNavigationStore(state => state.selectedDiagram);
const currentDiagram = useNavigationStore(state => state.currentDiagram);
const dataLoading = useNavigationStore(state => state.dataLoading);
const handleEnvironmentChange = useNavigationStore(state => state.handleEnvironmentChange);
const handleDiagramChange = useNavigationStore(state => state.handleDiagramChange);
  
  const newEnvironmentModalVisible = useNavigationStore(state => state.newEnvironmentModalVisible);
  const setNewEnvironmentModalVisible = useNavigationStore(state => state.setNewEnvironmentModalVisible);
  const newEnvironmentName = useNavigationStore(state => state.newEnvironmentName);
  const setNewEnvironmentName = useNavigationStore(state => state.setNewEnvironmentName);
  const newEnvironmentDescription = useNavigationStore(state => state.newEnvironmentDescription);
  const setNewEnvironmentDescription = useNavigationStore(state => state.setNewEnvironmentDescription);
  const newEnvironmentPath = useNavigationStore(state => state.newEnvironmentPath);
  const setNewEnvironmentPath = useNavigationStore(state => state.setNewEnvironmentPath);
  const handleCreateNewEnvironment = useNavigationStore(state => state.handleCreateNewEnvironment);
  
  const newDiagramModalVisible = useNavigationStore(state => state.newDiagramModalVisible);
  const setNewDiagramModalVisible = useNavigationStore(state => state.setNewDiagramModalVisible);
  const newDiagramName = useNavigationStore(state => state.newDiagramName);
  const setNewDiagramName = useNavigationStore(state => state.setNewDiagramName);
  const newDiagramPath = useNavigationStore(state => state.newDiagramPath);
  const setNewDiagramPath = useNavigationStore(state => state.setNewDiagramPath);
  const newDiagramDescription = useNavigationStore(state => state.newDiagramDescription);
  const setNewDiagramDescription = useNavigationStore(state => state.setNewDiagramDescription);
  const handleCreateNewDiagram = useNavigationStore(state => state.handleCreateNewDiagram);

  // Handlers para eliminar
  const handleDeleteEnvironment = useNavigationStore(state => state.handleDeleteEnvironment);
  const handleDeleteDiagram = useNavigationStore(state => state.handleDeleteDiagram);
  // Handler para actualizar path de diagrama (D&D)
  const handleUpdateDiagramPath = useNavigationStore(state => state.handleUpdateDiagramPath);

  const historyModalVisible = useNavigationStore(state => state.historyModalVisible);
  const setHistoryModalVisible = useNavigationStore(state => state.setHistoryModalVisible);
  const versionHistory = useNavigationStore(state => state.versionHistory);
  const rollbackModalVisible = useNavigationStore(state => state.rollbackModalVisible);
  const setRollbackModalVisible = useNavigationStore(state => state.setRollbackModalVisible);
  const selectedVersion = useNavigationStore(state => state.selectedVersion);
  const setSelectedVersion = useNavigationStore(state => state.setSelectedVersion);
  const handleRollbackConfirm = useNavigationStore(state => state.handleRollbackConfirm);
  const versionsModalVisible = useNavigationStore(state => state.versionsModalVisible);
  const setVersionsModalVisible = useNavigationStore(state => state.setVersionsModalVisible);
  const previewModalVisible = useNavigationStore(state => state.previewModalVisible);
  const setPreviewModalVisible = useNavigationStore(state => state.setPreviewModalVisible);
  const previewData = useNavigationStore(state => state.previewData);
  const runModalVisible = useNavigationStore(state => state.runModalVisible);
  const setRunModalVisible = useNavigationStore(state => state.setRunModalVisible);
  const handleRunConfirm = useNavigationStore(state => state.handleRunConfirm);
  const promoteModalVisible = useNavigationStore(state => state.promoteModalVisible);
  const setPromoteModalVisible = useNavigationStore(state => state.setPromoteModalVisible);
  const selectedTargetEnvironment = useNavigationStore(state => state.selectedTargetEnvironment);
  const setSelectedTargetEnvironment = useNavigationStore(state => state.setSelectedTargetEnvironment);
  const handlePromoteConfirm = useNavigationStore(state => state.handlePromoteConfirm);
  const destroyModalVisible = useNavigationStore(state => state.destroyModalVisible);
  const setDestroyModalVisible = useNavigationStore(state => state.setDestroyModalVisible);
  const destroyConfirmationText = useNavigationStore(state => state.destroyConfirmationText);
  const setDestroyConfirmationText = useNavigationStore(state => state.setDestroyConfirmationText);
  const handleDestroyConfirm = useNavigationStore(state => state.handleDestroyConfirm);

  // REMOVIDO: fetchInitialUser se llama desde el dashboard page
  // No es necesario llamarlo desde Navigation

  const handleLogout = () => {
    authLogout();
    router.push('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: <Link href="/dashboard?section=profile">Mi Perfil</Link> },
    { key: 'settings', icon: <SettingOutlined />, label: <Link href="/dashboard?section=settings">Configuración</Link> },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', onClick: handleLogout },
  ];
  
  const hideNavigation = pathname === '/login' || pathname === '/register' || pathname === '/onboarding/select-usage' || pathname === '/create-company';
  
  if (hideNavigation) return null;
  
  const isOnMarketingPage = pathname === '/';
  const diagramName = currentDiagram?.name || "Sin Diagrama";

  const onEnvChange = (value: string) => { 
    if (value === 'create-new-env') {
      formCreateEnv.resetFields(); 
      setNewEnvironmentModalVisible(true);
    } else {
      handleEnvironmentChange(value);
    }
  };

  const onDiagramChange = (value: string) => { 
    if (value === 'create-new-diag') {
      formCreateDiag.resetFields();
      setNewDiagramModalVisible(true);
    } else {
      // Solo cambiar el diagrama, la URL se actualizará desde el dashboard
      handleDiagramChange(value);
    }
  };
  
  const onFinishCreateEnvironment = () => {
    handleCreateNewEnvironment().then(() => {
      formCreateEnv.resetFields(); 
    }).catch(() => { /* El error se maneja en el store */ });
  };

  const onFinishCreateDiagram = () => {
    handleCreateNewDiagram().then(() => {
      formCreateDiag.resetFields();
    }).catch(() => { /* El error se maneja en el store */ });
  };

  // Aproximación del ancho del sidebar expandido para el padding
  // CompanySidebar w-60 = 240px. El padding del header es px-4 (16px).
  // El contenido principal del header (selectores) debería empezar después de esto.
  // Si el logo está pegado a la izquierda, el padding-left del contenedor de selectores debería ser ~240px.
  // Si el logo ocupa espacio, se ajusta.
  // Por ahora, se usa un ml en el contenedor de selectores.
  const sidebarPadding = !isOnMarketingPage && activeCompany ? "pl-64" : "pl-0"; // pl-60 = 240px

  return (
    <>
      <nav className="fixed w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700">
        {/* Contenedor principal del header */}
        <div className={`max-w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20`}> {/* Altura aumentada a h-20 (80px) */}
          
          {/* Grupo Izquierdo: Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href={isOnMarketingPage ? "/" : "/dashboard"} className="text-xl flex items-center">
              <span className="font-bold text-slate-800 dark:text-slate-100">Infra</span><span className="font-bold text-emerald-green-600 dark:text-emerald-green-500">UX</span>
            </Link>
          </div>

          {/* Grupo Central: Selectores y botones de añadir */}
          {/* Este div se posicionará después del logo. El justify-between del padre lo separará del menú de usuario. */}
          {/* Para la alineación con el sidebar, se necesitaría un padding global o un cálculo más complejo. */}
          {/* Por ahora, se añade un margen izquierdo significativo si no es página de marketing. */}
          <div className={`flex items-center gap-x-3 ${!isOnMarketingPage && activeCompany ? 'ml-8 sm:ml-12 md:ml-16 lg:ml-60' : ''}`}> {/* ml-60 para simular ancho de sidebar */}
            {!isOnMarketingPage && activeCompany && (
              <>
                {/* Selector de Workspace */}
                <div className="flex items-center gap-x-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 hidden md:inline">Workspace:</span>
                  <WorkspaceSelector 
                    companyId={activeCompany.id || activeCompany._id}
                    currentWorkspaceId={activeWorkspace?.id || user?.workspace_id}
                    workspaces={workspaces} // Pasar workspaces como prop
                  />
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden md:block" />
                
                {/* Selector de Ambiente y Botón Añadir */}
                {(environments && environments.length >= 0) && ( // Mostrar siempre el contenedor si la sección es relevante
                  <div className="flex items-center gap-x-1">
                    {environments.length > 0 && ( // Mostrar selector solo si hay ambientes
                      <>
                        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 hidden md:inline">Ambiente:</span>
                        <EnvironmentTreeSelect
                          value={selectedEnvironment || undefined}
                          onChange={onEnvChange}
                          environments={environments}
                          className="min-w-[180px] md:min-w-[200px]"
                          onDeleteEnvironment={handleDeleteEnvironment}
                          showDeleteButton={true}
                        />
                      </>
                    )}
                    {/* Solo mostrar botón de crear si ya hay ambientes (no en onboarding) */}
                    {environments.length > 0 && (
                      <Tooltip title='Crear Nuevo Ambiente'>
                        <Button 
                          icon={<PlusOutlined />} 
                          size="small" 
                          onClick={() => onEnvChange('create-new-env')}
                          aria-label="Crear Nuevo Ambiente"
                        />
                      </Tooltip>
                    )}
                  </div>
                )}
                
                {/* Selector de Diagrama y Botón Añadir */}
                {selectedEnvironment && (diagrams && diagrams.length >= 0) && ( // Mostrar contenedor si hay ambiente
                  <div className="flex items-center gap-x-1">
                    {diagrams.length > 0 && ( // Mostrar selector solo si hay diagramas
                      <>
                        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 hidden md:inline">Diagrama:</span>
                        <DiagramTreeSelect
                          value={selectedDiagram || undefined}
                          onChange={onDiagramChange}
                          diagrams={diagrams}
                          className="min-w-[180px] md:min-w-[200px]"
                          onDeleteDiagram={handleDeleteDiagram}
                          showDeleteButton={true}
                          onDiagramPathChange={handleUpdateDiagramPath} 
                          companyId={activeCompany?._id} 
                          environmentId={selectedEnvironment}
                          isLoading={dataLoading} // Pasar el estado de carga
                        />
                      </>
                    )}
                    {/* Solo mostrar botón de crear si ya hay diagramas (no en onboarding) */}
                    {diagrams.length > 0 && (
                      <Tooltip title='Crear Nuevo Diagrama'>
                        <Button 
                          icon={<PlusOutlined />} 
                          size="small" 
                          onClick={() => onDiagramChange('create-new-diag')}
                          aria-label="Crear Nuevo Diagrama"
                          disabled={!selectedEnvironment} 
                        />
                      </Tooltip>
                    )}
                  </div>
                )}
                {selectedDiagram && (
                  <div className="flex items-center gap-x-1">
                    <Tooltip title="Ver Código Generado para el Diagrama Completo">
                      <Button
                        icon={<CodeOutlined />}
                        onClick={() => setGeneratedCodeModalVisible(true)}
                        type="primary"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        Ver Código
                      </Button>
                    </Tooltip>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Espacio flexible para empujar el menú de usuario a la derecha */}
          <div className="flex-grow flex justify-center px-4">
            {isOnMarketingPage && (
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Features</a>
                <Link href="/docs" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Docs</Link>
                <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">About</Link>
                <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Blog</Link>
              </div>
            )}
          </div>
          
          {/* Grupo Derecho: Menú Usuario */}
          <div className="flex items-center shrink-0">
            {isOnMarketingPage && (
              <div className="flex gap-3 items-center">
                <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</Link>
                <Link href="/register" className="bg-electric-purple-600 text-white hover:bg-electric-purple-700 dark:bg-electric-purple-500 dark:hover:bg-electric-purple-600 transition-colors px-4 py-2 text-sm font-medium rounded-md">Sign Up</Link>
              </div>
            )}
            {!isOnMarketingPage && user && (
              <div className="flex items-center gap-4">
                <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                  <a onClick={e => e.preventDefault()} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Avatar icon={<UserOutlined />} src={user.avatar_url || undefined} size="default" />
                    <div className="hidden sm:flex sm:flex-col sm:items-start">
                      {user.name && (
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                          {user.name}
                        </span>
                      )}
                      {user.email && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 leading-tight mt-0.5">
                          <MailOutlined />
                          {user.email}
                        </span>
                      )}
                    </div>
                  </a>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
      </nav>

      <Modal 
        title={
          <div className="flex items-center">
            <FolderAddOutlined className="mr-2 text-electric-purple-600" />
            <span>Crear Nuevo Ambiente</span>
          </div>
        }
        open={newEnvironmentModalVisible} 
        onOk={formCreateEnv.submit}
        onCancel={() => {
          setNewEnvironmentModalVisible(false);
          formCreateEnv.resetFields();
        }} 
        confirmLoading={dataLoading}
        okButtonProps={{ className: "bg-electric-purple-600 hover:bg-electric-purple-700" }}
        okText="Crear Ambiente"
      >
        <Form form={formCreateEnv} layout="vertical" name="create_environment_form" onFinish={onFinishCreateEnvironment} className="mt-4">
          <Form.Item 
            name="environmentName" 
            label="Nombre del Ambiente"
            rules={[{ required: true, message: 'Por favor ingresa el nombre del ambiente!' }]}
            initialValue={newEnvironmentName}
          >
            <Input placeholder="Ej: Producción, Desarrollo, Staging" onChange={(e) => setNewEnvironmentName(e.target.value)} />
          </Form.Item>
          <Form.Item 
            name="environmentPath" 
            label="Ruta (Opcional)"
            help="Organiza tus ambientes en una estructura de directorios. Ej: 'frontend/prod' o 'us-west-1/staging'"
            initialValue={newEnvironmentPath}
          >
            <Input placeholder="Ej: frontend/prod (opcional)" onChange={(e) => setNewEnvironmentPath(e.target.value)} />
          </Form.Item>
          <Form.Item 
            name="environmentDescription" 
            label="Descripción (Opcional)"
            initialValue={newEnvironmentDescription}
          >
            <TextArea placeholder="Describe brevemente el propósito de este ambiente" onChange={(e) => setNewEnvironmentDescription(e.target.value)} rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title={
          <div className="flex items-center">
            <ProjectOutlined className="mr-2 text-emerald-green-600" />
            <span>Crear Nuevo Diagrama</span>
          </div>
        }
        open={newDiagramModalVisible} 
        onOk={formCreateDiag.submit} 
        onCancel={() => {
          setNewDiagramModalVisible(false);
          formCreateDiag.resetFields();
        }} 
        confirmLoading={dataLoading}
        okButtonProps={{ className: "bg-emerald-green-600 hover:bg-emerald-green-700" }}
        okText="Crear Diagrama"
      >
        <Form form={formCreateDiag} layout="vertical" name="create_diagram_form" onFinish={onFinishCreateDiagram} className="mt-4">
          <Form.Item 
            name="diagramName" 
            label="Nombre del Diagrama"
            rules={[{ required: true, message: 'Por favor ingresa el nombre del diagrama!' }]}
            initialValue={newDiagramName}
          >
            <Input placeholder="Ej: Arquitectura Microservicios, Flujo de Autenticación" onChange={(e) => setNewDiagramName(e.target.value)} />
          </Form.Item>
          <Form.Item 
            name="diagramPath" 
            label="Ruta (Opcional)"
            help="Organiza tus diagramas en una estructura de directorios dentro del ambiente. Ej: 'backend/apis' o 'data-pipelines'"
            initialValue={newDiagramPath}
          >
            <Input placeholder="Ej: backend/apis (opcional)" onChange={(e) => setNewDiagramPath(e.target.value)} />
          </Form.Item>
          <Form.Item 
            name="diagramDescription" 
            label="Descripción (Opcional)"
            initialValue={newDiagramDescription}
          >
            <TextArea placeholder="Describe brevemente el propósito o contenido de este diagrama" onChange={(e) => setNewDiagramDescription(e.target.value)} rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`Historial de Versiones: ${diagramName}`} open={historyModalVisible} onCancel={() => setHistoryModalVisible(false)} footer={null} width={600}>
        {dataLoading && (!versionHistory || versionHistory.length === 0) ? <div className="text-center p-8"><Spin /></div> :
          versionHistory && versionHistory.length > 0 ? (
            <Timeline items={versionHistory.map((v: VersionHistoryItem) => ({
              children: (
                <div>
                  <p><strong>{v.description || `Versión ${v.id}`}</strong> por {v.author}</p>
                  <p className="text-xs text-gray-500">{new Date(v.timestamp).toLocaleString()}</p>
                  <p className="text-xs">Cambios: <Tag color="green">{v.changes.created} C</Tag> <Tag color="blue">{v.changes.updated} U</Tag> <Tag color="red">{v.changes.deleted} D</Tag></p>
                </div>
              ),
              dot: <HistoryOutlined />,
            }))} />
          ) : <Empty description="No hay historial disponible." />
        }
      </Modal>

      <Modal title="Revertir Diagrama" open={rollbackModalVisible} onOk={handleRollbackConfirm} onCancel={() => setRollbackModalVisible(false)} confirmLoading={dataLoading} okText="Revertir" cancelText="Cancelar">
        <p>Selecciona la versión a la que deseas revertir "{diagramName}":</p>
        <Select style={{ width: '100%' }} placeholder="Seleccionar versión" onChange={(value) => setSelectedVersion(value)} value={selectedVersion}>
          {versionHistory && versionHistory.map((v: VersionHistoryItem) => <Option key={v.id} value={v.id}>{v.description || `Versión ${v.id}`} ({new Date(v.timestamp).toLocaleDateString()})</Option>)}
        </Select>
        {selectedVersion && <p className="mt-2 text-orange-500">Advertencia: Esto reemplazará el contenido actual del diagrama.</p>}
      </Modal>

      <Modal title={`Versiones de: ${diagramName}`} open={versionsModalVisible} onCancel={() => setVersionsModalVisible(false)} footer={null} width={700}>
        {dataLoading && (!versionHistory || versionHistory.length === 0) ? <div className="text-center p-8"><Spin /></div> :
          versionHistory && versionHistory.length > 0 ? (
             <Timeline items={versionHistory.map((v: VersionHistoryItem) => ({
              children: (
                <div>
                  <p><strong>{v.description || `Versión ${v.id}`}</strong> por {v.author}</p>
                  <p className="text-xs text-gray-500">{new Date(v.timestamp).toLocaleString()}</p>
                  <Button size="small" onClick={() => { setSelectedVersion(v.id); setRollbackModalVisible(true); setVersionsModalVisible(false); }}>Revertir a esta versión</Button>
                </div>
              ),
            }))} />
          ) : <Empty description="No hay versiones disponibles." />
        }
      </Modal>

      <Modal title={`Previsualización de Cambios: ${diagramName}`} open={previewModalVisible} onCancel={() => setPreviewModalVisible(false)} footer={[<Button key="back" onClick={() => setPreviewModalVisible(false)}>Cerrar</Button>]} width={800}> { }
        {dataLoading ? <div className="text-center p-8"><Spin /></div> :
          previewData && (previewData.resourcesToCreate?.length > 0 || previewData.resourcesToUpdate?.length > 0 || previewData.resourcesToDelete?.length > 0) ? (
            <div>
              {previewData.resourcesToCreate?.length > 0 && <><h4 className="font-semibold mt-2">Crear:</h4><ul>{previewData.resourcesToCreate.map((r: PreviewResourceItem) => <li key={r.id}><Tag color="green">{r.type}</Tag> {r.name}</li>)}</ul></>}
              {previewData.resourcesToUpdate?.length > 0 && <><h4 className="font-semibold mt-2">Actualizar:</h4><ul>{previewData.resourcesToUpdate.map((r: PreviewResourceItem) => <li key={r.id}><Tag color="blue">{r.type}</Tag> {r.name}</li>)}</ul></>}
              {previewData.resourcesToDelete?.length > 0 && <><h4 className="font-semibold mt-2">Eliminar:</h4><ul>{previewData.resourcesToDelete.map((r: PreviewResourceItem) => <li key={r.id}><Tag color="red">{r.type}</Tag> {r.name}</li>)}</ul></>}
            </div>
          ) : <Empty description="No hay cambios para previsualizar." />
        }
      </Modal>

      <Modal title={`Ejecutar/Desplegar: ${diagramName}`} open={runModalVisible} onOk={handleRunConfirm} onCancel={() => setRunModalVisible(false)} confirmLoading={dataLoading} okText="Desplegar" cancelText="Cancelar">
        <p>Estás a punto de aplicar los cambios definidos en el diagrama "{diagramName}".</p>
        <p>Esto podría crear, modificar o eliminar recursos en tu infraestructura.</p>
        <p className="font-semibold mt-2">¿Estás seguro de que deseas continuar?</p>
      </Modal>

      <Modal title={`Promover Diagrama: ${diagramName}`} open={promoteModalVisible} onOk={handlePromoteConfirm} onCancel={() => setPromoteModalVisible(false)} confirmLoading={dataLoading} okText="Promover" cancelText="Cancelar">
        <p>Selecciona el ambiente de destino para promover el diagrama "{diagramName}":</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Seleccionar ambiente de destino"
          onChange={(value) => setSelectedTargetEnvironment(value)}
          value={selectedTargetEnvironment}
          loading={dataLoading}
        >
          {environments && environments
            .filter((env: Environment) => env.id !== selectedEnvironment)
            .map((env: Environment) => <Option key={env.id} value={env.id}>{env.name} ({env.path || 'root'})</Option>)}
        </Select>
        {selectedTargetEnvironment && <p className="mt-2 text-orange-500">El diagrama se copiará al ambiente seleccionado.</p>}
      </Modal>

      <Modal title={<><ExclamationCircleFilled className="text-red-500 mr-2" />Confirmar Eliminación</>} open={destroyModalVisible} onOk={handleDestroyConfirm} onCancel={() => setDestroyModalVisible(false)} confirmLoading={dataLoading} okText="Eliminar" okButtonProps={{ danger: true }} cancelText="Cancelar">
        <p>Estás a punto de eliminar el diagrama <strong className="text-red-500">{currentDiagram?.name}</strong> y todos sus recursos asociados.</p>
        <p className="text-red-500 font-semibold">¡Esta acción es irreversible!</p>
        <p className="mt-2">Por favor, escribe el nombre del diagrama para confirmar:</p>
        <Input placeholder={currentDiagram?.name || "Nombre del diagrama"} value={destroyConfirmationText} onChange={(e) => setDestroyConfirmationText(e.target.value)} />
      </Modal>

      <GeneratedCodeModal
        visible={generatedCodeModalVisible}
        onClose={() => setGeneratedCodeModalVisible(false)}
        nodes={currentDiagram?.nodes || []}
      />
    </>
  );
}
