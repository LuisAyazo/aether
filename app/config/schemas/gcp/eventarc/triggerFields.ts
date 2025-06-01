import { FieldConfig } from '@/app/types/resourceConfig';

export const gcpEventarcTriggerFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Trigger',
    type: 'text',
    required: true,
    placeholder: 'my-eventarc-trigger',
    description: 'El nombre del trigger de Eventarc. Debe ser único dentro del proyecto y la ubicación.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    placeholder: 'gcp-project-id',
    description: 'El ID del proyecto GCP donde se creará el trigger. Si se omite, se usa el del proveedor.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'us-central1',
    description: 'La ubicación donde se desplegará el trigger (ej. us-central1).'
  },
  {
    key: 'matching_criteria',
    label: 'Criterios de Coincidencia',
    type: 'group',
    required: true,
    description: 'Define los criterios para que el trigger se active.',
    fields: [
      {
        key: 'attribute',
        label: 'Atributo',
        type: 'text',
        required: true,
        placeholder: 'type',
        description: 'El atributo del evento a filtrar (ej. type, source, subject).'
      },
      {
        key: 'value',
        label: 'Valor del Atributo',
        type: 'text',
        required: true,
        placeholder: 'google.cloud.pubsub.topic.v1.messagePublished',
        description: 'El valor que debe tener el atributo para que el evento coincida.'
      },
      {
        key: 'operator',
        label: 'Operador (Opcional)',
        type: 'select',
        options: [
            { value: '', label: 'Igual (default)'},
            { value: 'match-path-pattern', label: 'Coincidencia de Patrón de Ruta'}
        ],
        defaultValue: '',
        description: 'Operador para la coincidencia. Por defecto es igualdad. "match-path-pattern" para usar patrones.'
      }
    ]
  },
  {
    key: 'destination',
    label: 'Destino del Evento',
    type: 'group',
    required: true,
    description: 'Configuración del destino al que se enviarán los eventos.',
    fields: [
      {
        key: 'cloud_run_service_name',
        label: 'Nombre del Servicio Cloud Run',
        type: 'text',
        placeholder: 'my-cloud-run-service',
        description: 'Nombre del servicio Cloud Run. Uno de los destinos debe ser especificado.'
      },
      {
        key: 'cloud_run_service_region',
        label: 'Región del Servicio Cloud Run (si es diferente)',
        type: 'text',
        placeholder: 'us-central1',
        description: 'Región del servicio Cloud Run, si es diferente a la del trigger.'
      },
      {
        key: 'cloud_run_service_path',
        label: 'Ruta del Servicio Cloud Run (Opcional)',
        type: 'text',
        placeholder: '/events',
        description: 'Ruta relativa en el servicio Cloud Run a la que se enviarán los eventos.'
      },
      {
        key: 'workflow_id',
        label: 'ID del Workflow (GCP Workflows)',
        type: 'text',
        placeholder: 'my-workflow-id',
        description: 'El ID del workflow de GCP Workflows que se ejecutará.'
      },
      // Se podrían añadir otros tipos de destino como GKE, Cloud Functions (2nd gen)
    ]
  },
  {
    key: 'service_account',
    label: 'Cuenta de Servicio (Email o uniqueId)',
    type: 'text',
    placeholder: 'my-eventarc-sa@my-project.iam.gserviceaccount.com',
    description: 'Cuenta de servicio que Eventarc usará para invocar el destino. Si se omite, usa la cuenta de servicio por defecto de Compute Engine.'
  },
  {
    key: 'event_data_content_type',
    label: 'Tipo de Contenido de Datos del Evento',
    type: 'select',
    options: [
        { value: 'application/json', label: 'application/json' },
        { value: 'application/protobuf', label: 'application/protobuf' },
    ],
    defaultValue: 'application/json',
    description: 'El tipo de contenido de los datos del evento (CloudEvents).'
  },
  {
    key: 'transport_topic_name',
    label: 'Nombre del Tema de Transporte Pub/Sub (Opcional)',
    type: 'text',
    placeholder: 'projects/my-project/topics/my-eventarc-topic',
    description: 'Tema de Pub/Sub gestionado por el servicio para el transporte de eventos. Si se omite, Eventarc crea y gestiona uno.'
  },
  {
    key: 'labels',
    label: 'Labels (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'env=dev,team=eventing',
    description: 'Labels para organizar el trigger.'
  },
];
