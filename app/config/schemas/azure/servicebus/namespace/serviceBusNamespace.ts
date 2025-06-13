import { z } from 'zod';
import { azureServiceBusNamespaceFields } from './serviceBusNamespaceFields';
import { generateAzureServiceBusNamespaceTemplates } from './serviceBusNamespaceTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

export const AzureServiceBusNamespaceSchema = z.object({
  name: z.string().min(6, "El nombre debe tener al menos 6 caracteres.").max(50, "El nombre no puede exceder los 50 caracteres.").regex(/^[a-zA-Z][a-zA-Z0-9-]*$/, "Nombre inválido para Service Bus Namespace."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  sku: z.enum(['Basic', 'Standard', 'Premium']),
  capacity: z.number().min(1).optional(),
  zone_redundant: z.boolean().optional(),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  if (data.sku === 'Premium') {
    if (!data.capacity || data.capacity < 1) return false; // Capacidad es obligatoria para Premium
  } else {
    if (data.capacity !== undefined) return false; // Capacidad solo para Premium
    if (data.zone_redundant === true) return false; // Zone redundant solo para Premium
  }
  return true;
}, { message: "Configuración de SKU, capacidad o redundancia de zona inválida." });

export type AzureServiceBusNamespaceConfig = z.infer<typeof AzureServiceBusNamespaceSchema>;

export function generateDefaultAzureServiceBusNamespaceConfig(): AzureServiceBusNamespaceConfig {
  return {
    name: 'myservicebusns',
    resource_group_name: 'my-sb-resources',
    location: 'East US',
    sku: 'Standard',
  };
}

export function generateAzureServiceBusNamespaceResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_servicebus_namespace',
    displayName: 'Azure Service Bus Namespace',
    description: 'Crea un namespace de Azure Service Bus.',
    category: 'Aplicación', 
    fields: azureServiceBusNamespaceFields,
    templates: {
      default: generateDefaultAzureServiceBusNamespaceConfig() as unknown as ResourceTemplate,
      premium_redundant: {
        ...generateDefaultAzureServiceBusNamespaceConfig(),
        name: 'mypremiumsbns',
        sku: 'Premium',
        capacity: 1,
        zone_redundant: true,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_servicebus_namespace de Terraform permite gestionar un namespace de Azure Service Bus.",
      examples: [
        `
resource "azurerm_servicebus_namespace" "example" {
  name                = "example-sb-namespace"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  sku                 = "Standard"

  tags = {
    environment = "production"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureServiceBusNamespaceName(config: AzureServiceBusNamespaceConfig): string {
  return config.name || `azure-sbns-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureServiceBusNamespaceGeneratedCode {
  name: string;
  description: string;
  config: AzureServiceBusNamespaceConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureServiceBusNamespaceCode(config: AzureServiceBusNamespaceConfig): AzureServiceBusNamespaceGeneratedCode {
  const parsedConfig = AzureServiceBusNamespaceSchema.parse(config);
  return {
    name: generateAzureServiceBusNamespaceName(parsedConfig),
    description: `Azure Service Bus Namespace: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureServiceBusNamespaceTemplates(parsedConfig),
  };
}

const azureServiceBusNamespaceResource = {
  type: 'azurerm_servicebus_namespace',
  name: 'Azure Service Bus Namespace',
  schema: () => AzureServiceBusNamespaceSchema,
  defaults: generateDefaultAzureServiceBusNamespaceConfig,
  fields: () => azureServiceBusNamespaceFields,
  templates: (config: AzureServiceBusNamespaceConfig) => generateAzureServiceBusNamespaceTemplates(config),

  originalSchema: AzureServiceBusNamespaceSchema,
  originalGenerateDefaultConfig: generateDefaultAzureServiceBusNamespaceConfig,
  originalGenerateResourceSchema: generateAzureServiceBusNamespaceResourceSchema,
  originalGenerateResourceName: generateAzureServiceBusNamespaceName,
  originalGenerateTemplates: generateAzureServiceBusNamespaceCode,
};

export default azureServiceBusNamespaceResource;
