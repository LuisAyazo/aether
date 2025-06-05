import gcpEventarcTriggerResource from './trigger';

// Agrupa todos los recursos de Eventarc en un solo objeto para facilitar su importación.
const gcpEventarcResources = {
  trigger: gcpEventarcTriggerResource,
  // Aquí se podrían añadir otros recursos de Eventarc en el futuro si es necesario.
};

export default gcpEventarcResources;
