import { z } from 'zod';
import { awsSfnStateMachineFields } from './stateMachineFields';
import { generateAWSSfnStateMachineTemplates } from './stateMachineTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../types/resourceConfig";

const defaultDefinition = JSON.stringify({
  Comment: "A simple minimal example of the Amazon States Language",
  StartAt: "HelloWorld",
  States: {
    HelloWorld: {
      Type: "Pass",
      Result: "Hello World!",
      End: true
    }
  }
}, null, 2);

export const AWSSfnStateMachineSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  region: z.string().min(1, "La región es obligatoria."),
  role_arn: z.string().min(1, "El ARN del rol es obligatorio.").regex(/^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/, "ARN de rol IAM inválido."),
  definition: z.string().min(1, "La definición es obligatoria.").refine(val => {
    try { JSON.parse(val); return true; } catch { return false; }
  }, "La definición debe ser un JSON válido."),
  type: z.enum(['STANDARD', 'EXPRESS']).optional().default('STANDARD'),
  logging_cloudwatch_enabled: z.boolean().optional().default(false),
  logging_level: z.enum(['ALL', 'ERROR', 'FATAL', 'OFF']).optional().default('OFF'),
  tags: z.string().optional(),
});

export type AWSSfnStateMachineConfig = z.infer<typeof AWSSfnStateMachineSchema>;

export function generateDefaultAWSSfnStateMachineConfig(): AWSSfnStateMachineConfig {
  return {
    name: 'my-state-machine',
    region: 'us-east-1',
    role_arn: 'arn:aws:iam::123456789012:role/StepFunctionsExecutionRole', // Placeholder
    definition: defaultDefinition,
    type: 'STANDARD',
    logging_cloudwatch_enabled: false,
    logging_level: 'OFF',
  };
}

export function generateAWSSfnStateMachineResourceSchema(): ResourceSchema {
  return {
    type: 'aws_sfn_state_machine',
    displayName: 'Step Functions State Machine',
    description: 'Crea una máquina de estados de AWS Step Functions para orquestar flujos de trabajo.',
    category: 'Aplicación',
    fields: awsSfnStateMachineFields,
    templates: {
      default: generateDefaultAWSSfnStateMachineConfig() as unknown as ResourceTemplate,
      express: {
        ...generateDefaultAWSSfnStateMachineConfig(),
        name: 'my-express-state-machine',
        type: 'EXPRESS',
        logging_cloudwatch_enabled: true, // Express a menudo se beneficia del logging
        logging_level: 'ALL',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso aws_sfn_state_machine de Terraform permite gestionar máquinas de estados de AWS Step Functions.",
      examples: [
        `
resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = "my-state-machine"
  role_arn = aws_iam_role.iam_for_sfn.arn # Reemplazar con el ARN de tu rol

  definition = <<EOF
{
  "Comment": "A Hello World example",
  "StartAt": "HelloWorld",
  "States": {
    "HelloWorld": {
      "Type": "Pass",
      "Result": "Hello World!",
      "End": true
    }
  }
}
EOF
}
        `,
      ],
    },
  };
}

export function generateAWSSfnStateMachineName(config: AWSSfnStateMachineConfig): string {
  return config.name || `sfn-state-machine-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AWSSfnStateMachineGeneratedCode {
  name: string;
  description: string;
  config: AWSSfnStateMachineConfig;
  codeTemplates: CodeTemplate;
}

export function generateAWSSfnStateMachineCode(config: AWSSfnStateMachineConfig): AWSSfnStateMachineGeneratedCode {
  const parsedConfig = AWSSfnStateMachineSchema.parse(config);
  return {
    name: generateAWSSfnStateMachineName(parsedConfig),
    description: `Step Functions State Machine: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAWSSfnStateMachineTemplates(parsedConfig),
  };
}

const awsSfnStateMachineResourceDefinition = {
  type: 'aws_sfn_state_machine',
  name: 'Step Functions State Machine',
  schema: () => AWSSfnStateMachineSchema,
  defaults: generateDefaultAWSSfnStateMachineConfig,
  fields: () => awsSfnStateMachineFields,
  templates: (config: AWSSfnStateMachineConfig) => generateAWSSfnStateMachineTemplates(config),

  // Mantener las funciones originales
  originalSchema: AWSSfnStateMachineSchema,
  originalGenerateDefaultConfig: generateDefaultAWSSfnStateMachineConfig,
  originalGenerateResourceSchema: generateAWSSfnStateMachineResourceSchema,
  originalGenerateResourceName: generateAWSSfnStateMachineName,
  originalGenerateTemplates: generateAWSSfnStateMachineCode,
};

const awsSfnStateMachineResource = {
  ...awsSfnStateMachineResourceDefinition,
};

export default awsSfnStateMachineResource;
