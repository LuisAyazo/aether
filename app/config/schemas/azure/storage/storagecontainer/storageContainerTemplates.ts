import { AzureStorageContainerConfig } from './storageContainer'; // Asumiremos que este tipo se definirá en storageContainer.ts
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

export function generateAzureStorageContainerTemplates(config: AzureStorageContainerConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mycontainer').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mycontainer').replace(/-/g, '');
  const parsedMetadata = parseKeyValueString(config.metadata as string | undefined);

  // Para Terraform y Pulumi, se asume que la cuenta de almacenamiento ya existe y su nombre es conocido.
  // La creación de la cuenta de almacenamiento (azurerm_storage_account) sería un recurso separado.

  const terraform = `
# Plantilla de Terraform para un Azure Storage Container
provider "azurerm" {
  features {}
}

# Asumimos que la cuenta de almacenamiento (azurerm_storage_account) ya existe.
# Su nombre se pasa en config.storage_account_name.
# El resource_group_name y location se infieren de la cuenta de almacenamiento.

resource "azurerm_storage_container" "${terraformResourceName}" {
  name                  = "${config.name}"
  storage_account_name  = "${config.storage_account_name}"
  container_access_type = "${config.container_access_type || 'private'}"

  ${Object.keys(parsedMetadata).length > 0 ? 
    `metadata = {
    ${Object.entries(parsedMetadata).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "storage_container_id" {
  value = azurerm_storage_container.${terraformResourceName}.id
}

output "storage_container_url" {
  # La URL del contenedor no es un output directo, pero se puede construir.
  # Esto es un ejemplo y puede necesitar el nombre del blob también.
  value = "https://${config.storage_account_name}.blob.core.windows.net/${config.name}"
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Azure Storage Container
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

// Asumimos que la cuenta de almacenamiento ya existe y su nombre y grupo de recursos son conocidos.
const storageAccountName = "${config.storage_account_name}";
// El resourceGroupName de la cuenta de almacenamiento es necesario para Pulumi.
// Si no se proporciona, se necesitaría un input adicional o una búsqueda.
const resourceGroupNameForStorageAccount = "${config.resource_group_name_for_storage_account || 'YOUR_STORAGE_ACCOUNT_RESOURCE_GROUP'}"; 

const storageContainer = new azure.storage.BlobContainer("${pulumiResourceName}", {
    accountName: storageAccountName,
    resourceGroupName: resourceGroupNameForStorageAccount,
    containerName: "${config.name}",
    publicAccess: azure.storage.PublicAccess.${config.container_access_type === 'blob' ? 'Blob' : (config.container_access_type === 'container' ? 'Container' : 'None')},
    metadata: {
        ${Object.entries(parsedMetadata).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const containerId = storageContainer.id;
export const containerName = storageContainer.name;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Storage Container
- name: Gestionar Azure Storage Container ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    # El resource_group de la cuenta de almacenamiento es necesario.
    resource_group_for_storage_account: "${config.resource_group_name_for_storage_account || 'YOUR_STORAGE_ACCOUNT_RESOURCE_GROUP'}"
    storage_account_name: "${config.storage_account_name}"
    container_name: "${config.name}"
    public_access: "${config.container_access_type || 'private'}" # private, blob, container
    metadata:
      ${Object.entries(parsedMetadata).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Storage Container
      azure.azcollection.azure_rm_storagecontainer:
        resource_group: "{{ resource_group_for_storage_account }}"
        storage_account_name: "{{ storage_account_name }}"
        name: "{{ container_name }}"
        public_access: "{{ public_access }}"
        metadata: "{{ metadata if metadata else omit }}"
      register: container_info

    - name: Mostrar información del Container
      ansible.builtin.debug:
        var: container_info
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
