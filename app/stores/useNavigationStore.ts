import { create } from 'zustand';
import { message, Modal } from 'antd'; // Modal importado
// import type { Viewport } from 'reactflow'; // Ya no se usa directamente debido al workaround con 'any'
import type { User } from "../services/authService";
import type { Company } from "../services/companyService";
import {
  Environment,
  Diagram,
  Node as DiagramNode, // Renombrar para claridad si es necesario, o usar el tipo específico de nodo del servicio
} from "../services/diagramService";
import { Workspace } from '../services/workspaceService';
import {
  getCurrentUser,
  logoutUser,
} from "../services/authService";
import {
  getEnvironments,
  getDiagramsByEnvironment,
  getDiagram,
  createDiagram as createDiagramServiceAPICall,
  createEnvironment as createEnvironmentServiceAPICall,
  deleteEnvironment as deleteEnvironmentServiceAPICall,
  deleteDiagram as deleteDiagramServiceAPICall,
  updateDiagram as updateDiagramServiceAPICall // Añadir updateDiagram
} from "../services/diagramService";
import { PERSONAL_SPACE_COMPANY_NAME_PREFIX } from "../services/companyService"; // Importar servicio de compañía
import { dashboardService } from "../services/dashboardService"; // Importar servicio de dashboard optimizado
import { cacheService, CACHE_KEYS } from "../services/cacheService"; // Importar servicio de caché

// Tipos para el historial y previsualización
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
  provider: string;
  changes: Record<string, unknown>;
}

interface PreviewData {
  resourcesToCreate: PreviewResourceItem[];
  resourcesToUpdate: PreviewResourceItem[];
  resourcesToDelete: PreviewResourceItem[];
}

export interface NavigationStoreState {
  // Estados para modales de acciones del header
  historyModalVisible: boolean;
  versionHistory: VersionHistoryItem[];
  rollbackModalVisible: boolean;
  selectedVersion: string | null;
  versionsModalVisible: boolean;
  previewModalVisible: boolean;
  previewData: PreviewData;
  runModalVisible: boolean;
  promoteModalVisible: boolean;
  selectedTargetEnvironment?: string;
  destroyModalVisible: boolean;
  destroyConfirmationText: string;
  
  // Estados globales
  user: User | null;
  userCompanies: Company[]; 
  activeCompany: Company | null;
  isPersonalSpace: boolean;
  workspaces: Workspace[]; // Agregar workspaces
  activeWorkspace: Workspace | null; // Workspace activo
  environments: Environment[];
  diagrams: Diagram[]; 
  selectedEnvironment: string | null;
  selectedDiagram: string | null;
  currentDiagram: Diagram | null; 
  dataLoading: boolean;
  dataError: string | null;
  authInitialized: boolean;

  // Estados para modales de creación
  newEnvironmentModalVisible: boolean;
  newEnvironmentName: string;
  newEnvironmentDescription: string;
  newEnvironmentPath: string;
  newDiagramModalVisible: boolean;
  newDiagramName: string;
  newDiagramDescription: string;
  newDiagramPath: string;
  
  // Acciones para modales del header
  setHistoryModalVisible: (visible: boolean) => void;
  setVersionHistory: (history: VersionHistoryItem[]) => void;
  handleHistory: () => Promise<void>;
  setRollbackModalVisible: (visible: boolean) => void;
  setSelectedVersion: (versionId: string | null) => void;
  handleRollback: () => Promise<void>;
  handleRollbackConfirm: () => Promise<void>;
  setVersionsModalVisible: (visible: boolean) => void;
  handleVersions: () => Promise<void>;
  setPreviewModalVisible: (visible: boolean) => void;
  setPreviewData: (data: PreviewData) => void;
  handlePreview: () => Promise<void>;
  setRunModalVisible: (visible: boolean) => void;
  handleRun: () => void;
  handleRunConfirm: () => Promise<void>;
  setPromoteModalVisible: (visible: boolean) => void;
  setSelectedTargetEnvironment: (envId?: string) => void;
  handlePromote: () => void;
  handlePromoteConfirm: () => Promise<void>;
  setDestroyModalVisible: (visible: boolean) => void;
  setDestroyConfirmationText: (text: string) => void;
  handleDestroy: () => void;
  handleDestroyConfirm: () => Promise<void>;

  // Acciones globales
  fetchInitialUser: () => Promise<void>;
  initializeAppLogic: () => Promise<void>;
  setActiveCompanyAndLoadData: (company: Company, isPersonal: boolean) => Promise<void>;
  fetchCurrentWorkspaceEnvironments: () => Promise<void>;
  handleEnvironmentChange: (environmentId: string) => Promise<void>;
  handleDiagramChange: (diagramId: string) => Promise<void>;

  // Acciones para modales de creación
  setNewEnvironmentModalVisible: (visible: boolean) => void;
  setNewEnvironmentName: (name: string) => void;
  setNewEnvironmentDescription: (description: string) => void;
  setNewEnvironmentPath: (path: string) => void;
  handleCreateNewEnvironment: () => Promise<void>; 
  setNewDiagramModalVisible: (visible: boolean) => void;
  setNewDiagramName: (name: string) => void;
  setNewDiagramDescription: (description: string) => void;
  setNewDiagramPath: (path: string) => void;
  handleCreateNewDiagram: () => Promise<void>;

  // Acciones para eliminar
  handleDeleteEnvironment: (environmentId: string) => Promise<void>;
  handleDeleteDiagram: (diagramId: string) => Promise<void>;

  // Acción para actualizar path de diagrama (Drag and Drop)
  handleUpdateDiagramPath: (diagramId: string, newPath: string | null) => Promise<void>;
}

export const useNavigationStore = create<NavigationStoreState>((set, get) => ({
  historyModalVisible: false,
  versionHistory: [],
  rollbackModalVisible: false,
  selectedVersion: null,
  versionsModalVisible: false,
  previewModalVisible: false,
  previewData: { resourcesToCreate: [], resourcesToUpdate: [], resourcesToDelete: [] },
  runModalVisible: false,
  promoteModalVisible: false,
  selectedTargetEnvironment: undefined,
  destroyModalVisible: false,
  destroyConfirmationText: '',

  user: null,
  userCompanies: [], 
  activeCompany: null,
  isPersonalSpace: false,
  workspaces: [], // Inicializar workspaces
  activeWorkspace: null, // Inicializar workspace activo
  environments: [],
  diagrams: [],
  selectedEnvironment: null,
  selectedDiagram: null,
  currentDiagram: null,
  dataLoading: false, // Iniciar en false para permitir la primera carga
  dataError: null,
  authInitialized: false,

  newEnvironmentModalVisible: false,
  newEnvironmentName: '',
  newEnvironmentDescription: '',
  newEnvironmentPath: '',
  newDiagramModalVisible: false,
  newDiagramName: '',
  newDiagramDescription: '',
  newDiagramPath: '',

  setHistoryModalVisible: (visible) => set({ historyModalVisible: visible }),
  setVersionHistory: (history) => set({ versionHistory: history }),
  handleHistory: async () => {
    const { activeCompany, selectedEnvironment, selectedDiagram } = get();
    if (!activeCompany?._id || !selectedEnvironment || !selectedDiagram) {
      message.error("Seleccione compañía, ambiente y diagrama para ver el historial."); return;
    }
    set({ dataLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const mockHistory: VersionHistoryItem[] = [
      { id: 'v3', timestamp: new Date(Date.now() - 36e5 * 2).toISOString(), author: 'Usuario A', description: 'Cambios mayores', changes: { created: 2, updated: 3, deleted: 1 } },
      { id: 'v2', timestamp: new Date(Date.now() - 36e5 * 24).toISOString(), author: 'Usuario B', description: 'Ajuste S3', changes: { created: 0, updated: 1, deleted: 0 } },
    ];
    set({ versionHistory: mockHistory, historyModalVisible: true, dataLoading: false });
  },

  setRollbackModalVisible: (visible) => set({ rollbackModalVisible: visible }),
  setSelectedVersion: (versionId) => set({ selectedVersion: versionId }),
  handleRollback: async () => {
    if (get().versionHistory.length === 0) await get().handleHistory();
    set({ selectedVersion: null, rollbackModalVisible: true });
  },
  handleRollbackConfirm: async () => {
    const { selectedVersion, currentDiagram, handleDiagramChange } = get();
    if (!selectedVersion || !currentDiagram) { message.error("Error en datos para revertir."); return; }
    set({ dataLoading: true });
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    message.success(`Diagrama revertido a ${selectedVersion} (simulado).`);
    set({ rollbackModalVisible: false, selectedVersion: null });
    if (currentDiagram.id) { 
      await handleDiagramChange(currentDiagram.id);
    }
    set({ dataLoading: false });
  },

  setVersionsModalVisible: (visible) => set({ versionsModalVisible: visible }),
  handleVersions: async () => {
    if (get().versionHistory.length === 0) await get().handleHistory();
    set({ versionsModalVisible: true });
  },

  setPreviewModalVisible: (visible) => set({ previewModalVisible: visible }),
  setPreviewData: (data) => set({ previewData: data }),
  handlePreview: async () => {
    const { currentDiagram } = get();
    if (!currentDiagram) { message.info("No hay diagrama seleccionado para previsualizar."); return; }
    set({ dataLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const mockPreview: PreviewData = { 
      resourcesToCreate: (currentDiagram.nodes || []).filter((n: DiagramNode) => n.type !== 'group').map((node: DiagramNode) => ({ 
        id: node.id, 
        type: node.type || 'unknown', 
        name: String(node.data?.label || 'Unnamed'), 
        provider: String(node.data?.provider || 'generic'), 
        changes: { create: true } 
      })),
      resourcesToUpdate: [], 
      resourcesToDelete: [] 
    };
    set({ previewData: mockPreview, previewModalVisible: true, dataLoading: false });
  },

  setRunModalVisible: (visible) => set({ runModalVisible: visible }),
  handleRun: () => {
    if (!get().currentDiagram) { message.info("No hay diagrama seleccionado para ejecutar."); return; }
    set({ runModalVisible: true });
  },
  handleRunConfirm: async () => {
    set({ dataLoading: true });
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    message.success('Diagrama desplegado (simulado).');
    set({ runModalVisible: false, previewData: { resourcesToCreate: [], resourcesToUpdate: [], resourcesToDelete: [] }, dataLoading: false });
  },
  
  setPromoteModalVisible: (visible) => set({ promoteModalVisible: visible }),
  setSelectedTargetEnvironment: (envId) => set({ selectedTargetEnvironment: envId }),
  handlePromote: () => {
    const { currentDiagram, environments } = get();
    if (!currentDiagram) { message.warning("No hay diagrama seleccionado para promover."); return; }
    if (environments.length <= 1) { message.info("No hay otros ambientes disponibles para promover."); return; }
    set({ selectedTargetEnvironment: undefined, promoteModalVisible: true });
  },
  handlePromoteConfirm: async () => {
    const { selectedTargetEnvironment, currentDiagram, activeCompany, selectedEnvironment, environments } = get();
    if (!currentDiagram || !activeCompany || !selectedEnvironment || !selectedTargetEnvironment) {
      message.error("Información incompleta para promover el diagrama."); return;
    }
    if (selectedEnvironment === selectedTargetEnvironment) {
      message.warning("El ambiente de destino no puede ser el mismo que el ambiente actual."); return;
    }
    set({ dataLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const targetEnvName = environments.find(e => e.id === selectedTargetEnvironment)?.name || 'desconocido';
      message.success(`Diagrama "${currentDiagram.name}" promovido exitosamente al ambiente "${targetEnvName}" (simulado).`);
      set({ promoteModalVisible: false, selectedTargetEnvironment: undefined, dataLoading: false });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      message.error(`Error al promover el diagrama: ${errorMsg}`);
      set({ dataLoading: false }); 
    }
  },

  setDestroyModalVisible: (visible) => set({ destroyModalVisible: visible }),
  setDestroyConfirmationText: (text) => set({ destroyConfirmationText: text }),
  handleDestroy: () => {
    if (!get().currentDiagram) { message.warning("No hay diagrama seleccionado para eliminar."); return; }
    set({ destroyConfirmationText: '', destroyModalVisible: true });
  },
  handleDestroyConfirm: async () => {
    const { destroyConfirmationText, currentDiagram, activeCompany, selectedEnvironment, handleEnvironmentChange } = get();
    if (!currentDiagram || !activeCompany?._id || !selectedEnvironment) {
      message.error("Información incompleta para eliminar."); return;
    }
    if (destroyConfirmationText !== currentDiagram.name) {
      message.error("El nombre de confirmación no coincide."); return;
    }
    set({ dataLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      message.success(`Diagrama "${currentDiagram.name}" eliminado (simulado).`);
      set({ destroyModalVisible: false, destroyConfirmationText: '' });
      await handleEnvironmentChange(selectedEnvironment); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      message.error(`Error al eliminar el diagrama: ${errorMsg}`);
    } finally {
      set({ dataLoading: false });
    }
  },

  fetchInitialUser: async () => {
    const state = get();
    if (state.authInitialized) {
      console.log('[NavStore] fetchInitialUser: Auth ya inicializado, saltando.');
      return;
    }
    if (state.dataLoading) {
      console.log('[NavStore] fetchInitialUser: Ya está cargando, saltando...');
      return;
    }

    set({ dataLoading: true });

    try {
      console.log('[NavStore] fetchInitialUser: Obteniendo usuario...');
      let currentUser = getCurrentUser();
      if (!currentUser) {
        const { getCurrentUserAsync } = await import('../services/authService');
        currentUser = await getCurrentUserAsync();
      }
      console.log('[NavStore] fetchInitialUser: Usuario obtenido:', currentUser);
      set({ user: currentUser });

      if (currentUser) {
        console.log('[NavStore] fetchInitialUser: Usuario existe, llamando a initializeAppLogic.');
        await get().initializeAppLogic();
      }
    } catch (error) {
      console.error('[NavStore] fetchInitialUser: Error:', error);
      set({ dataError: 'Error al obtener usuario' });
    } finally {
      console.log('[NavStore] fetchInitialUser: Auth check finalizado.');
      set({ authInitialized: true, dataLoading: false });
    }
  },

  initializeAppLogic: async () => {
    const state = get();
    const user = state.user;

    console.log('[NavStore] initializeAppLogic: START');

    if (!user?._id) {
      console.error('[NavStore] initializeAppLogic: Aborting, no user in store.');
      set({ dataLoading: false, dataError: "No se pudo inicializar: Usuario no encontrado." });
      return;
    }

    console.log(`[NavStore] initializeAppLogic: Proceeding for user ${user._id}`);
    set({ dataLoading: true, dataError: null });

    try {
      console.log('[NavStore] initializeAppLogic: Calling dashboardService.getInitialDashboardData...');
      const dashboardData = await dashboardService.getInitialDashboardData();
      console.log('[NavStore] initializeAppLogic: Received data from backend:', dashboardData);

      const { companies, workspaces, environments, recent_diagrams, active_company_id, active_workspace_id } = dashboardData;
      set({ userCompanies: companies || [] });

      if (companies && companies.length > 0) {
        let companyToSelect = companies.find(c => c._id === active_company_id || c.id === active_company_id);
        let isPersonal = false;

        if (!companyToSelect) {
          const personalSpaceName = `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}${user.name || user.email}`;
          companyToSelect = companies.find((c: Company) => c.name === personalSpaceName);
          isPersonal = !!companyToSelect;
        }
        if (!companyToSelect) {
          companyToSelect = companies[0];
          isPersonal = companyToSelect.name.startsWith(PERSONAL_SPACE_COMPANY_NAME_PREFIX);
        }
        
        console.log('[NavStore] initializeAppLogic: Selected company:', companyToSelect?.name);
        
        let activeWorkspace = null;
        if (active_workspace_id && workspaces) {
          activeWorkspace = workspaces.find(w => w.id === active_workspace_id || w._id === active_workspace_id);
        }
        if (!activeWorkspace && workspaces && workspaces.length > 0) {
          activeWorkspace = workspaces[0];
        }

        set({
          activeCompany: companyToSelect,
          isPersonalSpace: isPersonal,
          workspaces: workspaces || [],
          activeWorkspace: activeWorkspace,
          environments: environments || [],
          diagrams: recent_diagrams || [],
          selectedEnvironment: environments?.[0]?.id || null,
          selectedDiagram: recent_diagrams?.[0]?.id || null,
          currentDiagram: recent_diagrams?.[0] || null,
        });

        if (recent_diagrams?.[0]?.id && (!recent_diagrams[0].nodes || !recent_diagrams[0].edges)) {
          await get().handleDiagramChange(recent_diagrams[0].id);
        }
      } else {
        console.log('[NavStore] initializeAppLogic: No companies found for user.');
        set({ activeCompany: null });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[NavStore] initializeAppLogic: CRITICAL ERROR: ${errorMsg}`);
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        await logoutUser();
      }
      message.error(`Error crítico al cargar datos: ${errorMsg}`);
      set({ dataError: errorMsg, userCompanies: [] });
    } finally {
      console.log('[NavStore] initializeAppLogic: FINISHED.');
      set({ dataLoading: false });
    }
  },
  
  setActiveCompanyAndLoadData: async (company, isPersonal) => {
    console.log('[NavStore] setActiveCompanyAndLoadData: Estableciendo compañía activa:', company, 'Es personal:', isPersonal);
    set({ 
      activeCompany: company, 
      isPersonalSpace: isPersonal, 
      dataLoading: true, 
      dataError: null, 
      environments: [], 
      diagrams: [], 
      selectedEnvironment: null, 
      selectedDiagram: null, 
      currentDiagram: null 
    });
    try {
      const { workspaces } = get();
      const companyWorkspaces = workspaces.filter(w => w.company_id === company.id);
      const activeWorkspace = companyWorkspaces.find(w => w.is_default) || companyWorkspaces[0] || null;
      
      console.log(`[NavStore] setActiveCompanyAndLoadData: Workspace activo para la compañía "${company.name}" es:`, activeWorkspace?.id);

      if (activeWorkspace) {
        set({ activeWorkspace });
        await get().fetchCurrentWorkspaceEnvironments();
      } else {
        console.warn(`[NavStore] setActiveCompanyAndLoadData: No se encontró workspace activo para la compañía ${company.id}.`);
        set({ workspaces: [], activeWorkspace: null, environments: [], dataLoading: false });
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`[NavStore] setActiveCompanyAndLoadData: Error cargando datos de compañía: ${errorMsg}`);
      message.error("Error cargando datos de la compañía: " + errorMsg);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },

  fetchCurrentWorkspaceEnvironments: async () => {
    const { activeWorkspace } = get();
    if (!activeWorkspace) {
      console.log('[NavStore] fetchCurrentWorkspaceEnvironments: No active workspace, skipping fetch.');
      return;
    }
    console.log(`[NavStore] fetchCurrentWorkspaceEnvironments: Fetching environments for workspace ${activeWorkspace.id}`);
    set({ dataLoading: true });
    try {
      const envs = await getEnvironments(activeWorkspace.id, true); // Force refresh
      console.log(`[NavStore] fetchCurrentWorkspaceEnvironments: Received ${envs.length} environments.`);
      set({ environments: envs, dataLoading: false, dataError: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[NavStore] fetchCurrentWorkspaceEnvironments: Error: ${errorMsg}`);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },

  handleEnvironmentChange: async (environmentId) => {
    const { activeCompany } = get();
    if (!activeCompany) { 
      console.warn('[NavStore] handleEnvironmentChange: No hay compañía activa.');
      set({dataLoading: false}); return; 
    } 
    console.log(`[NavStore] handleEnvironmentChange: Cambiando a ambiente ID: ${environmentId} para compañía ID: ${activeCompany._id}`);
    set({ selectedEnvironment: environmentId, dataLoading: true, diagrams: [], selectedDiagram: null, currentDiagram: null });
    try {
      const { activeWorkspace } = get();
      if (!activeWorkspace) {
        console.warn('[NavStore] handleEnvironmentChange: No hay workspace activo.');
        set({dataLoading: false}); return;
      }
      const diags = await getDiagramsByEnvironment(activeWorkspace.id, environmentId);
      console.log('[NavStore] handleEnvironmentChange: Diagramas obtenidos:', diags);
      set({ diagrams: diags });
      if (diags.length > 0) {
        const defaultDiagId = diags[0].id;
        console.log('[NavStore] handleEnvironmentChange: Estableciendo diagrama por defecto ID:', defaultDiagId);
        await get().handleDiagramChange(defaultDiagId); 
      } else {
        console.log('[NavStore] handleEnvironmentChange: No hay diagramas en este ambiente.');
        set({ dataLoading: false }); 
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`[NavStore] handleEnvironmentChange: Error al cambiar de ambiente: ${errorMsg}`);
      message.error("Error al cambiar de ambiente: " + errorMsg);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },

  handleDiagramChange: async (diagramId) => {
    const { activeCompany, selectedEnvironment, selectedDiagram, currentDiagram } = get();
    if (!activeCompany || !selectedEnvironment) { 
      console.warn('[NavStore] handleDiagramChange: No hay compañía activa o ambiente seleccionado.');
      set({dataLoading: false}); return; 
    }
    
    // Si estamos cambiando desde otro diagrama, emitir evento para forzar guardado
    if (selectedDiagram && selectedDiagram !== diagramId && currentDiagram) {
      console.log('[NavStore] handleDiagramChange: Emitiendo evento para guardar viewport del diagrama actual');
      // Emitir evento personalizado para que FlowEditor guarde inmediatamente
      window.dispatchEvent(new CustomEvent('forceSaveCurrentDiagram'));
      // Dar tiempo para que se complete el guardado
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`[NavStore] handleDiagramChange: Cambiando a diagrama ID: ${diagramId} en ambiente ID: ${selectedEnvironment}`);
    set({ selectedDiagram: diagramId, dataLoading: true });
    try {
      const { activeWorkspace } = get();
      if (!activeWorkspace) {
        console.warn('[NavStore] handleDiagramChange: No hay workspace activo.');
        set({dataLoading: false}); return;
      }
      const diagramData = await getDiagram(activeWorkspace.id, selectedEnvironment, diagramId);
      console.log('[NavStore] handleDiagramChange: Datos del diagrama obtenidos:', diagramData);
      set({ currentDiagram: diagramData, dataLoading: false });
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`[NavStore] handleDiagramChange: Error al cambiar de diagrama: ${errorMsg}`);
      message.error("Error al cambiar de diagrama: " + errorMsg);
      set({ dataError: errorMsg, dataLoading: false, currentDiagram: null });
    }
  },

  setNewEnvironmentModalVisible: (visible) => set({ newEnvironmentModalVisible: visible }),
  setNewEnvironmentName: (name) => set({ newEnvironmentName: name }),
  setNewEnvironmentDescription: (description) => set({ newEnvironmentDescription: description }),
  setNewEnvironmentPath: (path) => set({ newEnvironmentPath: path }),
  handleCreateNewEnvironment: async () => {
    const { activeWorkspace, newEnvironmentName, newEnvironmentDescription, newEnvironmentPath, isPersonalSpace, environments: currentEnvs } = get();
    if (!activeWorkspace || !newEnvironmentName.trim()) {
      message.error("Selecciona un workspace y escribe un nombre para el ambiente."); return;
    }
    if (isPersonalSpace && currentEnvs.length >= 1) { 
      message.warning("El plan Starter solo permite 1 ambiente."); 
      set({ newEnvironmentModalVisible: false }); return;
    }
    set({ dataLoading: true });
    try {
      const environmentPayload = {
        name: newEnvironmentName,
        description: newEnvironmentDescription, 
        path: newEnvironmentPath.trim() || undefined, // Enviar undefined si está vacío para que el backend lo omita si es opcional        
      };
      
      const createdEnv = await createEnvironmentServiceAPICall(activeWorkspace.id, environmentPayload);
      message.success(`Ambiente "${createdEnv.name}" creado exitosamente.`);
      
      // La invalidación de caché y el refresh ahora se hacen en el servicio
      
      // Refrescar la lista de ambientes (forzar actualización)
      const updatedEnvs = await getEnvironments(activeWorkspace.id, true);
      set({
        environments: updatedEnvs,
        newEnvironmentName: '', 
        newEnvironmentDescription: '', 
        newEnvironmentPath: '', 
        newEnvironmentModalVisible: false, 
        dataLoading: false 
      });
      
      // Si este es el primer ambiente creado, seleccionarlo automáticamente
      if (updatedEnvs.length === 1 || (createdEnv && !get().selectedEnvironment)) {
        await get().handleEnvironmentChange(createdEnv.id);
      } else if (createdEnv) { // Si ya había otros, simplemente refrescar la lista pero no cambiar la selección actual
         // Opcional: si se quiere seleccionar el nuevo ambiente siempre:
         // await get().handleEnvironmentChange(createdEnv.id);
      }

    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      message.error(`Error al crear ambiente: ${errorMsg}`);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },

  setNewDiagramModalVisible: (visible) => set({ newDiagramModalVisible: visible }),
  setNewDiagramName: (name) => set({ newDiagramName: name }),
  setNewDiagramDescription: (description) => set({ newDiagramDescription: description }),
  setNewDiagramPath: (path) => set({ newDiagramPath: path }),
  handleCreateNewDiagram: async () => {
    const { activeCompany, selectedEnvironment, newDiagramName, newDiagramDescription, newDiagramPath, diagrams, isPersonalSpace } = get();
    if (!activeCompany || !selectedEnvironment || !newDiagramName.trim()) {
      message.error("Selecciona un ambiente y escribe un nombre para el diagrama."); return;
    }
    if (isPersonalSpace && diagrams.filter(d => !d.isFolder).length >= 3) { 
      message.warning("El plan Starter solo permite 3 diagramas."); 
      set({ newDiagramModalVisible: false }); 
      return;
    }
    set({ dataLoading: true });
    try {
      const newDiag = await createDiagramServiceAPICall(activeCompany._id, selectedEnvironment, { 
        name: newDiagramName, 
        description: newDiagramDescription, 
        path: newDiagramPath.trim() || undefined, 
        nodes: [], 
        edges: [], 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        viewport: {x:0, y:0, zoom:1} as any 
      });
      message.success("Diagrama creado.");
      
      // Invalidar caché de diagramas
      cacheService.clear(CACHE_KEYS.DIAGRAMS(activeCompany._id, selectedEnvironment));
      
      const currentDiagrams = await getDiagramsByEnvironment(activeCompany._id, selectedEnvironment, true); 
      set({ diagrams: currentDiagrams, dataLoading: false }); 
      await get().handleDiagramChange(newDiag.id);
      
      set({ newDiagramName: '', newDiagramPath: '', newDiagramDescription: '', newDiagramModalVisible: false });
    } catch (e: unknown) { 
      const errorMsg = e instanceof Error ? e.message : String(e);
      message.error(`Error al crear diagrama: ` + errorMsg); 
      set({ dataError: errorMsg, dataLoading: false });
    }
  },

  handleDeleteEnvironment: async (environmentId: string) => {
    const { activeCompany, selectedEnvironment, handleEnvironmentChange } = get();
    if (!activeCompany?._id) {
      message.error("No hay compañía activa seleccionada.");
      return;
    }
    Modal.confirm({
      title: '¿Estás seguro de que deseas eliminar este ambiente?',
      content: 'Esta acción es irreversible y eliminará todos los diagramas asociados.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        set({ dataLoading: true });
        try {
          const { activeWorkspace } = get();
          if (!activeWorkspace) throw new Error("No hay workspace activo");
          await deleteEnvironmentServiceAPICall(activeWorkspace.id, environmentId);
          message.success("Ambiente eliminado exitosamente.");
          // Refrescar la lista de ambientes
          const updatedEnvs = await getEnvironments(activeWorkspace.id, true);
          set({ environments: updatedEnvs, dataLoading: false });

          if (selectedEnvironment === environmentId) { // Si el ambiente eliminado era el seleccionado
            set({ selectedEnvironment: null, diagrams: [], selectedDiagram: null, currentDiagram: null });
            if (updatedEnvs.length > 0) {
              await handleEnvironmentChange(updatedEnvs[0].id); // Seleccionar el primero de la nueva lista
            }
          } else if (updatedEnvs.length > 0 && !get().selectedEnvironment) {
            // Si no había ninguno seleccionado y ahora hay, seleccionar el primero
             await handleEnvironmentChange(updatedEnvs[0].id);
          }

      } catch (error) {
        console.error('[NavStore] handleEnvironmentChange: Error al cambiar de ambiente:', error);
        set({ dataLoading: false });
        // NO lanzar el error para que el UI no se bloquee
        // throw error;
      }
      },
    });
  },

  handleDeleteDiagram: async (diagramId: string) => {
    const { activeCompany, selectedEnvironment, selectedDiagram, handleDiagramChange, handleEnvironmentChange } = get();
    if (!activeCompany?._id || !selectedEnvironment) {
      message.error("No hay compañía o ambiente activo seleccionado.");
      return;
    }
    Modal.confirm({
      title: '¿Estás seguro de que deseas eliminar este diagrama?',
      content: 'Esta acción es irreversible.',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        set({ dataLoading: true });
        try {
          const { activeWorkspace } = get();
          if (!activeWorkspace) throw new Error("No hay workspace activo");
          await deleteDiagramServiceAPICall(activeWorkspace.id, selectedEnvironment, diagramId);
          message.success("Diagrama eliminado exitosamente.");
          
          // Refrescar la lista de diagramas para el ambiente actual
          const updatedDiagrams = await getDiagramsByEnvironment(activeWorkspace.id, selectedEnvironment, true);
          set({ diagrams: updatedDiagrams, dataLoading: false });

          if (selectedDiagram === diagramId) { // Si el diagrama eliminado era el seleccionado
            set({ selectedDiagram: null, currentDiagram: null });
            if (updatedDiagrams.length > 0) {
              await handleDiagramChange(updatedDiagrams[0].id); // Seleccionar el primero de la nueva lista
            } else {
              // No quedan diagramas, se podría refrescar el ambiente para mostrar el estado vacío
              await handleEnvironmentChange(selectedEnvironment);
            }
          } else if (updatedDiagrams.length > 0 && !get().selectedDiagram) {
            // Si no había ninguno seleccionado y ahora hay, seleccionar el primero
            await handleDiagramChange(updatedDiagrams[0].id);
          }
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          message.error(`Error al eliminar diagrama: ${errorMsg}`);
          set({ dataError: errorMsg, dataLoading: false });
        }
      },
    });
  },

  handleUpdateDiagramPath: async (diagramId: string, newPath: string | null) => {
    const { activeCompany, selectedEnvironment } = get();
    if (!activeCompany?._id || !selectedEnvironment) {
      message.error("No hay compañía o ambiente activo seleccionado para actualizar el diagrama.");
      throw new Error("No hay compañía o ambiente activo seleccionado.");
    }
    set({ dataLoading: true });
    try {
      // El backend espera `null` si el path se elimina (raíz), o una string.
      // Para TypeScript, construimos el payload condicionalmente
      const updatePayload: { path?: string } = {};
      const pathForState: string | undefined = newPath === null ? undefined : (newPath.trim() === '' ? undefined : newPath.trim());
      
      if (newPath === null || newPath.trim() === '') {
        // Si es null o vacío, enviamos un objeto con path explícitamente como any para forzar null
        const { activeWorkspace } = get();
        if (!activeWorkspace) throw new Error("No hay workspace activo");
        await updateDiagramServiceAPICall(activeWorkspace.id, selectedEnvironment, diagramId, { path: undefined });
      } else {
        // Si hay un path válido, lo enviamos normalmente
        const { activeWorkspace } = get();
        if (!activeWorkspace) throw new Error("No hay workspace activo");
        updatePayload.path = newPath.trim();
        await updateDiagramServiceAPICall(activeWorkspace.id, selectedEnvironment, diagramId, updatePayload);
      }
      
      message.success("Diagrama movido exitosamente.");

      // Refrescar la lista de diagramas para el ambiente actual
      const { activeWorkspace } = get();
      if (!activeWorkspace) throw new Error("No hay workspace activo");
      const updatedDiagrams = await getDiagramsByEnvironment(activeWorkspace.id, selectedEnvironment, true);
      
      set(state => ({
        diagrams: updatedDiagrams,
        dataLoading: false,
        // Actualizar el currentDiagram si es el que se movió
        currentDiagram: state.currentDiagram?.id === diagramId 
          ? { ...state.currentDiagram, path: pathForState } 
          : state.currentDiagram
      }));
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      message.error(`Error al mover el diagrama: ${errorMsg}`);
      set({ dataError: errorMsg, dataLoading: false });
      throw error; // Re-lanzar para que el componente que llama pueda manejarlo si es necesario
    }
  },
}));