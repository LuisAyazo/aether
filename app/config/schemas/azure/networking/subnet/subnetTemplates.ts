import { AzureSubnetConfig } from './subnet'; // Asumiremos que este tipo se definirá en subnet.ts
import { CodeTemplate } from "../../../../../types/resourceConfig";

const formatListForTerraform = (inputString?: string): string => {
  if (!inputString) return '[]';
  return JSON.stringify(inputString.split(',').map(s => s.trim()));
};

export function generateAzureSubnetTemplates(config: AzureSubnetConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mysubnet').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mysubnet').replace(/-/g, '');
  const serviceEndpointsList = config.service_endpoints ? config.service_endpoints.split(',').map(s => s.trim()) : [];

  const terraform = `
# Plantilla de Terraform para Azure Subnet
# Nota: Este recurso depende de una Virtual Network existente.
# Asegúrate de que la VNet "${config.virtual_network_name}" en el grupo de recursos "${config.resource_group_name}" exista.

resource "azurerm_subnet" "${terraformResourceName}" {
  name                 = "${config.name}"
  resource_group_name  = "${config.resource_group_name}" # RG de la VNet
  virtual_network_name = "${config.virtual_network_name}"
  address_prefixes     = ["${config.address_prefixes}"] # Debe ser una lista

  ${serviceEndpointsList.length > 0 ? `service_endpoints = ${formatListForTerraform(config.service_endpoints)}`: ''}
  
  ${config.private_endpoint_network_policies_enabled !== undefined ? `private_endpoint_network_policies_enabled = ${config.private_endpoint_network_policies_enabled}`: ''}
  ${config.private_link_service_network_policies_enabled !== undefined ? `private_link_service_network_policies_enabled = ${config.private_link_service_network_policies_enabled}`: ''}
}

output "subnet_id" {
  value = azurerm_subnet.${terraformResourceName}.id
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Subnet
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

// Asume que la VNet y el RG ya existen o se crean en otra parte del código Pulumi.
// Necesitarías obtener referencias a ellos. Ejemplo:
// const resourceGroup = azure.resources.getResourceGroup({ name: "${config.resource_group_name}" });
// const virtualNetwork = azure.network.getVirtualNetwork({ name: "${config.virtual_network_name}", resourceGroupName: resourceGroup.name });

const subnet = new azure.network.Subnet("${pulumiResourceName}", {
    subnetName: "${config.name}",
    resourceGroupName: "${config.resource_group_name}", // O resourceGroup.name
    virtualNetworkName: "${config.virtual_network_name}", // O virtualNetwork.name
    addressPrefix: "${config.address_prefixes}", // Pulumi usa addressPrefix para un solo CIDR
    // Para múltiples prefijos, usar addressPrefixes: ["...", "..."]
    serviceEndpoints: [
        ${serviceEndpointsList.map(se => `{ service: "${se}" }`).join(',\n        ')}
    ],
    privateEndpointNetworkPolicies: "${config.private_endpoint_network_policies_enabled === false ? 'Disabled' : 'Enabled'}",
    privateLinkServiceNetworkPolicies: "${config.private_link_service_network_policies_enabled === false ? 'Disabled' : 'Enabled'}",
});

export const subnetId = subnet.id;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Subnet
- name: Gestionar Azure Subnet ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    vnet_name: "${config.virtual_network_name}"
    subnet_name: "${config.name}"
    address_prefix_cidr: "${config.address_prefixes}"
    service_endpoints:
      ${serviceEndpointsList.map(se => `- service: ${se}`).join('\n      ')}
    # private_endpoint_network_policies: "{{ ${config.private_endpoint_network_policies_enabled === false ? 'false' : 'true'} }}" # El módulo puede usar 'enabled'/'disabled'
    # private_link_service_network_policies: "{{ ${config.private_link_service_network_policies_enabled === false ? 'false' : 'true'} }}"

  tasks:
    - name: Crear o actualizar Subnet
      azure.azcollection.azure_rm_subnet:
        resource_group: "{{ resource_group }}"
        virtual_network_name: "{{ vnet_name }}"
        name: "{{ subnet_name }}"
        address_prefix_cidr: "{{ address_prefix_cidr }}"
        service_endpoints: "{{ service_endpoints if service_endpoints | length > 0 else omit }}"
        # private_endpoint_network_policies: "{{ private_endpoint_network_policies }}"
        # private_link_service_network_policies: "{{ private_link_service_network_policies }}"
      register: subnet_info

    - name: Mostrar información de la Subnet
      ansible.builtin.debug:
        var: subnet_info
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
