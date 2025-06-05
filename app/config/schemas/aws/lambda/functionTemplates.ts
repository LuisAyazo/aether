import { AWSLambdaFunctionConfig } from './function'; // Asumiremos que este tipo se definirá en function.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

// Helper function to parse key-value string "K1=V1,K2=V2" to object
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

export function generateAWSLambdaFunctionTemplates(config: AWSLambdaFunctionConfig): CodeTemplate {
  const terraformResourceName = config.function_name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.function_name.replace(/-/g, '');

  const envVars = parseKeyValueString(config.environment_variables as string | undefined);
  const tags = {
    Name: config.function_name,
    ...parseKeyValueString(config.tags as string | undefined),
  };

  // Determine source code configuration
  let sourceCodeBlockTerraform = '';
  let sourceCodeBlockPulumi = '';
  if (config.s3_bucket && config.s3_key) {
    sourceCodeBlockTerraform = `
  s3_bucket = "${config.s3_bucket}"
  s3_key    = "${config.s3_key}"
  # s3_object_version = "your-object-version" # Opcional
`;
    sourceCodeBlockPulumi = `
    s3Bucket: "${config.s3_bucket}",
    s3Key: "${config.s3_key}",
    // s3ObjectVersion: "your-object-version", // Opcional
`;
  } else if (config.source_code_path) {
    // Para Terraform, si es una ruta local, se usa 'filename' y 'source_code_hash'
    // Para Pulumi, se usa 'code' con un AssetArchive o FileArchive
    sourceCodeBlockTerraform = `
  filename      = "${config.source_code_path}" # Ruta al archivo .zip local
  source_code_hash = filebase64sha256("${config.source_code_path}") # Requerido si se usa filename
  # Opcionalmente, si el .zip está en S3 pero no se especificaron bucket/key separados:
  # s3_bucket = "bucket-name-from-path" # Extraer de source_code_path si es s3://...
  # s3_key    = "key-from-path"         # Extraer de source_code_path si es s3://...
`;
    sourceCodeBlockPulumi = `
    code: new pulumi.asset.FileArchive("${config.source_code_path}"), // Ruta al .zip o directorio local
`;
  } else {
    sourceCodeBlockTerraform = `
  # DEBE PROPORCIONAR 'filename' o 's3_bucket'/'s3_key' o 'image_uri'
  # filename = "lambda_function_payload.zip" 
`;
    sourceCodeBlockPulumi = `
    # DEBE PROPORCIONAR 'code' o 's3Bucket'/'s3Key' o 'imageUri'
    # code: new pulumi.asset.FileArchive("./path_to_your_code.zip"),
`;
  }


  const terraform = `
# Plantilla de Terraform para una Función Lambda de AWS
provider "aws" {
  region = "${config.region}"
}

# Recurso para la función Lambda
resource "aws_lambda_function" "${terraformResourceName}" {
  function_name = "${config.function_name}"
  role          = "${config.role_arn}"
  handler       = "${config.handler}"
  runtime       = "${config.runtime}"
  memory_size   = ${config.memory_size || 128}
  timeout       = ${config.timeout || 3}

  # Configuración del código fuente (elegir una opción)
  ${sourceCodeBlockTerraform.trim()}

  # (Opcional) Variables de entorno
  ${Object.keys(envVars).length > 0 ?
  `environment {
    variables = {
      ${Object.entries(envVars).map(([key, value]) => `"${key}" = "${value}"`).join('\n      ')}
    }
  }` : '# environment {\n#   variables = {\n#     MY_VARIABLE = "my_value"\n#   }\n# }'}

  # (Opcional) Tags
  tags = {
    ${Object.entries(tags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }

  # (Opcional) Configuración de VPC (si la Lambda necesita acceder a recursos en una VPC)
  # vpc_config {
  #   subnet_ids         = ["subnet-xxxxxxxxxxxxxxxxx"]
  #   security_group_ids = ["sg-xxxxxxxxxxxxxxxxx"]
  # }

  # (Opcional) Dead Letter Queue (DLQ) para manejar fallos de invocación
  # dead_letter_config {
  #   target_arn = "arn:aws:sqs:us-east-1:123456789012:my-lambda-dlq"
  # }
}

# (Opcional) Permiso para que un servicio invoque la Lambda (ej. API Gateway)
# resource "aws_lambda_permission" "${terraformResourceName}_apigw_permission" {
#   statement_id  = "AllowAPIGatewayInvoke"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.${terraformResourceName}.function_name
#   principal     = "apigateway.amazonaws.com"
#   # Opcional: restringir al ARN de un API Gateway específico
#   # source_arn = "arn:aws:execute-api:us-east-1:123456789012:abcdef123/*/*/*"
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Función Lambda de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// (Opcional) Crear un rol IAM para la función Lambda si no existe uno
// const lambdaRole = new aws.iam.Role("lambdaRole", {
//     assumeRolePolicy: JSON.stringify({
//         Version: "2012-10-17",
//         Statement: [{
//             Action: "sts:AssumeRole",
//             Effect: "Allow",
//             Principal: { Service: "lambda.amazonaws.com" },
//         }],
//     }),
// });
// new aws.iam.RolePolicyAttachment("lambdaLogs", {
//     role: lambdaRole.name,
//     policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
// });

// Crear la función Lambda
const ${pulumiResourceName}Function = new aws.lambda.Function("${pulumiResourceName}", {
    name: "${config.function_name}",
    role: "${config.role_arn}", // Reemplazar con lambdaRole.arn si se crea arriba
    handler: "${config.handler}",
    runtime: "${config.runtime}",
    memorySize: ${config.memory_size || 128},
    timeout: ${config.timeout || 3},
    region: "${config.region}", // Asegurar que el proveedor AWS esté configurado para esta región

    // Configuración del código fuente
    ${sourceCodeBlockPulumi.trim()}

    // (Opcional) Variables de entorno
    ${Object.keys(envVars).length > 0 ?
    `environment: {
        variables: {
            ${Object.entries(envVars).map(([key, value]) => `"${key}": "${value}",`).join('\n            ')}
        },
    },` : '// environment: { variables: { MY_VARIABLE: "my_value" } },'}

    // (Opcional) Tags
    tags: {
        ${Object.entries(tags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },

    // (Opcional) Configuración de VPC
    // vpcConfig: {
    //     subnetIds: ["subnet-xxxxxxxxxxxxxxxxx"],
    //     securityGroupIds: ["sg-xxxxxxxxxxxxxxxxx"],
    // },

    // (Opcional) Dead Letter Queue (DLQ)
    // deadLetterConfig: {
    //     targetArn: "arn:aws:sqs:us-east-1:123456789012:my-lambda-dlq",
    // },
});

// Exportar el ARN de la función Lambda
export const lambdaFunctionArn = ${pulumiResourceName}Function.arn;
export const lambdaFunctionName = ${pulumiResourceName}Function.name;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Función Lambda
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una función Lambda de AWS llamada ${config.function_name}
  en la región ${config.region}.

Parameters:
  LambdaFunctionName:
    Type: String
    Default: "${config.function_name}"
  LambdaRoleArn:
    Type: String
    Default: "${config.role_arn}"
  LambdaRuntime:
    Type: String
    Default: "${config.runtime}"
  LambdaHandler:
    Type: String
    Default: "${config.handler}"
  LambdaMemorySize:
    Type: Number
    Default: ${config.memory_size || 128}
  LambdaTimeout:
    Type: Number
    Default: ${config.timeout || 3}
  S3BucketName: # Parámetro para el bucket S3 del código
    Type: String
    Default: "${config.s3_bucket || ''}"
  S3KeyName: # Parámetro para la clave S3 del código
    Type: String
    Default: "${config.s3_key || ''}"

Conditions:
  HasS3Code: !Not [!Equals [!Ref S3BucketName, ""]]

Resources:
  ${pulumiResourceName}LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Role: !Ref LambdaRoleArn
      Handler: !Ref LambdaHandler
      Runtime: !Ref LambdaRuntime
      MemorySize: !Ref LambdaMemorySize
      Timeout: !Ref LambdaTimeout
      # Código fuente: usar S3 si se proporcionan bucket y clave
      Code: !If
        - HasS3Code
        - S3Bucket: !Ref S3BucketName
          S3Key: !Ref S3KeyName
          # S3ObjectVersion: String # Opcional
        - # Si no, se esperaría un paquete .zip local o ImageUri (no modelado aquí para simplicidad)
          # ZipFile: |
          #   exports.handler = async (event) => {
          #     console.log("Event: ", event);
          #     return { statusCode: 200, body: "Hello from Lambda!" };
          #   };
          # O ImageUri para funciones de contenedor
          # PackageType: Image
          # ImageUri: 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-lambda-repo:latest
          ZipFile: "exports.handler = async (event) => { return {statusCode: 200, body: 'Placeholder code. Update with S3 or local zip.'}; };"

      ${Object.keys(envVars).length > 0 ?
      `Environment:
        Variables:
          ${Object.entries(envVars).map(([key, value]) => `${key}: "${value}"`).join('\n          ')}` : ''}
      Tags:
        ${Object.entries(tags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}
      # VpcConfig: # Opcional
      #   SecurityGroupIds:
      #     - sg-xxxxxxxxxxxxxxxxx
      #   SubnetIds:
      #     - subnet-xxxxxxxxxxxxxxxxx
      # DeadLetterConfig: # Opcional
      #   TargetArn: arn:aws:sqs:us-east-1:123456789012:my-lambda-dlq

Outputs:
  LambdaFunctionArn:
    Description: ARN de la función Lambda creada
    Value: !GetAtt ${pulumiResourceName}LambdaFunction.Arn
  LambdaFunctionNameOut:
    Description: Nombre de la función Lambda creada
    Value: !Ref ${pulumiResourceName}LambdaFunction
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS Lambda Function (requiere community.aws.lambda o amazon.aws.lambda_function)
- name: Desplegar función Lambda ${config.function_name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    lambda_function_name: "${config.function_name}"
    aws_region: "${config.region}"
    lambda_runtime: "${config.runtime}"
    lambda_handler: "${config.handler}"
    lambda_role_arn: "${config.role_arn}"
    lambda_memory_size: ${config.memory_size || 128}
    lambda_timeout: ${config.timeout || 3}
    # Código fuente - elegir una opción:
    # zip_file: "${config.source_code_path || 'lambda_function.zip'}" # Si es un archivo local
    s3_bucket: "${config.s3_bucket || ''}"
    s3_key: "${config.s3_key || ''}"
    # s3_object_version: "version-id" # Opcional
    environment_variables:
      ${Object.entries(envVars).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
    lambda_tags:
      ${Object.entries(tags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Asegurar que la función Lambda exista
      amazon.aws.lambda_function:
        name: "{{ lambda_function_name }}"
        region: "{{ aws_region }}"
        runtime: "{{ lambda_runtime }}"
        handler: "{{ lambda_handler }}"
        role: "{{ lambda_role_arn }}"
        memory_size: "{{ lambda_memory_size }}"
        timeout: "{{ lambda_timeout }}"
        # Configuración del código fuente:
        zip_file: "{{ zip_file | default(omit) if not s3_bucket else omit }}"
        s3_bucket: "{{ s3_bucket | default(omit) }}"
        s3_key: "{{ s3_key | default(omit) }}"
        # s3_object_version: "{{ s3_object_version | default(omit) }}"
        environment_variables: "{{ environment_variables | default(omit) }}"
        tags: "{{ lambda_tags }}"
        state: present # 'present' crea o actualiza, 'absent' elimina
      register: lambda_info

    - name: Mostrar información de la función Lambda
      ansible.builtin.debug:
        var: lambda_info
`,
    cloudformation
  };
}
