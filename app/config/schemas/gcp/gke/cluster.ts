import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { gkeClusterFields } from './clusterFields';
import { generateGCPGkeClusterTemplates } from './clusterTemplates';

// Esquema de validación para GCP GKE Cluster
export const gcpGkeClusterValidationSchema = z.object({
  name: z.string().min(1, "El nombre del cluster es requerido."),
  project: z.string().min(1, "El ID del proyecto es requerido."),
  location: z.string().min(1, "La ubicación (zona o región) es requerida."),
  initialNodeCount: z.number().min(1, "Debe haber al menos 1 nodo inicial.").optional(),
  nodeMachineType: z.string().optional(),
  network: z.string().optional(),
  subnetwork: z.string().optional(),
  enableAutopilot: z.boolean().optional(),
  // Considerar añadir más campos como:
  // - releaseChannel: z.enum(['STABLE', 'REGULAR', 'RAPID']).optional()
  // - networkingMode: z.enum(['VPC_NATIVE', 'ROUTES']).optional()
  // - ipAllocationPolicy: z.object({ clusterIpv4CidrBlock: z.string(), servicesIpv4CidrBlock: z.string() }).optional()
  // - addonsConfig: z.object({ httpLoadBalancing: z.object({ disabled: z.boolean() }) }).optional()
  // - nodePools: z.array(z.object({ name: z.string(), ... })).optional() // Para pools de nodos más complejos
});

// Tipo inferido de la configuración de GKE Cluster
export type GCPGkeClusterConfig = z.infer<typeof gcpGkeClusterValidationSchema>;

// Valores por defecto para un nuevo GKE Cluster
export const defaultGCPGkeClusterConfig: Partial<GCPGkeClusterConfig> = {
  name: 'my-gke-cluster',
  initialNodeCount: 1,
  nodeMachineType: 'e2-medium',
  network: 'default',
  enableAutopilot: false,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(gcpGkeClusterValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(gkeClusterFields);
};

export const templates = (config: GCPGkeClusterConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateGCPGkeClusterTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  return Promise.resolve(defaultGCPGkeClusterConfig);
};
