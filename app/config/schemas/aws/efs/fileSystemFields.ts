import { FieldConfig } from "../../../../types/resourceConfig";

export const awsEfsFileSystemFields: FieldConfig[] = [
  {
    key: 'name', // Usaremos 'name' para el tag Name y como parte del creation_token si no se especifica.
    label: 'Nombre del File System (Tag Name)',
    type: 'text',
    placeholder: 'my-efs-filesystem',
    description: 'Un nombre para el sistema de archivos, usado para el tag "Name".'
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
    description: 'La región de AWS donde se creará el EFS File System.'
  },
  {
    key: 'encrypted',
    label: 'Cifrado en Reposo',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilitar el cifrado de datos en reposo. Recomendado.'
  },
  {
    key: 'kms_key_id',
    label: 'ID de Clave KMS (Opcional)',
    type: 'text',
    placeholder: 'arn:aws:kms:us-east-1:123456789012:key/your-kms-key-id',
    description: 'El ARN de la clave KMS a usar para el cifrado. Si está vacío y el cifrado está habilitado, se usa una clave gestionada por AWS.'
    // condition: {
    //   field: 'encrypted',
    //   value: true,
    // } // Eliminada condición
  },
  {
    key: 'performance_mode',
    label: 'Modo de Rendimiento',
    type: 'select',
    options: [
      { value: 'generalPurpose', label: 'General Purpose' },
      { value: 'maxIO', label: 'Max I/O' },
    ],
    defaultValue: 'generalPurpose',
    description: 'El modo de rendimiento del sistema de archivos.'
  },
  {
    key: 'throughput_mode',
    label: 'Modo de Throughput',
    type: 'select',
    options: [
      { value: 'bursting', label: 'Bursting' },
      { value: 'provisioned', label: 'Provisioned' },
      { value: 'elastic', label: 'Elastic' } 
    ],
    defaultValue: 'bursting',
    description: 'El modo de throughput del sistema de archivos.'
  },
  {
    key: 'provisioned_throughput_in_mibps',
    label: 'Throughput Aprovisionado (MiB/s)',
    type: 'number',
    min: 1,
    placeholder: '100',
    description: 'El throughput aprovisionado en MiB/s. Solo aplica si el modo de throughput es "provisioned".'
    // condition: {
    //   field: 'throughput_mode',
    //   value: 'provisioned',
    // } // Eliminada condición
  },
  {
    key: 'lifecycle_policy',
    label: 'Política de Ciclo de Vida',
    type: 'select',
    options: [
        { value: 'NONE', label: 'Ninguna'},
        { value: 'AFTER_7_DAYS', label: 'Transición a Infrequent Access después de 7 días' },
        { value: 'AFTER_14_DAYS', label: 'Transición a Infrequent Access después de 14 días' },
        { value: 'AFTER_30_DAYS', label: 'Transición a Infrequent Access después de 30 días' },
        { value: 'AFTER_60_DAYS', label: 'Transición a Infrequent Access después de 60 días' },
        { value: 'AFTER_90_DAYS', label: 'Transición a Infrequent Access después de 90 días' },
    ],
    defaultValue: 'NONE',
    description: 'Configura la política de ciclo de vida para mover archivos a la clase de almacenamiento Infrequent Access (IA).'
  },
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Project=Alpha',
    description: 'Tags adicionales para el EFS File System. El tag "Name" se gestiona con el campo Nombre.'
  },
];
