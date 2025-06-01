import { z } from 'zod';
import { azureEventHubNamespaceFields } from './eventHubNamespaceFields';
import { generateAzureEventHubNamespaceTemplates } from './eventHubNamespaceTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

export const AzureEventHubNamespaceSchema = z.object({
  name: z.string().min(6, "El nombre debe tener entre 6 y 50 caracteres.").max(50).regex(/^[a-zA-Z0-9-]+$/, "Nombre inválido."),
  resource_group_name: z.string().min(1, "Grupo de recursos obligatorio."),
  location: z.string().min(1, "Ubicación obligatoria."),
  sku: z.enum(['Basic', 'Standard', 'Premium']),
  capacity: z.number().min(1).optional(),
  auto_inflate_enabled: z.boolean().optional(),
  maximum_throughput_units: z.number().min(1).optional(),
  zone_redundant: z.boolean().optional(),
  kafka_enabled: z.boolean().optional().default(false),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  if (data.auto_inflate_enabled && !data.maximum_throughput_units) return false;
  if (data.sku === 'Basic' && (data.capacity || data.auto_inflate_enabled || data.zone_redundant)) return false;
  if (data.sku !== 'Premium' && data.zone_redundant) return false;
  return true;
}, { message: "Configuración de SKU, capacidad, auto-inflate o redundancia de zona inválida." });

export type AzureEventHubNamespaceConfig = z.infer<typeof AzureEventHubNamespaceSchema>;

export function generateDefaultAzureEventHubNamespaceConfig(): AzureEventHubNamespaceConfig {
  return {
    name: 'myeventhubns',
    resource_group_name: 'my-eventhub-resources',
    location: 'East US',
    sku: 'Standard',
    capacity: 1,
    kafka_enabled: false,
  };
}

export function generateAzureEventHubNamespaceResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_eventhub_namespace',
    displayName: 'Azure Event Hubs Namespace',
    description: 'Crea un namespace de Azure Event Hubs.',
    category: 'Aplicación', 
    fields: azureEventHubNamespaceFields,
    templates: {
      default: generateDefaultAzureEventHubNamespaceConfig() as unknown as ResourceTemplate,
      premium_kafka: {
        ...generateDefaultAzureEventHubNamespaceConfig(),
        name: 'mypremiumehns',
        sku: 'Premium',
        capacity: 1, // Premium TUs son diferentes
        kafka_enabled: true,
        zone_redundant: true,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "Gestiona un namespace de Azure Event Hubs.",
      examples: [
        `
resource "azurerm_eventhub_namespace" "example" {
  name                = "example-ehns"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  sku                 = "Standard"
  capacity            = 2
  tags = { environment = "production" }
}
        `,
      ],
    },
  };
}

export function generateAzureEventHubNamespaceName(config: AzureEventHubNamespaceConfig): string {
  return config.name || `azure-ehns-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureEventHubNamespaceGeneratedCode {
  name: string;
  description: string;
  config: AzureEventHubNamespaceConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureEventHubNamespaceCode(config: AzureEventHubNamespaceConfig): AzureEventHubNamespaceGeneratedCode {
  const parsedConfig = AzureEventHubNamespaceSchema.parse(config);
  return {
    name: generateAzureEventHubNamespaceName(parsedConfig),
    description: `Azure Event Hubs Namespace: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureEventHubNamespaceTemplates(parsedConfig),
  };
}

const azureEventHubNamespaceResource = {
  type: 'azurerm_eventhub_namespace',
  name: 'Azure Event Hubs Namespace',
  schema: () => AzureEventHubNamespaceSchema,
  defaults: generateDefaultAzureEventHubNamespaceConfig,
  fields: () => azureEventHubNamespaceFields,
  templates: (config: AzureEventHubNamespaceConfig) => generateAzureEventHubNamespaceTemplates(config),

  originalSchema: AzureEventHubNamespaceSchema,
  originalGenerateDefaultConfig: generateDefaultAzureEventHubNamespaceConfig,
  originalGenerateResourceSchema: generateAzureEventHubNamespaceResourceSchema,
  originalGenerateResourceName: generateAzureEventHubNamespaceName,
  originalGenerateTemplates: generateAzureEventHubNamespaceCode,
};

export default azureEventHubNamespaceResource;
