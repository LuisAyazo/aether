import { z } from 'zod';
import { azureLinuxFunctionAppFields } from './linuxFunctionAppFields';
import { generateAzureLinuxFunctionAppTemplates } from './linuxFunctionAppTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

const ApplicationStackSchema = z.object({
  node_version: z.string().optional(),
  python_version: z.string().optional(),
  // dotnet_version: z.string().optional(),
  // java_version: z.string().optional(),
}).optional();

const SiteConfigSchema = z.object({
  application_stack: ApplicationStackSchema,
  always_on: z.boolean().optional(),
  http2_enabled: z.boolean().optional(),
});

export const AzureLinuxFunctionAppSchema = z.object({
  name: z.string().min(1, "El nombre de la Function App es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  storage_account_name: z.string().min(1, "El nombre de la cuenta de almacenamiento es obligatorio."),
  service_plan_id: z.string().min(1, "El ID del Plan de App Service es obligatorio."),
  site_config: SiteConfigSchema.optional(),
  app_settings: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
  https_only: z.boolean().optional().default(true),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureLinuxFunctionAppConfig = z.infer<typeof AzureLinuxFunctionAppSchema>;

export function generateDefaultAzureLinuxFunctionAppConfig(): AzureLinuxFunctionAppConfig {
  return {
    name: 'mylinuxfuncapp',
    resource_group_name: 'my-functions-resources',
    location: 'East US',
    storage_account_name: 'mystorageaccountfunc', // Asegúrate que esta cuenta exista o se cree
    service_plan_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Web/serverfarms/YOUR_CONSUMPTION_PLAN', // Placeholder para plan de consumo
    site_config: {
      application_stack: {
        node_version: '~18', // Default a Node si no se especifica otro runtime
      },
      always_on: false, // 'Always On' no es aplicable para planes de Consumo
      http2_enabled: true,
    },
    app_settings: 'FUNCTIONS_WORKER_RUNTIME=node,AzureWebJobsStorage=YOUR_STORAGE_CONNECTION_STRING', // Placeholder
    https_only: true,
  };
}

export function generateAzureLinuxFunctionAppResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_linux_function_app',
    displayName: 'Azure Function App (Linux)',
    description: 'Crea una Function App serverless en Linux.',
    category: 'Funciones', // O 'Cómputo' si se prefiere
    fields: azureLinuxFunctionAppFields,
    templates: {
      default: generateDefaultAzureLinuxFunctionAppConfig() as unknown as ResourceTemplate,
      python_app: {
        ...generateDefaultAzureLinuxFunctionAppConfig(),
        name: 'mypythonfuncapp',
        site_config: {
          application_stack: {
            python_version: '3.9',
          },
        },
        app_settings: 'FUNCTIONS_WORKER_RUNTIME=python,AzureWebJobsStorage=YOUR_STORAGE_CONNECTION_STRING',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_linux_function_app de Terraform permite gestionar una Function App de Azure para Linux.",
      examples: [
        `
resource "azurerm_linux_function_app" "example" {
  name                = "example-linux-function-app"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  storage_account_name = azurerm_storage_account.example.name
  storage_account_access_key = azurerm_storage_account.example.primary_access_key
  service_plan_id     = azurerm_service_plan.example.id # Consumption plan

  site_config {
    application_stack {
      node_version = "~18"
    }
  }
  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "node"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureLinuxFunctionAppName(config: AzureLinuxFunctionAppConfig): string {
  return config.name || `azure-linuxfunc-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureLinuxFunctionAppGeneratedCode {
  name: string;
  description: string;
  config: AzureLinuxFunctionAppConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureLinuxFunctionAppCode(config: AzureLinuxFunctionAppConfig): AzureLinuxFunctionAppGeneratedCode {
  const parsedConfig = AzureLinuxFunctionAppSchema.parse(config);
  return {
    name: generateAzureLinuxFunctionAppName(parsedConfig),
    description: `Azure Linux Function App: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureLinuxFunctionAppTemplates(parsedConfig),
  };
}

const azureLinuxFunctionAppResource = {
  type: 'azurerm_linux_function_app',
  name: 'Azure Function App (Linux)',
  schema: () => AzureLinuxFunctionAppSchema,
  defaults: generateDefaultAzureLinuxFunctionAppConfig,
  fields: () => azureLinuxFunctionAppFields,
  templates: (config: AzureLinuxFunctionAppConfig) => generateAzureLinuxFunctionAppTemplates(config),

  originalSchema: AzureLinuxFunctionAppSchema,
  originalGenerateDefaultConfig: generateDefaultAzureLinuxFunctionAppConfig,
  originalGenerateResourceSchema: generateAzureLinuxFunctionAppResourceSchema,
  originalGenerateResourceName: generateAzureLinuxFunctionAppName,
  originalGenerateTemplates: generateAzureLinuxFunctionAppCode,
};

export default azureLinuxFunctionAppResource;
