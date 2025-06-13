import { z } from 'zod';
import { azureSubnetFields } from './subnetFields';
import { generateAzureSubnetTemplates } from './subnetTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
const serviceEndpointListRegex = /^([a-zA-Z0-9\.]+)(,([a-zA-Z0-9\.]+))*$/; // Simplificado

export const AzureSubnetSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(80),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  virtual_network_name: z.string().min(1, "El nombre de la red virtual es obligatorio."),
  address_prefixes: z.string().regex(cidrRegex, "Debe ser un bloque CIDR IPv4 válido (ej: 10.0.1.0/24)."),
  service_endpoints: z.string().regex(serviceEndpointListRegex, "Debe ser una lista válida de service endpoints separados por coma (ej: Microsoft.Storage).").optional().or(z.literal('')),
  private_endpoint_network_policies_enabled: z.boolean().optional().default(true),
  private_link_service_network_policies_enabled: z.boolean().optional().default(true),
});

export type AzureSubnetConfig = z.infer<typeof AzureSubnetSchema>;

export function generateDefaultAzureSubnetConfig(): AzureSubnetConfig {
  return {
    name: 'default-subnet',
    resource_group_name: 'my-networking-resources', // Debe coincidir con el RG de la VNet
    virtual_network_name: 'my-vnet', // Debe coincidir con una VNet existente
    address_prefixes: '10.1.1.0/24', // Debe estar dentro del address_space de la VNet
    private_endpoint_network_policies_enabled: true,
    private_link_service_network_policies_enabled: true,
  };
}

export function generateAzureSubnetResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_subnet',
    displayName: 'Azure Subnet',
    description: 'Crea una subred dentro de una red virtual de Azure.',
    category: 'Redes', 
    fields: azureSubnetFields,
    templates: {
      default: generateDefaultAzureSubnetConfig() as unknown as ResourceTemplate,
      with_storage_endpoint: {
        ...generateDefaultAzureSubnetConfig(),
        name: 'storage-subnet',
        address_prefixes: '10.1.2.0/24',
        service_endpoints: 'Microsoft.Storage',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_subnet de Terraform permite gestionar una subred dentro de una red virtual de Azure.",
      examples: [
        `
resource "azurerm_subnet" "example" {
  name                 = "example-subnet"
  resource_group_name  = azurerm_resource_group.example.name
  virtual_network_name = azurerm_virtual_network.example.name
  address_prefixes     = ["10.0.1.0/24"]
}
        `,
      ],
    },
  };
}

export function generateAzureSubnetName(config: AzureSubnetConfig): string {
  return config.name || `azure-subnet-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureSubnetGeneratedCode {
  name: string;
  description: string;
  config: AzureSubnetConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureSubnetCode(config: AzureSubnetConfig): AzureSubnetGeneratedCode {
  const parsedConfig = AzureSubnetSchema.parse(config);
  return {
    name: generateAzureSubnetName(parsedConfig),
    description: `Azure Subnet: ${parsedConfig.name} en VNet ${parsedConfig.virtual_network_name}`,
    config: parsedConfig,
    codeTemplates: generateAzureSubnetTemplates(parsedConfig),
  };
}

const azureSubnetResource = {
  type: 'azurerm_subnet',
  name: 'Azure Subnet',
  schema: () => AzureSubnetSchema,
  defaults: generateDefaultAzureSubnetConfig,
  fields: () => azureSubnetFields,
  templates: (config: AzureSubnetConfig) => generateAzureSubnetTemplates(config),

  originalSchema: AzureSubnetSchema,
  originalGenerateDefaultConfig: generateDefaultAzureSubnetConfig,
  originalGenerateResourceSchema: generateAzureSubnetResourceSchema,
  originalGenerateResourceName: generateAzureSubnetName,
  originalGenerateTemplates: generateAzureSubnetCode,
};

export default azureSubnetResource;
