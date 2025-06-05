import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from '@/app/types/resourceConfig';
import { awsRdsInstanceFields } from './instanceFields';
import { generateAWSRDSInstanceTemplates } from './instanceTemplates';

// Esquema de validación para AWS RDS Instance
export const awsRdsInstanceValidationSchema = z.object({
  identifier: z.string().min(1, "El identificador de la instancia es requerido.")
    .regex(/^[a-zA-Z][a-zA-Z0-9-]*$/, "Identificador inválido. Debe empezar con letra, seguido de letras, números o guiones.")
    .max(63, "El identificador no puede exceder los 63 caracteres.")
    .refine(val => !val.endsWith('-') && !val.includes('--'), "No puede terminar con guion ni contener dos guiones seguidos."),
  engine: z.string().min(1, "El motor de base de datos es requerido."),
  engine_version: z.string().optional(),
  instance_class: z.string().min(1, "La clase de instancia es requerida."),
  allocated_storage: z.number().int().min(5, "El almacenamiento mínimo es 5GB (varía por motor, ej. 20GB para SQL Server).").max(65536), // Max 64TB
  storage_type: z.string().optional().default('gp2'),
  username: z.string().min(1, "El nombre de usuario maestro es requerido.")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Nombre de usuario inválido. Debe empezar con letra o guion bajo, seguido de letras, números o guion bajo."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
    .regex(/^(?!.*[\/@"\s]).*$/, "La contraseña no puede contener '/', '@', '\"', o espacios."),
  db_name: z.string().optional(),
  region: z.string().min(1, "La región es requerida."),
  multi_az: z.boolean().optional().default(false),
  publicly_accessible: z.boolean().optional().default(false),
  skip_final_snapshot: z.boolean().optional().default(false),
  tags: z.string().optional()
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(pair => /^[a-zA-Z0-9_.:/=+\-@ ]+=[^,]*$/.test(pair.trim()));
    }, { message: "Formato de tags inválido." }),
  // Para consistencia con ResourceValues, añadimos 'name' que será igual a identifier
  name: z.string().optional(),
}).transform(data => ({
  ...data,
  name: data.identifier,
}));

// Tipo inferido de la configuración de RDS Instance
export type AWSRDSInstanceConfig = z.infer<typeof awsRdsInstanceValidationSchema>;

// Valores por defecto para una nueva RDS Instance
export const defaultAWSRDSInstanceConfig: Partial<AWSRDSInstanceConfig> & { identifier: string, name: string, engine: string, instance_class: string, allocated_storage: number, username: string, password: string } = {
  identifier: 'my-rds-db',
  name: 'my-rds-db',
  engine: 'mysql',
  instance_class: 'db.t3.micro',
  allocated_storage: 20,
  username: 'admin',
  password: 'ChangeMe123!', // Placeholder, el usuario debe cambiarlo
  region: 'us-east-1',
  multi_az: false,
  publicly_accessible: false,
  skip_final_snapshot: false,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsRdsInstanceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsRdsInstanceFields);
};

export const templates = (config: AWSRDSInstanceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSRDSInstanceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    name: defaultAWSRDSInstanceConfig.name, // 'name' es requerido por ResourceValues
    identifier: defaultAWSRDSInstanceConfig.identifier,
    engine: defaultAWSRDSInstanceConfig.engine,
    instance_class: defaultAWSRDSInstanceConfig.instance_class,
    allocated_storage: defaultAWSRDSInstanceConfig.allocated_storage,
    username: defaultAWSRDSInstanceConfig.username,
    password: defaultAWSRDSInstanceConfig.password,
    region: defaultAWSRDSInstanceConfig.region,
    multi_az: defaultAWSRDSInstanceConfig.multi_az,
    publicly_accessible: defaultAWSRDSInstanceConfig.publicly_accessible,
    skip_final_snapshot: defaultAWSRDSInstanceConfig.skip_final_snapshot,
    // Otros campos opcionales pueden ser undefined
  };
  return Promise.resolve(defaultsToReturn);
};
