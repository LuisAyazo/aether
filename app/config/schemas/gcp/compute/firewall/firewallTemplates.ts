import { ResourceTemplate } from '../../../../../types/resourceConfig';

export const firewallTemplates: ResourceTemplate[] = [
  {
    name: 'Allow HTTP/HTTPS',
    description: 'Allow HTTP and HTTPS traffic from internet',
    config: {
      name: 'allow-http-https',
      project: '${var.project_id}',
      network: 'default',
      direction: 'INGRESS',
      priority: 1000,
      action: 'allow',
      source_ranges: '0.0.0.0/0',
      target_tags: 'http-server,https-server',
      protocols: {
        tcp: '80,443'
      },
      description: 'Allow HTTP and HTTPS traffic from internet'
    }
  },
  {
    name: 'Allow SSH',
    description: 'Allow SSH access from specific IP range',
    config: {
      name: 'allow-ssh',
      project: '${var.project_id}',
      network: 'default',
      direction: 'INGRESS',
      priority: 1000,
      action: 'allow',
      source_ranges: '0.0.0.0/0',
      target_tags: 'ssh-server',
      protocols: {
        tcp: '22'
      },
      description: 'Allow SSH access'
    }
  },
  {
    name: 'Internal Communication',
    description: 'Allow all traffic between instances with internal tag',
    config: {
      name: 'allow-internal',
      project: '${var.project_id}',
      network: 'default',
      direction: 'INGRESS',
      priority: 1000,
      action: 'allow',
      source_tags: 'internal',
      target_tags: 'internal',
      protocols: {
        all: true
      },
      description: 'Allow all internal communication'
    }
  },
  {
    name: 'Deny All External',
    description: 'Deny all external traffic (high priority)',
    config: {
      name: 'deny-all-external',
      project: '${var.project_id}',
      network: 'default',
      direction: 'INGRESS',
      priority: 100,
      action: 'deny',
      source_ranges: '0.0.0.0/0',
      protocols: {
        all: true
      },
      description: 'Deny all external traffic'
    }
  },
  {
    name: 'Allow Database',
    description: 'Allow database connections from app servers',
    config: {
      name: 'allow-database',
      project: '${var.project_id}',
      network: 'default',
      direction: 'INGRESS',
      priority: 1000,
      action: 'allow',
      source_tags: 'app-server',
      target_tags: 'database-server',
      protocols: {
        tcp: '3306,5432'
      },
      description: 'Allow database connections from app servers'
    }
  }
];
