import { AWSSfnStateMachineConfig } from './stateMachine'; // Asumiremos que este tipo se definirá en stateMachine.ts
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

// Helper para formatear la definición de la máquina de estados
const formatDefinition = (definition: string): string => {
  try {
    // Intenta parsear y re-stringify para asegurar un formato JSON válido y indentado
    const parsedDefinition = JSON.parse(definition);
    return JSON.stringify(parsedDefinition, null, 2);
  } catch (e) {
    // Si no es JSON válido, devolverlo como está (puede causar errores en Terraform/Pulumi)
    return definition;
  }
};

export function generateAWSSfnStateMachineTemplates(config: AWSSfnStateMachineConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myStateMachine').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myStateMachine').replace(/-/g, '');

  const parsedTags = parseTagsString(config.tags as string | undefined);
  const formattedDefinition = formatDefinition(config.definition);

  const loggingConfigurationBlock = () => {
    if (config.logging_cloudwatch_enabled) {
      return `
  logging_configuration {
    log_destination        = aws_cloudwatch_log_group.${terraformResourceName}_logs.arn # Asume un log group creado
    include_execution_data = true # O false, según se prefiera
    level                  = "${config.logging_level || 'OFF'}"
  }

resource "aws_cloudwatch_log_group" "${terraformResourceName}_logs" {
  name = "/aws/stepfunctions/${config.name}" # Nombre típico para logs de SFN
  retention_in_days = 14 # Opcional: configurar retención
}
`;
    }
    return '';
  };
  
  const pulumiLoggingConfiguration = () => {
    if (config.logging_cloudwatch_enabled) {
      // En Pulumi, el log group se crearía por separado y se referenciaría su ARN.
      // Aquí simplificamos asumiendo que el usuario lo gestionará o que se puede añadir más lógica.
      return `loggingConfiguration: {
        logDestination: pulumi.interpolate\`arn:aws:logs:\${aws.config.region}:\${aws.getCallerIdentity().then(id => id.accountId)}:log-group:/aws/stepfunctions/${config.name}:*\`, // Placeholder ARN
        includeExecutionData: true,
        level: "${config.logging_level || 'OFF'}",
    },`;
    }
    return '';
  };

  const cfnLoggingConfiguration = () => {
    if (config.logging_cloudwatch_enabled) {
      return `
      LoggingConfiguration:
        Destinations:
          - CloudWatchLogsLogGroup:
              LogGroupArn: !GetAtt ${pulumiResourceName}LogGroup.Arn
        IncludeExecutionData: true
        Level: ${config.logging_level || 'OFF'}`;
    }
    return '';
  };
  
  const cfnLogGroupResource = () => {
    if (config.logging_cloudwatch_enabled) {
      return `
  ${pulumiResourceName}LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/stepfunctions/\${StateMachineName}"
      RetentionInDays: 14 # Opcional`;
    }
    return '';
  };


  const terraform = `
# Plantilla de Terraform para una Máquina de Estados de AWS Step Functions
provider "aws" {
  region = "${config.region}"
}

resource "aws_sfn_state_machine" "${terraformResourceName}" {
  name       = "${config.name}"
  role_arn   = "${config.role_arn}"
  definition = <<EOF
${formattedDefinition}
EOF
  type       = "${config.type || 'STANDARD'}"
  ${loggingConfigurationBlock()}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "state_machine_arn" {
  value = aws_sfn_state_machine.${terraformResourceName}.id # .id es el ARN para SFN
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Máquina de Estados de AWS Step Functions
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Opcional: Crear el Log Group si el logging está habilitado
${config.logging_cloudwatch_enabled ? 
`const ${pulumiResourceName}LogGroup = new aws.cloudwatch.LogGroup("${pulumiResourceName}-logs", {
    name: \`/aws/stepfunctions/${config.name}\`,
    retentionInDays: 14,
});` : ''}

const ${pulumiResourceName}StateMachine = new aws.sfn.StateMachine("${pulumiResourceName}", {
    name: "${config.name}",
    roleArn: "${config.role_arn}",
    definition: \`${formattedDefinition.replace(/`/g, '\\`')}\`, // Escapar backticks en la definición
    type: "${config.type || 'STANDARD'}",
    ${pulumiLoggingConfiguration()}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
}, { provider: new aws.Provider("provider", { region: "${config.region}" }) });

export const stateMachineArn = ${pulumiResourceName}StateMachine.id; // .id es el ARN
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Máquina de Estados de Step Functions
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una Máquina de Estados llamada ${config.name}
  en la región ${config.region}.

Parameters:
  StateMachineName:
    Type: String
    Default: "${config.name}"
  RoleArn:
    Type: String
    Default: "${config.role_arn}"
  StateMachineDefinition:
    Type: String
    Default: '${formattedDefinition.replace(/'/g, "''")}' # Escapar comillas simples para CFN
  StateMachineType:
    Type: String
    Default: "${config.type || 'STANDARD'}"
    AllowedValues: [STANDARD, EXPRESS]

Resources:
  ${pulumiResourceName}StateMachine:
    Type: AWS::StepFunctions::StateMachine
    Properties:
      StateMachineName: !Ref StateMachineName
      RoleArn: !Ref RoleArn
      DefinitionString: !Ref StateMachineDefinition
      StateMachineType: !Ref StateMachineType
      ${cfnLoggingConfiguration()}
      ${Object.keys(parsedTags).length > 0 ? 
        `Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}` : ''}
${cfnLogGroupResource()}

Outputs:
  StateMachineArn:
    Description: ARN de la Máquina de Estados creada
    Value: !Ref ${pulumiResourceName}StateMachine 
  StateMachineNameOutput:
    Description: Nombre de la Máquina de Estados creada
    Value: !GetAtt ${pulumiResourceName}StateMachine.Name
`;

  const ansiblePlaybook = `
# Playbook Ansible para AWS Step Functions State Machine (requiere community.aws.sfn_state_machine)
- name: Gestionar Máquina de Estados ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    aws_region: "${config.region}"
    state_machine_name: "${config.name}"
    role_arn: "${config.role_arn}"
    definition: |-
${formattedDefinition.split('\n').map(line => '      ' + line).join('\n')}
    state_machine_type: "${config.type || 'STANDARD'}"
    # Logging configuration es más complejo en Ansible, se omite por simplicidad
    # Se puede configurar usando el parámetro logging_configuration
    sm_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que la Máquina de Estados exista
      community.aws.sfn_state_machine:
        region: "{{ aws_region }}"
        name: "{{ state_machine_name }}"
        definition: "{{ definition }}"
        role_arn: "{{ role_arn }}"
        state: present # 'present' para crear/actualizar
        type: "{{ state_machine_type }}"
        # logging_configuration: ... (si se desea configurar)
        tags: "{{ sm_tags }}"
      register: sfn_info

    - name: Mostrar información de la Máquina de Estados
      ansible.builtin.debug:
        var: sfn_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
