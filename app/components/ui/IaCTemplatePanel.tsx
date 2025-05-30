import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import ResourceConfigForm from './ResourceConfigForm';
import CodeBlock from './CodeBlock';
import SmartBehaviorPanel from './SmartBehaviorPanel';
import { ResourceValues, ResourceType } from '@/app/types/resourceConfig';
import { 
  DocumentDuplicateIcon, 
  CheckIcon, 
  CommandLineIcon,
  CloudIcon,
  CogIcon,
  DocumentTextIcon,
  PlayIcon,
  CodeBracketIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Metadata {
  key: string;
  value: string;
}

interface LifecycleRule {
  age?: number;
  isLive?: boolean;
  matchesStorageClass?: string[];
  type?: string;
  storageClass?: string;
}

interface SmartBehavior {
  conditionals?: Array<{
    property: string;
    conditions: Array<{
      condition: string;
      value: any;
    }>;
    default?: any;
  }>;
  loops?: Array<{
    variable: string;
    values: any[];
    properties: string[];
  }>;
}

interface IaCTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  resourceData: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    resourceType: ResourceType;
  };
  environments?: Array<{
    id: string;
    name: string;
    variables: Record<string, any>;
    color?: string;
    description?: string;
  }>;
}

// Main tabs
const MAIN_TABS = [
  { 
    id: 'config', 
    label: 'Configuration', 
    icon: CogIcon, 
    description: 'Basic resource configuration',
    color: 'blue'
  },
  { 
    id: 'smart', 
    label: 'Smart Behavior', 
    icon: SparklesIcon, 
    description: 'Dynamic properties with conditionals and loops',
    color: 'purple'
  },
  { 
    id: 'code', 
    label: 'Generated Code', 
    icon: EyeIcon, 
    description: 'View and export Infrastructure as Code',
    color: 'green'
  }
];

// Code generation tabs (shown when 'code' main tab is active)
const CODE_TABS = [
  { 
    id: 'terraform', 
    label: 'Terraform', 
    icon: CommandLineIcon, 
    description: 'HashiCorp Terraform HCL',
    color: 'purple',
    language: 'hcl'
  },
  { 
    id: 'pulumi', 
    label: 'Pulumi', 
    icon: CloudIcon, 
    description: 'TypeScript/JavaScript SDK',
    color: 'indigo',
    language: 'typescript'
  },
  { 
    id: 'ansible', 
    label: 'Ansible', 
    icon: PlayIcon, 
    description: 'YAML Playbook',
    color: 'red',
    language: 'yaml'
  },
  { 
    id: 'cloudformation', 
    label: 'CloudFormation', 
    icon: DocumentTextIcon, 
    description: 'AWS CloudFormation Template',
    color: 'orange',
    language: 'yaml'
  }
];

const getDefaultValues = (provider: string, resourceType: string): ResourceValues => {
  const defaults: Record<string, Record<string, ResourceValues>> = {
    gcp: {
      compute: {
        name: 'instance',
        projectId: '',
        machineType: 'e2-micro',
        zone: 'us-central1-a',
        image: {
          project: 'debian-cloud',
          family: 'debian-10',
        },
        network: 'default',
        bootDisk: {
          sizeGb: 50,
          type: 'pd-standard',
          autoDelete: true,
        },
        accessConfig: {
          name: 'External NAT',
          type: 'ONE_TO_ONE_NAT',
        },
        metadata: [],
      },
      storage: {
        name: 'bucket',
        location: 'US',
        storageClass: 'STANDARD',
        versioning: false,
      },
      sql: {
        name: 'sql-instance',
        databaseVersion: 'MYSQL_8_0',
        tier: 'db-f1-micro',
        region: 'us-central1',
        storage: {
          sizeGb: 10,
          type: 'SSD',
        },
        backup: {
          enabled: false,
        },
      },
    },
  };

  return defaults[provider]?.[resourceType] || { name: 'resource' };
};

// Helper functions to get provider and resource type icons
const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    aws: '☁️',
    gcp: '🌐',
    azure: '🔷',
    generic: '⚙️'
  };
  return icons[provider] || icons.generic;
};

const getResourceTypeIcon = (resourceType: string): string => {
  const icons: Record<string, string> = {
    compute: '💻',
    storage: '💾',
    sql: '🗄️',
    network: '🌐',
    security: '🔒',
    monitoring: '📊',
    generic: '📦'
  };
  return icons[resourceType] || icons.generic;
};

const IaCTemplatePanel: React.FC<IaCTemplatePanelProps> = ({
  isOpen,
  onClose,
  resourceData,
  environments
}) => {
  const [activeMainTab, setActiveMainTab] = useState('config');
  const [activeCodeTab, setActiveCodeTab] = useState('terraform');
  const [configValues, setConfigValues] = useState<ResourceValues>(() => 
    getDefaultValues(resourceData.provider, resourceData.resourceType)
  );
  const [smartBehavior, setSmartBehavior] = useState<SmartBehavior>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Update values when resource changes
  useEffect(() => {
    setConfigValues(prevValues => ({
      ...getDefaultValues(resourceData.provider, resourceData.resourceType),
      name: resourceData.label || prevValues.name,
    }));
  }, [resourceData.provider, resourceData.resourceType, resourceData.label]);

  const handleConfigChange = (values: ResourceValues) => {
    setConfigValues(values);
  };

  const handleSave = () => {
    console.log('Saving configuration:', configValues);
    // TODO: Implement save logic
  };

  const handleCopyCode = async () => {
    setIsGenerating(true);
    
    try {
      let code = '';
      switch (activeCodeTab) {
        case 'terraform':
          code = generateTerraformCode();
          break;
        case 'pulumi':
          code = generatePulumiCode();
          break;
        case 'ansible':
          code = generateAnsibleCode();
          break;
        case 'cloudformation':
          code = generateCloudFormationCode();
          break;
        default:
          return;
      }
      
      await navigator.clipboard.writeText(code);
      setCopySuccess(activeCodeTab);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSmartBehaviorChange = (behavior: SmartBehavior) => {
    setSmartBehavior(behavior);
  };

  const hasSmartBehavior = () => {
    return (smartBehavior.conditionals && smartBehavior.conditionals.length > 0) ||
           (smartBehavior.loops && smartBehavior.loops.length > 0);
  };

  const generateCodeWithSmartBehavior = (format: string) => {
    // Apply smart behavior to config values before generating code
    const processedValues = applySmartBehavior(configValues, smartBehavior);
    
    switch (format) {
      case 'terraform':
        return generateTerraformCode(processedValues);
      case 'pulumi':
        return generatePulumiCode(processedValues);
      case 'ansible':
        return generateAnsibleCode(processedValues);
      case 'cloudformation':
        return generateCloudFormationCode(processedValues);
      default:
        return '// Select a template type';
    }
  };

  const applySmartBehavior = (values: ResourceValues, behavior: SmartBehavior): ResourceValues => {
    let processedValues = { ...values };
    
    // Use the first environment from provided environments, or default
    const currentEnv = environments && environments.length > 0 
      ? environments[0] 
      : { id: 'dev', name: 'Development', variables: { env: 'dev' } };
    
    const envVars = currentEnv.variables;
    
    behavior.conditionals?.forEach(conditional => {
      const matchingCondition = conditional.conditions.find(cond => {
        try {
          let condition = cond.condition;
          // Replace variables in condition with actual values
          Object.entries(envVars).forEach(([key, value]) => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            condition = condition.replace(regex, `"${value}"`);
          });
          return eval(condition);
        } catch (error) {
          console.warn('Error evaluating condition:', cond.condition, error);
          return false;
        }
      });
      
      if (matchingCondition) {
        processedValues[conditional.property] = matchingCondition.value;
      } else if (conditional.default !== undefined) {
        processedValues[conditional.property] = conditional.default;
      }
    });
    
    return processedValues;
  };

  const generateTerraformCode = (values: ResourceValues = configValues) => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            const imageProject = values.image?.project || 'debian-cloud';
            const imageFamily = values.image?.family || 'debian-10';
            return `resource "google_compute_instance" "${values.name}" {
  name         = "${values.name}"
  machine_type = "${values.machineType}"
  zone         = "${values.zone}"

  boot_disk {
    initialize_params {
      image = "${imageProject}/${imageFamily}"
      size  = ${values.bootDisk?.sizeGb}
      type  = "${values.bootDisk?.type}"
    }
    auto_delete = ${values.bootDisk?.autoDelete}
  }

  network_interface {
    network = "${values.network}"
    access_config {
      name = "${values.accessConfig?.name}"
      type = "${values.accessConfig?.type}"
    }
  }

  ${values.metadata?.length ? `metadata = {
    ${values.metadata.map((md: Metadata) => `"${md.key}" = "${md.value}"`).join('\n    ')}
  }` : ''}

  ${values.userData ? `metadata_startup_script = <<-EOF
    ${values.userData}
  EOF` : ''}
}`;
          case 'storage':
            return `resource "google_storage_bucket" "${values.name}" {
  name          = "${values.name}"
  location      = "${values.location}"
  storage_class = "${values.storageClass}"
  force_destroy = true
  
  versioning {
    enabled = ${values.versioning}
  }

  ${values.lifecycleRules?.length ? `lifecycle_rule {
    ${values.lifecycleRules.map((rule: LifecycleRule) => `
    condition {
      ${rule.age ? `age = ${rule.age}` : ''}
      ${rule.isLive ? `is_live = ${rule.isLive}` : ''}
      ${rule.matchesStorageClass ? `matches_storage_class = ${JSON.stringify(rule.matchesStorageClass)}` : ''}
    }
    action {
      ${rule.type ? `type = "${rule.type}"` : ''}
      ${rule.storageClass ? `storage_class = "${rule.storageClass}"` : ''}
    }`).join('\n    ')}
  }` : ''}
}`;
          case 'sql':
            return `resource "google_sql_database_instance" "${values.name}" {
  name             = "${values.name}"
  database_version = "${values.databaseVersion}"
  region           = "${values.region}"
  
  settings {
    tier = "${values.tier}"
    
    backup_configuration {
      enabled = ${values.backup?.enabled}
      ${values.backup?.startTime ? `start_time = "${values.backup.startTime}"` : ''}
    }
    
    ip_configuration {
      ipv4_enabled = true
    }

    ${values.storage ? `disk_size = ${values.storage.sizeGb}
    disk_type = "${values.storage.type}"` : ''}
  }
}`;
          default:
            return '// No hay template disponible para este tipo de recurso';
        }
      default:
        return '// No hay template disponible para este proveedor';
    }
  };

  const generatePulumiCode = (values: ResourceValues = configValues) => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            return `import * as gcp from "@pulumi/gcp";

const instance = new gcp.compute.Instance("${values.name}", {
    name: "${values.name}",
    machineType: "${values.machineType}",
    zone: "${values.zone}",
    bootDisk: {
        initializeParams: {
            image: "${values.image?.project}/${values.image?.family}",
            size: ${values.bootDisk?.sizeGb},
            type: "${values.bootDisk?.type}"
        },
        autoDelete: ${values.bootDisk?.autoDelete}
    },
    networkInterfaces: [{
        network: "${values.network}",
        accessConfigs: [{
            name: "${values.accessConfig?.name}",
            type: "${values.accessConfig?.type}"
        }]
    }],
    ${values.metadata?.length ? `metadata: {
        ${values.metadata.map((md: Metadata) => `"${md.key}": "${md.value}"`).join(',\n        ')}
    },` : ''}
    ${values.userData ? `metadataStartupScript: \`${values.userData}\`,` : ''}
});`;
          case 'storage':
            return `import * as gcp from "@pulumi/gcp";

const bucket = new gcp.storage.Bucket("${values.name}", {
    name: "${values.name}",
    location: "${values.location}",
    storageClass: "${values.storageClass}",
    forceDestroy: true,
    versioning: {
        enabled: ${values.versioning}
    },
    ${values.lifecycleRules?.length ? `lifecycleRules: [
        ${values.lifecycleRules.map((rule: LifecycleRule) => `{
            condition: {
                ${rule.age ? `age: ${rule.age},` : ''}
                ${rule.isLive ? `isLive: ${rule.isLive},` : ''}
                ${rule.matchesStorageClass ? `matchesStorageClass: ${JSON.stringify(rule.matchesStorageClass)},` : ''}
            },
            action: {
                ${rule.type ? `type: "${rule.type}",` : ''}
                ${rule.storageClass ? `storageClass: "${rule.storageClass}",` : ''}
            }
        }`).join(',\n        ')}
    ],` : ''}
});`;
          case 'sql':
            return `import * as gcp from "@pulumi/gcp";

const instance = new gcp.sql.DatabaseInstance("${values.name}", {
    name: "${values.name}",
    databaseVersion: "${values.databaseVersion}",
    region: "${values.region}",
    settings: {
        tier: "${values.tier}",
        backupConfiguration: {
            enabled: ${values.backup?.enabled},
            ${values.backup?.startTime ? `startTime: "${values.backup.startTime}",` : ''}
        },
        ipConfiguration: {
            ipv4Enabled: true
        },
        ${values.storage ? `diskSize: ${values.storage.sizeGb},
        diskType: "${values.storage.type}",` : ''}
    }
});`;
          default:
            return '// No hay template disponible para este tipo de recurso';
        }
      default:
        return '// No hay template disponible para este proveedor';
    }
  };

  const generateAnsibleCode = (values: ResourceValues = configValues) => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            return `- name: Create GCP compute instance
  google.cloud.gcp_compute_instance:
    name: "${values.name}"
    machine_type: "${values.machineType}"
    zone: "${values.zone}"
    boot_disk:
      initialize_params:
        image: "${values.image?.project}/${values.image?.family}"
        size_gb: ${values.bootDisk?.sizeGb}
        type: "${values.bootDisk?.type}"
      auto_delete: ${values.bootDisk?.autoDelete}
    network_interfaces:
      - network: "${values.network}"
        access_configs:
          - name: "${values.accessConfig?.name}"
            type: "${values.accessConfig?.type}"
    ${values.metadata?.length ? `metadata:
      ${values.metadata.map((md: Metadata) => `${md.key}: ${md.value}`).join('\n      ')}` : ''}
    ${values.userData ? `metadata_startup_script: |
      ${values.userData}` : ''}`;
          case 'storage':
            return `- name: Create GCP storage bucket
  google.cloud.gcp_storage_bucket:
    name: "${values.name}"
    location: "${values.location}"
    storage_class: "${values.storageClass}"
    force_destroy: true
    versioning:
      enabled: ${values.versioning}
    ${values.lifecycleRules?.length ? `lifecycle_rules:
      ${values.lifecycleRules.map((rule: LifecycleRule) => `- condition:
          ${rule.age ? `age: ${rule.age}` : ''}
          ${rule.isLive ? `is_live: ${rule.isLive}` : ''}
          ${rule.matchesStorageClass ? `matches_storage_class: ${JSON.stringify(rule.matchesStorageClass)}` : ''}
        action:
          ${rule.type ? `type: "${rule.type}"` : ''}
          ${rule.storageClass ? `storage_class: "${rule.storageClass}"` : ''}`).join('\n      ')}` : ''}`;
          case 'sql':
            return `- name: Create GCP SQL instance
  google.cloud.gcp_sql_database_instance:
    name: "${values.name}"
    database_version: "${values.databaseVersion}"
    region: "${values.region}"
    settings:
      tier: "${values.tier}"
      backup_configuration:
        enabled: ${values.backup?.enabled}
        ${values.backup?.startTime ? `start_time: "${values.backup.startTime}"` : ''}
      ip_configuration:
        ipv4_enabled: true
      ${values.storage ? `disk_size: ${values.storage.sizeGb}
      disk_type: "${values.storage.type}"` : ''}`;
          default:
            return '# No hay template disponible para este tipo de recurso';
        }
      default:
        return '# No hay template disponible para este proveedor';
    }
  };

  const generateCloudFormationCode = (values: ResourceValues = configValues) => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            return `{
  "Resources": {
    "${values.name}": {
      "Type": "Google::Compute::Instance",
      "Properties": {
        "name": "${values.name}",
        "machineType": "${values.machineType}",
        "zone": "${values.zone}",
        "bootDisk": {
          "initializeParams": {
            "image": "${values.image?.project}/${values.image?.family}",
            "sizeGb": ${values.bootDisk?.sizeGb},
            "type": "${values.bootDisk?.type}"
          },
          "autoDelete": ${values.bootDisk?.autoDelete}
        },
        "networkInterfaces": [
          {
            "network": "${values.network}",
            "accessConfigs": [
              {
                "name": "${values.accessConfig?.name}",
                "type": "${values.accessConfig?.type}"
              }
            ]
          }
        ],
        ${values.metadata?.length ? `"metadata": {
          ${values.metadata.map((md: Metadata) => `"${md.key}": "${md.value}"`).join(',\n          ')}
        },` : ''}
        ${values.userData ? `"metadataStartupScript": "${values.userData}",` : ''}
      }
    }
  }
}`;
          case 'storage':
            return `{
  "Resources": {
    "${values.name}": {
      "Type": "Google::Storage::Bucket",
      "Properties": {
        "name": "${values.name}",
        "location": "${values.location}",
        "storageClass": "${values.storageClass}",
        "forceDestroy": true,
        "versioning": {
          "enabled": ${values.versioning}
        },
        ${values.lifecycleRules?.length ? `"lifecycleRules": [
          ${values.lifecycleRules.map((rule: LifecycleRule) => `{
            "condition": {
              ${rule.age ? `"age": ${rule.age},` : ''}
              ${rule.isLive ? `"isLive": ${rule.isLive},` : ''}
              ${rule.matchesStorageClass ? `"matchesStorageClass": ${JSON.stringify(rule.matchesStorageClass)},` : ''}
            },
            "action": {
              ${rule.type ? `"type": "${rule.type}",` : ''}
              ${rule.storageClass ? `"storageClass": "${rule.storageClass}",` : ''}
            }
          }`).join(',\n          ')}
        ],` : ''}
      }
    }
  }
}`;
          case 'sql':
            return `{
  "Resources": {
    "${values.name}": {
      "Type": "Google::SQL::DatabaseInstance",
      "Properties": {
        "name": "${values.name}",
        "databaseVersion": "${values.databaseVersion}",
        "region": "${values.region}",
        "settings": {
          "tier": "${values.tier}",
          "backupConfiguration": {
            "enabled": ${values.backup?.enabled},
            ${values.backup?.startTime ? `"startTime": "${values.backup.startTime}",` : ''}
          },
          "ipConfiguration": {
            "ipv4Enabled": true
          },
          ${values.storage ? `"diskSize": ${values.storage.sizeGb},
          "diskType": "${values.storage.type}",` : ''}
        }
      }
    }
  }
}`;
          default:
            return '// No hay template disponible para este tipo de recurso';
        }
      default:
        return '// No hay template disponible para este proveedor';
    }
  };

  // Helper functions for the new UI
  const getCodeForActiveTab = () => {
    switch (activeCodeTab) {
      case 'terraform':
        return generateTerraformCode();
      case 'pulumi':
        return generatePulumiCode();
      case 'ansible':
        return generateAnsibleCode();
      case 'cloudformation':
        return generateCloudFormationCode();
      default:
        return '// Select a template type';
    }
  };

  const getCurrentLanguage = () => {
    const currentTab = CODE_TABS.find(tab => tab.id === activeCodeTab);
    return currentTab?.language || 'text';
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`${getProviderIcon(resourceData.provider)} ${getResourceTypeIcon(resourceData.resourceType)} IaC Templates - ${resourceData.label}`}
      width="60%"
    >
      <div className="h-full flex flex-col">
        {/* Main Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex space-x-1 p-1" aria-label="Main Tabs">
            {MAIN_TABS.map((tab) => {
              const isActive = activeMainTab === tab.id;
              const Icon = tab.icon;
              const hasIndicator = tab.id === 'smart' && hasSmartBehavior();
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`
                    group relative min-w-0 flex-1 overflow-hidden rounded-lg py-3 px-4 text-center text-sm font-medium
                    transition-all duration-200 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isActive 
                      ? `bg-${tab.color}-50 text-${tab.color}-700 border-${tab.color}-200 shadow-sm` 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className="relative">
                      <Icon className={`h-5 w-5 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                      {hasIndicator && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{tab.label}</span>
                  </div>
                  {isActive && (
                    <span 
                      className={`absolute inset-x-0 bottom-0 h-0.5 bg-${tab.color}-600`}
                      aria-hidden="true" 
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Code Sub-tabs (shown only when code tab is active) */}
        {activeMainTab === 'code' && (
          <div className="border-b border-gray-100 bg-gray-50">
            <nav className="flex space-x-1 px-4 py-2" aria-label="Code Tabs">
              {CODE_TABS.map((tab) => {
                const isActive = activeCodeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md
                      transition-all duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isActive 
                        ? `bg-white text-${tab.color}-700 shadow-sm border border-${tab.color}-200` 
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {activeMainTab === 'config' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto bg-white">
                <ResourceConfigForm
                  provider={resourceData.provider}
                  resourceType={resourceData.resourceType}
                  values={configValues}
                  onChange={setConfigValues}
                />
              </div>
              
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Configure your resource parameters above
                  </div>
                  <button
                    onClick={() => {}}
                    disabled={isGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                             text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMainTab === 'smart' && (
            <SmartBehaviorPanel
              resourceData={resourceData}
              configValues={configValues}
              smartBehavior={smartBehavior}
              onChange={handleSmartBehaviorChange}
              environments={environments}
            />
          )}

          {activeMainTab === 'code' && (
            <div className="flex flex-col h-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const currentTab = CODE_TABS.find(tab => tab.id === activeCodeTab);
                      if (!currentTab) return null;
                      const Icon = currentTab.icon;
                      return (
                        <>
                          <Icon className={`h-6 w-6 text-${currentTab.color}-600`} />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{currentTab.label}</h3>
                            <p className="text-sm text-gray-500">
                              {currentTab.description}
                              {hasSmartBehavior() && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <SparklesIcon className="h-3 w-3 mr-1" />
                                  Smart Behavior Applied
                                </span>
                              )}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {copySuccess === activeCodeTab && (
                    <div className="flex items-center space-x-2 text-green-600 animate-fade-in">
                      <CheckIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Copied!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-white">
                <div className="p-6">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500">Generating {activeCodeTab} template...</p>
                      </div>
                    </div>
                  ) : (
                    <CodeBlock
                      code={generateCodeWithSmartBehavior(activeCodeTab)}
                      language={CODE_TABS.find(tab => tab.id === activeCodeTab)?.language || 'text'}
                    />
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Ready to deploy with {activeCodeTab}
                    {hasSmartBehavior() && (
                      <span className="block text-purple-600 font-medium">
                        Dynamic behavior will be resolved at deployment time
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(generateCodeWithSmartBehavior(activeCodeTab));
                          setCopySuccess(activeCodeTab);
                          setTimeout(() => setCopySuccess(null), 2000);
                        } catch (error) {
                          console.error('Failed to copy:', error);
                        }
                      }}
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md
                               text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                      Copy Code
                    </button>
                    <button
                      onClick={() => {}}
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                               text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <CodeBracketIcon className="h-4 w-4 mr-2" />
                      Deploy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};

export default IaCTemplatePanel;
