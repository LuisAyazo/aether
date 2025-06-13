import { FieldConfig } from "../../../../types/resourceConfig";

export const gcpCloudTasksQueueFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Cola',
    type: 'text',
    required: true,
    placeholder: 'my-tasks-queue',
    description: 'El nombre de la cola de Cloud Tasks. Debe ser único dentro del proyecto y la ubicación.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    placeholder: 'gcp-project-id',
    description: 'El ID del proyecto GCP donde se creará la cola. Si se omite, se usa el del proveedor.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'us-central1',
    description: 'La ubicación de la cola (ej. us-central1).'
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Cola para procesar tareas en segundo plano.',
    description: 'Una descripción para la cola de Cloud Tasks.'
  },
  {
    key: 'rate_limits',
    label: 'Límites de Tasa',
    type: 'group',
    description: 'Configuración para los límites de tasa de procesamiento de la cola.',
    fields: [
      {
        key: 'max_dispatches_per_second',
        label: 'Máx. Despachos por Segundo',
        type: 'number',
        min: 0.001,
        placeholder: '500',
        description: 'El número máximo de tareas que se pueden despachar por segundo.'
      },
      {
        key: 'max_concurrent_dispatches',
        label: 'Máx. Despachos Concurrentes',
        type: 'number',
        min: 1,
        placeholder: '1000',
        description: 'El número máximo de tareas que se pueden despachar concurrentemente.'
      },
      {
        key: 'max_burst_size',
        label: 'Tamaño Máx. de Ráfaga',
        type: 'number',
        min: 1,
        description: 'El tamaño máximo de ráfaga para el bucket de tokens. Opcional.'
      }
    ]
  },
  {
    key: 'retry_config',
    label: 'Configuración de Reintentos',
    type: 'group',
    description: 'Configuración para los reintentos de tareas fallidas.',
    fields: [
      {
        key: 'max_attempts',
        label: 'Máx. Intentos',
        type: 'number',
        min: -1, // -1 para ilimitado
        placeholder: '100',
        description: 'Número máximo de intentos para una tarea. -1 para ilimitado.'
      },
      {
        key: 'max_retry_duration',
        label: 'Duración Máx. de Reintento (s)',
        type: 'text', // Formato "7s"
        placeholder: '3600s',
        description: 'Tiempo máximo durante el cual se reintentará una tarea (ej. "3600s").'
      },
      {
        key: 'min_backoff',
        label: 'Backoff Mínimo (s)',
        type: 'text',
        placeholder: '0.1s',
        description: 'Tiempo mínimo de espera antes de reintentar (ej. "0.1s").'
      },
      {
        key: 'max_backoff',
        label: 'Backoff Máximo (s)',
        type: 'text',
        placeholder: '3600s',
        description: 'Tiempo máximo de espera antes de reintentar (ej. "3600s").'
      },
      {
        key: 'max_doublings',
        label: 'Máx. Duplicaciones',
        type: 'number',
        min: 0,
        placeholder: '16',
        description: 'Número máximo de veces que el intervalo de backoff se duplicará.'
      }
    ]
  },
  // stackdriver_logging_config podría añadirse si se necesita control granular
];
