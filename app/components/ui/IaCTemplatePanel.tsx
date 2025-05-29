import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import ResourceConfigForm from './ResourceConfigForm';
import CodeBlock from './CodeBlock';
import { ResourceValues, ResourceType } from '@/app/types/resourceConfig';
import { 
  DocumentDuplicateIcon, 
  CheckIcon, 
  CommandLineIcon,
  CloudIcon,
  CogIcon,
  DocumentTextIcon,
  PlayIcon,
  CodeBracketIcon
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

interface IaCTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  resourceData: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    resourceType: ResourceType;
  };
}

// Tab definitions with icons and metadata
const IaC_TABS = [
  { 
    id: 'config', 
    label: 'Configuration', 
    icon: CogIcon, 
    description: 'Configure resource parameters',
    color: 'blue'
  },
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

const IaCTemplatePanel: React.FC<IaCTemplatePanelProps> = ({
  isOpen,
  onClose,
  resourceData,
}) => {
  const [activeTab, setActiveTab] = useState('config');
  const [configValues, setConfigValues] = useState<ResourceValues>(() => 
    getDefaultValues(resourceData.provider, resourceData.resourceType)
  );
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
      switch (activeTab) {
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
      setCopySuccess(activeTab);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gcp': return '🔵';
      case 'aws': return '🟠';
      case 'azure': return '🔷';
      default: return '⚡';
    }
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'compute': return '💻';
      case 'storage': return '💾';
      case 'sql': return '🗄️';
      default: return '📦';
    }
  };

  const generateTerraformCode = () => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            const imageProject = configValues.image?.project || 'debian-cloud';
            const imageFamily = configValues.image?.family || 'debian-10';
            return `resource "google_compute_instance" "${configValues.name}" {
  name         = "${configValues.name}"
  machine_type = "${configValues.machineType}"
  zone         = "${configValues.zone}"

  boot_disk {
    initialize_params {
      image = "${imageProject}/${imageFamily}"
      size  = ${configValues.bootDisk?.sizeGb}
      type  = "${configValues.bootDisk?.type}"
    }
    auto_delete = ${configValues.bootDisk?.autoDelete}
  }

  network_interface {
    network = "${configValues.network}"
    access_config {
      name = "${configValues.accessConfig?.name}"
      type = "${configValues.accessConfig?.type}"
    }
  }

  ${configValues.metadata?.length ? `metadata = {
    ${configValues.metadata.map((md: Metadata) => `"${md.key}" = "${md.value}"`).join('\n    ')}
  }` : ''}

  ${configValues.userData ? `metadata_startup_script = <<-EOF
    ${configValues.userData}
  EOF` : ''}
}`;
          case 'storage':
            return `resource "google_storage_bucket" "${configValues.name}" {
  name          = "${configValues.name}"
  location      = "${configValues.location}"
  storage_class = "${configValues.storageClass}"
  force_destroy = true
  
  versioning {
    enabled = ${configValues.versioning}
  }

  ${configValues.lifecycleRules?.length ? `lifecycle_rule {
    ${configValues.lifecycleRules.map((rule: LifecycleRule) => `
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
            return `resource "google_sql_database_instance" "${configValues.name}" {
  name             = "${configValues.name}"
  database_version = "${configValues.databaseVersion}"
  region           = "${configValues.region}"
  
  settings {
    tier = "${configValues.tier}"
    
    backup_configuration {
      enabled = ${configValues.backup?.enabled}
      ${configValues.backup?.startTime ? `start_time = "${configValues.backup.startTime}"` : ''}
    }
    
    ip_configuration {
      ipv4_enabled = true
    }

    ${configValues.storage ? `disk_size = ${configValues.storage.sizeGb}
    disk_type = "${configValues.storage.type}"` : ''}
  }
}`;
          default:
            return '// No hay template disponible para este tipo de recurso';
        }
      default:
        return '// No hay template disponible para este proveedor';
    }
  };

  const generatePulumiCode = () => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            return `import * as gcp from "@pulumi/gcp";

const instance = new gcp.compute.Instance("${configValues.name}", {
    name: "${configValues.name}",
    machineType: "${configValues.machineType}",
    zone: "${configValues.zone}",
    bootDisk: {
        initializeParams: {
            image: "${configValues.image?.project}/${configValues.image?.family}",
            size: ${configValues.bootDisk?.sizeGb},
            type: "${configValues.bootDisk?.type}"
        },
        autoDelete: ${configValues.bootDisk?.autoDelete}
    },
    networkInterfaces: [{
        network: "${configValues.network}",
        accessConfigs: [{
            name: "${configValues.accessConfig?.name}",
            type: "${configValues.accessConfig?.type}"
        }]
    }],
    ${configValues.metadata?.length ? `metadata: {
        ${configValues.metadata.map((md: Metadata) => `"${md.key}": "${md.value}"`).join(',\n        ')}
    },` : ''}
    ${configValues.userData ? `metadataStartupScript: \`${configValues.userData}\`,` : ''}
});`;
          case 'storage':
            return `import * as gcp from "@pulumi/gcp";

const bucket = new gcp.storage.Bucket("${configValues.name}", {
    name: "${configValues.name}",
    location: "${configValues.location}",
    storageClass: "${configValues.storageClass}",
    forceDestroy: true,
    versioning: {
        enabled: ${configValues.versioning}
    },
    ${configValues.lifecycleRules?.length ? `lifecycleRules: [
        ${configValues.lifecycleRules.map((rule: LifecycleRule) => `{
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

const instance = new gcp.sql.DatabaseInstance("${configValues.name}", {
    name: "${configValues.name}",
    databaseVersion: "${configValues.databaseVersion}",
    region: "${configValues.region}",
    settings: {
        tier: "${configValues.tier}",
        backupConfiguration: {
            enabled: ${configValues.backup?.enabled},
            ${configValues.backup?.startTime ? `startTime: "${configValues.backup.startTime}",` : ''}
        },
        ipConfiguration: {
            ipv4Enabled: true
        },
        ${configValues.storage ? `diskSize: ${configValues.storage.sizeGb},
        diskType: "${configValues.storage.type}",` : ''}
    }
});`;
          default:
            return '// No hay template disponible para este tipo de recurso';
        }
      default:
        return '// No hay template disponible para este proveedor';
    }
  };

  const generateAnsibleCode = () => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            return `- name: Create GCP compute instance
  google.cloud.gcp_compute_instance:
    name: "${configValues.name}"
    machine_type: "${configValues.machineType}"
    zone: "${configValues.zone}"
    boot_disk:
      initialize_params:
        image: "${configValues.image?.project}/${configValues.image?.family}"
        size_gb: ${configValues.bootDisk?.sizeGb}
        type: "${configValues.bootDisk?.type}"
      auto_delete: ${configValues.bootDisk?.autoDelete}
    network_interfaces:
      - network: "${configValues.network}"
        access_configs:
          - name: "${configValues.accessConfig?.name}"
            type: "${configValues.accessConfig?.type}"
    ${configValues.metadata?.length ? `metadata:
      ${configValues.metadata.map((md: Metadata) => `${md.key}: ${md.value}`).join('\n      ')}` : ''}
    ${configValues.userData ? `metadata_startup_script: |
      ${configValues.userData}` : ''}`;
          case 'storage':
            return `- name: Create GCP storage bucket
  google.cloud.gcp_storage_bucket:
    name: "${configValues.name}"
    location: "${configValues.location}"
    storage_class: "${configValues.storageClass}"
    force_destroy: true
    versioning:
      enabled: ${configValues.versioning}
    ${configValues.lifecycleRules?.length ? `lifecycle_rules:
      ${configValues.lifecycleRules.map((rule: LifecycleRule) => `- condition:
          ${rule.age ? `age: ${rule.age}` : ''}
          ${rule.isLive ? `is_live: ${rule.isLive}` : ''}
          ${rule.matchesStorageClass ? `matches_storage_class: ${JSON.stringify(rule.matchesStorageClass)}` : ''}
        action:
          ${rule.type ? `type: "${rule.type}"` : ''}
          ${rule.storageClass ? `storage_class: "${rule.storageClass}"` : ''}`).join('\n      ')}` : ''}`;
          case 'sql':
            return `- name: Create GCP SQL instance
  google.cloud.gcp_sql_database_instance:
    name: "${configValues.name}"
    database_version: "${configValues.databaseVersion}"
    region: "${configValues.region}"
    settings:
      tier: "${configValues.tier}"
      backup_configuration:
        enabled: ${configValues.backup?.enabled}
        ${configValues.backup?.startTime ? `start_time: "${configValues.backup.startTime}"` : ''}
      ip_configuration:
        ipv4_enabled: true
      ${configValues.storage ? `disk_size: ${configValues.storage.sizeGb}
      disk_type: "${configValues.storage.type}"` : ''}`;
          default:
            return '# No hay template disponible para este tipo de recurso';
        }
      default:
        return '# No hay template disponible para este proveedor';
    }
  };

  const generateCloudFormationCode = () => {
    switch (resourceData.provider) {
      case 'gcp':
        switch (resourceData.resourceType) {
          case 'compute':
            return `{
  "Resources": {
    "${configValues.name}": {
      "Type": "Google::Compute::Instance",
      "Properties": {
        "name": "${configValues.name}",
        "machineType": "${configValues.machineType}",
        "zone": "${configValues.zone}",
        "bootDisk": {
          "initializeParams": {
            "image": "${configValues.image?.project}/${configValues.image?.family}",
            "sizeGb": ${configValues.bootDisk?.sizeGb},
            "type": "${configValues.bootDisk?.type}"
          },
          "autoDelete": ${configValues.bootDisk?.autoDelete}
        },
        "networkInterfaces": [
          {
            "network": "${configValues.network}",
            "accessConfigs": [
              {
                "name": "${configValues.accessConfig?.name}",
                "type": "${configValues.accessConfig?.type}"
              }
            ]
          }
        ],
        ${configValues.metadata?.length ? `"metadata": {
          ${configValues.metadata.map((md: Metadata) => `"${md.key}": "${md.value}"`).join(',\n          ')}
        },` : ''}
        ${configValues.userData ? `"metadataStartupScript": "${configValues.userData}",` : ''}
      }
    }
  }
}`;
          case 'storage':
            return `{
  "Resources": {
    "${configValues.name}": {
      "Type": "Google::Storage::Bucket",
      "Properties": {
        "name": "${configValues.name}",
        "location": "${configValues.location}",
        "storageClass": "${configValues.storageClass}",
        "forceDestroy": true,
        "versioning": {
          "enabled": ${configValues.versioning}
        },
        ${configValues.lifecycleRules?.length ? `"lifecycleRules": [
          ${configValues.lifecycleRules.map((rule: LifecycleRule) => `{
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
    "${configValues.name}": {
      "Type": "Google::SQL::DatabaseInstance",
      "Properties": {
        "name": "${configValues.name}",
        "databaseVersion": "${configValues.databaseVersion}",
        "region": "${configValues.region}",
        "settings": {
          "tier": "${configValues.tier}",
          "backupConfiguration": {
            "enabled": ${configValues.backup?.enabled},
            ${configValues.backup?.startTime ? `"startTime": "${configValues.backup.startTime}",` : ''}
          },
          "ipConfiguration": {
            "ipv4Enabled": true
          },
          ${configValues.storage ? `"diskSize": ${configValues.storage.sizeGb},
          "diskType": "${configValues.storage.type}",` : ''}
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
    switch (activeTab) {
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
    const currentTab = IaC_TABS.find(tab => tab.id === activeTab);
    return currentTab?.language || 'text';
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`${getProviderIcon(resourceData.provider)} ${getResourceTypeIcon(resourceData.resourceType)} IaC Templates - ${resourceData.label}`}
      width="50%"
    >
      <div className="h-full flex flex-col">
        {/* Enhanced Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            {IaC_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                    <Icon className={`h-5 w-5 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
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

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {activeTab === 'config' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto bg-white">
                <ResourceConfigForm
                  provider={resourceData.provider}
                  resourceType={resourceData.resourceType}
                  values={configValues}
                  onChange={handleConfigChange}
                />
              </div>
              
              {/* Configuration Actions */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Configure your resource parameters above
                  </div>
                  <button
                    onClick={handleSave}
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

          {activeTab !== 'config' && (
            <div className="flex flex-col h-full">
              {/* Code Display Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const currentTab = IaC_TABS.find(tab => tab.id === activeTab);
                      if (!currentTab) return null;
                      const Icon = currentTab.icon;
                      return (
                        <>
                          <Icon className={`h-6 w-6 text-${currentTab.color}-600`} />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{currentTab.label}</h3>
                            <p className="text-sm text-gray-500">{currentTab.description}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Copy Success Indicator */}
                  {copySuccess === activeTab && (
                    <div className="flex items-center space-x-2 text-green-600 animate-fade-in">
                      <CheckIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Copied!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto bg-white">
                <div className="p-6">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500">Generating {activeTab} template...</p>
                      </div>
                    </div>
                  ) : (
                    <CodeBlock
                      code={getCodeForActiveTab()}
                      language={getCurrentLanguage()}
                    />
                  )}
                </div>
              </div>
              
              {/* Code Actions */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Ready to deploy with {activeTab}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCopyCode}
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md
                               text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                      Copy Code
                    </button>
                    <button
                      onClick={() => {/* Handle deploy action */}}
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
