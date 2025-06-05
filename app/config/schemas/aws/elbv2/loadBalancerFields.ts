import { FieldConfig } from '@/app/types/resourceConfig';

export const awsElbv2LoadBalancerFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Load Balancer',
    type: 'text',
    required: true,
    placeholder: 'my-app-lb',
    description: 'El nombre para tu Application Load Balancer. Puede tener hasta 32 caracteres, debe ser único dentro de la región para tu cuenta, y solo puede contener caracteres alfanuméricos y guiones.'
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
    ],
    defaultValue: 'us-east-1',
    description: 'La región de AWS donde se creará el Application Load Balancer.'
  },
  {
    key: 'internal',
    label: 'Interno',
    type: 'boolean',
    defaultValue: false,
    description: 'Especifica si el Load Balancer es interno (sin IP pública) o accesible desde internet.'
  },
  {
    key: 'load_balancer_type',
    label: 'Tipo de Load Balancer',
    type: 'select',
    required: true,
    options: [
      { value: 'application', label: 'Application (HTTP/HTTPS)' },
      // { value: 'network', label: 'Network (TCP/UDP/TLS)' }, // Podríamos añadir NLB más tarde
      // { value: 'gateway', label: 'Gateway (Geneve)' }, // Podríamos añadir GWLB más tarde
    ],
    defaultValue: 'application',
    description: 'El tipo de balanceador de carga. Actualmente solo "application" está completamente soportado aquí.'
  },
  {
    key: 'subnets',
    label: 'Subredes (IDs separados por coma)',
    type: 'text', // Usar text para una lista de IDs
    required: true,
    placeholder: 'subnet-xxxxxxxx,subnet-yyyyyyyy',
    description: 'Una lista de IDs de subred a adjuntar al Load Balancer. Deben ser de al menos dos Zonas de Disponibilidad diferentes.'
  },
  {
    key: 'security_groups',
    label: 'Grupos de Seguridad (IDs separados por coma)',
    type: 'text', // Usar text para una lista de IDs
    placeholder: 'sg-xxxxxxxx,sg-yyyyyyyy',
    description: 'Una lista de IDs de grupos de seguridad a adjuntar al Load Balancer (opcional).'
  },
  {
    key: 'enable_deletion_protection',
    label: 'Habilitar Protección contra Eliminación',
    type: 'boolean',
    defaultValue: false,
    description: 'Si es true, la protección contra eliminación está habilitada para el Load Balancer.'
  },
  {
    key: 'idle_timeout',
    label: 'Timeout de Inactividad (segundos)',
    type: 'number',
    min: 1,
    max: 4000,
    defaultValue: 60,
    description: 'El timeout de inactividad, en segundos (1-4000).'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=production,Owner=team-networking',
    description: 'Tags para el Application Load Balancer.'
  },
  // Campos simplificados para Listener y Target Group por ahora
  {
    key: 'listener_port',
    label: 'Puerto del Listener (HTTP/HTTPS)',
    type: 'number',
    defaultValue: 80,
    placeholder: '80 o 443',
    description: 'Puerto para el listener principal (ej. 80 para HTTP, 443 para HTTPS). Se creará un listener básico.'
  },
  {
    key: 'listener_protocol',
    label: 'Protocolo del Listener',
    type: 'select',
    options: [
      { value: 'HTTP', label: 'HTTP' },
      { value: 'HTTPS', label: 'HTTPS' },
    ],
    defaultValue: 'HTTP',
    description: 'Protocolo para el listener principal.'
  },
  {
    key: 'default_target_group_port',
    label: 'Puerto del Target Group por Defecto',
    type: 'number',
    defaultValue: 80,
    placeholder: '80',
    description: 'Puerto para el Target Group por defecto que se creará.'
  },
  {
    key: 'default_target_group_protocol',
    label: 'Protocolo del Target Group por Defecto',
    type: 'select',
    options: [
      { value: 'HTTP', label: 'HTTP' },
      { value: 'HTTPS', label: 'HTTPS' },
    ],
    defaultValue: 'HTTP',
    description: 'Protocolo para el Target Group por defecto.'
  },
];
