import { FieldConfig } from '@/app/types/resourceConfig';

export const awsEventBridgeRuleFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Regla',
    type: 'text',
    required: true,
    placeholder: 'my-eventbridge-rule',
    description: 'El nombre de la regla de EventBridge.'
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
    description: 'La región de AWS donde se creará la regla.'
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción de mi regla de EventBridge',
    description: 'Una descripción para la regla.'
  },
  {
    key: 'event_pattern',
    label: 'Patrón de Eventos (JSON)',
    type: 'textarea',
    placeholder: '{\n  "source": ["aws.ec2"],\n  "detail-type": ["EC2 Instance State-change Notification"]\n}',
    description: 'El patrón de eventos que coincide con los eventos entrantes. Debe ser un string JSON válido.'
  },
  {
    key: 'schedule_expression',
    label: 'Expresión de Programación',
    type: 'text',
    placeholder: 'cron(0 12 * * ? *) or rate(5 minutes)',
    description: 'La expresión de programación (ej. cron o rate). No se puede usar con event_pattern.'
  },
  {
    key: 'is_enabled',
    label: 'Habilitada',
    type: 'boolean',
    defaultValue: true,
    description: 'Indica si la regla está habilitada.'
  },
  {
    key: 'event_bus_name',
    label: 'Nombre del Bus de Eventos',
    type: 'text',
    placeholder: 'default',
    description: 'El nombre del bus de eventos a asociar con esta regla. Si se omite, se usa el bus por defecto.'
  },
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Team=event-handlers',
    description: 'Tags adicionales para la regla de EventBridge.'
  },
  // Nota: Para que una regla sea útil, se necesitan 'targets' (aws_cloudwatch_event_target),
  // que no se configuran directamente en el recurso 'aws_cloudwatch_event_rule'.
];
