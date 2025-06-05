import { AWSAutoScalingGroupConfig } from './group'; // Asumiremos que este tipo se definirá en group.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

// Helper function to parse tags from string "K1=V1,propagate_at_launch=true;K2=V2,propagate_at_launch=false"
interface ParsedTag {
  key: string;
  value: string;
  propagate_at_launch: boolean;
}

const parseAsgTags = (tagsString?: string): ParsedTag[] => {
  if (!tagsString) return [];
  return tagsString.split(';').map(tagDef => {
    const parts = tagDef.split(',');
    const kvPair = parts[0];
    const propLaunchPart = parts.find(p => p.startsWith('propagate_at_launch='));
    
    const [key, value] = kvPair.split('=');
    let propagate_at_launch = true; // Default to true if not specified
    if (propLaunchPart) {
      propagate_at_launch = propLaunchPart.split('=')[1] === 'true';
    }
    
    if (key && value) {
      return { key: key.trim(), value: value.trim(), propagate_at_launch };
    }
    return null;
  }).filter(tag => tag !== null) as ParsedTag[];
};


export function generateAWSAutoScalingGroupTemplates(config: AWSAutoScalingGroupConfig): CodeTemplate {
  const terraformResourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.name.replace(/-/g, '');

  const parsedAsgTags = parseAsgTags(config.tags as string | undefined);
  const subnetsArray = config.vpc_zone_identifier ? (config.vpc_zone_identifier as string).split(',').map(s => `"${s.trim()}"`).join(', ') : '';
  const targetGroupArnsArray = config.target_group_arns ? (config.target_group_arns as string).split(',').map(arn => `"${arn.trim()}"`).join(', ') : '';

  // Para CloudFormation Defaults
  const cfVpcZoneIdentifiersDefault = config.vpc_zone_identifier ? (config.vpc_zone_identifier as string).split(',').map(s => s.trim()).join(',') : '';
  const cfTargetGroupArnsDefault = config.target_group_arns ? (config.target_group_arns as string).split(',').map(arn => arn.trim()).join(',') : '';

  const launchConfigSourceTerraform = config.launch_configuration_name 
    ? `launch_configuration = "${config.launch_configuration_name}"`
    : config.launch_template_id
    ? `launch_template {\n    id      = "${config.launch_template_id}"\n    # version = "$Latest" # Opcional\n  }`
    : config.launch_template_name
    ? `launch_template {\n    name    = "${config.launch_template_name}"\n    # version = "$Latest" # Opcional\n  }`
    : `# ERROR: Debe especificar launch_configuration_name o launch_template_id/name`;

  const launchConfigSourcePulumi = config.launch_configuration_name
    ? `launchConfiguration: "${config.launch_configuration_name}",`
    : config.launch_template_id
    ? `launchTemplate: { id: "${config.launch_template_id}" /* version: "$Latest" */ },`
    : config.launch_template_name
    ? `launchTemplate: { name: "${config.launch_template_name}" /* version: "$Latest" */ },`
    : `// ERROR: Debe especificar launchConfiguration o launchTemplate`;
    
  const terraformTagsBlock = parsedAsgTags.map(tag => 
    `  tag {\n    key                 = "${tag.key}"\n    value               = "${tag.value}"\n    propagate_at_launch = ${tag.propagate_at_launch}\n  }`
  ).join('\n');


  const terraform = `
# Plantilla de Terraform para un Auto Scaling Group de AWS
provider "aws" {
  region = "${config.region}"
}

# Recurso para el Auto Scaling Group
resource "aws_autoscaling_group" "${terraformResourceName}" {
  name                      = "${config.name}"
  min_size                  = ${config.min_size}
  max_size                  = ${config.max_size}
  ${config.desired_capacity ? `desired_capacity          = ${config.desired_capacity}`: ''}
  
  # Especificar Launch Configuration o Launch Template
  ${launchConfigSourceTerraform}

  vpc_zone_identifier       = [${subnetsArray}] # Lista de IDs de subred

  # (Opcional) ARNs de Target Groups de ELB
  ${config.target_group_arns ? `target_group_arns         = [${targetGroupArnsArray}]` : ''}

  health_check_type         = "${config.health_check_type || 'EC2'}"
  health_check_grace_period = ${config.health_check_grace_period || 300}

  # Tags para el Auto Scaling Group y sus instancias
${terraformTagsBlock}

  # (Opcional) Políticas de escalado
  # Ejemplo: Escalar basado en CPU
  # resource "aws_autoscaling_policy" "${terraformResourceName}_cpu_scaling_up" {
  #   name                   = "${terraformResourceName}-cpu-scale-up"
  #   autoscaling_group_name = aws_autoscaling_group.${terraformResourceName}.name
  #   policy_type            = "TargetTrackingScaling"
  #   target_tracking_configuration {
  #     predefined_metric_specification {
  #       predefined_metric_type = "ASGAverageCPUUtilization"
  #     }
  #     target_value = 70.0 # Porcentaje de CPU
  #   }
  # }
}

# NOTA: Se requiere una Launch Configuration o Launch Template existente.
# Ejemplo de Launch Configuration (si no usa Launch Template):
# resource "aws_launch_configuration" "example_lc" {
#   name_prefix   = "example-lc-"
#   image_id      = "ami-xxxxxxxxxxxxxxxxx" # Reemplazar con una AMI válida
#   instance_type = "t2.micro"
#   # security_groups = [aws_security_group.instance.id]
#   # user_data = <<-EOF
#   #             #!/bin/bash
#   #             echo "Hello, World" > /tmp/hello.txt
#   #             EOF
#   lifecycle {
#     create_before_destroy = true
#   }
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Auto Scaling Group de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// NOTA: Se requiere una Launch Configuration o Launch Template existente.
// Ejemplo de Launch Configuration (si no usa Launch Template):
// const exampleLc = new aws.ec2.LaunchConfiguration("exampleLc", {
//     imageId: "ami-xxxxxxxxxxxxxxxxx", // Reemplazar con una AMI válida
//     instanceType: "t2.micro",
//     // securityGroups: [instanceSg.id],
//     // userData: \`#!/bin/bash
//     // echo "Hello, World" > /tmp/hello.txt\`,
// });

// Crear el Auto Scaling Group
const ${pulumiResourceName}Asg = new aws.autoscaling.Group("${pulumiResourceName}", {
    name: "${config.name}",
    minSize: ${config.min_size},
    maxSize: ${config.max_size},
    ${config.desired_capacity ? `desiredCapacity: ${config.desired_capacity},`: ''}
    
    // Especificar Launch Configuration o Launch Template
    ${launchConfigSourcePulumi}

    vpcZoneIdentifiers: [${subnetsArray}], // Lista de IDs de subred
    region: "${config.region}", // Asegurar que el proveedor AWS esté configurado para esta región

    // (Opcional) ARNs de Target Groups de ELB
    ${config.target_group_arns ? `targetGroupArns: [${targetGroupArnsArray}],` : ''}

    healthCheckType: "${config.health_check_type || 'EC2'}",
    healthCheckGracePeriod: ${config.health_check_grace_period || 300},

    // Tags para el Auto Scaling Group y sus instancias
    tags: [
        ${parsedAsgTags.map(tag => `{ key: "${tag.key}", value: "${tag.value}", propagateAtLaunch: ${tag.propagate_at_launch} }`).join(',\n        ')}
    ],

    // (Opcional) Políticas de escalado
    // Ejemplo: Escalar basado en CPU
    // policies: [{
    //     name: \`\${pulumiResourceName}-cpu-scaling-up\`,
    //     policyType: "TargetTrackingScaling",
    //     targetTrackingConfiguration: {
    //         predefinedMetricSpecification: {
    //             predefinedMetricType: "ASGAverageCPUUtilization",
    //         },
    //         targetValue: 70.0, // Porcentaje de CPU
    //     },
    // }],
});

// Exportar el nombre del Auto Scaling Group
export const asgName = ${pulumiResourceName}Asg.name;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Auto Scaling Group
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un Auto Scaling Group de AWS llamado ${config.name}
  en la región ${config.region}.

Parameters:
  ASGName:
    Type: String
    Default: "${config.name}"
  LaunchConfigurationName: # O LaunchTemplateId/Name
    Type: String
    Default: "${config.launch_configuration_name || ''}"
    Description: "Nombre de la Launch Configuration existente. Dejar vacío si usa Launch Template."
  LaunchTemplateId:
    Type: String
    Default: "${config.launch_template_id || ''}"
    Description: "ID de la Launch Template existente. Dejar vacío si usa Launch Configuration."
  MinASGSize:
    Type: Number
    Default: ${config.min_size}
  MaxASGSize:
    Type: Number
    Default: ${config.max_size}
  DesiredASGCapacity:
    Type: Number
    Default: ${config.desired_capacity || config.min_size} # Default a min_size si no se especifica
  VPCZoneIdentifiers: # Lista de Subnet IDs
    Type: List<AWS::EC2::Subnet::Id>
    Default: "${cfVpcZoneIdentifiersDefault}"
  TargetGroupARNs:
    Type: CommaDelimitedList # Lista de ARNs de Target Groups
    Default: "${cfTargetGroupArnsDefault}"
  HealthCheckTypeASG:
    Type: String
    Default: "${config.health_check_type || 'EC2'}"
    AllowedValues: ["EC2", "ELB"]
  HealthCheckGracePeriodASG:
    Type: Number
    Default: ${config.health_check_grace_period || 300}

Conditions:
  UseLaunchConfiguration: !Not [!Equals [!Ref LaunchConfigurationName, ""]]
  UseLaunchTemplate: !Not [!Equals [!Ref LaunchTemplateId, ""]] # Asumimos ID sobre nombre si ambos se dan
  HasTargetGroups: !Not [!Equals [!Join ["", !Ref TargetGroupARNs], ""]]

Resources:
  ${pulumiResourceName}ASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Ref ASGName
      MinSize: !Ref MinASGSize
      MaxSize: !Ref MaxASGSize
      DesiredCapacity: !Ref DesiredASGCapacity
      LaunchConfigurationName: !If [UseLaunchConfiguration, !Ref LaunchConfigurationName, !Ref "AWS::NoValue"]
      LaunchTemplate: !If 
        - UseLaunchTemplate
        - LaunchTemplateId: !Ref LaunchTemplateId
          # Version: String # Opcional, ej. "$Latest" o "$Default"
        - !Ref "AWS::NoValue"
      VPCZoneIdentifier: !Ref VPCZoneIdentifiers
      TargetGroupARNs: !If [HasTargetGroups, !Ref TargetGroupARNs, !Ref "AWS::NoValue"]
      HealthCheckType: !Ref HealthCheckTypeASG
      HealthCheckGracePeriod: !Ref HealthCheckGracePeriodASG
      Tags:
        ${parsedAsgTags.map(tag => `- Key: ${tag.key}\n          Value: ${tag.value}\n          PropagateAtLaunch: "${tag.propagate_at_launch}"`).join('\n        ')}
      # MetricsCollection: # Opcional
      # ServiceLinkedRoleARN: String # Opcional

  # NOTA: Se requiere una Launch Configuration o Launch Template existente.
  # Ejemplo de Launch Configuration (si no usa Launch Template):
  # ExampleLaunchConfig:
  #   Type: AWS::AutoScaling::LaunchConfiguration
  #   Condition: UseLaunchConfiguration # Solo crear si se usa LC
  #   Properties:
  #     LaunchConfigurationName: !Ref LaunchConfigurationName
  #     ImageId: "ami-xxxxxxxxxxxxxxxxx" # Reemplazar
  #     InstanceType: "t2.micro"
  #     # SecurityGroups: [ !Ref InstanceSecurityGroup ]
  #     # UserData: String

Outputs:
  ASGNameOutput:
    Description: Nombre del Auto Scaling Group creado
    Value: !Ref ${pulumiResourceName}ASG
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS Auto Scaling Group (requiere community.aws.autoscaling_group)
- name: Gestionar Auto Scaling Group ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    asg_name: "${config.name}"
    aws_region: "${config.region}"
    launch_config_name: "${config.launch_configuration_name || ''}"
    launch_template_id: "${config.launch_template_id || ''}"
    launch_template_name: "${config.launch_template_name || ''}"
    min_size: ${config.min_size}
    max_size: ${config.max_size}
    desired_capacity: ${config.desired_capacity || config.min_size}
    vpc_zone_identifier_list: [${subnetsArray}]
    target_group_arns_list: [${targetGroupArnsArray}]
    health_check_type_asg: "${config.health_check_type || 'EC2'}"
    health_check_grace_period_asg: ${config.health_check_grace_period || 300}
    asg_tags:
      ${parsedAsgTags.map(tag => `- key: ${tag.key}\n        value: ${tag.value}\n        propagate_at_launch: ${tag.propagate_at_launch}`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Auto Scaling Group
      community.aws.autoscaling_group:
        name: "{{ asg_name }}"
        state: present
        region: "{{ aws_region }}"
        launch_configuration: "{{ launch_config_name | default(omit) if launch_config_name else omit }}"
        # Para Launch Template, el módulo puede requerir una estructura específica:
        # launch_template:
        #   launch_template_id: "{{ launch_template_id | default(omit) if launch_template_id else omit }}"
        #   launch_template_name: "{{ launch_template_name | default(omit) if launch_template_name else omit }}"
        #   version: "$Latest" # Opcional
        min_size: "{{ min_size }}"
        max_size: "{{ max_size }}"
        desired_capacity: "{{ desired_capacity }}"
        vpc_zone_identifier: "{{ vpc_zone_identifier_list }}"
        target_group_arns: "{{ target_group_arns_list | default(omit) if target_group_arns_list | length > 0 else omit }}"
        health_check_type: "{{ health_check_type_asg }}"
        health_check_period: "{{ health_check_grace_period_asg }}"
        tags: "{{ asg_tags }}"
        # wait_for_instances: yes # Opcional
      register: asg_info

    - name: Mostrar información del Auto Scaling Group
      ansible.builtin.debug:
        var: asg_info
`,
    cloudformation
  };
}
