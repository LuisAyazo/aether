import { AWSEfsFileSystemConfig } from './fileSystem'; // Asumiremos que este tipo se definirá en fileSystem.ts
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

export function generateAWSEfsFileSystemTemplates(config: AWSEfsFileSystemConfig): CodeTemplate {
  // Usar el 'name' (que es el tag Name) para nombres de recursos si está disponible, sino un default.
  const baseName = config.name || 'myEfsFileSystem';
  const terraformResourceName = baseName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = baseName.replace(/-/g, '');

  const parsedTags = {
    Name: config.name || baseName, // Asegurar que el tag Name esté presente
    ...parseTagsString(config.tags as string | undefined),
  };

  const lifecyclePolicyBlock = () => {
    if (config.lifecycle_policy && config.lifecycle_policy !== 'NONE') {
      return `
  lifecycle_policy {
    transition_to_ia = "${config.lifecycle_policy}"
  }
`;
    }
    return '';
  };

  const pulumiLifecyclePolicy = () => {
    if (config.lifecycle_policy && config.lifecycle_policy !== 'NONE') {
      return `lifecyclePolicies: [{ transitionToIa: "${config.lifecycle_policy}" }],`;
    }
    return '';
  };
  
  const cfnLifecyclePolicy = () => {
    if (config.lifecycle_policy && config.lifecycle_policy !== 'NONE') {
      return `
      LifecyclePolicies:
        - TransitionToIA: ${config.lifecycle_policy}`;
    }
    return '';
  };

  const terraform = `
# Plantilla de Terraform para un EFS File System de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_efs_file_system" "${terraformResourceName}" {
  # creation_token = "${terraformResourceName}" # Opcional, asegura idempotencia. Puede basarse en el nombre.
  encrypted = ${config.encrypted}
  ${config.encrypted && config.kms_key_id ? `kms_key_id = "${config.kms_key_id}"` : ''}
  
  performance_mode = "${config.performance_mode}"
  throughput_mode  = "${config.throughput_mode}"
  ${config.throughput_mode === 'provisioned' && config.provisioned_throughput_in_mibps ? `provisioned_throughput_in_mibps = ${config.provisioned_throughput_in_mibps}` : ''}

  ${lifecyclePolicyBlock()}

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}

# (Opcional) Para acceder al EFS, necesitarás crear Mount Targets en tus VPC/subredes
# resource "aws_efs_mount_target" "alpha" {
#   file_system_id  = aws_efs_file_system.${terraformResourceName}.id
#   subnet_id       = "your_subnet_id" # Reemplazar con tu ID de subred
#   # security_groups = ["your_security_group_id"] # Opcional
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un EFS File System de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}FileSystem = new aws.efs.FileSystem("${pulumiResourceName}", {
    // creationToken: "${pulumiResourceName}", // Opcional
    encrypted: ${config.encrypted},
    ${config.encrypted && config.kms_key_id ? `kmsKeyId: "${config.kms_key_id}",` : ''}
    performanceMode: "${config.performance_mode}",
    throughputMode: "${config.throughput_mode}",
    ${config.throughput_mode === 'provisioned' && config.provisioned_throughput_in_mibps ? `provisionedThroughputInMibps: ${config.provisioned_throughput_in_mibps},` : ''}
    ${pulumiLifecyclePolicy()}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
}, { provider: new aws.Provider("provider", { region: "${config.region}" }) }); // Asegurar que la región se use

export const fileSystemId = ${pulumiResourceName}FileSystem.id;
export const fileSystemArn = ${pulumiResourceName}FileSystem.arn;

# (Opcional) Mount Target
# const efsMountTarget = new aws.efs.MountTarget("alpha", {
#     fileSystemId: ${pulumiResourceName}FileSystem.id,
#     subnetId: "your_subnet_id", // Reemplazar
#     // securityGroups: ["your_security_group_id"], // Opcional
# });
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un EFS File System
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un EFS File System llamado ${config.name || baseName}
  en la región ${config.region}.

Parameters:
  FileSystemName:
    Type: String
    Default: "${config.name || baseName}"
    Description: Nombre para el tag Name del File System.
  Encrypted:
    Type: String # Booleanos como String en CFN
    Default: "${config.encrypted ? 'true' : 'false'}"
    AllowedValues: [true, false]
  KmsKeyId:
    Type: String
    Default: "${config.kms_key_id || ''}"
    Description: ARN de la clave KMS (opcional, si está cifrado).
  PerformanceMode:
    Type: String
    Default: "${config.performance_mode}"
    AllowedValues: [generalPurpose, maxIO]
  ThroughputMode:
    Type: String
    Default: "${config.throughput_mode}"
    AllowedValues: [bursting, provisioned, elastic]
  ProvisionedThroughputInMibps:
    Type: Number
    Default: ${config.provisioned_throughput_in_mibps || 0} # CFN requiere un valor, 0 si no aplica
    Description: Throughput aprovisionado en MiB/s (si ThroughputMode es provisioned).
  LifecyclePolicyTransitionToIA:
    Type: String
    Default: "${config.lifecycle_policy || 'NONE'}"
    AllowedValues: ['NONE', 'AFTER_7_DAYS', 'AFTER_14_DAYS', 'AFTER_30_DAYS', 'AFTER_60_DAYS', 'AFTER_90_DAYS']

Conditions:
  UseKmsKey: !And [!Equals [!Ref Encrypted, "true"], !Not [!Equals [!Ref KmsKeyId, ""]]]
  IsProvisionedThroughput: !Equals [!Ref ThroughputMode, "provisioned"]
  HasLifecyclePolicy: !Not [!Equals [!Ref LifecyclePolicyTransitionToIA, "NONE"]]

Resources:
  ${pulumiResourceName}FileSystem:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: !Ref Encrypted
      KmsKeyId: !If [UseKmsKey, !Ref KmsKeyId, !Ref "AWS::NoValue"]
      PerformanceMode: !Ref PerformanceMode
      ThroughputMode: !Ref ThroughputMode
      ProvisionedThroughputInMibps: !If [IsProvisionedThroughput, !Ref ProvisionedThroughputInMibps, !Ref "AWS::NoValue"]
      ${cfnLifecyclePolicy()}
      FileSystemTags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}
  
Outputs:
  FileSystemId:
    Description: ID del EFS File System creado
    Value: !Ref ${pulumiResourceName}FileSystem
  FileSystemArn:
    Description: ARN del EFS File System creado
    Value: !GetAtt ${pulumiResourceName}FileSystem.Arn
`;

  const ansiblePlaybook = `
# Playbook Ansible para AWS EFS File System (requiere community.aws.efs_file_system)
- name: Gestionar EFS File System ${config.name || baseName}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    aws_region: "${config.region}"
    efs_name_tag: "${config.name || baseName}"
    creation_token: "${pulumiResourceName}" # Para idempotencia
    encrypted: ${config.encrypted}
    # Para kms_key_id, provisioned_throughput y lifecycle_policy_ia,
    # se pasarán como strings vacías si no están definidos,
    # y se usará default(omit, true) en la tarea.
    kms_key_id_val: "${config.kms_key_id || ''}"
    performance_mode: "${config.performance_mode}"
    throughput_mode: "${config.throughput_mode}"
    provisioned_throughput_val: ${config.throughput_mode === 'provisioned' && config.provisioned_throughput_in_mibps ? config.provisioned_throughput_in_mibps : "''"}
    lifecycle_policy_ia_val: "${config.lifecycle_policy !== 'NONE' ? config.lifecycle_policy : ''}"
    efs_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar EFS File System
      community.aws.efs_file_system:
        region: "{{ aws_region }}"
        state: present
        name: "{{ efs_name_tag }}" # Esto aplicará el tag Name
        # creation_token: "{{ creation_token }}" # Descomentar si se usa
        encrypted: "{{ encrypted }}"
        kms_key_id: "{{ kms_key_id_val | default(omit, true) }}"
        performance_mode: "{{ performance_mode }}"
        throughput_mode: "{{ throughput_mode }}"
        provisioned_throughput_in_mibps: "{{ provisioned_throughput_val | default(omit, true) }}"
        lifecycle_policies: "{{ ([{ 'transition_to_ia': lifecycle_policy_ia_val }]) if lifecycle_policy_ia_val else omit }}"
        tags: "{{ efs_tags }}"
      register: efs_info

    - name: Mostrar información del EFS File System
      ansible.builtin.debug:
        var: efs_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
