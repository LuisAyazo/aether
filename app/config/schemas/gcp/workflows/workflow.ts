import { z } from 'zod';
import { gcpWorkflowsWorkflowFields } from './workflowFields';
import { generateGCPWorkflowsWorkflowTemplates } from './workflowTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../types/resourceConfig";

const defaultSourceContents = `# Simple workflow that logs a message
main:
  steps:
    - log_message:
        call: sys.log
        args:
          text: "Hello from GCP Workflows!"
          severity: INFO
    - return_message:
        return: "Workflow executed successfully"
`;

// Helper para parsear strings clave=valor a objetos
const parseKeyValueStringToObject = (str: string | undefined): Record<string, string> | undefined => {
  if (!str) return undefined;
  const obj: Record<string, string> = {};
  str.split(',').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      obj[key.trim()] = value.trim();
    }
  });
  return Object.keys(obj).length > 0 ? obj : undefined;
};


export const GCPWorkflowsWorkflowSchema = z.object({
  name: z.string().min(1, "El nombre del workflow es obligatorio."),
  project: z.string().optional(),
  region: z.string().min(1, "La región es obligatoria."),
  description: z.string().optional(),
  service_account: z.string().optional(),
  source_contents: z.string().min(1, "El contenido fuente es obligatorio."),
  labels: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
  user_env_vars: z.string().optional().describe("Formato: CLAVE1=VALOR1,CLAVE2=VALOR2"),
  // call_log_level: z.enum(['LOG_ALL_CALLS', 'LOG_ERRORS_ONLY', 'LOG_NONE']).optional(),
  // crypto_key_name: z.string().optional(),
});

export type GCPWorkflowsWorkflowConfig = z.infer<typeof GCPWorkflowsWorkflowSchema>;

export function generateDefaultGCPWorkflowsWorkflowConfig(): GCPWorkflowsWorkflowConfig {
  return {
    name: 'my-gcp-workflow',
    region: 'us-central1',
    source_contents: defaultSourceContents,
  };
}

export function generateGCPWorkflowsWorkflowResourceSchema(): ResourceSchema {
  return {
    type: 'gcp_workflows_workflow',
    displayName: 'GCP Workflow',
    description: 'Crea y gestiona un workflow de Google Cloud Workflows.',
    category: 'Aplicación',
    fields: gcpWorkflowsWorkflowFields,
    templates: {
      default: generateDefaultGCPWorkflowsWorkflowConfig() as unknown as ResourceTemplate,
      http_request: {
        ...generateDefaultGCPWorkflowsWorkflowConfig(),
        name: 'http-request-workflow',
        source_contents: `# Workflow that makes an HTTP GET request
main:
  params: [args]
  steps:
    - init:
        assign:
          - url: \${args.url | "https://jsonplaceholder.typicode.com/todos/1"}
    - make_request:
        call: http.get
        args:
          url: \${url}
        result: request_result
    - log_response:
        call: sys.log
        args:
          text: \${"Response: " + json.encode_to_string(request_result.body)}
    - return_response:
        return: \${request_result.body}`,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso google_workflows_workflow de Terraform permite gestionar workflows en Google Cloud. Workflows orquesta servicios y APIs usando un lenguaje basado en YAML.",
      examples: [
        `
resource "google_workflows_workflow" "example" {
  name            = "my-workflow"
  region          = "us-central1"
  description     = "A simple example workflow"
  service_account = google_service_account.test_account.id
  source_contents = <<-EOF
# Simple workflow
main:
  steps:
    - log_step:
        call: sys.log
        args:
          text: "Hello World"
          severity: INFO
    - return_step:
        return: "Success"
EOF
}
        `,
      ],
    },
  };
}

export function generateGCPWorkflowsWorkflowName(config: GCPWorkflowsWorkflowConfig): string {
  return config.name || `gcp-workflow-${Math.random().toString(36).substring(2, 7)}`;
}

export interface GCPWorkflowsWorkflowGeneratedCode {
  name: string;
  description: string;
  config: GCPWorkflowsWorkflowConfig;
  codeTemplates: CodeTemplate;
}

export function generateGCPWorkflowsWorkflowCode(config: GCPWorkflowsWorkflowConfig): GCPWorkflowsWorkflowGeneratedCode {
  const parsedConfig = GCPWorkflowsWorkflowSchema.parse(config);
  // Transformar labels y user_env_vars de string a objeto si es necesario para la plantilla
  // Esto es más para la lógica interna si las plantillas esperan objetos directamente.
  // Sin embargo, las plantillas actuales ya usan parseKeyValueString.
  return {
    name: generateGCPWorkflowsWorkflowName(parsedConfig),
    description: `GCP Workflow: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateGCPWorkflowsWorkflowTemplates(parsedConfig),
  };
}

const gcpWorkflowsWorkflowResource = {
  type: 'gcp_workflows_workflow',
  name: 'GCP Workflow',
  schema: GCPWorkflowsWorkflowSchema,
  generateDefaultConfig: generateDefaultGCPWorkflowsWorkflowConfig,
  generateResourceSchema: generateGCPWorkflowsWorkflowResourceSchema,
  generateResourceName: generateGCPWorkflowsWorkflowName,
  generateTemplates: generateGCPWorkflowsWorkflowCode,
};

export default gcpWorkflowsWorkflowResource;
