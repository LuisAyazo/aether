import { GCPComputeInstanceTemplateConfig } from './instanceTemplate'; // Asumiremos que este tipo está en instanceTemplate.ts
import { CodeTemplate } from '../../../../../types/resourceConfig';

export function generateGCPComputeInstanceTemplateTemplates(config: GCPComputeInstanceTemplateConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_compute_instance_template" "${config.name}" {
  name_prefix  = "${config.name}-" # Terraform recomienda name_prefix para instance templates
  project      = "${config.project}"
  machine_type = "${config.machine_type}"
  region       = "${config.region}" # Instance templates son recursos regionales

  disk {
    source_image = "projects/${config.image.project}/global/images/family/${config.image.family}"
    auto_delete  = ${config.disk?.auto_delete !== undefined ? config.disk.auto_delete : true}
    boot         = true
    disk_size_gb = ${config.disk?.size_gb || 20}
    disk_type    = "pd-${config.disk?.type || 'standard'}"
  }

  ${config.network_interface ? `
  network_interface {
    network    = "${config.network_interface.network || 'default'}"
    ${config.network_interface.subnetwork ? `subnetwork = "${config.network_interface.subnetwork}"` : ''}
    ${config.network_interface.access_config ? `
    access_config {
      // Ephemeral IP
    }` : ''}
  }` : `
  network_interface {
    network = "default" 
    access_config {} // Default to an ephemeral IP if not specified otherwise
  }`}

  ${config.service_account ? `
  service_account {
    email  = "${config.service_account.email || 'default'}"
    scopes = ["${(config.service_account.scopes || 'cloud-platform').split(',').map(s => s.trim()).join('", "')}"]
  }` : ''}

  ${config.tags ? `tags = ["${config.tags.split(',').map(s => s.trim()).join('", "')}"]` : ''}

  ${config.metadata?.startup_script || config.metadata?.ssh_keys ? `
  metadata = {
    ${config.metadata.startup_script ? `startup-script = <<-EOT\n${config.metadata.startup_script}\nEOT` : ''}
    ${config.metadata.ssh_keys ? `ssh-keys       = "${config.metadata.ssh_keys}"` : ''}
  }`: ''}
  
  labels = {
    ${config.labels?.environment ? `environment = "${config.labels.environment}"` : ''}
    ${config.labels?.team ? `team        = "${config.labels.team}"` : ''}
  }

  ${config.description ? `description = "${config.description}"`: ''}

  lifecycle {
    create_before_destroy = true
  }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Template = new gcp.compute.InstanceTemplate("${config.name}", {
    namePrefix: "${config.name}-",
    project: "${config.project}",
    machineType: "${config.machine_type}",
    region: "${config.region}",
    disks: [{
        sourceImage: \`projects/${config.image.project}/global/images/family/${config.image.family}\`,
        autoDelete: ${config.disk?.auto_delete !== undefined ? config.disk.auto_delete : true},
        boot: true,
        diskSizeGb: ${config.disk?.size_gb || 20},
        type: \`pd-${config.disk?.type || 'standard'}\`,
    }],
    networkInterfaces: [${config.network_interface ? `{
        network: "${config.network_interface.network || 'default'}",
        ${config.network_interface.subnetwork ? `subnetwork: "${config.network_interface.subnetwork}",` : ''}
        ${config.network_interface.access_config ? `accessConfigs: [{}],` : ''}
    }` : `{ network: "default", accessConfigs: [{}] }`}],
    ${config.service_account ? `serviceAccount: {
        email: "${config.service_account.email || 'default'}",
        scopes: ["${(config.service_account.scopes || 'cloud-platform').split(',').map(s => s.trim()).join('", "')}"],
    },` : ''}
    ${config.tags ? `tags: ["${config.tags.split(',').map(s => s.trim()).join('", "')}"],` : ''}
    ${config.metadata?.startup_script || config.metadata?.ssh_keys ? `metadata: {
        ${config.metadata.startup_script ? `startupScript: \`${config.metadata.startup_script.replace(/\`/g, '\\\\`')}\`,` : ''}
        ${config.metadata.ssh_keys ? `sshKeys: "${config.metadata.ssh_keys}",` : ''}
    },`: ''}
    labels: {
        ${config.labels?.environment ? `environment: "${config.labels.environment}",` : ''}
        ${config.labels?.team ? `team: "${config.labels.team}",` : ''}
    },
    ${config.description ? `description: "${config.description}",`: ''}
});
`;

  return {
    terraform,
    pulumi,
    ansible: "# Ansible para GCP Instance Template (requiere google.cloud collection)\n- name: Create Instance Template\n  google.cloud.gcp_compute_instance_template:\n    name_prefix: \"${config.name}-\"\n    project: \"{{ project_id | default('${config.project}') }}\"\n    machine_type: \"${config.machine_type}\"\n    region: \"${config.region}\"\n    disks:\n      - auto_delete: ${config.disk?.auto_delete !== undefined ? config.disk.auto_delete : true}\n        boot: true\n        initialize_params:\n          source_image: \"projects/${config.image.project}/global/images/family/${config.image.family}\"\n          disk_size_gb: ${config.disk?.size_gb || 20}\n          disk_type: \"pd-${config.disk?.type || 'standard'}\"\n    network_interfaces:\n      - network: \"${config.network_interface?.network || 'default'}\"\n        # access_configs: para IP efímera\n    state: present\n",
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Instance Templates.\n"
  };
}

/*
export const instanceTemplateTemplates: ResourceTemplate[] = [
 // ... (contenido anterior del array) ...
];
*/
