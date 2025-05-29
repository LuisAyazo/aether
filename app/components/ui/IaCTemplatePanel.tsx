import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import ResourceConfigForm from './ResourceConfigForm';
import { Tabs, Tab, Box, Button, Divider } from '@mui/material';
import CodeBlock from './CodeBlock';
import { ResourceValues, ResourceType } from '@/app/types/resourceConfig';

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
  const [activeTab, setActiveTab] = useState(0);
  const [configValues, setConfigValues] = useState<ResourceValues>(() => 
    getDefaultValues(resourceData.provider, resourceData.resourceType)
  );

  // Actualizar valores cuando cambia el recurso
  useEffect(() => {
    setConfigValues(prevValues => ({
      ...getDefaultValues(resourceData.provider, resourceData.resourceType),
      name: resourceData.label || prevValues.name,
    }));
  }, [resourceData.provider, resourceData.resourceType, resourceData.label]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleConfigChange = (values: ResourceValues) => {
    console.log('Nuevos valores de configuración:', values); // Para debugging
    setConfigValues(values);
  };

  const handleSave = () => {
    // TODO: Implementar la lógica de guardado
    console.log('Guardando configuración:', configValues);
  };

  const handleCopyCode = () => {
    let code = '';
    switch (activeTab) {
      case 1:
        code = generateTerraformCode();
        break;
      case 2:
        code = generatePulumiCode();
        break;
      case 3:
        code = generateAnsibleCode();
        break;
      case 4:
        code = generateCloudFormationCode();
        break;
    }
    navigator.clipboard.writeText(code);
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

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`IaC Templates - ${resourceData.label}`}
      width="50%"
    >
      <div className="h-full flex flex-col">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab label="Configuración" />
            <Tab label="Terraform" />
            <Tab label="Pulumi" />
            <Tab label="Ansible" />
            <Tab label="CloudFormation" />
          </Tabs>
        </Box>

        <div className="flex-1 overflow-auto">
          {activeTab === 0 && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto">
                <ResourceConfigForm
                  provider={resourceData.provider}
                  resourceType={resourceData.resourceType}
                  values={configValues}
                  onChange={handleConfigChange}
                />
              </div>
              <Divider />
              <div className="p-4 flex justify-end space-x-2 bg-gray-50">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  className="flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Guardar
                </Button>
              </div>
            </div>
          )}
          {activeTab > 0 && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto">
                <div className="p-4">
                  <CodeBlock
                    code={
                      activeTab === 1
                        ? generateTerraformCode()
                        : activeTab === 2
                        ? generatePulumiCode()
                        : activeTab === 3
                        ? generateAnsibleCode()
                        : generateCloudFormationCode()
                    }
                    language={
                      activeTab === 1
                        ? 'hcl'
                        : activeTab === 2
                        ? 'typescript'
                        : activeTab === 3
                        ? 'yaml'
                        : 'json'
                    }
                  />
                </div>
              </div>
              <Divider />
              <div className="p-4 flex justify-end space-x-2 bg-gray-50">
                <Button
                  variant="outlined"
                  onClick={handleCopyCode}
                  className="flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copiar código
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};

export default IaCTemplatePanel;
