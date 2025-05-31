import { FieldConfig } from '@/app/types/resourceConfig';

export const cloudRunServiceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Servicio',
    type: 'text',
    required: true,
    placeholder: 'my-cloudrun-service',
    description: 'El nombre único para tu servicio de Cloud Run.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará el servicio.'
  },
  {
    key: 'location',
    label: 'Región',
    type: 'select',
    required: true,
    placeholder: 'us-central1',
    description: 'La región donde se desplegará el servicio de Cloud Run.',
    options: [
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
      { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
      { value: 'asia-northeast2', label: 'asia-northeast2 (Osaka)' },
      { value: 'asia-south1', label: 'asia-south1 (Mumbai)' },
      { value: 'asia-southeast1', label: 'asia-southeast1 (Singapore)' },
      { value: 'australia-southeast1', label: 'australia-southeast1 (Sydney)' },
      { value: 'europe-central2', label: 'europe-central2 (Warsaw)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'europe-west2', label: 'europe-west2 (London)' },
      { value: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
      { value: 'europe-west4', label: 'europe-west4 (Netherlands)' },
      { value: 'northamerica-northeast1', label: 'northamerica-northeast1 (Montreal)' },
      { value: 'southamerica-east1', label: 'southamerica-east1 (São Paulo)' },
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
    ],
    defaultValue: 'us-central1'
  },
  {
    key: 'image',
    label: 'Imagen del Contenedor',
    type: 'text',
    required: true,
    placeholder: 'gcr.io/my-project/my-image:latest',
    description: 'La URL completa de la imagen de contenedor a desplegar (ej. gcr.io, Artifact Registry).'
  },
  {
    key: 'port',
    label: 'Puerto del Contenedor',
    type: 'number',
    min: 1,
    max: 65535,
    defaultValue: 8080,
    description: 'Puerto en el que la aplicación dentro del contenedor escucha. Por defecto 8080.'
  },
  {
    key: 'allowUnauthenticated',
    label: 'Permitir Invocaciones No Autenticadas',
    type: 'boolean',
    defaultValue: false,
    description: 'Si es verdadero, permite el acceso público al servicio. Si es falso, requiere autenticación IAM.'
  },
  {
    key: 'cpu',
    label: 'CPU (vCPU)',
    type: 'select',
    defaultValue: '1',
    options: [
      { value: '1', label: '1 vCPU' },
      { value: '2', label: '2 vCPU' },
      { value: '4', label: '4 vCPU' },
      // Opciones para CPU "boost" o más cores si es necesario
    ],
    description: 'Cantidad de CPU asignada a cada instancia del contenedor.'
  },
  {
    key: 'memory',
    label: 'Memoria',
    type: 'select',
    defaultValue: '512Mi',
    options: [
      { value: '256Mi', label: '256 MiB' },
      { value: '512Mi', label: '512 MiB' },
      { value: '1Gi', label: '1 GiB' },
      { value: '2Gi', label: '2 GiB' },
      { value: '4Gi', label: '4 GiB' },
    ],
    description: 'Cantidad de memoria asignada a cada instancia del contenedor.'
  },
  {
    key: 'minInstances',
    label: 'Instancias Mínimas',
    type: 'number',
    min: 0,
    defaultValue: 0,
    description: 'Número mínimo de instancias. 0 para escalar a cero.'
  },
  {
    key: 'maxInstances',
    label: 'Instancias Máximas',
    type: 'number',
    min: 0, // 0 significa sin límite superior explícito, pero se recomienda establecer uno.
    defaultValue: 10,
    description: 'Número máximo de instancias. 0 para el límite por defecto de la plataforma.'
  },
];
