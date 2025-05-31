import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { gcpMemorystoreInstanceFields } from './instanceFields';
import { generateGCPMemorystoreInstanceTemplates } from './instanceTemplates';

// Esquema de validación para GCP Memorystore Instance
export const gcpMemorystoreInstanceValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la instancia es requerido.")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "Nombre inválido."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  region: z.string().min(1, "La región es requerida."),
  tier: z.enum(['BASIC', 'STANDARD_HA']), // Para Redis
  memory_size_gb: z.number().int().min(1, "El tamaño mínimo es 1GB."),
  redis_version: z.string().optional(), // Ej: "REDIS_6_X"
  connect_mode: z.enum(['DIRECT_PEERING', 'PRIVATE_SERVICE_ACCESS']).optional(),
  authorized_network: z.string().optional()
    .describe("Requerido si connect_mode es DIRECT_PEERING. Formato: projects/{project}/global/networks/{networkId}"),
  // transit_encryption_mode: z.enum(['SERVER_AUTHENTICATION', 'CLIENT_AUTHENTICATION']).optional(), // Para Redis
  // maintenance_policy (objeto complejo)
  // persistence_config (objeto complejo)
});

// Tipo inferido de la configuración de Memorystore Instance
export type GCPMemorystoreInstanceConfig = z.infer<typeof gcpMemorystoreInstanceValidationSchema>;

// Valores por defecto para una nueva Memorystore Instance
export const defaultGCPMemorystoreInstanceConfig: Partial<GCPMemorystoreInstanceConfig> = {
  name: 'my-memorystore-instance',
  region: 'us-central1',
  tier: 'BASIC',
  memory_size_gb: 1,
  redis_version: 'REDIS_7_2', // Actualizado al nuevo default
  connect_mode: 'DIRECT_PEERING',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpMemorystoreInstanceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gcpMemorystoreInstanceFields);
};

export const templates = (config: GCPMemorystoreInstanceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPMemorystoreInstanceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPMemorystoreInstanceConfig);
};
