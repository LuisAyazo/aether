import { z } from 'zod';
import { ResourceSchema } from '../../../../../types/resourceConfig';
import { firewallFields } from './firewallFields';
import { firewallTemplates } from './firewallTemplates';

// Esquema Zod para la validación de la configuración de una regla de Firewall de GCP
export const gcpComputeFirewallValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la regla de firewall es requerido")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones."),
  project: z.string().min(1, "El ID del proyecto es requerido"),
  network: z.string().min(1, "La red es requerida").default('default')
    .describe("La red VPC a la que se aplica esta regla de firewall."),
  direction: z.enum(['INGRESS', 'EGRESS'], { errorMap: () => ({ message: "Dirección inválida." }) })
    .default('INGRESS')
    .describe("Dirección del tráfico al que se aplica esta regla."),
  priority: z.number({ invalid_type_error: "Prioridad debe ser un número." })
    .min(0, "La prioridad mínima es 0.")
    .max(65535, "La prioridad máxima es 65535.") // GCP permite hasta 65535
    .default(1000)
    .describe("Prioridad de la regla (0-65535, números más bajos tienen mayor prioridad)."),
  action: z.enum(['allow', 'deny'], { errorMap: () => ({ message: "Acción inválida." }) })
    .default('allow')
    .describe("Acción a tomar cuando la regla coincide."),
  source_ranges: z.string().optional() // Podría ser z.array(z.string()).optional() con transformación
    .describe("Rangos IP de origen (separados por comas). Usar 0.0.0.0/0 para todos los IPs. Aplicable si direction=INGRESS."),
  target_tags: z.string().optional() // Podría ser z.array(z.string()).optional()
    .describe("Etiquetas de red de destino (separadas por comas)."),
  source_tags: z.string().optional() // Podría ser z.array(z.string()).optional()
    .describe("Etiquetas de red de origen (separadas por comas). Aplicable si direction=INGRESS."),
  protocols: z.object({
    tcp: z.string().optional().describe("Puertos TCP (ej: 80,443,8080-8090)."),
    udp: z.string().optional().describe("Puertos UDP (ej: 53,123)."),
    icmp: z.boolean().default(false).describe("Permitir protocolo ICMP (ping)."),
    all: z.boolean().default(false).describe("Permitir todos los protocolos IP (ignora tcp, udp, icmp si es true).")
  }).optional().describe("Protocolos y puertos permitidos/denegados."),
  description: z.string().optional().describe("Descripción de la regla de firewall."),
  // Campos adicionales que podrían ser útiles:
  // disabled: z.boolean().default(false).describe("Si la regla de firewall está deshabilitada."),
  // log_config: z.object({ enable: z.boolean() }).optional().describe("Configuración de logging para la regla."),
});

export type GCPComputeFirewallConfig = z.infer<typeof gcpComputeFirewallValidationSchema>;

export const defaultGCPComputeFirewallConfig: Partial<GCPComputeFirewallConfig> = {
  name: 'allow-http-ingress',
  project: 'my-gcp-project',
  network: 'default',
  direction: 'INGRESS',
  priority: 1000,
  action: 'allow',
  source_ranges: '0.0.0.0/0',
  protocols: {
    tcp: '80,443',
    icmp: false,
    all: false,
  },
  description: 'Allow HTTP and HTTPS traffic from anywhere.',
};

// Funciones para el registro global, esperadas por getResourceConfig
export const schema = () => Promise.resolve(gcpComputeFirewallValidationSchema);
export const fields = () => Promise.resolve(firewallFields);
export const templates = () => Promise.resolve(firewallTemplates); // firewallTemplates es un array
export const defaults = () => Promise.resolve(defaultGCPComputeFirewallConfig);

export const firewallSchema: ResourceSchema = { // Descriptor para UI
  type: 'gcp_compute_firewall',
  displayName: 'Firewall Rule',
  description: 'Google Cloud Platform firewall rule for network security',
  category: 'compute',
  fields: firewallFields,
  templates: firewallTemplates, // Referencia directa para la UI si es necesario
  documentation: {
    description: 'Firewall rules control incoming and outgoing traffic to your instances',
    examples: [
      'Allow HTTP/HTTPS traffic from internet',
      'Allow SSH access from specific IP ranges',
      'Internal communication between instances'
    ]
  }
};
