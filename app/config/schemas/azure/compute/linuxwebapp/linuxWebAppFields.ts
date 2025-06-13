import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureLinuxWebAppFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del App Service',
    type: 'text',
    required: true,
    placeholder: 'my-linux-app-service',
    description: 'El nombre globalmente único del App Service (Linux).'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el App Service.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el App Service.'
  },
  {
    key: 'service_plan_id',
    label: 'ID del Plan de App Service',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../resourceGroups/.../providers/Microsoft.Web/serverfarms/...',
    description: 'El ID del Plan de App Service existente que usará esta aplicación web.'
  },
  {
    key: 'site_config',
    label: 'Configuración del Sitio',
    type: 'group',
    fields: [
      {
        key: 'linux_fx_version',
        label: 'Versión de Linux Fx',
        type: 'text',
        placeholder: 'NODE|18-lts', // Ejemplos: "PYTHON|3.9", "DOTNETCORE|7.0", "JAVA|17-java17"
        description: 'Stack de runtime y versión (ej. NODE|18-lts, PYTHON|3.9).'
      },
      {
        key: 'always_on',
        label: 'Always On',
        type: 'boolean',
        defaultValue: false,
        description: 'Mantener la aplicación cargada incluso sin tráfico (requiere plan Basic o superior).'
      },
      {
        key: 'http2_enabled',
        label: 'HTTP/2 Habilitado',
        type: 'boolean',
        defaultValue: false,
        description: 'Habilitar el protocolo HTTP/2.'
      },
      {
        key: 'ftps_state',
        label: 'Estado de FTPS',
        type: 'select',
        options: [
            { value: 'AllAllowed', label: 'Todo Permitido' },
            { value: 'FtpsOnly', label: 'Solo FTPS' },
            { value: 'Disabled', label: 'Deshabilitado' },
        ],
        defaultValue: 'FtpsOnly',
        description: 'Estado del servicio FTPS.'
      }
    ]
  },
  {
    key: 'app_settings',
    label: 'Configuración de la Aplicación (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'DB_HOST=myhost,API_KEY=secretkey',
    description: 'Pares clave-valor para la configuración de la aplicación.'
  },
  {
    key: 'https_only',
    label: 'Solo HTTPS',
    type: 'boolean',
    defaultValue: true,
    description: 'Forzar todo el tráfico a través de HTTPS.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,app=webapp',
    description: 'Tags para organizar el App Service.'
  },
];
