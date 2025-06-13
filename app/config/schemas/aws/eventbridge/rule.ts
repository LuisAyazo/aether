import { z } from 'zod';
import { awsEventBridgeRuleFields } from './ruleFields';
import { generateAWSEventBridgeRuleTemplates } from './ruleTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../types/resourceConfig";

// Define el esquema Zod para la configuración de una EventBridge Rule
export const AWSEventBridgeRuleSchema = z.object({
  name: z.string().min(1, "El nombre de la regla es obligatorio."),
  region: z.string().min(1, "La región es obligatoria."),
  description: z.string().optional(),
  event_pattern: z.string().optional().describe("Patrón de eventos en formato JSON."),
  schedule_expression: z.string().optional().describe("Expresión cron o rate."),
  is_enabled: z.boolean().optional().default(true),
  event_bus_name: z.string().optional().describe("Nombre del bus de eventos (default si se omite)."),
  tags: z.string().optional().describe("Tags adicionales en formato Clave1=Valor1,Clave2=Valor2"),
}).refine(data => {
  // Una regla debe tener event_pattern o schedule_expression, pero no ambos.
  if (data.event_pattern && data.schedule_expression) {
    return false;
  }
  if (!data.event_pattern && !data.schedule_expression) {
    return false;
  }
  return true;
}, {
  message: "Debe especificar un 'Patrón de Eventos' o una 'Expresión de Programación', pero no ambos.",
  // path: ['event_pattern', 'schedule_expression'], // Zod no soporta path para errores a nivel de objeto en refine
});

// Infiere el tipo TypeScript del esquema Zod
export type AWSEventBridgeRuleConfig = z.infer<typeof AWSEventBridgeRuleSchema>;

// Genera la configuración por defecto para una EventBridge Rule
export function generateDefaultAWSEventBridgeRuleConfig(): AWSEventBridgeRuleConfig {
  return {
    name: 'my-event-rule',
    region: 'us-east-1',
    event_pattern: JSON.stringify({ source: ['aws.ec2'] }, null, 2), // Ejemplo de patrón
    is_enabled: true,
  };
}

// Genera el esquema del recurso EventBridge Rule
export function generateAWSEventBridgeRuleResourceSchema(): ResourceSchema {
  return {
    type: 'aws_cloudwatch_event_rule', // El recurso Terraform sigue siendo aws_cloudwatch_event_rule
    displayName: 'EventBridge Rule',
    description: 'Crea una regla de Amazon EventBridge para reaccionar a eventos o ejecutarse según una programación.',
    category: 'Aplicación', 
    fields: awsEventBridgeRuleFields,
    templates: {
      default: generateDefaultAWSEventBridgeRuleConfig() as unknown as ResourceTemplate,
      scheduled: {
        name: 'my-scheduled-rule',
        region: 'us-east-1',
        schedule_expression: 'rate(5 minutes)',
        is_enabled: true,
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso aws_cloudwatch_event_rule de Terraform permite gestionar reglas de Amazon EventBridge (anteriormente CloudWatch Events). Estas reglas coinciden con eventos entrantes y los enrutan a destinos para su procesamiento.",
      examples: [
        `
resource "aws_cloudwatch_event_rule" "console" {
  name        = "capture-aws-sign-in"
  description = "Capture all AWS Console sign in events"

  event_pattern = <<PATTERN
{
  "detail-type": [
    "AWS Console Sign In via CloudTrail"
  ]
}
PATTERN
}
        `,
        `
resource "aws_cloudwatch_event_rule" "every_five_minutes" {
  name                = "every-five-minutes"
  description         = "Fires every five minutes"
  schedule_expression = "rate(5 minutes)"
}
        `,
      ],
    },
  };
}

// Genera un nombre único para el recurso EventBridge Rule
export function generateAWSEventBridgeRuleName(config: AWSEventBridgeRuleConfig): string {
  return config.name || `eventbridge-rule-${Math.random().toString(36).substring(2, 7)}`;
}

// Interfaz para el objeto que devuelve generateAWSEventBridgeRuleCode
export interface AWSEventBridgeRuleGeneratedCode {
  name: string;
  description: string;
  config: AWSEventBridgeRuleConfig;
  codeTemplates: CodeTemplate;
}

// Función principal para generar todas las plantillas de código
export function generateAWSEventBridgeRuleCode(config: AWSEventBridgeRuleConfig): AWSEventBridgeRuleGeneratedCode {
  const parsedConfig = AWSEventBridgeRuleSchema.parse(config); // Validar y aplicar defaults de Zod

  return {
    name: generateAWSEventBridgeRuleName(parsedConfig),
    description: `EventBridge Rule: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAWSEventBridgeRuleTemplates(parsedConfig),
  };
}

// Define la exportación del recurso para el registro
const awsEventBridgeRuleResourceDefinition = {
  type: 'aws_cloudwatch_event_rule', // Terraform resource type
  name: 'EventBridge Rule', // Display name
  schema: () => AWSEventBridgeRuleSchema,
  defaults: generateDefaultAWSEventBridgeRuleConfig,
  fields: () => awsEventBridgeRuleFields,
  templates: (config: AWSEventBridgeRuleConfig) => generateAWSEventBridgeRuleTemplates(config),

  // Mantener las funciones originales
  originalSchema: AWSEventBridgeRuleSchema,
  originalGenerateDefaultConfig: generateDefaultAWSEventBridgeRuleConfig,
  originalGenerateResourceSchema: generateAWSEventBridgeRuleResourceSchema,
  originalGenerateResourceName: generateAWSEventBridgeRuleName,
  originalGenerateTemplates: generateAWSEventBridgeRuleCode,
};

const awsEventBridgeRuleResource = {
  ...awsEventBridgeRuleResourceDefinition,
};

export default awsEventBridgeRuleResource;
