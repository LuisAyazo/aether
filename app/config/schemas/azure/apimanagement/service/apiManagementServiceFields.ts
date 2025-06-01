import { FieldConfig } from '@/app/types/resourceConfig';

export const azureApiManagementServiceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Servicio API Management',
    type: 'text',
    required: true,
    placeholder: 'myapimservice',
    description: 'El nombre del servicio de API Management. Debe ser globalmente único.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el servicio.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el servicio de API Management.'
  },
  {
    key: 'publisher_name',
    label: 'Nombre del Publicador',
    type: 'text',
    required: true,
    placeholder: 'My Company',
    description: 'El nombre del publicador del servicio de API Management.'
  },
  {
    key: 'publisher_email',
    label: 'Email del Publicador',
    type: 'text', // Cambiado de 'email' a 'text'
    required: true,
    placeholder: 'admin@example.com',
    description: 'El correo electrónico del publicador.'
  },
  {
    key: 'sku_name',
    label: 'Nombre del SKU (Plan de tarifa)',
    type: 'select',
    required: true,
    options: [
      { value: 'Developer_1', label: 'Developer (1 unidad, sin SLA)' },
      { value: 'Basic_1', label: 'Basic (1 unidad)' },
      { value: 'Standard_1', label: 'Standard (1 unidad)' },
      { value: 'Premium_1', label: 'Premium (1 unidad)' },
      // Se pueden añadir más opciones con diferentes unidades si es necesario
    ],
    defaultValue: 'Developer_1',
    description: 'El SKU del servicio. Formato: Tier_Unidades. Ej: Developer_1, Standard_2.'
  },
  {
    key: 'virtual_network_type',
    label: 'Tipo de Red Virtual',
    type: 'select',
    options: [
      { value: 'None', label: 'None' },
      { value: 'External', label: 'External' },
      { value: 'Internal', label: 'Internal' },
    ],
    defaultValue: 'None',
    description: 'El tipo de integración con red virtual.'
  },
  // Si virtual_network_type no es 'None', se necesitarían campos para subnet_id.
  // Esto se puede manejar con lógica condicional en el formulario o añadiendo campos opcionales.
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,api_version=v1',
    description: 'Tags para organizar el servicio de API Management.'
  },
];
