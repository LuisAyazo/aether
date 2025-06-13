import { AzureCosmosDbAccountConfig } from './cosmosDbAccount'; // Asumiremos que este tipo se definirá en cosmosDbAccount.ts
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

export function generateAzureCosmosDbAccountTemplates(config: AzureCosmosDbAccountConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mycosmosdb').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mycosmosdb').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para una Cuenta de Azure Cosmos DB
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_cosmosdb_account" "${terraformResourceName}" {
  name                = "${config.name}"
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  offer_type          = "${config.offer_type}"
  kind                = "${config.kind}"

  consistency_policy {
    consistency_level       = "${config.consistency_policy.consistency_level}"
    ${config.consistency_policy.consistency_level === 'BoundedStaleness' ? `max_interval_in_seconds = ${config.consistency_policy.max_interval_in_seconds || 5}` : ""}
    ${config.consistency_policy.consistency_level === 'BoundedStaleness' ? `max_staleness_prefix  = ${config.consistency_policy.max_staleness_prefix || 100}` : ""}
  }

  geo_location {
    location          = "${config.geo_location.location}" # Debe ser una región de Azure válida
    failover_priority = ${config.geo_location.failover_priority}
  }
  
  ${config.enable_automatic_failover !== undefined ? `enable_automatic_failover = ${config.enable_automatic_failover}` : ""}
  ${config.is_virtual_network_filter_enabled !== undefined ? `is_virtual_network_filter_enabled = ${config.is_virtual_network_filter_enabled}` : ""}
  ${config.public_network_access_enabled !== undefined ? `public_network_access_enabled = ${config.public_network_access_enabled}` : ""}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "cosmosdb_account_id" {
  value = azurerm_cosmosdb_account.${terraformResourceName}.id
}

output "cosmosdb_account_endpoint" {
  value = azurerm_cosmosdb_account.${terraformResourceName}.endpoint
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Cuenta de Azure Cosmos DB
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const cosmosDbAccount = new azure.documentdb.DatabaseAccount("${pulumiResourceName}", {
    accountName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    offerType: "${config.offer_type}", // Directamente el string "Standard"
    kind: "${config.kind}", // Directamente el string, ej: "GlobalDocumentDB", "MongoDB"
    consistencyPolicy: {
        defaultConsistencyLevel: "${config.consistency_policy.consistency_level}", // Directamente el string, ej: "Session"
        ${config.consistency_policy.consistency_level === 'BoundedStaleness' ? `maxIntervalInSeconds: ${config.consistency_policy.max_interval_in_seconds || 5},` : ""}
        ${config.consistency_policy.consistency_level === 'BoundedStaleness' ? `maxStalenessPrefix: ${config.consistency_policy.max_staleness_prefix || 100},` : ""}
    },
    locations: [{
        locationName: resourceGroup.location, // Usar la ubicación del RG como principal
        failoverPriority: ${config.geo_location.failover_priority},
        // isZoneRedundant: false, // Opcional, por defecto false
    }],
    enableAutomaticFailover: ${config.enable_automatic_failover !== undefined ? config.enable_automatic_failover : true},
    isVirtualNetworkFilterEnabled: ${config.is_virtual_network_filter_enabled || false},
    publicNetworkAccess: "${config.public_network_access_enabled === false ? 'Disabled' : 'Enabled'}",
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const cosmosDbAccountId = cosmosDbAccount.id;
export const cosmosDbAccountEndpoint = cosmosDbAccount.documentEndpoint;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Cosmos DB Account
- name: Gestionar Azure Cosmos DB Account ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    account_name: "${config.name}"
    location: "${config.location}"
    offer_type: "${config.offer_type}"
    kind: "${config.kind}" # GlobalDocumentDB, MongoDB, Table, Cassandra, Gremlin
    consistency_level: "${config.consistency_policy.consistency_level}"
    # Para BoundedStaleness
    max_interval_in_seconds: ${config.consistency_policy.max_interval_in_seconds || 5}
    max_staleness_prefix: ${config.consistency_policy.max_staleness_prefix || 100}
    geo_locations:
      - name: "{{ location }}" # Ubicación principal
        failover_priority: ${config.geo_location.failover_priority}
    enable_automatic_failover: ${config.enable_automatic_failover !== undefined ? config.enable_automatic_failover : 'yes'}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Cosmos DB Account
      azure.azcollection.azure_rm_cosmosdbaccount:
        resource_group: "{{ resource_group }}"
        name: "{{ account_name }}"
        location: "{{ location }}"
        offer_type: "{{ offer_type }}"
        kind: "{{ kind }}"
        consistency_policy:
          default_consistency_level: "{{ consistency_level }}"
          max_interval_in_seconds: "{{ max_interval_in_seconds if consistency_level == 'BoundedStaleness' else omit }}"
          max_staleness_prefix: "{{ max_staleness_prefix if consistency_level == 'BoundedStaleness' else omit }}"
        geo_replications: "{{ geo_locations }}"
        enable_automatic_failover: "{{ enable_automatic_failover }}"
        # public_network_access: "{{ 'Enabled' if public_network_access_enabled | default(true) else 'Disabled' }}"
        # virtual_network_rules: [] # Si is_virtual_network_filter_enabled es true
        tags: "{{ tags }}"
      register: cosmosdb_info

    - name: Mostrar información de la Cuenta Cosmos DB
      ansible.builtin.debug:
        var: cosmosdb_info
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
