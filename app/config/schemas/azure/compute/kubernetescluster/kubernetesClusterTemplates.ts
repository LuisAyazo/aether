import { AzureKubernetesClusterConfig } from './kubernetesCluster'; // Asumiremos que este tipo se definirá en kubernetesCluster.ts
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

export function generateAzureKubernetesClusterTemplates(config: AzureKubernetesClusterConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myAksCluster').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myAksCluster').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para un Azure Kubernetes Service (AKS) Cluster
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_kubernetes_cluster" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  dns_prefix          = "${config.dns_prefix}"
  ${config.kubernetes_version ? `kubernetes_version = "${config.kubernetes_version}"` : ""}

  default_node_pool {
    name       = "${config.default_node_pool.name}"
    node_count = ${config.default_node_pool.node_count}
    vm_size    = "${config.default_node_pool.vm_size}"
    ${config.default_node_pool.os_disk_size_gb ? `os_disk_size_gb = ${config.default_node_pool.os_disk_size_gb}`: ""}
    ${config.default_node_pool.vnet_subnet_id ? `vnet_subnet_id = "${config.default_node_pool.vnet_subnet_id}"` : ""}
  }

  ${config.service_principal ? `
  service_principal {
    client_id     = "${config.service_principal.client_id}"
    client_secret = "${config.service_principal.client_secret}"
  }` : `
  identity {
    type = "SystemAssigned"
  }`}
  
  ${config.network_profile ? `
  network_profile {
    network_plugin     = "${config.network_profile.network_plugin || 'azure'}"
    ${config.network_profile.service_cidr ? `service_cidr = "${config.network_profile.service_cidr}"` : ""}
    ${config.network_profile.dns_service_ip ? `dns_service_ip = "${config.network_profile.dns_service_ip}"` : ""}
    ${config.network_profile.docker_bridge_cidr ? `docker_bridge_cidr = "${config.network_profile.docker_bridge_cidr}"` : ""}
  }` : ""}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "aks_cluster_id" {
  value = azurerm_kubernetes_cluster.${terraformResourceName}.id
}

output "kube_config_raw" {
  value     = azurerm_kubernetes_cluster.${terraformResourceName}.kube_config_raw
  sensitive = true
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Azure Kubernetes Service (AKS) Cluster
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as k8s from "@pulumi/kubernetes";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const aksCluster = new azure.containerservice.ManagedCluster("${pulumiResourceName}", {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    resourceName: "${config.name}",
    dnsPrefix: "${config.dns_prefix}",
    ${config.kubernetes_version ? `kubernetesVersion: "${config.kubernetes_version}",` : ""}
    agentPoolProfiles: [{
        name: "${config.default_node_pool.name}",
        count: ${config.default_node_pool.node_count},
        vmSize: "${config.default_node_pool.vm_size}",
        osDiskSizeGB: ${config.default_node_pool.os_disk_size_gb || 128},
        mode: "System", // Default node pool is typically System
        osType: "Linux", // Assuming Linux
        ${config.default_node_pool.vnet_subnet_id ? `vnetSubnetID: "${config.default_node_pool.vnet_subnet_id}",` : ""}
    }],
    ${config.service_principal ? `
    servicePrincipalProfile: {
        clientId: "${config.service_principal.client_id}",
        secret: "${config.service_principal.client_secret}",
    },` : `
    identity: {
        type: azure.containerservice.ResourceIdentityType.SystemAssigned,
    },`}
    ${config.network_profile ? `
    networkProfile: {
        networkPlugin: azure.containerservice.NetworkPlugin.${config.network_profile.network_plugin === 'kubenet' ? 'Kubenet' : 'Azure'},
        ${config.network_profile.service_cidr ? `serviceCidr: "${config.network_profile.service_cidr}",` : ""}
        ${config.network_profile.dns_service_ip ? `dnsServiceIP: "${config.network_profile.dns_service_ip}",` : ""}
        ${config.network_profile.docker_bridge_cidr ? `dockerBridgeCidr: "${config.network_profile.docker_bridge_cidr}",` : ""}
    },` : ""}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

// Export the KubeConfig
export const kubeConfig = pulumi.all([aksCluster.name, resourceGroup.name]).apply(([clusterName, rgName]) => {
    return azure.containerservice.listManagedClusterUserCredentials({
        resourceGroupName: rgName,
        resourceName: clusterName,
    }).then(creds => {
        const encoded = creds.kubeconfigs[0].value;
        if (encoded === undefined) {
            return "";
        }
        return Buffer.from(encoded, "base64").toString();
    });
});
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Kubernetes Service (AKS) Cluster
- name: Gestionar AKS Cluster ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    location: "${config.location}"
    cluster_name: "${config.name}"
    dns_prefix: "${config.dns_prefix}"
    kubernetes_version: "${config.kubernetes_version || '1.27.7'}" # Asegurar un valor
    agent_pool_name: "${config.default_node_pool.name}"
    agent_pool_count: ${config.default_node_pool.node_count}
    agent_pool_vm_size: "${config.default_node_pool.vm_size}"
    # Service Principal o Managed Identity (SystemAssigned es por defecto si no se especifica SP)
    ${config.service_principal ? `
    service_principal_client_id: "${config.service_principal.client_id}"
    service_principal_client_secret: "{{ lookup('env', 'AZURE_CLIENT_SECRET') }}" # Mejor usar env var o vault
    ` : ""}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar AKS Cluster
      azure.azcollection.azure_rm_aks:
        name: "{{ cluster_name }}"
        resource_group: "{{ resource_group }}"
        location: "{{ location }}"
        dns_prefix: "{{ dns_prefix }}"
        kubernetes_version: "{{ kubernetes_version }}"
        agent_pool_profiles:
          - name: "{{ agent_pool_name }}"
            count: "{{ agent_pool_count }}"
            vm_size: "{{ agent_pool_vm_size }}"
            # os_type: Linux # Por defecto
        ${config.service_principal ? `
        service_principal:
          client_id: "{{ service_principal_client_id }}"
          client_secret: "{{ service_principal_client_secret }}"
        ` : `
        identity_type: SystemAssigned
        `}
        tags: "{{ tags }}"
      register: aks_info

    - name: Mostrar información del AKS Cluster
      ansible.builtin.debug:
        var: aks_info
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
