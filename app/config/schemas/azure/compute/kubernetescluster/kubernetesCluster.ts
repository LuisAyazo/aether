import { z } from 'zod';
import { azureKubernetesClusterFields } from './kubernetesClusterFields';
import { generateAzureKubernetesClusterTemplates } from './kubernetesClusterTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

const DefaultNodePoolSchema = z.object({
  name: z.string().min(1),
  node_count: z.number().min(1),
  vm_size: z.string().min(1),
  os_disk_size_gb: z.number().optional(),
  vnet_subnet_id: z.string().optional(),
});

const ServicePrincipalSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
}).optional();

const NetworkProfileSchema = z.object({
    network_plugin: z.enum(['azure', 'kubenet']).optional(),
    service_cidr: z.string().optional(),
    dns_service_ip: z.string().optional(),
    docker_bridge_cidr: z.string().optional(),
}).optional();

export const AzureKubernetesClusterSchema = z.object({
  name: z.string().min(1, "El nombre del cluster es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  dns_prefix: z.string().min(1, "El prefijo DNS es obligatorio."),
  kubernetes_version: z.string().optional(),
  default_node_pool: DefaultNodePoolSchema,
  service_principal: ServicePrincipalSchema,
  network_profile: NetworkProfileSchema,
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureKubernetesClusterConfig = z.infer<typeof AzureKubernetesClusterSchema>;

export function generateDefaultAzureKubernetesClusterConfig(): AzureKubernetesClusterConfig {
  return {
    name: 'myakscluster',
    resource_group_name: 'my-aks-resources',
    location: 'East US',
    dns_prefix: 'myakscluster',
    kubernetes_version: '1.27.7', // Ejemplo, verificar versiones soportadas
    default_node_pool: {
      name: 'default',
      node_count: 2,
      vm_size: 'Standard_DS2_v2',
      os_disk_size_gb: 128,
    },
    // service_principal se omite para usar identidad gestionada por defecto
    network_profile: {
        network_plugin: 'azure',
        service_cidr: '10.0.0.0/16',
        dns_service_ip: '10.0.0.10',
        docker_bridge_cidr: '172.17.0.1/16',
    }
  };
}

export function generateAzureKubernetesClusterResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_kubernetes_cluster',
    displayName: 'Azure Kubernetes Cluster (AKS)',
    description: 'Crea un cluster de Azure Kubernetes Service (AKS).',
    category: 'Cómputo',
    fields: azureKubernetesClusterFields,
    templates: {
      default: generateDefaultAzureKubernetesClusterConfig() as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_kubernetes_cluster de Terraform permite gestionar un cluster de Azure Kubernetes Service (AKS).",
      examples: [
        `
resource "azurerm_kubernetes_cluster" "example" {
  name                = "example-aks1"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  dns_prefix          = "exampleaks1"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_DS2_v2"
  }

  identity {
    type = "SystemAssigned"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureKubernetesClusterName(config: AzureKubernetesClusterConfig): string {
  return config.name || `azure-aks-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureKubernetesClusterGeneratedCode {
  name: string;
  description: string;
  config: AzureKubernetesClusterConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureKubernetesClusterCode(config: AzureKubernetesClusterConfig): AzureKubernetesClusterGeneratedCode {
  const parsedConfig = AzureKubernetesClusterSchema.parse(config);
  return {
    name: generateAzureKubernetesClusterName(parsedConfig),
    description: `Azure Kubernetes Cluster: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureKubernetesClusterTemplates(parsedConfig),
  };
}

const azureKubernetesClusterResource = {
  type: 'azurerm_kubernetes_cluster',
  name: 'Azure Kubernetes Cluster (AKS)',
  schema: () => AzureKubernetesClusterSchema,
  defaults: generateDefaultAzureKubernetesClusterConfig,
  fields: () => azureKubernetesClusterFields,
  templates: (config: AzureKubernetesClusterConfig) => generateAzureKubernetesClusterTemplates(config),

  originalSchema: AzureKubernetesClusterSchema,
  originalGenerateDefaultConfig: generateDefaultAzureKubernetesClusterConfig,
  originalGenerateResourceSchema: generateAzureKubernetesClusterResourceSchema,
  originalGenerateResourceName: generateAzureKubernetesClusterName,
  originalGenerateTemplates: generateAzureKubernetesClusterCode,
};

export default azureKubernetesClusterResource;
