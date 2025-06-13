import { AWSSqsQueueConfig } from './queue'; // Asumiremos que este tipo se definirá en queue.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

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

export function generateAWSSqsQueueTemplates(config: AWSSqsQueueConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mySqsQueue').replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mySqsQueue').replace(/[.-]/g, ''); // Pulumi names often avoid dots and hyphens

  const parsedTags = parseTagsString(config.tags as string | undefined);
  if (config.name) { // SQS usa el tag 'Name' si se provee, pero no es un argumento directo como en EC2.
    parsedTags['Name'] = config.name;
  }
  
  const terraformFifoAttributes = config.fifo_queue ? `
  fifo_queue                    = true
  content_based_deduplication = ${config.content_based_deduplication || false}` : '';

  const pulumiFifoAttributes = config.fifo_queue ? `
        fifoQueue: true,
        contentBasedDeduplication: ${config.content_based_deduplication || false},` : '';
  
  const cfnFifoAttributes = () => {
    if (config.fifo_queue) {
      let attributes = `
      FifoQueue: true`;
      if (config.content_based_deduplication) {
        attributes += `
      ContentBasedDeduplication: true`;
      }
      return attributes;
    }
    return '';
  };


  const terraform = `
# Plantilla de Terraform para una Cola SQS de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_sqs_queue" "${terraformResourceName}" {
  name                        = "${config.name}"
  delay_seconds               = ${config.delay_seconds || 0}
  max_message_size            = 262144 # 256 KiB (default, puede ser un campo configurable)
  message_retention_seconds   = ${config.message_retention_seconds || 345600}
  receive_wait_time_seconds   = ${config.receive_wait_time_seconds || 0}
  visibility_timeout_seconds  = ${config.visibility_timeout_seconds || 30}
  ${terraformFifoAttributes}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "sqs_queue_url" {
  value = aws_sqs_queue.${terraformResourceName}.id # .id devuelve la URL de la cola
}

output "sqs_queue_arn" {
  value = aws_sqs_queue.${terraformResourceName}.arn
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Cola SQS de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}Queue = new aws.sqs.Queue("${pulumiResourceName}", {
    name: "${config.name}",
    delaySeconds: ${config.delay_seconds || 0},
    maxMessageSize: 262144, // 256 KiB
    messageRetentionSeconds: ${config.message_retention_seconds || 345600},
    receiveWaitTimeSeconds: ${config.receive_wait_time_seconds || 0},
    visibilityTimeoutSeconds: ${config.visibility_timeout_seconds || 30},${pulumiFifoAttributes}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
}, { provider: new aws.Provider("provider", { region: "${config.region}" }) });

export const queueUrl = ${pulumiResourceName}Queue.id; // .id es la URL
export const queueArn = ${pulumiResourceName}Queue.arn;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Cola SQS
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una Cola SQS llamada ${config.name}
  en la región ${config.region}.

Parameters:
  QueueName:
    Type: String
    Default: "${config.name}"
  DelaySeconds:
    Type: Number
    Default: ${config.delay_seconds || 0}
  MessageRetentionPeriod:
    Type: Number
    Default: ${config.message_retention_seconds || 345600}
  ReceiveMessageWaitTimeSeconds:
    Type: Number
    Default: ${config.receive_wait_time_seconds || 0}
  VisibilityTimeout:
    Type: Number
    Default: ${config.visibility_timeout_seconds || 30}
  IsFifoQueue:
    Type: String
    Default: "${config.fifo_queue ? 'true' : 'false'}"
    AllowedValues: [true, false]
  ContentBasedDeduplication:
    Type: String
    Default: "${config.content_based_deduplication ? 'true' : 'false'}"
    AllowedValues: [true, false]

Conditions:
  CreateFifoQueue: !Equals [!Ref IsFifoQueue, "true"]

Resources:
  ${pulumiResourceName}Queue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Ref QueueName
      DelaySeconds: !Ref DelaySeconds
      MessageRetentionPeriod: !Ref MessageRetentionPeriod
      ReceiveMessageWaitTimeSeconds: !Ref ReceiveMessageWaitTimeSeconds
      VisibilityTimeout: !Ref VisibilityTimeout
      ${cfnFifoAttributes()}
      ${Object.keys(parsedTags).length > 0 ? 
        `Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}` : ''}

Outputs:
  QueueURL:
    Description: URL de la Cola SQS creada
    Value: !Ref ${pulumiResourceName}Queue
  QueueArn:
    Description: ARN de la Cola SQS creada
    Value: !GetAtt ${pulumiResourceName}Queue.Arn
`;

  const ansiblePlaybook = `
# Playbook Ansible para AWS SQS Queue (requiere community.aws.sqs_queue)
- name: Gestionar Cola SQS ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    aws_region: "${config.region}"
    queue_name: "${config.name}"
    delay_seconds: ${config.delay_seconds || 0}
    message_retention_period: ${config.message_retention_seconds || 345600}
    receive_message_wait_time_seconds: ${config.receive_wait_time_seconds || 0}
    visibility_timeout: ${config.visibility_timeout_seconds || 30}
    is_fifo: ${config.fifo_queue || false}
    content_based_deduplication: ${config.content_based_deduplication || false} # Solo aplica si is_fifo es true
    queue_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que la Cola SQS exista
      community.aws.sqs_queue:
        region: "{{ aws_region }}"
        name: "{{ queue_name }}"
        state: present
        default_visibility_timeout: "{{ visibility_timeout }}"
        message_retention_period: "{{ message_retention_period }}"
        delay_seconds: "{{ delay_seconds }}"
        receive_message_wait_time: "{{ receive_message_wait_time_seconds }}"
        fifo_queue: "{{ is_fifo }}"
        content_based_deduplication: "{{ content_based_deduplication if is_fifo else omit }}"
        tags: "{{ queue_tags }}"
      register: sqs_info

    - name: Mostrar información de la Cola SQS
      ansible.builtin.debug:
        var: sqs_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
