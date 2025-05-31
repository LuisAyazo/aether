import { ResourceTemplate } from '../../../../../types/resourceConfig';

export const loadBalancerTemplates: ResourceTemplate[] = [
  {
    name: 'HTTP Load Balancer',
    description: 'Basic HTTP load balancer for web applications',
    config: {
      name: 'http-lb',
      project: '${var.project_id}',
      load_balancing_scheme: 'EXTERNAL',
      protocol: 'HTTP',
      port: 80,
      backend_service: {
        name: 'http-backend',
        protocol: 'HTTP',
        port: 80,
        timeout_sec: 30
      },
      health_check: {
        name: 'http-health-check',
        path: '/',
        port: 80,
        check_interval_sec: 10
      },
      cdn_policy: false,
      description: 'HTTP load balancer for web application'
    }
  },
  {
    name: 'HTTPS Load Balancer',
    description: 'HTTPS load balancer with SSL certificate',
    config: {
      name: 'https-lb',
      project: '${var.project_id}',
      load_balancing_scheme: 'EXTERNAL',
      protocol: 'HTTPS',
      port: 443,
      backend_service: {
        name: 'https-backend',
        protocol: 'HTTP',
        port: 80,
        timeout_sec: 30
      },
      health_check: {
        name: 'https-health-check',
        path: '/health',
        port: 80,
        check_interval_sec: 10
      },
      ssl_certificate: 'my-ssl-cert',
      cdn_policy: true,
      description: 'HTTPS load balancer with SSL and CDN'
    }
  },
  {
    name: 'Internal Load Balancer',
    description: 'Internal load balancer for backend services',
    config: {
      name: 'internal-lb',
      project: '${var.project_id}',
      load_balancing_scheme: 'INTERNAL',
      protocol: 'TCP',
      port: 8080,
      backend_service: {
        name: 'internal-backend',
        protocol: 'TCP',
        port: 8080,
        timeout_sec: 30
      },
      health_check: {
        name: 'internal-health-check',
        path: '/health',
        port: 8080,
        check_interval_sec: 5
      },
      description: 'Internal load balancer for backend services'
    }
  },
  {
    name: 'Global HTTP(S) LB',
    description: 'Global load balancer with CDN and multiple backends',
    config: {
      name: 'global-lb',
      project: '${var.project_id}',
      load_balancing_scheme: 'EXTERNAL_MANAGED',
      protocol: 'HTTPS',
      port: 443,
      backend_service: {
        name: 'global-backend',
        protocol: 'HTTP',
        port: 80,
        timeout_sec: 60
      },
      health_check: {
        name: 'global-health-check',
        path: '/api/health',
        port: 80,
        check_interval_sec: 15
      },
      ssl_certificate: 'global-ssl-cert',
      cdn_policy: true,
      description: 'Global HTTPS load balancer with CDN'
    }
  }
];
