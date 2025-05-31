import { GCPComputeNetworkConfig } from './network'; // Asumiremos que este tipo está en network.ts
import { CodeTemplate } from '../../../../../types/resourceConfig';

export function generateGCPComputeNetworkTemplates(config: GCPComputeNetworkConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_compute_network" "${config.name}" {
  name                    = "${config.name}"
  project                 = "${config.project}"
  auto_create_subnetworks = ${config.auto_create_subnetworks}
  mtu                     = ${config.mtu}
  routing_mode            = "${config.routing_mode}"
  ${config.description ? `description             = "${config.description}"`: ''}
  ${config.delete_default_routes_on_create ? `delete_default_routes_on_create = ${config.delete_default_routes_on_create}`: ''}
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Network = new gcp.compute.Network("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    autoCreateSubnetworks: ${config.auto_create_subnetworks},
    mtu: ${config.mtu},
    routingMode: "${config.routing_mode}",
    ${config.description ? `description: "${config.description}",`: ''}
    ${config.delete_default_routes_on_create ? `deleteDefaultRoutesOnCreate: ${config.delete_default_routes_on_create},`: ''}
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP VPC Network (requiere google.cloud collection)
- name: Create VPC Network
  google.cloud.gcp_compute_network:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    auto_create_subnetworks: ${config.auto_create_subnetworks}
    routing_mode: "${config.routing_mode}"
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP VPC Networks.\n"
  };
}

/*
export const networkTemplates: ResourceTemplate[] = [
 // ... (contenido anterior del array) ...
];
*/
