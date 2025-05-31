import { FieldConfig } from '@/app/types/resourceConfig';

export const gcpFirestoreDatabaseFields: FieldConfig[] = [
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará la base de datos Firestore.'
  },
  {
    key: 'name', // En Firestore, el nombre de la base de datos es "(default)" o un ID específico.
    label: 'Nombre de la Base de Datos',
    type: 'text',
    defaultValue: '(default)',
    placeholder: '(default) o un ID de base de datos',
    description: 'El nombre de la base de datos Firestore. Usualmente "(default)".'
  },
  {
    key: 'location_id',
    label: 'Ubicación',
    type: 'select',
    required: true,
    description: 'La ubicación de la base de datos Firestore. No se puede cambiar después de la creación.',
    options: [
      // Multi-regiones
      { value: 'nam5 (us-central)', label: 'nam5 (us-central) (Multi-región)' },
      { value: 'eur3 (europe-west)', label: 'eur3 (europe-west) (Multi-región)' },
      // Regiones
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
    ],
    defaultValue: 'nam5 (us-central)'
  },
  {
    key: 'type',
    label: 'Tipo de Base de Datos',
    type: 'select',
    required: true,
    options: [
      { value: 'FIRESTORE_NATIVE', label: 'Firestore en modo Nativo' },
      { value: 'DATASTORE_MODE', label: 'Firestore en modo Datastore' },
    ],
    defaultValue: 'FIRESTORE_NATIVE',
    description: 'El tipo de base de datos Firestore a crear.'
  },
  {
    key: 'delete_protection_state',
    label: 'Protección contra Eliminación',
    type: 'select',
    options: [
        { value: 'DELETE_PROTECTION_ENABLED', label: 'Habilitada' },
        { value: 'DELETE_PROTECTION_DISABLED', label: 'Deshabilitada' }
    ],
    defaultValue: 'DELETE_PROTECTION_DISABLED',
    description: 'Estado de la protección contra eliminación.'
  },
  // Firestore no tiene tantas opciones de configuración a nivel de "base de datos" como SQL.
  // Las reglas de seguridad, índices, etc., se manejan por separado.
];
