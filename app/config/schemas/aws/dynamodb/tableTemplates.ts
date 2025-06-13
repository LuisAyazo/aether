import { AWSDynamoDBTableConfig } from './table'; // Asumiremos que este tipo se definirá en table.ts
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

export function generateAWSDynamoDBTableTemplates(config: AWSDynamoDBTableConfig): CodeTemplate {
  const terraformResourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.name.replace(/-/g, '');

  const parsedTags = {
    Name: config.name,
    ...parseTagsString(config.tags as string | undefined),
  };

  const attributes = [
    `  attribute {\n    name = "${config.hash_key}"\n    type = "${config.hash_key_type}"\n  }`
  ];
  if (config.range_key && config.range_key_type) {
    attributes.push(`  attribute {\n    name = "${config.range_key}"\n    type = "${config.range_key_type}"\n  }`);
  }

  const cfAttributes = [
    `        - AttributeName: ${config.hash_key}\n          AttributeType: ${config.hash_key_type}`
  ];
  if (config.range_key && config.range_key_type) {
    cfAttributes.push(`        - AttributeName: ${config.range_key}\n          AttributeType: ${config.range_key_type}`);
  }
  
  const cfKeySchema = [
    `        - AttributeName: ${config.hash_key}\n          KeyType: HASH`
  ];
  if (config.range_key) {
    cfKeySchema.push(`        - AttributeName: ${config.range_key}\n          KeyType: RANGE`);
  }

  const terraform = `
# Plantilla de Terraform para una Tabla DynamoDB de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_dynamodb_table" "${terraformResourceName}" {
  name           = "${config.name}"
  billing_mode   = "${config.billing_mode}"
  ${config.billing_mode === 'PROVISIONED' ? `read_capacity  = ${config.read_capacity || 5}` : ''}
  ${config.billing_mode === 'PROVISIONED' ? `write_capacity = ${config.write_capacity || 5}` : ''}
  hash_key       = "${config.hash_key}"
  ${config.range_key ? `range_key      = "${config.range_key}"` : ''}

${attributes.join('\n')}

  ${config.stream_enabled ? `stream_enabled   = true` : ''}
  ${config.stream_enabled && config.stream_view_type ? `stream_view_type = "${config.stream_view_type}"` : ''}

  # (Opcional) Índices Secundarios Globales (GSI)
  # global_secondary_index {
  #   name            = "MyGSI"
  #   hash_key        = "anotherAttribute"
  #   range_key       = "yetAnotherAttribute" # Opcional
  #   projection_type = "ALL" # O "KEYS_ONLY" o "INCLUDE"
  #   # projection_attributes = ["attr1", "attr2"] # Si projection_type es "INCLUDE"
  #   # read_capacity   = 5 # Si billing_mode es PROVISIONED
  #   # write_capacity  = 5 # Si billing_mode es PROVISIONED
  # }

  # (Opcional) Índices Secundarios Locales (LSI) - Solo se pueden crear al crear la tabla
  # local_secondary_index {
  #   name            = "MyLSI"
  #   range_key       = "localRangeKeyAttribute"
  #   projection_type = "ALL"
  #   # projection_attributes = ["attr1"] # Si projection_type es "INCLUDE"
  # }

  # (Opcional) Configuración de TTL
  # ttl {
  #   attribute_name = "TimeToExist"
  #   enabled        = true
  # }

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Tabla DynamoDB de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}Table = new aws.dynamodb.Table("${pulumiResourceName}", {
    name: "${config.name}",
    billingMode: "${config.billing_mode}",
    ${config.billing_mode === 'PROVISIONED' ? `readCapacity: ${config.read_capacity || 5},` : ''}
    ${config.billing_mode === 'PROVISIONED' ? `writeCapacity: ${config.write_capacity || 5},` : ''}
    hashKey: "${config.hash_key}",
    ${config.range_key ? `rangeKey: "${config.range_key}",` : ''}
    attributes: [
        { name: "${config.hash_key}", type: "${config.hash_key_type}" },
        ${config.range_key && config.range_key_type ? `{ name: "${config.range_key}", type: "${config.range_key_type}" },` : ''}
    ],
    ${config.stream_enabled ? `streamEnabled: true,` : ''}
    ${config.stream_enabled && config.stream_view_type ? `streamViewType: "${config.stream_view_type}",` : ''}
    
    // (Opcional) Global Secondary Indexes
    // globalSecondaryIndexes: [{
    //     name: "MyGSI",
    //     hashKey: "anotherAttribute",
    //     rangeKey: "yetAnotherAttribute", // Opcional
    //     projectionType: "ALL",
    //     // readCapacity: 5, // Si billingMode es PROVISIONED
    //     // writeCapacity: 5, // Si billingMode es PROVISIONED
    // }],

    // (Opcional) Local Secondary Indexes
    // localSecondaryIndexes: [{
    //     name: "MyLSI",
    //     rangeKey: "localRangeKeyAttribute",
    //     projectionType: "ALL",
    // }],

    // (Opcional) TTL Configuration
    // ttl: {
    //     attributeName: "TimeToExist",
    //     enabled: true,
    // },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
    region: "${config.region}",
});

export const tableName = ${pulumiResourceName}Table.name;
export const tableArn = ${pulumiResourceName}Table.arn;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Tabla DynamoDB
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una tabla DynamoDB llamada ${config.name}
  en la región ${config.region}.

Parameters:
  TableName:
    Type: String
    Default: "${config.name}"
  BillingMode:
    Type: String
    Default: "${config.billing_mode}"
    AllowedValues: [PROVISIONED, PAY_PER_REQUEST]
  ReadCapacityUnits:
    Type: Number
    Default: ${config.read_capacity || 5}
  WriteCapacityUnits:
    Type: Number
    Default: ${config.write_capacity || 5}
  HashKeyName:
    Type: String
    Default: "${config.hash_key}"
  HashKeyType:
    Type: String
    Default: "${config.hash_key_type}"
    AllowedValues: [S, N, B]
  RangeKeyName:
    Type: String
    Default: "${config.range_key || ''}"
  RangeKeyType:
    Type: String
    Default: "${config.range_key_type || ''}"
    AllowedValues: ["", S, N, B]
  StreamEnabled:
    Type: String # CloudFormation usa String para booleanos en algunos casos
    Default: "${config.stream_enabled ? 'true' : 'false'}"
    AllowedValues: ["true", "false"]
  StreamViewTypeCFN: # Nombre diferente para evitar conflicto con el config
    Type: String
    Default: "${config.stream_view_type || 'NEW_AND_OLD_IMAGES'}"
    AllowedValues: [NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES, KEYS_ONLY]

Conditions:
  IsProvisioned: !Equals [!Ref BillingMode, "PROVISIONED"]
  HasRangeKey: !Not [!Equals [!Ref RangeKeyName, ""]]
  IsStreamEnabled: !Equals [!Ref StreamEnabled, "true"]

Resources:
  ${pulumiResourceName}DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref TableName
      BillingMode: !Ref BillingMode
      ProvisionedThroughput: !If
        - IsProvisioned
        - ReadCapacityUnits: !Ref ReadCapacityUnits
          WriteCapacityUnits: !Ref WriteCapacityUnits
        - !Ref "AWS::NoValue"
      AttributeDefinitions:
${cfAttributes.join('\n')}
      KeySchema:
${cfKeySchema.join('\n')}
      StreamSpecification: !If
        - IsStreamEnabled
        - StreamViewType: !Ref StreamViewTypeCFN
        - !Ref "AWS::NoValue"
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}
      # GlobalSecondaryIndexes: # Opcional
      # LocalSecondaryIndexes: # Opcional
      # TimeToLiveSpecification: # Opcional

Outputs:
  TableNameOutput:
    Description: Nombre de la tabla DynamoDB creada
    Value: !Ref ${pulumiResourceName}DynamoDBTable
  TableArnOutput:
    Description: ARN de la tabla DynamoDB creada
    Value: !GetAtt ${pulumiResourceName}DynamoDBTable.Arn
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS DynamoDB Table (requiere community.aws.dynamodb_table)
- name: Gestionar Tabla DynamoDB ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    table_name: "${config.name}"
    aws_region: "${config.region}"
    billing_mode: "${config.billing_mode}"
    read_capacity: ${config.read_capacity || 5}
    write_capacity: ${config.write_capacity || 5}
    hash_key_name: "${config.hash_key}"
    hash_key_type: "${config.hash_key_type}"
    range_key_name: "${config.range_key || ''}"
    range_key_type: "${config.range_key_type || ''}"
    stream_enabled_val: ${config.stream_enabled || false}
    stream_view_type_val: "${config.stream_view_type || 'NEW_AND_OLD_IMAGES'}"
    dynamodb_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Tabla DynamoDB
      community.aws.dynamodb_table:
        name: "{{ table_name }}"
        region: "{{ aws_region }}"
        state: present
        billing_mode: "{{ billing_mode }}"
        read_capacity: "{{ read_capacity if billing_mode == 'PROVISIONED' else omit }}"
        write_capacity: "{{ write_capacity if billing_mode == 'PROVISIONED' else omit }}"
        schema:
          - attribute_name: "{{ hash_key_name }}"
            attribute_type: "{{ hash_key_type }}"
            key_type: HASH
          - attribute_name: "{{ range_key_name }}"
            attribute_type: "{{ range_key_type }}"
            key_type: RANGE
            when: range_key_name | length > 0
        stream_enabled: "{{ stream_enabled_val }}"
        stream_view_type: "{{ stream_view_type_val if stream_enabled_val else omit }}"
        tags: "{{ dynamodb_tags }}"
      register: dynamodb_table_info

    - name: Mostrar información de la Tabla DynamoDB
      ansible.builtin.debug:
        var: dynamodb_table_info
`,
    cloudformation
  };
}
