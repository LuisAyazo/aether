import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { awsElasticBeanstalkEnvironmentFields } from './environmentFields';
import { generateAWSElasticBeanstalkEnvironmentTemplates } from './environmentTemplates';

// Esquema de validación para AWS Elastic Beanstalk Environment
export const awsElasticBeanstalkEnvironmentValidationSchema = z.object({
  name: z.string().min(4, "El nombre del entorno debe tener al menos 4 caracteres.")
    .max(40, "El nombre del entorno no puede exceder los 40 caracteres.")
    .regex(/^[a-zA-Z0-9-]+$/, "Nombre de entorno inválido. Solo letras, números y guiones."),
  application_name: z.string().min(1, "El nombre de la aplicación es requerido.")
    .max(100, "El nombre de la aplicación no puede exceder los 100 caracteres."),
  region: z.string().min(1, "La región es requerida."),
  solution_stack_name: z.string().optional(),
  platform_arn: z.string().optional(),
  tier: z.enum(['WebServer', 'Worker']).optional().default('WebServer'),
  cname_prefix: z.string()
    .max(63, "El prefijo CNAME no puede exceder los 63 caracteres.")
    .regex(/^[a-zA-Z0-9-]+$/, "Prefijo CNAME inválido. Solo letras, números y guiones.")
    .optional(),
  description: z.string().max(200, "La descripción no puede exceder los 200 caracteres.").optional(),
  setting: z.string().optional(), // Formato: namespace:option_name=value;...
  tags: z.string().optional(), // Formato: K1=V1,K2=V2
}).refine(data => {
  // Validar que se provea solution_stack_name o platform_arn
  return data.solution_stack_name || data.platform_arn;
}, {
  message: "Debe especificar un Solution Stack Name o un Platform ARN.",
  path: ["solution_stack_name"], // O un path más general
});

// Tipo inferido de la configuración de Elastic Beanstalk Environment
export type AWSElasticBeanstalkEnvironmentConfig = z.infer<typeof awsElasticBeanstalkEnvironmentValidationSchema>;

// Valores por defecto para un nuevo Elastic Beanstalk Environment
export const defaultAWSElasticBeanstalkEnvironmentConfig: Partial<AWSElasticBeanstalkEnvironmentConfig> & { name: string, application_name: string } = {
  name: 'my-eb-env',
  application_name: 'my-eb-app',
  region: 'us-east-1',
  tier: 'WebServer',
  // solution_stack_name o platform_arn deben ser proporcionados por el usuario
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsElasticBeanstalkEnvironmentValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsElasticBeanstalkEnvironmentFields);
};

export const templates = (config: AWSElasticBeanstalkEnvironmentConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSElasticBeanstalkEnvironmentTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  // Asegurar que 'name' esté presente para ResourceValues
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSElasticBeanstalkEnvironmentConfig,
    name: defaultAWSElasticBeanstalkEnvironmentConfig.name, 
    application_name: defaultAWSElasticBeanstalkEnvironmentConfig.application_name,
  };
  return Promise.resolve(defaultsToReturn);
};
