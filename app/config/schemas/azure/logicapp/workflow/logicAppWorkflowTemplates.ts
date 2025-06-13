import { AzureLogicAppWorkflowConfig } from './logicAppWorkflow'; // Asumiremos que este tipo se definirá en logicAppWorkflow.ts
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

// Helper para intentar parsear el JSON de parámetros
const parseParametersJson = (jsonString?: string): string => {
  if (!jsonString) return 'null';
  try {
    // Validar y formatear el JSON para Terraform
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2).replace(/\n/g, '\n  '); // Indentación para Terraform
  } catch (e) {
    // Si no es JSON válido, devolver como string literal, Terraform podría manejarlo o fallar.
    // O mejor, devolver null y que el usuario lo corrija.
    console.warn("Invalid JSON for parameters, returning null for Terraform template:", e);
    return 'null'; 
  }
};

const pulumiParameters = (jsonString?: string): string => {
  if (!jsonString) return '{}';
  try {
    const parsed = JSON.parse(jsonString);
    // Para Pulumi, los parámetros se pasan como un objeto.
    // Ejemplo: { "param1": { value: "val1" }, "param2": { value: "val2" } }
    let pulumiParams = '';
    for (const key in parsed) {
      if (Object.prototype.hasOwnProperty.call(parsed, key)) {
        // Asumimos que el valor ya está en el formato correcto { value: "..." } o es un string simple
        const paramValue = typeof parsed[key] === 'object' && parsed[key].value !== undefined 
          ? JSON.stringify(parsed[key].value) 
          : JSON.stringify(parsed[key]); // Si es un string simple, lo envolvemos
        pulumiParams += `        "${key}": { value: ${paramValue} },\n`;
      }
    }
    return pulumiParams.trimEnd().slice(0, -1); // Quitar última coma y nueva línea
  } catch (e) {
    console.warn("Invalid JSON for parameters, returning empty object for Pulumi template:", e);
    return '{}';
  }
};


export function generateAzureLogicAppWorkflowTemplates(config: AzureLogicAppWorkflowConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mylogicapp').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mylogicapp').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);
  const terraformParameters = parseParametersJson(config.parameters as string | undefined);

  // La definición del workflow es un JSON complejo. Para las plantillas, se suele referenciar un archivo.
  // Aquí, pondremos un placeholder.
  const workflowDefinitionPlaceholder = `{
    "$schema": "${config.workflow_schema || "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#"}",
    "contentVersion": "${config.workflow_version || "1.0.0.0"}",
    "parameters": ${terraformParameters === 'null' ? '{}' : terraformParameters.trim().startsWith('{') ? terraformParameters : '{}'},
    "triggers": {
      "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
          "schema": {}
        }
      }
    },
    "actions": {
      "Response": {
        "runAfter": {},
        "type": "Response",
        "kind": "Http",
        "inputs": {
          "body": "Hello from Logic App!",
          "statusCode": 200
        }
      }
    },
    "outputs": {}
  }`;


  const terraform = `
# Plantilla de Terraform para Azure Logic App Workflow (Consumo)
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "${terraformResourceName}_rg" {
  name     = "${config.resource_group_name}"
  location = "${config.location}"
}

resource "azurerm_logic_app_workflow" "${terraformResourceName}" {
  name                = "${config.name}"
  location            = azurerm_resource_group.${terraformResourceName}_rg.location
  resource_group_name = azurerm_resource_group.${terraformResourceName}_rg.name

  ${config.logic_app_integration_account_id ? `logic_app_integration_account_id = "${config.logic_app_integration_account_id}"`: ''}
  ${config.enabled !== undefined ? `enabled = ${config.enabled}`: ''}
  
  # workflow_schema y workflow_version se usan dentro de la definición.
  # La definición del flujo de trabajo es un JSON complejo.
  # Se recomienda usar jsonencode(file("path/to/definition.json")) o un heredoc.
  workflow_parameters = ${terraformParameters}

  # Ejemplo de definición inline (simplificada):
  # workflow_definition = jsonencode({
  #   "$schema"        = "${config.workflow_schema || "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#"}"
  #   "contentVersion" = "${config.workflow_version || "1.0.0.0"}"
  #   "parameters"     = {} # Referenciar workflow_parameters aquí si es necesario
  #   "triggers"       = { ... }
  #   "actions"        = { ... }
  #   "outputs"        = {}
  # })

  # Para una definición más compleja, usar un archivo:
  # workflow_definition = file("path/to/your/${config.name}-definition.json")

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "logic_app_workflow_id" {
  value = azurerm_logic_app_workflow.${terraformResourceName}.id
}

output "logic_app_workflow_access_endpoint" {
  value = azurerm_logic_app_workflow.${terraformResourceName}.access_endpoint
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para Azure Logic App Workflow (Consumo)
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as fs from "fs";

const resourceGroup = new azure.resources.ResourceGroup("${pulumiResourceName}Rg", {
    resourceGroupName: "${config.resource_group_name}",
    location: "${config.location}",
});

// La definición del workflow es un JSON complejo.
// Se recomienda cargarla desde un archivo.
// const workflowDefinition = JSON.parse(fs.readFileSync("path/to/your/${config.name}-definition.json", "utf-8"));
const workflowDefinition = ${workflowDefinitionPlaceholder.replace(/\n\s*/g, ' ')}; // Placeholder

const logicAppWorkflow = new azure.logic.Workflow("${pulumiResourceName}", {
    workflowName: "${config.name}",
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    ${config.logic_app_integration_account_id ? `integrationAccountId: "${config.logic_app_integration_account_id}",`: ''}
    state: ${config.enabled === false ? azure.logic.WorkflowState.Disabled : azure.logic.WorkflowState.Enabled},
    definition: workflowDefinition,
    parameters: {
${pulumiParameters(config.parameters as string | undefined)}
    },
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const workflowId = logicAppWorkflow.id;
export const workflowAccessEndpoint = logicAppWorkflow.accessEndpoint;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure Logic App Workflow (Consumo)
- name: Gestionar Azure Logic App Workflow ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    resource_group: "${config.resource_group_name}"
    workflow_name: "${config.name}"
    location: "${config.location}"
    # La definición del workflow es un JSON complejo.
    # Se recomienda cargarla desde un archivo usando 'lookup'.
    # workflow_definition: "{{ lookup('file', 'path/to/your/${config.name}-definition.json') | from_json }}"
    workflow_definition_placeholder: ${workflowDefinitionPlaceholder.replace(/\n\s*/g, ' ').replace(/"/g, '\\"')}
    logic_app_integration_account_id: "${config.logic_app_integration_account_id || omit}"
    enabled: ${config.enabled === false ? 'no' : 'yes'}
    parameters: ${config.parameters ? config.parameters.replace(/"/g, '\\"') : '{}'}
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar Logic App Workflow
      azure.azcollection.azure_rm_logicapp:
        resource_group: "{{ resource_group }}"
        name: "{{ workflow_name }}"
        location: "{{ location }}"
        state: "{{ enabled | ternary('Enabled', 'Disabled') }}"
        definition: "{{ workflow_definition_placeholder }}" # Usar workflow_definition para archivo real
        integration_account: "{{ logic_app_integration_account_id if logic_app_integration_account_id else omit }}"
        parameters: "{{ parameters | from_json if parameters else omit }}"
        tags: "{{ tags }}"
      register: logic_app_info

    - name: Mostrar información del Logic App
      ansible.builtin.debug:
        var: logic_app_info
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
