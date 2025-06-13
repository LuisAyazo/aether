import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { gcpFilestoreInstanceFields } from './filestoreInstanceFields';
import { generateGCPFilestoreInstanceTemplates } from './filestoreInstanceTemplates';

// Esquema de validación para GCP Filestore Instance
export const gcpFilestoreInstanceValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la instancia es requerido.")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "Nombre inválido. Debe seguir las convenciones de nombrado de GCP."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  zone: z.string().min(1, "La zona es requerida."),
  tier: z.enum(['STANDARD', 'PREMIUM', 'HIGH_SCALE_SSD', 'ENTERPRISE']),
  file_share_capacity_gb: z.number().int().min(1024, "La capacidad mínima es 1024 GB."),
  file_share_name: z.string().min(1, "El nombre del recurso compartido es requerido.").max(16, "Máximo 16 caracteres."),
  network: z.string().min(1, "La red VPC es requerida."),
  // description: z.string().optional(),
  // labels: z.record(z.string()).optional(),
});

// Tipo inferido de la configuración de Filestore Instance
export type GCPFilestoreInstanceConfig = z.infer<typeof gcpFilestoreInstanceValidationSchema>;

// Valores por defecto para una nueva Filestore Instance
export const defaultGCPFilestoreInstanceConfig: Partial<GCPFilestoreInstanceConfig> = {
  name: 'my-filestore',
  zone: 'us-central1-a',
  tier: 'STANDARD',
  file_share_capacity_gb: 1024,
  file_share_name: 'vol1',
  network: 'default',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpFilestoreInstanceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gcpFilestoreInstanceFields);
};

export const templates = (config: GCPFilestoreInstanceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPFilestoreInstanceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPFilestoreInstanceConfig);
};
