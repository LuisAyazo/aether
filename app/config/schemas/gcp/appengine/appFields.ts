import { FieldConfig } from '@/app/types/resourceConfig';

export const appEngineAppFields: FieldConfig[] = [
  {
    key: 'name', // Aunque App Engine usa el ID del proyecto, un nombre para el recurso Terraform es útil.
    label: 'Nombre del Recurso (Terraform)',
    type: 'text',
    required: true,
    placeholder: 'my-appengine-app',
    description: 'Nombre del recurso App Engine en la configuración IaC (no necesariamente el ID de la app).'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará la aplicación App Engine.'
  },
  {
    key: 'locationId',
    label: 'Región (Location ID)',
    type: 'select',
    required: true,
    placeholder: 'us-central',
    description: 'La región donde se desplegará la aplicación App Engine.',
    options: [
      { value: 'us-central', label: 'us-central (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
      { value: 'us-west2', label: 'us-west2 (Los Angeles)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'europe-west2', label: 'europe-west2 (London)' },
      { value: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
      { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
      { value: 'australia-southeast1', label: 'australia-southeast1 (Sydney)' },
    ],
    defaultValue: 'us-central'
  },
  {
    key: 'runtime',
    label: 'Entorno de Ejecución (Runtime)',
    type: 'select',
    required: true,
    description: 'El entorno de ejecución para la aplicación (ej. nodejs18, python311, java17).',
    options: [
      { value: 'nodejs18', label: 'Node.js 18 (Estándar)' },
      { value: 'python311', label: 'Python 3.11 (Estándar)' },
      { value: 'java17', label: 'Java 17 (Estándar)' },
      { value: 'go121', label: 'Go 1.21 (Estándar)' },
      { value: 'php82', label: 'PHP 8.2 (Estándar)' },
      { value: 'ruby32', label: 'Ruby 3.2 (Estándar)' },
      { value: 'dotnet6', label: 'ASP.NET Core 6.0 (Estándar)' },
      // Se pueden añadir más runtimes o runtimes flexibles
    ],
    defaultValue: 'nodejs18'
  },
  {
    key: 'serviceAccount',
    label: 'Cuenta de Servicio',
    type: 'text',
    placeholder: 'project-id@appspot.gserviceaccount.com',
    description: 'La cuenta de servicio que usará la aplicación App Engine. Por defecto, la del proyecto.'
  },
  {
    key: 'databaseType',
    label: 'Tipo de Base de Datos',
    type: 'select',
    options: [
        { value: '', label: 'Ninguna / No especificada' },
        { value: 'CLOUD_SQL_POSTGRESQL', label: 'Cloud SQL - PostgreSQL' },
        { value: 'CLOUD_SQL_MYSQL', label: 'Cloud SQL - MySQL' },
        { value: 'FIRESTORE_NATIVE', label: 'Firestore (Nativo)' },
        { value: 'FIRESTORE_DATASTORE_MODE', label: 'Firestore (Modo Datastore)' },
    ],
    description: 'Tipo de base de datos que usará la aplicación (opcional, informativo).'
  },
  {
    key: 'authDomain',
    label: 'Dominio de Autenticación',
    type: 'text',
    placeholder: 'example.com',
    description: 'Dominio de autenticación para IAP o Firebase Auth (opcional).'
  },
];
