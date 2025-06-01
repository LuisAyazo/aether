import { z } from 'zod';
import { azureLinuxWebAppFields } from './linuxWebAppFields';
import { generateAzureLinuxWebAppTemplates } from './linuxWebAppTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

const SiteConfigSchema = z.object({
  linux_fx_version: z.string().optional(),
  always_on: z.boolean().optional(),
  http2_enabled: z.boolean().optional(),
  ftps_state: z.enum(['AllAllowed', 'FtpsOnly', 'Disabled']).optional(),
});

export const AzureLinuxWebAppSchema = z.object({
  name: z.string().min(1, "El nombre del App Service es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  service_plan_id: z.string().min(1, "El ID del Plan de App Service es obligatorio."),
  site_config: SiteConfigSchema.optional(),
  app_settings: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
  https_only: z.boolean().optional().default(true),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureLinuxWebAppConfig = z.infer<typeof AzureLinuxWebAppSchema>;

export function generateDefaultAzureLinuxWebAppConfig(): AzureLinuxWebAppConfig {
  return {
    name: 'mylinuxapp',
    resource_group_name: 'my-appservice-resources',
    location: 'East US',
    service_plan_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Web/serverfarms/YOUR_APP_SERVICE_PLAN', // Placeholder
    site_config: {
      linux_fx_version: 'NODE|18-lts',
      always_on: false,
      http2_enabled: false,
      ftps_state: 'FtpsOnly',
    },
    https_only: true,
  };
}

export function generateAzureLinuxWebAppResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_linux_web_app',
    displayName: 'Azure App Service (Linux)',
    description: 'Crea una aplicación web PaaS en Linux utilizando Azure App Service.',
    category: 'Cómputo', // O podría ser 'Aplicación' dependiendo de la organización
    fields: azureLinuxWebAppFields,
    templates: {
      default: generateDefaultAzureLinuxWebAppConfig() as unknown as ResourceTemplate,
      python_app: {
        ...generateDefaultAzureLinuxWebAppConfig(),
        name: 'mypythonapp',
        site_config: {
          linux_fx_version: 'PYTHON|3.9',
          always_on: true,
        }
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_linux_web_app de Terraform permite gestionar una Web App de Azure para Linux.",
      examples: [
        `
resource "azurerm_linux_web_app" "example" {
  name                = "example-linux-app"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  service_plan_id     = azurerm_service_plan.example.id

  site_config {
    linux_fx_version = "NODE|14-lts"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureLinuxWebAppName(config: AzureLinuxWebAppConfig): string {
  return config.name || `azure-linuxapp-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureLinuxWebAppGeneratedCode {
  name: string;
  description: string;
  config: AzureLinuxWebAppConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureLinuxWebAppCode(config: AzureLinuxWebAppConfig): AzureLinuxWebAppGeneratedCode {
  const parsedConfig = AzureLinuxWebAppSchema.parse(config);
  return {
    name: generateAzureLinuxWebAppName(parsedConfig),
    description: `Azure Linux Web App: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureLinuxWebAppTemplates(parsedConfig),
  };
}

const azureLinuxWebAppResource = {
  type: 'azurerm_linux_web_app',
  name: 'Azure App Service (Linux)',
  schema: () => AzureLinuxWebAppSchema,
  defaults: generateDefaultAzureLinuxWebAppConfig,
  fields: () => azureLinuxWebAppFields,
  templates: (config: AzureLinuxWebAppConfig) => generateAzureLinuxWebAppTemplates(config),

  originalSchema: AzureLinuxWebAppSchema,
  originalGenerateDefaultConfig: generateDefaultAzureLinuxWebAppConfig,
  originalGenerateResourceSchema: generateAzureLinuxWebAppResourceSchema,
  originalGenerateResourceName: generateAzureLinuxWebAppName,
  originalGenerateTemplates: generateAzureLinuxWebAppCode,
};

export default azureLinuxWebAppResource;
