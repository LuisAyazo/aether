import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FolderOutlined, ProjectOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
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
  selectedDiagram?: Diagram;
  onSelect?: (diagram: Diagram) => void;
  companyId?: string;
  environmentId?: string;
  className?: string;
}

export default function DiagramTreeSelect({ 
  diagrams, 
  value, 
  onChange,
  placeholder = 'Seleccionar diagrama',
  selectedDiagram, 
  onSelect, 
  companyId,
  environmentId,
  className = ''
}: DiagramTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Diagram | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [tree, setTree] = useState<TreeNode[]>([]);
  
  // Build diagram tree structure based on paths
  const buildDiagramTree = (diagramItems: Diagram[]): TreeNode => {
    const sortedDiagrams = [...diagramItems].sort((a, b) => {
      // First sort by path
      if (a.path && b.path) {
        return a.path.localeCompare(b.path);
      }
      if (a.path) return -1;
      if (b.path) return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
    
    const rootTree: TreeNode = {
      type: 'root',
      children: {},
      diagrams: []
    };
    
    // Group diagrams by path
    const groups: { [key: string]: Diagram[] } = {
      'Sin categoría': []
    };
    
    sortedDiagrams.forEach(diagram => {
      if (diagram.path) {
        const pathParts = diagram.path.split('/');
        const groupName = pathParts[0];
        
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(diagram);
      } else {
        groups['Sin categoría'].push(diagram);
      }
    });
    
    // Create tree structure
    Object.entries(groups).forEach(([groupName, diagrams]) => {
      if (diagrams.length > 0) {
        if (groupName === 'Sin categoría') {
          // Add uncategorized diagrams directly to root
          rootTree.diagrams.push(...diagrams);
        } else {
          // Create group node with subdirectories
          const groupNode: TreeNode = {
            type: 'group',
            name: groupName,
            fullPath: groupName,
            children: {},
            diagrams: []
          };
          
          // Organize diagrams by subdirectories
          diagrams.forEach(diagram => {
            if (diagram.path) {
              const pathParts = diagram.path.split('/');
              
              if (pathParts.length > 1) {
                // Has subdirectories - create nested structure
                let currentNode = groupNode;
                
                // Navigate/create nested structure for all path parts except the first (group name)
                for (let i = 1; i < pathParts.length; i++) {
                  const pathSegment = pathParts[i];
                  const subPath = pathParts.slice(1, i + 1).join('/');
                  
                  if (!currentNode.children[pathSegment]) {
                    currentNode.children[pathSegment] = {
                      type: 'group',
                      name: pathSegment,
                      fullPath: `${groupName}/${subPath}`,
                      children: {},
                      diagrams: []
                    };
                  }
                  currentNode = currentNode.children[pathSegment];
                }
                
                // Add diagram to the deepest level only
                currentNode.diagrams.push(diagram);
              } else {
                // No subdirectories, add to group directly
                groupNode.diagrams.push(diagram);
              }
            }
          });
          
          rootTree.children[groupName] = groupNode;
        }
      }
    });
    
    return rootTree;
  };
  
  // Helper to check if we have multiple diagrams
  const hasMultipleDiagrams = (diagrams: Diagram[]): boolean => {
    return diagrams.length > 3; // Group if more than 3 diagrams
  };

  // Get tree structure
  const treeStructure = buildDiagramTree(diagrams);

  // Set selected item based on value
  useEffect(() => {
    if (value) {
      const selectedDiagram = diagrams.find(d => d.id === value);
      setSelectedItem(selectedDiagram || null);
    } else {
      setSelectedItem(null);
    }
  }, [diagrams, value]);
  
  // Filter tree based on search text
  const filterTreeNode = (node: TreeNode, searchQuery: string): TreeNode | null => {
    if (!searchQuery) return node;
    
    const lowerSearchQuery = searchQuery.toLowerCase();
    
    // Create filtered node
    const filteredNode: TreeNode = {
      type: node.type,
      name: node.name,
      fullPath: node.fullPath,
      children: {},
      diagrams: []
    };
    
    // Filter diagrams at this level
    const matchingDiagrams = node.diagrams.filter(diagram => 
      diagram.name.toLowerCase().includes(lowerSearchQuery) ||
      (diagram.description && diagram.description.toLowerCase().includes(lowerSearchQuery))
    );
    
    filteredNode.diagrams = matchingDiagrams;
    
    // Filter children recursively
    let hasMatchingChildren = false;
    Object.keys(node.children).forEach(key => {
      const filteredChild = filterTreeNode(node.children[key], searchQuery);
      if (filteredChild && (filteredChild.diagrams.length > 0 || Object.keys(filteredChild.children).length > 0)) {
        filteredNode.children[key] = filteredChild;
        hasMatchingChildren = true;
      }
    });
    
    // Return node if it has matching content
    if (filteredNode.diagrams.length > 0 || hasMatchingChildren) {
      return filteredNode;
    }
    
    return null;
  };

  // Get filtered tree
  const filteredTree = filterTreeNode(treeStructure, searchText);

  // Auto-expand groups containing search matches
  useEffect(() => {
    if (searchText && filteredTree) {
      const expandAllWithMatches = (node: TreeNode) => {
        if (node.type === 'group' && node.fullPath) {
          if (node.diagrams.length > 0 || Object.keys(node.children).length > 0) {
            setExpandedGroups(prev => new Set(prev).add(node.fullPath!));
          }
        }
        
        Object.values(node.children).forEach(child => {
          expandAllWithMatches(child);
        });
      };
      
      expandAllWithMatches(filteredTree);
    }
  }, [searchText, filteredTree]);
  
  // Select a diagram
  const handleSelect = (diagram: Diagram) => {
    setSelectedItem(diagram);
    onChange(diagram.id);
    setIsOpen(false);
    setSearchText('');
  };

  // Toggle group expansion
  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Recursive component for diagram tree rendering
  const DiagramTree = ({ node, level = 0 }: { node: TreeNode, level?: number }) => {
    if (!node) return null;
    
    const isExpanded = node.fullPath ? expandedGroups.has(node.fullPath) : true;
    const hasChildren = Object.keys(node.children).length > 0;
    const hasDiagrams = node.diagrams.length > 0;
    const indentSize = level * 16;
    
    // Calculate total diagrams in this node and its children
    const getTotalDiagrams = (node: TreeNode): number => {
      let total = node.diagrams.length;
      Object.values(node.children).forEach(child => {
        total += getTotalDiagrams(child);
      });
      return total;
    };
    
    const totalDiagrams = getTotalDiagrams(node);
    
    return (
      <div>
        {/* Group header for non-root groups */}
        {node.type === 'group' && node.name && (
          <div 
            className={styles.groupHeader}
            onClick={() => node.fullPath && toggleGroup(node.fullPath)}
            style={{ paddingLeft: `${indentSize}px` }}
          >
            <span className={styles.caretIcon}>
              {(hasChildren || hasDiagrams) ? (
                isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />
              ) : null}
            </span>
            <FolderOutlined className={styles.folderIcon} />
            <span className={styles.groupName}>{node.name}</span>
            <span className={styles.diagramCount}>
              {totalDiagrams} diagrama{totalDiagrams !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {/* Group content - only show when expanded */}
        {(node.type === 'root' || isExpanded) && (
          <div>
            {/* Render diagrams in this group */}
            {hasDiagrams && node.diagrams.map((diagram: Diagram) => (
              <div 
                key={diagram.id}
                className={`${styles.diagramItem} ${selectedItem?.id === diagram.id ? styles.selected : ''}`}
                onClick={() => handleSelect(diagram)}
                style={{ 
                  paddingLeft: `${indentSize + (node.type === 'group' ? 24 : 0)}px` 
                }}
              >
                <ProjectOutlined className={styles.fileIcon} />
                <div className={styles.diagramInfo}>
                  <span className={styles.diagramName}>{diagram.name}</span>
                  {diagram.description && (
                    <span className={styles.diagramDescription}>
                      {diagram.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Render child groups */}
            {hasChildren && Object.keys(node.children)
              .sort()
              .map(key => (
                <DiagramTree 
                  key={key} 
                  node={node.children[key]} 
                  level={level + (node.type === 'group' ? 1 : 0)} 
                />
              ))
            }
          </div>
        )}
      </div>
    );
  };
  
  // Get display value for selected diagram
  const getDisplayValue = () => {
    if (!selectedItem) return placeholder;
    
    return (
      <div className={styles.selectedDisplay}>
        <ProjectOutlined className={styles.selectedFileIcon} />
        <div className={styles.selectedInfo}>
          <span className={styles.selectedName}>
            {selectedItem.name}
          </span>
          {selectedItem.description && (
            <span className={styles.selectedDescription}>
              {selectedItem.description}
            </span>
          )}
        </div>
      </div>
    );
  };
  
  useEffect(() => {
    const hasDiagramsWithoutPath = diagrams.some(diagram => !diagram.path);
    if (hasDiagramsWithoutPath && companyId && environmentId) {
      updateDiagramPaths(companyId, environmentId)
        .then(updatedDiagrams => {
          // Actualizar los diagramas con los paths actualizados
          const updatedTree = buildDiagramTree(updatedDiagrams);
          setTree([updatedTree]);
        })
        .catch(error => {
          console.error('Error updating diagram paths:', error);
        });
    } else {
      const newTree = buildDiagramTree(diagrams);
      setTree([newTree]);
    }
  }, [diagrams, companyId, environmentId]);
  
  return (
    <div className={`${styles.container} ${className}`} ref={dropdownRef}>
      <div 
        className={`${styles.selector} ${isOpen ? styles.active : ''}`} 
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
            {filteredTree ? (
              <DiagramTree node={filteredTree} />
            ) : (
              <div className={styles.noResults}>No se encontraron diagramas</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}