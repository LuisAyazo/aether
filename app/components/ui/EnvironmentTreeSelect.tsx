 import React, { useState, useRef, useEffect, KeyboardEvent, MouseEvent } from 'react'; // MouseEvent ya estaba, correcto.
import { Input, Button, Tooltip } from 'antd'; // Modal eliminado
import { FolderOutlined, DatabaseOutlined, CaretDownOutlined, CaretRightOutlined, CheckCircleOutlined, PauseCircleOutlined, PlusOutlined, FolderAddOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './EnvironmentTreeSelect.module.css'; 
import { Environment } from '../../services/diagramService'; 

interface TreeNode {
  type: 'group' | 'root'; // 'group' para directorios
  name?: string; // Nombre del directorio
  fullPath: string; // Ruta completa del directorio, '' para la raíz
  children: { [key: string]: TreeNode }; // Subdirectorios
  environments: Environment[]; // Ambientes en este nodo/directorio
}

interface EnvironmentTreeSelectProps {
  environments: Environment[];
  value?: string; // ID del ambiente seleccionado
  onChange: (environmentId: string) => void;
  placeholder?: string;
  // Props para el modo de selección de directorio (si se mantiene)
  showDirectorySelector?: boolean; // Podría volverse obsoleto si el modo maneja esto
  selectedDirectory?: string; // Ruta del directorio seleccionado
  onDirectoryChange?: (directoryPath: string) => void;
  onCreateDirectory?: (fullDirectoryPath: string) => void; // Para crear nuevos directorios
  onDeleteEnvironment?: (environmentId: string) => void;
  mode?: 'select' | 'directory'; // 'select' para seleccionar ambientes, 'directory' para seleccionar directorios
  showDeleteButton?: boolean;
  className?: string;
}

export default function EnvironmentTreeSelect({ 
  environments, 
  value, 
  onChange,
  placeholder = 'Selecciona un ambiente',
  // showDirectorySelector = false, // Considerar si se necesita con el nuevo modo
  selectedDirectory,
  onDirectoryChange,
  onCreateDirectory,
  onDeleteEnvironment,
  mode = 'select',
  showDeleteButton = false,
  className = ''
}: EnvironmentTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Environment | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([''])); // Expandir raíz por defecto
  
  // Estado para la creación de nuevos directorios
  const [showNewDirectoryInputForPath, setShowNewDirectoryInputForPath] = useState<string | null>(null);
  const [newDirectoryName, setNewDirectoryName] = useState('');

  const buildEnvironmentTree = (environmentItems: Environment[]): TreeNode => {
    const sortedEnvironments = [...environmentItems].sort((a, b) => {
      const pathA = a.path || '';
      const pathB = b.path || '';
      if (pathA !== pathB) {
        return pathA.localeCompare(pathB);
      }
      return a.name.localeCompare(b.name);
    });

    const rootTree: TreeNode = { type: 'root', fullPath: '', children: {}, environments: [] };
    
    // Paso 1: Agrupar ambientes por el primer segmento de su path, o en una categoría raíz.
    const groups: { [key: string]: Environment[] } = {};
    const rootEnvironments: Environment[] = [];

    sortedEnvironments.forEach(env => {
      const path = env.path?.trim() || '';
      if (!path) {
        rootEnvironments.push(env);
      } else {
        const pathParts = path.split('/');
        const groupName = pathParts[0];
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(env);
      }
    });

    // Añadir ambientes sin ruta directamente a la raíz
    rootTree.environments.push(...rootEnvironments);

    // Paso 2: Crear la estructura de árbol para los grupos
    Object.entries(groups).forEach(([groupName, envsInGroup]) => {
      if (envsInGroup.length > 0) {
        const groupNode: TreeNode = {
          type: 'group',
          name: groupName,
          fullPath: groupName, // Ruta del grupo principal
          children: {},
          environments: []
        };

        envsInGroup.forEach(env => {
          const path = env.path?.trim() || ''; // Sabemos que path existe aquí
          const pathParts = path.split('/');

          if (pathParts.length > 1) { // Si hay subdirectorios dentro de este grupo principal
            let currentNode = groupNode;
            // Iterar desde el segundo segmento para construir sub-jerarquía
            for (let i = 1; i < pathParts.length; i++) {
              const segmentName = pathParts[i];
              // Construir la ruta completa del subdirectorio
              const subPath = pathParts.slice(0, i + 1).join('/');
              
              if (!currentNode.children[segmentName]) {
                currentNode.children[segmentName] = {
                  type: 'group',
                  name: segmentName,
                  fullPath: subPath,
                  children: {},
                  environments: []
                };
              }
              currentNode = currentNode.children[segmentName];
            }
            currentNode.environments.push(env); // Añadir ambiente al nodo hoja del subdirectorio
          } else {
            // No hay subdirectorios, añadir directamente al grupo principal
            groupNode.environments.push(env);
          }
        });
        rootTree.children[groupName] = groupNode;
      }
    });
    return rootTree;
  };
  
  const treeStructure = buildEnvironmentTree(environments);

  useEffect(() => {
    if (value && mode === 'select') {
      const findEnv = (items: Environment[]): Environment | null => items.find(e => e.id === value) || null;
      
      const searchInNode = (node: TreeNode): Environment | null => {
        let found = findEnv(node.environments);
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
  }, [environments, value, mode, treeStructure]);

  const filterTreeNode = (node: TreeNode, searchQuery: string): TreeNode | null => {
    if (!searchQuery) return node;
    const lowerSearchQuery = searchQuery.toLowerCase();

    const environments = node.environments.filter(env =>
      env.name.toLowerCase().includes(lowerSearchQuery) ||
      (env.description && env.description.toLowerCase().includes(lowerSearchQuery))
    );

    const children: { [key: string]: TreeNode } = {};
    let hasMatchingChildren = false;
    Object.entries(node.children).forEach(([key, childNode]) => {
      const filteredChild = filterTreeNode(childNode, searchQuery);
      if (filteredChild) {
        children[key] = filteredChild;
        hasMatchingChildren = true;
      }
    });

    if (environments.length > 0 || hasMatchingChildren) {
      return { ...node, environments, children };
    }
    return null;
  };

  const filteredTree = filterTreeNode(treeStructure, searchText);

  useEffect(() => {
    if (searchText && filteredTree) {
      const newExpandedPaths = new Set<string>(['']); // Siempre expandir la raíz
      const expandMatching = (node: TreeNode, currentPath: string) => {
        if (node.environments.length > 0 && node.fullPath !== '') {
           newExpandedPaths.add(node.fullPath);
        }
        Object.values(node.children).forEach(child => {
          if (child.fullPath) { // Solo si es un nodo de grupo (directorio)
            const childContainsMatches = (n: TreeNode): boolean => {
                if (n.environments.length > 0) return true;
                return Object.values(n.children).some(c => childContainsMatches(c));
            };
            if (childContainsMatches(child)) {
                newExpandedPaths.add(child.fullPath);
            }
            expandMatching(child, child.fullPath);
          }
        });
      };
      expandMatching(filteredTree, '');
      setExpandedGroups(newExpandedPaths);
    } else if (!searchText) {
      // Opcional: colapsar todo excepto la raíz cuando se borra la búsqueda
      // setExpandedGroups(new Set([''])); 
    }
  }, [searchText, filteredTree]);

  const handleSelectEnvironment = (environment: Environment) => {
    if (mode === 'select') {
      setSelectedItem(environment);
      onChange(environment.id);
      setIsOpen(false);
      setSearchText('');
    }
  };

  const handleSelectDirectory = (path: string) => {
    if (mode === 'directory' && onDirectoryChange) {
      onDirectoryChange(path);
      setIsOpen(false);
      setSearchText('');
    }
  };
  
  const handleCreateNewDirectorySubmit = (parentPath: string) => {
    if (newDirectoryName.trim() && onCreateDirectory) {
      const fullPath = parentPath ? `${parentPath}/${newDirectoryName.trim()}` : newDirectoryName.trim();
      onCreateDirectory(fullPath);
      setNewDirectoryName('');
      setShowNewDirectoryInputForPath(null);
      // No cerrar el dropdown principal aquí, permitir más acciones
    }
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
    const handleClickOutside = (event: globalThis.MouseEvent) => { // Usar globalThis.MouseEvent
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewDirectoryInputForPath(null);
        setNewDirectoryName('');
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
  
  const getEnvironmentStatusIcon = (environment: Environment) => {
    return environment.is_active ? (
      <CheckCircleOutlined className={styles.activeIcon} />
    ) : (
      <PauseCircleOutlined className={styles.inactiveIcon} />
    );
  };

  // Helper para contar ambientes en un nodo y sus hijos
  const countEnvironmentsInNode = (node: TreeNode): number => {
    let count = node.environments.length;
    Object.values(node.children).forEach(child => {
      count += countEnvironmentsInNode(child);
    });
    return count;
  };

  const EnvironmentTreeRecursive = ({ node, level = 0 }: { node: TreeNode, level?: number }) => {
    if (!node) return null;
    const isExpanded = node.fullPath !== '' ? expandedGroups.has(node.fullPath) : true; // Raíz siempre expandida conceptualmente
    const indentSize = level * 16; // Ajustado para coincidir con DiagramTreeSelect

    return (
      <>
        {node.type === 'group' && node.name && (
          <div 
            className={`${styles.groupHeader} ${mode === 'directory' && selectedDirectory === node.fullPath ? styles.selectedDirectory : ''}`}
            style={{ paddingLeft: `${indentSize}px` }}
            onClick={(e) => {
              e.stopPropagation();
              if (mode === 'directory') {
                handleSelectDirectory(node.fullPath);
              } else {
                toggleGroup(node.fullPath);
              }
            }}
          >
            <span className={styles.caretIcon} onClick={(e) => { e.stopPropagation(); toggleGroup(node.fullPath); }}>
              {Object.keys(node.children).length > 0 || node.environments.length > 0 ? (isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />) : <span style={{display: 'inline-block', width: '14px'}} />}
            </span>
            <FolderOutlined className={styles.folderIcon} />
            <span className={styles.groupName}>{node.name}</span>
            <span className={styles.environmentCount}>
              ({countEnvironmentsInNode(node)})
            </span>
            {mode === 'directory' && onCreateDirectory && (
              <Tooltip title="Crear subdirectorio aquí">
                <PlusOutlined className={styles.addDirectoryIcon} onClick={(e) => { e.stopPropagation(); setShowNewDirectoryInputForPath(node.fullPath); setNewDirectoryName(''); }} />
              </Tooltip>
            )}
          </div>
        )}

        {(isExpanded || node.type === 'root') && (
          <>
            {node.environments.map(env => (
              <div
                key={env.id}
                className={`${styles.environmentItem} ${selectedItem?.id === env.id && mode === 'select' ? styles.selected : ''}`}
                style={{ paddingLeft: `${indentSize + (node.type === 'group' ? 24 : 0)}px` }}
                onClick={() => handleSelectEnvironment(env)}
              >
                <DatabaseOutlined className={styles.databaseIcon} />
                <div className={styles.environmentInfo}>
                  <span className={styles.environmentName}>{env.name}</span>
                  {env.description && <span className={styles.environmentDescription}>{env.description}</span>}
                </div>
                <div className={styles.environmentMeta}>
                  {getEnvironmentStatusIcon(env)}
                  {showDeleteButton && onDeleteEnvironment && (
                    <DeleteOutlined 
                      className={styles.deleteButton}
                      onClick={(e) => { e.stopPropagation(); onDeleteEnvironment(env.id); }}
                      title="Eliminar ambiente"
                    />
                  )}
                </div>
              </div>
            ))}
            {Object.values(node.children).sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(childNode => (
              <EnvironmentTreeRecursive key={childNode.fullPath} node={childNode} level={level + 1} />
            ))}
            {showNewDirectoryInputForPath === node.fullPath && onCreateDirectory && (
              <div style={{ paddingLeft: `${indentSize + (node.type === 'group' ? 24 : 0)}px` }} className={styles.newDirectoryFormInline}>
                <Input
                  size="small"
                  placeholder="Nombre de subdirectorio"
                  value={newDirectoryName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDirectoryName(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleCreateNewDirectorySubmit(node.fullPath); if (e.key === 'Escape') setShowNewDirectoryInputForPath(null);}}
                  onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                  autoFocus
                />
                <Button size="small" type="primary" onClick={() => handleCreateNewDirectorySubmit(node.fullPath)} disabled={!newDirectoryName.trim()}>Crear</Button>
                <Button size="small" onClick={() => setShowNewDirectoryInputForPath(null)}>Cancelar</Button>
              </div>
            )}
          </>
        )}
      </>
    );
  };
  
  const getDisplayValue = () => {
    if (mode === 'directory') {
      return selectedDirectory ? 
        <><FolderOutlined style={{marginRight: '8px'}} />{selectedDirectory}</> : 
        placeholder;
    }
    if (!selectedItem) return placeholder;
    return (
      <div className={styles.selectedDisplay}>
        <DatabaseOutlined className={styles.selectedDatabaseIcon} />
        <div className={styles.selectedInfo}>
          <span className={styles.selectedName}>{selectedItem.name}</span>
          {selectedItem.path && <span className={styles.selectedPath}>{selectedItem.path}</span>}
        </div>
        {getEnvironmentStatusIcon(selectedItem)}
      </div>
    );
  };

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
              placeholder={mode === 'directory' ? "Buscar o crear directorios..." : "Buscar ambientes..."}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.searchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {mode === 'directory' && onCreateDirectory && !searchText && ( // Solo mostrar si no hay búsqueda activa
             <div 
                className={styles.createDirectoryButton}
                onClick={(e) => { e.stopPropagation(); setShowNewDirectoryInputForPath(''); setNewDirectoryName(''); }}
              >
                <FolderAddOutlined className={styles.addIcon} />
                <span>Crear Directorio Raíz</span>
            </div>
          )}
          <div className={styles.treeContainer}>
            {filteredTree && (Object.keys(filteredTree.children).length > 0 || filteredTree.environments.length > 0) ? (
              <EnvironmentTreeRecursive node={filteredTree} />
            ) : (
              <div className={styles.noResults}>
                {searchText ? (mode === 'directory' ? 'No se encontraron directorios' : 'No se encontraron ambientes') : (mode === 'directory' ? 'No hay directorios. Crea uno.' : 'No hay ambientes. Crea uno.')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
