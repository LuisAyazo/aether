"use client";

import React, { useState, useEffect } from 'react';
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
import { Button, Card, List, Modal, Input, message, Spin, Select, Switch, Tooltip, Typography, Space, Tag, Alert } from 'antd';
import { GithubOutlined, LinkOutlined, DeleteOutlined, SyncOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';

interface Deployment {
  id: string;
  name: string;
  environment: 'production' | 'staging' | 'development';
  provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'docker'; // Añadir 'kubernetes', 'docker'
  platform: 'ecs' | 'cloud-run' | 'fargate' | 'cloud-function' | 'kubernetes' | 'docker-instance' | 'unknown'; // Nueva propiedad
  status: 'running' | 'stopped' | 'deploying' | 'failed' | 'pending';
  region: string;
  lastDeployed: string;
  resources: number;
  cost: number;
  version: string;
  description?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  default_branch: string;
}

interface Webhook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

const mockDeployments: Deployment[] = [
  {
    id: '1',
    name: 'Web App Frontend',
    environment: 'production',
    provider: 'aws',
    platform: 'ecs',
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
    platform: 'cloud-run',
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
    platform: 'cloud-function',
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
    platform: 'fargate',
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
  azure: { name: 'Azure', icon: '🟨', color: 'text-sky-600' },
  kubernetes: { name: 'Kubernetes', icon: '☸️', color: 'text-indigo-600' },
  docker: { name: 'Docker', icon: '🐳', color: 'text-cyan-600' }
};

const platformConfig: Record<Deployment['platform'], { name: string; icon: string; color: string }> = {
  'ecs': { name: 'AWS ECS', icon: '📦', color: 'text-orange-500' },
  'cloud-run': { name: 'Google Cloud Run', icon: '🏃', color: 'text-blue-500' },
  'fargate': { name: 'AWS Fargate', icon: '💨', color: 'text-teal-500' },
  'cloud-function': { name: 'Google Cloud Function', icon: '⚡', color: 'text-yellow-500' },
  'kubernetes': { name: 'Kubernetes Cluster', icon: '☸️', color: 'text-indigo-500' },
  'docker-instance': { name: 'Docker Instance', icon: '🐳', color: 'text-cyan-500' },
  'unknown': { name: 'Desconocido', icon: '❓', color: 'text-gray-500' }
};

interface DeploymentsPageProps {
  companyId?: string;
}

const { Title, Text } = Typography;
const { Option } = Select;

export default function DeploymentsPage({ companyId }: DeploymentsPageProps) {
  const params = useParams();
  const router = useRouter();
  const companyIdFromParams = params.companyId as string;
  
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments);
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeploymentName, setNewDeploymentName] = useState('');
  const [newDeploymentPlatform, setNewDeploymentPlatform] = useState<Deployment['platform'] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [githubToken, setGithubToken] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/auth/github/check');
        const data = await response.json();
        setIsConnected(data.connected);
        
        if (data.connected) {
          await fetchRepositories();
        }
      } catch (error) {
        console.error('Error checking GitHub connection:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/repositories');
      const repos = await response.json();
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      message.error('Error al obtener los repositorios');
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = async (value: string) => {
    setSelectedRepo(value);
    try {
      setLoading(true);
      const response = await fetch(`/api/github/webhooks?repo=${value}`);
      const hooks = await response.json();
      setWebhooks(hooks);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      message.error('Error al obtener los webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!selectedRepo) return;

    try {
      setLoading(true);
      const response = await fetch('/api/github/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo: selectedRepo,
          companyId: companyIdFromParams,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create webhook');
      }

      message.success('Webhook creado exitosamente');
      
      // Actualizar lista de webhooks
      const hooksResponse = await fetch(`/api/github/webhooks?repo=${selectedRepo}`);
      const hooks = await hooksResponse.json();
      setWebhooks(hooks);
    } catch (error) {
      console.error('Error creating webhook:', error);
      message.error('Error al crear el webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (hookId: number) => {
    if (!selectedRepo) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/github/webhooks/${hookId}?repo=${selectedRepo}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }

      message.success('Webhook eliminado exitosamente');
      
      // Actualizar lista de webhooks
      const hooksResponse = await fetch(`/api/github/webhooks?repo=${selectedRepo}`);
      const hooks = await hooksResponse.json();
      setWebhooks(hooks);
    } catch (error) {
      console.error('Error deleting webhook:', error);
      message.error('Error al eliminar el webhook');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <Title level={2}>Despliegues</Title>
        <Card>
          <div className="flex justify-center items-center p-8">
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6">
        <Title level={2}>Despliegues</Title>
        <Card>
          <Alert
            message="No conectado a GitHub"
            description={
              <Space direction="vertical">
                <Text>
                  Para gestionar despliegues, primero necesitas conectar tu cuenta de GitHub.
                </Text>
                <Button
                  type="primary"
                  onClick={() => router.push(`/company/${companyIdFromParams}#credentials`)}
                >
                  Ir a Credenciales
                </Button>
              </Space>
            }
            type="warning"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                Despliegues Universales
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona, monitorea y lanza tus aplicaciones a múltiples plataformas cloud y on-premise.
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

        {/* Info sobre Despliegue Universal */}
        <Alert
          message="Potencia de Despliegue Universal a tu Alcance"
          description={
            <div>
              <Text>
                InfraUX te permite desplegar tus aplicaciones y servicios a una amplia gama de plataformas, incluyendo:
              </Text>
              <ul className="list-disc list-inside mt-2 pl-4">
                <li>AWS ECS & Fargate</li>
                <li>Google Cloud Run & Cloud Functions</li>
                <li>Kubernetes (cualquier clúster)</li>
                <li>Instancias Docker Genéricas</li>
                <li>¡Y más próximamente!</li>
              </ul>
              <Text className="mt-2 block">
                Configura un nuevo despliegue y selecciona tu plataforma de destino para empezar.
              </Text>
            </div>
          }
          type="info"
          showIcon
          className="mb-8"
        />

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

                      {/* Platform Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${platformConfig[deployment.platform]?.color || platformConfig.unknown.color}`}>
                        <span className="text-xs">{platformConfig[deployment.platform]?.icon || platformConfig.unknown.icon}</span>
                        {platformConfig[deployment.platform]?.name || platformConfig.unknown.name}
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

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Integración con GitHub</h2>
          
          <Card className="mb-6">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Repositorio</Title>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Selecciona un repositorio"
                  onChange={handleRepoSelect}
                  value={selectedRepo}
                  loading={loading}
                >
                  {repositories.map((repo) => (
                    <Option key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                    </Option>
                  ))}
                </Select>
              </div>

              {selectedRepo && (
                <div>
                  <Space className="mb-4">
                    <Title level={4}>Webhooks</Title>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateWebhook}
                      loading={loading}
                    >
                      Crear Webhook
                    </Button>
                  </Space>

                  <List
                    dataSource={webhooks}
                    renderItem={(webhook) => (
                      <List.Item
                        actions={[
                          <Button
                            key="delete"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            loading={loading}
                          >
                            Eliminar
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <LinkOutlined />
                              <Text>{webhook.url}</Text>
                            </Space>
                          }
                          description={
                            <Space>
                              {webhook.events.map((event) => (
                                <Tag key={event} color="blue">
                                  {event}
                                </Tag>
                              ))}
                              {webhook.active ? (
                                <Tag color="green">Activo</Tag>
                              ) : (
                                <Tag color="red">Inactivo</Tag>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Space>
          </Card>
        </div>
      </div>

      <Modal
        title="Conectar con GitHub"
        open={showTokenModal}
        onCancel={() => setShowTokenModal(false)}
        onOk={() => {
          // Handle connect
        }}
        okText="Conectar"
        cancelText="Cancelar"
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Para conectar con GitHub, necesitas crear un token de acceso personal:
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-600 mb-4">
            <li>Ve a GitHub Settings → Developer Settings → Personal Access Tokens</li>
            <li>Crea un nuevo token con los siguientes permisos:</li>
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>repo (todos los permisos)</li>
              <li>admin:repo_hook</li>
            </ul>
            <li>Copia el token generado y pégalo aquí</li>
          </ol>
          <Input.Password
            placeholder="Token de GitHub"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal para Crear Nuevo Despliegue */}
      <Modal
        title="Crear Nuevo Despliegue"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => {
          // Lógica para crear el despliegue
          if (newDeploymentName && newDeploymentPlatform) {
            const newDeployment: Deployment = {
              id: String(deployments.length + 1),
              name: newDeploymentName,
              platform: newDeploymentPlatform,
              environment: 'development', // Default o permitir seleccionar
              provider: 'aws', // Default o derivar de plataforma/permitir seleccionar
              status: 'pending',
              region: 'us-east-1', // Default
              lastDeployed: new Date().toISOString(),
              resources: 0,
              cost: 0,
              version: 'v0.1.0',
              description: `Nuevo despliegue para ${newDeploymentPlatform}`,
            };
            setDeployments(prev => [newDeployment, ...prev]);
            message.success(`Despliegue "${newDeploymentName}" iniciado (simulado).`);
            setIsCreateModalOpen(false);
            setNewDeploymentName('');
            setNewDeploymentPlatform(undefined);
          } else {
            message.error('Por favor, completa el nombre y la plataforma.');
          }
        }}
        okText="Crear Despliegue"
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Nombre del Despliegue"
            value={newDeploymentName}
            onChange={(e) => setNewDeploymentName(e.target.value)}
          />
          <Select
            placeholder="Seleccionar Plataforma de Destino"
            style={{ width: '100%' }}
            value={newDeploymentPlatform}
            onChange={(value) => setNewDeploymentPlatform(value as Deployment['platform'])}
          >
            {Object.keys(platformConfig).filter(p => p !== 'unknown').map((platformKey) => (
              <Option key={platformKey} value={platformKey}>
                <Space>
                  <span>{platformConfig[platformKey as Deployment['platform']].icon}</span>
                  {platformConfig[platformKey as Deployment['platform']].name}
                </Space>
              </Option>
            ))}
          </Select>
          {/* Aquí se podrían añadir más campos: entorno, proveedor, región, fuente, etc. */}
          <Text type="secondary">
            Más opciones de configuración (entorno, proveedor, etc.) estarán disponibles al editar el despliegue.
          </Text>
        </Space>
      </Modal>
    </div>
  );
}
