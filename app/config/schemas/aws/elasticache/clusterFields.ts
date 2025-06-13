import { FieldConfig } from "../../../../types/resourceConfig";

export const awsElastiCacheClusterFields: FieldConfig[] = [
  {
    key: 'cluster_id',
    label: 'ID del Cluster ElastiCache',
    type: 'text',
    required: true,
    placeholder: 'my-redis-cluster',
    description: 'El ID único para tu cluster ElastiCache. Debe tener entre 1 y 50 caracteres para Redis (cluster mode disabled) o 1-40 para Redis (cluster mode enabled).'
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
    description: 'La región de AWS donde se creará el cluster ElastiCache.'
  },
  {
    key: 'engine',
    label: 'Motor de Caché',
    type: 'select',
    required: true,
    options: [
      { value: 'redis', label: 'Redis' },
      { value: 'memcached', label: 'Memcached' },
    ],
    defaultValue: 'redis',
    description: 'El motor de caché a utilizar (redis o memcached).'
  },
  {
    key: 'node_type',
    label: 'Tipo de Nodo',
    type: 'text',
    required: true,
    placeholder: 'cache.t3.micro',
    description: 'El tipo de nodo de caché a aprovisionar para el clúster (ej. cache.t3.micro, cache.m5.large).'
  },
  {
    key: 'num_cache_nodes',
    label: 'Número de Nodos de Caché',
    type: 'number',
    required: true,
    min: 1,
    defaultValue: 1,
    description: 'El número de nodos de caché en el clúster. Para Redis (cluster mode enabled), este es el número de shards.'
  },
  {
    key: 'engine_version',
    label: 'Versión del Motor',
    type: 'text',
    placeholder: '6.x (para Redis) o 1.6.12 (para Memcached)',
    description: 'La versión del motor de caché (ej. 6.x para Redis). Si se omite, se usa la última versión estable.'
  },
  {
    key: 'parameter_group_name',
    label: 'Nombre del Grupo de Parámetros',
    type: 'text',
    placeholder: 'default.redis6.x o default.memcached1.6',
    description: 'El nombre del grupo de parámetros de caché a asociar con este clúster.'
  },
  {
    key: 'subnet_group_name',
    label: 'Nombre del Grupo de Subredes',
    type: 'text',
    placeholder: 'my-cache-subnet-group',
    description: 'El nombre del grupo de subredes de caché a utilizar para el clúster. Requerido si se despliega en una VPC.'
  },
  {
    key: 'security_group_ids',
    label: 'IDs de Grupos de Seguridad (separados por coma)',
    type: 'text',
    placeholder: 'sg-xxxxxxxx,sg-yyyyyyyy',
    description: 'Lista de IDs de grupos de seguridad de VPC para asociar con este clúster.'
  },
  // Campos específicos de Redis
  {
    key: 'port',
    label: 'Puerto (Redis/Memcached)',
    type: 'number',
    min: 1,
    max: 65535,
    placeholder: '6379 (Redis) o 11211 (Memcached)',
    description: 'El puerto en el que el motor de caché escuchará.'
  },
  {
    key: 'snapshot_retention_limit', // Específico de Redis
    label: 'Límite de Retención de Snapshots (Redis)',
    type: 'number',
    min: 0, // 0 deshabilita backups automáticos
    defaultValue: 0,
    description: 'Número de días para retener snapshots automáticos (solo Redis). 0 para deshabilitar.'
  },
  {
    key: 'snapshot_window', // Específico de Redis
    label: 'Ventana de Snapshot (Redis, formato HH:mm-HH:mm UTC)',
    type: 'text',
    placeholder: '04:00-05:00',
    description: 'La ventana de tiempo diaria (UTC) durante la cual se crean snapshots (solo Redis).'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Application=Cache',
    description: 'Tags para el cluster ElastiCache.'
  },
];
