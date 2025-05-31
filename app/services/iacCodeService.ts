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
      description: 'GCP Compute Engine VM instance with advanced configuration',
      tool: 'terraform',
      provider: 'gcp',
      resourceType: 'compute',
      template: `{{#if createServiceAccount}}
# Service Account
resource "google_service_account" "{{resourceName}}_sa" {
  account_id   = "{{serviceAccountId}}"
  display_name = "{{serviceAccountDisplayName}}"
}
{{/if}}

# Compute Engine Instance
resource "google_compute_instance" "{{resourceName}}" {
  name         = "{{name}}"
  machine_type = "{{machineType}}"
  zone         = "{{zone}}"
  {{#if project}}
  project      = "{{project}}"
  {{/if}}
  {{#if description}}
  description  = "{{description}}"
  {{/if}}

  boot_disk {
    auto_delete = {{bootDiskAutoDelete}}
    {{#if bootDiskDeviceName}}
    device_name = "{{bootDiskDeviceName}}"
    {{/if}}
    
    initialize_params {
      image = "{{bootDiskImage}}"
      size  = {{bootDiskSizeGb}}
      type  = "{{bootDiskType}}"
      {{#if bootDiskLabels}}
      labels = {
        {{#each bootDiskLabels}}
        {{@key}} = "{{this}}"
        {{/each}}
      }
      {{/if}}
    }
  }

  {{#if attachedDisks}}
  {{#each attachedDisks}}
  attached_disk {
    source      = "{{source}}"
    device_name = "{{deviceName}}"
    mode        = "{{mode}}"
  }
  {{/each}}
  {{/if}}

  {{#if scratchDisks}}
  {{#each scratchDisks}}
  scratch_disk {
    interface = "{{interface}}"
  }
  {{/each}}
  {{/if}}

  network_interface {
    network    = "{{network}}"
    {{#if subnetwork}}
    subnetwork = "{{subnetwork}}"
    {{/if}}
    
    {{#if accessConfigs}}
    {{#each accessConfigs}}
    access_config {
      {{#if natIp}}
      nat_ip = "{{natIp}}"
      {{/if}}
      network_tier = "{{networkTier}}"
    }
    {{/each}}
    {{else}}
    access_config {
      // Ephemeral IP
    }
    {{/if}}
  }

  {{#if serviceAccount}}
  service_account {
    {{#if createServiceAccount}}
    email  = google_service_account.{{resourceName}}_sa.email
    {{else}}
    email  = "{{serviceAccountEmail}}"
    {{/if}}
    scopes = [{{#each serviceAccountScopes}}"{{this}}"{{#unless @last}},{{/unless}}{{/each}}]
  }
  {{/if}}

  {{#if tags}}
  tags = [{{#each tags}}"{{this}}"{{#unless @last}},{{/unless}}{{/each}}]
  {{/if}}

  {{#if labels}}
  labels = {
    {{#each labels}}
    {{@key}} = "{{this}}"
    {{/each}}
  }
  {{/if}}

  {{#if metadata}}
  metadata = {
    {{#each metadata}}
    {{@key}} = "{{this}}"
    {{/each}}
  }
  {{/if}}

  {{#if metadataStartupScript}}
  metadata_startup_script = <<-EOF
{{metadataStartupScript}}
EOF
  {{/if}}

  {{#if canIpForward}}
  can_ip_forward = {{canIpForward}}
  {{/if}}

  {{#if deletionProtection}}
  deletion_protection = {{deletionProtection}}
  {{/if}}

  {{#if enableDisplay}}
  enable_display = {{enableDisplay}}
  {{/if}}

  {{#if minCpuPlatform}}
  min_cpu_platform = "{{minCpuPlatform}}"
  {{/if}}

  {{#if scheduling}}
  scheduling {
    automatic_restart   = {{scheduling.automaticRestart}}
    on_host_maintenance = "{{scheduling.onHostMaintenance}}"
    preemptible         = {{scheduling.preemptible}}
  }
  {{/if}}

  {{#if allowStoppingForUpdate}}
  allow_stopping_for_update = {{allowStoppingForUpdate}}
  {{/if}}

  {{#if desiredStatus}}
  desired_status = "{{desiredStatus}}"
  {{/if}}
}`,
      defaultParams: {
        name: 'my-instance',
        machineType: 'n2-standard-2',
        zone: 'us-central1-a',
        network: 'default',
        bootDiskImage: 'debian-cloud/debian-11',
        bootDiskSizeGb: 20,
        bootDiskType: 'pd-standard',
        bootDiskAutoDelete: true,
        createServiceAccount: true,
        serviceAccountId: 'my-custom-sa',
        serviceAccountDisplayName: 'Custom SA for VM Instance',
        serviceAccountScopes: ['cloud-platform'],
        tags: ['foo', 'bar'],
        metadata: { foo: 'bar' },
        metadataStartupScript: 'echo hi > /test.txt',
        scratchDisks: [{ interface: 'NVME' }],
        labels: { my_label: 'value' },
        canIpForward: false,
        deletionProtection: false,
        scheduling: {
          automaticRestart: true,
          onHostMaintenance: 'MIGRATE',
          preemptible: false
        },
        allowStoppingForUpdate: true,
        desiredStatus: 'RUNNING'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pulumi-gcp-compute-1',
      name: 'GCP Compute Instance (Pulumi)',
      description: 'GCP Compute Engine defined with Pulumi including service account',
      tool: 'pulumi',
      provider: 'gcp',
      resourceType: 'compute',
      template: `import * as gcp from "@pulumi/gcp";

{{#if createServiceAccount}}
// Service Account
const {{camelResourceName}}Sa = new gcp.serviceaccount.Account("{{serviceAccountId}}", {
    accountId: "{{serviceAccountId}}",
    displayName: "{{serviceAccountDisplayName}}",
});
{{/if}}

// Compute Engine Instance
const {{camelResourceName}} = new gcp.compute.Instance("{{name}}", {
    name: "{{name}}",
    machineType: "{{machineType}}",
    zone: "{{zone}}",
    {{#if project}}
    project: "{{project}}",
    {{/if}}
    {{#if description}}
    description: "{{description}}",
    {{/if}}
    
    networkInterfaces: [{
        network: "{{network}}",
        {{#if subnetwork}}
        subnetwork: "{{subnetwork}}",
        {{/if}}
        {{#if accessConfigs}}
        accessConfigs: [
        {{#each accessConfigs}}
        {
            {{#if natIp}}
            natIp: "{{natIp}}",
            {{/if}}
            networkTier: "{{networkTier}}",
        }{{#unless @last}},{{/unless}}
        {{/each}}
        ],
        {{else}}
        accessConfigs: [{}],
        {{/if}}
    }],
    
    bootDisk: {
        autoDelete: {{bootDiskAutoDelete}},
        {{#if bootDiskDeviceName}}
        deviceName: "{{bootDiskDeviceName}}",
        {{/if}}
        initializeParams: {
            image: "{{bootDiskImage}}",
            diskSizeGb: {{bootDiskSizeGb}},
            diskType: "{{bootDiskType}}",
            {{#if bootDiskLabels}}
            labels: {
                {{#each bootDiskLabels}}
                {{@key}}: "{{this}}",
                {{/each}}
            },
            {{/if}}
        },
    },
    
    {{#if attachedDisks}}
    attachedDisks: [
    {{#each attachedDisks}}
    {
        source: "{{source}}",
        {{#if deviceName}}
        deviceName: "{{deviceName}}",
        {{/if}}
        mode: "{{mode}}",
    }{{#unless @last}},{{/unless}}
    {{/each}}
    ],
    {{/if}}
    
    {{#if scratchDisks}}
    scratchDisks: [
    {{#each scratchDisks}}
    {
        interface: "{{interface}}",
    }{{#unless @last}},{{/unless}}
    {{/each}}
    ],
    {{/if}}
    
    {{#if serviceAccount}}
    serviceAccount: {
        {{#if createServiceAccount}}
        email: {{camelResourceName}}Sa.email,
        {{else}}
        email: "{{serviceAccountEmail}}",
        {{/if}}
        scopes: [{{#each serviceAccountScopes}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
    },
    {{/if}}
    
    {{#if tags}}
    tags: [{{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
    {{/if}}
    
    {{#if labels}}
    labels: {
        {{#each labels}}
        {{@key}}: "{{this}}",
        {{/each}}
    },
    {{/if}}
    
    {{#if metadata}}
    metadata: {
        {{#each metadata}}
        {{@key}}: "{{this}}",
        {{/each}}
    },
    {{/if}}
    
    {{#if metadataStartupScript}}
    metadataStartupScript: \`{{metadataStartupScript}}\`,
    {{/if}}
    
    {{#if canIpForward}}
    canIpForward: {{canIpForward}},
    {{/if}}
    
    {{#if deletionProtection}}
    deletionProtection: {{deletionProtection}},
    {{/if}}
    
    {{#if enableDisplay}}
    enableDisplay: {{enableDisplay}},
    {{/if}}
    
    {{#if minCpuPlatform}}
    minCpuPlatform: "{{minCpuPlatform}}",
    {{/if}}
    
    {{#if scheduling}}
    scheduling: {
        automaticRestart: {{scheduling.automaticRestart}},
        onHostMaintenance: "{{scheduling.onHostMaintenance}}",
        preemptible: {{scheduling.preemptible}},
    },
    {{/if}}
    
    {{#if allowStoppingForUpdate}}
    allowStoppingForUpdate: {{allowStoppingForUpdate}},
    {{/if}}
    
    {{#if desiredStatus}}
    desiredStatus: "{{desiredStatus}}",
    {{/if}}
});

export const {{camelResourceName}}Ip = {{camelResourceName}}.networkInterfaces[0].accessConfigs[0].natIp;
export const {{camelResourceName}}InternalIp = {{camelResourceName}}.networkInterfaces[0].networkIp;
{{#if createServiceAccount}}
export const {{camelResourceName}}ServiceAccountEmail = {{camelResourceName}}Sa.email;
{{/if}}`,
      defaultParams: {
        name: 'my-instance',
        machineType: 'n2-standard-2',
        zone: 'us-central1-a',
        network: 'default',
        bootDiskImage: 'debian-cloud/debian-11',
        bootDiskSizeGb: 20,
        bootDiskType: 'pd-standard',
        bootDiskAutoDelete: true,
        createServiceAccount: true,
        serviceAccountId: 'my-custom-sa',
        serviceAccountDisplayName: 'Custom SA for VM Instance',
        serviceAccountScopes: ['cloud-platform'],
        tags: ['foo', 'bar'],
        metadata: { foo: 'bar' },
        metadataStartupScript: 'echo hi > /test.txt',
        scratchDisks: [{ interface: 'NVME' }],
        labels: { my_label: 'value' },
        canIpForward: false,
        deletionProtection: false,
        scheduling: {
          automaticRestart: true,
          onHostMaintenance: 'MIGRATE',
          preemptible: false
        },
        allowStoppingForUpdate: true,
        desiredStatus: 'RUNNING'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // GCP Ansible template
    {
      id: 'ansible-gcp-compute-1',
      name: 'GCP Compute Instance (Ansible)',
      description: 'Provision GCP Compute Engine instance with Ansible',
      tool: 'ansible',
      provider: 'gcp',
      resourceType: 'compute',
      template: `---
- name: Create GCP Compute Instance
  hosts: localhost
  connection: local
  gather_facts: false
  
  vars:
    gcp_project: "{{project}}"
    gcp_cred_kind: serviceaccount
    gcp_cred_file: "{{credentialsFile}}"
    zone: "{{zone}}"
    region: "{{region}}"
    
  tasks:
{{#if createServiceAccount}}
    - name: Create service account
      google.cloud.gcp_iam_service_account:
        name: "{{serviceAccountId}}"
        display_name: "{{serviceAccountDisplayName}}"
        project: "{{ gcp_project }}"
        auth_kind: "{{ gcp_cred_kind }}"
        service_account_file: "{{ gcp_cred_file }}"
        state: present
      register: sa_result
{{/if}}

    - name: Create compute instance
      google.cloud.gcp_compute_instance:
        name: "{{name}}"
        machine_type: "{{machineType}}"
        zone: "{{ zone }}"
        project: "{{ gcp_project }}"
        auth_kind: "{{ gcp_cred_kind }}"
        service_account_file: "{{ gcp_cred_file }}"
{{#if description}}
        description: "{{description}}"
{{/if}}
        
        disks:
          - auto_delete: {{bootDiskAutoDelete}}
{{#if bootDiskDeviceName}}
            device_name: "{{bootDiskDeviceName}}"
{{/if}}
            boot: true
            initialize_params:
              source_image: "{{bootDiskImage}}"
              disk_size_gb: {{bootDiskSizeGb}}
              disk_type: "{{bootDiskType}}"
{{#if bootDiskLabels}}
              labels:
{{#each bootDiskLabels}}
                {{@key}}: "{{this}}"
{{/each}}
{{/if}}
{{#if attachedDisks}}
{{#each attachedDisks}}
          - source: "{{source}}"
{{#if deviceName}}
            device_name: "{{deviceName}}"
{{/if}}
            mode: "{{mode}}"
            auto_delete: false
{{/each}}
{{/if}}
{{#if scratchDisks}}
{{#each scratchDisks}}
          - type: "SCRATCH"
            interface: "{{interface}}"
            auto_delete: true
{{/each}}
{{/if}}
        
        network_interfaces:
          - network:
              selfLink: "global/networks/{{network}}"
{{#if subnetwork}}
            subnetwork:
              selfLink: "regions/{{ region }}/subnetworks/{{subnetwork}}"
{{/if}}
{{#if accessConfigs}}
            access_configs:
{{#each accessConfigs}}
              - name: External NAT
                type: ONE_TO_ONE_NAT
{{#if natIp}}
                nat_ip: "{{natIp}}"
{{/if}}
                network_tier: "{{networkTier}}"
{{/each}}
{{else}}
            access_configs:
              - name: External NAT
                type: ONE_TO_ONE_NAT
{{/if}}
        
{{#if serviceAccount}}
        service_accounts:
          - email: "{{#if createServiceAccount}}{{ sa_result.email }}{{else}}{{serviceAccountEmail}}{{/if}}"
            scopes:
{{#each serviceAccountScopes}}
              - "{{this}}"
{{/each}}
{{/if}}

{{#if tags}}
        tags:
          items:
{{#each tags}}
            - "{{this}}"
{{/each}}
{{/if}}

{{#if labels}}
        labels:
{{#each labels}}
          {{@key}}: "{{this}}"
{{/each}}
{{/if}}

{{#if metadata}}
        metadata:
{{#each metadata}}
          {{@key}}: "{{this}}"
{{/each}}
{{/if}}

{{#if metadataStartupScript}}
        metadata:
          startup-script: |
{{metadataStartupScript}}
{{/if}}

{{#if canIpForward}}
        can_ip_forward: {{canIpForward}}
{{/if}}

{{#if deletionProtection}}
        deletion_protection: {{deletionProtection}}
{{/if}}

{{#if enableDisplay}}
        enable_display: {{enableDisplay}}
{{/if}}

{{#if minCpuPlatform}}
        min_cpu_platform: "{{minCpuPlatform}}"
{{/if}}

{{#if scheduling}}
        scheduling:
          automatic_restart: {{scheduling.automaticRestart}}
          on_host_maintenance: "{{scheduling.onHostMaintenance}}"
          preemptible: {{scheduling.preemptible}}
{{/if}}

        state: "{{#if desiredStatus}}{{#if (eq desiredStatus 'RUNNING')}}present{{else}}stopped{{/if}}{{else}}present{{/if}}"
        
      register: instance_result
      
    - name: Display instance information
      debug:
        msg: 
          - "Instance created: {{ instance_result.name }}"
          - "Internal IP: {{ instance_result.network_interfaces[0].network_ip }}"
{{#if accessConfigs}}
          - "External IP: {{ instance_result.network_interfaces[0].access_configs[0].nat_ip }}"
{{/if}}`,
      defaultParams: {
        project: 'my-gcp-project',
        credentialsFile: '/path/to/service-account.json',
        name: 'my-instance',
        machineType: 'n2-standard-2',
        zone: 'us-central1-a',
        region: 'us-central1',
        network: 'default',
        bootDiskImage: 'projects/debian-cloud/global/images/family/debian-11',
        bootDiskSizeGb: 20,
        bootDiskType: 'pd-standard',
        bootDiskAutoDelete: true,
        createServiceAccount: true,
        serviceAccountId: 'my-custom-sa',
        serviceAccountDisplayName: 'Custom SA for VM Instance',
        serviceAccountScopes: ['https://www.googleapis.com/auth/cloud-platform'],
        tags: ['foo', 'bar'],
        metadata: { foo: 'bar' },
        metadataStartupScript: 'echo hi > /test.txt',
        scratchDisks: [{ interface: 'NVME' }],
        labels: { my_label: 'value' },
        canIpForward: false,
        deletionProtection: false,
        scheduling: {
          automaticRestart: true,
          onHostMaintenance: 'MIGRATE',
          preemptible: false
        },
        desiredStatus: 'RUNNING'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    
    // GCP CloudFormation template (using AWS CloudFormation with custom resources or scripts)
    {
      id: 'cf-gcp-compute-1',
      name: 'GCP Compute Instance (CloudFormation)',
      description: 'GCP Compute Engine instance using CloudFormation with custom resource',
      tool: 'cloudformation',
      provider: 'gcp',
      resourceType: 'compute',
      template: `AWSTemplateFormatVersion: '2010-09-09'
Description: 'GCP Compute Engine Instance via Custom Resource'

Parameters:
  GCPProjectId:
    Type: String
    Default: "{{project}}"
    Description: GCP Project ID
    
  InstanceName:
    Type: String
    Default: "{{name}}"
    Description: Name of the GCP compute instance
    
  MachineType:
    Type: String
    Default: "{{machineType}}"
    Description: GCP machine type
    
  Zone:
    Type: String
    Default: "{{zone}}"
    Description: GCP zone
    
  BootDiskImage:
    Type: String
    Default: "{{bootDiskImage}}"
    Description: Boot disk image
    
  BootDiskSizeGb:
    Type: Number
    Default: {{bootDiskSizeGb}}
    Description: Boot disk size in GB
    
  BootDiskType:
    Type: String
    Default: "{{bootDiskType}}"
    Description: Boot disk type
    
  Network:
    Type: String
    Default: "{{network}}"
    Description: Network name

Resources:
{{#if createServiceAccount}}
  GCPServiceAccount:
    Type: AWS::CloudFormation::CustomResource
    Properties:
      ServiceToken: !GetAtt GCPResourceFunction.Arn
      ResourceType: ServiceAccount
      Properties:
        project: !Ref GCPProjectId
        accountId: "{{serviceAccountId}}"
        displayName: "{{serviceAccountDisplayName}}"
{{/if}}

  GCPComputeInstance:
    Type: AWS::CloudFormation::CustomResource
{{#if createServiceAccount}}
    DependsOn: GCPServiceAccount
{{/if}}
    Properties:
      ServiceToken: !GetAtt GCPResourceFunction.Arn
      ResourceType: ComputeInstance
      Properties:
        project: !Ref GCPProjectId
        name: !Ref InstanceName
        machineType: !Ref MachineType
        zone: !Ref Zone
{{#if description}}
        description: "{{description}}"
{{/if}}
        
        bootDisk:
          autoDelete: {{bootDiskAutoDelete}}
{{#if bootDiskDeviceName}}
          deviceName: "{{bootDiskDeviceName}}"
{{/if}}
          initializeParams:
            sourceImage: !Ref BootDiskImage
            diskSizeGb: !Ref BootDiskSizeGb
            diskType: !Ref BootDiskType
        
        networkInterfaces:
          - network: !Ref Network
{{#if accessConfigs}}
            accessConfigs:
{{#each accessConfigs}}
              - type: "ONE_TO_ONE_NAT"
{{#if natIp}}
                natIp: "{{natIp}}"
{{/if}}
                networkTier: "{{networkTier}}"
{{/each}}
{{else}}
            accessConfigs:
              - type: "ONE_TO_ONE_NAT"
{{/if}}
        
{{#if serviceAccount}}
        serviceAccounts:
          - email: "{{serviceAccountEmail}}"
            scopes:
{{#each serviceAccountScopes}}
              - "{{this}}"
{{/each}}
{{/if}}

{{#if tags}}
        tags:
{{#each tags}}
          - "{{this}}"
{{/each}}
{{/if}}

{{#if labels}}
        labels:
{{#each labels}}
          {{@key}}: "{{this}}"
{{/each}}
{{/if}}

{{#if metadata}}
        metadata:
{{#each metadata}}
          {{@key}}: "{{this}}"
{{/each}}
{{/if}}

{{#if canIpForward}}
        canIpForward: {{canIpForward}}
{{/if}}

{{#if deletionProtection}}
        deletionProtection: {{deletionProtection}}
{{/if}}

{{#if scheduling}}
        scheduling:
          automaticRestart: {{scheduling.automaticRestart}}
          onHostMaintenance: "{{scheduling.onHostMaintenance}}"
          preemptible: {{scheduling.preemptible}}
{{/if}}

  # Lambda function to handle GCP resources (implementation required)
  GCPResourceFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "\${AWS::StackName}-gcp-resource-handler"
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt GCPResourceRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          # Python code for GCP resource management would go here
          # This would include gcloud CLI commands or GCP API calls
          # to create/update/delete GCP compute instances
          import json
          def handler(event, context):
              return {'Status': 'SUCCESS'}

  GCPResourceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

Outputs:
  InstanceName:
    Description: 'Name of the created GCP compute instance'
    Value: !GetAtt GCPComputeInstance.name
    
  InternalIP:
    Description: 'Internal IP address of the instance'
    Value: !GetAtt GCPComputeInstance.internalIp
    
  ExternalIP:
    Description: 'External IP address of the instance'
    Value: !GetAtt GCPComputeInstance.externalIp
    
{{#if createServiceAccount}}
  ServiceAccountEmail:
    Description: 'Email of the created service account'
    Value: !GetAtt GCPServiceAccount.email
{{/if}}`,
      defaultParams: {
        project: 'my-gcp-project',
        name: 'my-instance',
        machineType: 'n2-standard-2',
        zone: 'us-central1-a',
        network: 'default',
        bootDiskImage: 'projects/debian-cloud/global/images/family/debian-11',
        bootDiskSizeGb: 20,
        bootDiskType: 'pd-standard',
        bootDiskAutoDelete: true,
        createServiceAccount: true,
        serviceAccountId: 'my-custom-sa',
        serviceAccountDisplayName: 'Custom SA for VM Instance',
        serviceAccountScopes: ['https://www.googleapis.com/auth/cloud-platform'],
        tags: ['foo', 'bar'],
        metadata: { foo: 'bar' },
        metadataStartupScript: 'echo hi > /test.txt',
        scratchDisks: [{ interface: 'NVME' }],
        labels: { my_label: 'value' },
        canIpForward: false,
        deletionProtection: false,
        scheduling: {
          automaticRestart: true,
          onHostMaintenance: 'MIGRATE',
          preemptible: false
        },
        desiredStatus: 'RUNNING'
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
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter: string, index: number) => 
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
