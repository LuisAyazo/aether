import { AWSEC2InstanceConfig } from './instance';
import { CodeTemplate } from '@/app/types/resourceConfig';

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

export function generateAWSEC2InstanceTemplates(config: AWSEC2InstanceConfig): CodeTemplate {
  const resourceName = config.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const allTags = {
    Name: config.name,
    ...parseTagsString(config.tags as string | undefined),
  };

  const terraformTags = formatTerraformTags(allTags);

  const terraform = `
# Plantilla de Terraform para una Instancia EC2 de AWS
# Define el proveedor de AWS y la región a utilizar.
provider "aws" {
  region = "${config.region}"
}

# Recurso para crear una instancia EC2
resource "aws_instance" "${resourceName}" {
  # ID de la Amazon Machine Image (AMI). Especifica el SO y software base.
  ami           = "${config.ami}"
  # Tipo de instancia (ej. t2.micro, m5.large). Define CPU, memoria, etc.
  instance_type = "${config.instance_type}"

  # (Opcional) Nombre del par de claves EC2 para acceso SSH.
  ${config.key_name ? `key_name      = "${config.key_name}"` : '# key_name      = "your-key-pair" # Descomentar y reemplazar si es necesario'}

  # (Opcional) ID de la subred VPC donde lanzar la instancia.
  # Si se omite, se usa la subred por defecto de la VPC por defecto.
  ${config.subnet_id ? `subnet_id     = "${config.subnet_id}"` : '# subnet_id     = "your-subnet-id" # Descomentar y reemplazar si es necesario'}

  # (Opcional) Lista de IDs de grupos de seguridad.
  ${config.security_group_ids ? `vpc_security_group_ids = [${(config.security_group_ids as string).split(',').map(sg => `"${sg.trim()}"`).join(', ')}]` : '# vpc_security_group_ids = ["sg-xxxxxxxxxxxxxxxxx"] # Descomentar y reemplazar'}

  # (Opcional) Script de User Data para ejecutar en el primer arranque.
  ${config.user_data ? `user_data     = <<-EOF\\n${config.user_data}\\nEOF` : '# user_data     = <<-EOF\\n# #!/bin/bash\\n# echo "Hello, World" > /tmp/hello.txt\\n# EOF'}

  # Tags para la instancia EC2. El tag "Name" es especialmente útil.
  tags = {
${terraformTags}
  }

  # Ejemplo de configuración de volumen EBS adicional (descomentar y ajustar)
  # root_block_device {
  #   volume_size = 20 # GB
  #   volume_type = "gp3"
  #   delete_on_termination = true
  # }

  # ebs_block_device {
  #   device_name = "/dev/sdf"
  #   volume_size = 100
  #   volume_type = "gp3"
  #   delete_on_termination = true
  # }
}

# (Opcional) Salida del ID público de la instancia
# output "${resourceName}_public_ip" {
#   value = aws_instance.${resourceName}.public_ip
# }
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Instancia EC2 de AWS
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Crear una nueva instancia EC2
const ${resourceName}Instance = new aws.ec2.Instance("${resourceName}", {
    // ID de la Amazon Machine Image (AMI)
    ami: "${config.ami}",
    // Tipo de instancia (ej. "t2.micro")
    instanceType: "${config.instance_type}",
    // La región se configura a nivel de proveedor en Pulumi, usualmente en Pulumi.<stack>.yaml o por variables de entorno.
    // No es un argumento directo del recurso Instance si el proveedor ya está configurado.
    // region: "${config.region}", 

    // (Opcional) Nombre del par de claves para acceso SSH
    ${config.key_name ? `keyName: "${config.key_name}",` : '// keyName: "your-key-pair",'}

    // (Opcional) ID de la subred VPC
    ${config.subnet_id ? `subnetId: "${config.subnet_id}",` : '// subnetId: "your-subnet-id",'}

    // (Opcional) IDs de grupos de seguridad
    ${config.security_group_ids ? `vpcSecurityGroupIds: [${(config.security_group_ids as string).split(',').map(sg => `"${sg.trim()}"`).join(', ')}],` : '// vpcSecurityGroupIds: ["sg-xxxxxxxxxxxxxxxxx"],'}

    // (Opcional) Script de User Data
    ${config.user_data ? `userData: \`\n${config.user_data}\n\`,`: '// userData: `#!/bin/bash\\necho "Hello, World" > /tmp/hello.txt`, // Script a ejecutar al inicio'}

    // Tags para la instancia
    tags: {
        Name: "${config.name}", // Tag 'Name'
        ${Object.entries(parseTagsString(config.tags as string | undefined)).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },

    // Ejemplo de configuración de volumen raíz (descomentar y ajustar)
    // rootBlockDevice: {
    //     volumeSize: 20, // GB
    //     volumeType: "gp3",
    //     deleteOnTermination: true,
    // },

    // Ejemplo de volumen EBS adicional (descomentar y ajustar)
    // ebsBlockDevices: [{
    //     deviceName: "/dev/sdf",
    //     volumeSize: 100,
    //     volumeType: "gp3",
    //     deleteOnTermination: true,
    // }],
});

// Exportar la IP pública de la instancia (si tiene una)
export const ${resourceName}PublicIp = ${resourceName}Instance.publicIp;
// Exportar el ID de la instancia
export const ${resourceName}InstanceId = ${resourceName}Instance.id;
`;

  const cloudformation = `
# Plantilla de AWS CloudFormation para una Instancia EC2
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Plantilla para crear una instancia EC2 de AWS llamada ${config.name}
  en la región ${config.region}.

Parameters:
  # Parámetro para el KeyPair, si se desea hacerlo configurable
  KeyPairName:
    Description: Nombre del KeyPair EC2 para permitir acceso SSH a la instancia
    Type: AWS::EC2::KeyPair::KeyName
    Default: "${config.key_name || ''}" # Dejar vacío si no se especifica para usar AWS::NoValue

Resources:
  ${resourceName}Instance:
    Type: AWS::EC2::Instance
    Properties:
      # ID de la Amazon Machine Image (AMI)
      ImageId: "${config.ami}"
      # Tipo de instancia (ej. t2.micro)
      InstanceType: "${config.instance_type}"
      # Nombre del par de claves (si se proporcionó)
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref "AWS::NoValue"]
      # ID de la subred (si se proporcionó)
      SubnetId: ${config.subnet_id ? `"${config.subnet_id}"` : '!Ref "AWS::NoValue"'}
      # IDs de los grupos de seguridad (si se proporcionaron)
      SecurityGroupIds: ${config.security_group_ids ? `\n        ${(config.security_group_ids as string).split(',').map(sg => `- "${sg.trim()}"`).join('\n        ')}` : '!Ref "AWS::NoValue"'}
      # Script de User Data (si se proporcionó)
      UserData: ${config.user_data ? `!Base64 |-\n          ${config.user_data.replace(/\n/g, '\n          ')}` : '!Ref "AWS::NoValue"'}
      # Tags para la instancia
      Tags:
        - Key: Name
          Value: "${config.name}"
        ${Object.entries(parseTagsString(config.tags as string | undefined)).map(([key, value]) => `- Key: ${key}\n          Value: ${value}`).join('\n        ')}
      # Ejemplo de configuración de volumen raíz (descomentar y ajustar)
      # BlockDeviceMappings:
      #   - DeviceName: /dev/sda1 # o /dev/xvda dependiendo de la AMI
      #     Ebs:
      #       VolumeSize: "20" # GB
      #       VolumeType: "gp3"
      #       DeleteOnTermination: "true"

Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, ""]]

Outputs:
  InstanceId:
    Description: ID de la instancia EC2 creada
    Value: !Ref ${resourceName}Instance
  PublicIp:
    Description: Dirección IP pública de la instancia EC2 (si aplica)
    Value: !GetAtt ${resourceName}Instance.PublicIp
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para AWS EC2 Instance (requiere colección amazon.aws)
# Asegúrate de tener configuradas las credenciales de AWS (variables de entorno, ~/.aws/credentials, o roles IAM)
- name: Provisionar instancia EC2 en AWS
  hosts: localhost # Ejecutar localmente para interactuar con la API de AWS
  connection: local
  gather_facts: False

  vars:
    instance_name: "${config.name}"
    aws_region: "${config.region}"
    ami_id: "${config.ami}"
    instance_type: "${config.instance_type}"
    key_pair_name: ${config.key_name ? `"${config.key_name}"` : 'null'}
    subnet_id: ${config.subnet_id ? `"${config.subnet_id}"` : 'null'}
    security_groups: [${config.security_group_ids ? (config.security_group_ids as string).split(',').map(sg => `"${sg.trim()}"`).join(', ') : ''}]
    user_data_script: |
      ${config.user_data ? config.user_data.replace(/\n/g, '\n      ') : '#!/bin/bash\n# echo "Hello from Ansible"'}
    instance_tags:
      Name: "{{ instance_name }}"
      ${Object.entries(parseTagsString(config.tags as string | undefined)).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Lanzar la instancia EC2
      amazon.aws.ec2_instance:
        name: "{{ instance_name }}" # Esto aplicará un tag 'Name'
        key_name: "{{ key_pair_name | default(omit) }}"
        instance_type: "{{ instance_type }}"
        image_id: "{{ ami_id }}"
        region: "{{ aws_region }}"
        vpc_subnet_id: "{{ subnet_id | default(omit) }}"
        security_groups: "{{ security_groups | default(omit) }}"
        user_data: "{{ user_data_script | default(omit) }}"
        tags: "{{ instance_tags }}"
        state: present # Asegura que la instancia exista y esté corriendo
        # wait: yes # Esperar a que la instancia esté completamente iniciada (opcional)
        # count: 1 # Número de instancias a lanzar
      register: ec2_info

    - name: Mostrar información de la instancia
      ansible.builtin.debug:
        msg: "Instancia EC2 {{ ec2_info.instances[0].instance_id if ec2_info.instances else 'no creada' }} IP: {{ ec2_info.instances[0].public_ip_address if ec2_info.instances else 'N/A' }}"
`,
    cloudformation
  };
}
