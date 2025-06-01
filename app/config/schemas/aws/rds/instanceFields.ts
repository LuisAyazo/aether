import { FieldConfig } from '@/app/types/resourceConfig';

export const awsRdsInstanceFields: FieldConfig[] = [
  {
    key: 'identifier',
    label: 'Identificador de la Instancia DB',
    type: 'text',
    required: true,
    placeholder: 'my-rds-instance',
    description: 'El nombre único para tu instancia RDS. Debe ser único en tu cuenta AWS para la región especificada.'
  },
  {
    key: 'engine',
    label: 'Motor de Base de Datos',
    type: 'select',
    required: true,
    options: [
      { value: 'mysql', label: 'MySQL' },
      { value: 'postgres', label: 'PostgreSQL' },
      { value: 'mariadb', label: 'MariaDB' },
      { value: 'oracle-se2', label: 'Oracle SE2' },
      { value: 'sqlserver-ex', label: 'SQL Server Express' },
      { value: 'sqlserver-web', label: 'SQL Server Web' },
      { value: 'sqlserver-se', label: 'SQL Server Standard' },
      { value: 'sqlserver-ee', label: 'SQL Server Enterprise' },
    ],
    defaultValue: 'mysql',
    description: 'El motor de base de datos a utilizar.'
  },
  {
    key: 'engine_version',
    label: 'Versión del Motor',
    type: 'text',
    placeholder: '8.0.32 (para MySQL)',
    description: 'La versión del motor de base de datos (ej. 8.0.32 para MySQL, 15.3 para PostgreSQL). Dejar vacío para la última versión por defecto.'
  },
  {
    key: 'instance_class',
    label: 'Clase de Instancia',
    type: 'select',
    required: true,
    options: [
      // General Purpose
      { value: 'db.t3.micro', label: 'db.t3.micro (Desarrollo/Prueba)' },
      { value: 'db.t3.small', label: 'db.t3.small' },
      { value: 'db.m5.large', label: 'db.m5.large (Producción General)' },
      { value: 'db.m5.xlarge', label: 'db.m5.xlarge' },
      // Memory Optimized
      { value: 'db.r5.large', label: 'db.r5.large (Intensivo en Memoria)' },
      { value: 'db.r5.xlarge', label: 'db.r5.xlarge' },
    ],
    defaultValue: 'db.t3.micro',
    description: 'La clase de instancia computacional para la instancia RDS.'
  },
  {
    key: 'allocated_storage',
    label: 'Almacenamiento Asignado (GB)',
    type: 'number',
    required: true,
    min: 20, // Mínimo general, puede variar por motor
    defaultValue: 20,
    description: 'La cantidad de almacenamiento asignado en GB.'
  },
  {
    key: 'storage_type',
    label: 'Tipo de Almacenamiento',
    type: 'select',
    options: [
      { value: 'gp2', label: 'General Purpose SSD (gp2)' },
      { value: 'gp3', label: 'General Purpose SSD (gp3)' },
      { value: 'io1', label: 'Provisioned IOPS SSD (io1)' },
      { value: 'standard', label: 'Magnetic (standard)' },
    ],
    defaultValue: 'gp2',
    description: 'El tipo de almacenamiento para la instancia.'
  },
  {
    key: 'username',
    label: 'Nombre de Usuario Maestro',
    type: 'text',
    required: true,
    placeholder: 'admin',
    description: 'El nombre de usuario para la cuenta maestra de la base de datos.'
  },
  {
    key: 'password',
    label: 'Contraseña Maestra',
    type: 'text', // Tipo 'password' no existe, usar 'text' y advertir sobre seguridad
    required: true,
    placeholder: 'DebeTenerAlMenos8Caracteres',
    description: 'La contraseña para la cuenta maestra. ¡Asegúrate de que sea segura! (Se mostrará en texto plano en el código IaC si no se maneja como secreto).'
  },
  {
    key: 'db_name',
    label: 'Nombre de la Base de Datos Inicial',
    type: 'text',
    placeholder: 'mydatabase',
    description: 'El nombre de la base de datos inicial a crear (opcional, no todos los motores lo soportan en la creación inicial).'
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
    description: 'La región de AWS donde se creará la instancia RDS.'
  },
  {
    key: 'multi_az',
    label: 'Despliegue Multi-AZ',
    type: 'boolean',
    defaultValue: false,
    description: 'Especifica si la instancia RDS debe ser Multi-AZ para alta disponibilidad.'
  },
  {
    key: 'publicly_accessible',
    label: 'Accesible Públicamente',
    type: 'boolean',
    defaultValue: false,
    description: 'Especifica si la instancia DB debe tener una dirección IP pública.'
  },
  {
    key: 'skip_final_snapshot',
    label: 'Omitir Snapshot Final al Eliminar',
    type: 'boolean',
    defaultValue: false,
    description: 'Determina si se crea un snapshot final cuando se elimina la instancia. Recomendado false para producción.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=production,Application=billing',
    description: 'Tags para la instancia RDS.'
  },
];
