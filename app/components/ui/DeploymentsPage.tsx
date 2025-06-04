"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  RocketLaunchIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  FolderIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { Button, Card, List, Modal, Input, message, Spin, Select, Switch, Typography, Space, Alert, Tabs } from 'antd';
import { GithubOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import MonacoEditor from '@monaco-editor/react';
import { 
  Deployment, 
  Repository, 
  DeploymentConfig, 
  DeploymentStep, 
  EnvironmentVariable,
  EnvironmentDefinition, // Importar nuevo tipo
  DeploymentTriggerTypeEnum // Importar enum
  // DeploymentConfigurationOut // No se necesita importar si usamos DeploymentConfig o any
} from '@/app/types/deployments';
import { platformConfig } from '@/app/config/platforms';

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
];

const statusConfig = {
  running: { color: 'text-green-600 bg-green-50', icon: CheckCircleIcon, label: 'Ejecutándose' },
  stopped: { color: 'text-gray-600 bg-gray-50', icon: StopIcon, label: 'Detenido' },
  deploying: { color: 'text-blue-600 bg-blue-50', icon: ArrowPathIcon, label: 'Desplegando' },
  failed: { color: 'text-red-600 bg-red-50', icon: ExclamationTriangleIcon, label: 'Fallido' },
  pending: { color: 'text-yellow-600 bg-yellow-50', icon: ClockIcon, label: 'Pendiente' }
};

// const AVAILABLE_ENVIRONMENTS = ['development', 'sandbox', 'qa', 'staging', 'production', 'demo']; // Se obtendrá del backend

const environmentDisplayConfig: Record<string, { color: string; label: string }> = {
  production: { color: 'text-red-700 bg-red-100', label: 'Producción' },
  staging: { color: 'text-yellow-700 bg-yellow-100', label: 'Staging' },
  development: { color: 'text-green-700 bg-green-100', label: 'Desarrollo' },
  sandbox: { color: 'text-purple-700 bg-purple-100', label: 'Sandbox'},
  qa: { color: 'text-cyan-700 bg-cyan-100', label: 'QA'},
  demo: { color: 'text-pink-700 bg-pink-100', label: 'Demo'}
};

const providerConfig = {
  aws: { name: 'AWS', icon: '🟧', color: 'text-orange-600' },
  gcp: { name: 'GCP', icon: '🟦', color: 'text-blue-600' },
  azure: { name: 'Azure', icon: '🟨', color: 'text-sky-600' },
  kubernetes: { name: 'Kubernetes', icon: '☸️', color: 'text-indigo-600' },
  docker: { name: 'Docker', icon: '🐳', color: 'text-cyan-600' }
};

interface DeploymentsPageProps {
  companyId?: string;
}

const { Title, Text } = Typography;
const { Option } = Select;

export default function DeploymentsPage({ companyId: _companyId }: DeploymentsPageProps) {
  const params = useParams();
  const router = useRouter();
  const companyIdFromParams = params.companyId as string;
  
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments); // Lista de despliegues ejecutados/históricos
  const [availableEnvironments, setAvailableEnvironments] = useState<EnvironmentDefinition[]>([]);
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(null);
  const [selectedEnvironmentFilter, _setSelectedEnvironmentFilter] = useState<string>('all'); 
  const [selectedProviderFilter, _setSelectedProviderFilter] = useState<string>('all'); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Para el modal simple de creación (placeholder)
  const [newDeploymentName, setNewDeploymentName] = useState('');
  const [newDeploymentPlatform, setNewDeploymentPlatform] = useState<Deployment['platform'] | undefined>(undefined);
  
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedYaml, setSelectedYaml] = useState<string>('');
  const [isYamlModalOpen, setIsYamlModalOpen] = useState(false);
  const [selectedDeploymentForYaml, setSelectedDeploymentForYaml] = useState<Deployment | null>(null);
  
  const [selectedPlatform, setSelectedPlatform] = useState<Deployment['platform'] | null>(null);
  const [deploymentConfig, setDeploymentConfig] = useState<Partial<DeploymentConfig> | null>(null); // Usar Partial para el formulario
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  const [isRepoSelectorModalOpen, setIsRepoSelectorModalOpen] = useState(false);
  const [repoSearchTerm, setRepoSearchTerm] = useState('');
  const [currentSelectedRepoForConfig, setCurrentSelectedRepoForConfig] = useState<Repository | null>(null);

  const [isDeploying, setIsDeploying] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');

  const fetchAvailableEnvironments = async () => {
    if (!companyIdFromParams) return;
    try {
      const response = await fetch(`/api/v1/companies/${companyIdFromParams}/environments`); // Ajustar al endpoint real
      if (!response.ok) throw new Error('Failed to fetch environments');
      const data: EnvironmentDefinition[] = await response.json();
      setAvailableEnvironments(data);
    } catch (error) {
      console.error("Error fetching environments:", error);
      message.error("Error al cargar los ambientes disponibles.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const connResponse = await fetch('/api/auth/github/check');
        const connData = await connResponse.json();
        setIsConnected(connData.connected);
        if (connData.connected) {
          await fetchRepositories();
        }
        await fetchAvailableEnvironments();
      } catch (error) { console.error('Error initializing page data:', error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [companyIdFromParams]);

  const fetchRepositories = async () => {
    // ... (sin cambios)
    try {
      // setLoading(true); // setLoading ya está en fetchData
      const response = await fetch('/api/github/repositories');
      const repos = await response.json();
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      message.error('Error al obtener los repositorios');
    } 
    // finally { setLoading(false); }
  };
  
  const handleRepoSelectForConfig = (repo: Repository) => {
    setCurrentSelectedRepoForConfig(repo);
    if (selectedPlatform && availableEnvironments.length > 0) {
      const platformDetails = platformConfig[selectedPlatform];
      const initialConfigValues = platformDetails.formFields.reduce((acc, field) => {
        if (field.defaultValue !== undefined) {
          acc[field.name] = field.defaultValue;
        }
        return acc;
      }, {} as Record<string, string | number | boolean>);

      setDeploymentConfig({
        company_id: companyIdFromParams,
        platform: selectedPlatform,
        repository: repo, 
        name: `${repo.name}-${selectedPlatform}-${availableEnvironments[0]?.name || 'default'}`, 
        region: 'us-central1', 
        environment_id: availableEnvironments[0]?.id || '', 
        config: initialConfigValues, // Esto será platform_specific_config para el backend
        branch: repo.default_branch || 'main',
        directory: '/',
        trigger_type: DeploymentTriggerTypeEnum.MANUAL,
        is_active: true,
        preDeploySteps: [],
        postDeploySteps: [],
        environmentVariables: []
      });
    } else if (availableEnvironments.length === 0) {
        message.warning("No hay ambientes configurados. Por favor, configure uno primero.");
    }
    setIsRepoSelectorModalOpen(false);
  };

  const filteredDeployments = deployments.filter(deployment => {
    const environmentMatch = selectedEnvironmentFilter === 'all' || deployment.environment === selectedEnvironmentFilter;
    const providerMatch = selectedProviderFilter === 'all' || deployment.provider === selectedProviderFilter;
    return environmentMatch && providerMatch;
  });

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const handleDeploymentAction = (deploymentId: string, action: string) => console.log(`Performing ${action} on deployment ${deploymentId}`);
  
  const handleViewYaml = (deployment: Deployment) => {
    setSelectedDeploymentForYaml(deployment);
    const config = platformConfig[deployment.platform];
    setSelectedYaml(config?.yamlTemplate || '# No YAML template available');
    setIsYamlModalOpen(true);
  };

  const handleSaveYaml = async (_yaml: string) => {
    if (!selectedDeploymentForYaml) return;
    try { message.success('YAML guardado exitosamente (simulado)'); setIsYamlModalOpen(false); } 
    catch (_error) { message.error('Error al guardar el YAML'); }
  };
  
  const handlePlatformSelect = (platform: Deployment['platform']) => {
    setSelectedPlatform(platform);
    setCurrentSelectedRepoForConfig(null); 
    setDeploymentConfig(null); 
    if (availableEnvironments.length === 0) {
        message.warning("No hay ambientes configurados para esta compañía. Por favor, cree uno antes de configurar un despliegue.");
        // Opcionalmente, no abrir el modal si no hay ambientes:
        // return; 
    }
    setIsConfigModalOpen(true);
  };

  const handleSaveConfigurationOnly = async (currentConfig: Partial<DeploymentConfig> | null) => {
    if (!currentConfig || !currentSelectedRepoForConfig || !companyIdFromParams || !currentConfig.environment_id) {
      message.error("Faltan datos para guardar la configuración: Repositorio, ambiente o compañía no especificados.");
      return;
    }

    // Construir el payload completo para el backend
    // Este payload debe coincidir con DeploymentConfigurationCreate del backend
    const backendPayload = {
      company_id: companyIdFromParams,
      name: currentConfig.name || "Unnamed Deployment",
      repository_id: String(currentSelectedRepoForConfig.id),
      repository_full_name: currentSelectedRepoForConfig.full_name,
      platform: currentConfig.platform!,
      environment_id: currentConfig.environment_id!,
      region: currentConfig.region || "us-central1",
      branch: currentConfig.branch || "main",
      directory: currentConfig.directory || "/",
      platform_specific_config: currentConfig.config || {},
      build_config: currentConfig.buildConfig,
      pre_deploy_steps: currentConfig.preDeploySteps || [],
      post_deploy_steps: currentConfig.postDeploySteps || [],
      environment_variables: currentConfig.environmentVariables || [],
      trigger_type: currentConfig.trigger_type || DeploymentTriggerTypeEnum.MANUAL,
      description: currentConfig.description,
      is_active: currentConfig.is_active !== undefined ? currentConfig.is_active : true,
    };
    
    // Validar el objeto que se va a enviar (que es de tipo DeploymentConfig del frontend)
    // La validación se hace sobre el objeto que tiene la estructura del frontend
    // pero el payload enviado debe tener la estructura del backend.
    const frontendValidationObject: DeploymentConfig = {
        ...currentConfig,
        company_id: companyIdFromParams,
        repository: currentSelectedRepoForConfig, // Para que pase la validación del frontend
        name: backendPayload.name,
        platform: backendPayload.platform,
        environment_id: backendPayload.environment_id,
        region: backendPayload.region,
        branch: backendPayload.branch,
        directory: backendPayload.directory,
        config: backendPayload.platform_specific_config, // Mapear de nuevo para la validación
        trigger_type: backendPayload.trigger_type,
        is_active: backendPayload.is_active
    };

    const validationErrors = validateDeploymentConfig(frontendValidationObject); 
    if (validationErrors.length > 0) {
      message.error('Errores de validación: ' + validationErrors.join(', '));
      return;
    }

    setIsSavingConfig(true);
    try {
      const response = await fetch(`/api/v1/companies/${companyIdFromParams}/deployment-configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save deployment configuration');
      }
      const savedConfig: DeploymentConfig = await response.json(); // Usar el tipo DeploymentConfig del frontend
      message.success(`Configuración "${savedConfig.name}" guardada exitosamente.`);
      // Actualizar el estado local con el ID de la configuración guardada
      setDeploymentConfig(prev => ({...prev, id: savedConfig.id })); // Solo actualizar el ID, el resto ya está en el estado
      // Opcionalmente, recargar la lista de configuraciones/despliegues si se muestra en la UI principal
    } catch (error) {
      console.error('Error saving configuration:', error);
      message.error(`Error al guardar la configuración: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSavingConfig(false);
    }
  };
  
  const handleDeploy = async (currentConfig: Partial<DeploymentConfig> | null) => {
    // ... (lógica de despliegue simulada por ahora, podría llamar a un endpoint de backend en el futuro)
    if (!currentConfig || !currentConfig.id) {
        message.error("Guarda la configuración primero o selecciona una configuración existente para desplegar.");
        // Opcionalmente, llamar a handleSaveConfigurationOnly y luego desplegar
        // if (currentConfig && !currentConfig.id) {
        //   await handleSaveConfigurationOnly(currentConfig);
        //   // Aquí necesitarías obtener el ID de la config recién guardada para proceder
        // }
        return;
    }
    message.info(`Simulando despliegue para la configuración ID: ${currentConfig.id}`);
    // ... (resto de la lógica de simulación de despliegue)
  };

  const validateDeploymentConfig = (config: DeploymentConfig): string[] => {
    const errors: string[] = [];
    if (!config.name) errors.push('El nombre del despliegue es requerido');
    if (!config.region) errors.push('La región es requerida');
    if (!config.branch) errors.push('La rama es requerida');
    if (!config.directory) errors.push('El directorio es requerido');
    if (!config.environment_id) errors.push('El ambiente es requerido');
    if (!config.platform) errors.push('La plataforma es requerida');
    if (!config.repository || !config.repository.id) errors.push('El repositorio es requerido');
    return errors;
  };

  const generateYamlFromConfig = (config: Partial<DeploymentConfig> | null): string => {
    if (!config || !config.platform || !config.repository || !config.environment_id) return "Faltan datos para generar YAML.";
  
    const platformDetails = platformConfig[config.platform];
    if (!platformDetails) return `Error: No se encontró configuración para la plataforma ${config.platform}`;
    
    let baseYaml = platformDetails.yamlTemplate || `platform: ${config.platform}\nname: ${config.name}\n# No template found`;
    
    const selectedEnv = availableEnvironments.find(e => e.id === config.environment_id);

    const replacements: Record<string, string | number | boolean | undefined> = {
      ...(config.config || {}), // platform_specific_config
      service_name: config.name,
      app_name: config.name,
      function_name: config.name,
      image_name: config.repository.full_name, 
      region: config.region,
      environment_name: selectedEnv?.name || config.environment_id,
    };
  
    Object.entries(replacements).forEach(([key, value]) => {
      if (value !== undefined) {
        baseYaml = baseYaml.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    });
    // ... (resto de la lógica de generación de YAML sin cambios)
    let finalYaml = baseYaml;
    const indent = '  '; 
  
    if (config.environmentVariables && config.environmentVariables.length > 0) {
      const activeEnvVars = config.environmentVariables.filter(ev => ev.enabled && ev.key);
      if (activeEnvVars.length > 0) {
        let envBlockString = '';
        const isKubeLike = finalYaml.includes('apiVersion: serving.knative.dev/v1') || finalYaml.includes('apiVersion: apps/v1');
        
        if (isKubeLike) {
          envBlockString = activeEnvVars.map(ev => `${indent.repeat(4)}- name: ${ev.key}\n${indent.repeat(4)}  value: "${ev.isSecret ? '********' : ev.value}"`).join('\n');
          const containerRegex = /(\n\s*containers:\s*\n(?:.|\n)*?)(?=\n\s*\w+:|$)/m;
          if (finalYaml.match(containerRegex)) {
            finalYaml = finalYaml.replace(containerRegex, (match, p1) => {
              if (p1.includes('env:')) { return match; }
              return `${p1.trimEnd()}\n${indent.repeat(3)}env:\n${envBlockString}\n`;
            });
          } else { 
            finalYaml += `\n${indent.repeat(2)}spec:\n${indent.repeat(3)}template:\n${indent.repeat(4)}spec:\n${indent.repeat(5)}containers:\n${envBlockString}`;
          }
        } else { 
          envBlockString = activeEnvVars.map(ev => `${indent.repeat(2)}${ev.key}: "${ev.isSecret ? '********' : ev.value}"`).join('\n');
          const serviceRegex = /(\n\s*services:\s*\n\s*\S+:\s*\n(?:.|\n)*?)(?=\n\s*\w+:|$)/m;
           if (finalYaml.match(serviceRegex)) {
             finalYaml = finalYaml.replace(serviceRegex, (match, p1) => {
              if (p1.includes('environment:')) { return match; }
              return `${p1.trimEnd()}\n${indent}environment:\n${envBlockString}\n`;
            });
           } else {
             finalYaml += `\n${indent}environment:\n${envBlockString}`;
           }
        }
      }
    }
  
    if (config.preDeploySteps && config.preDeploySteps.length > 0) {
      const activeSteps = config.preDeploySteps.filter(s => s.enabled && s.name && s.content);
      if (activeSteps.length > 0) {
        finalYaml += `\nx-infraux-pre-deploy-steps:\n` + activeSteps.map(step => 
          `${indent}- name: "${step.name}"\n${indent}  type: "${step.type}"\n${indent}  content: |\n${step.content.split('\n').map(line => `${indent.repeat(3)}${line}`).join('\n')}`
        ).join('\n');
      }
    }
  
    if (config.postDeploySteps && config.postDeploySteps.length > 0) {
       const activeSteps = config.postDeploySteps.filter(s => s.enabled && s.name && s.content);
       if (activeSteps.length > 0) {
        finalYaml += `\nx-infraux-post-deploy-steps:\n` + activeSteps.map(step => 
          `${indent}- name: "${step.name}"\n${indent}  type: "${step.type}"\n${indent}  content: |\n${step.content.split('\n').map(line => `${indent.repeat(3)}${line}`).join('\n')}`
        ).join('\n');
      }
    }
    
    finalYaml = finalYaml.replace(/\{\{[^}]*\}\}/g, '# YOUR_VALUE_HERE'); 
    return finalYaml;
  };

  const filteredRepositories = useMemo(() => {
    if (!repoSearchTerm) return repositories;
    return repositories.filter(repo => repo.full_name.toLowerCase().includes(repoSearchTerm.toLowerCase()));
  }, [repositories, repoSearchTerm]);


  if (loading && !isConnected) { 
    return <div className="p-6"><Title level={2}>Despliegues</Title><Card><div className="flex justify-center items-center p-8"><Spin size="large" /></div></Card></div>;
  }

  if (!isConnected) {
    return <div className="p-6"><Title level={2}>Despliegues</Title><Card><Alert message="No conectado a GitHub" description={<Space direction="vertical"><Text>Para gestionar despliegues, primero necesitas conectar tu cuenta de GitHub.</Text><Button type="primary" onClick={() => router.push(`/company/${companyIdFromParams}#credentials`)}>Ir a Credenciales</Button></Space>} type="warning" showIcon /></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ... (Header y Alert sin cambios) ... */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><RocketLaunchIcon className="h-8 w-8 text-blue-600" />Despliegues Universales</h1><p className="text-gray-600 mt-2">Gestiona, monitorea y lanza tus aplicaciones a múltiples plataformas cloud y on-premise.</p></div>
          </div>
        </div>
        <Alert message="Potencia de Despliegue Universal a tu Alcance" description={<div><Text>InfraUX te permite desplegar tus aplicaciones y servicios a una amplia gama de plataformas.</Text><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">{Object.values(platformConfig).filter(p=>p.name !== 'Desconocido').map(p=>(<div key={p.platformType} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200"><span className={`text-xl ${p.color}`}>{p.icon}</span><span>{p.name}</span></div>))}</div><Text className="mt-4 block">Cada despliegue incluye su configuración YAML equivalente para máxima flexibilidad y control.</Text></div>} type="info" showIcon className="mb-8"/>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Selecciona una Plataforma de Destino para Configurar un Nuevo Despliegue</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(platformConfig).filter(([key]) => key !== 'unknown').map(([key, config]) => (
              <button key={key} onClick={() => handlePlatformSelect(key as Deployment['platform'])} className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${selectedPlatform === key ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
                <span className="text-3xl mb-2">{config.icon}</span>
                <h3 className="font-medium text-gray-900 text-center">{config.name}</h3>
              </button>
            ))}
          </div>
        </div>
        
        <Modal
          title={selectedPlatform ? `Configurar Despliegue: ${platformConfig[selectedPlatform]?.name}` : "Configurar Despliegue"}
          open={isConfigModalOpen}
          onCancel={() => { setIsConfigModalOpen(false); setCurrentSelectedRepoForConfig(null); setDeploymentConfig(null); setSelectedPlatform(null); setDeploymentStatus('idle'); setDeploymentLogs([]); }}
          width="95vw" 
          style={{ top: 20, maxWidth: '1400px' }}
          footer={[
            <Button key="cancel" onClick={() => { setIsConfigModalOpen(false); setCurrentSelectedRepoForConfig(null); setDeploymentConfig(null); setSelectedPlatform(null); setDeploymentStatus('idle'); setDeploymentLogs([]); }}>Cancelar</Button>,
            <Button key="saveConfig" onClick={() => handleSaveConfigurationOnly(deploymentConfig)} loading={isSavingConfig} disabled={!currentSelectedRepoForConfig || !deploymentConfig || isDeploying}>Guardar Configuración</Button>,
            <Button key="deploy" type="primary" loading={isDeploying} onClick={() => handleDeploy(deploymentConfig)} disabled={!currentSelectedRepoForConfig || !deploymentConfig || isSavingConfig || !deploymentConfig?.id}>
              {isDeploying ? 'Desplegando...' : 'Desplegar'}
            </Button>,
          ]}
        >
          {selectedPlatform && (
            <div className="grid grid-cols-12 gap-x-6" style={{ minHeight: '75vh' }}>
              <div className="col-span-3 space-y-4 border-r border-gray-200 pr-4 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 40px)' }}>
                {/* ... (Panel de Repositorio sin cambios) ... */}
                <h3 className="text-lg font-semibold text-gray-800 sticky top-0 bg-white py-2 z-10">Fuente del Repositorio</h3>
                {currentSelectedRepoForConfig ? (
                  <Card size="small" className="shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <GithubOutlined className="text-gray-600" />
                      <Text strong className="text-gray-700">{currentSelectedRepoForConfig.full_name}</Text>
                    </div>
                    <Button onClick={() => setIsRepoSelectorModalOpen(true)} block icon={<PlusOutlined />}>
                      Cambiar Repositorio
                    </Button>
                  </Card>
                ) : (
                  <Button type="dashed" onClick={() => setIsRepoSelectorModalOpen(true)} icon={<PlusOutlined />} block className="h-20">
                    Seleccionar Repositorio
                  </Button>
                )}
              </div>

              <div className="col-span-5 space-y-6 overflow-y-auto pr-4" style={{ maxHeight: 'calc(75vh - 40px)' }}>
                {!currentSelectedRepoForConfig && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FolderIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <Text type="secondary" className="text-center">Por favor, selecciona un repositorio para configurar el despliegue.</Text>
                  </div>
                )}
                {deploymentConfig && currentSelectedRepoForConfig && selectedPlatform && (
                  <>
                    <div><h3 className="font-medium mb-2 text-gray-700">Información Básica</h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Despliegue</label><Input value={deploymentConfig.name} onChange={e => setDeploymentConfig(prev => ({...prev!, name: e.target.value}))}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label><Select value={deploymentConfig.environment_id} onChange={value => setDeploymentConfig(prev => ({...prev!, environment_id: value}))} style={{ width: '100%' }} placeholder="Seleccionar ambiente" disabled={availableEnvironments.length === 0}>{availableEnvironments.map(env => (<Option key={env.id} value={env.id}>{env.name.charAt(0).toUpperCase() + env.name.slice(1)}</Option>))}</Select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Región</label><Select value={deploymentConfig.region} onChange={value => setDeploymentConfig(prev => ({...prev!, region: value}))} style={{ width: '100%' }}><Option value="us-central1">us-central1</Option><Option value="us-east1">us-east1</Option><Option value="europe-west1">europe-west1</Option></Select></div></div></div>
                    <div><h3 className="font-medium mb-2 text-gray-700">Disparador de Despliegue</h3><Select value={deploymentConfig.trigger_type} onChange={value => setDeploymentConfig(prev => ({...prev!, trigger_type: value}))} style={{ width: '100%' }}>{Object.values(DeploymentTriggerTypeEnum).map(type => (<Option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Option>))}</Select></div>
                    {/* ... (Resto de los campos del formulario sin cambios significativos, solo asegurar que usan setDeploymentConfig(prev => ({...prev!, ...})) ) ... */}
                    <div><h3 className="font-medium mb-2 text-gray-700">Configuración del Repositorio</h3><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Rama</label><Select value={deploymentConfig.branch} onChange={value => setDeploymentConfig(prev => ({...prev!, branch: value}))} style={{ width: '100%' }}><Option value="main">main</Option><Option value="master">master</Option><Option value="develop">develop</Option></Select></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Directorio</label><Input value={deploymentConfig.directory} onChange={e => setDeploymentConfig(prev => ({...prev!, directory: e.target.value}))} placeholder="/"/></div></div></div>
                    <div><h3 className="font-medium mb-2 text-gray-700">Configuración de Build</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Comando de Build</label><Input value={deploymentConfig.buildConfig?.buildCommand} onChange={e => setDeploymentConfig(prev => ({...prev!, buildConfig: {...prev!.buildConfig, buildCommand: e.target.value}}))} placeholder="npm run build"/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Directorio de Salida</label><Input value={deploymentConfig.buildConfig?.outputDirectory} onChange={e => setDeploymentConfig(prev => ({...prev!, buildConfig: {...prev!.buildConfig, outputDirectory: e.target.value}}))} placeholder="dist"/></div></div></div>
                    <div><h3 className="font-medium mb-2 text-gray-700">Variables de Entorno</h3>{deploymentConfig.environmentVariables?.map((envVar, index) => (<div key={envVar.id} className="grid grid-cols-12 gap-2 mb-2 items-center"><Input placeholder="KEY" value={envVar.key} onChange={e => {const newEnvVars = [...(deploymentConfig.environmentVariables || [])];newEnvVars[index].key = e.target.value;setDeploymentConfig(prev => ({...prev!, environmentVariables: newEnvVars}));}} className="col-span-4"/><Input placeholder="VALUE" type={envVar.isSecret ? 'password' : 'text'} value={envVar.value} onChange={e => {const newEnvVars = [...(deploymentConfig.environmentVariables || [])];newEnvVars[index].value = e.target.value;setDeploymentConfig(prev => ({...prev!, environmentVariables: newEnvVars}));}} className="col-span-4"/><Space className="col-span-3"><Text>Secreto:</Text><Switch checked={envVar.isSecret} onChange={checked => {const newEnvVars = [...(deploymentConfig.environmentVariables || [])];newEnvVars[index].isSecret = checked;setDeploymentConfig(prev => ({...prev!, environmentVariables: newEnvVars}));}}/></Space><Button icon={<DeleteOutlined />} onClick={() => {const newEnvVars = (deploymentConfig.environmentVariables || []).filter(ev => ev.id !== envVar.id);setDeploymentConfig(prev => ({...prev!, environmentVariables: newEnvVars}));}} danger className="col-span-1"/></div>))}<Button type="dashed" onClick={() => {const newEnvVar: EnvironmentVariable = {id: `env-${Date.now()}`,key: '',value: '',isSecret: false,enabled: true};setDeploymentConfig(prev => ({...prev!,environmentVariables: [...(prev!.environmentVariables || []), newEnvVar]}));}} icon={<PlusOutlined />} block>Añadir Variable</Button></div>
                    <div><h3 className="font-medium mb-2 text-gray-700">Pasos Pre-Despliegue</h3>{deploymentConfig.preDeploySteps?.map((step, index) => (<div key={step.id} className="mb-3 p-3 border rounded-md bg-white"><Input placeholder="Nombre del Paso" value={step.name} onChange={e => {const newSteps = [...(deploymentConfig.preDeploySteps || [])];newSteps[index].name = e.target.value;setDeploymentConfig(prev => ({...prev!, preDeploySteps: newSteps}));}} className="mb-2"/><Input.TextArea placeholder="Script o Comando" value={step.content} onChange={e => {const newSteps = [...(deploymentConfig.preDeploySteps || [])];newSteps[index].content = e.target.value;setDeploymentConfig(prev => ({...prev!, preDeploySteps: newSteps}));}} rows={3} className="mb-2 font-mono text-xs"/><Space><Text>Habilitado:</Text><Switch checked={step.enabled} onChange={checked => {const newSteps = [...(deploymentConfig.preDeploySteps || [])];newSteps[index].enabled = checked;setDeploymentConfig(prev => ({...prev!, preDeploySteps: newSteps}));}}/><Button icon={<DeleteOutlined />} onClick={() => {const newSteps = (deploymentConfig.preDeploySteps || []).filter(s => s.id !== step.id);setDeploymentConfig(prev => ({...prev!, preDeploySteps: newSteps}));}} danger/></Space></div>))}<Button type="dashed" onClick={() => {const newStep: DeploymentStep = {id: `pre-${Date.now()}`,name: '',type: 'command',content: '',enabled: true};setDeploymentConfig(prev => ({...prev!,preDeploySteps: [...(prev!.preDeploySteps || []), newStep]}));}} icon={<PlusOutlined />} block>Añadir Paso</Button></div>
                    <div><h3 className="font-medium mb-2 text-gray-700">Pasos Post-Despliegue</h3>{deploymentConfig.postDeploySteps?.map((step, index) => (<div key={step.id} className="mb-3 p-3 border rounded-md bg-white"><Input placeholder="Nombre del Paso" value={step.name} onChange={e => {const newSteps = [...(deploymentConfig.postDeploySteps || [])];newSteps[index].name = e.target.value;setDeploymentConfig(prev => ({...prev!, postDeploySteps: newSteps}));}} className="mb-2"/><Input.TextArea placeholder="Script o Comando" value={step.content} onChange={e => {const newSteps = [...(deploymentConfig.postDeploySteps || [])];newSteps[index].content = e.target.value;setDeploymentConfig(prev => ({...prev!, postDeploySteps: newSteps}));}} rows={3} className="mb-2 font-mono text-xs"/><Space><Text>Habilitado:</Text><Switch checked={step.enabled} onChange={checked => {const newSteps = [...(deploymentConfig.postDeploySteps || [])];newSteps[index].enabled = checked;setDeploymentConfig(prev => ({...prev!, postDeploySteps: newSteps}));}}/><Button icon={<DeleteOutlined />} onClick={() => {const newSteps = (deploymentConfig.postDeploySteps || []).filter(s => s.id !== step.id);setDeploymentConfig(prev => ({...prev!, postDeploySteps: newSteps}));}} danger/></Space></div>))}<Button type="dashed" onClick={() => {const newStep: DeploymentStep = {id: `post-${Date.now()}`,name: '',type: 'command',content: '',enabled: true};setDeploymentConfig(prev => ({...prev!,postDeploySteps: [...(prev!.postDeploySteps || []), newStep]}));}} icon={<PlusOutlined />} block>Añadir Paso</Button></div>
                    <div><h3 className="font-medium mb-2 text-gray-700">Configuración de {platformConfig[selectedPlatform!]?.name}</h3><div className="grid grid-cols-2 gap-4">{platformConfig[selectedPlatform!]?.formFields.map(field => (<div key={field.name}><label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>{field.type === 'select' ? (<Select value={deploymentConfig.config?.[field.name] || field.defaultValue} onChange={value => setDeploymentConfig(prev => ({...prev!, config: {...prev!.config, [field.name]: value}}))} style={{ width: '100%' }}>{field.options?.map(option => (<Option key={option.value} value={option.value}>{option.label}</Option>))}</Select>) : (<Input type={field.type} value={deploymentConfig.config?.[field.name] !== undefined ? String(deploymentConfig.config[field.name]) : String(field.defaultValue || '')} onChange={e => {let val: string | number | boolean = e.target.value; if (field.type === 'number') {val = parseFloat(e.target.value); if (isNaN(val)) val = '';} setDeploymentConfig(prev => ({...prev!,config: {...prev!.config, [field.name]: val }})); }}/>)}</div>))}</div></div>
                    
                    {(isDeploying || deploymentStatus !== 'idle') && (
                      <div>
                        <h3 className="font-medium mb-2 text-gray-700">Estado del Despliegue: {deploymentStatus}</h3>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto max-h-60">
                          {deploymentLogs.map((log, index) => (<div key={index} className="mb-1 whitespace-pre-wrap">{log}</div>))}
                          {isDeploying && deploymentStatus === 'deploying' && <Spin className="ml-2" />}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="col-span-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 40px)' }}>
                {/* ... (Panel YAML sin cambios) ... */}
                <h3 className="text-lg font-semibold text-gray-800 sticky top-0 bg-white py-2 z-10">YAML de Configuración (Vista Previa)</h3>
                {deploymentConfig && currentSelectedRepoForConfig ? (
                  <MonacoEditor
                    height="calc(100% - 40px)" 
                    language="yaml"
                    theme="vs-dark"
                    value={generateYamlFromConfig(deploymentConfig)}
                    options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', readOnly: true, scrollBeyondLastLine: false }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                      <CodeBracketIcon className="h-16 w-16 text-gray-300 mb-4" />
                      <Text type="secondary" className="text-center">La vista previa del YAML aparecerá aquí.</Text>
                    </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* ... (Modal de Selección de Repositorio y Lista de Despliegues Activos sin cambios significativos) ... */}
        <Modal
          title="Seleccionar Repositorio de Origen"
          open={isRepoSelectorModalOpen}
          onCancel={() => setIsRepoSelectorModalOpen(false)}
          footer={null} 
          width={600}
        >
          <Input
            placeholder="Buscar repositorio..."
            prefix={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
            value={repoSearchTerm}
            onChange={e => setRepoSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-96 overflow-y-auto">
            {loading && repositories.length === 0 && <div className="text-center p-4"><Spin /></div>}
            <List
              itemLayout="horizontal"
              dataSource={filteredRepositories}
              renderItem={repo => (
                <List.Item
                  onClick={() => handleRepoSelectForConfig(repo)}
                  className="hover:bg-gray-100 cursor-pointer p-3 rounded-md"
                >
                  <List.Item.Meta
                    avatar={<GithubOutlined className="text-xl text-gray-600" />}
                    title={<Text strong className="text-gray-700">{repo.full_name}</Text>}
                    description={<Text type="secondary" ellipsis>{repo.description || 'Sin descripción'}</Text>}
                  />
                </List.Item>
              )}
            />
            {!loading && filteredRepositories.length === 0 && (
              <Text type="secondary" className="text-center block p-4">No se encontraron repositorios.</Text>
            )}
          </div>
        </Modal>
        
        <div className="space-y-4 mt-12">
          <h2 className="text-2xl font-semibold mb-4">Despliegues Activos</h2>
          {filteredDeployments.length === 0 && !loading && (
             <Card><Text type="secondary">No hay despliegues activos que coincidan con los filtros.</Text></Card>
          )}
          {filteredDeployments.map((deployment) => {
            const isExpanded = expandedDeployment === deployment.id;
            const StatusIcon = statusConfig[deployment.status].icon;
            const currentEnvDisplay = environmentDisplayConfig[deployment.environment] || { label: deployment.environment, color: 'text-gray-700 bg-gray-100' };
            
            return (
              <div key={deployment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setExpandedDeployment(isExpanded ? null : deployment.id)} className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{deployment.name}</h3>
                        <p className="text-sm text-gray-600">{deployment.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${statusConfig[deployment.status].color}`}>
                        <StatusIcon className="h-4 w-4" />{statusConfig[deployment.status].label}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${currentEnvDisplay.color}`}>
                        {currentEnvDisplay.label}
                      </div>
                      <div className={`flex items-center gap-2 ${providerConfig[deployment.provider].color}`}>
                        <span className="text-lg">{providerConfig[deployment.provider].icon}</span>
                        <span className="text-sm font-medium">{providerConfig[deployment.provider].name}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${platformConfig[deployment.platform]?.color || platformConfig.unknown.color}`}>
                        <span className="text-xs">{platformConfig[deployment.platform]?.icon || platformConfig.unknown.icon}</span>
                        {platformConfig[deployment.platform]?.name || platformConfig.unknown.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleViewYaml(deployment)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver YAML"><CodeBracketIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDeploymentAction(deployment.id, 'view')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver detalles"><EyeIcon className="h-4 w-4" /></button>
                        {deployment.status === 'running' ? (<button onClick={() => handleDeploymentAction(deployment.id, 'stop')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Detener"><StopIcon className="h-4 w-4" /></button>) : (<button onClick={() => handleDeploymentAction(deployment.id, 'start')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Iniciar"><PlayIcon className="h-4 w-4" /></button>)}
                        <button onClick={() => handleDeploymentAction(deployment.id, 'redeploy')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Redesplegar"><ArrowPathIcon className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />Última actualización: {formatDate(deployment.lastDeployed)}</div>
                    <div>Región: {deployment.region}</div><div>Recursos: {deployment.resources}</div><div>Costo: ${deployment.cost.toFixed(2)}/mes</div><div>Versión: {deployment.version}</div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                     <Tabs items={[ { key: 'metrics', label: 'Métricas', children: <div>Métricas placeholder</div>, }, { key: 'yaml', label: 'YAML', children: <MonacoEditor height="300px" language="yaml" theme="vs-dark" value={platformConfig[deployment.platform]?.yamlTemplate || ''} options={{ readOnly: true }} />, }, ]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

         <Modal
          title="Editor YAML"
          open={isYamlModalOpen}
          onCancel={() => setIsYamlModalOpen(false)}
          width={800}
          footer={[ <Button key="cancel" onClick={() => setIsYamlModalOpen(false)}> Cancelar </Button>, <Button key="save" type="primary" onClick={() => handleSaveYaml(selectedYaml)}> Guardar Cambios </Button>, ]}
        >
          <MonacoEditor height="500px" language="yaml" theme="vs-dark" value={selectedYaml} onChange={(value) => setSelectedYaml(value || '')} options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', }} />
        </Modal>
        <Modal
          title="Crear Nuevo Despliegue (Simplificado)"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          onOk={() => {
            if (newDeploymentName && newDeploymentPlatform) {
              message.info("Utiliza la selección de plataforma para configurar un nuevo despliegue detallado.");
              setIsCreateModalOpen(false);
            } else {
              message.error('Por favor, completa el nombre y la plataforma.');
            }
          }}
          okText="Crear (Simulado)"
        >
           <Space direction="vertical" style={{ width: '100%' }}>
            <Input placeholder="Nombre del Despliegue" value={newDeploymentName} onChange={(e) => setNewDeploymentName(e.target.value)} />
            <Select placeholder="Seleccionar Plataforma de Destino" style={{ width: '100%' }} value={newDeploymentPlatform} onChange={(value) => setNewDeploymentPlatform(value as Deployment['platform'])} >
              {Object.keys(platformConfig).filter(p => p !== 'unknown').map((platformKey) => ( <Option key={platformKey} value={platformKey}> <Space> <span>{platformConfig[platformKey as Deployment['platform']].icon}</span> {platformConfig[platformKey as Deployment['platform']].name} </Space> </Option> ))}
            </Select>
            <Text type="secondary"> La configuración detallada se realiza al seleccionar una plataforma y luego un repositorio. </Text>
          </Space>
        </Modal>
      </div>
    </div>
  );
}
