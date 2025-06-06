'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dropdown, Avatar, Button, Modal, Select, Tooltip, Timeline, Input, Spin, Empty, Tag, Divider } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  HistoryOutlined, 
  UndoOutlined, 
  CloudUploadOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  ExclamationCircleFilled
} from '@ant-design/icons';
import { logoutUser as authLogout } from '../services/authService';
import { PERSONAL_SPACE_COMPANY_NAME_PREFIX } from '../services/companyService';
import { useNavigationStore } from '@/app/hooks/useNavigationStore'; 
import type { Environment } from '../services/diagramService';
import EnvironmentTreeSelect from "./ui/EnvironmentTreeSelect";
import DiagramTreeSelect from "./ui/DiagramTreeSelect"; 

const { Option } = Select;
const { TextArea } = Input;

// Estos tipos podrían importarse desde useNavigationStore si se exportan desde allí
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

  // Seleccionar cada propiedad individualmente de useNavigationStore
  const user = useNavigationStore(state => state.user);
  const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);
  const activeCompany = useNavigationStore(state => state.activeCompany);
  const isPersonalSpace = useNavigationStore(state => state.isPersonalSpace);
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

  const historyModalVisible = useNavigationStore(state => state.historyModalVisible);
  const setHistoryModalVisible = useNavigationStore(state => state.setHistoryModalVisible);
  const versionHistory = useNavigationStore(state => state.versionHistory);
  const handleHistory = useNavigationStore(state => state.handleHistory);
  const rollbackModalVisible = useNavigationStore(state => state.rollbackModalVisible);
  const setRollbackModalVisible = useNavigationStore(state => state.setRollbackModalVisible);
  const selectedVersion = useNavigationStore(state => state.selectedVersion);
  const setSelectedVersion = useNavigationStore(state => state.setSelectedVersion);
  const handleRollback = useNavigationStore(state => state.handleRollback);
  const handleRollbackConfirm = useNavigationStore(state => state.handleRollbackConfirm);
  const versionsModalVisible = useNavigationStore(state => state.versionsModalVisible);
  const setVersionsModalVisible = useNavigationStore(state => state.setVersionsModalVisible);
  const handleVersions = useNavigationStore(state => state.handleVersions);
  const previewModalVisible = useNavigationStore(state => state.previewModalVisible);
  const setPreviewModalVisible = useNavigationStore(state => state.setPreviewModalVisible);
  const previewData = useNavigationStore(state => state.previewData);
  const handlePreview = useNavigationStore(state => state.handlePreview);
  const runModalVisible = useNavigationStore(state => state.runModalVisible);
  const setRunModalVisible = useNavigationStore(state => state.setRunModalVisible);
  const handleRun = useNavigationStore(state => state.handleRun);
  const handleRunConfirm = useNavigationStore(state => state.handleRunConfirm);
  const promoteModalVisible = useNavigationStore(state => state.promoteModalVisible);
  const setPromoteModalVisible = useNavigationStore(state => state.setPromoteModalVisible);
  const selectedTargetEnvironment = useNavigationStore(state => state.selectedTargetEnvironment);
  const setSelectedTargetEnvironment = useNavigationStore(state => state.setSelectedTargetEnvironment);
  const handlePromote = useNavigationStore(state => state.handlePromote);
  const handlePromoteConfirm = useNavigationStore(state => state.handlePromoteConfirm);
  const destroyModalVisible = useNavigationStore(state => state.destroyModalVisible);
  const setDestroyModalVisible = useNavigationStore(state => state.setDestroyModalVisible);
  const destroyConfirmationText = useNavigationStore(state => state.destroyConfirmationText);
  const setDestroyConfirmationText = useNavigationStore(state => state.setDestroyConfirmationText);
  const handleDestroy = useNavigationStore(state => state.handleDestroy);
  const handleDestroyConfirm = useNavigationStore(state => state.handleDestroyConfirm);

  useEffect(() => {
    if (!user) {
      // fetchInitialUser es una función, así que no necesita ser una dependencia si es estable.
      // Pero si se redefine en el store (no debería con la forma estándar de Zustand), entonces sí.
      // Por seguridad y claridad, la incluimos si se llama.
      fetchInitialUser();
    }
  }, [user, fetchInitialUser]);

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

  const onEnvChange = (value: string) => { // 'value' ya está tipado como string, esto es extraño. El error podría ser de una ejecución anterior.
    if (value === 'create-new-env') {
      setNewEnvironmentModalVisible(true);
    } else {
      handleEnvironmentChange(value);
    }
  };

  const onDiagramChange = (value: string) => { // 'value' ya está tipado como string, esto es extraño. El error podría ser de una ejecución anterior.
    if (value === 'create-new-diag') {
      setNewDiagramModalVisible(true);
    } else {
      handleDiagramChange(value);
    }
  };

  return (
    <>
      <nav className="fixed w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14">
          <div className="flex items-center">
            <Link href={isOnMarketingPage ? "/" : "/dashboard"} className="text-xl flex items-center mr-4">
              <span className="font-bold text-slate-800 dark:text-slate-100">Infra</span><span className="font-bold text-emerald-green-600 dark:text-emerald-green-500">UX</span>
            </Link>
            {!isOnMarketingPage && activeCompany && (
              <div className="flex items-center space-x-4"> {/* Aumentado space-x */}
                <Tag color="blue" icon={<ApartmentOutlined />} className="hidden sm:flex items-center">
                  {activeCompany.name.replace(PERSONAL_SPACE_COMPANY_NAME_PREFIX, '')}
                  {isPersonalSpace && " (Personal)"}
                </Tag>

                <EnvironmentTreeSelect
                  value={selectedEnvironment || undefined}
                  onChange={onEnvChange}
                  environments={environments}
                />
                
                <DiagramTreeSelect
                  value={selectedDiagram || undefined}
                  onChange={onDiagramChange}
                  diagrams={diagrams}
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex justify-center">
            {isOnMarketingPage && (
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Features</a>
                <Link href="/docs" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Docs</Link>
                <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">About</Link>
                <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 transition-colors">Blog</Link>
              </div>
            )}
            {!isOnMarketingPage && currentDiagram && (
              <div className="flex items-center space-x-2"> {/* Aumentado space-x */}
                <Tooltip title="Historial de Versiones"><Button icon={<HistoryOutlined />} size="small" onClick={handleHistory} disabled={dataLoading} /></Tooltip>
                <Tooltip title="Revertir Cambios"><Button icon={<UndoOutlined />} size="small" onClick={handleRollback} disabled={dataLoading} /></Tooltip>
                <Tooltip title="Versiones"><Button icon={<BranchesOutlined />} size="small" onClick={handleVersions} disabled={dataLoading} /></Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Previsualizar Cambios"><Button icon={<EyeOutlined />} size="small" onClick={handlePreview} disabled={dataLoading} /></Tooltip>
                <Tooltip title="Ejecutar/Desplegar"><Button icon={<PlayCircleOutlined />} type="primary" size="small" onClick={handleRun} disabled={dataLoading} /></Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Promover a Ambiente"><Button icon={<CloudUploadOutlined />} size="small" onClick={handlePromote} disabled={dataLoading || (environments && environments.length <= 1)} /></Tooltip>
                <Tooltip title="Limpiar (Destruir Recursos)"><Button icon={<DeleteOutlined />} danger size="small" onClick={handleDestroy} disabled={dataLoading} /></Tooltip>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {isOnMarketingPage && (
              <div className="flex gap-3 items-center">
                <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-electric-purple-600 dark:hover:text-electric-purple-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</Link>
                <Link href="/register" className="bg-electric-purple-600 text-white hover:bg-electric-purple-700 dark:bg-electric-purple-500 dark:hover:bg-electric-purple-600 transition-colors px-4 py-2 text-sm font-medium rounded-md">Sign Up</Link>
              </div>
            )}
            {!isOnMarketingPage && user && (
              <div className="flex items-center gap-4">
                <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                  <a onClick={e => e.preventDefault()} className="flex items-center gap-2 cursor-pointer">
                    <Avatar icon={<UserOutlined />} src={user.avatar_url || undefined} size="small" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
                      {user.name || user.email}
                    </span>
                  </a>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modales */}
      <Modal title="Crear Nuevo Ambiente" open={newEnvironmentModalVisible} onOk={handleCreateNewEnvironment} onCancel={() => setNewEnvironmentModalVisible(false)} confirmLoading={dataLoading}>
        <Input placeholder="Nombre del Ambiente" value={newEnvironmentName} onChange={(e) => setNewEnvironmentName(e.target.value)} style={{ marginBottom: 8 }} />
        <Input placeholder="Ruta (ej: dev/us-east-1)" value={newEnvironmentPath} onChange={(e) => setNewEnvironmentPath(e.target.value)} style={{ marginBottom: 8 }} />
        <TextArea placeholder="Descripción (opcional)" value={newEnvironmentDescription} onChange={(e) => setNewEnvironmentDescription(e.target.value)} rows={2} />
      </Modal>

      <Modal title="Crear Nuevo Diagrama" open={newDiagramModalVisible} onOk={handleCreateNewDiagram} onCancel={() => setNewDiagramModalVisible(false)} confirmLoading={dataLoading}>
        <Input placeholder="Nombre del Diagrama" value={newDiagramName} onChange={(e) => setNewDiagramName(e.target.value)} style={{ marginBottom: 8 }} />
        <Input placeholder="Ruta (ej: frontend/app)" value={newDiagramPath} onChange={(e) => setNewDiagramPath(e.target.value)} style={{ marginBottom: 8 }} />
        <TextArea placeholder="Descripción (opcional)" value={newDiagramDescription} onChange={(e) => setNewDiagramDescription(e.target.value)} rows={2} />
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
        {/* eslint-disable-next-line react/no-unescaped-entities */}
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
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        <p>Estás a punto de aplicar los cambios definidos en el diagrama "{diagramName}".</p>
        <p>Esto podría crear, modificar o eliminar recursos en tu infraestructura.</p>
        <p className="font-semibold mt-2">¿Estás seguro de que deseas continuar?</p>
      </Modal>

      <Modal title={`Promover Diagrama: ${diagramName}`} open={promoteModalVisible} onOk={handlePromoteConfirm} onCancel={() => setPromoteModalVisible(false)} confirmLoading={dataLoading} okText="Promover" cancelText="Cancelar">
        {/* eslint-disable-next-line react/no-unescaped-entities */}
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
        <Input placeholder={currentDiagram?.name} value={destroyConfirmationText} onChange={(e) => setDestroyConfirmationText(e.target.value)} />
      </Modal>
    </>
  );
}
