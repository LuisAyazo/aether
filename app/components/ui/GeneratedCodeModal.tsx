'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Tabs, Button, message, Tooltip, Tree, Radio, Badge, Tag, Space, Divider, Switch } from 'antd';
import { 
  CopyOutlined, 
  DownloadOutlined, 
  FolderOutlined,
  FileOutlined,
  FolderOpenOutlined,
  CodeOutlined,
  CloudOutlined,
  AmazonOutlined,
  GoogleOutlined,
  WindowsOutlined,
  DeploymentUnitOutlined,
  InfoCircleOutlined,
  CommentOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Node } from "../../services/diagramService";
import { getResourceConfig } from "../../config/schemas";

interface GeneratedCodeModalProps {
  visible: boolean;
  onClose: () => void;
  nodes: Node[];
}

interface FileNode {
  title: string;
  key: string;
  icon?: React.ReactNode;
  children?: FileNode[];
  isLeaf?: boolean;
  content?: string;
  language?: string;
}

type IaCProvider = 'terraform' | 'pulumi' | 'ansible' | 'cloudformation';

const GeneratedCodeModal: React.FC<GeneratedCodeModalProps> = ({ visible, onClose, nodes }) => {
  const [selectedIaC, setSelectedIaC] = useState<IaCProvider>('terraform');
  const [selectedFile, setSelectedFile] = useState<string>('main');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['root']);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<Record<string, string>>({});
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [removeComments, setRemoveComments] = useState(false);

  // Obtener todos los nodos de recursos (excluir notas, grupos, áreas)
  const resourceNodes = useMemo(() => {
    if (!nodes || !Array.isArray(nodes)) {
      return [];
    }
    
    const utilityTypes = ['areaNode', 'noteNode', 'textNode', 'group'];
    
    // Obtener todos los nodos de recursos, incluyendo los que están dentro de grupos
    // Los nodos de recursos tienen tipos específicos como 'aws_s3_bucket', 'gcp_compute_instance', etc.
    const filtered = nodes.filter((node: any) => {
      const nodeType = node.type || '';
      const isUtility = utilityTypes.includes(nodeType);
      const hasProvider = node.data?.provider;
      
      // Es un nodo de recurso si no es un tipo de utilidad y tiene un provider
      return !isUtility && hasProvider;
    });
    
    return filtered;
  }, [nodes]);

  // Generar código cuando el modal se abre o cambian los nodos
  useEffect(() => {
    const generateCode = async () => {
      if (visible && resourceNodes.length > 0) {
        setIsGeneratingCode(true);
        
        // Limpiar código anterior
        setGeneratedCode({});
        
        try {
          console.log('=== Starting code generation ===');
          console.log('Resource nodes:', resourceNodes);
          console.log('Nodes changed, regenerating code...');
          
          // Generar todos los códigos en paralelo para mejorar rendimiento
          const [terraformMain, pulumiMain, ansibleMain] = await Promise.all([
            generateTerraformMain(),
            generatePulumiMain(),
            generateAnsiblePlaybook()
          ]);
          
          // Generar CloudFormation (síncrono)
          const cloudformationMain = generateCloudFormationTemplate();
          
          // Actualizar todo el estado de una vez
          setGeneratedCode({
            'terraform-main': terraformMain,
            'pulumi-main': pulumiMain,
            'ansible-main': ansibleMain,
            'cloudformation-main': cloudformationMain
          });
          
          console.log('Code generation completed');
        } catch (error) {
          console.error('Error generating code:', error);
          // En caso de error, establecer código vacío para evitar que se quede en "Loading..."
          setGeneratedCode({
            'terraform-main': '# Error generating code',
            'pulumi-main': '// Error generating code',
            'ansible-main': '# Error generating code',
            'cloudformation-main': '# Error generating code'
          });
        } finally {
          setIsGeneratingCode(false);
        }
      } else if (visible && resourceNodes.length === 0) {
        // Si no hay nodos, limpiar el código
        setGeneratedCode({});
        setIsGeneratingCode(false);
      }
    };
    
    if (visible) {
      generateCode();
    }
  }, [visible, JSON.stringify(resourceNodes)]); // Usar JSON.stringify para detectar cambios profundos en los nodos

  // Generar estructura de archivos según el IaC seleccionado
  const generateFileStructure = (iac: IaCProvider): FileNode[] => {
    switch (iac) {
      case 'terraform':
        return [
          {
            title: 'terraform',
            key: 'root',
            icon: <FolderOutlined />,
            children: [
              { title: 'README.md', key: 'readme', icon: <ReadOutlined />, isLeaf: true, content: generateProjectReadme('terraform'), language: 'markdown' },
              { title: 'main.tf', key: 'main', icon: <FileOutlined />, isLeaf: true, content: generatedCode['terraform-main'] || (isGeneratingCode ? 'Loading...' : '# No code generated yet'), language: 'hcl' },
              { title: 'variables.tf', key: 'variables', icon: <FileOutlined />, isLeaf: true, content: generatedCode['terraform-variables'] || generateTerraformVariables(), language: 'hcl' },
              { title: 'outputs.tf', key: 'outputs', icon: <FileOutlined />, isLeaf: true, content: generatedCode['terraform-outputs'] || generateTerraformOutputs(), language: 'hcl' },
              { title: 'providers.tf', key: 'providers', icon: <FileOutlined />, isLeaf: true, content: generatedCode['terraform-providers'] || generateTerraformProviders(), language: 'hcl' },
              { title: 'terraform.tfvars.example', key: 'tfvars', icon: <FileOutlined />, isLeaf: true, content: generateTerraformTfvarsExample(), language: 'hcl' },
              {
                title: 'modules',
                key: 'modules',
                icon: <FolderOutlined />,
                children: generateTerraformModules()
              }
            ]
          }
        ];
      case 'pulumi':
        return [
          {
            title: 'pulumi',
            key: 'root',
            icon: <FolderOutlined />,
            children: [
              { title: 'README.md', key: 'readme', icon: <ReadOutlined />, isLeaf: true, content: generateProjectReadme('pulumi'), language: 'markdown' },
              { title: 'index.ts', key: 'main', icon: <FileOutlined />, isLeaf: true, content: generatedCode['pulumi-main'] || (isGeneratingCode ? 'Loading...' : '// No code generated yet'), language: 'typescript' },
              { title: 'Pulumi.yaml', key: 'pulumi-yaml', icon: <FileOutlined />, isLeaf: true, content: generatePulumiYaml(), language: 'yaml' },
              { title: 'package.json', key: 'package', icon: <FileOutlined />, isLeaf: true, content: generatePulumiPackageJson(), language: 'json' },
              { title: 'tsconfig.json', key: 'tsconfig', icon: <FileOutlined />, isLeaf: true, content: generatePulumiTsConfig(), language: 'json' }
            ]
          }
        ];
      case 'ansible':
        return [
          {
            title: 'ansible',
            key: 'root',
            icon: <FolderOutlined />,
            children: [
              { title: 'README.md', key: 'readme', icon: <ReadOutlined />, isLeaf: true, content: generateProjectReadme('ansible'), language: 'markdown' },
              { title: 'playbook.yml', key: 'main', icon: <FileOutlined />, isLeaf: true, content: generatedCode['ansible-main'] || (isGeneratingCode ? 'Loading...' : '# No code generated yet'), language: 'yaml' },
              { title: 'inventory.ini', key: 'inventory', icon: <FileOutlined />, isLeaf: true, content: generateAnsibleInventory(), language: 'ini' },
              {
                title: 'roles',
                key: 'roles',
                icon: <FolderOutlined />,
                children: generateAnsibleRoles()
              },
              { title: 'vars.yml', key: 'vars', icon: <FileOutlined />, isLeaf: true, content: generateAnsibleVars(), language: 'yaml' }
            ]
          }
        ];
      case 'cloudformation':
        return [
          {
            title: 'cloudformation',
            key: 'root',
            icon: <FolderOutlined />,
            children: [
              { title: 'README.md', key: 'readme', icon: <ReadOutlined />, isLeaf: true, content: generateProjectReadme('cloudformation'), language: 'markdown' },
              { title: 'template.yaml', key: 'main', icon: <FileOutlined />, isLeaf: true, content: generatedCode['cloudformation-main'] || (isGeneratingCode ? 'Loading...' : '# No code generated yet'), language: 'yaml' },
              { title: 'parameters.json', key: 'parameters', icon: <FileOutlined />, isLeaf: true, content: generateCloudFormationParameters(), language: 'json' }
            ]
          }
        ];
    }
  };

  // Funciones generadoras de código para cada proveedor
  const generateTerraformMain = async () => {
    const providers = new Set<string>();
    const resources: string[] = [];

    // Generar código para cada nodo de recurso
    for (const node of resourceNodes) {
      const provider = String(node.data?.provider || 'generic');
      let category = String(node.data?.category || '');
      // Asegurar que node.type sea string
      const nodeType = typeof node.type === 'string' ? node.type : '';
      let resourceType: string = String(node.data?.resourceType || nodeType || '');
      
      // Si el resourceType incluye el provider (ej: aws_s3_bucket), separarlo
      if (resourceType.startsWith(`${provider}_`)) {
        const parts = resourceType.substring(provider.length + 1).split('_');
        // Para AWS: aws_s3_bucket -> category: s3, resourceType: bucket
        // Para AWS: aws_ec2_instance -> category: ec2, resourceType: instance
        if (parts.length >= 2) {
          category = parts[0]; // 's3', 'ec2', etc.
          resourceType = parts.slice(1).join('_'); // 'bucket', 'instance', etc.
          
          // Casos especiales de mapeo
          // aws_efs_file_system -> efs/fileSystem
          if (category === 'efs' && resourceType === 'file_system') {
            resourceType = 'fileSystem';
          }
          // aws_sfn_state_machine -> sfn/stateMachine
          if (category === 'sfn' && resourceType === 'state_machine') {
            resourceType = 'stateMachine';
          }
        }
      }
      
      // Manejo especial para recursos de Azure que pueden no tener categoría
      if (provider === 'azure' && resourceType.startsWith('azurerm_')) {
        // azurerm_virtual_machine -> compute/virtualmachine
        const azureType = resourceType.substring(8); // Quitar 'azurerm_'
        
        // Mapeo de tipos de Azure a categorías y nombres de recursos
        const azureMappings: Record<string, { category: string; resourceType: string }> = {
          'virtual_machine': { category: 'compute', resourceType: 'virtualmachine' },
          'linux_virtual_machine_scale_set': { category: 'compute', resourceType: 'linuxvirtualmachinescaleset' },
          'kubernetes_cluster': { category: 'compute', resourceType: 'kubernetescluster' },
          'linux_web_app': { category: 'compute', resourceType: 'linuxwebapp' },
          'container_group': { category: 'compute', resourceType: 'containergroup' },
          'virtual_network': { category: 'networking', resourceType: 'virtualnetwork' },
          'storage_account': { category: 'storage', resourceType: 'storageaccount' },
          'storage_container': { category: 'storage', resourceType: 'storagecontainer' },
          'resource_group': { category: 'management', resourceType: 'resourcegroup' },
          // Agregar más mapeos según sea necesario
        };
        
        const mapping = azureMappings[azureType];
        if (mapping) {
          category = mapping.category;
          resourceType = mapping.resourceType;
        } else {
          // Fallback: intentar convertir snake_case a camelCase sin guiones
          category = 'general';
          resourceType = azureType.replace(/_/g, '');
        }
      }
      
      if (provider !== 'generic') {
        providers.add(provider);
        
        try {
          console.log(`Attempting to get config for: ${provider}/${category}/${resourceType}`);
          // Obtener la configuración del recurso desde los schemas
          const resourceConfig = await getResourceConfig(provider as any, category as string, resourceType as string);
          console.log('Resource config obtained:', resourceConfig);
          
          // Obtener los valores de configuración del nodo
          // Verificar si los datos están en dynamicProperties o directamente en data
          const nodeConfigValues: any = node.data?.dynamicProperties || {};
          console.log('🔍 [GeneratedCodeModal] Node config lookup:', {
            nodeId: node.id,
            nodeType: node.type,
            hasData: !!node.data,
            hasDynamicProperties: !!node.data?.dynamicProperties,
            dynamicPropertiesKeys: node.data?.dynamicProperties ? Object.keys(node.data.dynamicProperties) : [],
            fullNodeData: node.data
          });
          
          // Agregar el nombre del recurso si no existe
          const nodeLabel = typeof node.data?.label === 'string' ? node.data.label : '';
          if (!nodeConfigValues.name && nodeLabel) {
            nodeConfigValues.name = nodeLabel.toLowerCase().replace(/\s+/g, '_');
          }
          
          // Para S3 bucket, asegurar que bucket_name esté presente
          if (category === 's3' && resourceType === 'bucket' && !nodeConfigValues.bucket_name) {
            const defaultName = nodeLabel ? nodeLabel.toLowerCase().replace(/\s+/g, '-') : node.id;
            nodeConfigValues.bucket_name = nodeConfigValues.name || defaultName;
          }
          
          console.log('Final node config values:', nodeConfigValues);
          
          // Llamar a la función templates para generar el código
          let templateResult;
          try {
            templateResult = await resourceConfig.templates(nodeConfigValues);
            console.log('Template result:', templateResult);
          } catch (templateError) {
            console.warn(`Template function error for ${provider}/${category}/${resourceType}:`, templateError);
            // Intentar con valores por defecto
            try {
              const defaultValues = await resourceConfig.defaults();
              console.log('Using default values:', defaultValues);
              templateResult = await resourceConfig.templates(defaultValues);
            } catch (e) {
              console.error('Failed with defaults too:', e);
              templateResult = null;
            }
          }
          
          // Verificar que el resultado sea válido
          if (templateResult && typeof templateResult === 'object' && 'terraform' in templateResult) {
            const templates = templateResult as any;
            if (templates.terraform) {
              // Agregar header notorio antes del recurso
              const header = `
#===============================================================================
# RESOURCE: ${node.data?.label || node.id}
# TYPE: ${provider}_${category}_${resourceType}
# PROVIDER: ${provider.toUpperCase()}
# DESCRIPTION: ${node.data?.description || 'Managed by InfraUX'}
#===============================================================================`;
              
              resources.push(header + '\n' + templates.terraform);
            }
          } else {
            // Si no hay template, usar un fallback con header
            const header = `
#===============================================================================
# RESOURCE: ${node.data?.label || node.id}
# TYPE: ${provider}_${category}_${resourceType}
# STATUS: TODO - Template configuration needed
#===============================================================================`;
            
            resources.push(header + '\n# TODO: Configure template for this resource');
          }
        } catch (error) {
          console.error(`Error generating code for ${provider}/${category}/${resourceType}:`, error);
          const errorHeader = `
#===============================================================================
# RESOURCE: ${node.data?.label || node.id}
# ERROR: Failed to generate code
#===============================================================================`;
          resources.push(errorHeader + `\n# Error: ${error}`);
        }
      }
    }

    return `#===============================================================================
#                        INFRAUX GENERATED TERRAFORM CODE
#                        Generated on: ${new Date().toISOString()}
#                        Total Resources: ${resourceNodes.length}
#===============================================================================

${resources.join('\n\n')}`;
  };


  const generateTerraformVariables = () => {
    const variables: string[] = [
      `# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "infraux-managed"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}`,
      `# AWS Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}`,
      `# GCP Configuration
variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-central1"
}`,
      `# Azure Configuration
variable "azure_region" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}`
    ];
    
    // Tags comunes y configuración local
    variables.push(`
# Common tags to be assigned to all resources
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedBy   = "InfraUX"
    CreatedAt   = timestamp()
  }
  
  # Resource naming convention
  name_prefix = "\${var.project_name}-\${var.environment}"
}`);
    
    // Agregar variables para cada recurso
    resourceNodes.forEach((node: any) => {
      const resourceName = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
      const resourceType = node.data?.resourceType || node.type;
      
      if (node.data?.provider === 'aws') {
        const resourceTypeKey = resourceType.startsWith('aws_') ? resourceType.substring(4) : resourceType;
        
        switch(resourceTypeKey) {
          case 's3_bucket':
            variables.push(`variable "${resourceName}_bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}`);
            break;
            
          case 'ec2_instance':
            variables.push(`variable "${resourceName}_ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

variable "${resourceName}_instance_type" {
  description = "Instance type for the EC2 instance"
  type        = string
  default     = "t3.micro"
}`);
            break;
            
          case 'rds_instance':
            variables.push(`variable "${resourceName}_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
}

variable "${resourceName}_instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t3.micro"
}

variable "${resourceName}_database_name" {
  description = "Name of the database"
  type        = string
}

variable "${resourceName}_username" {
  description = "Master username for the database"
  type        = string
  sensitive   = true
}

variable "${resourceName}_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}`);
            break;
            
          case 'dynamodb_table':
            variables.push(`variable "${resourceName}_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}`);
            break;
            
          case 'sqs_queue':
            variables.push(`variable "${resourceName}_queue_name" {
  description = "Name of the SQS queue"
  type        = string
}`);
            break;
            
          case 'efs_file_system':
            variables.push(`variable "${resourceName}_creation_token" {
  description = "Creation token for the EFS file system"
  type        = string
  default     = "${resourceName}-efs"
}`);
            break;
        }
      }
    });

    return variables.join('\n\n');
  };

  const generateTerraformOutputs = () => {
    const outputs: string[] = [];
    
    resourceNodes.forEach((node: any) => {
      const resourceName = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
      const resourceType = node.data?.resourceType || node.type;
      
      if (node.data?.provider === 'aws') {
        if (resourceType === 's3_bucket') {
          outputs.push(`output "${resourceName}_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.${resourceName}.arn
}

output "${resourceName}_bucket_url" {
  description = "URL of the S3 bucket"
  value       = "https://${resourceName}.s3.amazonaws.com"
}`);
        } else if (resourceType === 'ec2_instance') {
          outputs.push(`output "${resourceName}_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.${resourceName}.public_ip
}

output "${resourceName}_instance_id" {
  description = "Instance ID"
  value       = aws_instance.${resourceName}.id
}`);
        }
      }
    }); 

    return outputs.length > 0 ? outputs.join('\n\n') : '# No outputs defined';
  };

  const generateTerraformProviders = () => {
    const providers = new Set<string>();
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider;
      if (provider && provider !== 'generic') {
        providers.add(provider);
      }
    });

    let providerConfigs: string[] = [`# Terraform configuration
terraform {
  required_version = ">= 1.5.0"
  
  # Backend configuration for state management
  backend "s3" {
    # Configure your backend
    # bucket         = "your-terraform-state-bucket"
    # key            = "infraux/\${var.project_name}/\${var.environment}/terraform.tfstate"
    # region         = "us-east-1"
    # encrypt        = true
    # dynamodb_table = "terraform-state-lock"
  }
  
  required_providers {`];

    if (providers.has('aws')) {
      providerConfigs.push(`    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }`);
    }
    if (providers.has('gcp')) {
      providerConfigs.push(`    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }`);
    }
    if (providers.has('azure')) {
      providerConfigs.push(`    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }`);
    }

    providerConfigs.push(`  }
}
`);

    // Configuración de proveedores
    if (providers.has('aws')) {
      providerConfigs.push(`provider "aws" {
  region = var.aws_region
}`);
    }
    if (providers.has('gcp')) {
      providerConfigs.push(`provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}`);
    }
    if (providers.has('azure')) {
      providerConfigs.push(`provider "azurerm" {
  features {}
}`);
    }

    return providerConfigs.join('\n');
  };

  const generateTerraformModules = (): FileNode[] => {
    // Agrupar recursos por tipo/provider para crear módulos profesionales
    const moduleGroups: Record<string, any[]> = {};
    
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider || 'generic';
      if (provider !== 'generic') {
        if (!moduleGroups[provider]) {
          moduleGroups[provider] = [];
        }
        moduleGroups[provider].push(node);
      }
    });

    return Object.entries(moduleGroups).map(([provider, nodes]) => {
      const moduleFiles: FileNode[] = [
        {
          title: 'main.tf',
          key: `module-${provider}-main`,
          icon: <FileOutlined />,
          isLeaf: true,
          content: generateModuleMain(provider, nodes),
          language: 'hcl'
        },
        {
          title: 'variables.tf',
          key: `module-${provider}-variables`,
          icon: <FileOutlined />,
          isLeaf: true,
          content: generateModuleVariables(provider, nodes),
          language: 'hcl'
        },
        {
          title: 'outputs.tf',
          key: `module-${provider}-outputs`,
          icon: <FileOutlined />,
          isLeaf: true,
          content: generateModuleOutputs(provider, nodes),
          language: 'hcl'
        },
        {
          title: 'README.md',
          key: `module-${provider}-readme`,
          icon: <FileOutlined />,
          isLeaf: true,
          content: generateModuleReadme(provider, nodes),
          language: 'markdown'
        },
        {
          title: 'versions.tf',
          key: `module-${provider}-versions`,
          icon: <FileOutlined />,
          isLeaf: true,
          content: generateModuleVersions(provider),
          language: 'hcl'
        }
      ];

      return {
        title: provider,
        key: `module-${provider}`,
        icon: <FolderOutlined />,
        children: moduleFiles
      };
    });
  };

  // Funciones auxiliares para generar contenido de módulos
  const generateModuleMain = (provider: string, nodes: any[]) => {
    return `# ${provider.toUpperCase()} Infrastructure Module
# This module manages ${provider} resources for the project

locals {
  module_name = "${provider}-infrastructure"
  module_tags = merge(
    var.common_tags,
    {
      Module = local.module_name
    }
  )
}

# Data sources
${provider === 'aws' ? `data "aws_caller_identity" "current" {}
data "aws_region" "current" {}` : ''}
${provider === 'gcp' ? `data "google_client_config" "current" {}` : ''}
${provider === 'azure' ? `data "azurerm_client_config" "current" {}` : ''}

${nodes.map((node: any) => {
  const resourceName = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  const resourceType = node.data?.resourceType || node.type;
  
  return `
# ${node.data?.label || node.id}
# Type: ${resourceType}
# Description: ${node.data?.description || 'Managed by InfraUX'}

resource "${resourceType}" "${resourceName}" {
  # Resource configuration from node: ${node.id}
  name = var.${resourceName}_config["name"]
  
  # Apply common tags
  tags = merge(
    local.module_tags,
    var.${resourceName}_config["tags"],
    {
      Name = var.${resourceName}_config["name"]
    }
  )
  
  # TODO: Add specific resource configuration based on type
  # Configuration values: ${JSON.stringify(node.data?.dynamicProperties || {})}
}`;
}).join('\n')}`;
  };

  const generateModuleVariables = (provider: string, nodes: any[]) => {
    return `# Variables for ${provider.toUpperCase()} module

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

${nodes.map((node: any) => {
  const resourceName = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  return `
# Configuration for ${node.data?.label || node.id}
variable "${resourceName}_config" {
  description = "Configuration for ${node.data?.label || node.id}"
  type = object({
    name               = string
    ${node.data?.resourceType?.includes('instance') ? 'instance_type      = optional(string, "t3.micro")' : ''}
    ${node.data?.resourceType?.includes('bucket') ? 'versioning_enabled = optional(bool, true)' : ''}
    ${node.data?.resourceType?.includes('database') ? 'backup_retention   = optional(number, 7)' : ''}
    enable_monitoring  = optional(bool, true)
    enable_logging     = optional(bool, true)
    tags              = optional(map(string), {})
  })
  
  default = {
    name = "${resourceName}"
  }
}`;
}).join('\n')}`;
  };

  const generateModuleOutputs = (provider: string, nodes: any[]) => {
    return `# Outputs for ${provider.toUpperCase()} module

${nodes.map((node: any) => {
  const resourceName = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  const resourceType = node.data?.resourceType || node.type;
  
  return `
# Outputs for ${node.data?.label || node.id}
output "${resourceName}_id" {
  description = "The ID of ${node.data?.label || node.id}"
  value       = ${resourceType}.${resourceName}.id
}

output "${resourceName}_arn" {
  description = "The ARN of ${node.data?.label || node.id} (if applicable)"
  value       = try(${resourceType}.${resourceName}.arn, "N/A")
}

output "${resourceName}_name" {
  description = "The name of ${node.data?.label || node.id}"
  value       = ${resourceType}.${resourceName}.name
}

output "${resourceName}_details" {
  description = "Complete details of ${node.data?.label || node.id}"
  value       = ${resourceType}.${resourceName}
  sensitive   = true
}`;
}).join('\n')}

# Module metadata
output "module_metadata" {
  description = "Metadata about this module"
  value = {
    provider    = "${provider}"
    environment = var.environment
    resources   = [${nodes.map(n => `"${n.data?.label || n.id}"`).join(', ')}]
  }
}`;
  };

  const generateModuleReadme = (provider: string, nodes: any[]) => {
    return `# ${provider.toUpperCase()} Infrastructure Module

## Overview
This Terraform module manages ${provider.toUpperCase()} infrastructure resources for the InfraUX project.

## Features
- ✅ Consistent resource naming convention
- ✅ Comprehensive tagging strategy
- ✅ Built-in monitoring and logging
- ✅ Environment-specific configurations
- ✅ Security best practices

## Resources Created
${nodes.map(node => `- **${node.data?.label || node.id}** (${node.data?.resourceType || node.type}): ${node.data?.description || 'Managed resource'}`).join('\n')}

## Usage

\`\`\`hcl
module "${provider}_infrastructure" {
  source = "./modules/${provider}"
  
  environment = var.environment
  name_prefix = local.name_prefix
  common_tags = local.common_tags
  
  # Resource-specific configurations
${nodes.map(node => {
  const name = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  return `  ${name}_config = {
    name = "\${local.name_prefix}-${name}"
    # Add more configuration as needed
  }`;
}).join('\n')}
}
\`\`\`

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.5.0 |
| ${provider} | ~> ${provider === 'aws' ? '5.0' : provider === 'gcp' ? '5.0' : '3.0'} |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | n/a | yes |
| name_prefix | Prefix for resource names | string | n/a | yes |
| common_tags | Common tags for resources | map(string) | {} | no |
${nodes.map(node => {
  const name = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  return `| ${name}_config | Configuration for ${node.data?.label || node.id} | object | See variables.tf | no |`;
}).join('\n')}

## Outputs

| Name | Description |
|------|-------------|
${nodes.map(node => {
  const name = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  return `| ${name}_id | ID of the ${node.data?.label || node.id} resource |
| ${name}_arn | ARN of the ${node.data?.label || node.id} resource (if applicable) |
| ${name}_name | Name of the ${node.data?.label || node.id} resource |`;
}).join('\n')}
| module_metadata | Metadata about this module |

## Examples

### Basic Usage
\`\`\`hcl
module "aws_dev" {
  source = "./modules/aws"
  
  environment = "dev"
  name_prefix = "myproject-dev"
  common_tags = {
    Project = "MyProject"
    Owner   = "DevOps Team"
  }
}
\`\`\`

### Production Configuration
\`\`\`hcl
module "aws_prod" {
  source = "./modules/aws"
  
  environment = "prod"
  name_prefix = "myproject-prod"
  common_tags = {
    Project     = "MyProject"
    Owner       = "DevOps Team"
    CostCenter  = "Engineering"
    Compliance  = "PCI-DSS"
  }
  
  # Enhanced configurations for production
${nodes.map(node => {
  const name = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  return `  ${name}_config = {
    name               = "\${local.name_prefix}-${name}"
    enable_monitoring  = true
    enable_logging     = true
    ${node.data?.resourceType?.includes('database') ? 'backup_retention   = 30' : ''}
    ${node.data?.resourceType?.includes('instance') ? 'instance_type      = "t3.large"' : ''}
  }`;
}).join('\n')}
}
\`\`\`

## Security Considerations
- All resources are tagged for proper identification and cost tracking
- Encryption is enabled by default where applicable
- Network access is restricted following the principle of least privilege
- Monitoring and logging are enabled for audit compliance

## Contributing
Please ensure all changes follow the module structure and naming conventions.

## License
Copyright © ${new Date().getFullYear()} InfraUX. All rights reserved.
`;
  };

  const generateModuleVersions = (provider: string) => {
    return `terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    ${provider} = {
      source  = "hashicorp/${provider === 'gcp' ? 'google' : provider === 'azure' ? 'azurerm' : provider}"
      version = "~> ${provider === 'aws' ? '5.0' : provider === 'gcp' ? '5.0' : '3.0'}"
    }
  }
}`;
  };

  // Funciones para otros IaC (Pulumi, Ansible, etc.)
  const generatePulumiMain = async () => {
    const providers = new Set<string>();
    const resources: string[] = [];
    const resourcesByProvider: Record<string, string[]> = {};

    // Generar código para cada nodo de recurso
    for (const node of resourceNodes) {
      const provider = String(node.data?.provider || 'generic');
      let category = String(node.data?.category || '');
      const nodeType = typeof node.type === 'string' ? node.type : '';
      let resourceType: string = String(node.data?.resourceType || nodeType || '');
      
      // Mismo mapeo que en Terraform
      if (resourceType.startsWith(`${provider}_`)) {
        const parts = resourceType.substring(provider.length + 1).split('_');
        if (parts.length >= 2) {
          category = parts[0];
          resourceType = parts.slice(1).join('_');
          
          if (category === 'efs' && resourceType === 'file_system') {
            resourceType = 'fileSystem';
          }
        }
      }
      
      if (provider !== 'generic') {
        providers.add(provider);
        
        if (!resourcesByProvider[provider]) {
          resourcesByProvider[provider] = [];
        }
        
        try {
          const resourceConfig = await getResourceConfig(provider as any, category as string, resourceType as string);
          const nodeConfigValues: any = node.data?.dynamicProperties || {};
          const nodeLabel = typeof node.data?.label === 'string' ? node.data.label : '';
          if (!nodeConfigValues.name && nodeLabel) {
            nodeConfigValues.name = nodeLabel.toLowerCase().replace(/\s+/g, '_');
          }
          
          if (category === 's3' && resourceType === 'bucket' && !nodeConfigValues.bucket_name) {
            const defaultName = nodeLabel ? nodeLabel.toLowerCase().replace(/\s+/g, '-') : node.id;
            nodeConfigValues.bucket_name = nodeConfigValues.name || defaultName;
          }
          
          let templateResult;
          try {
            templateResult = await resourceConfig.templates(nodeConfigValues);
          } catch (templateError) {
            try {
              const defaultValues = await resourceConfig.defaults();
              templateResult = await resourceConfig.templates(defaultValues);
            } catch (e) {
              templateResult = null;
            }
          }
          
          if (templateResult && typeof templateResult === 'object' && 'pulumi' in templateResult) {
            const templates = templateResult as any;
            if (templates.pulumi) {
              // Agregar header notorio antes del recurso
              const header = `
//╔═══════════════════════════════════════════════════════════════════════════╗
//║ RESOURCE: ${node.data?.label || node.id}
//║ TYPE: ${provider}_${category}_${resourceType}
//║ PROVIDER: ${provider.toUpperCase()}
//║ DESCRIPTION: ${node.data?.description || 'Managed by InfraUX'}
//╚═══════════════════════════════════════════════════════════════════════════╝`;
              
              resourcesByProvider[provider].push(header + '\n' + templates.pulumi);
            }
          } else {
            const header = `
//╔═══════════════════════════════════════════════════════════════════════════╗
//║ RESOURCE: ${node.data?.label || node.id}
//║ TYPE: ${provider}_${category}_${resourceType}
//║ STATUS: TODO - Template configuration needed
//╚═══════════════════════════════════════════════════════════════════════════╝`;
            
            resourcesByProvider[provider].push(header + '\n// TODO: Configure Pulumi template for this resource');
          }
        } catch (error) {
          const errorHeader = `
//╔═══════════════════════════════════════════════════════════════════════════╗
//║ RESOURCE: ${node.data?.label || node.id}
//║ ERROR: Failed to generate code
//╚═══════════════════════════════════════════════════════════════════════════╝`;
          resourcesByProvider[provider].push(errorHeader + `\n// Error: ${error}`);
        }
      }
    }

    // Generar el código final organizando por proveedor
    const sections: string[] = [];
    
    if (resourcesByProvider.aws && resourcesByProvider.aws.length > 0) {
      sections.push(`// ════════════════════════════════════════════════════════════════════════════
// AWS RESOURCES
// ════════════════════════════════════════════════════════════════════════════

${resourcesByProvider.aws.join('\n\n')}`);
    }
    
    if (resourcesByProvider.gcp && resourcesByProvider.gcp.length > 0) {
      sections.push(`// ════════════════════════════════════════════════════════════════════════════
// GCP RESOURCES  
// ════════════════════════════════════════════════════════════════════════════

${resourcesByProvider.gcp.join('\n\n')}`);
    }
    
    if (resourcesByProvider.azure && resourcesByProvider.azure.length > 0) {
      sections.push(`// ════════════════════════════════════════════════════════════════════════════
// AZURE RESOURCES
// ════════════════════════════════════════════════════════════════════════════

${resourcesByProvider.azure.join('\n\n')}`);
    }

    return `// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                        INFRAUX GENERATED PULUMI CODE                        ║
// ║                        Generated on: ${new Date().toISOString()}                        ║
// ║                        Total Resources: ${resourceNodes.length}                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import * as pulumi from "@pulumi/pulumi";
${providers.has('aws') ? 'import * as aws from "@pulumi/aws";' : ''}
${providers.has('gcp') ? 'import * as gcp from "@pulumi/gcp";' : ''}
${providers.has('azure') ? 'import * as azure from "@pulumi/azure-native";' : ''}

// Stack configuration
const config = new pulumi.Config();
const projectName = config.get("project") || "infraux-managed";
const environment = config.get("environment") || "dev";

// Common tags for all resources
const commonTags = {
  Environment: environment,
  Project: projectName,
  ManagedBy: "Pulumi",
  CreatedBy: "InfraUX",
  CreatedAt: new Date().toISOString(),
};

${sections.join('\n\n')}

// Export stack outputs
export const stackId = pulumi.getStack();
export const projectName_ = projectName;
export const environment_ = environment;`;
  };

  const generatePulumiYaml = () => {
    const providers = new Set<string>();
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider;
      if (provider && provider !== 'generic') {
        providers.add(provider);
      }
    });

    return `name: infraux-project
runtime: nodejs
description: Infrastructure as Code project generated by InfraUX

# Configuration values
config:
  # Project configuration
  infraux:project:
    description: Project name
    default: infraux-managed
  infraux:environment:
    description: Environment (dev, staging, prod)
    default: dev
    
  # AWS Configuration
  ${providers.has('aws') ? `aws:region:
    description: AWS region
    default: us-east-1` : '# No AWS resources detected'}
    
  # GCP Configuration  
  ${providers.has('gcp') ? `gcp:project:
    description: GCP project ID
  gcp:region:
    description: GCP region
    default: us-central1` : '# No GCP resources detected'}
    
  # Azure Configuration
  ${providers.has('azure') ? `azure:location:
    description: Azure location
    default: eastus` : '# No Azure resources detected'}

# Stack configuration
stack:
  transform:
    - pulumi-transform-tag-all-resources:
        tags:
          Environment: \${pulumi.getConfig("infraux:environment")}
          Project: \${pulumi.getConfig("infraux:project")}
          ManagedBy: Pulumi
          CreatedBy: InfraUX`;
  };

  const generatePulumiPackageJson = () => {
    return JSON.stringify({
      name: "infraux-generated",
      version: "1.0.0",
      main: "index.js",
      devDependencies: {
        "@types/node": "^18.0.0"
      },
      dependencies: {
        "@pulumi/pulumi": "^3.0.0",
        "@pulumi/aws": "^6.0.0",
        "@pulumi/gcp": "^7.0.0",
        "@pulumi/azure-native": "^2.0.0"
      }
    }, null, 2);
  };

  const generatePulumiTsConfig = () => {
    return JSON.stringify({
      compilerOptions: {
        strict: true,
        outDir: "bin",
        target: "es2016",
        module: "commonjs",
        moduleResolution: "node",
        sourceMap: true,
        experimentalDecorators: true,
        pretty: true,
        noFallthroughCasesInSwitch: true,
        noImplicitReturns: true,
        forceConsistentCasingInFileNames: true
      },
      files: ["index.ts"]
    }, null, 2);
  };

  const generateAnsiblePlaybook = async () => {
    const tasks: string[] = [];

    // Generar código para cada nodo de recurso
    for (const node of resourceNodes) {
      const provider = String(node.data?.provider || 'generic');
      let category = String(node.data?.category || '');
      const nodeType = typeof node.type === 'string' ? node.type : '';
      let resourceType: string = String(node.data?.resourceType || nodeType || '');
      
      // Mismo mapeo que en Terraform
      if (resourceType.startsWith(`${provider}_`)) {
        const parts = resourceType.substring(provider.length + 1).split('_');
        if (parts.length >= 2) {
          category = parts[0];
          resourceType = parts.slice(1).join('_');
          
          if (category === 'efs' && resourceType === 'file_system') {
            resourceType = 'fileSystem';
          }
        }
      }
      
      if (provider !== 'generic') {
        try {
          const resourceConfig = await getResourceConfig(provider as any, category as string, resourceType as string);
          const nodeConfigValues: any = node.data?.dynamicProperties || {};
          const nodeLabel = typeof node.data?.label === 'string' ? node.data.label : '';
          if (!nodeConfigValues.name && nodeLabel) {
            nodeConfigValues.name = nodeLabel.toLowerCase().replace(/\s+/g, '_');
          }
          
          if (category === 's3' && resourceType === 'bucket' && !nodeConfigValues.bucket_name) {
            const defaultName = nodeLabel ? nodeLabel.toLowerCase().replace(/\s+/g, '-') : node.id;
            nodeConfigValues.bucket_name = nodeConfigValues.name || defaultName;
          }
          
          let templateResult;
          try {
            templateResult = await resourceConfig.templates(nodeConfigValues);
          } catch (templateError) {
            try {
              const defaultValues = await resourceConfig.defaults();
              templateResult = await resourceConfig.templates(defaultValues);
            } catch (e) {
              templateResult = null;
            }
          }
          
          if (templateResult && typeof templateResult === 'object' && 'ansible' in templateResult) {
            const templates = templateResult as any;
            if (templates.ansible) {
              tasks.push(templates.ansible);
            }
          } else {
            tasks.push(`    - name: Deploy ${node.data?.label || node.id}
      # TODO: Configure Ansible template for ${provider}/${category}/${resourceType}`);
          }
        } catch (error) {
          tasks.push(`    - name: Deploy ${node.data?.label || node.id}
      # Error: ${error}`);
        }
      }
    }

    return `---
- name: Deploy Infrastructure
  hosts: all
  become: yes
  
  vars:
    environment: "{{ environment | default('dev') }}"
  
  tasks:
${tasks.join('\n\n')}`;
  };

  const generateAnsibleInventory = () => {
    // Se concatena '[all' + ':vars]' para evitar que el parser de CSS de Next.js
    // lo interprete erróneamente como un selector de atributos y pseudo-clase,
    // lo que causaba un error de compilación.
    return `[webservers]
# Add your web servers here

[databases]
# Add your database servers here

[all` + `:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_rsa`;
  };

  const generateAnsibleRoles = (): FileNode[] => {
    // Agrupar recursos por tipo para crear roles
    const roleGroups: Record<string, any[]> = {};
    
    resourceNodes.forEach((node: any) => {
      const resourceType = node.data?.resourceType || node.type || 'common';
      const baseType = resourceType.split('_')[0]; // aws, gcp, azure, etc.
      
      if (!roleGroups[baseType]) {
        roleGroups[baseType] = [];
      }
      roleGroups[baseType].push(node);
    });

    // Siempre incluir el rol common
    const roles: FileNode[] = [{
      title: 'common',
      key: 'role-common',
      icon: <FolderOutlined />,
      children: [
        {
          title: 'tasks/main.yml',
          key: 'role-common-tasks',
          icon: <FileOutlined />,
          isLeaf: true,
          content: `---
# Common tasks for all deployments

- name: Ensure required packages are installed
  package:
    name:
      - python3
      - python3-pip
    state: present

- name: Install cloud provider SDKs
  pip:
    name:
      - boto3  # AWS
      - google-cloud-sdk  # GCP
      - azure-cli  # Azure
    state: present

- name: Create project directories
  file:
    path: "{{ item }}"
    state: directory
    mode: '0755'
  loop:
    - /opt/infraux
    - /opt/infraux/configs
    - /opt/infraux/logs

- name: Set common facts
  set_fact:
    project_name: "{{ project_name | default('infraux-managed') }}"
    environment: "{{ environment | default('dev') }}"
    deployment_timestamp: "{{ ansible_date_time.iso8601 }}"`,
          language: 'yaml'
        },
        {
          title: 'defaults/main.yml',
          key: 'role-common-defaults',
          icon: <FileOutlined />,
          isLeaf: true,
          content: `---
# Default variables for common role

project_name: infraux-managed
environment: dev
enable_monitoring: true
enable_logging: true

common_tags:
  Environment: "{{ environment }}"
  Project: "{{ project_name }}"
  ManagedBy: Ansible
  CreatedBy: InfraUX`,
          language: 'yaml'
        },
        {
          title: 'meta/main.yml',
          key: 'role-common-meta',
          icon: <FileOutlined />,
          isLeaf: true,
          content: `---
galaxy_info:
  author: InfraUX
  description: Common role for infrastructure setup
  license: MIT
  min_ansible_version: 2.9
  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
    - name: Amazon Linux
      versions:
        - all

dependencies: []`,
          language: 'yaml'
        }
      ]
    }];

    // Crear roles específicos por proveedor
    Object.entries(roleGroups).forEach(([roleType, nodes]) => {
      if (roleType !== 'generic') {
        roles.push({
          title: roleType,
          key: `role-${roleType}`,
          icon: <FolderOutlined />,
          children: [
            {
              title: 'tasks/main.yml',
              key: `role-${roleType}-tasks`,
              icon: <FileOutlined />,
              isLeaf: true,
              content: generateAnsibleRoleTasks(roleType, nodes),
              language: 'yaml'
            },
            {
              title: 'defaults/main.yml',
              key: `role-${roleType}-defaults`,
              icon: <FileOutlined />,
              isLeaf: true,
              content: generateAnsibleRoleDefaults(roleType, nodes),
              language: 'yaml'
            },
            {
              title: 'handlers/main.yml',
              key: `role-${roleType}-handlers`,
              icon: <FileOutlined />,
              isLeaf: true,
              content: `---
# Handlers for ${roleType} role

- name: restart services
  debug:
    msg: "Services restarted"

- name: validate deployment
  debug:
    msg: "Deployment validated"`,
              language: 'yaml'
            }
          ]
        });
      }
    });

    return roles;
  };

  const generateAnsibleRoleTasks = (roleType: string, nodes: any[]) => {
    return `---
# Tasks for ${roleType.toUpperCase()} resources

- name: Include common tasks
  include_role:
    name: common

${nodes.map((node, index) => `
- name: Deploy ${node.data?.label || node.id}
  block:
    - name: Create ${node.data?.label || node.id}
      # TODO: Implement actual ${roleType} resource creation
      debug:
        msg: "Creating ${node.data?.resourceType || node.type} resource"
      tags:
        - create
        - ${node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id}

    - name: Configure ${node.data?.label || node.id}
      # TODO: Implement configuration
      debug:
        msg: "Configuring resource with provided parameters"
      when: configure_resources | default(true) | bool
      tags:
        - configure
        - ${node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id}

  rescue:
    - name: Handle deployment failure
      debug:
        msg: "Failed to deploy ${node.data?.label || node.id}"
      failed_when: false
`).join('\n')}

- name: Validate all ${roleType} resources
  debug:
    msg: "All ${roleType} resources deployed successfully"
  notify: validate deployment`;
  };

  const generateAnsibleRoleDefaults = (roleType: string, nodes: any[]) => {
    return `---
# Default variables for ${roleType} role

# ${roleType.toUpperCase()} specific configuration
${roleType}_region: ${roleType === 'aws' ? 'us-east-1' : roleType === 'gcp' ? 'us-central1' : 'eastus'}
${roleType}_enable_monitoring: true
${roleType}_enable_backup: false

# Resource configurations
${nodes.map(node => {
  const name = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
  return `
${name}_config:
  enabled: true
  tags: "{{ common_tags }}"`;
}).join('\n')}`;
  };

  const generateAnsibleVars = () => {
    return `---
environment: dev
region: us-east-1`;
  };

  const generateCloudFormationTemplate = () => {
    const awsResources = resourceNodes.filter((n: any) => n.data?.provider === 'aws');
    
    const resources = awsResources.map((node: any) => {
      const name = node.data?.label?.replace(/\s+/g, '') || node.id;
      const resourceType = node.data?.resourceType || node.type || '';
      
      // Remover el prefijo 'aws_' si existe
      const cleanResourceType = resourceType.startsWith('aws_') ? resourceType.substring(4) : resourceType;
      
      switch(cleanResourceType) {
        case 's3_bucket':
          return `  ${name}:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '\${AWS::StackName}-${name.toLowerCase()}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: ${node.data?.label || name}
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: InfraUX`;
          
        case 'ec2_instance':
          return `  ${name}:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref ${name}AMI
      InstanceType: !Ref ${name}InstanceType
      SubnetId: !Ref SubnetId
      SecurityGroupIds:
        - !Ref ${name}SecurityGroup
      Tags:
        - Key: Name
          Value: ${node.data?.label || name}
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: InfraUX

  ${name}SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ${node.data?.label || name}
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-${name.toLowerCase()}-sg'`;
          
        case 'rds_instance':
          return `  ${name}:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '\${AWS::StackName}-${name.toLowerCase()}'
      DBInstanceClass: !Ref ${name}InstanceClass
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: !Ref ${name}MasterUsername
      MasterUserPassword: !Ref ${name}MasterPassword
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      DBSubnetGroupName: !Ref ${name}SubnetGroup
      VPCSecurityGroups:
        - !Ref ${name}SecurityGroup
      Tags:
        - Key: Name
          Value: ${node.data?.label || name}
        - Key: Environment
          Value: !Ref Environment

  ${name}SubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for ${node.data?.label || name}
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-${name.toLowerCase()}-subnet-group'

  ${name}SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS ${node.data?.label || name}
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-${name.toLowerCase()}-sg'`;
          
        case 'dynamodb_table':
          return `  ${name}:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '\${AWS::StackName}-${name.toLowerCase()}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: ${node.data?.label || name}
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: InfraUX`;
          
        case 'sqs_queue':
          return `  ${name}:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '\${AWS::StackName}-${name.toLowerCase()}'
      VisibilityTimeout: 300
      MessageRetentionPeriod: 1209600  # 14 days
      ReceiveMessageWaitTimeSeconds: 20  # Long polling
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: ${node.data?.label || name}
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: InfraUX

  ${name}DeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '\${AWS::StackName}-${name.toLowerCase()}-dlq'
      MessageRetentionPeriod: 1209600  # 14 days
      KmsMasterKeyId: alias/aws/sqs
      Tags:
        - Key: Name
          Value: !Sub '${node.data?.label || name} DLQ'
        - Key: Environment
          Value: !Ref Environment`;
          
        case 'efs_file_system':
          return `  ${name}:
    Type: AWS::EFS::FileSystem
    Properties:
      Encrypted: true
      FileSystemTags:
        - Key: Name
          Value: ${node.data?.label || name}
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: InfraUX
      PerformanceMode: generalPurpose
      ThroughputMode: bursting
      LifecyclePolicies:
        - TransitionToIA: AFTER_30_DAYS

  ${name}MountTarget1:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref ${name}
      SubnetId: !Ref PrivateSubnetA
      SecurityGroups:
        - !Ref ${name}SecurityGroup

  ${name}MountTarget2:
    Type: AWS::EFS::MountTarget
    Properties:
      FileSystemId: !Ref ${name}
      SubnetId: !Ref PrivateSubnetB
      SecurityGroups:
        - !Ref ${name}SecurityGroup

  ${name}SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EFS ${node.data?.label || name}
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 2049
          ToPort: 2049
          SourceSecurityGroupId: !Ref AppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-${name.toLowerCase()}-sg'`;
          
        default:
          return `  # Resource type '${cleanResourceType}' not yet implemented for ${name}
  ${name}:
    Type: AWS::CloudFormation::WaitConditionHandle  # Placeholder
    Properties: {}`;
      }
    }).join('\n\n');
    
    // Generar outputs basados en los recursos
    const outputs = awsResources.map((node: any) => {
      const name = node.data?.label?.replace(/\s+/g, '') || node.id;
      const resourceType = node.data?.resourceType || node.type || '';
      const cleanResourceType = resourceType.startsWith('aws_') ? resourceType.substring(4) : resourceType;
      
      switch(cleanResourceType) {
        case 's3_bucket':
          return `  ${name}BucketName:
    Description: Name of the S3 bucket
    Value: !Ref ${name}
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-bucket-name'
  
  ${name}BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt ${name}.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-bucket-arn'`;
      
        case 'ec2_instance':
          return `  ${name}InstanceId:
    Description: Instance ID
    Value: !Ref ${name}
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-instance-id'
  
  ${name}PublicIP:
    Description: Public IP of the instance
    Value: !GetAtt ${name}.PublicIp
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-public-ip'`;
      
        case 'rds_instance':
          return `  ${name}Endpoint:
    Description: RDS instance endpoint
    Value: !GetAtt ${name}.Endpoint.Address
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-endpoint'`;
      
        case 'dynamodb_table':
          return `  ${name}TableName:
    Description: DynamoDB table name
    Value: !Ref ${name}
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-table-name'
  
  ${name}StreamArn:
    Description: DynamoDB stream ARN
    Value: !GetAtt ${name}.StreamArn
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-stream-arn'`;
      
        case 'sqs_queue':
          return `  ${name}QueueUrl:
    Description: SQS queue URL
    Value: !Ref ${name}
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-queue-url'
  
  ${name}QueueArn:
    Description: SQS queue ARN
    Value: !GetAtt ${name}.Arn
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-queue-arn'`;
      
        case 'efs_file_system':
          return `  ${name}FileSystemId:
    Description: EFS file system ID
    Value: !Ref ${name}
    Export:
      Name: !Sub '\${AWS::StackName}-${name}-fs-id'`;
      
        default:
          return '';
      }
    }).filter(output => output !== '').join('\n\n');
    
    // Generar parámetros adicionales necesarios
    const parameters: string[] = [`  Environment:
    Type: String
    Default: dev
    Description: Environment name
    AllowedValues:
      - dev
      - staging
      - prod`];
      
    // Agregar parámetros específicos según los recursos
    const hasEC2 = awsResources.some((n: any) => (n.data?.resourceType || n.type || '').includes('ec2_instance'));
    const hasRDS = awsResources.some((n: any) => (n.data?.resourceType || n.type || '').includes('rds_instance'));
    const hasVPCResources = hasEC2 || hasRDS || awsResources.some((n: any) => 
      (n.data?.resourceType || n.type || '').includes('efs_file_system')
    );
    
    if (hasVPCResources) {
      parameters.push(`  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID for resources`);
      
      parameters.push(`  SubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: Subnet ID for EC2 instances`);
      
      if (hasRDS || awsResources.some((n: any) => (n.data?.resourceType || n.type || '').includes('efs_file_system'))) {
        parameters.push(`  PrivateSubnetA:
    Type: AWS::EC2::Subnet::Id
    Description: First private subnet ID`);
        
        parameters.push(`  PrivateSubnetB:
    Type: AWS::EC2::Subnet::Id
    Description: Second private subnet ID`);
      }
      
      parameters.push(`  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup::Id
    Description: Application security group ID`);
    }
    
    // Parámetros específicos por tipo de recurso
    awsResources.forEach((node: any) => {
      const name = node.data?.label?.replace(/\s+/g, '') || node.id;
      const resourceType = node.data?.resourceType || node.type || '';
      const cleanResourceType = resourceType.startsWith('aws_') ? resourceType.substring(4) : resourceType;
      
      if (cleanResourceType === 'ec2_instance') {
        parameters.push(`  ${name}AMI:
    Type: AWS::EC2::Image::Id
    Description: AMI ID for ${node.data?.label || name}
    Default: ami-0c94855ba95c574c8  # Amazon Linux 2023`);
        
        parameters.push(`  ${name}InstanceType:
    Type: String
    Description: Instance type for ${node.data?.label || name}
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large`);
      }
      
      if (cleanResourceType === 'rds_instance') {
        parameters.push(`  ${name}InstanceClass:
    Type: String
    Description: RDS instance class for ${node.data?.label || name}
    Default: db.t3.micro
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium`);
        
        parameters.push(`  ${name}MasterUsername:
    Type: String
    Description: Master username for ${node.data?.label || name}
    Default: admin
    MinLength: 1
    MaxLength: 16
    NoEcho: true`);
        
        parameters.push(`  ${name}MasterPassword:
    Type: String
    Description: Master password for ${node.data?.label || name}
    MinLength: 8
    MaxLength: 41
    NoEcho: true`);
      }
    });
    
    return `AWSTemplateFormatVersion: '2010-09-09'
Description: 'InfraUX Generated CloudFormation Template - ${new Date().toISOString()}'

Parameters:
${parameters.join('\n\n')}

Resources:
${resources}

Outputs:
  StackName:
    Description: Stack name
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '\${AWS::StackName}-stack-name'
  
${outputs}`;
  };

  const generateCloudFormationParameters = () => {
    return JSON.stringify([
      {
        ParameterKey: "ProjectName",
        ParameterValue: "infraux-managed"
      },
      {
        ParameterKey: "Environment",
        ParameterValue: "dev"
      },
      {
        ParameterKey: "EnableMonitoring",
        ParameterValue: "true"
      },
      {
        ParameterKey: "EnableLogging", 
        ParameterValue: "true"
      },
      {
        ParameterKey: "CostCenter",
        ParameterValue: "engineering"
      },
      {
        ParameterKey: "Owner",
        ParameterValue: "devops-team"
      }
    ], null, 2);
  };

  // Generar README principal del proyecto
  const generateProjectReadme = (iac: IaCProvider) => {
    const providers = new Set<string>();
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider;
      if (provider && provider !== 'generic') {
        providers.add(provider);
      }
    });

    const iacNames: Record<IaCProvider, string> = {
      terraform: 'Terraform',
      pulumi: 'Pulumi',
      ansible: 'Ansible',
      cloudformation: 'CloudFormation'
    };

    return `# InfraUX Infrastructure Project

Generated on ${new Date().toLocaleDateString()}

## Overview
This project contains ${iacNames[iac]} infrastructure code generated by InfraUX based on your visual diagram.

## Resources
Total resources: **${resourceNodes.length}**

### By Provider
${Array.from(providers).map(p => `- **${p.toUpperCase()}**: ${resourceNodes.filter((n: any) => n.data?.provider === p).length} resources`).join('\n')}

### Resource List
${resourceNodes.map((node: any) => `- **${node.data?.label || node.id}** (${node.data?.resourceType || node.type})`).join('\n')}

## Prerequisites

${iac === 'terraform' ? `- Terraform >= 1.5.0
- AWS CLI configured (if using AWS resources)
- GCP CLI configured (if using GCP resources)
- Azure CLI configured (if using Azure resources)` : ''}
${iac === 'pulumi' ? `- Pulumi CLI >= 3.0.0
- Node.js >= 16.0.0
- npm or yarn
- Cloud provider CLIs configured` : ''}
${iac === 'ansible' ? `- Ansible >= 2.9
- Python >= 3.6
- Cloud provider SDKs (boto3, google-cloud-sdk, azure-cli)` : ''}
${iac === 'cloudformation' ? `- AWS CLI configured
- Valid AWS credentials with appropriate permissions` : ''}

## Quick Start

${iac === 'terraform' ? `1. Initialize Terraform:
   \`\`\`bash
   terraform init
   \`\`\`

2. Copy and update the variables file:
   \`\`\`bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   \`\`\`

3. Plan the deployment:
   \`\`\`bash
   terraform plan
   \`\`\`

4. Apply the infrastructure:
   \`\`\`bash
   terraform apply
   \`\`\`` : ''}
${iac === 'pulumi' ? `1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create a new stack:
   \`\`\`bash
   pulumi stack init <stack-name>
   \`\`\`

3. Configure the stack:
   \`\`\`bash
   pulumi config set infraux:project <project-name>
   pulumi config set infraux:environment <environment>
   \`\`\`

4. Deploy:
   \`\`\`bash
   pulumi up
   \`\`\`` : ''}
${iac === 'ansible' ? `1. Update the inventory file with your hosts

2. Run the playbook:
   \`\`\`bash
   ansible-playbook -i inventory.ini playbook.yml
   \`\`\`

3. For specific environments:
   \`\`\`bash
   ansible-playbook -i inventory.ini playbook.yml -e "environment=prod"
   \`\`\`` : ''}
${iac === 'cloudformation' ? `1. Deploy the stack:
   \`\`\`bash
   aws cloudformation create-stack \\
     --stack-name infraux-stack \\
     --template-body file://template.yaml \\
     --parameters file://parameters.json \\
     --capabilities CAPABILITY_IAM
   \`\`\`

2. Monitor the deployment:
   \`\`\`bash
   aws cloudformation describe-stack-events \\
     --stack-name infraux-stack
   \`\`\`` : ''}

## Directory Structure

${iac === 'terraform' ? `\`\`\`
terraform/
├── README.md           # This file
├── main.tf            # Main resource definitions
├── variables.tf       # Variable declarations
├── outputs.tf         # Output values
├── providers.tf       # Provider configurations
├── terraform.tfvars.example  # Example variables file
└── modules/           # Reusable modules
    ├── aws/           # AWS-specific resources
    ├── gcp/           # GCP-specific resources
    └── azure/         # Azure-specific resources
\`\`\`` : ''}

## Environment Management

This project supports multiple environments:
- **dev**: Development environment
- **staging**: Staging/QA environment
- **prod**: Production environment

${iac === 'terraform' ? 'Use workspaces or separate state files for each environment.' : ''}
${iac === 'pulumi' ? 'Use different stacks for each environment.' : ''}

## Security Considerations

- Never commit sensitive data (passwords, API keys, etc.)
- Use secret management tools for credentials
- Enable encryption for all storage resources
- Follow the principle of least privilege for IAM roles
- Regularly review and update security groups/firewall rules

## Monitoring & Logging

All resources are configured with:
- CloudWatch/Stackdriver/Azure Monitor integration
- Centralized logging
- Performance metrics
- Alerting capabilities

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions:
- Check the documentation at https://infraux.com/docs
- Contact support at support@infraux.com

## License

Copyright © ${new Date().getFullYear()} InfraUX. All rights reserved.
`;
  };

  // Generar archivo de ejemplo terraform.tfvars
  const generateTerraformTfvarsExample = () => {
    const providers = new Set<string>();
    const variables: string[] = [];
    
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider;
      if (provider && provider !== 'generic') {
        providers.add(provider);
      }
    });

    variables.push(`# Project Configuration
project_name = "my-project"
environment  = "dev"`);

    if (providers.has('aws')) {
      variables.push(`
# AWS Configuration
aws_region = "us-east-1"`);
    }

    if (providers.has('gcp')) {
      variables.push(`
# GCP Configuration
gcp_project_id = "my-gcp-project-id"
gcp_region     = "us-central1"`);
    }

    if (providers.has('azure')) {
      variables.push(`
# Azure Configuration
azure_region = "eastus"`);
    }

    // Variables específicas de recursos
    resourceNodes.forEach((node: any) => {
      const resourceName = node.data?.label?.toLowerCase().replace(/\s+/g, '_') || node.id;
      const resourceType = node.data?.resourceType || node.type;
      
      if (node.data?.provider === 'aws') {
        const resourceTypeKey = resourceType.startsWith('aws_') ? resourceType.substring(4) : resourceType;
        
        switch(resourceTypeKey) {
          case 's3_bucket':
            variables.push(`
# S3 Bucket: ${node.data?.label || node.id}
${resourceName}_bucket_name = "my-unique-bucket-name"`);
            break;
            
          case 'ec2_instance':
            variables.push(`
# EC2 Instance: ${node.data?.label || node.id}
${resourceName}_ami_id        = "ami-0abcdef1234567890"
${resourceName}_instance_type = "t3.micro"`);
            break;
            
          case 'rds_instance':
            variables.push(`
# RDS Instance: ${node.data?.label || node.id}
${resourceName}_identifier     = "my-database"
${resourceName}_instance_class = "db.t3.micro"
${resourceName}_database_name  = "myapp"
${resourceName}_username       = "admin"
${resourceName}_password       = "CHANGE_ME_TO_SECURE_PASSWORD"`);
            break;
        }
      }
    });

    return variables.join('\n');
  };


  // Memoizar la estructura de archivos
  const fileStructure = useMemo(() => generateFileStructure(selectedIaC), [selectedIaC]);

  // Encontrar el archivo seleccionado
  const findFileContent = (nodes: FileNode[], key: string): { content: string; language: string } | null => {
    for (const node of nodes) {
      if (node.key === key && node.content) {
        return { content: node.content, language: node.language || 'text' };
      }
      if (node.children) {
        const found = findFileContent(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedFileData = useMemo(() => {
    const fileData = findFileContent(fileStructure, selectedFile);
    if (!fileData || !removeComments) return fileData;
    
    // Remover comentarios según el lenguaje
    let cleanContent = fileData.content;
    
    if (fileData.language === 'hcl' || fileData.language === 'terraform') {
      // Remover comentarios de línea (#) y de bloque (/* */)
      cleanContent = cleanContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios de bloque
        .replace(/#.*$/gm, '') // Comentarios de línea
        .replace(/^\s*[\r\n]/gm, '') // Líneas vacías
        .trim();
    } else if (fileData.language === 'typescript' || fileData.language === 'javascript') {
      // Remover comentarios de línea (//) y de bloque (/* */)
      cleanContent = cleanContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios de bloque
        .replace(/\/\/.*$/gm, '') // Comentarios de línea
        .replace(/^\s*[\r\n]/gm, '') // Líneas vacías
        .trim();
    } else if (fileData.language === 'yaml') {
      // Remover comentarios de línea (#)
      cleanContent = cleanContent
        .replace(/#.*$/gm, '') // Comentarios de línea
        .replace(/^\s*[\r\n]/gm, '') // Líneas vacías
        .trim();
    } else if (fileData.language === 'json') {
      // JSON no tiene comentarios oficiales
      cleanContent = fileData.content;
    }
    
    return {
      ...fileData,
      content: cleanContent
    };
  }, [fileStructure, selectedFile, removeComments]);

  // Handlers
  const handleCopyCode = () => {
    if (selectedFileData?.content) {
      navigator.clipboard.writeText(selectedFileData.content);
      setCopiedFile(selectedFile);
      message.success('Código copiado al portapapeles');
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  const handleDownloadAll = () => {
    // Crear un blob con todos los archivos
    const collectFiles = (nodes: FileNode[], path = ''): { path: string; content: string }[] => {
      let files: { path: string; content: string }[] = [];
      
      nodes.forEach(node => {
        const currentPath = path ? `${path}/${node.title}` : node.title;
        
        if (node.isLeaf && node.content) {
          files.push({ path: currentPath, content: node.content });
        }
        
        if (node.children) {
          files = files.concat(collectFiles(node.children, currentPath));
        }
      });
      
      return files;
    };
    
    const files = collectFiles(fileStructure);
    
    // Crear un archivo tar simple (sin compresión)
    let tarContent = '';
    files.forEach((file: { path: string; content: string }) => {
      tarContent += `=== ${file.path} ===\n${file.content}\n\n`;
    });
    
    const blob = new Blob([tarContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infraux-${selectedIaC}-code.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('Código descargado');
  };

  // Obtener estadísticas de los recursos
  const getResourceStats = () => {
    const stats = {
      total: resourceNodes.length,
      byProvider: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };
    
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider || 'generic';
      const type = node.data?.resourceType || node.type || 'unknown';
      
      stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    
    return stats;
  };

  const resourceStats = useMemo(() => getResourceStats(), [resourceNodes]);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'terraform':
        return <DeploymentUnitOutlined className="text-purple-500" />;
      case 'pulumi':
        return <CloudOutlined className="text-blue-500" />;
      case 'ansible':
        return <CodeOutlined className="text-red-500" />;
      case 'cloudformation':
        return <AmazonOutlined className="text-orange-500" />;
      default:
        return <CodeOutlined />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'terraform':
        return 'purple';
      case 'pulumi':
        return 'blue';
      case 'ansible':
        return 'red';
      case 'cloudformation':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CodeOutlined className="text-2xl text-blue-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold m-0">Código de Infraestructura Generado</h3>
              <p className="text-xs text-gray-500 m-0">Basado en tu diagrama actual</p>
            </div>
          </div>
          <Space>
            {Object.entries(resourceStats.byProvider).map(([provider, count]) => (
              provider !== 'generic' && (
                <Tag key={provider} color={getProviderColor(provider)} className="flex items-center gap-1">
                  <span className="font-semibold">{count}</span>
                  <span className="text-xs">{provider}</span>
                </Tag>
              )
            ))}
            <Badge count={resourceStats.total} style={{ backgroundColor: '#52c41a' }} showZero />
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1400}
      footer={null}
      className="generated-code-modal"
      style={{ top: 20 }}
      styles={{ 
        body: { 
          padding: 0, 
          height: 'calc(100vh - 200px)',
          background: 'linear-gradient(to bottom, #f8fafc, #ffffff)'
        } 
      }}
    >
      <div className="flex h-full">
        {/* Panel izquierdo - Estructura de archivos */}
        <div className="w-80 border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 overflow-y-auto">
          {/* Selector de IaC mejorado */}
          <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">SELECCIONA TU PLATAFORMA</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedIaC('terraform');
                  setSelectedFile('main');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedIaC === 'terraform' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DeploymentUnitOutlined className={`text-2xl ${selectedIaC === 'terraform' ? 'text-purple-500' : 'text-gray-500'}`} />
                <div className={`text-sm font-medium mt-1 ${selectedIaC === 'terraform' ? 'text-purple-700' : 'text-gray-700'}`}>
                  Terraform
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedIaC('pulumi');
                  setSelectedFile('main');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedIaC === 'pulumi' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CloudOutlined className={`text-2xl ${selectedIaC === 'pulumi' ? 'text-blue-500' : 'text-gray-500'}`} />
                <div className={`text-sm font-medium mt-1 ${selectedIaC === 'pulumi' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Pulumi
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedIaC('ansible');
                  setSelectedFile('main');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedIaC === 'ansible' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CodeOutlined className={`text-2xl ${selectedIaC === 'ansible' ? 'text-red-500' : 'text-gray-500'}`} />
                <div className={`text-sm font-medium mt-1 ${selectedIaC === 'ansible' ? 'text-red-700' : 'text-gray-700'}`}>
                  Ansible
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedIaC('cloudformation');
                  setSelectedFile('main');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedIaC === 'cloudformation' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AmazonOutlined className={`text-2xl ${selectedIaC === 'cloudformation' ? 'text-orange-500' : 'text-gray-500'}`} />
                <div className={`text-sm font-medium mt-1 ${selectedIaC === 'cloudformation' ? 'text-orange-700' : 'text-gray-700'}`}>
                  CloudFormation
                </div>
              </button>
            </div>
          </div>
          
          {/* Resumen de recursos */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <InfoCircleOutlined className="text-blue-500" />
              <span className="text-sm font-medium text-blue-900">Resumen de Recursos</span>
            </div>
            <div className="space-y-1">
              {Object.entries(resourceStats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Opciones de generación */}
          <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Opciones</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CommentOutlined className="text-gray-500" />
                  <span className="text-xs text-gray-600">Eliminar comentarios</span>
                </div>
                <Switch 
                  size="small" 
                  checked={removeComments}
                  onChange={setRemoveComments}
                />
              </div>
            </div>
          </div>

          {/* Estructura de archivos */}
          <div className="mb-4 bg-white rounded-lg p-3 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FolderOpenOutlined className="text-amber-500" />
              Estructura de Archivos
            </h4>
            <Tree
              treeData={fileStructure}
              selectedKeys={[selectedFile]}
              expandedKeys={expandedKeys}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  setSelectedFile(keys[0] as string);
                }
              }}
              onExpand={(keys) => setExpandedKeys(keys as string[])}
              showIcon
              className="text-sm"
            />
          </div>
          
          {/* Acciones */}
          <div className="mt-4 space-y-2">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadAll}
              block
              type="primary"
              size="middle"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              Descargar Todo
            </Button>
            <div className="text-xs text-gray-500 text-center mt-2">
              <InfoCircleOutlined className="mr-1" />
              Incluye todos los archivos de configuración
            </div>
          </div>
        </div>
        
        {/* Panel derecho - Código */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3">
              <FileOutlined className="text-gray-500" />
              <div>
                <h4 className="text-sm font-semibold text-gray-800 m-0">
                  {selectedFileData ? selectedFile.split('-').pop() : 'Selecciona un archivo'}
                </h4>
                {selectedFileData && (
                  <p className="text-xs text-gray-500 m-0">
                    Lenguaje: {selectedFileData.language.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <Space>
              {copiedFile === selectedFile && (
                <span className="text-xs text-green-600 animate-fade-in">
                  ¡Copiado al portapapeles!
                </span>
              )}
              <Tooltip title={copiedFile === selectedFile ? 'Copiado!' : 'Copiar código'}>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={handleCopyCode}
                  disabled={!selectedFileData}
                  type={copiedFile === selectedFile ? 'primary' : 'default'}
                  className={copiedFile === selectedFile ? 'bg-green-500 border-green-500' : ''}
                >
                  {copiedFile === selectedFile ? 'Copiado!' : 'Copiar'}
                </Button>
              </Tooltip>
            </Space>
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-900">
            {selectedFileData ? (
              selectedFileData.language === 'markdown' ? (
                // Renderizar Markdown
                <div className="bg-white text-gray-900 p-8 h-full overflow-auto">
                  <div className="max-w-4xl mx-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Personalizar estilos de componentes de Markdown
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3" {...props} />,
                        h4: ({node, ...props}) => <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-600 mb-4 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                        code: ({node, children, className, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && typeof children === 'string';
                          return isInline ? (
                            <code className="bg-gray-100 text-purple-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto font-mono text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({node, ...props}) => <pre className="mb-4" {...props} />,
                        blockquote: ({node, ...props}) => 
                          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 italic text-gray-700" {...props} />,
                        a: ({node, ...props}) => 
                          <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        table: ({node, ...props}) => 
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-gray-200" {...props} />
                          </div>,
                        thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                        tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                        th: ({node, ...props}) => 
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
                        td: ({node, ...props}) => 
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" {...props} />,
                        hr: ({node, ...props}) => <hr className="my-8 border-gray-200" {...props} />,
                      }}
                    >
                      {selectedFileData.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                // Renderizar código con syntax highlighting
                <div className="animate-fade-in">
                  <SyntaxHighlighter
                    language={selectedFileData.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: 'transparent',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      padding: '1.5rem'
                    }}
                    showLineNumbers
                    wrapLines
                    lineProps={{
                      style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' }
                    }}
                  >
                    {selectedFileData.content}
                  </SyntaxHighlighter>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileOutlined className="text-6xl mb-4 opacity-20" />
                <p className="text-lg">Selecciona un archivo para ver su contenido</p>
                <p className="text-sm mt-2 opacity-70">
                  El código se genera automáticamente basado en tu diagrama
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GeneratedCodeModal;
