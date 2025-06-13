import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureFirewallFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Firewall',
    type: 'text',
    required: true,
    placeholder: 'my-azure-firewall',
    description: 'El nombre del Azure Firewall.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el Firewall.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el Firewall.'
  },
  {
    key: 'sku_name',
    label: 'Nombre de SKU',
    type: 'select',
    options: [
      { value: 'AZFW_VNet', label: 'AZFW_VNet (Firewall Estándar en VNet)' },
      { value: 'AZFW_Hub', label: 'AZFW_Hub (Firewall en Virtual WAN Hub)' },
    ],
    defaultValue: 'AZFW_VNet',
    required: true,
    description: 'El nombre del SKU del Azure Firewall.'
  },
  {
    key: 'sku_tier',
    label: 'Nivel de SKU',
    type: 'select',
    options: [
      { value: 'Standard', label: 'Standard' },
      { value: 'Premium', label: 'Premium' },
      // { value: 'Basic', label: 'Basic' } // Basic SKU es más reciente
    ],
    defaultValue: 'Standard',
    required: true,
    description: 'El nivel del SKU del Azure Firewall (Standard, Premium).'
  },
  {
    key: 'firewall_policy_id',
    label: 'ID de Firewall Policy (opcional)',
    type: 'text',
    placeholder: '/subscriptions/.../firewallPolicies/myFirewallPolicy',
    description: 'ID de una Azure Firewall Policy existente. Si se omite, se pueden configurar reglas directamente (más complejo).'
  },
  {
    key: 'ip_configuration_name',
    label: 'Nombre de Configuración IP',
    type: 'text',
    required: true,
    defaultValue: 'azureFirewallIpConfiguration',
    description: 'Nombre para la configuración IP del firewall.'
  },
  {
    key: 'ip_configuration_subnet_id',
    label: 'ID de Subred para el Firewall (AzureFirewallSubnet)',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../subnets/AzureFirewallSubnet',
    description: 'ID de la subred dedicada para el Azure Firewall (debe llamarse AzureFirewallSubnet).'
  },
  {
    key: 'public_ip_address_id',
    label: 'ID de Public IP Address (opcional)',
    type: 'text',
    placeholder: '/subscriptions/.../publicIPAddresses/myFirewallPip',
    description: 'ID de una Public IP Address existente. Si se omite, se puede crear una nueva (requiere más config).'
  },
  // Reglas de aplicación, red y NAT son configuraciones complejas
  // que se omiten para este formulario básico si no se usa una Firewall Policy.
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=prod,security=high',
    description: 'Tags para organizar el Firewall.'
  },
];
