import { z } from 'zod';
import { azureMsSqlDatabaseFields } from './mssqlDatabaseFields';
import { generateAzureMsSqlDatabaseTemplates } from './mssqlDatabaseTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

export const AzureMsSqlDatabaseSchema = z.object({
  name: z.string().min(1, "El nombre de la base de datos es obligatorio."),
  server_id: z.string().min(1, "El ID del servidor SQL es obligatorio."),
  collation: z.string().optional().default('SQL_Latin1_General_CP1_CI_AS'),
  sku_name: z.string().optional().default('S0').describe("Ej: S0, P1, GP_Gen5_2"),
  max_size_gb: z.number().min(1).optional(),
  read_scale: z.boolean().optional(),
  zone_redundant: z.boolean().optional(),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureMsSqlDatabaseConfig = z.infer<typeof AzureMsSqlDatabaseSchema>;

export function generateDefaultAzureMsSqlDatabaseConfig(): AzureMsSqlDatabaseConfig {
  return {
    name: 'mydatabase',
    server_id: '/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Sql/servers/myserver', // Placeholder
    collation: 'SQL_Latin1_General_CP1_CI_AS',
    sku_name: 'S0', // DTU-based SKU
    max_size_gb: 10,
    read_scale: false,
    zone_redundant: false,
  };
}

export function generateAzureMsSqlDatabaseResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_mssql_database',
    displayName: 'Azure SQL Database',
    description: 'Crea una base de datos Azure SQL.',
    category: 'Bases de Datos',
    fields: azureMsSqlDatabaseFields,
    templates: {
      default: generateDefaultAzureMsSqlDatabaseConfig() as unknown as ResourceTemplate,
      general_purpose_vcore: {
        ...generateDefaultAzureMsSqlDatabaseConfig(),
        name: 'myvcoredb',
        sku_name: 'GP_Gen5_2', // General Purpose, Gen5, 2 vCores
        max_size_gb: 32,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_mssql_database de Terraform permite gestionar una base de datos Azure SQL.",
      examples: [
        `
resource "azurerm_mssql_server" "example" {
  name                         = "tfex-sqlserver"
  resource_group_name          = azurerm_resource_group.example.name
  location                     = azurerm_resource_group.example.location
  version                      = "12.0"
  administrator_login          = "missadministrator"
  administrator_login_password = "thisIsKatPassword123!"
}

resource "azurerm_mssql_database" "example" {
  name      = "tfex-db"
  server_id = azurerm_mssql_server.example.id
  sku_name  = "S0"
}
        `,
      ],
    },
  };
}

export function generateAzureMsSqlDatabaseName(config: AzureMsSqlDatabaseConfig): string {
  return config.name || `azure-sqldb-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureMsSqlDatabaseGeneratedCode {
  name: string;
  description: string;
  config: AzureMsSqlDatabaseConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureMsSqlDatabaseCode(config: AzureMsSqlDatabaseConfig): AzureMsSqlDatabaseGeneratedCode {
  const parsedConfig = AzureMsSqlDatabaseSchema.parse(config);
  return {
    name: generateAzureMsSqlDatabaseName(parsedConfig),
    description: `Azure SQL Database: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureMsSqlDatabaseTemplates(parsedConfig),
  };
}

const azureMsSqlDatabaseResource = {
  type: 'azurerm_mssql_database',
  name: 'Azure SQL Database',
  schema: () => AzureMsSqlDatabaseSchema,
  defaults: generateDefaultAzureMsSqlDatabaseConfig,
  fields: () => azureMsSqlDatabaseFields,
  templates: (config: AzureMsSqlDatabaseConfig) => generateAzureMsSqlDatabaseTemplates(config),

  originalSchema: AzureMsSqlDatabaseSchema,
  originalGenerateDefaultConfig: generateDefaultAzureMsSqlDatabaseConfig,
  originalGenerateResourceSchema: generateAzureMsSqlDatabaseResourceSchema,
  originalGenerateResourceName: generateAzureMsSqlDatabaseName,
  originalGenerateTemplates: generateAzureMsSqlDatabaseCode,
};

export default azureMsSqlDatabaseResource;
