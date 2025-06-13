import { AzureLinuxFunctionAppConfig } from './linuxFunctionApp'; // Asumiremos que este tipo se definirá en linuxFunctionApp.ts
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

export function generateAzureLinuxFunctionAppTemplates(config: AzureLinuxFunctionAppConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myLinuxFuncApp').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myLinuxFuncApp').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);
  const appSettings = parseKeyValueString(config.app_settings as string | undefined);

  // Asegurar que AzureWebJobsStorage y FUNCTIONS_WORKER_RUNTIME están presentes si no los provee el usuario
  if (!appSettings['AzureWebJobsStorage'] && config.storage_account_name) {
    // Esto es un placeholder, se necesitaría la connection string real o managed identity
    appSettings['AzureWebJobsStorage'] = `DefaultEndpointsProtocol=https;AccountName=${config.storage_account_name};AccountKey=YOUR_STORAGE_ACCOUNT_KEY;EndpointSuffix=core.windows.net`;
  }
  if (!appSettings['FUNCTIONS_WORKER_RUNTIME']) {
    if (config.site_config?.application_stack?.node_version) {
      appSettings['FUNCTIONS_WORKER_RUNTIME'] = 'node';
    } else if (config.site_config?.application_stack?.python_version) {
      appSettings['FUNCTIONS_WORKER_RUNTIME'] = 'python';
    } else {
      appSettings['FUNCTIONS_WORKER_RUNTIME'] = 'node'; // Default a node si no se especifica
    }
  }


  const terraform = `
# Plantilla de Terraform para una Azure Linux Function App
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

# Asumimos que la Cuenta de Almacenamiento (azurerm_storage_account) y 
# el App Service Plan (azurerm_service_plan) ya existen.
# Sus nombres/IDs se pasan en la configuración.

resource "azurerm_linux_function_app" "${terraformResourceName}" {
  name                       = "${config.name}"
  resource_group_name        = azurerm_resource_group.${terraformResourceName}_rg.name
  location                   = azurerm_resource_group.${terraformResourceName}_rg.location
  storage_account_name       = "${config.storage_account_name}"
  storage_account_access_key = data.azurerm_storage_account.main.primary_access_key # Se necesita un data source o input
  service_plan_id            = "${config.service_plan_id}"
  https_only                 = ${config.https_only !== undefined ? config.https_only : true}

  site_config {
    application_stack {
      ${config.site_config?.application_stack?.node_version ? `node_version = "${config.site_config.application_stack.node_version}"` : ""}
      ${config.site_config?.application_stack?.python_version ? `python_version = "${config.site_config.application_stack.python_version}"` : ""}
      # Otros stacks como dotnet_version, java_version, etc.
    }
    always_on = ${config.site_config?.always_on !== undefined ? config.site_config.always_on : false} # No aplica a plan Consumo
    http2_enabled = ${config.site_config?.http2_enabled !== undefined ? config.site_config.http2_enabled : true}
  }

  app_settings = {
    ${Object.entries(appSettings).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

# Data source para obtener la clave de la cuenta de almacenamiento (ejemplo)
data "azurerm_storage_account" "main" {
  name                = "${config.storage_account_name}"
  resource_group_name = "${config.resource_group_name}" # Asumir que está en el mismo RG o especificar
}

output "linux_function_app_default_hostname" {
  value = azurerm_linux_function_app.${terraformResourceName}.default_hostname
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Azure Linux Function App
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

// Asumir que el Storage Account y App Service Plan existen y sus IDs/nombres son conocidos
const storageAccountName = "${config.storage_account_name}";
const appServicePlanId = "${config.service_plan_id}";

// Necesitarías obtener la connection string del storage account de forma segura
// Este es un placeholder, en un caso real usarías pulumi.interpolate o config
const storageConnectionString = \`DefaultEndpointsProtocol=https;AccountName=\${storageAccountName};AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net\`;

const linuxFunctionApp = new azure.web.WebApp("${pulumiResourceName}", { // WebApp se usa para Function Apps también
    name: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    serverFarmId: appServicePlanId,
    kind: "functionapp,linux", // Especifica que es una Function App en Linux
    httpsOnly: ${config.https_only !== undefined ? config.https_only : true},
    siteConfig: {
        linuxFxVersion: "${config.site_config?.application_stack?.node_version ? `NODE|${config.site_config.application_stack.node_version}` : (config.site_config?.application_stack?.python_version ? `PYTHON|${config.site_config.application_stack.python_version}` : 'NODE|~18')}",
        alwaysOn: ${config.site_config?.always_on || false}, // No aplica a plan Consumo
        http20Enabled: ${config.site_config?.http2_enabled !== undefined ? config.site_config.http2_enabled : true},
        appSettings: [
            ${Object.entries(appSettings).map(([key, value]) => `{ name: "${key}", value: "${value}" },`).join('\n            ')}
            { name: "AzureWebJobsStorage", value: storageConnectionString }, // Asegurar que está
        ],
    },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const defaultHostname = linuxFunctionApp.defaultHostName;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Linux Function App
- name: Gestionar Linux Function App ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    location: "${config.location}"
    function_app_name: "${config.name}"
    storage_account: "${config.storage_account_name}" # Nombre de la cuenta de almacenamiento
    service_plan: "${config.service_plan_id}" # ID o nombre del plan
    # Determinar el runtime basado en la configuración
    ${(() => {
      if (config.site_config?.application_stack?.node_version) return `runtime: "node"\n    runtime_version: "${config.site_config.application_stack.node_version}"`;
      if (config.site_config?.application_stack?.python_version) return `runtime: "python"\n    runtime_version: "${config.site_config.application_stack.python_version}"`;
      return `runtime: "node"\n    runtime_version: "~18"`; // Default
    })()}
    app_settings:
      ${Object.entries(appSettings).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    # Necesitarías una tarea para obtener la connection string de la storage account
    # o asumirla como una variable de entorno/vault.

    - name: Crear o actualizar Linux Function App
      azure.azcollection.azure_rm_functionapp:
        resource_group: "{{ resource_group }}"
        name: "{{ function_app_name }}"
        location: "{{ location }}"
        storage_account: "{{ storage_account }}"
        app_service_plan: "{{ service_plan }}"
        app_settings: "{{ app_settings }}" # Incluye FUNCTIONS_WORKER_RUNTIME y AzureWebJobsStorage
        linux_fx_version: "{{ runtime + '|' + runtime_version if runtime != 'dotnet' else 'DOTNET|6.0' }}" # Ajustar para otros runtimes
        https_only: ${config.https_only !== undefined ? config.https_only : true}
        tags: "{{ tags }}"
      register: functionapp_info

    - name: Mostrar información de la Function App
      ansible.builtin.debug:
        var: functionapp_info
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
