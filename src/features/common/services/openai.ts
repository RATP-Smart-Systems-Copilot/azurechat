import { OpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";
import { modelOptions } from "@/features/theme/theme-config";

export const defaultGPTModel = 'gpt-4o-mini';

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

export const OpenAIInstance = (gptModel: string = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME) => {

  if(gptModel === 'gpt-4.1-mini')
    return OpenAISwedenInstance();

  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  let token = process.env.AZURE_OPENAI_API_KEY;
  let selectedModel = modelOptions[gptModel || defaultGPTModel];
  if (USE_MANAGED_IDENTITIES) {
    const credential = new DefaultAzureCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
    const deployment = selectedModel.model;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const client = new AzureOpenAI({
      azureADTokenProvider,
      deployment,
      apiVersion,
      baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${selectedModel.model}`
    });
    return client;
  } else {
    const openai = new OpenAI({
      apiKey: token,
      baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${selectedModel.model}`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    });
    return openai;
  }
};

export const OpenAIEmbeddingInstance =  () => {
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  let token = process.env.AZURE_OPENAI_API_KEY;
  if (USE_MANAGED_IDENTITIES) {
    const credential = new DefaultAzureCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
    const deployment = process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const client = new AzureOpenAI({
      azureADTokenProvider,
      deployment,
      apiVersion,
      baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME}`
    });
    return client;
  } else {
    const openai = new OpenAI({
      apiKey: token,
      baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME}`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
      defaultHeaders: { "api-key": token },
    });
    return openai;
  }
};

// A new instance definition for DALL-E image generation
export const OpenAIDALLEInstance =  () => {
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  let token = process.env.AZURE_OPENAI_DALLE_API_KEY;
  if (USE_MANAGED_IDENTITIES) {
    const credential = new DefaultAzureCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
    const deployment = process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_DALLE_API_VERSION || "2023-12-01-preview";
    const client = new AzureOpenAI({
      azureADTokenProvider,
      deployment,
      apiVersion,
      baseURL: `https://${process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME}`
    });
    return client;
  } else {
    const openai = new OpenAI({
      apiKey: token,
      baseURL: `https://${process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME}`,
      defaultQuery: { "api-version": process.env.AZURE_OPENAI_DALLE_API_VERSION || "2023-12-01-preview" },
      defaultHeaders: { "api-key": token },
    });
    return openai;
  }
};

// a new instance definition for DALL-E image generation
export const OpenAISwedenInstance = () => {
  if (
    !process.env.AZURE_OPENAI_DALLE_API_KEY ||
    !process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME ||
    !process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME
  ) {
    throw new Error(
      "Azure OpenAI endpoint config is not set, check environment variables."
    );
  }
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";

  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_DALLE_API_KEY,
    baseURL: `https://${process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME}.${endpointSuffix}/openai`,
    defaultQuery: {
      "api-version":
        process.env.AZURE_OPENAI_API_VERSION || "2023-12-01-preview",
    },
    defaultHeaders: {
      "api-key": process.env.AZURE_OPENAI_DALLE_API_KEY,
    },
  });
  return openai;
};
