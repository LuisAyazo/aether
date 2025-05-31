import { z } from 'zod';
import { ResourceSchema } from '../../../../../types/resourceConfig';
import { networkFields } from './networkFields';
import { networkTemplates } from './networkTemplates';

// Esquema Zod para la validación de la configuración de una red VPC de GCP
export const gcpComputeNetworkValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la red es requerido")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones."),
  project: z.string().min(1, "El ID del proyecto es requerido"),
  auto_create_subnetworks: z.boolean().default(true)
    .describe("Crear subredes automáticamente en cada región."),
  mtu: z.number({ invalid_type_error: "MTU debe ser un número." })
    .min(1280, "El MTU mínimo es 1280.") // Límite inferior común en GCP
    .max(8896, "El MTU máximo es 8896.") // Límite superior común en GCP
    .default(1460)
    .describe("Unidad de Transmisión Máxima en bytes (e.g., 1460, 1500)."),
  routing_mode: z.enum(['REGIONAL', 'GLOBAL'], { errorMap: () => ({ message: "Modo de enrutamiento inválido." }) })
    .default('REGIONAL')
    .describe("Modo de enrutamiento para la red."),
  description: z.string().optional().describe("Descripción de la red."),
  delete_default_routes_on_create: z.boolean().default(false)
    .describe("Si se eliminan las rutas predeterminadas de la puerta de enlace de Internet al crear."),
});

export type GCPComputeNetworkConfig = z.infer<typeof gcpComputeNetworkValidationSchema>;

export const defaultGCPComputeNetworkConfig: Partial<GCPComputeNetworkConfig> = {
  name: 'my-vpc-network',
  project: 'my-gcp-project',
  auto_create_subnetworks: true,
  mtu: 1460,
  routing_mode: 'REGIONAL',
  description: 'Custom VPC network',
  delete_default_routes_on_create: false,
};

// Funciones para el registro global, esperadas por getResourceConfig
export const schema = () => Promise.resolve(gcpComputeNetworkValidationSchema);
export const fields = () => Promise.resolve(networkFields);
export const templates = () => Promise.resolve(networkTemplates); // networkTemplates es un array, no una función generadora
export const defaults = () => Promise.resolve(defaultGCPComputeNetworkConfig);

export const networkSchema: ResourceSchema = { // Descriptor para UI
  type: 'gcp_compute_network',
  displayName: 'VPC Network',
  description: 'Google Cloud Platform Virtual Private Cloud network',
  category: 'compute',
  fields: networkFields,
  templates: networkTemplates, // Referencia directa para la UI si es necesario
  documentation: {
    description: 'A VPC network provides connectivity for your compute instances',
    examples: [
      'Auto-mode VPC with automatic subnets',
      'Custom-mode VPC with manual subnet control',
      'Legacy network for simple setups'
    ]
  }
};
