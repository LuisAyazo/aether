import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureNetworkSecurityGroupFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Network Security Group',
    type: 'text',
    required: true,
    placeholder: 'my-nsg',
    description: 'El nombre del Network Security Group (NSG).'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el NSG.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el NSG.'
  },
  // Las reglas de seguridad (security_rule) son bloques complejos.
  // Se podrían añadir como un campo 'textarea' para JSON o manejar por separado.
  // Por simplicidad, no se incluyen reglas por defecto en este formulario básico.
  // El usuario puede añadirlas directamente en el código IaC generado.
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,tier=frontend',
    description: 'Tags para organizar el Network Security Group.'
  },
];
