import React, { useState } from 'react';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Credential {
  id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure';
  type: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
  fields: Record<string, string>;
  environments: string[]; // IDs de ambientes asociados
}

type ProviderType = 'aws' | 'gcp' | 'azure';

interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface CredentialsPageProps {
  companyId: string;
}

interface ProviderConfig {
  name: string;
  icon: string;
  color: string;
  fields: FieldDefinition[];
}

const CredentialsPage: React.FC<CredentialsPageProps> = ({ companyId }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('aws');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [environments, setEnvironments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [showEnvironmentModal, setShowEnvironmentModal] = useState(false);
  const [selectedCredentialForEnv, setSelectedCredentialForEnv] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const providers: Record<ProviderType, ProviderConfig> = {
    aws: {
      name: 'Amazon Web Services',
      icon: '🟧',
      color: 'orange',
      fields: [
        { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
        { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
        { key: 'region', label: 'Default Region', type: 'select', required: true, options: ['us-east-1', 'us-west-2', 'eu-west-1'] }
      ]
    },
    gcp: {
      name: 'Google Cloud Platform',
      icon: '🟦',
      color: 'blue',
      fields: [
        { key: 'projectId', label: 'Project ID', type: 'text', required: true },
        { key: 'keyFile', label: 'Service Account Key', type: 'file', required: true },
        { key: 'region', label: 'Default Region', type: 'select', required: true, options: ['us-central1', 'us-east1', 'europe-west1'] }
      ]
    },
    azure: {
      name: 'Microsoft Azure',
      icon: '🟨',
      color: 'sky',
      fields: [
        { key: 'subscriptionId', label: 'Subscription ID', type: 'text', required: true },
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true }
      ]
    }
  };

  // Cargar credenciales al montar el componente
  React.useEffect(() => {
    const loadCredentials = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/companies/${companyId}/credentials`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Ensure data is always an array
          setCredentials(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to load credentials:', response.status);
          setCredentials([]);
        }
      } catch (error) {
        console.error('Error loading credentials:', error);
        setCredentials([]);
      }
    };

    loadCredentials();
  }, [companyId]);

  // Cargar ambientes al montar el componente
  React.useEffect(() => {
    const loadEnvironments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/companies/${companyId}/environments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEnvironments(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to load environments:', response.status);
          setEnvironments([]);
        }
      } catch (error) {
        console.error('Error loading environments:', error);
        setEnvironments([]);
      }
    };

    loadEnvironments();
  }, [companyId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        keyFile: file.name
      }));
    }
  };

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetForm = () => {
    setFormData({});
    setSelectedFile(null);
    setSelectedEnvironments([]);
    setSelectedProvider('aws');
  };

  const toggleSecretVisibility = (credentialId: string, fieldKey: string) => {
    const key = `${credentialId}-${fieldKey}`;
    setVisibleSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteCredential = (credentialId: string) => {
    setCredentials(prev => prev.filter(c => c.id !== credentialId));
  };

  const handleCreateCredential = async (formData: {
    name: string;
    provider: ProviderType;
    fields: Record<string, string>;
    environments: string[];
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${companyId}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newCredential = await response.json();
        setCredentials(prev => [...prev, newCredential]);
        setShowAddModal(false);
        resetForm();
      } else {
        throw new Error('Error creating credential');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la credencial');
    }
  };

  const handleAssignEnvironments = async (credentialId: string, environmentIds: string[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${companyId}/credentials/${credentialId}/environments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ environments: environmentIds })
      });

      if (response.ok) {
        // Update local state
        setCredentials(prev => prev.map(cred => 
          cred.id === credentialId 
            ? { ...cred, environments: environmentIds }
            : cred
        ));
        setShowEnvironmentModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar ambientes');
    }
  };

  const renderCredentialField = (credential: Credential, fieldKey: string, value: string) => {
    const isSecret = fieldKey.toLowerCase().includes('secret') || fieldKey.toLowerCase().includes('key');
    const visibilityKey = `${credential.id}-${fieldKey}`;
    const isVisible = visibleSecrets[visibilityKey];

    return (
      <div key={fieldKey} className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {fieldKey.replace(/([A-Z])/g, ' $1').toLowerCase()}:
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900 font-mono">
            {isSecret && !isVisible ? value : value}
          </span>
          {isSecret && (
            <button
              onClick={() => toggleSecretVisibility(credential.id, fieldKey)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isVisible ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credenciales</h1>
          <p className="text-gray-600">Gestiona las credenciales de tu infraestructura</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Nueva Credencial
        </button>
      </div>

      {/* Credentials List */}
      <div className="space-y-4">
        {!Array.isArray(credentials) || credentials.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay credenciales</h3>
            <p className="text-gray-600 mb-4">Comienza agregando tu primera credencial</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Agregar Credencial
            </button>
          </div>
        ) : (
          credentials.map((credential) => (
            <div key={credential.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-${providers[credential.provider].color}-100 rounded-lg flex items-center justify-center`}>
                    <span className="text-2xl">{providers[credential.provider].icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{credential.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">{providers[credential.provider].name}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{credential.type}</span>
                      {credential.environments && credential.environments.length > 0 && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-blue-600">
                            {credential.environments.length} ambiente(s) asignado(s)
                          </span>
                        </>
                      )}
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        Creado: {new Date(credential.createdAt).toLocaleDateString()}
                      </span>
                      {credential.lastUsed && (
                        <>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            Último uso: {new Date(credential.lastUsed).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedCredentialForEnv(credential.id);
                      setSelectedEnvironments(credential.environments || []);
                      setShowEnvironmentModal(true);
                    }}
                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Gestionar ambientes"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </button>
                  <div className="flex items-center">
                    {credential.isActive ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-700 font-medium">Activa</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-yellow-700 font-medium">Inactiva</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCredential(credential.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Environment assignments */}
              {credential.environments && credential.environments.length > 0 && (
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">Ambientes asignados:</h5>
                  <div className="flex flex-wrap gap-2">
                    {credential.environments.map(envId => {
                      const env = environments.find(e => e.id === envId);
                      return env ? (
                        <span key={envId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {env.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Credential Details */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Detalles de configuración</h4>
                <div className="space-y-1">
                  {Object.entries(credential.fields).map(([key, value]) =>
                    renderCredentialField(credential, key, value)
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Credential Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nueva Credencial</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Proveedor de Nube
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(providers).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedProvider(key as ProviderType)}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedProvider === key
                        ? `border-${provider.color}-500 bg-${provider.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{provider.icon}</div>
                    <div className="text-sm font-medium">{provider.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Credential Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Credencial
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: AWS Production"
              />
            </div>

            {/* Provider Fields */}
            <div className="space-y-4 mb-6">
              {providers[selectedProvider].fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'file' ? (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          id={field.key}
                          accept=".json"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor={field.key}
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <DocumentArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">
                            {selectedFile ? selectedFile.name : 'Seleccionar archivo JSON'}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Archivo de clave de cuenta de servicio
                          </span>
                        </label>
                      </div>
                      {selectedFile && (
                        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-blue-800">{selectedFile.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setFormData(prev => ({ ...prev, keyFile: '' }));
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFormChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFormChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Ingresa ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Environment Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambientes (Opcional)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {environments.map((env) => (
                  <label key={env.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEnvironments.includes(env.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEnvironments(prev => [...prev, env.id]);
                        } else {
                          setSelectedEnvironments(prev => prev.filter(id => id !== env.id));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{env.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleCreateCredential({
                    name: formData.name || '',
                    provider: selectedProvider,
                    fields: formData,
                    environments: selectedEnvironments
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Credencial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Environment Assignment Modal */}
      {showEnvironmentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
              onClick={() => setShowEnvironmentModal(false)}
            ></div>
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Gestionar Ambientes</h2>
                <p className="text-gray-600 mt-1">Selecciona los ambientes donde esta credencial estará disponible</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {environments.map((env) => (
                    <label key={env.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedEnvironments.includes(env.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEnvironments(prev => [...prev, env.id]);
                          } else {
                            setSelectedEnvironments(prev => prev.filter(id => id !== env.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{env.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEnvironmentModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (selectedCredentialForEnv) {
                      handleAssignEnvironments(selectedCredentialForEnv, selectedEnvironments);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsPage;
