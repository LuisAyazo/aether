import { z } from 'zod';
import { azureApplicationGatewayFields } from './applicationGatewayFields';
import { generateAzureApplicationGatewayTemplates } from './applicationGatewayTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

const SkuNameEnum = z.enum([
  'Standard_Small', 'Standard_Medium', 'Standard_Large', 
  'Standard_v2', 
  'WAF_Medium', 'WAF_Large', 
  'WAF_v2'
]);

const SkuTierEnum = z.enum(['Standard', 'Standard_v2', 'WAF', 'WAF_v2']);

export const AzureApplicationGatewaySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(80),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  sku_name: SkuNameEnum,
  sku_tier: SkuTierEnum,
  sku_capacity: z.number().min(1).optional().describe("Capacidad para SKU v1. No para v2."),
  gateway_ip_configuration_name: z.string().min(1).default('appGatewayIpConfig'),
  gateway_ip_configuration_subnet_id: z.string().min(1, "ID de subred para el gateway es obligatorio."),
  frontend_ip_configuration_name: z.string().min(1).default('appGatewayFrontendIP'),
  frontend_port_name: z.string().min(1).default('httpPort'),
  frontend_port_number: z.number().min(1).max(65535).default(80),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  const isV2Sku = data.sku_tier.includes('_v2') || data.sku_name.includes('_v2');
  if (!isV2Sku && data.sku_capacity === undefined) {
    // Para SKUs v1, capacity es requerida. Terraform default es 2 si no se especifica.
    // Aquí podríamos forzarlo o dejar que la plantilla lo maneje.
    // Por ahora, lo dejamos opcional en Zod y la plantilla puede poner un default.
  }
  if (isV2Sku && data.sku_capacity !== undefined) {
    return false; // Capacity no aplica a SKUs v2
  }
  // Validar consistencia entre sku_name y sku_tier
  if (data.sku_name.startsWith('Standard_') && !data.sku_tier.startsWith('Standard')) return false;
  if (data.sku_name.startsWith('WAF_') && !data.sku_tier.startsWith('WAF')) return false;
  return true;
}, { message: "Inconsistencia entre sku_name y sku_tier, o error en sku_capacity." });

export type AzureApplicationGatewayConfig = z.infer<typeof AzureApplicationGatewaySchema>;

export function generateDefaultAzureApplicationGatewayConfig(): AzureApplicationGatewayConfig {
  return {
    name: 'my-app-gateway',
    resource_group_name: 'my-networking-resources',
    location: 'East US',
    sku_name: 'Standard_v2',
    sku_tier: 'Standard_v2',
    // sku_capacity no se define por defecto para v2
    gateway_ip_configuration_name: 'appGatewayIpConfig',
    gateway_ip_configuration_subnet_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/virtualNetworks/YOUR_VNET/subnets/AppGatewaySubnet',
    frontend_ip_configuration_name: 'appGatewayFrontendIP',
    frontend_port_name: 'httpPort',
    frontend_port_number: 80,
  };
}

export function generateAzureApplicationGatewayResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_application_gateway',
    displayName: 'Azure Application Gateway',
    description: 'Crea un Azure Application Gateway (L7).',
    category: 'Redes', 
    fields: azureApplicationGatewayFields,
    templates: {
      default: generateDefaultAzureApplicationGatewayConfig() as unknown as ResourceTemplate,
      waf_v2: {
        ...generateDefaultAzureApplicationGatewayConfig(),
        name: 'my-waf-app-gateway',
        sku_name: 'WAF_v2',
        sku_tier: 'WAF_v2',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_application_gateway de Terraform permite gestionar un Azure Application Gateway. Requiere una configuración detallada de subcomponentes.",
      examples: [
        `
resource "azurerm_application_gateway" "example" {
  name                = "example-appgw"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
  }

  gateway_ip_configuration {
    name      = "my-gateway-ip-configuration"
    subnet_id = azurerm_subnet.frontend.id
  }
  # ... más configuraciones requeridas ...
}
        `,
      ],
    },
  };
}

export function generateAzureApplicationGatewayName(config: AzureApplicationGatewayConfig): string {
  return config.name || `azure-appgw-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureApplicationGatewayGeneratedCode {
  name: string;
  description: string;
  config: AzureApplicationGatewayConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureApplicationGatewayCode(config: AzureApplicationGatewayConfig): AzureApplicationGatewayGeneratedCode {
  const parsedConfig = AzureApplicationGatewaySchema.parse(config);
  return {
    name: generateAzureApplicationGatewayName(parsedConfig),
    description: `Azure Application Gateway: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureApplicationGatewayTemplates(parsedConfig),
  };
}

const azureApplicationGatewayResource = {
  type: 'azurerm_application_gateway',
  name: 'Azure Application Gateway',
  schema: () => AzureApplicationGatewaySchema,
  defaults: generateDefaultAzureApplicationGatewayConfig,
  fields: () => azureApplicationGatewayFields,
  templates: (config: AzureApplicationGatewayConfig) => generateAzureApplicationGatewayTemplates(config),

  originalSchema: AzureApplicationGatewaySchema,
  originalGenerateDefaultConfig: generateDefaultAzureApplicationGatewayConfig,
  originalGenerateResourceSchema: generateAzureApplicationGatewayResourceSchema,
  originalGenerateResourceName: generateAzureApplicationGatewayName,
  originalGenerateTemplates: generateAzureApplicationGatewayCode,
};

export default azureApplicationGatewayResource;
