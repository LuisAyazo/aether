import { z } from 'zod';
import { azureLogicAppWorkflowFields } from './logicAppWorkflowFields';
import { generateAzureLogicAppWorkflowTemplates } from './logicAppWorkflowTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from "../../../../../types/resourceConfig";

// Helper para validar JSON
const jsonString = z.string().refine((data) => {
  try {
    JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}, { message: "Debe ser un string JSON válido." });

export const AzureLogicAppWorkflowSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(80),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  logic_app_integration_account_id: z.string().optional(),
  workflow_schema: z.string().url("Debe ser una URL válida para el esquema.").optional(),
  workflow_version: z.string().optional(),
  parameters: jsonString.optional().describe("Parámetros en formato JSON."),
  enabled: z.boolean().optional().default(true),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
  // La definición del workflow (workflow_definition o definition_content) es un JSON complejo.
  // No se incluye directamente en el schema de Zod para el formulario simple,
  // pero se usa en las plantillas (generalmente desde un archivo).
});

export type AzureLogicAppWorkflowConfig = z.infer<typeof AzureLogicAppWorkflowSchema>;

export function generateDefaultAzureLogicAppWorkflowConfig(): AzureLogicAppWorkflowConfig {
  return {
    name: 'mylogicapp',
    resource_group_name: 'my-logicapp-resources',
    location: 'East US',
    enabled: true,
    workflow_schema: 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
    workflow_version: '1.0.0.0',
    parameters: JSON.stringify({
      "$connections": {
        "value": {}
      }
    }, null, 2),
  };
}

export function generateAzureLogicAppWorkflowResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_logic_app_workflow',
    displayName: 'Azure Logic App Workflow',
    description: 'Crea un flujo de trabajo de Azure Logic Apps (Consumo).',
    category: 'Aplicación', 
    fields: azureLogicAppWorkflowFields,
    templates: {
      default: generateDefaultAzureLogicAppWorkflowConfig() as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_logic_app_workflow de Terraform permite gestionar un flujo de trabajo de Azure Logic Apps (Consumo).",
      examples: [
        `
resource "azurerm_logic_app_workflow" "example" {
  name                = "workflow1"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name

  # La definición del workflow es un JSON complejo.
  # Se recomienda usar jsonencode(file("definition.json"))
  # workflow_definition = file("path/to/definition.json")

  tags = {
    environment = "production"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureLogicAppWorkflowName(config: AzureLogicAppWorkflowConfig): string {
  return config.name || `azure-logicapp-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureLogicAppWorkflowGeneratedCode {
  name: string;
  description: string;
  config: AzureLogicAppWorkflowConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureLogicAppWorkflowCode(config: AzureLogicAppWorkflowConfig): AzureLogicAppWorkflowGeneratedCode {
  const parsedConfig = AzureLogicAppWorkflowSchema.parse(config);
  return {
    name: generateAzureLogicAppWorkflowName(parsedConfig),
    description: `Azure Logic App Workflow: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureLogicAppWorkflowTemplates(parsedConfig),
  };
}

const azureLogicAppWorkflowResource = {
  type: 'azurerm_logic_app_workflow',
  name: 'Azure Logic App Workflow',
  schema: () => AzureLogicAppWorkflowSchema,
  defaults: generateDefaultAzureLogicAppWorkflowConfig,
  fields: () => azureLogicAppWorkflowFields,
  templates: (config: AzureLogicAppWorkflowConfig) => generateAzureLogicAppWorkflowTemplates(config),

  originalSchema: AzureLogicAppWorkflowSchema,
  originalGenerateDefaultConfig: generateDefaultAzureLogicAppWorkflowConfig,
  originalGenerateResourceSchema: generateAzureLogicAppWorkflowResourceSchema,
  originalGenerateResourceName: generateAzureLogicAppWorkflowName,
  originalGenerateTemplates: generateAzureLogicAppWorkflowCode,
};

export default azureLogicAppWorkflowResource;
