import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsDynamoDBTableFields } from './tableFields';
import { generateAWSDynamoDBTableTemplates } from './tableTemplates';

// Esquema de validación para AWS DynamoDB Table
export const awsDynamoDBTableValidationSchema = z.object({
  name: z.string().min(3, "El nombre de la tabla debe tener al menos 3 caracteres.")
    .max(255, "El nombre de la tabla no puede exceder los 255 caracteres.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Nombre de tabla inválido. Solo letras, números, y los caracteres: _ . -"),
  region: z.string().min(1, "La región es requerida."),
  billing_mode: z.enum(['PROVISIONED', 'PAY_PER_REQUEST']).default('PAY_PER_REQUEST'),
  read_capacity: z.number().int().min(1).optional(),
  write_capacity: z.number().int().min(1).optional(),
  hash_key: z.string().min(1, "La clave de partición (hash key) es requerida."),
  hash_key_type: z.enum(['S', 'N', 'B']),
  range_key: z.string().optional(),
  range_key_type: z.enum(['S', 'N', 'B']).optional(),
  stream_enabled: z.boolean().optional().default(false),
  stream_view_type: z.enum(['NEW_IMAGE', 'OLD_IMAGE', 'NEW_AND_OLD_IMAGES', 'KEYS_ONLY']).optional(),
  tags: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.billing_mode === 'PROVISIONED') {
    if (data.read_capacity === undefined || data.read_capacity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La capacidad de lectura es requerida y debe ser al menos 1 para el modo PROVISIONED.",
        path: ['read_capacity'],
      });
    }
    if (data.write_capacity === undefined || data.write_capacity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La capacidad de escritura es requerida y debe ser al menos 1 para el modo PROVISIONED.",
        path: ['write_capacity'],
      });
    }
  }
  // Validación para range_key y range_key_type
  if (data.range_key && !data.range_key_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El tipo de la clave de ordenación (Range Key Type) es requerido si se especifica una clave de ordenación (Range Key).",
      path: ['range_key_type'],
    });
  }
  if (!data.range_key && data.range_key_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "No se debe especificar un tipo de clave de ordenación si no se proporciona una clave de ordenación.",
      path: ['range_key_type'], // O path: ['range_key'] si se prefiere que el error aparezca en el campo de la clave
    });
  }
  // Validación para stream_enabled y stream_view_type
  if (data.stream_enabled && !data.stream_view_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El tipo de vista del stream es requerido si los streams están habilitados.",
      path: ['stream_view_type'],
    });
  }
});

// Tipo inferido de la configuración de DynamoDB Table
export type AWSDynamoDBTableConfig = z.infer<typeof awsDynamoDBTableValidationSchema>;

// Valores por defecto para una nueva DynamoDB Table
export const defaultAWSDynamoDBTableConfig: Partial<AWSDynamoDBTableConfig> & { name: string, hash_key: string, hash_key_type: 'S' | 'N' | 'B' } = {
  name: 'my-new-table',
  region: 'us-east-1',
  billing_mode: 'PAY_PER_REQUEST',
  hash_key: 'id',
  hash_key_type: 'S',
  stream_enabled: false,
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsDynamoDBTableValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsDynamoDBTableFields);
};

export const templates = (config: AWSDynamoDBTableConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSDynamoDBTableTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  const defaultsToReturn: Partial<ResourceValues> = {
    ...defaultAWSDynamoDBTableConfig,
    name: defaultAWSDynamoDBTableConfig.name,
    hash_key: defaultAWSDynamoDBTableConfig.hash_key,
    hash_key_type: defaultAWSDynamoDBTableConfig.hash_key_type,
  };
  return Promise.resolve(defaultsToReturn);
};
