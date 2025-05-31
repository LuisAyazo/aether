import { GCPComputeDiskConfig } from './disk'; // Asumiremos que este tipo está en disk.ts
import { CodeTemplate } from '../../../../../types/resourceConfig';

export function generateGCPComputeDiskTemplates(config: GCPComputeDiskConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_compute_disk" "${config.name}" {
  name    = "${config.name}"
  project = "${config.project}"
  zone    = "${config.zone}"
  size    = ${config.size}
  type    = "${config.type}"
  ${config.image?.name ? `image   = "${config.image.project ? `${config.image.project}/` : ''}${config.image.family ? `${config.image.family}/` : ''}${config.image.name}"` : ''}
  ${config.snapshot ? `snapshot = "${config.snapshot}"` : ''}
  ${config.description ? `description = "${config.description}"`: ''}

  labels = {
    ${config.labels?.environment ? `environment = "${config.labels.environment}"` : ''}
    ${config.labels?.team ? `team        = "${config.labels.team}"` : ''}
  }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Disk = new gcp.compute.Disk("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    zone: "${config.zone}",
    size: ${config.size},
    type: "${config.type}",
    ${config.image?.name ? `image: "${config.image.project ? `${config.image.project}/` : ''}${config.image.family ? `${config.image.family}/` : ''}${config.image.name}",` : ''}
    ${config.snapshot ? `snapshot: "${config.snapshot}",` : ''}
    ${config.description ? `description: "${config.description}",`: ''}
    labels: {
        ${config.labels?.environment ? `environment: "${config.labels.environment}",` : ''}
        ${config.labels?.team ? `team: "${config.labels.team}",` : ''}
    },
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Compute Disk (requiere google.cloud collection)
- name: Create Compute Disk
  google.cloud.gcp_compute_disk:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    zone: "${config.zone}"
    size_gb: ${config.size}
    type: "${config.type}"
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Compute Disk.\n"
  };
}

// El array diskTemplates original con ejemplos de configuración puede eliminarse o mantenerse
// si se usa en otro lugar para poblar el formulario con ejemplos, pero no para la generación de código IaC.
// Por ahora, lo comentaré para evitar confusión.
/*
export const diskTemplates: ResourceTemplate[] = [
  // ... (contenido anterior) ...
];
*/
