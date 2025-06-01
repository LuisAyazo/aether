import { z } from 'zod';
import { gcpEventarcTriggerFields } from './triggerFields';
import { generateGCPEventarcTriggerTemplates } from './triggerTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

const MatchingCriterionSchema = z.object({
  attribute: z.string().min(1),
  value: z.string().min(1),
  operator: z.string().optional(), // e.g., "match-path-pattern"
});

const DestinationSchema = z.object({
  cloud_run_service_name: z.string().optional(),
  cloud_run_service_region: z.string().optional(),
  cloud_run_service_path: z.string().optional(),
  workflow_id: z.string().optional(), // Full workflow ID: projects/{project}/locations/{location}/workflows/{workflow}
  // gke_service_name: z.string().optional(), // Future support
  // gke_namespace: z.string().optional(),
  // gke_path: z.string().optional(),
  // gke_cluster: z.string().optional(),
  // gke_location: z.string().optional(),
}).refine(data => {
  // Debe tener al menos un destino configurado
  return !!data.cloud_run_service_name || !!data.workflow_id;
}, {
  message: "Debe especificar al menos un destino (Cloud Run o Workflow).",
});

export const GCPEventarcTriggerSchema = z.object({
  name: z.string().min(1, "El nombre del trigger es obligatorio."),
  project: z.string().optional(),
  location: z.string().min(1, "La ubicación es obligatoria."),
  matching_criteria: z.array(MatchingCriterionSchema).min(1, "Se requiere al menos un criterio de coincidencia."),
  destination: DestinationSchema,
  service_account: z.string().optional(),
  event_data_content_type: z.enum(['application/json', 'application/protobuf']).optional().default('application/json'),
  transport_topic_name: z.string().optional().describe("Nombre completo del tema Pub/Sub para transporte."),
  labels: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type GCPEventarcTriggerConfig = z.infer<typeof GCPEventarcTriggerSchema>;
export type MatchingCriterionConfig = z.infer<typeof MatchingCriterionSchema>; // Exportar para usar en templates
export type DestinationConfig = z.infer<typeof DestinationSchema>; // Exportar para usar en templates


export function generateDefaultGCPEventarcTriggerConfig(): GCPEventarcTriggerConfig {
  return {
    name: 'my-eventarc-trigger',
    location: 'us-central1',
    matching_criteria: [
      { attribute: 'type', value: 'google.cloud.pubsub.topic.v1.messagePublished' }
    ],
    destination: {
      cloud_run_service_name: 'my-default-service', // Placeholder
    },
    event_data_content_type: 'application/json',
  };
}

export function generateGCPEventarcTriggerResourceSchema(): ResourceSchema {
  return {
    type: 'gcp_eventarc_trigger',
    displayName: 'Eventarc Trigger',
    description: 'Crea un trigger de Google Cloud Eventarc para enrutar eventos a destinos.',
    category: 'Aplicación',
    fields: gcpEventarcTriggerFields,
    templates: {
      default: generateDefaultGCPEventarcTriggerConfig() as unknown as ResourceTemplate,
      pubsub_to_cloudrun: {
        ...generateDefaultGCPEventarcTriggerConfig(),
        name: 'pubsub-to-run-trigger',
        matching_criteria: [{ attribute: 'type', value: 'google.cloud.pubsub.topic.v1.messagePublished' }],
        destination: { cloud_run_service_name: 'your-cloud-run-service' },
      } as unknown as ResourceTemplate,
      auditlog_to_workflow: {
        ...generateDefaultGCPEventarcTriggerConfig(),
        name: 'auditlog-to-workflow-trigger',
        matching_criteria: [
          { attribute: 'type', value: 'google.cloud.audit.log.v1.written' },
          { attribute: 'serviceName', value: 'storage.googleapis.com' },
          { attribute: 'methodName', value: 'storage.objects.create' }
        ],
        destination: { workflow_id: 'projects/your-project/locations/your-region/workflows/your-workflow-id' },
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso google_eventarc_trigger de Terraform permite gestionar triggers de Eventarc. Estos triggers escuchan eventos de varias fuentes y los enrutan a destinos como Cloud Run, Workflows, etc.",
      examples: [
        `
resource "google_eventarc_trigger" "default" {
  name     = "example-trigger"
  location = "us-central1"
  project  = "gcp-project-id"

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.pubsub.topic.v1.messagePublished"
  }

  destination {
    cloud_run_service {
      service = "my-cloud-run-service"
      region  = "us-central1" # Opcional si es la misma que el trigger
    }
  }
}
        `,
      ],
    },
  };
}

export function generateGCPEventarcTriggerName(config: GCPEventarcTriggerConfig): string {
  return config.name || `eventarc-trigger-${Math.random().toString(36).substring(2, 7)}`;
}

export interface GCPEventarcTriggerGeneratedCode {
  name: string;
  description: string;
  config: GCPEventarcTriggerConfig;
  codeTemplates: CodeTemplate;
}

export function generateGCPEventarcTriggerCode(config: GCPEventarcTriggerConfig): GCPEventarcTriggerGeneratedCode {
  const parsedConfig = GCPEventarcTriggerSchema.parse(config);
  return {
    name: generateGCPEventarcTriggerName(parsedConfig),
    description: `Eventarc Trigger: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateGCPEventarcTriggerTemplates(parsedConfig),
  };
}

const gcpEventarcTriggerResource = {
  type: 'gcp_eventarc_trigger',
  name: 'Eventarc Trigger',
  schema: GCPEventarcTriggerSchema,
  generateDefaultConfig: generateDefaultGCPEventarcTriggerConfig,
  generateResourceSchema: generateGCPEventarcTriggerResourceSchema,
  generateResourceName: generateGCPEventarcTriggerName,
  generateTemplates: generateGCPEventarcTriggerCode,
};

export default gcpEventarcTriggerResource;
