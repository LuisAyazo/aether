import { FieldConfig } from "../../../../types/resourceConfig";

export const awsSnsTopicFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Tema',
    type: 'text',
    required: true,
    placeholder: 'my-sns-topic',
    description: 'El nombre del tema SNS. Si es un tema FIFO, el nombre debe terminar en .fifo.'
  },
  {
    key: 'region',
    label: 'Región de AWS',
    type: 'select',
    required: true,
    options: [
      { value: 'us-east-1', label: 'US East (N. Virginia) us-east-1' },
      { value: 'us-east-2', label: 'US East (Ohio) us-east-2' },
      { value: 'us-west-1', label: 'US West (N. California) us-west-1' },
      { value: 'us-west-2', label: 'US West (Oregon) us-west-2' },
      { value: 'eu-west-1', label: 'EU (Ireland) eu-west-1' },
      // Añadir más regiones según sea necesario
    ],
    defaultValue: 'us-east-1',
    description: 'La región de AWS donde se creará el tema SNS.'
  },
  {
    key: 'display_name',
    label: 'Nombre para Mostrar',
    type: 'text',
    placeholder: 'Mi Tema de Notificaciones',
    description: 'El nombre para mostrar del tema SNS (opcional).'
  },
  {
    key: 'fifo_topic',
    label: 'Tema FIFO',
    type: 'boolean',
    defaultValue: false,
    description: 'Especifica si el tema es FIFO. Si es true, el nombre debe terminar en .fifo.'
  },
  {
    key: 'content_based_deduplication',
    label: 'Deduplicación Basada en Contenido (FIFO)',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita la deduplicación basada en contenido. Solo para temas FIFO.'
  },
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Application=notifications',
    description: 'Tags adicionales para el tema SNS.'
  },
  // Se podrían añadir campos para políticas de acceso, KMS, etc.
];
