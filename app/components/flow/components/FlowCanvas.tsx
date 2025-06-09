import React from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Controls,
  BackgroundVariant,
  Panel,
  SelectionMode,
} from 'reactflow';
import {
  SquaresPlusIcon,
  MinusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CustomEdgeData } from '@/app/config/edgeConfig';
import { ResourceCategory, ResourceItem } from '../types/editorTypes';
import { NodeWithExecutionStatus } from '../../../utils/customTypes'; // Para executionActions
// import { useEditorStore } from '../hooks/useEditorStore'; // Para hideContextMenu - Se pasa como prop
import EdgeDeleteButton from './EdgeDeleteButton'; // Ya está en components
import { ResourceSidebar } from './ResourceSidebar'; // Ya está en components

// Type aliases to work around ReactFlow TypeScript namespace issues (consistent with other files in codebase)
type FlowNode = any;
type FlowEdge = any;
type FlowViewport = any;
type FlowNodeTypes = any;
type FlowEdgeTypes = any;
type FlowOnNodesChange = any;
type FlowOnEdgesChange = any;
type FlowOnConnect = any;
type FlowReactFlowInstance = any;

// Tipos que podrían ser necesarios del store o de los hooks, ajustar según sea necesario
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string | null; 
  nodeType?: string | null; // Corregido para aceptar null
  isPane: boolean;
  customItems?: Array<{
    label: string;
    icon?: React.ReactNode; // Corregido para aceptar ReactNode
    onClick: () => void;
  }>;
}

interface AreaDrawingState {
  isDrawingArea: boolean;
  currentAreaRect: { x: number; y: number; width: number; height: number } | null;
  handleMouseDownArea: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleMouseMoveArea: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleMouseUpArea: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

interface FlowCanvasProps {
  initialViewport?: FlowViewport;
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeTypes: FlowNodeTypes;
  edgeTypes?: FlowEdgeTypes;
  onNodesChange: FlowOnNodesChange;
  onEdgesChange: FlowOnEdgesChange;
  onConnect: FlowOnConnect;
  onPaneClick: (event: React.MouseEvent) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: FlowEdge) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: FlowNode) => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onNodeDragStart?: (event: React.MouseEvent, node: FlowNode) => void;
  onNodeDragStop?: (event: React.MouseEvent, node: FlowNode) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragEndSidebar: (event: React.DragEvent) => void; 
  
  reactFlowWrapperRef: React.RefObject<HTMLDivElement | null>; // Corregido para aceptar null
  reactFlowInstance?: FlowReactFlowInstance | null; 

  activeTool: string; 
  areaDrawingActions: AreaDrawingState;
  contextMenu: ContextMenuState;
  selectedEdge: FlowEdge | null;
  onEdgeDelete: (edge: FlowEdge) => void;
  
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  resourceCategories: ResourceCategory[];
  onDragStartSidebar: (event: React.DragEvent, item: ResourceItem) => void;

  // Props para el menú contextual
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contextMenuActions: any; // Idealmente, tipar esto mejor basado en useContextMenuManager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executionActions: any; // Idealmente, tipar esto mejor basado en useExecutionHandler
  hideContextMenu: () => void;
  selectedNodes: FlowNode[]; // Necesario para la lógica del menú contextual
  
  // Prop para manejar cambios en el viewport
  onViewportChange?: () => void;
  
  // Prop para controlar la interactividad
  isInteractive: boolean;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  initialViewport,
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onPaneClick,
  onEdgeClick,
  onNodeContextMenu,
  onPaneContextMenu,
  onNodeDragStart,
  onNodeDragStop,
  onDrop,
  onDragOver,
  onDragEndSidebar,
  reactFlowWrapperRef,
  reactFlowInstance,
  activeTool,
  areaDrawingActions,
  contextMenu,
  selectedEdge,
  onEdgeDelete,
  sidebarOpen,
  setSidebarOpen,
  resourceCategories,
  onDragStartSidebar,
  contextMenuActions,
  executionActions,
  hideContextMenu,
  selectedNodes,
  onViewportChange,
  isInteractive,
}) => {
  // El JSX de ReactFlow y sus hijos irá aquí
  return (
    <div style={{ height: '100%', width: '100%' }} ref={reactFlowWrapperRef}>
      <style>{`
        .react-flow__pane {
          cursor: ${activeTool === 'note' || activeTool === 'text' || activeTool === 'area' || activeTool === 'lasso' ? 'crosshair' : 'default'};
        }
      `}</style>
      <ReactFlow
        defaultViewport={initialViewport || { x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={[]}
        noDragClassName="nodrag"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onMouseDown={areaDrawingActions.handleMouseDownArea}
        onMouseMove={areaDrawingActions.handleMouseMoveArea}
        onMouseUp={areaDrawingActions.handleMouseUpArea}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnd={onDragEndSidebar}
        onMove={onViewportChange}
        elementsSelectable={isInteractive}
        nodesDraggable={isInteractive && activeTool !== 'area'}
        nodesConnectable={isInteractive}
        panOnDrag={isInteractive && activeTool !== 'lasso' && activeTool !== 'area'}
        panOnScroll={isInteractive}
        zoomOnScroll={isInteractive}
        zoomOnPinch={isInteractive}
        zoomOnDoubleClick={isInteractive}
        selectionOnDrag={isInteractive && activeTool === 'lasso'}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Shift']}
        snapToGrid={false}
        nodeDragThreshold={5}
      >
        <Background id="1" gap={10} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.25,backgroundColor:'#E8F5E9'}}/>
        <Background id="2" gap={100} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.25}}/>
        <MiniMap position="bottom-right" style={{bottom:20,right:20}}/>
        
        {areaDrawingActions.isDrawingArea && areaDrawingActions.currentAreaRect && reactFlowInstance && (
          <div
            className="area-drawing-selection-overlay"
            style={{
              position:'absolute',
              pointerEvents:'none',
              zIndex:1000,
              left:`${(areaDrawingActions.currentAreaRect.x * reactFlowInstance.getViewport().zoom) + reactFlowInstance.getViewport().x}px`,
              top:`${(areaDrawingActions.currentAreaRect.y * reactFlowInstance.getViewport().zoom) + reactFlowInstance.getViewport().y}px`,
              width:`${areaDrawingActions.currentAreaRect.width * reactFlowInstance.getViewport().zoom}px`,
              height:`${areaDrawingActions.currentAreaRect.height * reactFlowInstance.getViewport().zoom}px`,
              border:'2px dashed rgba(59, 130, 246, 0.8)',
              backgroundColor:'rgba(59, 130, 246, 0.05)',
              borderRadius:'2px',
              transition:'none'
            }}
          />
        )}

        {contextMenu.visible && reactFlowInstance && (
        <div 
          style={{
            position:'fixed',
            left: contextMenu.x,
            top: (() => {
              // Calcular altura estimada del menú (aproximadamente 40px por item + header)
              const headerHeight = 80;
              const itemHeight = 40;
              const itemCount = contextMenu.customItems?.length || 10; // Estimación por defecto
              const estimatedHeight = headerHeight + (itemCount * itemHeight);
              const windowHeight = window.innerHeight;
              const spaceBelow = windowHeight - contextMenu.y;
              
              // Si no hay suficiente espacio abajo, mostrar el menú hacia arriba
              if (spaceBelow < estimatedHeight + 20) {
                return Math.max(10, contextMenu.y - estimatedHeight);
              }
              return contextMenu.y;
            })(),
            background:'white',
            border:'1px solid #ddd',
            zIndex:1000,
            padding:'0px',
            borderRadius:'8px',
            boxShadow:'0 4px 10px rgba(0,0,0,0.2)',
            display:'flex',
            flexDirection:'column',
            gap:'0px',
            minWidth:'180px',
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            transform:'translate(8px, 8px)'
          }}
          onClick={e=>e.stopPropagation()}
          onContextMenu={e=>e.preventDefault()}
        >
          <div style={{padding:'8px 12px',backgroundColor:'#f7f7f7',borderBottom:'1px solid #eee'}}>
            {!contextMenu.isPane && contextMenu.nodeId && (
              <>
                <p style={{margin:'0 0 2px 0',fontSize:'13px',fontWeight:'bold'}}>{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.label||'Node'}</p>
                <p style={{margin:0,fontSize:'11px',color:'#777'}}>ID: {contextMenu.nodeId}</p>
                <p style={{margin:0,fontSize:'11px',color:'#777'}}>Type: {contextMenu.nodeType} {reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider&&(<span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-xs">{reactFlowInstance.getNode(contextMenu.nodeId!)?.data.provider.toUpperCase()}</span>)}</p>
              </>
            )}
            {contextMenu.isPane && (
              <>
                {(() => {
                  const selN = reactFlowInstance.getNodes().filter((n: any) => n.selected);
                  return selN.length > 0 ? (
                    <p style={{margin:0,fontSize:'13px',fontWeight:'bold'}}>{selN.length} nodos seleccionados</p>
                  ) : (
                    <p style={{margin:0,fontSize:'13px',fontWeight:'bold'}}>Canvas Options</p>
                  );
                })()}
              </>
            )}
          </div>
          <div>
            {!contextMenu.isPane && contextMenu.nodeId && (
              <>
                {(() => {
                  const selN = reactFlowInstance.getNodes().filter((n: any) => n.selected);
                  return selN.length > 1 && selN.some((n: any) => n.id === contextMenu.nodeId);
                })() ? (
                  <>
                    <button onClick={()=>{contextMenuActions.groupSelectedNodes(); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{`📦 Group Selected Nodes (${reactFlowInstance.getNodes().filter((n: any)=>n.selected).length})`}</button>
                    <button onClick={()=>{contextMenuActions.deleteSelectedElements(); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Delete Selected Nodes (${reactFlowInstance.getNodes().filter((n: any)=>n.selected).length})`}</button>
                    <button onClick={()=>{const selN=reactFlowInstance.getNodes().filter((n: any)=>n.selected);if(selN.length>0)contextMenuActions.moveNodesToBack(selN.map((n: any)=>n.id)); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⬇️ Move Selected to Back</button>
                  </>
                ) : reactFlowInstance.getNode(contextMenu.nodeId!)?.type === 'group' ? (
                  <>
                    <button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n)contextMenuActions.startEditingGroupName(n.id,n.data?.label||'Group'); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>✏️ Edit Group Name</button>
                    <button onClick={()=>{if(contextMenu.nodeId)contextMenuActions.ungroupNodes(contextMenu.nodeId); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Ungroup</button>
                    <button onClick={()=>{if(contextMenu.nodeId)contextMenuActions.handleDeleteNodeFromContextMenu(contextMenu.nodeId); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Delete Group</button>
                  </>
                ) : contextMenu.customItems ? null : (
                  <>
                    <button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){executionActions.simulateNodeExecution(n as NodeWithExecutionStatus,'creating').then(()=>executionActions.simulateNodeExecution(n as NodeWithExecutionStatus,'success'));} hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>▶️ Run Node</button>
                    <button onClick={()=>{hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>👁️ Preview</button>
                    <button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){const ev=new CustomEvent('openIaCPanel',{detail:{nodeId:n.id,resourceData:{label:n.data.label,provider:n.data.provider,resourceType:n.data.resourceType}}});window.dispatchEvent(ev);document.dispatchEvent(ev);} hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⚙️ Configuración</button>
                  </>
                )}
              </>
            )}
            {/* Mostrar customItems cuando están disponibles */}
            {contextMenu.customItems && !contextMenu.isPane && (
              <>
                {contextMenu.customItems.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={()=>{item.onClick(); hideContextMenu();}}
                    style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:idx<(contextMenu.customItems?.length||0)-1?'1px solid #eee':'none',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}
                    onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}
                    onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                  >
                    {item.icon}{item.label}
                  </button>
                ))}
              </>
            )}
            {contextMenu.isPane && (
              <>
                {(() => {
                  const selN = reactFlowInstance.getNodes().filter((n: any) => n.selected);
                  return selN.length > 0;
                })() ? (
                  <>
                    <button onClick={()=>{contextMenuActions.groupSelectedNodes(); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>{`📦 Group Selected Nodes (${reactFlowInstance.getNodes().filter((n: any)=>n.selected).length})`}</button>
                    <button onClick={()=>{contextMenuActions.ungroupNodes(); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Ungroup Selected Nodes</button>
                    <button onClick={()=>{contextMenuActions.deleteSelectedElements(); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Delete Selected Nodes (${reactFlowInstance.getNodes().filter((n: any)=>n.selected).length})`}</button>
                    <button onClick={()=>{const selN=reactFlowInstance.getNodes().filter((n: any)=>n.selected);if(selN.length>0)contextMenuActions.moveNodesToBack(selN.map((n: any)=>n.id)); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>⬇️ Move Selected to Back</button>
                  </>
                ) : (
                  <>
                    <button onClick={()=>{ /* groupManagementActions.createEmptyGroup(); */ hideContextMenu(); /* createEmptyGroup vendrá de contextMenuActions o similar */ }} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📦 Create Empty Group</button>
                    <button onClick={()=>{setSidebarOpen(true); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📚 Show Resources Panel</button>
                  </>
                )}
              </>
            )}
            {contextMenu.customItems && (
              <>
                {contextMenu.customItems.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={()=>{item.onClick(); hideContextMenu();}}
                    style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:idx<(contextMenu.customItems?.length||0)-1?'1px solid #eee':'none',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}}
                    onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')}
                    onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                  >
                    {item.icon}{item.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

        {selectedEdge && <EdgeDeleteButton edge={selectedEdge} onEdgeDelete={onEdgeDelete} />}
        
        {!sidebarOpen && (
          <Panel position="top-right">
            <button
              style={{padding:'10px 14px',background:'rgba(255,255,255,0.95)',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',border:'1px solid rgba(0,0,0,0.05)',transition:'background-color 0.2s, box-shadow 0.2s'}}
              onClick={()=>setSidebarOpen(true)}
              onMouseOver={e=>{e.currentTarget.style.backgroundColor='rgba(245,245,245,0.95)';e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,0.15)';}}
              onMouseOut={e=>{e.currentTarget.style.backgroundColor='rgba(255,255,255,0.95)';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';}}
              title="Mostrar Panel de Recursos"
            >
              <SquaresPlusIcon className="h-5 w-5 text-gray-700"/>
              <span style={{fontSize:'14px',fontWeight:500,color:'#333'}}>Recursos</span>
            </button>
          </Panel>
        )}
        <ResourceSidebar
          resourceCategories={resourceCategories}
          onDragStartSidebar={onDragStartSidebar}
        />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
