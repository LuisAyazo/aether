"use client";

import React, { useState } from 'react';
import { 
  RocketLaunchIcon, 
  CloudIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Deployment {
  id: string;
  name: string;
  environment: 'production' | 'staging' | 'development';
  provider: 'aws' | 'gcp' | 'azure';
  status: 'running' | 'stopped' | 'deploying' | 'failed' | 'pending';
  region: string;
  lastDeployed: string;
  resources: number;
  cost: number;
  version: string;
  description?: string;
}

const mockDeployments: Deployment[] = [
  {
    id: '1',
    name: 'Web App Frontend',
    environment: 'production',
    provider: 'aws',
    status: 'running',
    region: 'us-east-1',
    lastDeployed: '2024-01-15T10:30:00Z',
    resources: 12,
    cost: 245.50,
    version: 'v1.2.3',
    description: 'React frontend application with CDN distribution'
  },
  {
    id: '2',
    name: 'API Backend',
    environment: 'production',
    provider: 'gcp',
    status: 'running',
    region: 'us-central1',
    lastDeployed: '2024-01-14T15:45:00Z',
    resources: 8,
    cost: 189.20,
    version: 'v2.1.0',
    description: 'Node.js API with Cloud SQL database'
  },
  {
    id: '3',
    name: 'Analytics Pipeline',
    environment: 'staging',
    provider: 'azure',
    status: 'deploying',
    region: 'eastus',
    lastDeployed: '2024-01-15T14:20:00Z',
    resources: 6,
    cost: 95.75,
    version: 'v0.8.1',
    description: 'Data processing pipeline with Event Hubs'
  },
  {
    id: '4',
    name: 'ML Model Service',
    environment: 'development',
    provider: 'aws',
    status: 'stopped',
    region: 'us-west-2',
    lastDeployed: '2024-01-12T09:15:00Z',
    resources: 4,
    cost: 45.30,
    version: 'v0.3.2',
    description: 'Machine learning inference API'
  }
];

const statusConfig = {
  running: { color: 'text-green-600 bg-green-50', icon: CheckCircleIcon, label: 'Ejecutándose' },
  stopped: { color: 'text-gray-600 bg-gray-50', icon: StopIcon, label: 'Detenido' },
  deploying: { color: 'text-blue-600 bg-blue-50', icon: ArrowPathIcon, label: 'Desplegando' },
  failed: { color: 'text-red-600 bg-red-50', icon: ExclamationTriangleIcon, label: 'Fallido' },
  pending: { color: 'text-yellow-600 bg-yellow-50', icon: ClockIcon, label: 'Pendiente' }
};

const environmentConfig = {
  production: { color: 'text-red-700 bg-red-100', label: 'Producción' },
  staging: { color: 'text-yellow-700 bg-yellow-100', label: 'Staging' },
  development: { color: 'text-green-700 bg-green-100', label: 'Desarrollo' }
};

const providerConfig = {
  aws: { name: 'AWS', icon: '🟧', color: 'text-orange-600' },
  gcp: { name: 'GCP', icon: '🟦', color: 'text-blue-600' },
  azure: { name: 'Azure', icon: '🟨', color: 'text-sky-600' }
};

interface DeploymentsPageProps {
  companyId?: string;
}

export default function DeploymentsPage({ companyId }: DeploymentsPageProps) {
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments);
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredDeployments = deployments.filter(deployment => {
    const environmentMatch = selectedEnvironment === 'all' || deployment.environment === selectedEnvironment;
    const providerMatch = selectedProvider === 'all' || deployment.provider === selectedProvider;
    return environmentMatch && providerMatch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeploymentAction = (deploymentId: string, action: string) => {
    console.log(`Performing ${action} on deployment ${deploymentId}`);
    // Implementar lógica de acciones aquí
  };

  const getStatusStats = () => {
    const stats = {
      running: deployments.filter(d => d.status === 'running').length,
      stopped: deployments.filter(d => d.status === 'stopped').length,
      deploying: deployments.filter(d => d.status === 'deploying').length,
      failed: deployments.filter(d => d.status === 'failed').length
    };
    return stats;
  };

  const getTotalCost = () => {
    return deployments.reduce((total, deployment) => total + deployment.cost, 0);
  };

  const stats = getStatusStats();
  const totalCost = getTotalCost();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                Despliegues
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona y monitorea todos tus despliegues en la nube
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RocketLaunchIcon className="h-5 w-5" />
              Nuevo Despliegue
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ejecutándose</p>
                <p className="text-2xl font-bold text-green-600">{stats.running}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Detenidos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.stopped}</p>
              </div>
              <StopIcon className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Desplegando</p>
                <p className="text-2xl font-bold text-blue-600">{stats.deploying}</p>
              </div>
              <ArrowPathIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</p>
              </div>
              <CloudIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entorno
              </label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los entornos</option>
                <option value="production">Producción</option>
                <option value="staging">Staging</option>
                <option value="development">Desarrollo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los proveedores</option>
                <option value="aws">AWS</option>
                <option value="gcp">Google Cloud</option>
                <option value="azure">Microsoft Azure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deployments List */}
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => {
            const isExpanded = expandedDeployment === deployment.id;
            const StatusIcon = statusConfig[deployment.status].icon;
            
            return (
              <div
                key={deployment.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setExpandedDeployment(isExpanded ? null : deployment.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {deployment.name}
                        </h3>
                        <p className="text-sm text-gray-600">{deployment.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${statusConfig[deployment.status].color}`}>
                        <StatusIcon className="h-4 w-4" />
                        {statusConfig[deployment.status].label}
                      </div>
                      
                      {/* Environment Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${environmentConfig[deployment.environment].color}`}>
                        {environmentConfig[deployment.environment].label}
                      </div>
                      
                      {/* Provider */}
                      <div className={`flex items-center gap-2 ${providerConfig[deployment.provider].color}`}>
                        <span className="text-lg">{providerConfig[deployment.provider].icon}</span>
                        <span className="text-sm font-medium">{providerConfig[deployment.provider].name}</span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeploymentAction(deployment.id, 'view')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {deployment.status === 'running' ? (
                          <button
                            onClick={() => handleDeploymentAction(deployment.id, 'stop')}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Detener"
                          >
                            <StopIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeploymentAction(deployment.id, 'start')}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Iniciar"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeploymentAction(deployment.id, 'redeploy')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Redesplegar"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeploymentAction(deployment.id, 'configure')}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                          title="Configurar"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeploymentAction(deployment.id, 'delete')}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Última actualización: {formatDate(deployment.lastDeployed)}
                    </div>
                    <div>
                      Región: {deployment.region}
                    </div>
                    <div>
                      Recursos: {deployment.resources}
                    </div>
                    <div>
                      Costo: ${deployment.cost.toFixed(2)}/mes
                    </div>
                    <div>
                      Versión: {deployment.version}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Métricas de Rendimiento</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">CPU:</span>
                            <span className="text-gray-900">45%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Memoria:</span>
                            <span className="text-gray-900">62%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Almacenamiento:</span>
                            <span className="text-gray-900">78%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Configuración</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Instancias:</span>
                            <span className="text-gray-900">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Auto-escalado:</span>
                            <span className="text-green-600">Activo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Backup:</span>
                            <span className="text-blue-600">Diario</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Historial Reciente</h4>
                        <div className="space-y-2 text-sm">
                          <div className="text-gray-600">Último despliegue exitoso</div>
                          <div className="text-gray-600">Escalado automático a 3 instancias</div>
                          <div className="text-gray-600">Actualización de seguridad</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredDeployments.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <RocketLaunchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay despliegues
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer despliegue en la nube
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Despliegue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
