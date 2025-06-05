import { z } from 'zod';
import { azureNetworkSecurityGroupFields } from './networkSecurityGroupFields';
import { generateAzureNetworkSecurityGroupTemplates } from './networkSecurityGroupTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

export const AzureNetworkSecurityGroupSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(80),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
  // Las reglas de seguridad (security_rule) se omiten aquí para simplificar el esquema Zod inicial.
  // Se pueden añadir como un string JSON o un array de objetos si se desea una validación más estricta.
});

export type AzureNetworkSecurityGroupConfig = z.infer<typeof AzureNetworkSecurityGroupSchema>;

export function generateDefaultAzureNetworkSecurityGroupConfig(): AzureNetworkSecurityGroupConfig {
  return {
    name: 'my-nsg',
    resource_group_name: 'my-networking-resources',
    location: 'East US',
  };
}

export function generateAzureNetworkSecurityGroupResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_network_security_group',
    displayName: 'Azure Network Security Group',
    description: 'Crea un Network Security Group (NSG) de Azure.',
    category: 'Redes', 
    fields: azureNetworkSecurityGroupFields,
    templates: {
      default: generateDefaultAzureNetworkSecurityGroupConfig() as unknown as ResourceTemplate,
      // Se podrían añadir plantillas con reglas comunes aquí si se expande el esquema.
    },
    documentation: {
      description: "El recurso azurerm_network_security_group de Terraform permite gestionar un NSG de Azure. Las reglas de seguridad se gestionan típicamente con azurerm_network_security_rule.",
      examples: [
        `
resource "azurerm_network_security_group" "example" {
  name                = "example-nsg"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name

  tags = {
    environment = "production"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureNetworkSecurityGroupName(config: AzureNetworkSecurityGroupConfig): string {
  return config.name || `azure-nsg-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureNetworkSecurityGroupGeneratedCode {
  name: string;
  description: string;
  config: AzureNetworkSecurityGroupConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureNetworkSecurityGroupCode(config: AzureNetworkSecurityGroupConfig): AzureNetworkSecurityGroupGeneratedCode {
  const parsedConfig = AzureNetworkSecurityGroupSchema.parse(config);
  return {
    name: generateAzureNetworkSecurityGroupName(parsedConfig),
    description: `Azure Network Security Group: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureNetworkSecurityGroupTemplates(parsedConfig),
  };
}

const azureNetworkSecurityGroupResource = {
  type: 'azurerm_network_security_group',
  name: 'Azure Network Security Group',
  schema: () => AzureNetworkSecurityGroupSchema,
  defaults: generateDefaultAzureNetworkSecurityGroupConfig,
  fields: () => azureNetworkSecurityGroupFields,
  templates: (config: AzureNetworkSecurityGroupConfig) => generateAzureNetworkSecurityGroupTemplates(config),

  originalSchema: AzureNetworkSecurityGroupSchema,
  originalGenerateDefaultConfig: generateDefaultAzureNetworkSecurityGroupConfig,
  originalGenerateResourceSchema: generateAzureNetworkSecurityGroupResourceSchema,
  originalGenerateResourceName: generateAzureNetworkSecurityGroupName,
  originalGenerateTemplates: generateAzureNetworkSecurityGroupCode,
};

export default azureNetworkSecurityGroupResource;
