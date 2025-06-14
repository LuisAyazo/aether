'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Tabs, Button, message, Tooltip, Tree, Radio, Badge, Tag, Space, Divider, Switch, Spin, Drawer } from 'antd';
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
  ReadOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Node } from "../../services/diagramService";
import { getResourceConfig } from "../../config/schemas";
import { useNavigationStore } from '../../stores/useNavigationStore';

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

const GeneratedCodeModal: React.FC = () => {
  const {
    generatedCodeModalVisible: visible,
    setGeneratedCodeModalVisible,
    isGeneratingCode,
    generatedCode,
    currentDiagram,
    isLivePreviewEnabled,
    setLivePreviewEnabled,
    isCodeGenerating,
    lastCodeGenerationTimestamp,
  } = useNavigationStore();

  const onClose = () => setGeneratedCodeModalVisible(false);
  const nodes = currentDiagram?.nodes || [];

  const [selectedIaC, setSelectedIaC] = useState<IaCProvider>('terraform');
  const [selectedFile, setSelectedFile] = useState<string>('main');
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['root']);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [removeComments, setRemoveComments] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Cargar el estado del Live Preview desde localStorage al montar
  useEffect(() => {
    if (visible) {
      const { activeCompany } = useNavigationStore.getState();
      const companyId = activeCompany?._id || activeCompany?.id;
      
      console.log('🔍 DEBUG - Cargando estado del Live Preview:', {
        visible,
        hasInitialized,
        activeCompany,
        companyId,
        currentLivePreviewEnabled: isLivePreviewEnabled,
        allLocalStorageKeys: typeof window !== 'undefined' ? Object.keys(localStorage) : []
      });
      
      if (companyId && typeof window !== 'undefined') {
        const key = `livePreviewEnabled_${companyId}`;
        const savedLivePreviewState = localStorage.getItem(key);
        
        console.log('🔍 DEBUG - Estado guardado en localStorage:', {
          key,
          savedValue: savedLivePreviewState,
          parsedValue: savedLivePreviewState ? JSON.parse(savedLivePreviewState) : null,
          allLivePreviewKeys: Object.keys(localStorage).filter(k => k.includes('livePreviewEnabled'))
        });
        
        if (savedLivePreviewState !== null) {
          try {
            const isEnabled = JSON.parse(savedLivePreviewState);
            console.log('🔍 DEBUG - Aplicando estado del Live Preview:', {
              isEnabled,
              currentState: isLivePreviewEnabled,
              willUpdate: isEnabled !== isLivePreviewEnabled
            });
            
            // Siempre aplicar el estado guardado cuando se abre el modal
            if (isEnabled && !isLivePreviewEnabled) {
              console.log('✅ DEBUG - Activando Live Preview desde localStorage');
              setLivePreviewEnabled(true);
            } else if (!isEnabled && isLivePreviewEnabled) {
              console.log('✅ DEBUG - Desactivando Live Preview desde localStorage');
              setLivePreviewEnabled(false);
            }
          } catch (e) {
            console.error("❌ Error parsing livePreviewEnabled from localStorage", e);
          }
        } else {
          console.log('⚠️ DEBUG - No hay estado guardado del Live Preview para esta compañía');
        }
      } else {
        console.log('⚠️ DEBUG - No se puede cargar estado: companyId no disponible o window undefined');
      }
    }
  }, [visible]); // Removemos las dependencias para que se ejecute cada vez que se abre el modal

  // Obtener todos los nodos de recursos (excluir notas, grupos, áreas)
  const resourceNodes = useMemo(() => {
    if (!nodes || !Array.isArray(nodes)) {
      console.log('❌ No hay nodos disponibles');
      return [];
    }
    
    const utilityTypes = ['areaNode', 'noteNode', 'textNode', 'group'];
    const filtered = nodes.filter((node: any) => {
      const nodeType = node.type || '';
      const isUtility = utilityTypes.includes(nodeType);
      
      if (isUtility || !node.data) return false;
      
      // Un nodo es un recurso si tiene provider y resourceType
      const hasProvider = node.data.provider && node.data.provider !== 'generic';
      const hasResourceType = node.data.resourceType || nodeType.includes('_');
      
      // Log para debug
      if (hasProvider || hasResourceType) {
        console.log('🔍 Nodo de recurso detectado:', {
          id: node.id,
          type: nodeType,
          provider: node.data.provider,
          resourceType: node.data.resourceType,
          label: node.data.label,
          hasDynamicProperties: !!node.data.dynamicProperties,
          dynamicPropertiesKeys: node.data.dynamicProperties ? Object.keys(node.data.dynamicProperties) : []
        });
      }
      
      return hasProvider || hasResourceType;
    });
    
    console.log(`📊 Total de nodos de recursos encontrados: ${filtered.length} de ${nodes.length} nodos totales`);
    
    // Transformar los nodos para que tengan una estructura consistente
    return filtered.map((node: any) => {
      // Extraer categoría del resourceType si no existe
      let category = node.data.category || node.data.service;
      if (!category && node.data.resourceType) {
        const resourceType = node.data.resourceType;
        if (resourceType.includes('s3') || resourceType.includes('storage') || resourceType.includes('blob')) {
          category = 'storage';
        } else if (resourceType.includes('ec2') || resourceType.includes('compute') || resourceType.includes('vm')) {
          category = 'compute';
        } else if (resourceType.includes('rds') || resourceType.includes('sql') || resourceType.includes('database')) {
          category = 'database';
        } else if (resourceType.includes('lambda') || resourceType.includes('function')) {
          category = 'serverless';
        } else if (resourceType.includes('vpc') || resourceType.includes('network')) {
          category = 'network';
        } else {
          category = 'compute'; // Default
        }
      }
      
      return {
        ...node,
        data: {
          ...node.data,
          provider: node.data.provider || 'aws', // Default to AWS if no provider
          category: category || 'compute',
          label: node.data.label || node.data.name || node.id,
          // Usar dynamicProperties si existe, sino properties
          properties: node.data.dynamicProperties || node.data.properties || {},
          resourceType: node.data.resourceType || node.type
        }
      };
    });
  }, [nodes]);

  // Actualizar el tiempo de última actualización cuando cambie el timestamp
  useEffect(() => {
    if (lastCodeGenerationTimestamp) {
      setLastUpdateTime(new Date(lastCodeGenerationTimestamp));
    }
  }, [lastCodeGenerationTimestamp]);

  // Efecto para generar código cuando se abre el modal por primera vez
  useEffect(() => {
    if (visible && !hasInitialized) {
      console.log('🚀 Modal abierto por primera vez, generando código inicial...');
      setHasInitialized(true);
      
      // Generar código si hay recursos
      if (resourceNodes.length > 0 && Object.keys(generatedCode).length === 0) {
        console.log('📝 Generando código inicial para', resourceNodes.length, 'recursos');
        const { generateCodeAndShowModal } = useNavigationStore.getState();
        generateCodeAndShowModal();
      }
    }
  }, [visible, hasInitialized, resourceNodes.length, generatedCode]);

  // Efecto para generar código cuando se activa el Live Preview
  useEffect(() => {
    if (isLivePreviewEnabled && visible) {
      console.log('🚀 Live Preview activado, verificando código generado:', {
        isLivePreviewEnabled,
        visible,
        generatedCodeKeys: Object.keys(generatedCode),
        generatedCodeLength: Object.keys(generatedCode).length,
        resourceNodesCount: resourceNodes.length,
        resourceNodes: resourceNodes.map(n => ({
          id: n.id,
          type: n.type,
          data: n.data
        }))
      });
      
      // Si no hay código generado o hay recursos pero no código, forzar la generación
      if (Object.keys(generatedCode).length === 0 || (resourceNodes.length > 0 && !generatedCode['terraform-main'])) {
        console.log('📝 Forzando generación de código...');
        const { generateCodeAndShowModal } = useNavigationStore.getState();
        generateCodeAndShowModal();
      }
    }
  }, [isLivePreviewEnabled, visible, resourceNodes.length]);

  // Efecto para escuchar cambios en el diagrama cuando Live Preview está activo
  useEffect(() => {
    if (isLivePreviewEnabled && visible) {
      const { subscribeToFlowChanges, unsubscribeFromFlowChanges } = useNavigationStore.getState();
      subscribeToFlowChanges();
      
      return () => {
        unsubscribeFromFlowChanges();
      };
    }
  }, [isLivePreviewEnabled, visible]);

  // Formatear tiempo relativo
  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffSecs < 60) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return date.toLocaleDateString();
  };

  // Generar estructura de archivos según el IaC seleccionado
  const generateFileStructure = (iac: IaCProvider): FileNode[] => {
    // Obtener el código principal del store o generar uno por defecto
    const getMainContent = () => {
      if (isCodeGenerating || isGeneratingCode) {
        return '// Generando código...';
      }
      
      // El código se almacena con el sufijo '-main' en el store
      const codeKey = `${iac}-main`;
      const code = generatedCode[codeKey];
      
      // Debug COMPLETO: mostrar TODA la información disponible
      console.log('🔍 DEBUG COMPLETO - Estado del código generado:', {
        iac,
        codeKey,
        hasCode: !!code,
        codeLength: code?.length || 0,
        generatedCodeKeys: Object.keys(generatedCode),
        allGeneratedCode: generatedCode, // Mostrar TODO el código generado
        resourceNodesCount: resourceNodes.length,
        currentDiagram: currentDiagram,
        allNodes: nodes, // Mostrar TODOS los nodos
        resourceNodes: resourceNodes.map(n => ({
          id: n.id,
          type: n.type,
          fullData: n.data, // Mostrar TODA la data del nodo
          provider: n.data?.provider,
          category: n.data?.category,
          label: n.data?.label,
          resourceType: n.data?.resourceType,
          hasProperties: !!(n.data?.properties),
          propertiesCount: n.data?.properties ? Object.keys(n.data.properties).length : 0,
          properties: n.data?.properties // Mostrar las propiedades reales
        }))
      });
      
      // IMPORTANTE: Mostrar el código generado en la consola
      if (code) {
        console.log(`📝 CÓDIGO GENERADO PARA ${iac.toUpperCase()}:`);
        console.log('=====================================');
        console.log(code);
        console.log('=====================================');
      } else {
        console.log(`❌ NO HAY CÓDIGO GENERADO PARA ${iac.toUpperCase()}`);
      }
      
      if (code) {
        return code;
      }
      
      // Si no hay código generado, mostrar mensaje apropiado
      if (resourceNodes.length === 0) {
        switch (iac) {
          case 'terraform':
            return `# No hay nodos de recursos para generar código Terraform
#
# Para generar código, agrega recursos al diagrama que tengan:
# - Provider (aws, gcp, azure)
# - Categoría (compute, storage, etc.)
# - Propiedades configuradas
#
# Los nodos de tipo nota, grupo o área no generan código.`;
          case 'pulumi':
            return `// No hay nodos de recursos para generar código Pulumi
//
// Para generar código, agrega recursos al diagrama que tengan:
// - Provider (aws, gcp, azure)
// - Categoría (compute, storage, etc.)
// - Propiedades configuradas
//
// Los nodos de tipo nota, grupo o área no generan código.`;
          case 'ansible':
            return `# No hay nodos de recursos para generar código Ansible
#
# Para generar código, agrega recursos al diagrama que tengan:
# - Provider (aws, gcp, azure)
# - Categoría (compute, storage, etc.)
# - Propiedades configuradas
#
# Los nodos de tipo nota, grupo o área no generan código.`;
          case 'cloudformation':
            return `# No hay nodos de recursos para generar código CloudFormation
#
# Para generar código, agrega recursos al diagrama que tengan:
# - Provider (aws, gcp, azure)
# - Categoría (compute, storage, etc.)
# - Propiedades configuradas
#
# Los nodos de tipo nota, grupo o área no generan código.`;
        }
      }
      
      // Si hay recursos pero no hay código, generar un código de ejemplo con la configuración real
      if (resourceNodes.length > 0) {
        console.log('⚠️ Generando código de ejemplo para recursos detectados');
        switch (iac) {
          case 'terraform':
            return `# Código Terraform generado para ${resourceNodes.length} recursos
# Generado: ${new Date().toLocaleString()}

terraform {
  required_providers {
${[...new Set(resourceNodes.map(n => n.data?.provider).filter(Boolean))].map(provider =>
`    ${provider} = {
      source = "hashicorp/${provider}"
      version = "~> 5.0"
    }`).join('\n')}
  }
}

# Recursos detectados con su configuración:
${resourceNodes.map(node => {
  const resourceName = (node.data?.label || node.id).toLowerCase().replace(/\s+/g, '_');
  const properties = node.data?.properties || {};
  const hasProperties = Object.keys(properties).length > 0;
  
  return `
# ${node.data?.label || node.id}
# Tipo: ${node.data?.resourceType || node.type}
# Provider: ${node.data?.provider || 'unknown'}
resource "${node.data?.resourceType || node.type || 'unknown'}" "${resourceName}" {
${hasProperties ?
  Object.entries(properties).map(([key, value]) =>
    `  ${key} = ${JSON.stringify(value)}`
  ).join('\n') :
  '  # No hay propiedades configuradas\n  # Haz doble click en el nodo para configurarlo'}
}`;
}).join('\n')}`;
          
          case 'pulumi':
            return `// Código Pulumi generado para ${resourceNodes.length} recursos
// Generado: ${new Date().toLocaleString()}

import * as pulumi from "@pulumi/pulumi";
${[...new Set(resourceNodes.map(n => n.data?.provider).filter(Boolean))].map(provider =>
`import * as ${provider} from "@pulumi/${provider}";`).join('\n')}

// Recursos detectados con su configuración:
${resourceNodes.map(node => {
  const resourceName = (node.data?.label || node.id).toLowerCase().replace(/\s+/g, '_');
  const properties = node.data?.properties || {};
  const hasProperties = Object.keys(properties).length > 0;
  
  return `
// ${node.data?.label || node.id}
// Tipo: ${node.data?.resourceType || node.type}
// Provider: ${node.data?.provider || 'unknown'}
const ${resourceName} = new ${node.data?.provider || 'unknown'}.${node.data?.resourceType || node.type || 'Unknown'}("${(node.data?.label || node.id).toLowerCase().replace(/\s+/g, '-')}", {
${hasProperties ?
  Object.entries(properties).map(([key, value]) =>
    `  ${key}: ${JSON.stringify(value)},`
  ).join('\n').slice(0, -1) :
  '  // No hay propiedades configuradas\n  // Haz doble click en el nodo para configurarlo'}
});`;
}).join('\n')}`;
          
          default:
            return `# Código ${iac} generado para ${resourceNodes.length} recursos
# Recursos detectados:
${resourceNodes.map(node => `# - ${node.data?.label || node.id} (${node.data?.resourceType || node.type})`).join('\n')}`;
        }
      }
      
      return `# Esperando generación de código...
# Si este mensaje persiste, verifica que:
# 1. Hayas agregado recursos válidos al diagrama
# 2. Los recursos tengan provider, categoría y propiedades configuradas
# 3. El Live Preview esté activado si deseas actualización automática
#
# Recursos detectados: ${resourceNodes.length}
# Código generado: ${Object.keys(generatedCode).join(', ') || 'ninguno'}`;
    };

    switch (iac) {
      case 'terraform':
        return [
          {
            title: 'terraform',
            key: 'root',
            icon: <FolderOutlined />,
            children: [
              { title: 'README.md', key: 'readme', icon: <ReadOutlined />, isLeaf: true, content: generateProjectReadme('terraform'), language: 'markdown' },
              { title: 'main.tf', key: 'main', icon: <FileOutlined />, isLeaf: true, content: getMainContent(), language: 'hcl' },
              { title: 'variables.tf', key: 'variables', icon: <FileOutlined />, isLeaf: true, content: generateTerraformVariables(), language: 'hcl' },
              { title: 'outputs.tf', key: 'outputs', icon: <FileOutlined />, isLeaf: true, content: generateTerraformOutputs(), language: 'hcl' },
              { title: 'providers.tf', key: 'providers', icon: <FileOutlined />, isLeaf: true, content: generateTerraformProviders(), language: 'hcl' },
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
              { title: 'index.ts', key: 'main', icon: <FileOutlined />, isLeaf: true, content: getMainContent(), language: 'typescript' },
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
              { title: 'playbook.yml', key: 'main', icon: <FileOutlined />, isLeaf: true, content: getMainContent(), language: 'yaml' },
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
              { title: 'template.yaml', key: 'main', icon: <FileOutlined />, isLeaf: true, content: getMainContent(), language: 'yaml' },
              { title: 'parameters.json', key: 'parameters', icon: <FileOutlined />, isLeaf: true, content: generateCloudFormationParameters(), language: 'json' }
            ]
          }
        ];
    }
  };

  // Funciones auxiliares simplificadas
  const generateTerraformVariables = () => {
    return `# Variables de configuración
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "infraux-managed"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Configuración de proveedores según recursos detectados
${resourceNodes.length > 0 ? '# Variables específicas se generan dinámicamente' : '# No hay recursos para generar variables'}`;
  };

  const generateTerraformOutputs = () => {
    return `# Outputs generados dinámicamente
${resourceNodes.length > 0 ? '# Los outputs se generan basados en los recursos del diagrama' : '# No hay recursos para generar outputs'}`;
  };

  const generateTerraformProviders = () => {
    const providers = new Set<string>();
    resourceNodes.forEach((node: any) => {
      const provider = node.data?.provider;
      if (provider && provider !== 'generic') {
        providers.add(provider);
      }
    });

    return `# Configuración de Terraform
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
${Array.from(providers).map(p => `    ${p} = {
      source  = "hashicorp/${p}"
      version = "~> 5.0"
    }`).join('\n')}
  }
}

# Configuración de proveedores
${Array.from(providers).map(p => `provider "${p}" {
  # Configurar según necesidades
}`).join('\n\n')}`;
  };

  const generateTerraformModules = (): FileNode[] => {
    // Simplificado: solo crear una estructura básica de módulos
    return [];
  };

  // Funciones auxiliares simplificadas para generar archivos de configuración
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
    // Simplificado: solo crear una estructura básica de roles
    return [];
  };

  const generateAnsibleVars = () => {
    return `---
environment: dev
region: us-east-1`;
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

  const generateTerraformTfvarsExample = () => {
    return `# Ejemplo de configuración
project_name = "my-project"
environment  = "dev"

# Configurar valores específicos según los recursos del diagrama`;
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

  // Estado para el ancho del drawer redimensionable
  const [drawerWidth, setDrawerWidth] = useState(800); // Aumentado a 800 para más espacio por defecto
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Manejador de redimensionamiento
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 300 && newWidth <= window.innerWidth * 0.8) {
      setDrawerWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
  }, []);

  const handleMouseDown = () => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Función para maximizar/minimizar el drawer
  const toggleMaximize = () => {
    if (isMaximized) {
      setDrawerWidth(800); // Actualizado para coincidir con el nuevo ancho inicial
      setIsMaximized(false);
    } else {
      setDrawerWidth(window.innerWidth * 0.8);
      setIsMaximized(true);
    }
  };

  // Efecto para notificar cuando el Live Preview está activo
  useEffect(() => {
    if (isLivePreviewEnabled && visible) {
      // Emitir evento para que otros componentes sepan que el Live Preview está activo
      window.dispatchEvent(new CustomEvent('livePreviewStateChanged', {
        detail: { isActive: true, width: drawerWidth }
      }));
      // Agregar atributo al body para los estilos CSS
      document.body.setAttribute('data-live-preview-active', 'true');
      // Actualizar variable CSS para el ancho
      document.documentElement.style.setProperty('--live-preview-width', `${drawerWidth}px`);
    }
    
    return () => {
      // Limpiar cuando se desmonte o se desactive
      if (isLivePreviewEnabled) {
        window.dispatchEvent(new CustomEvent('livePreviewStateChanged', {
          detail: { isActive: false, width: 0 }
        }));
        // Remover atributo del body
        document.body.removeAttribute('data-live-preview-active');
        // Limpiar variable CSS
        document.documentElement.style.removeProperty('--live-preview-width');
      }
    };
  }, [isLivePreviewEnabled, visible, drawerWidth]);

  // Actualizar la variable CSS cuando cambie el ancho
  useEffect(() => {
    if (isLivePreviewEnabled && visible) {
      document.documentElement.style.setProperty('--live-preview-width', `${drawerWidth}px`);
    }
  }, [drawerWidth, isLivePreviewEnabled, visible]);

  // Si Live Preview está activo, usar un Drawer en lugar de Modal para mejor interacción
  if (isLivePreviewEnabled && visible) {
    return (
      <>
        {/* No necesitamos espaciador porque el drawer está a la izquierda */}
        
        <Drawer
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <CodeOutlined className="text-xl text-purple-600" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-semibold m-0">Live Code Preview</h3>
                  <p className="text-xs text-gray-500 m-0">Código actualizado en tiempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Botón para maximizar/minimizar */}
                <Tooltip title={isMaximized ? "Restaurar tamaño" : "Maximizar panel"}>
                  <Button
                    size="small"
                    type="text"
                    icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={toggleMaximize}
                    className="hover:bg-gray-100"
                  />
                </Tooltip>
                
                {/* Botón para forzar generación */}
                <Tooltip title="Forzar regeneración de código">
                  <Button
                    size="small"
                    type="text"
                    icon={<SyncOutlined />}
                    onClick={() => {
                      console.log('🔄 Forzando regeneración manual de código...');
                      const { generateCodeAndShowModal } = useNavigationStore.getState();
                      generateCodeAndShowModal();
                    }}
                    className="hover:bg-gray-100"
                  >
                    Regenerar
                  </Button>
                </Tooltip>
                
                {/* Botón para salir del Live Preview */}
                <Tooltip title="Salir del Live Preview y volver al generador de código normal">
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setLivePreviewEnabled(false);
                      message.info('Live Preview desactivado');
                    }}
                    className="hover:bg-gray-100"
                  >
                    Salir
                  </Button>
                </Tooltip>
                
                {isCodeGenerating ? (
                  <Tag icon={<SyncOutlined spin />} color="processing" className="text-xs">
                    Actualizando...
                  </Tag>
                ) : (
                  <Tag icon={<CheckCircleOutlined />} color="success" className="text-xs">
                    Sincronizado
                  </Tag>
                )}
              </div>
            </div>
          }
          placement="right"
          onClose={onClose}
          open={visible}
          width={drawerWidth}
          mask={false}
          maskClosable={false}
          keyboard={false}
          styles={{
            body: {
              padding: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(to bottom, #fafafa, #ffffff)'
            },
            wrapper: {
              position: 'fixed',
              zIndex: 1001,
              top: 0, // Desde arriba
              height: '100vh' // Toda la altura
            },
            header: {
              background: 'linear-gradient(to right, #f3f4f6, #ffffff)',
              borderBottom: '2px solid #e5e7eb',
              padding: '16px 24px'
            }
          }}
          className="live-preview-drawer"
          height="100%"
        >
        {/* Barra de redimensionamiento */}
        <div
          className="absolute left-0 top-0 h-full cursor-col-resize group"
          onMouseDown={handleMouseDown}
          style={{
            width: '10px',
            left: '-5px',
            zIndex: 10
          }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: isResizing ? '4px' : '2px',
              backgroundColor: isResizing ? '#7c3aed' : '#e5e7eb',
              marginLeft: isResizing ? '3px' : '4px',
              opacity: isResizing ? 1 : 0.5
            }}
          />
        </div>
        
        <div className="flex flex-col h-full">
          {/* Selector de IaC compacto con diseño mejorado */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedIaC('terraform');
                  setSelectedFile('main');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedIaC === 'terraform'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <DeploymentUnitOutlined />
                  Terraform
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedIaC('pulumi');
                  setSelectedFile('main');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedIaC === 'pulumi'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CloudOutlined />
                  Pulumi
                </div>
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setSelectedIaC('ansible');
                  setSelectedFile('main');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedIaC === 'ansible'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CodeOutlined />
                  Ansible
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedIaC('cloudformation');
                  setSelectedFile('main');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedIaC === 'cloudformation'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <AmazonOutlined />
                  CloudFormation
                </div>
              </button>
            </div>
          </div>

          {/* Resumen de recursos en Live Preview */}
          {resourceNodes.length > 0 && (
            <div className="px-3 pb-3 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <InfoCircleOutlined className="text-blue-500 text-xs" />
                  <span className="text-xs font-medium text-blue-900">Resumen de Recursos</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(resourceStats.byProvider).map(([provider, count]) => (
                    provider !== 'generic' && (
                      <div key={provider} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 capitalize">{provider}</span>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contenido principal con diseño responsivo */}
          <div className="flex-1 flex overflow-hidden">
            {/* Panel lateral de estructura de archivos - se muestra cuando hay suficiente espacio */}
            {drawerWidth > 500 && (
              <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-3">
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
                    className="text-xs bg-transparent"
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>
            )}
            
            {/* Panel principal con código */}
            <div className="flex-1 flex flex-col">
              {/* Tabs para archivos - se muestra cuando no hay espacio para el árbol lateral */}
              {drawerWidth <= 500 && (
                <div className="border-b border-gray-200 bg-white">
                  {/* Tabs principales */}
                  <div className="px-3 py-2 overflow-x-auto">
                    <div className="flex gap-1">
                      {fileStructure[0]?.children?.map((file) => (
                        <button
                          key={file.key}
                          onClick={() => {
                            if (file.children && file.children.length > 0) {
                              // Si es una carpeta (como modules), expandir/colapsar
                              setExpandedKeys(prev =>
                                prev.includes(file.key)
                                  ? prev.filter(k => k !== file.key)
                                  : [...prev, file.key]
                              );
                            } else {
                              // Si es un archivo, seleccionarlo
                              setSelectedFile(file.key);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs rounded-t transition-all whitespace-nowrap flex items-center gap-1 ${
                            selectedFile === file.key || (file.children && expandedKeys.includes(file.key))
                              ? 'bg-gray-100 text-gray-900 font-medium border-b-2 border-blue-500'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {file.icon}
                          <span>{file.title}</span>
                          {file.children && file.children.length > 0 && (
                            <span className="text-gray-400">
                              ({file.children.length})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Vista expandida de módulos */}
                  {fileStructure[0]?.children?.map((file) => {
                    if (file.children && file.children.length > 0 && expandedKeys.includes(file.key)) {
                      return (
                        <div key={`${file.key}-expanded`} className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1 font-medium">
                            {file.title === 'modules' ? 'Módulos disponibles:' : file.title}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {file.children.map((subItem) => (
                              <button
                                key={subItem.key}
                                onClick={() => {
                                  if (subItem.children && subItem.children.length > 0) {
                                    // Si es un submódulo, mostrar sus archivos
                                    setExpandedKeys(prev =>
                                      prev.includes(subItem.key)
                                        ? prev.filter(k => k !== subItem.key)
                                        : [...prev, subItem.key]
                                    );
                                  } else {
                                    setSelectedFile(subItem.key);
                                  }
                                }}
                                className={`px-2 py-1 text-xs rounded transition-all ${
                                  selectedFile === subItem.key || expandedKeys.includes(subItem.key)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                              >
                                {subItem.icon}
                                <span className="ml-1">{subItem.title}</span>
                              </button>
                            ))}
                          </div>
                          
                          {/* Archivos dentro de cada módulo */}
                          {file.children.map((subItem) => {
                            if (subItem.children && expandedKeys.includes(subItem.key)) {
                              return (
                                <div key={`${subItem.key}-files`} className="mt-2 pl-4">
                                  <div className="text-xs text-gray-500 mb-1">
                                    Archivos en {subItem.title}:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {subItem.children.map((fileItem) => (
                                      <button
                                        key={fileItem.key}
                                        onClick={() => setSelectedFile(fileItem.key)}
                                        className={`px-2 py-0.5 text-xs rounded transition-all ${
                                          selectedFile === fileItem.key
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                      >
                                        {fileItem.icon}
                                        <span className="ml-1">{fileItem.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Área de código */}
              <div className="flex-1 overflow-auto bg-gray-900 relative">
                {isCodeGenerating && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <Spin size="small" />
                  </div>
                )}
                
                {selectedFileData ? (
                  <SyntaxHighlighter
                    language={selectedFileData.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: 'transparent',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      padding: '1rem'
                    }}
                    showLineNumbers
                    wrapLines
                  >
                    {selectedFileData.content}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <FileOutlined className="text-3xl mb-2 opacity-50" />
                      <p className="text-sm">Selecciona un archivo</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de acciones inferior */}
              <div className="border-t border-gray-200 bg-white p-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {resourceNodes.length === 0 ? (
                    <span className="text-yellow-600">
                      <ExclamationCircleOutlined className="mr-1" />
                      No se detectaron recursos
                    </span>
                  ) : (
                    <span>
                      <CheckCircleOutlined className="mr-1 text-green-500" />
                      {resourceNodes.length} recursos detectados
                    </span>
                  )}
                </div>
                <Space>
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={handleCopyCode}
                    disabled={!selectedFileData}
                  >
                    Copiar
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={handleDownloadAll}
                  >
                    Descargar
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
      </>
    );
  }

  // Modal normal cuando Live Preview está desactivado
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
          <Space size="middle">
            {/* Indicador de estado de sincronización */}
            <div className="flex items-center gap-2">
              {isCodeGenerating ? (
                <Tag icon={<SyncOutlined spin />} color="processing">
                  Generando...
                </Tag>
              ) : (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Sincronizado
                </Tag>
              )}
              
              {/* Última actualización */}
              <Tooltip title={lastUpdateTime ? `Última actualización: ${lastUpdateTime.toLocaleString()}` : 'Sin actualizaciones'}>
                <Tag icon={<ClockCircleOutlined />} className="cursor-help">
                  {getRelativeTime(lastUpdateTime)}
                </Tag>
              </Tooltip>
            </div>
            
            {/* Contadores de recursos */}
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
      mask={!isLivePreviewEnabled} // Solo mostrar máscara si Live Preview está desactivado
      maskClosable={!isLivePreviewEnabled} // Solo permitir cerrar con click fuera si Live Preview está desactivado
      keyboard={!isLivePreviewEnabled} // Solo permitir cerrar con ESC si Live Preview está desactivado
      styles={{
        body: {
          padding: 0,
          height: 'calc(100vh - 200px)',
          background: 'linear-gradient(to bottom, #f8fafc, #ffffff)'
        },
        mask: {
          backgroundColor: isLivePreviewEnabled ? 'transparent' : 'rgba(0, 0, 0, 0.45)'
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
            {resourceNodes.length === 0 ? (
              <div className="text-xs text-gray-600">
                <ExclamationCircleOutlined className="text-yellow-500 mr-1" />
                No se encontraron nodos de recursos en el diagrama.
                Asegúrate de agregar recursos de infraestructura.
              </div>
            ) : (
              <div className="space-y-1">
                {Object.entries(resourceStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 capitalize">{type.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Opciones de generación */}
          <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Opciones</h4>
            <div className="space-y-3">
              {/* Toggle de Live Preview */}
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <SyncOutlined className={`text-blue-500 ${isLivePreviewEnabled ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium text-blue-900">Live Preview</span>
                  </div>
                  <Switch
                    checked={isLivePreviewEnabled}
                    onChange={setLivePreviewEnabled}
                    loading={isCodeGenerating}
                  />
                </div>
                <p className="text-xs text-blue-700 ml-6">
                  {isLivePreviewEnabled
                    ? 'El código se actualiza automáticamente con los cambios'
                    : 'Activa para sincronizar en tiempo real'}
                </p>
              </div>
              
              {/* Eliminar comentarios */}
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

          {/* Advertencia si Live Preview está activo */}
          {isLivePreviewEnabled && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <ExclamationCircleOutlined className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-900 mb-1">
                    Modo Live Preview Activo
                  </p>
                  <p className="text-xs text-yellow-700">
                    Los cambios en el diagrama se reflejarán automáticamente.
                    Puedes seguir editando el diagrama mientras ves el código.
                  </p>
                </div>
              </div>
            </div>
          )}

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
          
          <div className="flex-1 overflow-auto bg-gray-900 relative">
            {/* Overlay de carga cuando se está generando código */}
            {isCodeGenerating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
                  <Spin size="small" />
                  <span className="text-sm font-medium">Actualizando código...</span>
                </div>
              </div>
            )}
            
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
      
      {/* Estilos globales para el Live Preview */}
      <style jsx global>{`
        /* Ajustar el sidebar de recursos cuando el Live Preview está activo */
        .live-preview-drawer {
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
        }
        
        /* Asegurar que el drawer esté por encima del sidebar */
        .ant-drawer-content-wrapper {
          z-index: 1001 !important;
        }
        
        /* Ajustar el sidebar de recursos para que se pegue al Live Preview */
        body[data-live-preview-active="true"] .resource-sidebar-panel {
          right: ${drawerWidth}px !important;
          transition: right 0.3s ease-out;
          border-radius: 0 !important;
          box-shadow: none !important;
          border-left: 2px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.98) !important;
          height: calc(100vh - 7.5rem) !important; /* Mantener altura del sidebar */
        }
        
        /* Hacer que el Live Preview y el sidebar se vean como un conjunto unificado */
        body[data-live-preview-active="true"] .live-preview-drawer {
          box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
          border-left: none;
          height: 100vh !important;
        }
        
        body[data-live-preview-active="true"] .live-preview-drawer .ant-drawer-content-wrapper {
          height: 100vh !important;
          top: 0 !important;
        }
        
        body[data-live-preview-active="true"] .live-preview-drawer .ant-drawer-content {
          height: 100vh !important;
          display: flex;
          flex-direction: column;
        }
        
        body[data-live-preview-active="true"] .live-preview-drawer .ant-drawer-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        /* Crear efecto de panel unificado */
        body[data-live-preview-active="true"] .resource-sidebar-panel::before {
          content: '';
          position: absolute;
          left: -${drawerWidth}px;
          top: 0;
          width: ${drawerWidth}px;
          height: 100%;
          background: transparent;
          pointer-events: none;
        }
        
        /* Ajustar el botón de recursos cuando el sidebar está cerrado */
        body[data-live-preview-active="true"] .react-flow__panel.react-flow__panel-top-right {
          right: ${drawerWidth + 10}px !important;
          transition: right 0.3s ease-out;
        }
        
        /* Mejorar la integración visual */
        body[data-live-preview-active="true"] .resource-sidebar-panel > div:first-child {
          border-top-left-radius: 0 !important;
          border-bottom-left-radius: 0 !important;
        }
        
        /* Mejorar la apariencia del código en el Live Preview */
        .live-preview-drawer pre {
          margin: 0 !important;
          background: transparent !important;
        }
        
        /* Scrollbar personalizado para el Live Preview */
        .live-preview-drawer ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .live-preview-drawer ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .live-preview-drawer ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .live-preview-drawer ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Hover effect para la barra de redimensionamiento */
        .live-preview-drawer .group:hover > div {
          opacity: 1 !important;
          background-color: #3b82f6 !important;
        }
      `}</style>
    </Modal>
  );
};

export default GeneratedCodeModal;
