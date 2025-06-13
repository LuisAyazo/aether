import { FieldConfig } from "../../../../types/resourceConfig";

export const awsS3BucketFields: FieldConfig[] = [
  {
    key: 'bucket_name', // En Terraform es 'bucket', en Pulumi 'bucket'. Usaremos 'bucket_name' para consistencia interna.
    label: 'Nombre del Bucket',
    type: 'text',
    required: true,
    placeholder: 'my-unique-s3-bucket-name',
    description: 'El nombre globalmente único para tu bucket S3. Sigue las reglas de nombrado de S3.'
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
      // Añadir más regiones
    ],
    defaultValue: 'us-east-1',
    description: 'La región de AWS donde se creará el bucket. Para S3, la región es importante para la latencia y costos.'
  },
  {
    key: 'acl',
    label: 'ACL Predefinida',
    type: 'select',
    options: [
      { value: 'private', label: 'private (Recomendado)' },
      { value: 'public-read', label: 'public-read' },
      { value: 'public-read-write', label: 'public-read-write' },
      { value: 'authenticated-read', label: 'authenticated-read' },
    ],
    defaultValue: 'private',
    description: 'La Access Control List (ACL) predefinida para el bucket. Se recomienda "private" y usar políticas de bucket o IAM para control de acceso granular.'
  },
  {
    key: 'versioning_enabled',
    label: 'Habilitar Versionamiento',
    type: 'boolean',
    defaultValue: false,
    description: 'Habilita el versionamiento para mantener múltiples versiones de un objeto.'
  },
  {
    key: 'force_destroy',
    label: 'Forzar Destrucción',
    type: 'boolean',
    defaultValue: false,
    description: 'Permite la destrucción del bucket incluso si contiene objetos (¡Usar con precaución!). Solo para Terraform.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Project=data-lake',
    description: 'Tags para el bucket S3.'
  },
];
