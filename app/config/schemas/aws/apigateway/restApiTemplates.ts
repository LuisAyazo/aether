import { AWSApiGatewayRestApiConfig } from './restApi'; // Asumiremos que este tipo se definirá en restApi.ts
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

export function generateAWSApiGatewayRestApiTemplates(config: AWSApiGatewayRestApiConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myApiGateway').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myApiGateway').replace(/-/g, '');

  const parsedTags = parseTagsString(config.tags as string | undefined);
  // El tag 'Name' para aws_api_gateway_rest_api se maneja a través de la propiedad 'name' del recurso.

  const terraform = `
# Plantilla de Terraform para una API Gateway REST API de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_api_gateway_rest_api" "${terraformResourceName}" {
  name        = "${config.name}"
  description = "${config.description || ''}"

  endpoint_configuration {
    types = ["${config.endpoint_configuration_types || 'REGIONAL'}"]
  }

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

# Nota: Para una API funcional, necesitarás definir recursos, métodos, integraciones, etc.
# Ejemplo de un recurso raíz:
# resource "aws_api_gateway_resource" "root" {
#   rest_api_id = aws_api_gateway_rest_api.${terraformResourceName}.id
#   parent_id   = aws_api_gateway_rest_api.${terraformResourceName}.root_resource_id
#   path_part   = "{proxy+}" # o un path específico
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una API Gateway REST API de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}RestApi = new aws.apigateway.RestApi("${pulumiResourceName}", {
    name: "${config.name}",
    description: "${config.description || undefined}",
    endpointConfiguration: {
        types: "${config.endpoint_configuration_types || 'REGIONAL'}",
    },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
}, { provider: new aws.Provider("provider", { region: "${config.region}" }) });

export const restApiId = ${pulumiResourceName}RestApi.id;
export const restApiExecutionArn = ${pulumiResourceName}RestApi.executionArn;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una API Gateway REST API
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una API Gateway REST API llamada ${config.name}
  en la región ${config.region}.

Parameters:
  ApiName:
    Type: String
    Default: "${config.name}"
  ApiDescription:
    Type: String
    Default: "${config.description || ''}"
  EndpointType:
    Type: String
    Default: "${config.endpoint_configuration_types || 'REGIONAL'}"
    AllowedValues: [REGIONAL, EDGE, PRIVATE]

Resources:
  ${pulumiResourceName}RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Ref ApiName
      Description: !Ref ApiDescription
      EndpointConfiguration:
        Types:
          - !Ref EndpointType
      ${Object.keys(parsedTags).length > 0 ? 
        `Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}` : ''}

Outputs:
  RestApiId:
    Description: ID de la API REST creada
    Value: !Ref ${pulumiResourceName}RestApi
  RootResourceId:
    Description: ID del recurso raíz de la API
    Value: !GetAtt ${pulumiResourceName}RestApi.RootResourceId
`;
  // Ansible para API Gateway es más complejo y usualmente maneja recursos, métodos, etc.
  // por lo que una plantilla básica solo para el recurso RestApi es menos común.
  // Se puede usar community.aws.api_gateway_rest_api.
  const ansiblePlaybook = `
# Playbook Ansible para AWS API Gateway REST API (requiere community.aws.api_gateway_rest_api)
- name: Gestionar API Gateway REST API ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    aws_region: "${config.region}"
    api_name: "${config.name}"
    api_description: "${config.description || ''}"
    endpoint_type: "${config.endpoint_configuration_types || 'REGIONAL'}"
    api_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que la API Gateway REST API exista
      community.aws.api_gateway_rest_api:
        region: "{{ aws_region }}"
        name: "{{ api_name }}"
        description: "{{ api_description }}"
        endpoint_configuration:
          types:
            - "{{ endpoint_type }}"
        tags: "{{ api_tags }}"
        state: present
      register: api_gateway_info

    - name: Mostrar información de la API Gateway
      ansible.builtin.debug:
        var: api_gateway_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
