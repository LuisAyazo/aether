'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCompany, Company, getCompanies } from '../../services/companyService';
import { getDiagramsByEnvironment, Diagram, createEnvironment, Environment, deleteEnvironment } from '../../services/diagramService';
import { isAuthenticated, logoutUser } from '../../services/authService';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [effectiveCompanyId, setEffectiveCompanyId] = useState<string>('');
  const [showNewEnvironmentForm, setShowNewEnvironmentForm] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [newEnvironmentDescription, setNewEnvironmentDescription] = useState('');
  const [creatingEnvironment, setCreatingEnvironment] = useState(false);
  const [environmentError, setEnvironmentError] = useState('');
  const router = useRouter();
  const params = useParams();
  const urlCompanyId = params?.companyId as string;
  
  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    async function loadData() {
      try {
        // Verificar si tenemos un ID válido
        if (!urlCompanyId || urlCompanyId === 'undefined') {
          console.log('ID de compañía no válido en la URL, intentando obtener las compañías del usuario...');
          
          // Si no hay un ID válido, buscar todas las compañías del usuario
          const userCompanies = await getCompanies();
          
          if (userCompanies.length === 0) {
            // El usuario no tiene compañías, mostrar mensaje para crear una
            setError('No tienes compañías. Por favor, crea una primero.');
            setLoading(false);
            return;
          }
          
          // Usar la primera compañía encontrada
          const firstCompany = userCompanies[0];
          const companyId = firstCompany._id || firstCompany.id;
          
          if (!companyId) {
            setError('Error con el ID de la primera compañía');
            setLoading(false);
            return;
          }
          
          console.log('Encontrada compañía del usuario, redirigiendo a:', companyId);
          // Redireccionar a la URL con el ID de la primera compañía
          router.replace(`/company/${companyId}`);
          return;
        }
        
        // Cargar la información de la compañía
        const companyData = await getCompany(urlCompanyId);
        setCompany(companyData);
        
        // Guardar el ID efectivo que usaremos para todas las operaciones
        // Garantizar que actualCompanyId SIEMPRE sea un string válido
        const actualCompanyId: string = (companyData._id || companyData.id || '').toString();
        setEffectiveCompanyId(actualCompanyId);
        
        // Si hay ambientes, seleccionar el primero por defecto
        if (companyData.environments && companyData.environments.length > 0) {
          // Asegurarse de que defaultEnvironment nunca sea undefined
          const defaultEnvironment = companyData.environments[0].id || '';
          setSelectedEnvironment(defaultEnvironment);
          
          // Cargar los diagramas del ambiente seleccionado usando el ID efectivo
          const diagramsData = await getDiagramsByEnvironment(actualCompanyId, defaultEnvironment);
          setDiagrams(diagramsData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [urlCompanyId, router]);
  
  // Función para cambiar de ambiente seleccionado
  const handleEnvironmentChange = async (environmentId: string) => {
    setSelectedEnvironment(environmentId);
    setLoading(true);
    
    try {
      // Asegurar que siempre usemos un string válido como ID de compañía
      const companyId: string = (
        effectiveCompanyId || 
        (company && ((company._id || company.id) || '').toString()) || 
        urlCompanyId || 
        ''
      ).toString();
      
      const diagramsData = await getDiagramsByEnvironment(companyId, environmentId);
      setDiagrams(diagramsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateEnvironment = async () => {
    if (!newEnvironmentName) {
      setEnvironmentError('El nombre del ambiente es obligatorio');
      return;
    }

    setCreatingEnvironment(true);
    setEnvironmentError('');
    
    try {
      // Usamos el tipo correcto para la creación de ambiente
      const environmentData: {name: string; description?: string} = {
        name: newEnvironmentName,
      };
      
      // Solo añadimos la descripción si no está vacía
      if (newEnvironmentDescription) {
        environmentData.description = newEnvironmentDescription;
      }
      
      const createdEnvironment = await createEnvironment(effectiveCompanyId, environmentData);
      
      // Actualizar la compañía con el nuevo ambiente
      if (company && company.environments) {
        // Asegurarnos de que environments es un array antes de actualizarlo
        const currentEnvironments = Array.isArray(company.environments) ? company.environments : [];
        
        setCompany({
          ...company,
          environments: [...currentEnvironments, createdEnvironment]
        });
        
        // Si es el primer ambiente, seleccionarlo automáticamente
        if (!selectedEnvironment && createdEnvironment && createdEnvironment.id) {
          // Asegurarnos de que el ID nunca sea undefined
          setSelectedEnvironment(createdEnvironment.id || '');
        }
      }
      
      setNewEnvironmentName('');
      setNewEnvironmentDescription('');
      setShowNewEnvironmentForm(false);
    } catch (err: any) {
      setEnvironmentError(err.message || 'Error al crear el ambiente');
    } finally {
      setCreatingEnvironment(false);
    }
  };

  // Función para eliminar un ambiente
  const handleDeleteEnvironment = async (environmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ambiente? Esta acción no se puede deshacer y eliminará todos los diagramas asociados.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deleteEnvironment(effectiveCompanyId, environmentId);
      
      // Actualizar la compañía sin el ambiente eliminado
      if (company) {
        const updatedEnvironments = company.environments?.filter(env => env.id !== environmentId) || [];
        setCompany({
          ...company,
          environments: updatedEnvironments
        });
        
        // Si se eliminó el ambiente seleccionado, seleccionar otro si existe
        if (selectedEnvironment === environmentId && updatedEnvironments.length > 0) {
          // Asegurarse de que el ID nunca sea undefined
          setSelectedEnvironment(updatedEnvironments[0].id || '');
          const diagramsData = await getDiagramsByEnvironment(effectiveCompanyId, updatedEnvironments[0].id || '');
          setDiagrams(diagramsData);
        } else if (updatedEnvironments.length === 0) {
          setSelectedEnvironment(''); // Limpiar el ambiente seleccionado si no queda ninguno
          setDiagrams([]);
        }
      }
    } catch (err: any) {
      setError(`Error al eliminar el ambiente: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  function handleLogout() {
    logoutUser();
    router.push('/login');
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
                href="/dashboard"
                className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : company ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ID: {company.id}
              </p>
            </div>
            
            {/* Selector de ambientes con opción de eliminar */}
            {company.environments && company.environments.length > 0 && (
              <div className="mb-6">
                <label htmlFor="environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ambiente
                </label>
                <div className="flex items-center mt-1">
                  <select
                    id="environment"
                    name="environment"
                    value={selectedEnvironment}
                    onChange={(e) => handleEnvironmentChange(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {company.environments.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))}
                  </select>
                  {selectedEnvironment && (
                    <button
                      onClick={() => handleDeleteEnvironment(selectedEnvironment)}
                      className="ml-2 inline-flex items-center p-2 border border-transparent rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 focus:outline-none"
                      title="Eliminar este ambiente"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Diagramas</h2>
              <Link
                href={`/company/${effectiveCompanyId}/diagrams/create?environmentId=${selectedEnvironment}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crear Diagrama
              </Link>
            </div>
            
            {diagrams.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-lg text-gray-600 dark:text-gray-400">No hay diagramas disponibles.</p>
                <Link
                  href={`/company/${effectiveCompanyId}/diagrams/create?environmentId=${selectedEnvironment}`}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Crear tu primer diagrama
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {diagrams.map((diagram) => (
                  <Link 
                    key={diagram.id} 
                    href={`/company/${effectiveCompanyId}/diagrams/${diagram.id}?environmentId=${selectedEnvironment}`}
                    className="block bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{diagram.name}</h3>
                      {diagram.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{diagram.description}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Actualizado: {new Date(diagram.updated_at).toLocaleString()}
                      </p>
                      <div className="mt-4 flex items-center text-sm text-indigo-500 hover:text-indigo-600">
                        <span>Editar diagrama</span>
                        <span className="ml-1">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Formulario para crear un nuevo ambiente */}
            <div className="mt-8">
              <button
                onClick={() => setShowNewEnvironmentForm(!showNewEnvironmentForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                {showNewEnvironmentForm ? 'Cancelar' : 'Crear Nuevo Ambiente'}
              </button>
              {showNewEnvironmentForm && (
                <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nuevo Ambiente</h3>
                  <div className="mt-4">
                    <label htmlFor="newEnvironmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre del Ambiente
                    </label>
                    <input
                      type="text"
                      id="newEnvironmentName"
                      value={newEnvironmentName}
                      onChange={(e) => setNewEnvironmentName(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="newEnvironmentDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descripción del Ambiente
                    </label>
                    <textarea
                      id="newEnvironmentDescription"
                      value={newEnvironmentDescription}
                      onChange={(e) => setNewEnvironmentDescription(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  {environmentError && (
                    <div className="mt-4 text-red-600 dark:text-red-400">
                      {environmentError}
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={handleCreateEnvironment}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                      disabled={creatingEnvironment}
                    >
                      {creatingEnvironment ? 'Creando...' : 'Crear Ambiente'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600 dark:text-gray-400">Compañía no encontrada.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Volver al Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}