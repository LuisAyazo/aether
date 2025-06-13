import { z } from 'zod';
import { azureCosmosDbAccountFields } from './cosmosDbAccountFields';
import { generateAzureCosmosDbAccountTemplates } from './cosmosDbAccountTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

const ConsistencyPolicySchema = z.object({
  consistency_level: z.enum(['BoundedStaleness', 'ConsistentPrefix', 'Eventual', 'Session', 'Strong']),
  max_interval_in_seconds: z.number().min(5).max(86400).optional(),
  max_staleness_prefix: z.number().min(10).max(2147483647).optional(),
}).refine(data => {
  if (data.consistency_level === 'BoundedStaleness') {
    return data.max_interval_in_seconds !== undefined && data.max_staleness_prefix !== undefined;
  }
  return true;
}, {
  message: "Para BoundedStaleness, max_interval_in_seconds y max_staleness_prefix son obligatorios.",
  path: ["max_interval_in_seconds"], // O un path más general
});

const GeoLocationSchema = z.object({
  location: z.string().min(1),
  failover_priority: z.number().min(0),
  // is_zone_redundant: z.boolean().optional(), // Terraform lo maneja diferente
});

export const AzureCosmosDbAccountSchema = z.object({
  name: z.string().min(3).max(44).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Nombre inválido para Cosmos DB Account."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación principal es obligatoria."),
  offer_type: z.literal('Standard'),
  kind: z.enum(['GlobalDocumentDB', 'MongoDB', 'Table', 'Cassandra', 'Gremlin']),
  consistency_policy: ConsistencyPolicySchema,
  geo_location: GeoLocationSchema, // Simplificado a una sola geo-location principal. Para múltiples, usar z.array(GeoLocationSchema).
  enable_automatic_failover: z.boolean().optional(),
  is_virtual_network_filter_enabled: z.boolean().optional(),
  public_network_access_enabled: z.boolean().optional(),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureCosmosDbAccountConfig = z.infer<typeof AzureCosmosDbAccountSchema>;

export function generateDefaultAzureCosmosDbAccountConfig(): AzureCosmosDbAccountConfig {
  return {
    name: 'mycosmosdbacc',
    resource_group_name: 'my-cosmosdb-resources',
    location: 'East US',
    offer_type: 'Standard',
    kind: 'GlobalDocumentDB', // Core (SQL) API
    consistency_policy: {
      consistency_level: 'Session',
    },
    geo_location: {
      location: 'East US', // Debe coincidir con la ubicación principal
      failover_priority: 0,
    },
    enable_automatic_failover: true,
    public_network_access_enabled: true,
  };
}

export function generateAzureCosmosDbAccountResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_cosmosdb_account',
    displayName: 'Azure Cosmos DB Account',
    description: 'Crea una cuenta de Azure Cosmos DB.',
    category: 'Bases de Datos',
    fields: azureCosmosDbAccountFields,
    templates: {
      default: generateDefaultAzureCosmosDbAccountConfig() as unknown as ResourceTemplate,
      mongo_db_api: {
        ...generateDefaultAzureCosmosDbAccountConfig(),
        name: 'mymongocosmos',
        kind: 'MongoDB',
        consistency_policy: { consistency_level: 'Eventual' },
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_cosmosdb_account de Terraform permite gestionar una cuenta de Azure Cosmos DB.",
      examples: [
        `
resource "azurerm_cosmosdb_account" "example" {
  name                = "tfex-cosmosdb-account"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }

  geo_location {
    location          = azurerm_resource_group.example.location
    failover_priority = 0
  }
}
        `,
      ],
    },
  };
}

export function generateAzureCosmosDbAccountName(config: AzureCosmosDbAccountConfig): string {
  return config.name || `azure-cosmosdb-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureCosmosDbAccountGeneratedCode {
  name: string;
  description: string;
  config: AzureCosmosDbAccountConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureCosmosDbAccountCode(config: AzureCosmosDbAccountConfig): AzureCosmosDbAccountGeneratedCode {
  const parsedConfig = AzureCosmosDbAccountSchema.parse(config);
  return {
    name: generateAzureCosmosDbAccountName(parsedConfig),
    description: `Azure Cosmos DB Account: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureCosmosDbAccountTemplates(parsedConfig),
  };
}

const azureCosmosDbAccountResource = {
  type: 'azurerm_cosmosdb_account',
  name: 'Azure Cosmos DB Account',
  schema: () => AzureCosmosDbAccountSchema,
  defaults: generateDefaultAzureCosmosDbAccountConfig,
  fields: () => azureCosmosDbAccountFields,
  templates: (config: AzureCosmosDbAccountConfig) => generateAzureCosmosDbAccountTemplates(config),

  originalSchema: AzureCosmosDbAccountSchema,
  originalGenerateDefaultConfig: generateDefaultAzureCosmosDbAccountConfig,
  originalGenerateResourceSchema: generateAzureCosmosDbAccountResourceSchema,
  originalGenerateResourceName: generateAzureCosmosDbAccountName,
  originalGenerateTemplates: generateAzureCosmosDbAccountCode,
};

export default azureCosmosDbAccountResource;
