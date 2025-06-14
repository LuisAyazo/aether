import React, { useState, useRef, useEffect, KeyboardEvent, MouseEvent, useMemo } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { FolderOutlined, DatabaseOutlined, CaretDownOutlined, CaretRightOutlined, CheckCircleOutlined, PauseCircleOutlined, PlusOutlined, FolderAddOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './EnvironmentTreeSelect.module.css';
import { Environment } from '../../services/diagramService';

interface TreeNode {
  type: 'group' | 'root';
  name?: string;
  fullPath: string;
  children: { [key: string]: TreeNode };
  environments: Environment[];
}

interface EnvironmentTreeSelectProps {
  environments: Environment[];
  value?: string;
  onChange: (environmentId: string) => void;
  placeholder?: string;
  selectedDirectory?: string;
  onDirectoryChange?: (directoryPath: string) => void;
  onCreateDirectory?: (fullDirectoryPath: string) => void;
  onDeleteEnvironment?: (environmentId: string) => void;
  mode?: 'select' | 'directory';
  showDeleteButton?: boolean;
  className?: string;
}

export default function EnvironmentTreeSelect({
  environments,
  value,
  onChange,
  placeholder = 'Selecciona un ambiente',
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
  const selectorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<Environment | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['']));
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const [showNewDirectoryInputForPath, setShowNewDirectoryInputForPath] = useState<string | null>(null);
  const [newDirectoryName, setNewDirectoryName] = useState('');

  const buildEnvironmentTree = (environmentItems: Environment[]): TreeNode => {
    const root: TreeNode = { type: 'root', fullPath: '', children: {}, environments: [] };

    environmentItems.forEach(env => {
      const path = env.path || '';
      const parts = path.split('/').filter(p => p);
      
      if (parts.length === 0) {
        root.environments.push(env);
        return;
      }

      let currentNode = root;
      let currentPath = '';
      parts.forEach(part => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!currentNode.children[part]) {
          currentNode.children[part] = {
            type: 'group',
            name: part,
            fullPath: currentPath,
            children: {},
            environments: []
          };
        }
        currentNode = currentNode.children[part];
      });
      currentNode.environments.push(env);
    });

    return root;
  };

  const treeStructure = useMemo(() => buildEnvironmentTree(environments), [environments]);

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
  }, [value, mode, treeStructure]);

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

  const filteredTree = useMemo(() => filterTreeNode(treeStructure, searchText), [treeStructure, searchText]);

  useEffect(() => {
    if (searchText && filteredTree) {
      const newExpandedPaths = new Set<string>(['']);
      const expandMatching = (node: TreeNode, _currentPath: string) => {
        if (node.environments.length > 0 && node.fullPath !== '') {
           newExpandedPaths.add(node.fullPath);
        }
        Object.values(node.children).forEach(child => {
          if (child.fullPath) {
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
      if (filteredTree) expandMatching(filteredTree, '');
      setExpandedGroups(newExpandedPaths);
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
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewDirectoryInputForPath(null);
        setNewDirectoryName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && selectorRef.current) {
      const rect = selectorRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  const getEnvironmentStatusIcon = (environment: Environment) => {
    return environment.is_active ? (
      <CheckCircleOutlined className="text-green-500" />
    ) : (
      <PauseCircleOutlined className="text-gray-400" />
    );
  };

  const countEnvironmentsInNode = (node: TreeNode): number => {
    let count = node.environments.length;
    Object.values(node.children).forEach(child => {
      count += countEnvironmentsInNode(child);
    });
    return count;
  };

  const EnvironmentTreeRecursive = ({ node, level = 0 }: { node: TreeNode, level?: number }) => {
    if (!node) return null;
    const isExpanded = node.fullPath !== '' ? expandedGroups.has(node.fullPath) : true;
    const indentSize = level * 16;

    return (
      <>
        {node.type === 'group' && node.name && (
          <div
            className={`${styles.groupHeader} ${mode === 'directory' && selectedDirectory === node.fullPath ? styles.selectedDirectory : ''} bg-yellow-50 dark:bg-yellow-700/30 hover:bg-yellow-100 dark:hover:bg-yellow-600/40`}
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
            <FolderOutlined className={`${styles.folderIcon} text-yellow-600 dark:text-yellow-500`} />
            <span className={styles.groupName}>{node.name}</span>
            <span className={styles.environmentCount}>
              ({countEnvironmentsInNode(node)} Amb.)
            </span>
            {mode === 'directory' && onCreateDirectory && (
              <Tooltip title="Crear subdirectorio aquí">
                <PlusOutlined className={styles.addDirectoryIcon} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowNewDirectoryInputForPath(node.fullPath); setNewDirectoryName(''); }} />
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
                <DatabaseOutlined className="text-gray-400 mr-2" />
                <div className="flex flex-col overflow-hidden flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate block">{env.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                      ({env.diagrams?.length || 0} Diag.)
                    </span>
                  </div>
                  {env.description && <span className="text-xs text-gray-500 dark:text-gray-400 truncate block mt-0.5">{env.description}</span>}
                </div>
                <div className="ml-auto pl-2 shrink-0 flex items-center">
                  {getEnvironmentStatusIcon(env)}
                  {showDeleteButton && onDeleteEnvironment && (
                    <Tooltip title="Eliminar ambiente">
                      <DeleteOutlined
                        className="text-gray-400 hover:text-red-500 ml-3 cursor-pointer"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteEnvironment(env.id); }}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
            {Object.values(node.children).sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(childNode => (
              <EnvironmentTreeRecursive key={childNode.fullPath} node={childNode} level={level + 1} />
            ))}
            {showNewDirectoryInputForPath === node.fullPath && onCreateDirectory && (
              <div style={{ paddingLeft: `${indentSize + (node.type === 'group' ? 24 : 0)}px` }} className="flex items-center gap-2 p-1">
                <Input
                  size="small"
                  placeholder="Nombre de subdirectorio"
                  value={newDirectoryName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDirectoryName(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleCreateNewDirectorySubmit(node.fullPath); if (e.key === 'Escape') setShowNewDirectoryInputForPath(null);}}
                  onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                  autoFocus
                  className="flex-grow"
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
        <div className="flex items-center"><FolderOutlined className="mr-2 text-gray-500" />{selectedDirectory}</div> :
        <span className="text-gray-400">{placeholder}</span>;
    }
    if (!selectedItem) return <span className="text-gray-400">{placeholder}</span>;
    return (
      <div className="flex items-center w-full text-left">
        <DatabaseOutlined className="text-gray-500 dark:text-gray-400 mr-2 shrink-0" />
        <div className="flex flex-col overflow-hidden flex-grow">
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate block">{selectedItem.name}</span>
          {selectedItem.description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{selectedItem.description}</span>
          )}
          {!selectedItem.description && selectedItem.path && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">Ruta: {selectedItem.path}</span>
          )}
        </div>
        <div className="ml-auto pl-2 shrink-0">{getEnvironmentStatusIcon(selectedItem)}</div>
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div
        ref={selectorRef}
        className={`${styles.selector} ${isOpen ? styles.active : ''} flex items-center`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {getDisplayValue()}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{
            position: 'fixed',
            zIndex: 999999,
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
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
          {mode === 'directory' && onCreateDirectory && !searchText && (
             <div
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-600 dark:text-gray-300"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowNewDirectoryInputForPath(''); setNewDirectoryName(''); }}
              >
                <FolderAddOutlined className="mr-2" />
                <span>Crear Directorio Raíz</span>
            </div>
          )}
          <div className={styles.treeContainer}>
            {filteredTree && (Object.keys(filteredTree.children).length > 0 || filteredTree.environments.length > 0) ? (
              <EnvironmentTreeRecursive node={filteredTree} />
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchText ? (mode === 'directory' ? 'No se encontraron directorios' : 'No se encontraron ambientes') : (mode === 'directory' ? 'No hay directorios. Crea uno.' : 'No hay ambientes. Crea uno.')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
