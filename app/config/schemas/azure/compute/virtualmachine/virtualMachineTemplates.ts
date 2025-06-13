import { AzureVirtualMachineConfig } from './virtualMachine'; // Asumiremos que este tipo se definirá en virtualMachine.ts
import { CodeTemplate } from "../../../../../types/resourceConfig";

// Helper function to parse key-value string "Key1=Value1,Key2=Value2" to object
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

export function generateAzureVirtualMachineTemplates(config: AzureVirtualMachineConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myAzureVm').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myAzureVm').replace(/-/g, '');

  const parsedTags = parseKeyValueString(config.tags as string | undefined);
  const networkInterfaceIdsArray = (config.network_interface_ids || '').split(',').map((id: string) => id.trim()).filter((id: string) => id);

  const terraform = `
# Plantilla de Terraform para una Máquina Virtual de Azure
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Asumimos que las NICs (azurerm_network_interface) ya existen o se crean por separado.
# Aquí solo se referencian sus IDs.

resource "azurerm_virtual_machine" "${terraformResourceName}" {
  name                  = "${config.name}"
  location              = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name   = azurerm_resource_group.${terraformResourceName}_rg.name
  vm_size               = "${config.size}"
  network_interface_ids = [
    ${networkInterfaceIdsArray.map((id: string) => `"${id}"`).join(',\n    ')}
  ]

  storage_os_disk {
    name              = "${config.name}-osdisk"
    caching           = "${config.os_disk.caching}"
    create_option     = "FromImage" # Asumimos creación desde imagen
    managed_disk_type = "${config.os_disk.storage_account_type}" # o managed_disk_type
  }

  ${config.source_image_reference ? `
  storage_image_reference {
    publisher = "${config.source_image_reference.publisher}"
    offer     = "${config.source_image_reference.offer}"
    sku       = "${config.source_image_reference.sku}"
    version   = "${config.source_image_reference.version}"
  }` : '# Se requiere source_image_id o source_image_reference'}

  os_profile {
    computer_name  = "${config.name}"
    admin_username = "${config.admin_username}"
    ${config.admin_password ? `admin_password = "${config.admin_password}"` : ''}
  }

  ${config.admin_password ? `
  os_profile_linux_config { # Asumimos Linux, ajustar para Windows si es necesario
    disable_password_authentication = false # Habilitar si se usa contraseña
  }` : `
  os_profile_linux_config {
    disable_password_authentication = true # Deshabilitar si se usan claves SSH
    # ssh_keys {
    #   key_data = file("~/.ssh/id_rsa.pub") # Ejemplo
    #   path     = "/home/${config.admin_username}/.ssh/authorized_keys"
    # }
  }`}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "virtual_machine_id" {
  value = azurerm_virtual_machine.${terraformResourceName}.id
}
output "virtual_machine_public_ip_address_id" {
  # Esto requeriría que la NIC tenga una IP pública asociada y que se exporte su ID.
  # value = azurerm_public_ip.example.id 
  value = "Consultar la IP pública de la NIC asociada"
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Máquina Virtual de Azure
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native"; // Usando azure-native

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const virtualMachine = new azure.compute.VirtualMachine("${pulumiResourceName}", {
    vmName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    hardwareProfile: {
        vmSize: "${config.size}",
    },
    networkProfile: {
        networkInterfaces: [
            ${networkInterfaceIdsArray.map((id: string) => `{ id: "${id}" }`).join(',\n            ')}
        ],
    },
    osProfile: {
        computerName: "${config.name}",
        adminUsername: "${config.admin_username}",
        ${config.admin_password ? `adminPassword: "${config.admin_password}",` : ''}
        ${!config.admin_password ? `linuxConfiguration: { disablePasswordAuthentication: true, /* ssh: { publicKeys: [{ keyData: "ssh-rsa ...", path: \`/home/${config.admin_username}/.ssh/authorized_keys\` }] } */ },` : `linuxConfiguration: { disablePasswordAuthentication: false },`}
    },
    storageProfile: {
        osDisk: {
            name: \`\${"${config.name}"}-osdisk\`,
            createOption: azure.compute.DiskCreateOptionTypes.FromImage,
            caching: azure.compute.CachingTypes.${config.os_disk.caching}, // ReadWrite, ReadOnly, None
            managedDisk: {
                storageAccountType: azure.compute.StorageAccountTypes.${config.os_disk.storage_account_type.replace('_', '')}, // StandardLRS, PremiumLRS, StandardSSDLRS
            },
        },
        ${config.source_image_reference ? `
        imageReference: {
            publisher: "${config.source_image_reference.publisher}",
            offer: "${config.source_image_reference.offer}",
            sku: "${config.source_image_reference.sku}",
            version: "${config.source_image_reference.version}",
        },` : '// Se requiere sourceImageId o imageReference'}
    },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const virtualMachineId = virtualMachine.id;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Virtual Machine (requiere azure.azcollection.azure_rm_virtualmachine)
- name: Gestionar Máquina Virtual Azure ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    location: "${config.location}"
    vm_name: "${config.name}"
    vm_size: "${config.size}"
    admin_username: "${config.admin_username}"
    admin_password: "${config.admin_password || 'YOUR_SECURE_PASSWORD_OR_USE_SSH'}" # ¡Cuidado con las contraseñas en texto plano!
    network_interface_ids:
      ${networkInterfaceIdsArray.map((id: string) => `- ${id}`).join('\n      ')}
    os_disk_caching: "${config.os_disk.caching}"
    os_disk_storage_type: "${config.os_disk.storage_account_type}"
    image_publisher: "${config.source_image_reference?.publisher || 'Canonical'}"
    image_offer: "${config.source_image_reference?.offer || 'UbuntuServer'}"
    image_sku: "${config.source_image_reference?.sku || '18.04-LTS'}"
    image_version: "${config.source_image_reference?.version || 'latest'}"
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Asegurar que el grupo de recursos exista
      azure.azcollection.azure_rm_resourcegroup:
        name: "{{ resource_group }}"
        location: "{{ location }}"

    - name: Crear o actualizar la Máquina Virtual
      azure.azcollection.azure_rm_virtualmachine:
        resource_group: "{{ resource_group }}"
        name: "{{ vm_name }}"
        vm_size: "{{ vm_size }}"
        admin_username: "{{ admin_username }}"
        # Si se usa contraseña, descomentar y asegurar que disable_password_authentication sea false
        # admin_password: "{{ admin_password }}" 
        # Si se usan claves SSH (recomendado):
        ssh_password_enabled: false # Para deshabilitar autenticación por contraseña
        ssh_public_keys:
          - path: "/home/{{ admin_username }}/.ssh/authorized_keys"
            key_data: "YOUR_SSH_PUBLIC_KEY_HERE" # Reemplazar con tu clave pública SSH
        network_interfaces: "{{ network_interface_ids }}" # Esto espera nombres de NIC, no IDs completos. Ajustar si es necesario.
        os_disk_caching: "{{ os_disk_caching }}"
        managed_disk_type: "{{ os_disk_storage_type }}"
        image:
          publisher: "{{ image_publisher }}"
          offer: "{{ image_offer }}"
          sku: "{{ image_sku }}"
          version: "{{ image_version }}"
        tags: "{{ tags }}"
      register: vm_info

    - name: Mostrar información de la VM
      ansible.builtin.debug:
        var: vm_info
`;
  // CloudFormation no es aplicable a Azure.
  const cloudformation = `
# AWS CloudFormation no es aplicable para recursos de Azure.
# Para gestionar recursos de Azure como código, considera Azure Resource Manager (ARM) templates, Bicep, Terraform o Pulumi.
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
