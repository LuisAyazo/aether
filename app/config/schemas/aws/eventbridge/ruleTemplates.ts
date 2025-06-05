import { AWSEventBridgeRuleConfig } from './rule'; // Asumiremos que este tipo se definirá en rule.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

// Helper function to parse tags from string "Key1=Value1,Key2=Value2" to object
const parseTagsString = (tagsString?: string): Record<string, string> => {
  if (!tagsString) return {};
  return tagsString.split(',').reduce((acc, tagPair) => {
    const [key, value] = tagPair.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

// Helper para formatear el event_pattern o schedule_expression
const formatEventSource = (config: AWSEventBridgeRuleConfig): string => {
  if (config.event_pattern) {
    // Asegurarse de que el JSON es válido y está bien formateado para Terraform
    try {
      const parsedPattern = JSON.parse(config.event_pattern);
      return `event_pattern = jsonencode(${JSON.stringify(parsedPattern, null, 2)})`;
    } catch (e) {
      // Si no es JSON válido, usarlo como string literal (puede fallar en Terraform si no es válido)
      return `event_pattern = "${config.event_pattern.replace(/"/g, '\\"')}"`;
    }
  }
  if (config.schedule_expression) {
    return `schedule_expression = "${config.schedule_expression}"`;
  }
  return ''; // Debe tener uno u otro
};

const formatPulumiEventSource = (config: AWSEventBridgeRuleConfig): string => {
  if (config.event_pattern) {
    try {
      const parsedPattern = JSON.parse(config.event_pattern);
      return `eventPattern: ${JSON.stringify(parsedPattern, null, 2)},`;
    } catch (e) {
      return `eventPattern: \`${config.event_pattern.replace(/`/g, '\\`')}\`,`;
    }
  }
  if (config.schedule_expression) {
    return `scheduleExpression: "${config.schedule_expression}",`;
  }
  return '';
};

const formatCfnEventSource = (config: AWSEventBridgeRuleConfig): string => {
  if (config.event_pattern) {
    try {
      // CloudFormation espera un objeto, no un string JSON
      const parsedPattern = JSON.parse(config.event_pattern);
      // Convertir a formato YAML-like string para la plantilla
      return `EventPattern:\n        ${JSON.stringify(parsedPattern, null, 2).replace(/\n/g, '\n        ')}`;
    } catch (e) {
      // No es ideal, pero CFN no aceptará un string JSON directamente aquí.
      // El usuario debe proveer un JSON válido.
      return `# ERROR: event_pattern no es un JSON válido\n# EventPattern: '${config.event_pattern}'`;
    }
  }
  if (config.schedule_expression) {
    return `ScheduleExpression: "${config.schedule_expression}"`;
  }
  return '';
};


export function generateAWSEventBridgeRuleTemplates(config: AWSEventBridgeRuleConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myEventRule').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myEventRule').replace(/-/g, '');

  const parsedTags = parseTagsString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para una Regla de EventBridge de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_cloudwatch_event_rule" "${terraformResourceName}" {
  name                = "${config.name}"
  description         = "${config.description || ''}"
  ${formatEventSource(config)}
  is_enabled          = ${config.is_enabled === undefined ? true : config.is_enabled}
  ${config.event_bus_name ? `event_bus_name = "${config.event_bus_name}"` : ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

# Nota: Para que esta regla haga algo, necesitas definir 'targets' (aws_cloudwatch_event_target).
# resource "aws_cloudwatch_event_target" "lambda" {
#   rule      = aws_cloudwatch_event_rule.${terraformResourceName}.name
#   target_id = "InvokeLambdaFunction"
#   arn       = "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME"
#   # input     = <<EOF
#   # {
#   #   "key": "value"
#   # }
#   # EOF
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Regla de EventBridge de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}Rule = new aws.cloudwatch.EventRule("${pulumiResourceName}", {
    name: "${config.name}",
    description: "${config.description || undefined}",
    ${formatPulumiEventSource(config)}
    isEnabled: ${config.is_enabled === undefined ? true : config.is_enabled},
    ${config.event_bus_name ? `eventBusName: "${config.event_bus_name}",` : ''}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
}, { provider: new aws.Provider("provider", { region: "${config.region}" }) });

export const ruleArn = ${pulumiResourceName}Rule.arn;
export const ruleName = ${pulumiResourceName}Rule.name;

// Ejemplo de Target:
// const lambdaTarget = new aws.cloudwatch.EventTarget("lambdaTarget", {
//     rule: ${pulumiResourceName}Rule.name,
//     arn: "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME",
//     // input: JSON.stringify({ key: "value" }),
// });
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Regla de EventBridge
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una Regla de EventBridge llamada ${config.name}
  en la región ${config.region}.

Parameters:
  RuleName:
    Type: String
    Default: "${config.name}"
  RuleDescription:
    Type: String
    Default: "${config.description || ''}"
  IsEnabled:
    Type: String # Booleanos como String en CFN
    Default: "${config.is_enabled === undefined || config.is_enabled ? 'ENABLED' : 'DISABLED'}"
    AllowedValues: [ENABLED, DISABLED]
  EventBusName:
    Type: String
    Default: "${config.event_bus_name || 'default'}" # 'default' es el bus por defecto

Resources:
  ${pulumiResourceName}Rule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Ref RuleName
      Description: !Ref RuleDescription
      ${formatCfnEventSource(config)}
      State: !Ref IsEnabled
      ${config.event_bus_name ? `EventBusName: !Ref EventBusName` : ''}
      ${Object.keys(parsedTags).length > 0 ? 
        `Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}` : ''}

Outputs:
  RuleArn:
    Description: ARN de la Regla de EventBridge creada
    Value: !GetAtt ${pulumiResourceName}Rule.Arn
  RuleName:
    Description: Nombre de la Regla de EventBridge creada
    Value: !Ref ${pulumiResourceName}Rule
`;

  const ansiblePlaybook = `
# Playbook Ansible para AWS EventBridge Rule (requiere community.aws.cloudwatch_event_rule)
- name: Gestionar Regla de EventBridge ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    aws_region: "${config.region}"
    rule_name: "${config.name}"
    rule_description: "${config.description || ''}"
    event_pattern: >-
      ${config.event_pattern ? JSON.stringify(JSON.parse(config.event_pattern), null, 2).replace(/^/gm, '      ') : "''"}
    schedule_expression: "${config.schedule_expression || ''}"
    is_enabled: ${config.is_enabled === undefined ? true : config.is_enabled}
    event_bus_name: "${config.event_bus_name || 'default'}"
    rule_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que la Regla de EventBridge exista
      community.aws.cloudwatch_event_rule:
        region: "{{ aws_region }}"
        name: "{{ rule_name }}"
        description: "{{ rule_description }}"
        event_pattern: "{{ event_pattern | default(omit, true) }}"
        schedule_expression: "{{ schedule_expression | default(omit, true) }}"
        state: "{{ 'present' if is_enabled else 'absent' }}" # Ansible usa 'present'/'absent' para habilitar/deshabilitar
        event_bus_name: "{{ event_bus_name }}"
        tags: "{{ rule_tags }}"
      register: event_rule_info

    - name: Mostrar información de la Regla de EventBridge
      ansible.builtin.debug:
        var: event_rule_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
