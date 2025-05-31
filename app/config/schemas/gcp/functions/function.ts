import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { cloudFunctionFields } from './functionFields';
import { generateGCPCloudFunctionTemplates } from './functionTemplates';

// Esquema de validación para GCP Cloud Function
export const gcpCloudFunctionValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la función es requerido.")
    .regex(/^[a-zA-Z](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/, "Debe empezar con letra, seguido de letras, números, guiones o guiones bajos."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  region: z.string().min(1, "La región es requerida."),
  runtime: z.string().min(1, "El runtime es requerido."),
  entryPoint: z.string().min(1, "El punto de entrada es requerido."),
  triggerType: z.enum(['HTTP', 'PUBSUB', 'STORAGE']),
  triggerResource: z.string().optional(), // Requerido para PUBSUB y STORAGE
  availableMemoryMb: z.string().optional(), // Zod parsea números de selects como strings si no se transforman
  timeout: z.string().regex(/^\d+s$/, "Debe ser un número seguido de 's' (ej. 60s).").optional(),
  sourceArchiveUrl: z.string().url("Debe ser una URL GCS válida (gs://...).").optional(),
  // Podríamos añadir más campos como variables de entorno, VPC connector, etc.
}).refine(data => {
  if ((data.triggerType === 'PUBSUB' || data.triggerType === 'STORAGE') && !data.triggerResource) {
    return false;
  }
  return true;
}, {
  message: "El Recurso del Disparador es requerido para triggers Pub/Sub o Storage.",
  path: ["triggerResource"], // Path del campo que causa el error
});

// Tipo inferido de la configuración de Cloud Function
export type GCPCloudFunctionConfig = z.infer<typeof gcpCloudFunctionValidationSchema>;

// Valores por defecto para una nueva Cloud Function
export const defaultGCPCloudFunctionConfig: Partial<GCPCloudFunctionConfig> = {
  name: 'my-function',
  region: 'us-central1',
  runtime: 'nodejs18',
  entryPoint: 'handler',
  triggerType: 'HTTP',
  availableMemoryMb: '256',
  timeout: '60s',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpCloudFunctionValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(cloudFunctionFields);
};

export const templates = (config: GCPCloudFunctionConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPCloudFunctionTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPCloudFunctionConfig);
};
