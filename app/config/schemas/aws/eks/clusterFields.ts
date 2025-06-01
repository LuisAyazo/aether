import { FieldConfig } from '@/app/types/resourceConfig';

export const awsEksClusterFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Cluster EKS',
    type: 'text',
    required: true,
    placeholder: 'my-eks-cluster',
    description: 'El nombre único para tu cluster EKS. Debe tener entre 1 y 100 caracteres.'
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
    description: 'La región de AWS donde se creará el cluster EKS.'
  },
  {
    key: 'role_arn',
    label: 'ARN del Rol IAM del Cluster',
    type: 'text',
    required: true,
    placeholder: 'arn:aws:iam::123456789012:role/EKSClusterRole',
    description: 'El ARN del rol IAM que Kubernetes utilizará para crear recursos de AWS como Load Balancers.'
  },
  {
    key: 'vpc_config_subnet_ids',
    label: 'IDs de Subred para VPC Config (separados por coma)',
    type: 'text',
    required: true,
    placeholder: 'subnet-xxxxxxxx,subnet-yyyyyyyy',
    description: 'Una lista de IDs de subred para el plano de control del EKS. Deben ser de al menos dos Zonas de Disponibilidad.'
  },
  {
    key: 'vpc_config_security_group_ids',
    label: 'IDs de Grupos de Seguridad para VPC Config (separados por coma)',
    type: 'text',
    placeholder: 'sg-xxxxxxxx,sg-yyyyyyyy',
    description: 'Opcional. Lista de IDs de grupos de seguridad para el plano de control del EKS.'
  },
  {
    key: 'kubernetes_version',
    label: 'Versión de Kubernetes',
    type: 'text',
    placeholder: '1.29', // Ejemplo, el usuario debe verificar las versiones soportadas
    description: 'La versión deseada de Kubernetes para el cluster EKS (ej. 1.29). Si se omite, se usa la última soportada.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=production,Team=platform',
    description: 'Tags para el cluster EKS.'
  },
  // Campos simplificados para Node Group (opcional, pero común)
  {
    key: 'create_node_group',
    label: 'Crear Node Group por Defecto',
    type: 'boolean',
    defaultValue: true,
    description: 'Si se debe crear un grupo de nodos gestionado por defecto junto con el cluster.'
  },
  {
    key: 'node_group_name',
    label: 'Nombre del Node Group',
    type: 'text',
    placeholder: 'my-nodegroup',
    description: 'Nombre para el grupo de nodos gestionado (si se crea).'
  },
  {
    key: 'node_role_arn',
    label: 'ARN del Rol IAM del Node Group',
    type: 'text',
    placeholder: 'arn:aws:iam::123456789012:role/EKSNodeGroupRole',
    description: 'ARN del rol IAM para los nodos del grupo de nodos (si se crea).'
  },
  {
    key: 'node_group_instance_types',
    label: 'Tipos de Instancia del Node Group (separados por coma)',
    type: 'text',
    placeholder: 't3.medium,m5.large',
    defaultValue: 't3.medium',
    description: 'Lista de tipos de instancia para el grupo de nodos (si se crea).'
  },
  {
    key: 'node_group_min_size',
    label: 'Tamaño Mínimo del Node Group',
    type: 'number',
    min: 1,
    defaultValue: 1,
    description: 'Número mínimo de nodos en el grupo de nodos (si se crea).'
  },
  {
    key: 'node_group_max_size',
    label: 'Tamaño Máximo del Node Group',
    type: 'number',
    min: 1,
    defaultValue: 2,
    description: 'Número máximo de nodos en el grupo de nodos (si se crea).'
  },
  {
    key: 'node_group_desired_size',
    label: 'Tamaño Deseado del Node Group',
    type: 'number',
    min: 1,
    defaultValue: 1,
    description: 'Número deseado de nodos en el grupo de nodos (si se crea).'
  },
];
