import { FieldConfig } from '@/app/types/resourceConfig';

export const azureVirtualNetworkFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Red Virtual',
    type: 'text',
    required: true,
    placeholder: 'my-vnet',
    description: 'El nombre de la red virtual.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará la red virtual.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará la red virtual.'
  },
  {
    key: 'address_space',
    label: 'Espacio de Direcciones (CIDR)',
    type: 'text',
    required: true,
    placeholder: '10.0.0.0/16',
    description: 'El bloque CIDR para la red virtual. Debe ser único y no superponerse con otras redes conectadas.'
  },
  {
    key: 'dns_servers',
    label: 'Servidores DNS (separados por coma, opcional)',
    type: 'text',
    placeholder: '10.0.0.4,10.0.0.5',
    description: 'Lista de direcciones IP de servidores DNS personalizados para esta VNet.'
  },
  {
    key: 'ddos_protection_plan_id',
    label: 'ID del Plan de Protección DDoS (opcional)',
    type: 'text',
    placeholder: '/subscriptions/.../ddosProtectionPlans/myDdosPlan',
    description: 'El ID del Plan de Protección DDoS Estándar a asociar con esta VNet.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,network=core',
    description: 'Tags para organizar la red virtual.'
  },
];
