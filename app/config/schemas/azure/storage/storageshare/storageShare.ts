import { z } from 'zod';
import { azureStorageShareFields } from './storageShareFields';
import { generateAzureStorageShareTemplates } from './storageShareTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

export const AzureStorageShareSchema = z.object({
  name: z.string().min(3).max(63).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Nombre inválido para File Share."),
  storage_account_name: z.string().min(1, "El nombre de la cuenta de almacenamiento es obligatorio."),
  quota: z.number().min(1, "La cuota debe ser al menos 1 GB."),
  access_tier: z.enum(['', 'TransactionOptimized', 'Hot', 'Cool']).optional(),
  enabled_protocol: z.enum(['SMB', 'NFS']).optional().default('SMB'),
  metadata: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  // La cuota máxima depende del tipo de cuenta de almacenamiento (Standard vs Premium) y del nivel de acceso.
  // Para simplificar, no se valida aquí la cuota máxima exacta, pero se podría añadir lógica si se conoce el tipo de cuenta.
  if (data.access_tier && data.access_tier !== '' && data.enabled_protocol === 'NFS') {
    return false; // Access tier solo es para SMB en Premium. NFS no soporta access tier.
  }
  return true;
}, { message: "Configuración de nivel de acceso o protocolo inválida."});

export type AzureStorageShareConfig = z.infer<typeof AzureStorageShareSchema>;

export function generateDefaultAzureStorageShareConfig(): AzureStorageShareConfig {
  return {
    name: 'myfileshare',
    storage_account_name: 'mystorageacc', // Reemplazar con una cuenta existente
    quota: 50, // GB
    enabled_protocol: 'SMB',
  };
}

export function generateAzureStorageShareResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_storage_share',
    displayName: 'Azure File Share',
    description: 'Crea un recurso compartido de Azure Files.',
    category: 'Almacenamiento',
    fields: azureStorageShareFields,
    templates: {
      default: generateDefaultAzureStorageShareConfig() as unknown as ResourceTemplate,
      nfs_share: {
        ...generateDefaultAzureStorageShareConfig(),
        name: 'mynfsfileshare',
        enabled_protocol: 'NFS',
        quota: 100, // NFS shares a menudo son más grandes
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_storage_share de Terraform permite gestionar un recurso compartido de Azure Files dentro de una cuenta de almacenamiento.",
      examples: [
        `
resource "azurerm_storage_account" "example" {
  name                     = "examplestoracc"
  resource_group_name      = azurerm_resource_group.example.name
  location                 = azurerm_resource_group.example.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_share" "example" {
  name                 = "exampleshare"
  storage_account_name = azurerm_storage_account.example.name
  quota                = 50 # GB
}
        `,
      ],
    },
  };
}

export function generateAzureStorageShareName(config: AzureStorageShareConfig): string {
  return config.name || `azure-fileshare-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureStorageShareGeneratedCode {
  name: string;
  description: string;
  config: AzureStorageShareConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureStorageShareCode(config: AzureStorageShareConfig): AzureStorageShareGeneratedCode {
  const parsedConfig = AzureStorageShareSchema.parse(config);
  return {
    name: generateAzureStorageShareName(parsedConfig),
    description: `Azure File Share: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureStorageShareTemplates(parsedConfig),
  };
}

const azureStorageShareResource = {
  type: 'azurerm_storage_share',
  name: 'Azure File Share',
  schema: () => AzureStorageShareSchema,
  defaults: generateDefaultAzureStorageShareConfig,
  fields: () => azureStorageShareFields,
  templates: (config: AzureStorageShareConfig) => generateAzureStorageShareTemplates(config),

  originalSchema: AzureStorageShareSchema,
  originalGenerateDefaultConfig: generateDefaultAzureStorageShareConfig,
  originalGenerateResourceSchema: generateAzureStorageShareResourceSchema,
  originalGenerateResourceName: generateAzureStorageShareName,
  originalGenerateTemplates: generateAzureStorageShareCode,
};

export default azureStorageShareResource;
