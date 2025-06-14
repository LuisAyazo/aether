import { create } from 'zustand';
import { message, Modal } from 'antd';
import type { User } from "../services/authService";
import type { Company } from "../services/companyService";
import {
  Environment,
  Diagram,
  Node as DiagramNode,
  Edge as DiagramEdge,
} from "../services/diagramService";
import { Workspace } from '../services/workspaceService';
import { getResourceConfig, SupportedProvider } from '../config/schemas';
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
  updateDiagram as updateDiagramServiceAPICall
} from "../services/diagramService";
import { PERSONAL_SPACE_COMPANY_NAME_PREFIX } from "../services/companyService";
import { dashboardService } from "../services/dashboardService";
import { cacheService, CACHE_KEYS } from "../services/cacheService";

// Tipos de ReactFlow
type FlowEdge = any;
type FlowViewport = { x: number; y: number; zoom: number };

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
  isGeneratingCode: boolean;
  generatedCode: Record<string, string>;
  generatedCodeModalVisible: boolean;
  // Nuevos estados para live preview
  isLivePreviewEnabled: boolean;
  isCodeGenerating: boolean;
  lastCodeGenerationTimestamp: number;
  codeGenerationDebounceTimer: NodeJS.Timeout | null;
  flowChangeListeners: (() => void)[];
  _shouldOpenLivePreviewModal?: boolean; // Temporal para abrir el modal después de cargar
  user: User | null;
  userCompanies: Company[];
  activeCompany: Company | null;
  isPersonalSpace: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  environments: Environment[];
  diagrams: Diagram[];
  selectedEnvironment: string | null;
  selectedDiagram: string | null;
  currentDiagram: Diagram | null;
  dataLoading: boolean;
  dataError: string | null;
  authInitialized: boolean;
  newEnvironmentModalVisible: boolean;
  newEnvironmentName: string;
  newEnvironmentDescription: string;
  newEnvironmentPath: string;
  newDiagramModalVisible: boolean;
  newDiagramName: string;
  newDiagramDescription: string;
  newDiagramPath: string;
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
  generateCodeAndShowModal: () => Promise<void>;
  setGeneratedCodeModalVisible: (visible: boolean) => void;
  // Nuevas acciones para live preview
  setLivePreviewEnabled: (enabled: boolean) => void;
  regenerateCodeDebounced: () => void;
  subscribeToFlowChanges: () => void;
  unsubscribeFromFlowChanges: () => void;
  fetchInitialUser: () => Promise<void>;
  initializeAppLogic: () => Promise<void>;
  setActiveCompanyAndLoadData: (company: Company, isPersonal: boolean) => Promise<void>;
  fetchCurrentWorkspaceEnvironments: () => Promise<void>;
  handleEnvironmentChange: (environmentId: string) => Promise<void>;
  handleDiagramChange: (diagramId: string) => Promise<void>;
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
  handleDeleteEnvironment: (environmentId: string) => Promise<void>;
  handleDeleteDiagram: (diagramId: string) => Promise<void>;
  handleUpdateDiagramPath: (diagramId: string, newPath: string | null) => Promise<void>;
  updateCurrentDiagramInMemory: (data: { nodes: DiagramNode[]; edges: FlowEdge[]; viewport?: FlowViewport }) => void;
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
  isGeneratingCode: false,
  generatedCode: {},
  generatedCodeModalVisible: false,
  // Nuevos estados para live preview
  isLivePreviewEnabled: false,
  isCodeGenerating: false,
  lastCodeGenerationTimestamp: 0,
  codeGenerationDebounceTimer: null,
  flowChangeListeners: [],
  user: null,
  userCompanies: [],
  activeCompany: null,
  isPersonalSpace: false,
  workspaces: [],
  activeWorkspace: null,
  environments: [],
  diagrams: [],
  selectedEnvironment: null,
  selectedDiagram: null,
  currentDiagram: null,
  dataLoading: false,
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
  generateCodeAndShowModal: async () => {
    set({ isGeneratingCode: true, isCodeGenerating: true, generatedCode: {}, generatedCodeModalVisible: true });

    try {
      // Intentar obtener datos frescos con reintentos
      let freshDiagramData;
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          freshDiagramData = await new Promise<{ nodes: DiagramNode[]; edges: FlowEdge[]; viewport?: FlowViewport }>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Timeout: No se recibió la actualización del diagrama."));
            }, 1000); // Aumentar timeout a 1 segundo

            const event = new CustomEvent('forceRequestDiagramData', {
              detail: {
                resolve: (data: { nodes: DiagramNode[]; edges: FlowEdge[]; viewport?: FlowViewport }) => {
                  clearTimeout(timeout);
                  resolve(data);
                },
                reject: (error: Error) => {
                  clearTimeout(timeout);
                  reject(error);
                }
              }
            });
            window.dispatchEvent(event);
          });
          
          // Si obtenemos datos, salir del loop
          if (freshDiagramData && (freshDiagramData.nodes.length > 0 || retries === 1)) {
            break;
          }
        } catch (error) {
          lastError = error;
          retries--;
          if (retries > 0) {
            // Esperar un poco antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      // Usar los datos obtenidos o fallback al estado actual
      let diagramData = freshDiagramData;
      
      if (!diagramData) {
        // Fallback: usar datos del estado actual si están disponibles
        const currentDiagram = get().currentDiagram;
        if (currentDiagram && currentDiagram.nodes) {
          console.warn("Usando datos del diagrama desde el estado (fallback)");
          diagramData = {
            nodes: currentDiagram.nodes,
            edges: currentDiagram.edges || [],
            viewport: currentDiagram.viewport
          };
        } else {
          throw lastError || new Error("No se pudieron obtener los datos del diagrama y no hay datos en el estado");
        }
      }

      get().updateCurrentDiagramInMemory(diagramData);
      
      // Actualizar timestamp de última generación
      set({ lastCodeGenerationTimestamp: Date.now() });
      
      const nodes = diagramData.nodes || [];

      // Detección simple de nodos de recursos
      const utilityTypes = ['areaNode', 'noteNode', 'textNode', 'group'];
      const resourceNodes = nodes.filter((node: any) => {
        const nodeType = node.type || '';
        const isUtility = utilityTypes.includes(nodeType);
        
        if (isUtility || !node.data) return false;
        
        // Un nodo es un recurso si tiene provider válido
        const hasValidProvider = node.data.provider && node.data.provider !== 'generic';
        
        return hasValidProvider;
      });

      if (resourceNodes.length === 0) {
        set({
          isGeneratingCode: false,
          isCodeGenerating: false,
          generatedCode: {
            'terraform-main': '// No hay nodos de recursos para generar código.',
            'pulumi-main': '// No hay nodos de recursos para generar código.',
            'ansible-main': '# No hay nodos de recursos para generar código.',
            'cloudformation-main': '{}',
          },
        });
        return;
      }

      const generateTerraformMain = async () => {
        const providers = [...new Set(resourceNodes.map((n: any) => n.data?.provider))].filter(Boolean);
        let content = `terraform {\n  required_providers {\n${providers.map(p => `    ${p} = {\n      source = "hashicorp/${p}"\n      version = "~> 5.0"\n    }`).join('\n')}\n  }\n}\n\n`;
        content += providers.map(p => `provider "${p}" {\n  # Configuración para ${p}\n  region = "us-east-1" # Cambiar según tu región\n}`).join('\n\n') + '\n\n';

        // Generar recursos con la configuración real
        for (const node of resourceNodes) {
          const resourceName = String(node.data?.label || node.id || 'resource').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const properties = node.data?.dynamicProperties || node.data?.properties || {};
          const hasProperties = Object.keys(properties).length > 0;
          
          content += `# ${node.data?.label || node.id}\n`;
          content += `# Descripción: ${node.data?.description || 'Sin descripción'}\n`;
          content += `resource "${node.type}" "${resourceName}" {\n`;
          
          if (hasProperties) {
            for (const [key, value] of Object.entries(properties)) {
              content += `  ${key} = ${JSON.stringify(value)}\n`;
            }
          } else {
            content += `  # No hay propiedades configuradas\n`;
            content += `  # Haz doble click en el nodo para configurarlo\n`;
            
            // Agregar propiedades mínimas según el tipo de recurso
            if (node.type === 'aws_s3_bucket') {
              content += `  bucket = "${resourceName}-bucket"\n`;
            } else if (node.type === 'aws_redshift_cluster') {
              content += `  cluster_identifier = "${resourceName}"\n`;
              content += `  node_type         = "dc2.large"\n`;
              content += `  master_username   = "admin"\n`;
              content += `  master_password   = "CHANGE_ME" # Cambiar por una contraseña segura\n`;
            } else if (node.type === 'aws_elasticache_cluster') {
              content += `  cluster_id           = "${resourceName}"\n`;
              content += `  engine               = "redis"\n`;
              content += `  node_type            = "cache.t3.micro"\n`;
              content += `  num_cache_nodes      = 1\n`;
            } else if (node.type === 'aws_rds_instance') {
              content += `  identifier     = "${resourceName}"\n`;
              content += `  engine         = "postgres"\n`;
              content += `  engine_version = "15.4"\n`;
              content += `  instance_class = "db.t3.micro"\n`;
              content += `  username       = "admin"\n`;
              content += `  password       = "CHANGE_ME" # Cambiar por una contraseña segura\n`;
            }
          }
          
          content += `}\n\n`;
        }
        
        return content;
      };

      const generatePulumiMain = async () => {
        const providers = [...new Set(resourceNodes.map((n: any) => n.data?.provider))].filter(Boolean);
        let content = `import * as pulumi from "@pulumi/pulumi";\n${providers.map(p => `import * as ${p} from "@pulumi/${p}";`).join('\n')}\n\n`;
        content += `// Configuración del proyecto\n`;
        content += `const config = new pulumi.Config();\n`;
        content += `const environment = config.get("environment") || "dev";\n\n`;
        
        // Generar recursos con la configuración real
        for (const node of resourceNodes) {
          const resourceName = String(node.data?.label || node.id || 'resource').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const resourceClassName = node.type.split('_').slice(1).map((part: string) =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          ).join('');
          const properties = node.data?.dynamicProperties || node.data?.properties || {};
          const hasProperties = Object.keys(properties).length > 0;
          
          content += `// ${node.data?.label || node.id}\n`;
          content += `// ${node.data?.description || 'Sin descripción'}\n`;
          content += `const ${resourceName} = new ${node.data?.provider}.${resourceClassName}("${resourceName}", {\n`;
          
          if (hasProperties) {
            const propEntries = Object.entries(properties);
            for (let i = 0; i < propEntries.length; i++) {
              const [key, value] = propEntries[i];
              content += `  ${key}: ${JSON.stringify(value)}`;
              if (i < propEntries.length - 1) content += ',';
              content += '\n';
            }
          } else {
            content += `  // No hay propiedades configuradas\n`;
            content += `  // Haz doble click en el nodo para configurarlo\n`;
            
            // Agregar propiedades mínimas según el tipo de recurso
            if (node.type === 'aws_s3_bucket') {
              content += `  bucket: "${resourceName}-bucket",\n`;
            } else if (node.type === 'aws_redshift_cluster') {
              content += `  clusterIdentifier: "${resourceName}",\n`;
              content += `  nodeType: "dc2.large",\n`;
              content += `  masterUsername: "admin",\n`;
              content += `  masterPassword: "CHANGE_ME", // Cambiar por una contraseña segura\n`;
            } else if (node.type === 'aws_elasticache_cluster') {
              content += `  clusterId: "${resourceName}",\n`;
              content += `  engine: "redis",\n`;
              content += `  nodeType: "cache.t3.micro",\n`;
              content += `  numCacheNodes: 1,\n`;
            } else if (node.type === 'aws_rds_instance') {
              content += `  identifier: "${resourceName}",\n`;
              content += `  engine: "postgres",\n`;
              content += `  engineVersion: "15.4",\n`;
              content += `  instanceClass: "db.t3.micro",\n`;
              content += `  username: "admin",\n`;
              content += `  password: "CHANGE_ME", // Cambiar por una contraseña segura\n`;
            }
          }
          
          content += `});\n\n`;
        }
        
        // Exportar outputs
        content += `// Exportar outputs\n`;
        for (const node of resourceNodes) {
          const resourceName = String(node.data?.label || node.id || 'resource').toLowerCase().replace(/[^a-z0-9]/g, '_');
          content += `export const ${resourceName}Id = ${resourceName}.id;\n`;
        }
        
        return content;
      };

      const generateAnsiblePlaybook = async () => {
        let content = `---\n- name: InfraUX Infrastructure Playbook\n`;
        content += `  hosts: localhost\n`;
        content += `  connection: local\n`;
        content += `  gather_facts: yes\n\n`;
        content += `  vars:\n`;
        content += `    environment: "{{ env | default('dev') }}"\n`;
        content += `    region: "{{ aws_region | default('us-east-1') }}"\n\n`;
        content += `  tasks:\n`;
        
        // Generar tareas para cada recurso
        for (const node of resourceNodes) {
          const resourceName = String(node.data?.label || node.id || 'resource').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const properties = node.data?.dynamicProperties || node.data?.properties || {};
          
          content += `    # ${node.data?.label || node.id}\n`;
          content += `    # ${node.data?.description || 'Sin descripción'}\n`;
          
          if (node.type === 'aws_s3_bucket') {
            content += `    - name: Create S3 bucket - ${resourceName}\n`;
            content += `      amazon.aws.s3_bucket:\n`;
            content += `        name: "${resourceName}-bucket"\n`;
            content += `        state: present\n`;
            content += `        region: "{{ region }}"\n`;
            if (Object.keys(properties).length > 0) {
              for (const [key, value] of Object.entries(properties)) {
                content += `        ${key}: ${JSON.stringify(value)}\n`;
              }
            }
          } else if (node.type === 'aws_redshift_cluster') {
            content += `    - name: Create Redshift cluster - ${resourceName}\n`;
            content += `      amazon.aws.redshift:\n`;
            content += `        identifier: "${resourceName}"\n`;
            content += `        node_type: "dc2.large"\n`;
            content += `        username: "admin"\n`;
            content += `        password: "{{ redshift_password }}"\n`;
            content += `        state: present\n`;
          } else if (node.type === 'aws_elasticache_cluster') {
            content += `    - name: Create ElastiCache cluster - ${resourceName}\n`;
            content += `      amazon.aws.elasticache:\n`;
            content += `        name: "${resourceName}"\n`;
            content += `        engine: "redis"\n`;
            content += `        node_type: "cache.t3.micro"\n`;
            content += `        num_nodes: 1\n`;
            content += `        state: present\n`;
          } else if (node.type === 'aws_rds_instance') {
            content += `    - name: Create RDS instance - ${resourceName}\n`;
            content += `      amazon.aws.rds_instance:\n`;
            content += `        db_instance_identifier: "${resourceName}"\n`;
            content += `        engine: "postgres"\n`;
            content += `        engine_version: "15.4"\n`;
            content += `        instance_class: "db.t3.micro"\n`;
            content += `        master_username: "admin"\n`;
            content += `        master_user_password: "{{ rds_password }}"\n`;
            content += `        state: present\n`;
          } else {
            content += `    - name: Create resource - ${resourceName}\n`;
            content += `      debug:\n`;
            content += `        msg: "Recurso ${node.type} no tiene plantilla Ansible específica"\n`;
          }
          
          content += `\n`;
        }
        
        return content;
      };

      const generateCloudFormationTemplate = async () => {
        const { currentDiagram } = get();
        const template: any = {
          AWSTemplateFormatVersion: '2010-09-09',
          Description: `InfraUX CloudFormation template for diagram: ${currentDiagram?.name || 'Infrastructure'}`,
          Parameters: {
            Environment: {
              Type: 'String',
              Default: 'dev',
              Description: 'Environment name'
            }
          },
          Resources: {}
        };

        // Generar recursos
        for (const node of resourceNodes) {
          const resourceName = String(node.data?.label || node.id || 'Resource')
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[0-9]/, 'R$&'); // CloudFormation no permite nombres que empiecen con número
          const properties = node.data?.dynamicProperties || node.data?.properties || {};
          
          if (node.type === 'aws_s3_bucket') {
            template.Resources[resourceName] = {
              Type: 'AWS::S3::Bucket',
              Properties: {
                BucketName: { 'Fn::Sub': `${resourceName.toLowerCase()}-\${Environment}-\${AWS::AccountId}` },
                ...properties
              }
            };
          } else if (node.type === 'aws_redshift_cluster') {
            template.Resources[resourceName] = {
              Type: 'AWS::Redshift::Cluster',
              Properties: {
                ClusterIdentifier: { 'Fn::Sub': `${resourceName.toLowerCase()}-\${Environment}` },
                NodeType: 'dc2.large',
                MasterUsername: 'admin',
                MasterUserPassword: { Ref: `${resourceName}Password` },
                ClusterType: 'single-node',
                DBName: 'mydb',
                ...properties
              }
            };
            // Agregar parámetro para la contraseña
            template.Parameters[`${resourceName}Password`] = {
              Type: 'String',
              NoEcho: true,
              Description: `Password for ${resourceName} Redshift cluster`
            };
          } else if (node.type === 'aws_elasticache_cluster') {
            template.Resources[resourceName] = {
              Type: 'AWS::ElastiCache::CacheCluster',
              Properties: {
                CacheNodeType: 'cache.t3.micro',
                Engine: 'redis',
                NumCacheNodes: 1,
                ...properties
              }
            };
          } else if (node.type === 'aws_rds_instance') {
            template.Resources[resourceName] = {
              Type: 'AWS::RDS::DBInstance',
              Properties: {
                DBInstanceIdentifier: { 'Fn::Sub': `${resourceName.toLowerCase()}-\${Environment}` },
                DBInstanceClass: 'db.t3.micro',
                Engine: 'postgres',
                EngineVersion: '15.4',
                MasterUsername: 'admin',
                MasterUserPassword: { Ref: `${resourceName}Password` },
                AllocatedStorage: '20',
                ...properties
              }
            };
            // Agregar parámetro para la contraseña
            template.Parameters[`${resourceName}Password`] = {
              Type: 'String',
              NoEcho: true,
              Description: `Password for ${resourceName} RDS instance`
            };
          }
        }

        // Agregar outputs
        template.Outputs = {};
        for (const node of resourceNodes) {
          const resourceName = String(node.data?.label || node.id || 'Resource')
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[0-9]/, 'R$&');
          
          template.Outputs[`${resourceName}Id`] = {
            Description: `ID of ${node.data?.label || node.id}`,
            Value: { Ref: resourceName }
          };
        }

        return JSON.stringify(template, null, 2);
      };

      const [terraformMain, pulumiMain, ansibleMain, cloudformationMain] = await Promise.all([
        generateTerraformMain(),
        generatePulumiMain(),
        generateAnsiblePlaybook(),
        generateCloudFormationTemplate(),
      ]);

      set({
        generatedCode: {
          'terraform-main': terraformMain,
          'pulumi-main': pulumiMain,
          'ansible-main': ansibleMain,
          'cloudformation-main': cloudformationMain,
        },
        isGeneratingCode: false,
        isCodeGenerating: false,
      });

    } catch (error) {
      console.error("Error al obtener los datos del diagrama:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(errorMessage);
      set({
        generatedCode: {
          'terraform-main': `# Error generando código: ${errorMessage}`,
          'pulumi-main': `// Error generando código: ${errorMessage}`,
          'ansible-main': `# Error generando código: ${errorMessage}`,
          'cloudformation-main': `/* Error generando código: ${errorMessage} */`,
        },
        isGeneratingCode: false,
        isCodeGenerating: false,
        generatedCodeModalVisible: true,
      });
    }
  },
  setGeneratedCodeModalVisible: (visible) => set({ generatedCodeModalVisible: visible }),
  // Nuevas acciones para live preview
  setLivePreviewEnabled: (enabled) => {
    const state = get();
    set({ isLivePreviewEnabled: enabled });
    
    console.log('🔍 DEBUG Store - setLivePreviewEnabled:', {
      enabled,
      activeCompany: state.activeCompany,
      companyId: state.activeCompany?._id || state.activeCompany?.id
    });
    
    // Guardar estado en localStorage
    if (typeof window !== 'undefined') {
      const companyId = state.activeCompany?._id || state.activeCompany?.id;
      if (companyId) {
        const key = `livePreviewEnabled_${companyId}`;
        localStorage.setItem(key, JSON.stringify(enabled));
        console.log('✅ DEBUG Store - Live Preview guardado en localStorage:', {
          key,
          value: enabled,
          allLivePreviewKeys: Object.keys(localStorage).filter(k => k.includes('livePreviewEnabled'))
        });
        
        // Verificar que se guardó correctamente
        try {
          const savedValue = localStorage.getItem(key);
          console.log('🔍 DEBUG Store - Verificación inmediata del Live Preview:', {
            key,
            savedValue,
            parsedValue: savedValue ? JSON.parse(savedValue) : null
          });
        } catch (e) {
          console.error('❌ Error verificando el guardado del Live Preview:', e);
        }
      } else {
        console.log('⚠️ DEBUG Store - No se puede guardar Live Preview: no hay companyId');
      }
      
      // Emitir evento para que otros componentes se enteren
      const event = new CustomEvent('livePreviewStateChanged', {
        detail: { isActive: enabled }
      });
      window.dispatchEvent(event);
      console.log('📢 DEBUG Store - Evento livePreviewStateChanged emitido:', enabled);
      
      // Actualizar atributo en el body para CSS
      if (enabled) {
        document.body.setAttribute('data-live-preview-active', 'true');
      } else {
        document.body.removeAttribute('data-live-preview-active');
      }
    }
    
    if (enabled && state.generatedCodeModalVisible) {
      // Suscribirse a cambios cuando se activa
      get().subscribeToFlowChanges();
    } else {
      // Desuscribirse cuando se desactiva
      get().unsubscribeFromFlowChanges();
    }
  },
  
  regenerateCodeDebounced: () => {
    const state = get();
    
    // Cancelar el timer anterior si existe
    if (state.codeGenerationDebounceTimer) {
      clearTimeout(state.codeGenerationDebounceTimer);
    }
    
    // Crear nuevo timer con debounce de 500ms
    const timer = setTimeout(async () => {
      if (state.isLivePreviewEnabled && state.generatedCodeModalVisible) {
        await get().generateCodeAndShowModal();
      }
    }, 500);
    
    set({ codeGenerationDebounceTimer: timer });
  },
  
  subscribeToFlowChanges: () => {
    const handleFlowChange = () => {
      const state = get();
      if (state.isLivePreviewEnabled && state.generatedCodeModalVisible) {
        get().regenerateCodeDebounced();
      }
    };
    
    // Listeners para cambios en el diagrama
    const listeners = [
      () => window.addEventListener('flowNodesChanged', handleFlowChange),
      () => window.addEventListener('flowEdgesChanged', handleFlowChange),
      () => window.addEventListener('updateNodeData', handleFlowChange),
    ];
    
    // Activar todos los listeners
    listeners.forEach(addListener => addListener());
    
    // Guardar referencias para poder removerlos después
    set({ flowChangeListeners: listeners });
  },
  
  unsubscribeFromFlowChanges: () => {
    const state = get();
    
    // Cancelar cualquier regeneración pendiente
    if (state.codeGenerationDebounceTimer) {
      clearTimeout(state.codeGenerationDebounceTimer);
      set({ codeGenerationDebounceTimer: null });
    }
    
    // Remover listeners
    const handleFlowChange = () => {
      const state = get();
      if (state.isLivePreviewEnabled && state.generatedCodeModalVisible) {
        get().regenerateCodeDebounced();
      }
    };
    
    window.removeEventListener('flowNodesChanged', handleFlowChange);
    window.removeEventListener('flowEdgesChanged', handleFlowChange);
    window.removeEventListener('updateNodeData', handleFlowChange);
    
    set({ flowChangeListeners: [] });
  },
  fetchInitialUser: async () => {
    const state = get();
    if (state.authInitialized) {
      return;
    }
    if (state.dataLoading) {
      return;
    }
    set({ dataLoading: true });
    try {
      let currentUser = getCurrentUser();
      if (!currentUser) {
        const { getCurrentUserAsync } = await import('../services/authService');
        currentUser = await getCurrentUserAsync();
      }
      set({ user: currentUser });
      if (currentUser) {
        await get().initializeAppLogic();
      }
    } catch (error) {
      console.error('[NavStore] fetchInitialUser: Error:', error);
      set({ dataError: 'Error al obtener usuario' });
    } finally {
      set({ authInitialized: true, dataLoading: false });
    }
  },
  initializeAppLogic: async () => {
    const state = get();
    const user = state.user;
    if (!user?._id) {
      console.error('[NavStore] initializeAppLogic: Aborting, no user in store.');
      set({ dataLoading: false, dataError: "No se pudo inicializar: Usuario no encontrado." });
      return;
    }
    set({ dataLoading: true, dataError: null });
    try {
      const dashboardData = await dashboardService.getInitialDashboardData();
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
        
        // Verificar si el Live Preview estaba activo para esta compañía
        if (typeof window !== 'undefined' && companyToSelect) {
          const companyId = companyToSelect._id || companyToSelect.id;
          const livePreviewKey = `livePreviewEnabled_${companyId}`;
          const savedLivePreviewState = localStorage.getItem(livePreviewKey);
          
          console.log('🔍 DEBUG Store - Verificando Live Preview en initializeAppLogic:', {
            companyId,
            livePreviewKey,
            savedValue: savedLivePreviewState,
            currentDiagram: get().currentDiagram?.id
          });
          
          if (savedLivePreviewState !== null) {
            try {
              const isEnabled = JSON.parse(savedLivePreviewState);
              if (isEnabled && get().currentDiagram) {
                console.log('🚀 DEBUG Store - Live Preview estaba activo, abriendo modal automáticamente...');
                // Esperar un poco para asegurar que todo esté cargado
                setTimeout(() => {
                  get().generateCodeAndShowModal();
                }, 1000);
              }
            } catch (e) {
              console.error('❌ Error verificando Live Preview en initializeAppLogic:', e);
            }
          }
        }
      } else {
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
      set({ dataLoading: false });
    }
  },
  setActiveCompanyAndLoadData: async (company, isPersonal) => {
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
    
    // Cargar el estado del Live Preview para la nueva compañía
    if (typeof window !== 'undefined') {
      const companyId = company?._id || company?.id;
      if (companyId) {
        const livePreviewKey = `livePreviewEnabled_${companyId}`;
        const savedLivePreviewState = localStorage.getItem(livePreviewKey);
        
        console.log('🔍 DEBUG Store - Cargando Live Preview para nueva compañía:', {
          companyId,
          livePreviewKey,
          savedValue: savedLivePreviewState,
          parsedValue: savedLivePreviewState ? JSON.parse(savedLivePreviewState) : null
        });
        
        if (savedLivePreviewState !== null) {
          try {
            const isEnabled = JSON.parse(savedLivePreviewState);
            set({ isLivePreviewEnabled: isEnabled });
            console.log('✅ DEBUG Store - Live Preview cargado para compañía:', isEnabled);
            
            // Si el Live Preview estaba activo, programar la apertura del modal
            if (isEnabled) {
              console.log('📋 DEBUG Store - Live Preview estaba activo, programando apertura del modal...');
              // Guardar en una variable temporal para abrir el modal después
              set({ _shouldOpenLivePreviewModal: true });
            }
          } catch (e) {
            console.error('❌ Error cargando Live Preview para compañía:', e);
          }
        }
      }
    }
    
    try {
      const { workspaces } = get();
      const companyWorkspaces = workspaces.filter(w => w.company_id === company.id);
      const activeWorkspace = companyWorkspaces.find(w => w.is_default) || companyWorkspaces[0] || null;
      if (activeWorkspace) {
        set({ activeWorkspace });
        await get().fetchCurrentWorkspaceEnvironments();
        
        // Después de cargar los ambientes y diagramas, verificar si debemos abrir el Live Preview
        const state = get();
        if (state._shouldOpenLivePreviewModal && state.currentDiagram) {
          console.log('🚀 DEBUG Store - Abriendo modal de Live Preview automáticamente...');
          // Esperar un poco para asegurar que todo esté cargado
          setTimeout(() => {
            get().generateCodeAndShowModal();
            set({ _shouldOpenLivePreviewModal: false });
          }, 500);
        }
      } else {
        set({ workspaces: [], activeWorkspace: null, environments: [], dataLoading: false });
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      message.error("Error cargando datos de la compañía: " + errorMsg);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },
  fetchCurrentWorkspaceEnvironments: async () => {
    const { activeWorkspace } = get();
    if (!activeWorkspace) {
      return;
    }
    set({ dataLoading: true });
    try {
      const envs = await getEnvironments(activeWorkspace.id, true);
      set({ environments: envs, dataLoading: false, dataError: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },
  handleEnvironmentChange: async (environmentId) => {
    const { activeCompany } = get();
    if (!activeCompany) { 
      set({dataLoading: false}); return; 
    } 
    set({ selectedEnvironment: environmentId, dataLoading: true, diagrams: [], selectedDiagram: null, currentDiagram: null });
    try {
      const { activeWorkspace } = get();
      if (!activeWorkspace) {
        set({dataLoading: false}); return;
      }
      const diags = await getDiagramsByEnvironment(activeWorkspace.id, environmentId);
      set({ diagrams: diags });
      if (diags.length > 0) {
        const defaultDiagId = diags[0].id;
        await get().handleDiagramChange(defaultDiagId); 
      } else {
        set({ dataLoading: false }); 
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      message.error("Error al cambiar de ambiente: " + errorMsg);
      set({ dataError: errorMsg, dataLoading: false });
    }
  },
  handleDiagramChange: async (diagramId) => {
    const { activeCompany, selectedEnvironment, selectedDiagram, currentDiagram } = get();
    if (!activeCompany || !selectedEnvironment) { 
      set({dataLoading: false}); return; 
    }
    if (selectedDiagram && selectedDiagram !== diagramId && currentDiagram) {
      window.dispatchEvent(new CustomEvent('forceSaveCurrentDiagram'));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    set({ selectedDiagram: diagramId, dataLoading: true });
    try {
      const { activeWorkspace } = get();
      if (!activeWorkspace) {
        set({dataLoading: false}); return;
      }
      const diagramData = await getDiagram(activeWorkspace.id, selectedEnvironment, diagramId);
      set({ currentDiagram: diagramData, dataLoading: false });
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
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
        path: newEnvironmentPath.trim() || undefined,
      };
      const createdEnv = await createEnvironmentServiceAPICall(activeWorkspace.id, environmentPayload);
      message.success(`Ambiente "${createdEnv.name}" creado exitosamente.`);
      const updatedEnvs = await getEnvironments(activeWorkspace.id, true);
      set({
        environments: updatedEnvs,
        newEnvironmentName: '', 
        newEnvironmentDescription: '', 
        newEnvironmentPath: '', 
        newEnvironmentModalVisible: false, 
        dataLoading: false 
      });
      if (updatedEnvs.length === 1 || (createdEnv && !get().selectedEnvironment)) {
        await get().handleEnvironmentChange(createdEnv.id);
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
        viewport: {x:0, y:0, zoom:1}
      });
      message.success("Diagrama creado.");
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
          const updatedEnvs = await getEnvironments(activeWorkspace.id, true);
          set({ environments: updatedEnvs, dataLoading: false });
          if (selectedEnvironment === environmentId) {
            set({ selectedEnvironment: null, diagrams: [], selectedDiagram: null, currentDiagram: null });
            if (updatedEnvs.length > 0) {
              await handleEnvironmentChange(updatedEnvs[0].id);
            }
          } else if (updatedEnvs.length > 0 && !get().selectedEnvironment) {
             await handleEnvironmentChange(updatedEnvs[0].id);
          }
      } catch (error) {
        console.error('[NavStore] handleEnvironmentChange: Error al cambiar de ambiente:', error);
        set({ dataLoading: false });
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
          const updatedDiagrams = await getDiagramsByEnvironment(activeWorkspace.id, selectedEnvironment, true);
          set({ diagrams: updatedDiagrams, dataLoading: false });
          if (selectedDiagram === diagramId) {
            set({ selectedDiagram: null, currentDiagram: null });
            if (updatedDiagrams.length > 0) {
              await handleDiagramChange(updatedDiagrams[0].id);
            } else {
              await handleEnvironmentChange(selectedEnvironment);
            }
          } else if (updatedDiagrams.length > 0 && !get().selectedDiagram) {
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
      const updatePayload: { path?: string } = {};
      const pathForState: string | undefined = newPath === null ? undefined : (newPath.trim() === '' ? undefined : newPath.trim());
      if (newPath === null || newPath.trim() === '') {
        const { activeWorkspace } = get();
        if (!activeWorkspace) throw new Error("No hay workspace activo");
        await updateDiagramServiceAPICall(activeWorkspace.id, selectedEnvironment, diagramId, { path: undefined });
      } else {
        const { activeWorkspace } = get();
        if (!activeWorkspace) throw new Error("No hay workspace activo");
        updatePayload.path = newPath.trim();
        await updateDiagramServiceAPICall(activeWorkspace.id, selectedEnvironment, diagramId, updatePayload);
      }
      message.success("Diagrama movido exitosamente.");
      const { activeWorkspace } = get();
      if (!activeWorkspace) throw new Error("No hay workspace activo");
      const updatedDiagrams = await getDiagramsByEnvironment(activeWorkspace.id, selectedEnvironment, true);
      set(state => ({
        diagrams: updatedDiagrams,
        dataLoading: false,
        currentDiagram: state.currentDiagram?.id === diagramId 
          ? { ...state.currentDiagram, path: pathForState } 
          : state.currentDiagram
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      message.error(`Error al mover el diagrama: ${errorMsg}`);
      set({ dataError: errorMsg, dataLoading: false });
      throw error;
    }
  },
  updateCurrentDiagramInMemory: (data) => {
    set(state => {
      if (!state.currentDiagram) {
        console.warn("[Store] updateCurrentDiagramInMemory: No hay diagrama actual para actualizar.");
        return {};
      }
      const newViewport = data.viewport && typeof data.viewport.x === 'number'
                        ? data.viewport
                        : state.currentDiagram.viewport;
      return {
        currentDiagram: {
          ...state.currentDiagram,
          nodes: data.nodes,
          edges: data.edges,
          viewport: newViewport,
        }
      };
    });
    console.log('[Store] updateCurrentDiagramInMemory: Diagrama actualizado en memoria.');
  },
}));