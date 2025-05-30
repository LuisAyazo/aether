import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FolderOutlined, DatabaseOutlined, CaretDownOutlined, CaretRightOutlined, CheckCircleOutlined, PauseCircleOutlined, PlusOutlined, FolderAddOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './EnvironmentTreeSelect.module.css';
import { Environment } from '../../services/diagramService';

interface TreeNode {
  type: 'group' | 'root';
  name?: string;
  fullPath?: string;
  children: { [key: string]: TreeNode };
  environments: Environment[];
  category?: string;
}

interface EnvironmentTreeSelectProps {
  environments: Environment[];
  value?: string;
  onChange: (environmentId: string) => void;
  placeholder?: string;
  showDirectorySelector?: boolean;
  selectedDirectory?: string;
  onDirectoryChange?: (directory: string) => void;
  onCreateDirectory?: (directoryName: string) => void;
  onDeleteEnvironment?: (environmentId: string) => void;
  mode?: 'select' | 'directory';
  showDeleteButton?: boolean;
}

export default function EnvironmentTreeSelect({ 
  environments, 
  value, 
  onChange,
  placeholder = 'Selecciona un ambiente',
  showDirectorySelector = false,
  selectedDirectory,
  onDirectoryChange,
  onCreateDirectory,
  onDeleteEnvironment,
  mode = 'select',
  showDeleteButton = false
}: EnvironmentTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Environment | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showNewDirectoryInput, setShowNewDirectoryInput] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState('');
  
  // Build environment tree structure based on category/naming patterns
  const buildEnvironmentTree = (environmentItems: Environment[]): TreeNode => {
    const sortedEnvironments = [...environmentItems].sort((a, b) => {
      // First sort by category if available, then by type (development, staging, production)
      const aCategory = (a as any).category || getEnvironmentType(a.name);
      const bCategory = (b as any).category || getEnvironmentType(b.name);
      const categoryOrder = ['desarrollo', 'development', 'pruebas', 'staging', 'producción', 'production', 'otros', 'other'];
      
      const aCategoryIndex = categoryOrder.indexOf(aCategory);
      const bCategoryIndex = categoryOrder.indexOf(bCategory);
      
      if (aCategoryIndex !== bCategoryIndex) {
        return aCategoryIndex - bCategoryIndex;
      }
      
      // Then sort alphabetically within the same category/type
      return a.name.localeCompare(b.name);
    });
    
        const rootTree: TreeNode = {
      type: 'root',
      children: {},
      environments: []
    };
    
    // Group environments by category or type
    const groups: { [key: string]: Environment[] } = {
      'Desarrollo': [],
      'Pruebas': [],
      'Producción': [],
      'Otros': []
    };
    
    sortedEnvironments.forEach(environment => {
      const category = (environment as any).category;
      const type = getEnvironmentType(environment.name);
      
      // Use explicit category if available, otherwise infer from name
      if (category) {
        switch (category) {
          case 'desarrollo':
            groups['Desarrollo'].push(environment);
            break;
          case 'pruebas':
            groups['Pruebas'].push(environment);
            break;
          case 'producción':
            groups['Producción'].push(environment);
            break;
          default:
            // Handle custom categories
            if (!groups[category]) {
              groups[category] = [];
            }
            groups[category].push(environment);
        }
      } else {
        // Fallback to type-based grouping
        switch (type) {
          case 'development':
            groups['Desarrollo'].push(environment);
            break;
          case 'staging':
            groups['Pruebas'].push(environment);
            break;
          case 'production':
            groups['Producción'].push(environment);
            break;
          default:
            groups['Otros'].push(environment);
        }
      }
    });
    
    // Create tree structure - only include groups that have environments
    Object.entries(groups).forEach(([groupName, envs]) => {
      if (envs.length > 0) {
        if (envs.length === 1 && !hasMultipleEnvironments(environmentItems)) {
          // If there's only one environment total, don't group it
          rootTree.environments.push(...envs);
        } else {
          // Create group node only if it has environments
          rootTree.children[groupName] = {
            type: 'group',
            name: groupName,
            fullPath: groupName,
            children: {},
            environments: envs,
            category: getCategoryFromGroupName(groupName)
          };
        }
      }
    });
    
    return rootTree;
  };
  
  // Helper function to get category from group name
  const getCategoryFromGroupName = (groupName: string): string => {
    switch (groupName) {
      case 'Desarrollo':
        return 'desarrollo';
      case 'Pruebas':
        return 'pruebas';
      case 'Producción':
        return 'producción';
      case 'Otros':
        return 'otros';
      default:
        return groupName.toLowerCase();
    }
  };
  
  // Helper function to determine environment type from name
  const getEnvironmentType = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('dev') || lowerName.includes('desarrollo') || lowerName.includes('development')) {
      return 'development';
    }
    if (lowerName.includes('test') || lowerName.includes('staging') || lowerName.includes('prueba') || lowerName.includes('qa')) {
      return 'staging';
    }
    if (lowerName.includes('prod') || lowerName.includes('production') || lowerName.includes('producción')) {
      return 'production';
    }
    
    return 'other';
  };
  
  // Helper to check if we have multiple environments
  const hasMultipleEnvironments = (envs: Environment[]): boolean => {
    return envs.length > 3; // Group if more than 3 environments
  };

  // Get tree structure
  const treeStructure = buildEnvironmentTree(environments);

  // Set selected item based on value
  useEffect(() => {
    if (value) {
      const selectedEnvironment = environments.find(e => e.id === value);
      setSelectedItem(selectedEnvironment || null);
    } else {
      setSelectedItem(null);
    }
  }, [environments, value]);
  
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
      environments: []
    };
    
    // Filter environments at this level
    const matchingEnvironments = node.environments.filter(environment => 
      environment.name.toLowerCase().includes(lowerSearchQuery) ||
      (environment.description && environment.description.toLowerCase().includes(lowerSearchQuery))
    );
    
    filteredNode.environments = matchingEnvironments;
    
    // Filter children recursively
    let hasMatchingChildren = false;
    Object.keys(node.children).forEach(key => {
      const filteredChild = filterTreeNode(node.children[key], searchQuery);
      if (filteredChild && (filteredChild.environments.length > 0 || Object.keys(filteredChild.children).length > 0)) {
        filteredNode.children[key] = filteredChild;
        hasMatchingChildren = true;
      }
    });
    
    // Return node if it has matching content
    if (filteredNode.environments.length > 0 || hasMatchingChildren) {
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
          if (node.environments.length > 0 || Object.keys(node.children).length > 0) {
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
  
  // Select an environment
  const handleSelect = (environment: Environment) => {
    setSelectedItem(environment);
    onChange(environment.id);
    setIsOpen(false);
    setSearchText('');
  };

  // Select a directory (for directory mode)
  const handleDirectorySelect = (directory: string) => {
    if (onDirectoryChange) {
      onDirectoryChange(directory);
    }
    setIsOpen(false);
    setSearchText('');
  };

  // Handle new directory creation
  const handleCreateNewDirectory = () => {
    if (newDirectoryName.trim() && onCreateDirectory) {
      onCreateDirectory(newDirectoryName.trim());
      setNewDirectoryName('');
      setShowNewDirectoryInput(false);
      setIsOpen(false);
    }
  };

  // Cancel new directory creation
  const handleCancelNewDirectory = () => {
    setNewDirectoryName('');
    setShowNewDirectoryInput(false);
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

  // Get environment status icon
  const getEnvironmentStatusIcon = (environment: Environment) => {
    return environment.is_active ? (
      <CheckCircleOutlined className={styles.activeIcon} />
    ) : (
      <PauseCircleOutlined className={styles.inactiveIcon} />
    );
  };

  // Get environment type color class
  const getEnvironmentTypeClass = (environment: Environment): string => {
    const type = getEnvironmentType(environment.name);
    switch (type) {
      case 'development':
        return styles.developmentEnv;
      case 'staging':
        return styles.stagingEnv;
      case 'production':
        return styles.productionEnv;
      default:
        return styles.otherEnv;
    }
  };

  // Recursive component for environment tree rendering
  const EnvironmentTree = ({ node, level = 0 }: { node: TreeNode, level?: number }) => {
    if (!node) return null;
    
    const isExpanded = node.fullPath ? expandedGroups.has(node.fullPath) : true;
    const hasChildren = Object.keys(node.children).length > 0;
    const hasEnvironments = node.environments.length > 0;
    const indentSize = level * 16;
    const isDirectoryMode = mode === 'directory';
    const isSelected = isDirectoryMode && selectedDirectory === node.category;
    
    return (
      <div>
        {/* Group header for non-root groups */}
        {node.type === 'group' && node.name && (
          <div 
            className={`${styles.groupHeader} ${isDirectoryMode ? styles.selectableDirectory : ''} ${isSelected ? styles.selectedDirectory : ''}`}
            onClick={() => {
              if (isDirectoryMode) {
                handleDirectorySelect(node.category || node.name || '');
              } else {
                node.fullPath && toggleGroup(node.fullPath);
              }
            }}
            style={{ paddingLeft: `${indentSize}px` }}
          >
            <span className={styles.caretIcon}>
              {!isDirectoryMode && (hasChildren || hasEnvironments) ? (
                isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />
              ) : null}
            </span>
            <FolderOutlined className={styles.folderIcon} />
            <span className={styles.groupName}>{node.name}</span>
            <span className={styles.environmentCount}>
              {node.environments.length} ambiente{node.environments.length !== 1 ? 's' : ''}
            </span>
            {isSelected && (
              <CheckCircleOutlined className={styles.selectedIcon} />
            )}
          </div>
        )}
        
        {/* Group content - only show when expanded (not in directory mode) */}
        {!isDirectoryMode && (node.type === 'root' || isExpanded) && (
          <div>
            {/* Render environments in this group */}
            {hasEnvironments && node.environments.map((environment: Environment) => (
              <div 
                key={environment.id}
                className={`${styles.environmentItem} ${getEnvironmentTypeClass(environment)} ${selectedItem?.id === environment.id ? styles.selected : ''}`}
                onClick={() => handleSelect(environment)}
                style={{ 
                  paddingLeft: `${indentSize + (node.type === 'group' ? 24 : 0)}px` 
                }}
              >
                <DatabaseOutlined className={styles.databaseIcon} />
                <div className={styles.environmentInfo}>
                  <span className={styles.environmentName}>{environment.name}</span>
                  {environment.description && (
                    <span className={styles.environmentDescription}>
                      {environment.description}
                    </span>
                  )}
                </div>
                <div className={styles.environmentMeta}>
                  <span className={styles.diagramCount}>
                    {environment.diagrams?.length || 0} diagrama{(environment.diagrams?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  {getEnvironmentStatusIcon(environment)}
                  {showDeleteButton && onDeleteEnvironment && (
                    <DeleteOutlined 
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEnvironment(environment.id);
                      }}
                      title="Eliminar ambiente"
                    />
                  )}
                </div>
              </div>
            ))}
            
            {/* Render child groups */}
            {hasChildren && Object.keys(node.children)
              .sort()
              .map(key => (
                <EnvironmentTree 
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
  
  // Get display value for selected environment or directory
  const getDisplayValue = () => {
    if (mode === 'directory') {
      if (!selectedDirectory) return placeholder;
      
      // Find the display name for the selected directory
      const getDirectoryDisplayName = (category: string) => {
        switch (category) {
          case 'desarrollo':
            return 'Desarrollo';
          case 'pruebas':
            return 'Pruebas';
          case 'producción':
            return 'Producción';
          case 'otros':
            return 'Otros';
          default:
            return category.charAt(0).toUpperCase() + category.slice(1);
        }
      };

      return (
        <div className={styles.selectedDisplay}>
          <FolderOutlined className={styles.selectedFolderIcon} />
          <div className={styles.selectedInfo}>
            <span className={styles.selectedDirectoryName}>
              {getDirectoryDisplayName(selectedDirectory)}
            </span>
            <span className={styles.selectedDescription}>
              Directorio seleccionado
            </span>
          </div>
        </div>
      );
    }

    if (!selectedItem) return placeholder;
    
    const typeClass = getEnvironmentTypeClass(selectedItem);
    
    return (
      <div className={styles.selectedDisplay}>
        <DatabaseOutlined className={styles.selectedDatabaseIcon} />
        <div className={styles.selectedInfo}>
          <span className={`${styles.selectedName} ${typeClass}`}>
            {selectedItem.name}
          </span>
          {selectedItem.description && (
            <span className={styles.selectedDescription}>
              {selectedItem.description}
            </span>
          )}
        </div>
        <div className={styles.selectedMeta}>
          {getEnvironmentStatusIcon(selectedItem)}
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.container} ref={dropdownRef}>
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
              placeholder={mode === 'directory' ? 'Buscar directorios...' : 'Buscar ambientes...'}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.searchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Directory creation section for directory mode */}
          {mode === 'directory' && onCreateDirectory && (
            <div className={styles.directoryActions}>
              {!showNewDirectoryInput ? (
                <div 
                  className={styles.createDirectoryButton}
                  onClick={() => setShowNewDirectoryInput(true)}
                >
                  <FolderAddOutlined className={styles.addIcon} />
                  <span>Crear nuevo directorio</span>
                </div>
              ) : (
                <div className={styles.newDirectoryForm}>
                  <input
                    type="text"
                    placeholder="Nombre del directorio"
                    value={newDirectoryName}
                    onChange={(e) => setNewDirectoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateNewDirectory();
                      } else if (e.key === 'Escape') {
                        handleCancelNewDirectory();
                      }
                    }}
                    className={styles.newDirectoryInput}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <div className={styles.newDirectoryButtons}>
                    <button 
                      className={styles.confirmButton}
                      onClick={handleCreateNewDirectory}
                      disabled={!newDirectoryName.trim()}
                    >
                      Crear
                    </button>
                    <button 
                      className={styles.cancelButton}
                      onClick={handleCancelNewDirectory}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className={styles.treeContainer}>
            {filteredTree ? (
              <EnvironmentTree node={filteredTree} />
            ) : (
              <div className={styles.noResults}>
                {mode === 'directory' ? 'No se encontraron directorios' : 'No se encontraron ambientes'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
