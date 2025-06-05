import { AzureLinuxWebAppConfig } from './linuxWebApp'; // Asumiremos que este tipo se definirá en linuxWebApp.ts
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

export function generateAzureLinuxWebAppTemplates(config: AzureLinuxWebAppConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myLinuxApp').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myLinuxApp').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);
  const appSettings = parseKeyValueString(config.app_settings as string | undefined);

  const terraform = `
# Plantilla de Terraform para un Azure Linux Web App
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Asumimos que el App Service Plan (azurerm_service_plan) ya existe.
# Su ID se pasa en config.service_plan_id.

resource "azurerm_linux_web_app" "${terraformResourceName}" {
  name                = "${config.name}"
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  service_plan_id     = "${config.service_plan_id}"
  https_only          = ${config.https_only !== undefined ? config.https_only : true}

  site_config {
    ${config.site_config?.linux_fx_version ? `linux_fx_version = "${config.site_config.linux_fx_version}"` : ''}
    ${config.site_config?.always_on !== undefined ? `always_on = ${config.site_config.always_on}`: ''}
    ${config.site_config?.http2_enabled !== undefined ? `http2_enabled = ${config.site_config.http2_enabled}`: ''}
    ${config.site_config?.ftps_state ? `ftps_state = "${config.site_config.ftps_state}"`: ''}
    # Puedes añadir más configuraciones de site_config aquí
  }

  ${Object.keys(appSettings).length > 0 ? 
    `app_settings = {
    ${Object.entries(appSettings).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "linux_web_app_default_hostname" {
  value = azurerm_linux_web_app.${terraformResourceName}.default_hostname
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Azure Linux Web App
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

const appServicePlanId = "${config.service_plan_id}"; // ID del App Service Plan existente

const linuxWebApp = new azure.web.WebApp("${pulumiResourceName}", {
    name: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    serverFarmId: appServicePlanId,
    httpsOnly: ${config.https_only !== undefined ? config.https_only : true},
    siteConfig: {
        linuxFxVersion: "${config.site_config?.linux_fx_version || 'NODE|18-lts'}", // Default si no se especifica
        alwaysOn: ${config.site_config?.always_on || false},
        http2Enabled: ${config.site_config?.http2_enabled || false},
        ftpsState: azure.web.FtpsState.${config.site_config?.ftps_state || 'FtpsOnly'},
        // appSettings se configuran por separado o dentro de siteConfig
    },
    // appSettings se pueden configurar aquí también si es necesario
    // clientAffinityEnabled: false, // Ejemplo de otra propiedad
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

// Configurar App Settings por separado si es más complejo
const appSettings = new azure.web.WebAppApplicationSettings("${pulumiResourceName}AppSettings", {
    name: linuxWebApp.name,
    resourceGroupName: resourceGroup.name,
    properties: {
        ${Object.entries(appSettings).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const defaultHostname = linuxWebApp.defaultHostName;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Linux Web App
- name: Gestionar Linux Web App ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    location: "${config.location}"
    app_name: "${config.name}"
    service_plan_id: "${config.service_plan_id}" # Debe ser el ID completo del plan
    linux_fx_version: "${config.site_config?.linux_fx_version || 'NODE|18-lts'}"
    app_settings:
      ${Object.entries(appSettings).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Linux Web App
      azure.azcollection.azure_rm_webapp:
        resource_group: "{{ resource_group }}"
        name: "{{ app_name }}"
        location: "{{ location }}" # A veces no es necesario si se infiere del plan
        service_plan: "{{ service_plan_id }}" # Puede ser el nombre o ID del plan
        frameworks: # O usar app_settings para configurar el runtime
          - name: "{{ linux_fx_version.split('|')[0] | lower }}" # ej. node
            version: "{{ linux_fx_version.split('|')[1] }}" # ej. 18-lts
        app_settings: "{{ app_settings }}"
        https_only: ${config.https_only !== undefined ? config.https_only : true}
        tags: "{{ tags }}"
      register: webapp_info

    - name: Mostrar información de la Web App
      ansible.builtin.debug:
        var: webapp_info
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
