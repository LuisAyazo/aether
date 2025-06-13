import { AzureEventHubNamespaceConfig } from './eventHubNamespace'; // Asumiremos que este tipo se definirá en eventHubNamespace.ts
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

export function generateAzureEventHubNamespaceTemplates(config: AzureEventHubNamespaceConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myeventhubns').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myeventhubns').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Event Hubs Namespace
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_eventhub_namespace" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  sku                 = "${config.sku}" # Basic, Standard, or Premium
  
  ${config.sku !== 'Basic' && config.capacity ? `capacity = ${config.capacity}`: ''} # Capacity for Standard/Premium
  ${config.auto_inflate_enabled !== undefined && config.sku !== 'Basic' ? `auto_inflate_enabled = ${config.auto_inflate_enabled}`: ''}
  ${config.auto_inflate_enabled && config.maximum_throughput_units && config.sku !== 'Basic' ? `maximum_throughput_units = ${config.maximum_throughput_units}`: ''}
  ${config.sku === 'Premium' && config.zone_redundant !== undefined ? `zone_redundant = ${config.zone_redundant}`: ''}
  ${config.kafka_enabled !== undefined ? `kafka_enabled = ${config.kafka_enabled}`: ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "eventhub_namespace_id" {
  value = azurerm_eventhub_namespace.${terraformResourceName}.id
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Event Hubs Namespace
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const eventHubNamespace = new azure.eventhub.Namespace("${pulumiResourceName}", {
    namespaceName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
        name: "${config.sku}", // Basic, Standard, Premium
        ${config.sku !== 'Basic' && config.capacity ? `capacity: ${config.capacity},`: ''}
        // tier: "${config.sku}", // Opcional
    },
    ${config.auto_inflate_enabled !== undefined && config.sku !== 'Basic' ? `isAutoInflateEnabled: ${config.auto_inflate_enabled},`: ''}
    ${config.auto_inflate_enabled && config.maximum_throughput_units && config.sku !== 'Basic' ? `maximumThroughputUnits: ${config.maximum_throughput_units},`: ''}
    ${config.sku === 'Premium' && config.zone_redundant !== undefined ? `zoneRedundant: ${config.zone_redundant},`: ''}
    ${config.kafka_enabled !== undefined ? `kafkaEnabled: ${config.kafka_enabled},`: ''}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const namespaceId = eventHubNamespace.id;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Event Hubs Namespace
- name: Gestionar Azure Event Hubs Namespace ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    namespace_name: "${config.name}"
    location: "${config.location}"
    sku: "${config.sku}"
    capacity: ${config.sku !== 'Basic' && config.capacity ? config.capacity : 'omit'}
    auto_inflate_enabled: ${config.sku !== 'Basic' && config.auto_inflate_enabled !== undefined ? (config.auto_inflate_enabled ? 'yes' : 'no') : 'omit'}
    maximum_throughput_units: ${config.sku !== 'Basic' && config.auto_inflate_enabled && config.maximum_throughput_units ? config.maximum_throughput_units : 'omit'}
    zone_redundant: ${config.sku === 'Premium' && config.zone_redundant !== undefined ? (config.zone_redundant ? 'yes' : 'no') : 'omit'}
    kafka_enabled: ${config.kafka_enabled !== undefined ? (config.kafka_enabled ? 'yes' : 'no') : 'omit'}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Event Hubs Namespace
      azure.azcollection.azure_rm_eventhubnamespace:
        resource_group: "{{ resource_group }}"
        name: "{{ namespace_name }}"
        location: "{{ location }}"
        sku: "{{ sku }}"
        capacity: "{{ capacity }}"
        is_auto_inflate_enabled: "{{ auto_inflate_enabled }}"
        maximum_throughput_units: "{{ maximum_throughput_units }}"
        zone_redundant: "{{ zone_redundant }}"
        kafka_enabled: "{{ kafka_enabled }}"
        tags: "{{ tags }}"
      register: eh_namespace_info

    - name: Mostrar información del Namespace
      ansible.builtin.debug:
        var: eh_namespace_info
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
