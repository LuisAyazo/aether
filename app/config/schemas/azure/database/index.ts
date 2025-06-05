import azureCosmosDbAccountResource from './cosmosdbaccount/cosmosDbAccount';
import azureMsSqlDatabaseResource from './mssqldatabase/mssqlDatabase';

// Agrupa todos los recursos de Azure Database en un solo objeto.
const azureDatabaseResources = {
  cosmosdbaccount: azureCosmosDbAccountResource,
  mssqldatabase: azureMsSqlDatabaseResource,
  // Aquí se podrían añadir otros recursos de Azure Database en el futuro,
  // por ejemplo: sqlserver, mysql, postgresql, etc.
};

export { azureDatabaseResources }; // Exportación nombrada
