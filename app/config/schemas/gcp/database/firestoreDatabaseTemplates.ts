import { GCPFirestoreDatabaseConfig } from './firestoreDatabase'; // Asumiremos que este tipo se definirá en firestoreDatabase.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

export function generateGCPFirestoreDatabaseTemplates(config: GCPFirestoreDatabaseConfig): CodeTemplate {
  // El nombre del recurso en Terraform para google_firestore_database es usualmente fijo o basado en el proyecto.
  // Para Pulumi, podemos usar el nombre que el usuario le da si no es "(default)".
  const resourceName = config.name === '(default)' ? 'default_firestore_database' : config.name.replace(/-/g, '_');

  const terraform = `
resource "google_firestore_database" "${resourceName}" {
  project     = "${config.project}"
  name        = "${config.name}" # Usualmente "(default)"
  location_id = "${config.location_id}"
  type        = "${config.type}" # FIRESTORE_NATIVE o DATASTORE_MODE
  ${config.delete_protection_state ? `delete_protection_state = "${config.delete_protection_state}"` : ''}
  # Firestore no tiene muchas otras configuraciones a nivel de 'database'
  # Las reglas de seguridad y los índices se gestionan por separado.
  # Ejemplo de dependencia para activar la API (si es necesario):
  # depends_on = [google_project_service.firestore]
}

# resource "google_project_service" "firestore" {
#   project = "${config.project}"
#   service = "firestore.googleapis.com"
#   disable_on_destroy = false
# }
`;

  const pulumi = `
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const ${resourceName} = new gcp.firestore.Database("${resourceName}", {
    project: "${config.project}",
    name: "${config.name}", // Usualmente "(default)"
    locationId: "${config.location_id}",
    type: "${config.type}",
    ${config.delete_protection_state ? `deleteProtectionState: "${config.delete_protection_state}",` : ''}
});

// const firestoreAPI = new gcp.projects.Service("firestoreAPI", {
//     service: "firestore.googleapis.com",
//     project: "${config.project}",
//     disableOnDestroy: false,
// }, { dependsOn: [${resourceName}] }); // O sin dependsOn si se crea primero
`;

  return {
    terraform,
    pulumi,
    ansible: `# Ansible para GCP Firestore Database (requiere google.cloud collection)
# La creación de la base de datos Firestore a menudo se realiza habilitando la API
# y la primera escritura puede inicializarla.
# Este es un placeholder, ya que la gestión directa de la 'database' resource es menos común.
- name: Ensure Firestore API is enabled
  google.cloud.gcp_project_service:
    project: "{{ project_id | default('${config.project}') }}"
    service: firestore.googleapis.com
    state: present

# La configuración de la base de datos (ubicación, modo) se establece una vez.
# - name: Configure Firestore Database (si es necesario y el módulo lo soporta)
#   google.cloud.gcp_firestore_database: # (Verificar módulo exacto)
#     project: "{{ project_id | default('${config.project}') }}"
#     location_id: "${config.location_id}"
#     type: "${config.type}"
#     state: present
`,
    cloudformation: "// CloudFormation no es aplicable directamente a GCP Firestore.\n"
  };
}
