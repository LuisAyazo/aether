import { AWSEKSClusterConfig } from './cluster'; // Asumiremos que este tipo se definirá en cluster.ts
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

export function generateAWSEKSClusterTemplates(config: AWSEKSClusterConfig): CodeTemplate {
  const terraformResourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.name.replace(/-/g, '');

  const parsedTags = {
    Name: config.name,
    ...parseTagsString(config.tags as string | undefined),
  };

  const vpcSubnetIdsArray = config.vpc_config_subnet_ids ? (config.vpc_config_subnet_ids as string).split(',').map(s => `"${s.trim()}"`).join(', ') : '';
  const vpcSecurityGroupIdsArray = config.vpc_config_security_group_ids ? (config.vpc_config_security_group_ids as string).split(',').map(sg => `"${sg.trim()}"`).join(', ') : '';
  const nodeGroupInstanceTypesArray = config.node_group_instance_types ? (config.node_group_instance_types as string).split(',').map(it => `"${it.trim()}"`).join(', ') : '["t3.medium"]';


  const terraformNodeGroupBlock = config.create_node_group
    ? `
resource "aws_eks_node_group" "${terraformResourceName}_ng" {
  cluster_name    = aws_eks_cluster.${terraformResourceName}.name
  node_group_name = "${config.node_group_name || `${terraformResourceName}-ng`}"
  node_role_arn   = "${config.node_role_arn}" # Reemplazar con el ARN del rol IAM para nodos EKS
  subnet_ids      = [${vpcSubnetIdsArray}] # Usar las mismas subredes del cluster o subredes dedicadas para nodos

  instance_types = [${nodeGroupInstanceTypesArray}]
  
  scaling_config {
    desired_size = ${config.node_group_desired_size || 1}
    max_size     = ${config.node_group_max_size || 2}
    min_size     = ${config.node_group_min_size || 1}
  }

  # (Opcional) Actualizar configuración para el grupo de nodos
  # update_config {
  #   max_unavailable = 1 # o max_unavailable_percentage
  # }

  depends_on = [aws_eks_cluster.${terraformResourceName}]

  tags = {
    Name = "${config.node_group_name || `${terraformResourceName}-ng`}"
    # ... otros tags para el node group
  }
}
`
    : '';
    
  const pulumiNodeGroupBlock = config.create_node_group
    ? `
// (Opcional) Crear un Grupo de Nodos Gestionado por EKS
const ${pulumiResourceName}NodeGroup = new aws.eks.NodeGroup("${pulumiResourceName}Ng", {
    clusterName: ${pulumiResourceName}Cluster.name,
    nodeGroupName: "${config.node_group_name || `${pulumiResourceName}-ng`}",
    nodeRoleArn: "${config.node_role_arn}", // Reemplazar con el ARN del rol IAM para nodos EKS
    subnetIds: [${vpcSubnetIdsArray}], // Usar las mismas subredes del cluster o subredes dedicadas para nodos
    instanceTypes: [${nodeGroupInstanceTypesArray}],
    scalingConfig: {
        desiredSize: ${config.node_group_desired_size || 1},
        maxSize: ${config.node_group_max_size || 2},
        minSize: ${config.node_group_min_size || 1},
    },
    tags: {
        Name: "${config.node_group_name || `${pulumiResourceName}-ng`}",
        // ... otros tags
    },
}, { dependsOn: [${pulumiResourceName}Cluster] });
`
    : '';

  const terraform = `
# Plantilla de Terraform para un Cluster EKS de AWS
provider "aws" {
  region = "${config.region}"
}

# Recurso para el Cluster EKS
resource "aws_eks_cluster" "${terraformResourceName}" {
  name     = "${config.name}"
  role_arn = "${config.role_arn}" # ARN del Rol IAM para el Cluster EKS
  ${config.kubernetes_version ? `version  = "${config.kubernetes_version}"` : ''}

  vpc_config {
    subnet_ids              = [${vpcSubnetIdsArray}] # Lista de IDs de subred
    ${config.vpc_config_security_group_ids ? `security_group_ids      = [${vpcSecurityGroupIdsArray}]` : ''}
    # endpoint_private_access = false # Opcional
    # endpoint_public_access  = true  # Opcional
    # public_access_cidrs     = ["0.0.0.0/0"] # Opcional
  }

  # (Opcional) Habilitar logging del plano de control
  # enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }

  # Asegurarse de que el rol IAM y la política de VPC CNI estén listos
  # depends_on = [aws_iam_role_policy_attachment.example_cluster_AmazonEKSClusterPolicy]
}

# (Opcional) Grupo de Nodos Gestionado por EKS
${terraformNodeGroupBlock}

# NOTA: Se requieren roles IAM y políticas preconfiguradas para EKS.
# Ejemplo de Rol IAM para el Cluster (simplificado):
# resource "aws_iam_role" "eks_cluster_role" {
#   name = "eks-cluster-role-\${random_id.id.hex}"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Action = "sts:AssumeRole"
#       Effect = "Allow"
#       Principal = { Service = "eks.amazonaws.com" }
#     }]
#   })
# }
# resource "aws_iam_role_policy_attachment" "eks_cluster_AmazonEKSClusterPolicy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
#   role       = aws_iam_role.eks_cluster_role.name
# }
# Ejemplo de Rol IAM para Nodos (simplificado):
# resource "aws_iam_role" "eks_node_role" {
#   name = "eks-node-role-\${random_id.id.hex}"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Action = "sts:AssumeRole"
#       Effect = "Allow"
#       Principal = { Service = "ec2.amazonaws.com" }
#     }]
#   })
# }
# resource "aws_iam_role_policy_attachment" "eks_node_AmazonEKSWorkerNodePolicy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
#   role       = aws_iam_role.eks_node_role.name
# }
# resource "aws_iam_role_policy_attachment" "eks_node_AmazonEC2ContainerRegistryReadOnly" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
#   role       = aws_iam_role.eks_node_role.name
# }
# resource "aws_iam_role_policy_attachment" "eks_node_AmazonEKS_CNI_Policy" {
#  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy" # Asegúrate que esta política exista o créala
#  role       = aws_iam_role.eks_node_role.name
# }

# (Opcional) Salida del endpoint del servidor API del cluster
output "${terraformResourceName}_endpoint" {
  value = aws_eks_cluster.${terraformResourceName}.endpoint
}
output "${terraformResourceName}_certificate_authority_data" {
  value = aws_eks_cluster.${terraformResourceName}.certificate_authority[0].data
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Cluster EKS de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks"; // Paquete EKS de Pulumi de alto nivel

// NOTA: Se requieren roles IAM y políticas preconfiguradas para EKS.
// Pulumi EKS puede crear estos roles si no se proporcionan explícitamente.
// Ejemplo de Rol IAM para el Cluster (si se crea manualmente):
// const eksClusterRole = new aws.iam.Role("eksClusterRole", { ... });
// Ejemplo de Rol IAM para Nodos (si se crea manualmente):
// const eksNodeRole = new aws.iam.Role("eksNodeRole", { ... });

// Crear el Cluster EKS
const ${pulumiResourceName}Cluster = new eks.Cluster("${pulumiResourceName}", {
    name: "${config.name}",
    roleArn: "${config.role_arn}", // ARN del Rol IAM para el Cluster EKS
    ${config.kubernetes_version ? `version: "${config.kubernetes_version}",` : ''}
    
    vpcId: "vpc-xxxxxxxxxxxxxxxxx", // Reemplazar con el ID de tu VPC
    subnetIds: [${vpcSubnetIdsArray}], // Lista de IDs de subred
    ${config.vpc_config_security_group_ids ? `clusterSecurityGroup: new aws.ec2.SecurityGroup("${pulumiResourceName}-sg", { vpcId: "vpc-xxxxxxxxxxxxxxxxx", tags: {"Name": "${pulumiResourceName}-cluster-sg"} }),` : ''}
    // O referenciar SGs existentes:
    // clusterSecurityGroupIds: [${vpcSecurityGroupIdsArray}],
    
    // (Opcional) Habilitar logging del plano de control
    // clusterLogging: ["api", "audit"],

    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
    
    // Configuración del grupo de nodos por defecto (si se usa el paquete @pulumi/eks)
    // Si create_node_group es true, el paquete eks.Cluster crea uno por defecto.
    // Se pueden personalizar aquí o crear aws.eks.NodeGroup por separado.
    ${config.create_node_group ? `
    instanceType: "${(config.node_group_instance_types as string || "t3.medium").split(',')[0].trim()}", // Toma el primer tipo de instancia
    desiredCapacity: ${config.node_group_desired_size || 1},
    minSize: ${config.node_group_min_size || 1},
    maxSize: ${config.node_group_max_size || 2},
    nodeRoleArn: "${config.node_role_arn}", // Requerido si se personaliza el node group
    // createOidcProvider: true, // Recomendado para IAM Roles for Service Accounts (IRSA)
    ` : `skipDefaultNodeGroup: true,`}
});

// (Opcional) Grupo de Nodos Gestionado por EKS (si no se usa el default de eks.Cluster)
${config.create_node_group ? pulumiNodeGroupBlock : ''}

// Exportar el endpoint del servidor API del cluster y el kubeconfig
export const kubeconfig = ${pulumiResourceName}Cluster.kubeconfig;
export const clusterEndpoint = ${pulumiResourceName}Cluster.core.cluster.endpoint;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Cluster EKS
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un cluster EKS llamado ${config.name}
  en la región ${config.region}.

Parameters:
  ClusterName:
    Type: String
    Default: "${config.name}"
  EKSRoleArn:
    Type: String
    Default: "${config.role_arn}"
  EKSVpcSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Default: "${config.vpc_config_subnet_ids || ''}"
  EKSSecurityGroupIds: # Opcional
    Type: CommaDelimitedList
    Default: "${config.vpc_config_security_group_ids || ''}"
  KubernetesVersion:
    Type: String
    Default: "${config.kubernetes_version || ''}" # Dejar vacío para default de AWS

Resources:
  ${pulumiResourceName}EKSCluster:
    Type: AWS::EKS::Cluster
    Properties:
      Name: !Ref ClusterName
      RoleArn: !Ref EKSRoleArn
      Version: !If [HasK8sVersion, !Ref KubernetesVersion, !Ref "AWS::NoValue"]
      ResourcesVpcConfig:
        SubnetIds: !Ref EKSVpcSubnetIds
        SecurityGroupIds: !If [HasSecurityGroups, !Ref EKSSecurityGroupIds, !Ref "AWS::NoValue"]
        # EndpointPublicAccess: true # Opcional
        # EndpointPrivateAccess: false # Opcional
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}

  # (Opcional) Grupo de Nodos Gestionado por EKS
  # ${pulumiResourceName}NodeGroup:
  #   Type: AWS::EKS::Nodegroup
  #   Condition: CreateNodeGroupCondition # Definir condición si es opcional
  #   Properties:
  #     ClusterName: !Ref ClusterName
  #     NodegroupName: "${config.node_group_name || `${config.name}-ng`}"
  #     NodeRole: "${config.node_role_arn}"
  #     Subnets: !Ref EKSVpcSubnetIds # Usar las mismas subredes o dedicadas
  #     InstanceTypes: [${(config.node_group_instance_types || "t3.medium").split(',')[0].trim()}] # Simplificado
  #     ScalingConfig:
  #       MinSize: ${config.node_group_min_size || 1}
  #       MaxSize: ${config.node_group_max_size || 2}
  #       DesiredSize: ${config.node_group_desired_size || 1}
  #     Tags:
  #       Name: "${config.node_group_name || `${config.name}-ng`}"

Conditions:
  HasK8sVersion: !Not [!Equals [!Ref KubernetesVersion, ""]]
  HasSecurityGroups: !Not [!Equals [!Join ["", !Ref EKSSecurityGroupIds], ""]]
  # CreateNodeGroupCondition: !Equals ["${config.create_node_group}", "true"] # Ejemplo

Outputs:
  ClusterEndpoint:
    Description: Endpoint del servidor API del cluster EKS
    Value: !GetAtt ${pulumiResourceName}EKSCluster.Endpoint
  ClusterArn:
    Description: ARN del cluster EKS
    Value: !GetAtt ${pulumiResourceName}EKSCluster.Arn
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS EKS Cluster (requiere community.aws.eks_cluster y community.aws.eks_nodegroup)
- name: Gestionar Cluster EKS ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    cluster_name: "${config.name}"
    aws_region: "${config.region}"
    eks_role_arn: "${config.role_arn}"
    eks_version: "${config.kubernetes_version || ''}" # Omitir para default
    vpc_subnet_ids_list: [${vpcSubnetIdsArray}]
    vpc_security_group_ids_list: [${vpcSecurityGroupIdsArray}] # Puede ser omitido
    cluster_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

    # Node Group Vars (si create_node_group es true)
    create_nodegroup: ${config.create_node_group || false}
    nodegroup_name: "${config.node_group_name || `${config.name}-ng`}"
    node_role_arn_val: "${config.node_role_arn || ''}"
    nodegroup_instance_types_list: [${nodeGroupInstanceTypesArray}]
    nodegroup_min: ${config.node_group_min_size || 1}
    nodegroup_max: ${config.node_group_max_size || 2}
    nodegroup_desired: ${config.node_group_desired_size || 1}

  tasks:
    - name: Crear o actualizar Cluster EKS
      community.aws.eks_cluster:
        name: "{{ cluster_name }}"
        region: "{{ aws_region }}"
        state: present
        role_arn: "{{ eks_role_arn }}"
        version: "{{ eks_version | default(omit) }}"
        vpc_config:
          subnet_ids: "{{ vpc_subnet_ids_list }}"
          security_group_ids: "{{ vpc_security_group_ids_list | default(omit) if vpc_security_group_ids_list | length > 0 else omit }}"
        tags: "{{ cluster_tags }}"
      register: eks_cluster_info

    - name: Crear o actualizar Grupo de Nodos Gestionado EKS
      community.aws.eks_nodegroup:
        cluster_name: "{{ cluster_name }}"
        nodegroup_name: "{{ nodegroup_name }}"
        region: "{{ aws_region }}"
        state: present
        node_role: "{{ node_role_arn_val }}"
        subnets: "{{ vpc_subnet_ids_list }}" # Usar las mismas subredes o dedicadas
        instance_types: "{{ nodegroup_instance_types_list }}"
        scaling_config:
          min_size: "{{ nodegroup_min }}"
          max_size: "{{ nodegroup_max }}"
          desired_size: "{{ nodegroup_desired }}"
        tags:
          Name: "{{ nodegroup_name }}"
      when: create_nodegroup
      register: eks_nodegroup_info

    - name: Mostrar información del Cluster EKS
      ansible.builtin.debug:
        var: eks_cluster_info.cluster
`,
    cloudformation
  };
}
