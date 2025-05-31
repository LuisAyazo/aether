import { GCPComputeInstanceGroupConfig } from './instanceGroup'; // Corregido el nombre del tipo
import { CodeTemplate } from '../../../../../types/resourceConfig';

export function generateGCPInstanceGroupTemplates(config: GCPComputeInstanceGroupConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');
  const isRegional = !!config.region; // Los grupos de instancias pueden ser zonales o regionales

  const terraform = `
resource "google_compute_${isRegional ? 'region_' : ''}instance_group_manager" "${config.name}" {
  name               = "${config.name}"
  project            = "${config.project}"
  ${isRegional ? `region             = "${config.region}"` : `zone               = "${config.zone}"`}
  base_instance_name = "${config.base_instance_name}"
  target_size        = ${config.target_size}

  version {
    instance_template = "${config.version[0].instance_template}" # Acceder al primer elemento del array
    name              = "${config.version[0].name || 'primary'}"   # Acceder al primer elemento del array
  }

  ${config.auto_healing_policies && config.auto_healing_policies[0] ? `
  auto_healing_policies {
    health_check      = "${config.auto_healing_policies[0].health_check}" # Acceder al primer elemento
    initial_delay_sec = ${config.auto_healing_policies[0].initial_delay_sec}   # Acceder al primer elemento
  }` : ''}

  ${config.update_policy ? `
  update_policy {
    type          = "${config.update_policy.type}"
    minimal_action = "${config.update_policy.minimal_action}"
    ${config.update_policy.max_surge_fixed !== undefined ? `max_surge_fixed          = ${config.update_policy.max_surge_fixed}`: ''}
    ${config.update_policy.max_unavailable_fixed !== undefined ? `max_unavailable_fixed    = ${config.update_policy.max_unavailable_fixed}`: ''}
    # Otras opciones como min_ready_sec, replacement_method, etc.
  }` : ''}

  ${config.named_ports && config.named_ports[0] ? `
  named_port {
    name = "${config.named_ports[0].name}" # Usar named_ports y acceder al primer elemento
    port = ${config.named_ports[0].port}   # Usar named_ports y acceder al primer elemento
  }` : ''}
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}InstanceGroupManager = new gcp.compute.${isRegional ? 'RegionInstanceGroupManager' : 'InstanceGroupManager'}("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    ${isRegional ? `region: "${config.region}",` : `zone: "${config.zone}",`}
    baseInstanceName: "${config.base_instance_name}",
    targetSize: ${config.target_size},
    versions: [{
        instanceTemplate: "${config.version[0].instance_template}", // Acceder al primer elemento
        name: "${config.version[0].name || 'primary'}",           // Acceder al primer elemento
    }],
    ${config.auto_healing_policies && config.auto_healing_policies[0] ? `autoHealingPolicies: {
        healthCheck: "${config.auto_healing_policies[0].health_check}", // Acceder al primer elemento
        initialDelaySec: ${config.auto_healing_policies[0].initial_delay_sec},   // Acceder al primer elemento
    },` : ''}
    ${config.update_policy ? `updatePolicy: {
        type: "${config.update_policy.type}",
        minimalAction: "${config.update_policy.minimal_action}",
        ${config.update_policy.max_surge_fixed !== undefined ? `maxSurgeFixed: ${config.update_policy.max_surge_fixed},`: ''}
        ${config.update_policy.max_unavailable_fixed !== undefined ? `maxUnavailableFixed: ${config.update_policy.max_unavailable_fixed},`: ''}
    },` : ''}
    ${config.named_ports && config.named_ports[0] ? `namedPorts: [{
        name: "${config.named_ports[0].name}", // Usar named_ports y acceder al primer elemento
        port: ${config.named_ports[0].port},   // Usar named_ports y acceder al primer elemento
    }],` : ''}
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Instance Group Manager (requiere google.cloud collection)
- name: Create ${isRegional ? 'Regional' : 'Zonal'} Instance Group Manager
  google.cloud.gcp_compute_${isRegional ? 'region_' : ''}instance_group_manager:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    ${isRegional ? `region: "${config.region}"` : `zone: "${config.zone}"`}
    base_instance_name: "${config.base_instance_name}"
    instance_template: "${config.version[0].instance_template}" # Nombre o self_link, acceder al primer elemento
    target_size: ${config.target_size}
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Instance Group Managers.\n"
  };
}

/*
export const instanceGroupTemplates: ResourceTemplate[] = [
  // ... (contenido anterior del array) ...
];
*/
