import { FieldConfig } from '@/app/types/resourceConfig';

export const awsDynamoDBTableFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Tabla DynamoDB',
    type: 'text',
    required: true,
    placeholder: 'my-dynamodb-table',
    description: 'El nombre único para tu tabla DynamoDB. Debe tener entre 3 y 255 caracteres.'
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
    description: 'La región de AWS donde se creará la tabla DynamoDB.'
  },
  {
    key: 'billing_mode',
    label: 'Modo de Facturación',
    type: 'select',
    required: true,
    options: [
      { value: 'PROVISIONED', label: 'Provisionado (Provisioned)' },
      { value: 'PAY_PER_REQUEST', label: 'Pago por Solicitud (On-Demand)' },
    ],
    defaultValue: 'PAY_PER_REQUEST',
    description: 'Controla cómo se cobra por el rendimiento de lectura/escritura y cómo se gestiona la capacidad.'
  },
  {
    key: 'read_capacity',
    label: 'Capacidad de Lectura (Provisionado)',
    type: 'number',
    min: 1,
    defaultValue: 5,
    description: 'Unidades de capacidad de lectura (RCU). Requerido si el modo de facturación es PROVISIONED.'
  },
  {
    key: 'write_capacity',
    label: 'Capacidad de Escritura (Provisionado)',
    type: 'number',
    min: 1,
    defaultValue: 5,
    description: 'Unidades de capacidad de escritura (WCU). Requerido si el modo de facturación es PROVISIONED.'
  },
  {
    key: 'hash_key',
    label: 'Clave de Partición (Hash Key)',
    type: 'text',
    required: true,
    placeholder: 'id',
    description: 'El nombre del atributo para la clave de partición.'
  },
  {
    key: 'hash_key_type',
    label: 'Tipo de la Clave de Partición',
    type: 'select',
    required: true,
    options: [
      { value: 'S', label: 'String (S)' },
      { value: 'N', label: 'Number (N)' },
      { value: 'B', label: 'Binary (B)' },
    ],
    defaultValue: 'S',
    description: 'El tipo de dato para la clave de partición (S, N, o B).'
  },
  {
    key: 'range_key',
    label: 'Clave de Ordenación (Range Key - Opcional)',
    type: 'text',
    placeholder: 'timestamp',
    description: 'El nombre del atributo para la clave de ordenación (opcional).'
  },
  {
    key: 'range_key_type',
    label: 'Tipo de la Clave de Ordenación (Opcional)',
    type: 'select',
    options: [
      { value: '', label: 'Ninguno' },
      { value: 'S', label: 'String (S)' },
      { value: 'N', label: 'Number (N)' },
      { value: 'B', label: 'Binary (B)' },
    ],
    defaultValue: '',
    description: 'El tipo de dato para la clave de ordenación (S, N, o B), si se usa.'
  },
  {
    key: 'stream_enabled',
    label: 'Habilitar DynamoDB Streams',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita DynamoDB Streams para la tabla.'
  },
  {
    key: 'stream_view_type',
    label: 'Tipo de Vista del Stream',
    type: 'select',
    options: [
      { value: 'NEW_IMAGE', label: 'Nueva Imagen (NEW_IMAGE)' },
      { value: 'OLD_IMAGE', label: 'Imagen Antigua (OLD_IMAGE)' },
      { value: 'NEW_AND_OLD_IMAGES', label: 'Nueva y Antigua Imagen (NEW_AND_OLD_IMAGES)' },
      { value: 'KEYS_ONLY', label: 'Solo Claves (KEYS_ONLY)' },
    ],
    defaultValue: 'NEW_AND_OLD_IMAGES',
    description: 'Información que se escribe en el stream cuando los datos de la tabla cambian. Requerido si stream_enabled es true.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Project=MyApp',
    description: 'Tags para la tabla DynamoDB.'
  },
];
