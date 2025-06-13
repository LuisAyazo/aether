import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { gcpStorageBucketFields } from './bucketFields';
import { generateGCPStorageBucketTemplates } from './bucketTemplates';

// Esquema de validación para GCP Storage Bucket
export const gcpStorageBucketValidationSchema = z.object({
  name: z.string().min(3, "El nombre del bucket debe tener al menos 3 caracteres.")
    .max(63, "El nombre del bucket no puede exceder los 63 caracteres.")
    .regex(/^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/, "Nombre de bucket inválido. Ver guías de nombrado de GCP."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  location: z.string().min(1, "La ubicación es requerida."),
  storage_class: z.enum(['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE']),
  versioning: z.boolean().optional(),
  uniform_bucket_level_access: z.boolean().optional(),
  public_access_prevention: z.enum(['enforced', 'inherited']).optional(),
  lifecycle_rules: z.string().optional().refine(val => {
    if (!val) return true; // Es opcional
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed); // Debe ser un array de reglas
    } catch (e) {
      return false;
    }
  }, { message: "Las reglas de ciclo de vida deben ser un JSON array válido." }),
});

// Tipo inferido de la configuración de Storage Bucket
export type GCPStorageBucketConfig = z.infer<typeof gcpStorageBucketValidationSchema>;

// Valores por defecto para un nuevo Storage Bucket
export const defaultGCPStorageBucketConfig: Partial<GCPStorageBucketConfig> = {
  name: 'my-unique-gcs-bucket',
  location: 'US-CENTRAL1',
  storage_class: 'STANDARD',
  versioning: false,
  uniform_bucket_level_access: true,
  public_access_prevention: 'inherited',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpStorageBucketValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gcpStorageBucketFields);
};

export const templates = (config: GCPStorageBucketConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPStorageBucketTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPStorageBucketConfig);
};
