import { FieldConfig } from "../../../../types/resourceConfig";

export const awsElasticBeanstalkEnvironmentFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Entorno',
    type: 'text',
    required: true,
    placeholder: 'my-app-env',
    description: 'El nombre único para tu entorno de Elastic Beanstalk. Debe tener entre 4 y 40 caracteres.'
  },
  {
    key: 'application_name',
    label: 'Nombre de la Aplicación',
    type: 'text',
    required: true,
    placeholder: 'my-application',
    description: 'El nombre de la aplicación de Elastic Beanstalk a la que pertenece este entorno.'
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
    description: 'La región de AWS donde se creará el entorno.'
  },
  {
    key: 'solution_stack_name',
    label: 'Nombre de la Pila de Soluciones (Solution Stack)',
    type: 'text',
    // required: true, // Opcional si se usa platform_arn
    placeholder: '64bit Amazon Linux 2 v3.4.5 running Python 3.8',
    description: 'El nombre de la pila de soluciones (plataforma) a utilizar. Ej: "64bit Amazon Linux 2 vX.Y.Z running Python 3.8".'
  },
  {
    key: 'platform_arn',
    label: 'ARN de la Plataforma',
    type: 'text',
    // required: true, // Opcional si se usa solution_stack_name
    placeholder: 'arn:aws:elasticbeanstalk:us-east-1::platform/Python 3.8 running on 64bit Amazon Linux 2/3.4.5',
    description: 'El ARN de una plataforma personalizada o una versión específica de una plataforma gestionada.'
  },
  {
    key: 'tier',
    label: 'Nivel del Entorno (Tier)',
    type: 'select',
    options: [
      { value: 'WebServer', label: 'WebServer (Servidor Web)' },
      { value: 'Worker', label: 'Worker (Trabajador)' },
    ],
    defaultValue: 'WebServer',
    description: 'Especifica el nivel del entorno (WebServer o Worker).'
  },
  {
    key: 'cname_prefix',
    label: 'Prefijo CNAME',
    type: 'text',
    placeholder: 'my-app-env-unique',
    description: 'Un prefijo para el CNAME del entorno. Debe ser único globalmente. Si se omite, AWS genera uno.'
  },
  {
    key: 'description',
    label: 'Descripción del Entorno',
    type: 'textarea',
    placeholder: 'Entorno de desarrollo para la aplicación X.',
    description: 'Una descripción para el entorno de Elastic Beanstalk.'
  },
  {
    key: 'setting', // Para configuraciones específicas del entorno
    label: 'Configuraciones (namespace:option_name=value;...)',
    type: 'textarea',
    placeholder: 'aws:autoscaling:launchconfiguration:InstanceType=t2.micro;aws:elasticbeanstalk:environment:EnvironmentType=SingleInstance',
    description: 'Opciones de configuración del entorno. Formato: namespace:option_name=value, separadas por punto y coma.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: Clave1=Valor1,Clave2=Valor2)',
    type: 'textarea',
    placeholder: 'Environment=dev,Project=WebApp',
    description: 'Tags para el entorno de Elastic Beanstalk.'
  },
];
