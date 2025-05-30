import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { FolderOutlined, DatabaseOutlined, CaretDownOutlined, CaretRightOutlined, CheckCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import styles from './EnvironmentTreeSelect.module.css';
import { Environment } from '../../services/diagramService';

interface TreeNode {
  type: 'group' | 'root';
  name?: string;
  fullPath?: string;
  children: { [key: string]: TreeNode };
  environments: Environment[];
}

interface EnvironmentTreeSelectProps {
  environments: Environment[];
  value?: string;
  onChange: (environmentId: string) => void;
  placeholder?: string;
}

export default function EnvironmentTreeSelect({ 
  environments, 
  value, 
  onChange,
  placeholder = 'Selecciona un ambiente'
}: EnvironmentTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Environment | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Build environment tree structure based on naming patterns
  const buildEnvironmentTree = (environmentItems: Environment[]): TreeNode => {
    const sortedEnvironments = [...environmentItems].sort((a, b) => {
      // First sort by type (development, staging, production)
      const aType = getEnvironmentType(a.name);
      const bType = getEnvironmentType(b.name);
      const typeOrder = ['development', 'staging', 'production', 'other'];
      
      const aTypeIndex = typeOrder.indexOf(aType);
      const bTypeIndex = typeOrder.indexOf(bType);
      
      if (aTypeIndex !== bTypeIndex) {
        return aTypeIndex - bTypeIndex;
      }
      
      // Then sort alphabetically within the same type
      return a.name.localeCompare(b.name);
    });
    
    const rootTree: TreeNode = {
      type: 'root',
      children: {},
      environments: []
    };
    
    // Group environments by type
    const groups: { [key: string]: Environment[] } = {
      'Desarrollo': [],
      'Pruebas': [],
      'Producción': [],
      'Otros': []
    };
    
    sortedEnvironments.forEach(environment => {
      const type = getEnvironmentType(environment.name);
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
    });
    
    // Create tree structure
    Object.entries(groups).forEach(([groupName, envs]) => {
      if (envs.length > 0) {
        if (envs.length === 1 && !hasMultipleEnvironments(environmentItems)) {
          // If there's only one environment total, don't group it
          rootTree.environments.push(...envs);
        } else {
          // Create group node
          rootTree.children[groupName] = {
            type: 'group',
            name: groupName,
            fullPath: groupName,
            children: {},
            environments: envs
          };
        }
      }
    });
    
    return rootTree;
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
              {(hasChildren || hasEnvironments) ? (
                isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />
              ) : null}
            </span>
            <FolderOutlined className={styles.folderIcon} />
            <span className={styles.groupName}>{node.name}</span>
            <span className={styles.environmentCount}>
              {node.environments.length} ambiente{node.environments.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {/* Group content - only show when expanded */}
        {(node.type === 'root' || isExpanded) && (
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
  
  // Get display value for selected environment
  const getDisplayValue = () => {
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
              placeholder="Buscar ambientes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.searchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className={styles.treeContainer}>
            {filteredTree ? (
              <EnvironmentTree node={filteredTree} />
            ) : (
              <div className={styles.noResults}>No se encontraron ambientes</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
