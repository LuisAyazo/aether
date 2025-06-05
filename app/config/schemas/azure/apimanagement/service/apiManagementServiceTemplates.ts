import { AzureApiManagementServiceConfig } from './apiManagementService';
import { CodeTemplate } from '@/app/types/resourceConfig';

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);
};

export function generateAzureApiManagementServiceTemplates(config: AzureApiManagementServiceConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myapimservice')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
  const pulumiResourceName = (config.name || 'myapimservice').replace(/-/g, '');

  const parsedTags = parseKeyValueString(config.tags);

  // Parseo seguro del SKU
  const [skuType, skuCapacityRaw] = (config.sku_name || 'Developer_1').split('_');
  const skuCapacity = parseInt(skuCapacityRaw || '1', 10);

  const terraform = `
# Plantilla de Terraform para Azure API Management Service
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_api_management_service" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  publisher_name      = "${config.publisher_name}"
  publisher_email     = "${config.publisher_email}"
  sku_name            = "${config.sku_name}"

  ${config.virtual_network_type && config.virtual_network_type !== "None" ? `
  virtual_network_type = "${config.virtual_network_type}"
  # virtual_network_configuration {
  #   subnet_id = "/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/virtualNetworks/YOUR_VNET/subnets/YOUR_APIM_SUBNET"
  # }
  ` : ''}

  ${Object.keys(parsedTags).length > 0 ? `
  tags = {
    ${Object.entries(parsedTags).map(([k, v]) => `"${k}" = "${v}"`).join('\n    ')}
  }
  ` : ''}
}

output "api_management_service_id" {
  value = azurerm_api_management_service.${terraformResourceName}.id
}

output "api_management_gateway_url" {
  value = azurerm_api_management_service.${terraformResourceName}.gateway_url
}
`;

  const pulumi = `
// Pulumi (TypeScript) para Azure API Management Service
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
  resourceGroupName: "${config.resource_group_name}",
  location: "${config.location}",
});

const apiManagementService = new azure.apimanagement.Service("${pulumiResourceName}", {
  serviceName: "${config.name}",
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  publisherName: "${config.publisher_name}",
  publisherEmail: "${config.publisher_email}",
  sku: {
    name: "${skuType}",
    capacity: ${skuCapacity},
  },
  virtualNetworkType: "${config.virtual_network_type || 'None'}",
  // virtualNetworkConfiguration: {
  //   subnetResourceId: "/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/virtualNetworks/YOUR_VNET/subnets/YOUR_APIM_SUBNET",
  // },
  tags: {
    ${Object.entries(parsedTags).map(([k, v]) => `"${k}": "${v}",`).join('\n    ')}
  },
});

export const apimServiceId = apiManagementService.id;
export const apimGatewayUrl = apiManagementService.gatewayUrl;
`;

  const ansiblePlaybook = `
# Ansible Playbook para Azure API Management Service
- name: Gestionar Azure API Management Service ${config.name}
  hosts: localhost
  connection: local
  gather_facts: false

  vars:
    resource_group: "${config.resource_group_name}"
    service_name: "${config.name}"
    location: "${config.location}"
    publisher_name: "${config.publisher_name}"
    publisher_email: "${config.publisher_email}"
    sku_name: "${skuType}"
    sku_capacity: ${skuCapacity}
    virtual_network_type: "${config.virtual_network_type || 'None'}"
    # subnet_id: "/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Network/virtualNetworks/YOUR_VNET/subnets/YOUR_APIM_SUBNET"
    tags:
      ${Object.entries(parsedTags).map(([k, v]) => `${k}: "${v}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar API Management Service
      azure.azcollection.azure_rm_apimanagementservice:
        resource_group: "{{ resource_group }}"
        name: "{{ service_name }}"
        location: "{{ location }}"
        publisher_name: "{{ publisher_name }}"
        publisher_email: "{{ publisher_email }}"
        sku_name: "{{ sku_name }}"
        sku_capacity: "{{ sku_capacity }}"
        virtual_network_type: "{{ virtual_network_type }}"
        # virtual_network_configuration:
        #   subnet:
        #     id: "{{ subnet_id }}"
        tags: "{{ tags }}"
      register: apim_info

    - name: Mostrar info del servicio
      ansible.builtin.debug:
        var: apim_info
`;

  const cloudformation = `
# CloudFormation no aplica para Azure.
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
