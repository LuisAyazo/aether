import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureStorageShareFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del File Share',
    type: 'text',
    required: true,
    placeholder: 'myfileshare',
    description: 'El nombre del recurso compartido de Azure Files. Debe ser único dentro de la cuenta de almacenamiento.'
  },
  {
    key: 'storage_account_name',
    label: 'Nombre de la Cuenta de Almacenamiento',
    type: 'text',
    required: true,
    placeholder: 'mystorageaccount',
    description: 'El nombre de la cuenta de almacenamiento existente donde se creará el recurso compartido.'
  },
  // resource_group_name se infiere de la cuenta de almacenamiento.
  {
    key: 'quota',
    label: 'Cuota (GB)',
    type: 'number',
    required: true,
    min: 1,
    max: 102400, // 100 TiB para Premium, 5 TiB para Standard
    defaultValue: 50,
    description: 'La cuota máxima del recurso compartido en GB. Máx 5120 para Standard, 102400 para Premium.'
  },
  {
    key: 'access_tier',
    label: 'Nivel de Acceso (Premium)',
    type: 'select',
    options: [
      { value: '', label: 'N/A (para Standard)' },
      { value: 'TransactionOptimized', label: 'TransactionOptimized' },
      { value: 'Hot', label: 'Hot' },
      { value: 'Cool', label: 'Cool' },
    ],
    defaultValue: '',
    description: 'El nivel de acceso para recursos compartidos Premium. Dejar vacío para Standard.'
  },
  {
    key: 'enabled_protocol',
    label: 'Protocolo Habilitado',
    type: 'select',
    options: [
      { value: 'SMB', label: 'SMB' },
      { value: 'NFS', label: 'NFS' },
    ],
    defaultValue: 'SMB',
    description: 'El protocolo a habilitar en el recurso compartido (SMB o NFS).'
  },
  {
    key: 'metadata',
    label: 'Metadatos (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'department=IT,project=backup',
    description: 'Metadatos personalizados para el recurso compartido.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,costCenter=123',
    description: 'Tags para organizar el recurso compartido.'
  },
];
