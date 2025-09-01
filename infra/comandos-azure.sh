------------- DEPLOY CONFIG -------------
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
az group create -n orcasonhos-prod-rg -l chilecentral
az ad app create --display-name orcasonhos-deploy-prod
az ad app list --display-name orcasonhos-deploy-prod --query "[0].appId" -o tsv
az ad app delete --id 8223ec71-ee4b-479a-b452-6550b6fa7c10
az ad app create --display-name orcasonhos-deploy-prod
APP_ID=$(az ad app list --display-name orcasonhos-deploy-prod --query "[0].appId" -o tsv)
$APP_ID 
az ad sp create --id $APP_ID
ORG="danilotandrade1518"
REPO="orca-sonhos-back"
az ad app federated-credential create   --id $APP_ID   --parameters "{
    \"name\": \"github-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${ORG}/${REPO}:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }"
az role assignment create   --assignee $APP_ID   --role Contributor   --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/orcasonhos-prod-rg
------------- END DEPLOY CONFIG -------------
