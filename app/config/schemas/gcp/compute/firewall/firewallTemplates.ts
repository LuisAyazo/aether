import { GCPComputeFirewallConfig } from './firewall'; // Asumiremos que este tipo está en firewall.ts
import { CodeTemplate } from '../../../../../types/resourceConfig';

function formatProtocolsForTerraform(protocols: GCPComputeFirewallConfig['protocols']) {
  if (protocols?.all) {
    return 'all';
  }
  const allowed: string[] = [];
  if (protocols?.tcp) {
    allowed.push(`tcp:${protocols.tcp.replace(/\\s/g, '')}`);
  }
  if (protocols?.udp) {
    allowed.push(`udp:${protocols.udp.replace(/\\s/g, '')}`);
  }
  if (protocols?.icmp) {
    allowed.push('icmp');
  }
  return allowed.length > 0 ? allowed.map(p => `"${p}"`).join(", ") : '';
}

export function generateGCPComputeFirewallTemplates(config: GCPComputeFirewallConfig): CodeTemplate {
  const resourceName = config.name.replace(/-/g, '_');
  const terraformProtocols = formatProtocolsForTerraform(config.protocols);

  const terraform = `
resource "google_compute_firewall" "${config.name}" {
  name          = "${config.name}"
  project       = "${config.project}"
  network       = "${config.network}"
  direction     = "${config.direction}"
  priority      = ${config.priority}
  ${config.action === 'allow' ? `
  allow {
    protocol = ${config.protocols?.all ? '"all"' : `[${terraformProtocols}]`}
    ${!config.protocols?.all && (config.protocols?.tcp || config.protocols?.udp) ? '' : '# ports are implicitly all if protocol is "all" or just "icmp"'}
  }` : `
  deny {
    protocol = ${config.protocols?.all ? '"all"' : `[${terraformProtocols}]`}
    ${!config.protocols?.all && (config.protocols?.tcp || config.protocols?.udp) ? '' : '# ports are implicitly all if protocol is "all" or just "icmp"'}
  }`}
  ${config.source_ranges ? `source_ranges = ["${config.source_ranges.split(',').map(s => s.trim()).join('", "')}"]` : ''}
  ${config.target_tags ? `target_tags   = ["${config.target_tags.split(',').map(s => s.trim()).join('", "')}"]` : ''}
  ${config.source_tags ? `source_tags   = ["${config.source_tags.split(',').map(s => s.trim()).join('", "')}"]` : ''}
  ${config.description ? `description   = "${config.description}"`: ''}
}
`;

  const pulumiAllowed = [];
  if (config.protocols?.all) {
    pulumiAllowed.push({ protocol: "all" });
  } else {
    if (config.protocols?.tcp) pulumiAllowed.push({ protocol: "tcp", ports: config.protocols.tcp.split(',').map(p => p.trim()) });
    if (config.protocols?.udp) pulumiAllowed.push({ protocol: "udp", ports: config.protocols.udp.split(',').map(p => p.trim()) });
    if (config.protocols?.icmp) pulumiAllowed.push({ protocol: "icmp" });
  }

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName}Firewall = new gcp.compute.Firewall("${config.name}", {
    name: "${config.name}",
    project: "${config.project}",
    network: "${config.network}",
    direction: "${config.direction}",
    priority: ${config.priority},
    ${config.action === 'allow' ? `allows: ${JSON.stringify(pulumiAllowed, null, 4)},` : `denies: ${JSON.stringify(pulumiAllowed, null, 4)},`}
    ${config.source_ranges ? `sourceRanges: ["${config.source_ranges.split(',').map(s => s.trim()).join('", "')}"],` : ''}
    ${config.target_tags ? `targetTags: ["${config.target_tags.split(',').map(s => s.trim()).join('", "')}"],` : ''}
    ${config.source_tags ? `sourceTags: ["${config.source_tags.split(',').map(s => s.trim()).join('", "')}"],` : ''}
    ${config.description ? `description: "${config.description}",`: ''}
});
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Firewall Rule (requiere google.cloud collection)
- name: Create Firewall Rule
  google.cloud.gcp_compute_firewall:
    name: "${config.name}"
    project: "{{ project_id | default('${config.project}') }}"
    network: "${config.network}"
    direction: "${config.direction}"
    priority: ${config.priority}
    allowed: # o 'denied'
      - ip_protocol: ${config.protocols?.all ? 'all' : (config.protocols?.tcp ? 'tcp' : (config.protocols?.udp ? 'udp' : (config.protocols?.icmp ? 'icmp' : 'all')))}
        ports: ${config.protocols?.tcp ? `[${config.protocols.tcp.split(',').map(p => p.trim()).join(', ')}]` : (config.protocols?.udp ? `[${config.protocols.udp.split(',').map(p => p.trim()).join(', ')}]` : "[]")}
    state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Firewall Rules.\n"
  };
}

/*
export const firewallTemplates: ResourceTemplate[] = [
  // ... (contenido anterior del array) ...
];
*/
