import { AzureRedisCacheConfig } from './redisCache'; // Asumiremos que este tipo se definirá en redisCache.ts
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

export function generateAzureRedisCacheTemplates(config: AzureRedisCacheConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myrediscache').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myrediscache').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Cache for Redis
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_redis_cache" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  capacity            = ${config.capacity}
  family              = "${config.family}" # C (Basic/Standard) or P (Premium)
  sku_name            = "${config.sku_name}" # Basic, Standard, or Premium

  ${config.enable_non_ssl_port !== undefined ? `enable_non_ssl_port = ${config.enable_non_ssl_port}`: ''}
  ${config.minimum_tls_version ? `minimum_tls_version = "${config.minimum_tls_version}"`: ''}
  ${config.shard_count && config.family === 'P' ? `shard_count = ${config.shard_count}`: ''}

  ${config.redis_configuration ? `
  redis_configuration {
    ${config.redis_configuration.maxmemory_reserved ? `maxmemory_reserved = ${config.redis_configuration.maxmemory_reserved}`: ''}
    ${config.redis_configuration.maxmemory_delta ? `maxmemory_delta    = ${config.redis_configuration.maxmemory_delta}`: ''}
    # rdb_backup_enabled             = false # Ejemplo
    # rdb_backup_frequency         = "15min" # Ejemplo
    # rdb_backup_max_snapshot_count = 1 # Ejemplo
    # rdb_storage_connection_string = "" # Ejemplo
  }
  ` : ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "redis_cache_hostname" {
  value = azurerm_redis_cache.${terraformResourceName}.hostname
}

output "redis_cache_primary_key" {
  value     = azurerm_redis_cache.${terraformResourceName}.primary_access_key
  sensitive = true
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Cache for Redis
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const redisCache = new azure.cache.Redis("${pulumiResourceName}", {
    name: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
        capacity: ${config.capacity},
        family: "${config.family}", // "C" or "P"
        name: "${config.sku_name}", // "Basic", "Standard", or "Premium"
    },
    enableNonSslPort: ${config.enable_non_ssl_port || false},
    minimumTlsVersion: "${config.minimum_tls_version || '1.2'}",
    ${config.shard_count && config.family === 'P' ? `shardCount: ${config.shard_count},`: ''}
    ${config.redis_configuration ?
    `redisConfiguration: {
        ${config.redis_configuration.maxmemory_reserved ? `maxmemoryReserved: "${config.redis_configuration.maxmemory_reserved}",`: ''}
        ${config.redis_configuration.maxmemory_delta ? `maxmemoryDelta: "${config.redis_configuration.maxmemory_delta}",`: ''}
    },` : ''}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const hostname = redisCache.hostName;
export const primaryKey = pulumi.secret(redisCache.primaryKey); // Marcar como secreto
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Cache for Redis
- name: Gestionar Azure Cache for Redis ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    cache_name: "${config.name}"
    location: "${config.location}"
    sku:
      name: "${config.sku_name}" # Basic, Standard, Premium
      family: "${config.family}" # C, P
      capacity: ${config.capacity}
    enable_non_ssl_port: ${config.enable_non_ssl_port || 'no'}
    minimum_tls_version: "${config.minimum_tls_version || '1.2'}"
    # shard_count: ${config.shard_count || 'omit'} # Solo para Premium
    redis_configuration:
      ${config.redis_configuration?.maxmemory_reserved ? `maxmemory-reserved: "${config.redis_configuration.maxmemory_reserved}"`: ''}
      ${config.redis_configuration?.maxmemory_delta ? `maxmemory-delta: "${config.redis_configuration.maxmemory_delta}"`: ''}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Azure Cache for Redis
      azure.azcollection.azure_rm_rediscache:
        resource_group: "{{ resource_group }}"
        name: "{{ cache_name }}"
        location: "{{ location }}"
        sku: "{{ sku }}"
        enable_non_ssl_port: "{{ enable_non_ssl_port }}"
        minimum_tls_version: "{{ minimum_tls_version }}"
        # shard_count: "{{ shard_count if sku.family == 'P' else omit }}"
        redis_configuration: "{{ redis_configuration if redis_configuration else omit }}"
        tags: "{{ tags }}"
      register: redis_info

    - name: Mostrar información de la Caché Redis
      ansible.builtin.debug:
        var: redis_info
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
