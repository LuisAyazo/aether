import { FieldConfig } from '@/app/types/resourceConfig';

export const awsApiGatewayRestApiFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la API',
    type: 'text',
    required: true,
    placeholder: 'my-rest-api',
    description: 'El nombre de la API REST.'
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción de mi API REST',
    description: 'Una descripción para la API REST.'
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
    description: 'La región de AWS donde se creará la API Gateway.'
  },
  {
    key: 'endpoint_configuration_types',
    label: 'Tipos de Endpoint',
    type: 'select', // Podría ser un multi-select si la UI lo soporta, o un solo string. Terraform espera una lista.
    options: [
      { value: 'REGIONAL', label: 'Regional' },
      { value: 'EDGE', label: 'Edge Optimized' },
      { value: 'PRIVATE', label: 'Private' },
    ],
    defaultValue: 'REGIONAL',
    description: 'El tipo de endpoint de la API. Terraform espera una lista, pero aquí simplificamos a uno solo por ahora.'
  },
  // Nota: Una API Gateway REST API usualmente necesita más configuración (recursos, métodos, integraciones).
  // Esto es una configuración básica del recurso principal.
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Owner=team-alpha',
    description: 'Tags adicionales para la API Gateway.'
  },
];
