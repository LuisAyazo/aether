import { FieldConfig } from '@/app/types/resourceConfig';

export const azureLinuxVirtualMachineScaleSetFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del VM Scale Set',
    type: 'text',
    required: true,
    placeholder: 'my-linux-vmss',
    description: 'El nombre del Conjunto de Escalado de Máquinas Virtuales Linux.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el VMSS.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el VMSS.'
  },
  {
    key: 'sku',
    label: 'SKU (Tamaño de VM)',
    type: 'text',
    required: true,
    placeholder: 'Standard_F2',
    description: 'El SKU de la máquina virtual para las instancias del conjunto de escalado (ej. Standard_F2, Standard_DS1_v2).'
  },
  {
    key: 'instances',
    label: 'Número de Instancias',
    type: 'number',
    required: true,
    min: 0,
    defaultValue: 2,
    description: 'El número inicial de instancias en el conjunto de escalado.'
  },
  {
    key: 'admin_username',
    label: 'Nombre de Usuario Admin',
    type: 'text',
    required: true,
    placeholder: 'azureuser',
    description: 'El nombre de usuario para la cuenta de administrador en cada instancia.'
  },
  {
    key: 'admin_ssh_key_public_key',
    label: 'Clave Pública SSH del Admin',
    type: 'textarea',
    // required: true, // Requerido si no se usa contraseña (no recomendado para Linux VMSS)
    placeholder: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD3...',
    description: 'La clave pública SSH para la autenticación del administrador.'
  },
  {
    key: 'network_interface_name_prefix',
    label: 'Prefijo Nombre Interfaz de Red',
    type: 'text',
    required: true,
    placeholder: 'nic-',
    description: 'Prefijo para los nombres de las interfaces de red de las instancias.'
  },
  {
    key: 'network_interface_ip_configuration_name',
    label: 'Nombre Configuración IP',
    type: 'text',
    required: true,
    placeholder: 'internal',
    description: 'Nombre para la configuración IP de la interfaz de red.'
  },
  {
    key: 'network_interface_subnet_id',
    label: 'ID de Subred',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../resourceGroups/.../providers/Microsoft.Network/virtualNetworks/.../subnets/...',
    description: 'El ID de la subred a la que se conectarán las interfaces de red.'
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
        ],
        defaultValue: 'Standard_LRS',
        description: 'El tipo de cuenta de almacenamiento para el disco del SO.'
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
        defaultValue: 'Canonical',
        description: 'El publisher de la imagen de la Marketplace.'
      },
      {
        key: 'offer',
        label: 'Offer de la Imagen',
        type: 'text',
        placeholder: 'UbuntuServer',
        defaultValue: 'UbuntuServer',
        description: 'La oferta de la imagen de la Marketplace.'
      },
      {
        key: 'sku',
        label: 'SKU de la Imagen',
        type: 'text',
        placeholder: '18.04-LTS',
        defaultValue: '18.04-LTS',
        description: 'El SKU de la imagen de la Marketplace.'
      },
      {
        key: 'version',
        label: 'Versión de la Imagen',
        type: 'text',
        placeholder: 'latest',
        defaultValue: 'latest',
        description: 'La versión de la imagen de la Marketplace.'
      }
    ]
  },
  {
    key: 'upgrade_mode',
    label: 'Modo de Actualización',
    type: 'select',
    options: [
        { value: 'Manual', label: 'Manual' },
        { value: 'Automatic', label: 'Automático' },
        { value: 'Rolling', label: 'Rolling' },
    ],
    defaultValue: 'Manual',
    description: 'Especifica el modo de actualización para las instancias del VMSS.'
  },
  {
    key: 'health_probe_id',
    label: 'ID de Health Probe (Opcional)',
    type: 'text',
    placeholder: '/subscriptions/.../providers/Microsoft.Network/loadBalancers/.../probes/...',
    description: 'El ID de un Application Gateway Backend Health Probe o Load Balancer Probe.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=prod,app=web-farm',
    description: 'Tags para organizar el VMSS.'
  },
];
