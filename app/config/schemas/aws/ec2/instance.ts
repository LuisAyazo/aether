import { z } from 'zod';
import { FieldConfig, ResourceValues, CodeTemplate } from "../../../../types/resourceConfig";
import { awsEc2InstanceFields } from './instanceFields';
import { generateAWSEC2InstanceTemplates } from './instanceTemplates';

// Esquema de validación para AWS EC2 Instance
export const awsEc2InstanceValidationSchema = z.object({
  name: z.string().min(1, "El nombre de la instancia (tag Name) es requerido."),
  ami: z.string().min(1, "El ID de AMI es requerido.").regex(/^ami-([a-f0-9]{8}|[a-f0-9]{17})$/, "Formato de AMI inválido."),
  instance_type: z.string().min(1, "El tipo de instancia es requerido."),
  region: z.string().min(1, "La región es requerida."),
  key_name: z.string().optional(),
  subnet_id: z.string().regex(/^subnet-[a-f0-9]{8,17}$/, "Formato de Subnet ID inválido.").optional(),
  security_group_ids: z.string().optional() // String separado por comas
    .refine(val => !val || val.split(',').every(sg => /^sg-[a-f0-9]{8,17}$/.test(sg.trim())), {
      message: "Uno o más IDs de Security Group son inválidos."
    }),
  user_data: z.string().optional(),
  tags: z.string().optional() // String en formato Key1=Value1,Key2=Value2
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(pair => /^[a-zA-Z0-9_.-]+=[^,]+$/.test(pair.trim()));
    }, {
      message: "Formato de tags inválido. Use Clave1=Valor1,Clave2=Valor2."
    }),
});

// Tipo inferido de la configuración de EC2 Instance
export type AWSEC2InstanceConfig = z.infer<typeof awsEc2InstanceValidationSchema>;

// Valores por defecto para una nueva EC2 Instance
// Aseguramos que name sea string para compatibilidad con Partial<ResourceValues>
export const defaultAWSEC2InstanceConfig: Partial<AWSEC2InstanceConfig> & { name: string } = {
  name: 'my-ec2-instance',
  instance_type: 't2.micro',
  region: 'us-east-1',
};

// Funciones exportadas requeridas por el sistema de esquemas

export const schema = (): Promise<z.ZodTypeAny> => {
  return Promise.resolve(awsEc2InstanceValidationSchema);
};

export const fields = (): Promise<FieldConfig[]> => {
  return Promise.resolve(awsEc2InstanceFields);
};

export const templates = (config: AWSEC2InstanceConfig): Promise<CodeTemplate> => {
  return Promise.resolve(generateAWSEC2InstanceTemplates(config));
};

export const defaults = (): Promise<Partial<ResourceValues>> => {
  // El tipo de defaultAWSEC2InstanceConfig ya es compatible con Partial<ResourceValues>
  // debido a la aserción de tipo & { name: string } y la estructura de ResourceValues.
  return Promise.resolve(defaultAWSEC2InstanceConfig);
};
