import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { gcpSqlInstanceFields } from './instanceFields';
import { generateGCPSqlInstanceTemplates } from './instanceTemplates';

// Esquema de validación para GCP Cloud SQL Instance
export const gcpSqlInstanceValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la instancia es requerido.")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "Debe ser un nombre DNS-compatible."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  region: z.string().min(1, "La región es requerida."),
  database_version: z.string().min(1, "La versión de la base de datos es requerida."), // Ej: MYSQL_8_0, POSTGRES_15
  tier: z.string().min(1, "El tipo de máquina (tier) es requerido."), // Ej: db-f1-micro
  storage_size_gb: z.number().min(10, "El tamaño mínimo de almacenamiento es 10GB."),
  storage_auto_increase: z.boolean().optional(),
  availability_type: z.enum(['ZONAL', 'REGIONAL']).optional(),
  backup_enabled: z.boolean().optional(),
  backup_start_time: z.string().regex(/^\d{2}:\d{2}$/, "Debe estar en formato HH:MM (UTC).").optional(),
  // Considerar añadir:
  // root_password: z.string().optional(), (manejar con cuidado por seguridad)
  // authorized_networks: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  // database_flags: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

// Tipo inferido de la configuración de Cloud SQL Instance
export type GCPSqlInstanceConfig = z.infer<typeof gcpSqlInstanceValidationSchema>;

// Valores por defecto para una nueva Cloud SQL Instance
export const defaultGCPSqlInstanceConfig: Partial<GCPSqlInstanceConfig> = {
  name: 'my-sql-db-instance',
  region: 'us-central1',
  database_version: 'MYSQL_8_0',
  tier: 'db-f1-micro',
  storage_size_gb: 10,
  storage_auto_increase: true,
  availability_type: 'ZONAL',
  backup_enabled: true,
  backup_start_time: '03:00',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpSqlInstanceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gcpSqlInstanceFields);
};

export const templates = (config: GCPSqlInstanceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPSqlInstanceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPSqlInstanceConfig);
};
