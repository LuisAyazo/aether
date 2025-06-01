import { FieldConfig } from '@/app/types/resourceConfig';

export const azureEventHubNamespaceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Namespace de Event Hubs',
    type: 'text',
    required: true,
    placeholder: 'myeventhubns',
    description: 'El nombre del namespace de Event Hubs. Debe ser globalmente único.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el namespace.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el namespace de Event Hubs.'
  },
  {
    key: 'sku',
    label: 'SKU (Plan de tarifa)',
    type: 'select',
    required: true,
    options: [
      { value: 'Basic', label: 'Basic' },
      { value: 'Standard', label: 'Standard' },
      { value: 'Premium', label: 'Premium' }, // Premium es para producción con más características
    ],
    defaultValue: 'Standard',
    description: 'El plan de tarifa del namespace de Event Hubs.'
  },
  {
    key: 'capacity',
    label: 'Capacidad (Throughput Units - Standard/Premium)',
    type: 'number',
    min: 1,
    // Max varía, ej. 40 para Standard, 16 para Premium (por PU)
    placeholder: '1', 
    description: 'Unidades de rendimiento. Para Standard y Premium. 1-40 para Standard.'
  },
  {
    key: 'auto_inflate_enabled',
    label: 'Auto-Inflate Habilitado (Standard/Premium)',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita el auto-escalado de unidades de rendimiento para SKU Standard o Premium.'
  },
  {
    key: 'maximum_throughput_units',
    label: 'Máximas Unidades de Rendimiento (Auto-Inflate)',
    type: 'number',
    min: 1,
    placeholder: '10',
    description: 'Máximo de unidades de rendimiento para auto-inflate. Requerido si auto_inflate_enabled es true.'
  },
  {
    key: 'zone_redundant',
    label: 'Zona Redundante (Premium SKU)',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita la redundancia de zona para SKU Premium en regiones soportadas.'
  },
  {
    key: 'kafka_enabled',
    label: 'Kafka Habilitado',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita el endpoint de Apache Kafka en el namespace.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,stream=logs',
    description: 'Tags para organizar el namespace de Event Hubs.'
  },
];
