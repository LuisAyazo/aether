import { FieldConfig } from "../../../../types/resourceConfig";

export const awsEcsServiceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Servicio ECS',
    type: 'text',
    required: true,
    placeholder: 'my-ecs-service',
    description: 'El nombre único para tu servicio ECS.'
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
    description: 'La región de AWS donde se creará el servicio ECS.'
  },
  {
    key: 'cluster_name', // O ARN del cluster
    label: 'Nombre o ARN del Cluster ECS',
    type: 'text',
    required: true,
    placeholder: 'my-ecs-cluster o arn:aws:ecs:region:account-id:cluster/name',
    description: 'El nombre corto o ARN completo del cluster ECS al que pertenece este servicio.'
  },
  {
    key: 'task_definition_arn', // O family:revision
    label: 'ARN de la Definición de Tarea',
    type: 'text',
    required: true,
    placeholder: 'arn:aws:ecs:region:account-id:task-definition/family:revision',
    description: 'El ARN completo (family:revision) o solo la familia de la definición de tarea a ejecutar.'
  },
  {
    key: 'desired_count',
    label: 'Número Deseado de Tareas',
    type: 'number',
    required: true,
    min: 0, // Puede ser 0 si se usa escalado
    defaultValue: 1,
    description: 'El número de instancias de la definición de tarea a ejecutar en el servicio.'
  },
  {
    key: 'launch_type',
    label: 'Tipo de Lanzamiento',
    type: 'select',
    options: [
      { value: 'EC2', label: 'EC2' },
      { value: 'FARGATE', label: 'Fargate' },
    ],
    // No defaultValue, depende de la configuración del cluster y task definition
    placeholder: 'EC2 o FARGATE',
    description: 'El tipo de lanzamiento para las tareas del servicio (EC2 o FARGATE). Si no se especifica, se usa el default del cluster.'
  },
  // Campos para Fargate (si launch_type es FARGATE)
  {
    key: 'fargate_subnets',
    label: 'Subredes para Fargate (IDs separados por coma)',
    type: 'text',
    placeholder: 'subnet-xxxxxxxx,subnet-yyyyyyyy',
    description: 'Requerido si launch_type es FARGATE. Lista de IDs de subred.'
  },
  {
    key: 'fargate_security_groups',
    label: 'Grupos de Seguridad para Fargate (IDs separados por coma)',
    type: 'text',
    placeholder: 'sg-xxxxxxxx,sg-yyyyyyyy',
    description: 'Opcional si launch_type es FARGATE. Lista de IDs de grupos de seguridad.'
  },
  {
    key: 'fargate_assign_public_ip',
    label: 'Asignar IP Pública (Fargate)',
    type: 'boolean',
    defaultValue: false, // O 'ENABLED'/'DISABLED' como string según la API
    description: 'Si se asigna IP pública a las tareas Fargate. Por defecto es DISABLED.'
  },
  // Campos para Load Balancer (simplificado)
  {
    key: 'load_balancer_target_group_arn',
    label: 'ARN del Target Group del Load Balancer',
    type: 'text',
    placeholder: 'arn:aws:elasticloadbalancing:region:account-id:targetgroup/name/id',
    description: 'ARN del Target Group para asociar con el servicio (opcional).'
  },
  {
    key: 'load_balancer_container_name',
    label: 'Nombre del Contenedor para Load Balancer',
    type: 'text',
    placeholder: 'my-app-container',
    description: 'Nombre del contenedor en la definición de tarea para asociar con el Target Group.'
  },
  {
    key: 'load_balancer_container_port',
    label: 'Puerto del Contenedor para Load Balancer',
    type: 'number',
    placeholder: '80',
    description: 'Puerto del contenedor para asociar con el Target Group.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=production,Application=my-app',
    description: 'Tags para el servicio ECS.'
  },
];
