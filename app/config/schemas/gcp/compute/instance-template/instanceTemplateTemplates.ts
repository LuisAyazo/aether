import { ResourceTemplate } from '../../../../../types/resourceConfig';

export const instanceTemplateTemplates: ResourceTemplate[] = [
  {
    name: 'Web Server Template',
    description: 'Template for auto-scaling web servers',
    config: {
      name: 'web-server-template',
      project: '${var.project_id}',
      machine_type: 'e2-medium',
      region: 'us-central1',
      disk: {
        size_gb: 20,
        type: 'pd-standard',
        auto_delete: true
      },
      image: {
        project: 'ubuntu-os-cloud',
        family: 'ubuntu-2004-lts'
      },
      network_interface: {
        network: 'default',
        access_config: true
      },
      tags: 'web-server,http-server,https-server',
      metadata: {
        startup_script: '#!/bin/bash\napt-get update\napt-get install -y nginx\nsystemctl start nginx\nsystemctl enable nginx'
      },
      service_account: {
        email: 'default',
        scopes: 'cloud-platform'
      },
      labels: {
        environment: 'prod',
        team: 'frontend'
      }
    }
  },
  {
    name: 'API Server Template',
    description: 'Template for backend API servers',
    config: {
      name: 'api-server-template',
      project: '${var.project_id}',
      machine_type: 'e2-standard-2',
      region: 'us-central1',
      disk: {
        size_gb: 30,
        type: 'pd-balanced',
        auto_delete: true
      },
      image: {
        project: 'ubuntu-os-cloud',
        family: 'ubuntu-2004-lts'
      },
      network_interface: {
        network: 'default',
        access_config: false
      },
      tags: 'api-server,internal',
      metadata: {
        startup_script: '#!/bin/bash\napt-get update\napt-get install -y docker.io\nsystemctl start docker\nsystemctl enable docker'
      },
      service_account: {
        email: 'default',
        scopes: 'cloud-platform,storage-rw'
      },
      labels: {
        environment: 'prod',
        team: 'backend'
      }
    }
  },
  {
    name: 'Container Template',
    description: 'Template for container-optimized instances',
    config: {
      name: 'container-template',
      project: '${var.project_id}',
      machine_type: 'e2-standard-4',
      region: 'us-central1',
      disk: {
        size_gb: 50,
        type: 'pd-ssd',
        auto_delete: true
      },
      image: {
        project: 'cos-cloud',
        family: 'cos-stable'
      },
      network_interface: {
        network: 'default',
        access_config: true
      },
      tags: 'container-vm,http-server',
      metadata: {
        startup_script: '#cloud-config\nruncmd:\n  - docker run -d -p 80:8080 gcr.io/${var.project_id}/my-app'
      },
      service_account: {
        email: 'default',
        scopes: 'cloud-platform,storage-ro'
      },
      labels: {
        environment: 'prod',
        team: 'devops'
      }
    }
  },
  {
    name: 'Worker Template',
    description: 'Template for background worker instances',
    config: {
      name: 'worker-template',
      project: '${var.project_id}',
      machine_type: 'n1-standard-2',
      region: 'us-central1',
      disk: {
        size_gb: 100,
        type: 'pd-standard',
        auto_delete: true
      },
      image: {
        project: 'ubuntu-os-cloud',
        family: 'ubuntu-2004-lts'
      },
      network_interface: {
        network: 'default',
        access_config: false
      },
      tags: 'worker,internal',
      metadata: {
        startup_script: '#!/bin/bash\napt-get update\napt-get install -y python3 python3-pip\npip3 install celery redis'
      },
      service_account: {
        email: 'default',
        scopes: 'cloud-platform,pubsub'
      },
      labels: {
        environment: 'prod',
        team: 'data'
      }
    }
  }
];
