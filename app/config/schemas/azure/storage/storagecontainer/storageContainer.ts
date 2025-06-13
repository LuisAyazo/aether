import { z } from 'zod';
import { azureStorageContainerFields } from './storageContainerFields';
import { generateAzureStorageContainerTemplates } from './storageContainerTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

export const AzureStorageContainerSchema = z.object({
  name: z.string().min(3, "El nombre del contenedor debe tener al menos 3 caracteres.").max(63, "El nombre del contenedor no puede exceder los 63 caracteres.").regex(/^[a-z0-9][a-z0-9-]*$/, "El nombre del contenedor solo puede contener letras minúsculas, números y guiones, y debe comenzar y terminar con una letra o número."),
  storage_account_name: z.string().min(1, "El nombre de la cuenta de almacenamiento es obligatorio."),
  resource_group_name_for_storage_account: z.string().optional().describe("El grupo de recursos de la cuenta de almacenamiento (necesario para Pulumi/Ansible si es diferente al del contenedor)."),
  container_access_type: z.enum(['private', 'blob', 'container']).optional().default('private'),
  metadata: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureStorageContainerConfig = z.infer<typeof AzureStorageContainerSchema>;

export function generateDefaultAzureStorageContainerConfig(): AzureStorageContainerConfig {
  return {
    name: 'myblobcontainer',
    storage_account_name: 'mystorageaccount', // Este debe existir o ser creado por otro recurso
    container_access_type: 'private',
  };
}

export function generateAzureStorageContainerResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_storage_container',
    displayName: 'Azure Storage Container',
    description: 'Crea un contenedor de blobs en una cuenta de Azure Storage.',
    category: 'Almacenamiento',
    fields: azureStorageContainerFields,
    templates: {
      default: generateDefaultAzureStorageContainerConfig() as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_storage_container de Terraform permite gestionar un contenedor de blobs dentro de una cuenta de Azure Storage.",
      examples: [
        `
resource "azurerm_storage_account" "example" {
  name                     = "examplestoracc"
  resource_group_name      = azurerm_resource_group.example.name
  location                 = azurerm_resource_group.example.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "example" {
  name                  = "vhds"
  storage_account_name  = azurerm_storage_account.example.name
  container_access_type = "private"
}
        `,
      ],
    },
  };
}

export function generateAzureStorageContainerName(config: AzureStorageContainerConfig): string {
  return config.name || `azure-container-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureStorageContainerGeneratedCode {
  name: string;
  description: string;
  config: AzureStorageContainerConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureStorageContainerCode(config: AzureStorageContainerConfig): AzureStorageContainerGeneratedCode {
  const parsedConfig = AzureStorageContainerSchema.parse(config);
  return {
    name: generateAzureStorageContainerName(parsedConfig),
    description: `Azure Storage Container: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureStorageContainerTemplates(parsedConfig),
  };
}

const azureStorageContainerResource = {
  type: 'azurerm_storage_container',
  name: 'Azure Storage Container',
  schema: () => AzureStorageContainerSchema,
  defaults: generateDefaultAzureStorageContainerConfig,
  fields: () => azureStorageContainerFields,
  templates: (config: AzureStorageContainerConfig) => generateAzureStorageContainerTemplates(config),

  originalSchema: AzureStorageContainerSchema,
  originalGenerateDefaultConfig: generateDefaultAzureStorageContainerConfig,
  originalGenerateResourceSchema: generateAzureStorageContainerResourceSchema,
  originalGenerateResourceName: generateAzureStorageContainerName,
  originalGenerateTemplates: generateAzureStorageContainerCode,
};

export default azureStorageContainerResource;
