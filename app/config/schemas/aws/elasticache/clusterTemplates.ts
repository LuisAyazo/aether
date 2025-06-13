import { AWSElastiCacheClusterConfig } from './cluster'; // Asumiremos que este tipo se definirá en cluster.ts
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

export function generateAWSElastiCacheClusterTemplates(config: AWSElastiCacheClusterConfig): CodeTemplate {
  const terraformResourceName = config.cluster_id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.cluster_id.replace(/-/g, '');

  const parsedTags = {
    Name: config.cluster_id,
    ...parseTagsString(config.tags as string | undefined),
  };
  
  const securityGroupIdsArray = config.security_group_ids ? (config.security_group_ids as string).split(',').map(s => `"${s.trim()}"`).join(', ') : '';

  const terraform = `
# Plantilla de Terraform para un Cluster ElastiCache de AWS (${config.engine})
provider "aws" {
  region = "${config.region}"
}

# (Opcional pero recomendado) Recurso para el Grupo de Subredes de ElastiCache
# resource "aws_elasticache_subnet_group" "${terraformResourceName}_sng" {
#   name       = "${config.subnet_group_name || `${terraformResourceName}-sng`}"
#   subnet_ids = ["subnet-xxxxxxxx", "subnet-yyyyyyyy"] # Reemplazar con IDs de subred válidos
#   description = "Subnet group for ElastiCache cluster ${config.cluster_id}"
# }

resource "aws_elasticache_cluster" "${terraformResourceName}" {
  cluster_id           = "${config.cluster_id}"
  engine               = "${config.engine}"
  node_type            = "${config.node_type}"
  num_cache_nodes      = ${config.num_cache_nodes}
  ${config.engine_version ? `engine_version         = "${config.engine_version}"` : ''}
  ${config.parameter_group_name ? `parameter_group_name = "${config.parameter_group_name}"` : `parameter_group_name = "default.${config.engine}${config.engine_version ? config.engine_version.split('.').slice(0,2).join('.') : (config.engine === 'redis' ? '6.x' : '1.6')}"`}
  ${config.subnet_group_name ? `subnet_group_name    = "${config.subnet_group_name}"` : ''} # O referenciar aws_elasticache_subnet_group.sng.name
  ${config.security_group_ids ? `security_group_ids   = [${securityGroupIdsArray}]` : ''}
  ${config.port ? `port                   = ${config.port}` : ''}

  # Específico para Redis
  ${config.engine === 'redis' && config.snapshot_retention_limit !== undefined ? `snapshot_retention_limit = ${config.snapshot_retention_limit}` : ''}
  ${config.engine === 'redis' && config.snapshot_window ? `snapshot_window        = "${config.snapshot_window}"` : ''}
  # (Opcional para Redis Cluster Mode Enabled)
  # num_node_groups          = 1 # Si se usa Redis (cluster mode enabled) y num_cache_nodes es el número de shards
  # replicas_per_node_group  = 1 # Si se usa Redis (cluster mode enabled)

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Cluster ElastiCache de AWS (${config.engine})
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// (Opcional pero recomendado) Crear un Grupo de Subredes de ElastiCache
// const cacheSubnetGroup = new aws.elasticache.SubnetGroup("${pulumiResourceName}Sng", {
//     name: "${config.subnet_group_name || `${pulumiResourceName}-sng`}",
//     subnetIds: ["subnet-xxxxxxxx", "subnet-yyyyyyyy"], // Reemplazar con IDs de subred válidos
// });

const ${pulumiResourceName}Cluster = new aws.elasticache.Cluster("${pulumiResourceName}", {
    clusterId: "${config.cluster_id}",
    engine: "${config.engine}",
    nodeType: "${config.node_type}",
    numCacheNodes: ${config.num_cache_nodes},
    ${config.engine_version ? `engineVersion: "${config.engine_version}",` : ''}
    ${config.parameter_group_name ? `parameterGroupName: "${config.parameter_group_name}",` : `parameterGroupName: "default.${config.engine}${config.engine_version ? config.engine_version.split('.').slice(0,2).join('.') : (config.engine === 'redis' ? '6.x' : '1.6')}",`}
    ${config.subnet_group_name ? `subnetGroupName: "${config.subnet_group_name}",` : ''} // O cacheSubnetGroup.name
    ${config.security_group_ids ? `securityGroupIds: [${securityGroupIdsArray}],` : ''}
    ${config.port ? `port: ${config.port},` : ''}
    region: "${config.region}",

    // Específico para Redis
    ${config.engine === 'redis' && config.snapshot_retention_limit !== undefined ? `snapshotRetentionLimit: ${config.snapshot_retention_limit},` : ''}
    ${config.engine === 'redis' && config.snapshot_window ? `snapshotWindow: "${config.snapshot_window}",` : ''}

    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const clusterAddress = ${pulumiResourceName}Cluster.cacheNodes.apply(nodes => nodes[0].address);
export const clusterPort = ${pulumiResourceName}Cluster.cacheNodes.apply(nodes => nodes[0].port);
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Cluster ElastiCache (${config.engine})
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un cluster ElastiCache ${config.engine} llamado ${config.cluster_id}
  en la región ${config.region}.

Parameters:
  ClusterId:
    Type: String
    Default: "${config.cluster_id}"
  Engine:
    Type: String
    Default: "${config.engine}"
    AllowedValues: [redis, memcached]
  NodeType:
    Type: String
    Default: "${config.node_type}"
  NumCacheNodes:
    Type: Number
    Default: ${config.num_cache_nodes}
  EngineVersion:
    Type: String
    Default: "${config.engine_version || ''}" # Dejar vacío para default de AWS
  ParameterGroupName:
    Type: String
    Default: "${config.parameter_group_name || `default.${config.engine}${config.engine_version ? config.engine_version.split('.').slice(0,2).join('.') : (config.engine === 'redis' ? '6.x' : '1.6')}`}"
  SubnetGroupName: # Requerido para VPC
    Type: String
    Default: "${config.subnet_group_name || ''}"
  SecurityGroupIds:
    Type: CommaDelimitedList
    Default: "${config.security_group_ids || ''}"
  CachePort:
    Type: Number
    Default: ${config.port || (config.engine === 'redis' ? 6379 : 11211)}
  SnapshotRetentionLimit: # Solo Redis
    Type: Number
    Default: ${config.snapshot_retention_limit === undefined && config.engine === 'redis' ? 0 : config.snapshot_retention_limit || 0}
  SnapshotWindow: # Solo Redis
    Type: String
    Default: "${config.snapshot_window || '04:00-05:00'}"


Conditions:
  IsRedis: !Equals [!Ref Engine, "redis"]
  HasSecurityGroups: !Not [!Equals [!Join ["", !Ref SecurityGroupIds], ""]]
  HasSubnetGroup: !Not [!Equals [!Ref SubnetGroupName, ""]]

Resources:
  # (Opcional pero recomendado) ElastiCache Subnet Group
  # MyCacheSubnetGroup:
  #   Type: AWS::ElastiCache::SubnetGroup
  #   Condition: HasSubnetGroup
  #   Properties:
  #     Description: "Subnet group for ElastiCache"
  #     SubnetGroupName: !Ref SubnetGroupName
  #     SubnetIds: ["subnet-xxxxxxxx", "subnet-yyyyyyyy"] # Reemplazar

  ${pulumiResourceName}ElastiCacheCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      ClusterName: !Ref ClusterId # Para Memcached, ClusterId es el nombre. Para Redis, es el ReplicationGroupId si es un clúster.
      Engine: !Ref Engine
      CacheNodeType: !Ref NodeType
      NumCacheNodes: !Ref NumCacheNodes
      EngineVersion: !If [!Equals [!Ref EngineVersion, ""], !Ref "AWS::NoValue", !Ref EngineVersion]
      CacheParameterGroupName: !Ref ParameterGroupName
      CacheSubnetGroupName: !If [HasSubnetGroup, !Ref SubnetGroupName, !Ref "AWS::NoValue"]
      VpcSecurityGroupIds: !If [HasSecurityGroups, !Ref SecurityGroupIds, !Ref "AWS::NoValue"]
      Port: !Ref CachePort
      SnapshotRetentionLimit: !If [IsRedis, !Ref SnapshotRetentionLimit, !Ref "AWS::NoValue"]
      SnapshotWindow: !If [IsRedis, !Ref SnapshotWindow, !Ref "AWS::NoValue"]
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}

Outputs:
  ClusterEndpointAddress:
    Description: Endpoint address of the ElastiCache cluster
    Value: !GetAtt ${pulumiResourceName}ElastiCacheCluster.${config.engine === 'redis' ? 'RedisEndpoint.Address' : 'ConfigurationEndpoint.Address'}
  ClusterEndpointPort:
    Description: Endpoint port of the ElastiCache cluster
    Value: !GetAtt ${pulumiResourceName}ElastiCacheCluster.${config.engine === 'redis' ? 'RedisEndpoint.Port' : 'ConfigurationEndpoint.Port'}
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS ElastiCache Cluster (${config.engine}) (requiere community.aws.elasticache_cluster)
- name: Gestionar Cluster ElastiCache ${config.cluster_id}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    cluster_id: "${config.cluster_id}"
    aws_region: "${config.region}"
    engine: "${config.engine}"
    node_type: "${config.node_type}"
    num_nodes: ${config.num_cache_nodes}
    engine_version_val: "${config.engine_version || ''}"
    parameter_group: "${config.parameter_group_name || `default.${config.engine}${config.engine_version ? config.engine_version.split('.').slice(0,2).join('.') : (config.engine === 'redis' ? '6.x' : '1.6')}`}"
    subnet_group: "${config.subnet_group_name || ''}"
    security_groups_list: [${securityGroupIdsArray}]
    cache_port: ${config.port || (config.engine === 'redis' ? 6379 : 11211)}
    # Redis specific
    snapshot_retention: ${config.snapshot_retention_limit === undefined && config.engine === 'redis' ? 0 : config.snapshot_retention_limit || 0}
    snapshot_window_val: "${config.snapshot_window || '04:00-05:00'}"
    
    cache_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    # - name: Asegurar que el grupo de subredes ElastiCache exista
    #   community.aws.elasticache_subnet_group:
    #     name: "{{ subnet_group }}"
    #     description: "Subnet group for ElastiCache cluster {{ cluster_id }}"
    #     region: "{{ aws_region }}"
    #     subnets:
    #       - subnet-xxxxxxxx # Reemplazar
    #       - subnet-yyyyyyyy # Reemplazar
    #     state: present
    #   when: subnet_group | length > 0

    - name: Crear o actualizar Cluster ElastiCache
      community.aws.elasticache_cluster:
        name: "{{ cluster_id }}" # Para Redis, esto es el ReplicationGroupId si es un clúster
        state: present
        region: "{{ aws_region }}"
        engine: "{{ engine }}"
        cache_node_type: "{{ node_type }}"
        num_cache_nodes: "{{ num_nodes }}"
        engine_version: "{{ engine_version_val | default(omit) }}"
        cache_parameter_group: "{{ parameter_group }}"
        cache_subnet_group: "{{ subnet_group | default(omit) }}"
        security_group_ids: "{{ security_groups_list | default(omit) if security_groups_list | length > 0 else omit }}"
        port: "{{ cache_port }}"
        # Redis specific
        snapshot_retention_limit: "{{ snapshot_retention if engine == 'redis' else omit }}"
        snapshot_window: "{{ snapshot_window_val if engine == 'redis' else omit }}"
        tags: "{{ cache_tags }}"
      register: elasticache_info

    - name: Mostrar información del Cluster ElastiCache
      ansible.builtin.debug:
        var: elasticache_info
`,
    cloudformation
  };
}
