import { FieldConfig } from '@/app/types/resourceConfig';

export const azureVirtualMachineFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la VM',
    type: 'text',
    required: true,
    placeholder: 'my-azure-vm',
    description: 'El nombre de la Máquina Virtual.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará la VM.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará la VM.'
  },
  {
    key: 'size',
    label: 'Tamaño de la VM',
    type: 'text',
    required: true,
    placeholder: 'Standard_DS1_v2',
    description: 'El tamaño de la VM (ej. Standard_F2, Standard_DS1_v2).'
  },
  {
    key: 'admin_username',
    label: 'Nombre de Usuario Admin',
    type: 'text',
    required: true,
    placeholder: 'azureuser',
    description: 'El nombre de usuario para la cuenta de administrador.'
  },
  {
    key: 'admin_password',
    label: 'Contraseña de Admin',
    type: 'password',
    // required: true, // Requerido si no se usa ssh_key
    placeholder: 'P@$$w0rd123!',
    description: 'La contraseña para la cuenta de administrador. Alternativamente, usa claves SSH.'
  },
  {
    key: 'network_interface_ids',
    label: 'IDs de Interfaces de Red (separados por coma)',
    type: 'textarea',
    required: true,
    placeholder: '/subscriptions/.../nic1,/subscriptions/.../nic2',
    description: 'Una lista de IDs de las Interfaces de Red a adjuntar a esta VM.'
  },
  {
    key: 'os_disk',
    label: 'Disco del SO',
    type: 'group',
    required: true,
    fields: [
      {
        key: 'caching',
        label: 'Caching del Disco del SO',
        type: 'select',
        required: true,
        options: [
          { value: 'ReadWrite', label: 'ReadWrite' },
          { value: 'ReadOnly', label: 'ReadOnly' },
          { value: 'None', label: 'None' },
        ],
        defaultValue: 'ReadWrite',
        description: 'El tipo de caching para el disco del SO.'
      },
      {
        key: 'storage_account_type',
        label: 'Tipo de Cuenta de Almacenamiento del Disco del SO',
        type: 'select',
        required: true,
        options: [
          { value: 'Standard_LRS', label: 'Standard_LRS' },
          { value: 'StandardSSD_LRS', label: 'StandardSSD_LRS' },
          { value: 'Premium_LRS', label: 'Premium_LRS' },
          { value: 'StandardSSD_ZRS', label: 'StandardSSD_ZRS' },
          { value: 'Premium_ZRS', label: 'Premium_ZRS' },
        ],
        defaultValue: 'Standard_LRS',
        description: 'El tipo de cuenta de almacenamiento para el disco del SO.'
      },
      {
        key: 'managed_disk_type', // Alias para storage_account_type en algunas versiones/contextos
        label: 'Tipo de Disco Gestionado (alias)',
        type: 'hidden', // Opcional, para compatibilidad
      }
    ]
  },
  {
    key: 'source_image_reference',
    label: 'Referencia de Imagen de Origen',
    type: 'group',
    // required: true, // Requerido si no se usa source_image_id
    fields: [
      {
        key: 'publisher',
        label: 'Publisher de la Imagen',
        type: 'text',
        placeholder: 'Canonical',
        description: 'El publisher de la imagen de la Marketplace.'
      },
      {
        key: 'offer',
        label: 'Offer de la Imagen',
        type: 'text',
        placeholder: 'UbuntuServer',
        description: 'La oferta de la imagen de la Marketplace.'
      },
      {
        key: 'sku',
        label: 'SKU de la Imagen',
        type: 'text',
        placeholder: '18.04-LTS',
        description: 'El SKU de la imagen de la Marketplace.'
      },
      {
        key: 'version',
        label: 'Versión de la Imagen',
        type: 'text',
        placeholder: 'latest',
        description: 'La versión de la imagen de la Marketplace.'
      }
    ]
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,app=myapp',
    description: 'Tags para organizar la VM.'
  },
];
