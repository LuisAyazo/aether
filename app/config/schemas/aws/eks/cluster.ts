import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { awsEksClusterFields } from './clusterFields';
import { generateAWSEKSClusterTemplates } from './clusterTemplates';

// Esquema de validación para AWS EKS Cluster
export const awsEksClusterValidationSchema = z.object({
  name: z.string().min(1, "El nombre del cluster es requerido.")
    .max(100, "El nombre no puede exceder los 100 caracteres.")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, "Nombre de cluster inválido. Debe empezar con letra o número, seguido de letras, números, guiones o guiones bajos."),
  region: z.string().min(1, "La región es requerida."),
  role_arn: z.string().min(1, "El ARN del rol IAM del cluster es requerido.")
    .regex(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9_.-]+$/, "Formato de ARN de rol IAM inválido."),
  vpc_config_subnet_ids: z.string().min(1, "Se requiere al menos una subred para VPC config.")
    .refine(val => val.split(',').length >= 2, "Se requieren al menos dos subredes en diferentes AZs para VPC config.")
    .refine(val => val.split(',').every(subnet => /^subnet-[a-f0-9]{8,17}$/.test(subnet.trim())), {
      message: "Uno o más IDs de subred para VPC config son inválidos."
    }),
  vpc_config_security_group_ids: z.string().optional()
    .refine(val => !val || val.split(',').every(sg => /^sg-[a-f0-9]{8,17}$/.test(sg.trim())), {
      message: "Uno o más IDs de Security Group para VPC config son inválidos."
    }),
  kubernetes_version: z.string().optional(),
  tags: z.string().optional(),

  // Node Group fields (conditionally required/used)
  create_node_group: z.boolean().optional().default(true),
  node_group_name: z.string().optional(),
  node_role_arn: z.string().optional(),
  node_group_instance_types: z.string().optional().default('t3.medium'),
  node_group_min_size: z.number().int().min(0).optional().default(1),
  node_group_max_size: z.number().int().min(1).optional().default(2),
  node_group_desired_size: z.number().int().min(0).optional().default(1),
}).superRefine((data, ctx) => {
  if (data.create_node_group) {
    if (!data.node_group_name || data.node_group_name.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El nombre del Node Group es requerido si se crea un grupo de nodos.", path: ['node_group_name'] });
    }
    if (!data.node_role_arn || data.node_role_arn.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El ARN del Rol IAM del Node Group es requerido si se crea un grupo de nodos.", path: ['node_role_arn'] });
    } else if (!/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9_.-]+$/.test(data.node_role_arn)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Formato de ARN de rol IAM para Node Group inválido.", path: ['node_role_arn'] });
    }
    if (data.node_group_instance_types && typeof data.node_group_instance_types === 'string' && data.node_group_instance_types.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe especificar al menos un tipo de instancia para el Node Group.", path: ['node_group_instance_types'] });
    }
    if (data.node_group_max_size !== undefined && data.node_group_min_size !== undefined && data.node_group_max_size < data.node_group_min_size) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El tamaño máximo del Node Group debe ser mayor o igual al mínimo.", path: ['node_group_max_size'] });
    }
    if (data.node_group_desired_size !== undefined && data.node_group_min_size !== undefined && data.node_group_max_size !== undefined && 
        (data.node_group_desired_size < data.node_group_min_size || data.node_group_desired_size > data.node_group_max_size)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El tamaño deseado del Node Group debe estar entre el mínimo y el máximo.", path: ['node_group_desired_size'] });
    }
  }
});

// Tipo inferido de la configuración de EKS Cluster
export type AWSEKSClusterConfig = z.infer<typeof awsEksClusterValidationSchema>;

// Valores por defecto para un nuevo EKS Cluster
export const defaultAWSEKSClusterConfig: Partial<AWSEKSClusterConfig> & { name: string, role_arn: string } = {
  name: 'my-eks-cluster',
  region: 'us-east-1',
  role_arn: 'arn:aws:iam::123456789012:role/EKSClusterRole', // Placeholder
  // vpc_config_subnet_ids es requerido y debe ser llenado por el usuario
  create_node_group: true,
  node_group_name: 'default-nodegroup',
  node_role_arn: 'arn:aws:iam::123456789012:role/EKSNodeGroupRole', // Placeholder
  node_group_instance_types: 't3.medium',
  node_group_min_size: 1,
  node_group_max_size: 2,
  node_group_desired_size: 1,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsEksClusterValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsEksClusterFields);
};

export const templates = (config: AWSEKSClusterConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSEKSClusterTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSEKSClusterConfig,
    name: defaultAWSEKSClusterConfig.name, 
    role_arn: defaultAWSEKSClusterConfig.role_arn,
  };
  return Promise.resolve(defaultsToReturn);
};
