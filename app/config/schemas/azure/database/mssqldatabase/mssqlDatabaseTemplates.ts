import { AzureMsSqlDatabaseConfig } from './mssqlDatabase'; // Asumiremos que este tipo se definirá en mssqlDatabase.ts
import { CodeTemplate } from '@/app/types/resourceConfig';

const parseKeyValueString = (kvString?: string): Record<string, string> => {
  if (!kvString) return {};
  return kvString.split(',').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

export function generateAzureMsSqlDatabaseTemplates(config: AzureMsSqlDatabaseConfig): CodeTemplate {
  const terraformResourceName = (config.name || 'mydbsql').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  const pulumiResourceName = (config.name || 'mydbsql').replace(/-/g, '');
  const parsedTags = parseKeyValueString(config.tags as string | undefined);

  // Para Terraform y Pulumi, se asume que el servidor SQL (azurerm_mssql_server) ya existe y su ID es conocido.
  // La creación del servidor SQL sería un recurso separado.

  const terraform = `
# Plantilla de Terraform para una Azure SQL Database
provider "azurerm" {
  features {}
}

# Asumimos que el servidor SQL (azurerm_mssql_server) ya existe.
# Su ID se pasa en config.server_id.
# El resource_group_name y location se infieren del servidor SQL.

resource "azurerm_mssql_database" "${terraformResourceName}" {
  name        = "${config.name}"
  server_id   = "${config.server_id}"
  collation   = "${config.collation || 'SQL_Latin1_General_CP1_CI_AS'}"
  sku_name    = "${config.sku_name || 'S0'}" # Ejemplo: S0, GP_Gen5_2
  ${config.max_size_gb ? `max_size_gb = ${config.max_size_gb}`: ''}
  ${config.read_scale !== undefined ? `read_scale  = ${config.read_scale}`: ''}
  ${config.zone_redundant !== undefined ? `zone_redundant = ${config.zone_redundant}`: ''}

  ${Object.keys(parsedTags).length > 0 ? 
    `tags = {
    ${Object.entries(parsedTags).map(([key, value]) => `"${key}" = "${value}"`).join('\n    ')}
  }` : ''}
}

output "mssql_database_id" {
  value = azurerm_mssql_database.${terraformResourceName}.id
}
`;

  const pulumi = `
// Plantilla de Pulumi (TypeScript) para una Azure SQL Database
import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";

// Asumimos que el servidor SQL ya existe y su ID es conocido.
const serverId = "${config.server_id}"; 
// El nombre del grupo de recursos y el nombre del servidor se pueden extraer del server_id si es necesario.
// Ejemplo de extracción (puede necesitar ajustes según el formato exacto del ID):
const serverIdParts = serverId.split('/');
const resourceGroupNameForServer = serverIdParts[4];
const serverName = serverIdParts[8];

const sqlDatabase = new azure.sql.Database("${pulumiResourceName}", {
    databaseName: "${config.name}",
    resourceGroupName: resourceGroupNameForServer,
    serverName: serverName,
    collation: "${config.collation || 'SQL_Latin1_General_CP1_CI_AS'}",
    sku: {
        name: "${config.sku_name || 'S0'}", // Ej: "S0", "GP_Gen5_2"
        // tier: "Standard", // Opcional, depende del SKU
        // capacity: 10, // Para DTU, ej: 10 para S0
    },
    ${config.max_size_gb ? `maxSizeBytes: ${config.max_size_gb * 1024 * 1024 * 1024},` : ''}
    ${config.read_scale !== undefined ? `readScale: "${config.read_scale ? 'Enabled' : 'Disabled'}",` : ''}
    ${config.zone_redundant !== undefined ? `zoneRedundant: ${config.zone_redundant},` : ''}
    tags: {
        ${Object.entries(parsedTags).map(([key, value]) => `"${key}": "${value}",`).join('\n        ')}
    },
});

export const databaseId = sqlDatabase.id;
`;

  const ansiblePlaybook = `
# Playbook Ansible para Azure SQL Database
- name: Gestionar Azure SQL Database ${config.name}
  hosts: localhost
  connection: local
  gather_facts: False

  vars:
    # El resource_group y el nombre del servidor SQL son necesarios.
    # Se pueden extraer del server_id o requerir como inputs separados.
    # Ejemplo de extracción (simplificado, puede necesitar ajustes):
    server_id_parts: "{{ '${config.server_id}'.split('/') }}"
    resource_group_for_server: "{{ server_id_parts[4] }}"
    sql_server_name: "{{ server_id_parts[8] }}"
    database_name: "${config.name}"
    collation: "${config.collation || 'SQL_Latin1_General_CP1_CI_AS'}"
    sku_name: "${config.sku_name || 'S0'}" # Ej: S0, GP_Gen5_2
    # Para DTU SKUs (S0, P1, etc.), edition y dtu son necesarios.
    # Para vCore SKUs (GP_Gen5_2), edition y vcores/family son necesarios.
    # Esto es una simplificación.
    edition: "{{ 'Standard' if 'S' in sku_name or 'Basic' in sku_name else ('Premium' if 'P' in sku_name else 'GeneralPurpose') }}"
    dtu: "{{ 10 if sku_name == 'S0' else (50 if sku_name == 'S1' else omit) }}" # Ejemplo
    tags:
      ${Object.entries(parsedTags).map(([key, value]) => `${key}: "${value}"`).join('\n      ')}

  tasks:
    - name: Crear o actualizar SQL Database
      azure.azcollection.azure_rm_sqldatabase:
        resource_group: "{{ resource_group_for_server }}"
        server_name: "{{ sql_server_name }}"
        name: "{{ database_name }}"
        collation: "{{ collation }}"
        edition: "{{ edition }}"
        # Para DTU:
        # requested_service_objective_name: "{{ sku_name }}"
        # Para vCore (ejemplo, necesitaría más lógica para determinar family y capacity):
        # sku_name: "{{ sku_name.split('_')[0] }}" # GP
        # sku_tier: "{{ sku_name.split('_')[0] }}" # GeneralPurpose
        # sku_family: "{{ sku_name.split('_')[1] }}" # Gen5
        # sku_capacity: "{{ sku_name.split('_')[2] | int }}" # 2
        # La API de Ansible puede variar, consultar documentación para el manejo exacto de SKU.
        # Por simplicidad, se omite la configuración detallada del SKU aquí.
        # Se recomienda usar 'requested_service_objective_name' para DTU o 'sku' para vCore.
        tags: "{{ tags }}"
      register: sqldb_info

    - name: Mostrar información de la SQL Database
      ansible.builtin.debug:
        var: sqldb_info
`;

  const cloudformation = `
# AWS CloudFormation no es aplicable para recursos de Azure.
`;

  return {
    terraform,
    pulumi,
    ansible: ansiblePlaybook,
    cloudformation
  };
}
