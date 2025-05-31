import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig'; // Usar alias
import { appEngineAppFields } from './appFields';
import { generateGCPAppEngineAppTemplates } from './appTemplates';

// Esquema de validación para GCP App Engine Application
export const gcpAppEngineAppValidationSchema = z.object({
  name: z.string().min(1, "El nombre del recurso es requerido."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  locationId: z.string().min(1, "La región (Location ID) es requerida."),
  runtime: z.string().optional(), // El runtime principal se define a nivel de servicio en app.yaml
  serviceAccount: z.string().email("Debe ser un email válido para la cuenta de servicio.").optional().or(z.literal('')),
  databaseType: z.enum([
    '', 
    'CLOUD_SQL_POSTGRESQL', 
    'CLOUD_SQL_MYSQL', 
    'FIRESTORE_NATIVE', 
    'FIRESTORE_DATASTORE_MODE'
  ]).optional(),
  authDomain: z.string().optional(),
  // Podríamos añadir más campos específicos de App Engine Application si es necesario
  // como `serving_status`, `feature_settings`, etc.
});

// Tipo inferido de la configuración de App Engine
export type GCPAppEngineAppConfig = z.infer<typeof gcpAppEngineAppValidationSchema>;

// Valores por defecto para una nueva App Engine Application
export const defaultGCPAppEngineAppConfig: Partial<GCPAppEngineAppConfig> = {
  name: 'my-appengine-app',
  locationId: 'us-central',
  runtime: 'nodejs18', // Aunque no es parte del recurso principal, es útil para la UI y plantillas de servicio
  databaseType: '',
  authDomain: '',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpAppEngineAppValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(appEngineAppFields);
};

export const templates = (config: GCPAppEngineAppConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPAppEngineAppTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPAppEngineAppConfig);
};
