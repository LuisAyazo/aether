import { AzureNetworkSecurityGroupConfig } from './networkSecurityGroup';
import { CodeTemplate } from "../../../../../types/resourceConfig";

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);
};

export function generateAzureNetworkSecurityGroupTemplates(config: AzureNetworkSecurityGroupConfig): CodeTemplate {
  const tfResourceName = (config.name || 'mynsg').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mynsg').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
resource "azurerm_resource_group" "${tfResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}
resource "azurerm_network_security_group" "${tfResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${tfResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  ${Object.keys(parsedTags).length > 0 ? `tags = {
    ${Object.entries(parsedTags).map(([k, v]) => `"${k}" = "${v}"`).join('\n    ')}
  }` : ''}
  # Agrega reglas de seguridad aquí o como recursos 'azurerm_network_security_rule' separados
}`;

  const pulumi = `
import * as azure from "@pulumi/azure-native";
const rg = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
  resourceGroupName: "${config.resource_group_name}",
  location: "${config.location}",
});
const nsg = new azure.network.NetworkSecurityGroup("${pulumiResourceName}", {
  networkSecurityGroupName: "${config.name}",
  resourceGroupName: rg.name,
  location: rg.location,
  tags: { ${Object.entries(parsedTags).map(([k, v]) => `"${k}": "${v}",`).join('\n        ')} },
  // Agrega securityRules aquí
});
export const nsgId = nsg.id;`;

  const ansible = `
- name: Crear NSG ${config.name}
  hosts: localhost
  connection: local
  vars:
    rg: "${config.resource_group_name}"
    nsg_name: "${config.name}"
    loc: "${config.location}"
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `${k}: "${v}"`).join(', ')} }
  tasks:
    - azure.azcollection.azure_rm_networksecuritygroup:
        resource_group: "{{ rg }}"
        name: "{{ nsg_name }}"
        location: "{{ loc }}"
        tags: "{{ tags }}"
        # rules: [] # Agrega reglas aquí
      register: nsg_info
    - debug: var=nsg_info`;

  return { terraform, pulumi, ansible, cloudformation: "# No aplicable" };
}
