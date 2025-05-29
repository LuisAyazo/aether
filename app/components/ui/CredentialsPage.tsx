import React, { useState } from 'react';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
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
  const [credentials, setCredentials] = useState<Credential[]>([
    {
      id: '1',
      name: 'AWS Production',
      provider: 'aws',
      type: 'Access Key',
      createdAt: '2024-01-15',
      lastUsed: '2024-01-20',
      isActive: true,
      fields: {
        accessKeyId: 'AKIA••••••••••••••••',
        secretAccessKey: '••••••••••••••••••••••••••••••••••••••••'
      }
    },
    {
      id: '2',
      name: 'GCP Development',
      provider: 'gcp',
      type: 'Service Account',
      createdAt: '2024-01-10',
      lastUsed: '2024-01-19',
      isActive: true,
      fields: {
        projectId: 'my-gcp-project-dev',
        keyFile: 'service-account-key.json'
      }
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('aws');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <KeyIcon className="w-8 h-8 text-blue-600" />
              <span>Credenciales Cloud</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona credenciales de forma segura para AWS, GCP y Azure
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Agregar Credencial
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">🟧</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AWS</p>
              <p className="text-2xl font-bold text-gray-900">
                {credentials.filter(c => c.provider === 'aws').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">🟦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">GCP</p>
              <p className="text-2xl font-bold text-gray-900">
                {credentials.filter(c => c.provider === 'gcp').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                <span className="text-sky-600 font-bold">🟨</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Azure</p>
              <p className="text-2xl font-bold text-gray-900">
                {credentials.filter(c => c.provider === 'azure').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {credentials.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Credenciales Configuradas</h2>
        </div>
        
        {credentials.length === 0 ? (
          <div className="text-center py-12">
            <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay credenciales</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando credenciales para tus proveedores cloud.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Agregar Credencial
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {credentials.map((credential) => (
              <div key={credential.id} className="p-6">
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
            ))}
          </div>
        )}
      </div>

      {/* Add Credential Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Agregar Nueva Credencial</h2>
                <p className="text-gray-600 mt-1">Configura credenciales para tu proveedor cloud</p>
              </div>
              
              <div className="p-6">
                {/* Provider Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Seleccionar Proveedor
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(providers) as ProviderType[]).map((provider) => (
                      <button
                        key={provider}
                        onClick={() => setSelectedProvider(provider)}
                        className={`
                          p-4 border-2 rounded-lg text-center transition-all
                          ${selectedProvider === provider
                            ? `border-${providers[provider].color}-500 bg-${providers[provider].color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">{providers[provider].icon}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {providers[provider].name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Credential Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la credencial
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: AWS Production"
                    />
                  </div>

                  {providers[selectedProvider].fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="">Seleccionar...</option>
                          {field.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'file' ? (
                        <div className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center">
                          <input type="file" className="hidden" id={field.key} accept=".json" />
                          <label htmlFor={field.key} className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-700">Seleccionar archivo</span>
                            <span className="text-gray-500 ml-2">o arrastra aquí</span>
                          </label>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Ingrese ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Credencial
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
