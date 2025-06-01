import { FieldConfig } from '@/app/types/resourceConfig';

export const awsEc2InstanceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Instancia (Tag)',
    type: 'text',
    required: true,
    placeholder: 'my-ec2-instance',
    description: 'El valor para el tag "Name" de la instancia EC2.'
  },
  {
    key: 'ami',
    label: 'ID de AMI',
    type: 'text',
    required: true,
    placeholder: 'ami-xxxxxxxxxxxxxxxxx',
    description: 'El ID de la Amazon Machine Image (AMI) a usar.'
  },
  {
    key: 'instance_type',
    label: 'Tipo de Instancia',
    type: 'select',
    required: true,
    options: [
      { value: 't2.micro', label: 't2.micro (Free Tier)' },
      { value: 't3.micro', label: 't3.micro' },
      { value: 't3.small', label: 't3.small' },
      { value: 'm5.large', label: 'm5.large' },
      { value: 'c5.large', label: 'c5.large' },
      // Añadir más tipos comunes
    ],
    defaultValue: 't2.micro',
    description: 'El tipo de instancia EC2 (ej. t2.micro, m5.large).'
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
    description: 'La región de AWS donde se lanzará la instancia.'
  },
  {
    key: 'key_name',
    label: 'Nombre del Par de Claves',
    type: 'text',
    placeholder: 'my-key-pair',
    description: 'El nombre del par de claves EC2 para permitir el acceso SSH (opcional).'
  },
  {
    key: 'subnet_id',
    label: 'ID de Subred',
    type: 'text',
    placeholder: 'subnet-xxxxxxxxxxxxxxxxx',
    description: 'El ID de la subred VPC donde lanzar la instancia (opcional, si no se usa la VPC por defecto).'
  },
  {
    key: 'security_group_ids',
    label: 'IDs de Grupos de Seguridad (separados por coma)',
    type: 'text', 
    placeholder: 'sg-xxxxxxxx,sg-yyyyyyyy',
    description: 'Lista de IDs de grupos de seguridad separados por comas (opcional).'
  },
  {
    key: 'user_data',
    label: 'User Data',
    type: 'textarea',
    placeholder: '#!/bin/bash\\napt update -y\\napt install -y nginx',
    description: 'Script de User Data para ejecutar en el lanzamiento de la instancia (opcional).'
  },
  {
    key: 'tags',
    label: 'Tags Adicionales (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Owner=team-a,Project=alpha',
    description: 'Tags adicionales para la instancia en formato Clave1=Valor1,Clave2=Valor2... (opcional).'
  },
];
