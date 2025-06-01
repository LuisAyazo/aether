import azureVirtualNetworkResource from './virtualnetwork/virtualNetwork';
import azureSubnetResource from './subnet/subnet';
import azureNetworkSecurityGroupResource from './networksecuritygroup/networkSecurityGroup';
import azureLoadBalancerResource from './loadbalancer/loadBalancer';
import azureApplicationGatewayResource from './applicationgateway/applicationGateway';
import azureFirewallResource from './firewall/firewall';
// Importar otros recursos de Networking aquí si se añaden en el futuro.

// Agrupa todos los recursos de Azure Networking en un solo objeto.
const azureNetworkingResources = {
  virtualnetwork: azureVirtualNetworkResource,
  subnet: azureSubnetResource,
  networksecuritygroup: azureNetworkSecurityGroupResource,
  loadbalancer: azureLoadBalancerResource,
  applicationgateway: azureApplicationGatewayResource,
  firewall: azureFirewallResource,
};

export { azureNetworkingResources }; // Exportación nombrada
