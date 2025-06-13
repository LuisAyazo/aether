import { FieldConfig } from "../../../../types/resourceConfig";

export const awsLambdaFunctionFields: FieldConfig[] = [
  {
    key: 'function_name',
    label: 'Nombre de la Función',
    type: 'text',
    required: true,
    placeholder: 'my-lambda-function',
    description: 'El nombre único para tu función Lambda.'
  },
  {
    key: 'region',
    label: 'Región de AWS',
    type: 'select',
    required: true,
    options: [
      { value: 'us-east-1', label: 'US East (N. Virginia) us-east-1' },
      { value: 'us-east-2', label: 'US East (Ohio) us-east-2' },
      { value: 'us-west-1', label: 'US West (N. California) us-west-1' },
      { value: 'us-west-2', label: 'US West (Oregon) us-west-2' },
      { value: 'eu-west-1', label: 'EU (Ireland) eu-west-1' },
    ],
    defaultValue: 'us-east-1',
    description: 'La región de AWS donde se desplegará la función Lambda.'
  },
  {
    key: 'runtime',
    label: 'Runtime',
    type: 'select',
    required: true,
    options: [
      { value: 'nodejs18.x', label: 'Node.js 18.x' },
      { value: 'nodejs16.x', label: 'Node.js 16.x' },
      { value: 'python3.11', label: 'Python 3.11' },
      { value: 'python3.10', label: 'Python 3.10' },
      { value: 'python3.9', label: 'Python 3.9' },
      { value: 'java17', label: 'Java 17' },
      { value: 'java11', label: 'Java 11' },
      { value: 'go1.x', label: 'Go 1.x' },
      { value: 'dotnet6', label: '.NET 6' },
      { value: 'ruby3.2', label: 'Ruby 3.2' },
    ],
    defaultValue: 'nodejs18.x',
    description: 'El entorno de ejecución para la función Lambda.'
  },
  {
    key: 'handler',
    label: 'Handler',
    type: 'text',
    required: true,
    placeholder: 'index.handler',
    description: 'El método dentro de tu código que Lambda llama para iniciar la ejecución (ej. index.handler para Node.js, app.lambda_handler para Python).'
  },
  {
    key: 'role_arn',
    label: 'ARN del Rol IAM',
    type: 'text',
    required: true,
    placeholder: 'arn:aws:iam::123456789012:role/lambda-execution-role',
    description: 'El ARN del rol de IAM que Lambda asume cuando ejecuta la función.'
  },
  {
    key: 'memory_size',
    label: 'Tamaño de Memoria (MB)',
    type: 'number',
    min: 128,
    max: 10240,
    defaultValue: 128,
    description: 'La cantidad de memoria asignada a la función (128MB a 10240MB, en incrementos de 1MB).'
  },
  {
    key: 'timeout',
    label: 'Timeout (segundos)',
    type: 'number',
    min: 1,
    max: 900, // 15 minutos
    defaultValue: 3,
    description: 'El tiempo máximo que Lambda permite que una función se ejecute antes de detenerla (1 a 900 segundos).'
  },
  {
    key: 'source_code_path',
    label: 'Ruta al Código Fuente (Local o S3)',
    type: 'text',
    placeholder: './lambda_function.zip o s3://my-bucket/lambda_function.zip',
    description: 'Ruta a un archivo .zip local o una ubicación S3 (bucket/key) del paquete de despliegue.'
  },
  {
    key: 's3_bucket',
    label: 'Bucket S3 (para código)',
    type: 'text',
    placeholder: 'my-lambda-deployment-bucket',
    description: 'Si el código está en S3, el nombre del bucket (opcional si se usa source_code_path con s3://).'
  },
  {
    key: 's3_key',
    label: 'Clave S3 (para código)',
    type: 'text',
    placeholder: 'functions/my_function.zip',
    description: 'Si el código está en S3, la clave del objeto (opcional si se usa source_code_path con s3://).'
  },
  {
    key: 'environment_variables',
    label: 'Variables de Entorno (formato: K1=V1,K2=V2)',
    type: 'textarea',
    placeholder: 'DB_HOST=localhost,API_KEY=secret',
    description: 'Variables de entorno para la función Lambda.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Team=backend',
    description: 'Tags para la función Lambda.'
  },
];
