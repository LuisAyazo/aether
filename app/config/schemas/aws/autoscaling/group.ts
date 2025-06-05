import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { awsAutoScalingGroupFields } from './groupFields';
import { generateAWSAutoScalingGroupTemplates } from './groupTemplates';

// Esquema de validación para AWS Auto Scaling Group
export const awsAutoScalingGroupValidationSchema = z.object({
  name: z.string().min(1, "El nombre del Auto Scaling Group es requerido.")
    .max(255, "El nombre no puede exceder los 255 caracteres.")
    .regex(/^[a-zA-Z0-9_.\-/]+$/, "Nombre inválido. Solo letras, números, y los caracteres: _ . - /"),
  region: z.string().min(1, "La región es requerida."),
  launch_configuration_name: z.string().optional(),
  launch_template_id: z.string().regex(/^lt-[a-f0-9]{17}$/, "Formato de Launch Template ID inválido (lt-xxxxxxxxxxxxxxxxx).").optional(),
  launch_template_name: z.string().optional(),
  min_size: z.number().int().min(0, "El tamaño mínimo no puede ser negativo."),
  max_size: z.number().int().min(1, "El tamaño máximo debe ser al menos 1."),
  desired_capacity: z.number().int().min(0, "La capacidad deseada no puede ser negativa.").optional(),
  vpc_zone_identifier: z.string().min(1, "Se requiere al menos una subred.") // Comma-separated string of subnet IDs
    .refine(val => val.split(',').every(subnet => /^subnet-[a-f0-9]{8,17}$/.test(subnet.trim())), {
      message: "Uno o más IDs de subred son inválidos."
    }),
  target_group_arns: z.string().optional() // Comma-separated string of ARNs
    .refine(val => !val || val.split(',').every(arn => /^arn:aws:elasticloadbalancing:[^:]+:\d{12}:targetgroup\/[^/]+\/[a-f0-9]+$/.test(arn.trim())), {
      message: "Uno o más ARNs de Target Group son inválidos."
    }),
  health_check_type: z.enum(['EC2', 'ELB']).optional().default('EC2'),
  health_check_grace_period: z.number().int().min(0).optional().default(300),
  tags: z.string().optional(), // Formato: K1=V1,propagate_at_launch=true;K2=V2,propagate_at_launch=false
}).refine(data => {
  // Validar que se provea launch_configuration_name o launch_template_id o launch_template_name
  return data.launch_configuration_name || data.launch_template_id || data.launch_template_name;
}, {
  message: "Debe especificar un Launch Configuration Name, Launch Template ID o Launch Template Name.",
  path: ["launch_configuration_name"], // O un path más general
}).refine(data => data.max_size >= data.min_size, {
  message: "El tamaño máximo debe ser mayor o igual al tamaño mínimo.",
  path: ["max_size"],
}).refine(data => data.desired_capacity === undefined || (data.desired_capacity >= data.min_size && data.desired_capacity <= data.max_size), {
  message: "La capacidad deseada debe estar entre el tamaño mínimo y máximo.",
  path: ["desired_capacity"],
});

// Tipo inferido de la configuración de Auto Scaling Group
export type AWSAutoScalingGroupConfig = z.infer<typeof awsAutoScalingGroupValidationSchema>;

// Valores por defecto para un nuevo Auto Scaling Group
export const defaultAWSAutoScalingGroupConfig: Partial<AWSAutoScalingGroupConfig> & { name: string } = {
  name: 'my-asg',
  region: 'us-east-1',
  min_size: 1,
  max_size: 2,
  // desired_capacity: 1, // Opcional, ASG lo establece a min_size por defecto
  health_check_type: 'EC2',
  health_check_grace_period: 300,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsAutoScalingGroupValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsAutoScalingGroupFields);
};

export const templates = (config: AWSAutoScalingGroupConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSAutoScalingGroupTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  // Asegurar que 'name' esté presente para ResourceValues
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSAutoScalingGroupConfig,
    name: defaultAWSAutoScalingGroupConfig.name, 
  };
  return Promise.resolve(defaultsToReturn);
};
