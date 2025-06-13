import { GCPEventarcTriggerConfig } from './trigger'; // Asumiremos que este tipo se definirá en trigger.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

// Helper function to parse key-value string "Key1=Value1,Key2=Value2" to object
const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

export function generateGCPEventarcTriggerTemplates(config: GCPEventarcTriggerConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myEventarcTrigger').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myEventarcTrigger').replace(/-/g, '');

  const parsedLabels = parseKeyValueString(config.labels as string | undefined);

  // Tipo temporal para criterion, se reemplazará con el tipo de Zod
  type MatchingCriterion = { attribute: string; value: string; operator?: string };

  const terraformMatchingCriteria = config.matching_criteria.map((criterion: MatchingCriterion) => `
  matching_criteria {
    attribute = "${criterion.attribute}"
    value     = "${criterion.value}"
    ${criterion.operator ? `operator  = "${criterion.operator}"` : ''}
  }`).join('');

  const pulumiMatchingCriteria = config.matching_criteria.map((criterion: MatchingCriterion) => `{
        attribute: "${criterion.attribute}",
        value: "${criterion.value}",
        ${criterion.operator ? `operator: "${criterion.operator}",` : ''}
    }`);
    
  const terraformDestination = () => {
    if (config.destination?.cloud_run_service_name) {
      return `
  destination {
    cloud_run_service {
      service = "${config.destination.cloud_run_service_name}"
      ${config.destination.cloud_run_service_region ? `region  = "${config.destination.cloud_run_service_region}"` : ''}
      ${config.destination.cloud_run_service_path ? `path    = "${config.destination.cloud_run_service_path}"` : ''}
    }
  }`;
    } else if (config.destination?.workflow_id) {
       // El ID del workflow ya incluye el proyecto y la ubicación, o se puede construir.
       // Asumimos que el usuario provee el ID completo o que se construye a partir de otros campos si es necesario.
      return `
  destination {
    workflow = "${config.destination.workflow_id}" # Formato: projects/{project}/locations/{location}/workflows/{workflow_id}
  }`;
    }
    return '# ERROR: Destino no configurado o tipo de destino no soportado en esta plantilla.';
  };

  const pulumiDestination = () => {
    if (config.destination?.cloud_run_service_name) {
      return `cloudRunService: {
        service: "${config.destination.cloud_run_service_name}",
        ${config.destination.cloud_run_service_region ? `region: "${config.destination.cloud_run_service_region}",` : ''}
        ${config.destination.cloud_run_service_path ? `path: "${config.destination.cloud_run_service_path}",` : ''}
    },`;
    } else if (config.destination?.workflow_id) {
      return `workflow: "${config.destination.workflow_id}",`;
    }
    return '// ERROR: Destino no configurado';
  };


  const terraform = `
# Plantilla de Terraform para un Trigger de GCP Eventarc
provider "google" {
  project = "${config.project || 'TU_PROYECTO_GCP'}"
  region  = "${config.location}" 
}

resource "google_eventarc_trigger" "${terraformResourceName}" {
  name     = "${config.name}"
  location = "${config.location}"
  ${config.project ? `project  = "${config.project}"` : ''}
  
  ${terraformMatchingCriteria}
  ${terraformDestination()}

  ${config.service_account ? `service_account = "${config.service_account}"` : ''}
  ${config.event_data_content_type ? `event_data_content_type = "${config.event_data_content_type}"` : ''}
  ${config.transport_topic_name ? `transport { \n    pubsub {\n      topic = "${config.transport_topic_name}"\n    }\n  }` : ''}

  ${Object.keys(parsedLabels).length > 0 ? 
    `labels = {
    ${Object.entries(parsedLabels).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "eventarc_trigger_id" {
  value = google_eventarc_trigger.${terraformResourceName}.id
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Trigger de GCP Eventarc
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${pulumiResourceName}Trigger = new gcp.eventarc.Trigger("${pulumiResourceName}", {
    name: "${config.name}",
    location: "${config.location}",
    project: "${config.project || undefined}",
    matchingCriterias: [${pulumiMatchingCriteria.join(',\n        ')}],
    destination: {
        ${pulumiDestination()}
    },
    serviceAccount: "${config.service_account || undefined}",
    eventDataContentType: "${config.event_data_content_type || 'application/json'}",
    ${config.transport_topic_name ? `transport: { pubsub: { topic: "${config.transport_topic_name}" } },` : ''}
    labels: {
        ${Object.entries(parsedLabels).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const triggerId = ${pulumiResourceName}Trigger.id;
`;

  const cloudformation = `
# AWS CloudFormation no es aplicable para recursos de GCP.
`;

  const ansiblePlaybook = `
# Playbook Ansible para GCP Eventarc Trigger (requiere google.cloud.gcp_eventarc_trigger)
- name: Gestionar Trigger de Eventarc ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    gcp_project: "${config.project || 'tu-proyecto-gcp'}"
    gcp_auth_kind: "serviceaccount"
    gcp_service_account_file: "/ruta/a/tu/keyfile.json"
    location: "${config.location}"
    trigger_name: "${config.name}"
    matching_criteria:
${config.matching_criteria.map((c: MatchingCriterion) => 
`      - attribute: "${c.attribute}"
        value: "${c.value}"` +
(c.operator ? `\n        operator: "${c.operator}"` : '')
).join('\n')}
    destination:
      ${config.destination?.cloud_run_service_name ? 
`cloud_run_service:
        service: "${config.destination.cloud_run_service_name}"` +
(config.destination.cloud_run_service_region ? `\n        region: "${config.destination.cloud_run_service_region}"` : '') +
(config.destination.cloud_run_service_path ? `\n        path: "${config.destination.cloud_run_service_path}"` : '')
      : ''}
      ${config.destination?.workflow_id ? `workflow: "${config.destination.workflow_id}"` : ''}
    service_account: "${config.service_account || ''}"
    event_data_content_type: "${config.event_data_content_type || 'application/json'}"
    transport_topic: "${config.transport_topic_name || ''}"
    labels:
      ${Object.entries(parsedLabels).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que el Trigger de Eventarc exista
      google.cloud.gcp_eventarc_trigger:
        name: "{{ trigger_name }}"
        location: "{{ location }}"
        matching_criteria: "{{ matching_criteria }}"
        destination: "{{ destination }}"
        service_account: "{{ service_account | default(omit) }}"
        event_data_content_type: "{{ event_data_content_type }}"
        transport: "{{ { 'pubsub': { 'topic': transport_topic } } if transport_topic else omit }}"
        labels: "{{ labels | default(omit) }}"
        project: "{{ gcp_project }}"
        auth_kind: "{{ gcp_auth_kind }}"
        service_account_file: "{{ gcp_service_account_file }}"
        state: present
      register: eventarc_trigger_info

    - name: Mostrar información del Trigger de Eventarc
      ansible.builtin.debug:
        var: eventarc_trigger_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
