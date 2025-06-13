import { AzureLinuxVirtualMachineScaleSetConfig } from './linuxVirtualMachineScaleSet';
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

export function generateAzureLinuxVirtualMachineScaleSetTemplates(config: AzureLinuxVirtualMachineScaleSetConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myLinuxVmss').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myLinuxVmss').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para un Azure Linux Virtual Machine Scale Set
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Asumimos que la VNet y Subnet ya existen o se crean por separado.
# Aquí solo se referencia el ID de la subred.

resource "azurerm_linux_virtual_machine_scale_set" "${terraformResourceName}" {
  name                = "${config.name}"
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  sku                 = "${config.sku}"
  instances           = ${config.instances}
  admin_username      = "${config.admin_username}"

  admin_ssh_key {
    username   = "${config.admin_username}"
    public_key = file("${config.admin_ssh_key_public_key_path || "~/.ssh/id_rsa.pub"}") # O directamente el contenido de la clave
  }

  source_image_reference {
    publisher = "${config.source_image_reference.publisher}"
    offer     = "${config.source_image_reference.offer}"
    sku       = "${config.source_image_reference.sku}"
    version   = "${config.source_image_reference.version}"
  }

  os_disk {
    storage_account_type = "${config.os_disk.storage_account_type}"
    caching              = "${config.os_disk.caching}"
  }

  network_interface {
    name    = "${config.network_interface_name_prefix}" # Terraform añadirá un identificador único
    primary = true

    ip_configuration {
      name      = "${config.network_interface_ip_configuration_name}"
      primary   = true
      subnet_id = "${config.network_interface_subnet_id}"
      # Para IP pública, se necesitaría un bloque public_ip_address o referencia a un Load Balancer
    }
  }

  ${config.upgrade_mode ? `upgrade_mode = "${config.upgrade_mode}"` : ''}
  ${config.health_probe_id ? `health_probe_id = "${config.health_probe_id}"` : ''}
  
  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "linux_vmss_id" {
  value = azurerm_linux_virtual_machine_scale_set.${terraformResourceName}.id
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Azure Linux Virtual Machine Scale Set
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const linuxVmss = new azure.compute.VirtualMachineScaleSet("${pulumiResourceName}", {
    // Nota: azure-native usa VirtualMachineScaleSet para ambos Linux y Windows,
    // la diferenciación se hace en osProfile y storageProfile.
    vmScaleSetName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    sku: {
        name: "${config.sku}",
        tier: "Standard", // Asumido, puede variar
        capacity: ${config.instances},
    },
    overprovision: true, // Común para VMSS
    upgradePolicy: {
        mode: azure.compute.UpgradeMode.${config.upgrade_mode || 'Manual'},
    },
    virtualMachineProfile: {
        osProfile: {
            computerNamePrefix: "${config.name.substring(0, 9)}", // Prefijo para nombres de VM
            adminUsername: "${config.admin_username}",
            linuxConfiguration: {
                disablePasswordAuthentication: true,
                ssh: {
                    publicKeys: [{
                        path: \`/home/${config.admin_username}/.ssh/authorized_keys\`,
                        keyData: "${config.admin_ssh_key_public_key_content || "YOUR_SSH_PUBLIC_KEY_CONTENT_HERE"}",
                    }],
                },
            },
        },
        storageProfile: {
            osDisk: {
                createOption: azure.compute.DiskCreateOptionTypes.FromImage,
                caching: azure.compute.CachingTypes.${config.os_disk.caching},
                managedDisk: {
                    storageAccountType: azure.compute.StorageAccountTypes.${config.os_disk.storage_account_type.replace('_', '')},
                },
            },
            imageReference: {
                publisher: "${config.source_image_reference.publisher}",
                offer: "${config.source_image_reference.offer}",
                sku: "${config.source_image_reference.sku}",
                version: "${config.source_image_reference.version}",
            },
        },
        networkProfile: {
            networkInterfaceConfigurations: [{
                name: "${config.network_interface_name_prefix}",
                primary: true,
                ipConfigurations: [{
                    name: "${config.network_interface_ip_configuration_name}",
                    subnet: {
                        id: "${config.network_interface_subnet_id}",
                    },
                }],
            }],
        },
        ${config.health_probe_id ? `extensionProfile: { extensions: [{ name: "HealthExtension", properties: { autoUpgradeMinorVersion: true, publisher: "Microsoft.ManagedServices", type: "ApplicationHealthAzureMonitor", typeHandlerVersion: "1.0", settings: { protocol: "http", port: 80, requestPath: "/health", intervalInSeconds: 5, numberOfProbes: 1 } } }] },` : ''}
        // El health_probe_id de Terraform se mapea a una extensión de health probe o a una config de LB.
        // Aquí se muestra un ejemplo de extensión, pero puede variar.
    },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const linuxVmssId = linuxVmss.id;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Linux Virtual Machine Scale Set
- name: Gestionar Linux VM Scale Set ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    location: "${config.location}"
    vmss_name: "${config.name}"
    vm_sku: "${config.sku}"
    instances: ${config.instances}
    admin_username: "${config.admin_username}"
    ssh_public_key: "${config.admin_ssh_key_public_key_content || 'YOUR_SSH_PUBLIC_KEY_CONTENT_HERE'}"
    # Para Ansible, la VNet y Subnet deben existir.
    subnet_id: "${config.network_interface_subnet_id}"
    image_publisher: "${config.source_image_reference.publisher}"
    image_offer: "${config.source_image_reference.offer}"
    image_sku: "${config.source_image_reference.sku}"
    image_version: "${config.source_image_reference.version}"
    os_disk_caching: "${config.os_disk.caching}"
    os_disk_storage_type: "${config.os_disk.storage_account_type}"
    upgrade_policy_mode: "${config.upgrade_mode || 'Manual'}"
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Linux VM Scale Set
      azure.azcollection.azure_rm_virtualmachinescaleset:
        resource_group: "{{ resource_group }}"
        name: "{{ vmss_name }}"
        location: "{{ location }}"
        vm_size: "{{ vm_sku }}"
        capacity: "{{ instances }}"
        admin_username: "{{ admin_username }}"
        ssh_public_keys:
          - path: "/home/{{ admin_username }}/.ssh/authorized_keys"
            key_data: "{{ ssh_public_key }}"
        virtual_network_subnet_id: "{{ subnet_id }}"
        image:
          publisher: "{{ image_publisher }}"
          offer: "{{ image_offer }}"
          sku: "{{ image_sku }}"
          version: "{{ image_version }}"
        os_disk_caching: "{{ os_disk_caching }}"
        os_disk_storage_account_type: "{{ os_disk_storage_type }}"
        upgrade_policy_mode: "{{ upgrade_policy_mode }}"
        # health_probe: "{{ health_probe_id }}" # Si se usa un LB externo
        tags: "{{ tags }}"
      register: vmss_info

    - name: Mostrar información del VMSS
      ansible.builtin.debug:
        var: vmss_info
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
