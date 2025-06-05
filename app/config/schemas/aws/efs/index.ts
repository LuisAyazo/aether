import awsEfsFileSystemResource from './fileSystem';

// Agrupa todos los recursos de EFS en un solo objeto para facilitar su importación.
const awsEfsResources = {
  fileSystem: awsEfsFileSystemResource,
  // Aquí se podrían añadir otros recursos de EFS en el futuro, como Mount Targets, Access Points, etc.
  // mountTarget: awsEfsMountTargetResource, 
};

export default awsEfsResources;
