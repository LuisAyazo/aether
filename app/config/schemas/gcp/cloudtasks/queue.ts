import { z } from 'zod';
import { gcpCloudTasksQueueFields } from './queueFields';
import { generateGCPCloudTasksQueueTemplates } from './queueTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

// Esquema para rate_limits (opcional)
const RateLimitsSchema = z.object({
  max_dispatches_per_second: z.number().optional(),
  max_concurrent_dispatches: z.number().optional(),
  max_burst_size: z.number().optional(),
}).optional();

// Esquema para retry_config (opcional)
const RetryConfigSchema = z.object({
  max_attempts: z.number().optional(),
  max_retry_duration: z.string().optional().describe('Ej. "3600s"'),
  min_backoff: z.string().optional().describe('Ej. "0.1s"'),
  max_backoff: z.string().optional().describe('Ej. "3600s"'),
  max_doublings: z.number().optional(),
}).optional();

export const GCPCloudTasksQueueSchema = z.object({
  name: z.string().min(1, "El nombre de la cola es obligatorio."),
  project: z.string().optional(),
  location: z.string().min(1, "La ubicación es obligatoria."),
  description: z.string().optional(),
  rate_limits: RateLimitsSchema,
  retry_config: RetryConfigSchema,
});

export type GCPCloudTasksQueueConfig = z.infer<typeof GCPCloudTasksQueueSchema>;

export function generateDefaultGCPCloudTasksQueueConfig(): GCPCloudTasksQueueConfig {
  return {
    name: 'my-cloud-tasks-queue',
    location: 'us-central1',
    rate_limits: {
      max_dispatches_per_second: 500,
      max_concurrent_dispatches: 1000,
    },
    retry_config: {
      max_attempts: 100,
      min_backoff: "0.1s",
      max_backoff: "3600s",
      max_doublings: 16,
    },
  };
}

export function generateGCPCloudTasksQueueResourceSchema(): ResourceSchema {
  return {
    type: 'gcp_cloud_tasks_queue',
    displayName: 'Cloud Tasks Queue',
    description: 'Crea una cola de tareas gestionada con Google Cloud Tasks.',
    category: 'Aplicación',
    fields: gcpCloudTasksQueueFields,
    templates: {
      default: generateDefaultGCPCloudTasksQueueConfig() as unknown as ResourceTemplate,
      high_throughput: {
        ...generateDefaultGCPCloudTasksQueueConfig(),
        name: 'high-throughput-queue',
        rate_limits: {
          max_dispatches_per_second: 1000,
          max_concurrent_dispatches: 2000,
        },
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso google_cloud_tasks_queue de Terraform permite gestionar colas de Google Cloud Tasks. Cloud Tasks permite ejecutar tareas asíncronas y distribuidas.",
      examples: [
        `
resource "google_cloud_tasks_queue" "default" {
  name     = "cloud-tasks-queue-example"
  location = "us-central1"

  rate_limits {
    max_dispatches_per_second = 500
    max_concurrent_dispatches = 1000
  }

  retry_config {
    max_attempts = 5
  }
}
        `,
      ],
    },
  };
}

export function generateGCPCloudTasksQueueName(config: GCPCloudTasksQueueConfig): string {
  return config.name || `cloudtasks-queue-${Math.random().toString(36).substring(2, 7)}`;
}

export interface GCPCloudTasksQueueGeneratedCode {
  name: string;
  description: string;
  config: GCPCloudTasksQueueConfig;
  codeTemplates: CodeTemplate;
}

export function generateGCPCloudTasksQueueCode(config: GCPCloudTasksQueueConfig): GCPCloudTasksQueueGeneratedCode {
  const parsedConfig = GCPCloudTasksQueueSchema.parse(config);
  return {
    name: generateGCPCloudTasksQueueName(parsedConfig),
    description: `Cloud Tasks Queue: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateGCPCloudTasksQueueTemplates(parsedConfig),
  };
}

const gcpCloudTasksQueueResource = {
  type: 'gcp_cloud_tasks_queue',
  name: 'Cloud Tasks Queue',
  schema: GCPCloudTasksQueueSchema,
  generateDefaultConfig: generateDefaultGCPCloudTasksQueueConfig,
  generateResourceSchema: generateGCPCloudTasksQueueResourceSchema,
  generateResourceName: generateGCPCloudTasksQueueName,
  generateTemplates: generateGCPCloudTasksQueueCode,
};

export default gcpCloudTasksQueueResource;
