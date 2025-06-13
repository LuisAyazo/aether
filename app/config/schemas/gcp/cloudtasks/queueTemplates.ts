import { GCPCloudTasksQueueConfig } from './queue'; // Asumiremos que este tipo se definirá en queue.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

// Helper para formatear bloques anidados opcionales
const formatOptionalBlock = (condition: any, blockName: string, fields: string): string => {
  if (condition) {
    return `
  ${blockName} {
${fields}
  }`;
  }
  return '';
};

const formatOptionalPulumiProperty = (condition: any, propertyName: string, value: string): string => {
  return condition ? `${propertyName}: ${value},` : '';
}

export function generateGCPCloudTasksQueueTemplates(config: GCPCloudTasksQueueConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'myTasksQueue').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'myTasksQueue').replace(/-/g, '');

  const terraformRateLimits = formatOptionalBlock(
    config.rate_limits,
    'rate_limits',
    `${config.rate_limits?.max_dispatches_per_second ? `    max_dispatches_per_second = ${config.rate_limits.max_dispatches_per_second}` : ''}
${config.rate_limits?.max_concurrent_dispatches ? `    max_concurrent_dispatches = ${config.rate_limits.max_concurrent_dispatches}` : ''}
${config.rate_limits?.max_burst_size ? `    max_burst_size            = ${config.rate_limits.max_burst_size}` : ''}`
  );

  const terraformRetryConfig = formatOptionalBlock(
    config.retry_config,
    'retry_config',
    `${config.retry_config?.max_attempts !== undefined ? `    max_attempts          = ${config.retry_config.max_attempts}` : ''}
${config.retry_config?.max_retry_duration ? `    max_retry_duration    = "${config.retry_config.max_retry_duration}"` : ''}
${config.retry_config?.min_backoff ? `    min_backoff           = "${config.retry_config.min_backoff}"` : ''}
${config.retry_config?.max_backoff ? `    max_backoff           = "${config.retry_config.max_backoff}"` : ''}
${config.retry_config?.max_doublings !== undefined ? `    max_doublings         = ${config.retry_config.max_doublings}` : ''}`
  );
  
  const pulumiRateLimits = config.rate_limits ? `{
        ${formatOptionalPulumiProperty(config.rate_limits.max_dispatches_per_second, 'maxDispatchesPerSecond', String(config.rate_limits.max_dispatches_per_second))}
        ${formatOptionalPulumiProperty(config.rate_limits.max_concurrent_dispatches, 'maxConcurrentDispatches', String(config.rate_limits.max_concurrent_dispatches))}
        ${formatOptionalPulumiProperty(config.rate_limits.max_burst_size, 'maxBurstSize', String(config.rate_limits.max_burst_size))}
    }` : undefined;

  const pulumiRetryConfig = config.retry_config ? `{
        ${formatOptionalPulumiProperty(config.retry_config.max_attempts, 'maxAttempts', String(config.retry_config.max_attempts))}
        ${formatOptionalPulumiProperty(config.retry_config.max_retry_duration, 'maxRetryDuration', `"${config.retry_config.max_retry_duration}"`)}
        ${formatOptionalPulumiProperty(config.retry_config.min_backoff, 'minBackoff', `"${config.retry_config.min_backoff}"`)}
        ${formatOptionalPulumiProperty(config.retry_config.max_backoff, 'maxBackoff', `"${config.retry_config.max_backoff}"`)}
        ${formatOptionalPulumiProperty(config.retry_config.max_doublings, 'maxDoublings', String(config.retry_config.max_doublings))}
    }` : undefined;


  const terraform = `
# Plantilla de Terraform para una Cola de GCP Cloud Tasks
provider "google" {
  project = "${config.project || 'TU_PROYECTO_GCP'}" # Reemplazar o configurar en el proveedor
  region  = "${config.location}" # Cloud Tasks usa 'location' que es análogo a la región
}

resource "google_cloud_tasks_queue" "${terraformResourceName}" {
  name     = "${config.name}"
  location = "${config.location}"
  ${config.project ? `project  = "${config.project}"` : ''}
  ${config.description ? `description = "${config.description}"` : ''}
${terraformRateLimits}
${terraformRetryConfig}
}

output "cloud_tasks_queue_name" {
  value = google_cloud_tasks_queue.${terraformResourceName}.name
}

output "cloud_tasks_queue_location" {
  value = google_cloud_tasks_queue.${terraformResourceName}.location
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Cola de GCP Cloud Tasks
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${pulumiResourceName}Queue = new gcp.cloudtasks.Queue("${pulumiResourceName}", {
    name: "${config.name}",
    location: "${config.location}",
    project: "${config.project || undefined}",
    description: "${config.description || undefined}",
    ${pulumiRateLimits ? `rateLimits: ${pulumiRateLimits},` : ''}
    ${pulumiRetryConfig ? `retryConfig: ${pulumiRetryConfig},` : ''}
});

export const queueName = ${pulumiResourceName}Queue.name;
export const queueLocation = ${pulumiResourceName}Queue.location;
`;

  // CloudFormation no es aplicable a GCP. Se puede omitir o dejar un comentario.
  const cloudformation = `
# AWS CloudFormation no es aplicable para recursos de GCP.
# Para gestionar recursos de GCP como código, considera Google Cloud Deployment Manager o Terraform/Pulumi.
`;

  // Ansible para GCP Cloud Tasks Queue
  const ansiblePlaybook = `
# Playbook Ansible para GCP Cloud Tasks Queue (requiere google.cloud.gcp_cloudtasks_queue)
- name: Gestionar Cola de Cloud Tasks ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    gcp_project: "${config.project || 'tu-proyecto-gcp'}"
    gcp_auth_kind: "serviceaccount" # o application
    gcp_service_account_file: "/ruta/a/tu/keyfile.json" # Requerido si auth_kind es serviceaccount
    location: "${config.location}"
    queue_name: "${config.name}"
    description: "${config.description || ''}"
    rate_limits:
      max_dispatches_per_second: ${config.rate_limits?.max_dispatches_per_second || 'null'}
      max_concurrent_dispatches: ${config.rate_limits?.max_concurrent_dispatches || 'null'}
      max_burst_size: ${config.rate_limits?.max_burst_size || 'null'}
    retry_config:
      max_attempts: ${config.retry_config?.max_attempts !== undefined ? config.retry_config.max_attempts : 'null'}
      max_retry_duration: "${config.retry_config?.max_retry_duration || 'null'}"
      min_backoff: "${config.retry_config?.min_backoff || 'null'}"
      max_backoff: "${config.retry_config?.max_backoff || 'null'}"
      max_doublings: ${config.retry_config?.max_doublings !== undefined ? config.retry_config.max_doublings : 'null'}

  tasks:
    - name: Crear o asegurar que la Cola de Cloud Tasks exista
      google.cloud.gcp_cloudtasks_queue:
        name: "{{ queue_name }}"
        location: "{{ location }}"
        description: "{{ description }}"
        rate_limits: "{{ rate_limits if rate_limits.max_dispatches_per_second != 'null' else omit }}"
        retry_config: "{{ retry_config if retry_config.max_attempts != 'null' else omit }}"
        project: "{{ gcp_project }}"
        auth_kind: "{{ gcp_auth_kind }}"
        service_account_file: "{{ gcp_service_account_file if gcp_auth_kind == 'serviceaccount' else omit }}"
        state: present
      register: cloudtasks_queue_info

    - name: Mostrar información de la Cola de Cloud Tasks
      ansible.builtin.debug:
        var: cloudtasks_queue_info
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation // Opcional: podrías devolver un string vacío o un mensaje indicando no aplicable
  };
}
