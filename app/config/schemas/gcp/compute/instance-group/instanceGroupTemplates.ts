import { ResourceTemplate } from '../../../../../types/resourceConfig';

export const instanceGroupTemplates: ResourceTemplate[] = [
  {
    name: 'Web Server Group',
    description: 'Auto-scaling group for web servers',
    config: {
      name: 'web-server-group',
      project: '${var.project_id}',
      zone: 'us-central1-a',
      base_instance_name: 'web-server',
      version: {
        instance_template: 'web-server-template',
        name: 'primary'
      },
      target_size: 3,
      auto_healing_policies: {
        health_check: 'web-health-check',
        initial_delay_sec: 300
      },
      update_policy: {
        type: 'ROLLING_UPDATE',
        minimal_action: 'REPLACE',
        max_surge_fixed: 1,
        max_unavailable_fixed: 1
      },
      named_port: {
        name: 'http',
        port: 80
      }
    }
  },
  {
    name: 'Regional API Group',
    description: 'Regional instance group for high availability API servers',
    config: {
      name: 'api-server-group',
      project: '${var.project_id}',
      region: 'us-central1',
      base_instance_name: 'api-server',
      version: {
        instance_template: 'api-server-template',
        name: 'primary'
      },
      target_size: 5,
      auto_healing_policies: {
        health_check: 'api-health-check',
        initial_delay_sec: 180
      },
      update_policy: {
        type: 'ROLLING_UPDATE',
        minimal_action: 'REPLACE',
        max_surge_fixed: 2,
        max_unavailable_fixed: 1
      },
      named_port: {
        name: 'api',
        port: 8080
      }
    }
  },
  {
    name: 'Worker Group',
    description: 'Instance group for background workers',
    config: {
      name: 'worker-group',
      project: '${var.project_id}',
      zone: 'us-central1-b',
      base_instance_name: 'worker',
      version: {
        instance_template: 'worker-template',
        name: 'primary'
      },
      target_size: 2,
      auto_healing_policies: {
        health_check: 'worker-health-check',
        initial_delay_sec: 600
      },
      update_policy: {
        type: 'OPPORTUNISTIC',
        minimal_action: 'RESTART',
        max_surge_fixed: 0,
        max_unavailable_fixed: 1
      }
    }
  },
  {
    name: 'Load Balanced Group',
    description: 'Instance group configured for load balancer backend',
    config: {
      name: 'lb-backend-group',
      project: '${var.project_id}',
      region: 'us-central1',
      base_instance_name: 'lb-backend',
      version: {
        instance_template: 'web-server-template',
        name: 'primary'
      },
      target_size: 4,
      auto_healing_policies: {
        health_check: 'lb-health-check',
        initial_delay_sec: 240
      },
      update_policy: {
        type: 'ROLLING_UPDATE',
        minimal_action: 'REPLACE',
        max_surge_fixed: 2,
        max_unavailable_fixed: 0
      },
      named_port: {
        name: 'http',
        port: 80
      }
    }
  }
];
