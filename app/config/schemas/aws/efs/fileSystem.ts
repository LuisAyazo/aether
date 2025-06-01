import { z } from 'zod';
import { awsEfsFileSystemFields } from './fileSystemFields';
import { generateAWSEfsFileSystemTemplates } from './fileSystemTemplates';
import { ResourceSchema, ResourceTemplate, CodeTemplate } from '@/app/types/resourceConfig'; // Añadido CodeTemplate

// Define el esquema Zod para la configuración de un EFS File System
export const AWSEfsFileSystemSchema = z.object({
  name: z.string().optional().describe("Nombre del File System (Tag Name)"),
  region: z.string().min(1, "La región es obligatoria."),
  encrypted: z.boolean().optional().default(true),
  kms_key_id: z.string().optional().describe("ARN de la clave KMS para cifrado."),
  performance_mode: z.enum(['generalPurpose', 'maxIO']).optional().default('generalPurpose'),
  throughput_mode: z.enum(['bursting', 'provisioned', 'elastic']).optional().default('bursting'),
  provisioned_throughput_in_mibps: z.number().min(1).optional()
    .describe("Throughput aprovisionado en MiB/s (si throughput_mode es 'provisioned')."),
  lifecycle_policy: z.enum([
    'NONE', 'AFTER_7_DAYS', 'AFTER_14_DAYS', 'AFTER_30_DAYS', 'AFTER_60_DAYS', 'AFTER_90_DAYS'
  ]).optional().default('NONE'),
  tags: z.string().optional().describe("Tags adicionales en formato Clave1=Valor1,Clave2=Valor2"),
});

// Infiere el tipo TypeScript del esquema Zod
export type AWSEfsFileSystemConfig = z.infer<typeof AWSEfsFileSystemSchema>;

// Genera la configuración por defecto para un EFS File System
export function generateDefaultAWSEfsFileSystemConfig(): AWSEfsFileSystemConfig {
  return {
    region: 'us-east-1',
    encrypted: true,
    performance_mode: 'generalPurpose',
    throughput_mode: 'bursting',
    lifecycle_policy: 'NONE',
  };
}

// Genera el esquema del recurso EFS File System
export function generateAWSEfsFileSystemResourceSchema(): ResourceSchema {
  return {
    type: 'aws_efs_file_system',
    displayName: 'EFS File System',
    description: 'Crea un sistema de archivos elástico (EFS) en AWS para almacenamiento compartido.',
    category: 'Almacenamiento', // O la categoría que corresponda
    fields: awsEfsFileSystemFields, // Usa los campos definidos en fileSystemFields.ts
    templates: {
      default: generateDefaultAWSEfsFileSystemConfig() as unknown as ResourceTemplate,
      // Puedes añadir más plantillas preconfiguradas aquí si es necesario
    },
    documentation: {
      description: "El recurso aws_efs_file_system de Terraform permite gestionar un Amazon Elastic File System (EFS). EFS proporciona almacenamiento de archivos simple, escalable y elástico para usar con instancias EC2 de AWS en la nube de AWS y recursos on-premises.",
      examples: [
        `
resource "aws_efs_file_system" "example" {
  creation_token = "my-efs-example" # Opcional, para asegurar idempotencia
  encrypted      = true
  tags = {
    Name = "MyExampleEFS"
  }
}
        `,
      ],
    },
  };
}

// Genera un nombre único para el recurso EFS File System
export function generateAWSEfsFileSystemName(config: AWSEfsFileSystemConfig): string {
  // Usa el tag 'Name' si está definido, sino un nombre genérico
  return config.name || `efs-filesystem-${Math.random().toString(36).substring(2, 7)}`;
}

// Función principal para generar todas las plantillas de código
export interface AWSEfsFileSystemGeneratedCode {
  name: string;
  description: string;
  config: AWSEfsFileSystemConfig;
  codeTemplates: CodeTemplate;
}

export function generateAWSEfsFileSystemCode(config: AWSEfsFileSystemConfig): AWSEfsFileSystemGeneratedCode {
  const formattedConfig = { ...config }; // Usar config directamente por ahora
  // Aplicar valores por defecto manualmente si es necesario.
  // Zod ya aplica los defaults al parsear, pero si se llama sin parsear, podrían faltar.
  // Para mayor robustez, nos aseguramos que los campos con default() en Zod tengan valor.
  formattedConfig.encrypted = config.encrypted ?? true;
  formattedConfig.performance_mode = config.performance_mode ?? 'generalPurpose';
  formattedConfig.throughput_mode = config.throughput_mode ?? 'bursting';
  formattedConfig.lifecycle_policy = config.lifecycle_policy ?? 'NONE';


  return {
    name: generateAWSEfsFileSystemName(formattedConfig),
    description: formattedConfig.name || 'AWS EFS File System',
    config: formattedConfig,
    codeTemplates: generateAWSEfsFileSystemTemplates(formattedConfig), // Cambiado 'templates' a 'codeTemplates'
  };
}

// Define la exportación del recurso para el registro
const awsEfsFileSystemResource = {
  type: 'aws_efs_file_system',
  name: 'EFS File System',
  schema: AWSEfsFileSystemSchema,
  generateDefaultConfig: generateDefaultAWSEfsFileSystemConfig,
  generateResourceSchema: generateAWSEfsFileSystemResourceSchema,
  generateResourceName: generateAWSEfsFileSystemName,
  generateTemplates: generateAWSEfsFileSystemCode,
};

export default awsEfsFileSystemResource;
