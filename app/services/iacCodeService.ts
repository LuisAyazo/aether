import { Dispatch, SetStateAction } from 'react';

export interface IaCTemplateOptions {
  resourceName: string;
  resourceType: string;
  provider: string;
  region?: string;
  customParams?: Record<string, any>;
}

export interface IaCTemplate {
  id: string;
  name: string;
  description: string;
  tool: 'terraform' | 'pulumi' | 'ansible' | 'cloudformation' | 'arm';
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  resourceType: string;
  template: string;
  defaultParams?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// This would be replaced with actual MongoDB integration
class IaCCodeService {
  private static templates: IaCTemplate[] = [
    // AWS Terraform templates
    {
      id: 'tf-aws-ec2-1',
      name: 'AWS EC2 Basic Instance',
      description: 'Basic EC2 instance with configurable instance type',
      tool: 'terraform',
      provider: 'aws',
      resourceType: 'ec2',
      template: `resource "aws_instance" "{{resourceName}}" {
  ami           = "{{ami}}"
  instance_type = "{{instanceType}}"
  
  tags = {
    Name = "{{resourceName}}"
  }
}`,
      defaultParams: {
        ami: 'ami-0c55b159cbfafe1f0',
        instanceType: 't2.micro'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'tf-aws-s3-1',
      name: 'AWS S3 Bucket',
      description: 'S3 bucket with basic configuration',
      tool: 'terraform',
      provider: 'aws',
      resourceType: 's3',
      template: `resource "aws_s3_bucket" "{{resourceName}}" {
  bucket = "{{bucketName}}"
  acl    = "{{acl}}"

  tags = {
    Name = "{{resourceName}}"
  }
}`,
      defaultParams: {
        bucketName: 'my-bucket-name',
        acl: 'private'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Pulumi AWS templates
    {
      id: 'pulumi-aws-ec2-1',
      name: 'AWS EC2 Instance (Pulumi)',
      description: 'EC2 instance defined with Pulumi',
      tool: 'pulumi',
      provider: 'aws',
      resourceType: 'ec2',
      template: `const {{camelResourceName}} = new aws.ec2.Instance("{{resourceName}}", {
    ami: "{{ami}}",
    instanceType: "{{instanceType}}",
    tags: {
        Name: "{{resourceName}}",
    },
});

export const {{camelResourceName}}Id = {{camelResourceName}}.id;`,
      defaultParams: {
        ami: 'ami-0c55b159cbfafe1f0',
        instanceType: 't2.micro'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pulumi-aws-s3-1',
      name: 'AWS S3 Bucket (Pulumi)',
      description: 'S3 bucket defined with Pulumi',
      tool: 'pulumi',
      provider: 'aws',
      resourceType: 's3',
      template: `const {{camelResourceName}} = new aws.s3.Bucket("{{resourceName}}", {
    bucket: "{{bucketName}}",
    acl: "{{acl}}",
    tags: {
        Name: "{{resourceName}}",
    },
});

export const {{camelResourceName}}Url = {{camelResourceName}}.websiteEndpoint;`,
      defaultParams: {
        bucketName: 'my-pulumi-bucket',
        acl: 'private'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Ansible AWS templates
    {
      id: 'ansible-aws-ec2-1',
      name: 'AWS EC2 Instance (Ansible)',
      description: 'Provision EC2 instance with Ansible',
      tool: 'ansible',
      provider: 'aws',
      resourceType: 'ec2',
      template: `- name: Create {{resourceName}} EC2 instance
  amazon.aws.ec2_instance:
    name: "{{resourceName}}"
    key_name: "{{keyName}}"
    instance_type: "{{instanceType}}"
    image_id: "{{ami}}"
    region: "{{region}}"
    wait: true
    tags:
      Name: "{{resourceName}}"`,
      defaultParams: {
        keyName: 'my-key',
        instanceType: 't2.micro',
        ami: 'ami-0c55b159cbfafe1f0',
        region: 'us-east-1'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // GCP templates
    {
      id: 'tf-gcp-compute-1',
      name: 'GCP Compute Instance',
      description: 'GCP Compute Engine VM instance',
      tool: 'terraform',
      provider: 'gcp',
      resourceType: 'compute',
      template: `resource "google_compute_instance" "{{resourceName}}" {
  name         = "{{resourceName}}"
  machine_type = "{{machineType}}"
  zone         = "{{zone}}"

  boot_disk {
    initialize_params {
      image = "{{image}}"
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }
}`,
      defaultParams: {
        machineType: 'e2-medium',
        zone: 'us-central1-a',
        image: 'debian-cloud/debian-10'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pulumi-gcp-compute-1',
      name: 'GCP Compute Instance (Pulumi)',
      description: 'GCP Compute Engine defined with Pulumi',
      tool: 'pulumi',
      provider: 'gcp',
      resourceType: 'compute',
      template: `const {{camelResourceName}} = new gcp.compute.Instance("{{resourceName}}", {
    machineType: "{{machineType}}",
    zone: "{{zone}}",
    bootDisk: {
        initializeParams: {
            image: "{{image}}",
        },
    },
    networkInterfaces: [{
        network: "default",
        accessConfigs: [{}],
    }],
});

export const {{camelResourceName}}Ip = {{camelResourceName}}.networkInterfaces[0].accessConfigs[0].natIp;`,
      defaultParams: {
        machineType: 'e2-medium',
        zone: 'us-central1-a',
        image: 'debian-cloud/debian-10'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // Azure templates
    {
      id: 'tf-azure-vm-1',
      name: 'Azure Virtual Machine',
      description: 'Azure VM with basic configuration',
      tool: 'terraform',
      provider: 'azure',
      resourceType: 'vm',
      template: `resource "azurerm_virtual_machine" "{{resourceName}}" {
  name                  = "{{resourceName}}"
  location              = "{{location}}"
  resource_group_name   = "{{resourceGroup}}"
  network_interface_ids = ["{{networkInterfaceId}}"]
  vm_size               = "{{vmSize}}"

  storage_image_reference {
    publisher = "{{publisher}}"
    offer     = "{{offer}}"
    sku       = "{{sku}}"
    version   = "latest"
  }

  storage_os_disk {
    name              = "{{resourceName}}-osdisk"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Standard_LRS"
  }

  os_profile {
    computer_name  = "{{computerName}}"
    admin_username = "{{adminUsername}}"
    admin_password = "{{adminPassword}}"
  }

  os_profile_linux_config {
    disable_password_authentication = false
  }
}`,
      defaultParams: {
        location: 'eastus',
        resourceGroup: 'my-resource-group',
        networkInterfaceId: '/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/my-resource-group/providers/Microsoft.Network/networkInterfaces/my-nic',
        vmSize: 'Standard_DS1_v2',
        publisher: 'Canonical',
        offer: 'UbuntuServer',
        sku: '18.04-LTS',
        computerName: 'hostname',
        adminUsername: 'adminuser',
        adminPassword: 'P@ssw0rd1234!'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Method to fetch templates from database (mock)
  static async getTemplates(filter?: {
    provider?: string;
    tool?: string;
    resourceType?: string;
  }): Promise<IaCTemplate[]> {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredTemplates = this.templates;
    
    if (filter) {
      if (filter.provider) {
        filteredTemplates = filteredTemplates.filter(
          template => template.provider === filter.provider
        );
      }
      
      if (filter.tool) {
        filteredTemplates = filteredTemplates.filter(
          template => template.tool === filter.tool
        );
      }
      
      if (filter.resourceType) {
        filteredTemplates = filteredTemplates.filter(
          template => template.resourceType === filter.resourceType
        );
      }
    }
    
    return filteredTemplates;
  }

  // Method to get a specific template
  static async getTemplate(id: string): Promise<IaCTemplate | null> {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const template = this.templates.find(t => t.id === id);
    return template || null;
  }

  // Render a template with supplied parameters
  static renderTemplate(template: string, params: Record<string, any>): string {
    let renderedTemplate = template;
    
    // Process camelCase resource name if needed
    if (params.resourceName) {
      const camelResourceName = params.resourceName
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => 
          index === 0 ? letter.toLowerCase() : letter.toUpperCase()
        )
        .replace(/\s+/g, '');
        
      params.camelResourceName = camelResourceName;
    }
    
    // Replace all placeholders
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedTemplate = renderedTemplate.replace(regex, value as string);
    }
    
    return renderedTemplate;
  }

  // Generate Terraform code for a resource
  static generateTerraformCode(options: IaCTemplateOptions): string {
    const resourceType = options.resourceType;
    const provider = options.provider;
    
    // Find a matching template
    const matchingTemplate = this.templates.find(
      t => t.tool === 'terraform' && t.provider === provider && t.resourceType === resourceType
    );
    
    if (!matchingTemplate) {
      return `# No Terraform template found for ${provider} ${resourceType}`;
    }
    
    // Combine default params with custom params
    const params = {
      ...matchingTemplate.defaultParams,
      resourceName: options.resourceName,
      ...options.customParams
    };
    
    return this.renderTemplate(matchingTemplate.template, params);
  }

  // Generate Pulumi code for a resource
  static generatePulumiCode(options: IaCTemplateOptions): string {
    const resourceType = options.resourceType;
    const provider = options.provider;
    
    // Find a matching template
    const matchingTemplate = this.templates.find(
      t => t.tool === 'pulumi' && t.provider === provider && t.resourceType === resourceType
    );
    
    if (!matchingTemplate) {
      return `// No Pulumi template found for ${provider} ${resourceType}`;
    }
    
    // Combine default params with custom params
    const params = {
      ...matchingTemplate.defaultParams,
      resourceName: options.resourceName,
      ...options.customParams
    };
    
    return this.renderTemplate(matchingTemplate.template, params);
  }

  // Generate Ansible code for a resource
  static generateAnsibleCode(options: IaCTemplateOptions): string {
    const resourceType = options.resourceType;
    const provider = options.provider;
    
    // Find a matching template
    const matchingTemplate = this.templates.find(
      t => t.tool === 'ansible' && t.provider === provider && t.resourceType === resourceType
    );
    
    if (!matchingTemplate) {
      return `# No Ansible template found for ${provider} ${resourceType}`;
    }
    
    // Combine default params with custom params
    const params = {
      ...matchingTemplate.defaultParams,
      resourceName: options.resourceName,
      ...options.customParams
    };
    
    return this.renderTemplate(matchingTemplate.template, params);
  }
}

export { IaCCodeService };
