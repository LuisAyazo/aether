import { GCPAppEngineAppConfig } from './app'; // Asumiremos que este tipo se definirá en app.ts
import { CodeTemplate } from '@/app/types/resourceConfig'; // Usar alias

export function generateGCPAppEngineAppTemplates(config: GCPAppEngineAppConfig): CodeTemplate {
  // El nombre del recurso Terraform para google_app_engine_application es usualmente fijo o basado en el proyecto.
  // Aquí, 'name' en config se refiere al nombre lógico que le damos en nuestra UI o para el recurso Terraform.
  const resourceName = config.name || `appengine-${config.project}`;

  const terraform = `
resource "google_app_engine_application" "${resourceName}" {
  project     = "${config.project}"
  location_id = "${config.locationId}"
  ${config.databaseType ? `database_type = "${config.databaseType}"` : ''}
  ${config.authDomain ? `auth_domain   = "${config.authDomain}"` : ''}
  ${config.serviceAccount ? `service_account = "${config.serviceAccount}"` : ''}
  // App Engine Standard no tiene 'runtime' directamente en el recurso 'google_app_engine_application'.
  // El runtime se define a nivel de servicio/versión (app.yaml).
  // Aquí solo creamos la aplicación App Engine en sí.
  // Podríamos añadir un recurso google_app_engine_standard_app_version si quisiéramos desplegar una versión.
}

// Ejemplo de cómo se podría definir un servicio (requiere más configuración)
/*
resource "google_app_engine_standard_app_version" "default_service" {
  project    = google_app_engine_application.${resourceName}.project
  service    = "default" // o el nombre del servicio
  runtime    = "${config.runtime || 'nodejs18'}" 

  entrypoint {
    shell = "node ./app.js" // Ejemplo para Node.js
  }

  deployment {
    zip {
      source_url = "https://storage.googleapis.com/\${google_app_engine_application.${resourceName}.project}-appengine-staging/\${google_app_engine_application.${resourceName}.project}/source-archive.zip" // Placeholder
    }
  }

  instance_class = "F1" // Ejemplo, se necesitaría un campo para esto

  // Más configuraciones como handlers, variables de entorno, scaling, etc.
}
*/
`;

  const pulumi = `
import * as gcp from "@pulumi/gcp";

const ${resourceName} = new gcp.appengine.Application("${resourceName}", {
    project: "${config.project}",
    locationId: "${config.locationId}",
    ${config.databaseType ? `databaseType: "${config.databaseType}",` : ''}
    ${config.authDomain ? `authDomain: "${config.authDomain}",` : ''}
    ${config.serviceAccount ? `serviceAccount: "${config.serviceAccount}",` : ''}
});

// Ejemplo de servicio (requiere más configuración)
/*
const defaultService = new gcp.appengine.StandardAppVersion("default_service", {
    project: ${resourceName}.project,
    service: "default",
    runtime: "${config.runtime || 'nodejs18'}",
    entrypoint: {
        shell: "node ./app.js", // Ejemplo
    },
    deployment: {
        zip: {
            sourceUrl: \`https://storage.googleapis.com/\${${resourceName}.project}-appengine-staging/\${${resourceName}.project}/source-archive.zip\`, // Placeholder
        },
    },
    instanceClass: "F1", // Ejemplo
});
*/
`;

  return {
    terraform,
    pulumi,
    ansible: "# Ansible para GCP App Engine Application (requiere google.cloud collection)\n- name: Create App Engine Application\n  google.cloud.gcp_appengine_application:\n    project: \"{{ project_id | default('${config.project}') }}\"\n    location_id: \"${config.locationId}\"\n    # database_type: \"${config.databaseType || ''}\"\n    # auth_domain: \"${config.authDomain || ''}\"\n    state: present\n",
    cloudformation: "// CloudFormation no es aplicable directamente a GCP App Engine.\n// Se usaría Google Cloud Deployment Manager o Terraform/Pulumi.\n"
  };
}
