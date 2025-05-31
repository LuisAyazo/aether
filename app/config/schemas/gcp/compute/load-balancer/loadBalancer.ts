import { z } from 'zod';
import { ResourceSchema, CodeTemplate, ResourceValues } from '../../../../../types/resourceConfig'; // Añadir CodeTemplate y ResourceValues
import { loadBalancerFields } from './loadBalancerFields';
import { generateGCPComputeLoadBalancerTemplates } from './loadBalancerTemplates'; // Cambiar import

const backendServiceSchema = z.object({
  name: z.string().min(1, "El nombre del servicio backend es requerido."),
  protocol: z.enum(['HTTP', 'HTTPS', 'TCP', 'UDP']).default('HTTP')
    .describe("Protocolo para la comunicación backend."),
  port: z.number({ invalid_type_error: "El puerto backend debe ser un número." }).default(80)
    .describe("Puerto para las instancias backend."),
  timeout_sec: z.number({ invalid_type_error: "Timeout debe ser un número." }).default(30)
    .describe("Timeout de la solicitud en segundos."),
});

const healthCheckSchema = z.object({
  name: z.string().min(1, "El nombre del health check es requerido.").optional(), // Opcional si el health check completo es opcional
  path: z.string().default('/').describe("Ruta para las solicitudes de health check."),
  port: z.number({ invalid_type_error: "El puerto del health check debe ser un número." }).default(80)
    .describe("Puerto para el health check."),
  check_interval_sec: z.number({ invalid_type_error: "El intervalo del health check debe ser un número." }).default(10)
    .describe("Frecuencia del health check en segundos."),
});

// Esquema Zod para la validación de la configuración de un Load Balancer de GCP
export const gcpComputeLoadBalancerValidationSchema = z.object({
  name: z.string().min(1, "El nombre del balanceador de carga es requerido")
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, "El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones."),
  project: z.string().min(1, "El ID del proyecto es requerido"),
  load_balancing_scheme: z.enum(['EXTERNAL', 'INTERNAL', 'EXTERNAL_MANAGED'], { errorMap: () => ({ message: "Esquema de balanceo de carga inválido." }) })
    .default('EXTERNAL')
    .describe("Tipo de esquema de balanceo de carga."),
  protocol: z.enum(['HTTP', 'HTTPS', 'TCP', 'UDP'], { errorMap: () => ({ message: "Protocolo inválido." }) })
    .default('HTTP')
    .describe("Protocolo para el balanceador de carga."),
  port: z.number({ invalid_type_error: "El puerto debe ser un número." }).default(80)
    .describe("Puerto para el balanceador de carga."),
  backend_service: backendServiceSchema.describe("Configuración del servicio backend."),
  health_check: healthCheckSchema.optional().describe("Configuración del health check (opcional)."),
  ssl_certificate: z.string().optional()
    .describe("Nombre del certificado SSL para HTTPS (opcional)."),
  cdn_policy: z.boolean().default(false)
    .describe("Habilitar Cloud CDN para caché."),
  description: z.string().optional().describe("Descripción del balanceador de carga."),
});

export type GCPComputeLoadBalancerConfig = z.infer<typeof gcpComputeLoadBalancerValidationSchema>;

export const defaultGCPComputeLoadBalancerConfig: Partial<GCPComputeLoadBalancerConfig> = {
  name: 'my-http-lb',
  project: 'my-gcp-project',
  load_balancing_scheme: 'EXTERNAL',
  protocol: 'HTTP',
  port: 80,
  backend_service: {
    name: 'my-app-backend-service',
    protocol: 'HTTP',
    port: 80,
    timeout_sec: 30,
  },
  health_check: {
    name: 'my-app-health-check',
    path: '/',
    port: 80,
    check_interval_sec: 10,
  },
  cdn_policy: false,
  description: 'HTTP Load Balancer for web application',
};

// Funciones para el registro global, esperadas por getResourceConfig
export const schema = (): Promise<z.ZodTypeAny> => Promise.resolve(gcpComputeLoadBalancerValidationSchema); // Añadir tipo de retorno explícito
export const fields = () => Promise.resolve(loadBalancerFields);
export const templates = (config: GCPComputeLoadBalancerConfig): Promise<CodeTemplate> => Promise.resolve(generateGCPComputeLoadBalancerTemplates(config)); // Actualizar firma y llamada
export const defaults = (): Promise<Partial<ResourceValues>> => Promise.resolve(defaultGCPComputeLoadBalancerConfig); // Añadir tipo de retorno explícito

export const loadBalancerSchema: ResourceSchema = { // Descriptor para UI
  type: 'gcp_compute_load_balancer',
  displayName: 'Load Balancer',
  description: 'Google Cloud Platform HTTP(S) Load Balancer',
  category: 'compute', // O 'networking' si se prefiere
  fields: loadBalancerFields,
  templates: [], // Proporcionar un array vacío para satisfacer ResourceSchema
  documentation: {
    description: 'Load balancers distribute incoming requests across multiple backend instances',
    examples: [
      'HTTP load balancer for web applications',
      'HTTPS load balancer with SSL certificates',
      'Global load balancer with CDN'
    ]
  }
};
