export interface Deployment {
  id: string;
  name: string;
  environment: 'production' | 'staging' | 'development';
  provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'docker';
  platform: 'ecs' | 'cloud-run' | 'fargate' | 'cloud-function' | 'kubernetes' | 'docker-instance' | 'unknown' | 'functions';
  status: 'running' | 'stopped' | 'deploying' | 'failed' | 'pending';
  region: string;
  repositoryFullName?: string; // Añadido para la información del repositorio
  deploymentDirectory?: string; // Añadido para el directorio de despliegue
  lastDeployed: string;
  resources: number;
  cost: number;
  version: string;
  description?: string;
  repository?: Repository; // Añadido para almacenar el objeto repo reconstruido
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  default_branch: string;
  path?: string;
}

export interface GitHubDirectory {
  path: string;
  type: 'dir' | 'file';
  name: string;
  children?: GitHubDirectory[];
}

export enum DeploymentTriggerTypeEnum {
  MANUAL = "manual",
  WEBHOOK = "webhook",
  BOTH = "both"
}

export interface DeploymentConfig {
  id?: string; // ID si la configuración ya existe
  company_id?: string; // Necesario para enviar al backend
  platform: Deployment['platform'];
  repository: Repository; // Contiene id y full_name
  name: string;
  region: string;
  // environment: Deployment['environment']; // Cambiar a environment_id o un objeto Environment
  environment_id: string; // ID del EnvironmentDefinition del backend
  config: Record<string, string | number | boolean>; // platform_specific_config
  branch: string;
  directory: string;
  buildConfig?: {
    buildCommand?: string;
    outputDirectory?: string;
    environment?: Record<string, string>;
  };
  preDeploySteps?: DeploymentStep[];
  postDeploySteps?: DeploymentStep[];
  environmentVariables?: EnvironmentVariable[];
  trigger_type?: DeploymentTriggerTypeEnum;
  description?: string;
  is_active?: boolean;
}

export interface EnvironmentDefinition { // Para la lista de ambientes del backend
  id: string;
  name: string;
  description?: string;
  company_id: string;
  // color_tag?: string;
  created_at: string; // O Date
  updated_at: string; // O Date
}

export interface DeploymentStep {
  id: string;
  name: string;
  type: 'script' | 'command';
  content: string;
  enabled: boolean;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}
