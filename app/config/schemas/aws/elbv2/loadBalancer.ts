import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { awsElbv2LoadBalancerFields } from './loadBalancerFields';
import { generateAWSELBv2LoadBalancerTemplates } from './loadBalancerTemplates';

// Esquema de validación para AWS Application Load Balancer
export const awsElbv2LoadBalancerValidationSchema = z.object({
  name: z.string().min(1, "El nombre del Load Balancer es requerido.")
    .max(32, "El nombre no puede exceder los 32 caracteres.")
    .regex(/^[a-zA-Z0-9-]+$/, "Nombre inválido. Solo alfanuméricos y guiones."),
  region: z.string().min(1, "La región es requerida."),
  internal: z.boolean().optional().default(false),
  load_balancer_type: z.literal('application').default('application'), // Por ahora solo 'application'
  subnets: z.string().min(1, "Se requiere al menos una subred.") // String de IDs separados por coma
    .refine(val => val.split(',').length >= 2, "Se requieren al menos dos subredes en diferentes AZs.")
    .refine(val => val.split(',').every(subnet => /^subnet-[a-f0-9]{8,17}$/.test(subnet.trim())), {
      message: "Uno o más IDs de subred son inválidos."
    }),
  security_groups: z.string().optional() // String de IDs separados por coma
    .refine(val => !val || val.split(',').every(sg => /^sg-[a-f0-9]{8,17}$/.test(sg.trim())), {
      message: "Uno o más IDs de Security Group son inválidos."
    }),
  enable_deletion_protection: z.boolean().optional().default(false),
  idle_timeout: z.number().int().min(1).max(4000).optional().default(60),
  tags: z.string().optional()
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(pair => /^[a-zA-Z0-9_.:/=+\-@ ]+=[^,]*$/.test(pair.trim()));
    }, { message: "Formato de tags inválido." }),
  
  // Campos simplificados para listener y target group por defecto
  listener_port: z.number().int().min(1).max(65535).optional().default(80),
  listener_protocol: z.enum(['HTTP', 'HTTPS']).optional().default('HTTP'),
  default_target_group_port: z.number().int().min(1).max(65535).optional().default(80),
  default_target_group_protocol: z.enum(['HTTP', 'HTTPS']).optional().default('HTTP'),
});

// Tipo inferido de la configuración del Load Balancer
export type AWSELBv2LoadBalancerConfig = z.infer<typeof awsElbv2LoadBalancerValidationSchema>;

// Valores por defecto para un nuevo Application Load Balancer
export const defaultAWSELBv2LoadBalancerConfig: Partial<AWSELBv2LoadBalancerConfig> = {
  name: 'my-app-lb',
  region: 'us-east-1',
  internal: false,
  load_balancer_type: 'application',
  enable_deletion_protection: false,
  idle_timeout: 60,
  listener_port: 80,
  listener_protocol: 'HTTP',
  default_target_group_port: 80,
  default_target_group_protocol: 'HTTP',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsElbv2LoadBalancerValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsElbv2LoadBalancerFields);
};

export const templates = (config: AWSELBv2LoadBalancerConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSELBv2LoadBalancerTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  // Asegurar que 'name' esté presente para ResourceValues
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSELBv2LoadBalancerConfig,
    name: defaultAWSELBv2LoadBalancerConfig.name, // Ya está en defaultAWSELBv2LoadBalancerConfig
  };
  return Promise.resolve(defaultsToReturn);
};
