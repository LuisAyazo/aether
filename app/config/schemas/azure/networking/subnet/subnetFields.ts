import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureSubnetFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Subred',
    type: 'text',
    required: true,
    placeholder: 'my-subnet',
    description: 'El nombre de la subred.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde reside la VNet.'
  },
  {
    key: 'virtual_network_name',
    label: 'Nombre de la Red Virtual',
    type: 'text',
    required: true,
    placeholder: 'my-vnet',
    description: 'El nombre de la Red Virtual a la que pertenecerá esta subred.'
  },
  {
    key: 'address_prefixes',
    label: 'Prefijos de Dirección (CIDR)',
    type: 'text', // Podría ser un textarea para múltiples prefijos, pero Terraform espera una lista de strings.
    required: true,
    placeholder: '10.1.1.0/24',
    description: 'El bloque CIDR para la subred. Debe estar dentro del espacio de direcciones de la VNet.'
  },
  {
    key: 'service_endpoints',
    label: 'Service Endpoints (separados por coma, opcional)',
    type: 'text',
    placeholder: 'Microsoft.Storage,Microsoft.Sql',
    description: 'Lista de service endpoints a habilitar para esta subred.'
  },
  {
    key: 'private_endpoint_network_policies_enabled',
    label: 'Políticas de Red para Private Endpoint Habilitadas',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilita/deshabilita la aplicación de políticas de red en el private endpoint de esta subred.'
  },
  {
    key: 'private_link_service_network_policies_enabled',
    label: 'Políticas de Red para Private Link Service Habilitadas',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilita/deshabilita la aplicación de políticas de red en el private link service de esta subred.'
  },
  // Delegaciones y NSG/Route Table se manejan a menudo como asociaciones separadas o bloques más complejos.
];
