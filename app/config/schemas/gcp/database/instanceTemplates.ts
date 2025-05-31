import { GCPSqlInstanceConfig } from './instance'; // Asumiremos que este tipo se definirá en instance.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

export function generateGCPSqlInstanceTemplates(config: GCPSqlInstanceConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_sql_database_instance" "${config.name}" {
  name             = "${config.name}"
  project          = "${config.project}"
  region           = "${config.region}"
  database_version = "${config.database_version}"
  
  settings {
    tier    = "${config.tier}"
    disk_size = ${config.storage_size_gb}
    disk_autoresize = ${config.storage_auto_increase}
    availability_type = "${config.availability_type}"
    
    ${config.backup_enabled ? `
    backup_configuration {
      enabled            = true
      ${config.backup_start_time ? `start_time         = "${config.backup_start_time}"` : ''}
      # binary_log_enabled = true # Requerido para PITR en MySQL
    }` : `
    backup_configuration {
      enabled            = false
    }`}

    # ip_configuration {
    #   ipv4_enabled    = true
    #   # authorized_networks {
    #   #   value           = "0.0.0.0/0" # ¡CUIDADO! Permite todas las IPs
    #   #   name            = "all"
    #   # }
    # }
  }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Instance = new gcp.sql.DatabaseInstance("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    region: "${config.region}",
    databaseVersion: "${config.database_version}",
    settings: {
        tier: "${config.tier}",
        diskSize: ${config.storage_size_gb},
        diskAutoresize: ${config.storage_auto_increase},
        availabilityType: "${config.availability_type}",
        backupConfiguration: {
            enabled: ${config.backup_enabled},
            ${config.backup_start_time && config.backup_enabled ? `startTime: "${config.backup_start_time}",` : ''}
            // binaryLogEnabled: true, // Para PITR en MySQL
        },
        // ipConfiguration: {
        //     ipv4Enabled: true,
        //     // authorizedNetworks: [{
        //     //     name: "all",
        //     //     value: "0.0.0.0/0",
        //     // }],
        // },
    },
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Cloud SQL Instance (requiere google.cloud collection)
- name: Create Cloud SQL Instance
  google.cloud.gcp_sql_instance:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    region: "${config.region}"
    settings:
      tier: "${config.tier}"
      data_disk_size_gb: ${config.storage_size_gb}
      # availability_type: "${config.availability_type}" # ZONAL o REGIONAL
    database_version: "${config.database_version}"
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Cloud SQL.\n"
  };
}
