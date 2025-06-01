import { z } from 'zod';
import { azureSynapseWorkspaceFields } from './synapseWorkspaceFields';
import { generateAzureSynapseWorkspaceTemplates } from './synapseWorkspaceTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

export const AzureSynapseWorkspaceSchema = z.object({
  name: z.string().min(1, "El nombre del workspace es obligatorio.").regex(/^[a-zA-Z0-9]+$/, "El nombre solo puede contener letras y números."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  storage_data_lake_gen2_filesystem_id: z.string().min(1, "El ID del filesystem ADLS Gen2 es obligatorio."),
  sql_administrator_login: z.string().min(1, "El login del administrador SQL es obligatorio."),
  sql_administrator_login_password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."), // Añadir más validaciones si es necesario
  managed_virtual_network_enabled: z.boolean().optional(),
  public_network_access_enabled: z.boolean().optional().default(true),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureSynapseWorkspaceConfig = z.infer<typeof AzureSynapseWorkspaceSchema>;

export function generateDefaultAzureSynapseWorkspaceConfig(): AzureSynapseWorkspaceConfig {
  return {
    name: 'mysynapsews',
    resource_group_name: 'my-synapse-resources',
    location: 'East US',
    storage_data_lake_gen2_filesystem_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Storage/storageAccounts/YOUR_ADLS_ACCOUNT/blobServices/default/containers/YOUR_FILESYSTEM', // Placeholder
    sql_administrator_login: 'sqladmin',
    sql_administrator_login_password: 'Password123!', // Cambiar en producción
    managed_virtual_network_enabled: false,
    public_network_access_enabled: true,
  };
}

export function generateAzureSynapseWorkspaceResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_synapse_workspace',
    displayName: 'Azure Synapse Workspace',
    description: 'Crea un espacio de trabajo de Azure Synapse Analytics.',
    category: 'Analítica', // O 'Almacenamiento' o 'Bases de Datos' según se prefiera
    fields: azureSynapseWorkspaceFields,
    templates: {
      default: generateDefaultAzureSynapseWorkspaceConfig() as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_synapse_workspace de Terraform permite gestionar un espacio de trabajo de Azure Synapse Analytics.",
      examples: [
        `
resource "azurerm_synapse_workspace" "example" {
  name                                 = "example-synapse-ws"
  resource_group_name                  = azurerm_resource_group.example.name
  location                             = azurerm_resource_group.example.location
  storage_data_lake_gen2_filesystem_id = azurerm_storage_data_lake_gen2_filesystem.example.id
  sql_administrator_login              = "sqladminuser"
  sql_administrator_login_password     = "H@Sh1CoR3!"

  aad_admin {
    login     = "user@example.com"
    object_id = "00000000-0000-0000-0000-000000000000"
    tenant_id = "00000000-0000-0000-0000-000000000000"
  }

  tags = {
    Environment = "production"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureSynapseWorkspaceName(config: AzureSynapseWorkspaceConfig): string {
  return config.name || `azure-synapsews-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureSynapseWorkspaceGeneratedCode {
  name: string;
  description: string;
  config: AzureSynapseWorkspaceConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureSynapseWorkspaceCode(config: AzureSynapseWorkspaceConfig): AzureSynapseWorkspaceGeneratedCode {
  const parsedConfig = AzureSynapseWorkspaceSchema.parse(config);
  return {
    name: generateAzureSynapseWorkspaceName(parsedConfig),
    description: `Azure Synapse Workspace: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureSynapseWorkspaceTemplates(parsedConfig),
  };
}

const azureSynapseWorkspaceResource = {
  type: 'azurerm_synapse_workspace',
  name: 'Azure Synapse Workspace',
  schema: () => AzureSynapseWorkspaceSchema,
  defaults: generateDefaultAzureSynapseWorkspaceConfig,
  fields: () => azureSynapseWorkspaceFields,
  templates: (config: AzureSynapseWorkspaceConfig) => generateAzureSynapseWorkspaceTemplates(config),

  originalSchema: AzureSynapseWorkspaceSchema,
  originalGenerateDefaultConfig: generateDefaultAzureSynapseWorkspaceConfig,
  originalGenerateResourceSchema: generateAzureSynapseWorkspaceResourceSchema,
  originalGenerateResourceName: generateAzureSynapseWorkspaceName,
  originalGenerateTemplates: generateAzureSynapseWorkspaceCode,
};

export default azureSynapseWorkspaceResource;
