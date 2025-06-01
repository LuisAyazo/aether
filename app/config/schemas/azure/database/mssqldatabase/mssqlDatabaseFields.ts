import { FieldConfig } from '@/app/types/resourceConfig';

export const azureMsSqlDatabaseFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Base de Datos',
    type: 'text',
    required: true,
    placeholder: 'mydatabase',
    description: 'El nombre de la base de datos SQL. Debe ser único dentro del servidor SQL.'
  },
  {
    key: 'server_id', // Anteriormente server_name, cambiado a server_id para reflejar que es un ID de recurso
    label: 'ID del Servidor SQL',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../resourceGroups/.../providers/Microsoft.Sql/servers/myserver',
    description: 'El ID del recurso del servidor Azure SQL existente donde se creará la base de datos.'
  },
  // resource_group_name y location se infieren del servidor SQL, no son directos para la database.
  {
    key: 'collation',
    label: 'Collation',
    type: 'text',
    placeholder: 'SQL_Latin1_General_CP1_CI_AS',
    defaultValue: 'SQL_Latin1_General_CP1_CI_AS',
    description: 'La collation de la base de datos.'
  },
  {
    key: 'sku_name', // Para modelos DTU o vCore
    label: 'Nombre del SKU (Plan de tarifa)',
    type: 'text',
    placeholder: 'GP_Gen5_2 (vCore) o S0 (DTU)',
    description: 'El SKU de la base de datos. Ej: GP_Gen5_2 (General Purpose, Gen5, 2 vCores) o S0, S1, P1 (DTU).'
  },
  {
    key: 'max_size_gb',
    label: 'Tamaño Máximo (GB)',
    type: 'number',
    min: 1,
    placeholder: '10',
    description: 'El tamaño máximo de la base de datos en GB.'
  },
  {
    key: 'read_scale',
    label: 'Habilitar Escala de Lectura',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita réplicas de solo lectura (si el SKU lo soporta).'
  },
  {
    key: 'zone_redundant',
    label: 'Zona Redundante',
    type: 'boolean',
    defaultValue: false,
    description: 'Especifica si la base de datos es redundante entre zonas (si el SKU y la región lo soportan).'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,application=myapp',
    description: 'Tags para organizar la base de datos SQL.'
  },
];
