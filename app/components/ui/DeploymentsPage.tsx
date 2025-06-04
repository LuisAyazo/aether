"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRightIcon,
  CodeBracketIcon,
  ServerIcon,
  CpuChipIcon,
  BoltIcon,
  CubeIcon,
  CommandLineIcon,
  FolderIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { Button, Card, List, Modal, Input, message, Spin, Select, Switch, Tooltip, Typography, Space, Tag, Alert, Tabs } from 'antd';
import { GithubOutlined, LinkOutlined, DeleteOutlined, SyncOutlined, CheckCircleOutlined, PlusOutlined, CodeOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import MonacoEditor from '@monaco-editor/react';

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

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  default_branch: string;
  path?: string; // Ruta del directorio
}

interface GitHubDirectory {
  path: string;
  type: 'dir' | 'file';
  name: string;
  children?: GitHubDirectory[];
}

interface DeploymentConfig {
  platform: Deployment['platform'];
  repository: Repository;
  name: string;
  region: string;
  environment: Deployment['environment'];
  config: Record<string, any>;
  branch: string;
  directory: string;
  buildConfig?: {
    buildCommand?: string;
    outputDirectory?: string;
    environment?: Record<string, string>;
  };
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

const platformConfig: Record<Deployment['platform'], { 
  name: string; 
  icon: string; 
  color: string; 
  yamlTemplate?: string;
  formFields: {
    name: string;
    type: 'text' | 'select' | 'number';
    label: string;
    options?: { value: string; label: string }[];
    defaultValue?: string | number;
  }[];
}> = {
  'ecs': { 
    name: 'AWS ECS', 
    icon: '📦', 
    color: 'text-orange-500',
    formFields: [
      { name: 'cpu', type: 'select', label: 'CPU', options: [
        { value: '256', label: '0.25 vCPU' },
        { value: '512', label: '0.5 vCPU' },
        { value: '1024', label: '1 vCPU' },
        { value: '2048', label: '2 vCPU' }
      ], defaultValue: '256' },
      { name: 'memory', type: 'select', label: 'Memoria', options: [
        { value: '512', label: '512 MB' },
        { value: '1024', label: '1 GB' },
        { value: '2048', label: '2 GB' },
        { value: '4096', label: '4 GB' }
      ], defaultValue: '512' },
      { name: 'port', type: 'number', label: 'Puerto', defaultValue: 80 },
      { name: 'minCount', type: 'number', label: 'Mínimo de Instancias', defaultValue: 1 },
      { name: 'maxCount', type: 'number', label: 'Máximo de Instancias', defaultValue: 3 }
    ],
    yamlTemplate: `version: '3'
services:
  app:
    image: your-image:latest
    cpu: 256
    memory: 512
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure`
  },
  'cloud-run': { 
    name: 'Google Cloud Run', 
    icon: '🏃', 
    color: 'text-blue-500',
    formFields: [
      { name: 'cpu', type: 'select', label: 'CPU', options: [
        { value: '0.5', label: '0.5 CPU' },
        { value: '1', label: '1 CPU' },
        { value: '2', label: '2 CPU' },
        { value: '4', label: '4 CPU' }
      ], defaultValue: '1' },
      { name: 'memory', type: 'select', label: 'Memoria', options: [
        { value: '256Mi', label: '256 MiB' },
        { value: '512Mi', label: '512 MiB' },
        { value: '1Gi', label: '1 GiB' },
        { value: '2Gi', label: '2 GiB' }
      ], defaultValue: '512Mi' },
      { name: 'port', type: 'number', label: 'Puerto', defaultValue: 8080 },
      { name: 'minInstances', type: 'number', label: 'Mínimo de Instancias', defaultValue: 0 },
      { name: 'maxInstances', type: 'number', label: 'Máximo de Instancias', defaultValue: 10 }
    ],
    yamlTemplate: `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: your-service
spec:
  template:
    spec:
      containers:
        - image: gcr.io/your-project/your-image:latest
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: "1"
              memory: "512Mi"
          env:
            - name: NODE_ENV
              value: "production"
      containerConcurrency: 80
      timeoutSeconds: 300`
  },
  'fargate': { 
    name: 'AWS Fargate', 
    icon: '💨', 
    color: 'text-teal-500',
    formFields: [
      { name: 'cpu', type: 'select', label: 'CPU', options: [
        { value: '256', label: '0.25 vCPU' },
        { value: '512', label: '0.5 vCPU' },
        { value: '1024', label: '1 vCPU' },
        { value: '2048', label: '2 vCPU' }
      ], defaultValue: '256' },
      { name: 'memory', type: 'select', label: 'Memoria', options: [
        { value: '512', label: '512 MB' },
        { value: '1024', label: '1 GB' },
        { value: '2048', label: '2 GB' },
        { value: '4096', label: '4 GB' }
      ], defaultValue: '512' },
      { name: 'port', type: 'number', label: 'Puerto', defaultValue: 80 },
      { name: 'desiredCount', type: 'number', label: 'Número de Tareas', defaultValue: 1 }
    ],
    yamlTemplate: `version: '3'
services:
  app:
    image: your-image:latest
    cpu: 256
    memory: 512
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 1
      placement:
        constraints:
          - engine.labels.operatingsystem == linux`
  },
  'cloud-function': { 
    name: 'Google Cloud Function', 
    icon: '⚡', 
    color: 'text-yellow-500',
    formFields: [
      { name: 'memory', type: 'select', label: 'Memoria', options: [
        { value: '128MB', label: '128 MB' },
        { value: '256MB', label: '256 MB' },
        { value: '512MB', label: '512 MB' },
        { value: '1GB', label: '1 GB' }
      ], defaultValue: '256MB' },
      { name: 'timeout', type: 'number', label: 'Timeout (segundos)', defaultValue: 60 },
      { name: 'maxInstances', type: 'number', label: 'Máximo de Instancias', defaultValue: 100 }
    ],
    yamlTemplate: `name: your-function
runtime: nodejs18
entryPoint: yourFunction
trigger:
  http: true
memory: 256MB
timeout: 60s
maxInstances: 100
environment:
  NODE_ENV: production`
  },
  'kubernetes': { 
    name: 'Kubernetes Cluster', 
    icon: '☸️', 
    color: 'text-indigo-500',
    formFields: [
      { name: 'replicas', type: 'number', label: 'Réplicas', defaultValue: 3 },
      { name: 'cpu', type: 'select', label: 'CPU', options: [
        { value: '100m', label: '0.1 CPU' },
        { value: '200m', label: '0.2 CPU' },
        { value: '500m', label: '0.5 CPU' },
        { value: '1000m', label: '1 CPU' }
      ], defaultValue: '500m' },
      { name: 'memory', type: 'select', label: 'Memoria', options: [
        { value: '128Mi', label: '128 MiB' },
        { value: '256Mi', label: '256 MiB' },
        { value: '512Mi', label: '512 MiB' },
        { value: '1Gi', label: '1 GiB' }
      ], defaultValue: '512Mi' }
    ],
    yamlTemplate: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: your-app
  template:
    metadata:
      labels:
        app: your-app
    spec:
      containers:
      - name: your-app
        image: your-image:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi`
  },
  'docker-instance': { 
    name: 'Docker Instance', 
    icon: '🐳', 
    color: 'text-cyan-500',
    formFields: [
      { name: 'port', type: 'number', label: 'Puerto', defaultValue: 80 },
      { name: 'restartPolicy', type: 'select', label: 'Política de Reinicio', options: [
        { value: 'no', label: 'No reiniciar' },
        { value: 'always', label: 'Siempre reiniciar' },
        { value: 'unless-stopped', label: 'Reiniciar a menos que se detenga' },
        { value: 'on-failure', label: 'Reiniciar en caso de fallo' }
      ], defaultValue: 'unless-stopped' }
    ],
    yamlTemplate: `version: '3'
services:
  app:
    image: your-image:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`
  },
  'unknown': { 
    name: 'Desconocido', 
    icon: '❓', 
    color: 'text-gray-500',
    formFields: []
  }
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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [githubToken, setGithubToken] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedYaml, setSelectedYaml] = useState<string>('');
  const [isYamlModalOpen, setIsYamlModalOpen] = useState(false);
  const [selectedDeploymentForYaml, setSelectedDeploymentForYaml] = useState<Deployment | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Deployment['platform'] | null>(null);
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [githubDirectories, setGithubDirectories] = useState<GitHubDirectory[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');

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

  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setDeploymentConfig({
      platform: selectedPlatform!,
      repository: repo,
      name: repo.name,
      region: 'us-central1', // Default
      environment: 'development',
      config: {},
      branch: 'main',
      directory: '/'
    });
    setIsConfigModalOpen(true);
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
          repo: selectedRepo.full_name,
          companyId: companyIdFromParams,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create webhook');
      }

      message.success('Webhook creado exitosamente');
      
      // Actualizar lista de webhooks
      const hooksResponse = await fetch(`/api/github/webhooks?repo=${selectedRepo.full_name}`);
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
      const response = await fetch(`/api/github/webhooks/${hookId}?repo=${selectedRepo.full_name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }

      message.success('Webhook eliminado exitosamente');
      
      // Actualizar lista de webhooks
      const hooksResponse = await fetch(`/api/github/webhooks?repo=${selectedRepo.full_name}`);
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

  const handleViewYaml = (deployment: Deployment) => {
    setSelectedDeploymentForYaml(deployment);
    setSelectedYaml(platformConfig[deployment.platform]?.yamlTemplate || '');
    setIsYamlModalOpen(true);
  };

  const handleSaveYaml = async (yaml: string) => {
    if (!selectedDeploymentForYaml) return;
    
    try {
      // Aquí iría la lógica para guardar el YAML
      message.success('YAML guardado exitosamente');
      setIsYamlModalOpen(false);
    } catch (error) {
      message.error('Error al guardar el YAML');
    }
  };

  // Agrupar repositorios por directorio
  const groupedRepositories = useMemo(() => {
    const groups: Record<string, Repository[]> = {};
    repositories.forEach(repo => {
      const path = repo.path || 'root';
      if (!groups[path]) {
        groups[path] = [];
      }
      groups[path].push(repo);
    });
    return groups;
  }, [repositories]);

  const handlePlatformSelect = (platform: Deployment['platform']) => {
    setSelectedPlatform(platform);
    setSelectedRepo(null);
    setDeploymentConfig(null);
  };

  const handleConfigSave = async (config: DeploymentConfig) => {
    try {
      // Validar configuración
      const errors = validateDeploymentConfig(config);
      if (errors.length > 0) {
        message.error('Errores de validación: ' + errors.join(', '));
        return;
      }

      setIsDeploying(true);
      setDeploymentStatus('deploying');
      setDeploymentLogs([]);

      // Generar YAML
      const yamlConfig = generateYamlFromConfig(config);

      // Iniciar despliegue
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          yaml: yamlConfig,
          companyId: companyIdFromParams,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar el despliegue');
      }

      const { deploymentId } = await response.json();

      // Iniciar polling de estado
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/deployments/${deploymentId}/status`);
          const statusData = await statusResponse.json();

          setDeploymentLogs(prev => [...prev, statusData.log]);

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setDeploymentStatus('success');
            message.success('Despliegue completado exitosamente');
            setIsConfigModalOpen(false);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setDeploymentStatus('error');
            message.error('Error en el despliegue: ' + statusData.error);
          }
        } catch (error) {
          console.error('Error polling deployment status:', error);
        }
      }, 2000);

      // Limpiar intervalo después de 10 minutos
      setTimeout(() => {
        clearInterval(pollInterval);
        if (deploymentStatus === 'deploying') {
          setDeploymentStatus('error');
          message.error('Timeout en el despliegue');
        }
      }, 600000);

    } catch (error) {
      console.error('Error saving deployment:', error);
      message.error('Error al guardar la configuración');
      setDeploymentStatus('error');
    } finally {
      setIsDeploying(false);
    }
  };

  const validateDeploymentConfig = (config: DeploymentConfig): string[] => {
    const errors: string[] = [];
    const platform = platformConfig[config.platform];

    // Validaciones básicas
    if (!config.name) errors.push('El nombre del despliegue es requerido');
    if (!config.region) errors.push('La región es requerida');
    if (!config.branch) errors.push('La rama es requerida');
    if (!config.directory) errors.push('El directorio es requerido');

    // Validaciones específicas por plataforma
    switch (config.platform) {
      case 'cloud-run':
        if (!config.config.cpu) errors.push('La CPU es requerida para Cloud Run');
        if (!config.config.memory) errors.push('La memoria es requerida para Cloud Run');
        if (!config.config.port) errors.push('El puerto es requerido para Cloud Run');
        break;
      case 'ecs':
        if (!config.config.cpu) errors.push('La CPU es requerida para ECS');
        if (!config.config.memory) errors.push('La memoria es requerida para ECS');
        if (!config.config.minCount || !config.config.maxCount) {
          errors.push('El número de instancias es requerido para ECS');
        }
        break;
      // Añadir validaciones para otras plataformas
    }

    return errors;
  };

  const generateYamlFromConfig = (config: DeploymentConfig) => {
    const platform = platformConfig[config.platform];
    let yaml = platform.yamlTemplate || '';
    
    // Reemplazar valores en el YAML según la configuración
    Object.entries(config.config).forEach(([key, value]) => {
      yaml = yaml.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
    });
    
    return yaml;
  };

  const fetchRepositoryStructure = async (repoFullName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/github/repository-structure?repo=${repoFullName}`);
      const data = await response.json();
      setGithubDirectories(data);
    } catch (error) {
      console.error('Error fetching repository structure:', error);
      message.error('Error al obtener la estructura del repositorio');
    } finally {
      setLoading(false);
    }
  };

  const renderDirectoryTree = (directories: GitHubDirectory[], level = 0) => {
    return directories.map(dir => (
      <div key={dir.path} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center gap-2 py-1">
          <button
            onClick={() => setSelectedDirectory(dir.path)}
            className={`flex items-center gap-2 px-2 py-1 rounded ${
              selectedDirectory === dir.path ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            {dir.type === 'dir' ? (
              <FolderIcon className="h-4 w-4" />
            ) : (
              <DocumentIcon className="h-4 w-4" />
            )}
            <span>{dir.name}</span>
          </button>
        </div>
        {dir.children && renderDirectoryTree(dir.children, level + 1)}
      </div>
    ));
  };

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
            <div className="flex gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RocketLaunchIcon className="h-5 w-5" />
                Nuevo Despliegue
              </button>
              <button
                onClick={() => router.push('/deployments/templates')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <CodeBracketIcon className="h-5 w-5" />
                Plantillas
              </button>
            </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <ServerIcon className="h-5 w-5 text-orange-500" />
                  <span>AWS ECS & Fargate</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CubeIcon className="h-5 w-5 text-blue-500" />
                  <span>Google Cloud Run</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CpuChipIcon className="h-5 w-5 text-indigo-500" />
                  <span>Kubernetes</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <BoltIcon className="h-5 w-5 text-yellow-500" />
                  <span>Cloud Functions</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <CommandLineIcon className="h-5 w-5 text-cyan-500" />
                  <span>Docker Instances</span>
                </div>
              </div>
              <Text className="mt-4 block">
                Cada despliegue incluye su configuración YAML equivalente para máxima flexibilidad y control.
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

        {/* Platform Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Selecciona una Plataforma</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(platformConfig).filter(([key]) => key !== 'unknown').map(([key, config]) => (
              <button
                key={key}
                onClick={() => handlePlatformSelect(key as Deployment['platform'])}
                className={`p-4 rounded-lg border transition-all ${
                  selectedPlatform === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-500">Despliega tu aplicación en {config.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Content */}
        {selectedPlatform && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{platformConfig[selectedPlatform].icon}</span>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {platformConfig[selectedPlatform].name}
                </h2>
                <p className="text-gray-600">
                  Configura y despliega tus aplicaciones en {platformConfig[selectedPlatform].name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Repository Selection */}
              <div className="col-span-4">
                <h3 className="text-lg font-medium mb-4">Repositorios</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {Object.entries(groupedRepositories).map(([path, repos]) => (
                    <div key={path} className="border-b border-gray-200 last:border-b-0">
                      <div className="p-3 bg-gray-50">
                        <h4 className="font-medium text-gray-900">
                          {path === 'root' ? 'Repositorios Principales' : path}
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {repos.map(repo => (
                          <button
                            key={repo.id}
                            onClick={() => handleRepoSelect(repo)}
                            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                              selectedRepo?.id === repo.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <GithubOutlined className="text-xl" />
                              <div>
                                <h4 className="font-medium text-gray-900">{repo.name}</h4>
                                <p className="text-sm text-gray-500">{repo.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Directory Structure */}
              {selectedRepo && (
                <div className="col-span-8">
                  <h3 className="text-lg font-medium mb-4">Estructura del Repositorio</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    {renderDirectoryTree(githubDirectories)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deployment Configuration Modal */}
        <Modal
          title={`Configurar Despliegue - ${selectedPlatform && platformConfig[selectedPlatform]?.name}`}
          open={isConfigModalOpen}
          onCancel={() => setIsConfigModalOpen(false)}
          width={800}
          footer={[
            <Button key="cancel" onClick={() => setIsConfigModalOpen(false)}>
              Cancelar
            </Button>,
            <Button
              key="save"
              type="primary"
              loading={isDeploying}
              onClick={() => deploymentConfig && handleConfigSave(deploymentConfig)}
            >
              {isDeploying ? 'Desplegando...' : 'Guardar y Desplegar'}
            </Button>,
          ]}
        >
          {deploymentConfig && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Despliegue
                    </label>
                    <Input
                      value={deploymentConfig.name}
                      onChange={e => setDeploymentConfig({...deploymentConfig, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Región
                    </label>
                    <Select
                      value={deploymentConfig.region}
                      onChange={value => setDeploymentConfig({...deploymentConfig, region: value})}
                      style={{ width: '100%' }}
                    >
                      <Option value="us-central1">us-central1</Option>
                      <Option value="us-east1">us-east1</Option>
                      <Option value="europe-west1">europe-west1</Option>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Configuración del Repositorio</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rama
                    </label>
                    <Select
                      value={deploymentConfig.branch}
                      onChange={value => setDeploymentConfig({...deploymentConfig, branch: value})}
                      style={{ width: '100%' }}
                    >
                      <Option value="main">main</Option>
                      <Option value="master">master</Option>
                      <Option value="develop">develop</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Directorio
                    </label>
                    <Input
                      value={deploymentConfig.directory}
                      onChange={e => setDeploymentConfig({...deploymentConfig, directory: e.target.value})}
                      placeholder="/"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Configuración de Build</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comando de Build
                    </label>
                    <Input
                      value={deploymentConfig.buildConfig?.buildCommand}
                      onChange={e => setDeploymentConfig({
                        ...deploymentConfig,
                        buildConfig: {...deploymentConfig.buildConfig, buildCommand: e.target.value}
                      })}
                      placeholder="npm run build"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Directorio de Salida
                    </label>
                    <Input
                      value={deploymentConfig.buildConfig?.outputDirectory}
                      onChange={e => setDeploymentConfig({
                        ...deploymentConfig,
                        buildConfig: {...deploymentConfig.buildConfig, outputDirectory: e.target.value}
                      })}
                      placeholder="dist"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Configuración de {platformConfig[selectedPlatform!]?.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {platformConfig[selectedPlatform!]?.formFields.map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <Select
                          value={deploymentConfig.config[field.name] || field.defaultValue}
                          onChange={value => setDeploymentConfig({
                            ...deploymentConfig,
                            config: {...deploymentConfig.config, [field.name]: value}
                          })}
                          style={{ width: '100%' }}
                        >
                          {field.options?.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={deploymentConfig.config[field.name] || field.defaultValue}
                          onChange={e => setDeploymentConfig({
                            ...deploymentConfig,
                            config: {...deploymentConfig.config, [field.name]: e.target.value}
                          })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment Logs */}
              {isDeploying && (
                <div>
                  <h3 className="font-medium mb-2">Logs de Despliegue</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-40">
                    {deploymentLogs.map((log, index) => (
                      <div key={index} className="mb-1">{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* YAML Preview */}
              <div>
                <h3 className="font-medium mb-2">YAML de Configuración</h3>
                <MonacoEditor
                  height="300px"
                  language="yaml"
                  theme="vs-dark"
                  value={generateYamlFromConfig(deploymentConfig)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    readOnly: true,
                  }}
                />
              </div>
            </div>
          )}
        </Modal>

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
                          onClick={() => handleViewYaml(deployment)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Ver YAML"
                        >
                          <CodeBracketIcon className="h-4 w-4" />
                        </button>
                        
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
                    <Tabs
                      items={[
                        {
                          key: 'metrics',
                          label: 'Métricas',
                          children: (
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
                                <h4 className="font-medium text-gray-900 mb-3">Logs Recientes</h4>
                                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-40">
                                  <pre>
                                    {`[INFO] Server started on port 8080
[INFO] Connected to database
[INFO] Cache initialized
[INFO] Processing request...`}
                                  </pre>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-3">Estado del Despliegue</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Último Despliegue:</span>
                                    <span className="text-gray-900">{formatDate(deployment.lastDeployed)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Versión:</span>
                                    <span className="text-gray-900">{deployment.version}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Región:</span>
                                    <span className="text-gray-900">{deployment.region}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        },
                        {
                          key: 'yaml',
                          label: 'YAML',
                          children: (
                            <div className="mt-4">
                              <MonacoEditor
                                height="400px"
                                language="yaml"
                                theme="vs-dark"
                                value={platformConfig[deployment.platform]?.yamlTemplate || ''}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  wordWrap: 'on',
                                }}
                              />
                              <div className="mt-4 flex justify-end">
                                <Button
                                  type="primary"
                                  onClick={() => handleViewYaml(deployment)}
                                  icon={<CodeOutlined />}
                                >
                                  Editar YAML
                                </Button>
                              </div>
                            </div>
                          ),
                        },
                      ]}
                    />
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

        {/* YAML Editor Modal */}
        <Modal
          title="Editor YAML"
          open={isYamlModalOpen}
          onCancel={() => setIsYamlModalOpen(false)}
          width={800}
          footer={[
            <Button key="cancel" onClick={() => setIsYamlModalOpen(false)}>
              Cancelar
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={() => handleSaveYaml(selectedYaml)}
            >
              Guardar Cambios
            </Button>,
          ]}
        >
          <MonacoEditor
            height="500px"
            language="yaml"
            theme="vs-dark"
            value={selectedYaml}
            onChange={(value) => setSelectedYaml(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
            }}
          />
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
    </div>
  );
}
