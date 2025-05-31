import { GCPComputeInstanceConfig } from './instance';

export interface CodeTemplate {
  terraform: string;
  pulumi: string;
  ansible: string;
  cloudformation?: string;
}

export function generateGCPComputeInstanceTemplates(config: GCPComputeInstanceConfig): CodeTemplate {
  return {
    terraform: generateTerraformTemplate(config),
    pulumi: generatePulumiTemplate(config),
    ansible: generateAnsibleTemplate(config),
  };
}

function generateTerraformTemplate(config: GCPComputeInstanceConfig): string {
  const {
    name,
    machine_type,
    zone,
    project,
    network_interfaces,
    boot_disk,
    service_account,
    create_service_account,
    metadata_startup_script,
    metadata,
    tags,
    labels,
    scheduling,
    deletion_protection,
    description,
    attached_disks,
    scratch_disks,
    can_ip_forward,
    enable_display,
    min_cpu_platform,
    allow_stopping_for_update,
    desired_status,
  } = config;

  let terraform = `# GCP Compute Engine Instance`;

  // Service Account creation if needed
  if (create_service_account?.create) {
    terraform += `
resource "google_service_account" "${name}_sa" {
  account_id   = "${create_service_account.account_id || name + '-sa'}"
  display_name = "${create_service_account.display_name || 'Service Account for ' + name}"
}

`;
  }

  terraform += `
resource "google_compute_instance" "${name}" {
  name         = "${name}"
  machine_type = "${machine_type}"
  zone         = "${zone}"`;

  if (project) {
    terraform += `
  project      = "${project}"`;
  }

  if (description) {
    terraform += `\n  description  = "${description}"`;
  }

  // Network interfaces
  terraform += `\n\n  network_interface {`;
  const networkInterface = network_interfaces[0];
  terraform += `\n    network = "${networkInterface.network}"`;
  
  if (networkInterface.subnetwork) {
    terraform += `\n    subnetwork = "${networkInterface.subnetwork}"`;
  }

  if (networkInterface.access_config && networkInterface.access_config.length > 0) {
    terraform += `\n\n    access_config {`;
    const accessConfig = networkInterface.access_config[0];
    if (accessConfig && accessConfig.nat_ip) {
      terraform += `\n      nat_ip = "${accessConfig.nat_ip}"`;
    }
    if (accessConfig && accessConfig.network_tier) {
      terraform += `\n      network_tier = "${accessConfig.network_tier}"`;
    }
    terraform += `\n    }`;
  }
  terraform += `\n  }`;

  // Boot disk
  terraform += `\n\n  boot_disk {`;
  terraform += `\n    auto_delete = ${boot_disk.auto_delete}`;
  
  if (boot_disk.initialize_params) {
    terraform += `\n\n    initialize_params {`;
    terraform += `\n      image = "${boot_disk.initialize_params.image}"`;
    terraform += `\n      size  = ${boot_disk.initialize_params.disk_size_gb}`;
    terraform += `\n      type  = "${boot_disk.initialize_params.disk_type}"`;
    
    if (boot_disk.initialize_params.labels) {
      terraform += `\n      labels = {`;
      Object.entries(boot_disk.initialize_params.labels).forEach(([key, value]) => {
        terraform += `\n        "${key}" = "${value}"`;
      });
      terraform += `\n      }`;
    }
    terraform += `\n    }`;
  }
  terraform += `\n  }`;

  // Attached disks
  if (attached_disks && attached_disks.length > 0) {
    attached_disks.forEach((disk) => {
      terraform += `\n\n  attached_disk {`;
      terraform += `\n    source = "${disk.source}"`;
      if (disk.device_name) {
        terraform += `\n    device_name = "${disk.device_name}"`;
      }
      terraform += `\n    mode = "${disk.mode}"`;
      terraform += `\n  }`;
    });
  }

  // Scratch disks
  if (scratch_disks && scratch_disks.length > 0) {
    scratch_disks.forEach((disk) => {
      terraform += `\n\n  scratch_disk {`;
      terraform += `\n    interface = "${disk.interface}"`;
      terraform += `\n  }`;
    });
  }

  // Service account
  if (service_account) {
    terraform += `\n\n  service_account {`;
    if (create_service_account?.create) {
      terraform += `\n    email = google_service_account.${name}_sa.email`;
    } else if (service_account.email) {
      terraform += `\n    email = "${service_account.email}"`;
    }
    if (service_account.scopes) {
      terraform += `\n    scopes = [${service_account.scopes.map(scope => `"${scope}"`).join(', ')}]`;
    }
    terraform += `\n  }`;
  }

  // Metadata (general metadata)
  if (metadata && Object.keys(metadata).length > 0) {
    terraform += `\n\n  metadata = {`;
    Object.entries(metadata).forEach(([key, value]) => {
      terraform += `\n    "${key}" = "${value}"`;
    });
    terraform += `\n  }`;
  }

  // Metadata startup script
  if (metadata_startup_script) {
    terraform += `\n\n  metadata_startup_script = <<-EOF`;
    terraform += `\n${metadata_startup_script}`;
    terraform += `\nEOF`;
  }

  // Tags
  if (tags && tags.length > 0) {
    terraform += `\n\n  tags = [${tags.map(tag => `"${tag}"`).join(', ')}]`;
  }

  // Labels
  if (labels) {
    terraform += `\n\n  labels = {`;
    Object.entries(labels).forEach(([key, value]) => {
      terraform += `\n    "${key}" = "${value}"`;
    });
    terraform += `\n  }`;
  }

  // Advanced configuration
  if (can_ip_forward !== undefined) {
    terraform += `\n\n  can_ip_forward = ${can_ip_forward}`;
  }

  if (enable_display !== undefined) {
    terraform += `\n\n  enable_display = ${enable_display}`;
  }

  if (min_cpu_platform) {
    terraform += `\n\n  min_cpu_platform = "${min_cpu_platform}"`;
  }

  if (allow_stopping_for_update !== undefined) {
    terraform += `\n\n  allow_stopping_for_update = ${allow_stopping_for_update}`;
  }

  if (desired_status && desired_status !== 'RUNNING') {
    terraform += `\n\n  desired_status = "${desired_status}"`;
  }

  // Scheduling
  if (scheduling) {
    terraform += `\n\n  scheduling {`;
    terraform += `\n    automatic_restart = ${scheduling.automatic_restart}`;
    terraform += `\n    on_host_maintenance = "${scheduling.on_host_maintenance}"`;
    terraform += `\n    preemptible = ${scheduling.preemptible}`;
    terraform += `\n  }`;
  }

  // Deletion protection
  if (deletion_protection) {
    terraform += `\n\n  deletion_protection = ${deletion_protection}`;
  }

  terraform += `\n}`;

  return terraform;
}

function generatePulumiTemplate(config: GCPComputeInstanceConfig): string {
  const {
    name,
    machine_type,
    zone,
    project,
    network_interfaces,
    boot_disk,
    service_account,
    create_service_account,
    metadata_startup_script,
    metadata,
    tags,
    labels,
    scheduling,
    deletion_protection,
    description,
    attached_disks,
    scratch_disks,
    can_ip_forward,
    enable_display,
    min_cpu_platform,
    allow_stopping_for_update,
    desired_status,
  } = config;

  let pulumi = `import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

`;

  // Service Account creation if needed
  if (create_service_account?.create) {
    const saName = name.replace(/-/g, '_') + '_sa';
    pulumi += `// Service Account
const ${saName} = new gcp.serviceaccount.Account("${create_service_account.account_id || name + '-sa'}", {
    accountId: "${create_service_account.account_id || name + '-sa'}",
    displayName: "${create_service_account.display_name || 'Service Account for ' + name}",
});

`;
  }

  pulumi += `// GCP Compute Engine Instance
const ${name.replace(/-/g, '_')} = new gcp.compute.Instance("${name}", {`;

  pulumi += `\n    name: "${name}",`;
  pulumi += `\n    machineType: "${machine_type}",`;
  pulumi += `\n    zone: "${zone}",`;

  if (project) {
    pulumi += `\n    project: "${project}",`;
  }

  if (description) {
    pulumi += `\n    description: "${description}",`;
  }

  // Network interfaces
  pulumi += `\n    networkInterfaces: [{`;
  const networkInterface = network_interfaces[0];
  pulumi += `\n        network: "${networkInterface.network}",`;
  
  if (networkInterface.subnetwork) {
    pulumi += `\n        subnetwork: "${networkInterface.subnetwork}",`;
  }

  if (networkInterface.access_config && networkInterface.access_config.length > 0) {
    pulumi += `\n        accessConfigs: [{`;
    const accessConfig = networkInterface.access_config[0];
    if (accessConfig && accessConfig.nat_ip) {
      pulumi += `\n            natIp: "${accessConfig.nat_ip}",`;
    }
    if (accessConfig && accessConfig.network_tier) {
      pulumi += `\n            networkTier: "${accessConfig.network_tier}",`;
    }
    pulumi += `\n        }],`;
  }
  pulumi += `\n    }],`;

  // Boot disk
  pulumi += `\n    bootDisk: {`;
  pulumi += `\n        autoDelete: ${boot_disk.auto_delete},`;
  
  if (boot_disk.initialize_params) {
    pulumi += `\n        initializeParams: {`;
    pulumi += `\n            image: "${boot_disk.initialize_params.image}",`;
    pulumi += `\n            size: ${boot_disk.initialize_params.disk_size_gb},`;
    pulumi += `\n            type: "${boot_disk.initialize_params.disk_type}",`;
    
    if (boot_disk.initialize_params.labels) {
      pulumi += `\n            labels: {`;
      Object.entries(boot_disk.initialize_params.labels).forEach(([key, value]) => {
        pulumi += `\n                "${key}": "${value}",`;
      });
      pulumi += `\n            },`;
    }
    pulumi += `\n        },`;
  }
  pulumi += `\n    },`;

  // Attached disks
  if (attached_disks && attached_disks.length > 0) {
    pulumi += `\n    attachedDisks: [`;
    attached_disks.forEach((disk, index) => {
      pulumi += `\n        {`;
      pulumi += `\n            source: "${disk.source}",`;
      if (disk.device_name) {
        pulumi += `\n            deviceName: "${disk.device_name}",`;
      }
      pulumi += `\n            mode: "${disk.mode}",`;
      pulumi += `\n        }${index < attached_disks.length - 1 ? ',' : ''}`;
    });
    pulumi += `\n    ],`;
  }

  // Scratch disks
  if (scratch_disks && scratch_disks.length > 0) {
    pulumi += `\n    scratchDisks: [`;
    scratch_disks.forEach((disk, index) => {
      pulumi += `\n        {`;
      pulumi += `\n            interface: "${disk.interface}",`;
      pulumi += `\n        }${index < scratch_disks.length - 1 ? ',' : ''}`;
    });
    pulumi += `\n    ],`;
  }

  // Service account
  if (service_account) {
    pulumi += `\n    serviceAccount: {`;
    if (create_service_account?.create) {
      const saName = name.replace(/-/g, '_') + '_sa';
      pulumi += `\n        email: ${saName}.email,`;
    } else if (service_account.email) {
      pulumi += `\n        email: "${service_account.email}",`;
    }
    if (service_account.scopes) {
      pulumi += `\n        scopes: [${service_account.scopes.map(scope => `"${scope}"`).join(', ')}],`;
    }
    pulumi += `\n    },`;
  }

  // Metadata (general metadata)
  if (metadata && Object.keys(metadata).length > 0) {
    pulumi += `\n    metadata: {`;
    Object.entries(metadata).forEach(([key, value]) => {
      pulumi += `\n        "${key}": "${value}",`;
    });
    pulumi += `\n    },`;
  }

  // Metadata startup script
  if (metadata_startup_script) {
    pulumi += `\n    metadataStartupScript: \`${metadata_startup_script}\`,`;
  }

  // Tags
  if (tags && tags.length > 0) {
    pulumi += `\n    tags: [${tags.map(tag => `"${tag}"`).join(', ')}],`;
  }

  // Labels
  if (labels) {
    pulumi += `\n    labels: {`;
    Object.entries(labels).forEach(([key, value]) => {
      pulumi += `\n        "${key}": "${value}",`;
    });
    pulumi += `\n    },`;
  }

  // Advanced configuration
  if (can_ip_forward !== undefined) {
    pulumi += `\n    canIpForward: ${can_ip_forward},`;
  }

  if (enable_display !== undefined) {
    pulumi += `\n    enableDisplay: ${enable_display},`;
  }

  if (min_cpu_platform) {
    pulumi += `\n    minCpuPlatform: "${min_cpu_platform}",`;
  }

  if (allow_stopping_for_update !== undefined) {
    pulumi += `\n    allowStoppingForUpdate: ${allow_stopping_for_update},`;
  }

  if (desired_status && desired_status !== 'RUNNING') {
    pulumi += `\n    desiredStatus: "${desired_status}",`;
  }

  // Scheduling
  if (scheduling) {
    pulumi += `\n    scheduling: {`;
    pulumi += `\n        automaticRestart: ${scheduling.automatic_restart},`;
    pulumi += `\n        onHostMaintenance: "${scheduling.on_host_maintenance}",`;
    pulumi += `\n        preemptible: ${scheduling.preemptible},`;
    pulumi += `\n    },`;
  }

  // Deletion protection
  if (deletion_protection) {
    pulumi += `\n    deletionProtection: ${deletion_protection},`;
  }

  pulumi += `\n});`;

  pulumi += `\n\n// Export the instance's external IP
export const instanceExternalIp = ${name.replace(/-/g, '_')}.networkInterfaces[0].accessConfigs?.[0]?.natIp;`;

  return pulumi;
}

function generateAnsibleTemplate(config: GCPComputeInstanceConfig): string {
  const {
    name,
    machine_type,
    zone,
    project,
    network_interfaces,
    boot_disk,
    service_account,
    create_service_account,
    metadata_startup_script,
    metadata,
    tags,
    labels,
    scheduling,
    deletion_protection,
    description,
    attached_disks,
    scratch_disks,
    can_ip_forward,
    enable_display,
    min_cpu_platform,
    allow_stopping_for_update,
    desired_status,
  } = config;

  let ansible = `---
# GCP Compute Engine Instance Playbook
- name: Create GCP Compute Engine Instance
  hosts: localhost
  gather_facts: no
  vars:
    project_id: "{{ gcp_project_id }}"
    auth_kind: "{{ gcp_auth_kind }}"
    service_account_file: "{{ gcp_service_account_file }}"
    
  tasks:
    - name: Create Compute Engine Instance
      gcp_compute_instance:
        name: "${name}"
        machine_type: "${machine_type}"
        zone: "${zone}"
        project: "{{ project_id }}"
        auth_kind: "{{ auth_kind }}"
        service_account_file: "{{ service_account_file }}"
        state: present`;

  if (description) {
    ansible += `\n        description: "${description}"`;
  }

  // Network interfaces
  ansible += `\n        network_interfaces:`;
  const networkInterface = network_interfaces[0];
  ansible += `\n          - network:`;
  ansible += `\n              selfLink: "global/networks/${networkInterface.network}"`;
  
  if (networkInterface.subnetwork) {
    ansible += `\n            subnetwork:`;
    ansible += `\n              selfLink: "${networkInterface.subnetwork}"`;
  }

  if (networkInterface.access_config && networkInterface.access_config.length > 0) {
    ansible += `\n            access_configs:`;
    const accessConfig = networkInterface.access_config[0];
    if (accessConfig) {
      ansible += `\n              - name: "${accessConfig.name || 'External NAT'}"`;
      ansible += `\n                type: "${accessConfig.type || 'ONE_TO_ONE_NAT'}"`;
      if (accessConfig.network_tier) {
        ansible += `\n                network_tier: "${accessConfig.network_tier}"`;
      }
    }
  }

  // Boot disk
  ansible += `\n        disks:`;
  ansible += `\n          - auto_delete: ${boot_disk.auto_delete}`;
  ansible += `\n            boot: true`;
  
  if (boot_disk.initialize_params) {
    ansible += `\n            initialize_params:`;
    ansible += `\n              source_image: "${boot_disk.initialize_params.image}"`;
    ansible += `\n              disk_size_gb: ${boot_disk.initialize_params.disk_size_gb}`;
    ansible += `\n              disk_type: "${boot_disk.initialize_params.disk_type}"`;
    
    if (boot_disk.initialize_params.labels) {
      ansible += `\n              labels:`;
      Object.entries(boot_disk.initialize_params.labels).forEach(([key, value]) => {
        ansible += `\n                ${key}: "${value}"`;
      });
    }
  }

  // Service account
  if (service_account) {
    ansible += `\n        service_accounts:`;
    ansible += `\n          - email: "${service_account.email || 'default'}"`;
    if (service_account.scopes) {
      ansible += `\n            scopes:`;
      service_account.scopes.forEach(scope => {
        ansible += `\n              - "${scope}"`;
      });
    }
  }

  // Metadata
  if (metadata_startup_script) {
    ansible += `\n        metadata:`;
    ansible += `\n          startup-script: |`;
    metadata_startup_script.split('\n').forEach(line => {
      ansible += `\n            ${line}`;
    });
  }

  // Tags
  if (tags && tags.length > 0) {
    ansible += `\n        tags:`;
    ansible += `\n          items:`;
    tags.forEach(tag => {
      ansible += `\n            - "${tag}"`;
    });
  }

  // Labels
  if (labels) {
    ansible += `\n        labels:`;
    Object.entries(labels).forEach(([key, value]) => {
      ansible += `\n          ${key}: "${value}"`;
    });
  }

  // Scheduling
  if (scheduling) {
    ansible += `\n        scheduling:`;
    ansible += `\n          automatic_restart: ${scheduling.automatic_restart}`;
    ansible += `\n          on_host_maintenance: "${scheduling.on_host_maintenance}"`;
    ansible += `\n          preemptible: ${scheduling.preemptible}`;
  }

  // Deletion protection
  if (deletion_protection) {
    ansible += `\n        deletion_protection: ${deletion_protection}`;
  }

  return ansible;
}
