import { z } from 'zod';
import { ResourceSchema, CodeTemplate, ResourceValues } from '../../../../../types/resourceConfig'; // Añadir CodeTemplate y ResourceValues
import { instanceTemplateFields } from './instanceTemplateFields';
import { generateGCPComputeInstanceTemplateTemplates } from './instanceTemplateTemplates'; // Cambiar import

// Sub-esquemas para Instance Template
const diskConfigSchema = z.object({
  size_gb: z.number({ invalid_type_error: "Tamaño del disco debe ser un número." }).default(20),
  type: z.enum(['pd-standard', 'pd-ssd', 'pd-balanced']).default('pd-standard'),
  auto_delete: z.boolean().default(true),
});

const imageConfigSchema = z.object({
  project: z.string().min(1, "Proyecto de imagen es requerido.").default('ubuntu-os-cloud'),
  family: z.string().min(1, "Familia de imagen es requerida.").default('ubuntu-2004-lts'),
});

const networkInterfaceConfigSchema = z.object({
  network: z.string().min(1, "Red es requerida.").default('default'),
  subnetwork: z.string().optional(),
  access_config: z.boolean().default(true).describe("Asignar IP externa."),
});

const metadataConfigSchema = z.object({
  startup_script: z.string().optional(),
  ssh_keys: z.string().optional(),
});

const serviceAccountConfigSchema = z.object({
  email: z.string().optional().default('default'),
  scopes: z.string().default('cloud-platform').describe("Separado por comas si son múltiples."),
});

const labelsConfigSchema = z.object({
  environment: z.enum(['dev', 'staging', 'prod']).optional(),
  team: z.string().optional(),
});

// Esquema Zod para la validación de la configuración de un Instance Template de GCP
export const gcpComputeInstanceTemplateValidationSchema = z.object({
  name: z.string().min(1, "El nombre del template es requerido")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones."),
  project: z.string().min(1, "El ID del proyecto es requerido"),
  machine_type: z.enum([
    'e2-micro', 'e2-small', 'e2-medium', 'e2-standard-2', 'e2-standard-4',
    'n1-standard-1', 'n1-standard-2', 'n1-standard-4'
  ]).default('e2-micro'),
  region: z.enum([
    'us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'
  ]).default('us-central1'),
  disk: diskConfigSchema.optional().describe("Configuración del disco de arranque."), // GCP infiere un disco de arranque si no se especifica, pero aquí lo hacemos opcional para flexibilidad.
  image: imageConfigSchema.describe("Imagen de arranque."), // Requerido por la UI, así que lo mantenemos requerido aquí.
  network_interface: networkInterfaceConfigSchema.optional().describe("Configuración de la interfaz de red."),
  tags: z.string().optional().describe("Etiquetas de red (separadas por comas)."),
  metadata: metadataConfigSchema.optional().describe("Metadatos de la instancia."),
  service_account: serviceAccountConfigSchema.optional().describe("Configuración de la cuenta de servicio."),
  labels: labelsConfigSchema.optional().describe("Etiquetas para las instancias."),
  description: z.string().optional().describe("Descripción del template de instancia."), // Campo común
});

export type GCPComputeInstanceTemplateConfig = z.infer<typeof gcpComputeInstanceTemplateValidationSchema>;

export const defaultGCPComputeInstanceTemplateConfig: Partial<GCPComputeInstanceTemplateConfig> = {
  name: 'my-instance-template',
  project: 'my-gcp-project',
  machine_type: 'e2-micro',
  region: 'us-central1',
  image: {
    project: 'ubuntu-os-cloud',
    family: 'ubuntu-2004-lts',
  },
  disk: {
    size_gb: 20,
    type: 'pd-standard',
    auto_delete: true,
  },
  network_interface: {
    network: 'default',
    access_config: true,
  },
  service_account: {
    email: 'default',
    scopes: 'cloud-platform',
  },
  description: 'Default instance template',
};

// Funciones para el registro global, esperadas por getResourceConfig
export const schema = (): Promise<z.ZodTypeAny> => Promise.resolve(gcpComputeInstanceTemplateValidationSchema); // Añadir tipo de retorno explícito
export const fields = () => Promise.resolve(instanceTemplateFields);
export const templates = (config: GCPComputeInstanceTemplateConfig): Promise<CodeTemplate> => Promise.resolve(generateGCPComputeInstanceTemplateTemplates(config)); // Actualizar firma y llamada
export const defaults = (): Promise<Partial<ResourceValues>> => Promise.resolve(defaultGCPComputeInstanceTemplateConfig); // Añadir tipo de retorno explícito

export const instanceTemplateSchema: ResourceSchema = { // Descriptor para UI
  type: 'gcp_compute_instance_template',
  displayName: 'Instance Template',
  description: 'Google Cloud Platform instance template for managed instance groups',
  category: 'compute',
  fields: instanceTemplateFields,
  templates: [], // Proporcionar un array vacío para satisfacer ResourceSchema
  documentation: {
    description: 'Instance templates define the configuration for creating identical VM instances',
    examples: [
      'Template for auto-scaling web servers',
      'Template for batch processing workers',
      'Template for container-optimized instances'
    ]
  }
};
