import { OpenAI } from "openai";

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
    'gpt3.5': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      'name': 'GPT 3.5',
      'description': 'Chat GPT 3.5 avec un contexte de 16k tokens maximal et un seuil de connaissance à janvier 2022',
      'prompt': { 'price': 0.0027, 'unit': 1000 },
      'completion': { 'price': 0.0036, 'unit': 1000 },
    },
    'gpt4o': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_4o,
      'name': 'GPT 4o',
      'description': 'Chat GPT 4o avec un contexte de 128k tokens maximal et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.0045, 'unit': 1000 },
      'completion': { 'price': 0.0135, 'unit': 1000 },
    },
  };

};

export const modelOptions = getModelOptions();

export const defaultGPTModel = 'gpt3.5';

export const OpenAIInstance = (gptModel: string = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME) => {
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  let selectedModel = Object.values(modelOptions).find(model => model.model === gptModel);
  if (!selectedModel) {
    selectedModel = modelOptions['gpt3.5']; // Set default value if gptModel is not found in modelOptions
  }
  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${selectedModel.model}`,
    defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
  });
  return openai;
};

export const OpenAIEmbeddingInstance = () => {
  if (
    !process.env.AZURE_OPENAI_API_KEY ||
    !process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME ||
    !process.env.AZURE_OPENAI_API_INSTANCE_NAME
  ) {
    throw new Error(
      "Azure OpenAI Embeddings endpoint config is not set, check environment variables."
    );
  }
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";

  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME}`,
    defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
  });
  return openai;
};

// a new instance definition for DALL-E image generation
export const OpenAIDALLEInstance = () => {
  if (
    !process.env.AZURE_OPENAI_DALLE_API_KEY ||
    !process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME ||
    !process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME
  ) {
    throw new Error(
      "Azure OpenAI DALLE endpoint config is not set, check environment variables."
    );
  }
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";

  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_DALLE_API_KEY,
    baseURL: `https://${process.env.AZURE_OPENAI_DALLE_API_INSTANCE_NAME}.${endpointSuffix}/openai/deployments/${process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME}`,
    defaultQuery: {
      "api-version":
        process.env.AZURE_OPENAI_DALLE_API_VERSION || "2023-12-01-preview",
    },
    defaultHeaders: {
      "api-key": process.env.AZURE_OPENAI_DALLE_API_KEY,
    },
  });
  return openai;
};

export const OpenAIAssistant = () => {
  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `https://${process.env.AZURE_OPENAI_API_INSTANCE_NAME}.openai.azure.com/openai/`,
    defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
  });
  return openai;
};
