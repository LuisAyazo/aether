'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCompany, updateCompany, getCompanies } from '../../../services/companyService';
import { isAuthenticated } from '../../../services/authService';
import { Credential, Settings, EnvironmentSetting } from '../../../config';

// Interfaz para el estado del modal de credenciales
interface CredentialModalState {
  isOpen: boolean;
  isEdit: boolean;
  credential: Credential;
}

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({
    credentials: [],
    defaultEnvironment: 'dev',
    environmentSettings: {
      dev: { enabled: true, description: 'Entorno de desarrollo' },
      qa: { enabled: true, description: 'Entorno de pruebas' },
      prod: { enabled: true, description: 'Entorno de producción' }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState<'credentials' | 'environments' | 'general'>('credentials');
  
  // Estados para el modal de credencial con tipado correcto
  const [credentialModal, setCredentialModal] = useState<CredentialModalState>({
    isOpen: false,
    isEdit: false,
    credential: {
      id: '',
      name: '',
      provider: 'aws',
      key: '',
      secret: '',
      region: '',
      project: '',
      createdAt: new Date()
    }
  });

  const router = useRouter();
  const params = useParams();
  const companyId = params?.companyId as string;

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        // Verificar si tenemos un ID válido
        if (!companyId || companyId === 'undefined') {
          // Si no hay un ID válido, buscar todas las compañías del usuario
          console.log('ID de compañía no válido en la URL de settings, intentando obtener compañías del usuario...');
          const userCompanies = await getCompanies();
          
          if (userCompanies.length === 0) {
            // El usuario no tiene compañías, mostrar mensaje para crear una
            setError('No tienes compañías. Por favor, crea una primero.');
            setLoading(false);
            return;
          }
          
          // Usar la primera compañía encontrada
          const firstCompany = userCompanies[0];
          const firstCompanyId = firstCompany._id || firstCompany.id;
          
          if (!firstCompanyId) {
            setError('Error con el ID de la primera compañía');
            setLoading(false);
            return;
          }
          
          console.log('Encontrada compañía del usuario, redirigiendo a settings con ID:', firstCompanyId);
          // Redireccionar a la URL con el ID de la primera compañía
          router.replace(`/company/${firstCompanyId}/settings`);
          return;
        }
        
        // Cargar la información de la compañía
        const companyData = await getCompany(companyId);
        setCompany(companyData);

        // Cargar configuraciones si existen
        if (companyData.settings) {
          setSettings(companyData.settings);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [companyId, router]);

  const handleSaveSettings = async () => {
    if (!companyId || !company) return;

    setIsSaving(true);
    setSaveError('');

    try {
      const updatedCompany = {
        ...company,
        settings: settings
      };

      await updateCompany(companyId, updatedCompany);
      alert('Configuración guardada correctamente');
    } catch (err: any) {
      console.error('Error guardando la configuración:', err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openCredentialModal = (credential?: Credential) => {
    if (credential) {
      setCredentialModal({
        isOpen: true,
        isEdit: true,
        credential: { ...credential }
      });
    } else {
      setCredentialModal({
        isOpen: true,
        isEdit: false,
        credential: {
          id: `cred-${Date.now()}`,
          name: '',
          provider: 'aws',
          key: '',
          secret: '',
          region: '',
          project: '',
          createdAt: new Date()
        }
      });
    }
  };

  const closeCredentialModal = () => {
    setCredentialModal(prev => ({ ...prev, isOpen: false }));
  };

  const saveCredential = () => {
    const { credential, isEdit } = credentialModal;
    
    if (!credential.name.trim() || !credential.key.trim() || !credential.secret.trim()) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    let updatedCredentials = [...settings.credentials];
    
    if (isEdit) {
      // Actualizar credencial existente
      updatedCredentials = updatedCredentials.map(cred => 
        cred.id === credential.id ? credential : cred
      );
    } else {
      // Agregar nueva credencial
      updatedCredentials.push({
        ...credential,
        createdAt: new Date()
      });
    }

    setSettings(prev => ({
      ...prev,
      credentials: updatedCredentials
    }));

    closeCredentialModal();
  };

  const deleteCredential = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta credencial?')) {
      setSettings(prev => ({
        ...prev,
        credentials: prev.credentials.filter(cred => cred.id !== id)
      }));
    }
  };

  const updateEnvironmentSetting = (env: 'dev' | 'qa' | 'prod', field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      environmentSettings: {
        ...prev.environmentSettings,
        [env]: {
          ...prev.environmentSettings[env],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error al cargar los datos</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <div className="flex justify-end">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
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
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Volver a la compañía
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Configuración de {company?.name}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Administra credenciales, ambientes y otras configuraciones.
            </p>
          </div>

          {/* Tabs de navegación */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('credentials')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'credentials'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Credenciales
              </button>
              <button
                onClick={() => setActiveTab('environments')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'environments'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Ambientes
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                General
              </button>
            </nav>
          </div>

          {/* Contenido de la pestaña de credenciales */}
          {activeTab === 'credentials' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Credenciales de acceso
                </h3>
                <button
                  onClick={() => openCredentialModal()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Agregar credencial
                </button>
              </div>

              {/* Lista de credenciales */}
              {settings.credentials.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay credenciales configuradas.
                  </p>
                  <button
                    onClick={() => openCredentialModal()}
                    className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 dark:text-indigo-400 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    Añadir primera credencial
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Proveedor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Región/Proyecto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Creada
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {settings.credentials.map((cred) => (
                        <tr key={cred.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {cred.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {cred.provider.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {cred.provider === 'aws' ? cred.region : cred.project}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(cred.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openCredentialModal(cred)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteCredential(cred.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña de ambientes */}
          {activeTab === 'environments' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Configuración de ambientes
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Define qué ambientes estarán disponibles y configura sus características.
                </p>
              </div>

              <div className="space-y-6">
                {/* Ambiente por defecto */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ambiente por defecto
                  </label>
                  <select
                    value={settings.defaultEnvironment}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultEnvironment: e.target.value as any }))}
                    className="block w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="dev">Desarrollo</option>
                    <option value="qa">Pruebas</option>
                    <option value="prod">Producción</option>
                  </select>
                </div>

                {/* Configuración de cada ambiente */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Ambiente de desarrollo */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Desarrollo</h4>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="toggle-dev"
                          checked={settings.environmentSettings.dev.enabled}
                          onChange={(e) => updateEnvironmentSetting('dev', 'enabled', e.target.checked)}
                          className="hidden"
                        />
                        <label
                          htmlFor="toggle-dev"
                          className={`block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer ${
                            settings.environmentSettings.dev.enabled ? 'bg-indigo-500' : ''
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                              settings.environmentSettings.dev.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={settings.environmentSettings.dev.description}
                      onChange={(e) => updateEnvironmentSetting('dev', 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>

                  {/* Ambiente de pruebas */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Pruebas</h4>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="toggle-qa"
                          checked={settings.environmentSettings.qa.enabled}
                          onChange={(e) => updateEnvironmentSetting('qa', 'enabled', e.target.checked)}
                          className="hidden"
                        />
                        <label
                          htmlFor="toggle-qa"
                          className={`block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer ${
                            settings.environmentSettings.qa.enabled ? 'bg-indigo-500' : ''
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                              settings.environmentSettings.qa.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={settings.environmentSettings.qa.description}
                      onChange={(e) => updateEnvironmentSetting('qa', 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>

                  {/* Ambiente de producción */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Producción</h4>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="toggle-prod"
                          checked={settings.environmentSettings.prod.enabled}
                          onChange={(e) => updateEnvironmentSetting('prod', 'enabled', e.target.checked)}
                          className="hidden"
                        />
                        <label
                          htmlFor="toggle-prod"
                          className={`block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer ${
                            settings.environmentSettings.prod.enabled ? 'bg-indigo-500' : ''
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                              settings.environmentSettings.prod.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={settings.environmentSettings.prod.description}
                      onChange={(e) => updateEnvironmentSetting('prod', 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de la pestaña general */}
          {activeTab === 'general' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Configuración general
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configura preferencias generales para todos los diagramas en esta compañía.
                </p>
              </div>

              <div className="space-y-6">
                {/* Otras configuraciones */}
                {/* ... */}
              </div>
            </div>
          )}

          {/* Botón guardar y mensaje de error */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            {saveError && (
              <div className="text-red-500 text-sm mr-4">Error: {saveError}</div>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSaving ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de credenciales */}
      {credentialModal.isOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                      {credentialModal.isEdit ? 'Editar credencial' : 'Agregar credencial'}
                    </h3>
                    
                    <div className="mt-2 space-y-4">
                      {/* Nombre de la credencial */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre de la credencial *
                        </label>
                        <input
                          type="text"
                          value={credentialModal.credential.name}
                          onChange={(e) => 
                            setCredentialModal(prev => ({
                              ...prev,
                              credential: { ...prev.credential, name: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                          placeholder="Mi credencial AWS"
                        />
                      </div>
                      
                      {/* Proveedor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Proveedor *
                        </label>
                        <select
                          value={credentialModal.credential.provider}
                          onChange={(e) => 
                            setCredentialModal(prev => ({
                              ...prev,
                              credential: { 
                                ...prev.credential, 
                                provider: e.target.value as 'aws' | 'gcp' | 'azure' 
                              }
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                        >
                          <option value="aws">AWS</option>
                          <option value="gcp">Google Cloud (GCP)</option>
                          <option value="azure">Azure</option>
                        </select>
                      </div>
                      
                      {/* Key */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {credentialModal.credential.provider === 'aws' ? 'Access Key ID' : 
                            credentialModal.credential.provider === 'gcp' ? 'Service Account Key' : 
                            'App ID'} *
                        </label>
                        <input
                          type="text"
                          value={credentialModal.credential.key}
                          onChange={(e) => 
                            setCredentialModal(prev => ({
                              ...prev,
                              credential: { ...prev.credential, key: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                          placeholder="AKIA..."
                        />
                      </div>
                      
                      {/* Secret */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {credentialModal.credential.provider === 'aws' ? 'Secret Access Key' : 
                            credentialModal.credential.provider === 'gcp' ? 'Private Key' : 
                            'App Secret'} *
                        </label>
                        <input
                          type="password"
                          value={credentialModal.credential.secret}
                          onChange={(e) => 
                            setCredentialModal(prev => ({
                              ...prev,
                              credential: { ...prev.credential, secret: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                          placeholder="••••••••••••••••••"
                        />
                      </div>
                      
                      {/* Región o Proyecto */}
                      {credentialModal.credential.provider === 'aws' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Región
                          </label>
                          <input
                            type="text"
                            value={credentialModal.credential.region || ''}
                            onChange={(e) => 
                              setCredentialModal(prev => ({
                                ...prev,
                                credential: { ...prev.credential, region: e.target.value }
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                            placeholder="us-east-1"
                          />
                        </div>
                      )}
                      
                      {credentialModal.credential.provider === 'gcp' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            ID del Proyecto
                          </label>
                          <input
                            type="text"
                            value={credentialModal.credential.project || ''}
                            onChange={(e) => 
                              setCredentialModal(prev => ({
                                ...prev,
                                credential: { ...prev.credential, project: e.target.value }
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-sm"
                            placeholder="my-gcp-project-123"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={saveCredential}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={closeCredentialModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}