// AWS Provider schemas and configurations
// AWS Provider schemas and configurations
// AWS Provider schemas and configurations
// AWS Provider schemas and configurations
import { awsEc2Resources } from './ec2'; // Importar el registro de EC2
import { awsS3Resources } from './s3';   // Importar el registro de S3
import { awsLambdaResources } from './lambda'; // Importar el registro de Lambda
import { awsRdsResources } from './rds'; // Importar el registro de RDS
import { awsElbv2Resources } from './elbv2'; // Importar el registro de ELBv2
import { awsAutoscalingResources } from './autoscaling'; // Importar el registro de Auto Scaling
import { awsElasticbeanstalkResources } from './elasticbeanstalk'; // Importar el registro de Elastic Beanstalk
import { awsEcsResources } from './ecs'; // Importar el registro de ECS
import { awsEksResources } from './eks'; // Importar el registro de EKS
import { awsDynamodbResources } from './dynamodb'; // Importar el registro de DynamoDB
import { awsElasticacheResources } from './elasticache'; // Importar el registro de ElastiCache
import { awsRedshiftResources } from './redshift'; // Importar el registro de Redshift

// Registry of all AWS resource categories and their types
export const AWS_RESOURCE_REGISTRY = {
  ec2: awsEc2Resources,
  s3: awsS3Resources,
  lambda: awsLambdaResources,
  rds: awsRdsResources,
  elbv2: awsElbv2Resources,
  autoscaling: awsAutoscalingResources,
  elasticbeanstalk: awsElasticbeanstalkResources,
  ecs: awsEcsResources,
  eks: awsEksResources,
  dynamodb: awsDynamodbResources,
  elasticache: awsElasticacheResources,
  redshift: awsRedshiftResources,
  // ... otras categorías de AWS
} as const;

// Tipo para las categorías de recursos de AWS (ej. 'ec2', 's3')
export type AWSResourceCategory = keyof typeof AWS_RESOURCE_REGISTRY;

// Tipo para los tipos de recursos dentro de una categoría específica de AWS
// Ejemplo: export type AWSEC2ResourceType = keyof typeof AWS_RESOURCE_REGISTRY.ec2;
