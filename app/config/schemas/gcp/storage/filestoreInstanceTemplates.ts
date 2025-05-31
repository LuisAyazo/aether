import { GCPFilestoreInstanceConfig } from './filestoreInstance'; // Asumiremos que este tipo se definirá en filestoreInstance.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

export function generateGCPFilestoreInstanceTemplates(config: GCPFilestoreInstanceConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_filestore_instance" "${resourceName}" {
  name    = "${config.name}"
  project = "${config.project}"
  zone    = "${config.zone}"
  tier    = "${config.tier}"

  file_shares {
    capacity_gb = ${config.file_share_capacity_gb}
    name        = "${config.file_share_name}"
    # nfs_export_options {
    #   ip_ranges   = ["10.0.0.0/24"] # Ejemplo
    #   access_mode = "READ_WRITE"
    #   squash_mode = "NO_ROOT_SQUASH"
    # }
  }

  networks {
    network = "${config.network}"
    modes   = ["MODE_IPV4"] # Generalmente IPV4
    # reserved_ip_range = "10.0.0.0/29" # Opcional, si se usa un rango reservado
  }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Instance = new gcp.filestore.Instance("${resourceName}", {
    name: "${config.name}",
    project: "${config.project}",
    zone: "${config.zone}",
    tier: "${config.tier}",
    fileShares: {
        capacityGb: ${config.file_share_capacity_gb},
        name: "${config.file_share_name}",
        // nfsExportOptions: [{ // Ejemplo
        //     ipRanges: ["10.0.0.0/24"],
        //     accessMode: "READ_WRITE",
        //     squashMode: "NO_ROOT_SQUASH",
        // }],
    },
    networks: [{
        network: "${config.network}",
        modes: ["MODE_IPV4"],
        // reservedIpRange: "10.0.0.0/29", // Opcional
    }],
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Filestore Instance (requiere google.cloud collection)
- name: Create Filestore instance
  google.cloud.gcp_filestore_instance:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    zone: "${config.zone}"
    tier: "${config.tier}"
    file_shares:
      - name: "${config.file_share_name}"
        capacity_gb: ${config.file_share_capacity_gb}
    networks:
      - network: "${config.network}"
        modes:
          - MODE_IPV4
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Filestore.\n"
  };
}
