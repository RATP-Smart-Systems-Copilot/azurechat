import { OpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { AzureOpenAI } from "openai";

export interface PromptPricing{
  price: number;
  unit: number;
}

export interface GPT{
  model: string;
  name: string;
  description: string;
  prompt: PromptPricing;
  completion: PromptPricing;
}

export interface GPTS {
  [key: string]: GPT;
}

export const getModelOptions = () : GPTS => {
  return {
    'gpt-4o-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      'name': 'GPT 4o mini',
      'description': 'Chat GPT 4o mini avec un contexte de 128k tokens maximal, 16 384 tokens maximal par réponse et un seuil de connaissance à octobre 2023 \n test',
      'prompt': { 'price': 0.00015280, 'unit': 1000 },
      'completion': { 'price': 0.0006112, 'unit': 1000 },
    },
    'gpt4o': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_4o,
      'name': 'GPT 4o',
      'description': 'Chat GPT 4o avec un contexte de 128k tokens maximal, 16 384 tokens maximal par réponse et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.00254665, 'unit': 1000 },
      'completion': { 'price': 0.0101866, 'unit': 1000 },
    },
    'o1-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o1mini,
      'name': 'o1 mini',
      'description': 'Chat GPT o1 mini avec un contexte de 128k tokens maximal, 65 536 tokens maximal par réponse et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.0031663, 'unit': 1000 },
      'completion': { 'price': 0.012664908, 'unit': 1000 },
    },
  };

};

export const modelOptions = getModelOptions();

export const defaultGPTModel = 'gpt-4o-mini';

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

export const OpenAIInstance = (gptModel: string = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME) => {

  if(gptModel === 'o1-mini')
    return OpenAIo1Instance();

  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  let token = process.env.AZURE_OPENAI_API_KEY;
  let selectedModel = Object.values(modelOptions).find(model => model.model === gptModel);
  if (!selectedModel) {
    selectedModel = modelOptions['gpt-4o-mini']; // Set default value if gptModel is not found in modelOptions
  }
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
export const OpenAIo1Instance = () => {
  if (
    !process.env.AZURE_OPENAI_DALLE_API_KEY ||
    !process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME ||
    !process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME
  ) {
    throw new Error(
      "Azure OpenAI o1 endpoint config is not set, check environment variables."
    );
  }
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";

  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_DALLE_API_KEY,
    baseURL: `https://${process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o1mini}`,
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
