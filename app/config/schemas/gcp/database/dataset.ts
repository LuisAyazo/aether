import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { gcpBigQueryDatasetFields } from './datasetFields';
import { generateGCPBigQueryDatasetTemplates } from './datasetTemplates';

// Esquema de validación para GCP BigQuery Dataset
export const gcpBigQueryDatasetValidationSchema = z.object({
  dataset_id: z.string().min(1, "El ID del dataset es requerido.")
    .regex(/^[a-zA-Z0-9_]+$/, "El ID del dataset solo puede contener letras, números y guiones bajos."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  location: z.string().min(1, "La ubicación es requerida."),
  friendly_name: z.string().optional(),
  description: z.string().optional(),
  default_table_expiration_ms: z.number().int().min(0).optional()
    .describe("Tiempo en milisegundos. 0 significa sin expiración."),
  default_partition_expiration_ms: z.number().int().min(0).optional()
    .describe("Tiempo en milisegundos. 0 significa sin expiración."),
  // labels: z.record(z.string()).optional(), // Para etiquetas clave-valor
});

// Tipo inferido de la configuración de BigQuery Dataset
export type GCPBigQueryDatasetConfig = z.infer<typeof gcpBigQueryDatasetValidationSchema>;

// Valores por defecto para un nuevo BigQuery Dataset
export const defaultGCPBigQueryDatasetConfig: Partial<GCPBigQueryDatasetConfig> = {
  dataset_id: 'my_new_dataset',
  location: 'US',
  friendly_name: 'My New Dataset',
  description: 'A dataset for storing important data.',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpBigQueryDatasetValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gcpBigQueryDatasetFields);
};

export const templates = (config: GCPBigQueryDatasetConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPBigQueryDatasetTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPBigQueryDatasetConfig);
};
