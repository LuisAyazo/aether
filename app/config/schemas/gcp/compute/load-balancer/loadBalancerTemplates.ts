import { GCPComputeLoadBalancerConfig } from './loadBalancer'; // Asumiremos que este tipo está en loadBalancer.ts
import { CodeTemplate } from '../../../../../types/resourceConfig';

export function generateGCPComputeLoadBalancerTemplates(config: GCPComputeLoadBalancerConfig): CodeTemplate {
  const baseName = config.name.replace(/-/g, '_');
  const backendServiceName = config.backend_service.name.replace(/-/g, '_');
  const healthCheckName = config.health_check?.name?.replace(/-/g, '_') || `${baseName}_hc`;

  // Simplificación: Asumimos un HTTP(S) Load Balancer externo.
  // Una implementación completa requeriría más lógica para diferentes tipos de LB.

  const terraform = `
# Backend Service
resource "google_compute_backend_service" "${backendServiceName}" {
  name                  = "${config.backend_service.name}"
  project               = "${config.project}"
  protocol              = "${config.backend_service.protocol}"
  port_name             = "http" # Asumido para HTTP/HTTPS LB
  timeout_sec           = ${config.backend_service.timeout_sec}
  load_balancing_scheme = "${config.load_balancing_scheme}" # EXTERNAL, INTERNAL, etc.
  ${config.health_check ? `health_checks         = [google_compute_health_check.${healthCheckName}.self_link]` : ""}
  ${config.cdn_policy ? `
  enable_cdn            = true
  cdn_policy {
    cache_mode              = "CACHE_ALL_STATIC"
    default_ttl             = 3600
    client_ttl              = 3600
    max_ttl                 = 86400
    negative_caching        = true
    negative_caching_policy = {
      code = 500
      ttl  = 300
    }
  }` : ""}
}

# Health Check (si está definido)
${config.health_check ? `
resource "google_compute_health_check" "${healthCheckName}" {
  name                = "${config.health_check.name || `${config.name}-hc`}"
  project             = "${config.project}"
  check_interval_sec  = ${config.health_check.check_interval_sec}
  timeout_sec         = 5 # Default, puede ser configurable
  healthy_threshold   = 2 # Default
  unhealthy_threshold = 2 # Default
  
  http_health_check {
    port         = ${config.health_check.port}
    request_path = "${config.health_check.path}"
  }
}` : ""}

# URL Map
resource "google_compute_url_map" "${baseName}_url_map" {
  name            = "${config.name}-url-map"
  project         = "${config.project}"
  default_service = google_compute_backend_service.${backendServiceName}.self_link
}

# Target HTTP(S) Proxy
${config.protocol === 'HTTPS' ? `
resource "google_compute_target_https_proxy" "${baseName}_target_proxy" {
  name             = "${config.name}-target-https-proxy"
  project          = "${config.project}"
  url_map          = google_compute_url_map.${baseName}_url_map.self_link
  ${config.ssl_certificate ? `ssl_certificates = ["${config.ssl_certificate}"]` : "# Se requiere un certificado SSL para HTTPS"}
}` : `
resource "google_compute_target_http_proxy" "${baseName}_target_proxy" {
  name    = "${config.name}-target-http-proxy"
  project = "${config.project}"
  url_map = google_compute_url_map.${baseName}_url_map.self_link
}`}

# Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "${baseName}_forwarding_rule" {
  name                  = "${config.name}-forwarding-rule"
  project               = "${config.project}"
  target                = ${config.protocol === 'HTTPS' ? `google_compute_target_https_proxy.${baseName}_target_proxy.self_link` : `google_compute_target_http_proxy.${baseName}_target_proxy.self_link`}
  port_range            = "${config.port}"
  load_balancing_scheme = "${config.load_balancing_scheme}" # Debe ser EXTERNAL o EXTERNAL_MANAGED para Global
}
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Backend Service
const ${backendServiceName}BackendService = new gcp.compute.BackendService("${config.backend_service.name}", {
    name: "${config.backend_service.name}",
    project: "${config.project}",
    protocol: "${config.backend_service.protocol}",
    portName: "http",
    timeoutSec: ${config.backend_service.timeout_sec},
    loadBalancingScheme: "${config.load_balancing_scheme}",
    ${config.health_check ? `healthChecks: [healthCheck.id],` : ""}
    ${config.cdn_policy ? `enableCdn: true,
    cdnPolicy: {
        cacheMode: "CACHE_ALL_STATIC",
        defaultTtl: 3600,
    },` : ""}
});

// Health Check
${config.health_check ? `
const healthCheck = new gcp.compute.HealthCheck("${healthCheckName}", {
    name: "${config.health_check.name || `${config.name}-hc`}",
    project: "${config.project}",
    checkIntervalSec: ${config.health_check.check_interval_sec},
    httpHealthCheck: {
        port: ${config.health_check.port},
        requestPath: "${config.health_check.path}",
    },
});` : "const healthCheck = null; // O manejar la opcionalidad de otra forma"}

// URL Map
const urlMap = new gcp.compute.URLMap("${baseName}_url_map", {
    name: \`${config.name}-url-map\`,
    project: "${config.project}",
    defaultService: ${backendServiceName}BackendService.id,
});

// Target Proxy
${config.protocol === 'HTTPS' ? `
const targetProxy = new gcp.compute.TargetHttpsProxy("${baseName}_target_proxy", {
    name: \`${config.name}-target-https-proxy\`,
    project: "${config.project}",
    urlMap: urlMap.id,
    ${config.ssl_certificate ? `sslCertificates: ["${config.ssl_certificate}"],` : "// Se requiere un certificado SSL para HTTPS"}
});` : `
const targetProxy = new gcp.compute.TargetHttpProxy("${baseName}_target_proxy", {
    name: \`${config.name}-target-http-proxy\`,
    project: "${config.project}",
    urlMap: urlMap.id,
});`}

// Global Forwarding Rule
const forwardingRule = new gcp.compute.GlobalForwardingRule("${baseName}_forwarding_rule", {
    name: \`${config.name}-forwarding-rule\`,
    project: "${config.project}",
    target: targetProxy.id,
    portRange: "${config.port}",
    loadBalancingScheme: "${config.load_balancing_scheme}",
});
`;

  return {
    terraform,
    pulumi,
    ansible: "# Ansible para GCP Load Balancer es complejo y usualmente involucra múltiples tareas.\n# Este es un placeholder.\n- name: Configure HTTP(S) Load Balancer (Placeholder)\n  debug:\n    msg: \"Ansible playbook for GCP Load Balancer ${config.name} needs to be created manually, managing backend service, health check, URL map, target proxy, and forwarding rule.\"\n",
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Load Balancers.\n"
  };
}

/*
export const loadBalancerTemplates: ResourceTemplate[] = [
 // ... (contenido anterior del array) ...
];
*/
