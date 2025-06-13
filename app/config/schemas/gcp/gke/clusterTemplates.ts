import { GCPGkeClusterConfig } from './cluster'; // Asumiremos que este tipo se definirá en cluster.ts
import { CodeTemplate } from "../../../../types/resourceConfig";

export function generateGCPGkeClusterTemplates(config: GCPGkeClusterConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_'); // Pulumi y a veces Terraform prefieren snake_case para nombres de variables/recursos

  const terraform = `
resource "google_container_cluster" "${config.name}" {
  name     = "${config.name}"
  project  = "${config.project}"
  location = "${config.location}" # Puede ser una zona o región

  # Configuración inicial del pool de nodos (se puede definir más detalladamente)
  initial_node_count = ${config.initialNodeCount || 1}
  remove_default_node_pool = ${config.initialNodeCount ? 'false' : 'true'} # Si se especifica initialNodeCount, no remover el default pool

  ${config.initialNodeCount ? `
  node_config {
    machine_type = "${config.nodeMachineType || 'e2-medium'}"
    # Se pueden añadir más configuraciones de nodo aquí (oauth_scopes, disk_size_gb, etc.)
  }` : ''}

  ${config.network ? `network    = "${config.network}"` : ''}
  ${config.subnetwork ? `subnetwork = "${config.subnetwork}"` : ''}

  # Para Autopilot, la configuración es diferente y más gestionada por Google
  ${config.enableAutopilot ? `
  enable_autopilot = true
  # En Autopilot, no se especifican initial_node_count ni node_config directamente.
  # Se pueden definir 'release_channel', 'ip_allocation_policy', etc.
  release_channel {
    channel = "REGULAR" # O STABLE, RAPID
  }
  ` : ''}

  # Ejemplo de configuraciones adicionales (descomentar y ajustar según sea necesario)
  # release_channel {
  //   channel = "STABLE"
  # }

  # networking_mode = "VPC_NATIVE" # Por defecto para nuevos clusters

  # ip_allocation_policy {
  #   cluster_ipv4_cidr_block  = "/14" // Ejemplo
  #   services_ipv4_cidr_block = "/20" // Ejemplo
  # }

  # addons_config {
  #   http_load_balancing {
  #     disabled = false
  //   }
  #   horizontal_pod_autoscaling {
  #     disabled = false
  #   }
  # }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Cluster = new gcp.container.Cluster("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    location: "${config.location}",
    initialNodeCount: ${config.enableAutopilot ? 'undefined' : (config.initialNodeCount || 1)},
    ${config.enableAutopilot ? '' : `
    nodeConfig: {
        machineType: "${config.nodeMachineType || 'e2-medium'}",
        // oauthScopes: [
        //     "https://www.googleapis.com/auth/compute",
        //     "https://www.googleapis.com/auth/devstorage.read_only",
        //     "https://www.googleapis.com/auth/logging.write",
        //     "https://www.googleapis.com/auth/monitoring",
        // ],
    },`}
    ${config.network ? `network: "${config.network}",` : ''}
    ${config.subnetwork ? `subnetwork: "${config.subnetwork}",` : ''}
    ${config.enableAutopilot ? `
    enableAutopilot: true,
    releaseChannel: {
        channel: "REGULAR",
    },
    // En Autopilot, muchas configuraciones de nodo son gestionadas por Google.
    // initialNodeCount y nodeConfig no se especifican.
    removeDefaultNodePool: true, // Autopilot gestiona los pools
    ` : `removeDefaultNodePool: ${config.initialNodeCount ? false : true},`}
});
`;

  return {
    terraform,
    pulumi,
    ansible: "# Ansible para GCP GKE Cluster (requiere google.cloud collection)\n- name: Create GKE Cluster\n  google.cloud.gcp_container_cluster:\n    name: \"${config.name}\"\n    project: \"{{ project_id | default('${config.project}') }}\"\n    location: \"${config.location}\"\n    initial_node_count: ${config.initialNodeCount || 1}\n    node_config:\n      machine_type: \"${config.nodeMachineType || 'e2-medium'}\"\n    state: present\n",
    cloudformation: "// CloudFormation no es aplicable directamente a GCP GKE.\n// Se usaría Google Cloud Deployment Manager o Terraform/Pulumi.\n"
  };
}
