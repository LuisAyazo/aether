import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsRedshiftClusterFields } from './clusterFields';
import { generateAWSRedshiftClusterTemplates } from './clusterTemplates';

// Esquema de validación para AWS Redshift Cluster
export const awsRedshiftClusterValidationSchema = z.object({
  cluster_identifier: z.string().min(1, "El identificador del cluster es requerido.")
    .max(63, "El identificador del cluster no puede exceder los 63 caracteres.")
    .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, "ID de cluster inválido. Debe empezar y terminar con minúscula o número, y contener solo minúsculas, números o guiones."),
  region: z.string().min(1, "La región es requerida."),
  node_type: z.string().min(1, "El tipo de nodo es requerido."),
  number_of_nodes: z.number().int().min(1, "El número de nodos debe ser al menos 1."),
  master_username: z.string().min(1, "El nombre de usuario maestro es requerido.")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Nombre de usuario maestro inválido. Debe empezar con letra, seguido de letras, números o guion bajo."),
  master_password: z.string().min(8, "La contraseña maestra debe tener al menos 8 caracteres.")
    .max(64, "La contraseña maestra no puede exceder los 64 caracteres.")
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/, "La contraseña maestra debe contener al menos una mayúscula, una minúscula y un número."),
  db_name: z.string().optional(),
  cluster_type: z.enum(['single-node', 'multi-node']),
  iam_roles: z.string().optional() // Comma-separated ARNs
    .refine(val => !val || val.split(',').every(arn => /^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9_.-]+$/.test(arn.trim())), {
      message: "Uno o más ARNs de roles IAM son inválidos."
    }),
  publicly_accessible: z.boolean().optional().default(false),
  vpc_security_group_ids: z.string().optional() // Comma-separated
    .refine(val => !val || val.split(',').every(sg => /^sg-[a-f0-9]{8,17}$/.test(sg.trim())), {
      message: "Uno o más IDs de Security Group son inválidos."
    }),
  tags: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.cluster_type === 'single-node' && data.number_of_nodes !== 1) {
    // AWS automáticamente lo trata como multi-node si number_of_nodes > 1,
    // pero para claridad en la UI, podríamos forzarlo o advertir.
    // Por ahora, la plantilla Terraform lo maneja.
  }
  if (data.cluster_type === 'multi-node' && data.number_of_nodes < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Para clústeres multi-nodo, se requieren al menos 2 nodos.",
      path: ['number_of_nodes'],
    });
  }
});

// Tipo inferido de la configuración de Redshift Cluster
export type AWSRedshiftClusterConfig = z.infer<typeof awsRedshiftClusterValidationSchema>;

// Valores por defecto para un nuevo Redshift Cluster
export const defaultAWSRedshiftClusterConfig: Partial<AWSRedshiftClusterConfig> & { cluster_identifier: string, node_type: string, master_username: string } = {
  cluster_identifier: 'my-redshift-cluster',
  region: 'us-east-1',
  node_type: 'dc2.large',
  number_of_nodes: 1,
  master_username: 'awsuser',
  // master_password es requerido y debe ser llenado por el usuario
  db_name: 'dev',
  cluster_type: 'single-node',
  publicly_accessible: false,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsRedshiftClusterValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsRedshiftClusterFields);
};

export const templates = (config: AWSRedshiftClusterConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSRedshiftClusterTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSRedshiftClusterConfig,
    cluster_identifier: defaultAWSRedshiftClusterConfig.cluster_identifier,
    node_type: defaultAWSRedshiftClusterConfig.node_type,
    master_username: defaultAWSRedshiftClusterConfig.master_username,
  };
  return Promise.resolve(defaultsToReturn);
};
