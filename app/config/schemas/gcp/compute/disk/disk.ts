import { z } from 'zod';
import { ResourceSchema, CodeTemplate, ResourceValues } from '../../../../../types/resourceConfig'; // Añadir CodeTemplate y ResourceValues
import { diskFields } from './diskFields';
import { generateGCPComputeDiskTemplates } from './diskTemplates'; // Cambiar import

// Esquema Zod para la validación de la configuración de un disco GCP Compute
export const gcpComputeDiskValidationSchema = z.object({
  name: z.string().min(1, "El nombre del disco es requerido")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones."),
  project: z.string().min(1, "El ID del proyecto es requerido"),
  zone: z.enum([
    'us-central1-a', 'us-central1-b', 'us-central1-c',
    'us-east1-a', 'us-east1-b',
    'us-west1-a', 'us-west1-b',
    'europe-west1-a', 'europe-west1-b',
    'asia-east1-a', 'asia-east1-b'
  ], { errorMap: () => ({ message: "Zona inválida seleccionada." }) }),
  size: z.number({ invalid_type_error: "El tamaño debe ser un número." })
    .min(10, "El tamaño mínimo del disco es 10 GB.")
    .max(65536, "El tamaño máximo del disco es 65536 GB.") // Según la documentación de GCP
    .default(10),
  type: z.enum([
    'pd-standard', 'pd-ssd', 'pd-balanced', 'pd-extreme'
  ], { errorMap: () => ({ message: "Tipo de disco inválido." }) }).default('pd-standard'),
  image: z.object({
    project: z.string().optional(),
    family: z.string().optional(),
    name: z.string().optional(),
  }).optional().describe("Imagen fuente para crear el disco (opcional)"),
  snapshot: z.string().optional().describe("Snapshot fuente para crear el disco (opcional)"),
  labels: z.object({
    environment: z.enum(['dev', 'staging', 'prod']).optional(),
    team: z.string().optional(),
  }).optional().describe("Etiquetas para asignar al disco (opcional)"),
  description: z.string().optional(), // Campo común del baseSchema
});

export type GCPComputeDiskConfig = z.infer<typeof gcpComputeDiskValidationSchema>;

export const defaultGCPComputeDiskConfig: Partial<GCPComputeDiskConfig> = {
  name: 'my-disk',
  project: 'my-gcp-project',
  zone: 'us-central1-a',
  size: 10,
  type: 'pd-standard',
  labels: {
    environment: 'dev',
  },
  description: 'Persistent disk',
};

// Funciones para el registro global, esperadas por getResourceConfig
export const schema = (): Promise<z.ZodTypeAny> => Promise.resolve(gcpComputeDiskValidationSchema); // Añadir tipo de retorno explícito
export const fields = () => Promise.resolve(diskFields);
export const templates = (config: GCPComputeDiskConfig): Promise<CodeTemplate> => Promise.resolve(generateGCPComputeDiskTemplates(config)); // Actualizar firma y llamada
export const defaults = (): Promise<Partial<ResourceValues>> => Promise.resolve(defaultGCPComputeDiskConfig); // Añadir tipo de retorno explícito

export const diskSchema: ResourceSchema = { // Este es el descriptor para la UI, no el esquema de validación Zod directamente
  type: 'gcp_compute_disk', // Usado para identificar el tipo de nodo en el frontend
  displayName: 'Compute Disk',
  description: 'Google Cloud Platform persistent disk resource',
  category: 'compute', // Usado para agrupar en la UI o lógica
  fields: diskFields, // Referencia a la configuración de campos para la UI
  templates: [], // Proporcionar un array vacío para satisfacer ResourceSchema
  // El esquema de validación Zod y los defaults ahora se acceden a través de las funciones exportadas arriba
  documentation: {
    description: 'A persistent disk resource that can be attached to compute instances',
    examples: [
      'Standard persistent disk for boot volumes',
      'SSD persistent disk for high-performance workloads',
      'Regional persistent disk for high availability'
    ]
  }
};
