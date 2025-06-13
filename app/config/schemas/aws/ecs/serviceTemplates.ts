import { AWSECSServiceConfig } from './service'; // Asumiremos que este tipo se definirá en service.ts
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

export function generateAWSECSServiceTemplates(config: AWSECSServiceConfig): CodeTemplate {
  const terraformResourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.name.replace(/-/g, '');

  const parsedTags = {
    Name: config.name,
    ...parseTagsString(config.tags as string | undefined),
  };

  const fargateSubnetsArray = config.fargate_subnets ? (config.fargate_subnets as string).split(',').map(s => `"${s.trim()}"`).join(', ') : '';
  const fargateSecurityGroupsArray = config.fargate_security_groups ? (config.fargate_security_groups as string).split(',').map(sg => `"${sg.trim()}"`).join(', ') : '';
  
  const fargateAssignPublicIpString = typeof config.fargate_assign_public_ip === 'boolean' 
    ? (config.fargate_assign_public_ip ? '"ENABLED"' : '"DISABLED"') 
    : `"${(config.fargate_assign_public_ip || 'DISABLED').toUpperCase()}"`; // Default a DISABLED si es undefined o string

  const loadBalancerBlockTerraform = config.load_balancer_target_group_arn && config.load_balancer_container_name && config.load_balancer_container_port
    ? `
  load_balancer {
    target_group_arn = "${config.load_balancer_target_group_arn}"
    container_name   = "${config.load_balancer_container_name}"
    container_port   = ${config.load_balancer_container_port}
  }
` : '';

  const loadBalancerBlockPulumi = config.load_balancer_target_group_arn && config.load_balancer_container_name && config.load_balancer_container_port
    ? `
    loadBalancers: [{
        targetGroupArn: "${config.load_balancer_target_group_arn}",
        containerName: "${config.load_balancer_container_name}",
        containerPort: ${config.load_balancer_container_port},
    }],
` : '';
  
  const networkConfigurationBlockTerraform = config.launch_type === 'FARGATE' && config.fargate_subnets
    ? `
  network_configuration {
    subnets          = [${fargateSubnetsArray}]
    ${config.fargate_security_groups ? `security_groups  = [${fargateSecurityGroupsArray}]` : ''}
    assign_public_ip = ${fargateAssignPublicIpString === '"ENABLED"'} # Terraform espera un booleano
  }
` : '';

const networkConfigurationBlockPulumi = config.launch_type === 'FARGATE' && config.fargate_subnets
    ? `
    networkConfiguration: {
        subnets: [${fargateSubnetsArray}],
        ${config.fargate_security_groups ? `securityGroups: [${fargateSecurityGroupsArray}],` : ''}
        assignPublicIp: ${fargateAssignPublicIpString === '"ENABLED"'}, // Pulumi espera un booleano
    },
` : '';


  const terraform = `
# Plantilla de Terraform para un Servicio ECS de AWS
provider "aws" {
  region = "${config.region}"
}

# Recurso para el Servicio ECS
resource "aws_ecs_service" "${terraformResourceName}" {
  name            = "${config.name}"
  cluster         = "${config.cluster_name}" # Nombre o ARN del cluster ECS
  task_definition = "${config.task_definition_arn}" # ARN de la Task Definition (family:revision)
  desired_count   = ${config.desired_count}

  ${config.launch_type ? `launch_type     = "${config.launch_type}"` : ''}

  # Configuración de red (requerida para FARGATE)
${networkConfigurationBlockTerraform}

  # Configuración del Load Balancer (opcional)
${loadBalancerBlockTerraform}

  # (Opcional) Estrategia de despliegue
  # deployment_controller {
  #   type = "ECS" # o "CODE_DEPLOY" o "EXTERNAL"
  # }
  # ordered_placement_strategy {
  #   type  = "spread"
  #   field = "attribute:ecs.availability-zone"
  # }

  # (Opcional) Service Discovery (Cloud Map)
  # service_registries {
  #   registry_arn = aws_service_discovery_service.example.arn
  # }

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }

  # Ignorar cambios en desired_count si se gestiona por políticas de escalado
  # lifecycle {
  #   ignore_changes = [desired_count]
  # }
}

# NOTA: Se requiere un Cluster ECS y una Task Definition existentes.
# Ejemplo de Cluster ECS (si no existe):
# resource "aws_ecs_cluster" "example_cluster" {
#   name = "${config.cluster_name}"
# }
# Ejemplo de Task Definition (si no existe):
# resource "aws_ecs_task_definition" "example_task" {
#   family                   = "my-app-task"
#   cpu                      = "256"
#   memory                   = "512"
#   network_mode             = "awsvpc" # Requerido para Fargate
#   requires_compatibilities = ["FARGATE"] # O ["EC2"]
#   execution_role_arn       = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" # Rol de ejecución de tareas ECS
#   container_definitions    = jsonencode([
#     {
#       name      = "my-app-container"
#       image     = "nginx:latest"
#       cpu       = 256
#       memory    = 512
#       essential = true
#       portMappings = [
#         {
#           containerPort = 80
#           hostPort      = 80
#         }
#       ]
#     }
#   ])
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Servicio ECS de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// NOTA: Se requiere un Cluster ECS y una Task Definition existentes.
// Ejemplo de Cluster ECS (si no existe):
// const cluster = new aws.ecs.Cluster("exampleCluster", { name: "${config.cluster_name}" });
// Ejemplo de Task Definition (si no existe):
// const taskDefinition = new aws.ecs.TaskDefinition("exampleTask", {
//     family: "my-app-task",
//     cpu: "256",
//     memory: "512",
//     networkMode: "awsvpc", // Requerido para Fargate
//     requiresCompatibilities: ["FARGATE"], // O ["EC2"]
//     executionRoleArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
//     containerDefinitions: JSON.stringify([{
//         name: "my-app-container",
//         image: "nginx:latest",
//         cpu: 256,
//         memory: 512,
//         essential: true,
//         portMappings: [{ containerPort: 80, hostPort: 80 }],
//     }]),
// });

// Crear el Servicio ECS
const ${pulumiResourceName}Service = new aws.ecs.Service("${pulumiResourceName}", {
    name: "${config.name}",
    cluster: "${config.cluster_name}", // Referencia al ARN o nombre del cluster
    taskDefinition: "${config.task_definition_arn}", // Referencia al ARN de la Task Definition
    desiredCount: ${config.desired_count},
    region: "${config.region}",

    ${config.launch_type ? `launchType: "${config.launch_type}",` : ''}

    // Configuración de red (requerida para FARGATE)
${networkConfigurationBlockPulumi}

    // Configuración del Load Balancer (opcional)
${loadBalancerBlockPulumi}

    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

// Exportar el nombre del servicio ECS
export const ecsServiceName = ${pulumiResourceName}Service.name;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Servicio ECS
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un servicio ECS llamado ${config.name}
  en el cluster ${config.cluster_name} en la región ${config.region}.

Parameters:
  ServiceName:
    Type: String
    Default: "${config.name}"
  ClusterName:
    Type: String
    Default: "${config.cluster_name}"
    Description: "Nombre o ARN del cluster ECS."
  TaskDefinitionArn:
    Type: String
    Default: "${config.task_definition_arn}"
    Description: "ARN de la Task Definition (family:revision)."
  DesiredCount:
    Type: Number
    Default: ${config.desired_count}
  LaunchType:
    Type: String
    Default: "${config.launch_type || ''}" # Dejar vacío para usar el default del cluster
    AllowedValues: ["", "EC2", "FARGATE"]
  FargateSubnets:
    Type: CommaDelimitedList
    Default: "${config.fargate_subnets || ''}"
    Description: "Requerido si LaunchType es FARGATE. Lista de IDs de subred."
  FargateSecurityGroups:
    Type: CommaDelimitedList
    Default: "${config.fargate_security_groups || ''}"
    Description: "Opcional si LaunchType es FARGATE. Lista de IDs de grupos de seguridad."
  FargateAssignPublicIp:
    Type: String
    Default: "${typeof config.fargate_assign_public_ip === 'boolean' ? (config.fargate_assign_public_ip ? 'ENABLED' : 'DISABLED') : (config.fargate_assign_public_ip || 'DISABLED').toUpperCase()}"
    AllowedValues: ["ENABLED", "DISABLED"]
  LoadBalancerTargetGroupArn:
    Type: String
    Default: "${config.load_balancer_target_group_arn || ''}"
  LoadBalancerContainerName:
    Type: String
    Default: "${config.load_balancer_container_name || ''}"
  LoadBalancerContainerPort:
    Type: Number
    Default: ${config.load_balancer_container_port || 80} # Asumir 80 si no se provee

Conditions:
  IsFargate: !Equals [!Ref LaunchType, "FARGATE"]
  HasLoadBalancer: !Not [!Equals [!Ref LoadBalancerTargetGroupArn, ""]]

Resources:
  ${pulumiResourceName}ECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: !Ref ServiceName
      Cluster: !Ref ClusterName
      TaskDefinition: !Ref TaskDefinitionArn
      DesiredCount: !Ref DesiredCount
      LaunchType: !If [!Equals [!Ref LaunchType, ""], !Ref "AWS::NoValue", !Ref LaunchType]
      NetworkConfiguration: !If 
        - IsFargate
        - AwsVpcConfiguration:
            Subnets: !Ref FargateSubnets
            SecurityGroups: !If [!Equals [!Join ["", !Ref FargateSecurityGroups], ""], !Ref "AWS::NoValue", !Ref FargateSecurityGroups]
            AssignPublicIp: !Ref FargateAssignPublicIp
        - !Ref "AWS::NoValue"
      LoadBalancers: !If
        - HasLoadBalancer
        - - TargetGroupArn: !Ref LoadBalancerTargetGroupArn
            ContainerName: !Ref LoadBalancerContainerName
            ContainerPort: !Ref LoadBalancerContainerPort
        - !Ref "AWS::NoValue"
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}
      # DeploymentConfiguration: # Opcional
      # ServiceRegistries: # Opcional

Outputs:
  ServiceNameOutput:
    Description: Nombre del Servicio ECS creado
    Value: !GetAtt ${pulumiResourceName}ECSService.Name
  ServiceArnOutput:
    Description: ARN del Servicio ECS creado
    Value: !Ref ${pulumiResourceName}ECSService
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS ECS Service (requiere community.aws.ecs_service)
- name: Gestionar Servicio ECS ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    service_name: "${config.name}"
    aws_region: "${config.region}"
    cluster_name: "${config.cluster_name}"
    task_definition_arn: "${config.task_definition_arn}"
    desired_task_count: ${config.desired_count}
    launch_type_ecs: "${config.launch_type || ''}" # Omitir si no se especifica

    # Fargate vars (solo si launch_type_ecs es 'FARGATE')
    fargate_subnets_list: [${fargateSubnetsArray}]
    fargate_security_groups_list: [${fargateSecurityGroupsArray}]
    fargate_assign_public_ip_val: "${typeof config.fargate_assign_public_ip === 'boolean' ? (config.fargate_assign_public_ip ? 'ENABLED' : 'DISABLED') : (config.fargate_assign_public_ip || 'DISABLED').toUpperCase()}"
    
    # Load Balancer vars
    lb_target_group_arn: "${config.load_balancer_target_group_arn || ''}"
    lb_container_name: "${config.load_balancer_container_name || ''}"
    lb_container_port: ${config.load_balancer_container_port || 80}

    ecs_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Servicio ECS
      community.aws.ecs_service:
        name: "{{ service_name }}"
        cluster: "{{ cluster_name }}"
        task_definition: "{{ task_definition_arn }}"
        desired_count: "{{ desired_task_count }}"
        launch_type: "{{ launch_type_ecs | default(omit) }}"
        region: "{{ aws_region }}"
        state: present
        
        network_configuration: "{{ { aws_vpc_configuration: { subnets: fargate_subnets_list, security_groups: fargate_security_groups_list | default(omit), assign_public_ip: fargate_assign_public_ip_val } } if launch_type_ecs == 'FARGATE' and fargate_subnets_list | length > 0 else omit }}"
        
        load_balancers: "{{ [ { target_group_arn: lb_target_group_arn, container_name: lb_container_name, container_port: lb_container_port } ] if lb_target_group_arn else omit }}"
        
        tags: "{{ ecs_tags }}"
      register: ecs_service_info

    - name: Mostrar información del Servicio ECS
      ansible.builtin.debug:
        var: ecs_service_info
`,
    cloudformation
  };
}
