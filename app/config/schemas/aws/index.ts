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
import awsEfsResources from './efs'; // Importar el registro de EFS
import awsApiGatewayResources from './apigateway'; // Importar el registro de API Gateway
import awsSqsResources from './sqs'; // Importar el registro de SQS
import awsSnsResources from './sns'; // Importar el registro de SNS
import awsEventBridgeResources from './eventbridge'; // Importar el registro de EventBridge
import awsSfnResources from './sfn'; // Importar el registro de SFN

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
  efs: awsEfsResources,
  apigateway: awsApiGatewayResources,
  sqs: awsSqsResources,
  sns: awsSnsResources,
  eventbridge: awsEventBridgeResources,
  sfn: awsSfnResources, // Añadir SFN (Step Functions) al registro
  // ... otras categorías de AWS
} as const;

// Tipo para las categorías de recursos de AWS (ej. 'ec2', 's3')
export type AWSResourceCategory = keyof typeof AWS_RESOURCE_REGISTRY;

// Tipo para los tipos de recursos dentro de una categoría específica de AWS
// Ejemplo: export type AWSEC2ResourceType = keyof typeof AWS_RESOURCE_REGISTRY.ec2;
