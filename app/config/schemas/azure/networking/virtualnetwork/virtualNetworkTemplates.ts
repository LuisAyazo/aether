import { AzureVirtualNetworkConfig } from './virtualNetwork'; // Asumiremos que este tipo se definirá en virtualNetwork.ts
import { CodeTemplate } from "../../../../../types/resourceConfig";

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

const formatListForTerraform = (inputString?: string): string => {
  if (!inputString) return '[]';
  return JSON.stringify(inputString.split(',').map(s => s.trim()));
};

export function generateAzureVirtualNetworkTemplates(config: AzureVirtualNetworkConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myvnet').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myvnet').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);
  const dnsServersList = config.dns_servers ? config.dns_servers.split(',').map(s => s.trim()) : [];

  const terraform = `
# Plantilla de Terraform para Azure Virtual Network
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_virtual_network" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  address_space       = ["${config.address_space}"] # Debe ser una lista

  ${dnsServersList.length > 0 ? `dns_servers = ${formatListForTerraform(config.dns_servers)}`: ''}
  ${config.ddos_protection_plan_id ? `ddos_protection_plan {
    id     = "${config.ddos_protection_plan_id}"
    enable = true # O false si se quiere deshabilitar explícitamente un plan asociado
  }`: ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "virtual_network_id" {
  value = azurerm_virtual_network.${terraformResourceName}.id
}

output "virtual_network_address_space" {
  value = azurerm_virtual_network.${terraformResourceName}.address_space
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Virtual Network
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const virtualNetwork = new azure.network.VirtualNetwork("${pulumiResourceName}", {
    virtualNetworkName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    addressSpace: {
        addressPrefixes: ["${config.address_space}"],
    },
    dhcpOptions: {
        dnsServers: ${JSON.stringify(dnsServersList)},
    },
    ${config.ddos_protection_plan_id ? `ddosProtectionPlan: {
        id: "${config.ddos_protection_plan_id}",
        enable: true,
    },`: ''}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const vnetId = virtualNetwork.id;
export const vnetAddressSpaces = virtualNetwork.addressSpace.apply(as => as?.addressPrefixes);
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Virtual Network
- name: Gestionar Azure Virtual Network ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    vnet_name: "${config.name}"
    location: "${config.location}"
    address_prefixes_cidr:
      - "${config.address_space}"
    dns_servers: ${JSON.stringify(dnsServersList)}
    ddos_protection_plan_id: "${config.ddos_protection_plan_id || omit}"
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Virtual Network
      azure.azcollection.azure_rm_virtualnetwork:
        resource_group: "{{ resource_group }}"
        name: "{{ vnet_name }}"
        location: "{{ location }}"
        address_prefixes_cidr: "{{ address_prefixes_cidr }}"
        dns_servers: "{{ dns_servers if dns_servers | length > 0 else omit }}"
        # ddos_protection_plan: # El módulo puede no soportar esto directamente, o requerir una estructura diferente
        #   id: "{{ ddos_protection_plan_id if ddos_protection_plan_id else omit }}"
        #   enabled: "{{ true if ddos_protection_plan_id else omit }}"
        tags: "{{ tags }}"
      register: vnet_info

    - name: Mostrar información de la VNet
      ansible.builtin.debug:
        var: vnet_info
`;

  const cloudformation = `
# AWS CloudFormation no es aplicable para recursos de Azure.
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
