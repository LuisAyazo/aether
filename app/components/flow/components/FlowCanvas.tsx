import React, { useEffect } from 'react';
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
import { CustomEdgeData } from "../../../config/edgeConfig";
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
  onViewportChange?: (viewport: FlowViewport) => void;
  
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
  // Estado local para manejar el viewport y si ya se aplicó el inicial
  const [viewport, setViewport] = React.useState(initialViewport || { x: 0, y: 0, zoom: 1 });
  const [hasAppliedInitialViewport, setHasAppliedInitialViewport] = React.useState(false);
  
  // Aplicar el viewport inicial solo una vez cuando ReactFlow esté listo
  React.useEffect(() => {
    if (initialViewport && reactFlowInstance && !hasAppliedInitialViewport &&
        typeof initialViewport.x === 'number' && 
        typeof initialViewport.y === 'number' && 
        typeof initialViewport.zoom === 'number') {
      console.log('[FlowCanvas] Applying initial viewport:', initialViewport);
      
      // Aplicar inmediatamente y marcar como aplicado
      reactFlowInstance.setViewport(initialViewport, { duration: 0 });
      setHasAppliedInitialViewport(true);
    }
  }, [initialViewport, reactFlowInstance, hasAppliedInitialViewport]);
  
  // Reset del flag cuando cambia el initialViewport (cambio de diagrama)
  React.useEffect(() => {
    setHasAppliedInitialViewport(false);
  }, [initialViewport?.x, initialViewport?.y, initialViewport?.zoom]);
  
  // Manejar cambios en el viewport
  const handleViewportChange = React.useCallback((event: any, newViewport: FlowViewport) => {
    // onMove pasa el evento como primer parámetro y el viewport como segundo
    setViewport(newViewport);
    // Siempre propagar el cambio hacia arriba
    onViewportChange?.(newViewport);
  }, [onViewportChange]);
  // Agregar listener para el rectángulo de selección
  useEffect(() => {
    const handleSelectionRectContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Si el click es en el rectángulo de selección
      if (target.classList.contains('react-flow__nodesselection-rect')) {
        console.log('[FlowCanvas] Context menu on selection rect');
        e.preventDefault();
        e.stopPropagation();
        
        // Llamar directamente a onPaneContextMenu con el evento sintético
        const syntheticEvent = {
          ...e,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation(),
          clientX: e.clientX,
          clientY: e.clientY,
          target: e.target,
        } as unknown as React.MouseEvent;
        
        onPaneContextMenu?.(syntheticEvent);
      }
    };
    
    // Escuchar el evento personalizado showMultipleSelectionMenu
    const handleShowMultipleSelectionMenu = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[FlowCanvas] Received showMultipleSelectionMenu event');
      
      if (customEvent.detail) {
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: customEvent.detail.x,
          clientY: customEvent.detail.y,
          target: { classList: { contains: () => true } },
        } as unknown as React.MouseEvent;
        
        onPaneContextMenu?.(syntheticEvent);
      }
    };
    
    // Capturar en fase de captura para interceptar antes que ReactFlow
    document.addEventListener('contextmenu', handleSelectionRectContextMenu, true);
    window.addEventListener('showMultipleSelectionMenu', handleShowMultipleSelectionMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleSelectionRectContextMenu, true);
      window.removeEventListener('showMultipleSelectionMenu', handleShowMultipleSelectionMenu);
    };
  }, [onPaneContextMenu]);
  
  // Calcular la posición ajustada del menú contextual
  const getAdjustedMenuPosition = () => {
    if (!contextMenu.visible) return { x: 0, y: 0 };
    
    const menuWidth = 200; // ancho mínimo del menú
    const margin = 10; // margen desde los bordes
    
    // Usar las coordenadas directamente del evento
    let x = contextMenu.x;
    let y = contextMenu.y;
    
    // Calcular altura del menú basado en el número de elementos
    let estimatedHeight = 50; // header
    if (contextMenu.customItems) {
      estimatedHeight += contextMenu.customItems.length * 42; // altura por item
    } else {
      // Estimar basado en el tipo de menú
      if (contextMenu.isPane) {
        const selectedCount = selectedNodes.length;
        if (selectedCount > 0) {
          estimatedHeight += 5 * 42; // máximo 5 opciones para selección múltiple
        } else {
          estimatedHeight += 2 * 42; // 2 opciones para canvas vacío
        }
      } else {
        // Para menús de nodos individuales, contar las opciones reales
        if (contextMenu.nodeType === 'group') {
          estimatedHeight += 4 * 42; // 4 opciones para grupos
        } else if (contextMenu.nodeType === 'areaNode' || contextMenu.nodeType === 'noteNode' || contextMenu.nodeType === 'textNode') {
          estimatedHeight += 2 * 42; // 2 opciones para nodos utilitarios
        } else {
          estimatedHeight += 6 * 42; // 6 opciones para nodos de recursos
        }
      }
    }
    
    // Limitar altura máxima
    const maxHeight = window.innerHeight * 0.8;
    estimatedHeight = Math.min(estimatedHeight, maxHeight);
    
    // Ajustar si se sale por la derecha
    if (x + menuWidth > window.innerWidth - margin) {
      x = window.innerWidth - menuWidth - margin;
    }
    
    // Verificar espacio disponible abajo
    const spaceBelow = window.innerHeight - y - margin;
    const spaceAbove = y - margin;
    
    // Si no hay suficiente espacio abajo pero sí arriba, mostrar hacia arriba
    if (spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
      y = y - estimatedHeight;
    } else if (spaceBelow < estimatedHeight) {
      // Si no hay espacio ni arriba ni abajo, ajustar para que quepa
      y = window.innerHeight - estimatedHeight - margin;
    }
    
    // Asegurar que no se salga por la izquierda
    if (x < margin) {
      x = margin;
    }
    
    // Asegurar que no se salga por arriba
    if (y < margin) {
      y = margin;
    }
    
    return { x, y };
  };
  
  const menuPosition = getAdjustedMenuPosition();
  
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
        onMove={handleViewportChange}
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
        selectNodesOnDrag={false}
      >
        <Background id="1" gap={10} color="#000000" variant={BackgroundVariant.Dots} size={1.2} style={{opacity:0.15,backgroundColor:'#f8f9fa'}}/>
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

        {contextMenu.visible && (
        <div 
          style={{
            position:'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            background:'white',
            border:'1px solid #ddd',
            zIndex:9999, // Aumentado significativamente
            padding:'0px',
            borderRadius:'8px',
            boxShadow:'0 4px 10px rgba(0,0,0,0.2)',
            display:'flex',
            flexDirection:'column',
            gap:'0px',
            minWidth:'180px',
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'hidden'
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
                    <button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){contextMenuActions.duplicateNode(n.id);} hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📋 Duplicar</button>
                    <button onClick={()=>{if(contextMenu.nodeId)contextMenuActions.handleDeleteNodeFromContextMenu(contextMenu.nodeId); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Delete Group</button>
                  </>
                ) : !contextMenu.customItems ? (
                  <>
                    {/* Solo mostrar opciones por defecto si NO hay customItems */}
                    {(() => {
                      const nodeType = reactFlowInstance.getNode(contextMenu.nodeId!)?.type;
                      const isUtilityNode = nodeType === 'areaNode' || nodeType === 'noteNode' || nodeType === 'textNode';
                      
                      // Solo para nodos utilitarios (area, note, text) mostrar duplicar y eliminar
                      if (isUtilityNode) {
                        return (
                          <>
                            <button onClick={()=>{const n=reactFlowInstance.getNode(contextMenu.nodeId||'');if(n){contextMenuActions.duplicateNode(n.id);} hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📋 Duplicar</button>
                            <button onClick={()=>{if(contextMenu.nodeId)contextMenuActions.handleDeleteNodeFromContextMenu(contextMenu.nodeId); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}><TrashIcon className="w-4 h-4 inline-block mr-2"/>Eliminar</button>
                          </>
                        );
                      }
                      // Para nodos de recursos, no mostrar nada aquí ya que usan customItems
                      return null;
                    })()}
                  </>
                ) : null}
              </>
            )}
            {contextMenu.isPane && (
              <>
                {(() => {
                  // Usar selectedNodes pasado como prop si está disponible, sino obtener del reactFlowInstance
                  const selN = selectedNodes.length > 0 ? selectedNodes : reactFlowInstance.getNodes().filter((n: any) => n.selected);
                  console.log('🔍 Selected nodes for context menu:', selN.length);
                  
                  if (selN.length > 0) {
                    // Cuando hay nodos seleccionados
                    const utilityNodeTypes = ['areaNode', 'noteNode', 'textNode', 'group'];
                    const hasOnlyResourceNodes = selN.every((n: any) => !utilityNodeTypes.includes(n.type));
                    
                    return (
                      <>
                        {hasOnlyResourceNodes && selN.length >= 2 && (
                          <button 
                            onClick={()=>{
                              console.log('📦 Grouping nodes:', selN.length, selN);
                              contextMenuActions.groupSelectedNodes(); 
                              hideContextMenu();
                            }} 
                            style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} 
                            onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} 
                            onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                          >
                            {`📦 Agrupar Seleccionados (${selN.length})`}
                          </button>
                        )}
                        {selN.some((n: any) => n.type === 'group' || n.parentId) && (
                          <button 
                            onClick={()=>{
                              console.log('➖ Ungrouping nodes');
                              contextMenuActions.ungroupNodes(); 
                              hideContextMenu();
                            }} 
                            style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} 
                            onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} 
                            onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                          >
                            <MinusCircleIcon className="w-4 h-4 inline-block mr-2"/>Desagrupar
                          </button>
                        )}
                        <button 
                          onClick={()=>{
                            console.log('📋 Duplicating nodes:', selN.length, selN);
                            contextMenuActions.duplicateSelectedNodes(); 
                            hideContextMenu();
                          }} 
                          style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} 
                            onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} 
                            onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                        >
                          📋 {`Duplicar Seleccionados (${selN.length})`}
                        </button>
                        <button 
                          onClick={()=>{
                            console.log('🗑️ Deleting nodes:', selN.length, selN);
                            contextMenuActions.deleteSelectedElements(); 
                            hideContextMenu();
                          }} 
                          style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#ff3333',transition:'background-color 0.2s'}} 
                          onMouseOver={e=>(e.currentTarget.style.backgroundColor='#fff0f0')} 
                          onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                        >
                          <TrashIcon className="w-4 h-4 inline-block mr-2"/>{`Eliminar Seleccionados (${selN.length})`}
                        </button>
                        <button 
                          onClick={()=>{
                            console.log('⬇️ Moving nodes to back:', selN.length);
                            const nodeIds = selN.map((n: any) => n.id);
                            if(nodeIds.length > 0) contextMenuActions.moveNodesToBack(nodeIds); 
                            hideContextMenu();
                          }} 
                          style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} 
                          onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} 
                          onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}
                        >
                          ⬇️ Mover al Fondo
                        </button>
                      </>
                    );
                  } else {
                    // Cuando NO hay nodos seleccionados (canvas vacío)
                    return (
                      <>
                        <button onClick={()=>{ /* groupManagementActions.createEmptyGroup(); */ hideContextMenu(); }} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📦 Create Empty Group</button>
                        <button onClick={()=>{setSidebarOpen(true); hideContextMenu();}} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 12px',cursor:'pointer',border:'none',borderBottom:'1px solid #eee',background:'white',fontSize:'13px',color:'#333',transition:'background-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.backgroundColor='#f5f5f5')} onMouseOut={e=>(e.currentTarget.style.backgroundColor='white')}>📚 Show Resources Panel</button>
                      </>
                    );
                  }
                })()}
              </>
            )}
            {/* Mostrar customItems cuando están disponibles */}
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
