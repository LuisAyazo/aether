import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsLambdaFunctionFields } from './functionFields';
import { generateAWSLambdaFunctionTemplates } from './functionTemplates';

// Esquema de validación para AWS Lambda Function
export const awsLambdaFunctionValidationSchema = z.object({
  function_name: z.string().min(1, "El nombre de la función es requerido.")
    .regex(/^[a-zA-Z0-9-_]+$/, "Nombre de función inválido. Solo letras, números, guiones y guiones bajos."),
  region: z.string().min(1, "La región es requerida."),
  runtime: z.string().min(1, "El runtime es requerido."),
  handler: z.string().min(1, "El handler es requerido."),
  role_arn: z.string().min(1, "El ARN del rol IAM es requerido.")
    .regex(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9_.-]+$/, "Formato de ARN de rol IAM inválido."),
  memory_size: z.number().int().min(128).max(10240).optional().default(128),
  timeout: z.number().int().min(1).max(900).optional().default(3),
  source_code_path: z.string().optional(),
  s3_bucket: z.string().optional(),
  s3_key: z.string().optional(),
  environment_variables: z.string().optional()
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(pair => /^[a-zA-Z_][a-zA-Z0-9_]*=[^,]*$/.test(pair.trim()));
    }, { message: "Formato de variables de entorno inválido. Use CLAVE1=VALOR1,CLAVE2=VALOR2. Las claves deben empezar con letra o _, seguidas de letras, números o _."}),
  tags: z.string().optional()
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(pair => /^[a-zA-Z0-9_.:/=+\-@ ]+=[^,]*$/.test(pair.trim()));
    }, { message: "Formato de tags inválido." }),
  // Para consistencia con ResourceValues, añadimos 'name' que será igual a function_name
  name: z.string().optional(),
}).transform(data => ({
  ...data,
  name: data.function_name,
})).refine(data => {
  // Validar que se provea una fuente de código
  return data.source_code_path || (data.s3_bucket && data.s3_key) /* || data.image_uri */;
}, {
  message: "Debe especificar una fuente de código: ruta local, S3 bucket/key.",
  path: ["source_code_path"], // O un path más general si es apropiado
});

// Tipo inferido de la configuración de Lambda Function
export type AWSLambdaFunctionConfig = z.infer<typeof awsLambdaFunctionValidationSchema>;

// Valores por defecto para una nueva Lambda Function
export const defaultAWSLambdaFunctionConfig: Partial<AWSLambdaFunctionConfig> & { function_name: string, name: string, role_arn: string, runtime: string, handler: string } = {
  function_name: 'my-lambda-function',
  name: 'my-lambda-function',
  region: 'us-east-1',
  runtime: 'nodejs18.x',
  handler: 'index.handler',
  role_arn: 'arn:aws:iam::123456789012:role/lambda-execution-role', // Placeholder ARN
  memory_size: 128,
  timeout: 3,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsLambdaFunctionValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsLambdaFunctionFields);
};

export const templates = (config: AWSLambdaFunctionConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSLambdaFunctionTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    name: defaultAWSLambdaFunctionConfig.name,
    function_name: defaultAWSLambdaFunctionConfig.function_name,
    region: defaultAWSLambdaFunctionConfig.region,
    runtime: defaultAWSLambdaFunctionConfig.runtime,
    handler: defaultAWSLambdaFunctionConfig.handler,
    role_arn: defaultAWSLambdaFunctionConfig.role_arn,
    memory_size: defaultAWSLambdaFunctionConfig.memory_size,
    timeout: defaultAWSLambdaFunctionConfig.timeout,
  };
  return Promise.resolve(defaultsToReturn);
};
