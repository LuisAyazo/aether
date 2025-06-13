import { z } from 'zod';
import { azureFirewallFields } from './firewallFields';
import { generateAzureFirewallTemplates } from './firewallTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

const SkuNameEnum = z.enum(['AZFW_VNet', 'AZFW_Hub']);
const SkuTierEnum = z.enum(['Standard', 'Premium', 'Basic']); // Basic es más nuevo

export const AzureFirewallSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(80),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  sku_name: SkuNameEnum,
  sku_tier: SkuTierEnum,
  firewall_policy_id: z.string().optional().describe("ID de una Azure Firewall Policy existente."),
  ip_configuration_name: z.string().min(1).default('azureFirewallIpConfiguration'),
  ip_configuration_subnet_id: z.string().min(1, "ID de subred para el firewall es obligatorio (debe llamarse AzureFirewallSubnet)."),
  public_ip_address_id: z.string().optional().describe("ID de una Public IP existente. Si se omite, se creará una nueva."),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureFirewallConfig = z.infer<typeof AzureFirewallSchema>;

export function generateDefaultAzureFirewallConfig(): AzureFirewallConfig {
  return {
    name: 'my-azure-firewall',
    resource_group_name: 'my-networking-resources',
    location: 'East US',
    sku_name: 'AZFW_VNet',
    sku_tier: 'Standard',
    ip_configuration_name: 'azureFirewallIpConfiguration',
    // Se debe reemplazar con un ID de subred real que se llame AzureFirewallSubnet
    ip_configuration_subnet_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/virtualNetworks/YOUR_VNET/subnets/AzureFirewallSubnet', 
  };
}

export function generateAzureFirewallResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_firewall',
    displayName: 'Azure Firewall',
    description: 'Crea un Azure Firewall gestionado.',
    category: 'Redes', 
    fields: azureFirewallFields,
    templates: {
      default: generateDefaultAzureFirewallConfig() as unknown as ResourceTemplate,
      premium_firewall: {
        ...generateDefaultAzureFirewallConfig(),
        name: 'my-premium-firewall',
        sku_tier: 'Premium',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_firewall de Terraform permite gestionar un Azure Firewall. Requiere una subred dedicada llamada 'AzureFirewallSubnet' y una IP pública.",
      examples: [
        `
resource "azurerm_firewall" "example" {
  name                = "example-firewall"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Standard"

  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.firewall_subnet.id # Debe ser AzureFirewallSubnet
    public_ip_address_id = azurerm_public_ip.example.id
  }
}
        `,
      ],
    },
  };
}

export function generateAzureFirewallName(config: AzureFirewallConfig): string {
  return config.name || `azure-firewall-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureFirewallGeneratedCode {
  name: string;
  description: string;
  config: AzureFirewallConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureFirewallCode(config: AzureFirewallConfig): AzureFirewallGeneratedCode {
  const parsedConfig = AzureFirewallSchema.parse(config);
  return {
    name: generateAzureFirewallName(parsedConfig),
    description: `Azure Firewall: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureFirewallTemplates(parsedConfig),
  };
}

const azureFirewallResource = {
  type: 'azurerm_firewall',
  name: 'Azure Firewall',
  schema: () => AzureFirewallSchema,
  defaults: generateDefaultAzureFirewallConfig,
  fields: () => azureFirewallFields,
  templates: (config: AzureFirewallConfig) => generateAzureFirewallTemplates(config),

  originalSchema: AzureFirewallSchema,
  originalGenerateDefaultConfig: generateDefaultAzureFirewallConfig,
  originalGenerateResourceSchema: generateAzureFirewallResourceSchema,
  originalGenerateResourceName: generateAzureFirewallName,
  originalGenerateTemplates: generateAzureFirewallCode,
};

export default azureFirewallResource;
