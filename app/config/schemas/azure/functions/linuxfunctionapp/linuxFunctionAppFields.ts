import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureLinuxFunctionAppFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Function App',
    type: 'text',
    required: true,
    placeholder: 'my-linux-function-app',
    description: 'El nombre globalmente único de la Function App (Linux).'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará la Function App.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará la Function App.'
  },
  {
    key: 'storage_account_name',
    label: 'Nombre de la Cuenta de Almacenamiento',
    type: 'text',
    required: true,
    placeholder: 'mystorageaccount',
    description: 'El nombre de la cuenta de almacenamiento Azure existente para usar con la Function App.'
  },
  {
    key: 'service_plan_id',
    label: 'ID del Plan de App Service',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../resourceGroups/.../providers/Microsoft.Web/serverfarms/...',
    description: 'El ID del Plan de App Service (Consumo, Premium, o Dedicado) existente.'
  },
  {
    key: 'site_config',
    label: 'Configuración del Sitio',
    type: 'group',
    fields: [
      {
        key: 'application_stack',
        label: 'Stack de Aplicación',
        type: 'group',
        fields: [
          {
            key: 'node_version',
            label: 'Versión de Node.js',
            type: 'text',
            placeholder: '~18',
            description: 'Versión de Node.js (ej. ~18, ~16). Solo si el runtime es Node.'
          },
          {
            key: 'python_version',
            label: 'Versión de Python',
            type: 'text',
            placeholder: '3.9',
            description: 'Versión de Python (ej. 3.9, 3.8). Solo si el runtime es Python.'
          },
          // Se pueden añadir otros runtimes como dotnet_version, java_version
        ]
      },
      {
        key: 'always_on',
        label: 'Always On',
        type: 'boolean',
        defaultValue: false,
        description: 'Mantener la aplicación cargada (no aplica a plan Consumo).'
      },
      {
        key: 'http2_enabled',
        label: 'HTTP/2 Habilitado',
        type: 'boolean',
        defaultValue: true,
        description: 'Habilitar el protocolo HTTP/2.'
      }
    ]
  },
  {
    key: 'app_settings',
    label: 'Configuración de la Aplicación (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'FUNCTIONS_WORKER_RUNTIME=node,AzureWebJobsStorage=DefaultEndpointsProtocol...',
    description: 'Pares clave-valor para la configuración de la aplicación. FUNCTIONS_WORKER_RUNTIME es crucial.'
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
    placeholder: 'environment=dev,app=functionapp',
    description: 'Tags para organizar la Function App.'
  },
];
