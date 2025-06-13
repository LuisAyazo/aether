import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsEcsServiceFields } from './serviceFields';
import { generateAWSECSServiceTemplates } from './serviceTemplates';

// Esquema de validación para AWS ECS Service
export const awsEcsServiceValidationSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es requerido.")
    .max(255, "El nombre no puede exceder los 255 caracteres.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Nombre inválido. Solo letras, números, y los caracteres: _ . -"),
  region: z.string().min(1, "La región es requerida."),
  cluster_name: z.string().min(1, "El nombre o ARN del cluster es requerido."),
  task_definition_arn: z.string().min(1, "El ARN de la Task Definition es requerido.")
    .regex(/^arn:aws:ecs:[^:]+:\d{12}:task-definition\/[^:]+:\d+$/, "Formato de ARN de Task Definition inválido."),
  desired_count: z.number().int().min(0, "El número deseado de tareas no puede ser negativo."),
  launch_type: z.enum(['EC2', 'FARGATE']).optional(),
  
  // Fargate specific (conditionally required)
  fargate_subnets: z.string().optional(), // Comma-separated
  fargate_security_groups: z.string().optional(), // Comma-separated
  fargate_assign_public_ip: z.union([z.boolean(), z.enum(['ENABLED', 'DISABLED'])]).optional().default(false),

  // Load Balancer specific (optional)
  load_balancer_target_group_arn: z.string()
    .regex(/^arn:aws:elasticloadbalancing:[^:]+:\d{12}:targetgroup\/[^/]+\/[a-f0-9]+$/, "Formato de ARN de Target Group inválido.")
    .optional(),
  load_balancer_container_name: z.string().optional(),
  load_balancer_container_port: z.number().int().min(1).max(65535).optional(),
  
  tags: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.launch_type === 'FARGATE') {
    if (!data.fargate_subnets || data.fargate_subnets.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Se requieren subredes para el tipo de lanzamiento FARGATE.",
        path: ['fargate_subnets'],
      });
    } else if (typeof data.fargate_subnets === 'string' && !data.fargate_subnets.split(',').every(subnet => /^subnet-[a-f0-9]{8,17}$/.test(subnet.trim()))) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Uno o más IDs de subred para Fargate son inválidos.",
        path: ['fargate_subnets'],
      });
    }
    if (data.fargate_security_groups && typeof data.fargate_security_groups === 'string' && !data.fargate_security_groups.split(',').every(sg => /^sg-[a-f0-9]{8,17}$/.test(sg.trim()))) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Uno o más IDs de Security Group para Fargate son inválidos.",
        path: ['fargate_security_groups'],
      });
    }
  }
  if (data.load_balancer_target_group_arn && (!data.load_balancer_container_name || data.load_balancer_container_port === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Si se especifica un Target Group ARN, también se deben especificar el nombre y puerto del contenedor.",
      path: ['load_balancer_container_name'], // O un path más general
    });
  }
});

// Tipo inferido de la configuración de ECS Service
export type AWSECSServiceConfig = z.infer<typeof awsEcsServiceValidationSchema>;

// Valores por defecto para un nuevo ECS Service
export const defaultAWSECSServiceConfig: Partial<AWSECSServiceConfig> & { name: string, cluster_name: string, task_definition_arn: string, desired_count: number } = {
  name: 'my-ecs-svc',
  region: 'us-east-1',
  cluster_name: 'default', // El usuario debe cambiar esto
  task_definition_arn: 'arn:aws:ecs:us-east-1:123456789012:task-definition/my-task-family:1', // Placeholder
  desired_count: 1,
  fargate_assign_public_ip: false, // Default a booleano para consistencia interna
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsEcsServiceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsEcsServiceFields);
};

export const templates = (config: AWSECSServiceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSECSServiceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSECSServiceConfig,
    name: defaultAWSECSServiceConfig.name,
    cluster_name: defaultAWSECSServiceConfig.cluster_name,
    task_definition_arn: defaultAWSECSServiceConfig.task_definition_arn,
    desired_count: defaultAWSECSServiceConfig.desired_count,
    fargate_assign_public_ip: defaultAWSECSServiceConfig.fargate_assign_public_ip,
  };
  return Promise.resolve(defaultsToReturn);
};
