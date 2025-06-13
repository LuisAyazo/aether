import { AWSRedshiftClusterConfig } from './cluster'; // Asumiremos que este tipo se definirá en cluster.ts
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

export function generateAWSRedshiftClusterTemplates(config: AWSRedshiftClusterConfig): CodeTemplate {
  const terraformResourceName = config.cluster_identifier.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.cluster_identifier.replace(/-/g, '');

  const parsedTags = {
    Name: config.cluster_identifier,
    ...parseTagsString(config.tags as string | undefined),
  };
  
  const vpcSecurityGroupIdsArray = config.vpc_security_group_ids ? (config.vpc_security_group_ids as string).split(',').map(s => `"${s.trim()}"`).join(', ') : '';
  const iamRolesArray = config.iam_roles ? (config.iam_roles as string).split(',').map(r => `"${r.trim()}"`).join(', ') : '';

  const terraform = `
# Plantilla de Terraform para un Cluster Redshift de AWS
provider "aws" {
  region = "${config.region}"
}

resource "aws_redshift_cluster" "${terraformResourceName}" {
  cluster_identifier   = "${config.cluster_identifier}"
  node_type            = "${config.node_type}"
  master_username      = "${config.master_username}"
  master_password      = "${config.master_password}" # Considerar usar un gestor de secretos
  ${config.db_name ? `database_name        = "${config.db_name}"` : ''}
  cluster_type         = "${config.cluster_type}"
  ${config.cluster_type === 'multi-node' ? `number_of_nodes    = ${config.number_of_nodes || 2}` : (config.number_of_nodes && config.number_of_nodes > 1 ? `number_of_nodes = ${config.number_of_nodes}` : '# number_of_nodes no aplica para single-node a menos que sea > 1, lo cual lo convertiría en multi-node')}
  
  ${iamRolesArray ? `iam_roles            = [${iamRolesArray}]` : ''}
  publicly_accessible  = ${config.publicly_accessible || false}
  ${vpcSecurityGroupIdsArray ? `vpc_security_group_ids = [${vpcSecurityGroupIdsArray}]` : ''}

  # (Opcional) Especificar grupo de subredes del cluster
  # cluster_subnet_group_name = "my-redshift-subnet-group"

  # (Opcional) Especificar grupo de parámetros del cluster
  # cluster_parameter_group_name = "my-redshift-parameter-group"

  # (Opcional) Habilitar encripción
  # encrypted = true
  # kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/your-kms-key-id" # Si encrypted es true

  skip_final_snapshot  = true # En producción, considerar false y especificar final_snapshot_identifier

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Cluster Redshift de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const ${pulumiResourceName}Cluster = new aws.redshift.Cluster("${pulumiResourceName}", {
    clusterIdentifier: "${config.cluster_identifier}",
    nodeType: "${config.node_type}",
    masterUsername: "${config.master_username}",
    masterPassword: "${config.master_password}", // Considerar usar pulumi.Config para secretos
    ${config.db_name ? `databaseName: "${config.db_name}",` : ''}
    clusterType: "${config.cluster_type}",
    ${config.cluster_type === 'multi-node' ? `numberOfNodes: ${config.number_of_nodes || 2},` : (config.number_of_nodes && config.number_of_nodes > 1 ? `numberOfNodes: ${config.number_of_nodes},` : '')}
    
    ${iamRolesArray ? `iamRoles: [${iamRolesArray}],` : ''}
    publiclyAccessible: ${config.publicly_accessible || false},
    ${vpcSecurityGroupIdsArray ? `vpcSecurityGroupIds: [${vpcSecurityGroupIdsArray}],` : ''}
    region: "${config.region}",

    // (Opcional) Especificar grupo de subredes del cluster
    // clusterSubnetGroupName: "my-redshift-subnet-group",

    // (Opcional) Especificar grupo de parámetros del cluster
    // clusterParameterGroupName: "my-redshift-parameter-group",

    // (Opcional) Habilitar encripción
    // encrypted: true,
    // kmsKeyId: "arn:aws:kms:us-east-1:123456789012:key/your-kms-key-id", // Si encrypted es true

    skipFinalSnapshot: true, // En producción, considerar false y especificar finalSnapshotIdentifier

    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const clusterEndpoint = ${pulumiResourceName}Cluster.endpoint;
export const clusterPort = ${pulumiResourceName}Cluster.port;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Cluster Redshift
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un cluster Redshift llamado ${config.cluster_identifier}
  en la región ${config.region}.

Parameters:
  ClusterIdentifier:
    Type: String
    Default: "${config.cluster_identifier}"
  NodeType:
    Type: String
    Default: "${config.node_type}"
  MasterUsername:
    Type: String
    Default: "${config.master_username}"
  MasterUserPassword:
    Type: String
    NoEcho: true # Importante para contraseñas
    Default: "${config.master_password}"
  DBName:
    Type: String
    Default: "${config.db_name || 'dev'}"
  ClusterType:
    Type: String
    Default: "${config.cluster_type}"
    AllowedValues: [single-node, multi-node]
  NumberOfNodes:
    Type: Number
    Default: ${config.number_of_nodes || (config.cluster_type === 'multi-node' ? 2 : 1)}
  IAMRoles: # Lista de ARNs de roles IAM
    Type: CommaDelimitedList
    Default: "${config.iam_roles || ''}"
  PubliclyAccessible:
    Type: String # Booleanos como String en CFN
    Default: "${config.publicly_accessible ? 'true' : 'false'}"
    AllowedValues: [true, false]
  VPCSecurityGroupIds:
    Type: CommaDelimitedList
    Default: "${config.vpc_security_group_ids || ''}"

Conditions:
  IsMultiNode: !Equals [!Ref ClusterType, "multi-node"]
  HasIAMRoles: !Not [!Equals [!Join ["", !Ref IAMRoles], ""]]
  HasVPCSecurityGroups: !Not [!Equals [!Join ["", !Ref VPCSecurityGroupIds], ""]]

Resources:
  ${pulumiResourceName}RedshiftCluster:
    Type: AWS::Redshift::Cluster
    Properties:
      ClusterIdentifier: !Ref ClusterIdentifier
      NodeType: !Ref NodeType
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Ref MasterUserPassword
      DBName: !Ref DBName
      ClusterType: !Ref ClusterType
      NumberOfNodes: !If [IsMultiNode, !Ref NumberOfNodes, !Ref "AWS::NoValue"]
      IamRoles: !If [HasIAMRoles, !Ref IAMRoles, !Ref "AWS::NoValue"]
      PubliclyAccessible: !Ref PubliclyAccessible
      VpcSecurityGroupIds: !If [HasVPCSecurityGroups, !Ref VPCSecurityGroupIds, !Ref "AWS::NoValue"]
      # ClusterSubnetGroupName: "my-redshift-subnet-group" # Opcional
      # ClusterParameterGroupName: "my-redshift-parameter-group" # Opcional
      # Encrypted: true # Opcional
      # KmsKeyId: "your-kms-key-id" # Opcional
      SkipFinalSnapshot: true
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}

Outputs:
  ClusterEndpointAddress:
    Description: Endpoint address of the Redshift cluster
    Value: !GetAtt ${pulumiResourceName}RedshiftCluster.Endpoint.Address
  ClusterEndpointPort:
    Description: Endpoint port of the Redshift cluster
    Value: !GetAtt ${pulumiResourceName}RedshiftCluster.Endpoint.Port
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS Redshift Cluster (requiere community.aws.redshift_cluster)
- name: Gestionar Cluster Redshift ${config.cluster_identifier}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    cluster_identifier: "${config.cluster_identifier}"
    aws_region: "${config.region}"
    node_type: "${config.node_type}"
    master_username: "${config.master_username}"
    master_password: "{{ lookup('env', 'REDSHIFT_MASTER_PASSWORD') | default('${config.master_password}', true) }}" # Mejor usar vault o variable de entorno
    db_name: "${config.db_name || 'dev'}"
    cluster_type: "${config.cluster_type}"
    number_of_nodes: ${config.number_of_nodes || (config.cluster_type === 'multi-node' ? 2 : 1)}
    iam_roles_list: [${iamRolesArray}]
    publicly_accessible_val: ${config.publicly_accessible || false}
    vpc_security_group_ids_list: [${vpcSecurityGroupIdsArray}]
    redshift_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Cluster Redshift
      community.aws.redshift_cluster:
        cluster_identifier: "{{ cluster_identifier }}"
        region: "{{ aws_region }}"
        state: present
        node_type: "{{ node_type }}"
        master_username: "{{ master_username }}"
        master_password: "{{ master_password }}"
        db_name: "{{ db_name }}"
        cluster_type: "{{ cluster_type }}"
        number_of_nodes: "{{ number_of_nodes if cluster_type == 'multi-node' else omit }}"
        iam_roles: "{{ iam_roles_list | default(omit) if iam_roles_list | length > 0 else omit }}"
        publicly_accessible: "{{ publicly_accessible_val }}"
        vpc_security_group_ids: "{{ vpc_security_group_ids_list | default(omit) if vpc_security_group_ids_list | length > 0 else omit }}"
        # cluster_subnet_group_name: "my-redshift-subnet-group"
        # cluster_parameter_group_name: "my-redshift-parameter-group"
        skip_final_snapshot: yes
        tags: "{{ redshift_tags }}"
      register: redshift_cluster_info

    - name: Mostrar información del Cluster Redshift
      ansible.builtin.debug:
        var: redshift_cluster_info
`,
    cloudformation
  };
}
