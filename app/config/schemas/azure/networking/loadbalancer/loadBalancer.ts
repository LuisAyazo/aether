import { z } from 'zod';
import { azureLoadBalancerFields } from './loadBalancerFields';
import { generateAzureLoadBalancerTemplates } from './loadBalancerTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

export const AzureLoadBalancerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(80),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  sku: z.enum(['Basic', 'Standard', 'Gateway']),
  sku_tier: z.enum(['Regional', 'Global']).optional(),
  frontend_ip_configuration_name: z.string().min(1, "Nombre de config. IP frontend obligatorio.").default('PublicIPAddress'),
  public_ip_address_id: z.string().optional().describe("ID de una Public IP existente. Si se omite, se intentará crear una nueva."),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  if (data.sku === 'Standard' && !data.sku_tier) {
    // Si es Standard, sku_tier es relevante. Podríamos poner un default o hacerlo requerido condicionalmente.
    // Por ahora, permitimos que sea opcional y la plantilla puede poner un default.
  }
  if (data.sku === 'Basic' && data.sku_tier === 'Global') {
    return false; // Basic LB no puede ser Global
  }
  return true;
}, { message: "Configuración de SKU y SKU Tier inválida." });

export type AzureLoadBalancerConfig = z.infer<typeof AzureLoadBalancerSchema>;

export function generateDefaultAzureLoadBalancerConfig(): AzureLoadBalancerConfig {
  return {
    name: 'my-azure-lb',
    resource_group_name: 'my-networking-resources',
    location: 'East US',
    sku: 'Standard',
    sku_tier: 'Regional',
    frontend_ip_configuration_name: 'myFrontendIpConfig',
  };
}

export function generateAzureLoadBalancerResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_lb',
    displayName: 'Azure Load Balancer',
    description: 'Crea un Azure Load Balancer (L4).',
    category: 'Redes', 
    fields: azureLoadBalancerFields,
    templates: {
      default: generateDefaultAzureLoadBalancerConfig() as unknown as ResourceTemplate,
      basic_lb: {
        ...generateDefaultAzureLoadBalancerConfig(),
        name: 'my-basic-lb',
        sku: 'Basic',
        sku_tier: undefined, // Basic no tiene tier
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_lb de Terraform permite gestionar un Azure Load Balancer.",
      examples: [
        `
resource "azurerm_lb" "example" {
  name                = "example-lb"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.example.id
  }
}
        `,
      ],
    },
  };
}

export function generateAzureLoadBalancerName(config: AzureLoadBalancerConfig): string {
  return config.name || `azure-lb-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureLoadBalancerGeneratedCode {
  name: string;
  description: string;
  config: AzureLoadBalancerConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureLoadBalancerCode(config: AzureLoadBalancerConfig): AzureLoadBalancerGeneratedCode {
  const parsedConfig = AzureLoadBalancerSchema.parse(config);
  return {
    name: generateAzureLoadBalancerName(parsedConfig),
    description: `Azure Load Balancer: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureLoadBalancerTemplates(parsedConfig),
  };
}

const azureLoadBalancerResource = {
  type: 'azurerm_lb',
  name: 'Azure Load Balancer',
  schema: () => AzureLoadBalancerSchema,
  defaults: generateDefaultAzureLoadBalancerConfig,
  fields: () => azureLoadBalancerFields,
  templates: (config: AzureLoadBalancerConfig) => generateAzureLoadBalancerTemplates(config),

  originalSchema: AzureLoadBalancerSchema,
  originalGenerateDefaultConfig: generateDefaultAzureLoadBalancerConfig,
  originalGenerateResourceSchema: generateAzureLoadBalancerResourceSchema,
  originalGenerateResourceName: generateAzureLoadBalancerName,
  originalGenerateTemplates: generateAzureLoadBalancerCode,
};

export default azureLoadBalancerResource;
