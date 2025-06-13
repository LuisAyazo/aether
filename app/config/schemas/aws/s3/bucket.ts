import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsS3BucketFields } from './bucketFields';
import { generateAWSS3BucketTemplates } from './bucketTemplates';

// Esquema de validación para AWS S3 Bucket
export const awsS3BucketValidationSchema = z.object({
  bucket_name: z.string().min(3, "El nombre del bucket debe tener al menos 3 caracteres.")
    .max(63, "El nombre del bucket no puede exceder los 63 caracteres.")
    .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, "Nombre de bucket inválido. Solo minúsculas, números, puntos y guiones. No puede empezar ni terminar con punto o guion, ni ser una IP."),
  region: z.string().min(1, "La región es requerida."),
  acl: z.enum(['private', 'public-read', 'public-read-write', 'authenticated-read']).default('private'),
  versioning_enabled: z.boolean().default(false),
  force_destroy: z.boolean().default(false).describe("Solo para Terraform. Permite eliminar el bucket aunque tenga objetos."),
  tags: z.string().optional() // String en formato Key1=Value1,Key2=Value2
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(pair => /^[a-zA-Z0-9_.:/=+\-@ ]+=[^,]*$/.test(pair.trim()));
    }, {
      message: "Formato de tags inválido. Use Clave1=Valor1,Clave2=Valor2. Las claves pueden contener letras, números y los caracteres: espacio + - . : / = @ _ . Los valores pueden ser cualquier caracter excepto coma."
    }),
  // Para consistencia con ResourceValues, añadimos 'name' que será igual a bucket_name
  name: z.string().optional(), // Se poblará desde bucket_name
}).transform(data => ({
  ...data,
  name: data.bucket_name, // Asegurar que 'name' (usado por ResourceValues) tenga el valor de bucket_name
}));


// Tipo inferido de la configuración de S3 Bucket
export type AWSS3BucketConfig = z.infer<typeof awsS3BucketValidationSchema>;

// Valores por defecto para un nuevo S3 Bucket
export const defaultAWSS3BucketConfig: Partial<AWSS3BucketConfig> & { bucket_name: string, name: string } = {
  bucket_name: 'my-unique-s3-bucket',
  name: 'my-unique-s3-bucket', // Para cumplir con ResourceValues
  region: 'us-east-1',
  acl: 'private',
  versioning_enabled: false,
  force_destroy: false,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsS3BucketValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsS3BucketFields);
};

export const templates = (config: AWSS3BucketConfig): Promise<CodeTemplate> => {
  // Asegurarse de que el config que se pasa a las plantillas tenga 'name' si es necesario
  // o que las plantillas usen 'bucket_name'. Ya lo hacen.
  return Promise.resolve(generateAWSS3BucketTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  // Asegurar que el objeto devuelto sea compatible con Partial<ResourceValues>
  const defaultsToReturn: Partial<ResourceValues> = {
    name: defaultAWSS3BucketConfig.name, // 'name' es requerido por ResourceValues
    bucket_name: defaultAWSS3BucketConfig.bucket_name,
    region: defaultAWSS3BucketConfig.region,
    acl: defaultAWSS3BucketConfig.acl,
    versioning_enabled: defaultAWSS3BucketConfig.versioning_enabled,
    force_destroy: defaultAWSS3BucketConfig.force_destroy,
    // tags se deja como undefined si no se especifica
  };
  return Promise.resolve(defaultsToReturn);
};
