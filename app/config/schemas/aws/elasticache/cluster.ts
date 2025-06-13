import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsElastiCacheClusterFields } from './clusterFields';
import { generateAWSElastiCacheClusterTemplates } from './clusterTemplates';

// Esquema de validación para AWS ElastiCache Cluster
export const awsElastiCacheClusterValidationSchema = z.object({
  cluster_id: z.string().min(1, "El ID del cluster es requerido.")
    .max(50, "El ID del cluster no puede exceder los 50 caracteres para Redis (cluster mode disabled) o 40 para Redis (cluster mode enabled).")
    .regex(/^[a-z][a-z0-9-]*$/, "ID de cluster inválido. Debe empezar con minúscula, seguido de minúsculas, números o guiones."),
  region: z.string().min(1, "La región es requerida."),
  engine: z.enum(['redis', 'memcached']),
  node_type: z.string().min(1, "El tipo de nodo es requerido."),
  num_cache_nodes: z.number().int().min(1, "El número de nodos de caché debe ser al menos 1."),
  engine_version: z.string().optional(),
  parameter_group_name: z.string().optional(),
  subnet_group_name: z.string().optional(), // Requerido para VPC
  security_group_ids: z.string().optional() // Comma-separated
    .refine(val => !val || val.split(',').every(sg => /^sg-[a-f0-9]{8,17}$/.test(sg.trim())), {
      message: "Uno o más IDs de Security Group son inválidos."
    }),
  port: z.number().int().min(1).max(65535).optional(),
  snapshot_retention_limit: z.number().int().min(0).optional(), // Redis only
  snapshot_window: z.string() // Redis only, format HH:mm-HH:mm
    .regex(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Formato de ventana de snapshot inválido. Debe ser HH:mm-HH:mm en UTC."
    })
    .optional(),
  tags: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.engine === 'redis' && data.snapshot_retention_limit === undefined) {
    // El default es 0 en los fields, pero si se quita, Zod lo ve como undefined.
    // Para Redis, si no se especifica, AWS puede usar un default. Aquí lo hacemos opcional.
  }
  if (data.engine === 'memcached' && (data.snapshot_retention_limit !== undefined || data.snapshot_window)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Snapshot retention y window solo aplican a Redis.",
      path: ['snapshot_retention_limit'], 
    });
  }
  // Podríamos añadir validación para subnet_group_name si se despliega en VPC, pero es complejo sin saber la VPC.
});

// Tipo inferido de la configuración de ElastiCache Cluster
export type AWSElastiCacheClusterConfig = z.infer<typeof awsElastiCacheClusterValidationSchema>;

// Valores por defecto para un nuevo ElastiCache Cluster
export const defaultAWSElastiCacheClusterConfig: Partial<AWSElastiCacheClusterConfig> & { cluster_id: string, engine: 'redis' | 'memcached', node_type: string, num_cache_nodes: number } = {
  cluster_id: 'my-cache-cluster',
  region: 'us-east-1',
  engine: 'redis',
  node_type: 'cache.t3.micro',
  num_cache_nodes: 1,
  // parameter_group_name se infiere en la plantilla si no se provee
  snapshot_retention_limit: 0, // Default para Redis
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsElastiCacheClusterValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsElastiCacheClusterFields);
};

export const templates = (config: AWSElastiCacheClusterConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSElastiCacheClusterTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSElastiCacheClusterConfig,
    cluster_id: defaultAWSElastiCacheClusterConfig.cluster_id,
    engine: defaultAWSElastiCacheClusterConfig.engine,
    node_type: defaultAWSElastiCacheClusterConfig.node_type,
    num_cache_nodes: defaultAWSElastiCacheClusterConfig.num_cache_nodes,
  };
  return Promise.resolve(defaultsToReturn);
};
