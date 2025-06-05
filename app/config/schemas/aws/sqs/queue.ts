import { z } from 'zod';
import { awsSqsQueueFields } from './queueFields';
import { generateAWSSqsQueueTemplates } from './queueTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

// Define el esquema Zod para la configuración de una SQS Queue
export const AWSSqsQueueSchema = z.object({
  name: z.string().min(1, "El nombre de la cola es obligatorio."),
  region: z.string().min(1, "La región es obligatoria."),
  fifo_queue: z.boolean().optional().default(false),
  visibility_timeout_seconds: z.number().optional().default(30),
  message_retention_seconds: z.number().optional().default(345600), // 4 days
  delay_seconds: z.number().optional().default(0),
  receive_wait_time_seconds: z.number().optional().default(0),
  content_based_deduplication: z.boolean().optional().default(false)
    .describe("Solo para colas FIFO. Si es true y fifo_queue es false, Terraform puede ignorarlo o dar error."),
  tags: z.string().optional().describe("Tags adicionales en formato Clave1=Valor1,Clave2=Valor2"),
}).refine(data => {
  if (data.fifo_queue && !data.name.endsWith('.fifo')) {
    return false; // El nombre debe terminar en .fifo si es una cola FIFO
  }
  return true;
}, {
  message: "El nombre de las colas FIFO debe terminar con el sufijo '.fifo'.",
  path: ['name'], // Ruta del campo que causa el error
}).refine(data => {
  if (!data.fifo_queue && data.content_based_deduplication) {
    // Opcional: podrías advertir o auto-corregir, pero Terraform lo manejará.
    // Por ahora, permitimos esta combinación, Terraform la ignorará si no es FIFO.
  }
  return true;
});

// Infiere el tipo TypeScript del esquema Zod
export type AWSSqsQueueConfig = z.infer<typeof AWSSqsQueueSchema>;

// Genera la configuración por defecto para una SQS Queue
export function generateDefaultAWSSqsQueueConfig(): AWSSqsQueueConfig {
  return {
    name: 'my-standard-queue',
    region: 'us-east-1',
    fifo_queue: false,
    visibility_timeout_seconds: 30,
    message_retention_seconds: 345600,
    delay_seconds: 0,
    receive_wait_time_seconds: 0,
    content_based_deduplication: false,
  };
}

// Genera el esquema del recurso SQS Queue
export function generateAWSSqsQueueResourceSchema(): ResourceSchema {
  return {
    type: 'aws_sqs_queue',
    displayName: 'SQS Queue',
    description: 'Crea una cola de mensajes gestionada con Amazon Simple Queue Service (SQS).',
    category: 'Aplicación', 
    fields: awsSqsQueueFields,
    templates: {
      default: generateDefaultAWSSqsQueueConfig() as unknown as ResourceTemplate,
      fifo: {
        name: 'my-fifo-queue.fifo',
        region: 'us-east-1',
        fifo_queue: true,
        content_based_deduplication: true,
        visibility_timeout_seconds: 30,
        message_retention_seconds: 345600,
        delay_seconds: 0,
        receive_wait_time_seconds: 0,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso aws_sqs_queue de Terraform permite gestionar una cola de Amazon SQS. SQS ofrece colas confiables y escalables para almacenar mensajes mientras viajan entre computadoras.",
      examples: [
        `
resource "aws_sqs_queue" "terraform_queue" {
  name                      = "terraform-example-queue"
  delay_seconds             = 90
  max_message_size          = 2048
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 300

  tags = {
    Environment = "production"
  }
}
        `,
      ],
    },
  };
}

// Genera un nombre único para el recurso SQS Queue
export function generateAWSSqsQueueName(config: AWSSqsQueueConfig): string {
  return config.name || `sqs-queue-${Math.random().toString(36).substring(2, 7)}`;
}

// Interfaz para el objeto que devuelve generateAWSSqsQueueCode
export interface AWSSqsQueueGeneratedCode {
  name: string;
  description: string;
  config: AWSSqsQueueConfig;
  codeTemplates: CodeTemplate;
}

// Función principal para generar todas las plantillas de código
export function generateAWSSqsQueueCode(config: AWSSqsQueueConfig): AWSSqsQueueGeneratedCode {
  const parsedConfig = AWSSqsQueueSchema.parse(config); // Validar y aplicar defaults de Zod

  return {
    name: generateAWSSqsQueueName(parsedConfig),
    description: `SQS Queue: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAWSSqsQueueTemplates(parsedConfig),
  };
}

// Define la exportación del recurso para el registro
const awsSqsQueueResourceDefinition = {
  type: 'aws_sqs_queue',
  name: 'SQS Queue',
  schema: () => AWSSqsQueueSchema,
  defaults: generateDefaultAWSSqsQueueConfig,
  fields: () => awsSqsQueueFields,
  templates: (config: AWSSqsQueueConfig) => generateAWSSqsQueueTemplates(config),

  // Mantener las funciones originales
  originalSchema: AWSSqsQueueSchema,
  originalGenerateDefaultConfig: generateDefaultAWSSqsQueueConfig,
  originalGenerateResourceSchema: generateAWSSqsQueueResourceSchema,
  originalGenerateResourceName: generateAWSSqsQueueName,
  originalGenerateTemplates: generateAWSSqsQueueCode,
};

const awsSqsQueueResource = {
  ...awsSqsQueueResourceDefinition,
};

export default awsSqsQueueResource;
