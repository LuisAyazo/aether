import { FieldConfig } from '@/app/types/resourceConfig';

export const azureEventGridTopicFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Tema de Event Grid',
    type: 'text',
    required: true,
    placeholder: 'myeventgridtopic',
    description: 'El nombre del tema de Event Grid. Debe ser globalmente único.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el tema.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el tema de Event Grid.'
  },
  {
    key: 'input_schema',
    label: 'Esquema de Entrada',
    type: 'select',
    options: [
      { value: 'EventGridSchema', label: 'EventGridSchema' },
      { value: 'CustomEventSchema', label: 'CustomEventSchema' },
      { value: 'CloudEventSchemaV1_0', label: 'CloudEventSchemaV1_0' },
    ],
    defaultValue: 'EventGridSchema',
    description: 'El esquema de entrada para los eventos publicados en este tema.'
  },
  {
    key: 'public_network_access_enabled',
    label: 'Acceso a Red Pública Habilitado',
    type: 'boolean',
    defaultValue: true,
    description: 'Indica si el acceso a la red pública está habilitado.'
  },
  {
    key: 'local_auth_enabled',
    label: 'Autenticación Local Habilitada',
    type: 'boolean',
    defaultValue: true,
    description: 'Indica si la autenticación local (clave de acceso) está habilitada.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,service=eventing',
    description: 'Tags para organizar el tema de Event Grid.'
  },
];
