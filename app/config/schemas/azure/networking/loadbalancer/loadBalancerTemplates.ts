import { AzureLoadBalancerConfig } from './loadBalancer'; // Asumiremos que este tipo se definirá en loadBalancer.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);
};

export function generateAzureLoadBalancerTemplates(config: AzureLoadBalancerConfig): CodeTemplate {
  const tfResourceName = (config.name || 'myazurelb').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myazurelb').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para Azure Load Balancer
# Nota: Un LB funcional requiere backend pools, health probes, y reglas de LB.
# Esta plantilla básica solo crea el LB y una configuración IP frontend.
# Se asume que existe un Public IP Address si se proporciona public_ip_address_id.

resource "azurerm_resource_group" "${tfResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_public_ip" "${tfResourceName}_pip" {
  # Solo se crea si no se proporciona un public_ip_address_id
  count               = ${config.public_ip_address_id ? 0 : 1}
  name                = "${config.name}-pip"
  location            = azurerm_resource_group.${tfResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  allocation_method   = "Static" # O "Dynamic" para Basic SKU
  sku                 = "${config.sku}"    # Standard o Basic
  ${config.sku == "Standard" ? 'sku_tier            = "Regional"' : ''} # O Global
}

resource "azurerm_lb" "${tfResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${tfResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  sku                 = "${config.sku}"
  ${config.sku == "Standard" && config.sku_tier ? `sku_tier            = "${config.sku_tier}"` : ''}

  frontend_ip_configuration {
    name                 = "${config.frontend_ip_configuration_name}"
    public_ip_address_id = ${config.public_ip_address_id ? `"${config.public_ip_address_id}"` : `azurerm_public_ip.${tfResourceName}_pip[0].id`}
  }

  ${Object.keys(parsedTags).length > 0 ? `tags = {
    ${Object.entries(parsedTags).map(([k, v]) => `"${k}" = "${v}"`).join('\n    ')}
  }` : ''}
}

# Ejemplo de Backend Address Pool (requiere VMs o NICs para asociar)
# resource "azurerm_lb_backend_address_pool" "${tfResourceName}_bap" {
#   loadbalancer_id = azurerm_lb.${tfResourceName}.id
#   name            = "myBackendPool"
# }

# Ejemplo de Health Probe
# resource "azurerm_lb_probe" "${tfResourceName}_probe" {
#   loadbalancer_id = azurerm_lb.${tfResourceName}.id
#   name            = "http-probe"
#   port            = 80
#   protocol        = "Http"
#   request_path    = "/health"
# }

# Ejemplo de Load Balancing Rule
# resource "azurerm_lb_rule" "${tfResourceName}_rule" {
#   loadbalancer_id                = azurerm_lb.${tfResourceName}.id
#   name                           = "http-rule"
#   protocol                       = "Tcp"
#   frontend_port                  = 80
#   backend_port                   = 80
#   frontend_ip_configuration_name = "${config.frontend_ip_configuration_name}"
#   backend_address_pool_ids       = [azurerm_lb_backend_address_pool.${tfResourceName}_bap.id]
#   probe_id                       = azurerm_lb_probe.${tfResourceName}_probe.id
# }

output "load_balancer_id" {
  value = azurerm_lb.${tfResourceName}.id
}
output "load_balancer_frontend_ip" {
  value = azurerm_lb.${tfResourceName}.frontend_ip_configuration[0].public_ip_address_id != null ? azurerm_public_ip.${tfResourceName}_pip[0].ip_address : "N/A (Internal or no PIP created)"
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Load Balancer
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const rg = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

let publicIp: azure.network.PublicIPAddress | undefined;
if (!"${config.public_ip_address_id}") {
    publicIp = new azure.network.PublicIPAddress("${pulumiResourceName}Pip", {
        publicIpAddressName: "${config.name}-pip",
        resourceGroupName: rg.name,
        location: rg.location,
        publicIPAllocationMethod: azure.network.IPAllocationMethod.Static,
        sku: { name: azure.network.PublicIPAddressSkuName.${config.sku} }, // Standard or Basic
    });
}

const lb = new azure.network.LoadBalancer("${pulumiResourceName}", {
    loadBalancerName: "${config.name}",
    resourceGroupName: rg.name,
    location: rg.location,
    sku: {
        name: azure.network.LoadBalancerSkuName.${config.sku}, // Standard or Basic
        ${config.sku === "Standard" && config.sku_tier ? `tier: azure.network.LoadBalancerSkuTier.${config.sku_tier},` : ''} // Regional or Global
    },
    frontendIPConfigurations: [{
        name: "${config.frontend_ip_configuration_name}",
        publicIPAddress: {
            id: ${config.public_ip_address_id ? `"${config.public_ip_address_id}"` : 'publicIp!.id'},
        },
    }],
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `"${k}": "${v}",`).join('\n        ')} },
    // Agrega backendAddressPools, probes, loadBalancingRules aquí
});

export const lbId = lb.id;
export const lbFrontendIp = publicIp ? publicIp.ipAddress : "N/A (Using existing PIP or internal)";
`;

  const ansible = `
# Playbook Ansible para Azure Load Balancer
- name: Gestionar Azure Load Balancer ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False
  vars:
    rg: "${config.resource_group_name}"
    lb_name: "${config.name}"
    loc: "${config.location}"
    sku: "${config.sku}"
    sku_tier: "${config.sku_tier || 'Regional'}" # Default a Regional si no se especifica para Standard
    frontend_ip_config_name: "${config.frontend_ip_configuration_name}"
    public_ip_name: "${config.name}-pip" # Nombre para la IP pública si se crea nueva
    public_ip_id: "${config.public_ip_address_id || omit}"
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `${k}: "${v}"`).join(', ')} }
  tasks:
    - name: Crear Public IP si no se proporciona ID
      azure.azcollection.azure_rm_publicipaddress:
        resource_group: "{{ rg }}"
        name: "{{ public_ip_name }}"
        location: "{{ loc }}"
        allocation_method: Static
        sku: "{{ sku }}"
      when: public_ip_id is not defined or public_ip_id == ""
      register: pip_result

    - name: Crear Load Balancer
      azure.azcollection.azure_rm_loadbalancer:
        resource_group: "{{ rg }}"
        name: "{{ lb_name }}"
        location: "{{ loc }}"
        sku: "{{ sku }}"
        sku_tier: "{{ sku_tier if sku == 'Standard' else omit }}"
        frontend_ip_configurations:
          - name: "{{ frontend_ip_config_name }}"
            public_ip_address: "{{ public_ip_id if public_ip_id else pip_result.state.id }}"
        tags: "{{ tags }}"
        # backend_address_pools, probes, load_balancing_rules se configuran por separado
      register: lb_info
    - debug: var=lb_info`;

  return { terraform, pulumi, ansible, cloudformation: "# No aplicable" };
}
