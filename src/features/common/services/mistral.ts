import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

export const MistralInstance = (gptModel: string = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME) => {

    const endpointSuffix = process.env.AZURE_LLM_API_ENDPOINT_SUFFIX || "services.ai.azure.com";
    const azureLLMInstanceName = process.env.AZURE_LLM_API_INSTANCE_NAME as string;
    const azureURL = `https://${azureLLMInstanceName}.${endpointSuffix}/models`;
    let token = process.env.AZUREAI_ENDPOINT_KEY as string;

    const client = ModelClient(
        azureURL,
        new AzureKeyCredential(token)
      );

    return client;
};
