import { AzureSynapseWorkspaceConfig } from './synapseWorkspace'; // Asumiremos que este tipo se definirá en synapseWorkspace.ts
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

export function generateAzureSynapseWorkspaceTemplates(config: AzureSynapseWorkspaceConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mysynapsews').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mysynapsews').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Synapse Workspace
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Se asume que la cuenta de ADLS Gen2 y el filesystem ya existen.
# El ID del filesystem se pasa en config.storage_data_lake_gen2_filesystem_id

resource "azurerm_synapse_workspace" "${terraformResourceName}" {
  name                                 = "${config.name}"
  resource_group_name                  = azurerm_resource_group.${terraformResourceName}_rg.name
  location                             = azurerm_resource_group.${terraformResourceName}_rg.location
  storage_data_lake_gen2_filesystem_id = "${config.storage_data_lake_gen2_filesystem_id}"
  sql_administrator_login              = "${config.sql_administrator_login}"
  sql_administrator_login_password     = "${config.sql_administrator_login_password}" # Considerar usar Key Vault para la contraseña

  ${config.managed_virtual_network_enabled !== undefined ? `managed_virtual_network_enabled = ${config.managed_virtual_network_enabled}`: ''}
  ${config.public_network_access_enabled !== undefined ? `public_network_access_enabled = ${config.public_network_access_enabled}`: ''}

  # AAD admin (opcional, pero recomendado)
  # aad_admin {
  #   login     = "user@example.com"
  #   object_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # Object ID del usuario/grupo AAD
  #   tenant_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # Tenant ID de AAD
  # }

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "synapse_workspace_id" {
  value = azurerm_synapse_workspace.${terraformResourceName}.id
}

output "synapse_workspace_connectivity_endpoints" {
  value = azurerm_synapse_workspace.${terraformResourceName}.connectivity_endpoints
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Synapse Workspace
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

// Se asume que la cuenta de ADLS Gen2 y el filesystem ya existen.
const dataLakeGen2FilesystemId = "${config.storage_data_lake_gen2_filesystem_id}";

const synapseWorkspace = new azure.synapse.Workspace("${pulumiResourceName}", {
    workspaceName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    defaultDataLakeStorage: {
        accountUrl: pulumi.interpolate\`https://\${dataLakeGen2FilesystemId.split('/')[8]}.dfs.core.windows.net\`, // Extraer nombre de la cuenta del ID
        filesystem: dataLakeGen2FilesystemId.split('/').pop(), // Extraer nombre del filesystem del ID
    },
    sqlAdministratorLogin: "${config.sql_administrator_login}",
    sqlAdministratorLoginPassword: "${config.sql_administrator_login_password}", // Considerar usar Pulumi config secrets
    managedVirtualNetwork: ${config.managed_virtual_network_enabled ? '"default"' : undefined}, // "default" para habilitar
    publicNetworkAccess: "${config.public_network_access_enabled === false ? 'Disabled' : 'Enabled'}",
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const workspaceId = synapseWorkspace.id;
export const devSqlEndpoint = synapseWorkspace.connectivityEndpoints.apply(ep => ep?.dev);
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Synapse Workspace
- name: Gestionar Azure Synapse Workspace ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    workspace_name: "${config.name}"
    location: "${config.location}"
    storage_data_lake_gen2_filesystem_id: "${config.storage_data_lake_gen2_filesystem_id}"
    sql_admin_login: "${config.sql_administrator_login}"
    sql_admin_password: "{{ synapse_sql_admin_password }}" # Usar Ansible Vault para la contraseña
    managed_virtual_network: ${config.managed_virtual_network_enabled ? "'default'" : 'None'}
    public_network_access: ${config.public_network_access_enabled === false ? 'Disabled' : 'Enabled'}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Synapse Workspace
      azure.azcollection.azure_rm_synapseworkspace:
        name: "{{ workspace_name }}"
        resource_group: "{{ resource_group }}"
        location: "{{ location }}"
        storage_data_lake_gen2_filesystem_id: "{{ storage_data_lake_gen2_filesystem_id }}"
        sql_administrator_login: "{{ sql_admin_login }}"
        sql_administrator_login_password: "{{ sql_admin_password }}"
        managed_virtual_network: "{{ managed_virtual_network }}"
        public_network_access: "{{ public_network_access }}"
        tags: "{{ tags }}"
      register: synapse_ws_info

    - name: Mostrar información del Workspace
      ansible.builtin.debug:
        var: synapse_ws_info
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
