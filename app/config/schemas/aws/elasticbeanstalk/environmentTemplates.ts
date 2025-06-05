import { AWSElasticBeanstalkEnvironmentConfig } from './environment'; // Asumiremos que este tipo se definirá en environment.ts
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

// Helper function to parse settings string "namespace:option_name=value;..."
interface EBSetting {
  namespace: string;
  name: string;
  value: string;
}
const parseEbSettings = (settingsString?: string): EBSetting[] => {
  if (!settingsString) return [];
  return settingsString.split(';').map(settingDef => {
    const [namespaceAndOption, value] = settingDef.split('=');
    const parts = namespaceAndOption.split(':');
    if (parts.length === 3 && value !== undefined) {
      return { namespace: parts[0].trim(), name: parts[1].trim() + ':' + parts[2].trim(), value: value.trim() }; // Terraform name is "option_name"
    } else if (parts.length === 2 && value !== undefined) { // For CloudFormation, name is just option_name
       return { namespace: parts[0].trim(), name: parts[1].trim(), value: value.trim() };
    }
    return null;
  }).filter(s => s !== null) as EBSetting[];
};


export function generateAWSElasticBeanstalkEnvironmentTemplates(config: AWSElasticBeanstalkEnvironmentConfig): CodeTemplate {
  const terraformResourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.name.replace(/-/g, '');

  const parsedTags = {
    Name: config.name,
    ...parseTagsString(config.tags as string | undefined),
  };
  const ebSettings = parseEbSettings(config.setting as string | undefined);

  const platformChoiceTerraform = config.platform_arn
    ? `platform_arn = "${config.platform_arn}"`
    : config.solution_stack_name
    ? `solution_stack_name = "${config.solution_stack_name}"`
    : `# ERROR: Debe especificar platform_arn o solution_stack_name`;

  const platformChoicePulumi = config.platform_arn
    ? `platformArn: "${config.platform_arn}",`
    : config.solution_stack_name
    ? `solutionStackName: "${config.solution_stack_name}",`
    : `// ERROR: Debe especificar platformArn o solutionStackName`;
    
  const terraformSettingsBlock = ebSettings.map(s => 
    `  setting {\n    namespace = "${s.namespace}"\n    name      = "${s.name.replace(':', '')}" # Terraform option_name no tiene ':'\n    value     = "${s.value}"\n  }`
  ).join('\n');


  const terraform = `
# Plantilla de Terraform para un Entorno de AWS Elastic Beanstalk
provider "aws" {
  region = "${config.region}"
}

# (Opcional pero recomendado) Recurso para la Aplicación Elastic Beanstalk
resource "aws_elastic_beanstalk_application" "${config.application_name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}" {
  name        = "${config.application_name}"
  description = "Aplicación ${config.application_name} para Elastic Beanstalk"
}

# Recurso para el Entorno Elastic Beanstalk
resource "aws_elastic_beanstalk_environment" "${terraformResourceName}" {
  name                = "${config.name}"
  application         = aws_elastic_beanstalk_application.${config.application_name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}.name
  
  # Elegir una de las siguientes opciones para la plataforma:
  ${platformChoiceTerraform}

  ${config.tier ? `tier                = "${config.tier}"` : ''}
  ${config.description ? `description         = "${config.description}"` : ''}
  ${config.cname_prefix ? `cname_prefix        = "${config.cname_prefix}"` : ''}

  # (Opcional) Configuraciones específicas del entorno
${terraformSettingsBlock}

  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}

# (Opcional) Salida del endpoint del entorno
output "${terraformResourceName}_endpoint_url" {
  value = aws_elastic_beanstalk_environment.${terraformResourceName}.endpoint_url
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Entorno de AWS Elastic Beanstalk
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// (Opcional pero recomendado) Crear la Aplicación Elastic Beanstalk
const app = new aws.elasticbeanstalk.Application("${pulumiResourceName}App", {
    name: "${config.application_name}",
    description: "Aplicación ${config.application_name} para Elastic Beanstalk",
});

// Crear el Entorno Elastic Beanstalk
const ${pulumiResourceName}Env = new aws.elasticbeanstalk.Environment("${pulumiResourceName}", {
    name: "${config.name}",
    application: app.name, // Referencia a la aplicación creada arriba
    
    // Elegir una de las siguientes opciones para la plataforma:
    ${platformChoicePulumi}

    ${config.tier ? `tier: "${config.tier}",` : ''}
    ${config.description ? `description: "${config.description}",` : ''}
    ${config.cname_prefix ? `cnamePrefix: "${config.cname_prefix}",` : ''}
    region: "${config.region}",

    // (Opcional) Configuraciones específicas del entorno
    settings: [
        ${ebSettings.map(s => `{ namespace: "${s.namespace}", name: "${s.name.replace(':', '')}", value: "${s.value}" }`).join(',\n        ')}
    ],

    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

// Exportar el endpoint del entorno
export const environmentEndpointUrl = ${pulumiResourceName}Env.endpointUrl;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Entorno de Elastic Beanstalk
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear un entorno de Elastic Beanstalk llamado ${config.name}
  para la aplicación ${config.application_name} en la región ${config.region}.

Parameters:
  EnvironmentName:
    Type: String
    Default: "${config.name}"
  ApplicationName:
    Type: String
    Default: "${config.application_name}"
  SolutionStackName:
    Type: String
    Default: "${config.solution_stack_name || ''}"
    Description: "Nombre de la pila de soluciones. Dejar vacío si usa PlatformArn."
  PlatformArn:
    Type: String
    Default: "${config.platform_arn || ''}"
    Description: "ARN de la plataforma. Dejar vacío si usa SolutionStackName."
  EnvironmentTier:
    Type: String
    Default: "${config.tier || 'WebServer'}"
    AllowedValues: ["WebServer", "Worker"]
  CNAMEPrefix:
    Type: String
    Default: "${config.cname_prefix || ''}" # AWS generará uno si está vacío

Conditions:
  HasSolutionStack: !Not [!Equals [!Ref SolutionStackName, ""]]
  HasPlatformArn: !Not [!Equals [!Ref PlatformArn, ""]]
  HasCNAMEPrefix: !Not [!Equals [!Ref CNAMEPrefix, ""]]

Resources:
  # Aplicación Elastic Beanstalk (crear si no existe)
  ${pulumiResourceName}Application:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: !Ref ApplicationName
      Description: !Sub "Aplicación \${ApplicationName} para Elastic Beanstalk"

  ${pulumiResourceName}Environment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      EnvironmentName: !Ref EnvironmentName
      ApplicationName: !Ref ${pulumiResourceName}Application # Referencia a la App
      Description: "${config.description || ''}"
      Tier:
        Name: !Ref EnvironmentTier
        Type: !If [!Equals [!Ref EnvironmentTier, "WebServer"], "Standard", "SQS/HTTP"]
      SolutionStackName: !If [HasSolutionStack, !Ref SolutionStackName, !Ref "AWS::NoValue"]
      PlatformArn: !If [HasPlatformArn, !Ref PlatformArn, !Ref "AWS::NoValue"]
      CNAMEPrefix: !If [HasCNAMEPrefix, !Ref CNAMEPrefix, !Ref "AWS::NoValue"]
      OptionSettings:
        ${ebSettings.map(s => `- Namespace: ${s.namespace}\n          OptionName: ${s.name}\n          Value: ${s.value}`).join('\n        ')}
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}

Outputs:
  EndpointURL:
    Description: URL del endpoint del entorno Elastic Beanstalk
    Value: !GetAtt ${pulumiResourceName}Environment.EndpointURL
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS Elastic Beanstalk Environment (requiere community.aws.elasticbeanstalk_env)
- name: Gestionar entorno Elastic Beanstalk ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    env_name: "${config.name}"
    app_name: "${config.application_name}"
    aws_region: "${config.region}"
    solution_stack: "${config.solution_stack_name || ''}"
    platform_arn: "${config.platform_arn || ''}"
    env_tier: "${config.tier || 'WebServer'}"
    cname_prefix_val: "${config.cname_prefix || ''}"
    env_description: "${config.description || ''}"
    env_settings:
      ${ebSettings.map(s => `- namespace: ${s.namespace}\n        option_name: ${s.name.replace(':', '')}\n        value: ${s.value}`).join('\n      ')}
    env_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Asegurar que la aplicación Elastic Beanstalk exista
      community.aws.elasticbeanstalk_app:
        name: "{{ app_name }}"
        description: "Aplicación {{ app_name }} para Elastic Beanstalk"
        region: "{{ aws_region }}"
        state: present

    - name: Crear o actualizar el entorno Elastic Beanstalk
      community.aws.elasticbeanstalk_env:
        name: "{{ env_name }}"
        app_name: "{{ app_name }}"
        region: "{{ aws_region }}"
        state: present # 'present' crea o actualiza, 'absent' elimina
        solution_stack_name: "{{ solution_stack | default(omit) if solution_stack else omit }}"
        platform_arn: "{{ platform_arn | default(omit) if platform_arn else omit }}"
        tier: "{{ env_tier }}"
        cname_prefix: "{{ cname_prefix_val | default(omit) if cname_prefix_val else omit }}"
        description: "{{ env_description | default(omit) if env_description else omit }}"
        option_settings: "{{ env_settings | default(omit) }}"
        tags: "{{ env_tags }}"
        # wait_timeout: 600 # Opcional: tiempo de espera para que el entorno esté listo
      register: eb_env_info

    - name: Mostrar información del entorno
      ansible.builtin.debug:
        var: eb_env_info
`,
    cloudformation
  };
}
