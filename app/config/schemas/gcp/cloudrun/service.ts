import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { cloudRunServiceFields } from './serviceFields';
import { generateGCPCloudRunServiceTemplates } from './serviceTemplates';

// Esquema de validación para GCP Cloud Run Service
export const gcpCloudRunServiceValidationSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es requerido.")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "Debe ser un nombre DNS-compatible (letras minúsculas, números, guiones)."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  location: z.string().min(1, "La región es requerida."),
  image: z.string().min(1, "La imagen del contenedor es requerida.")
    .regex(/^.+\/.+(:.+)?$/, "Debe ser una URL de imagen de contenedor válida (ej. gcr.io/project/image:tag)."),
  port: z.number().min(1).max(65535).optional(),
  allowUnauthenticated: z.boolean().optional(),
  cpu: z.string().optional(), // Ej: "1", "2", "4"
  memory: z.string().optional(), // Ej: "256Mi", "512Mi", "1Gi"
  minInstances: z.number().min(0).optional(),
  maxInstances: z.number().min(0).optional(),
  // Se podrían añadir variables de entorno, secretos, configuraciones de VPC, etc.
});

// Tipo inferido de la configuración de Cloud Run Service
export type GCPCloudRunServiceConfig = z.infer<typeof gcpCloudRunServiceValidationSchema>;

// Valores por defecto para un nuevo Cloud Run Service
export const defaultGCPCloudRunServiceConfig: Partial<GCPCloudRunServiceConfig> = {
  name: 'my-cloudrun-svc',
  location: 'us-central1',
  port: 8080,
  allowUnauthenticated: false,
  cpu: '1',
  memory: '512Mi',
  minInstances: 0,
  maxInstances: 10,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpCloudRunServiceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(cloudRunServiceFields);
};

export const templates = (config: GCPCloudRunServiceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPCloudRunServiceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPCloudRunServiceConfig);
};
