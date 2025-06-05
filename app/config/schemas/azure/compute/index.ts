import azureVirtualMachineResource from './virtualmachine/virtualMachine';
import azureLinuxVirtualMachineScaleSetResource from './linuxvirtualmachinescaleset/linuxVirtualMachineScaleSet';
import azureKubernetesClusterResource from './kubernetescluster/kubernetesCluster';
import azureLinuxWebAppResource from './linuxwebapp/linuxWebApp';
import azureContainerGroupResource from './containergroup/containerGroup';

// Agrupa todos los recursos de Azure Compute en un solo objeto.
const azureComputeResources = {
  virtualmachine: azureVirtualMachineResource,
  linuxvirtualmachinescaleset: azureLinuxVirtualMachineScaleSetResource,
  kubernetescluster: azureKubernetesClusterResource,
  linuxwebapp: azureLinuxWebAppResource,
  containergroup: azureContainerGroupResource, // Nombre del recurso en minúsculas como clave
  // Aquí se podrían añadir otros recursos de Azure Compute en el futuro.
};

export { azureComputeResources }; // Exportación nombrada
