import { AzureContainerGroupConfig } from './containerGroup'; // Asumiremos que este tipo se definirá en containerGroup.ts
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

export function generateAzureContainerGroupTemplates(config: AzureContainerGroupConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myContainerGroup').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myContainerGroup').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  // Simplificamos para un solo contenedor, como se definió en los fields.
  const mainContainer = config.container;

  const terraform = `
# Plantilla de Terraform para un Azure Container Group
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_container_group" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  ip_address_type     = "${config.ip_address_type || 'Public'}"
  dns_name_label      = ${config.ip_address_type === 'Public' && config.dns_name_label ? `"${config.dns_name_label}"` : "null"}
  os_type             = "${config.os_type}"
  restart_policy      = "${config.restart_policy || 'Always'}"

  container {
    name   = "${mainContainer.name}"
    image  = "${mainContainer.image}"
    cpu    = ${mainContainer.cpu}
    memory = ${mainContainer.memory}
    
    ${mainContainer.ports_port ? `
    ports {
      port     = ${mainContainer.ports_port}
      protocol = "${mainContainer.ports_protocol || 'TCP'}"
    }` : ""}
  }

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "container_group_id" {
  value = azurerm_container_group.${terraformResourceName}.id
}
${config.ip_address_type === 'Public' ? `
output "container_group_fqdn" {
  value = azurerm_container_group.${terraformResourceName}.fqdn
}
output "container_group_ip_address" {
  value = azurerm_container_group.${terraformResourceName}.ip_address
}` : ""}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Azure Container Group
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const containerGroup = new azure.containerinstance.ContainerGroup("${pulumiResourceName}", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    containerGroupName: "${config.name}",
    osType: azure.containerinstance.OperatingSystemTypes.${config.os_type},
    restartPolicy: azure.containerinstance.ContainerGroupRestartPolicy.${config.restart_policy || 'Always'},
    ipAddress: {
        type: azure.containerinstance.ContainerGroupIpAddressType.${config.ip_address_type || 'Public'},
        ${config.ip_address_type === 'Public' && config.dns_name_label ? `dnsNameLabel: "${config.dns_name_label}",` : ""}
        ${mainContainer.ports_port ? `ports: [{ port: ${mainContainer.ports_port}, protocol: azure.containerinstance.ContainerNetworkProtocol.${mainContainer.ports_protocol || 'TCP'} }],` : ""}
    },
    containers: [{
        name: "${mainContainer.name}",
        image: "${mainContainer.image}",
        resources: {
            requests: {
                cpu: ${mainContainer.cpu},
                memoryInGB: ${mainContainer.memory},
            },
        },
        ${mainContainer.ports_port ? `ports: [{ port: ${mainContainer.ports_port}, protocol: azure.containerinstance.ContainerNetworkProtocol.${mainContainer.ports_protocol || 'TCP'} }],` : ""}
    }],
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const containerGroupId = containerGroup.id;
${config.ip_address_type === 'Public' ? `export const containerGroupFqdn = containerGroup.fqdn;
export const containerGroupIpAddress = containerGroup.ipAddress.apply(ip => ip?.ip);` : ""}
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Container Group
- name: Gestionar Azure Container Group ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    location: "${config.location}"
    container_group_name: "${config.name}"
    os_type: "${config.os_type}"
    restart_policy: "${config.restart_policy || 'Always'}"
    ip_address_type: "${config.ip_address_type || 'Public'}"
    dns_name_label: "${config.dns_name_label || ''}" # Solo si ip_address_type es Public
    containers:
      - name: "${mainContainer.name}"
        image: "${mainContainer.image}"
        resources:
          requests:
            cpu: ${mainContainer.cpu}
            memory_in_gb: ${mainContainer.memory}
        ${mainContainer.ports_port ? `
        ports:
          - port: ${mainContainer.ports_port}
            protocol: "${mainContainer.ports_protocol || 'TCP'}"
        ` : ""}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Azure Container Group
      azure.azcollection.azure_rm_containerinstance:
        resource_group: "{{ resource_group }}"
        name: "{{ container_group_name }}"
        location: "{{ location }}"
        os_type: "{{ os_type }}"
        restart_policy: "{{ restart_policy }}"
        ip_address_type: "{{ ip_address_type }}"
        dns_name_label: "{{ dns_name_label if ip_address_type == 'Public' else omit }}"
        containers: "{{ containers }}"
        tags: "{{ tags }}"
      register: aci_info

    - name: Mostrar información del Container Group
      ansible.builtin.debug:
        var: aci_info
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
