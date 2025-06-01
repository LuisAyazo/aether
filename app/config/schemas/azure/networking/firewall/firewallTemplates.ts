import { AzureFirewallConfig } from './firewall'; // Asumiremos que este tipo se definirá en firewall.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);
};

export function generateAzureFirewallTemplates(config: AzureFirewallConfig): CodeTemplate {
  const tfResourceName = (config.name || 'myazurefirewall').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myazurefirewall').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Firewall (Básica)
# NOTA: Esta es una configuración muy básica. Un Firewall funcional requiere una VNet con una subred
# llamada 'AzureFirewallSubnet' y una IP Pública.
# Si no se usa una Firewall Policy, se deben definir application_rule_collection, nat_rule_collection, y network_rule_collection.

resource "azurerm_resource_group" "${tfResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Se requiere una IP Pública para el Firewall
resource "azurerm_public_ip" "${tfResourceName}_pip" {
  name                = "${config.name}-pip"
  location            = azurerm_resource_group.${tfResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  allocation_method   = "Static"
  sku                 = "Standard" # Azure Firewall requiere SKU Standard para la IP pública
}

resource "azurerm_firewall" "${tfResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${tfResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  sku_name            = "${config.sku_name}" # AZFW_VNet o AZFW_Hub
  sku_tier            = "${config.sku_tier}" # Standard o Premium

  ip_configuration {
    name                 = "${config.ip_configuration_name}"
    subnet_id            = "${config.ip_configuration_subnet_id}" # Debe ser una subred llamada AzureFirewallSubnet
    public_ip_address_id = ${config.public_ip_address_id ? `"${config.public_ip_address_id}"` : `azurerm_public_ip.${tfResourceName}_pip.id`}
  }

  ${config.firewall_policy_id ? `firewall_policy_id = "${config.firewall_policy_id}"` : ""}

  # Si no se usa firewall_policy_id, se pueden definir colecciones de reglas aquí:
  # application_rule_collection { ... }
  # nat_rule_collection { ... }
  # network_rule_collection { ... }

  ${Object.keys(parsedTags).length > 0 ? `tags = {
    ${Object.entries(parsedTags).map(([k, v]) => `"${k}" = "${v}"`).join('\n    ')}
  }` : ''}
}
`;

  const pulumi = `
// Plantilla Pulumi (TypeScript) para Azure Firewall (Básica)
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const rg = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

let publicIp: azure.network.PublicIPAddress;
if ("${config.public_ip_address_id}") {
    // Usar IP pública existente (requiere obtenerla o pasar el objeto completo)
    // Esta es una simplificación, en un caso real se obtendría el recurso.
    publicIp = azure.network.PublicIPAddress.get("${pulumiResourceName}ExistingPip", "${config.public_ip_address_id}");
} else {
    publicIp = new azure.network.PublicIPAddress("${pulumiResourceName}Pip", {
        publicIpAddressName: \`\${"${config.name}"}-pip\`,
        resourceGroupName: rg.name,
        location: rg.location,
        publicIPAllocationMethod: azure.network.IPAllocationMethod.Static,
        sku: { name: azure.network.PublicIPAddressSkuName.Standard },
    });
}

const firewall = new azure.network.AzureFirewall("${pulumiResourceName}", {
    azureFirewallName: "${config.name}",
    resourceGroupName: rg.name,
    location: rg.location,
    sku: {
        name: azure.network.AzureFirewallSkuName.${config.sku_name}, // AZFW_VNet o AZFW_Hub
        tier: azure.network.AzureFirewallSkuTier.${config.sku_tier}, // Standard o Premium
    },
    ipConfigurations: [{
        name: "${config.ip_configuration_name}",
        subnet: { id: "${config.ip_configuration_subnet_id}" }, // Debe ser AzureFirewallSubnet
        publicIPAddress: { id: publicIp.id },
    }],
    firewallPolicy: ${config.firewall_policy_id ? `{ id: "${config.firewall_policy_id}" }` : "undefined"},
    // applicationRuleCollections, natRuleCollections, networkRuleCollections
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `"${k}": "${v}",`).join('\n        ')} },
});

export const firewallId = firewall.id;
`;

  const ansible = `
# Playbook Ansible para Azure Firewall (Básico)
- name: Configurar Azure Firewall ${config.name}
  hosts: localhost
  connection: local
  gather_facts: false
  vars:
    rg_name: "${config.resource_group_name}"
    firewall_name: "${config.name}"
    location: "${config.location}"
    sku_name: "${config.sku_name}"
    sku_tier: "${config.sku_tier}"
    ip_config_name: "${config.ip_configuration_name}"
    subnet_id: "${config.ip_configuration_subnet_id}" # Debe ser AzureFirewallSubnet
    public_ip_name: "{{ firewall_name }}-pip"
    public_ip_id: "${config.public_ip_address_id || omit}"
    firewall_policy_id: "${config.firewall_policy_id || omit}"
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `${k}: "${v}"`).join(', ')} }
  tasks:
    - name: Crear Resource Group
      azure.azcollection.azure_rm_resourcegroup:
        name: "{{ rg_name }}"
        location: "{{ location }}"

    - name: Crear Public IP para Firewall si no se proporciona ID
      azure.azcollection.azure_rm_publicipaddress:
        resource_group: "{{ rg_name }}"
        name: "{{ public_ip_name }}"
        location: "{{ location }}"
        allocation_method: Static
        sku: Standard
      when: public_ip_id is not defined or public_ip_id == ""
      register: pip_firewall_result

    - name: Crear Azure Firewall
      azure.azcollection.azure_rm_firewall:
        resource_group: "{{ rg_name }}"
        name: "{{ firewall_name }}"
        location: "{{ location }}"
        sku_name: "{{ sku_name }}"
        sku_tier: "{{ sku_tier }}"
        firewall_policy: "{{ firewall_policy_id if firewall_policy_id else omit }}"
        ip_configurations:
          - name: "{{ ip_config_name }}"
            subnet:
              id: "{{ subnet_id }}"
            public_ip_address:
              id: "{{ public_ip_id if public_ip_id else pip_firewall_result.state.id }}"
        # application_rule_collections, nat_rule_collections, network_rule_collections
        tags: "{{ tags }}"
      register: firewall_info
    - debug: var=firewall_info
`;

  return { terraform, pulumi, ansible, cloudformation: "# No aplicable para Azure Firewall con CloudFormation de forma directa y simple." };
}
