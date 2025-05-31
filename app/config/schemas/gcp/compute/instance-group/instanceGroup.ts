import { z } from 'zod';
import { ResourceSchema } from '../../../../../types/resourceConfig';
import { instanceGroupFields } from './instanceGroupFields';
import { instanceGroupTemplates } from './instanceGroupTemplates';

// Sub-esquemas para Instance Group Manager
const versionSchema = z.object({
  instance_template: z.string().min(1, "El template de instancia es requerido."),
  name: z.string().default('primary').describe("Nombre para esta versión del template."),
});

const autoHealingPoliciesSchema = z.object({
  health_check: z.string().optional().describe("Nombre del health check a usar."),
  initial_delay_sec: z.number({ invalid_type_error: "El retraso inicial debe ser un número." })
    .default(300)
    .describe("Tiempo a esperar antes de verificar el estado de nuevas instancias."),
});

const updatePolicySchema = z.object({
  type: z.enum(['ROLLING_UPDATE', 'OPPORTUNISTIC']).default('ROLLING_UPDATE')
    .describe("Tipo de actualización a realizar."),
  minimal_action: z.enum(['REPLACE', 'RESTART']).default('REPLACE')
    .describe("Acción mínima a tomar al actualizar instancias."),
  max_surge_fixed: z.number({ invalid_type_error: "Max surge debe ser un número." }).default(1)
    .describe("Número máximo de instancias a crear durante la actualización."),
  max_unavailable_fixed: z.number({ invalid_type_error: "Max unavailable debe ser un número." }).default(1)
    .describe("Número máximo de instancias que pueden no estar disponibles durante la actualización."),
});

const namedPortSchema = z.object({
  name: z.string().min(1, "El nombre del puerto es requerido."),
  port: z.number({ invalid_type_error: "El número de puerto debe ser un número." })
    .min(1).max(65535).default(80),
});

// Esquema Zod para la validación de la configuración de un Instance Group Manager de GCP
export const gcpComputeInstanceGroupValidationSchema = z.object({
  name: z.string().min(1, "El nombre del grupo de instancias es requerido")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones."),
  project: z.string().min(1, "El ID del proyecto es requerido"),
  zone: z.enum([
    'us-central1-a', 'us-central1-b', 'us-central1-c', 'us-east1-a', 'us-east1-b',
    'us-west1-a', 'us-west1-b', 'europe-west1-a', 'europe-west1-b', 'asia-east1-a', 'asia-east1-b'
  ]).optional(),
  region: z.enum([
    'us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-east1'
  ]).optional(),
  base_instance_name: z.string().min(1, "El nombre base de instancia es requerido."),
  version: z.array(versionSchema).min(1, "Se requiere al menos una versión de template de instancia."), // Un MIG siempre tiene al menos una versión.
  target_size: z.number({ invalid_type_error: "El tamaño objetivo debe ser un número." })
    .min(0, "El tamaño objetivo no puede ser negativo.") // Puede ser 0 si el autoscaler está activo.
    .default(1), // Default a 1 en lugar de 3 como en fields, para ser más conservador.
  auto_healing_policies: z.array(autoHealingPoliciesSchema).optional()
    .describe("Políticas de auto-reparación."),
  update_policy: updatePolicySchema.optional().describe("Política de actualización."),
  named_ports: z.array(namedPortSchema).optional().describe("Puertos nombrados."), // Corregido a named_ports y array
  target_pools: z.array(z.string()).optional().describe("Pools de destino (separados por comas en UI, array aquí)."),
  description: z.string().optional().describe("Descripción del grupo de instancias."), // Campo común
}).refine(data => (data.zone && !data.region) || (!data.zone && data.region), {
  message: "Debe especificar una 'zona' (para grupos zonales) o una 'región' (para grupos regionales), pero no ambas.",
  path: ["zone"], // O path: ["region"], o un path más general si es preferible
});

export type GCPComputeInstanceGroupConfig = z.infer<typeof gcpComputeInstanceGroupValidationSchema>;

export const defaultGCPComputeInstanceGroupConfig: Partial<GCPComputeInstanceGroupConfig> = {
  name: 'my-instance-group',
  project: 'my-gcp-project',
  region: 'us-central1', // Default a regional
  base_instance_name: 'my-instance',
  version: [{
    instance_template: 'my-instance-template', // Debe existir un template con este nombre
    name: 'v1',
  }],
  target_size: 1,
  auto_healing_policies: [{
    initial_delay_sec: 300,
    // health_check: 'my-health-check' // Opcional, referenciar un health check existente
  }],
  update_policy: {
    type: 'ROLLING_UPDATE',
    minimal_action: 'REPLACE',
    max_surge_fixed: 1,
    max_unavailable_fixed: 1,
  },
  named_ports: [{ name: 'http', port: 80 }],
  description: 'Managed Instance Group',
};

// Funciones para el registro global, esperadas por getResourceConfig
export const schema = () => Promise.resolve(gcpComputeInstanceGroupValidationSchema);
export const fields = () => Promise.resolve(instanceGroupFields);
export const templates = () => Promise.resolve(instanceGroupTemplates); // instanceGroupTemplates es un array
export const defaults = () => Promise.resolve(defaultGCPComputeInstanceGroupConfig);

export const instanceGroupSchema: ResourceSchema = { // Descriptor para UI
  type: 'gcp_compute_instance_group_manager',
  displayName: 'Instance Group Manager',
  description: 'Google Cloud Platform managed instance group for auto-scaling',
  category: 'compute',
  fields: instanceGroupFields,
  templates: instanceGroupTemplates, // Referencia directa para la UI si es necesario
  documentation: {
    description: 'Managed instance groups provide auto-scaling and self-healing for identical VM instances',
    examples: [
      'Auto-scaling web server farm',
      'Regional instance group for high availability',
      'Instance group with load balancer backend'
    ]
  }
};
