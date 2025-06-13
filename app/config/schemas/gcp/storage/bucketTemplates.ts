import { GCPStorageBucketConfig } from './bucket'; // Asumiremos que este tipo se definirá en bucket.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

export function generateGCPStorageBucketTemplates(config: GCPStorageBucketConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  // Helper para convertir lifecycle_rules JSON string a objeto Terraform
  let lifecycleRulesTerraform = '';
  if (config.lifecycle_rules) {
    try {
      const rules = JSON.parse(config.lifecycle_rules);
      if (Array.isArray(rules)) {
        lifecycleRulesTerraform = rules.map(rule => `
    lifecycle_rule {
      action {
        type = "${rule.action.type}"
        ${rule.action.storage_class ? `storage_class = "${rule.action.storage_class}"` : ''}
      }
      condition {
        ${rule.condition.age ? `age = ${rule.condition.age}` : ''}
        ${rule.condition.created_before ? `created_before = "${rule.condition.created_before}"` : ''}
        ${rule.condition.with_state ? `with_state = "${rule.condition.with_state}"` : ''}
        ${rule.condition.matches_storage_class ? `matches_storage_class = ["${rule.condition.matches_storage_class.join('", "')}"]` : ''}
        ${rule.condition.num_newer_versions ? `num_newer_versions = ${rule.condition.num_newer_versions}` : ''}
      }
    }`).join('');
      }
    } catch (e) {
      console.warn("Error parsing lifecycle_rules JSON for Terraform:", e);
      lifecycleRulesTerraform = "# Error parsing lifecycle_rules JSON. Please check format.";
    }
  }

  const terraform = `
resource "google_storage_bucket" "${config.name}" {
  name                        = "${config.name}"
  project                     = "${config.project}"
  location                    = "${config.location}"
  storage_class               = "${config.storage_class}"
  uniform_bucket_level_access = ${config.uniform_bucket_level_access}
  ${config.public_access_prevention ? `public_access_prevention    = "${config.public_access_prevention}"`: ''}

  ${config.versioning ? `
  versioning {
    enabled = true
  }` : `
  versioning {
    enabled = false
  }`}
  ${lifecycleRulesTerraform}
}
`;

  // Helper para Pulumi lifecycle rules
  let pulumiLifecycleRules = '';
  if (config.lifecycle_rules) {
    try {
      const rules = JSON.parse(config.lifecycle_rules);
      if (Array.isArray(rules)) {
        pulumiLifecycleRules = `lifecycleRules: ${JSON.stringify(rules, null, 2)},`;
      }
    } catch (e) {
      console.warn("Error parsing lifecycle_rules JSON for Pulumi:", e);
      pulumiLifecycleRules = "// Error parsing lifecycle_rules JSON. Please check format.";
    }
  }

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Bucket = new gcp.storage.Bucket("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    location: "${config.location}",
    storageClass: "${config.storage_class}",
    uniformBucketLevelAccess: ${config.uniform_bucket_level_access},
    ${config.public_access_prevention ? `publicAccessPrevention: "${config.public_access_prevention}",`: ''}
    versioning: {
        enabled: ${config.versioning},
    },
    ${pulumiLifecycleRules}
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Storage Bucket (requiere google.cloud collection)
- name: Create Storage Bucket
  google.cloud.gcp_storage_bucket:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    location: "${config.location}"
    storage_class: "${config.storage_class}"
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Storage Buckets.\n"
  };
}
