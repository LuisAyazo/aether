import { GCPMemorystoreInstanceConfig } from './instance'; // Asumiremos que este tipo se definirá en instance.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

export function generateGCPMemorystoreInstanceTemplates(config: GCPMemorystoreInstanceConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');

  const terraform = `
resource "google_memorystore_instance" "${resourceName}" {
  name               = "${config.name}"
  project            = "${config.project}"
  region             = "${config.region}"
  tier               = "${config.tier}"
  memory_size_gb     = ${config.memory_size_gb}
  
  # Para Redis (el tipo por defecto)
  ${config.redis_version ? `redis_version      = "${config.redis_version}"` : ''}
  # connect_mode       = "${config.connect_mode}" # DIRECT_PEERING o PRIVATE_SERVICE_ACCESS
  # ${config.connect_mode === 'DIRECT_PEERING' && config.authorized_network ? `authorized_network = "${config.authorized_network}"` : ''}
  
  # Para Memcached (se especificaría 'MEMCACHE' en 'type' o similar, no modelado aquí aún)
  # memcache_version = "MEMCACHE_1_5" 
  
  # transit_encryption_mode = "SERVER_AUTHENTICATION" # Para Redis
  # maintenance_policy {
  #   weekly_maintenance_window {
  #     day = "SATURDAY"
  #     start_time {
  #       hours   = 0
  #       minutes = 0
  #       seconds = 0
  #       nanos   = 0
  #     }
  #   }
  # }
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Instance = new gcp.redis.Instance("${resourceName}", { // Asumiendo Redis, para Memcached sería gcp.memcache.Instance
    name: "${config.name}",
    project: "${config.project}",
    region: "${config.region}",
    tier: "${config.tier}",
    memorySizeGb: ${config.memory_size_gb},
    ${config.redis_version ? `redisVersion: "${config.redis_version}",` : ''}
    // connectMode: "${config.connect_mode}",
    // ${config.connect_mode === 'DIRECT_PEERING' && config.authorized_network ? `authorizedNetwork: "${config.authorized_network}",` : ''}
    // transitEncryptionMode: "SERVER_AUTHENTICATION",
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Memorystore Instance (requiere google.cloud collection)
- name: Create Memorystore Instance (Redis)
  google.cloud.gcp_redis_instance:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    region: "${config.region}"
    tier: "${config.tier}"
    memory_size_gb: ${config.memory_size_gb}
    redis_version: "${config.redis_version}"
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Memorystore.\n"
  };
}
