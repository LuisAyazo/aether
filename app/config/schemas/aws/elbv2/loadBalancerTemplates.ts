import { AWSELBv2LoadBalancerConfig } from './loadBalancer'; // Asumiremos que este tipo se definirá en loadBalancer.ts
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

export function generateAWSELBv2LoadBalancerTemplates(config: AWSELBv2LoadBalancerConfig): CodeTemplate {
  const terraformResourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.name.replace(/-/g, '');

  const parsedTags = {
    Name: config.name,
    ...parseTagsString(config.tags as string | undefined),
  };

  const subnetsArray = config.subnets ? (config.subnets as string).split(',').map(s => `"${s.trim()}"`).join(', ') : '';
  const securityGroupsArray = config.security_groups ? (config.security_groups as string).split(',').map(sg => `"${sg.trim()}"`).join(', ') : '';

  // Para CloudFormation Defaults
  const cfSubnetsDefault = config.subnets ? (config.subnets as string).split(',').map(s => s.trim()).join(',') : '';
  const cfSecurityGroupsDefault = config.security_groups ? (config.security_groups as string).split(',').map(sg => sg.trim()).join(',') : '';

  const terraform = `
# Plantilla de Terraform para un Application Load Balancer (ALB) de AWS
provider "aws" {
  region = "${config.region}"
}

# Recurso para el Application Load Balancer
resource "aws_lb" "${terraformResourceName}" {
  name               = "${config.name}"
  internal           = ${config.internal || false}
  load_balancer_type = "application" # Para ALB
  security_groups    = [${securityGroupsArray}] # Lista de IDs de grupos de seguridad
  subnets            = [${subnetsArray}]      # Lista de IDs de subredes (al menos 2 AZs)

  enable_deletion_protection = ${config.enable_deletion_protection || false}
  idle_timeout               = ${config.idle_timeout || 60}

  # (Opcional) Logs de acceso
  # access_logs {
  #   bucket  = "my-lb-logs-bucket"
  #   prefix  = "${config.name}-logs"
  #   enabled = true
  # }

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}

# Recurso para un Target Group por defecto (ejemplo HTTP)
resource "aws_lb_target_group" "${terraformResourceName}_default_tg" {
  name     = "${terraformResourceName}-default-tg"
  port     = ${config.default_target_group_port || 80}
  protocol = "${config.default_target_group_protocol || 'HTTP'}"
  vpc_id   = "vpc-xxxxxxxxxxxxxxxxx" # Reemplazar con el ID de tu VPC

  # (Opcional) Health Check
  # health_check {
  #   path                = "/"
  #   protocol            = "HTTP"
  #   port                = "traffic-port"
  #   healthy_threshold   = 3
  #   unhealthy_threshold = 3
  #   timeout             = 30
  #   interval            = 60
  # }
}

# Recurso para un Listener por defecto (ejemplo HTTP)
resource "aws_lb_listener" "${terraformResourceName}_default_listener" {
  load_balancer_arn = aws_lb.${terraformResourceName}.arn
  port              = "${config.listener_port || 80}"
  protocol          = "${config.listener_protocol || 'HTTP'}"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.${terraformResourceName}_default_tg.arn
  }

  # (Opcional) Para HTTPS, necesitarás un certificado SSL/TLS
  # certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id"
}

# (Opcional) Salida del DNS Name del Load Balancer
output "${terraformResourceName}_dns_name" {
  value = aws_lb.${terraformResourceName}.dns_name
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Application Load Balancer (ALB) de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Crear el Application Load Balancer
const ${pulumiResourceName}Lb = new aws.lb.LoadBalancer("${pulumiResourceName}", {
    name: "${config.name}",
    internal: ${config.internal || false},
    loadBalancerType: "application",
    securityGroups: [${securityGroupsArray}],
    subnets: [${subnetsArray}],
    enableDeletionProtection: ${config.enable_deletion_protection || false},
    idleTimeout: ${config.idle_timeout || 60},
    // region: "${config.region}", // Usualmente configurado a nivel de proveedor
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
    // accessLogs: { // Opcional
    //     bucket: "my-lb-logs-bucket",
    //     prefix: "${config.name}-logs",
    //     enabled: true,
    // },
});

// Crear un Target Group por defecto
const ${pulumiResourceName}DefaultTargetGroup = new aws.lb.TargetGroup("${pulumiResourceName}DefaultTg", {
    name: "${pulumiResourceName}-default-tg",
    port: ${config.default_target_group_port || 80},
    protocol: "${config.default_target_group_protocol || 'HTTP'}",
    vpcId: "vpc-xxxxxxxxxxxxxxxxx", // Reemplazar con el ID de tu VPC
    // healthCheck: { // Opcional
    //     path: "/",
    //     protocol: "HTTP",
    // },
});

// Crear un Listener por defecto
const ${pulumiResourceName}DefaultListener = new aws.lb.Listener("${pulumiResourceName}DefaultListener", {
    loadBalancerArn: ${pulumiResourceName}Lb.arn,
    port: ${config.listener_port || 80},
    protocol: "${config.listener_protocol || 'HTTP'}",
    defaultActions: [{
        type: "forward",
        targetGroupArn: ${pulumiResourceName}DefaultTargetGroup.arn,
    }],
    // certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id", // Para HTTPS
});

// Exportar el DNS Name del Load Balancer
export const lbDnsName = ${pulumiResourceName}Lb.dnsName;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Application Load Balancer
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un Application Load Balancer llamado ${config.name}
  en la región ${config.region}.

Parameters:
  LoadBalancerName:
    Type: String
    Default: "${config.name}"
  IsInternal:
    Type: String # Booleanos en CFN son Strings "true" o "false"
    Default: "${config.internal || false}"
    AllowedValues: [true, false]
  SubnetIDs:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Lista de IDs de subred (al menos 2 AZs).
    Default: "${cfSubnetsDefault}"
  SecurityGroupIDs:
    Type: List<AWS::EC2::SecurityGroup::Id>
    Description: Lista de IDs de grupos de seguridad.
    Default: "${cfSecurityGroupsDefault}"

Resources:
  ${pulumiResourceName}ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Ref LoadBalancerName
      Scheme: !If [IsInternalCondition, "internal", "internet-facing"]
      Type: application
      Subnets: !Ref SubnetIDs
      SecurityGroups: !Ref SecurityGroupIDs
      LoadBalancerAttributes:
        - Key: deletion_protection.enabled
          Value: "${config.enable_deletion_protection || false}"
        - Key: idle_timeout.timeout_seconds
          Value: "${config.idle_timeout || 60}"
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}

  ${pulumiResourceName}DefaultTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "\${LoadBalancerName}-default-tg"
      Port: ${config.default_target_group_port || 80}
      Protocol: "${config.default_target_group_protocol || 'HTTP'}"
      VpcId: "vpc-xxxxxxxxxxxxxxxxx" # Reemplazar con el ID de tu VPC
      # HealthCheckProtocol: HTTP # Opcional
      # HealthCheckPath: "/"      # Opcional

  ${pulumiResourceName}DefaultListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ${pulumiResourceName}ALB
      Port: ${config.listener_port || 80}
      Protocol: "${config.listener_protocol || 'HTTP'}"
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ${pulumiResourceName}DefaultTargetGroup
      # CertificateArn: String # Para HTTPS

Conditions:
  IsInternalCondition: !Equals [!Ref IsInternal, "true"]

Outputs:
  LoadBalancerDNSName:
    Description: El DNS Name del Application Load Balancer
    Value: !GetAtt ${pulumiResourceName}ALB.DNSName
  LoadBalancerArn:
    Description: El ARN del Application Load Balancer
    Value: !Ref ${pulumiResourceName}ALB
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS Application Load Balancer (requiere community.aws.elb_application_lb y otros módulos)
- name: Provisionar Application Load Balancer ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    lb_name: "${config.name}"
    aws_region: "${config.region}"
    is_internal: ${config.internal || false}
    subnets_list: [${subnetsArray}]
    security_groups_list: [${securityGroupsArray}] # Puede ser omitido si está vacío
    deletion_protection: ${config.enable_deletion_protection || false}
    idle_timeout_seconds: ${config.idle_timeout || 60}
    lb_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
    
    # Vars para Target Group y Listener de ejemplo
    default_tg_name: "{{ lb_name }}-default-tg"
    default_tg_port: ${config.default_target_group_port || 80}
    default_tg_protocol: "${config.default_target_group_protocol || 'HTTP'}"
    listener_port: ${config.listener_port || 80}
    listener_protocol: "${config.listener_protocol || 'HTTP'}"
    vpc_id: "vpc-xxxxxxxxxxxxxxxxx" # Reemplazar con el ID de tu VPC

  tasks:
    - name: Crear Application Load Balancer
      community.aws.elb_application_lb:
        name: "{{ lb_name }}"
        state: present
        region: "{{ aws_region }}"
        scheme: "{{ 'internal' if is_internal else 'internet-facing' }}"
        subnets: "{{ subnets_list }}"
        security_groups: "{{ security_groups_list | default(omit) }}"
        deletion_protection: "{{ deletion_protection }}"
        idle_timeout: "{{ idle_timeout_seconds }}"
        tags: "{{ lb_tags }}"
      register: alb_info

    - name: Crear Target Group por defecto
      community.aws.elb_target_group:
        name: "{{ default_tg_name }}"
        protocol: "{{ default_tg_protocol }}"
        port: "{{ default_tg_port }}"
        vpc_id: "{{ vpc_id }}"
        state: present
        region: "{{ aws_region }}"
        # health_check_path: "/" # Opcional
      register: tg_info

    - name: Crear Listener por defecto
      community.aws.elb_application_lb_listener:
        load_balancer_arn: "{{ alb_info.load_balancer_arn }}"
        protocol: "{{ listener_protocol }}"
        port: "{{ listener_port }}"
        state: present
        region: "{{ aws_region }}"
        default_actions:
          - type: forward
            target_group_arn: "{{ tg_info.target_group_arn }}"
        # certificate_arn: "arn:aws:acm:..." # Para HTTPS
      register: listener_info

    - name: Mostrar DNS del Load Balancer
      ansible.builtin.debug:
        msg: "ALB DNS: {{ alb_info.dns_name }}"
`,
    cloudformation
  };
}
