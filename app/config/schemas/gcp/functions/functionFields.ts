import { FieldConfig } from "../../../../types/resourceConfig";

export const cloudFunctionFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Función',
    type: 'text',
    required: true,
    placeholder: 'my-cloud-function',
    description: 'El nombre único para tu Cloud Function.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará la función.'
  },
  {
    key: 'region',
    label: 'Región',
    type: 'select',
    required: true,
    placeholder: 'us-central1',
    description: 'La región donde se desplegará la Cloud Function.',
    options: [
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'europe-west2', label: 'europe-west2 (London)' },
      { value: 'asia-east2', label: 'asia-east2 (Hong Kong)' },
      { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
    ],
    defaultValue: 'us-central1'
  },
  {
    key: 'runtime',
    label: 'Entorno de Ejecución (Runtime)',
    type: 'select',
    required: true,
    description: 'El entorno de ejecución para la función (ej. nodejs18, python39, go119).',
    options: [
      { value: 'nodejs18', label: 'Node.js 18' },
      { value: 'python39', label: 'Python 3.9' },
      { value: 'python310', label: 'Python 3.10' },
      { value: 'python311', label: 'Python 3.11' },
      { value: 'go119', label: 'Go 1.19' },
      { value: 'go120', label: 'Go 1.20' },
      { value: 'java11', label: 'Java 11' },
      { value: 'java17', label: 'Java 17' },
      { value: 'dotnet6', label: '.NET Core 6' },
      { value: 'ruby30', label: 'Ruby 3.0' },
    ],
    defaultValue: 'nodejs18'
  },
  {
    key: 'entryPoint',
    label: 'Punto de Entrada (Handler)',
    type: 'text',
    required: true,
    placeholder: 'handlerFunction',
    description: 'El nombre de la función exportada en tu código que se ejecutará.'
  },
  {
    key: 'triggerType',
    label: 'Tipo de Disparador (Trigger)',
    type: 'select',
    required: true,
    options: [
      { value: 'HTTP', label: 'HTTP Trigger' },
      { value: 'PUBSUB', label: 'Pub/Sub Trigger' },
      { value: 'STORAGE', label: 'Cloud Storage Trigger' },
      // Añadir más triggers según sea necesario
    ],
    defaultValue: 'HTTP',
    description: 'El tipo de evento que disparará la función.'
  },
  {
    key: 'triggerResource',
    label: 'Recurso del Disparador (si aplica)',
    type: 'text',
    placeholder: 'projects/my-project/topics/my-topic (para Pub/Sub)',
    description: 'El recurso específico para triggers como Pub/Sub o Storage (ej. nombre del topic o bucket).'
  },
  {
    key: 'availableMemoryMb',
    label: 'Memoria Disponible (MB)',
    type: 'select',
    defaultValue: '256',
    options: [
      { value: '128', label: '128 MB' },
      { value: '256', label: '256 MB' },
      { value: '512', label: '512 MB' },
      { value: '1024', label: '1024 MB (1GB)' },
      { value: '2048', label: '2048 MB (2GB)' },
    ],
    description: 'Cantidad de memoria asignada a la función.'
  },
  {
    key: 'timeout',
    label: 'Tiempo de Espera (Timeout)',
    type: 'text',
    placeholder: '60s',
    defaultValue: '60s',
    description: 'Tiempo máximo de ejecución de la función (ej. "60s", "540s").'
  },
  {
    key: 'sourceArchiveUrl',
    label: 'URL del Archivo Fuente (GCS)',
    type: 'text',
    placeholder: 'gs://my-bucket/source-archive.zip',
    description: 'URL a un archivo ZIP en Cloud Storage que contiene el código fuente.'
  },
];
