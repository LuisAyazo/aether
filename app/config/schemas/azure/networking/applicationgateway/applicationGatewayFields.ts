import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureApplicationGatewayFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Application Gateway',
    type: 'text',
    required: true,
    placeholder: 'my-app-gateway',
    description: 'El nombre del Application Gateway.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará.'
  },
  {
    key: 'sku_name',
    label: 'Nombre de SKU',
    type: 'select',
    options: [
      { value: 'Standard_Small', label: 'Standard Small' },
      { value: 'Standard_Medium', label: 'Standard Medium' },
      { value: 'Standard_Large', label: 'Standard Large' },
      { value: 'Standard_v2', label: 'Standard v2' },
      { value: 'WAF_Medium', label: 'WAF Medium' },
      { value: 'WAF_Large', label: 'WAF Large' },
      { value: 'WAF_v2', label: 'WAF v2' },
    ],
    defaultValue: 'Standard_v2',
    required: true,
    description: 'El nombre del SKU del Application Gateway.'
  },
  {
    key: 'sku_tier',
    label: 'Nivel de SKU',
    type: 'select',
    options: [
      { value: 'Standard', label: 'Standard' },
      { value: 'Standard_v2', label: 'Standard v2' },
      { value: 'WAF', label: 'WAF' },
      { value: 'WAF_v2', label: 'WAF v2' },
    ],
    defaultValue: 'Standard_v2',
    required: true,
    description: 'El nivel del SKU.'
  },
  {
    key: 'sku_capacity',
    label: 'Capacidad de SKU (para v1)',
    type: 'number',
    defaultValue: 2,
    min: 1,
    description: 'Número de instancias para SKU v1 (Standard/WAF). No aplica a v2.'
  },
  {
    key: 'gateway_ip_configuration_name',
    label: 'Nombre de Config. IP del Gateway',
    type: 'text',
    required: true,
    defaultValue: 'myGatewayIpConfig',
    description: 'Nombre para la configuración IP del gateway.'
  },
  {
    key: 'gateway_ip_configuration_subnet_id',
    label: 'ID de Subred para el Gateway',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../subnets/myAppGatewaySubnet',
    description: 'ID de la subred dedicada para el Application Gateway.'
  },
  {
    key: 'frontend_ip_configuration_name',
    label: 'Nombre de Config. IP Frontend',
    type: 'text',
    required: true,
    defaultValue: 'appGatewayFrontendIP',
    description: 'Nombre para la configuración IP del frontend.'
  },
  {
    key: 'frontend_port_name',
    label: 'Nombre del Puerto Frontend',
    type: 'text',
    required: true,
    defaultValue: 'httpPort',
    description: 'Nombre para el puerto frontend.'
  },
  {
    key: 'frontend_port_number',
    label: 'Número del Puerto Frontend',
    type: 'number',
    required: true,
    defaultValue: 80,
    min: 1,
    max: 65535,
    description: 'Puerto para el listener frontend (ej. 80 para HTTP).'
  },
  // Se omiten configuraciones más detalladas como backend pools, listeners, rules, etc.
  // para mantener el formulario inicial simple.
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=prod,service=web-app',
    description: 'Tags para organizar el Application Gateway.'
  },
];
