import { AzureServiceBusNamespaceConfig } from './serviceBusNamespace'; // Asumiremos que este tipo se definirá en serviceBusNamespace.ts
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

export function generateAzureServiceBusNamespaceTemplates(config: AzureServiceBusNamespaceConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myservicebus').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myservicebus').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Service Bus Namespace
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_servicebus_namespace" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  sku                 = "${config.sku}" # Basic, Standard, or Premium

  ${config.sku === 'Premium' && config.capacity ? `capacity = ${config.capacity}`: ''}
  ${config.sku === 'Premium' && config.zone_redundant !== undefined ? `zone_redundant = ${config.zone_redundant}`: ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "servicebus_namespace_id" {
  value = azurerm_servicebus_namespace.${terraformResourceName}.id
}

output "servicebus_namespace_default_primary_connection_string" {
  value     = azurerm_servicebus_namespace.${terraformResourceName}.default_primary_connection_string
  sensitive = true
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Service Bus Namespace
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const serviceBusNamespace = new azure.servicebus.Namespace("${pulumiResourceName}", {
    namespaceName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
        name: "${config.sku}", // Basic, Standard, Premium
        ${config.sku === 'Premium' && config.capacity ? `capacity: ${config.capacity},`: ''}
        // tier: "${config.sku}", // Opcional, a menudo igual que name
    },
    ${config.sku === 'Premium' && config.zone_redundant !== undefined ? `zoneRedundant: ${config.zone_redundant},`: ''}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const namespaceId = serviceBusNamespace.id;
// Para obtener connection strings, se necesitaría crear una AuthorizationRule
// const defaultRule = new azure.servicebus.NamespaceAuthorizationRule("defaultRule", {
//     namespaceName: serviceBusNamespace.name,
//     resourceGroupName: resourceGroup.name,
//     rights: ["Listen", "Send", "Manage"],
// });
// export const primaryConnectionString = defaultRule.primaryConnectionString;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Service Bus Namespace
- name: Gestionar Azure Service Bus Namespace ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    namespace_name: "${config.name}"
    location: "${config.location}"
    sku: "${config.sku}" # Basic, Standard, Premium
    capacity: ${config.sku === 'Premium' && config.capacity ? config.capacity : 'omit'}
    zone_redundant: ${config.sku === 'Premium' && config.zone_redundant !== undefined ? (config.zone_redundant ? 'yes' : 'no') : 'omit'}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Service Bus Namespace
      azure.azcollection.azure_rm_servicebusnamespace:
        resource_group: "{{ resource_group }}"
        name: "{{ namespace_name }}"
        location: "{{ location }}"
        sku: 
          name: "{{ sku }}"
          # capacity: "{{ capacity if sku == 'Premium' else omit }}" # El módulo puede manejar esto directamente con sku.name
        # zone_redundant: "{{ zone_redundant if sku == 'Premium' else omit }}" # El módulo puede manejar esto
        tags: "{{ tags }}"
      register: sb_namespace_info

    - name: Mostrar información del Namespace
      ansible.builtin.debug:
        var: sb_namespace_info
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
