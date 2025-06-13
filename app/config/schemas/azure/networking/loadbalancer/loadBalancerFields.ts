import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureLoadBalancerFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Load Balancer',
    type: 'text',
    required: true,
    placeholder: 'my-azure-lb',
    description: 'El nombre del Azure Load Balancer.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el Load Balancer.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el Load Balancer.'
  },
  {
    key: 'sku',
    label: 'SKU',
    type: 'select',
    options: [
      { value: 'Basic', label: 'Basic' },
      { value: 'Standard', label: 'Standard' },
      // { value: 'Gateway', label: 'Gateway' } // SKU para Gateway Load Balancer
    ],
    defaultValue: 'Standard',
    required: true,
    description: 'El SKU del Load Balancer. Standard es recomendado para producción.'
  },
  {
    key: 'sku_tier',
    label: 'Nivel de SKU (para Standard)',
    type: 'select',
    options: [
      { value: 'Regional', label: 'Regional' },
      { value: 'Global', label: 'Global (para balanceo de carga cross-region)' },
    ],
    defaultValue: 'Regional',
    required: false, // Solo aplica a Standard, pero Terraform lo infiere o requiere.
    description: 'El nivel del SKU Standard. Regional es el más común.'
  },
  {
    key: 'frontend_ip_configuration_name',
    label: 'Nombre de Configuración IP Frontend',
    type: 'text',
    required: true,
    placeholder: 'myFrontendIpConfig',
    defaultValue: 'PublicIPAddress',
    description: 'Nombre para la configuración IP del frontend.'
  },
  {
    key: 'public_ip_address_id',
    label: 'ID de Public IP Address (opcional)',
    type: 'text',
    placeholder: '/subscriptions/.../publicIPAddresses/myPublicIp',
    description: 'ID de una Public IP Address existente para asociar. Si se omite, se puede crear una nueva (requiere más config).'
  },
  // Backend pools, health probes, y load balancing rules son configuraciones más complejas
  // que se omiten para este formulario básico. Se pueden añadir en el código IaC.
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,app=myapp',
    description: 'Tags para organizar el Load Balancer.'
  },
];
