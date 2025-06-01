import { AWSSnsTopicConfig } from './topic'; // Asumiremos que este tipo se definirá en topic.ts
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

export function generateAWSSnsTopicTemplates(config: AWSSnsTopicConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mySnsTopic').replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mySnsTopic').replace(/[.-]/g, '');

  const parsedTags = parseTagsString(config.tags as string | undefined);
  if (config.name) {
    parsedTags['Name'] = config.name; // SNS topics can have a 'Name' tag.
  }

  const terraformFifoAttributes = config.fifo_topic ? `
  fifo_topic                    = true
  content_based_deduplication = ${config.content_based_deduplication || false}` : '';

  const pulumiFifoAttributes = config.fifo_topic ? `
        fifoTopic: true,
        contentBasedDeduplication: ${config.content_based_deduplication || false},` : '';
  
  const cfnFifoAttributes = () => {
    if (config.fifo_topic) {
      let attributes = `
      FifoTopic: true`;
      if (config.content_based_deduplication) {
        attributes += `
      ContentBasedDeduplication: true`;
      }
      return attributes;
    }
    return '';
  };

  const terraform = `
# Plantilla de Terraform para un Tema SNS de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_sns_topic" "${terraformResourceName}" {
  name          = "${config.name}"
  display_name  = "${config.display_name || ''}"
  ${terraformFifoAttributes}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "sns_topic_arn" {
  value = aws_sns_topic.${terraformResourceName}.arn
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Tema SNS de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}Topic = new aws.sns.Topic("${pulumiResourceName}", {
    name: "${config.name}",
    displayName: "${config.display_name || undefined}",${pulumiFifoAttributes}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
}, { provider: new aws.Provider("provider", { region: "${config.region}" }) });

export const topicArn = ${pulumiResourceName}Topic.arn;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Tema SNS
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un Tema SNS llamado ${config.name}
  en la región ${config.region}.

Parameters:
  TopicName:
    Type: String
    Default: "${config.name}"
  DisplayName:
    Type: String
    Default: "${config.display_name || ''}"
  IsFifoTopic:
    Type: String
    Default: "${config.fifo_topic ? 'true' : 'false'}"
    AllowedValues: [true, false]
  ContentBasedDeduplication:
    Type: String
    Default: "${config.content_based_deduplication ? 'true' : 'false'}"
    AllowedValues: [true, false]

Conditions:
  CreateFifoTopic: !Equals [!Ref IsFifoTopic, "true"]

Resources:
  ${pulumiResourceName}Topic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Ref TopicName
      DisplayName: !Ref DisplayName
      ${cfnFifoAttributes()}
      ${Object.keys(parsedTags).length > 0 ? 
        `Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}` : ''}

Outputs:
  TopicArn:
    Description: ARN del Tema SNS creado
    Value: !Ref ${pulumiResourceName}Topic
`;

  const ansiblePlaybook = `
# Playbook Ansible para AWS SNS Topic (requiere community.aws.sns_topic)
- name: Gestionar Tema SNS ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    aws_region: "${config.region}"
    topic_name: "${config.name}"
    display_name: "${config.display_name || ''}"
    is_fifo: ${config.fifo_topic || false}
    content_based_deduplication: ${config.content_based_deduplication || false} # Solo aplica si is_fifo es true
    topic_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que el Tema SNS exista
      community.aws.sns_topic:
        region: "{{ aws_region }}"
        name: "{{ topic_name }}"
        state: present
        display_name: "{{ display_name }}"
        fifo_topic: "{{ is_fifo }}"
        content_based_deduplication: "{{ content_based_deduplication if is_fifo else omit }}"
        tags: "{{ topic_tags }}"
      register: sns_topic_info

    - name: Mostrar información del Tema SNS
      ansible.builtin.debug:
        var: sns_topic_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
