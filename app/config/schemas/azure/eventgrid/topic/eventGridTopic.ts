import { z } from 'zod';
import { azureEventGridTopicFields } from './eventGridTopicFields';
import { generateAzureEventGridTopicTemplates } from './eventGridTopicTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

export const AzureEventGridTopicSchema = z.object({
  name: z.string().min(3, "El nombre debe tener entre 3 y 50 caracteres.").max(50).regex(/^[a-zA-Z0-9-]+$/, "Nombre inválido para Event Grid Topic."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  input_schema: z.enum(['EventGridSchema', 'CustomEventSchema', 'CloudEventSchemaV1_0']).optional().default('EventGridSchema'),
  public_network_access_enabled: z.boolean().optional().default(true),
  local_auth_enabled: z.boolean().optional().default(true),
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
});

export type AzureEventGridTopicConfig = z.infer<typeof AzureEventGridTopicSchema>;

export function generateDefaultAzureEventGridTopicConfig(): AzureEventGridTopicConfig {
  return {
    name: 'myeventgridtopic',
    resource_group_name: 'my-eventgrid-resources',
    location: 'East US',
    input_schema: 'EventGridSchema',
    public_network_access_enabled: true,
    local_auth_enabled: true,
  };
}

export function generateAzureEventGridTopicResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_eventgrid_topic',
    displayName: 'Azure Event Grid Topic',
    description: 'Crea un tema de Azure Event Grid.',
    category: 'Aplicación', 
    fields: azureEventGridTopicFields,
    templates: {
      default: generateDefaultAzureEventGridTopicConfig() as unknown as ResourceTemplate,
      cloud_event_schema: {
        ...generateDefaultAzureEventGridTopicConfig(),
        name: 'mycloudeventtopic',
        input_schema: 'CloudEventSchemaV1_0',
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_eventgrid_topic de Terraform permite gestionar un tema de Azure Event Grid.",
      examples: [
        `
resource "azurerm_eventgrid_topic" "example" {
  name                = "example-eventgrid-topic"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name

  tags = {
    environment = "production"
  }
}
        `,
      ],
    },
  };
}

export function generateAzureEventGridTopicName(config: AzureEventGridTopicConfig): string {
  return config.name || `azure-egtopic-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureEventGridTopicGeneratedCode {
  name: string;
  description: string;
  config: AzureEventGridTopicConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureEventGridTopicCode(config: AzureEventGridTopicConfig): AzureEventGridTopicGeneratedCode {
  const parsedConfig = AzureEventGridTopicSchema.parse(config);
  return {
    name: generateAzureEventGridTopicName(parsedConfig),
    description: `Azure Event Grid Topic: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureEventGridTopicTemplates(parsedConfig),
  };
}

const azureEventGridTopicResource = {
  type: 'azurerm_eventgrid_topic',
  name: 'Azure Event Grid Topic',
  schema: () => AzureEventGridTopicSchema,
  defaults: generateDefaultAzureEventGridTopicConfig,
  fields: () => azureEventGridTopicFields,
  templates: (config: AzureEventGridTopicConfig) => generateAzureEventGridTopicTemplates(config),

  originalSchema: AzureEventGridTopicSchema,
  originalGenerateDefaultConfig: generateDefaultAzureEventGridTopicConfig,
  originalGenerateResourceSchema: generateAzureEventGridTopicResourceSchema,
  originalGenerateResourceName: generateAzureEventGridTopicName,
  originalGenerateTemplates: generateAzureEventGridTopicCode,
};

export default azureEventGridTopicResource;
