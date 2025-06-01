import { z } from 'zod';
import { azureApiManagementServiceFields } from './apiManagementServiceFields';
import { generateAzureApiManagementServiceTemplates } from './apiManagementServiceTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';

export const AzureApiManagementServiceSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es obligatorio.").regex(/^[a-zA-Z][a-zA-Z0-9-]{0,49}$/, "Nombre inválido para API Management Service."),
  resource_group_name: z.string().min(1, "El nombre del grupo de recursos es obligatorio."),
  location: z.string().min(1, "La ubicación es obligatoria."),
  publisher_name: z.string().min(1, "El nombre del publicador es obligatorio."),
  publisher_email: z.string().email("Debe ser un correo electrónico válido."),
  sku_name: z.enum(['Developer_1', 'Basic_1', 'Standard_1', 'Premium_1']), // Simplificado, se pueden añadir más
  virtual_network_type: z.enum(['None', 'External', 'Internal']).optional().default('None'),
  // subnet_id: z.string().optional(), // Necesario si virtual_network_type no es 'None'
  tags: z.string().optional().describe("Formato: clave1=valor1,clave2=valor2"),
}).refine(data => {
  if (data.virtual_network_type !== 'None' /* && !data.subnet_id */) {
    // En un formulario real, se mostraría el campo subnet_id condicionalmente.
    // Aquí, solo recordamos que es necesario. La validación de subnet_id se haría si el campo existiera.
    // return false; // Descomentar si subnet_id se añade y es obligatorio.
  }
  return true;
}, { message: "Se requiere subnet_id para integración con VNet."});

export type AzureApiManagementServiceConfig = z.infer<typeof AzureApiManagementServiceSchema>;

export function generateDefaultAzureApiManagementServiceConfig(): AzureApiManagementServiceConfig {
  return {
    name: 'myapimservice',
    resource_group_name: 'my-apim-resources',
    location: 'East US',
    publisher_name: 'My Company Inc.',
    publisher_email: 'contact@example.com',
    sku_name: 'Developer_1',
    virtual_network_type: 'None',
  };
}

export function generateAzureApiManagementServiceResourceSchema(): ResourceSchema {
  return {
    type: 'azurerm_api_management', // El tipo de nodo que se usa en page.tsx
    displayName: 'Azure API Management Service',
    description: 'Crea un servicio de Azure API Management.',
    category: 'Aplicación', 
    fields: azureApiManagementServiceFields,
    templates: {
      default: generateDefaultAzureApiManagementServiceConfig() as unknown as ResourceTemplate,
      standard_vnet: {
        ...generateDefaultAzureApiManagementServiceConfig(),
        name: 'standard-apim-vnet',
        sku_name: 'Standard_1',
        virtual_network_type: 'External', // O 'Internal'
        // subnet_id: "ID_DE_SUBNET_AQUI" // Requeriría input del usuario
      } as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso azurerm_api_management_service de Terraform permite gestionar un servicio de Azure API Management.",
      examples: [
        `
resource "azurerm_api_management" "example" {
  name                = "example-apim"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  publisher_name      = "My Company"
  publisher_email     = "company@terraform.io"

  sku_name = "Developer_1"
}
        `,
      ],
    },
  };
}

export function generateAzureApiManagementServiceName(config: AzureApiManagementServiceConfig): string {
  return config.name || `azure-apim-${Math.random().toString(36).substring(2, 7)}`;
}

export interface AzureApiManagementServiceGeneratedCode {
  name: string;
  description: string;
  config: AzureApiManagementServiceConfig;
  codeTemplates: CodeTemplate;
}

export function generateAzureApiManagementServiceCode(config: AzureApiManagementServiceConfig): AzureApiManagementServiceGeneratedCode {
  const parsedConfig = AzureApiManagementServiceSchema.parse(config);
  return {
    name: generateAzureApiManagementServiceName(parsedConfig),
    description: `Azure API Management Service: ${parsedConfig.name}`,
    config: parsedConfig,
    codeTemplates: generateAzureApiManagementServiceTemplates(parsedConfig),
  };
}

const azureApiManagementServiceResource = {
  type: 'azurerm_api_management', // Coincide con el type en page.tsx
  name: 'Azure API Management Service', // Nombre para mostrar en la UI
  schema: () => AzureApiManagementServiceSchema,
  defaults: generateDefaultAzureApiManagementServiceConfig,
  fields: () => azureApiManagementServiceFields,
  templates: (config: AzureApiManagementServiceConfig) => generateAzureApiManagementServiceTemplates(config),

  originalSchema: AzureApiManagementServiceSchema,
  originalGenerateDefaultConfig: generateDefaultAzureApiManagementServiceConfig,
  originalGenerateResourceSchema: generateAzureApiManagementServiceResourceSchema,
  originalGenerateResourceName: generateAzureApiManagementServiceName,
  originalGenerateTemplates: generateAzureApiManagementServiceCode,
};

export default azureApiManagementServiceResource;
