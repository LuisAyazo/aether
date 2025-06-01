import { z } from 'zod';
import { azureRedisCacheFields } from './redisCacheFields';
import { generateAzureRedisCacheTemplates } from './redisCacheTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

const RedisConfigurationSchema = z.object({
  maxmemory_reserved: z.number().optional(),
  maxmemory_delta: z.number().optional(),
  // Añadir más configuraciones si es necesario
}).optional();

export const AzureRedisCacheSchema = z.object({
  name: z.string().min(1, "El nombre de la caché es obligatorio."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  capacity: z.number().min(0).max(6), // C0-C6, P0-P5 (P0 es igual a C1 en capacidad)
  family: z.enum(['C', 'P']), // C for Basic/Standard, P for Premium
  sku_name: z.enum(['Basic', 'Standard', 'Premium']),
  enable_non_ssl_port: z.boolean().optional().default(false),
  minimum_tls_version: z.enum(['1.0', '1.1', '1.2']).optional().default('1.2'),
  redis_configuration: RedisConfigurationSchema,
  shard_count: z.number().min(1).optional().describe("Solo para SKU Premium."),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  if (data.family === 'C' && (data.sku_name === 'Premium' || (data.shard_count && data.shard_count > 1))) {
    return false; // No se permite Premium SKU o sharding con familia C
  }
  if (data.family === 'P' && (data.sku_name === 'Basic' || data.sku_name === 'Standard')) {
    return false; // No se permite Basic/Standard SKU con familia P
  }
  // Validar capacidad según familia/sku
  if (data.family === 'C' && (data.capacity < 0 || data.capacity > 6)) return false; // C0-C6
  if (data.family === 'P' && (data.capacity < 1 || data.capacity > 5)) return false; // P1-P5 (Terraform usa 1-5 para P)
  return true;
}, { message: "Configuración de SKU/familia/capacidad inválida."});

export type AzureRedisCacheConfig = z.infer<typeof AzureRedisCacheSchema>;

export function generateDefaultAzureRedisCacheConfig(): AzureRedisCacheConfig {
  return {
    name: 'myrediscache',
    resource_group_name: 'my-cache-resources',
    location: 'East US',
    capacity: 0, // C0
    family: 'C',
    sku_name: 'Basic',
    enable_non_ssl_port: false,
    minimum_tls_version: '1.2',
    redis_configuration: {},
  };
}

export function generateAzureRedisCacheResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_redis_cache',
    displayName: 'Azure Cache for Redis',
    description: 'Crea una instancia de Azure Cache for Redis.',
    category: 'Caché', // O 'Bases de Datos' si se prefiere
    fields: azureRedisCacheFields,
    templates: {
      default: generateDefaultAzureRedisCacheConfig() as unknown as ResourceTemplate,
      standard_c1: {
        ...generateDefaultAzureRedisCacheConfig(),
        name: 'standard-redis-c1',
        sku_name: 'Standard',
        family: 'C',
        capacity: 1, // C1
      } as unknown as ResourceTemplate,
      premium_p1_sharded: {
        ...generateDefaultAzureRedisCacheConfig(),
        name: 'premium-redis-p1s2',
        sku_name: 'Premium',
        family: 'P',
        capacity: 1, // P1
        shard_count: 2,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_redis_cache de Terraform permite gestionar una instancia de Azure Cache for Redis.",
      examples: [
        `
resource "azurerm_redis_cache" "example" {
  name                = "example-cache"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  capacity            = 2
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
}
        `,
      ],
    },
  };
}

export function generateAzureRedisCacheName(config: AzureRedisCacheConfig): string {
  return config.name || `azure-redis-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureRedisCacheGeneratedCode {
  name: string;
  description: string;
  config: AzureRedisCacheConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureRedisCacheCode(config: AzureRedisCacheConfig): AzureRedisCacheGeneratedCode {
  const parsedConfig = AzureRedisCacheSchema.parse(config);
  return {
    name: generateAzureRedisCacheName(parsedConfig),
    description: `Azure Cache for Redis: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureRedisCacheTemplates(parsedConfig),
  };
}

const azureRedisCacheResource = {
  type: 'azurerm_redis_cache',
  name: 'Azure Cache for Redis',
  schema: () => AzureRedisCacheSchema,
  defaults: generateDefaultAzureRedisCacheConfig,
  fields: () => azureRedisCacheFields,
  templates: (config: AzureRedisCacheConfig) => generateAzureRedisCacheTemplates(config),

  originalSchema: AzureRedisCacheSchema,
  originalGenerateDefaultConfig: generateDefaultAzureRedisCacheConfig,
  originalGenerateResourceSchema: generateAzureRedisCacheResourceSchema,
  originalGenerateResourceName: generateAzureRedisCacheName,
  originalGenerateTemplates: generateAzureRedisCacheCode,
};

export default azureRedisCacheResource;
