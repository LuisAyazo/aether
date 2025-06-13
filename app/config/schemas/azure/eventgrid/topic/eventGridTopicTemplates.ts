import { AzureEventGridTopicConfig } from './eventGridTopic'; // Asumiremos que este tipo se definirá en eventGridTopic.ts
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

export function generateAzureEventGridTopicTemplates(config: AzureEventGridTopicConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myeventgridtopic').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myeventgridtopic').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Event Grid Topic
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_eventgrid_topic" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name

  ${config.input_schema ? `input_schema = "${config.input_schema}"`: ''}
  ${config.public_network_access_enabled !== undefined ? `public_network_access_enabled = ${config.public_network_access_enabled}`: ''}
  ${config.local_auth_enabled !== undefined ? `local_auth_enabled = ${config.local_auth_enabled}`: ''}
  // identity { // Opcional: Identidad administrada
  //   type = "SystemAssigned"
  // }

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "eventgrid_topic_id" {
  value = azurerm_eventgrid_topic.${terraformResourceName}.id
}

output "eventgrid_topic_endpoint" {
  value = azurerm_eventgrid_topic.${terraformResourceName}.endpoint
}

output "eventgrid_topic_primary_access_key" {
  value     = azurerm_eventgrid_topic.${terraformResourceName}.primary_access_key
  sensitive = true
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Event Grid Topic
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const eventGridTopic = new azure.eventgrid.Topic("${pulumiResourceName}", {
    topicName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    inputSchema: "${config.input_schema || 'EventGridSchema'}",
    publicNetworkAccess: "${config.public_network_access_enabled === false ? 'Disabled' : 'Enabled'}",
    disableLocalAuth: ${config.local_auth_enabled === false ? true : false}, // Pulumi usa disableLocalAuth
    // identity: { // Opcional
    //     type: azure.eventgrid.IdentityType.SystemAssigned,
    // },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const topicId = eventGridTopic.id;
export const topicEndpoint = eventGridTopic.endpoint;
// Las claves de acceso se gestionan de forma diferente en Pulumi, a menudo a través de listTopicKeys
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Event Grid Topic
- name: Gestionar Azure Event Grid Topic ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    topic_name: "${config.name}"
    location: "${config.location}"
    input_schema: "${config.input_schema || 'EventGridSchema'}"
    public_network_access: ${config.public_network_access_enabled === false ? 'Disabled' : 'Enabled'}
    local_auth_enabled: ${config.local_auth_enabled === false ? 'no' : 'yes'}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Event Grid Topic
      azure.azcollection.azure_rm_eventgridtopic:
        resource_group: "{{ resource_group }}"
        name: "{{ topic_name }}"
        location: "{{ location }}"
        input_schema: "{{ input_schema }}"
        public_network_access: "{{ public_network_access }}"
        local_auth_enabled: "{{ local_auth_enabled }}"
        # identity: # Opcional
        #   type: SystemAssigned
        tags: "{{ tags }}"
      register: eg_topic_info

    - name: Mostrar información del Topic
      ansible.builtin.debug:
        var: eg_topic_info
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
