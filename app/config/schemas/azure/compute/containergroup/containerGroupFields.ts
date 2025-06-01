import { FieldConfig } from '@/app/types/resourceConfig';

export const azureContainerGroupFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Grupo de Contenedores',
    type: 'text',
    required: true,
    placeholder: 'my-container-group',
    description: 'El nombre del Grupo de Contenedores.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el grupo de contenedores.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el grupo de contenedores.'
  },
  {
    key: 'os_type',
    label: 'Tipo de SO',
    type: 'select',
    required: true,
    options: [
      { value: 'Linux', label: 'Linux' },
      { value: 'Windows', label: 'Windows' },
    ],
    defaultValue: 'Linux',
    description: 'El tipo de sistema operativo para los contenedores en el grupo.'
  },
  {
    key: 'container', // Para simplificar, empezamos con un solo contenedor. Se puede extender a una lista.
    label: 'Configuración del Contenedor Principal',
    type: 'group',
    required: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre del Contenedor',
        type: 'text',
        required: true,
        placeholder: 'mycontainer',
        description: 'Nombre del contenedor dentro del grupo.'
      },
      {
        key: 'image',
        label: 'Imagen del Contenedor',
        type: 'text',
        required: true,
        placeholder: 'nginx:latest',
        description: 'La imagen de Docker a usar para el contenedor (ej. nginx, mcr.microsoft.com/azuredocs/aci-helloworld).'
      },
      {
        key: 'cpu',
        label: 'CPU Cores',
        type: 'number',
        required: true,
        min: 0.1,
        step: 0.1,
        defaultValue: 1.0,
        description: 'Número de cores de CPU asignados al contenedor.'
      },
      {
        key: 'memory',
        label: 'Memoria (GB)',
        type: 'number',
        required: true,
        min: 0.1,
        step: 0.1,
        defaultValue: 1.5,
        description: 'Cantidad de memoria en GB asignada al contenedor.'
      },
      {
        key: 'ports_protocol',
        label: 'Protocolo de Puerto',
        type: 'select',
        options: [
            { value: 'TCP', label: 'TCP' },
            { value: 'UDP', label: 'UDP' },
        ],
        defaultValue: 'TCP',
        description: 'Protocolo para el puerto expuesto (si aplica).'
      },
      {
        key: 'ports_port',
        label: 'Puerto a Exponer',
        type: 'number',
        min: 1,
        max: 65535,
        placeholder: '80',
        description: 'Puerto que el contenedor expone.'
      },
    ]
  },
  {
    key: 'ip_address_type',
    label: 'Tipo de Dirección IP',
    type: 'select',
    options: [
      { value: 'Public', label: 'Pública' },
      { value: 'Private', label: 'Privada' },
      { value: 'None', label: 'Ninguna (sin IP pública, requiere VNet)' },
    ],
    placeholder: 'Public',
    description: 'Tipo de dirección IP para el grupo de contenedores. "Private" requiere integración con VNet.'
  },
  {
    key: 'dns_name_label',
    label: 'Etiqueta de Nombre DNS (si IP Pública)',
    type: 'text',
    placeholder: 'myapp-aci',
    description: 'Etiqueta para el nombre DNS si se usa IP pública. Será parte del FQDN.'
  },
  {
    key: 'restart_policy',
    label: 'Política de Reinicio',
    type: 'select',
    options: [
        { value: 'Always', label: 'Siempre' },
        { value: 'OnFailure', label: 'En Caso de Fallo' },
        { value: 'Never', label: 'Nunca' },
    ],
    defaultValue: 'Always',
    description: 'Política de reinicio para los contenedores del grupo.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=test,app=mycontainerapp',
    description: 'Tags para organizar el grupo de contenedores.'
  },
];
