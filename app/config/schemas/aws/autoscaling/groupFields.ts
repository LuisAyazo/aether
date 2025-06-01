import { FieldConfig } from '@/app/types/resourceConfig';

export const awsAutoScalingGroupFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Auto Scaling Group',
    type: 'text',
    required: true,
    placeholder: 'my-asg',
    description: 'El nombre para tu Auto Scaling Group. Debe ser único dentro de la región para tu cuenta.'
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
    description: 'La región de AWS donde se creará el Auto Scaling Group.'
  },
  {
    key: 'launch_configuration_name',
    label: 'Nombre de Launch Configuration',
    type: 'text',
    // required: true, // Puede usarse launch_template en su lugar
    placeholder: 'my-launch-config',
    description: 'El nombre de la Launch Configuration a usar. (Alternativa: Launch Template ID/Name).'
  },
  {
    key: 'launch_template_id',
    label: 'ID de Launch Template',
    type: 'text',
    placeholder: 'lt-xxxxxxxxxxxxxxxxx',
    description: 'El ID de la Launch Template a usar. (Alternativa: Launch Configuration Name o Launch Template Name).'
  },
  {
    key: 'launch_template_name',
    label: 'Nombre de Launch Template',
    type: 'text',
    placeholder: 'my-launch-template',
    description: 'El nombre de la Launch Template a usar. (Alternativa: Launch Configuration Name o Launch Template ID).'
  },
  {
    key: 'min_size',
    label: 'Tamaño Mínimo',
    type: 'number',
    required: true,
    min: 0,
    defaultValue: 1,
    description: 'El número mínimo de instancias en el grupo.'
  },
  {
    key: 'max_size',
    label: 'Tamaño Máximo',
    type: 'number',
    required: true,
    min: 1,
    defaultValue: 1,
    description: 'El número máximo de instancias en el grupo.'
  },
  {
    key: 'desired_capacity',
    label: 'Capacidad Deseada',
    type: 'number',
    min: 0,
    // No defaultValue, a menudo se establece igual a min_size o se gestiona por políticas.
    description: 'El número deseado de instancias. Si no se especifica, ASG lo establece igual a min_size.'
  },
  {
    key: 'vpc_zone_identifier', // Para Terraform y Pulumi, es una lista de IDs de subred
    label: 'Subredes (IDs separados por coma)',
    type: 'text',
    required: true,
    placeholder: 'subnet-xxxxxxxx,subnet-yyyyyyyy',
    description: 'Una lista de IDs de subred para las instancias del grupo. Las instancias se distribuirán entre estas subredes/AZs.'
  },
  {
    key: 'target_group_arns',
    label: 'ARNs de Target Groups (separados por coma)',
    type: 'text',
    placeholder: 'arn:aws:elasticloadbalancing:region:account-id:targetgroup/name/id,...',
    description: 'Lista de ARNs de Target Groups de ELB a los que adjuntar las instancias (opcional).'
  },
  {
    key: 'health_check_type',
    label: 'Tipo de Health Check',
    type: 'select',
    options: [
      { value: 'EC2', label: 'EC2 (Predeterminado)' },
      { value: 'ELB', label: 'ELB (si está asociado a un ELB)' },
    ],
    defaultValue: 'EC2',
    description: 'El tipo de health checks a realizar (EC2 o ELB).'
  },
  {
    key: 'health_check_grace_period',
    label: 'Período de Gracia del Health Check (segundos)',
    type: 'number',
    min: 0,
    defaultValue: 300,
    description: 'Tiempo que ASG espera después de lanzar una instancia antes de verificar su estado de salud.'
  },
  {
    key: 'tags', // Los tags en ASG se propagan a las instancias
    label: 'Tags (formato: K1=V1,K2=V2,propagate_at_launch=true/false)',
    type: 'textarea',
    placeholder: 'Environment=dev,Role=webserver,propagate_at_launch=true',
    description: 'Tags para el Auto Scaling Group. Añade ",propagate_at_launch=true" a un tag para que se propague a las instancias.'
  },
];
