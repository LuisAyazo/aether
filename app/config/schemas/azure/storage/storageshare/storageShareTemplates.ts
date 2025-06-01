import { AzureStorageShareConfig } from './storageShare'; // Asumiremos que este tipo se definirá en storageShare.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

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

export function generateAzureStorageShareTemplates(config: AzureStorageShareConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myfileshare').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myfileshare').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);
  const parsedMetadata = parseKeyValueString(config.metadata as string | undefined);

  // Para Terraform y Pulumi, se asume que la cuenta de almacenamiento (azurerm_storage_account) ya existe.
  // El nombre del grupo de recursos se puede obtener de la cuenta de almacenamiento si no se proporciona directamente.

  const terraform = `
# Plantilla de Terraform para Azure File Share
provider "azurerm" {
  features {}
}

# Asumimos que la cuenta de almacenamiento (azurerm_storage_account) ya existe.
# Su nombre se pasa en config.storage_account_name.
# El resource_group_name se puede obtener de la cuenta de almacenamiento o pasarse directamente.
# data "azurerm_storage_account" "existing_sa" {
#   name                = "${config.storage_account_name}"
#   resource_group_name = var.resource_group_name # O el RG de la cuenta si es diferente
# }

resource "azurerm_storage_share" "${terraformResourceName}" {
  name                 = "${config.name}"
  storage_account_name = "${config.storage_account_name}" # Nombre de la cuenta de almacenamiento
  quota                = ${config.quota} # En GB

  ${config.access_tier ? `access_tier = "${config.access_tier}"`: ''} # TransactionOptimized, Hot, Cool (para Premium)
  ${config.enabled_protocol ? `enabled_protocol = "${config.enabled_protocol}"`: ''} # SMB o NFS

  ${Object.keys(parsedMetadata).length > 0 ? 
    `metadata = {
    ${Object.entries(parsedMetadata).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}

  # ACLs (opcional)
  # acl {
  #   id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  #   permissions {
  #     read    = true
  #     create  = true
  #     delete  = false
  #     list    = true
  #     write   = true
  #   }
  # }

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "storage_share_url" {
  value = azurerm_storage_share.${terraformResourceName}.url
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure File Share
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

// Asumimos que la cuenta de almacenamiento ya existe.
// Necesitamos el nombre del grupo de recursos de la cuenta de almacenamiento.
// Esto podría obtenerse buscando la cuenta de almacenamiento o pasándolo como config.
// const storageAccount = azure.storage.getStorageAccountOutput({
//     accountName: "${config.storage_account_name}",
//     resourceGroupName: "YOUR_STORAGE_ACCOUNT_RESOURCE_GROUP", // Reemplazar o pasar como config
// });

const fileShare = new azure.storage.FileShare("${pulumiResourceName}", {
    shareName: "${config.name}",
    accountName: "${config.storage_account_name}",
    // resourceGroupName: storageAccount.resourceGroupName, // Usar el RG de la cuenta de almacenamiento
    resourceGroupName: "YOUR_STORAGE_ACCOUNT_RESOURCE_GROUP", // Reemplazar o pasar como config
    shareQuota: ${config.quota * 1024}, // Pulumi espera en MiB para algunos SDKs, o GB para otros. Azure Native usa GB.
    ${config.access_tier ? `accessTier: "${config.access_tier}",`: ''}
    ${config.enabled_protocol ? `enabledProtocols: "${config.enabled_protocol}",`: ''}
    metadata: {
        ${Object.entries(parsedMetadata).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
    // signedIdentifiers: [], // Opcional
});

export const fileShareId = fileShare.id;
export const fileShareUrl = pulumi.interpolate\`https://\${"${config.storage_account_name}"}.file.core.windows.net/\${"${config.name}"}\`;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure File Share
- name: Gestionar Azure File Share ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    # El resource_group de la cuenta de almacenamiento es necesario.
    resource_group_for_sa: "YOUR_STORAGE_ACCOUNT_RESOURCE_GROUP" # Reemplazar o pasar como var
    storage_account_name: "${config.storage_account_name}"
    share_name: "${config.name}"
    quota: ${config.quota} # En GB
    access_tier: "${config.access_tier || omit}"
    enabled_protocol: "${config.enabled_protocol || 'SMB'}"
    metadata:
      ${Object.entries(parsedMetadata).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar File Share
      azure.azcollection.azure_rm_storagefileshare:
        resource_group: "{{ resource_group_for_sa }}"
        storage_account_name: "{{ storage_account_name }}"
        name: "{{ share_name }}"
        quota: "{{ quota }}"
        access_tier: "{{ access_tier }}"
        # enabled_protocol: "{{ enabled_protocol }}" # El módulo puede no soportar esto directamente
        metadata: "{{ metadata if metadata else omit }}"
        # tags: "{{ tags }}" # El módulo puede no soportar tags directamente en el share
      register: fileshare_info

    - name: Mostrar información del File Share
      ansible.builtin.debug:
        var: fileshare_info
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
