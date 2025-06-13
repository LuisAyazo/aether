import { PlatformConfig } from './types';
import { Deployment } from "../../types/deployments";

import { ecsPlatformConfig } from './aws/ecs';
import { fargatePlatformConfig } from './aws/fargate';
import { cloudrunPlatformConfig } from './gcp/cloudrun';
import { cloudfunctionPlatformConfig } from './gcp/cloudfunction';
import { kubernetesDeploymentPlatformConfig } from './kubernetes/deployment';
import { dockerInstancePlatformConfig } from './docker/instance';

export const allPlatformConfigsArray: PlatformConfig[] = [
  ecsPlatformConfig,
  fargatePlatformConfig,
  cloudrunPlatformConfig,
  cloudfunctionPlatformConfig,
  kubernetesDeploymentPlatformConfig,
  dockerInstancePlatformConfig,
  // Configuración para 'unknown' si se decide mantenerla explícitamente
  {
    provider: 'unknown' as Deployment['provider'], // Cast si 'unknown' no es parte del tipo provider
    platformType: 'unknown',
    name: 'Desconocido',
    icon: '❓',
    color: 'text-gray-500',
    formFields: [],
    yamlTemplate: '# No configuration available for unknown platform type',
  }
];

export const platformConfigMap: Record<Deployment['platform'], PlatformConfig> = 
  allPlatformConfigsArray.reduce((acc, currentConfig) => {
    acc[currentConfig.platformType] = currentConfig;
    return acc;
  }, {} as Record<Deployment['platform'], PlatformConfig>);

// Exportar el mapa para ser usado como el platformConfig original
export { platformConfigMap as platformConfig };
