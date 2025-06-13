import { FieldConfig } from "../../../../types/resourceConfig";

export const gcpStorageBucketFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Bucket',
    type: 'text',
    required: true,
    placeholder: 'my-unique-bucket-name',
    description: 'Nombre globalmente único para el bucket de Cloud Storage.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará el bucket.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'select',
    required: true,
    description: 'La ubicación geográfica donde se almacenarán los datos del bucket.',
    options: [
      { value: 'US', label: 'US (multi-región)' },
      { value: 'EU', label: 'EU (multi-región)' },
      { value: 'ASIA', label: 'ASIA (multi-región)' },
      { value: 'US-CENTRAL1', label: 'us-central1 (Iowa, región)' },
      { value: 'US-EAST1', label: 'us-east1 (South Carolina, región)' },
      { value: 'EUROPE-WEST1', label: 'europe-west1 (Belgium, región)' },
      // Añadir más regiones según sea necesario
    ],
    defaultValue: 'US-CENTRAL1'
  },
  {
    key: 'storage_class',
    label: 'Clase de Almacenamiento',
    type: 'select',
    required: true,
    defaultValue: 'STANDARD',
    options: [
      { value: 'STANDARD', label: 'Standard' },
      { value: 'NEARLINE', label: 'Nearline' },
      { value: 'COLDLINE', label: 'Coldline' },
      { value: 'ARCHIVE', label: 'Archive' },
    ],
    description: 'La clase de almacenamiento por defecto para los objetos en el bucket.'
  },
  {
    key: 'versioning',
    label: 'Control de Versiones',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilitar el control de versiones para los objetos del bucket.'
  },
  {
    key: 'uniform_bucket_level_access',
    label: 'Acceso Uniforme a Nivel de Bucket',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilita el acceso uniforme a nivel de bucket, deshabilitando las ACLs de objetos.'
  },
  {
    key: 'public_access_prevention',
    label: 'Prevención de Acceso Público',
    type: 'select',
    options: [
        { value: 'enforced', label: 'Forzado (Enforced)' },
        { value: 'inherited', label: 'Heredado (Inherited)' }
    ],
    defaultValue: 'inherited',
    description: 'Configura la prevención de acceso público.'
  },
  {
    key: 'lifecycle_rules',
    label: 'Reglas de Ciclo de Vida (JSON)',
    type: 'textarea',
    placeholder: '[{"action": {"type": "Delete"}, "condition": {"age": 30}}]',
    description: 'Define reglas de ciclo de vida en formato JSON. Ver documentación de GCP para la estructura.'
  },
];
