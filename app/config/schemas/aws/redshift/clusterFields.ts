import { FieldConfig } from "../../../../types/resourceConfig";

export const awsRedshiftClusterFields: FieldConfig[] = [
  {
    key: 'cluster_identifier',
    label: 'Identificador del Cluster Redshift',
    type: 'text',
    required: true,
    placeholder: 'my-redshift-cluster',
    description: 'El identificador único para tu cluster Redshift. Debe ser en minúsculas y tener entre 1 y 63 caracteres.'
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
    description: 'La región de AWS donde se creará el cluster Redshift.'
  },
  {
    key: 'node_type',
    label: 'Tipo de Nodo',
    type: 'text',
    required: true,
    placeholder: 'dc2.large',
    description: 'El tipo de nodo a aprovisionar para el clúster (ej. dc2.large, ra3.xlplus).'
  },
  {
    key: 'number_of_nodes',
    label: 'Número de Nodos',
    type: 'number',
    min: 1, // Para single-node, 2+ para multi-node
    defaultValue: 1,
    description: 'El número de nodos de cómputo en el clúster. Mínimo 1 para single-node, 2 para multi-node.'
  },
  {
    key: 'master_username',
    label: 'Nombre de Usuario Maestro',
    type: 'text',
    required: true,
    placeholder: 'awsuser',
    description: 'El nombre de usuario para la cuenta maestra de la base de datos.'
  },
  {
    key: 'master_password',
    label: 'Contraseña Maestra',
    type: 'text', // Cambiado de 'password' a 'text'
    required: true,
    placeholder: 'Debe tener 8-64 caracteres, alfanuméricos, y al menos un número y una mayúscula.',
    description: 'La contraseña para la cuenta maestra. Cumplir con los requisitos de complejidad.'
  },
  {
    key: 'db_name',
    label: 'Nombre de la Base de Datos',
    type: 'text',
    placeholder: 'dev',
    description: 'El nombre de la base de datos inicial a crear en el clúster (opcional).'
  },
  {
    key: 'cluster_type',
    label: 'Tipo de Cluster',
    type: 'select',
    options: [
      { value: 'single-node', label: 'Single-node' },
      { value: 'multi-node', label: 'Multi-node' },
    ],
    defaultValue: 'single-node',
    description: 'El tipo de clúster a crear.'
  },
  {
    key: 'iam_roles', // ARN de roles IAM
    label: 'ARNs de Roles IAM (separados por coma)',
    type: 'textarea',
    placeholder: 'arn:aws:iam::123456789012:role/MyRedshiftRole1,arn:aws:iam::123456789012:role/MyRedshiftRole2',
    description: 'Lista de ARNs de roles IAM que el clúster puede asumir para acceder a otros servicios AWS.'
  },
  {
    key: 'publicly_accessible',
    label: 'Accesible Públicamente',
    type: 'boolean',
    defaultValue: false,
    description: 'Si el clúster es accesible públicamente. No recomendado para producción.'
  },
  {
    key: 'vpc_security_group_ids',
    label: 'IDs de Grupos de Seguridad VPC (separados por coma)',
    type: 'text',
    placeholder: 'sg-xxxxxxxx,sg-yyyyyyyy',
    description: 'Lista de IDs de grupos de seguridad VPC para asociar con este clúster.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,CostCenter=Analytics',
    description: 'Tags para el cluster Redshift.'
  },
];
