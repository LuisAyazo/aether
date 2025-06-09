import React, { useState, useRef, useEffect, KeyboardEvent, useMemo } from 'react';
import { FolderOutlined, ProjectOutlined, CaretDownOutlined, CaretRightOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip as AntdTooltip, Spin as AntdSpin } from 'antd';
import styles from './DiagramTreeSelect.module.css';

import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Asumiendo una estructura básica para Node, principalmente necesitamos 'type'
interface DiagramNode {
  id: string;
  type?: string; // El tipo de nodo de ReactFlow
  data?: Record<string, any>; // Para verificar data.isResource si se usa
  // Otros campos de nodo si son necesarios para la lógica
}

interface Diagram {
  id: string;
  name: string;
  description?: string;
  path?: string;
  nodes?: DiagramNode[]; // Asegurar que los nodos estén disponibles
}

interface TreeNode {
  type: 'group' | 'root';
  name?: string;
  fullPath?: string; 
  children: { [key: string]: TreeNode };
  diagrams: Diagram[];
}

interface DiagramTreeSelectProps {
  diagrams: Diagram[];
  value?: string;
  onChange: (diagramId: string) => void;
  placeholder?: string;
  companyId?: string; 
  environmentId?: string; 
  className?: string;
  onDeleteDiagram?: (diagramId: string) => void;
  showDeleteButton?: boolean;
  onDiagramPathChange?: (diagramId: string, newPath: string | null) => Promise<void>;
  isLoading?: boolean; 
}

const DiagramDragOverlayItem = ({ diagram }: { diagram: Diagram }) => {
  return (
    <div 
      className={styles.diagramItem} 
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingLeft: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        cursor: 'grabbing',
        pointerEvents: 'none',
      }}
    >
      <ProjectOutlined className="text-gray-500 mr-2" />
      <div className="flex flex-col overflow-hidden flex-grow">
        <span className="font-medium text-sm text-gray-800 truncate block">{diagram.name}</span>
        {diagram.description && <span className="text-xs text-gray-500 truncate block">{diagram.description}</span>}
      </div>
    </div>
  );
};

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
};

const countTotalDiagramsInNodeRecursive = (node: TreeNode): number => {
  let count = node.diagrams.length;
  Object.values(node.children).forEach(childNode => {
    count += countTotalDiagramsInNodeRecursive(childNode);
  });
  return count;
};

// Tipos de nodos a excluir del conteo de "nodos de recursos/grupos"
const NON_COUNTABLE_NODE_TYPES = ['noteNode', 'textNode', 'areaNode'];

export default function DiagramTreeSelect({ 
  diagrams, 
  value, 
  onChange,
  placeholder = 'Seleccionar diagrama',
  companyId, 
  environmentId, 
  className = '',
  onDeleteDiagram,
  showDeleteButton = false,
  onDiagramPathChange,
  isLoading = false 
}: DiagramTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Diagram | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeDragItem, setActiveDragItem] = useState<Diagram | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'diagram') {
      setActiveDragItem(event.active.data.current.diagramObject as Diagram);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;

      if (activeType === 'diagram' && overType === 'directory') {
        const diagramDragged = active.data.current?.diagramObject as Diagram;
        const targetDirectoryPath = over.data.current?.path as string | null;
        const currentDiagramPath = diagramDragged.path || null;

        if (targetDirectoryPath !== currentDiagramPath) {
          if (onDiagramPathChange) {
            onDiagramPathChange(active.id as string, targetDirectoryPath)
              .catch(err => console.error(`Error en onDiagramPathChange:`, err));
          }
        }
      }
    }
  };

  const buildDiagramTree = (diagramItems: Diagram[]): TreeNode => {
    const sortedDiagrams = [...diagramItems].sort((a, b) => {
      const pathA = a.path || ''; const pathB = b.path || '';
      if (pathA !== pathB) return pathA.localeCompare(pathB);
      return a.name.localeCompare(b.name);
    });
    
    const rootTree: TreeNode = { type: 'root', fullPath: '__ROOT_DROP_AREA__', children: {}, diagrams: [] }; 
    
    sortedDiagrams.forEach(diagram => {
      const path = diagram.path?.trim() || '';
      if (!path) {
        rootTree.diagrams.push(diagram);
      } else {
        const pathParts = path.split('/');
        let currentNode = rootTree;
        for (let i = 0; i < pathParts.length; i++) {
          const segmentName = pathParts[i];
          const currentPath = pathParts.slice(0, i + 1).join('/');
          if (!currentNode.children[segmentName]) {
            currentNode.children[segmentName] = { type: 'group', name: segmentName, fullPath: currentPath, children: {}, diagrams: [] };
          }
          currentNode = currentNode.children[segmentName];
        }
        currentNode.diagrams.push(diagram);
      }
    });
    return rootTree;
  };
  
  const treeStructure = useMemo(() => buildDiagramTree(diagrams), [diagrams]);

  useEffect(() => {
    if (value) {
      const findDiag = (items: Diagram[]): Diagram | null => items.find(d => d.id === value) || null;
      const searchInNode = (node: TreeNode): Diagram | null => {
        let found = findDiag(node.diagrams);
        if (found) return found;
        for (const key in node.children) {
          found = searchInNode(node.children[key]);
          if (found) return found;
        }
        return null;
      };
      setSelectedItem(searchInNode(treeStructure));
    } else setSelectedItem(null);
  }, [value, treeStructure]);
  
  const filterTreeNode = (node: TreeNode, searchQuery: string): TreeNode | null => {
    if (!searchQuery) return node;
    const lowerSearchQuery = searchQuery.toLowerCase();
    const matchingDiagrams = node.diagrams.filter(d => d.name.toLowerCase().includes(lowerSearchQuery) || (d.description && d.description.toLowerCase().includes(lowerSearchQuery)));
    const children: { [key: string]: TreeNode } = {};
    let hasMatchingChildren = false;
    Object.entries(node.children).forEach(([key, childNode]) => {
      const filteredChild = filterTreeNode(childNode, searchQuery);
      if (filteredChild && (filteredChild.diagrams.length > 0 || Object.keys(filteredChild.children).length > 0)) {
        children[key] = filteredChild;
        hasMatchingChildren = true;
      }
    });
    if (matchingDiagrams.length > 0 || hasMatchingChildren) return { ...node, diagrams: matchingDiagrams, children };
    return null;
  };

  const filteredTree = useMemo(() => filterTreeNode(treeStructure, searchText), [treeStructure, searchText]);

  useEffect(() => {
    if (searchText && filteredTree) {
      const newExpanded = new Set<string>();
      const expandMatching = (node: TreeNode) => {
        if (node.type === 'group' && node.fullPath && (node.diagrams.length > 0 || Object.keys(node.children).length > 0)) {
          if(node.fullPath) newExpanded.add(node.fullPath);
        }
        Object.values(node.children).forEach(expandMatching);
      };
      if (filteredTree) expandMatching(filteredTree);
      setExpandedGroups(newExpanded);
    }
  }, [searchText, filteredTree]);
  
  const handleSelect = (diagram: Diagram) => { setSelectedItem(diagram); onChange(diagram.id); setIsOpen(false); setSearchText(''); };
  const toggleGroup = (path: string | undefined) => { if (!path) return; setExpandedGroups(prev => { const newSet = new Set(prev); if (newSet.has(path)) newSet.delete(path); else newSet.add(path); return newSet; }); };
  
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);
  const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };

  const DiagramTreeRecursive = ({ node, level = 0 }: { node: TreeNode, level?: number }) => {
    if (!node) return null;
    const isExpanded = node.fullPath ? expandedGroups.has(node.fullPath) : true;
    const hasChildren = Object.keys(node.children).length > 0;
    const hasDiagrams = node.diagrams.length > 0;
    const indentSize = level * 16;
    
    const {setNodeRef: setDroppableRefForNode, isOver: isOverCurrentNode} = useDroppable({
      id: node.fullPath || '__ROOT_DROP_AREA__', 
      data: { type: 'directory', path: node.type === 'root' ? null : node.fullPath, accepts: ['diagram'] }
    });
    
    const droppableStyleBase = { borderRadius: '4px', transition: 'background-color 0.2s ease' };
    const droppableStyleActive = { ...droppableStyleBase, backgroundColor: 'rgba(74, 222, 128, 0.15)', outline: '1px dashed #4ade80' };
    const droppableStyleInactive = { ...droppableStyleBase, minHeight: '20px' };

    const totalDiagramsInThisNode = useMemo(() => countTotalDiagramsInNodeRecursive(node), [node]);

    return (
      <div className={styles.treeNodeWrapper}>
        {node.type === 'group' && node.name && (
          <div 
            ref={setDroppableRefForNode}
            className={`${styles.groupHeader} ${isOverCurrentNode ? styles.droppableAreaOverNode : ''} bg-yellow-50 dark:bg-yellow-700/30 hover:bg-yellow-100 dark:hover:bg-yellow-600/40`}
            onClick={() => toggleGroup(node.fullPath)}
            style={{ paddingLeft: `${indentSize}px`, ...(isOverCurrentNode ? droppableStyleActive : {}) }}
          >
            <span className={styles.caretIcon}>
              {(hasChildren || hasDiagrams) ? (isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />) : <span style={{display:'inline-block', width:'14px'}}/>}
            </span>
            <FolderOutlined className={`${styles.folderIcon} text-yellow-600 dark:text-yellow-500`} />
            <span className={styles.groupName}>{node.name}</span>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 pr-2">
              ({totalDiagramsInThisNode} Diag.)
            </span>
          </div>
        )}
        
        {(node.type === 'root' || isExpanded) && (
          <div 
            ref={node.type === 'root' ? setDroppableRefForNode : null}
            className={`${node.type === 'root' && !hasDiagrams && !hasChildren ? styles.emptyRootContainer : (node.type === 'root' ? styles.rootDiagramsContainer : '')} ${node.type === 'root' && isOverCurrentNode ? styles.droppableAreaOverNode : ''}`}
            style={node.type === 'root' ? (isOverCurrentNode ? droppableStyleActive : droppableStyleInactive) : {}}
          >
            {hasDiagrams && node.diagrams.map((diagram: Diagram) => {
              const {attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging: isCurrentDiagramDragging} = useDraggable({
                id: diagram.id,
                data: { type: 'diagram', diagramObject: diagram }
              });
              
              const itemIsBeingDragged = activeDragItem?.id === diagram.id;
              const opacity = itemIsBeingDragged ? 0 : 1; 

              const style = {
                transform: CSS.Transform.toString(transform),
                opacity: opacity,
                paddingLeft: `${indentSize + (node.type === 'group' ? 24 : (node.type === 'root' ? 8 : 0))}px`,
                zIndex: isCurrentDiagramDragging ? 1000 : 'auto'
              };

              if (itemIsBeingDragged) {
                 return <div key={`${diagram.id}-placeholder`} style={{height: '36px', paddingLeft: style.paddingLeft}} className={styles.diagramItemPlaceholder} />;
              }
              
              // Calcular nodos relevantes para este diagrama
              const relevantNodeCount = diagram.nodes?.filter(n => !NON_COUNTABLE_NODE_TYPES.includes(n.type || '')).length || 0;

              return (
                <div 
                  ref={setDraggableNodeRef}
                  style={style}
                  {...listeners}
                  {...attributes}
                  key={diagram.id} 
                  className={`${styles.diagramItem} ${selectedItem?.id === diagram.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(diagram)}
                >
                  <ProjectOutlined className="text-gray-400 mr-2" />
                  <div className="flex flex-col overflow-hidden flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate block">{diagram.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                        ({relevantNodeCount} Nodos) {/* Contador de nodos filtrado */}
                      </span>
                    </div>
                    {diagram.description && <span className="text-xs text-gray-500 dark:text-gray-400 truncate block mt-0.5">{diagram.description}</span>}
                  </div>
                  {showDeleteButton && onDeleteDiagram && (
                     <AntdTooltip title="Eliminar diagrama">
                        <DeleteOutlined 
                          className="text-gray-400 hover:text-red-500 ml-auto pl-2 cursor-pointer"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteDiagram(diagram.id); }}
                        />
                    </AntdTooltip>
                  )}
                </div>
              );
            })}
            
            {hasChildren && Object.keys(node.children).sort().map(keyName => {
              const childNode = node.children[keyName];
              return (
                <DiagramTreeRecursive key={childNode.fullPath || keyName} node={childNode} level={level + (node.type === 'group' ? 1 : 0)} />
              );
            })}
            
            {node.type === 'group' && isExpanded && !hasDiagrams && !hasChildren && (
              <div 
                ref={setDroppableRefForNode} 
                style={{ paddingLeft: `${indentSize + 24}px`, ...(isOverCurrentNode ? droppableStyleActive : {minHeight: '30px'}) }} 
                className={`${styles.emptyDirectoryDropZone} ${isOverCurrentNode ? styles.droppableAreaOverNode : ''}`}
              >
                Soltar aquí para mover a '{node.name}'
              </div>
            )}
             {node.type === 'root' && !hasDiagrams && !hasChildren && (
              <div className={styles.emptyRootDropZone} 
                   style={isOverCurrentNode ? droppableStyleActive : droppableStyleInactive} 
                   ref={setDroppableRefForNode}
              >
                Arrastra diagramas aquí para moverlos a la raíz
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const getDisplayValue = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center">
          <span className="text-gray-400">{placeholder}</span>
          {isLoading && !isOpen && <AntdSpin size="small" className="ml-2" />}
        </div>
      );
    }
    return (
      <div className="flex items-center w-full text-left">
        <ProjectOutlined className="text-gray-500 dark:text-gray-400 mr-2 shrink-0" />
        <div className="flex flex-col overflow-hidden flex-grow">
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate block">
            {selectedItem.name}
          </span>
          {selectedItem.description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
              {selectedItem.description}
            </span>
          )}
        </div>
        {isLoading && !isOpen && <AntdSpin size="small" className="ml-2" />}
      </div>
    );
  };
  
  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <div 
        className={`${styles.selector} ${isOpen ? styles.active : ''} flex items-center`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {getDisplayValue()}
      </div>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar diagramas..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.searchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={`${styles.treeContainer} relative`}>
              {isLoading && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 z-10 rounded-b-md"
                >
                  <AntdSpin size="large" />
                </div>
              )}
              <div style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                {filteredTree && (Object.keys(filteredTree.children).length > 0 || filteredTree.diagrams.length > 0) ? (
                  <DiagramTreeRecursive node={filteredTree} />
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchText ? "No se encontraron diagramas con tu búsqueda." : "No hay diagramas en este ambiente."}
                  </div>
                )}
              </div>
            </div>
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeDragItem ? <DiagramDragOverlayItem diagram={activeDragItem} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}
