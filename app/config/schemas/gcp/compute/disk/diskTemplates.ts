import { ResourceTemplate } from '../../../../../types/resourceConfig';

export const diskTemplates: ResourceTemplate[] = [
  {
    name: 'Standard Boot Disk',
    description: 'Standard persistent disk for boot volumes',
    config: {
      name: 'boot-disk',
      project: '${var.project_id}',
      zone: 'us-central1-a',
      size: 20,
      type: 'pd-standard',
      image: {
        project: 'ubuntu-os-cloud',
        family: 'ubuntu-2004-lts'
      },
      labels: {
        environment: 'dev',
        team: 'backend'
      }
    }
  },
  {
    name: 'SSD Data Disk',
    description: 'High-performance SSD disk for data storage',
    config: {
      name: 'data-disk',
      project: '${var.project_id}',
      zone: 'us-central1-a',
      size: 100,
      type: 'pd-ssd',
      labels: {
        environment: 'prod',
        team: 'data'
      }
    }
  },
  {
    name: 'Balanced Disk',
    description: 'Balanced persistent disk with good price/performance ratio',
    config: {
      name: 'balanced-disk',
      project: '${var.project_id}',
      zone: 'us-central1-a',
      size: 50,
      type: 'pd-balanced',
      labels: {
        environment: 'staging'
      }
    }
  },
  {
    name: 'From Snapshot',
    description: 'Disk created from an existing snapshot',
    config: {
      name: 'restored-disk',
      project: '${var.project_id}',
      zone: 'us-central1-a',
      size: 20,
      type: 'pd-standard',
      snapshot: 'my-backup-snapshot',
      labels: {
        environment: 'dev',
        restored: 'true'
      }
    }
  }
];
