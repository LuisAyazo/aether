import { FieldConfig } from '@/app/types/resourceConfig';

export const azureServiceBusNamespaceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Namespace de Service Bus',
    type: 'text',
    required: true,
    placeholder: 'myservicebusns',
    description: 'El nombre del namespace de Service Bus. Debe ser globalmente único.'
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
    description: 'La región de Azure donde se creará el namespace de Service Bus.'
  },
  {
    key: 'sku',
    label: 'SKU (Plan de tarifa)',
    type: 'select',
    required: true,
    options: [
      { value: 'Basic', label: 'Basic' },
      { value: 'Standard', label: 'Standard' },
      { value: 'Premium', label: 'Premium' },
    ],
    defaultValue: 'Standard',
    description: 'El plan de tarifa del namespace de Service Bus.'
  },
  {
    key: 'capacity',
    label: 'Capacidad (Premium SKU)',
    type: 'number',
    min: 1,
    max: 16, // Consultar documentación para límites actuales
    placeholder: '1',
    description: 'Número de unidades de mensajería para SKU Premium. Omitir para Basic/Standard.'
  },
  {
    key: 'zone_redundant',
    label: 'Zona Redundante (Premium SKU)',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita la redundancia de zona para SKU Premium en regiones soportadas.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,application=messaging',
    description: 'Tags para organizar el namespace de Service Bus.'
  },
];
