@description('Nome base para recursos')
param baseName string
@description('Localização Azure')
param location string = resourceGroup().location
@description('SKU do App Service Plan')
param appServicePlanSku string = 'B1'
@description('Tier do App Service Plan')
param appServicePlanTier string = 'Basic'
@description('Imagem do container (GHCR)')
param containerImage string
@description('Porta exposta pelo container')
param containerPort int = 3000
@description('Nome do servidor PostgreSQL Flexible')
param postgresServerName string
@description('Versão do Postgres')
param postgresVersion string = '16'
@description('SKU do Postgres (ex: Standard_B1ms)')
param postgresSkuName string = 'Standard_B1ms'
@description('Tier do Postgres')
param postgresTier string = 'GeneralPurpose'
@description('Storage MB Postgres')
param postgresStorageMb int = 32768
@description('Usuário administrador Postgres')
param postgresAdminUser string
@secure()
@description('Senha administrador Postgres')
param postgresAdminPassword string
@description('Nome do banco principal')
param postgresDatabaseName string = 'orcasonhos'
@description('Retenção dias App Insights')
param appInsightsRetentionDays int = 30
@description('Sampling percentage AI (0-100) - opcional')
param appInsightsSampling int = 0

// App Service Plan
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${baseName}-plan'
  location: location
  sku: {
    name: appServicePlanSku
    tier: appServicePlanTier
    capacity: 1
  }
  properties: {
    reserved: true // Linux
  }
}

// Web App (container)
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: '${baseName}-api'
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: string(containerPort)
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'HTTP_PORT'
          value: string(containerPort)
        }
        // Database configuration (MVP - password inline, mover para Key Vault futuramente)
        {
          name: 'DB_HOST'
          value: '${pg.name}.postgres.database.azure.com'
        }
        {
          name: 'DB_PORT'
          value: '5432'
        }
        {
          name: 'DB_NAME'
          value: postgresDatabaseName
        }
        {
          name: 'DB_USER'
          value: format('{0}@{1}', postgresAdminUser, pg.name)
        }
        {
          name: 'DB_PASSWORD'
          value: postgresAdminPassword
        }
        {
          name: 'APPINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'APPINSIGHTS_ROLE_NAME'
          value: '${baseName}-api'
        }
        {
          name: 'APPINSIGHTS_SAMPLING_PERCENTAGE'
          value: string(appInsightsSampling == 0 ? 100 : appInsightsSampling)
        }
      ]
      alwaysOn: true
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
  // dependsOn removido (implícito pelo serverFarmId)
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${baseName}-ai'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: appInsightsRetentionDays
    SamplingPercentage: appInsightsSampling == 0 ? 100 : appInsightsSampling
  }
}

// Postgres Flexible Server
resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: postgresSkuName
    tier: postgresTier
  }
  properties: {
    version: postgresVersion
    administratorLogin: postgresAdminUser
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: int(postgresStorageMb / 1024)
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Database inside server
resource pgDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  name: postgresDatabaseName
  parent: pg
  properties: {}
}

@description('Connection string Postgres (sem senha)')
output postgresConnectionStringBase string = 'Host=${pg.name}.postgres.database.azure.com;Database=${postgresDatabaseName};User Id=${postgresAdminUser}@${pg.name};Ssl Mode=Require'
@description('FQDN do servidor Postgres')
output postgresHost string = '${pg.name}.postgres.database.azure.com'
@description('Connection String Application Insights')
output appInsightsConnectionString string = appInsights.properties.ConnectionString
@description('Identity principal id WebApp')
output webAppPrincipalId string = webApp.identity.principalId
