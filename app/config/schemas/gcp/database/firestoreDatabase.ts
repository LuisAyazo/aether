import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { gcpFirestoreDatabaseFields } from './firestoreDatabaseFields';
import { generateGCPFirestoreDatabaseTemplates } from './firestoreDatabaseTemplates';

// Esquema de validación para GCP Firestore Database
export const gcpFirestoreDatabaseValidationSchema = z.object({
  project: z.string().min(1, "El ID del proyecto es requerido."),
  name: z.string().default('(default)')
    .describe("Nombre de la base de datos, usualmente '(default)'."),
  location_id: z.string().min(1, "La ubicación es requerida."),
  type: z.enum(['FIRESTORE_NATIVE', 'DATASTORE_MODE']),
  delete_protection_state: z.enum(['DELETE_PROTECTION_ENABLED', 'DELETE_PROTECTION_DISABLED']).optional(),
  // concurrency_mode: z.enum(['OPTIMISTIC', 'PESSIMISTIC', 'OPTIMISTIC_WITH_ENTITY_GROUPS']).optional(), // Para modo Datastore
  // app_engine_integration_mode: z.enum(['ENABLED', 'DISABLED']).optional(), // Para modo Datastore
});

// Tipo inferido de la configuración de Firestore Database
export type GCPFirestoreDatabaseConfig = z.infer<typeof gcpFirestoreDatabaseValidationSchema>;

// Valores por defecto para una nueva Firestore Database
export const defaultGCPFirestoreDatabaseConfig: Partial<GCPFirestoreDatabaseConfig> = {
  name: '(default)',
  location_id: 'nam5 (us-central)',
  type: 'FIRESTORE_NATIVE',
  delete_protection_state: 'DELETE_PROTECTION_DISABLED',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpFirestoreDatabaseValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gcpFirestoreDatabaseFields);
};

export const templates = (config: GCPFirestoreDatabaseConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPFirestoreDatabaseTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPFirestoreDatabaseConfig);
};
