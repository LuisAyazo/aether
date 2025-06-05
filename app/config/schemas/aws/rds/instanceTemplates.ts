import { AWSRDSInstanceConfig } from './instance'; // Asumiremos que este tipo se definirá en instance.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

// Helper function to parse tags from string "Key1=Value1,Key2=Value2" to object
const parseTagsString = (tagsString?: string): Record<string, string> => {
  if (!tagsString) return {};
  return tagsString.split(',').reduce((acc, tagPair) => {
    const [key, value] = tagPair.split('='); // Corregido: usar tagPair
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

export function generateAWSRDSInstanceTemplates(config: AWSRDSInstanceConfig): CodeTemplate {
  const terraformResourceName = config.identifier.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = config.identifier.replace(/-/g, ''); // Pulumi names often prefer no hyphens

  const parsedTags = {
    Name: config.identifier, // Usar el identificador como tag Name por defecto
    ...parseTagsString(config.tags as string | undefined),
  };

  const terraform = `
# Plantilla de Terraform para una Instancia RDS de AWS
# Define el proveedor de AWS y la región a utilizar.
provider "aws" {
  region = "${config.region}"
}

# Recurso para crear una instancia de base de datos RDS
resource "aws_db_instance" "${terraformResourceName}" {
  identifier           = "${config.identifier}"        # Identificador único para la instancia RDS
  engine               = "${config.engine}"            # Motor de base de datos (ej. "mysql", "postgres")
  ${config.engine_version ? `engine_version       = "${config.engine_version}"` : '# engine_version       = "8.0.32" # Opcional, versión específica del motor'}
  instance_class       = "${config.instance_class}"    # Clase de instancia (ej. "db.t3.micro")
  allocated_storage    = ${config.allocated_storage}    # Almacenamiento asignado en GB
  storage_type         = "${config.storage_type || 'gp2'}" # Tipo de almacenamiento (ej. "gp2", "io1")
  
  # Credenciales de la base de datos
  # ¡IMPORTANTE! Para producción, gestiona estas credenciales de forma segura (ej. AWS Secrets Manager).
  username             = "${config.username}"
  password             = "${config.password}" # Considerar el uso de variables o secretos

  # (Opcional) Nombre de la base de datos inicial a crear (no todos los motores lo soportan)
  ${config.db_name ? `db_name              = "${config.db_name}"` : '# db_name              = "mydatabase"'}

  # Configuración de red y seguridad
  # db_subnet_group_name = "my-db-subnet-group" # (Opcional) Grupo de subredes de DB
  # vpc_security_group_ids = ["sg-xxxxxxxxxxxxxxxxx"] # (Opcional) Grupos de seguridad VPC

  # Disponibilidad y durabilidad
  multi_az             = ${config.multi_az || false} # Despliegue Multi-AZ para alta disponibilidad
  
  # Mantenimiento y backups
  # backup_retention_period = 7 # Días para retener backups automáticos (0 para deshabilitar)
  # backup_window           = "03:00-04:00" # Ventana de backup preferida (UTC)
  # maintenance_window      = "sun:05:00-sun:06:00" # Ventana de mantenimiento preferida (UTC)

  # Otras configuraciones
  publicly_accessible  = ${config.publicly_accessible || false} # Si la instancia es accesible públicamente
  skip_final_snapshot  = ${config.skip_final_snapshot || false} # Omitir snapshot final al eliminar (¡cuidado!)
  # apply_immediately    = false # Aplicar cambios inmediatamente o en la próxima ventana de mantenimiento

  # Tags para la instancia
  tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }
}

# (Opcional) Grupo de parámetros de DB (para configuraciones específicas del motor)
# resource "aws_db_parameter_group" "${terraformResourceName}_pg" {
#   name   = "${terraformResourceName}-pg"
#   family = "${config.engine}${config.engine_version ? config.engine_version.split('.')[0] + '.' + config.engine_version.split('.')[1] : '15'}" # ej. mysql8.0, postgres15
#
#   parameter {
#     name  = "character_set_server"
#     value = "utf8mb4"
#   }
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Instancia RDS de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Crear una nueva instancia RDS
const ${pulumiResourceName}DbInstance = new aws.rds.Instance("${pulumiResourceName}", {
    identifier: "${config.identifier}",
    engine: "${config.engine}",
    ${config.engine_version ? `engineVersion: "${config.engine_version}",` : '// engineVersion: "8.0.32", // Opcional'}
    instanceClass: "${config.instance_class}",
    allocatedStorage: ${config.allocated_storage},
    storageType: "${config.storage_type || 'gp2'}",
    
    // Credenciales (¡Gestionar de forma segura en producción!)
    username: "${config.username}",
    password: "${config.password}", // Considerar pulumi.Config para secretos

    ${config.db_name ? `dbName: "${config.db_name}",` : '// dbName: "mydatabase", // Opcional'}

    // region: "${config.region}", // Usualmente configurado a nivel de proveedor

    multiAz: ${config.multi_az || false},
    publiclyAccessible: ${config.publicly_accessible || false},
    skipFinalSnapshot: ${config.skip_final_snapshot || false},

    // (Opcional) Grupo de subredes y grupos de seguridad
    // dbSubnetGroupName: "my-db-subnet-group",
    // vpcSecurityGroupIds: ["sg-xxxxxxxxxxxxxxxxx"],

    // (Opcional) Configuración de backups y mantenimiento
    // backupRetentionPeriod: 7,
    // backupWindow: "03:00-04:00",
    // maintenanceWindow: "sun:05:00-sun:06:00",

    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

// Exportar el endpoint de la instancia RDS
export const rdsInstanceEndpoint = ${pulumiResourceName}DbInstance.endpoint;
export const rdsInstanceAddress = ${pulumiResourceName}DbInstance.address;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Instancia RDS
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una instancia RDS de AWS con identificador ${config.identifier}
  en la región ${config.region}.

Parameters:
  DBInstanceIdentifier:
    Type: String
    Default: "${config.identifier}"
  DBEngine:
    Type: String
    Default: "${config.engine}"
  DBEngineVersion:
    Type: String
    Default: "${config.engine_version || ''}" # Dejar vacío para usar el default del motor
  DBInstanceClass:
    Type: String
    Default: "${config.instance_class}"
  AllocatedStorage:
    Type: Number
    Default: ${config.allocated_storage}
  StorageType:
    Type: String
    Default: "${config.storage_type || 'gp2'}"
  MasterUsername:
    Type: String
    Default: "${config.username}"
  MasterUserPassword:
    Type: String
    NoEcho: true # Importante para contraseñas
    Default: "${config.password}" # Considerar usar AWS Secrets Manager o SSM Parameter Store
  DBName:
    Type: String
    Default: "${config.db_name || ''}" # Opcional
  MultiAZDeployment:
    Type: String
    Default: "${config.multi_az || false}"
    AllowedValues: [true, false]
  PubliclyAccessibleDB:
    Type: String
    Default: "${config.publicly_accessible || false}"
    AllowedValues: [true, false]
  SkipFinalSnapshotDB:
    Type: String
    Default: "${config.skip_final_snapshot || false}"
    AllowedValues: [true, false]

Resources:
  ${pulumiResourceName}DBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Ref DBInstanceIdentifier
      Engine: !Ref DBEngine
      EngineVersion: !If [HasEngineVersion, !Ref DBEngineVersion, !Ref "AWS::NoValue"]
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: !Ref AllocatedStorage
      StorageType: !Ref StorageType
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Ref MasterUserPassword
      DBName: !If [HasDBName, !Ref DBName, !Ref "AWS::NoValue"]
      MultiAZ: !Ref MultiAZDeployment
      PubliclyAccessible: !Ref PubliclyAccessibleDB
      SkipFinalSnapshot: !Ref SkipFinalSnapshotDB
      # DBSubnetGroupName: String # Opcional
      # VPCSecurityGroups: [ String ] # Opcional
      Tags:
        ${Object.entries(parsedTags).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}

Conditions:
  HasEngineVersion: !Not [!Equals [!Ref DBEngineVersion, ""]]
  HasDBName: !Not [!Equals [!Ref DBName, ""]]

Outputs:
  DBInstanceEndpointAddress:
    Description: Endpoint de la instancia RDS
    Value: !GetAtt ${pulumiResourceName}DBInstance.Endpoint.Address
  DBInstanceEndpointPort:
    Description: Puerto del endpoint de la instancia RDS
    Value: !GetAtt ${pulumiResourceName}DBInstance.Endpoint.Port
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS RDS Instance (requiere community.aws.rds_instance o amazon.aws.rds_instance)
- name: Provisionar instancia RDS ${config.identifier}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    db_instance_identifier: "${config.identifier}"
    aws_region: "${config.region}"
    db_engine: "${config.engine}"
    db_engine_version: "${config.engine_version || ''}" # Opcional
    db_instance_class: "${config.instance_class}"
    allocated_storage_gb: ${config.allocated_storage}
    storage_type: "${config.storage_type || 'gp2'}"
    master_username: "${config.username}"
    master_password: "{{ vault_db_password | default('${config.password}') }}" # ¡Usar Ansible Vault para contraseñas!
    db_name_initial: "${config.db_name || ''}" # Opcional
    multi_az_deployment: ${config.multi_az || false}
    publicly_accessible_db: ${config.publicly_accessible || false}
    skip_final_snapshot_on_delete: ${config.skip_final_snapshot || false}
    instance_tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar la instancia RDS
      amazon.aws.rds_instance:
        db_instance_identifier: "{{ db_instance_identifier }}"
        region: "{{ aws_region }}"
        state: present # 'present' crea o actualiza, 'absent' elimina
        engine: "{{ db_engine }}"
        engine_version: "{{ db_engine_version | default(omit) if db_engine_version else omit }}"
        db_instance_class: "{{ db_instance_class }}"
        allocated_storage: "{{ allocated_storage_gb }}"
        storage_type: "{{ storage_type }}"
        username: "{{ master_username }}"
        password: "{{ master_password }}"
        db_name: "{{ db_name_initial | default(omit) if db_name_initial else omit }}"
        multi_az: "{{ multi_az_deployment }}"
        publicly_accessible: "{{ publicly_accessible_db }}"
        skip_final_snapshot: "{{ skip_final_snapshot_on_delete }}"
        # db_subnet_group_name: "my-db-subnet-group" # Opcional
        # vpc_security_group_ids: ["sg-xxxxxxxxxxxxxxxxx"] # Opcional
        tags: "{{ instance_tags }}"
        # wait: yes # Esperar a que la instancia esté disponible (opcional)
        # wait_timeout: 1800 # Tiempo de espera en segundos
      register: rds_info

    - name: Mostrar información de la instancia RDS
      ansible.builtin.debug:
        msg: "Instancia RDS {{ rds_info.instance.id if rds_info.instance else 'no creada/actualizada' }} Endpoint: {{ rds_info.instance.endpoint if rds_info.instance else 'N/A' }}"
`,
    cloudformation
  };
}
