import { FieldConfig } from '@/app/types/resourceConfig';

export const awsSqsQueueFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Cola',
    type: 'text',
    required: true,
    placeholder: 'my-queue',
    description: 'El nombre de la cola SQS. Si termina en .fifo, se creará una cola FIFO.'
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
    description: 'La región de AWS donde se creará la cola SQS.'
  },
  {
    key: 'fifo_queue',
    label: 'Cola FIFO',
    type: 'boolean', // Corregido de 'switch' a 'boolean'
    defaultValue: false,
    description: 'Especifica si la cola es FIFO (First-In-First-Out). Si es true, el nombre debe terminar en .fifo.'
  },
  {
    key: 'visibility_timeout_seconds',
    label: 'Timeout de Visibilidad (segundos)',
    type: 'number',
    min: 0,
    max: 43200, // 12 horas
    defaultValue: 30,
    description: 'El tiempo durante el cual un mensaje recibido permanece invisible para otros consumidores.'
  },
  {
    key: 'message_retention_seconds',
    label: 'Retención de Mensajes (segundos)',
    type: 'number',
    min: 60, // 1 minuto
    max: 1209600, // 14 días
    defaultValue: 345600, // 4 días
    description: 'El tiempo que SQS retiene un mensaje.'
  },
  {
    key: 'delay_seconds',
    label: 'Retraso de Entrega (segundos)',
    type: 'number',
    min: 0,
    max: 900, // 15 minutos
    defaultValue: 0,
    description: 'El tiempo para retrasar la entrega de cualquier mensaje nuevo añadido a la cola.'
  },
  {
    key: 'receive_wait_time_seconds',
    label: 'Tiempo de Espera de Recepción (segundos)',
    type: 'number',
    min: 0,
    max: 20,
    defaultValue: 0,
    description: 'El tiempo máximo que una llamada ReceiveMessage esperará a que llegue un mensaje (long polling).'
  },
  {
    key: 'content_based_deduplication',
    label: 'Deduplicación Basada en Contenido (FIFO)',
    type: 'boolean', // Corregido de 'switch' a 'boolean'
    defaultValue: false,
    description: 'Habilita la deduplicación basada en contenido. Solo para colas FIFO.'
  },
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Project=alpha',
    description: 'Tags adicionales para la cola SQS.'
  },
  // Se podrían añadir campos para dead-letter queue (redrive_policy), server-side encryption (kms_master_key_id, kms_data_key_reuse_period_seconds), etc.
];
