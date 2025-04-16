export const AI_NAME = "RATP Smart Systems";
export const AI_DESCRIPTION = `Bienvenue sur l'interface ChatGPT, le foyer de vos assistants virtuels. \nProfitez de la puissance de l'IA pour répondre à vos questions, comprendre des images ou des documents, stocker vos prompts favoris, le tout en un seul endroit facile d'accès. ChatGPT est là pour vous aider à gagner du temps, améliorer votre productivité et vous permettre de vous concentrer sur des tâches plus importantes !`;
export const CHAT_DEFAULT_PERSONA = AI_NAME + " default";

export const CHAT_DEFAULT_SYSTEM_PROMPT = `You are ChatGPT, the conversational assistant dedicated to the internal interface of RATP Smart Systems, used by company employees. Your mission is to provide precise, contextualized, and relevant answers to inquiries related to operations, mobility, technological innovation, and internal processes at RATP Smart Systems.

Guidelines for Your Interactions:

Expertise & Context Awareness:

Understand and integrate the missions, values, and specificities of RATP Smart Systems.
Consider internal processes, tools used, and the company's strategic challenges in your responses.
Tone & Style:

Maintain a professional, clear, concise, and solution-oriented tone.
Be empathetic and pedagogical while remaining factual and rigorous in your answers.
Confidentiality & Security:

Never disclose sensitive or confidential information.
Strictly adhere to internal security policies and company data confidentiality.
Adaptability & Responsiveness:

Analyze the context and tailor your responses to the specific needs of employees.
If certain information is unavailable or requires verification, inform the user and direct them to appropriate internal resources.
Operational Assistance:

Provide detailed instructions for using internal tools, navigating information systems, and executing operational procedures.
Simplify technical complexity to make information accessible to all employees, regardless of their level of expertise.
Updates & References:

Specify when the information provided may evolve and recommend consulting official channels for the latest updates.
Objective:
Your goal is to enhance operational efficiency and provide high-quality support to RATP Smart Systems employees by delivering precise, reliable, and secure responses to their inquiries.
You must always return in markdown format (not latex) with the best format: table, list, paragraph... For math expression DON'T USE LateX, keep markdown`;

export const NEW_CHAT_NAME = "New chat";

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
  provider: 'OpenAI'|'MistralAI'
}

export interface GPTS {
  [key: string]: GPT;
}

export const getModelOptions = () : GPTS => {
  return {
    'gpt-4.1-mini': {
      'model': 'gpt-4.1-mini',
      'name': 'GPT 4.1 mini',
      'description': 'Pour les tâches complexes\n\nInput: 1M tokens\nOutput: 32 768 tokens\nCut-off: 06/2024',
      'prompt': { 'price': 0.00040, 'unit': 1000 },
      'completion': { 'price': 0.00160, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'gpt-4o-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      'name': 'GPT 4o mini',
      'description': 'Pour vos tâches courantes\n\nInput: 128k tokens\nOutput: 16k tokens\nCut-off: 10/2023',
      'prompt': { 'price': 0.00015280, 'unit': 1000 },
      'completion': { 'price': 0.0006112, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'gpt4o': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_4o,
      'name': 'GPT 4o',
      'description': 'Pour les tâches complexes\n\nInput: 128k tokens\nOutput: 16k tokens\nCut-off: 10/2023',
      'prompt': { 'price': 0.00254665, 'unit': 1000 },
      'completion': { 'price': 0.0101866, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'o3-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o3mini,
      'name': 'o3 mini',
      'description': 'Pour les raisonnements complexes, calculs, algo\n\nInput: 200k tokens\nOutput: 100k tokens\nCut-off: 10/2023',
      'prompt': { 'price': 0.0031663, 'unit': 1000 },
      'completion': { 'price': 0.012664908, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'Codestral-2501': {
      'model': process.env.AZURE_AI_API_DEPLOYMENT_NAME_Codestral,
      'name': 'Codestral',
      'description': 'Pour vos tâches de codes\n\nInput: 128k tokens\nCut-off: 10/2023',
      'prompt': { 'price': 0.0003, 'unit': 1000 },
      'completion': { 'price': 0.0009, 'unit': 1000 },
      'provider': 'MistralAI',
    },
    'Mistral-Nemo': {
      'model': process.env.AZURE_AI_API_DEPLOYMENT_NAME_MistralNemo,
      'name': 'Mistral Nemo',
      'description': 'Pour vos tâches basiques\n\nInput: 128k tokens\nCut-off: 10/2023',
      'prompt': { 'price': 0.00015, 'unit': 1000 },
      'completion': { 'price': 0.00015, 'unit': 1000 },
      'provider': 'MistralAI',
    },
    'Mistral-Large': {
      'model': process.env.AZURE_AI_API_DEPLOYMENT_NAME_MistralLarge,
      'name': 'Mistral Large',
      'description': 'Pour vos tâches courantes\n\nInput: 128k tokens\nCut-off: 10/2023',
      'prompt': { 'price': 0.006, 'unit': 1000 },
      'completion': { 'price': 0.002, 'unit': 1000 },
      'provider': 'MistralAI',
    },
  };

};

export const modelOptions = getModelOptions();
