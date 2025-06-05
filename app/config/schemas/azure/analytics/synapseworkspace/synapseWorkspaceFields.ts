import { FieldConfig } from '@/app/types/resourceConfig';

export const azureSynapseWorkspaceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Workspace de Synapse',
    type: 'text',
    required: true,
    placeholder: 'mysynapseworkspace',
    description: 'El nombre del espacio de trabajo de Azure Synapse Analytics.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el workspace.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el workspace de Synapse.'
  },
  {
    key: 'storage_data_lake_gen2_filesystem_id',
    label: 'ID del Filesystem ADLS Gen2',
    type: 'text',
    required: true,
    placeholder: '/subscriptions/.../resourceGroups/.../providers/Microsoft.Storage/storageAccounts/.../blobServices/default/containers/...',
    description: 'El ID del recurso del filesystem de Azure Data Lake Storage Gen2 asociado.'
  },
  {
    key: 'sql_administrator_login',
    label: 'Login del Administrador SQL',
    type: 'text',
    required: true,
    placeholder: 'sqladminuser',
    description: 'El nombre de usuario para el administrador del pool SQL dedicado.'
  },
  {
    key: 'sql_administrator_login_password',
    label: 'Contraseña del Administrador SQL',
    type: 'password',
    required: true,
    placeholder: 'P@$$wOrd123!',
    description: 'La contraseña para el administrador del pool SQL dedicado.'
  },
  {
    key: 'managed_virtual_network_enabled',
    label: 'Habilitar Red Virtual Gestionada',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita una red virtual gestionada para el workspace.'
  },
  {
    key: 'public_network_access_enabled',
    label: 'Habilitar Acceso a Red Pública',
    type: 'boolean',
    defaultValue: true,
    description: 'Permite el acceso al workspace desde redes públicas.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=production,project=analytics',
    description: 'Tags para organizar el workspace de Synapse.'
  },
];
