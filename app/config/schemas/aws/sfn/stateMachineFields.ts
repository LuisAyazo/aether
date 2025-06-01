import { FieldConfig } from '@/app/types/resourceConfig';

export const awsSfnStateMachineFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Máquina de Estados',
    type: 'text',
    required: true,
    placeholder: 'my-state-machine',
    description: 'El nombre de la máquina de estados. Debe ser único dentro de su región y cuenta.'
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
      // Añadir más regiones según sea necesario
    ],
    defaultValue: 'us-east-1',
    description: 'La región de AWS donde se creará la máquina de estados.'
  },
  {
    key: 'role_arn',
    label: 'ARN del Rol IAM',
    type: 'text',
    required: true,
    placeholder: 'arn:aws:iam::123456789012:role/service-role/StepFunctionsRole',
    description: 'El ARN del rol IAM que Step Functions asumirá.'
  },
  {
    key: 'definition',
    label: 'Definición de la Máquina de Estados (JSON - Amazon States Language)',
    type: 'textarea',
    required: true,
    placeholder: '{\n  "Comment": "A Hello World example of the Amazon States Language",\n  "StartAt": "HelloWorld",\n  "States": {\n    "HelloWorld": {\n      "Type": "Pass",\n      "Result": "Hello World!",\n      "End": true\n    }\n  }\n}',
    description: 'La definición de la máquina de estados en Amazon States Language (formato JSON).'
  },
  {
    key: 'type',
    label: 'Tipo de Máquina de Estados',
    type: 'select',
    options: [
      { value: 'STANDARD', label: 'Standard' },
      { value: 'EXPRESS', label: 'Express' },
    ],
    defaultValue: 'STANDARD',
    description: 'Determina el tipo de máquina de estados (Standard o Express).'
  },
  // Logging configuration es un objeto complejo, se podría simplificar o añadir campos individuales
  // Por ejemplo, un booleano para habilitar logging a CloudWatch Logs
  {
    key: 'logging_cloudwatch_enabled',
    label: 'Habilitar Logging a CloudWatch',
    type: 'boolean',
    defaultValue: true,
    description: 'Si se habilita el logging a CloudWatch Logs. Requiere configurar `logging_configuration`.'
  },
  {
    key: 'logging_level',
    label: 'Nivel de Logging (si habilitado)',
    type: 'select',
    options: [
      { value: 'ALL', label: 'ALL' },
      { value: 'ERROR', label: 'ERROR' },
      { value: 'FATAL', label: 'FATAL' },
      { value: 'OFF', label: 'OFF' },
    ],
    defaultValue: 'OFF',
    description: 'Nivel de logging para las ejecuciones. Solo si el logging está habilitado.'
  },
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Owner=workflow-team',
    description: 'Tags adicionales para la máquina de estados.'
  },
];
