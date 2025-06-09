import * as ReactFlowLibrary from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback, useEffect, useRef, useState, useMemo, JSX } from 'react';
import { 
  ShareIcon, 
  BoltIcon as HeroBoltIcon, 
  PencilSquareIcon as HeroPencilSquareIcon,
  LinkIcon as HeroLinkIcon,
  PhoneArrowUpRightIcon as HeroPhoneArrowUpRightIcon,
  // SquaresPlusIcon, // Ya no se usa aquí, está en FlowCanvas
  // MinusCircleIcon, // Movido a FlowCanvas
  // TrashIcon, // Movido a FlowCanvas
} from '@heroicons/react/24/outline';
import React from 'react';
import { SelectedEdgeTypeProvider } from '@/app/contexts/SelectedEdgeTypeContext'; 
import { LogicalEdgeType, edgeTypeConfigs, CustomEdgeData } from '@/app/config/edgeConfig'; 
import nodeTypesFromFile from '../nodes/NodeTypes'; 
// import { NodeWithExecutionStatus } from '../../utils/customTypes'; // Movido a FlowCanvas
import ExecutionLog from './ExecutionLog';
import GroupFocusView from './GroupFocusView'; 

import { 
  FlowEditorProps, 
  ResourceCategory as EditorResourceCategory,
  ResourceItem as EditorResourceItem,
} from './types/editorTypes';
import { useFlowState } from './hooks/useFlowState';
import { useEditorStore } from './hooks/useEditorStore';
// import { shallow } from 'zustand/shallow'; // Se eliminará shallow, usando selectores individuales
import { useFlowInteractions } from './hooks/useFlowInteractions';
import { useSidebarInteractions } from './hooks/useSidebarInteractions';
import { useGroupViewControls } from './hooks/useGroupViewControls';
import { useContextMenuManager } from './hooks/useContextMenuManager';
import { useGroupManagement } from './hooks/useGroupManagement'; 
import { useToolbarHandler } from './hooks/useToolbarHandler'; 
import { useExecutionHandler } from './hooks/useExecutionHandler'; 
import { useSaveHandler } from './hooks/useSaveHandler'; 
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAreaDrawing } from './hooks/useAreaDrawing'; // Importar useAreaDrawing
import { Toolbar } from './components/Toolbar';
// import { ResourceSidebar } from './components/ResourceSidebar'; // Movido a FlowCanvas
import { EditGroupModal } from './components/EditGroupModal';
// import EdgeDeleteButton from './components/EdgeDeleteButton'; // Movido a FlowCanvas
import FlowCanvas from './components/FlowCanvas';
import { Modal, Tag, Divider } from 'antd';


const { 
  // Background, // Movido a FlowCanvas
  // Controls, // Movido a FlowCanvas
  // Panel, // Movido a FlowCanvas
  // ReactFlow, // Movido a FlowCanvas
  ReactFlowProvider, 
  useOnSelectionChange,
  useReactFlow,
  // MiniMap, // Movido a FlowCanvas
  // BackgroundVariant, // Movido a FlowCanvas
  // SelectionMode, // Movido a FlowCanvas
} = ReactFlowLibrary;

// Tipos temporales mientras resolvemos el problema con los tipos de reactflow
type FlowNode = any;
type FlowEdge = any;
type FlowViewport = any;
type FlowNodeTypes = any;
type FlowNodeChange = any;
type FlowEdgeChange = any;
type FlowConnection = any;
type FlowXYPosition = any;

// Definir los tipos personalizados
type CustomEdge = FlowEdge & { data: CustomEdgeData };

const FlowEditorContent = ({ 
  initialNodes = [], 
  initialEdges = [],
  initialViewport,
  onConnectProp, 
  onSave,
  nodeTypes: externalNodeTypes = {}, 
  edgeTypes,
  resourceCategories = [],
  initialExpandedGroupId,
  onGroupExpandedChange,
}: FlowEditorProps): JSX.Element => {
  
  const memoizedNodeTypes = useMemo(() => {
    const baseTypes = { ...nodeTypesFromFile };
    const externalTypes = { ...externalNodeTypes };
    return Object.freeze({
      ...baseTypes,
      ...externalTypes,
      note: baseTypes.noteNode,
      text: baseTypes.textNode
    });
  }, [externalNodeTypes]);

  const memoizedEdgeTypes = useMemo(() => Object.freeze(edgeTypes || {}), [edgeTypes]);

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  
  const {
    nodes,
    setNodes,
    onNodesChange: onNodesChangeInternal,
    edges,
    setEdges,
    onEdgesChange: onEdgesChangeInternal,
  } = useFlowState({ initialNodes, initialEdges: initialEdges as CustomEdge[] });

  // Memoizar las funciones de manejo de estado para evitar recreaciones
  const handleNodeChange = useCallback((changes: FlowNodeChange[]) => {
    onNodesChangeInternal(changes);
  }, [onNodesChangeInternal]);

  const handleEdgeChange = useCallback((changes: FlowEdgeChange[]) => {
    onEdgesChangeInternal(changes);
  }, [onEdgesChangeInternal]);

  const handleConnect = useCallback((params: FlowConnection) => {
    onConnectProp?.(params);
  }, [onConnectProp]);

  // Seleccionar cada pieza del estado individualmente usando useCallback para evitar recreaciones
  const sidebarOpen = useEditorStore(useCallback(state => state.sidebarOpen, []));
  const setSidebarOpen = useEditorStore(useCallback(state => state.setSidebarOpen, []));
  const activeTool = useEditorStore(useCallback(state => state.activeTool, []));
  const setActiveTool = useEditorStore(useCallback(state => state.setActiveTool, [])); // Obtener setActiveTool
  const contextMenu = useEditorStore(useCallback(state => state.contextMenu, []));
  const selectedEdge = useEditorStore(useCallback(state => state.selectedEdge, []));
  const setSelectedEdge = useEditorStore(useCallback(state => state.setSelectedEdge, []));
  const expandedGroupId = useEditorStore(useCallback(state => state.expandedGroupId, []));
  const editingGroup = useEditorStore(useCallback(state => state.editingGroup, []));
  const setEditingGroup = useEditorStore(useCallback(state => state.setEditingGroup, []));
  const hideContextMenuFromStore = useEditorStore(useCallback(state => state.hideContextMenu, []));
  
  const [activeDrag, setActiveDrag] = useState<{ item: EditorResourceItem, offset: { x: number, y: number }, elementSize?: { width: number, height: number } } | null>(null);
  const [, setFocusedNodeId] = useState<string | null>(null); 
  const [selectedNodes, setSelectedNodes] = useState<FlowNode[]>([]); 
  
  const findGroupAtPosition = useCallback((pos:{x:number,y:number})=>reactFlowInstance.getNodes().find((n: FlowNode)=>n.type==='group'&&!n.data?.isMinimized&&pos.x>=n.position.x&&pos.x<=n.position.x+(n.width||300)&&pos.y>=n.position.y&&pos.y<=n.position.y+(n.height||200)),[reactFlowInstance]);
  
  const lastViewportRef = useRef<FlowViewport | null>(null);
  
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false); 
  const [singleNodePreviewVisible, setSingleNodePreviewVisible] = useState(false);
  const [singleNodePreviewData, setSingleNodePreviewData] = useState<any>(null);
  const viewportChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isInteractive, setIsInteractive] = useState(true);

  const contextMenuActions = useContextMenuManager({ selectedNodes, setSelectedNodes });
  const groupManagementActions = useGroupManagement({ lastViewportRef });
  const toolbarActions = useToolbarHandler();
  const executionActions = useExecutionHandler({ setExecutionLogs });
  const saveActions = useSaveHandler({ nodes, edges, onSave, expandedGroupId });
  
  // Manejar cambios en el viewport
  const handleViewportChange = useCallback(() => {
    if (!expandedGroupId && reactFlowInstance) {
      // Cancelar el timeout anterior si existe
      if (viewportChangeTimeoutRef.current) {
        clearTimeout(viewportChangeTimeoutRef.current);
      }
      
      // Establecer un nuevo timeout para guardar después de 1 segundo
      viewportChangeTimeoutRef.current = setTimeout(() => {
        saveActions.saveCurrentDiagramState();
      }, 1000);
    }
  }, [expandedGroupId, reactFlowInstance, saveActions]);
  
  // Limpiar el timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (viewportChangeTimeoutRef.current) {
        clearTimeout(viewportChangeTimeoutRef.current);
      }
    };
  }, []);
  useKeyboardShortcuts({ 
    handleToolClick: toolbarActions.handleToolClick, 
    createEmptyGroup: groupManagementActions.createEmptyGroup 
  });
  const areaDrawingActions = useAreaDrawing({ setNodes, activeTool, setActiveTool }); // Pasar setActiveTool


  const {
    onDragStartSidebar,
  } = useSidebarInteractions({ setActiveDrag });

  const {
    handleGroupSave,
  } = useGroupViewControls({ setNodes, setEdges });
  
  const {
    onConnectInternal,
    handlePaneClick,
    onEdgeClick,
    handleNodeContextMenu,
    handlePaneContextMenu,
    onNodeDragStart,
    onNodeDragStop,
    onDrop,
    onDragOver,
    onDragEndSidebar,
  } = useFlowInteractions({
    nodes, 
    setNodes, 
    setEdges, 
    onConnectProp,
    reactFlowWrapperRef,
    activeDrag,
    setActiveDrag,
    findGroupAtPosition, 
    handleExpandGroupView: groupManagementActions.handleExpandGroupView, 
  });
  
  const onEdgeDelete = useCallback((edgeToDelete: CustomEdge) => { onEdgesChangeInternal([{ id: edgeToDelete.id, type: 'remove' }]); setSelectedEdge(null); }, [onEdgesChangeInternal, setSelectedEdge]);

  useEffect(() => {
    const areaUpdate = (e: Event) => { 
      const {nodeId,data} = (e as CustomEvent).detail; 
      reactFlowInstance.setNodes((ns: FlowNode[]) => ns.map((n: FlowNode) => n.id === nodeId ? {...n, data:{...n.data, ...data}} : n)); 
    };
    window.addEventListener('updateAreaNode', areaUpdate as EventListener);
    return () => { 
      window.removeEventListener('updateAreaNode', areaUpdate as EventListener); 
    };
  }, [reactFlowInstance]);
  
  useOnSelectionChange({onChange:({nodes:sel}: {nodes: FlowNode[]})=>setSelectedNodes(sel)});
  useEffect(()=>{ const focus=(e:Event)=>{const{nodeId,isFocused}=(e as CustomEvent).detail;setFocusedNodeId(isFocused?nodeId:null);}; window.addEventListener('nodeGroupFocus',focus as EventListener); return()=>window.removeEventListener('nodeGroupFocus',focus as EventListener); },[]);
  
  useEffect(() => {
    if (expandedGroupId || !reactFlowInstance) return;
    const lastViewport = lastViewportRef.current;
    if (!lastViewport) return;
    const currentViewport = reactFlowInstance.getViewport();
    if (lastViewport.zoom !== 0 && 
        (Math.abs(currentViewport.x - lastViewport.x) > 0.01 ||
         Math.abs(currentViewport.y - lastViewport.y) > 0.01 ||
         Math.abs(currentViewport.zoom - lastViewport.zoom) > 0.001)) {
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.setViewport(lastViewport);
        }
      }, 50);
    }
  }, [expandedGroupId, reactFlowInstance]);

  const handleCollapseGroup = useCallback((groupId: string) => {
    groupManagementActions.handleCollapseGroupView(groupId);
    onGroupExpandedChange?.(null);
  }, [groupManagementActions, onGroupExpandedChange]);

  // Expandir grupo inicial si está especificado
  useEffect(() => {
    if (initialExpandedGroupId && nodes.length > 0) {
      const groupExists = nodes.some((n: FlowNode) => n.id === initialExpandedGroupId && n.type === 'group');
      if (groupExists) {
        groupManagementActions.handleExpandGroupView(initialExpandedGroupId);
        onGroupExpandedChange?.(initialExpandedGroupId);
      }
    }
  }, [initialExpandedGroupId, nodes.length]); // Solo ejecutar cuando cambie initialExpandedGroupId o cuando se carguen los nodos

  useEffect(() => {
    const expandHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId: string }>;
      if (customEvent.detail?.groupId) {
        groupManagementActions.handleExpandGroupView(customEvent.detail.groupId);
        onGroupExpandedChange?.(customEvent.detail.groupId);
      }
    };
    const collapseHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId: string }>;
      if (customEvent.detail?.groupId) {
        handleCollapseGroup(customEvent.detail.groupId);
      }
    };

    window.addEventListener('expandGroupView', expandHandler);
    window.addEventListener('collapseGroupView', collapseHandler);
    return () => {
      window.removeEventListener('expandGroupView', expandHandler);
      window.removeEventListener('collapseGroupView', collapseHandler);
    };
  }, [groupManagementActions.handleExpandGroupView, handleCollapseGroup, onGroupExpandedChange]);
  
  useEffect(() => {
    const handleShowSingleNodePreview = (event: Event) => {
      const customEvent = event as CustomEvent;
      const previewData = customEvent.detail;
      
      setSingleNodePreviewData(previewData);
      setSingleNodePreviewVisible(true);
    };
    
    window.addEventListener('showSingleNodePreview', handleShowSingleNodePreview);
    return () => window.removeEventListener('showSingleNodePreview', handleShowSingleNodePreview);
  }, []);

  const edgeToolbarIcons: Record<LogicalEdgeType, React.ElementType> = {
    [LogicalEdgeType.DEPENDS_ON]: ShareIcon,
    [LogicalEdgeType.CALLS]: HeroPhoneArrowUpRightIcon,
    [LogicalEdgeType.TRIGGERS]: HeroBoltIcon,
    [LogicalEdgeType.WRITES_TO]: HeroPencilSquareIcon,
    [LogicalEdgeType.CONNECTS_TO]: HeroLinkIcon,
  };

  if (expandedGroupId) {
    return (
      <GroupFocusView
        focusedGroupId={expandedGroupId}
        allNodes={nodes}
        allEdges={edges}
        onClose={() => {
          if (expandedGroupId) { 
            handleCollapseGroup(expandedGroupId);
          }
        }}
        onSaveChanges={handleGroupSave}
        mainNodeTypes={memoizedNodeTypes}
        mainEdgeTypes={memoizedEdgeTypes} 
        initialViewport={nodes.find((n: FlowNode) => n.id === expandedGroupId)?.data?.viewport}
        edgeTypeConfigs={edgeTypeConfigs} 
        edgeToolbarIcons={edgeToolbarIcons} 
        resourceCategories={resourceCategories as EditorResourceCategory[]} 
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <EditGroupModal 
        editingGroup={editingGroup}
        onSaveGroupName={contextMenuActions.saveGroupName}
        onClose={() => setEditingGroup(null)}
      />
      <Toolbar 
        onSaveDiagram={saveActions.saveCurrentDiagramState}
        onCreateEmptyGroup={() => groupManagementActions.createEmptyGroup()} 
        onToolClick={toolbarActions.handleToolClick}
        isInteractive={isInteractive}
        setIsInteractive={setIsInteractive}
      />
      <FlowCanvas
        initialViewport={initialViewport}
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnectInternal}
        onPaneClick={handlePaneClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEndSidebar={onDragEndSidebar}
        reactFlowWrapperRef={reactFlowWrapperRef}
        reactFlowInstance={reactFlowInstance}
        activeTool={activeTool}
        areaDrawingActions={areaDrawingActions}
        contextMenu={contextMenu}
        selectedEdge={selectedEdge}
        onEdgeDelete={onEdgeDelete}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        resourceCategories={resourceCategories as EditorResourceCategory[]}
        onDragStartSidebar={onDragStartSidebar}
        contextMenuActions={contextMenuActions}
        executionActions={executionActions}
        hideContextMenu={hideContextMenuFromStore}
        selectedNodes={selectedNodes}
        onViewportChange={handleViewportChange}
        isInteractive={isInteractive}
      />
      <div className={`fixed inset-y-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${showLogs ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: '480px' }}>
        <ExecutionLog isVisible={showLogs} logs={executionLogs} onClose={() => setShowLogs(false)} />
      </div>
      
      {/* Modal de Preview para Nodo Individual */}
      <Modal
        title={`Vista Previa de Cambios: ${singleNodePreviewData?.resource?.name || 'Recurso'}`}
        open={singleNodePreviewVisible}
        onCancel={() => setSingleNodePreviewVisible(false)}
        footer={[
          <button
            key="cancel"
            onClick={() => setSingleNodePreviewVisible(false)}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>,
          <button
            key="apply"
            onClick={() => {
              setSingleNodePreviewVisible(false);
              // Simular ejecución con logs
              const mockLogs = [
                'Iniciando proceso de aplicación de cambios...',
                'Validando configuración...',
                'Creando recursos...',
                'Configurando dependencias...',
                'Aplicando cambios de red...',
                'Actualizando permisos...',
                'Verificando estado...',
                'Finalizando proceso...',
                'Cambios aplicados exitosamente',
                'Proceso completado'
              ];
              setExecutionLogs(mockLogs);
              setShowLogs(true);
            }}
            className="px-4 py-2 ml-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Aplicar
          </button>
        ]}
        width={800}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        {singleNodePreviewData && (
          <div className="space-y-4">
            {/* Información del Recurso Principal */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Recurso Principal</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Nombre:</strong> {singleNodePreviewData.resource.name}</p>
                <p><strong>Tipo:</strong> {singleNodePreviewData.resource.type}</p>
                <p><strong>Proveedor:</strong> {singleNodePreviewData.resource.provider}</p>
                <p><strong>Acción:</strong> <Tag color={singleNodePreviewData.action === 'create' ? 'green' : singleNodePreviewData.action === 'update' ? 'blue' : 'red'}>{singleNodePreviewData.action.toUpperCase()}</Tag></p>
              </div>
            </div>

            {/* Cambios en Propiedades */}
            {singleNodePreviewData.resource.changes?.properties && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Cambios en Propiedades</h3>
                <div className="space-y-2">
                  {Object.entries(singleNodePreviewData.resource.changes.properties).map(([key, change]: [string, any]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{key}:</p>
                      <div className="ml-4 text-sm">
                        {change.action === 'create' && (
                          <p className="text-green-600">+ {change.after}</p>
                        )}
                        {change.action === 'update' && (
                          <>
                            <p className="text-red-600 line-through">- {change.before}</p>
                            <p className="text-green-600">+ {change.after}</p>
                          </>
                        )}
                        {change.action === 'delete' && (
                          <p className="text-red-600 line-through">- {change.before}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Divider />

            {/* Dependencias */}
            {singleNodePreviewData.dependencies && singleNodePreviewData.dependencies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Recursos Dependientes ({singleNodePreviewData.dependencies.length})</h3>
                <div className="space-y-2">
                  {singleNodePreviewData.dependencies.map((dep: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dep.name}</p>
                          <p className="text-sm text-gray-600">Tipo: {dep.type}</p>
                        </div>
                        <Tag color={dep.action === 'create' ? 'green' : dep.action === 'update' ? 'blue' : 'red'}>
                          {dep.action.toUpperCase()}
                        </Tag>
                      </div>
                      {dep.properties && Object.keys(dep.properties).length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-500">Propiedades modificadas: {Object.keys(dep.properties).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const FlowEditor: React.FC<FlowEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <SelectedEdgeTypeProvider>
        <FlowEditorContent {...props} />
      </SelectedEdgeTypeProvider>
    </ReactFlowProvider>
  );
};

export default FlowEditor;
