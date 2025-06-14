import React, { useCallback, useState } from 'react';
import { Tooltip } from 'antd';
import {
  CursorArrowRaysIcon,
  Square3Stack3DIcon,
  SwatchIcon,
  DocumentTextIcon,
  PencilIcon,
  RectangleGroupIcon,
  ArrowsUpDownIcon,
  ShareIcon,
  BoltIcon as HeroBoltIcon,
  PencilSquareIcon as HeroPencilSquareIcon,
  LinkIcon as HeroLinkIcon,
  PhoneArrowUpRightIcon as HeroPhoneArrowUpRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowsPointingInIcon,
  LockClosedIcon,
  LockOpenIcon,
  CodeBracketIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useReactFlow } from 'reactflow';
import { useEditorStore } from '../hooks/useEditorStore';
import { useSelectedEdgeType } from '../../../contexts/SelectedEdgeTypeContext';
import { LogicalEdgeType, edgeTypeConfigs, EdgeTypeConfig } from '../../../config/edgeConfig'; // Corregido EdgeConfig a EdgeTypeConfig
import type { ToolType as EditorToolType } from '../types/editorTypes'; // Corregido EditorToolType a ToolType
import { useNavigationStore } from '../../../stores/useNavigationStore';

interface ToolbarProps {
  onSaveDiagram: () => void;
  onCreateEmptyGroup: () => void;
  onToolClick: (tool: EditorToolType) => void;
  isInteractive: boolean;
  setIsInteractive: (value: boolean) => void;
}

const edgeToolbarIcons: Record<LogicalEdgeType, React.ElementType> = {
  [LogicalEdgeType.DEPENDS_ON]: ShareIcon,
  [LogicalEdgeType.CALLS]: HeroPhoneArrowUpRightIcon,
  [LogicalEdgeType.TRIGGERS]: HeroBoltIcon,
  [LogicalEdgeType.WRITES_TO]: HeroPencilSquareIcon,
  [LogicalEdgeType.CONNECTS_TO]: HeroLinkIcon,
};

export function Toolbar({ onSaveDiagram, onCreateEmptyGroup, onToolClick, isInteractive, setIsInteractive }: ToolbarProps) {
  // Seleccionar cada pieza del estado individualmente
  const activeTool = useEditorStore(state => state.activeTool);
  const toolbarLayout = useEditorStore(state => state.toolbarLayout);
  const setToolbarLayout = useEditorStore(state => state.setToolbarLayout);

  const reactFlowInstance = useReactFlow();
  const { setNodes } = reactFlowInstance;
  const { selectedLogicalType, setSelectedLogicalType } = useSelectedEdgeType();
  
  // Estado para Live Preview
  const { isLivePreviewEnabled, setLivePreviewEnabled, generateCodeAndShowModal } = useNavigationStore();

  // Funciones de control del canvas
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const toggleInteractivity = useCallback(() => {
    const newState = !isInteractive;
    setIsInteractive(newState);
  }, [isInteractive, setIsInteractive]);

  const handleEdgeTypeSelect = (type: LogicalEdgeType) => {
    setSelectedLogicalType(prev => (prev === type ? null : type));
  };

  const tools: { name: EditorToolType; title: string; icon: React.ElementType, action?: () => void }[] = [
    { name: 'select', title: 'Select (V)', icon: CursorArrowRaysIcon },
    { name: 'lasso', title: 'Lasso Select (Shift+S)', icon: SwatchIcon },
    { name: 'note', title: 'Add Note (N)', icon: DocumentTextIcon },
    { name: 'text', title: 'Add Text (T)', icon: PencilIcon },
    { name: 'area', title: 'Draw Area (A)', icon: RectangleGroupIcon },
    { name: 'createResizableGroup', title: 'Create Resizable Group (G)', icon: Square3Stack3DIcon, action: onCreateEmptyGroup },
    { name: 'resizableNode', title: 'Create Resizable Node', icon: Square3Stack3DIcon, action: () => {
      const newNode = {
        id: `resizable-node-${+new Date()}`,
        type: 'resizableNode',
        position: { x: 100, y: 100 },
        data: { label: 'Resizable Node' },
      };
      setNodes((nds: any[]) => nds.concat(newNode));
    }},
  ];

  return (
    <div
      className="absolute top-4 left-4 z-10 bg-white p-1 rounded-md shadow-lg flex items-center gap-1 border border-gray-200"
      style={{ flexDirection: toolbarLayout === 'horizontal' ? 'row' : 'column' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Tooltip 
        title={toolbarLayout === 'horizontal' ? "Cambiar a barra vertical" : "Cambiar a barra horizontal"} 
        placement="bottom"
        mouseEnterDelay={0}
        styles={{ 
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={() => {
            const newLayout = toolbarLayout === 'horizontal' ? 'vertical' : 'horizontal';
            setToolbarLayout(newLayout);
          }}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
        >
          <ArrowsUpDownIcon className="h-5 w-5" />
        </button>
      </Tooltip>
      
      <Tooltip 
        title="Guardar estado actual (zoom y posición)" 
        placement="bottom"
        mouseEnterDelay={0}
        styles={{ 
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={onSaveDiagram}
          className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
      </Tooltip>

      {tools.map(tool => (
        <Tooltip 
          key={tool.name}
          title={tool.title} 
          placement="bottom"
          mouseEnterDelay={0}
          styles={{ 
            root: {
              backgroundColor: 'black',
              color: 'white',
              fontSize: '12px'
            }
          }}
          color="black"
        >
          <button 
            onClick={() => {
              onToolClick(tool.name);
              if (tool.action) {
                tool.action();
              }
            }} 
            className={`p-1.5 hover:bg-gray-200 rounded ${activeTool === tool.name ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500' : 'text-gray-600'}`}
          >
            <tool.icon className="h-5 w-5" />
          </button>
        </Tooltip>
      ))}
      
      <div className={`bg-gray-300 ${toolbarLayout === 'horizontal' ? 'w-px h-6 mx-1' : 'h-px w-full my-1'}`}></div>
      
      {Object.values(edgeTypeConfigs).map((cfg: EdgeTypeConfig) => { // Corregido EdgeConfig a EdgeTypeConfig
        const IconComponent = edgeToolbarIcons[cfg.logicalType];
        const isSelected = selectedLogicalType === cfg.logicalType;
        return (
          <Tooltip 
            title={`Edge: ${cfg.label}`} 
            placement="bottom" 
            key={cfg.logicalType}
            mouseEnterDelay={0}
            styles={{ 
              root: {
                backgroundColor: 'black',
                color: 'white',
                fontSize: '12px'
              }
            }}
            color="black"
          >
            <button
              onClick={() => handleEdgeTypeSelect(cfg.logicalType)}
              className={`p-1.5 rounded hover:bg-gray-200 ${isSelected ? 'bg-blue-100 ring-1 ring-blue-500' : 'bg-transparent'}`}
              style={{ color: isSelected ? cfg.style?.stroke || 'blue' : cfg.style?.stroke || 'black' }}
            >
              {IconComponent && <IconComponent className="w-5 h-5" />}
            </button>
          </Tooltip>
        );
      })}

      <div className={`bg-gray-300 ${toolbarLayout === 'horizontal' ? 'w-px h-6 mx-1' : 'h-px w-full my-1'}`}></div>

      {/* Botón de Live Preview */}
      <Tooltip
        title={isLivePreviewEnabled ? "Live Preview activo - Click para desactivar" : "Activar Live Preview de código"}
        placement="bottom"
        mouseEnterDelay={0}
        styles={{
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={() => {
            if (!isLivePreviewEnabled) {
              // Activar Live Preview y generar código
              setLivePreviewEnabled(true);
              generateCodeAndShowModal();
            } else {
              // Desactivar Live Preview
              setLivePreviewEnabled(false);
            }
          }}
          className={`relative p-2 rounded-lg transition-all duration-300 ${
            isLivePreviewEnabled
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 border border-purple-300'
          }`}
          style={{
            minWidth: toolbarLayout === 'horizontal' ? '120px' : 'auto',
          }}
        >
          <div className="flex items-center gap-2">
            <CodeBracketIcon className="w-5 h-5" />
            {toolbarLayout === 'horizontal' && (
              <span className="text-xs font-semibold">
                {isLivePreviewEnabled ? 'Live ON' : 'Live Code'}
              </span>
            )}
            {isLivePreviewEnabled && (
              <SparklesIcon className="w-4 h-4 absolute -top-1 -right-1 animate-pulse" />
            )}
          </div>
        </button>
      </Tooltip>

      <div className={`bg-gray-300 ${toolbarLayout === 'horizontal' ? 'w-px h-6 mx-1' : 'h-px w-full my-1'}`}></div>

      <Tooltip
        title="Acercar"
        placement="bottom"
        mouseEnterDelay={0}
        styles={{ 
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
        >
          <MagnifyingGlassPlusIcon className="w-5 h-5" />
        </button>
      </Tooltip>

      <Tooltip 
        title="Alejar" 
        placement="bottom"
        mouseEnterDelay={0}
        styles={{ 
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
        >
          <MagnifyingGlassMinusIcon className="w-5 h-5" />
        </button>
      </Tooltip>

      <Tooltip 
        title="Ajustar vista" 
        placement="bottom"
        mouseEnterDelay={0}
        styles={{ 
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={handleFitView}
          className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
        >
          <ArrowsPointingInIcon className="w-5 h-5" />
        </button>
      </Tooltip>

      <Tooltip 
        title={isInteractive ? "Bloquear interacción" : "Desbloquear interacción"} 
        placement="bottom"
        mouseEnterDelay={0}
        styles={{ 
          root: {
            backgroundColor: 'black',
            color: 'white',
            fontSize: '12px'
          }
        }}
        color="black"
      >
        <button
          onClick={toggleInteractivity}
          className={`p-1.5 hover:bg-gray-200 rounded ${isInteractive ? 'text-gray-700' : 'text-orange-600 bg-orange-100'}`}
        >
          {isInteractive ? <LockOpenIcon className="w-5 h-5" /> : <LockClosedIcon className="w-5 h-5" />}
        </button>
      </Tooltip>
    </div>
  );
}
