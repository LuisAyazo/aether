import { GCPCloudRunServiceConfig } from './service'; // Asumiremos que este tipo se definirá en service.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

export function generateGCPCloudRunServiceTemplates(config: GCPCloudRunServiceConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_cloud_run_v2_service" "${config.name}" {
  name     = "${config.name}"
  project  = "${config.project}"
  location = "${config.location}"

  template {
    containers {
      image = "${config.image}"
      ${config.port ? `ports { container_port = ${config.port} }` : ''}
      
      # Ejemplo de variables de entorno
      # env {
      #   name  = "EXAMPLE_VARIABLE"
      #   value = "example_value"
      # }

      # Ejemplo de límites de recursos
      # resources {
      #   limits = {
      #     cpu    = "${config.cpu || '1'}"
      #     memory = "${config.memory || '512Mi'}"
      #   }
      # }
    }
    ${config.minInstances ? `scaling { min_instance_count = ${config.minInstances} }` : ''}
    ${config.maxInstances ? `scaling { max_instance_count = ${config.maxInstances} }` : ''}
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

${config.allowUnauthenticated ? `
resource "google_cloud_run_v2_service_iam_member" "${config.name}_public_access" {
  project  = google_cloud_run_v2_service.${config.name}.project
  location = google_cloud_run_v2_service.${config.name}.location
  name     = google_cloud_run_v2_service.${config.name}.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
` : ''}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Service = new gcp.cloudrunv2.Service("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    location: "${config.location}",
    template: {
        containers: [{
            image: "${config.image}",
            ${config.port ? `ports: [{ containerPort: ${config.port} }],` : ''}
            // resources: {
            //     limits: {
            //         cpu: "${config.cpu || '1'}",
            //         memory: "${config.memory || '512Mi'}",
            //     },
            // },
        }],
        ${config.minInstances ? `scaling: { minInstanceCount: ${config.minInstances} },` : ''}
        ${config.maxInstances ? `scaling: { maxInstanceCount: ${config.maxInstances} },` : ''}
    },
    traffics: [{
        type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST",
        percent: 100,
    }],
});

${config.allowUnauthenticated ? `
const invoker = new gcp.cloudrunv2.ServiceIamMember("${config.name}-public-access", {
    project: ${resourceName}Service.project,
    location: ${resourceName}Service.location,
    name: ${resourceName}Service.name,
    role: "roles/run.invoker",
    member: "allUsers",
});
` : ''}

export const serviceUrl = ${resourceName}Service.uri;
`;

  return {
    terraform,
    pulumi,
    ansible: "# Ansible para GCP Cloud Run Service (requiere google.cloud collection)\n- name: Create Cloud Run Service\n  google.cloud.gcp_cloudrun_service:\n    name: \"${config.name}\"\n    project: \"{{ project_id | default('${config.project}') }}\"\n    location: \"${config.location}\"\n    template:\n      containers:\n        - image: \"${config.image}\"\n    state: present\n# IAM binding para acceso público se maneja por separado si es necesario\n",
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Cloud Run.\n// Se usaría Google Cloud Deployment Manager o Terraform/Pulumi.\n"
  };
}
