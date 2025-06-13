import { AWSS3BucketConfig } from './bucket'; // Asumiremos que este tipo se definirá en bucket.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

// Helper function to parse tags from string "Key1=Value1,Key2=Value2" to object
const parseTagsString = (tagsString?: string): Record<string, string> => {
  if (!tagsString) return {};
  return tagsString.split(',').reduce((acc, tagPair) => {
    const [key, value] = tagPair.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

// Helper function to format tags for Terraform
const formatTerraformTags = (tags: Record<string, string>, baseIndent: string = '  '): string => {
  return Object.entries(tags)
    .map(([key, value]) => `${baseIndent}${baseIndent}"${key}" = "${value}"`)
    .join('\\n');
};

export function generateAWSS3BucketTemplates(config: AWSS3BucketConfig): CodeTemplate {
  const terraformResourceName = config.bucket_name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.bucket_name.replace(/-/g, ''); // Pulumi names often prefer no hyphens

  const parsedTags = parseTagsString(config.tags as string | undefined);

  const terraform = `
# Plantilla de Terraform para un Bucket S3 de AWS
# Proveedor de AWS - asegúrate de que esté configurado con la región correcta
provider "aws" {
  region = "${config.region}"
}

# Recurso para el bucket S3
resource "aws_s3_bucket" "${terraformResourceName}" {
  bucket = "${config.bucket_name}" # Nombre globalmente único del bucket
  acl    = "${config.acl}"         # ACL predefinida (ej. "private", "public-read")

  ${config.versioning_enabled ?
  `versioning {
    enabled = true
  }` :
  `versioning {
    enabled = false
  }`
  }

  # Forzar la destrucción del bucket si contiene objetos (¡usar con precaución!)
  # Esto es útil para entornos de desarrollo/prueba, pero peligroso en producción.
  ${config.force_destroy ? `force_destroy = true` : ''}

  # Tags para organizar y rastrear recursos
  tags = {
    Name        = "${config.bucket_name}" # Tag 'Name' es común para identificación
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }

  # Ejemplo de configuración de política de bucket (descomentar y ajustar según sea necesario)
  # policy = jsonencode({
  #   Version = "2012-10-17"
  #   Statement = [
  #     {
  #       Sid       = "PublicReadGetObject"
  #       Effect    = "Allow"
  #       Principal = "*"
  #       Action    = "s3:GetObject"
  #       Resource  = "arn:aws:s3:::${config.bucket_name}/*"
  #     },
  #   ]
  # })

  # Ejemplo de configuración de logging (descomentar y ajustar)
  # logging {
  #   target_bucket = "my-s3-logs-bucket" # Bucket donde se guardarán los logs
  #   target_prefix = "log/"              # Prefijo para los logs dentro del bucket de destino
  # }
}

# (Opcional) Recurso para la configuración de bloqueo de acceso público del bucket S3
# Se recomienda habilitar el bloqueo de acceso público para la mayoría de los buckets.
resource "aws_s3_bucket_public_access_block" "${terraformResourceName}_public_access_block" {
  bucket = aws_s3_bucket.${terraformResourceName}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Bucket S3 de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Crear un nuevo bucket S3
const ${pulumiResourceName}Bucket = new aws.s3.Bucket("${pulumiResourceName}", {
    bucket: "${config.bucket_name}", // Nombre globalmente único del bucket
    acl: "${config.acl}",             // ACL predefinida
    region: "${config.region}",       // Región donde se creará el bucket

    ${config.versioning_enabled ?
    `versioning: {
        enabled: true,
    },` :
    `versioning: {
        enabled: false,
    },`
    }

    // forceDestroy permite eliminar el bucket aunque contenga objetos.
    // ¡Usar con precaución! Ideal para desarrollo, no para producción.
    ${config.force_destroy ? `forceDestroy: true,` : ''}

    // Tags para el bucket
    tags: {
        Name: "${config.bucket_name}",
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },

    // Ejemplo de política de bucket (descomentar y ajustar)
    // policy: JSON.stringify({
    //     Version: "2012-10-17",
    //     Statement: [{
    //         Sid: "PublicReadGetObject",
    //         Effect: "Allow",
    //         Principal: "*",
    //         Action: ["s3:GetObject"],
    //         Resource: [pulumi.interpolate\`arn:aws:s3:::\${${pulumiResourceName}Bucket.id}/*\`],
    //     }],
    // }),

    // Ejemplo de configuración de logging (descomentar y ajustar)
    // loggings: [{
    //     targetBucket: "my-s3-logs-bucket-pulumi", // Bucket de destino para logs
    //     targetPrefix: "log/",
    // }],
});

// (Opcional) Configuración de bloqueo de acceso público para el bucket
// Se recomienda para la mayoría de los buckets.
const ${pulumiResourceName}PublicAccessBlock = new aws.s3.BucketPublicAccessBlock("${pulumiResourceName}PublicAccessBlock", {
    bucket: ${pulumiResourceName}Bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// Exportar el nombre del bucket
export const bucketName = ${pulumiResourceName}Bucket.id;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para un Bucket S3
AWSTemplateFormatVersion: '2010-09-09'
Description: Template para crear un bucket S3 ${config.bucket_name} en la región ${config.region}.

Resources:
  ${pulumiResourceName}S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: "${config.bucket_name}"
      AccessControl: ${config.acl === 'private' ? 'Private' : config.acl === 'public-read' ? 'PublicRead' : config.acl === 'public-read-write' ? 'PublicReadWrite' : 'AuthenticatedRead'}
      ${config.versioning_enabled ? 
      `VersioningConfiguration:
        Status: Enabled` : 
      `VersioningConfiguration:
        Status: Suspended`
      }
      # La propiedad ForceDestroy no existe directamente en CloudFormation. 
      # La eliminación de buckets con objetos se maneja a través de políticas de retención o scripts.

      # Tags para el bucket
      Tags:
        - Key: Name
          Value: "${config.bucket_name}"
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}
      
      # Ejemplo de configuración de logging (descomentar y ajustar)
      # LoggingConfiguration:
      #   DestinationBucketName: my-s3-logs-bucket-cfn # Bucket de destino
      #   LogFilePrefix: log/

      # Configuración de bloqueo de acceso público (recomendado)
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  BucketName:
    Description: "Nombre del bucket S3 creado"
    Value: !Ref ${pulumiResourceName}S3Bucket
  BucketARN:
    Description: "ARN del bucket S3 creado"
    Value: !GetAtt ${pulumiResourceName}S3Bucket.Arn
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS S3 Bucket (requiere community.aws.s3_bucket o amazon.aws.s3_bucket)
- name: Create S3 bucket ${config.bucket_name}
  amazon.aws.s3_bucket:
    name: "${config.bucket_name}"
    state: present
    region: "${config.region}"
    acl: "${config.acl}"
    versioning: ${config.versioning_enabled ? 'yes' : 'no'}
    # force_destroy no es un parámetro directo, la eliminación de buckets con contenido requiere pasos adicionales.
    tags:
      Name: "${config.bucket_name}"
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
  # delegate_to: localhost # Si se ejecuta desde una máquina de control sin credenciales de AWS directas
`,
    cloudformation
  };
}
