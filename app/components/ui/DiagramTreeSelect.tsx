import React, { useState, useRef, useEffect, KeyboardEvent } from 'react'; // MouseEvent eliminado si no se usa directamente
import { FolderOutlined, ProjectOutlined, CaretDownOutlined, CaretRightOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './DiagramTreeSelect.module.css';
import { updateDiagramPaths } from '@/app/services/diagramService';

interface Diagram {
  id: string;
  name: string;
  description?: string;
  path?: string;
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
  selectedDiagram?: Diagram; // No se usa directamente, selectedItem se deriva de 'value'
  onSelect?: (diagram: Diagram) => void; // No se usa directamente
  companyId?: string;
  environmentId?: string;
  className?: string;
  onDeleteDiagram?: (diagramId: string) => void;
  showDeleteButton?: boolean;
}

export default function DiagramTreeSelect({ 
  diagrams, 
  value, 
  onChange,
  placeholder = 'Seleccionar diagrama',
  companyId,
  environmentId,
  className = '',
  onDeleteDiagram,
  showDeleteButton = false
}: DiagramTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Diagram | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // const [tree, setTree] = useState<TreeNode[]>([]); // tree no se usa, treeStructure sí

  const buildDiagramTree = (diagramItems: Diagram[]): TreeNode => {
    const sortedDiagrams = [...diagramItems].sort((a, b) => {
      const pathA = a.path || '';
      const pathB = b.path || '';
      if (pathA !== pathB) return pathA.localeCompare(pathB);
      return a.name.localeCompare(b.name);
    });
    
    const rootTree: TreeNode = { type: 'root', children: {}, diagrams: [] };
    const groups: { [key: string]: Diagram[] } = { 'Sin categoría': [] };
    
    sortedDiagrams.forEach(diagram => {
      const path = diagram.path?.trim() || '';
      if (!path) {
        groups['Sin categoría'].push(diagram);
      } else {
        const groupName = path.split('/')[0];
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(diagram);
      }
    });
    
    Object.entries(groups).forEach(([groupName, groupDiagrams]) => {
      if (groupDiagrams.length === 0) return;

      if (groupName === 'Sin categoría') {
        rootTree.diagrams.push(...groupDiagrams);
      } else {
        const groupNode: TreeNode = { type: 'group', name: groupName, fullPath: groupName, children: {}, diagrams: [] };
        groupDiagrams.forEach(diagram => {
          const pathParts = (diagram.path || '').split('/');
          if (pathParts.length > 1) {
            let currentNode = groupNode;
            for (let i = 1; i < pathParts.length; i++) {
              const segmentName = pathParts[i];
              const subPath = pathParts.slice(0, i + 1).join('/'); // Corrected subPath for full path
              if (!currentNode.children[segmentName]) {
                currentNode.children[segmentName] = { type: 'group', name: segmentName, fullPath: subPath, children: {}, diagrams: [] };
              }
              currentNode = currentNode.children[segmentName];
            }
            currentNode.diagrams.push(diagram);
          } else {
            groupNode.diagrams.push(diagram);
          }
        });
        rootTree.children[groupName] = groupNode;
      }
    });
    return rootTree;
  };
  
  const treeStructure = buildDiagramTree(diagrams);

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
    } else {
      setSelectedItem(null);
    }
  }, [diagrams, value, treeStructure]);
  
  const filterTreeNode = (node: TreeNode, searchQuery: string): TreeNode | null => {
    if (!searchQuery) return node;
    const lowerSearchQuery = searchQuery.toLowerCase();
    
    const matchingDiagrams = node.diagrams.filter(diagram => 
      diagram.name.toLowerCase().includes(lowerSearchQuery) ||
      (diagram.description && diagram.description.toLowerCase().includes(lowerSearchQuery))
    );
    
    const children: { [key: string]: TreeNode } = {};
    let hasMatchingChildren = false;
    Object.entries(node.children).forEach(([key, childNode]) => {
      const filteredChild = filterTreeNode(childNode, searchQuery);
      if (filteredChild && (filteredChild.diagrams.length > 0 || Object.keys(filteredChild.children).length > 0)) {
        children[key] = filteredChild;
        hasMatchingChildren = true;
      }
    });
    
    if (matchingDiagrams.length > 0 || hasMatchingChildren) {
      return { ...node, diagrams: matchingDiagrams, children };
    }
    return null;
  };

  const filteredTree = filterTreeNode(treeStructure, searchText);

  useEffect(() => {
    if (searchText && filteredTree) {
      const newExpanded = new Set<string>();
      const expandMatching = (node: TreeNode) => {
        if (node.type === 'group' && node.fullPath && (node.diagrams.length > 0 || Object.keys(node.children).length > 0)) {
          newExpanded.add(node.fullPath);
        }
        Object.values(node.children).forEach(expandMatching);
      };
      expandMatching(filteredTree);
      setExpandedGroups(newExpanded);
    }
  }, [searchText, filteredTree]);
  
  const handleSelect = (diagram: Diagram) => {
    setSelectedItem(diagram);
    onChange(diagram.id);
    setIsOpen(false);
    setSearchText('');
  };

  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };
  
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => { // Use globalThis.MouseEvent
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  const DiagramTreeRecursive = ({ node, level = 0 }: { node: TreeNode, level?: number }) => {
    if (!node) return null;
    const isExpanded = node.fullPath ? expandedGroups.has(node.fullPath) : true; // Root is conceptually expanded
    const hasChildren = Object.keys(node.children).length > 0;
    const hasDiagrams = node.diagrams.length > 0;
    const indentSize = level * 16;
    
    const getTotalDiagrams = (n: TreeNode): number => n.diagrams.length + Object.values(n.children).reduce((sum, child) => sum + getTotalDiagrams(child), 0);
    const totalDiagramsInGroup = node.type === 'group' ? getTotalDiagrams(node) : 0;
    
    return (
      <div>
        {node.type === 'group' && node.name && (
          <div 
            className={styles.groupHeader}
            onClick={() => node.fullPath && toggleGroup(node.fullPath)}
            style={{ paddingLeft: `${indentSize}px` }}
          >
            <span className={styles.caretIcon}>
              {(hasChildren || hasDiagrams) ? (isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />) : <span style={{display:'inline-block', width:'14px'}}/>}
            </span>
            <FolderOutlined className={styles.folderIcon} />
            <span className={styles.groupName}>{node.name}</span>
            {totalDiagramsInGroup > 0 && <span className={styles.diagramCount}>{totalDiagramsInGroup}</span>}
          </div>
        )}
        
        {(node.type === 'root' || isExpanded) && (
          <div>
            {hasDiagrams && node.diagrams.map((diagram: Diagram) => (
              <div 
                key={diagram.id}
                className={`${styles.diagramItem} ${selectedItem?.id === diagram.id ? styles.selected : ''}`}
                onClick={() => handleSelect(diagram)}
                style={{ paddingLeft: `${indentSize + (node.type === 'group' ? 24 : 0)}px` }}
              >
                <ProjectOutlined className="text-gray-400 mr-2" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate block">{diagram.name}</span>
                  {diagram.description && <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{diagram.description}</span>}
                </div>
                {showDeleteButton && onDeleteDiagram && (
                  <DeleteOutlined 
                    className="text-gray-400 hover:text-red-500 ml-auto pl-2 cursor-pointer"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteDiagram(diagram.id); }}
                    title="Eliminar diagrama"
                  />
                )}
              </div>
            ))}
            
            {hasChildren && Object.keys(node.children).sort().map(key => (
                <DiagramTreeRecursive key={key} node={node.children[key]} level={level + (node.type === 'group' ? 1 : 0)} />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const getDisplayValue = () => {
    if (!selectedItem) return <span className="text-gray-400">{placeholder}</span>;
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
      </div>
    );
  };
  
  useEffect(() => {
    const needsPathUpdate = diagrams.some(diagram => !diagram.path);
    if (needsPathUpdate && companyId && environmentId) {
      updateDiagramPaths(companyId, environmentId)
        .then(_updatedDiagrams => { // Prefijar con _ si no se usa
          // This might cause an infinite loop if diagrams prop isn't stable or if updateDiagramPaths itself triggers a re-render that changes diagrams
          // Consider if this logic is truly needed or if paths should be set on creation
        })
        .catch(error => console.error('Error updating diagram paths:', error));
    }
    // treeStructure is already built from diagrams, no need to setTree
  }, [diagrams, companyId, environmentId]); // Removed setTree from dependencies
  
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
          
          <div className={styles.treeContainer}>
            {filteredTree && (Object.keys(filteredTree.children).length > 0 || filteredTree.diagrams.length > 0) ? (
              <DiagramTreeRecursive node={filteredTree} />
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No se encontraron diagramas</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
