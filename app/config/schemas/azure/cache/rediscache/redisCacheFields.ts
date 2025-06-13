import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureRedisCacheFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Caché Redis',
    type: 'text',
    required: true,
    placeholder: 'myrediscache',
    description: 'El nombre globalmente único de la instancia de Azure Cache for Redis.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará la caché.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará la caché Redis.'
  },
  {
    key: 'capacity',
    label: 'Capacidad',
    type: 'number',
    required: true,
    min: 0, // C0 (250MB) es 0, C1 (1GB) es 1, etc. P1 (6GB) es 1.
    max: 6, // C6 (53GB) es 6. P5 (53GB) es 5.
    defaultValue: 0,
    description: 'Tamaño de la caché. C0 (0) a C6 (6) para Basic/Standard. P1 (1) a P5 (5) para Premium.'
  },
  {
    key: 'family',
    label: 'Familia de SKU',
    type: 'select',
    required: true,
    options: [
      { value: 'C', label: 'Basic/Standard (C)' },
      { value: 'P', label: 'Premium (P)' },
    ],
    defaultValue: 'C',
    description: 'La familia de SKU para la caché (C para Basic/Standard, P para Premium).'
  },
  {
    key: 'sku_name',
    label: 'Plan de Tarifa',
    type: 'select',
    required: true,
    options: [
      { value: 'Basic', label: 'Basic' },
      { value: 'Standard', label: 'Standard' },
      { value: 'Premium', label: 'Premium' },
    ],
    defaultValue: 'Basic',
    description: 'El plan de tarifa de la caché Redis.'
  },
  {
    key: 'enable_non_ssl_port',
    label: 'Habilitar Puerto No SSL (6379)',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita el acceso en el puerto no SSL. No recomendado para producción.'
  },
  {
    key: 'minimum_tls_version',
    label: 'Versión Mínima de TLS',
    type: 'select',
    options: [
      { value: '1.0', label: '1.0' },
      { value: '1.1', label: '1.1' },
      { value: '1.2', label: '1.2' },
    ],
    defaultValue: '1.2',
    description: 'La versión mínima de TLS que se aceptará.'
  },
  {
    key: 'redis_configuration',
    label: 'Configuración de Redis',
    type: 'group',
    fields: [
      {
        key: 'maxmemory_reserved',
        label: 'Maxmemory Reserved (MB)',
        type: 'number',
        placeholder: '50',
        description: 'Valor en MB para la configuración \'maxmemory-reserved\' de Redis.'
      },
      {
        key: 'maxmemory_delta',
        label: 'Maxmemory Delta (MB)',
        type: 'number',
        placeholder: '10',
        description: 'Valor en MB para la configuración \'maxmemory-delta\' de Redis.'
      },
      // Se pueden añadir más configuraciones de Redis aquí
    ]
  },
  {
    key: 'shard_count',
    label: 'Número de Shards (Premium)',
    type: 'number',
    min: 1,
    placeholder: '1',
    description: 'Número de shards a crear en un clúster Premium (solo para SKU Premium).'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,tier=cache',
    description: 'Tags para organizar la caché Redis.'
  },
];
