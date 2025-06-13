import { z } from 'zod';
import { azureContainerGroupFields } from './containerGroupFields';
import { generateAzureContainerGroupTemplates } from './containerGroupTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

const ContainerSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  cpu: z.number().min(0.1),
  memory: z.number().min(0.1),
  ports_protocol: z.enum(['TCP', 'UDP']).optional(),
  ports_port: z.number().min(1).max(65535).optional(),
});

export const AzureContainerGroupSchema = z.object({
  name: z.string().min(1, "El nombre del grupo de contenedores es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  os_type: z.enum(['Linux', 'Windows']),
  container: ContainerSchema, // Para un solo contenedor principal
  // Para múltiples contenedores, se usaría: containers: z.array(ContainerSchema).min(1),
  ip_address_type: z.enum(['Public', 'Private', 'None']).optional(),
  dns_name_label: z.string().optional(),
  restart_policy: z.enum(['Always', 'OnFailure', 'Never']).optional().default('Always'),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureContainerGroupConfig = z.infer<typeof AzureContainerGroupSchema>;

export function generateDefaultAzureContainerGroupConfig(): AzureContainerGroupConfig {
  return {
    name: 'myacicontainergroup',
    resource_group_name: 'my-aci-resources',
    location: 'East US',
    os_type: 'Linux',
    container: {
      name: 'mycontainer',
      image: 'mcr.microsoft.com/azuredocs/aci-helloworld',
      cpu: 1.0,
      memory: 1.5,
      ports_port: 80,
      ports_protocol: 'TCP',
    },
    ip_address_type: 'Public',
    dns_name_label: 'myapp-aci',
    restart_policy: 'Always',
  };
}

export function generateAzureContainerGroupResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_container_group',
    displayName: 'Azure Container Group',
    description: 'Crea un grupo de contenedores en Azure Container Instances (ACI).',
    category: 'Cómputo',
    fields: azureContainerGroupFields,
    templates: {
      default: generateDefaultAzureContainerGroupConfig() as unknown as ResourceTemplate,
      nginx_example: {
        ...generateDefaultAzureContainerGroupConfig(),
        name: 'nginx-aci-example',
        container: {
          name: 'nginx',
          image: 'nginx:latest',
          cpu: 0.5,
          memory: 0.5,
          ports_port: 80,
          ports_protocol: 'TCP',
        },
        dns_name_label: 'nginx-example-aci',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_container_group de Terraform permite gestionar un grupo de contenedores en Azure Container Instances.",
      examples: [
        `
resource "azurerm_container_group" "example" {
  name                = "example-aci"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  ip_address_type     = "Public"
  dns_name_label      = "aci-label"
  os_type             = "Linux"

  container {
    name   = "hello-world"
    image  = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
    cpu    = "0.5"
    memory = "1.5"
    ports {
      port     = 80
      protocol = "TCP"
    }
  }
}
        `,
      ],
    },
  };
}

export function generateAzureContainerGroupName(config: AzureContainerGroupConfig): string {
  return config.name || `azure-aci-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureContainerGroupGeneratedCode {
  name: string;
  description: string;
  config: AzureContainerGroupConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureContainerGroupCode(config: AzureContainerGroupConfig): AzureContainerGroupGeneratedCode {
  const parsedConfig = AzureContainerGroupSchema.parse(config);
  return {
    name: generateAzureContainerGroupName(parsedConfig),
    description: `Azure Container Group: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureContainerGroupTemplates(parsedConfig),
  };
}

const azureContainerGroupResource = {
  type: 'azurerm_container_group',
  name: 'Azure Container Group',
  schema: () => AzureContainerGroupSchema,
  defaults: generateDefaultAzureContainerGroupConfig,
  fields: () => azureContainerGroupFields,
  templates: (config: AzureContainerGroupConfig) => generateAzureContainerGroupTemplates(config),

  originalSchema: AzureContainerGroupSchema,
  originalGenerateDefaultConfig: generateDefaultAzureContainerGroupConfig,
  originalGenerateResourceSchema: generateAzureContainerGroupResourceSchema,
  originalGenerateResourceName: generateAzureContainerGroupName,
  originalGenerateTemplates: generateAzureContainerGroupCode,
};

export default azureContainerGroupResource;
