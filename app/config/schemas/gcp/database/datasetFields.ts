import { FieldConfig } from '@/app/types/resourceConfig';

export const gcpBigQueryDatasetFields: FieldConfig[] = [
  {
    key: 'dataset_id',
    label: 'ID del Dataset',
    type: 'text',
    required: true,
    placeholder: 'my_dataset',
    description: 'Un ID único para el dataset. Debe contener solo letras, números y guiones bajos.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará el dataset.'
  },
  {
    key: 'location',
    label: 'Ubicación de Datos',
    type: 'select',
    required: true,
    description: 'La ubicación geográfica donde se almacenarán los datos del dataset.',
    options: [
      { value: 'US', label: 'US (multi-región)' },
      { value: 'EU', label: 'EU (multi-región)' },
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      // Añadir más ubicaciones comunes de BigQuery
    ],
    defaultValue: 'US'
  },
  {
    key: 'friendly_name',
    label: 'Nombre Amigable',
    type: 'text',
    placeholder: 'My Application Dataset',
    description: 'Un nombre descriptivo para el dataset (opcional).'
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Dataset para analíticas de la aplicación X.',
    description: 'Una descripción más detallada del dataset (opcional).'
  },
  {
    key: 'default_table_expiration_ms',
    label: 'Expiración de Tabla por Defecto (ms)',
    type: 'number',
    min: 0,
    placeholder: '3600000', // 1 hora
    description: 'El tiempo de vida por defecto en milisegundos para las tablas creadas en este dataset (opcional).'
  },
  {
    key: 'default_partition_expiration_ms',
    label: 'Expiración de Partición por Defecto (ms)',
    type: 'number',
    min: 0,
    placeholder: '2592000000', // 30 días
    description: 'El tiempo de vida por defecto en milisegundos para las particiones en este dataset (opcional).'
  },
];
