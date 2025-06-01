import { z } from 'zod';
import { awsSnsTopicFields } from './topicFields';
import { generateAWSSnsTopicTemplates } from './topicTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

// Define el esquema Zod para la configuración de un SNS Topic
export const AWSSnsTopicSchema = z.object({
  name: z.string().min(1, "El nombre del tema es obligatorio."),
  region: z.string().min(1, "La región es obligatoria."),
  display_name: z.string().optional(),
  fifo_topic: z.boolean().optional().default(false),
  content_based_deduplication: z.boolean().optional().default(false)
    .describe("Solo para temas FIFO."),
  tags: z.string().optional().describe("Tags adicionales en formato Clave1=Valor1,Clave2=Valor2"),
}).refine(data => {
  if (data.fifo_topic && !data.name.endsWith('.fifo')) {
    return false; // El nombre debe terminar en .fifo si es un tema FIFO
  }
  return true;
}, {
  message: "El nombre de los temas FIFO debe terminar con el sufijo '.fifo'.",
  path: ['name'],
}).refine(data => {
  if (!data.fifo_topic && data.content_based_deduplication) {
    // Terraform ignorará content_based_deduplication si fifo_topic es false.
  }
  return true;
});

// Infiere el tipo TypeScript del esquema Zod
export type AWSSnsTopicConfig = z.infer<typeof AWSSnsTopicSchema>;

// Genera la configuración por defecto para un SNS Topic
export function generateDefaultAWSSnsTopicConfig(): AWSSnsTopicConfig {
  return {
    name: 'my-standard-topic',
    region: 'us-east-1',
    display_name: 'Mi Tema Estándar',
    fifo_topic: false,
    content_based_deduplication: false,
  };
}

// Genera el esquema del recurso SNS Topic
export function generateAWSSnsTopicResourceSchema(): ResourceSchema {
  return {
    type: 'aws_sns_topic',
    displayName: 'SNS Topic',
    description: 'Crea un tema de notificación con Amazon Simple Notification Service (SNS).',
    category: 'Aplicación', 
    fields: awsSnsTopicFields,
    templates: {
      default: generateDefaultAWSSnsTopicConfig() as unknown as ResourceTemplate,
      fifo: {
        name: 'my-fifo-topic.fifo',
        region: 'us-east-1',
        display_name: 'Mi Tema FIFO',
        fifo_topic: true,
        content_based_deduplication: true,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso aws_sns_topic de Terraform permite gestionar un tema de Amazon SNS. Los temas SNS son canales de comunicación para enviar mensajes a múltiples suscriptores.",
      examples: [
        `
resource "aws_sns_topic" "user_updates" {
  name = "user-updates-topic"
  display_name = "User Updates"
}
        `,
      ],
    },
  };
}

// Genera un nombre único para el recurso SNS Topic
export function generateAWSSnsTopicName(config: AWSSnsTopicConfig): string {
  return config.name || `sns-topic-${Math.random().toString(36).substring(2, 7)}`;
}

// Interfaz para el objeto que devuelve generateAWSSnsTopicCode
export interface AWSSnsTopicGeneratedCode {
  name: string;
  description: string;
  config: AWSSnsTopicConfig;
  codeTemplates: CodeTemplate;
}

// Función principal para generar todas las plantillas de código
export function generateAWSSnsTopicCode(config: AWSSnsTopicConfig): AWSSnsTopicGeneratedCode {
  const parsedConfig = AWSSnsTopicSchema.parse(config); // Validar y aplicar defaults de Zod

  return {
    name: generateAWSSnsTopicName(parsedConfig),
    description: `SNS Topic: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAWSSnsTopicTemplates(parsedConfig),
  };
}

// Define la exportación del recurso para el registro
const awsSnsTopicResourceDefinition = {
  type: 'aws_sns_topic',
  name: 'SNS Topic',
  schema: () => AWSSnsTopicSchema, // getResourceConfig espera una función
  defaults: generateDefaultAWSSnsTopicConfig, // Renombrar/Alias
  fields: () => awsSnsTopicFields, // getResourceConfig espera una función que devuelva los campos
  templates: (config: AWSSnsTopicConfig) => generateAWSSnsTopicTemplates(config), // Adaptar para que devuelva CodeTemplate

  // Mantener las funciones originales por si se usan en otro lugar o para claridad interna
  originalSchema: AWSSnsTopicSchema,
  originalGenerateDefaultConfig: generateDefaultAWSSnsTopicConfig,
  originalGenerateResourceSchema: generateAWSSnsTopicResourceSchema,
  originalGenerateResourceName: generateAWSSnsTopicName,
  originalGenerateTemplates: generateAWSSnsTopicCode,
};

// Wrapper para la función templates para que coincida con la firma esperada por getResourceConfig
// y para asegurar que el objeto ResourceSchema también tenga las funciones esperadas.
const awsSnsTopicResource = {
  ...awsSnsTopicResourceDefinition,
  // Asegurar que getResourceConfig pueda llamar a estas funciones directamente
  // y que devuelvan lo que IaCTemplatePanel espera después.
  // IaCTemplatePanel llama a configObject.schema(), configObject.defaults(), configObject.fields()
  // Esto ya está cubierto por la redefinición anterior.
};

export default awsSnsTopicResource;
