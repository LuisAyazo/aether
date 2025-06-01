import { z } from 'zod';
import { azureVirtualNetworkFields } from './virtualNetworkFields';
import { generateAzureVirtualNetworkTemplates } from './virtualNetworkTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

// Expresión regular para validar CIDR IPv4
const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
// Expresión regular para validar una lista de IPs separadas por coma
const ipListRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}(,([0-9]{1,3}\.){3}[0-9]{1,3})*$/;

export const AzureVirtualNetworkSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(64),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  address_space: z.string().regex(cidrRegex, "Debe ser un bloque CIDR IPv4 válido (ej: 10.0.0.0/16)."),
  dns_servers: z.string().regex(ipListRegex, "Debe ser una lista de IPs válidas separadas por coma (ej: 10.0.0.4,10.0.0.5).").optional().or(z.literal('')),
  ddos_protection_plan_id: z.string().optional(),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureVirtualNetworkConfig = z.infer<typeof AzureVirtualNetworkSchema>;

export function generateDefaultAzureVirtualNetworkConfig(): AzureVirtualNetworkConfig {
  return {
    name: 'my-vnet',
    resource_group_name: 'my-networking-resources',
    location: 'East US',
    address_space: '10.1.0.0/16',
  };
}

export function generateAzureVirtualNetworkResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_virtual_network',
    displayName: 'Azure Virtual Network',
    description: 'Crea una red virtual de Azure (VNet).',
    category: 'Redes', 
    fields: azureVirtualNetworkFields,
    templates: {
      default: generateDefaultAzureVirtualNetworkConfig() as unknown as ResourceTemplate,
      with_dns: {
        ...generateDefaultAzureVirtualNetworkConfig(),
        name: 'my-vnet-with-dns',
        dns_servers: '10.1.1.4,10.1.1.5',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_virtual_network de Terraform permite gestionar una red virtual de Azure.",
      examples: [
        `
resource "azurerm_virtual_network" "example" {
  name                = "example-vnet"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  address_space       = ["10.0.0.0/16"]

  tags = {
    environment = "production"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureVirtualNetworkName(config: AzureVirtualNetworkConfig): string {
  return config.name || `azure-vnet-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureVirtualNetworkGeneratedCode {
  name: string;
  description: string;
  config: AzureVirtualNetworkConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureVirtualNetworkCode(config: AzureVirtualNetworkConfig): AzureVirtualNetworkGeneratedCode {
  const parsedConfig = AzureVirtualNetworkSchema.parse(config);
  return {
    name: generateAzureVirtualNetworkName(parsedConfig),
    description: `Azure Virtual Network: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureVirtualNetworkTemplates(parsedConfig),
  };
}

const azureVirtualNetworkResource = {
  type: 'azurerm_virtual_network',
  name: 'Azure Virtual Network',
  schema: () => AzureVirtualNetworkSchema,
  defaults: generateDefaultAzureVirtualNetworkConfig,
  fields: () => azureVirtualNetworkFields,
  templates: (config: AzureVirtualNetworkConfig) => generateAzureVirtualNetworkTemplates(config),

  originalSchema: AzureVirtualNetworkSchema,
  originalGenerateDefaultConfig: generateDefaultAzureVirtualNetworkConfig,
  originalGenerateResourceSchema: generateAzureVirtualNetworkResourceSchema,
  originalGenerateResourceName: generateAzureVirtualNetworkName,
  originalGenerateTemplates: generateAzureVirtualNetworkCode,
};

export default azureVirtualNetworkResource;
