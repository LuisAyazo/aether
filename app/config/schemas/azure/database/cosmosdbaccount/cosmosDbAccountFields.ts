import { FieldConfig } from '@/app/types/resourceConfig';

export const azureCosmosDbAccountFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Cuenta de Cosmos DB',
    type: 'text',
    required: true,
    placeholder: 'mycosmosdbaccount',
    description: 'El nombre globalmente único de la cuenta de Cosmos DB.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará la cuenta.'
  },
  {
    key: 'location',
    label: 'Ubicación Principal',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región principal de Azure para la cuenta de Cosmos DB.'
  },
  {
    key: 'offer_type',
    label: 'Tipo de Oferta',
    type: 'select',
    required: true,
    options: [{ value: 'Standard', label: 'Standard' }],
    defaultValue: 'Standard',
    description: 'El tipo de oferta para la cuenta de Cosmos DB (actualmente solo Standard).'
  },
  {
    key: 'kind',
    label: 'Tipo de API',
    type: 'select',
    required: true,
    options: [
      { value: 'GlobalDocumentDB', label: 'Core (SQL) API' },
      { value: 'MongoDB', label: 'API for MongoDB' },
      { value: 'Table', label: 'Table API' },
      { value: 'Cassandra', label: 'Cassandra API' },
      { value: 'Gremlin', label: 'Gremlin (Graph) API' },
    ],
    defaultValue: 'GlobalDocumentDB',
    description: 'El tipo de API que usará la cuenta de Cosmos DB.'
  },
  {
    key: 'consistency_policy',
    label: 'Política de Consistencia',
    type: 'group',
    required: true,
    fields: [
      {
        key: 'consistency_level',
        label: 'Nivel de Consistencia',
        type: 'select',
        required: true,
        options: [
          { value: 'BoundedStaleness', label: 'Bounded Staleness' },
          { value: 'ConsistentPrefix', label: 'Consistent Prefix' },
          { value: 'Eventual', label: 'Eventual' },
          { value: 'Session', label: 'Session' },
          { value: 'Strong', label: 'Strong' },
        ],
        defaultValue: 'Session',
        description: 'El nivel de consistencia por defecto para la cuenta.'
      },
      {
        key: 'max_interval_in_seconds',
        label: 'Max Interval (segundos)',
        type: 'number',
        min: 5,
        max: 86400,
        placeholder: '10',
        description: 'Para Bounded Staleness: máximo retraso permitido (5-86400).'
      },
      {
        key: 'max_staleness_prefix',
        label: 'Max Staleness Prefix',
        type: 'number',
        min: 10,
        max: 2147483647,
        placeholder: '200',
        description: 'Para Bounded Staleness: máximo número de versiones obsoletas (10-2147483647).'
      }
    ]
  },
  {
    key: 'geo_location', // Para simplificar, una sola geo-location. Se puede extender a un array.
    label: 'Configuración de Geo-Replicación Principal',
    type: 'group',
    required: true,
    fields: [
        {
            key: 'location',
            label: 'Ubicación de Replicación',
            type: 'text',
            required: true,
            placeholder: 'East US',
            description: 'La región de Azure para esta ubicación de replicación (debe coincidir con la ubicación principal para la primera).',
        },
        {
            key: 'failover_priority',
            label: 'Prioridad de Failover',
            type: 'number',
            required: true,
            min: 0,
            defaultValue: 0,
            description: 'Prioridad de failover para esta ubicación (0 es la más alta).'
        }
    ]
  },
  {
    key: 'enable_automatic_failover',
    label: 'Habilitar Failover Automático',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilita el failover automático para la cuenta.'
  },
  {
    key: 'is_virtual_network_filter_enabled',
    label: 'Habilitar Filtro de VNet',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita el filtro de red virtual.'
  },
  {
    key: 'public_network_access_enabled',
    label: 'Habilitar Acceso a Red Pública',
    type: 'boolean',
    defaultValue: true,
    description: 'Permite el acceso desde redes públicas.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=production,service=user-data',
    description: 'Tags para organizar la cuenta de Cosmos DB.'
  },
];
