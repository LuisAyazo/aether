import { GCPBigQueryDatasetConfig } from './dataset'; // Asumiremos que este tipo se definirá en dataset.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

export function generateGCPBigQueryDatasetTemplates(config: GCPBigQueryDatasetConfig): CodeTemplate {
  const resourceName = config.dataset_id.replace(/-/g, '_');

  const terraform = `
resource "google_bigquery_dataset" "${resourceName}" {
  dataset_id                  = "${config.dataset_id}"
  project                     = "${config.project}"
  location                    = "${config.location}"
  ${config.friendly_name ? `friendly_name               = "${config.friendly_name}"` : ''}
  ${config.description ? `description                 = "${config.description}"` : ''}
  ${config.default_table_expiration_ms ? `default_table_expiration_ms = ${config.default_table_expiration_ms}`: ''}
  ${config.default_partition_expiration_ms ? `default_partition_expiration_ms = ${config.default_partition_expiration_ms}`: ''}
  
  # labels = {
  #   env = "default"
  # }

  # access {
  #   role          = "OWNER"
  #   user_by_email = "user@example.com"
  # }

  # access {
  #   role          = "READER"
  #   group_by_email = "group@example.com"
  # }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Dataset = new gcp.bigquery.Dataset("${resourceName}", {
    datasetId: "${config.dataset_id}",
    project: "${config.project}",
    location: "${config.location}",
    ${config.friendly_name ? `friendlyName: "${config.friendly_name}",` : ''}
    ${config.description ? `description: "${config.description}",` : ''}
    ${config.default_table_expiration_ms ? `defaultTableExpirationMs: ${config.default_table_expiration_ms},`: ''}
    ${config.default_partition_expiration_ms ? `defaultPartitionExpirationMs: ${config.default_partition_expiration_ms},`: ''}
    // labels: {
    //     env: "default",
    // },
    // access: [
    //     {
    //         role: "OWNER",
    //         userByEmail: "user@example.com",
    //     },
    //     {
    //         role: "READER",
    //         groupByEmail: "group@example.com",
    //     },
    // ],
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP BigQuery Dataset (requiere google.cloud collection)
- name: Create BigQuery Dataset
  google.cloud.gcp_bigquery_dataset:
    name: "${config.dataset_id}"
    project: "{{ project_id | default('${config.project}') }}"
    location: "${config.location}"
    ${config.friendly_name ? `friendly_name: "${config.friendly_name}"` : ''}
    ${config.description ? `description: "${config.description}"` : ''}
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP BigQuery Datasets.\n"
  };
}
