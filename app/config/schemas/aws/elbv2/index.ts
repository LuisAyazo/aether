import * as loadBalancerDefinition from './loadBalancer';

// Define la estructura para la categoría 'elbv2' de AWS (Application/Network Load Balancers)
export const awsElbv2Resources = {
  loadBalancer: { // Para Application Load Balancer (y potencialmente Network LB en el futuro)
    schema: loadBalancerDefinition.schema,
    fields: loadBalancerDefinition.fields,
    templates: loadBalancerDefinition.templates,
    defaults: loadBalancerDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de ELBv2 en el futuro
  // (ej. target_group, listener, listener_rule, etc.)
};
