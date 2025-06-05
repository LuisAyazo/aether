'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDiagramsByEnvironment, getEnvironments, createEnvironment, deleteDiagram, Environment, Diagram } from '../../../../services/diagramService'; // Corregido
import { isAuthenticated } from '../../../../services/authService'; // Corregido
import { Modal, Input } from 'antd';
import EnvironmentCategorySelect from '../../../../components/ui/EnvironmentCategorySelect'; // Corregido
const { TextArea } = Input;

export default function DiagramsListPage() {
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [error, setError] = useState('');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [selectedEnvironmentName, setSelectedEnvironmentName] = useState<string>('');
  const [newEnvironmentModalVisible, setNewEnvironmentModalVisible] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [newEnvironmentDescription, setNewEnvironmentDescription] = useState('');
  const [newEnvironmentCategory, setNewEnvironmentCategory] = useState<string>('desarrollo');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState<Diagram | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params?.companyId as string;
  const environmentIdParam = searchParams.get('environmentId');
  const envParam = searchParams.get('env');
  
  // Verificación de autenticación
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);
  
  // Cargar ambientes y diagramas
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');
        
        // Cargar ambientes
        const environmentsData = await getEnvironments(companyId);
        setEnvironments(environmentsData);
        
        // Seleccionar el ambiente por defecto o el especificado por URL
        let targetEnvironmentId = '';
        
        if (environmentIdParam && environmentsData.some(env => env.id === environmentIdParam)) {
          targetEnvironmentId = environmentIdParam;
        } else if (environmentsData.length > 0) {
          targetEnvironmentId = environmentsData[0].id;
        }
        
        if (targetEnvironmentId) {
          setSelectedEnvironmentId(targetEnvironmentId);
          const selectedEnv = environmentsData.find(env => env.id === targetEnvironmentId);
          if (selectedEnv) {
            setSelectedEnvironmentName(selectedEnv.name);
          }
          
          // Cargar diagramas del ambiente seleccionado
          const diagramsData = await getDiagramsByEnvironment(companyId, targetEnvironmentId);
          setDiagrams(diagramsData);
        }
      } catch (err: any) {
        console.error("Error al cargar datos:", err);
        setError(err.message || 'Error al cargar datos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
    
    if (companyId) {
      loadData();
    }
  }, [companyId, environmentIdParam, router]);
  
  // Cambiar de ambiente
  const handleEnvironmentChange = async (environmentId: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Actualizar el ambiente seleccionado
      setSelectedEnvironmentId(environmentId);
      const selectedEnv = environments.find(env => env.id === environmentId);
      if (selectedEnv) {
        setSelectedEnvironmentName(selectedEnv.name);
        
        // Cargar diagramas del nuevo ambiente
        const diagramsData = await getDiagramsByEnvironment(companyId, environmentId);
        setDiagrams(diagramsData);
        
        // Actualizar la URL sin recargar la página
        const envSlug = selectedEnv.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        router.push(`/company/${companyId}/diagrams?environmentId=${environmentId}&env=${envSlug}`);
      }
    } catch (err: any) {
      console.error("Error al cambiar de ambiente:", err);
      setError(err.message || 'Error al cargar datos del ambiente. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToDiagram = (diagram: Diagram) => {
    const selectedEnv = environments.find(env => env.id === selectedEnvironmentId);
    if (!selectedEnv) return;
    
    const envSlug = selectedEnv.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    const diagramSlug = diagram.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    router.push(`/company/${companyId}/diagrams/${diagram.id}?environmentId=${selectedEnvironmentId}&env=${envSlug}&diagram=${diagramSlug}`);
  };
  
  const handleCreateEnvironment = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Crear nuevo ambiente
      const newEnvironment = await createEnvironment(companyId, {
        name: newEnvironmentName,
        description: newEnvironmentDescription,
        category: newEnvironmentCategory
      });
      
      if (newEnvironment) {
        setEnvironments([...environments, newEnvironment]);
        setSelectedEnvironmentId(newEnvironment.id);
        setSelectedEnvironmentName(newEnvironment.name);
        
        // Cargar diagramas del nuevo ambiente
        const diagramsData = await getDiagramsByEnvironment(companyId, newEnvironment.id);
        setDiagrams(diagramsData);
        
        // Actualizar la URL sin recargar la página
        const envSlug = newEnvironment.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        router.push(`/company/${companyId}/diagrams?environmentId=${newEnvironment.id}&env=${envSlug}`);
        
        // Reset form fields on success
        setNewEnvironmentName('');
        setNewEnvironmentDescription('');
        setNewEnvironmentCategory('desarrollo');
      }
    } catch (err: any) {
      console.error("Error al crear nuevo ambiente:", err);
      setError(err.message || 'Error al crear nuevo ambiente. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
      setNewEnvironmentModalVisible(false);
    }
  };
  
  const handleDeleteDiagram = async () => {
    if (!diagramToDelete) return;
    
    try {
      setLoading(true);
      setError('');
      
      await deleteDiagram(companyId, selectedEnvironmentId, diagramToDelete.id);
      
      // Remove the deleted diagram from the list
      setDiagrams(diagrams.filter(d => d.id !== diagramToDelete.id));
      
      setDeleteConfirmVisible(false);
      setDiagramToDelete(null);
    } catch (err: any) {
      console.error("Error al eliminar diagrama:", err);
      setError(err.message || 'Error al eliminar diagrama. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDeleteDiagram = (diagram: Diagram) => {
    setDiagramToDelete(diagram);
    setDeleteConfirmVisible(true);
  };

  // Group diagrams by path for organized display
  const groupDiagramsByPath = (diagrams: Diagram[]) => {
    const grouped: Record<string, Diagram[]> = {};
    
    diagrams.forEach(diagram => {
      const path = diagram.path || 'Root';
      if (!grouped[path]) {
        grouped[path] = [];
      }
      grouped[path].push(diagram);
    });
    
    return grouped;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                  Aether
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href={`/company/${companyId}`}
                className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Volver a la compañía
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Diagramas
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Visualiza y gestiona tus diagramas de arquitectura por ambiente.
              </p>
              
              {environments.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ambientes</h4>
                  <ul className="mt-2 space-y-2">
                    {environments.map((env) => (
                      <li key={env.id}>
                        <button
                          onClick={() => handleEnvironmentChange(env.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                            env.id === selectedEnvironmentId
                              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {env.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-8">
                <button
                  onClick={() => setNewEnvironmentModalVisible(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none mb-4"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Nuevo Ambiente
                </button>
                <Link
                  href={`/company/${companyId}/diagrams/create${selectedEnvironmentId ? `?environmentId=${selectedEnvironmentId}` : ''}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ml-4"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Nuevo Diagrama
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-5 md:mt-0 md:col-span-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando...</span>
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            ) : environments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    No hay ambientes configurados
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                    <p>
                      Para comenzar a crear diagramas, primero necesitas configurar un ambiente.
                    </p>
                  </div>
                  <div className="mt-5">
                    <Link
                      href={`/company/${companyId}/diagrams/create`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      Crear Primer Diagrama
                    </Link>
                  </div>
                </div>
              </div>
            ) : diagrams.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    No hay diagramas en el ambiente {selectedEnvironmentName}
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                    <p>
                      Comienza a crear diagramas en este ambiente para visualizar tu arquitectura.
                    </p>
                  </div>
                  <div className="mt-5">
                    <Link
                      href={`/company/${companyId}/diagrams/create?environmentId=${selectedEnvironmentId}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      Crear Nuevo Diagrama
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupDiagramsByPath(diagrams)).map(([path, pathDiagrams]) => (
                  <div key={path} className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                        </svg>
                        {path === 'Root' ? '📁 Raíz' : `📁 ${path}`}
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({pathDiagrams.length})</span>
                      </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {pathDiagrams.map((diagram) => (
                        <li key={diagram.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex items-center justify-between px-6 py-4">
                            <button
                              onClick={() => navigateToDiagram(diagram)}
                              className="flex-1 text-left"
                            >
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{diagram.name}</h4>
                                {diagram.description && (
                                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{diagram.description}</p>
                                )}
                                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                  Última actualización: {new Date(diagram.updated_at).toLocaleString()}
                                </p>
                              </div>
                            </button>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToDiagram(diagram);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Abrir diagrama"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteDiagram(diagram);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-opacity"
                                title="Eliminar diagrama"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear nuevo ambiente */}
      <Modal
        title="Crear Nuevo Ambiente"
        open={newEnvironmentModalVisible}
        onCancel={() => {
          setNewEnvironmentModalVisible(false);
          setNewEnvironmentName('');
          setNewEnvironmentDescription('');
          setNewEnvironmentCategory('desarrollo');
        }}
        onOk={handleCreateEnvironment}
        okText="Crear"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !newEnvironmentName.trim() }}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ambiente*</label>
          <Input 
            value={newEnvironmentName} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnvironmentName(e.target.value)} 
            placeholder="Ej. Desarrollo, Pruebas, Producción"
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría*</label>
          <EnvironmentCategorySelect 
            value={newEnvironmentCategory}
            onChange={setNewEnvironmentCategory}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
          <TextArea 
            value={newEnvironmentDescription} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewEnvironmentDescription(e.target.value)}
            rows={4}
            placeholder="Descripción del ambiente"
          />
        </div>
      </Modal>

      {/* Modal para confirmar eliminación de diagrama */}
      <Modal
        title="Confirmar Eliminación"
        open={deleteConfirmVisible}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setDiagramToDelete(null);
        }}
        onOk={handleDeleteDiagram}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ 
          disabled: loading,
          danger: true
        }}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar el diagrama <strong>"{diagramToDelete?.name}"</strong>?
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Esta acción no se puede deshacer.
          </p>
          {diagramToDelete?.path && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ubicación: {diagramToDelete.path}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
