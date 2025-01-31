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

export const OpenAIInstance = (gptModel: string = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME) => {

  if(gptModel === 'o1-mini')
    return OpenAIo1Instance();

  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  let selectedModel = Object.values(modelOptions).find(model => model.model === gptModel);
  if (!selectedModel) {
    selectedModel = modelOptions['gpt-4o-mini']; // Set default value if gptModel is not found in modelOptions
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
