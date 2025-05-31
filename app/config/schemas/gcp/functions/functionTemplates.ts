import { GCPCloudFunctionConfig } from './function'; // Asumiremos que este tipo se definirá en function.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

export function generateGCPCloudFunctionTemplates(config: GCPCloudFunctionConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');
  let triggerBlock = '';
  let eventTriggerBlock = '';

  if (config.triggerType === 'HTTP') {
    triggerBlock = '  trigger_http = true';
    eventTriggerBlock = `
  event_trigger {
    trigger_region = "europe-west1" # o la región del trigger si es diferente
    event_type = "providers/cloud.storage/eventTypes/object.finalize" # Ejemplo, ajustar
    resource   = "projects/_/buckets/example-bucket" # Ejemplo, ajustar
    retry_policy = "RETRY_POLICY_RETRY"
  }
`; // Nota: HTTP trigger es implícito si no se especifica event_trigger para Gen1. Para Gen2, es diferente.
  } else if (config.triggerType === 'PUBSUB' && config.triggerResource) {
    eventTriggerBlock = `
  event_trigger {
    event_type = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic = "${config.triggerResource}" # ej: projects/my-project/topics/my-topic
    retry_policy = "RETRY_POLICY_RETRY"
  }`;
  } else if (config.triggerType === 'STORAGE' && config.triggerResource) {
    eventTriggerBlock = `
  event_trigger {
    event_type = "google.cloud.storage.object.v1.finalized" # o .archived, .deleted, .metadataUpdated
    bucket     = "${config.triggerResource}" # ej: my-bucket-name
    retry_policy = "RETRY_POLICY_RETRY"
  }`;
  }

  const terraform = `
# Cloud Functions (Gen 1)
resource "google_cloudfunctions_function" "${config.name}" {
  name        = "${config.name}"
  project     = "${config.project}"
  region      = "${config.region}"
  runtime     = "${config.runtime}"
  entry_point = "${config.entryPoint}"
  ${config.sourceArchiveUrl ? `source_archive_bucket = split("/", "${config.sourceArchiveUrl}")[2]\n  source_archive_object = join("/", slice(split("/", "${config.sourceArchiveUrl}"), 3, length(split("/", "${config.sourceArchiveUrl}"))))` : '# source_archive_url o source_repository es requerido'}
  
  ${triggerBlock}
  ${config.triggerType !== 'HTTP' ? eventTriggerBlock : ''}

  ${config.availableMemoryMb ? `available_memory_mb = ${config.availableMemoryMb}`: ''}
  ${config.timeout ? `timeout_seconds     = tonumber(replace("${config.timeout}", "s", ""))`: ''}

  # Ejemplo de variables de entorno
  # environment_variables = {
  #   FOO = "bar"
  # }
}

# IAM para invocación HTTP (si es HTTP trigger y se quiere acceso público)
# resource "google_cloudfunctions_function_iam_member" "${config.name}_invoker" {
#   project        = google_cloudfunctions_function.${config.name}.project
#   region         = google_cloudfunctions_function.${config.name}.region
#   cloud_function = google_cloudfunctions_function.${config.name}.name
#   role           = "roles/cloudfunctions.invoker"
#   member         = "allUsers" # O un miembro específico
# }
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Function = new gcp.cloudfunctions.Function("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    region: "${config.region}",
    runtime: "${config.runtime}",
    entryPoint: "${config.entryPoint}",
    ${config.sourceArchiveUrl ? `sourceArchiveBucket: "${config.sourceArchiveUrl}".split("/")[2],
    sourceArchiveObject: "${config.sourceArchiveUrl}".split("/").slice(3).join("/"),` : '// sourceArchiveUrl o sourceRepository es requerido'}
    ${config.triggerType === 'HTTP' ? 'triggerHttp: true,' : ''}
    ${config.triggerType === 'PUBSUB' && config.triggerResource ? `eventTrigger: { eventType: "google.pubsub.topic.publish", resource: "${config.triggerResource}" },` : ''}
    ${config.triggerType === 'STORAGE' && config.triggerResource ? `eventTrigger: { eventType: "google.storage.object.finalize", resource: "${config.triggerResource}" },` : ''}
    ${config.availableMemoryMb ? `availableMemoryMb: ${config.availableMemoryMb},`: ''}
    ${config.timeout ? `timeout: "${config.timeout}",`: ''}
});

// IAM para invocación HTTP
// if ("${config.triggerType}" === "HTTP") {
//   const invoker = new gcp.cloudfunctions.FunctionIamMember("${config.name}-invoker", {
//       project: ${resourceName}Function.project,
//       region: ${resourceName}Function.region,
//       cloudFunction: ${resourceName}Function.name,
//       role: "roles/cloudfunctions.invoker",
//       member: "allUsers",
//   });
// }
`;

  return {
    terraform,
    pulumi,
    ansible: "# Ansible para GCP Cloud Function (requiere google.cloud collection)\n- name: Create Cloud Function\n  google.cloud.gcp_cloudfunctions_function:\n    name: \"${config.name}\"\n    project: \"{{ project_id | default('${config.project}') }}\"\n    region: \"${config.region}\"\n    runtime: \"${config.runtime}\"\n    entry_point: \"${config.entryPoint}\"\n    # source_archive_url o local_path es requerido\n    state: present\n",
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Cloud Functions.\n"
  };
}
