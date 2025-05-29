// Servicio para la generación y gestión de templates de infraestructura como código
import { API_BASE_URL } from '../config';
import { getAuthToken } from './authService';

export type TemplateOptions = {
  resourceName: string;
  resourceType: string;
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  customParams?: Record<string, string>;
};

type TemplateType = 'terraform' | 'pulumi' | 'ansible' | 'cloudformation' | 'bicep';
type ProviderType = 'aws' | 'gcp' | 'azure' | 'generic';
type ResourceType = string;

interface TemplateMap {
  [provider: string]: {
    [resourceType: string]: {
      [templateType: string]: string;
    };
  };
}

// Interfaz para los templates de IaC
export type IaCTemplate = {
  id: string;
  name: string;
  description: string;
  tool: 'terraform' | 'pulumi' | 'ansible' | 'cloudformation' | 'bicep';
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  resourceType: string;
  template: string;
  defaultParams?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

class IaCTemplateService {
  private static readonly TEMPLATES: TemplateMap = {
    aws: {
      ec2: {
        terraform: `
resource "aws_instance" "{{resourceName}}" {
  ami           = "{{ami}}"
  instance_type = "{{instanceType}}"
  subnet_id     = "{{subnetId}}"
  
  tags = {
    Name = "{{resourceName}}"
  }
}`,
        pulumi: `
import * as aws from "@pulumi/aws";

const instance = new aws.ec2.Instance("{{resourceName}}", {
    ami: "{{ami}}",
    instanceType: "{{instanceType}}",
    subnetId: "{{subnetId}}",
    tags: {
        Name: "{{resourceName}}"
    }
});`,
        ansible: `
- name: Create EC2 instance
  amazon.aws.ec2_instance:
    name: "{{resourceName}}"
    image_id: "{{ami}}"
    instance_type: "{{instanceType}}"
    subnet_id: "{{subnetId}}"
    tags:
      Name: "{{resourceName}}"`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": "{{ami}}",
        "InstanceType": "{{instanceType}}",
        "SubnetId": "{{subnetId}}",
        "Tags": [
          {
            "Key": "Name",
            "Value": "{{resourceName}}"
          }
        ]
      }
    }
  }
}`,
        bicep: `
resource ec2Instance 'Microsoft.Compute/virtualMachines@2021-04-01' = {
  name: '{{resourceName}}'
  location: resourceGroup().location
  properties: {
    hardwareProfile: {
      vmSize: '{{instanceType}}'
    }
    osProfile: {
      computerName: '{{resourceName}}'
      adminUsername: '{{adminUsername}}'
      adminPassword: '{{adminPassword}}'
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: '{{networkInterfaceId}}'
        }
      ]
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: 'UbuntuServer'
        sku: '18.04-LTS'
        version: 'latest'
      }
    }
  }
}`
      },
      s3: {
        terraform: `
resource "aws_s3_bucket" "{{resourceName}}" {
  bucket = "{{bucketName}}"
  
  tags = {
    Name = "{{resourceName}}"
  }
}`,
        pulumi: `
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("{{resourceName}}", {
    bucket: "{{bucketName}}",
    tags: {
        Name: "{{resourceName}}"
    }
});`,
        ansible: `
- name: Create S3 bucket
  amazon.aws.s3_bucket:
    name: "{{bucketName}}"
    tags:
      Name: "{{resourceName}}"`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": "{{bucketName}}",
        "Tags": [
          {
            "Key": "Name",
            "Value": "{{resourceName}}"
          }
        ]
      }
    }
  }
}`,
        bicep: `
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: '{{resourceName}}'
  location: resourceGroup().location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
  }
}`
      }
    },
    gcp: {
      compute: {
        terraform: `
resource "google_compute_instance" "{{resourceName}}" {
  name         = "{{resourceName}}"
  machine_type = "{{machineType}}"
  zone         = "{{zone}}"

  boot_disk {
    initialize_params {
      image = "{{image}}"
    }
  }

  network_interface {
    network = "{{network}}"
    subnetwork = "{{subnetwork}}"
  }
  
  tags = ["{{resourceName}}"]
}`,
        pulumi: `
import * as gcp from "@pulumi/gcp";

const instance = new gcp.compute.Instance("{{resourceName}}", {
    name: "{{resourceName}}",
    machineType: "{{machineType}}",
    zone: "{{zone}}",
    bootDisk: {
        initializeParams: {
            image: "{{image}}"
        }
    },
    networkInterfaces: [{
        network: "{{network}}",
        subnetwork: "{{subnetwork}}"
    }],
    tags: ["{{resourceName}}"]
});`,
        ansible: `
- name: Create GCP compute instance
  google.cloud.gcp_compute_instance:
    name: "{{resourceName}}"
    machine_type: "{{machineType}}"
    zone: "{{zone}}"
    boot_disk:
      initialize_params:
        image: "{{image}}"
    network_interfaces:
      - network: "{{network}}"
        subnetwork: "{{subnetwork}}"
    tags:
      - "{{resourceName}}"`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "Google::Compute::Instance",
      "Properties": {
        "name": "{{resourceName}}",
        "machineType": "{{machineType}}",
        "zone": "{{zone}}",
        "bootDisk": {
          "initializeParams": {
            "image": "{{image}}"
          }
        },
        "networkInterfaces": [
          {
            "network": "{{network}}",
            "subnetwork": "{{subnetwork}}"
          }
        ],
        "tags": ["{{resourceName}}"]
      }
    }
  }
}`,
        bicep: `
resource vmInstance 'Microsoft.Compute/virtualMachines@2021-04-01' = {
  name: '{{resourceName}}'
  location: resourceGroup().location
  properties: {
    hardwareProfile: {
      vmSize: '{{machineType}}'
    }
    osProfile: {
      computerName: '{{resourceName}}'
      adminUsername: '{{adminUsername}}'
      adminPassword: '{{adminPassword}}'
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: '{{networkInterfaceId}}'
        }
      ]
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: 'UbuntuServer'
        sku: '18.04-LTS'
        version: 'latest'
      }
    }
  }
}`
      },
      storage: {
        terraform: `
resource "google_storage_bucket" "{{resourceName}}" {
  name          = "{{bucketName}}"
  location      = "{{location}}"
  force_destroy = true
  
  uniform_bucket_level_access = true
}`,
        pulumi: `
import * as gcp from "@pulumi/gcp";

const bucket = new gcp.storage.Bucket("{{resourceName}}", {
    name: "{{bucketName}}",
    location: "{{location}}",
    forceDestroy: true,
    uniformBucketLevelAccess: true
});`,
        ansible: `
- name: Create GCP storage bucket
  google.cloud.gcp_storage_bucket:
    name: "{{bucketName}}"
    location: "{{location}}"
    force_destroy: true
    uniform_bucket_level_access: true`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "Google::Storage::Bucket",
      "Properties": {
        "name": "{{bucketName}}",
        "location": "{{location}}",
        "forceDestroy": true,
        "uniformBucketLevelAccess": true
      }
    }
  }
}`,
        bicep: `
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: '{{resourceName}}'
  location: resourceGroup().location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
  }
}`
      }
    },
    azure: {
      vm: {
        terraform: `
resource "azurerm_virtual_machine" "{{resourceName}}" {
  name                  = "{{resourceName}}"
  location              = "{{location}}"
  resource_group_name   = "{{resourceGroupName}}"
  network_interface_ids = ["{{networkInterfaceId}}"]
  vm_size               = "{{vmSize}}"
  
  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }
  
  storage_os_disk {
    name              = "{{resourceName}}-osdisk"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Standard_LRS"
  }
  
  os_profile {
    computer_name  = "{{resourceName}}"
    admin_username = "{{adminUsername}}"
    admin_password = "{{adminPassword}}"
  }
}`,
        pulumi: `
import * as azure from "@pulumi/azure";

const vm = new azure.compute.VirtualMachine("{{resourceName}}", {
    name: "{{resourceName}}",
    location: "{{location}}",
    resourceGroupName: "{{resourceGroupName}}",
    networkInterfaceIds: ["{{networkInterfaceId}}"],
    vmSize: "{{vmSize}}",
    storageImageReference: {
        publisher: "Canonical",
        offer: "UbuntuServer",
        sku: "18.04-LTS",
        version: "latest"
    },
    storageOsDisk: {
        name: "{{resourceName}}-osdisk",
        caching: "ReadWrite",
        createOption: "FromImage",
        managedDiskType: "Standard_LRS"
    },
    osProfile: {
        computerName: "{{resourceName}}",
        adminUsername: "{{adminUsername}}",
        adminPassword: "{{adminPassword}}"
    }
});`,
        ansible: `
- name: Create Azure VM
  azure.azcollection.azure_rm_virtualmachine:
    name: "{{resourceName}}"
    location: "{{location}}"
    resource_group: "{{resourceGroupName}}"
    network_interface_ids: ["{{networkInterfaceId}}"]
    vm_size: "{{vmSize}}"
    storage_image_reference:
      publisher: "Canonical"
      offer: "UbuntuServer"
      sku: "18.04-LTS"
      version: "latest"
    storage_os_disk:
      name: "{{resourceName}}-osdisk"
      caching: "ReadWrite"
      create_option: "FromImage"
      managed_disk_type: "Standard_LRS"
    os_profile:
      computer_name: "{{resourceName}}"
      admin_username: "{{adminUsername}}"
      admin_password: "{{adminPassword}}"`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "Azure::Compute::VirtualMachine",
      "Properties": {
        "name": "{{resourceName}}",
        "location": "{{location}}",
        "resourceGroupName": "{{resourceGroupName}}",
        "networkInterfaceIds": ["{{networkInterfaceId}}"],
        "vmSize": "{{vmSize}}",
        "storageImageReference": {
          "publisher": "Canonical",
          "offer": "UbuntuServer",
          "sku": "18.04-LTS",
          "version": "latest"
        },
        "storageOsDisk": {
          "name": "{{resourceName}}-osdisk",
          "caching": "ReadWrite",
          "createOption": "FromImage",
          "managedDiskType": "Standard_LRS"
        },
        "osProfile": {
          "computerName": "{{resourceName}}",
          "adminUsername": "{{adminUsername}}",
          "adminPassword": "{{adminPassword}}"
        }
      }
    }
  }
}`,
        bicep: `
resource vmInstance 'Microsoft.Compute/virtualMachines@2021-04-01' = {
  name: '{{resourceName}}'
  location: resourceGroup().location
  properties: {
    hardwareProfile: {
      vmSize: '{{vmSize}}'
    }
    osProfile: {
      computerName: '{{resourceName}}'
      adminUsername: '{{adminUsername}}'
      adminPassword: '{{adminPassword}}'
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: '{{networkInterfaceId}}'
        }
      ]
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: 'UbuntuServer'
        sku: '18.04-LTS'
        version: 'latest'
      }
    }
  }
}`
      },
      storage: {
        terraform: `
resource "azurerm_storage_account" "{{resourceName}}" {
  name                     = "{{storageAccountName}}"
  resource_group_name      = "{{resourceGroupName}}"
  location                 = "{{location}}"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}`,
        pulumi: `
import * as azure from "@pulumi/azure";

const storageAccount = new azure.storage.Account("{{resourceName}}", {
    name: "{{storageAccountName}}",
    resourceGroupName: "{{resourceGroupName}}",
    location: "{{location}}",
    accountTier: "Standard",
    accountReplicationType: "LRS"
});`,
        ansible: `
- name: Create Azure storage account
  azure.azcollection.azure_rm_storageaccount:
    name: "{{storageAccountName}}"
    resource_group: "{{resourceGroupName}}"
    location: "{{location}}"
    account_type: "Standard_LRS"`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "Azure::Storage::Account",
      "Properties": {
        "name": "{{storageAccountName}}",
        "resourceGroupName": "{{resourceGroupName}}",
        "location": "{{location}}",
        "accountTier": "Standard",
        "accountReplicationType": "LRS"
      }
    }
  }
}`,
        bicep: `
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: '{{storageAccountName}}'
  location: resourceGroup().location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
  }
}`
      }
    },
    generic: {
      default: {
        terraform: `
resource "generic_resource" "{{resourceName}}" {
  name = "{{resourceName}}"
  type = "{{resourceType}}"
  
  # Add your custom configuration here
}`,
        pulumi: `
import * as pulumi from "@pulumi/pulumi";

const resource = new pulumi.CustomResource("{{resourceName}}", {
    name: "{{resourceName}}",
    type: "{{resourceType}}"
    // Add your custom configuration here
});`,
        ansible: `
- name: Create generic resource
  generic_resource:
    name: "{{resourceName}}"
    type: "{{resourceType}}"
    # Add your custom configuration here`,
        cloudformation: `
{
  "Resources": {
    "{{resourceName}}": {
      "Type": "{{resourceType}}",
      "Properties": {
        "Name": "{{resourceName}}"
        // Add your custom configuration here
      }
    }
  }
}`,
        bicep: `
resource genericResource 'Microsoft.Resources/deployments@2021-04-01' = {
  name: '{{resourceName}}'
  properties: {
    mode: 'Incremental'
    template: {
      '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#'
      'contentVersion': '1.0.0.0'
      'resources': [
        {
          'type': '{{resourceType}}'
          'name': '{{resourceName}}'
          // Add your custom configuration here
        }
      ]
    }
  }
}`
      }
    }
  };

  static async getTemplates(filter?: {
    provider?: string;
    tool?: string;
    resourceType?: string;
  }): Promise<IaCTemplate[]> {
    try {
      const token = await getAuthToken();
      const queryParams = new URLSearchParams();
      if (filter?.provider) queryParams.append('provider', filter.provider);
      if (filter?.tool) queryParams.append('tool', filter.tool);
      if (filter?.resourceType) queryParams.append('resourceType', filter.resourceType);

      const response = await fetch(`${API_BASE_URL}/templates?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return this.getLocalTemplates(filter);
    }
  }

  static async getTemplate(id: string): Promise<IaCTemplate | null> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  static async createTemplate(template: Omit<IaCTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<IaCTemplate> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  static renderTemplate(template: string, params: Record<string, any>): string {
    let result = template;
    const placeholderRegex = /{{([^}]+)}}/g;

    result = result.replace(placeholderRegex, (match: string, key: string) => {
      return params[key] !== undefined ? params[key] : match;
    });

    return result;
  }

  static generateTerraformCode(options: TemplateOptions): string {
    const template = this.getTemplateContent(options, 'terraform');
    return this.replacePlaceholders(template, options);
  }

  static generatePulumiCode(options: TemplateOptions): string {
    const template = this.getTemplateContent(options, 'pulumi');
    return this.replacePlaceholders(template, options);
  }

  static generateAnsibleCode(options: TemplateOptions): string {
    const template = this.getTemplateContent(options, 'ansible');
    return this.replacePlaceholders(template, options);
  }

  static generateCloudFormationCode(options: TemplateOptions): string {
    const template = this.getTemplateContent(options, 'cloudformation');
    return this.replacePlaceholders(template, options);
  }

  static generateBicepCode(options: TemplateOptions): string {
    const template = this.getTemplateContent(options, 'bicep');
    return this.replacePlaceholders(template, options);
  }

  private static getTemplateContent(options: TemplateOptions, templateType: TemplateType): string {
    const provider = options.provider as ProviderType;
    const resourceType = options.resourceType as ResourceType;

    // Try to get the specific template
    const providerTemplates = this.TEMPLATES[provider];
    if (providerTemplates) {
      const resourceTemplates = providerTemplates[resourceType];
      if (resourceTemplates && resourceTemplates[templateType]) {
        return resourceTemplates[templateType];
      }
    }

    // Fall back to generic template
    return this.TEMPLATES.generic.default[templateType];
  }

  private static replacePlaceholders(template: string, options: TemplateOptions): string {
    let result = template;

    // Replace resource name
    result = result.replace(/{{resourceName}}/g, options.resourceName);

    // Replace resource type
    result = result.replace(/{{resourceType}}/g, options.resourceType);

    // Replace custom parameters
    if (options.customParams) {
      Object.entries(options.customParams).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // Replace any remaining placeholders with default values
    const placeholderRegex = /{{([^}]+)}}/g;
    result = result.replace(placeholderRegex, (match: string, key: string) => {
      return this.getDefaultValue(key);
    });

    return result;
  }

  private static getDefaultValue(key: string): string {
    const defaults: Record<string, string> = {
      ami: 'ami-0c55b159cbfafe1f0',
      instanceType: 't2.micro',
      subnetId: 'subnet-12345678',
      bucketName: 'my-bucket',
      location: 'us-east-1',
      machineType: 'n1-standard-1',
      zone: 'us-central1-a',
      image: 'ubuntu-os-cloud/ubuntu-1804-lts',
      network: 'default',
      subnetwork: 'default',
      resourceGroupName: 'my-resource-group',
      networkInterfaceId: 'nic-12345678',
      vmSize: 'Standard_B1s',
      adminUsername: 'admin',
      adminPassword: 'P@ssw0rd123!',
      storageAccountName: 'mystorageaccount'
    };

    return defaults[key] || `value-for-${key}`;
  }

  private static getLocalTemplates(filter?: {
    provider?: string;
    tool?: string;
    resourceType?: string;
  }): IaCTemplate[] {
    // Implementación local de templates
    return [];
  }
}

export { IaCTemplateService };
