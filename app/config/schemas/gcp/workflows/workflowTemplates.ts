import { GCPWorkflowsWorkflowConfig } from './workflow'; // Asumiremos que este tipo se definirá en workflow.ts
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

export function generateGCPWorkflowsWorkflowTemplates(config: GCPWorkflowsWorkflowConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myWorkflow').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myWorkflow').replace(/-/g, '');

  const parsedLabels = parseKeyValueString(config.labels as string | undefined);
  const parsedUserEnvVars = parseKeyValueString(config.user_env_vars as string | undefined);

  // Asegurar que source_contents tenga indentación correcta para YAML en Terraform
  const terraformSourceContents = (config.source_contents || '# Define tu workflow aquí')
    .split('\n')
    .map((line: string) => `  ${line}`)
    .join('\n');
    
  const pulumiSourceContents = (config.source_contents || '# Define tu workflow aquí').replace(/`/g, '\\`');


  const terraform = `
# Plantilla de Terraform para un Workflow de GCP
provider "google" {
  project = "${config.project || 'TU_PROYECTO_GCP'}" # Reemplazar o configurar en el proveedor
  region  = "${config.region}"
}

resource "google_workflows_workflow" "${terraformResourceName}" {
  name            = "${config.name}"
  region          = "${config.region}"
  ${config.project ? `project         = "${config.project}"` : ''}
  ${config.description ? `description     = "${config.description}"` : ''}
  ${config.service_account ? `service_account = "${config.service_account}"` : ''}
  
  source_contents = <<-EOF
${terraformSourceContents}
EOF

  ${Object.keys(parsedLabels).length > 0 ? 
    `labels = {
    ${Object.entries(parsedLabels).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}

  ${Object.keys(parsedUserEnvVars).length > 0 ? 
    `user_env_vars = {
    ${Object.entries(parsedUserEnvVars).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "workflow_id" {
  value = google_workflows_workflow.${terraformResourceName}.id
}

output "workflow_revision_id" {
  value = google_workflows_workflow.${terraformResourceName}.revision_id
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para un Workflow de GCP
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${pulumiResourceName}Workflow = new gcp.workflows.Workflow("${pulumiResourceName}", {
    name: "${config.name}",
    region: "${config.region}",
    project: "${config.project || undefined}",
    description: "${config.description || undefined}",
    serviceAccount: "${config.service_account || undefined}",
    sourceContents: \`${pulumiSourceContents}\`,
    labels: {
        ${Object.entries(parsedLabels).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
    userEnvVars: {
        ${Object.entries(parsedUserEnvVars).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const workflowId = ${pulumiResourceName}Workflow.id;
export const workflowRevisionId = ${pulumiResourceName}Workflow.revisionId;
`;

  const cloudformation = `
# AWS CloudFormation no es aplicable para recursos de GCP.
# Para gestionar recursos de GCP como código, considera Google Cloud Deployment Manager o Terraform/Pulumi.
`;

  const ansiblePlaybook = `
# Playbook Ansible para GCP Workflows (requiere google.cloud.gcp_workflows_workflow)
- name: Gestionar Workflow ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    gcp_project: "${config.project || 'tu-proyecto-gcp'}"
    gcp_auth_kind: "serviceaccount"
    gcp_service_account_file: "/ruta/a/tu/keyfile.json"
    region: "${config.region}"
    workflow_name: "${config.name}"
    description: "${config.description || ''}"
    service_account: "${config.service_account || ''}"
    source_contents: |-
${(config.source_contents || '').split('\n').map((line: string) => '      ' + line).join('\n')}
    labels:
      ${Object.entries(parsedLabels).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}
    user_env_vars:
      ${Object.entries(parsedUserEnvVars).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o asegurar que el Workflow exista
      google.cloud.gcp_workflows_workflow:
        name: "{{ workflow_name }}"
        region: "{{ region }}"
        description: "{{ description }}"
        service_account: "{{ service_account | default(omit) }}"
        source_contents: "{{ source_contents }}"
        labels: "{{ labels | default(omit) }}"
        user_env_vars: "{{ user_env_vars | default(omit) }}"
        project: "{{ gcp_project }}"
        auth_kind: "{{ gcp_auth_kind }}"
        service_account_file: "{{ gcp_service_account_file }}"
        state: present
      register: workflow_info

    - name: Mostrar información del Workflow
      ansible.builtin.debug:
        var: workflow_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
