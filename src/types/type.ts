const azureEnvVars = [
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_API_INSTANCE_NAME",
  "AZURE_OPENAI_API_DEPLOYMENT_NAME",
  "AZURE_OPENAI_API_DEPLOYMENT_NAME_4omini",
  "AZURE_OPENAI_API_DEPLOYMENT_NAME_4o",
  "AZURE_OPENAI_API_DEPLOYMENT_NAME_o1mini",
  "AZURE_LLM_API_INSTANCE_NAME",
  "AZURE_LLM_API_ENDPOINT_SUFFIX",
  "AZURE_AI_API_KEY",
  "AZURE_AI_API_DEPLOYMENT_NAME_Codestral",
  "AZURE_AI_API_DEPLOYMENT_NAME_MistralNemo",
  "AZURE_OPENAI_API_VERSION",
  "AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME",
  "AZURE_COSMOSDB_URI",
  "AZURE_COSMOSDB_KEY",
  "AZURE_COSMOSDB_DB_NAME",
  "AZURE_COSMOSDB_CONTAINER_NAME",
  "AZURE_SEARCH_API_KEY",
  "AZURE_SEARCH_NAME",
  "AZURE_SEARCH_INDEX_NAME",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AZURE_AD_CLIENT_ID",
  "AZURE_AD_CLIENT_SECRET",
  "AZURE_AD_TENANT_ID",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT",
  "AZURE_DOCUMENT_INTELLIGENCE_KEY",
  "ADMIN_EMAIL_ADDRESS",
  "AZURE_SPEECH_REGION",
  "AZURE_SPEECH_KEY",
  "AZURE_KEY_VAULT_NAME",
] as const;

type RequiredServerEnvKeys = (typeof azureEnvVars)[number];

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Record<RequiredServerEnvKeys, string> {}
  }
}

export {};
