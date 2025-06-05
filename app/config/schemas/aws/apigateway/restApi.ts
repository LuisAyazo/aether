import { z } from 'zod';
import { awsApiGatewayRestApiFields } from './restApiFields';
import { generateAWSApiGatewayRestApiTemplates } from './restApiTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig';
// Asumimos que formatInputs no es crucial por ahora o se manejará de otra forma.
// import { formatInputs } from '@/app/lib/utils'; 

// Define el esquema Zod para la configuración de una API Gateway REST API
export const AWSApiGatewayRestApiSchema = z.object({
  name: z.string().min(1, "El nombre de la API es obligatorio."),
  description: z.string().optional(),
  region: z.string().min(1, "La región es obligatoria."),
  endpoint_configuration_types: z.enum(['REGIONAL', 'EDGE', 'PRIVATE']).optional().default('REGIONAL'),
  tags: z.string().optional().describe("Tags adicionales en formato Clave1=Valor1,Clave2=Valor2"),
});

// Infiere el tipo TypeScript del esquema Zod
export type AWSApiGatewayRestApiConfig = z.infer<typeof AWSApiGatewayRestApiSchema>;

// Genera la configuración por defecto para una API Gateway REST API
export function generateDefaultAWSApiGatewayRestApiConfig(): AWSApiGatewayRestApiConfig {
  return {
    name: 'my-api',
    description: 'Mi API REST desplegada con API Gateway',
    region: 'us-east-1',
    endpoint_configuration_types: 'REGIONAL',
  };
}

// Genera el esquema del recurso API Gateway REST API
export function generateAWSApiGatewayRestApiResourceSchema(): ResourceSchema {
  return {
    type: 'aws_api_gateway_rest_api',
    displayName: 'API Gateway (REST)',
    description: 'Crea y gestiona una API RESTful utilizando Amazon API Gateway.',
    category: 'Aplicación', 
    fields: awsApiGatewayRestApiFields,
    templates: { // Plantillas de configuración, no de código IaC
      default: generateDefaultAWSApiGatewayRestApiConfig() as unknown as ResourceTemplate,
    },
    documentation: {
      description: "El recurso aws_api_gateway_rest_api de Terraform permite gestionar una API REST de Amazon API Gateway. Esto incluye la definición de la API, su configuración de endpoint, y tags.",
      examples: [
        `
resource "aws_api_gateway_rest_api" "MyDemoAPI" {
  name        = "MyDemoAPI"
  description = "This is my API for demonstration purposes"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
        `,
      ],
    },
  };
}

// Genera un nombre único para el recurso API Gateway REST API
export function generateAWSApiGatewayRestApiName(config: AWSApiGatewayRestApiConfig): string {
  return config.name || `api-gateway-rest-${Math.random().toString(36).substring(2, 7)}`;
}

// Interfaz para el objeto que devuelve generateAWSApiGatewayRestApiCode
export interface AWSApiGatewayRestApiGeneratedCode {
  name: string;
  description: string;
  config: AWSApiGatewayRestApiConfig;
  codeTemplates: CodeTemplate;
}

// Función principal para generar todas las plantillas de código
export function generateAWSApiGatewayRestApiCode(config: AWSApiGatewayRestApiConfig): AWSApiGatewayRestApiGeneratedCode {
  // const formattedConfig = formatInputs(config, AWSApiGatewayRestApiSchema) as AWSApiGatewayRestApiConfig; // Comentado
  const formattedConfig = { ...config }; // Usar config directamente
  
  // Asegurar valores por defecto si no están presentes (Zod los aplica al parsear)
  formattedConfig.description = config.description ?? '';
  formattedConfig.endpoint_configuration_types = config.endpoint_configuration_types ?? 'REGIONAL';

  return {
    name: generateAWSApiGatewayRestApiName(formattedConfig),
    description: formattedConfig.description || `API Gateway REST API: ${formattedConfig.name}`,
    config: formattedConfig,
    codeTemplates: generateAWSApiGatewayRestApiTemplates(formattedConfig),
  };
}

// Define la exportación del recurso para el registro
const awsApiGatewayRestApiResourceDefinition = {
  type: 'aws_api_gateway_rest_api',
  name: 'API Gateway (REST)', // Coincide con displayName
  schema: () => AWSApiGatewayRestApiSchema,
  defaults: generateDefaultAWSApiGatewayRestApiConfig,
  fields: () => awsApiGatewayRestApiFields,
  templates: (config: AWSApiGatewayRestApiConfig) => generateAWSApiGatewayRestApiTemplates(config),

  // Mantener las funciones originales
  originalSchema: AWSApiGatewayRestApiSchema,
  originalGenerateDefaultConfig: generateDefaultAWSApiGatewayRestApiConfig,
  originalGenerateResourceSchema: generateAWSApiGatewayRestApiResourceSchema,
  originalGenerateResourceName: generateAWSApiGatewayRestApiName,
  originalGenerateTemplates: generateAWSApiGatewayRestApiCode,
};

const awsApiGatewayRestApiResource = {
  ...awsApiGatewayRestApiResourceDefinition,
};

export default awsApiGatewayRestApiResource;
