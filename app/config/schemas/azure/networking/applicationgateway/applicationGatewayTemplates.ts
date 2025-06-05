import { AzureApplicationGatewayConfig } from './applicationGateway';
import { CodeTemplate } from '@/app/types/resourceConfig';

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);
};

export function generateAzureApplicationGatewayTemplates(config: AzureApplicationGatewayConfig): CodeTemplate {
  const tfResourceName = (config.name || 'myappgw').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myappgw').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  const terraform = `
# Plantilla Terraform para Azure Application Gateway (Básica)
# NOTA: Esta es una configuración muy básica. Un App Gateway funcional requiere
# backend_address_pool, backend_http_settings, http_listener, request_routing_rule, etc.
# Se asume que la subred y la IP pública (si se usa) ya existen o se crean por separado.

resource "azurerm_resource_group" "${tfResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Se recomienda crear una IP pública dedicada para el App Gateway
resource "azurerm_public_ip" "${tfResourceName}_pip" {
  name                = "${config.name}-pip"
  location            = azurerm_resource_group.${tfResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  allocation_method   = "Static" # O Dynamic para SKU v1
  sku                 = "${config.sku_tier?.includes('v2') ? 'Standard' : 'Basic'}" # AppGW v2 requiere PIP Standard
}

resource "azurerm_application_gateway" "${tfResourceName}" {
  name                = "${config.name}"
  resource_group_name = azurerm_resource_group.${tfResourceName}_rg.name
  location            = azurerm_resource_group.${tfResourceName}_rg.location

  sku {
    name     = "${config.sku_name}"
    tier     = "${config.sku_tier}"
    capacity = ${config.sku_tier?.includes('v2') ? null : (config.sku_capacity || 2)}
  }

  gateway_ip_configuration {
    name      = "${config.gateway_ip_configuration_name}"
    subnet_id = "${config.gateway_ip_configuration_subnet_id}"
  }

  frontend_ip_configuration {
    name                 = "${config.frontend_ip_configuration_name}"
    public_ip_address_id = azurerm_public_ip.${tfResourceName}_pip.id
  }

  frontend_port {
    name = "${config.frontend_port_name}"
    port = ${config.frontend_port_number}
  }

  # --- Configuraciones Mínimas Adicionales Requeridas ---
  # Se deben añadir al menos un backend_address_pool, backend_http_settings,
  # http_listener y request_routing_rule para que el App Gateway sea funcional.

  # Ejemplo (simplificado, ajustar según necesidad):
  backend_address_pool {
    name = "${tfResourceName}-bap"
  }

  backend_http_settings {
    name                  = "${tfResourceName}-bhs"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 20
  }

  http_listener {
    name                           = "${tfResourceName}-hl"
    frontend_ip_configuration_name = "${config.frontend_ip_configuration_name}"
    frontend_port_name             = "${config.frontend_port_name}"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "${tfResourceName}-rrr"
    rule_type                  = "Basic"
    http_listener_name         = "${tfResourceName}-hl"
    backend_address_pool_name  = "${tfResourceName}-bap"
    backend_http_settings_name = "${tfResourceName}-bhs"
  }

  ${Object.keys(parsedTags).length > 0 ? `tags = {
    ${Object.entries(parsedTags).map(([k, v]) => `"${k}" = "${v}"`).join('\n    ')}
  }` : ''}
}
`;

  const pulumi = `
// Plantilla Pulumi (TypeScript) para Azure Application Gateway (Básica)
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const rg = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const publicIp = new azure.network.PublicIPAddress("${pulumiResourceName}Pip", {
    publicIpAddressName: \`\${"${config.name}"}-pip\`,
    resourceGroupName: rg.name,
    location: rg.location,
    publicIPAllocationMethod: azure.network.IPAllocationMethod.Static,
    sku: { name: azure.network.PublicIPAddressSkuName.${config.sku_tier?.includes('v2') ? 'Standard' : 'Basic'} },
});

const appGateway = new azure.network.ApplicationGateway("${pulumiResourceName}", {
    applicationGatewayName: "${config.name}",
    resourceGroupName: rg.name,
    location: rg.location,
    sku: {
        name: azure.network.ApplicationGatewaySkuName.${config.sku_name},
        tier: azure.network.ApplicationGatewayTier.${config.sku_tier},
        capacity: ${config.sku_tier?.includes('v2') ? undefined : (config.sku_capacity || 2)},
    },
    gatewayIPConfigurations: [{
        name: "${config.gateway_ip_configuration_name}",
        subnet: { id: "${config.gateway_ip_configuration_subnet_id}" },
    }],
    frontendIPConfigurations: [{
        name: "${config.frontend_ip_configuration_name}",
        publicIPAddress: { id: publicIp.id },
    }],
    frontendPorts: [{
        name: "${config.frontend_port_name}",
        port: ${config.frontend_port_number},
    }],
    // --- Configuraciones Mínimas Adicionales Requeridas ---
    backendAddressPools: [{ name: \`\${"${pulumiResourceName}"}-bap\` }],
    backendHttpSettingsCollection: [{
        name: \`\${"${pulumiResourceName}"}-bhs\`,
        port: 80,
        protocol: azure.network.ApplicationGatewayProtocol.Http,
        cookieBasedAffinity: azure.network.ApplicationGatewayCookieBasedAffinity.Disabled,
        requestTimeout: 20,
    }],
    httpListeners: [{
        name: \`\${"${pulumiResourceName}"}-hl\`,
        frontendIPConfiguration: { id: pulumi.interpolate\`\${appGateway.id}/frontendIPConfigurations/${config.frontend_ip_configuration_name}\` },
        frontendPort: { id: pulumi.interpolate\`\${appGateway.id}/frontendPorts/${config.frontend_port_name}\` },
        protocol: azure.network.ApplicationGatewayProtocol.Http,
    }],
    requestRoutingRules: [{
        name: \`\${"${pulumiResourceName}"}-rrr\`,
        ruleType: azure.network.ApplicationGatewayRequestRoutingRuleType.Basic,
        httpListener: { id: pulumi.interpolate\`\${appGateway.id}/httpListeners/\${"${pulumiResourceName}"}-hl\` },
        backendAddressPool: { id: pulumi.interpolate\`\${appGateway.id}/backendAddressPools/\${"${pulumiResourceName}"}-bap\` },
        backendHttpSettings: { id: pulumi.interpolate\`\${appGateway.id}/backendHttpSettingsCollection/\${"${pulumiResourceName}"}-bhs\` },
    }],
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `"${k}": "${v}",`).join('\n        ')} },
});

export const appGatewayId = appGateway.id;
`;

  const ansible = `
# Playbook Ansible para Azure Application Gateway (Básico)
- name: Configurar Azure Application Gateway ${config.name}
  hosts: localhost
  connection: local
  gather_facts: false
  vars:
    rg_name: "${config.resource_group_name}"
    app_gw_name: "${config.name}"
    location: "${config.location}"
    sku_name: "${config.sku_name}"
    sku_tier: "${config.sku_tier}"
    sku_capacity: ${config.sku_tier?.includes('v2') ? 'null' : (config.sku_capacity || 2)}
    gateway_ip_config_name: "${config.gateway_ip_configuration_name}"
    subnet_id: "${config.gateway_ip_configuration_subnet_id}"
    frontend_ip_config_name: "${config.frontend_ip_configuration_name}"
    public_ip_name: "{{ app_gw_name }}-pip"
    frontend_port_name: "${config.frontend_port_name}"
    frontend_port_number: ${config.frontend_port_number}
    tags: { ${Object.entries(parsedTags).map(([k, v]) => `${k}: "${v}"`).join(', ')} }
  tasks:
    - name: Crear Resource Group
      azure.azcollection.azure_rm_resourcegroup:
        name: "{{ rg_name }}"
        location: "{{ location }}"

    - name: Crear Public IP para Application Gateway
      azure.azcollection.azure_rm_publicipaddress:
        resource_group: "{{ rg_name }}"
        name: "{{ public_ip_name }}"
        location: "{{ location }}"
        allocation_method: Static
        sku: "{{ 'Standard' if 'v2' in sku_tier else 'Basic' }}"
      register: public_ip_result

    - name: Crear Application Gateway
      azure.azcollection.azure_rm_applicationgateway:
        resource_group: "{{ rg_name }}"
        name: "{{ app_gw_name }}"
        location: "{{ location }}"
        sku:
          name: "{{ sku_name }}"
          tier: "{{ sku_tier }}"
          capacity: "{{ sku_capacity if 'v2' not in sku_tier else omit }}"
        gateway_ip_configurations:
          - name: "{{ gateway_ip_config_name }}"
            subnet:
              id: "{{ subnet_id }}"
        frontend_ip_configurations:
          - name: "{{ frontend_ip_config_name }}"
            public_ip_address:
              id: "{{ public_ip_result.state.id }}"
        frontend_ports:
          - name: "{{ frontend_port_name }}"
            port: "{{ frontend_port_number }}"
        # Se requieren backend_address_pools, backend_http_settings, http_listeners, request_routing_rules
        backend_address_pools:
          - name: "{{ app_gw_name }}-bap"
        backend_http_settings:
          - name: "{{ app_gw_name }}-bhs"
            port: 80
            protocol: Http
            cookie_based_affinity: Disabled
        http_listeners:
          - name: "{{ app_gw_name }}-hl"
            frontend_ip_configuration_name: "{{ frontend_ip_config_name }}"
            frontend_port_name: "{{ frontend_port_name }}"
            protocol: Http
        request_routing_rules:
          - name: "{{ app_gw_name }}-rrr"
            rule_type: Basic
            http_listener_name: "{{ app_gw_name }}-hl"
            backend_address_pool_name: "{{ app_gw_name }}-bap"
            backend_http_settings_name: "{{ app_gw_name }}-bhs"
        tags: "{{ tags }}"
      register: app_gw_info
    - debug: var=app_gw_info
`;

  return { terraform, pulumi, ansible, cloudformation: "# No aplicable para Azure Application Gateway con CloudFormation de forma directa y simple." };
}
