'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createDiagram, createEnvironment, getEnvironments, Environment } from '../../../../services/diagramService';
import { isAuthenticated } from '../../../../services/authService';

export default function CreateDiagramPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [environmentName, setEnvironmentName] = useState('Desarrollo');
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params?.companyId as string;
  const environmentIdParam = searchParams.get('environmentId');
  
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    async function loadData() {
      try {
        const environmentsData = await getEnvironments(companyId);
        setEnvironments(environmentsData);
        
        if (environmentsData.length > 0) {
          // Si hay ambientes disponibles, seleccionar uno válido
          if (environmentIdParam && environmentIdParam.trim() !== '' && 
              environmentsData.some(env => env.id === environmentIdParam)) {
            setSelectedEnvironmentId(environmentIdParam);
          } else {
            setSelectedEnvironmentId(environmentsData[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error al cargar ambientes:", err);
        // No establecemos error aquí, simplemente mostramos la interfaz para crear ambiente
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [router, environmentIdParam, companyId]);

  // Si es la primera vez y no hay ambientes, vamos directo a crear uno nuevo
  const isFirstTime = environments.length === 0;
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre del diagrama no puede estar vacío');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      let targetEnvironmentId = selectedEnvironmentId;
      let environmentName = '';
      
      // Si no hay ambientes, crear uno automáticamente
      if (isFirstTime) {
        if (!environmentName.trim()) {
          setError('El nombre del ambiente no puede estar vacío');
          setSubmitting(false);
          return;
        }
        
        console.log("Creando ambiente nuevo:", environmentName);
        try {
          const newEnvironment = await createEnvironment(companyId, {
            name: environmentName,
            description: 'Ambiente creado automáticamente para el primer diagrama'
          });
          
          console.log("Ambiente creado:", newEnvironment);
          targetEnvironmentId = newEnvironment.id;
          environmentName = newEnvironment.name;
        } catch (envError: any) {
          console.error("Error al crear el ambiente:", envError);
          
          if (envError.message && envError.message.includes('servicio para crear ambientes no está disponible')) {
            setError('El backend no tiene implementado el endpoint para crear ambientes. Por favor, contacta al administrador del sistema.');
          } else {
            setError(`Error al crear el ambiente: ${envError.message}`);
          }
          
          setSubmitting(false);
          return;
        }
      } else {
        // Obtener el nombre del ambiente seleccionado
        const selectedEnvironment = environments.find(env => env.id === targetEnvironmentId);
        environmentName = selectedEnvironment?.name || '';
      }
      
      // Crear un diagrama vacío con los detalles básicos
      const diagramData = {
        name,
        description,
        path: path.trim() || undefined,
        nodes: [],
        edges: [],
        viewport: {
          x: 0,
          y: 0,
          zoom: 1
        }
      };
      
      console.log("Creando diagrama en ambiente:", targetEnvironmentId);
      const result = await createDiagram(companyId, targetEnvironmentId, diagramData);
      console.log("Diagrama creado:", result);
      
      // Crear slugs para una URL más amigable
      const envSlug = environmentName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      const diagramSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      // Redirigir al editor de diagrama utilizando los slugs, pero manteniendo los IDs como query params
      router.push(`/company/${companyId}/diagrams/${diagramSlug}?id=${result.id}&environmentId=${targetEnvironmentId}&env=${envSlug}`);
    } catch (err: any) {
      console.error("Error al crear:", err);
      setError(err.message || 'Ocurrió un error al crear el diagrama');
    } finally {
      setSubmitting(false);
    }
  }
  
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
                Crear Nuevo Diagrama
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Define los detalles básicos para tu diagrama de arquitectura.
                Una vez creado, podrás añadir componentes en el editor.
              </p>
              
              {isFirstTime && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Primera vez</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Como es tu primera vez, crearemos automáticamente un ambiente para organizar tus diagramas.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 bg-white dark:bg-gray-800 sm:p-6">
                    {error && (
                      <div className="mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                      </div>
                    )}
                    
                    {isFirstTime ? (
                      <div className="mb-6 p-4 border border-yellow-400 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-700 rounded-md">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Configura tu primer ambiente</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                          Antes de crear un diagrama, necesitamos configurar un ambiente. 
                          Un ambiente te permite organizar tus diagramas (por ejemplo: Desarrollo, Pruebas, Producción).
                        </p>
                        <div>
                          <label htmlFor="environmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nombre del ambiente
                          </label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                              type="text"
                              id="environmentName"
                              value={environmentName}
                              onChange={(e) => setEnvironmentName(e.target.value)}
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="Nombre del ambiente"
                            />
                          </div>
                        </div>
                      </div>
                    ) : environments.length > 0 && (
                      <div className="mb-6">
                        <label htmlFor="environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Seleccionar ambiente
                        </label>
                        <select
                          id="environment"
                          value={selectedEnvironmentId}
                          onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white"
                        >
                          {environments.map((env) => (
                            <option key={env.id} value={env.id}>
                              {env.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nombre del diagrama
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="col-span-6">
                        <label htmlFor="path" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Ruta/Directorio (opcional)
                        </label>
                        <input
                          type="text"
                          id="path"
                          name="path"
                          value={path}
                          onChange={(e) => setPath(e.target.value)}
                          placeholder="ej: devops/hub-and-spoke, devops/pubsub, devops/infra-full"
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Organiza tus diagramas en directorios. Usa "/" para crear subdirectorios.
                        </p>
                      </div>
                      
                      <div className="col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Descripción (opcional)
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6 flex justify-between items-center">
                    <div>
                      {submitting && (
                        <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </span>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/company/${companyId}`}
                        className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                      >
                        Cancelar
                      </Link>
                      <button
                        type="submit"
                        disabled={submitting || !name.trim() || (isFirstTime && !environmentName.trim())}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {submitting ? 'Creando...' : 'Crear Diagrama'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}