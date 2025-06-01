import awsSfnStateMachineResource from './stateMachine';

// Agrupa todos los recursos de SFN en un solo objeto para facilitar su importación.
const awsSfnResources = {
  stateMachine: awsSfnStateMachineResource,
  // Aquí se podrían añadir otros recursos de SFN en el futuro, como 'activity'.
};

export default awsSfnResources;
